import { test, expect, READER_STATE } from '@fixtures';

// Read-only test: reuses the session saved by the setup project, no login per test
test.use({ storageState: READER_STATE });

test('TC-08: product list is shown after loading', { tag: ['@e2e', '@smoke'] }, async ({ productsPage }) => {
  await productsPage.goto();

  // Web-first assertions retry until the lazy-loaded products appear
  await expect(productsPage.products).toHaveCount(4);
  await expect(productsPage.product('Blue T-Shirt')).toContainText('€19.99');
});
