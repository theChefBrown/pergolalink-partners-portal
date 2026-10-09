import type { PricePolicy } from "./pricing-types";
import { extraPostCents } from "./demo-post-prices";

// Commercial rules live separately from imported Excel values.
// An unknown tariff is null, never zero. Update the version when changing rules.
export const pricePolicy: PricePolicy = {
  version: "fictional-demo-v1",
  currency: "EUR",
  provisional: false,
  tax: "excluded",
  dimensionRule: "ceiling",
  extraPostCents,
  ledModels: [
    "imperium",
    "arcodia",
    "majestic",
    "eira",
    "aeris",
    "liniar",
    "wintergarden",
  ],
};
