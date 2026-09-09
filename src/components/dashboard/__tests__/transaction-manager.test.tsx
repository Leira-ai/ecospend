import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { initialDemoState } from "../demo-data";
import { TransactionManager } from "../transaction-manager";
import { DEMO_STORAGE_KEY, renderWithDemo } from "@/test/render";

describe("TransactionManager", () => {
  it("filters transactions by query and type and shows the empty state", async () => {
    const user = userEvent.setup();
    renderWithDemo(<TransactionManager />);

    await user.type(screen.getByRole("textbox", { name: "Cari transaksi" }), "KRL");
    expect(screen.getAllByText("KRL & TransJakarta").length).toBeGreaterThan(0);
    expect(screen.queryByText("Gaji bulanan")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Filter jenis" }), "pemasukan");
    expect(screen.getByText("Transaksi tidak ditemukan")).toBeInTheDocument();
  });

  it("validates transfers and persists a valid transaction", async () => {
    const user = userEvent.setup();
    renderWithDemo(<TransactionManager openOnLoad />);

    const dialog = screen.getByRole("dialog", { name: "Tambah transaksi" });
    await user.selectOptions(screen.getByLabelText("Jenis"), "transfer");
    expect(await screen.findByLabelText("Akun tujuan")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nama transaksi"), "Pindah dana darurat");
    await user.clear(screen.getByLabelText("Nominal"));
    await user.type(screen.getByLabelText("Nominal"), "250000");
    await user.selectOptions(screen.getByLabelText("Akun tujuan"), "Bank Utama");
    await user.click(screen.getByRole("button", { name: "Tambah transaksi" }));

    expect(await screen.findByText("Pilih akun tujuan yang berbeda")).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tutup dialog" }));
    await user.click(screen.getByRole("button", { name: "Tambah" }));
    await user.selectOptions(screen.getByLabelText("Jenis"), "transfer");
    await user.type(screen.getByLabelText("Nama transaksi"), "Pindah dana darurat");
    await user.clear(screen.getByLabelText("Nominal"));
    await user.type(screen.getByLabelText("Nominal"), "250000");
    await user.selectOptions(await screen.findByLabelText("Akun tujuan"), "Dompet Digital");
    await user.click(screen.getByRole("button", { name: "Tambah transaksi" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tambah transaksi" })).not.toBeInTheDocument());
    expect(screen.getAllByText("Pindah dana darurat").length).toBeGreaterThan(0);
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "{}") as typeof initialDemoState;
      expect(stored.transactions[0]).toMatchObject({
        name: "Pindah dana darurat",
        type: "transfer",
        account: "Bank Utama",
        destinationAccount: "Dompet Digital",
        amount: 250000,
      });
    });
  });
});
