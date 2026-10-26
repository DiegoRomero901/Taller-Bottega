/**
 * Demo data. Everything here is fictional — the repo is public.
 * Login for every demo user: password "demo-bottega".
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, type OrderStatus } from "../src/generated/prisma/client";
import { generatePublicToken } from "../src/server/domain/order-identity";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const DEMO_PASSWORD = "demo-bottega";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [admin, manager, workshop] = await Promise.all(
    [
      { name: "Admin Demo", email: "admin@demo.local", role: "ADMIN" as const },
      { name: "Gerente Demo", email: "gerente@demo.local", role: "MANAGER" as const },
      { name: "Taller Demo", email: "taller@demo.local", role: "WORKSHOP" as const },
    ].map((u) =>
      db.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash } }),
    ),
  );

  const services = await Promise.all(
    [
      { name: "Limpieza profunda", basePriceCents: 45_000, estimatedDays: 2 },
      { name: "Cambio de suela", basePriceCents: 80_000, estimatedDays: 4 },
      { name: "Restauración de color", basePriceCents: 120_000, estimatedDays: 5 },
      { name: "Reparación de herrajes", basePriceCents: 35_000, estimatedDays: 1 },
      { name: "Hidratación de piel", basePriceCents: 30_000, estimatedDays: 1 },
    ].map((s) => db.service.upsert({ where: { name: s.name }, update: s, create: s })),
  );

  const customer = await db.customer.upsert({
    where: { phone: "4770000001" },
    update: {},
    create: { name: "Cliente Demo", phone: "4770000001", email: "cliente@demo.local" },
  });

  const demoOrders: { status: OrderStatus; path: OrderStatus[] }[] = [
    { status: "RECEIVED", path: [] },
    { status: "QUOTED", path: ["DIAGNOSING", "QUOTED"] },
    { status: "IN_WORKSHOP", path: ["DIAGNOSING", "QUOTED", "IN_WORKSHOP"] },
    { status: "READY", path: ["DIAGNOSING", "QUOTED", "IN_WORKSHOP", "READY"] },
  ];

  if ((await db.order.count()) > 0) {
    console.log("Orders already seeded; skipping.");
    return;
  }

  for (const [i, demo] of demoOrders.entries()) {
    const service = services[i % services.length];
    const order = await db.order.create({
      data: {
        publicToken: generatePublicToken(),
        status: demo.status,
        customerId: customer.id,
        totalCents: service.basePriceCents,
        dueDate: new Date(Date.now() + (i + 3) * 86_400_000),
        items: {
          create: {
            type: i % 2 === 0 ? "BAG" : "SHOE",
            brand: ["Coach", "Ferragamo", "Michael Kors", "Tory Burch"][i],
            description: "Pieza de demostración",
            serviceLines: { create: { serviceId: service.id, priceCents: service.basePriceCents } },
          },
        },
        payments: {
          create: { amountCents: service.basePriceCents / 2, method: "CASH", userId: manager.id },
        },
      },
    });

    let from: OrderStatus = "RECEIVED";
    for (const to of demo.path) {
      const userId = to === "DIAGNOSING" || to === "READY" ? workshop.id : manager.id;
      await db.statusEvent.create({ data: { orderId: order.id, from, to, userId } });
      from = to;
    }
    console.log(`Order #${order.number} (${demo.status}) → /o/${order.publicToken}`);
  }

  console.log(`Seeded users: ${[admin, manager, workshop].map((u) => u.email).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
