import { Page } from '@playwright/test';
import { BASE_URL } from '../utils/testData';

export class OrdersPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto(BASE_URL + '/orders');
  }

  async isOrderVisible(orderId: string | null): Promise<boolean> {
    return await this.page.isVisible(`//tr[@data-order-id="${orderId}"]`);
  }

  async cancelOrder(orderId: number) {
    await this.page.click(`//tr[@data-order-id="${orderId}"]//button`);
  }

  async getOrderStatus(orderId: number) {
    return await this.page.textContent(`//tr[@data-order-id="${orderId}"]/td[3]`);
  }
}
