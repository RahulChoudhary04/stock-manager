import { useInventory } from '../context/InventoryContext'
import { formatCurrency } from '../utils/format'

export const ReportsPage = () => {
  const { profitReport, topSelling, slowMoving, loading } = useInventory()

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p className="muted">Momentum indicators built on live inventory + sales data.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Monthly profit</h2>
          <p className="muted">Revenue − COGS using FIFO costing</p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>COGS</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="empty">
                    Loading profitability…
                  </td>
                </tr>
              ) : profitReport?.months.length ? (
                profitReport.months.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{formatCurrency(row.revenue)}</td>
                    <td>{formatCurrency(row.cogs)}</td>
                    <td className={Number(row.profit) >= 0 ? 'positive' : 'negative'}>{formatCurrency(row.profit)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="empty">
                    Not enough data yet. Log a sale to unlock profitability analytics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid-2">
        <article className="panel">
          <div className="panel-header">
            <h2>Top sellers</h2>
            <p className="muted">By quantity and revenue</p>
          </div>
          <ul className="list">
            {loading ? (
              <li className="empty">Loading data…</li>
            ) : topSelling.length ? (
              topSelling.map((item) => (
                <li key={item.product_id}>
                  <div>
                    <strong>{item.product_name}</strong>
                    <small>{item.total_quantity} units</small>
                  </div>
                  <span>{formatCurrency(item.total_revenue)}</span>
                </li>
              ))
            ) : (
              <li className="empty">No sales captured yet.</li>
            )}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Slow movers</h2>
            <p className="muted">Sold in the last 30 days</p>
          </div>
          <ul className="list">
            {loading ? (
              <li className="empty">Loading data…</li>
            ) : slowMoving.length ? (
              slowMoving.map((item) => (
                <li key={item.product_id}>
                  <div>
                    <strong>{item.product_name}</strong>
                  </div>
                  <span>{item.sold_last_30_days} sold</span>
                </li>
              ))
            ) : (
              <li className="empty">Not enough movement recorded.</li>
            )}
          </ul>
        </article>
      </section>
    </div>
  )
}
