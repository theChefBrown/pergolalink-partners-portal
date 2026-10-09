import test from "node:test";
import assert from "node:assert/strict";
import { monthDays, calendarEvents } from "../src/lib/calendar.ts";
test("calendar starts on Monday, pads whole weeks and includes leap day", () => {
  assert.equal(monthDays(2026, 8)[0].toISOString().slice(0, 10), "2026-08-31");
  assert.equal(monthDays(2026, 8).length, 35);
  assert.equal(
    monthDays(2028, 1).filter((d) => d.getUTCMonth() === 1).length,
    29,
  );
});
test("calendar respects supplied company scope, excludes closed orders and draft offers", () => {
  const orders = [
    {
      id: "own",
      status: "production",
      expectedDate: "2026-09-22",
      pickupDate: "2026-09-24",
    },
    { id: "closed", status: "cancelled", expectedDate: "2026-09-22" },
  ];
  const offers = [
    { id: "draft", orderId: "own", status: "draft", validUntil: "2026-09-26" },
    {
      id: "other",
      orderId: "another-company",
      status: "offerAvailable",
      validUntil: "2026-09-26",
    },
    {
      id: "visible",
      orderId: "own",
      status: "offerAvailable",
      validUntil: "2026-09-25",
    },
  ];
  const result = calendarEvents(orders, offers);
  assert.deepEqual(
    result.map((e) => e.date),
    ["2026-09-22", "2026-09-24", "2026-09-25"],
  );
  assert(result.every((e) => e.orderId === "own"));
});
