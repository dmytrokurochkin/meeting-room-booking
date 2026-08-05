import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Kept self-contained (no "@/..." imports) so it only needs prisma/, node_modules
// and this file to run inside the minimal production image, not the whole src/ tree.
const OFFICE_TIME_ZONE = process.env.OFFICE_TIME_ZONE ?? "Europe/Kyiv";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ROOMS = [
  { name: "Акваріум", floor: 1, capacity: 4 },
  { name: "Марс", floor: 2, capacity: 8 },
  { name: "Гагарін", floor: 2, capacity: 12 },
  { name: "Атлантида", floor: 1, capacity: 2 },
  { name: "Еверест", floor: 3, capacity: 6 },
];

const USERS = [
  { name: "Іван Тестовий", email: "ivan@example.com", password: "password123" },
  { name: "Олена Демо", email: "olena@example.com", password: "password123" },
];

function officeTime(daysFromNow: number, hour: number, minute = 0): Date {
  return DateTime.now()
    .setZone(OFFICE_TIME_ZONE)
    .plus({ days: daysFromNow })
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toJSDate();
}

async function main() {
  console.log("Seeding rooms...");
  const rooms = await Promise.all(
    ROOMS.map((room) =>
      prisma.room.upsert({ where: { name: room.name }, update: {}, create: room }),
    ),
  );

  console.log("Seeding users...");
  const users = await Promise.all(
    USERS.map(async (user) => {
      const passwordHash = await bcrypt.hash(user.password, 12);
      return prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: { name: user.name, email: user.email, passwordHash },
      });
    }),
  );

  console.log("Seeding demo bookings...");
  await prisma.booking.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });

  const demoBookings = [
    {
      roomId: rooms[0].id,
      userId: users[0].id,
      title: "Щотижневий синк команди",
      startAt: officeTime(1, 10),
      endAt: officeTime(1, 11),
    },
    {
      roomId: rooms[1].id,
      userId: users[1].id,
      title: "Співбесіда",
      startAt: officeTime(1, 14),
      endAt: officeTime(1, 14, 30),
    },
    {
      roomId: rooms[2].id,
      userId: users[0].id,
      title: "Демо продукту",
      startAt: officeTime(2, 16),
      endAt: officeTime(2, 17, 30),
    },
    {
      roomId: rooms[0].id,
      userId: users[1].id,
      title: "1:1",
      startAt: officeTime(3, 9, 30),
      endAt: officeTime(3, 10),
    },
  ];

  for (const booking of demoBookings) {
    try {
      await prisma.booking.create({ data: booking });
    } catch (error) {
      // The target slot may already be taken by a booking created through the app
      // (e.g. by another user testing the demo). Skip it rather than fail the seed.
      console.warn(`Skipped demo booking "${booking.title}": slot already taken.`, error);
    }
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
