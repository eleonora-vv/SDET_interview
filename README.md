# QA Automation Interview – reference solution

The same demo app as the candidate repo, with a cleaned-up test framework. See `../INTERVIEWER_GUIDE.md` for what changed and why.

```bash
npm install
npx playwright install chromium
npm test             # all tests
npm run test:smoke   # tests tagged @smoke
npm run typecheck
```

## Conventions

- Import `test` and `expect` only from `@fixtures`.
- Locators: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText`. No test IDs, XPath or CSS. If something can't be found this way, report it as an accessibility bug in the app.
- Page objects hold locators and actions only. Specs hold the assertions.
- Seed and check data through the `api` fixture, which shares the page's cookie. Each data-changing test gets its own `user`.
- Web-first assertions only. No hard waits, no higher timeouts, no retries, no serial mode.
- Titles use `TC-<ID>: <behaviour>` with IDs from `tests/TEST_PLAN.md`. Tags go on `test()`: a level (`@e2e` or `@api`) plus `@smoke`.
- Strict TypeScript, no `any`, no non-null assertions.
- Before calling a change done: `npm run typecheck` and the affected test with `--repeat-each=20`.

## Layout

```
app/                    demo application
tests/
  TEST_PLAN.md          test case IDs
  api/ShopApi.ts        API client for seeding and checking data
  fixtures/index.ts     test, expect, api, user, newUser, paidOrder, page-object fixtures
  pages/                page objects
  setup/auth.setup.ts   logs in a read-only user once and saves the session
  specs/                test specs
playwright.config.ts
```
