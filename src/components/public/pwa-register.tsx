"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export const CLEAR_USER_CACHES = "CLEAR_USER_CACHES";

export async function clearEcoSpendWorkerCaches(unregister = false): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(async (registration) => {
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    const scriptUrl = worker?.scriptURL;
    const ownsWorker = scriptUrl
      ? new URL(scriptUrl).origin === window.location.origin && new URL(scriptUrl).pathname === "/sw.js"
      : registration.scope === `${window.location.origin}/`;
    if (!ownsWorker) return;
    worker?.postMessage({ type: CLEAR_USER_CACHES });
    if (unregister) await registration.unregister();
  }));
}

export function PwaRegister() {
  const [offline, setOffline] = useState<boolean>(() => typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // PWA enhancement is optional; the website remains fully usable.
    });
  }, []);

  useEffect(() => {
    const online = () => {
      setOffline(false);
      toast.success("Koneksi kembali terhubung");
    };
    const wentOffline = () => {
      setOffline(true);
      toast.error("Anda sedang offline; perubahan tersimpan lokal", { duration: 6000 });
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", wentOffline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", wentOffline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="sticky top-0 z-[70] bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-200">
      Anda sedang offline — perubahan baru tersimpan lokal hingga koneksi pulih.
    </div>
  );
}
