from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.report import ProfitReport, SlowProduct, TopProduct
from ..services import report_service

router = APIRouter()


@router.get("/top-selling", response_model=List[TopProduct])
def top_selling(limit: int = Query(5, ge=1, le=50), db: Session = Depends(get_db)):
    return report_service.get_top_selling_products(db, limit)


@router.get("/slow-moving", response_model=List[SlowProduct])
def slow_moving(limit: int = Query(5, ge=1, le=50), db: Session = Depends(get_db)):
    return report_service.get_slow_moving_products(db, limit)


@router.get("/monthly-profit", response_model=ProfitReport)
def monthly_profit(db: Session = Depends(get_db)):
    return report_service.get_monthly_profit_report(db)
