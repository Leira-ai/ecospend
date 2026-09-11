import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BudgetManager } from "../budget-manager";
import { initialDemoState } from "../demo-data";
import { GoalManager } from "../goal-manager";
import { DEMO_STORAGE_KEY, renderWithDemo } from "@/test/render";

describe("budget and goal UI", () => {
  it("reports budget use accessibly and creates a new category budget", async () => {
    const user = userEvent.setup();
    renderWithDemo(<BudgetManager />);

    const foodExpenses = initialDemoState.transactions
      .filter((item) => item.type === "pengeluaran" && item.category === "Makanan & Minuman" && item.date.startsWith("2026-09"))
      .reduce((sum, item) => sum + item.amount, 0);
    const expectedUse = Math.min(100, Math.round(foodExpenses / 1_800_000 * 100));
    expect(screen.getByRole("progressbar", { name: "Penggunaan anggaran Makanan & Minuman" })).toHaveAttribute("aria-valuenow", String(expectedUse));
    await user.click(screen.getByRole("button", { name: "Tambah anggaran" }));

    const dialog = screen.getByRole("dialog", { name: "Tambah anggaran" });
    expect(within(dialog).getByLabelText("Kategori")).toHaveValue("Kesehatan");
    fireEvent.change(within(dialog).getByLabelText("Batas bulanan"), { target: { value: "750000" } });
    await user.click(within(dialog).getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("heading", { name: "Kesehatan" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Penggunaan anggaran Kesehatan" })).toHaveAttribute("aria-valuenow", "0");
    const healthCard = screen.getByRole("heading", { name: "Kesehatan" }).closest("section");
    expect(healthCard).not.toBeNull();
    expect(healthCard).toHaveTextContent(/Rp\s*0 dari Rp\s*750\.000/);
    await waitFor(() => {
      const state = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "{}");
      expect(state.budgets).toContainEqual(expect.objectContaining({ category: "Kesehatan", limit: 750000 }));
    });
  });

  it("updates a goal card after a contribution", async () => {
    const user = userEvent.setup();
    renderWithDemo(<GoalManager />);

    const goalHeading = screen.getByRole("heading", { name: "Dana darurat hijau" });
    const goalCard = goalHeading.closest("section");
    expect(goalCard).not.toBeNull();
    expect(within(goalCard!).getByRole("progressbar", { name: "Kemajuan Dana darurat hijau" })).toHaveAttribute("aria-valuenow", "65");

    await user.click(within(goalCard!).getByRole("button", { name: "Tambah kontribusi" }));
    const dialog = screen.getByRole("dialog", { name: "Kontribusi ke Dana darurat hijau" });
    fireEvent.change(within(dialog).getByLabelText("Nominal kontribusi"), { target: { value: "250000" } });
    await user.click(within(dialog).getByRole("button", { name: "Tambah kontribusi" }));

    expect(screen.getByRole("progressbar", { name: "Kemajuan Dana darurat hijau" })).toHaveAttribute("aria-valuenow", "67");
    await waitFor(() => {
      const state = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "{}");
      expect(state.goals.find((goal: { id: string }) => goal.id === "g1").saved).toBe(10_000_000);
    });
  });
});
