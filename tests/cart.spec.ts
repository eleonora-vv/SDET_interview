import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { login } from '../utils/helpers';

test('TC-04: user can add a product to the cart', { tag: ['@e2e', '@smoke'] }, async ({ page }) => {
  await login(page);

  const productsPage = new ProductsPage(page);
  await productsPage.open();
  const before = await productsPage.getCartCount();

  await productsPage.addToCart('Green Cap');
  await page.waitForTimeout(1000); // cart badge updates a bit later

  expect(await productsPage.getCartCount()).toBe(before + 1);
});
