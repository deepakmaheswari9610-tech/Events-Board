import { chromium, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { mkdirSync } from "node:fs";
const db = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const screenshotDirectory =
  process.env.TEST_ARTIFACT_DIR || "/private/tmp/community-board-phase5";
let browser, userId, eventId;
try {
  const response = await fetch(`${base}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `phase5-ui-${Date.now()}@example.com`,
      password: "PhaseFiveBrowser@123",
    }),
  });
  if (response.status !== 201)
    throw new Error(`Signup failed: ${response.status}`);
  const identity = await response.json();
  userId = identity.user.id;
  const event = await db.event.create({
    data: {
      title: "Acoustic night — browser verification",
      category: "Music",
      city: "Coimbatore",
      startsAt: new Date(Date.now() + 2 * 86400000),
      price: 499,
      description: "An evening of local music, tested on laptop and phone.",
      imageUrl: "https://example.com/image.jpg",
    },
  });
  eventId = event.id;
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_EXECUTABLE ||
      (process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : undefined),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.addCookies([
    {
      name: "board_visitor_session",
      value: identity.token,
      url: base,
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/events/${eventId}`);
  const reminder = page.getByRole("button", { name: "Remind me", exact: true });
  await expect(reminder).toBeEnabled();
  let failSave;
  const failureGate = new Promise((resolve) => {
    failSave = resolve;
  });
  await page.route(`**/api/events/${eventId}/reminder`, async (route) => {
    if (route.request().method() === "PUT") {
      await failureGate;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Couldn’t save your reminder. Please try again.",
        }),
      });
    } else await route.continue();
  });
  await reminder.click();
  await expect(
    page.getByRole("button", { name: /Reminder saved/ }),
  ).toHaveAttribute("aria-pressed", "true");
  failSave();
  await expect(
    page.getByRole("button", { name: "Remind me", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.locator(".reminder-control").getByRole("alert"),
  ).toContainText("Couldn’t save");
  await page.unroute(`**/api/events/${eventId}/reminder`);
  await page.getByRole("button", { name: "Remind me", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Reminder saved/ }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Reminder saved/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const ocean = page.getByRole("button", { name: "Ocean", exact: true });
  await expect(ocean).toBeEnabled();
  await ocean.click();
  await expect(ocean).toHaveAttribute("aria-pressed", "true");
  await expect(ocean).toBeEnabled();
  for (const name of ["Star", "Music", "Heart"]) {
    const sticker = page.getByRole("button", {
      name: `Add ${name} sticker`,
      exact: true,
    });
    await expect(sticker).toBeEnabled();
    await sticker.click();
    await expect(ocean).toBeEnabled();
  }
  await expect(
    page.getByRole("button", { name: "Add Flower sticker", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Remove Music sticker 2", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add Flower sticker", exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Ocean", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: /^Remove .* sticker/ }),
  ).toHaveCount(2);
  // A rejected design save also restores the last persisted theme.
  await page.route(`**/api/events/${eventId}/design`, async (route) => {
    if (route.request().method() === "PUT")
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Couldn’t save your design." }),
      });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Garden", exact: true }).click();
  await expect(
    page.locator(".designer-controls").getByRole("alert"),
  ).toContainText("Couldn’t save your design");
  await expect(
    page.getByRole("button", { name: "Ocean", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.unroute(`**/api/events/${eventId}/design`);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Ocean", exact: true }),
  ).toBeEnabled();
  mkdirSync(screenshotDirectory, { recursive: true });
  await page.screenshot({
    path: `${screenshotDirectory}/laptop.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${screenshotDirectory}/phone.png`,
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".designed-card")
      .evaluate((element) => getComputedStyle(element).transitionDuration),
  ).toBe("0s");
  expect(errors).toEqual([]);
  console.log(
    `PASS: optimistic immediate update, failed-save rollback/message, reminder refresh persistence, live themes, sticker cap/removal, design refresh persistence, phone overflow, reduced motion and no browser errors. Screenshots: ${screenshotDirectory}`,
  );
} finally {
  if (browser) await browser.close();
  if (userId) await db.user.deleteMany({ where: { id: userId } });
  if (eventId) await db.event.deleteMany({ where: { id: eventId } });
  await db.$disconnect();
}
