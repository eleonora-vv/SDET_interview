import { test, expect } from '@fixtures';

test('TC-01: user can log in with valid credentials', { tag: ['@e2e', '@smoke'] }, async ({
  page,
  loginPage,
  productsPage,
  newUser,
}) => {
  await loginPage.goto();
  await loginPage.login(newUser.email, newUser.password);

  await expect(page).toHaveURL(/\/products/);
  await expect(productsPage.loggedInAs(newUser.name)).toBeVisible();
});

// One UI test checks that the error is wired up and displayed...
test('TC-02: wrong password shows an error', { tag: ['@e2e', '@smoke'] }, async ({ page, loginPage, newUser }) => {
  await loginPage.goto();
  await loginPage.login(newUser.email, 'wrong-password');

  await expect(loginPage.error).toHaveText('Invalid email or password');
  await expect(page).toHaveURL(/\/login/);
});

// ...and the many invalid variants are pushed down to the API layer: fast, no browser.
const invalidPasswords = ['wrong', '', ' ', 'PASSWORD123!', 'Password123'];

for (const password of invalidPasswords) {
  test(`TC-03: login API rejects password "${password}"`, { tag: ['@api', '@smoke'] }, async ({
    request,
    newUser,
  }) => {
    const res = await request.post('/api/login', { data: { email: newUser.email, password } });

    expect(res.status()).toBe(401);
  });
}
