import json
import tempfile
import unittest
from pathlib import Path

import server


class ServerTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.database_directory = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        cls.original_database_file = server.DATABASE_FILE
        server.DATABASE_FILE = Path(cls.database_directory.name) / "test.sqlite3"
        server.app.config["TESTING"] = True
        server.initialize_database()

    @classmethod
    def tearDownClass(cls):
        server.DATABASE_FILE = cls.original_database_file
        cls.database_directory.cleanup()

    def setUp(self):
        with server.get_connection() as connection:
            connection.execute("DELETE FROM login_sessions")
            connection.execute("DELETE FROM user_cart")
            connection.execute("DELETE FROM orders")
            connection.execute("DELETE FROM products")
            with server.PRODUCTS_FILE.open(encoding="utf-8") as products_file:
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
        self.client = server.app.test_client()
        login = self.client.post(
            "/auth/login", json={"username": "maya", "password": "maya123"}
        )
        self.token = login.get_json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.product = self.client.get("/products").get_json()[0]

    def test_duplicate_order_lines_are_aggregated_before_stock_check(self):
        stock = self.product["stock"]
        response = self.client.post(
            "/orders",
            headers=self.headers,
            json={
                "cart": [
                    {"productId": self.product["id"], "quantity": stock},
                    {"productId": self.product["id"], "quantity": 1},
                ]
            },
        )

        self.assertEqual(response.status_code, 409)
        current_product = next(
            item for item in self.client.get("/products").get_json()
            if item["id"] == self.product["id"]
        )
        self.assertEqual(current_product["stock"], stock)

    def test_duplicate_order_lines_create_one_order_item(self):
        response = self.client.post(
            "/orders",
            headers=self.headers,
            json={
                "cart": [
                    {"productId": self.product["id"], "quantity": 2},
                    {"productId": self.product["id"], "quantity": 1},
                ]
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.get_json()["cart"],
            [{"productId": self.product["id"], "quantity": 3}],
        )

    def test_signup_creates_customer_and_rejects_duplicate_username(self):
        response = self.client.post(
            "/auth/signup",
            json={
                "displayName": "New Shopper",
                "username": "new-shopper",
                "password": "password123",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["user"]["role"], "customer")

        duplicate = self.client.post(
            "/auth/signup",
            json={
                "displayName": "Another Shopper",
                "username": "NEW-SHOPPER",
                "password": "password123",
            },
        )
        self.assertEqual(duplicate.status_code, 409)

    def test_customer_cannot_access_owner_people_endpoint(self):
        response = self.client.get("/admin/people", headers=self.headers)
        self.assertEqual(response.status_code, 403)

    def test_cart_validation_rejects_unknown_product_and_bad_quantity(self):
        unknown = self.client.post(
            "/cart/validate",
            json={"items": [{"productId": "missing", "quantity": 1}]},
        )
        self.assertEqual(unknown.status_code, 404)

        invalid_quantity = self.client.post(
            "/cart/validate",
            json={"items": [{"productId": self.product["id"], "quantity": 0}]},
        )
        self.assertEqual(invalid_quantity.status_code, 400)


if __name__ == "__main__":
    unittest.main()
