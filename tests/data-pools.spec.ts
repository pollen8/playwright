import { expect, test } from "@playwright/test";

import { signInViaKeycloak } from "./helpers/auth";

test.describe("Data Pool Tests", () => {
	const keycloakUsername = process.env.KEYCLOAK_USERNAME || "";
	const keycloakPassword = process.env.KEYCLOAK_PASSWORD || "";
	const poolName = "test data pool";

	test("create data pool with initial analysis", async ({ page }) => {
		await signInViaKeycloak(page, keycloakUsername, keycloakPassword);
		await expect(
			page.getByRole("heading", { name: "Ask Social Video Data" }),
		).toBeVisible();

		await page.getByRole("button", { name: "New Project" }).click();

		await page.getByRole("button", { name: "New Data Pool" }).click();
		await page
			.getByText("Import a list of social media account URLs or add accounts.")
			.click();
		await page.getByText("Manually Add").click();
		await page
			.getByPlaceholder("Enter your account names, comma separated...")
			.fill("https://x.com/brothersbrick");
		await page.getByRole("button", { name: "Validate Accounts" }).click();
		await page.getByRole("button", { name: "Add All (1)" }).click();
		await page.getByRole("button", { name: "Continue" }).click();
		await page.getByText("Enter your custom analysis").focus();

		await page.locator('[class="input-container"]').click();
		await page.keyboard.type("test question");
		// fill('test question');
		await page.getByRole("button", { name: "askGVT" }).click();
		await page.getByRole("button", { name: "Continue" }).click();
		await page.getByPlaceholder("Name").fill(poolName);
		await page.getByPlaceholder("Description").fill("test description");
		await page.getByRole("button", { name: "Create Data Pool" }).click();
		await page.waitForLoadState("networkidle");
		expect(page.getByRole("heading", { name: poolName })).toBeVisible({
			timeout: 200_000,
		});
		expect(page.getByRole("blockquote")).toHaveText("test question", {
			timeout: 200_000,
		});
	});

	// Teardown: runs once after all tests in this describe block
	test.afterAll(async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		page.on("dialog", (dialog) => {
			return dialog.accept();
		});
		try {
			console.log("🧹 Starting test data cleanup...");

			// Sign in again for cleanup
			await signInViaKeycloak(page, keycloakUsername, keycloakPassword);

			await page.goto("/projects");

			await page.locator('a[class="iconlink"]').first().click();
			await page.getByRole("button", { name: "Project Settings" }).click();
			await page.getByRole("button", { name: "Delete This Project" }).click();
		} catch (error) {
			console.warn("⚠️ Failed to clean up test data:", error);
			// Don't throw to avoid masking actual test failures
		} finally {
			// await context.close();
		}
	});
});
