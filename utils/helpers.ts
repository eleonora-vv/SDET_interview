import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { USER } from './testData';

// Logs in the default user. Call this at the start of every test.
export async function login(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(USER.email, USER.password);
}
