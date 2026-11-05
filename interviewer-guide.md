# Interviewer Guide – Playwright + TypeScript (90 minutes)

Share the repository from `main` branch with the candidate during live interview. Keep this guide and `solution/` to yourself.

Topics covered: architecture, data management, session management, page objects and locators, and auto-waiting.

---

## 1. Before the interview

1. Run `npm install`, then `npx playwright install chromium`, then `npm test`.
   Expected result: **5 passed, 1 failed (TC-07)**. The failure is intentional.
2. Share your screen with the assignment.
3. Keep `solution/` open on your side. It follows the team conventions listed in section 6. It has 14 tests plus a setup step, all green, verified with `--repeat-each=20`.

## 2. Plan

- **0–5 min:** Intro, walk through the README
- **5–30 min:** **Code review.** The candidate reads the code and talks through it; you tick issues off section 3
- **30–70 min:** **Hands-on.** Exercises E1, E2, E3 (section 4)
- **70–85 min:** **Discussion** (section 5)
- **85–90 min:** The candidate's questions

Let them talk for about 10 minutes before you steer. Use the hint for each issue in section 3 only if they skip a topic completely.

---

## 3. The 12 planted issues

Level is who should spot it: **J** junior, **M** mid, **S** senior.

1. **Architecture** (J) – `utils/testData.ts`, page objects
   - Issue: URL hard-coded as `BASE_URL + '/login'`, no `baseURL` in config
   - Why it matters: Can't run against staging or CI environments
   - Hint: "How would you run this against staging?"
2. **Architecture** (M) – `playwright.config.ts`
   - Issue: `retries: 2`
   - Why it matters: Hides flaky tests, and a real failure takes 3× as long
   - Hint: "What does a retry tell you?"
3. **Locators** (J) – `LoginPage`, `OrdersPage`, `CheckoutPage`
   - Issue: XPath (`//*[@id="login-form"]/label[2]/input`, `td[3]`), CSS classes (`.btn.btn-primary`), ids, string selectors with `page.fill/click`
   - Why it matters: Brittle when markup or styling changes. Expected: `getByLabel`, `getByRole`, `Locator`
   - Hint: "What happens if a designer changes the button class?"
4. **Page objects** (M) – `LoginPage.verifyUserIsLoggedIn`
   - Issue: Assertion inside a page object
   - Why it matters: Mixes responsibilities. A good candidate gives an opinion and a reason
   - Hint: "Where should assertions live?"
5. **Auto-waiting** (J) – login, checkout, cart, orders
   - Issue: `waitForTimeout` of 1–3 s
   - Why it matters: Slow (about 4 s per login) and still not reliable
   - Hint: "Why 3 seconds?"
6. **Auto-waiting** (M) – `getCartCount`, `getErrorText`, `isOrderVisible`, `page.url()`
   - Issue: Reads a value once (`textContent`, `isVisible`) and then calls `expect(value)`
   - Why it matters: No retry; passes only because of the hard waits. Expected: `await expect(locator).toHaveText()`
   - Hint: "What if the badge updates 100 ms later?"
7. **Auto-waiting** (M/S) – `OrdersPage.cancelOrder`
   - Issue: The `confirm()` dialog is never handled
   - Why it matters: Playwright dismisses dialogs by default, so nothing is cancelled. **This is why TC-07 fails**
   - Hint: Exercise E1
8. **Session** (M) – `utils/helpers.ts`
   - Issue: Every test logs in through the UI
   - Why it matters: Slow, and re-tests login everywhere. Expected: `storageState` or API login
   - Hint: "6 tests take about 45 s. Where does the time go?"
9. **Data** (S) – `utils/testData.ts`
   - Issue: One shared admin user, with credentials committed to the repo
   - Why it matters: Tests running in parallel use the same cart (TC-04 counts items while TC-05 adds some)
   - Hint: "What happens when 4 workers run at once?"
10. **Data** (S) – `orders.spec.ts`
    - Issue: Hard-coded seed `ORDER_ID = 1001`
    - Why it matters: Can only pass once per app start. Reruns and parallel runs fail
    - Hint: Exercise E1 follow-up
11. **Architecture / data** (M) – `checkout.spec.ts`
    - Issue: `describe.serial` with a shared `let orderId`
    - Why it matters: TC-06 can't run alone, and one failure skips the rest
    - Hint: "Can you run TC-06 on its own?"
12. **Test layers** (M) – `login.spec.ts`
    - Issue: TC-02 loops 6 invalid passwords through the UI
    - Why it matters: Slow, and stops at the first failure. Belongs at API level; keep 1 UI test. (TEST_PLAN already lists TC-03 as an API test)
    - Hint: "Look at TEST_PLAN. Which layer is TC-03?"

**Benchmark for the review:** junior finds 3–5, mostly #1, #3 and #5. Mid finds 6–9 and explains why. Senior finds 10 or more, groups them by theme, and says what to fix first. Strong answer: data isolation and waiting before cosmetics.

---

## 4. Hands-on exercises (40 minutes)

The candidate can use the docs. Watch **how** they work (reading errors, using the trace) more than how fast.

### E1 – Debug the failing test (10 min) · auto-waiting, debugging
> "TC-07 fails. Find out why and fix it."

- **Good process:** run only that test, open the report, rerun with `--ui`, `--debug` or `--trace on`, and spot the dialog.
- **Fix:** add `page.once('dialog', d => d.accept())` before the click. Replace `waitForTimeout` plus `getOrderStatus` with `await expect(statusCell).toHaveText('Cancelled')`.
- **Follow-up (leads into E3):** start the app with `npm run app` and run the fixed test twice. The second run fails. Ask: *"Why? How do you make it repeatable?"*

