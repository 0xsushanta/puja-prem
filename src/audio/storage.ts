import { useMemo, useSyncExternalStore } from "react";
import { STORAGE_EVENT_PREFIX } from "./constants";

function storageEventName(key: string) {
  return `${STORAGE_EVENT_PREFIX}:${key}`;
}

export function safeReadStorage(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function notifyStorageChange(key: string) {
  window.dispatchEvent(new CustomEvent(storageEventName(key)));
}

export function safeWriteStorage(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
    notifyStorageChange(key);
  } catch {}
}

export function safeRemoveStorage(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
    notifyStorageChange(key);
  } catch {}
}

export function useStoredString(key: string) {
  const store = useMemo(
    () => ({
      subscribe(onStoreChange: () => void) {
        if (typeof window === "undefined") {
          return () => {};
        }

        const handleStorage = (event: StorageEvent) => {
          if (event.key !== null && event.key !== key) {
            return;
          }

          onStoreChange();
        };

        const handleCustom = () => {
          onStoreChange();
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener(storageEventName(key), handleCustom);

        return () => {
          window.removeEventListener("storage", handleStorage);
          window.removeEventListener(storageEventName(key), handleCustom);
        };
      },
      getSnapshot() {
        return safeReadStorage(key);
      },
      getServerSnapshot() {
        return null;
      },
    }),
    [key]
  );

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
}
