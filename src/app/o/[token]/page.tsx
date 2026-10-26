import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/server/db";
import { formatMXN } from "@/server/domain/money";
import { isValidPublicToken } from "@/server/domain/order-identity";
import { ORDER_STATUSES } from "@/server/domain/order-status";
import { toPublicOrderView } from "@/server/domain/public-view";

export const metadata: Metadata = {
  title: "Estado de tu pieza · Bottega & Preserva",
  robots: { index: false, follow: false },
};

const STEPS = ORDER_STATUSES.filter((s) => s !== "RETURNED");

async function OrderStatusCard({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidPublicToken(token)) notFound();

  const order = await db.order.findUnique({
    where: { publicToken: token },
    select: {
      number: true,
      status: true,
      dueDate: true,
      totalCents: true,
      items: { select: { type: true, brand: true } },
      payments: { select: { amountCents: true } },
    },
  });
  if (!order) notFound();

  const view = toPublicOrderView(order);
  const current = STEPS.findIndex((step) => step === view.status);

  return (
    <>
      <h1 className="mt-1 text-2xl font-semibold">Orden {view.folio}</h1>
      <p className="mt-4 text-lg" data-testid="status">
        {view.statusLabel}
      </p>

      {view.status !== "RETURNED" && (
        <ol className="mt-6 space-y-2" aria-label="Avance">
          {STEPS.map((step, i) => (
            <li key={step} className={i <= current ? "font-medium" : "text-stone-400"}>
              {i <= current ? "●" : "○"} {toPublicOrderView({ ...order, status: step }).statusLabel}
            </li>
          ))}
        </ol>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-stone-500">Piezas</dt>
        <dd>{view.items.map((i) => i.label).join(", ")}</dd>
        {view.dueDate && (
          <>
            <dt className="text-stone-500">Fecha compromiso</dt>
            <dd>{view.dueDate}</dd>
          </>
        )}
        <dt className="text-stone-500">Saldo pendiente</dt>
        <dd>{formatMXN(view.balanceCents)}</dd>
      </dl>
    </>
  );
}

export default function PublicOrderPage({ params }: PageProps<"/o/[token]">) {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <p className="text-sm text-stone-500">Bottega &amp; Preserva</p>
      <Suspense fallback={<p className="mt-4 text-stone-400">Consultando tu orden…</p>}>
        <OrderStatusCard params={params} />
      </Suspense>
    </main>
  );
}
