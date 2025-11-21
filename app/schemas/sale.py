from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Literal

from pydantic import BaseModel, Field, ConfigDict

from .retailer import RetailerRead


class SaleCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    selling_price: Decimal = Field(..., gt=0)
    customer_name: Optional[str] = Field(default=None, max_length=120)
    unit_size_value: Decimal = Field(Decimal("1"), gt=0)
    unit_size_unit: Literal["g", "kg"] = Field(default="g")
    retailer_id: int | None = Field(default=None)
    invoice_number: Optional[str] = Field(default=None, max_length=40)


class SaleAllocationRead(BaseModel):
    batch_id: int
    quantity: int
    unit_cost: Decimal

    model_config = ConfigDict(from_attributes=True)


class SaleRead(BaseModel):
    id: int
    product_id: int
    retailer_id: int | None
    quantity: int
    selling_price: Decimal
    sale_date: datetime
    customer_name: Optional[str]
    unit_size_value: Decimal
    unit_size_unit: Literal["g", "kg"]
    invoice_number: Optional[str]
    retailer: RetailerRead | None = None
    allocations: List[SaleAllocationRead]

    model_config = ConfigDict(from_attributes=True)
