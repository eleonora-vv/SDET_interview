import { Page } from '@playwright/test';
import { BASE_URL } from '../utils/testData';

export class ProductsPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto(BASE_URL + '/products');
  }

  async addToCart(productName: string) {
    await this.page.locator('.product-card', { hasText: productName }).locator('button').click();
  }

  async getCartCount(): Promise<number> {
    const text = await this.page.textContent('#cart-count');
    return Number(text);
  }
}
