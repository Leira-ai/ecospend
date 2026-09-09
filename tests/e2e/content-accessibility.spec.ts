import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("carbon dashboard and methodology state estimation limits", async ({ page }) => {
  await page.goto("/dashboard/karbon?demo=1");
  await expect(page.getByRole("heading", { level: 1, name: "Jejak karbon" })).toBeVisible();
  await expect(page.getByText("Estimasi, bukan audit karbon")).toBeVisible();
  await expect(page.getByText(/Jangan gunakan hasil untuk pelaporan regulasi/)).toBeVisible();

  await page.goto("/methodology");
  await expect(page.getByRole("heading", { level: 1, name: /Memahami angka di balik/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dua pendekatan estimasi" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Batas penggunaan" })).toBeVisible();
});

test("report export initiates a CSV download", async ({ page }) => {
  await page.goto("/dashboard/laporan?demo=1");
  await expect(page.getByRole("heading", { level: 1, name: "Laporan" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("laporan-2026-09.csv");
});

test("mobile navigation exposes dashboard destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Buka menu" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  const mobileNavigation = page.getByRole("navigation", { name: "Navigasi seluler" });
  await expect(mobileNavigation.getByRole("link", { name: "Metodologi", exact: true })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Masuk", exact: true })).toBeVisible();

  await page.goto("/dashboard?demo=1");
  await expect(page.getByRole("navigation", { name: "Navigasi cepat seluler" })).toBeVisible();
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();
  await page.getByRole("link", { name: "Jejak karbon" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Jejak karbon" })).toBeVisible();
});

test("keyboard navigation reaches skip link and main navigation", async ({ page }) => {
  await page.goto("/dashboard?demo=1");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Lewati ke konten utama" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page).toHaveURL(/#konten-utama$/);

  const transactions = page.getByRole("link", { name: "Transaksi" }).first();
  await transactions.focus();
  await expect(transactions).toBeFocused();
  await transactions.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Transaksi" })).toBeVisible();
});
