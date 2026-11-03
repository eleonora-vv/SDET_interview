import { test, expect } from '@fixtures';

// Each test gets its own user and its own paid order, so it can run alone, in parallel and repeatedly.

test('TC-06: placed order is shown in order history', { tag: ['@e2e', '@smoke'] }, async ({
  paidOrder,
  ordersPage,
}) => {
  await ordersPage.goto();

  await expect(ordersPage.order(paidOrder.id)).toBeVisible();
  await expect(ordersPage.status(paidOrder.id)).toHaveText('Paid');
});

test('TC-07: user can cancel a paid order', { tag: ['@e2e', '@smoke'] }, async ({
  paidOrder,
  api,
  ordersPage,
}) => {
  await ordersPage.goto();
  await ordersPage.cancel(paidOrder.id);

  await expect(ordersPage.status(paidOrder.id)).toHaveText('Cancelled');
  await expect(ordersPage.cancelButton(paidOrder.id)).toHaveCount(0);

  // Also check the backend state, not only the UI
  await expect.poll(async () => (await api.getOrders()).find((o) => o.id === paidOrder.id)?.status).toBe('Cancelled');
});
