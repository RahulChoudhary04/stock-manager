from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.sale import SaleCreate, SaleRead
from ..services import sales_service

router = APIRouter()


@router.post("/", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    return sales_service.create_sale(db, payload)


@router.get("/", response_model=List[SaleRead])
def list_sales(db: Session = Depends(get_db)):
    return sales_service.list_sales(db)
