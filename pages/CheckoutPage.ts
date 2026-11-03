import { Page } from '@playwright/test';
import { BASE_URL } from '../utils/testData';

export class CheckoutPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto(BASE_URL + '/checkout');
  }

  async placeOrder(name: string, address: string): Promise<string | null> {
    await this.page.fill('#name', name);
    await this.page.fill('#address', address);
    await this.page.click('#place-order');
    await this.page.waitForTimeout(2000);
    return await this.page.textContent('#order-id');
  }
}
