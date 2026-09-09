import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CarbonDashboard } from "../carbon-dashboard";
import { initialDemoState } from "../demo-data";
import { renderWithDemo } from "@/test/render";

describe("CarbonDashboard", () => {
  it("shows an explicit methodology disclaimer with the estimate", () => {
    renderWithDemo(<CarbonDashboard />);

    expect(screen.getByRole("heading", { name: "Jejak karbon" })).toBeInTheDocument();
    expect(screen.getByText("Estimasi, bukan audit karbon")).toBeInTheDocument();
    expect(screen.getByText(/Jangan gunakan hasil untuk pelaporan regulasi/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Keyakinan estimasi karbon" })).toHaveAttribute("aria-valuenow");
  });

  it("recalculates deterministic estimates from stored amount and category", async () => {
    const user = userEvent.setup();
    const state = structuredClone(initialDemoState);
    state.transactions[0] = { ...state.transactions[0], type: "transfer", destinationAccount: "Dompet Digital", carbonKg: 999 };
    state.transactions[1] = { ...state.transactions[1], carbonKg: 999 };
    renderWithDemo(<CarbonDashboard />, { state });

    expect(screen.getByText("Emisi September").nextElementSibling).not.toHaveTextContent("1998");
    await user.click(screen.getByRole("button", { name: "Hitung ulang" }));
    const dialog = screen.getByRole("dialog", { name: "Hitung ulang semua estimasi?" });
    await user.click(within(dialog).getByRole("button", { name: "Hitung ulang" }));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem("ecospend-demo-state-v2") ?? "{}");
      expect(stored.transactions[0].carbonKg).toBe(0);
      expect(stored.transactions[1].carbonKg).not.toBe(999);
    });
  });

  it("keeps the disclaimer and omits recommendations when emissions are empty", () => {
    renderWithDemo(<CarbonDashboard />, {
      state: { ...structuredClone(initialDemoState), transactions: [] },
    });

    expect(screen.getByText("Emisi September").nextElementSibling).toHaveTextContent("0 kg CO₂e");
    expect(screen.queryByText("Peluang utama")).not.toBeInTheDocument();
    expect(screen.getByText("Estimasi, bukan audit karbon")).toBeInTheDocument();
  });
});
