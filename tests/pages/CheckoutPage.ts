import { Locator, Page } from '@playwright/test';

export type CustomerDetails = { name: string; address: string };

export class CheckoutPage {
  readonly fullName: Locator;
  readonly address: Locator;
  readonly placeOrderButton: Locator;
  readonly confirmation: Locator;
  readonly orderNumber: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.fullName = page.getByLabel('Full name');
    this.address = page.getByLabel('Address');
    this.placeOrderButton = page.getByRole('button', { name: 'Place order' });
    this.confirmation = page.getByRole('heading', { name: 'Order confirmed' });
    this.orderNumber = page.getByLabel('Order number');
    this.error = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  async placeOrder(details: CustomerDetails): Promise<void> {
    await this.fullName.fill(details.name);
    await this.address.fill(details.address);
    await this.placeOrderButton.click();
  }
}
