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
            connection.execute("DELETE FROM reviews")
            connection.execute("DELETE FROM wishlists")
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
        owner_login = self.client.post(
            "/auth/login", json={"username": "owner", "password": "owner123"}
        )
        self.owner_headers = {"Authorization": f"Bearer {owner_login.get_json()['token']}"}
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
            [{"productId": self.product["id"], "quantity": 3, "deliveryOptionId": "1"}],
        )

    def test_customer_can_cancel_processing_order_and_restore_stock(self):
        stock = self.product["stock"]
        order = self.client.post(
            "/orders", headers=self.headers,
            json={"cart": [{"productId": self.product["id"], "quantity": 2}]},
        ).get_json()
        response = self.client.post(
            f"/me/orders/{order['orderId']}/cancel", headers=self.headers
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["refundStatus"], "requested")
        current_product = next(
            item for item in self.client.get("/products").get_json()
            if item["id"] == self.product["id"]
        )
        self.assertEqual(current_product["stock"], stock)

    def test_owner_can_update_order_status(self):
        order = self.client.post(
            "/orders", headers=self.headers,
            json={"cart": [{"productId": self.product["id"], "quantity": 1}]},
        ).get_json()
        response = self.client.patch(
            f"/admin/orders/{order['orderId']}", headers=self.owner_headers,
            json={"status": "shipped"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "shipped")

    def test_owner_can_update_refund_after_cancellation(self):
        order = self.client.post(
            "/orders", headers=self.headers,
            json={"cart": [{"productId": self.product["id"], "quantity": 1}]},
        ).get_json()
        self.client.post(f"/me/orders/{order['orderId']}/cancel", headers=self.headers)
        response = self.client.patch(
            f"/admin/orders/{order['orderId']}/refund", headers=self.owner_headers,
            json={"refundStatus": "approved"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["refundStatus"], "approved")

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

    def test_invalid_cart_save_does_not_delete_existing_cart(self):
        valid = self.client.put(
            "/me/cart", headers=self.headers,
            json={"items": [{"productId": self.product["id"], "quantity": 1}]},
        )
        self.assertEqual(valid.status_code, 200)
        invalid = self.client.put(
            "/me/cart", headers=self.headers,
            json={"items": [{"productId": "missing", "quantity": 1}]},
        )
        self.assertEqual(invalid.status_code, 404)
        saved = self.client.get("/me/cart", headers=self.headers).get_json()["items"]
        self.assertEqual(saved, [{"productId": self.product["id"], "quantity": 1}])

    def test_product_validation_rejects_remote_image_paths(self):
        response = self.client.post(
            "/products",
            headers=self.owner_headers,
            json={
                "name": "Unsafe image",
                "image": "https://example.com/image.jpg",
                "priceCents": 100,
                "stock": 1,
                "rating": {"stars": 4, "count": 1},
                "keywords": ["test"],
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_health_endpoint_reports_database_status(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok"})

    def test_customer_can_save_wishlist_and_review_product_once(self):
        wishlist = self.client.put(
            f"/me/wishlist/{self.product['id']}", headers=self.headers
        )
        self.assertEqual(wishlist.status_code, 200)
        self.assertIn(self.product["id"], self.client.get("/me/wishlist", headers=self.headers).get_json())

        review = self.client.post(
            f"/products/{self.product['id']}/reviews",
            headers=self.headers,
            json={"rating": 5, "review": "Useful product."},
        )
        self.assertEqual(review.status_code, 201)
        duplicate = self.client.post(
            f"/products/{self.product['id']}/reviews",
            headers=self.headers,
            json={"rating": 4, "review": "Second review."},
        )
        self.assertEqual(duplicate.status_code, 409)

    def test_security_controls_and_owner_orders(self):
        health = self.client.get("/health")
        self.assertEqual(health.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(health.headers["X-Frame-Options"], "DENY")
        orders = self.client.get("/admin/orders", headers=self.owner_headers)
        self.assertEqual(orders.status_code, 200)

    def test_invalid_owner_order_status_is_rejected(self):
        response = self.client.patch(
            "/admin/orders/missing", headers=self.owner_headers,
            json={"status": "unknown"},
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
