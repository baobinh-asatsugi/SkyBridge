const { chromium } = require("playwright");
const path = require("path");

async function main() {
  const appUrl = process.env.APP_URL || process.argv[2] || "http://127.0.0.1:5176/";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) errors.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: "screenshots/01-mission-control.png", fullPage: true });

  const screens = [
    ["02 Corridor Explorer", "02-corridor-explorer.png"],
    ["03 Prioritization", "03-prioritization.png"],
    ["04 Mission Planner", "04-mission-planner.png"],
    ["05 Scenario Lab", "05-scenario-lab.png"],
    ["06 Seasonal Operations", "06-seasonal-operations.png"]
  ];

  for (const [label, file] of screens) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join("screenshots", file), fullPage: true });
  }

  await page.getByRole("button", { name: /Methodology/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/07-methodology-data-notes.png", fullPage: true });

  const body = await page.locator("body").innerText();
  console.log(JSON.stringify({
    title: await page.title(),
    hasNgoiCay: body.includes("Ngối Cáy"),
    errorCount: errors.length,
    errors: errors.slice(0, 10)
  }, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
