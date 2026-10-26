/**
 * Order lifecycle rules. Pure functions, no database access.
 *
 * RECEIVED → DIAGNOSING → QUOTED → IN_WORKSHOP → READY → DELIVERED
 *                            └──→ RETURNED (customer rejects the quote)
 *
 * Every status change in the app must go through `planTransition`.
 */

export const ORDER_STATUSES = [
  "RECEIVED",
  "DIAGNOSING",
  "QUOTED",
  "IN_WORKSHOP",
  "READY",
  "DELIVERED",
  "RETURNED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Role = "ADMIN" | "MANAGER" | "WORKSHOP";

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  RECEIVED: ["DIAGNOSING"],
  DIAGNOSING: ["QUOTED"],
  QUOTED: ["IN_WORKSHOP", "RETURNED"],
  IN_WORKSHOP: ["READY"],
  READY: ["DELIVERED"],
  DELIVERED: [],
  RETURNED: [],
};

/** Which roles may move an order INTO a given status. */
const ALLOWED_ROLES: Record<OrderStatus, readonly Role[]> = {
  RECEIVED: ["ADMIN", "MANAGER"],
  DIAGNOSING: ["ADMIN", "MANAGER", "WORKSHOP"],
  QUOTED: ["ADMIN", "MANAGER"],
  IN_WORKSHOP: ["ADMIN", "MANAGER"],
  READY: ["ADMIN", "MANAGER", "WORKSHOP"],
  DELIVERED: ["ADMIN", "MANAGER"],
  RETURNED: ["ADMIN", "MANAGER"],
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Recibida",
  DIAGNOSING: "En diagnóstico",
  QUOTED: "Cotizada",
  IN_WORKSHOP: "En taller",
  READY: "Lista para entrega",
  DELIVERED: "Entregada",
  RETURNED: "Devuelta sin servicio",
};

export const TERMINAL_STATUSES: readonly OrderStatus[] = ["DELIVERED", "RETURNED"];

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from];
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export type TransitionInput = {
  from: OrderStatus;
  to: OrderStatus;
  role: Role;
  userId: string;
  /** Balance still owed, in cents. Delivery requires it to be zero. */
  balanceCents: number;
  note?: string;
  now?: Date;
};

export type StatusEventDraft = {
  from: OrderStatus;
  to: OrderStatus;
  userId: string;
  note: string | null;
  createdAt: Date;
};

export type TransitionResult =
  | { ok: true; event: StatusEventDraft }
  | { ok: false; error: TransitionError };

export type TransitionError =
  | "INVALID_TRANSITION"
  | "FORBIDDEN_FOR_ROLE"
  | "BALANCE_PENDING"
  | "NOTE_REQUIRED";

export const TRANSITION_ERROR_MESSAGES: Record<TransitionError, string> = {
  INVALID_TRANSITION: "Ese cambio de estado no está permitido.",
  FORBIDDEN_FOR_ROLE: "Tu rol no puede hacer este cambio.",
  BALANCE_PENDING: "La orden tiene saldo pendiente; cóbralo antes de entregar.",
  NOTE_REQUIRED: "Agrega una nota con el motivo de la devolución.",
};

/**
 * Validates a status change and returns the StatusEvent to persist.
 * Callers persist the event and the new status in one transaction.
 */
export function planTransition(input: TransitionInput): TransitionResult {
  const { from, to, role, userId, balanceCents } = input;
  const note = input.note?.trim() || null;

  if (!TRANSITIONS[from].includes(to)) {
    return { ok: false, error: "INVALID_TRANSITION" };
  }
  if (!ALLOWED_ROLES[to].includes(role)) {
    return { ok: false, error: "FORBIDDEN_FOR_ROLE" };
  }
  if (to === "DELIVERED" && balanceCents > 0) {
    return { ok: false, error: "BALANCE_PENDING" };
  }
  if (to === "RETURNED" && !note) {
    return { ok: false, error: "NOTE_REQUIRED" };
  }

  return {
    ok: true,
    event: { from, to, userId, note, createdAt: input.now ?? new Date() },
  };
}
