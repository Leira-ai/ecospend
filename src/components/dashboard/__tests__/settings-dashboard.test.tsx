import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemoProvider } from "../demo-store";
import { SettingsDashboard, sanitizeExportValue } from "../settings-dashboard";
import { clearEcoSpendWorkerCaches } from "@/components/public/pwa-register";
import { createOptionalBrowserClient } from "@/lib/supabase/client";

const replace = vi.fn();
const refresh = vi.fn();
const setTheme = vi.fn();
const signOut = vi.fn().mockResolvedValue({ error: null });
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme }) }));
vi.mock("@/components/public/pwa-register", () => ({ clearEcoSpendWorkerCaches: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/supabase/client", () => ({ createOptionalBrowserClient: vi.fn() }));

function renderSettings() {
  return render(<DemoProvider><SettingsDashboard /></DemoProvider>);
}

describe("SettingsDashboard", () => {
  beforeEach(() => {
    vi.mocked(createOptionalBrowserClient).mockReturnValue({ configured: true, client: { auth: { signOut } } } as never);
    Object.defineProperty(window, "fetch", { configurable: true, value: vi.fn() });
  });

  it("applies the selected theme through next-themes", async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.selectOptions(screen.getByLabelText("Tema"), "dark");
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("requests browser permission only from the settings action", async () => {
    const requestPermission = vi.fn().mockResolvedValue("denied");
    Object.defineProperty(window, "Notification", { configurable: true, value: { permission: "default", requestPermission } });
    const user = userEvent.setup();
    renderSettings();
    expect(requestPermission).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Aktifkan notifikasi browser" }));
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  it("signs out, clears only EcoSpend storage, clears worker caches, and redirects", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("ecospend-demo-state-v2", "private");
    window.localStorage.setItem("other-app", "keep");
    window.sessionStorage.setItem("ecospend-session", "private");
    window.sessionStorage.setItem("other-session", "keep");
    renderSettings();
    await user.click(screen.getByRole("button", { name: "Keluar" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledWith({ scope: "local" }));
    expect(window.localStorage.getItem("other-app")).toBe("keep");
    expect(window.sessionStorage.getItem("other-session")).toBe("keep");
    expect(window.sessionStorage.getItem("ecospend-session")).toBeNull();
    expect(clearEcoSpendWorkerCaches).toHaveBeenCalledWith(true);
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("sanitizes spreadsheet formula prefixes in export values", () => {
    expect(sanitizeExportValue("=WEBSERVICE(\"https://example.com\")")).toBe("'=WEBSERVICE(\"https://example.com\")");
    expect(sanitizeExportValue("normal text")).toBe("normal text");
  });
});
