"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // PWA enhancement is optional; the website remains fully usable.
    });
  }, []);

  return null;
}
