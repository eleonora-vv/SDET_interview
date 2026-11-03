import { test as base } from '@playwright/test';
import { ShopApi, TestUser, Order } from '@api/ShopApi';
import { LoginPage } from '@pages/LoginPage';
import { ProductsPage } from '@pages/ProductsPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutPage } from '@pages/CheckoutPage';
import { OrdersPage } from '@pages/OrdersPage';

type Fixtures = {
  /** API client that shares the page's cookie (logged in as the page is). */
  api: ShopApi;
  /** A brand-new user, NOT logged in. Deleted after the test. */
  newUser: TestUser;
  /** A brand-new user, logged in on `page` via the API. Own cart and orders, safe in parallel. */
  user: TestUser;
  /** A paid order belonging to `user`, created through the API. */
  paidOrder: Order;

  loginPage: LoginPage;
  productsPage: ProductsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  ordersPage: OrdersPage;
};

export const test = base.extend<Fixtures>({
  api: async ({ page }, use) => {
    await use(new ShopApi(page.request));
  },

  newUser: async ({ request }, use) => {
    const admin = new ShopApi(request);
    const created = await admin.createUser();
    await use(created);
    await admin.deleteUser(created.id);
  },

  user: async ({ newUser, api }, use) => {
    await api.login(newUser);
    await use(newUser);
  },

  paidOrder: async ({ request, user }, use) => {
    await use(await new ShopApi(request).createPaidOrder(user.id, [2]));
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  productsPage: async ({ page }, use) => use(new ProductsPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  ordersPage: async ({ page }, use) => use(new OrdersPage(page)),
});

export { expect } from '@playwright/test';

/** Saved session of the shared read-only user (written by tests/setup/auth.setup.ts). */
export const READER_STATE = '.auth/reader.json';
