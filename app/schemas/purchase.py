from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict

from .supplier import SupplierRead


class PurchaseCreate(BaseModel):
    product_id: int
    batch_code: str = Field(..., max_length=80)
    quantity: int = Field(..., gt=0)
    unit_cost: Decimal = Field(..., gt=0)
    expiry_date: date
    supplier_name: str | None = Field(default=None, max_length=120)
    unit_size_value: Decimal = Field(Decimal("1"), gt=0)
    unit_size_unit: Literal["g", "kg"] = Field(default="g")
    supplier_id: int | None = Field(default=None)


class PurchaseRead(BaseModel):
    id: int
    product_id: int
    batch_code: str
    quantity_initial: int
    quantity_remaining: int
    unit_cost: Decimal
    unit_size_value: Decimal
    unit_size_unit: Literal["g", "kg"]
    expiry_date: date
    supplier_name: str | None
    supplier_id: int | None
    purchased_at: datetime
    supplier: SupplierRead | None = None

    model_config = ConfigDict(from_attributes=True)
