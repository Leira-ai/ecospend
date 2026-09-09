import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Card, EmptyState, Progress } from "../ui";

describe("shared dashboard UI", () => {
  it("renders metric card content with section semantics", () => {
    render(<Card aria-label="Saldo bulanan"><p>Total saldo</p><strong>Rp10.000.000</strong></Card>);

    const card = screen.getByRole("region", { name: "Saldo bulanan" });
    expect(card).toHaveTextContent("Total saldo");
    expect(card).toHaveTextContent("Rp10.000.000");
  });

  it("clamps progress values and exposes an accessible value", () => {
    const { rerender } = render(<Progress value={128} label="Penggunaan anggaran" tone="rose" />);
    expect(screen.getByRole("progressbar", { name: "Penggunaan anggaran" })).toHaveAttribute("aria-valuenow", "100");

    rerender(<Progress value={-8} label="Penggunaan anggaran" />);
    expect(screen.getByRole("progressbar", { name: "Penggunaan anggaran" })).toHaveAttribute("aria-valuenow", "0");
  });

  it("shows an actionable empty state", async () => {
    const onAction = vi.fn();
    render(<EmptyState title="Belum ada transaksi" description="Tambahkan transaksi pertama Anda." action={<button onClick={onAction}>Tambah transaksi</button>} />);

    expect(screen.getByText("Belum ada transaksi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tambah transaksi" }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
