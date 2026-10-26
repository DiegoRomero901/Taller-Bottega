import { describe, expect, it } from "vitest";
import { addWorkingDays, estimatedWorkDays, promisedDate, quoteTotalCents } from "@/server/domain/quote";
import { toPublicOrderView } from "@/server/domain/public-view";

const items = [
  { lines: [{ priceCents: 80_000, estimatedDays: 3 }, { priceCents: 35_000, estimatedDays: 1 }] },
  { lines: [{ priceCents: 45_000, estimatedDays: 2 }] },
];

describe("quote", () => {
  it("adds every service line", () => {
    expect(quoteTotalCents(items)).toBe(160_000);
  });

  it("takes as long as the slowest item", () => {
    expect(estimatedWorkDays(items)).toBe(4);
    expect(estimatedWorkDays([])).toBe(0);
  });

  it("skips Sundays when counting working days", () => {
    // Friday 2026-12-04 + 2 working days → Monday 2026-12-07 (Saturday counts, Sunday does not)
    const result = addWorkingDays(new Date(2026, 11, 4), 2);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(7);
  });

  it("adds a safety buffer to the promised date", () => {
    const from = new Date(2026, 11, 1); // Tuesday
    expect(promisedDate(items, from).getDate()).toBe(7); // 4 days + 1 buffer, Sunday skipped
  });
});

describe("toPublicOrderView", () => {
  it("exposes only what the customer needs", () => {
    const source = {
      number: 42,
      status: "IN_WORKSHOP" as const,
      dueDate: new Date("2026-12-10T12:00:00Z"),
      totalCents: 160_000,
      items: [
        { type: "BAG" as const, brand: "Coach" },
        { type: "SHOE" as const, brand: null },
      ],
      payments: [{ amountCents: 80_000 }],
      // Fields that must never reach the public page:
      customer: { name: "Cliente Demo", phone: "4770000000", email: "demo@example.com" },
    };

    const view = toPublicOrderView(source);

    expect(view).toEqual({
      folio: "BP-000042",
      status: "IN_WORKSHOP",
      statusLabel: "En taller",
      dueDate: "2026-12-10",
      balanceCents: 80_000,
      items: [{ label: "Bolso Coach" }, { label: "Zapato" }],
    });
    expect(JSON.stringify(view)).not.toMatch(/Cliente Demo|4770000000|demo@example\.com/);
  });
});
