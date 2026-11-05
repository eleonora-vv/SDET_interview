# Test plan – Demo Shop

Test titles use `TC-<ID>: <behaviour>` with the IDs below. Not every ID is automated yet.

- **TC-01** (e2e): User can log in with valid credentials
- **TC-02** (e2e): Wrong password shows an error on the login form
- **TC-03** (api): Login API rejects invalid passwords (several variants)
- **TC-04** (e2e): User can add a product to the cart
- **TC-05** (e2e): User can place an order and sees a confirmation
- **TC-06** (e2e): Placed order is shown in order history
- **TC-07** (e2e): User can cancel a paid order
- **TC-08** (e2e): Product list is shown after loading
- **TC-09** (e2e): Checkout is disabled when the cart is empty
- **TC-10** (e2e): Checkout requires name and address
