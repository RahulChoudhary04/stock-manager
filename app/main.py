from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import Base, engine, ensure_schema_upgrades
from .routers import products, purchases, retailers, sales, stock, suppliers, reports


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"] ,
        allow_headers=["*"],
    )

    Base.metadata.create_all(bind=engine)
    ensure_schema_upgrades()

    app.include_router(products.router, prefix="/api/products", tags=["products"])
    app.include_router(purchases.router, prefix="/api/purchases", tags=["purchases"])
    app.include_router(sales.router, prefix="/api/sales", tags=["sales"])
    app.include_router(stock.router, prefix="/api/stock", tags=["stock"])
    app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
    app.include_router(suppliers.router, prefix="/api/suppliers", tags=["suppliers"])
    app.include_router(retailers.router, prefix="/api/retailers", tags=["retailers"])

    @app.get("/")
    def root():
        return {
            "message": "SweetStock backend is running",
            "docs": "/docs",
            "health": "/health",
            "inventory_endpoints": [
                "/api/products",
                "/api/purchases",
                "/api/sales",
                "/api/stock",
                "/api/reports",
                "/api/suppliers",
                "/api/retailers",
            ],
        }

    @app.get("/health", tags=["health"])
    def health_check():
        return {"status": "ok"}

    return app


app = create_app()
