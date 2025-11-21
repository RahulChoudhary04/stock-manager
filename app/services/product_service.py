from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models.entities import Product
from ..schemas.product import ProductCreate


def create_product(db: Session, payload: ProductCreate) -> Product:
    existing = db.query(Product).filter(Product.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product already exists")

    product = Product(name=payload.name, category=payload.category, brand=payload.brand)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def list_products(db: Session) -> list[Product]:
    return db.query(Product).order_by(Product.name).all()


def get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product
