import type { Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://gvtlabs2.local";

/**
 * Sign in via Keycloak OAuth flow
 * This navigates through the Keycloak authentication process
 */
export async function signInViaKeycloak(
	page: Page,
	keycloakUsername?: string,
	keycloakPassword?: string,
): Promise<void> {
	const baseURL = BASE_URL;

	// Navigate to sign-in page
	await page.goto("/sign-in");

	// Wait for the page to load
	await page.waitForLoadState("networkidle");

	// Look for Keycloak sign-in button/link
	// The button has class "auth-service" and contains text "Sign in with Keycloak" or "Sign up with Keycloak"
	const keycloakButton = page
		.locator(
			'button.auth-service:has-text("Keycloak"), .auth-service:has-text("Keycloak")',
		)
		.first();

	// Wait for the button to be visible
	await keycloakButton.waitFor({ state: "visible", timeout: 10000 });

	if ((await keycloakButton.count()) === 0) {
		throw new Error("Keycloak sign-in button not found on the page");
	}

	// Click Keycloak sign-in button
	await keycloakButton.click();

	// Wait for redirect to Keycloak
	await page.waitForURL(/keycloak|auth\/keycloak/, { timeout: 10000 });

	// If Keycloak credentials are provided, fill them in
	if (keycloakUsername && keycloakPassword) {
		// Wait for Keycloak login form
		await page.waitForSelector('input[name="username"], input[type="text"]', {
			timeout: 10000,
		});

		// Fill in credentials
		await page.fill(
			'input[name="username"], input[type="text"]',
			keycloakUsername,
		);
		await page.fill(
			'input[name="password"], input[type="password"]',
			keycloakPassword,
		);

		// Submit the form
		await page.click('input[type="submit"], button[type="submit"]');

		// Wait for redirect back to the app
		await page.waitForURL(
			new RegExp(baseURL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
			{ timeout: 15000 },
		);
	} else {
		// If no credentials provided, wait for manual authentication or callback
		console.log(
			"Keycloak authentication page reached. Please authenticate manually or provide credentials.",
		);
		await page.waitForURL(
			new RegExp(baseURL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
			{ timeout: 60000 },
		);
	}

	// Wait for the app to load after authentication
	await page.waitForLoadState("networkidle");
}
