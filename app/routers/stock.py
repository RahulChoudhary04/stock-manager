from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.stock import ExpiryAlert, StockOverview
from ..services import stock_service

router = APIRouter()


@router.get("/", response_model=StockOverview)
def stock_overview(db: Session = Depends(get_db)):
    return stock_service.get_stock_overview(db)


@router.get("/expiring", response_model=List[ExpiryAlert])
def expiring_batches(db: Session = Depends(get_db)):
    return stock_service.get_expiry_alerts(db)
