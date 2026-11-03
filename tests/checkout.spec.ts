import { test, expect } from '@playwright/test';
import { ProductsPage } from '../pages/ProductsPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrdersPage } from '../pages/OrdersPage';
import { login } from '../utils/helpers';
import { CUSTOMER } from '../utils/testData';

let orderId: string | null;

test.describe.serial('Checkout', () => {
  test('TC-05: user can place an order', { tag: ['@e2e', '@smoke'] }, async ({ page }) => {
    await login(page);

    const productsPage = new ProductsPage(page);
    await productsPage.open();
    await productsPage.addToCart('Blue T-Shirt');
    await page.waitForTimeout(1000);

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.open();
    orderId = await checkoutPage.placeOrder(CUSTOMER.name, CUSTOMER.address);

    expect(orderId).toBeTruthy();
  });

  test('TC-06: placed order is shown in order history', { tag: ['@e2e', '@smoke'] }, async ({ page }) => {
    await login(page);

    const ordersPage = new OrdersPage(page);
    await ordersPage.open();

    expect(await ordersPage.isOrderVisible(orderId)).toBe(true);
  });
});
