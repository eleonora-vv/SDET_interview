# QA Automation Interview – Playwright + TypeScript

This repository contains a small demo web shop (`app/`) and a Playwright test framework that tests it.
A previous team member wrote the framework quickly. It "mostly works", but the team says it is slow,
sometimes flaky, and hard to extend.

In the interview you will **review it as if it were a pull request**, explain what you would change and why,
and do a few small hands-on exercises together with the interviewer.
You may use the [Playwright documentation](https://playwright.dev/docs/intro) at any time.

## Setup

Requirements: Node.js 18 or newer.

```bash
npm install
npx playwright install chromium
npm test        # runs the tests and starts the demo app automatically
npm run app     # optional: start the app yourself at http://localhost:3000
```

One test currently fails. That is expected.

## The application

| Page | What it does |
|---|---|
| `/login` | Log in. Default user: `admin@shop.test` / `Admin123!` |
| `/products` | Product list, loaded with a short delay. "Add to cart" updates the cart badge and shows a short notification |
| `/cart` | Cart items, total and "Checkout". Checkout is disabled when the cart is empty |
| `/checkout` | Name and address form. "Place order" processes the payment, then shows "Order confirmed" |
| `/orders` | Order history. Paid orders can be cancelled after a confirmation dialog |

Data is kept in memory and resets when the app restarts.

### API (useful for test setup)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/login` | `{ email, password }` → sets the session cookie |
| GET / POST / DELETE | `/api/cart` | Read the cart / add `{ productId }` / empty the cart |
| GET | `/api/orders` | Orders of the logged-in user |
| POST | `/api/test/users` | Create a user `{ email?, password?, name? }` → returns the user with its password |
| DELETE | `/api/test/users/:id` | Delete a user and their data |
| POST | `/api/test/orders` | Create a paid order `{ userId, productIds }` |
| POST | `/api/test/reset` | Reset all data |

`/api/test/*` routes only work when the app runs with `ENABLE_TEST_ROUTES=true`. The Playwright config already sets this.

## Project structure

```
app/            demo application (not part of the review)
pages/          page objects
tests/          test specs
utils/          test data and helpers
TEST_PLAN.md    test case IDs used in test titles
playwright.config.ts
```
