from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient


def test_supplier_retailer_workflow(client: TestClient):
    product_response = client.post(
        "/api/products/",
        json={"name": "Kesar Peda"},
    )
    assert product_response.status_code == 201
    product_id = product_response.json()["id"]

    supplier_response = client.post(
        "/api/suppliers/",
        json={
            "name": "Sweet Origins",
            "contact_person": "Ravi",
            "phone": "9999999999",
            "city": "Mumbai",
        },
    )
    assert supplier_response.status_code == 201
    supplier_id = supplier_response.json()["id"]

    purchase_payload = {
        "product_id": product_id,
        "batch_code": "SP-1",
        "quantity": 40,
        "unit_cost": "150",
        "expiry_date": (date.today() + timedelta(days=20)).isoformat(),
        "unit_size_value": "1",
        "unit_size_unit": "kg",
        "supplier_id": supplier_id,
    }
    purchase_response = client.post("/api/purchases/", json=purchase_payload)
    assert purchase_response.status_code == 201
    purchase_data = purchase_response.json()
    assert purchase_data["supplier_id"] == supplier_id

    stock_response = client.get("/api/stock/")
    assert stock_response.status_code == 200
    stock_batch = stock_response.json()["batches"][0]
    assert stock_batch["supplier_id"] == supplier_id
    assert stock_batch["supplier_name"] == "Sweet Origins"

    retailer_response = client.post(
        "/api/retailers/",
        json={
            "name": "Festive Cart",
            "channel": "Omni",
        },
    )
    assert retailer_response.status_code == 201
    retailer_id = retailer_response.json()["id"]

    invoice_number = "INV-A1"
    sale_payload = {
        "product_id": product_id,
        "quantity": 5,
        "selling_price": str(Decimal("250")),
        "unit_size_value": "1",
        "unit_size_unit": "kg",
        "retailer_id": retailer_id,
        "invoice_number": invoice_number,
    }
    sale_response = client.post("/api/sales/", json=sale_payload)
    assert sale_response.status_code == 201
    sale_data = sale_response.json()
    assert sale_data["retailer_id"] == retailer_id
    assert sale_data["invoice_number"] == invoice_number
    assert sale_data["customer_name"] == "Festive Cart"

    duplicate_invoice = client.post("/api/sales/", json={**sale_payload, "quantity": 1})
    assert duplicate_invoice.status_code == 409
