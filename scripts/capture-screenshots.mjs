import { chromium } from "@playwright/test";

const base = process.env.SCREENSHOT_BASE_URL ?? "https://ecospend-ten.vercel.app";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const shots = [
  { file: "docs/screenshots/landing.png", url: "/", fullPage: true },
  { file: "docs/screenshots/dashboard.png", url: "/dashboard?demo=1", fullPage: true },
  { file: "docs/screenshots/budgets.png", url: "/dashboard/anggaran?demo=1", fullPage: true },
  { file: "docs/screenshots/carbon.png", url: "/dashboard/karbon?demo=1", fullPage: true },
];

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const { file, url, fullPage } of shots) {
  await page.goto(base + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: file, fullPage });
  console.log("saved", file);
}
await browser.close();
