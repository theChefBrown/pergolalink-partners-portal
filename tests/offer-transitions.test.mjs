import test from "node:test";
import assert from "node:assert/strict";
import { changeOffer } from "../src/lib/offer-transitions.ts";
const context = {
  role: "manager",
  message: "",
  date: "2026-09-15T10:00:00Z",
  eventId: "event",
};
function state() {
  return {
    offers: [
      { id: "old", orderId: "own", status: "offerAvailable" },
      { id: "new", orderId: "own", status: "draft" },
      { id: "other", orderId: "another", status: "offerAvailable" },
    ],
    orders: [{ id: "own", status: "review" }],
    notifications: [],
    updates: [
      { id: "request", orderId: "own", type: "requestOffer", resolved: false },
    ],
  };
}
test("sending a revision supersedes the earlier offer, updates the order and notifies its dealer", () => {
  const original = state(),
    next = changeOffer(original, "new", "offerAvailable", context);
  assert.equal(next.offers[0].status, "expired");
  assert.equal(next.offers[2].status, "offerAvailable");
  assert.equal(next.orders[0].status, "offerAvailable");
  assert.equal(next.notifications[0].orderId, "own");
  assert.equal(next.updates.find((u) => u.id === "request").resolved, true);
  assert.equal(original.offers[0].status, "offerAvailable");
});
test("acceptance confirms early orders, preserves production and records modification requests", () => {
  const original = state();
  let next = changeOffer(original, "old", "accepted", {
    ...context,
    role: "dealer",
  });
  assert.equal(next.orders[0].status, "confirmed");
  assert.equal(next.notifications.length, 0);
  original.orders[0].status = "production";
  next = changeOffer(original, "old", "accepted", context);
  assert.equal(next.orders[0].status, "production");
  next = changeOffer(original, "old", "modificationRequested", {
    ...context,
    role: "dealer",
    message: "Change colour",
  });
  assert.equal(next.updates[0].type, "requestChange");
  assert.equal(next.updates[0].resolved, false);
  assert.equal(next.updates[0].body, "Change colour");
});
