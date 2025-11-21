from datetime import UTC, datetime

from decimal import Decimal

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    contact_person = Column(String(120), nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(120), nullable=True)
    gst_number = Column(String(30), nullable=True)
    city = Column(String(80), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    batches = relationship("InventoryBatch", back_populates="supplier")


class Retailer(Base):
    __tablename__ = "retailers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    channel = Column(String(80), nullable=True)
    contact_person = Column(String(120), nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(120), nullable=True)
    gst_number = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    sales = relationship("Sale", back_populates="retailer")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    category = Column(String(80), nullable=True)
    brand = Column(String(80), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    batches = relationship("InventoryBatch", back_populates="product", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="product", cascade="all, delete-orphan")


class InventoryBatch(Base):
    __tablename__ = "inventory_batches"
    __table_args__ = (UniqueConstraint("product_id", "batch_code", name="uq_product_batch"),)

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    batch_code = Column(String(80), nullable=False)
    quantity_initial = Column(Integer, nullable=False)
    quantity_remaining = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=False)
    unit_size_value = Column(Numeric(10, 3), nullable=False, default=Decimal("1.0"), server_default="1.0")
    unit_size_unit = Column(String(8), nullable=False, default="g", server_default="g")
    expiry_date = Column(Date, nullable=False)
    supplier_name = Column(String(120), nullable=True)
    purchased_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    product = relationship("Product", back_populates="batches")
    supplier = relationship("Supplier", back_populates="batches")
    allocations = relationship(
        "SaleAllocation",
        back_populates="batch",
        cascade="all, delete-orphan",
        order_by="SaleAllocation.id",
    )


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    retailer_id = Column(Integer, ForeignKey("retailers.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, nullable=False)
    selling_price = Column(Numeric(10, 2), nullable=False)
    sale_date = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    unit_size_value = Column(Numeric(10, 3), nullable=False, default=Decimal("1.0"), server_default="1.0")
    unit_size_unit = Column(String(8), nullable=False, default="g", server_default="g")
    customer_name = Column(String(120), nullable=True)
    invoice_number = Column(String(40), nullable=True, unique=True)

    product = relationship("Product", back_populates="sales")
    retailer = relationship("Retailer", back_populates="sales")
    allocations = relationship(
        "SaleAllocation",
        back_populates="sale",
        cascade="all, delete-orphan",
        order_by="SaleAllocation.id",
    )


class SaleAllocation(Base):
    __tablename__ = "sale_allocations"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("inventory_batches.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=False)

    sale = relationship("Sale", back_populates="allocations")
    batch = relationship("InventoryBatch", back_populates="allocations")
