/** Quote rules: order total and promised delivery date. */

import { sumCents } from "./money";

export type QuotedLine = { priceCents: number; estimatedDays: number };
export type QuotedItem = { lines: readonly QuotedLine[] };

export function quoteTotalCents(items: readonly QuotedItem[]): number {
  return sumCents(items.flatMap((item) => item.lines.map((line) => line.priceCents)));
}

/**
 * Items are worked in parallel; services on one item are sequential.
 * So the order takes as long as its slowest item.
 */
export function estimatedWorkDays(items: readonly QuotedItem[]): number {
  return Math.max(
    0,
    ...items.map((item) => item.lines.reduce((days, line) => days + line.estimatedDays, 0)),
  );
}

/** Adds working days (Monday to Saturday; the shop closes on Sunday). */
export function addWorkingDays(start: Date, days: number): Date {
  const date = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) remaining -= 1;
  }
  return date;
}

export function promisedDate(items: readonly QuotedItem[], from: Date, bufferDays = 1): Date {
  return addWorkingDays(from, estimatedWorkDays(items) + bufferDays);
}
