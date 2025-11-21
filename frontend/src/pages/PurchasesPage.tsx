import { useMemo, useState } from 'react'
import { api } from '../api'
import { useInventory } from '../context/InventoryContext'
import type { PurchaseForm, SupplierForm } from '../types'
import { formatCurrency, formatDate, formatUnitSize, formatWeightFromGrams } from '../utils/format'

const integerFormatter = new Intl.NumberFormat('en-IN')
const SUPPLIER_OTHER_OPTION = '__other__'

const blankPurchase: PurchaseForm = {
  product_id: '',
  batch_code: '',
  quantity: '',
  unit_cost: '',
  expiry_date: '',
  supplier_name: '',
  unit_size_value: '1',
  unit_size_unit: 'kg',
  supplier_id: '',
}

const blankSupplier: SupplierForm = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  gst_number: '',
  city: '',
}

export const PurchasesPage = () => {
  const { products, stock, suppliers, refreshAll, loading } = useInventory()
  const [form, setForm] = useState<PurchaseForm>(blankPurchase)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(blankSupplier)
  const [supplierStatus, setSupplierStatus] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [savingSupplier, setSavingSupplier] = useState(false)
  const [supplierRosterStatus, setSupplierRosterStatus] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [removingSupplierId, setRemovingSupplierId] = useState<number | null>(null)

  const recentBatches = useMemo(() => stock?.batches.slice(0, 8) ?? [], [stock])
  const supplierRoster = useMemo(() => suppliers.slice(0, 8), [suppliers])
  const selectedProductId = form.product_id ? Number(form.product_id) : null
  const productBatches = useMemo(
    () => (selectedProductId && stock ? stock.batches.filter((batch) => batch.product_id === selectedProductId) : []),
    [stock, selectedProductId],
  )
  const packPresets = useMemo(() => {
    const seen = new Set<string>()
    const presets: Array<{ key: string; unit_size_value: string; unit_size_unit: PurchaseForm['unit_size_unit']; grams: number }> = []
    productBatches.forEach((batch) => {
      const key = `${batch.unit_size_value}__${batch.unit_size_unit}`
      if (seen.has(key)) {
        return
      }
      seen.add(key)
      const numericValue = Number(batch.unit_size_value)
      const grams = Number.isFinite(numericValue) ? numericValue * (batch.unit_size_unit === 'kg' ? 1000 : 1) : 0
      presets.push({ key, unit_size_value: batch.unit_size_value, unit_size_unit: batch.unit_size_unit, grams })
    })
    return presets
  }, [productBatches])
  const currentPackKey = packPresets.find(
    (preset) => preset.unit_size_value === form.unit_size_value && preset.unit_size_unit === form.unit_size_unit,
  )?.key

  const packValueNumber = Number(form.unit_size_value)
  const quantityNumber = Number(form.quantity)
  const perPackGrams = Number.isFinite(packValueNumber) && packValueNumber > 0 ? (form.unit_size_unit === 'kg' ? packValueNumber * 1000 : packValueNumber) : 0
  const totalGrams = quantityNumber > 0 && perPackGrams > 0 ? quantityNumber * perPackGrams : 0
  const packWeightHint = perPackGrams > 0
    ? `Per pack: ${formatWeightFromGrams(perPackGrams)}`
    : 'Example: 0.25 for 250 grams, 1 for a kilo box.'
  const totalWeightHint = totalGrams > 0
    ? `Batch weight: ${integerFormatter.format(quantityNumber)} units × ${formatWeightFromGrams(perPackGrams)} = ${formatWeightFromGrams(totalGrams)}`
    : ''

  const handleSupplierSelect = (value: string) => {
    setForm((prev) => {
      if (value === SUPPLIER_OTHER_OPTION) {
        return { ...prev, supplier_id: value, supplier_name: '' }
      }
      const rosterSupplier = value ? suppliers.find((supplier) => supplier.id === Number(value)) : undefined
      const nextName = rosterSupplier?.name ?? prev.supplier_name
      return { ...prev, supplier_id: value, supplier_name: nextName }
    })
  }

  const handlePackPresetChange = (value: string) => {
    if (!value) {
      return
    }
    const [unitValue, unit] = value.split('__')
    setForm((prev) => ({ ...prev, unit_size_value: unitValue, unit_size_unit: unit as PurchaseForm['unit_size_unit'] }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.product_id) {
      setStatus({ message: 'Select a product before recording a purchase.', tone: 'error' })
      return
    }
    if (!Number(form.quantity) || Number(form.quantity) <= 0) {
      setStatus({ message: 'Quantity must be a positive number.', tone: 'error' })
      return
    }
    if (!Number(form.unit_size_value) || Number(form.unit_size_value) <= 0) {
      setStatus({ message: 'Pack weight must be a positive number.', tone: 'error' })
      return
    }
    if (form.supplier_id === SUPPLIER_OTHER_OPTION && !form.supplier_name.trim()) {
      setStatus({ message: 'Enter the supplier name or pick from the roster.', tone: 'error' })
      return
    }

    try {
      setSaving(true)
      await api.createPurchase({
        product_id: Number(form.product_id),
        batch_code: form.batch_code.trim(),
        quantity: Number(form.quantity),
        unit_cost: form.unit_cost,
        expiry_date: form.expiry_date,
        supplier_name: form.supplier_name.trim() || undefined,
        unit_size_value: form.unit_size_value,
        unit_size_unit: form.unit_size_unit,
        supplier_id:
          form.supplier_id && form.supplier_id !== SUPPLIER_OTHER_OPTION ? Number(form.supplier_id) : undefined,
      })
      setForm(blankPurchase)
      await refreshAll()
      setStatus({ message: 'Stock added. FIFO queues updated.', tone: 'success' })
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : 'Unable to save purchase', tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSupplierSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supplierForm.name.trim()) {
      setSupplierStatus({ message: 'Give the supplier a name.', tone: 'error' })
      return
    }
    try {
      setSavingSupplier(true)
      await api.createSupplier({
        name: supplierForm.name.trim(),
        contact_person: supplierForm.contact_person.trim() || undefined,
        phone: supplierForm.phone.trim() || undefined,
        email: supplierForm.email.trim() || undefined,
        gst_number: supplierForm.gst_number.trim() || undefined,
        city: supplierForm.city.trim() || undefined,
      })
      setSupplierForm(blankSupplier)
      await refreshAll()
      setSupplierStatus({ message: 'Supplier saved.', tone: 'success' })
    } catch (error) {
      setSupplierStatus({ message: error instanceof Error ? error.message : 'Unable to save supplier', tone: 'error' })
    } finally {
      setSavingSupplier(false)
    }
  }

  const handleDeleteSupplier = async (supplierId: number) => {
    const confirmed = window.confirm('Remove this supplier from the roster?')
    if (!confirmed) {
      return
    }
    try {
      setRemovingSupplierId(supplierId)
      setSupplierRosterStatus(null)
      await api.deleteSupplier(supplierId)
      await refreshAll()
      setSupplierRosterStatus({ message: 'Supplier removed.', tone: 'success' })
    } catch (error) {
      setSupplierRosterStatus({ message: error instanceof Error ? error.message : 'Unable to remove supplier', tone: 'error' })
    } finally {
      setRemovingSupplierId(null)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Purchases</h1>
          <p className="muted">Every batch captured here feeds FIFO calculations and expiry radar.</p>
        </div>
      </div>

      <section className="page-grid">
        <form className="panel form-card" onSubmit={handleSubmit}>
          <h2>Record incoming batch</h2>
          <p className="helper">Batch code + expiry make each record unique. Unit cost drives COGS.</p>

          <div className="field">
            <label htmlFor="purchase-product">Product *</label>
            <select
              id="purchase-product"
              value={form.product_id}
              onChange={(event) => setForm({ ...form, product_id: event.target.value })}
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <p className="hint">Missing? Head to Products first.</p>
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="purchase-batch">Batch code *</label>
              <input
                id="purchase-batch"
                value={form.batch_code}
                onChange={(event) => setForm({ ...form, batch_code: event.target.value })}
                placeholder="LOT-2403"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="purchase-qty">Quantity *</label>
              <input
                id="purchase-qty"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                required
              />
            </div>
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="purchase-cost">Unit cost (₹) *</label>
              <input
                id="purchase-cost"
                type="number"
                step="0.01"
                min={0}
                value={form.unit_cost}
                onChange={(event) => setForm({ ...form, unit_cost: event.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="purchase-expiry">Expiry date *</label>
              <input
                id="purchase-expiry"
                type="date"
                value={form.expiry_date}
                onChange={(event) => setForm({ ...form, expiry_date: event.target.value })}
                required
              />
            </div>
          </div>

          {packPresets.length > 0 && (
            <div className="field">
              <label htmlFor="purchase-pack-preset">Common pack sizes</label>
              <select
                id="purchase-pack-preset"
                value={currentPackKey ?? ''}
                onChange={(event) => handlePackPresetChange(event.target.value)}
              >
                <option value="">Select from stock</option>
                {packPresets.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {formatUnitSize(preset.unit_size_value, preset.unit_size_unit)} ({formatWeightFromGrams(preset.grams)})
                  </option>
                ))}
              </select>
              <p className="hint">Pick an existing pack to stay consistent with current inventory.</p>
            </div>
          )}

          <div className="field-group">
            <div className="field">
              <label htmlFor="purchase-pack-value">Pack weight *</label>
              <input
                id="purchase-pack-value"
                type="number"
                step="any"
                min={0}
                value={form.unit_size_value}
                onChange={(event) => setForm({ ...form, unit_size_value: event.target.value })}
                required
              />
              <p className="hint">{packWeightHint}</p>
            </div>
            <div className="field">
              <label htmlFor="purchase-pack-unit">Unit *</label>
              <select
                id="purchase-pack-unit"
                value={form.unit_size_unit}
                onChange={(event) => setForm({ ...form, unit_size_unit: event.target.value as PurchaseForm['unit_size_unit'] })}
                required
              >
                <option value="g">Grams</option>
                <option value="kg">Kilograms</option>
              </select>
            </div>
          </div>

          {totalWeightHint && <p className="hint" aria-live="polite">{totalWeightHint}</p>}

          <div className="field">
            <label htmlFor="purchase-supplier-select">Supplier roster</label>
            <select
              id="purchase-supplier-select"
              value={form.supplier_id}
              onChange={(event) => handleSupplierSelect(event.target.value)}
              required
            >
              <option value="">Select supplier</option>
              <option value={SUPPLIER_OTHER_OPTION}>Other / new supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <p className="hint">Selecting a supplier keeps batch history tied to their profile.</p>
          </div>

          {form.supplier_id === SUPPLIER_OTHER_OPTION && (
            <div className="field">
              <label htmlFor="purchase-supplier">Supplier name *</label>
              <input
                id="purchase-supplier"
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
                placeholder="Anand Foods"
                required
              />
              <p className="hint">Prefer adding this supplier below so it appears in the roster next time.</p>
            </div>
          )}

          {status && (
            <div className={`status-banner ${status.tone}`} role="status" aria-live="polite">
              {status.message}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add to inventory'}
            </button>
          </div>
        </form>

        <article className="panel">
          <div className="panel-header">
            <h2>Recent batches</h2>
            <p className="muted">Newest eight entries</p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Batch</th>
                  <th>Pack size</th>
                  <th>Total weight</th>
                  <th>Qty left</th>
                  <th>Unit cost</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      Loading batches…
                    </td>
                  </tr>
                ) : recentBatches.length ? (
                  recentBatches.map((batch) => {
                    const perUnit = Number(batch.unit_size_value)
                    const gramsPerUnit = Number.isFinite(perUnit) ? perUnit * (batch.unit_size_unit === 'kg' ? 1000 : 1) : 0
                    const totalBatchGrams = gramsPerUnit * batch.quantity_remaining
                    return (
                      <tr key={batch.batch_id}>
                        <td>{batch.product_name}</td>
                        <td>
                          <strong>{batch.batch_code}</strong>
                          <small>{batch.supplier_name || '—'}</small>
                        </td>
                        <td>{formatUnitSize(batch.unit_size_value, batch.unit_size_unit)}</td>
                        <td>{formatWeightFromGrams(totalBatchGrams)}</td>
                        <td>{batch.quantity_remaining}</td>
                        <td>{formatCurrency(batch.unit_cost)}</td>
                        <td>{formatDate(batch.expiry_date)}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="empty">
                      Add a batch to see it tracked here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="page-grid">
        <form className="panel form-card" onSubmit={handleSupplierSubmit}>
          <h2>Add supplier</h2>
          <p className="helper">Capture basic contact info once and reuse it in every purchase.</p>

          <div className="field">
            <label htmlFor="supplier-name">Supplier name *</label>
            <input
              id="supplier-name"
              value={supplierForm.name}
              onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })}
              placeholder="Anand Foods"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="supplier-contact">Contact person</label>
            <input
              id="supplier-contact"
              value={supplierForm.contact_person}
              onChange={(event) => setSupplierForm({ ...supplierForm, contact_person: event.target.value })}
              placeholder="Neha Anand"
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="supplier-phone">Phone</label>
              <input
                id="supplier-phone"
                value={supplierForm.phone}
                onChange={(event) => setSupplierForm({ ...supplierForm, phone: event.target.value })}
                placeholder="98765 43210"
              />
            </div>
            <div className="field">
              <label htmlFor="supplier-email">Email</label>
              <input
                id="supplier-email"
                value={supplierForm.email}
                onChange={(event) => setSupplierForm({ ...supplierForm, email: event.target.value })}
                placeholder="hello@anandfoods.in"
              />
            </div>
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="supplier-gst">GSTIN</label>
              <input
                id="supplier-gst"
                value={supplierForm.gst_number}
                onChange={(event) => setSupplierForm({ ...supplierForm, gst_number: event.target.value })}
                placeholder="27ABCDE1234F1Z5"
              />
            </div>
            <div className="field">
              <label htmlFor="supplier-city">City</label>
              <input
                id="supplier-city"
                value={supplierForm.city}
                onChange={(event) => setSupplierForm({ ...supplierForm, city: event.target.value })}
                placeholder="Surat"
              />
            </div>
          </div>

          {supplierStatus && (
            <div className={`status-banner ${supplierStatus.tone}`} role="status" aria-live="polite">
              {supplierStatus.message}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={savingSupplier}>
              {savingSupplier ? 'Saving…' : 'Save supplier'}
            </button>
          </div>
        </form>

        <article className="panel">
          <div className="panel-header">
            <h2>Supplier roster</h2>
            <p className="muted">Recently added partners</p>
          </div>
          {supplierRosterStatus && (
            <div className={`status-banner ${supplierRosterStatus.tone}`} role="status" aria-live="polite">
              {supplierRosterStatus.message}
            </div>
          )}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Phone</th>
                  <th>GSTIN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="empty">
                      Loading suppliers…
                    </td>
                  </tr>
                ) : supplierRoster.length ? (
                  supplierRoster.map((supplier) => (
                    <tr key={supplier.id}>
                      <td>{supplier.name}</td>
                      <td>{supplier.city || '—'}</td>
                      <td>{supplier.phone || '—'}</td>
                      <td>{supplier.gst_number || '—'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          disabled={removingSupplierId === supplier.id}
                        >
                          {removingSupplierId === supplier.id ? 'Removing…' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      Add your supplier network to move faster during peak season.
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
