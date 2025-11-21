from collections import defaultdict
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..models.entities import Product, Sale
from ..schemas.report import ProfitLine, ProfitReport, SlowProduct, TopProduct


def get_top_selling_products(db: Session, limit: int = 5) -> List[TopProduct]:
    rows = (
        db.query(
            Sale.product_id,
            Product.name.label("product_name"),
            func.sum(Sale.quantity).label("total_quantity"),
            func.sum(Sale.quantity * Sale.selling_price).label("total_revenue"),
        )
        .join(Product, Product.id == Sale.product_id)
        .group_by(Sale.product_id, Product.name)
        .order_by(func.sum(Sale.quantity).desc())
        .limit(limit)
        .all()
    )

    return [
        TopProduct(
            product_id=row.product_id,
            product_name=row.product_name,
            total_quantity=int(row.total_quantity or 0),
            total_revenue=row.total_revenue or Decimal("0"),
        )
        for row in rows
    ]


def get_slow_moving_products(db: Session, limit: int = 5) -> List[SlowProduct]:
    cutoff = datetime.now(UTC) - timedelta(days=30)
    rows = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.coalesce(func.sum(Sale.quantity), 0).label("sold_last_30"),
        )
        .outerjoin(Sale, (Sale.product_id == Product.id) & (Sale.sale_date >= cutoff))
        .group_by(Product.id, Product.name)
        .order_by(func.coalesce(func.sum(Sale.quantity), 0).asc(), Product.name)
        .limit(limit)
        .all()
    )

    return [
        SlowProduct(
            product_id=row.product_id,
            product_name=row.product_name,
            sold_last_30_days=int(row.sold_last_30 or 0),
        )
        for row in rows
    ]


def get_monthly_profit_report(db: Session) -> ProfitReport:
    month_totals: dict[str, dict[str, Decimal]] = defaultdict(lambda: {"revenue": Decimal("0"), "cogs": Decimal("0")})

    sales = db.query(Sale).options(joinedload(Sale.allocations)).all()
    for sale in sales:
        month_key = sale.sale_date.strftime("%Y-%m")
        revenue = Decimal(sale.quantity) * Decimal(sale.selling_price)
        cogs = sum(Decimal(a.quantity) * Decimal(a.unit_cost) for a in sale.allocations)
        month_totals[month_key]["revenue"] += revenue
        month_totals[month_key]["cogs"] += cogs

    month_lines = [
        ProfitLine(
            month=month,
            revenue=totals["revenue"],
            cogs=totals["cogs"],
            profit=totals["revenue"] - totals["cogs"],
        )
        for month, totals in sorted(month_totals.items())
    ]

    return ProfitReport(months=month_lines)
