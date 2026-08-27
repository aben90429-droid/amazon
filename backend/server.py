from __future__ import annotations

import json
import logging
import os
import secrets
import sqlite3
from logging.handlers import RotatingFileHandler
from functools import wraps
from pathlib import Path
from typing import Any
from uuid import uuid4

from flask import Flask, g, jsonify, redirect, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DATABASE_FILE = BASE_DIR / "topazion.sqlite3"
PRODUCTS_FILE = BASE_DIR / "products.json"

app = Flask(__name__)
LOG_FILE = BASE_DIR / "topazion.log"
handler = RotatingFileHandler(LOG_FILE, maxBytes=1_000_000, backupCount=5, encoding="utf-8")
handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)


@app.after_request
def add_cors_headers(response):
    app.logger.info("%s %s -> %s", request.method, request.path, response.status_code)
    response.headers["Access-Control-Allow-Origin"] = os.environ.get("CORS_ORIGIN", "http://localhost:8000")
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


@app.route("/<path:unused_path>", methods=["OPTIONS"])
def options(unused_path: str):
    return "", 204


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                image TEXT NOT NULL,
                name TEXT NOT NULL,
                rating TEXT NOT NULL,
                price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
                keywords TEXT NOT NULL,
                product_type TEXT,
                size_chart_link TEXT,
                stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'customer'
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS login_sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS user_cart (
                user_id INTEGER NOT NULL,
                product_id TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK (quantity > 0),
                PRIMARY KEY (user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                items TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )
        seed_users(connection)
        product_count = connection.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if product_count == 0:
            with PRODUCTS_FILE.open(encoding="utf-8") as products_file:
                products = json.load(products_file)
            connection.executemany(
                """
                INSERT INTO products
                (id, image, name, rating, price_cents, keywords, product_type, size_chart_link, stock)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        product["id"], product["image"], product["name"],
                        json.dumps(product["rating"]), product["priceCents"],
                        json.dumps(product["keywords"]), product.get("type"),
                        product.get("sizeChartLink"), product.get("stock", 10),
                    )
                    for product in products
                ],
            )


def seed_users(connection: sqlite3.Connection) -> None:
    test_users = (
        ("owner", "Topazion Owner", "owner123", "owner"),
        ("maya", "Maya Test", "maya123", "customer"),
        ("noah", "Noah Test", "noah123", "customer"),
        ("lina", "Lina Test", "lina123", "customer"),
    )
    for username, display_name, password, role in test_users:
        connection.execute(
            "INSERT OR IGNORE INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)",
            (username, generate_password_hash(password), display_name, role),
        )


def product_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    product = {
        "id": row["id"], "image": row["image"], "name": row["name"],
        "rating": json.loads(row["rating"]), "priceCents": row["price_cents"],
        "keywords": json.loads(row["keywords"]), "stock": row["stock"],
    }
    if row["product_type"]:
        product["type"] = row["product_type"]
    if row["size_chart_link"]:
        product["sizeChartLink"] = row["size_chart_link"]
    return product


def error(message: str, status: int = 400):
    return jsonify({"error": message}), status


def user_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {"id": row["id"], "username": row["username"], "displayName": row["display_name"], "role": row["role"]}


def require_user(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        if not token:
            return error("Please sign in first.", 401)
        with get_connection() as connection:
            user = connection.execute(
                """
                SELECT users.* FROM users
                JOIN login_sessions ON login_sessions.user_id = users.id
                WHERE login_sessions.token = ?
                """,
                (token,),
            ).fetchone()
        if user is None:
            return error("Your sign-in session is not valid.", 401)
        g.current_user = user
        return handler(*args, **kwargs)
    return wrapped


def require_owner(handler):
    @wraps(handler)
    @require_user
    def wrapped(*args, **kwargs):
        if g.current_user["role"] != "owner":
            return error("Only the Topazion owner can view this page.", 403)
        return handler(*args, **kwargs)
    return wrapped


def cart_for_user(user_id: int) -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT product_id, quantity FROM user_cart WHERE user_id = ? ORDER BY product_id",
            (user_id,),
        ).fetchall()
    return [{"productId": row["product_id"], "quantity": row["quantity"]} for row in rows]


@app.post("/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "").strip().lower()
    password = payload.get("password", "")
    if not username or not password:
        return error("Username and password are required.")
    with get_connection() as connection:
        user = connection.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if user is None or not check_password_hash(user["password_hash"], password):
            return error("The username or password is incorrect.", 401)
        token = secrets.token_urlsafe(32)
        connection.execute("INSERT INTO login_sessions (token, user_id) VALUES (?, ?)", (token, user["id"]))
    return jsonify({"token": token, "user": user_to_dict(user)})


@app.post("/auth/signup")
def signup():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip().lower()
    password = payload.get("password") or ""
    display_name = (payload.get("displayName") or payload.get("display_name") or username or "Customer").strip()

    if not username:
        return error("Username is required.")
    if len(username) < 3:
        return error("Username must be at least 3 characters long.")
    if len(password) < 6:
        return error("Password must be at least 6 characters long.")
    if not display_name:
        return error("Display name is required.")

    with get_connection() as connection:
        existing = connection.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if existing is not None:
            return error("This username is already taken. Please choose another one.", 409)
        cursor = connection.execute(
            "INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)",
            (username, generate_password_hash(password), display_name, "customer"),
        )
        user = connection.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
        token = secrets.token_urlsafe(32)
        connection.execute("INSERT INTO login_sessions (token, user_id) VALUES (?, ?)", (token, user["id"]))

    return jsonify({"token": token, "user": user_to_dict(user)}), 201


@app.get("/auth/me")
@require_user
def current_user():
    return jsonify(user_to_dict(g.current_user))


@app.post("/auth/logout")
@require_user
def logout():
    token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    with get_connection() as connection:
        connection.execute("DELETE FROM login_sessions WHERE token = ?", (token,))
    return jsonify({"loggedOut": True})


@app.get("/me/cart")
@require_user
def get_my_cart():
    return jsonify({"items": cart_for_user(g.current_user["id"])})


@app.put("/me/cart")
@require_user
def save_my_cart():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items")
    if not isinstance(items, list):
        return error("Cart items must be a list.")
    with get_connection() as connection:
        connection.execute("DELETE FROM user_cart WHERE user_id = ?", (g.current_user["id"],))
        for item in items:
            product_id = item.get("productId") if isinstance(item, dict) else None
            quantity = item.get("quantity") if isinstance(item, dict) else None
            if not isinstance(quantity, int) or quantity < 1:
                return error("Cart quantities must be positive whole numbers.")
            product = connection.execute("SELECT stock FROM products WHERE id = ?", (product_id,)).fetchone()
            if product is None:
                return error(f"Product {product_id} does not exist.", 404)
            if quantity > product["stock"]:
                return error(f"Only {product['stock']} unit(s) are available.", 409)
            connection.execute(
                "INSERT INTO user_cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
                (g.current_user["id"], product_id, quantity),
            )
    return jsonify({"items": cart_for_user(g.current_user["id"])})


@app.get("/admin/people")
@require_owner
def list_people():
    with get_connection() as connection:
        users = connection.execute("SELECT * FROM users ORDER BY id").fetchall()
        active_ids = {
            row["user_id"] for row in connection.execute(
                "SELECT DISTINCT user_id FROM login_sessions"
            ).fetchall()
        }
    return jsonify([
        {**user_to_dict(user), "isOnline": user["id"] in active_ids, "cart": cart_for_user(user["id"])}
        for user in users
    ])


def validate_product(payload: Any) -> str | None:
    if not isinstance(payload, dict):
        return "Product must be a JSON object."
    required_fields = ("name", "image", "rating", "priceCents", "keywords", "stock")
    missing_fields = [field for field in required_fields if field not in payload]
    if missing_fields:
        return f"Missing product fields: {', '.join(missing_fields)}."
    if not isinstance(payload["name"], str) or not payload["name"].strip():
        return "Product name must be a non-empty string."
    if not isinstance(payload["image"], str) or not payload["image"].strip():
        return "Product image must be a non-empty string."
    image_path = payload["image"].strip()
    if not image_path.startswith("images/") or ".." in Path(image_path).parts:
        return "Product image must be a local path inside the images folder."
    if len(payload["name"].strip()) > 200 or len(image_path) > 300:
        return "Product name or image path is too long."
    if not isinstance(payload["priceCents"], int) or payload["priceCents"] < 0:
        return "priceCents must be a non-negative integer."
    if not isinstance(payload["stock"], int) or payload["stock"] < 0:
        return "Stock must be a non-negative whole number."
    if not isinstance(payload["keywords"], list) or not all(isinstance(item, str) for item in payload["keywords"]):
        return "Keywords must be a list of strings."
    if not isinstance(payload["rating"], dict):
        return "Rating must be an object."
    if not isinstance(payload["rating"].get("stars"), (int, float)) or not 0 <= payload["rating"]["stars"] <= 5:
        return "Rating stars must be between 0 and 5."
    if not isinstance(payload["rating"].get("count"), int) or payload["rating"]["count"] < 0:
        return "Rating count must be a non-negative whole number."
    return None


@app.get("/products")
def list_products():
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM products ORDER BY rowid").fetchall()
    return jsonify([product_to_dict(row) for row in rows])


@app.get("/health")
def health_check():
    try:
        with get_connection() as connection:
            connection.execute("SELECT 1").fetchone()
        return jsonify({"status": "ok"})
    except sqlite3.Error:
        app.logger.exception("Health check database failure")
        return jsonify({"status": "error"}), 503


@app.post("/products")
@require_owner
def create_product():
    payload = request.get_json(silent=True)
    validation_error = validate_product(payload)
    if validation_error:
        return error(validation_error)
    product_id = payload.get("id") or str(uuid4())
    try:
        with get_connection() as connection:
            connection.execute(
                """
                INSERT INTO products
                (id, image, name, rating, price_cents, keywords, product_type, size_chart_link, stock)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    product_id, payload["image"], payload["name"].strip(),
                    json.dumps(payload["rating"]), payload["priceCents"],
                    json.dumps(payload["keywords"]), payload.get("type"),
                    payload.get("sizeChartLink"), payload["stock"],
                ),
            )
            row = connection.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    except sqlite3.IntegrityError:
        return error("A product with this id already exists.", 409)
    return jsonify(product_to_dict(row)), 201


