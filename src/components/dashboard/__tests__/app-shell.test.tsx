import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={String(href)} {...props}>{children}</a> }));
vi.mock("next-themes", () => ({ useTheme: () => ({ setTheme: vi.fn() }) }));

describe("AppShell notifications", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/dashboard?demo=1");
  });

  it("opens real in-app notifications and clears the unread badge", async () => {
    const user = userEvent.setup();
    render(<AppShell><p>Konten</p></AppShell>);

    await user.click(screen.getByRole("button", { name: "Notifikasi, 3 belum dibaca" }));
    expect(screen.getByRole("region", { name: "Panel notifikasi" })).toBeInTheDocument();
    expect(screen.getByText("Anggaran makanan mendekati batas")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tandai semua dibaca" }));
    expect(screen.getByRole("button", { name: "Notifikasi, 0 belum dibaca" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tandai semua dibaca" })).not.toBeInTheDocument();
  });
});
