import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { ORDER_STATUSES, STATUS_LABELS } from "@/server/domain/order-status";

async function Greeting() {
  const session = await auth();
  return <p className="text-stone-500">Hola, {session?.user?.name}</p>;
}

async function StatusSummary() {
  await connection(); // live counts, never prerendered
  const [counts, overdue] = await Promise.all([
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.count({
      where: { dueDate: { lt: new Date() }, status: { notIn: ["DELIVERED", "RETURNED"] } },
    }),
  ]);
  const byStatus = new Map(counts.map((c) => [c.status, c._count._all]));

  return (
    <>
      <p className="mt-6 text-lg">
        Órdenes vencidas: <strong>{overdue}</strong>
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ORDER_STATUSES.map((status) => (
          <li key={status} className="rounded border bg-white p-4">
            <p className="text-sm text-stone-500">{STATUS_LABELS[status]}</p>
            <p className="text-2xl font-semibold">{byStatus.get(status) ?? 0}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function PanelPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Panel</h1>
      <Suspense fallback={<p className="text-stone-400">Cargando…</p>}>
        <Greeting />
        <StatusSummary />
      </Suspense>
    </main>
  );
}
