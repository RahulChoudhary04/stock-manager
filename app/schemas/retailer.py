from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class RetailerBase(BaseModel):
    name: str = Field(..., max_length=120)
    channel: Optional[str] = Field(default=None, max_length=80)
    contact_person: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=30)
    email: Optional[str] = Field(default=None, max_length=120)
    gst_number: Optional[str] = Field(default=None, max_length=30)


class RetailerCreate(RetailerBase):
    pass


class RetailerRead(RetailerBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