### E2 – Rewrite `LoginPage` and fix TC-04 (15 min) · page objects, locators, auto-waiting
> "Rewrite the login page object the way you'd want it, then make TC-04 reliable without any hard wait."

Expect:
- `readonly` `Locator` fields using `getByLabel('Email')`, `getByLabel('Password')`, `getByRole('button', { name: 'Log in' })` and `getByRole('alert')`
- `goto()` with a relative path after adding `baseURL`
- no assertions or waits in the page object
- in TC-04: `await expect(page.getByLabel('Items in cart')).toHaveText('1')` and the product found with `getByRole('article', { name: 'Green Cap' })`

Ask:
- *"Why does `expect(await locator.textContent()).toBe('1')` fail, while `await expect(locator).toHaveText('1')` passes?"*
- *"What does Playwright check before it clicks?"* (attached, visible, stable, enabled, receives events)
- *"The element has no accessible name. What do you do?"* Strong answer: raise it as an accessibility bug with the developers, rather than reaching for XPath.

Reference: `solution/tests/pages/LoginPage.ts`, `solution/tests/specs/cart.spec.ts`.

### E3 – Own data and session for TC-07 (15 min) · data management, session management, fixtures
> "Make TC-07 independent of the admin user and order 1001, so it runs in parallel and repeatedly. Avoid logging in through the UI."

Expect a custom fixture that:
1. creates a user with `POST /api/test/users`
2. logs in with `page.request.post('/api/login')`, which shares cookies with the page
3. creates a paid order with `POST /api/test/orders`
4. deletes the user in teardown

Ask:
- *"Why use the API instead of inserting rows straight into the database?"* The API runs the app's logic, so the data is realistic (for example, the order gets its payment record).
- *"Test-scoped or worker-scoped fixture?"* Test-scoped, because the test changes the data.
- *"When would you use a saved `storageState` instead?"* For read-only tests with a shared user. A setup project logs in once through the real form.
- *"Where do credentials come from in CI?"* Environment variables or secrets; `.auth/` is listed in `.gitignore`.

Reference: `solution/tests/fixtures/index.ts`, `solution/tests/api/ShopApi.ts`, `solution/tests/specs/orders.spec.ts`, `solution/tests/setup/auth.setup.ts`.

**Spare exercise** if someone is fast: *"Remove `describe.serial` from TC-05/TC-06."* Expected: TC-06 creates its own order through the API (see `solution/tests/specs/orders.spec.ts`).

---

## 5. Discussion (15 minutes, pick 4–5)

- **Architecture:** "This suite will grow to 300 tests. How do you organise folders, fixtures and page objects?" Strong: fixtures provide page objects and data; page objects hold locators and actions; specs assert.
- **Architecture:** "How would you run this in CI?" Strong: on every PR, `@smoke` tag, sharding, HTML report and traces as artifacts, `forbidOnly`, no retries to hide flakes.
- **Flaky tests:** "A test fails 1 in 20 runs. What do you do?" Strong: reproduce with `--repeat-each`, check the trace, fix the root cause, quarantine with a tag if needed. Not "add a retry or raise the timeout".
- **Test layers:** "What would you do with TC-02?" Strong: move the variants to the API (TC-03), keep one UI test.
- **Data:** "Generated or static test data? How do you clean up, and what if cleanup fails?"
- **Session:** "How do you test admin and customer roles in one suite?" Strong: one `storageState` per role, or separate fixtures.
- **Team:** "What would you ask the 3 developers for?" Strong: accessible labels and roles, a test-only API or seed data behind a flag, a stable test environment.

---

## 6. Standard the solution follows

Use this list to judge the candidate's changes. Optionally, hand it to them before E2 and E3.

- `test` and `expect` are imported only from the fixture file (`@fixtures`).
- Locators in order: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText`. No test IDs, XPath or CSS. Missing accessible names are reported to the developers as bugs.
- Page objects hold locators and actions only. Specs own the assertions.
- Data is seeded and checked through the `api` fixture. Each test that changes data has its own user.
- Web-first assertions only. No hard waits, no higher timeouts, no retries, no serial mode.
- Titles follow `TC-<ID>: <behaviour>` with IDs from the test plan. Tags go on `test()`: `@e2e` or `@api`, plus `@smoke`.
- Strict TypeScript, no `any`, no non-null assertions.
- A change counts as done only after a typecheck and `--repeat-each=20` on the affected test.

---

**Red flags:**
- Fixes flakiness with retries or higher timeouts
- Defends hard waits
- Never notices the shared user or data
- Rewrites everything without explaining priorities

---

## 8. Solution files

- `playwright.config.ts`: `baseURL` from env, no retries, trace and screenshot on failure, setup project, test routes enabled via env
- `tests/api/ShopApi.ts`: Typed API client for seeding
- `tests/fixtures/index.ts`: `api` (shares the page's cookie), `newUser`, `user` (logged in through the API), `paidOrder`, page-object fixtures
- `tests/pages/*`: Role and label locators, no assertions, dialog handling
- `tests/setup/auth.setup.ts` + `specs/products.spec.ts`: `storageState` reuse for read-only tests
- `tests/specs/login.spec.ts`: 2 UI tests, with the invalid-password variants pushed down to the API (TC-03)
- `tests/specs/cart.spec.ts`: Web-first assertions; notification appears and disappears
- `tests/specs/checkout.spec.ts`: Independent tests seeded through the API
- `tests/specs/orders.spec.ts`: Own order per test; checks the UI and the backend

**Verified:**
- typecheck passes
- with 4 workers and `--repeat-each=20`: **281 of 281 passed** (14 tests × 20, plus setup)
