import { useMemo, useState } from 'react'
import { useInventory } from '../context/InventoryContext'
import { formatCurrency, formatDate, formatUnitSize } from '../utils/format'

export const StockPage = () => {
  const { stock, expiryAlerts, loading } = useInventory()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const batches = stock?.batches ?? []
    if (!query.trim()) {
      return batches
    }
    const needle = query.trim().toLowerCase()
    return batches.filter(
      (batch) =>
        batch.product_name.toLowerCase().includes(needle) ||
        batch.batch_code.toLowerCase().includes(needle) ||
        (batch.supplier_name ?? '').toLowerCase().includes(needle),
    )
  }, [stock, query])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Stock</h1>
          <p className="muted">Live view of every batch, supplier, and expiry date.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Batch ledger</h2>
          <p className="muted">Use search to locate a product, batch code, or supplier.</p>
        </div>

        <div className="field search">
          <label htmlFor="stock-search">Quick search</label>
          <input
            id="stock-search"
            placeholder="e.g. Kaju, LOT-2403, Anand Foods"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch</th>
                <th>Pack size</th>
                <th>Supplier</th>
                <th>Qty remaining</th>
                <th>Unit cost</th>
                <th>Expiry</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="empty">
                    Loading stock…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((batch) => (
                  <tr key={batch.batch_id}>
                    <td>{batch.product_name}</td>
                    <td>{batch.batch_code}</td>
                    <td>{formatUnitSize(batch.unit_size_value, batch.unit_size_unit)}</td>
                    <td>{batch.supplier_name || '—'}</td>
                    <td>{batch.quantity_remaining}</td>
                    <td>{formatCurrency(batch.unit_cost)}</td>
                    <td>{formatDate(batch.expiry_date)}</td>
                    <td>{formatDate(batch.purchased_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="empty">
                    No batches match that search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Expiry radar</h2>
          <p className="muted">Batches hitting the 7-day window.</p>
        </div>
        <ul className="list">
          {loading ? (
            <li className="empty">Checking expiries…</li>
          ) : expiryAlerts.length ? (
            expiryAlerts.map((alert) => (
              <li key={`${alert.product_id}-${alert.batch_code}`}>
                <div>
                  <strong>{alert.product_name}</strong>
                  <small>{alert.batch_code}</small>
                </div>
                <div>
                  <span>{alert.quantity_remaining} pcs</span>
                  <small>{formatUnitSize(alert.unit_size_value, alert.unit_size_unit)} each</small>
                </div>
                <div>
                  <small>{alert.days_remaining} days left</small>
                </div>
              </li>
            ))
          ) : (
            <li className="empty">None in the danger zone. 👍</li>
          )}
        </ul>
      </section>
    </div>
  )
}
