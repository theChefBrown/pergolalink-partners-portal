"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initialDemoState } from "@/lib/mock-data/platform";
import { defaultDealerId } from "@/lib/mock-data/dealers";
import type { Activity, DemoRole, DemoState, Order } from "@/lib/demo-types";
import {
  workflowMessages,
  translate,
  type DemoText,
  type TextKey,
} from "@/lib/workflow-messages";
import { useDisplayPreferences } from "../display-preferences";
import { loadDemo, saveDemo } from "@/lib/demo-storage";
type Store = {
  data: DemoState;
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  dealerId: string;
  setDealerId: (id: string) => void;
  resetDemo: () => void;
  storageUnavailable: boolean;
  commit: (
    action: TextKey,
    update: (data: DemoState) => DemoState,
    orderId?: string,
    internal?: boolean,
  ) => void;
  notice: TextKey | null;
  clearNotice: () => void;
  registerFile: (file: File) => string;
};
const Context = createContext<Store | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoState>(initialDemoState);
  const [role, setRole] = useState<DemoRole>("dealer");
  const [dealerId, setDealerId] = useState(defaultDealerId);
  const [ready, setReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [notice, setNotice] = useState<TextKey | null>(null);
  const files = useRef(new Map<string, File>());
  useEffect(() => {
    let cancelled = false;
    const registry = files.current;
    loadDemo()
      .then((saved) => {
        if (cancelled || !saved) return;
        const replacements = new Map<string, string>();
        saved.files.forEach(([old, file]) => {
          const url = URL.createObjectURL(file);
          registry.set(url, file);
          replacements.set(old, url);
        });
        setData({
          ...saved.data,
          documents: saved.data.documents.map((doc) => ({
            ...doc,
            url: replacements.get(doc.url) ?? doc.url,
          })),
        });
        if (["dealer", "manager", "admin"].includes(saved.role))
          setRole(saved.role);
        setDealerId(saved.dealerId);
      })
      .catch(() => {
        if (!cancelled) setStorageUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
      registry.forEach((_, url) => URL.revokeObjectURL(url));
      registry.clear();
    };
  }, []);
  const activeDealerId =
    data.dealers.find((d) => d.id === dealerId && d.active)?.id ??
    data.dealers.find((d) => d.active)?.id ??
    "";
  useEffect(() => {
    if (!ready) return;
    saveDemo({
      version: 1,
      data,
      role,
      dealerId: activeDealerId,
      files: [...files.current],
    }).catch(() => setStorageUnavailable(true));
  }, [data, role, activeDealerId, ready]);
  function resetDemo() {
    files.current.forEach((_, url) => URL.revokeObjectURL(url));
    files.current.clear();
    setData(structuredClone(initialDemoState));
    setRole("dealer");
    setDealerId(defaultDealerId);
    setNotice(null);
  }
  function commit(
    action: TextKey,
    update: (data: DemoState) => DemoState,
    orderId?: string,
    internal = false,
  ) {
    const event: Activity = {
      id: crypto.randomUUID(),
      user:
        data.users.find(
          (u) =>
            u.active &&
            u.role === role &&
            (role !== "dealer" || u.dealerId === activeDealerId),
        )?.name ?? `Demo ${role}`,
      role,
      action,
      orderId,
      date: new Date().toISOString(),
      internal,
    };
    setData((previous) => {
      const next = update(previous);
      return { ...next, activity: [event, ...next.activity] };
    });
    setNotice("saved");
  }
  function registerFile(file: File) {
    const url = URL.createObjectURL(file);
    files.current.set(url, file);
    return url;
  }
  if (!ready)
    return (
      <main
        className="page-container"
        style={{ paddingBlock: 80 }}
        aria-busy="true"
      >
        PergolaLink…
      </main>
    );
  return (
    <Context
      value={{
        data,
        role,
        setRole,
        dealerId: activeDealerId,
        setDealerId: (id) => {
          if (data.dealers.some((d) => d.id === id && d.active))
            setDealerId(id);
        },
        resetDemo,
        storageUnavailable,
        commit,
        notice,
        clearNotice: () => setNotice(null),
        registerFile,
      }}
    >
      {children}
    </Context>
  );
}
export function useDemo() {
  const store = useContext(Context);
  if (!store) throw new Error("DemoProvider missing");
  const preferences = useDisplayPreferences();
  const w = {
    ...preferences.t,
    ...preferences.ui,
    ...workflowMessages[preferences.locale],
  };
  const text = (value: DemoText) => translate(value, w);
  const dealerOrders = store.data.orders.filter(
    (order) => order.dealerId === store.dealerId,
  );
  const canViewOrder = (order: Order | undefined, staff: boolean) =>
    Boolean(
      order &&
        ((staff && store.role !== "dealer") ||
          order.dealerId === store.dealerId),
    );
  return {
    ...store,
    ...preferences,
    w,
    text,
    dealerOrders,
    canViewOrder,
  };
}
