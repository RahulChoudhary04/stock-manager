import { NavLink, Outlet } from 'react-router-dom'
import { useInventory } from '../context/InventoryContext'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/purchases', label: 'Purchases' },
  { to: '/sales', label: 'Sales' },
  { to: '/stock', label: 'Stock' },
  { to: '/reports', label: 'Reports' },
]

export const Layout = () => {
  const { loading, refreshAll, error, lastUpdated } = useInventory()

  const handleRefresh = () => {
    if (!loading) {
      void refreshAll()
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span role="img" aria-label="laddu">
            🍬
          </span>{' '}
          SweetStock
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="sidebar-note">FIFO + expiry aware console for sweets distributors.</p>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">SweetStock Console</p>
            <p className="muted">{lastUpdated ? `Last sync ${lastUpdated.toLocaleTimeString()}` : 'Sync pending…'}</p>
          </div>
          <button className="ghost" onClick={handleRefresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh data'}
          </button>
        </header>

        {error && <div className="alert">{error}</div>}

        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
