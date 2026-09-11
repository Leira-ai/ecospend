import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.filter(({ impact }) => impact === "serious" || impact === "critical"),
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("public landing page has no serious Axe violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Tiap rupiah punya/ })).toBeVisible();

  await expectNoSeriousAxeViolations(page);
});

test("demo dashboard has no serious Axe violations", async ({ page }) => {
  await page.goto("/dashboard?demo=1");
  await expect(page.getByRole("heading", { level: 1, name: "Selamat datang kembali" })).toBeVisible();

  await expectNoSeriousAxeViolations(page);
});

test("transaction dialog has no serious Axe violations", async ({ page }) => {
  await page.goto("/dashboard/transaksi?demo=1&new=1");
  const dialog = page.getByRole("dialog", { name: "Tambah transaksi" });
  await expect(dialog).toBeVisible();

  await expectNoSeriousAxeViolations(page);
});
