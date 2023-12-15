import { expect, test } from '@playwright/test';

test.describe('map page test', () => {
	test('map page has one expected map container', async ({ page }) => {
		await page.goto('/admin/map/zones');
		const mapContainer = page.locator('.map');
		expect(mapContainer).toBeTruthy();
		await expect(mapContainer).toHaveCount(1);
	});
});
