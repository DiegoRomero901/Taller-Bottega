import { describe, expect, it } from "vitest";
import {
  ORDER_STATUSES,
  isTerminal,
  nextStatuses,
  planTransition,
  type OrderStatus,
} from "@/server/domain/order-status";

const base = { userId: "u1", balanceCents: 0, role: "MANAGER" as const };

describe("planTransition", () => {
  it("walks the happy path from reception to delivery", () => {
    const path: OrderStatus[] = ["RECEIVED", "DIAGNOSING", "QUOTED", "IN_WORKSHOP", "READY", "DELIVERED"];
    for (let i = 0; i < path.length - 1; i++) {
      const result = planTransition({ ...base, from: path[i], to: path[i + 1] });
      expect(result.ok, `${path[i]} → ${path[i + 1]}`).toBe(true);
    }
  });

  it("returns the status event to persist", () => {
    const now = new Date("2026-11-10T10:00:00Z");
    const result = planTransition({ ...base, from: "RECEIVED", to: "DIAGNOSING", now, note: "  revisar costura  " });
    expect(result).toEqual({
      ok: true,
      event: { from: "RECEIVED", to: "DIAGNOSING", userId: "u1", note: "revisar costura", createdAt: now },
    });
  });

  it("rejects skipping steps", () => {
    expect(planTransition({ ...base, from: "RECEIVED", to: "READY" })).toEqual({
      ok: false,
      error: "INVALID_TRANSITION",
    });
  });

  it("never leaves a terminal status", () => {
    for (const to of ORDER_STATUSES) {
      expect(planTransition({ ...base, from: "DELIVERED", to }).ok).toBe(false);
      expect(planTransition({ ...base, from: "RETURNED", to }).ok).toBe(false);
    }
  });

  it("lets the workshop diagnose and finish, but not quote or deliver", () => {
    const workshop = { ...base, role: "WORKSHOP" as const };
    expect(planTransition({ ...workshop, from: "RECEIVED", to: "DIAGNOSING" }).ok).toBe(true);
    expect(planTransition({ ...workshop, from: "IN_WORKSHOP", to: "READY" }).ok).toBe(true);
    expect(planTransition({ ...workshop, from: "DIAGNOSING", to: "QUOTED" })).toEqual({
      ok: false,
      error: "FORBIDDEN_FOR_ROLE",
    });
    expect(planTransition({ ...workshop, from: "READY", to: "DELIVERED" })).toEqual({
      ok: false,
      error: "FORBIDDEN_FOR_ROLE",
    });
  });

  it("blocks delivery while a balance is pending", () => {
    expect(planTransition({ ...base, from: "READY", to: "DELIVERED", balanceCents: 1 })).toEqual({
      ok: false,
      error: "BALANCE_PENDING",
    });
  });

  it("requires a reason to return an item without service", () => {
    expect(planTransition({ ...base, from: "QUOTED", to: "RETURNED", note: "   " })).toEqual({
      ok: false,
      error: "NOTE_REQUIRED",
    });
    expect(planTransition({ ...base, from: "QUOTED", to: "RETURNED", note: "Precio alto" }).ok).toBe(true);
  });
});

describe("nextStatuses / isTerminal", () => {
  it("offers both outcomes after a quote", () => {
    expect(nextStatuses("QUOTED")).toEqual(["IN_WORKSHOP", "RETURNED"]);
  });

  it("marks only delivered and returned as terminal", () => {
    expect(ORDER_STATUSES.filter(isTerminal)).toEqual(["DELIVERED", "RETURNED"]);
  });
});