@app.put("/products/<product_id>")
@require_owner
def update_product(product_id: str):
    payload = request.get_json(silent=True)
    validation_error = validate_product(payload)
    if validation_error:
        return error(validation_error)
    with get_connection() as connection:
        result = connection.execute(
            """
            UPDATE products SET image = ?, name = ?, rating = ?, price_cents = ?, keywords = ?,
            product_type = ?, size_chart_link = ?, stock = ? WHERE id = ?
            """,
            (
                payload["image"], payload["name"].strip(), json.dumps(payload["rating"]),
                payload["priceCents"], json.dumps(payload["keywords"]), payload.get("type"),
                payload.get("sizeChartLink"), payload["stock"], product_id,
            ),
        )
        if result.rowcount == 0:
            return error("Product was not found.", 404)
        row = connection.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    return jsonify(product_to_dict(row))


@app.delete("/products/<product_id>")
@require_owner
def delete_product(product_id: str):
    with get_connection() as connection:
        result = connection.execute("DELETE FROM products WHERE id = ?", (product_id,))
    if result.rowcount == 0:
        return error("Product was not found.", 404)
    return jsonify({"deleted": product_id})


@app.post("/cart/validate")
def validate_cart():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items")
    if not isinstance(items, list):
        return error("Cart items must be a list.")
    with get_connection() as connection:
        for item in items:
            product_id = item.get("productId") if isinstance(item, dict) else None
            quantity = item.get("quantity") if isinstance(item, dict) else None
            row = connection.execute("SELECT name, stock FROM products WHERE id = ?", (product_id,)).fetchone()
            if row is None:
                return error(f"Product {product_id} does not exist.", 404)
            if not isinstance(quantity, int) or quantity < 1:
                return error(f"Quantity for {row['name']} must be a positive whole number.")
            if quantity > row["stock"]:
                return error(f"Only {row['stock']} unit(s) of {row['name']} are available.", 409)
    return jsonify({"valid": True})


