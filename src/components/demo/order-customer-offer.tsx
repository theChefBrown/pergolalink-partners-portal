"use client";
import { useDemo } from "./demo-provider";
import type { Order } from "@/lib/demo-types";
import { CustomerOfferPanel } from "@/features/configurator/CustomerOfferPanel";
import type {
  ConfiguratorDraft,
  SystemConfiguration,
} from "@/features/configurator/types";

export function OrderCustomerOffer({ order }: { order: Order }) {
  const { locale, text, data, commit } = useDemo();
  if (!order.pricing || order.items.some((s) => !s.configuration)) return null;
  const dealer = data.dealers.find((d) => d.id === order.dealerId);
  const draft: ConfiguratorDraft = {
    version: 1,
    client: {
      name: text(order.name),
      reference: order.clientRef,
      address: order.address ?? "",
      country: order.country,
      county: order.county ?? "",
      localityId: order.localityId ?? "",
      city: order.city,
      date: order.createdAt.slice(0, 10),
      notes: text(order.notes),
    },
    systems: order.items.map((i) => i.configuration as SystemConfiguration),
  };
  const save = (patch: Partial<Order>) =>
    commit(
      "recordUpdated",
      (s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === order.id ? { ...o, ...patch } : o,
        ),
      }),
      order.id,
      true,
    );
  async function images() {
    const saved = Object.fromEntries(
      order.items.filter((i) => i.preview).map((i) => [i.id, i.preview!]),
    );
    const missing = draft.systems.filter((s) => !saved[s.id]);
    if (!missing.length) return saved;
    const { renderSnapshots } = await import("@/features/configurator/Scene3D");
    return { ...saved, ...(await renderSnapshots(missing)) };
  }
  return (
    <CustomerOfferPanel
      key={order.id}
      pricing={order.pricing}
      draft={draft}
      brand={{
        name: order.pricing.dealer?.name || dealer?.name || "",
        logoDataUrl: order.customerLogo,
      }}
      initialSettings={order.customerOffer}
      locale={locale}
      reference={order.id}
      getImages={images}
      onExported={(customerOffer, customerLogo) =>
        save({ customerOffer, customerLogo })
      }
    />
  );
}
