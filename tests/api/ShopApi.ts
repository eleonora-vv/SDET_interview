import { APIRequestContext, APIResponse } from '@playwright/test';

async function ensureOk(res: APIResponse, action: string): Promise<void> {
  if (!res.ok()) throw new Error(`${action} failed: ${res.status()} ${await res.text()}`);
}

export type TestUser = { id: number; email: string; password: string; name: string };
export type OrderStatus = 'Paid' | 'Cancelled';
export type Order = { id: number; total: number; status: OrderStatus };

/**
 * Wrapper around the app API for seeding and checking data.
 * Data created through the API goes through the app's own logic (e.g. an order gets its payment record),
 * so it is realistic, and it is much faster than clicking through the UI.
 */
export class ShopApi {
  constructor(private readonly request: APIRequestContext) {}

  async createUser(overrides: Partial<Omit<TestUser, 'id'>> = {}): Promise<TestUser> {
    const res = await this.request.post('/api/test/users', { data: overrides });
    await ensureOk(res, 'create test user');
    return (await res.json()) as TestUser;
  }

  async deleteUser(id: number): Promise<void> {
    await this.request.delete(`/api/test/users/${id}`);
  }

  /** When this wraps `page.request`, the browser page shares the session cookie. */
  async login(user: Pick<TestUser, 'email' | 'password'>): Promise<void> {
    const res = await this.request.post('/api/login', { data: user });
    await ensureOk(res, 'API login');
  }

  async addToCart(productId: number): Promise<void> {
    const res = await this.request.post('/api/cart', { data: { productId } });
    await ensureOk(res, 'add to cart');
  }

  async createPaidOrder(userId: number, productIds: number[] = [1]): Promise<Order> {
    const res = await this.request.post('/api/test/orders', { data: { userId, productIds } });
    await ensureOk(res, 'create paid order');
    return (await res.json()) as Order;
  }

  async getOrders(): Promise<Order[]> {
    const res = await this.request.get('/api/orders');
    await ensureOk(res, 'get orders');
    return (await res.json()) as Order[];
  }
}
