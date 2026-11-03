import { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly total: Locator;
  readonly checkout: Locator;
  readonly emptyMessage: Locator;

  constructor(private readonly page: Page) {
    this.total = page.getByLabel('Cart total');
    this.checkout = page.getByRole('button', { name: 'Checkout' });
    this.emptyMessage = page.getByText('Your cart is empty');
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart');
  }

  item(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name, exact: true }) });
  }
}
