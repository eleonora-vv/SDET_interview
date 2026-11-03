import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { USER, INVALID_PASSWORDS } from '../utils/testData';

test('TC-01: user can log in with valid credentials', { tag: ['@e2e', '@smoke'] }, async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(USER.email, USER.password);
  await loginPage.verifyUserIsLoggedIn();
});

test('TC-02: login is rejected for invalid passwords', { tag: ['@e2e', '@smoke'] }, async ({ page }) => {
  const loginPage = new LoginPage(page);
  for (const password of INVALID_PASSWORDS) {
    await loginPage.open();
    await loginPage.login(USER.email, password);
    expect(await loginPage.getErrorText()).toBe('Invalid email or password');
  }
});
