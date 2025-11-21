from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..models.entities import InventoryBatch
from ..schemas.purchase import PurchaseCreate
from .product_service import get_product_or_404
from .supplier_service import get_supplier_or_404


def create_purchase(db: Session, payload: PurchaseCreate) -> InventoryBatch:
    product = get_product_or_404(db, payload.product_id)

    existing = (
        db.query(InventoryBatch)
        .filter(InventoryBatch.product_id == product.id, InventoryBatch.batch_code == payload.batch_code)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Batch already exists for product")

    supplier_name = (payload.supplier_name or "").strip() or None
    supplier_id = None
    if payload.supplier_id is not None:
        supplier = get_supplier_or_404(db, payload.supplier_id)
        supplier_id = supplier.id
        if not supplier_name:
            supplier_name = supplier.name

    batch = InventoryBatch(
        product_id=product.id,
        batch_code=payload.batch_code,
        quantity_initial=payload.quantity,
        quantity_remaining=payload.quantity,
        unit_cost=payload.unit_cost,
        unit_size_value=payload.unit_size_value,
        unit_size_unit=payload.unit_size_unit,
        expiry_date=payload.expiry_date,
        supplier_id=supplier_id,
        supplier_name=supplier_name,
    )

    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def list_batches(db: Session) -> list[InventoryBatch]:
    return (
        db.query(InventoryBatch)
        .options(joinedload(InventoryBatch.product), joinedload(InventoryBatch.supplier))
        .join(InventoryBatch.product)
        .order_by(InventoryBatch.expiry_date, InventoryBatch.batch_code)
        .all()
    )
