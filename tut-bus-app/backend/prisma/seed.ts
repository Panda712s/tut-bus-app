import { PrismaClient, DayType, SchedulePeriod, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ---- Admin ----
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@tut.ac.za' },
    update: {},
    create: {
      fullName: 'System Administrator',
      email: 'admin@tut.ac.za',
      password: passwordHash,
      role: AdminRole.SUPER_ADMIN,
    },
  });

  // ---- Routes (from "6. Main Features > Bus Routes") ----
  const routeDefs = [
    { name: 'Pretoria Campus Route', origin: 'Pretoria CBD', destination: 'TUT Pretoria Campus', distanceKm: 8.5, estimatedDurationMin: 25 },
    { name: 'Soshanguve North Route', origin: 'Soshanguve North', destination: 'TUT Soshanguve Campus', distanceKm: 22, estimatedDurationMin: 45 },
    { name: 'Soshanguve South Route', origin: 'Soshanguve South', destination: 'TUT Soshanguve Campus', distanceKm: 18, estimatedDurationMin: 40 },
    { name: 'Arcadia Route', origin: 'Arcadia', destination: 'TUT Arcadia Campus', distanceKm: 5, estimatedDurationMin: 15 },
    { name: 'Ga-Rankuwa Route', origin: 'Ga-Rankuwa', destination: 'TUT Ga-Rankuwa Campus', distanceKm: 30, estimatedDurationMin: 55 },
    { name: 'eMalahleni Route', origin: 'eMalahleni', destination: 'TUT eMalahleni Campus', distanceKm: 110, estimatedDurationMin: 90 },
    { name: 'Mbombela Route', origin: 'Mbombela', destination: 'TUT Mbombela Campus', distanceKm: 330, estimatedDurationMin: 240 },
    { name: 'Polokwane Route', origin: 'Polokwane', destination: 'TUT Polokwane Campus', distanceKm: 200, estimatedDurationMin: 150 },
  ];

  const routes: Awaited<ReturnType<typeof prisma.route.create>>[] = [];
  for (const r of routeDefs) {
    const existing = await prisma.route.findFirst({ where: { name: r.name } });
    const route = existing ?? (await prisma.route.create({ data: r }));
    routes.push(route);
  }

  // Stops for the first route as a worked example
  const mainRoute = routes[0];
  const existingStops = await prisma.busStop.findMany({ where: { routeId: mainRoute.id } });
  if (existingStops.length === 0) {
    await prisma.busStop.createMany({
      data: [
        { name: 'Pretoria CBD Station', lat: -25.7461, lng: 28.1881, order: 1, routeId: mainRoute.id },
        { name: 'Church Square', lat: -25.7479, lng: 28.1878, order: 2, routeId: mainRoute.id },
        { name: 'Salvokop', lat: -25.7622, lng: 28.1889, order: 3, routeId: mainRoute.id },
        { name: 'TUT Pretoria Campus Gate', lat: -25.7335, lng: 28.1590, order: 4, routeId: mainRoute.id },
      ],
    });
  }

  // Schedules for the main route
  const scheduleCount = await prisma.schedule.count({ where: { routeId: mainRoute.id } });
  if (scheduleCount === 0) {
    await prisma.schedule.createMany({
      data: [
        { routeId: mainRoute.id, dayType: DayType.WEEKDAY, period: SchedulePeriod.MORNING, departureTime: '06:30' },
        { routeId: mainRoute.id, dayType: DayType.WEEKDAY, period: SchedulePeriod.MORNING, departureTime: '07:30' },
        { routeId: mainRoute.id, dayType: DayType.WEEKDAY, period: SchedulePeriod.AFTERNOON, departureTime: '13:00' },
        { routeId: mainRoute.id, dayType: DayType.WEEKDAY, period: SchedulePeriod.EVENING, departureTime: '17:00' },
        { routeId: mainRoute.id, dayType: DayType.WEEKEND, period: SchedulePeriod.MORNING, departureTime: '08:00' },
      ],
    });
  }

  // ---- Buses ----
  const busDefs = [
    { busNumber: 'BUS-01', plateNumber: 'TUT 001 GP', capacity: 60, currentRouteId: routes[0].id },
    { busNumber: 'BUS-02', plateNumber: 'TUT 002 GP', capacity: 60, currentRouteId: routes[1].id },
    { busNumber: 'BUS-03', plateNumber: 'TUT 003 GP', capacity: 45, currentRouteId: routes[2].id },
  ];
  const buses: Awaited<ReturnType<typeof prisma.bus.create>>[] = [];
  for (const b of busDefs) {
    const existing = await prisma.bus.findUnique({ where: { busNumber: b.busNumber } });
    const bus = existing ?? (await prisma.bus.create({ data: b }));
    buses.push(bus);
  }

  // ---- Driver ----
  const driver = await prisma.driver.upsert({
    where: { email: 'driver1@tut.ac.za' },
    update: {},
    create: {
      employeeNumber: 'DRV-001',
      fullName: 'Thabo Nkosi',
      email: 'driver1@tut.ac.za',
      password: passwordHash,
      licenseNumber: 'LIC-123456',
      assignedBusId: buses[0].id,
    },
  });

  // ---- Student ----
  const student = await prisma.student.upsert({
    where: { email: 'student1@tut4life.ac.za' },
    update: {},
    create: {
      studentNumber: '221012345',
      fullName: 'Lerato Molefe',
      email: 'student1@tut4life.ac.za',
      password: passwordHash,
      emailVerified: true,
    },
  });

  console.log('Seed complete:');
  console.log({ admin: admin.email, driver: driver.email, student: student.email, routes: routes.length, buses: buses.length });
  console.log('Default password for all seeded accounts: Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
