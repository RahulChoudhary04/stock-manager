from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient


def seed_product(client: TestClient) -> int:
    response = client.post(
        "/api/products/",
        json={"name": "Motichur Laddoo", "category": "Sweets", "brand": "House"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def add_batch(client: TestClient, product_id: int, batch_code: str, qty: int, days_until_expiry: int, cost: Decimal):
    expiry = (date.today() + timedelta(days=days_until_expiry)).isoformat()
    payload = {
        "product_id": product_id,
        "batch_code": batch_code,
        "quantity": qty,
        "unit_cost": str(cost),
        "expiry_date": expiry,
        "supplier_name": "Bikaji",
        "unit_size_value": "250",
        "unit_size_unit": "g",
    }
    response = client.post("/api/purchases/", json=payload)
    assert response.status_code == 201
    return response.json()


def test_fifo_sale_allocation(client: TestClient):
    product_id = seed_product(client)
    add_batch(client, product_id, "A1", 50, 30, Decimal("120"))
    add_batch(client, product_id, "B1", 80, 60, Decimal("110"))

    sale_payload = {
        "product_id": product_id,
        "quantity": 70,
        "selling_price": "200",
        "unit_size_value": "500",
        "unit_size_unit": "g",
    }
    sale_response = client.post("/api/sales/", json=sale_payload)
    assert sale_response.status_code == 201
    sale_data = sale_response.json()

    allocations = sale_data["allocations"]
    assert allocations[0]["batch_id"] != allocations[1]["batch_id"]
    assert allocations[0]["quantity"] == 50
    assert allocations[1]["quantity"] == 20

    stock_response = client.get("/api/stock/")
    assert stock_response.status_code == 200
    batches = stock_response.json()["batches"]
    assert any(batch["batch_code"] == "A1" and batch["quantity_remaining"] == 0 for batch in batches)
    assert any(batch["batch_code"] == "B1" and batch["quantity_remaining"] == 60 for batch in batches)
