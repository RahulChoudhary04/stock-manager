import { useMemo, useState } from 'react'
import { api } from '../api'
import { useInventory } from '../context/InventoryContext'
import type { ProductForm } from '../types'
import { formatDate } from '../utils/format'

const blankProduct: ProductForm = { name: '', category: '', brand: '' }

export const ProductsPage = () => {
  const { products, refreshAll, loading } = useInventory()
  const [form, setForm] = useState<ProductForm>(blankProduct)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)

  const catalog = useMemo(() => [...products].sort((a, b) => b.id - a.id), [products])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setStatus({ message: 'Give the product a name before saving.', tone: 'error' })
      return
    }

    try {
      setSaving(true)
      await api.createProduct({
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        brand: form.brand.trim() || undefined,
      })
      setForm(blankProduct)
      await refreshAll()
      setStatus({ message: 'Product recorded and ready for purchases.', tone: 'success' })
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : 'Unable to save product', tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="muted">Capture SKUs once, then reuse them across purchases and sales.</p>
        </div>
      </div>

      <section className="page-grid">
        <form className="panel form-card" onSubmit={handleSubmit}>
          <h2>Register a SKU</h2>
          <p className="helper">Name is mandatory; category/brand help reports regroup similar sweets.</p>

          <div className="field">
            <label htmlFor="product-name">Product name *</label>
            <input
              id="product-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Kaju katli 500g"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="product-category">Category</label>
            <input
              id="product-category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              placeholder="Sweets / Gift box"
            />
          </div>

          <div className="field">
            <label htmlFor="product-brand">Brand</label>
            <input
              id="product-brand"
              value={form.brand}
              onChange={(event) => setForm({ ...form, brand: event.target.value })}
              placeholder="Bikaji"
            />
          </div>

          {status && (
            <div className={`status-banner ${status.tone}`} role="status" aria-live="polite">
              {status.message}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </form>

        <article className="panel">
          <div className="panel-header">
            <h2>Catalog ({catalog.length})</h2>
            <p className="muted">Newest first</p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="empty">
                      Loading products…
                    </td>
                  </tr>
                ) : catalog.length ? (
                  catalog.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category || '—'}</td>
                      <td>{product.brand || '—'}</td>
                      <td>{formatDate(product.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="empty">
                      Add your first product to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  )
}
