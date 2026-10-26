import { describe, expect, it } from "vitest";
import {
  PUBLIC_TOKEN_LENGTH,
  formatFolio,
  generatePublicToken,
  isValidPublicToken,
  parseFolio,
} from "@/server/domain/order-identity";

describe("folio", () => {
  it("pads the order number", () => {
    expect(formatFolio(123)).toBe("BP-000123");
  });

  it("round-trips", () => {
    expect(parseFolio(formatFolio(4521))).toBe(4521);
    expect(parseFolio("bp-000007")).toBe(7);
    expect(parseFolio("XX-1")).toBeNull();
  });

  it("rejects invalid numbers", () => {
    expect(() => formatFolio(0)).toThrow(RangeError);
  });
});

describe("public token", () => {
  it("has the expected length and alphabet", () => {
    const token = generatePublicToken();
    expect(token).toHaveLength(PUBLIC_TOKEN_LENGTH);
    expect(isValidPublicToken(token)).toBe(true);
  });

  it("is not repeated across many draws", () => {
    const tokens = new Set(Array.from({ length: 1_000 }, () => generatePublicToken()));
    expect(tokens.size).toBe(1_000);
  });

  it("avoids look-alike characters", () => {
    const token = generatePublicToken((size) => new Uint8Array(size).map((_, i) => i * 7));
    expect(token).not.toMatch(/[01lIoO]/);
  });

  it("rejects malformed tokens", () => {
    expect(isValidPublicToken("short")).toBe(false);
    expect(isValidPublicToken("0".repeat(PUBLIC_TOKEN_LENGTH))).toBe(false);
  });
});
