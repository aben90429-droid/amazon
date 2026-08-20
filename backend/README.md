# Topazion backend

## Setup

Use the Python interpreter selected by VS Code, then install the dependency:

```powershell
python -m pip install -r backend/requirements.txt
```

## Run

From the project folder:

```powershell
python backend/server.py
```

The Flask API runs at `http://localhost:8000`.

Open `admin.html` in the browser to manage products and stock.

Open `login.html` to sign in with the seeded local test accounts:

- Owner dashboard: `owner` / `owner123`
- Customer: `maya` / `maya123`
- Customer: `noah` / `noah123`
- Customer: `lina` / `lina123`

The owner can open `people.html` to see which seeded users have active sessions and inspect each person's separate cart.

## Main API routes

- `GET /products` lists products from SQLite.
- `POST /products` adds a product and its stock amount.
- `PUT /products/<id>` updates product details or stock.
- `DELETE /products/<id>` removes a product.
- `POST /cart/validate` checks cart quantities against stock.
- `POST /orders` checks and atomically deducts stock when an order is placed.
- `POST /auth/login` verifies a username and password and returns a session token.
- `POST /auth/logout` closes the current session.
- `GET /me/cart` and `PUT /me/cart` read and save the signed-in person's cart.
- `GET /admin/people` lists active users and their carts for the owner only.

The first run creates `backend/topazion.sqlite3` and imports the existing `products.json` catalog. New products and stock changes are stored in SQLite afterward.
