import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ImportFlow } from "../import-flow";
import { DEMO_STORAGE_KEY, renderWithDemo } from "@/test/render";

describe("ImportFlow", () => {
  it("detects duplicate CSV rows and imports only fresh transactions", async () => {
    const user = userEvent.setup();
    const { container } = renderWithDemo(<ImportFlow />);
    const csv = [
      "date,name,category,account,type,amount,carbonKg,notes",
      "2026-09-08,Gaji bulanan,Gaji,Bank Utama,pemasukan,12500000,0,duplikat",
      "2026-09-09,Warung sayur,Makanan & Minuman,Tunai,pengeluaran,85000,0.4,segar",
    ].join("\n");
    const file = new File([csv], "transaksi.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: async () => csv });
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input!, file);
    expect(await screen.findByRole("heading", { name: /Petakan kolom/ })).toBeInTheDocument();
    const mapping = {
      "Tanggal *": "date",
      "Nama *": "name",
      "Kategori *": "category",
      "Akun *": "account",
      "Jenis *": "type",
      "Nominal *": "amount",
    };
    for (const [label, value] of Object.entries(mapping)) {
      await user.selectOptions(screen.getByLabelText(label), value);
    }
    await user.click(screen.getByRole("button", { name: "Tinjau data" }));

    expect(await screen.findByText("1 valid")).toBeInTheDocument();
    expect(screen.getByText("1 duplikat")).toBeInTheDocument();
    expect(screen.getByText("Warung sayur")).toBeInTheDocument();
    expect(screen.queryByText("Gaji bulanan")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Konfirmasi impor" }));
    expect(await screen.findByRole("heading", { name: "Impor selesai" })).toBeInTheDocument();
    expect(screen.getByText(/1 transaksi ditambahkan, 1 duplikat dilewati/)).toBeInTheDocument();
    await waitFor(() => {
      const state = JSON.parse(window.localStorage.getItem(DEMO_STORAGE_KEY) ?? "{}");
      expect(state.transactions.filter((row: { name: string; date: string; amount: number }) => row.name === "Gaji bulanan" && row.date === "2026-09-08" && row.amount === 12_500_000)).toHaveLength(1);
      expect(state.transactions).toContainEqual(expect.objectContaining({ name: "Warung sayur", amount: 85000 }));
    });
  });

  it("rejects oversized files instead of silently truncating", async () => {
    const user = userEvent.setup();
    const { container } = renderWithDemo(<ImportFlow />);
    const file = new File(["date,name\n2026-09-08,test"], "large.csv", { type: "text/csv" });
    Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 + 1 });
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');

    await user.upload(input!, file);

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Ukuran berkas melebihi batas 5 MB.");
    expect(screen.queryByRole("heading", { name: /Petakan kolom/ })).not.toBeInTheDocument();
  });

  it("reports each invalid row and its reason", async () => {
    const user = userEvent.setup();
    const { container } = renderWithDemo(<ImportFlow />);
    const csv = [
      "date,name,category,account,type,amount",
      "bad-date,,Makanan & Minuman,Tunai,pengeluaran,-20",
    ].join("\n");
    const file = new File([csv], "invalid.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: async () => csv });
    await user.upload(container.querySelector<HTMLInputElement>('input[type="file"]')!, file);
    for (const [label, value] of Object.entries({ "Tanggal *": "date", "Nama *": "name", "Kategori *": "category", "Akun *": "account", "Jenis *": "type", "Nominal *": "amount" })) {
      await user.selectOptions(screen.getByLabelText(label), value);
    }
    await user.click(screen.getByRole("button", { name: "Tinjau data" }));

    expect(screen.getByText("Baris 2:")).toBeInTheDocument();
    expect(screen.getByText(/tanggal harus berformat YYYY-MM-DD/)).toBeInTheDocument();
    expect(screen.getByText(/nama kosong/)).toBeInTheDocument();
    expect(screen.getByText(/nominal harus berupa angka positif/)).toBeInTheDocument();
  });
});
