import { expect, test } from '@playwright/test';

test.describe('map page test', () => {
	test('map page has one expected map container', async ({ page }) => {
		await page.goto('/admin/map');
		const mapContainer = page.locator('.map');
		await expect(mapContainer).toBeTruthy();
		await expect(mapContainer).toHaveCount(1);
	});
});
