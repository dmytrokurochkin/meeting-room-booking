import bcrypt from "bcryptjs";
import { DateTime } from "luxon";
import { prisma } from "@/server/db";
import { OFFICE_TIME_ZONE } from "@/domain/time";

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

  await prisma.booking.createMany({ data: demoBookings });

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
