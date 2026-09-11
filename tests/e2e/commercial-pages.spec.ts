import { expect, test } from "@playwright/test";

test("pricing page presents freemium and Pro plans", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1, name: /Investasi kecil/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Pemula" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "EcoSpend Pro" })).toBeVisible();
  await expect(page.getByText("Rp29.000")).toBeVisible();
  await page.getByRole("button", { name: "Bulanan" }).click();
  await expect(page.getByText("Rp39.000")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mulai Gratis Sekarang" })).toHaveAttribute("href", "/register");
});

test("emissions calculator computes an estimate and presents limits", async ({ page }) => {
  await page.goto("/kalkulator-emisi");
  await expect(page.getByRole("heading", { level: 1, name: /Seberapa besar/ })).toBeVisible();
  await page.getByRole("button", { name: /Hitung estimasi/ }).click();
  await expect(page.getByRole("status")).toContainText("kg CO₂e");
  await expect(page.getByText(/Bukan audit atau klaim net-zero/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Jurnal lengkap/ })).toHaveAttribute("href", "/register");
});

test("refund policy is linked from pricing", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("link", { name: /Kebijakan refund/ }).click();
  await expect(page).toHaveURL(/\/refund-policy$/);
  await expect(page.getByRole("heading", { level: 1, name: /Pengembalian dana EcoSpend/ })).toBeVisible();
  await expect(page.getByText(/Jaminan 14 hari/)).toBeVisible();
});
