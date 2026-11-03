import { Page, expect } from '@playwright/test';
import { BASE_URL } from '../utils/testData';

export class LoginPage {
  emailInput = '//input[@id="email"]';
  passwordInput = '//*[@id="login-form"]/label[2]/input';
  loginButton = '.btn.btn-primary';
  errorMessage = '#login-error';

  constructor(private page: Page) {}

  async open() {
    await this.page.goto(BASE_URL + '/login');
  }

  async login(email: string, password: string) {
    await this.page.fill(this.emailInput, email);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.loginButton);
    await this.page.waitForTimeout(3000);
  }

  async getErrorText() {
    return await this.page.textContent(this.errorMessage);
  }

  async verifyUserIsLoggedIn() {
    expect(this.page.url()).toContain('/products');
  }
}
