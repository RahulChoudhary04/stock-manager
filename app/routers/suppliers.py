from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.supplier import SupplierCreate, SupplierRead
from ..services import supplier_service

router = APIRouter()


@router.post("/", response_model=SupplierRead, status_code=status.HTTP_201_CREATED)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    return supplier_service.create_supplier(db, payload)


@router.get("/", response_model=List[SupplierRead])
def list_suppliers(db: Session = Depends(get_db)):
    return supplier_service.list_suppliers(db)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier_service.delete_supplier(db, supplier_id)
