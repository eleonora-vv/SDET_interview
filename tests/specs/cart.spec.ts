import { test, expect } from '@fixtures';

test('TC-04: user can add a product to the cart', { tag: ['@e2e', '@smoke'] }, async ({
  user,
  productsPage,
  cartPage,
}) => {
  await productsPage.goto();
  await productsPage.addToCart('Green Cap');

  // No hard waits: these assertions retry until the async update finishes
  await expect(productsPage.cartCount).toHaveText('1');
  await expect(productsPage.notification).toHaveText('Green Cap added to cart');
  await expect(productsPage.notification).toBeHidden();

  await cartPage.goto();
  await expect(cartPage.item('Green Cap')).toBeVisible();
  await expect(cartPage.total).toHaveText('€14.99');
});

test('TC-09: checkout is disabled when the cart is empty', { tag: ['@e2e', '@smoke'] }, async ({
  user,
  cartPage,
}) => {
  // A fresh user has an empty cart by construction: nothing to clean up first
  await cartPage.goto();

  await expect(cartPage.emptyMessage).toBeVisible();
  await expect(cartPage.checkout).toBeDisabled();
});
