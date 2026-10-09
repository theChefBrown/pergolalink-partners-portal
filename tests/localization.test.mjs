import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LOCALE,
  languages,
  messages,
  resolveLocale,
} from "../src/lib/i18n.ts";
import { portalMessages } from "../src/lib/portal-messages.ts";
import { workflowMessages, translate } from "../src/lib/workflow-messages.ts";
import { formatDate, formatNumber } from "../src/lib/format.ts";
import { products } from "../src/lib/mock-data/products.ts";
import { users } from "../src/lib/mock-data/dealers.ts";
import {
  orderStatuses,
  offerStatuses,
  categories,
} from "../src/lib/demo-types.ts";

test("English is first and is the fallback regardless of browser language", () => {
  assert.equal(DEFAULT_LOCALE, "en");
  assert.equal(languages[0].code, "en");
  for (const value of [
    undefined,
    "",
    "xx",
    "constructor",
    "__proto__",
    "en-US",
  ]) {
    assert.equal(resolveLocale(value), "en");
  }
  for (const { code } of languages) assert.equal(resolveLocale(code), code);
});

for (const [name, dictionary] of Object.entries({
  welcome: messages,
  portal: portalMessages,
  workflows: workflowMessages,
})) {
  test(`${name}: all seven languages have complete, nonempty translations`, () => {
    assert.deepEqual(
      Object.keys(dictionary).sort(),
      languages.map(({ code }) => code).sort(),
    );
    const keys = Object.keys(dictionary.ro).sort();
    for (const { code } of languages) {
      assert.deepEqual(Object.keys(dictionary[code]).sort(), keys, code);
      for (const [key, value] of Object.entries(dictionary[code])) {
        assert.equal(typeof value, "string", `${code}.${key}`);
        assert.ok(value.trim().length > 0, `${code}.${key} is empty`);
      }
    }
  });
}

test("catalog descriptions, company roles, categories and statuses resolve in every language", () => {
  const keys = [
    ...orderStatuses,
    ...offerStatuses,
    ...categories,
    ...products
      .flatMap((p) => [p.name, p.description])
      .flatMap((value) => (typeof value === "string" ? [] : [value.key])),
    ...users.flatMap((u) =>
      u.title && typeof u.title !== "string" ? [u.title.key] : [],
    ),
  ];
  for (const { code } of languages) {
    const words = {
      ...messages[code],
      ...portalMessages[code],
      ...workflowMessages[code],
    };
    for (const key of keys) assert.ok(words[key], `${code}.${key}`);
  }
});

test("workflow content translates while user-entered text is preserved", () => {
  for (const { code } of languages) {
    const words = {
      ...messages[code],
      ...portalMessages[code],
      ...workflowMessages[code],
    };
    assert.equal(
      translate({ key: "waitingExplanation" }, words),
      workflowMessages[code].waitingExplanation,
    );
    assert.equal(
      translate("Client note: RAL 7016", words),
      "Client note: RAL 7016",
    );
  }
});

test("dates and numbers follow the selected language with stable calendar dates", () => {
  assert.equal(formatDate("2026-12-15", "ro"), "15 dec. 2026");
  assert.equal(formatDate("2026-12-15", "en"), "15 Dec 2026");
  assert.equal(formatNumber(12345.6, "ro"), "12.345,6");
  assert.equal(formatNumber(12345.6, "en"), "12,345.6");
  for (const { code } of languages) {
    assert.ok(formatDate("2026-12-15", code).includes("2026"));
    assert.ok(formatNumber(12345.6, code));
  }
});
