"use client";
import { useRouter } from "next/navigation";
import { useDemo } from "./demo-provider";
import { ThemeToggle } from "../site-controls";
import { OrderConfigurator } from "@/features/configurator/OrderConfigurator";
import { models, isMotorized, isRoof } from "@/features/configurator/catalog";
import type {
  CompletedConfiguration,
  ModelId,
} from "@/features/configurator/types";
import type { DemoDocument, Order } from "@/lib/demo-types";
import { demoCopy } from "@/lib/demo-copy";
import { MissingPage } from "../missing-page";

const productIdFor = (model: ModelId) =>
  model === "aeris" ? "bioclimatic" : model;
export function NewOrder() {
  const { data, locale, dealerId, commit, registerFile } = useDemo();
  const router = useRouter();
  const number =
    Math.max(
      0,
      ...data.orders.map((o) => Number(o.id.split("-").at(-1)) || 0),
    ) + 1;
  const reference = `DEMO-${new Date().getFullYear()}-${String(number).padStart(5, "0")}`;
  const dealer = data.dealers.find((d) => d.id === dealerId);
  if (!dealer?.active) return <MissingPage />;
  function complete({
    draft,
    files,
    report,
    images,
    pricing,
    customerOffer,
    customerLogo,
  }: CompletedConfiguration) {
    const now = new Date().toISOString(),
      c = draft.client;
    const order: Order = {
      customerOffer,
      customerLogo,
      pricing,
      id: reference,
      dealerId,
      name: c.name.trim(),
      clientRef: c.reference.trim(),
      city: c.city,
      country: c.country,
      address: c.address,
      county: c.county,
      localityId: c.localityId,
      notes: c.notes,
      items: draft.systems.map((s) => ({
        id: s.id,
        productId: productIdFor(s.model),
        model: models.find((m) => m.id === s.model)!.name,
        quantity: s.quantity,
        width: s.width,
        projection: isRoof(s.model) ? s.projection : 0,
        height: s.height,
        colour: s.frameColour,
        motor: isMotorized(s.model) ? s.motor : "",
        lighting: s.lighting,
        options: "",
        notes: s.notes,
        configuration: s,
        preview: images[s.id],
      })),
      status: "submitted",
      createdAt: c.date,
      updatedAt: now,
      internalStatus: "",
      expectedDate: "",
      pickupDate: "",
      deliveryDate: "",
      installationDate: "",
    };
    const documents: DemoDocument[] = [report, ...files].map((file, i) => ({
      id: crypto.randomUUID(),
      orderId: reference,
      productId: order.items[0].productId,
      title: i === 0 ? { key: "orderReport" } : file.name,
      description: "",
      category: "other",
      fileName: file.name,
      url: registerFile(file),
      mime: file.type,
      size: file.size,
      generated: i === 0,
      visible: true,
      archived: false,
      date: now,
    }));
    commit(
      "orderCreated",
      (s) => ({
        ...s,
        orders: [order, ...s.orders],
        documents: [...documents, ...s.documents],
      }),
      reference,
    );
    router.push("/orders/" + reference);
  }
  return (
    <OrderConfigurator
      locale={locale}
      reference={reference}
      dealer={dealer ? { id: dealer.id, name: dealer.name } : undefined}
      discountPercent={dealer?.discountPercent ?? 0}
      pricingPolicy={data.pricingPolicy}
      availableModels={models
        .filter((m) =>
          data.products.some((p) => p.id === productIdFor(m.id) && p.active),
        )
        .map((m) => m.id)}
      headerTools={<ThemeToggle />}
      notice={demoCopy(locale).banner}
      onExit={() => router.push("/orders")}
      onComplete={complete}
    />
  );
}
