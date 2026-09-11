import { chromium } from "@playwright/test";

const base = process.env.SCREENSHOT_BASE_URL ?? "https://ecospend-ten.vercel.app";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const shots = [
  { file: "docs/screenshots/landing.png", url: "/", heading: "Tiap rupiah punya" },
  { file: "docs/screenshots/dashboard.png", url: "/dashboard?demo=1", heading: "Selamat datang kembali" },
  { file: "docs/screenshots/budgets.png", url: "/dashboard/anggaran?demo=1", heading: "Anggaran" },
  { file: "docs/screenshots/carbon.png", url: "/dashboard/karbon?demo=1", heading: "Jejak karbon" },
];

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const { file, url, heading } of shots) {
  await page.goto(base + url, { waitUntil: "networkidle", timeout: 60000 });
  await page.getByRole("heading", { name: heading }).first().waitFor({ state: "visible", timeout: 30000 });
  // Let layout, fonts, and chart paint settle.
  await page.waitForTimeout(2000);
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", file);
}
await browser.close();
