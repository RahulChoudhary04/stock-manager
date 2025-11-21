from decimal import Decimal
from typing import List

from pydantic import BaseModel


class TopProduct(BaseModel):
    product_id: int
    product_name: str
    total_quantity: int
    total_revenue: Decimal


class SlowProduct(BaseModel):
    product_id: int
    product_name: str
    sold_last_30_days: int


class ProfitLine(BaseModel):
    month: str  # e.g. 2025-11
    revenue: Decimal
    cogs: Decimal
    profit: Decimal


class ProfitReport(BaseModel):
    currency: str = "INR"
    months: List[ProfitLine]
