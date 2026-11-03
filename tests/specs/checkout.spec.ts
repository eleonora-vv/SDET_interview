import { test, expect } from '@fixtures';

const customer = { name: 'Jan Jansen', address: 'Damrak 1, Amsterdam' };

test('TC-05: user can place an order and sees a confirmation', { tag: ['@e2e', '@smoke'] }, async ({
  user,
  api,
  cartPage,
  checkoutPage,
}) => {
  await api.addToCart(1); // seed through the API, not the UI

  await cartPage.goto();
  await cartPage.checkout.click();
  await checkoutPage.placeOrder(customer);

  // Waits through "Processing payment…" without a hard wait
  await expect(checkoutPage.confirmation).toBeVisible();
  await expect(checkoutPage.orderNumber).toHaveText(/^\d+$/);
});

test('TC-10: checkout requires name and address', { tag: ['@e2e', '@smoke'] }, async ({
  user,
  api,
  checkoutPage,
}) => {
  await api.addToCart(1);

  await checkoutPage.goto();
  await checkoutPage.placeOrder({ name: customer.name, address: '' });

  await expect(checkoutPage.error).toHaveText('Name and address are required');
});
