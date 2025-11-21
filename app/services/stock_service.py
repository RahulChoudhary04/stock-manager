from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from ..config import get_settings
from ..models.entities import InventoryBatch, Product, Supplier
from ..schemas.stock import ExpiryAlert, StockBatch, StockOverview


settings = get_settings()


def get_stock_overview(db: Session) -> StockOverview:
    batches = (
        db.query(InventoryBatch, Product, Supplier)
        .join(Product, InventoryBatch.product_id == Product.id)
        .outerjoin(Supplier, InventoryBatch.supplier_id == Supplier.id)
        .order_by(Product.name, InventoryBatch.batch_code)
        .all()
    )

    batch_models = []
    for batch, product, supplier in batches:
        supplier_name = batch.supplier_name or (supplier.name if supplier else None)
        supplier_id = supplier.id if supplier else batch.supplier_id
        batch_models.append(
            StockBatch(
                batch_id=batch.id,
                product_id=product.id,
                product_name=product.name,
                batch_code=batch.batch_code,
                quantity_remaining=batch.quantity_remaining,
                expiry_date=batch.expiry_date,
                unit_cost=batch.unit_cost,
                unit_size_value=batch.unit_size_value,
                unit_size_unit=batch.unit_size_unit,
                supplier_id=supplier_id,
                supplier_name=supplier_name,
                purchased_at=batch.purchased_at,
            )
        )

    total_units = sum(batch.quantity_remaining for batch, _, _ in batches)

    return StockOverview(
        total_products=db.query(Product).count(),
        total_batches=len(batch_models),
        total_units=total_units,
        batches=batch_models,
    )


def get_expiry_alerts(db: Session) -> list[ExpiryAlert]:
    today = datetime.now(UTC).date()
    deadline = today + timedelta(days=settings.expiry_alert_days)
    rows = (
        db.query(InventoryBatch, Product)
        .join(Product, InventoryBatch.product_id == Product.id)
        .filter(InventoryBatch.expiry_date <= deadline, InventoryBatch.quantity_remaining > 0)
        .order_by(InventoryBatch.expiry_date)
        .all()
    )

    alerts: list[ExpiryAlert] = []
    for batch, product in rows:
        days_remaining = (batch.expiry_date - today).days
        alerts.append(
            ExpiryAlert(
                product_id=product.id,
                product_name=product.name,
                batch_code=batch.batch_code,
                expires_on=batch.expiry_date,
                days_remaining=days_remaining,
                quantity_remaining=batch.quantity_remaining,
                unit_size_value=batch.unit_size_value,
                unit_size_unit=batch.unit_size_unit,
            )
        )
    return alerts
