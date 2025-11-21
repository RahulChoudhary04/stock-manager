from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient


def create_product(client: TestClient, name: str) -> int:
    response = client.post("/api/products/", json={"name": name})
    assert response.status_code == 201
    return response.json()["id"]


def create_purchase(client: TestClient, product_id: int, batch: str, qty: int, cost: Decimal, expiry_days: int):
    payload = {
        "product_id": product_id,
        "batch_code": batch,
        "quantity": qty,
        "unit_cost": str(cost),
        "expiry_date": (date.today() + timedelta(days=expiry_days)).isoformat(),
        "unit_size_value": "1",
        "unit_size_unit": "kg",
    }
    response = client.post("/api/purchases/", json=payload)
    assert response.status_code == 201


def create_sale(client: TestClient, product_id: int, qty: int, price: Decimal):
    payload = {
        "product_id": product_id,
        "quantity": qty,
        "selling_price": str(price),
        "unit_size_value": "250",
        "unit_size_unit": "g",
    }
    response = client.post("/api/sales/", json=payload)
    assert response.status_code == 201


def test_expiry_alert_and_reports(client: TestClient):
    laddoo_id = create_product(client, "Motichur Laddoo")
    rasgulla_id = create_product(client, "Rasgulla")

    create_purchase(client, laddoo_id, "L-1", 30, Decimal("100"), expiry_days=5)
    create_purchase(client, rasgulla_id, "R-1", 40, Decimal("90"), expiry_days=20)

    create_sale(client, laddoo_id, 10, Decimal("150"))
    create_sale(client, rasgulla_id, 5, Decimal("200"))

    # Expiry alert should include laddoo batch only
    alert_response = client.get("/api/stock/expiring")
    assert alert_response.status_code == 200
    alert_products = {alert["product_name"] for alert in alert_response.json()}
    assert "Motichur Laddoo" in alert_products
    assert "Rasgulla" not in alert_products

    top_response = client.get("/api/reports/top-selling?limit=2")
    assert top_response.status_code == 200
    top_items = top_response.json()
    assert top_items[0]["total_quantity"] >= top_items[1]["total_quantity"]

    profit_response = client.get("/api/reports/monthly-profit")
    assert profit_response.status_code == 200
    profit_data = profit_response.json()["months"]
    assert len(profit_data) >= 1
    first_month = profit_data[0]
    assert first_month["revenue"] >= first_month["cogs"]
