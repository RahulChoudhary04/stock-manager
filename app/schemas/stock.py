from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal

from pydantic import BaseModel


class StockBatch(BaseModel):
    batch_id: int
    product_id: int
    product_name: str
    batch_code: str
    quantity_remaining: int
    expiry_date: date
    unit_cost: Decimal
    unit_size_value: Decimal
    unit_size_unit: Literal["g", "kg"]
    supplier_id: int | None
    supplier_name: str | None
    purchased_at: datetime


class ExpiryAlert(BaseModel):
    product_id: int
    product_name: str
    batch_code: str
    expires_on: date
    days_remaining: int
    quantity_remaining: int
    unit_size_value: Decimal
    unit_size_unit: Literal["g", "kg"]


class StockOverview(BaseModel):
    total_products: int
    total_batches: int
    total_units: int
    batches: List[StockBatch]