@app.post("/orders")
@require_user
def create_order():
    payload = request.get_json(silent=True) or {}
    items = payload.get("cart")
    if not isinstance(items, list) or not items:
        return error("An order must contain at least one product.")
    quantities: dict[str, int] = {}
    normalized_items: list[dict[str, Any]] = []
    for item in items:
        product_id = item.get("productId") if isinstance(item, dict) else None
        quantity = item.get("quantity") if isinstance(item, dict) else None
        if not isinstance(product_id, str) or not product_id:
            return error("Every order item must have a product id.")
        if not isinstance(quantity, int) or quantity < 1:
            return error("Every order quantity must be a positive whole number.")
        quantities[product_id] = quantities.get(product_id, 0) + quantity
        if not any(existing["productId"] == product_id for existing in normalized_items):
            normalized_items.append({"productId": product_id, "quantity": quantity})
        else:
            for normalized_item in normalized_items:
                if normalized_item["productId"] == product_id:
                    normalized_item["quantity"] += quantity
                    break
    order_id = str(uuid4())
    try:
        with get_connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            for product_id, quantity in quantities.items():
                row = connection.execute("SELECT name, stock FROM products WHERE id = ?", (product_id,)).fetchone()
                if row is None:
                    return error(f"Product {product_id} does not exist.", 404)
                if quantity > row["stock"]:
                    return error(f"Only {row['stock']} unit(s) of {row['name']} are available.", 409)
            for product_id, quantity in quantities.items():
                connection.execute(
                    "UPDATE products SET stock = stock - ? WHERE id = ?",
                    (quantity, product_id),
                )
            connection.execute(
                "INSERT INTO orders (id, user_id, items) VALUES (?, ?, ?)",
                (order_id, g.current_user["id"], json.dumps(normalized_items)),
            )
    except sqlite3.Error as database_error:
        return error(f"Could not place the order: {database_error}", 500)
    return jsonify({"orderId": order_id, "cart": normalized_items}), 201


@app.get("/me/orders")
@require_user
def get_my_orders():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, items, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC",
            (g.current_user["id"],),
        ).fetchall()
    return jsonify([
        {"orderId": row["id"], "cart": json.loads(row["items"]), "createdAt": row["created_at"]}
        for row in rows
    ])


@app.get("/cart")
def get_cart():
    return jsonify({"items": []})


@app.get("/")
def storefront():
    return redirect("/amazon.html")


@app.get("/<path:file_path>")
def frontend_file(file_path: str):
    file_path = Path(file_path)
    if file_path.is_absolute() or ".." in file_path.parts:
        return jsonify({"error": "File not found."}), 404
    return send_from_directory(PROJECT_DIR, file_path.as_posix())


if __name__ == "__main__":
    initialize_database()
    port = int(os.environ.get("PORT", "8000"))
    print(f"Topazion Flask backend running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
