# Test plan – Demo Shop

Test titles use `TC-<ID>: <behaviour>` with the IDs below. Not every ID is automated yet.

| ID | Behaviour | Level |
|---|---|---|
| TC-01 | User can log in with valid credentials | e2e |
| TC-02 | Wrong password shows an error on the login form | e2e |
| TC-03 | Login API rejects invalid passwords (several variants) | api |
| TC-04 | User can add a product to the cart | e2e |
| TC-05 | User can place an order and sees a confirmation | e2e |
| TC-06 | Placed order is shown in order history | e2e |
| TC-07 | User can cancel a paid order | e2e |
| TC-08 | Product list is shown after loading | e2e |
| TC-09 | Checkout is disabled when the cart is empty | e2e |
| TC-10 | Checkout requires name and address | e2e |
