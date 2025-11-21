from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.retailer import RetailerCreate, RetailerRead
from ..services import retailer_service

router = APIRouter()


@router.post("/", response_model=RetailerRead, status_code=status.HTTP_201_CREATED)
def create_retailer(payload: RetailerCreate, db: Session = Depends(get_db)):
    return retailer_service.create_retailer(db, payload)


@router.get("/", response_model=List[RetailerRead])
def list_retailers(db: Session = Depends(get_db)):
    return retailer_service.list_retailers(db)


@router.delete("/{retailer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_retailer(retailer_id: int, db: Session = Depends(get_db)):
    retailer_service.delete_retailer(db, retailer_id)
