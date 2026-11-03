import { test, expect } from '@playwright/test';
import { OrdersPage } from '../pages/OrdersPage';
import { login } from '../utils/helpers';
import { ORDER_ID } from '../utils/testData';

test('TC-07: user can cancel a paid order', { tag: ['@e2e', '@smoke'] }, async ({ page }) => {
  await login(page);

  const ordersPage = new OrdersPage(page);
  await ordersPage.open();
  await ordersPage.cancelOrder(ORDER_ID);
  await page.waitForTimeout(2000);

  expect(await ordersPage.getOrderStatus(ORDER_ID)).toBe('Cancelled');
});
