<<<<<<< HEAD
# SweetStock Platform

Warehouse-grade inventory + sales console for Indian sweets wholesalers (Motichur Laddoo, Rasgulla, Bikaji assortments). A FastAPI backend powers the data APIs, while a React/Vite frontend offers a multi-page operator experience that stays FIFO-aware, expiry-conscious, and accountant-friendly.

```text
Backend  ➜  FastAPI + SQLAlchemy + SQLite (pluggable DB)
Frontend ➜  React 19 + Vite + TypeScript + React Router
```

The sections below walk through both halves.

## Backend (FastAPI)

## Core Capabilities

- **Stock tracking:** batch-level storage with purchase cost, expiry, supplier, and auto-deduction on sales.
- **FIFO engine:** sales allocation always drains the oldest unexpired batches first, keeping audit history via `sale_allocations`.
- **Expiry intelligence:** configurable alert horizon (default 7 days) surfaces soon-to-expire batches.
- **Purchasing & sales flows:** REST endpoints capture purchases and invoices, wiring them straight into stock.
- **Pack-size metadata:** capture grams/kilograms per SKU so sales and stock views show “500 units • 250 g each” style insights.
- **Reports:** top/slow movers plus monthly profit (Revenue − COGS based on actual batch cost).
- **Network master data:** supplier and retailer rosters tie directly into purchases and sales, and every invoice can carry a unique billing number for reconciliation.

## Architecture Highlights

| Layer | Responsibility |
|-------|----------------|
| `app/models` | SQLAlchemy ORM models for products, inventory batches, sales, allocations, pack-size metadata |
| `app/schemas` | Pydantic DTOs for request/response validation |
| `app/services` | Business logic (FIFO engine, expiry scanning, analytics) |
| `app/routers` | FastAPI routers exposing REST APIs (`/api/*`) |
| `tests/` | Pytest suite validating FIFO allocation + reporting & alerting |

SQLite ships as the default, but the SQLAlchemy setup works with Postgres/MySQL by updating `DATABASE_URL`.

### Getting Started

```powershell
# 1. Create & activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply migrations (SQLite auto-creates tables)
python -m app.main  # first run will create inventory.db

# 4. Launch the API
uvicorn app.main:app --reload
```

## Frontend Console (React)

SweetStock’s UI is now a dedicated React Router app with focused pages so work doesn’t get congested:

| Route | Purpose |
|-------|---------|
| `/` | Dashboard snapshot (stats, expiry radar, profit pulse, recent sales) |
| `/products` | Register SKUs with helper text + status feedback |
| `/purchases` | Capture inbound batches (supplier roster, expiry, quantity, cost, pack weight in g/kg) + quick-add supplier form |
| `/sales` | Invoice sales with FIFO deduction hints, invoice numbers, retailer roster, and top-seller list |
| `/stock` | Searchable batch ledger, pack-size visibility, and expiry alerts |
| `/reports` | Monthly profit plus top/slow mover analytics |

Each form includes inline helper text, validation, aria-live announcements for success/error banners, and gram/kilogram selectors so you can express packs like “250 g each” or “1 kg box”. Tables surface the same pack-size metadata and show loading states fed by the shared `InventoryProvider` context, so switching routes keeps data in sync.

### Run the console

```powershell
cd frontend
npm install
npm run dev
```

By default the UI points to `http://127.0.0.1:8000`. Override via `frontend/.env`:

```ini
VITE_API_URL=https://your-host:8000
```

### Run both together

Open two terminals:

```powershell
# Terminal 1 – API
uvicorn app.main:app --reload

# Terminal 2 – Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` for the console and `http://127.0.0.1:8000/docs` for the API docs.

> ℹ️ The backend auto-upgrades SQLite tables on startup to add the new `unit_size_value` and `unit_size_unit` columns, so existing datasets pick up gram/kilogram metadata without manual migrations.

## Running Tests

```powershell
.\.venv\Scripts\pytest
```

Frontend build (type-check + bundle):

```powershell
cd frontend
npm run build
```

## Key Endpoints

- `GET /` — quick banner with links to `/docs`, `/health`, and API groups.
- `POST /api/products/` — register products (Motichur Laddoo, Rasgulla, Bikaji, etc.).
- `POST /api/purchases/` — add batches with quantity, cost, supplier link (ID + friendly name), and expiry.
- `POST /api/sales/` — create invoices (with optional retailer link + invoice number); stock auto-deducts FIFO and records allocations.
- `GET /api/stock/` — batch-wise inventory snapshot.
- `GET /api/stock/expiring` — batches expiring within `expiry_alert_days`.
- `/api/reports/top-selling`, `/slow-moving`, `/monthly-profit` — analytics feeds ready for BI tools.
- `/api/suppliers/` — CRUD entry point for supplier master data.
- `/api/retailers/` — CRUD entry point for retailer/partner master data.

## Configuration

Environment overrides (via `.env` or OS vars):

- `APP_NAME`
- `DATABASE_URL` (e.g., `postgresql+psycopg2://user:pass@host/db`)
- `DEBUG`
- `EXPIRY_ALERT_DAYS`

## Next Ideas

1. Attach IoT sensors for automatic stock reconciliation via the same service layer.
2. Add JWT auth & role-based access.
3. Stream events (Kafka/PubSub) for BigQuery-scale analytics.
4. Build mobile/web clients using the documented REST APIs.
=======
# stock-manager
>>>>>>> 4c1c50f27a52e4ddc241d4e1f0071489f00f2693
