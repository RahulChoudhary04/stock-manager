from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base, scoped_session

from .config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url, echo=settings.debug, future=True, connect_args={"check_same_thread": False}
)

SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True))

Base = declarative_base()


def ensure_schema_upgrades() -> None:
    inspector = inspect(engine)
    with engine.begin() as conn:
        batch_columns = {column["name"] for column in inspector.get_columns("inventory_batches")}
        if "unit_size_value" not in batch_columns:
            conn.execute(text("ALTER TABLE inventory_batches ADD COLUMN unit_size_value NUMERIC DEFAULT 1 NOT NULL"))
        if "unit_size_unit" not in batch_columns:
            conn.execute(text("ALTER TABLE inventory_batches ADD COLUMN unit_size_unit VARCHAR(8) DEFAULT 'g' NOT NULL"))
        if "supplier_id" not in batch_columns:
            conn.execute(text("ALTER TABLE inventory_batches ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id)"))

        sale_columns = {column["name"] for column in inspector.get_columns("sales")}
        if "unit_size_value" not in sale_columns:
            conn.execute(text("ALTER TABLE sales ADD COLUMN unit_size_value NUMERIC DEFAULT 1 NOT NULL"))
        if "unit_size_unit" not in sale_columns:
            conn.execute(text("ALTER TABLE sales ADD COLUMN unit_size_unit VARCHAR(8) DEFAULT 'g' NOT NULL"))
        if "retailer_id" not in sale_columns:
            conn.execute(text("ALTER TABLE sales ADD COLUMN retailer_id INTEGER REFERENCES retailers(id)"))
        if "invoice_number" not in sale_columns:
            conn.execute(text("ALTER TABLE sales ADD COLUMN invoice_number VARCHAR(40)"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number)"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
