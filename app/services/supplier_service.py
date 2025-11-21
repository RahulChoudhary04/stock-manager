from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.entities import Supplier
from ..schemas.supplier import SupplierCreate


def create_supplier(db: Session, payload: SupplierCreate) -> Supplier:
    existing = db.query(Supplier).filter(Supplier.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Supplier already exists")

    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


def list_suppliers(db: Session) -> list[Supplier]:
    return db.query(Supplier).order_by(Supplier.name).all()


def get_supplier_or_404(db: Session, supplier_id: int) -> Supplier:
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


def delete_supplier(db: Session, supplier_id: int) -> None:
    supplier = get_supplier_or_404(db, supplier_id)
    db.delete(supplier)
    db.commit()
