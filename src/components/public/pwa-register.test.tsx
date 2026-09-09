import { describe, expect, it, vi } from "vitest";
import { clearEcoSpendWorkerCaches, CLEAR_USER_CACHES } from "./pwa-register";

describe("PWA user cache clearing", () => {
  it("messages each worker and unregisters same-origin registrations", async () => {
    const postMessage = vi.fn();
    const unregister = vi.fn().mockResolvedValue(true);
    const registration = { scope: `${window.location.origin}/`, active: { postMessage }, unregister };
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistrations: vi.fn().mockResolvedValue([registration]) },
    });

    await clearEcoSpendWorkerCaches(true);

    expect(postMessage).toHaveBeenCalledWith({ type: CLEAR_USER_CACHES });
    expect(unregister).toHaveBeenCalledOnce();
  });
});
