/** Money helpers. All amounts are integer cents (MXN). */

export function assertCents(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`Invalid cents amount: ${value}`);
  }
}

/** Parses user input like "1,250.50" or "$980" into cents. Returns null when invalid. */
export function parsePesos(input: string): number | null {
  const clean = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, fraction = ""] = clean.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function formatMXN(cents: number): string {
  return formatter.format(cents / 100);
}

export function sumCents(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => {
    assertCents(amount);
    return total + amount;
  }, 0);
}

/** What the customer still owes: total minus every payment (deposit included). */
export function balanceCents(totalCents: number, paymentsCents: readonly number[]): number {
  assertCents(totalCents);
  return Math.max(0, totalCents - sumCents(paymentsCents));
}

/** Suggested deposit, rounded up to the next whole peso. */
export function suggestedDepositCents(totalCents: number, rate = 0.5): number {
  assertCents(totalCents);
  if (rate < 0 || rate > 1) throw new RangeError(`Invalid deposit rate: ${rate}`);
  return Math.ceil((totalCents * rate) / 100) * 100;
}
