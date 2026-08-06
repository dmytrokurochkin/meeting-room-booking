import { afterAll, beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { OFFICE_TIME_ZONE } from "@/domain/time";
import { TEST_APP_URL, TEST_DATABASE_URL } from "./env";

const adapter = new PrismaPg({ connectionString: TEST_DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PASSWORD = "password123";
const USER_A_EMAIL = "usera@test.local";
const USER_B_EMAIL = "userb@test.local";

let roomId: string;

// A week out is far enough from "now" that no test slot can accidentally land in the past.
function officeTime(daysFromNow: number, hour: number, minute = 0): string {
  return DateTime.now()
    .setZone(OFFICE_TIME_ZONE)
    .plus({ days: 7 + daysFromNow })
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toISO()!;
}

async function login(email: string): Promise<string> {
  const res = await fetch(`${TEST_APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const cookie = res.headers.get("set-cookie");
  if (!res.ok || !cookie) {
    throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  }
  return cookie.split(";")[0];
}

function createBookingRequest(cookie: string, body: unknown) {
  return fetch(`${TEST_APP_URL}/api/rooms/${roomId}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Booking", "Session", "User", "Room" RESTART IDENTITY CASCADE',
  );

  const room = await prisma.room.create({ data: { name: "Тестова", floor: 1, capacity: 4 } });
  roomId = room.id;

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const emailVerifiedAt = new Date();
  await prisma.user.create({
    data: { name: "User A", email: USER_A_EMAIL, passwordHash, emailVerifiedAt },
  });
  await prisma.user.create({
    data: { name: "User B", email: USER_B_EMAIL, passwordHash, emailVerifiedAt },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/rooms/:id/bookings", () => {
  it("creates a booking and returns 201", async () => {
    const cookie = await login(USER_A_EMAIL);
    const res = await createBookingRequest(cookie, {
      title: "Синк команди",
      startAt: officeTime(1, 10),
      endAt: officeTime(1, 10, 30),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.booking.title).toBe("Синк команди");
    expect(body.booking.isMine).toBe(true);
  });

  it("returns 409 when the slot is already taken", async () => {
    const cookie = await login(USER_A_EMAIL);
    const payload = { title: "Синк", startAt: officeTime(1, 11), endAt: officeTime(1, 11, 30) };

    const first = await createBookingRequest(cookie, payload);
    expect(first.status).toBe(201);

    const second = await createBookingRequest(cookie, { ...payload, title: "Інша назва" });
    expect(second.status).toBe(409);
    const body = await second.json();
    expect(body.error.code).toBe("SLOT_TAKEN");
  });

  it("returns 422 for a slot outside working hours", async () => {
    const cookie = await login(USER_A_EMAIL);
    const res = await createBookingRequest(cookie, {
      title: "Пізня зустріч",
      startAt: officeTime(1, 20),
      endAt: officeTime(1, 20, 30),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("OUTSIDE_WORK_HOURS");
  });

  it("returns 422 for a time in the past", async () => {
    const cookie = await login(USER_A_EMAIL);
    const res = await createBookingRequest(cookie, {
      title: "Запізно",
      startAt: officeTime(-14, 10),
      endAt: officeTime(-14, 10, 30),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("IN_THE_PAST");
  });

  it("returns 422 for a start time not aligned to a 30-minute slot", async () => {
    const cookie = await login(USER_A_EMAIL);
    const res = await createBookingRequest(cookie, {
      title: "Криво",
      startAt: officeTime(1, 10, 15),
      endAt: officeTime(1, 10, 45),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_SLOT_ALIGNED");
  });

  it("returns 401 without a session cookie", async () => {
    const res = await fetch(`${TEST_APP_URL}/api/rooms/${roomId}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "X", startAt: officeTime(1, 10), endAt: officeTime(1, 10, 30) }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 403 when the account's email isn't verified", async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const email = "unverified@test.local";
    await prisma.user.create({ data: { name: "Unverified", email, passwordHash } });

    const cookie = await login(email);
    const res = await createBookingRequest(cookie, {
      title: "Спроба",
      startAt: officeTime(1, 15),
      endAt: officeTime(1, 15, 30),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("EMAIL_NOT_VERIFIED");
  });
});

describe("recurring bookings", () => {
  it("creates 8 weekly occurrences sharing a seriesId", async () => {
    const cookie = await login(USER_A_EMAIL);
    const res = await createBookingRequest(cookie, {
      title: "Щотижневий синк",
      startAt: officeTime(0, 10),
      endAt: officeTime(0, 10, 30),
      recurring: true,
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.bookings).toHaveLength(8);
    const seriesIds = new Set(body.bookings.map((b: { seriesId: string }) => b.seriesId));
    expect(seriesIds.size).toBe(1);
    expect([...seriesIds][0]).toBeTruthy();
  });

  it("rolls back the whole series when one occurrence conflicts", async () => {
    const cookie = await login(USER_A_EMAIL);
    // Pre-occupy the 3rd occurrence's slot (2 weeks out) with an unrelated booking.
    await createBookingRequest(cookie, {
      title: "Блокер",
      startAt: officeTime(14, 9),
      endAt: officeTime(14, 9, 30),
    });

    const res = await createBookingRequest(cookie, {
      title: "Серія",
      startAt: officeTime(0, 9),
      endAt: officeTime(0, 9, 30),
      recurring: true,
    });

    expect(res.status).toBe(409);
    const remaining = await prisma.booking.count({ where: { title: "Серія" } });
    expect(remaining).toBe(0);
  });

  it("cancelling the whole series removes all future occurrences", async () => {
    const cookie = await login(USER_A_EMAIL);
    const createRes = await createBookingRequest(cookie, {
      title: "Серія для скасування",
      startAt: officeTime(0, 11),
      endAt: officeTime(0, 11, 30),
      recurring: true,
    });
    const { bookings } = await createRes.json();
    expect(bookings).toHaveLength(8);

    const res = await fetch(`${TEST_APP_URL}/api/bookings/${bookings[0].id}?scope=series`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(204);

    const remaining = await prisma.booking.count({
      where: { seriesId: bookings[0].seriesId },
    });
    expect(remaining).toBe(0);
  });
});

describe("DELETE /api/bookings/:id", () => {
  it("cancels own booking and returns 204", async () => {
    const cookie = await login(USER_A_EMAIL);
    const createRes = await createBookingRequest(cookie, {
      title: "На скасування",
      startAt: officeTime(1, 12),
      endAt: officeTime(1, 12, 30),
    });
    const { booking } = await createRes.json();

    const res = await fetch(`${TEST_APP_URL}/api/bookings/${booking.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });

    expect(res.status).toBe(204);
  });

  it("returns 403 when cancelling someone else's booking", async () => {
    const cookieA = await login(USER_A_EMAIL);
    const createRes = await createBookingRequest(cookieA, {
      title: "Чуже",
      startAt: officeTime(1, 13),
      endAt: officeTime(1, 13, 30),
    });
    const { booking } = await createRes.json();

    const cookieB = await login(USER_B_EMAIL);
    const res = await fetch(`${TEST_APP_URL}/api/bookings/${booking.id}`, {
      method: "DELETE",
      headers: { Cookie: cookieB },
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
