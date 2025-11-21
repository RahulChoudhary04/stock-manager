import { Link } from 'react-router-dom'
import { useInventory } from '../context/InventoryContext'
import { formatCurrency, formatDate, formatUnitSize } from '../utils/format'

export const DashboardPage = () => {
  const { products, suppliers, retailers, stock, expiryAlerts, topSelling, slowMoving, profitReport, sales, loading } = useInventory()

  const recentSales = sales.slice(0, 6)

  const totalUnits = stock?.total_units ?? 0
  const totalProducts = stock?.total_products ?? products.length
  const batches = stock?.total_batches ?? 0
  const inventoryValue = stock?.batches.reduce((acc, batch) => acc + batch.quantity_remaining * Number(batch.unit_cost), 0) ?? 0
  const supplierCount = suppliers.length
  const retailerCount = retailers.length

  const latestProfit = profitReport?.months.at(-1)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Realtime snapshot of sweets inventory, FIFO deductions, and sales traction.</p>
        </div>
      </div>

      <section className="stat-grid">
        <article className="stat-card">
          <p className="label">Live SKUs</p>
          <p className="value">{totalProducts}</p>
          <p className="hint">Tracked products</p>
        </article>
        <article className="stat-card">
          <p className="label">Units on hand</p>
          <p className="value">{totalUnits}</p>
          <p className="hint">Across {batches} batches</p>
        </article>
        <article className="stat-card">
          <p className="label">Inventory value</p>
          <p className="value">{formatCurrency(inventoryValue)}</p>
          <p className="hint">Based on purchase cost</p>
        </article>
        <article className="stat-card">
          <p className="label">Expiring in 7 days</p>
          <p className="value">{expiryAlerts.length}</p>
          <p className="hint">Monitor perishable stock</p>
        </article>
        <article className="stat-card">
          <p className="label">Suppliers synced</p>
          <p className="value">{supplierCount}</p>
          <p className="hint">Ready for next purchase</p>
        </article>
        <article className="stat-card">
          <p className="label">Retail partners</p>
          <p className="value">{retailerCount}</p>
          <p className="hint">Billable outlets</p>
        </article>
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-header">
            <h2>Expiry radar</h2>
            <Link to="/stock" className="text-link">
              View stock →
            </Link>
          </div>
          <ul className="list">
            {expiryAlerts.slice(0, 4).map((alert) => (
              <li key={`${alert.product_id}-${alert.batch_code}`}>
                <div>
                  <strong>{alert.product_name}</strong>
                  <small>Batch {alert.batch_code}</small>
                </div>
                <div>
                  <span>{alert.quantity_remaining} pcs</span>
                  <small>{formatUnitSize(alert.unit_size_value, alert.unit_size_unit)} each</small>
                </div>
                <div>
                  <small>{alert.days_remaining} days left</small>
                </div>
              </li>
            ))}
            {!expiryAlerts.length && <li className="empty">No batches in the danger zone.</li>}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Profit pulse</h2>
            <Link to="/reports" className="text-link">
              Reports →
            </Link>
          </div>
          {latestProfit ? (
            <div className="profit-card">
              <p className="muted">Month {latestProfit.month}</p>
              <div className="profit-row">
                <span>Revenue</span>
                <strong>{formatCurrency(latestProfit.revenue)}</strong>
              </div>
              <div className="profit-row">
                <span>COGS</span>
                <strong>{formatCurrency(latestProfit.cogs)}</strong>
              </div>
              <div className="profit-row total">
                <span>Profit</span>
                <strong className={Number(latestProfit.profit) >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(latestProfit.profit)}
                </strong>
              </div>
            </div>
          ) : (
            <p className="muted">Log a sale to start tracking profitability.</p>
          )}
        </article>
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-header">
            <h2>Top sellers</h2>
            <Link to="/sales" className="text-link">
              Sales →
            </Link>
          </div>
          <ul className="list">
            {topSelling.map((item) => (
              <li key={item.product_id}>
                <div>
                  <strong>{item.product_name}</strong>
                  <small>{item.total_quantity} units</small>
                </div>
                <span>{formatCurrency(item.total_revenue)}</span>
              </li>
            ))}
            {!topSelling.length && <li className="empty">No sales recorded yet.</li>}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Monitored slow movers</h2>
            <Link to="/reports" className="text-link">
              Review →
            </Link>
          </div>
          <ul className="list">
            {slowMoving.map((item) => (
              <li key={item.product_id}>
                <div>
                  <strong>{item.product_name}</strong>
                </div>
                <span>{item.sold_last_30_days} sold (30d)</span>
              </li>
            ))}
            {!slowMoving.length && <li className="empty">Need more data to highlight trends.</li>}
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Recent sales</h2>
          <p className="muted">FIFO allocations applied automatically.</p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Revenue</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="empty">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && recentSales.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    No sales yet. Head to the Sales page to bill a customer.
                  </td>
                </tr>
              )}
              {!loading &&
                recentSales.length > 0 &&
                recentSales.map((sale) => {
                  const productName = products.find((p) => p.id === sale.product_id)?.name ?? 'Product'
                  const revenue = Number(sale.selling_price) * sale.quantity
                  return (
                    <tr key={sale.id}>
                      <td>
                        {productName}
                        <small>{formatUnitSize(sale.unit_size_value, sale.unit_size_unit)} each</small>
                      </td>
                      <td>{sale.quantity}</td>
                      <td>{formatCurrency(revenue)}</td>
                      <td>{formatDate(sale.sale_date)}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
