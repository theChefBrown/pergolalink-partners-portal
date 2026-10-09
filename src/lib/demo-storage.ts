import type { DemoRole, DemoState } from "./demo-types";
export type SavedDemo = {
  version: 1;
  data: DemoState;
  role: DemoRole;
  dealerId: string;
  files: [string, File][];
};
let connection: Promise<IDBDatabase> | undefined;
function database() {
  return (connection ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("dummy-partners-portal-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("demo");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error("Storage unavailable"));
  }));
}
export async function loadDemo(): Promise<SavedDemo | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction("demo").objectStore("demo").get("current");
    request.onsuccess = () => {
      const value = request.result as SavedDemo | undefined;
      resolve(
        value?.version === 1 &&
          Array.isArray(value.data?.orders) &&
          Array.isArray(value.files)
          ? value
          : undefined,
      );
    };
    request.onerror = () => reject(request.error);
  });
}
let pending: Promise<void> = Promise.resolve();
export function saveDemo(snapshot: SavedDemo): Promise<void> {
  // Serialize writes so a slower earlier update never replaces a newer state or reset.
  pending = pending
    .catch(() => {})
    .then(async () => {
      const db = await database();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("demo", "readwrite");
        tx.objectStore("demo").put(snapshot, "current");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    });
  return pending;
}
