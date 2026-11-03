import { Locator, Page } from '@playwright/test';

export class OrdersPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/orders');
  }

  order(orderId: number): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: `#${orderId}`, exact: true }) });
  }

  status(orderId: number): Locator {
    return this.order(orderId).getByRole('cell', { name: /^(Paid|Cancelled)$/ });
  }

  cancelButton(orderId: number): Locator {
    return this.order(orderId).getByRole('button', { name: 'Cancel' });
  }

  async cancel(orderId: number): Promise<void> {
    // The app asks with window.confirm(); Playwright dismisses dialogs unless a handler accepts them
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.cancelButton(orderId).click();
  }
}
