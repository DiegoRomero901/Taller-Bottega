"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { balanceCents } from "@/server/domain/money";
import {
  ORDER_STATUSES,
  TRANSITION_ERROR_MESSAGES,
  planTransition,
} from "@/server/domain/order-status";

const inputSchema = z.object({
  orderId: z.string().min(1),
  to: z.enum(ORDER_STATUSES),
  note: z.string().max(500).optional(),
});

export type ChangeStatusResult = { ok: true } | { ok: false; message: string };

/** The only place in the app that writes Order.status. */
export async function changeOrderStatus(input: z.input<typeof inputSchema>): Promise<ChangeStatusResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Inicia sesión de nuevo." };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos." };
  const { orderId, to, note } = parsed.data;

  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, totalCents: true, payments: { select: { amountCents: true } } },
    });
    if (!order) return { ok: false, message: "La orden no existe." } as const;

    const plan = planTransition({
      from: order.status,
      to,
      role: session.user.role,
      userId: session.user.id,
      note,
      balanceCents: balanceCents(order.totalCents, order.payments.map((p) => p.amountCents)),
    });
    if (!plan.ok) return { ok: false, message: TRANSITION_ERROR_MESSAGES[plan.error] } as const;

    // Guard against two people moving the same order at once.
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: to },
    });
    if (updated.count === 0) {
      return { ok: false, message: "Alguien más cambió esta orden; recarga la página." } as const;
    }

    await tx.statusEvent.create({ data: { ...plan.event, orderId } });
    revalidatePath(`/ordenes/${orderId}`);
    return { ok: true } as const;
  });
}
