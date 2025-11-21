from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.entities import Retailer
from ..schemas.retailer import RetailerCreate


def create_retailer(db: Session, payload: RetailerCreate) -> Retailer:
    existing = db.query(Retailer).filter(Retailer.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Retailer already exists")

    retailer = Retailer(**payload.model_dump())
    db.add(retailer)
    db.commit()
    db.refresh(retailer)
    return retailer


def list_retailers(db: Session) -> list[Retailer]:
    return db.query(Retailer).order_by(Retailer.name).all()


def get_retailer_or_404(db: Session, retailer_id: int) -> Retailer:
    retailer = db.get(Retailer, retailer_id)
    if not retailer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retailer not found")
    return retailer


def delete_retailer(db: Session, retailer_id: int) -> None:
    retailer = get_retailer_or_404(db, retailer_id)
    db.delete(retailer)
    db.commit()
