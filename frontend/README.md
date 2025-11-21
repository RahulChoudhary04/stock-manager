# SweetStock Frontend

React + TypeScript dashboard that sits on top of the FastAPI backend. It focuses on three day-to-day workflows: stocking batches, logging purchases/sales, and monitoring expiry & profitability.

## Available views

- **Hero stats** – SKU count, total units, valuation, and expiring batches.
- **Data entry** – Inline forms for products, purchases, and sales (FIFO-aware).
- **Stock table** – Batch-wise quantities with supplier, cost, and expiry.
- **Expiry radar** – Items due within the configured alert window.
- **Sales & reports** – Recent invoices, top/slow movers, and monthly profit summary.

## Getting started

```powershell
cd frontend
npm install
npm run dev
```

The app expects the FastAPI server to run on `http://127.0.0.1:8000`. If your backend lives elsewhere, create a `.env` file in `frontend/` with:

```ini
VITE_API_URL=https://your-host:8000
```

### Production build

```powershell
npm run build
npm run preview
```

`npm run build` performs type-checking via `tsc -b` before bundling.

## Tech stack

- Vite + React 19 + TypeScript
- CSS modules (single `App.css`) for lightweight styling
- Native Fetch API with a small helper (`src/api.ts`) for network calls

Feel free to layer in routing, authentication, or charts as the product evolves.
