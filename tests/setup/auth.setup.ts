import { test as setup, expect, READER_STATE } from '@fixtures';
import { ShopApi } from '@api/ShopApi';

// Session reuse for tests that only READ data: log in once through the real form,
// save the cookies, and reuse them. Tests that CHANGE data use their own user (`user` fixture).
setup('log in shared read-only user', async ({ page, request, loginPage }) => {
  const reader = await new ShopApi(request).createUser({ name: 'Reader' });

  await loginPage.goto();
  await loginPage.login(reader.email, reader.password);
  await expect(page).toHaveURL(/\/products/);

  await page.context().storageState({ path: READER_STATE });
});
