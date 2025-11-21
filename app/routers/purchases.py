from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.purchase import PurchaseCreate, PurchaseRead
from ..services import purchase_service

router = APIRouter()


@router.post("/", response_model=PurchaseRead, status_code=status.HTTP_201_CREATED)
def create_purchase(payload: PurchaseCreate, db: Session = Depends(get_db)):
    return purchase_service.create_purchase(db, payload)


@router.get("/", response_model=List[PurchaseRead])
def list_purchases(db: Session = Depends(get_db)):
    return purchase_service.list_batches(db)
