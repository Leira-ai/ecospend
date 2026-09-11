import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("landing page presents product value and reaches the demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Tiap rupiah punya/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pelajari metodologi" })).toHaveAttribute("href", "/methodology");

  await page.goto("/dashboard?demo=1");
  await expect(page.getByRole("heading", { level: 1, name: "Selamat datang kembali" })).toBeVisible();
  await expect(page.getByText("Total saldo", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Tambah transaksi/ })).toBeVisible();
});

test("user adds and filters a demo transaction", async ({ page }) => {
  await page.goto("/dashboard/transaksi?demo=1&new=1");
  const dialog = page.getByRole("dialog", { name: "Tambah transaksi" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nama transaksi").fill("Makan siang organik");
  await dialog.getByLabel("Kategori").selectOption({ label: "Makanan & Minuman" });
  await dialog.getByLabel("Nominal").fill("95000");
  await dialog.getByLabel("Estimasi karbon (kg CO₂e)").fill("0.8");
  await dialog.getByRole("button", { name: "Tambah transaksi" }).click();
  await expect(dialog).toBeHidden();

  const search = page.getByRole("textbox", { name: "Cari transaksi" });
  await search.fill("Makan siang organik");
  await expect(page.getByText("Makan siang organik").first()).toBeVisible();
  await page.getByRole("combobox", { name: "Filter jenis" }).selectOption("pemasukan");
  await expect(page.getByText("Transaksi tidak ditemukan")).toBeVisible();
  await page.getByRole("combobox", { name: "Filter jenis" }).selectOption("pengeluaran");
  await expect(page.getByText("Makan siang organik").first()).toBeVisible();
});

test("user creates a budget", async ({ page }) => {
  await page.goto("/dashboard/anggaran?demo=1");
  await page.getByRole("button", { name: "Tambah anggaran" }).click();
  const dialog = page.getByRole("dialog", { name: "Tambah anggaran" });
  await expect(dialog.getByLabel("Kategori")).toHaveValue("Kesehatan");
  await dialog.getByLabel("Batas bulanan").fill("650000");
  await dialog.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByRole("heading", { name: "Kesehatan" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Penggunaan anggaran Kesehatan" })).toHaveAttribute("aria-valuenow", "0");
});
