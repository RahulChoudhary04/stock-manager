from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.product import ProductCreate, ProductRead
from ..services import product_service

router = APIRouter()


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create_product(db, payload)


@router.get("/", response_model=List[ProductRead])
def list_products(db: Session = Depends(get_db)):
    return product_service.list_products(db)
