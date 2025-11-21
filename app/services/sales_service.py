from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..models.entities import InventoryBatch, Sale, SaleAllocation
from ..schemas.sale import SaleCreate
from .product_service import get_product_or_404
from .retailer_service import get_retailer_or_404


def _get_fifo_batches(db: Session, product_id: int) -> list[InventoryBatch]:
    return (
        db.query(InventoryBatch)
        .filter(InventoryBatch.product_id == product_id, InventoryBatch.quantity_remaining > 0)
        .order_by(InventoryBatch.expiry_date, InventoryBatch.purchased_at)
        .all()
    )


def create_sale(db: Session, payload: SaleCreate) -> Sale:
    product = get_product_or_404(db, payload.product_id)
    retailer_id = None
    customer_name = (payload.customer_name or "").strip() or None
    if payload.retailer_id is not None:
        retailer = get_retailer_or_404(db, payload.retailer_id)
        retailer_id = retailer.id
        if not customer_name:
            customer_name = retailer.name

    invoice_number = (payload.invoice_number or "").strip() or None
    if invoice_number:
        existing_invoice = db.query(Sale).filter(Sale.invoice_number == invoice_number).first()
        if existing_invoice:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invoice already exists")
    batches = _get_fifo_batches(db, product.id)

    total_available = sum(batch.quantity_remaining for batch in batches)
    if total_available < payload.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock for sale")

    sale = Sale(
        product_id=product.id,
        quantity=payload.quantity,
        selling_price=Decimal(payload.selling_price),
        customer_name=customer_name,
        unit_size_value=payload.unit_size_value,
        unit_size_unit=payload.unit_size_unit,
        retailer_id=retailer_id,
        invoice_number=invoice_number,
    )
    db.add(sale)

    qty_remaining = payload.quantity
    for batch in batches:
        if qty_remaining <= 0:
            break
        take = min(qty_remaining, batch.quantity_remaining)
        batch.quantity_remaining -= take
        allocation = SaleAllocation(sale=sale, batch=batch, quantity=take, unit_cost=batch.unit_cost)
        db.add(allocation)
        qty_remaining -= take

    db.commit()
    db.refresh(sale)
    return sale


def list_sales(db: Session) -> list[Sale]:
    return (
        db.query(Sale)
        .options(joinedload(Sale.allocations), joinedload(Sale.retailer))
        .order_by(Sale.sale_date.desc())
        .all()
    )
