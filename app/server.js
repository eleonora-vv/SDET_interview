// Tiny demo shop used as the "system under test".
// Everything is in memory: restart the server to reset data (or POST /api/test/reset).
// Some responses are delayed on purpose so auto-waiting behaviour can be discussed.

const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// In-memory data
// ---------------------------------------------------------------------------
const PRODUCTS = [
  { id: 1, name: 'Blue T-Shirt', price: 19.99 },
  { id: 2, name: 'Red Hoodie', price: 49.99 },
  { id: 3, name: 'Green Cap', price: 14.99 },
  { id: 4, name: 'Black Sneakers', price: 89.99 },
];

let db;
function seed() {
  db = {
    nextUserId: 2,
    nextOrderId: 1002,
    users: [{ id: 1, email: 'admin@shop.test', password: 'Admin123!', name: 'Admin' }],
    sessions: new Map(), // token -> userId
    carts: new Map(), // userId -> [{ productId, qty }]
    orders: [
      {
        id: 1001,
        userId: 1,
        items: [{ productId: 2, qty: 1 }],
        total: 49.99,
        status: 'Paid',
        payment: { method: 'card', amount: 49.99 },
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
seed();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((c) => {
    const [k, ...v] = c.trim().split('=');
    if (k) out[k] = decodeURIComponent(v.join('='));
  });
  return out;
}
function currentUser(req) {
  const sid = parseCookies(req).sid;
  const userId = sid && db.sessions.get(sid);
  return userId ? db.users.find((u) => u.id === userId) : undefined;
}
function requireApiUser(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  req.user = user;
  next();
}
function requirePageUser(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.redirect('/login');
  req.user = user;
  next();
}
function cartOf(userId) {
  if (!db.carts.has(userId)) db.carts.set(userId, []);
  return db.carts.get(userId);
}
function cartView(userId) {
  const items = cartOf(userId).map((i) => {
    const p = PRODUCTS.find((x) => x.id === i.productId);
    return { productId: p.id, name: p.name, price: p.price, qty: i.qty };
  });
  const total = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
  const count = items.reduce((s, i) => s + i.qty, 0);
  return { items, total, count };
}
function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name };
}
function createOrder(userId, items) {
  const total =
    Math.round(
      items.reduce((s, i) => s + PRODUCTS.find((p) => p.id === i.productId).price * i.qty, 0) * 100
    ) / 100;
  const order = {
    id: db.nextOrderId++,
    userId,
    items,
    total,
    status: 'Paid',
    payment: { method: 'card', amount: total },
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  return order;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
app.post('/api/login', async (req, res) => {
  await delay(400);
  const { email, password } = req.body || {};
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const token = crypto.randomUUID();
  db.sessions.set(token, user.id);
  res.setHeader('Set-Cookie', `sid=${token}; Path=/; HttpOnly; SameSite=Lax`);
  res.json(publicUser(user));
});

app.post('/api/logout', (req, res) => {
  const sid = parseCookies(req).sid;
  if (sid) db.sessions.delete(sid);
  res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/me', requireApiUser, (req, res) => res.json(publicUser(req.user)));

app.get('/api/products', async (req, res) => {
  await delay(1000); // slow on purpose: products are "lazy loaded"
  res.json(PRODUCTS);
});

app.get('/api/cart', requireApiUser, (req, res) => res.json(cartView(req.user.id)));

app.post('/api/cart', requireApiUser, async (req, res) => {
  await delay(700); // slow on purpose
  const productId = Number(req.body.productId);
  if (!PRODUCTS.find((p) => p.id === productId)) return res.status(404).json({ error: 'Unknown product' });
  const cart = cartOf(req.user.id);
  const line = cart.find((i) => i.productId === productId);
  if (line) line.qty += 1;
  else cart.push({ productId, qty: 1 });
  res.json(cartView(req.user.id));
});

app.delete('/api/cart/:productId', requireApiUser, (req, res) => {
  const id = Number(req.params.productId);
  db.carts.set(req.user.id, cartOf(req.user.id).filter((i) => i.productId !== id));
  res.json(cartView(req.user.id));
});

app.delete('/api/cart', requireApiUser, (req, res) => {
  db.carts.set(req.user.id, []);
  res.json(cartView(req.user.id));
});

app.post('/api/orders', requireApiUser, async (req, res) => {
  await delay(1500); // "payment processing"
  const { name, address } = req.body || {};
  if (!name || !address) return res.status(400).json({ error: 'Name and address are required' });
  const cart = cartOf(req.user.id);
  if (!cart.length) return res.status(400).json({ error: 'Cart is empty' });
  const order = createOrder(req.user.id, cart.map((i) => ({ ...i })));
  db.carts.set(req.user.id, []);
  res.status(201).json(order);
});

app.get('/api/orders', requireApiUser, (req, res) =>
  res.json(db.orders.filter((o) => o.userId === req.user.id))
);

app.post('/api/orders/:id/cancel', requireApiUser, async (req, res) => {
  await delay(800);
  const order = db.orders.find((o) => o.id === Number(req.params.id) && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'Paid') return res.status(409).json({ error: `Order is already ${order.status}` });
  order.status = 'Cancelled';
  res.json(order);
});

// ---- Test-only endpoints: only available when ENABLE_TEST_ROUTES=true --------
app.use('/api/test', (req, res, next) =>
  process.env.ENABLE_TEST_ROUTES === 'true' ? next() : res.status(404).json({ error: 'Test routes are disabled' })
);
app.post('/api/test/users', (req, res) => {
  const body = req.body || {};
  const email = body.email || `user-${crypto.randomUUID().slice(0, 8)}@shop.test`;
  if (db.users.find((u) => u.email === email)) return res.status(409).json({ error: 'Email already exists' });
  const user = {
    id: db.nextUserId++,
    email,
    password: body.password || 'Password123!',
    name: body.name || 'Test User',
  };
  db.users.push(user);
  res.status(201).json({ ...publicUser(user), password: user.password });
});

app.delete('/api/test/users/:id', (req, res) => {
  const id = Number(req.params.id);
  db.users = db.users.filter((u) => u.id !== id);
  db.orders = db.orders.filter((o) => o.userId !== id);
  db.carts.delete(id);
  for (const [token, uid] of db.sessions) if (uid === id) db.sessions.delete(token);
  res.status(204).end();
});

// Creates a complete, already-paid order for a user (same logic as a real checkout).
app.post('/api/test/orders', (req, res) => {
  const { userId, productIds } = req.body || {};
  if (!db.users.find((u) => u.id === Number(userId))) return res.status(404).json({ error: 'Unknown user' });
  const items = (productIds || [1]).map((id) => ({ productId: Number(id), qty: 1 }));
  res.status(201).json(createOrder(Number(userId), items));
});

app.post('/api/test/reset', (req, res) => {
  seed();
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------
const styles = `
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; margin: 0; background: #f6f7f9; color: #1d1f23; }
  header { background: #1d1f23; color: #fff; padding: 12px 24px; display: flex; gap: 20px; align-items: center; }
  header a { color: #fff; text-decoration: none; }
  header .spacer { flex: 1; }
  main { max-width: 860px; margin: 24px auto; padding: 0 16px; }
  .btn { background: #2f6fed; color: #fff; border: 0; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 14px; }
  .btn[disabled] { background: #9aa4b5; cursor: not-allowed; }
  .btn.secondary { background: #e4e7ec; color: #1d1f23; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
  .product-card { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,.08); }
  .product-card h3 { margin: 0 0 6px; font-size: 16px; }
  form { background: #fff; padding: 20px; border-radius: 8px; max-width: 360px; display: grid; gap: 12px; }
  label { display: grid; gap: 4px; font-size: 14px; }
  input { padding: 8px; border: 1px solid #c8ccd4; border-radius: 6px; font-size: 14px; }
  .error { color: #c62828; font-size: 14px; }
  .badge { background: #e53935; border-radius: 10px; padding: 1px 7px; font-size: 12px; margin-left: 4px; }
  .toast { position: fixed; bottom: 20px; right: 20px; background: #1d1f23; color: #fff; padding: 10px 16px; border-radius: 6px; }
  table { width: 100%; background: #fff; border-collapse: collapse; border-radius: 8px; }
  td, th { padding: 10px; border-bottom: 1px solid #eceef2; text-align: left; }
  .spinner { color: #6b7280; }
`;

function layout(title, body, user) {
  const nav = user
    ? `<header>
        <strong>Demo Shop</strong>
        <a href="/products">Products</a>
        <a href="/cart">Cart <span class="badge" id="cart-count" aria-label="Items in cart">${cartView(user.id).count}</span></a>
        <a href="/orders">Orders</a>
        <span class="spacer"></span>
        <span id="user-name">${user.name}</span>
        <button class="btn secondary" id="logout">Log out</button>
      </header>`
    : `<header><strong>Demo Shop</strong></header>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title} – Demo Shop</title>
  <style>${styles}</style></head><body>${nav}<main>${body}</main>
  <script>
    const lo = document.getElementById('logout');
    if (lo) lo.onclick = async () => { await fetch('/api/logout', { method: 'POST' }); location.href = '/login'; };
    function toast(msg) {
      const t = document.createElement('div');
      t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2500);
    }
  </script></body></html>`;
}

app.get('/', (req, res) => res.redirect(currentUser(req) ? '/products' : '/login'));

app.get('/login', (req, res) => {
  res.send(
    layout(
      'Log in',
      `<h1>Log in</h1>
      <form id="login-form" novalidate>
        <label>Email <input id="email" name="email" type="email" autocomplete="username"></label>
        <label>Password <input id="pass" name="password" type="password" autocomplete="current-password"></label>
        <div class="error" role="alert" id="login-error"></div>
        <button class="btn btn-primary" type="submit">Log in</button>
      </form>
      <script>
        document.getElementById('login-form').onsubmit = async (e) => {
          e.preventDefault();
          const err = document.getElementById('login-error');
          err.textContent = '';
          const r = await fetch('/api/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value, password: pass.value })
          });
          if (r.ok) location.href = '/products';
          else err.textContent = (await r.json()).error;
        };
      </script>`
    )
  );
});

app.get('/products', requirePageUser, (req, res) => {
  res.send(
    layout(
      'Products',
      `<h1>Products</h1>
      <p class="spinner" id="loading">Loading products…</p>
      <div class="grid" id="products"></div>
      <script>
        (async () => {
          const products = await (await fetch('/api/products')).json();
          document.getElementById('loading').remove();
          const grid = document.getElementById('products');
          for (const p of products) {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.setAttribute('aria-label', p.name);
            card.innerHTML = '<h3>' + p.name + '</h3><p>€' + p.price.toFixed(2) + '</p>';
            const btn = document.createElement('button');
            btn.className = 'btn'; btn.textContent = 'Add to cart';
            btn.onclick = async () => {
              btn.disabled = true; btn.textContent = 'Adding…';
              const r = await fetch('/api/cart', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: p.id })
              });
              const cart = await r.json();
              document.getElementById('cart-count').textContent = cart.count;
              btn.disabled = false; btn.textContent = 'Add to cart';
              toast(p.name + ' added to cart');
            };
            card.appendChild(btn);
            grid.appendChild(card);
          }
        })();
      </script>`,
      req.user
    )
  );
});

app.get('/cart', requirePageUser, (req, res) => {
  const cart = cartView(req.user.id);
  const rows = cart.items
    .map(
      (i) => `<tr class="cart-item"><td>${i.name}</td><td>${i.qty}</td><td>€${(i.price * i.qty).toFixed(2)}</td>
        <td><button class="btn secondary" data-remove="${i.productId}">Remove</button></td></tr>`
    )
    .join('');
  res.send(
    layout(
      'Cart',
      `<h1>Your cart</h1>
      ${
        cart.items.length
          ? `<table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
          : `<p>Your cart is empty</p>`
      }
      <p>Total: <strong id="cart-total" aria-label="Cart total">€${cart.total.toFixed(2)}</strong></p>
      <button class="btn" id="checkout" ${cart.items.length ? '' : 'disabled'}>Checkout</button>
      <script>
        document.querySelectorAll('[data-remove]').forEach(b => b.onclick = async () => {
          await fetch('/api/cart/' + b.dataset.remove, { method: 'DELETE' }); location.reload();
        });
        document.getElementById('checkout').onclick = () => location.href = '/checkout';
      </script>`,
      req.user
    )
  );
});

app.get('/checkout', requirePageUser, (req, res) => {
  res.send(
    layout(
      'Checkout',
      `<h1>Checkout</h1>
      <div id="checkout-area">
        <form id="checkout-form" novalidate>
          <label>Full name <input name="name" id="name"></label>
          <label>Address <input name="address" id="address"></label>
          <div class="error" role="alert" id="checkout-error"></div>
          <button class="btn" type="submit" id="place-order">Place order</button>
        </form>
      </div>
      <script>
        document.getElementById('checkout-form').onsubmit = async (e) => {
          e.preventDefault();
          const btn = document.getElementById('place-order');
          btn.disabled = true; btn.textContent = 'Processing payment…';
          const r = await fetch('/api/orders', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: document.getElementById('name').value, address: document.getElementById('address').value })
          });
          const data = await r.json();
          if (!r.ok) {
            document.getElementById('checkout-error').textContent = data.error;
            btn.disabled = false; btn.textContent = 'Place order';
            return;
          }
          document.getElementById('cart-count').textContent = 0;
          document.getElementById('checkout-area').innerHTML =
            '<h2>Order confirmed</h2><p>Your order number is <strong id="order-id" aria-label="Order number">' + data.id + '</strong></p>';
        };
      </script>`,
      req.user
    )
  );
});

app.get('/orders', requirePageUser, (req, res) => {
  const orders = db.orders.filter((o) => o.userId === req.user.id);
  const rows = orders
    .map(
      (o) => `<tr class="order-row" data-order-id="${o.id}">
        <td>#${o.id}</td><td>€${o.total.toFixed(2)}</td>
        <td class="status">${o.status}</td>
        <td>${o.status === 'Paid' ? `<button class="btn secondary" data-cancel="${o.id}">Cancel</button>` : ''}</td></tr>`
    )
    .join('');
  res.send(
    layout(
      'Orders',
      `<h1>Your orders</h1>
      ${
        orders.length
          ? `<table><thead><tr><th>Order</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
          : '<p>No orders yet</p>'
      }
      <script>
        document.querySelectorAll('[data-cancel]').forEach(b => b.onclick = async () => {
          if (!confirm('Are you sure you want to cancel order #' + b.dataset.cancel + '?')) return;
          b.disabled = true; b.textContent = 'Cancelling…';
          const r = await fetch('/api/orders/' + b.dataset.cancel + '/cancel', { method: 'POST' });
          const row = b.closest('tr');
          if (r.ok) { row.querySelector('.status').textContent = 'Cancelled'; b.remove(); }
          else { b.disabled = false; b.textContent = 'Cancel'; }
        });
      </script>`,
      req.user
    )
  );
});

app.listen(PORT, () => console.log(`Demo shop running on http://localhost:${PORT}`));
