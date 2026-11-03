import { Locator, Page } from '@playwright/test';

export class ProductsPage {
  readonly products: Locator;
  readonly cartCount: Locator;
  readonly notification: Locator;

  constructor(private readonly page: Page) {
    this.products = page.getByRole('article');
    this.cartCount = page.getByLabel('Items in cart');
    this.notification = page.getByRole('status');
  }

  async goto(): Promise<void> {
    await this.page.goto('/products');
  }

  product(name: string): Locator {
    return this.page.getByRole('article', { name, exact: true });
  }

  loggedInAs(name: string): Locator {
    return this.page.getByText(name, { exact: true });
  }

  async addToCart(name: string): Promise<void> {
    await this.product(name).getByRole('button', { name: 'Add to cart' }).click();
  }
}
