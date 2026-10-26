/**
 * What the customer sees on the public tracking page.
 * Built from an allowlist: no name, phone or email ever leaves this function.
 */

import { balanceCents } from "./money";
import { formatFolio } from "./order-identity";
import { STATUS_LABELS, type OrderStatus } from "./order-status";

const ITEM_LABELS = { BAG: "Bolso", SHOE: "Zapato", OTHER: "Otro" } as const;

export type PublicOrderSource = {
  number: number;
  status: OrderStatus;
  dueDate: Date | null;
  totalCents: number;
  items: readonly { type: keyof typeof ITEM_LABELS; brand: string | null }[];
  payments: readonly { amountCents: number }[];
};

export type PublicOrderView = {
  folio: string;
  status: OrderStatus;
  statusLabel: string;
  dueDate: string | null;
  balanceCents: number;
  items: { label: string }[];
};

export function toPublicOrderView(order: PublicOrderSource): PublicOrderView {
  return {
    folio: formatFolio(order.number),
    status: order.status,
    statusLabel: STATUS_LABELS[order.status],
    dueDate: order.dueDate ? order.dueDate.toISOString().slice(0, 10) : null,
    balanceCents: balanceCents(
      order.totalCents,
      order.payments.map((p) => p.amountCents),
    ),
    items: order.items.map((item) => ({
      label: item.brand ? `${ITEM_LABELS[item.type]} ${item.brand}` : ITEM_LABELS[item.type],
    })),
  };
}
