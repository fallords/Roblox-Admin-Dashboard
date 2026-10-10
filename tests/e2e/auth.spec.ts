import { expect, test, type Page } from "@playwright/test";
import { OWNER, VIEWER } from "./credentials";

async function signIn(page: Page, user: { username: string; password: string }) {
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("authentication and route protection", () => {
  test("redirects unauthenticated visitors to the login page", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login\?next=%2Fsettings$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("rejects a wrong password with a generic message", async ({ page }) => {
    await page.goto("/login");
    await signIn(page, { username: OWNER.username, password: "definitely-not-it" });
    await expect(page.locator("#login-error")).toHaveText("Incorrect username or password.");
    await expect(page.getByLabel("Username")).toHaveValue(OWNER.username);
    await expect(page).toHaveURL(/\/login/);
  });

  test("owner signs in, sees labelled data, and returns to the requested page", async ({ page }) => {
    const cspErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /Content Security Policy/i.test(message.text())) cspErrors.push(message.text());
    });

    await page.goto("/players");
    await signIn(page, OWNER);
    await expect(page).toHaveURL(/\/players$/);

    await page.getByRole("link", { name: "Overview", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
    // Live metrics are never fabricated.
    await expect(page.getByText("Roblox integration: not connected")).toBeVisible();
    const live = page.getByRole("region", { name: "Live game" });
    await expect(live.getByText("Not connected", { exact: true }).first()).toBeVisible();
    // Seed data is visibly labelled.
    const records = page.getByRole("region", { name: "Administrative records" });
    await expect(records.getByText("Demo", { exact: true })).toHaveCount(4);
    await expect(page.getByText("Demo data", { exact: true })).toBeVisible();
    // The sign-in itself appears in the recent actions.
    await expect(page.getByRole("cell", { name: "auth.login" }).first()).toBeVisible();

    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await expect(page.getByText("Roblox integration is not configured.", { exact: false })).toBeVisible();
    expect(cspErrors).toEqual([]);
  });

  test("viewer cannot open owner-only pages", async ({ page }) => {
    await page.goto("/login");
    await signIn(page, VIEWER);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: "Settings", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Audit Logs", exact: true })).toHaveCount(0);

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/forbidden$/);
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
    await page.goto("/audit-logs");
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  test("sign out revokes the session server-side", async ({ page, context, browser }) => {
    await page.goto("/login");
    await signIn(page, OWNER);
    await expect(page).toHaveURL(/\/dashboard$/);
    const stolen = (await context.cookies()).filter((cookie) => cookie.name.includes("ba_session"));
    expect(stolen).toHaveLength(1);
    expect(stolen[0]!.httpOnly).toBe(true);
    expect(stolen[0]!.sameSite).toBe("Lax");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    // Replaying the old cookie must not work once the session is revoked.
    const replay = await browser.newContext();
    await replay.addCookies(stolen);
    const replayPage = await replay.newPage();
    await replayPage.goto("/dashboard");
    await expect(replayPage).toHaveURL(/\/login/);
    await replay.close();
  });

  test("mobile navigation drawer opens, closes with Escape, and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await signIn(page, OWNER);
    await expect(page).toHaveURL(/\/dashboard$/);
    // No horizontal page scroll at phone width.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    const menu = page.getByRole("button", { name: "Open navigation menu" });
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    const drawer = page.getByRole("dialog", { name: "Main navigation" });
    await expect(drawer.getByRole("link", { name: "Players" })).toBeVisible();
    // The page behind the modal drawer is inert: Tab cycles through the drawer
    // (and the browser UI, reported as <body>) but never reaches page content.
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "browser";
        return el.closest("dialog")?.id ?? `outside:${el.tagName}:${el.textContent?.trim().slice(0, 30)}`;
      });
      expect(["nav-drawer", "browser"]).toContain(focused);
    }
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(menu).toBeFocused();

    // Clicking the dimmed area outside the sheet dismisses the drawer.
    await menu.click();
    await page.mouse.click(380, 400);
    await expect(drawer).toBeHidden();

    await menu.click();
    await drawer.getByRole("link", { name: "Events" }).click();
    await expect(drawer).toBeHidden();
    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByRole("heading", { name: "Events", level: 1 })).toBeVisible();
  });
});
