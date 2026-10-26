import { describe, expect, it } from "vitest";
import { balanceCents, formatMXN, parsePesos, suggestedDepositCents, sumCents } from "@/server/domain/money";

describe("parsePesos", () => {
  it.each([
    ["980", 98_000],
    ["$1,250.50", 125_050],
    ["0.5", 50],
    [" 12.05 ", 1_205],
  ])("parses %s", (input, cents) => {
    expect(parsePesos(input)).toBe(cents);
  });

  it.each(["", "abc", "-10", "1.234", "1..2"])("rejects %s", (input) => {
    expect(parsePesos(input)).toBeNull();
  });
});

describe("balanceCents", () => {
  it("subtracts every payment", () => {
    expect(balanceCents(150_000, [50_000, 25_000])).toBe(75_000);
  });

  it("never goes negative on overpayment", () => {
    expect(balanceCents(10_000, [20_000])).toBe(0);
  });

  it("rejects fractional cents", () => {
    expect(() => sumCents([10.5])).toThrow(RangeError);
  });
});

describe("suggestedDepositCents", () => {
  it("defaults to half, rounded up to a whole peso", () => {
    expect(suggestedDepositCents(125_050)).toBe(62_600);
  });
});

describe("formatMXN", () => {
  it("formats cents as Mexican pesos", () => {
    expect(formatMXN(125_050)).toBe("$1,250.50");
  });
});
