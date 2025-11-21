import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useInventory } from '../context/InventoryContext'
import type { RetailerForm, SaleForm } from '../types'
import { formatCurrency, formatDate, formatUnitSize, formatWeightFromGrams } from '../utils/format'

const integerFormatter = new Intl.NumberFormat('en-IN')
const RETAILER_OTHER_OPTION = '__other__'

const blankSale: SaleForm = {
  product_id: '',
  quantity: '',
  selling_price: '',
  customer_name: '',
  unit_size_value: '1',
  unit_size_unit: 'kg',
  retailer_id: '',
  invoice_number: '',
}

const blankRetailer: RetailerForm = {
  name: '',
  channel: '',
  contact_person: '',
  phone: '',
  email: '',
  gst_number: '',
}

export const SalesPage = () => {
  const { products, sales, topSelling, retailers, stock, refreshAll, loading } = useInventory()
  const [form, setForm] = useState<SaleForm>(blankSale)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [retailerForm, setRetailerForm] = useState<RetailerForm>(blankRetailer)
  const [retailerStatus, setRetailerStatus] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [savingRetailer, setSavingRetailer] = useState(false)
  const [retailerRosterStatus, setRetailerRosterStatus] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [removingRetailerId, setRemovingRetailerId] = useState<number | null>(null)

  const recentSales = useMemo(() => sales.slice(0, 10), [sales])
  const retailerRoster = useMemo(() => retailers.slice(0, 10), [retailers])
  const selectedProductId = form.product_id ? Number(form.product_id) : null
  const productBatches = useMemo(
    () => (selectedProductId && stock ? stock.batches.filter((batch) => batch.product_id === selectedProductId) : []),
    [stock, selectedProductId],
  )

  const availableUnits = productBatches.reduce((acc, batch) => acc + batch.quantity_remaining, 0)
  const availableWeightGrams = productBatches.reduce((acc, batch) => {
    const perUnit = Number(batch.unit_size_value)
    const gramsPerUnit = Number.isFinite(perUnit) ? perUnit * (batch.unit_size_unit === 'kg' ? 1000 : 1) : 0
    return acc + gramsPerUnit * batch.quantity_remaining
  }, 0)

  const packPresets = useMemo(() => {
    const seen = new Set<string>()
    const presets: Array<{ key: string; unit_size_value: string; unit_size_unit: SaleForm['unit_size_unit']; grams: number }> = []
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
  const quantityNumber = Number(form.quantity)
  const packValueNumber = Number(form.unit_size_value)
  const perPackGrams = Number.isFinite(packValueNumber) && packValueNumber > 0 ? packValueNumber * (form.unit_size_unit === 'kg' ? 1000 : 1) : 0
  const totalSaleGrams = perPackGrams > 0 && quantityNumber > 0 ? perPackGrams * quantityNumber : 0
  const showManualRetailer = form.retailer_id === RETAILER_OTHER_OPTION

  useEffect(() => {
    if (!selectedProductId || !packPresets.length) {
      return
    }
    setForm((prev) => {
      if (Number(prev.product_id) !== selectedProductId) {
        return prev
      }
      const matchesPreset = packPresets.some(
        (preset) => preset.unit_size_value === prev.unit_size_value && preset.unit_size_unit === prev.unit_size_unit,
      )
      if (matchesPreset) {
        return prev
      }
      const preferred = packPresets[0]
      return { ...prev, unit_size_value: preferred.unit_size_value, unit_size_unit: preferred.unit_size_unit }
    })
  }, [selectedProductId, packPresets])

  const handlePackPresetChange = (value: string) => {
    if (!value) {
      return
    }
    const [unitValue, unit] = value.split('__')
    setForm((prev) => ({ ...prev, unit_size_value: unitValue, unit_size_unit: unit as SaleForm['unit_size_unit'] }))
  }

  const handleRetailerSelect = (value: string) => {
    setForm((prev) => {
      if (value === RETAILER_OTHER_OPTION) {
        return { ...prev, retailer_id: value, customer_name: '' }
      }
      const rosterRetailer = value ? retailers.find((retailer) => retailer.id === Number(value)) : undefined
      const nextName = value && !prev.customer_name ? rosterRetailer?.name ?? prev.customer_name : prev.customer_name
      return { ...prev, retailer_id: value, customer_name: nextName }
    })
  }

  const handleDeleteRetailer = async (retailerId: number) => {
    const confirmed = window.confirm('Remove this retailer from the roster?')
    if (!confirmed) {
      return
    }
    try {
      setRemovingRetailerId(retailerId)
      setRetailerRosterStatus(null)
      await api.deleteRetailer(retailerId)
      await refreshAll()
      setRetailerRosterStatus({ message: 'Retailer removed.', tone: 'success' })
    } catch (error) {
      setRetailerRosterStatus({ message: error instanceof Error ? error.message : 'Unable to remove retailer', tone: 'error' })
    } finally {
      setRemovingRetailerId(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.product_id) {
      setStatus({ message: 'Choose a product before invoicing.', tone: 'error' })
      return
    }
    if (!Number(form.quantity) || Number(form.quantity) <= 0) {
      setStatus({ message: 'Quantity must be greater than 0.', tone: 'error' })
      return
    }
    if (availableUnits <= 0) {
      setStatus({ message: 'No stock available for this product.', tone: 'error' })
      return
    }
    if (Number(form.quantity) > availableUnits) {
      setStatus({
        message: `Only ${integerFormatter.format(availableUnits)} units are available. Reduce the quantity or restock first.`,
        tone: 'error',
      })
      return
    }
    if (!Number(form.unit_size_value) || Number(form.unit_size_value) <= 0) {
      setStatus({ message: 'Pack weight must be positive.', tone: 'error' })
      return
    }
    if (form.retailer_id === RETAILER_OTHER_OPTION) {
      if (!form.customer_name.trim()) {
        setStatus({ message: 'Provide the walk-in customer name.', tone: 'error' })
        return
      }
    }

    let retailerIdValue: number | undefined
    if (form.retailer_id && form.retailer_id !== RETAILER_OTHER_OPTION) {
      retailerIdValue = Number(form.retailer_id)
      if (Number.isNaN(retailerIdValue)) {
        setStatus({ message: 'Select a valid retailer or choose Other for walk-ins.', tone: 'error' })
        return
      }
    }

    if (!form.retailer_id) {
      setStatus({ message: 'Choose a retailer or the Other option.', tone: 'error' })
      return
    }

    try {
      setSaving(true)
      await api.createSale({
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        selling_price: form.selling_price,
        customer_name: form.customer_name.trim() || undefined,
        unit_size_value: form.unit_size_value,
        unit_size_unit: form.unit_size_unit,
        retailer_id: retailerIdValue,
        invoice_number: form.invoice_number.trim() || undefined,
      })
      setForm(blankSale)
      await refreshAll()
      setStatus({ message: 'Sale captured. FIFO batches adjusted.', tone: 'success' })
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : 'Unable to book sale', tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleRetailerSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!retailerForm.name.trim()) {
      setRetailerStatus({ message: 'Retailer name is required.', tone: 'error' })
      return
    }
    try {
      setSavingRetailer(true)
      await api.createRetailer({
        name: retailerForm.name.trim(),
        channel: retailerForm.channel.trim() || undefined,
        contact_person: retailerForm.contact_person.trim() || undefined,
        phone: retailerForm.phone.trim() || undefined,
        email: retailerForm.email.trim() || undefined,
        gst_number: retailerForm.gst_number.trim() || undefined,
      })
      setRetailerForm(blankRetailer)
      await refreshAll()
      setRetailerStatus({ message: 'Retail partner saved.', tone: 'success' })
    } catch (error) {
      setRetailerStatus({ message: error instanceof Error ? error.message : 'Unable to save retailer', tone: 'error' })
    } finally {
      setSavingRetailer(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Sales</h1>
          <p className="muted">Generate quick invoices while respecting FIFO cost allocation.</p>
        </div>
      </div>

      <section className="page-grid">
        <form className="panel form-card" onSubmit={handleSubmit}>
          <h2>Invoice a sale</h2>
          <p className="helper">Select the SKU, add customer context, and SweetStock deducts stock for you.</p>

          <div className="field">
            <label htmlFor="sale-product">Product *</label>
            <select
              id="sale-product"
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
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="sale-qty">Quantity *</label>
              <input
                id="sale-qty"
                type="number"
                min={1}
                max={availableUnits || undefined}
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                required
              />
              <p className="hint">
                {availableUnits > 0
                  ? `Available: ${integerFormatter.format(availableUnits)} units (${formatWeightFromGrams(availableWeightGrams)})`
                  : 'No stock available for this SKU.'}
              </p>
              {totalSaleGrams > 0 && perPackGrams > 0 && (
                <p className="hint">
                  This sale: {integerFormatter.format(quantityNumber)} × {formatWeightFromGrams(perPackGrams)} = {formatWeightFromGrams(totalSaleGrams)}
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="sale-price">Selling price *</label>
              <input
                id="sale-price"
                type="number"
                step="0.01"
                min={0}
                value={form.selling_price}
                onChange={(event) => setForm({ ...form, selling_price: event.target.value })}
                required
              />
              <p className="hint">Use unit price, revenue auto-calculated.</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="sale-retailer">Retailer roster *</label>
            <select
              id="sale-retailer"
              value={form.retailer_id}
              onChange={(event) => handleRetailerSelect(event.target.value)}
              required
            >
              <option value="">Select retailer</option>
              {retailers.map((retailer) => (
                <option key={retailer.id} value={retailer.id}>
                  {retailer.name}
                </option>
              ))}
              <option value={RETAILER_OTHER_OPTION}>Other / walk-in</option>
            </select>
            <p className="hint">Keep sales history tied back to each retailer.</p>
          </div>

          {showManualRetailer && (
            <div className="field">
              <label htmlFor="sale-customer">Retailer / customer name *</label>
              <input
                id="sale-customer"
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
                placeholder="Walk-in customer"
                required
              />
              <p className="hint">Use the Add retailer form below to store this outlet for future invoices.</p>
            </div>
          )}

          <div className="field">
            <label htmlFor="sale-invoice">Invoice #</label>
            <input
              id="sale-invoice"
              value={form.invoice_number}
              onChange={(event) => setForm({ ...form, invoice_number: event.target.value })}
              placeholder="INV-2403-001"
            />
            <p className="hint">Helps reconcile billing faster.</p>
          </div>

          {packPresets.length > 0 && (
            <div className="field">
              <label htmlFor="sale-pack-preset">Pack weights in stock</label>
              <select
                id="sale-pack-preset"
                value={currentPackKey ?? ''}
                onChange={(event) => handlePackPresetChange(event.target.value)}
              >
                <option value="">Select available pack</option>
                {packPresets.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {formatUnitSize(preset.unit_size_value, preset.unit_size_unit)} ({formatWeightFromGrams(preset.grams)})
                  </option>
                ))}
              </select>
              <p className="hint">Picking from stock ensures pack weight stays consistent.</p>
            </div>
          )}

          <div className="field-group">
            <div className="field">
              <label htmlFor="sale-pack-value">Pack weight *</label>
              <input
                id="sale-pack-value"
                type="number"
                step="any"
                min={0}
                value={form.unit_size_value}
                onChange={(event) => setForm({ ...form, unit_size_value: event.target.value })}
                required
              />
              <p className="hint">
                {perPackGrams > 0
                  ? `Per pack: ${formatWeightFromGrams(perPackGrams)}`
                  : 'Align with the batch you are fulfilling from.'}
              </p>
            </div>
            <div className="field">
              <label htmlFor="sale-pack-unit">Unit *</label>
              <select
                id="sale-pack-unit"
                value={form.unit_size_unit}
                onChange={(event) => setForm({ ...form, unit_size_unit: event.target.value as SaleForm['unit_size_unit'] })}
                required
              >
                <option value="g">Grams</option>
                <option value="kg">Kilograms</option>
              </select>
            </div>
          </div>

          {status && (
            <div className={`status-banner ${status.tone}`} role="status" aria-live="polite">
              {status.message}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Book sale'}
            </button>
          </div>
        </form>

        <article className="panel">
          <div className="panel-header">
            <h2>Recent invoices</h2>
            <p className="muted">Last 10 entries</p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Pack size</th>
                  <th>Revenue</th>
                  <th>Retailer</th>
                  <th>Invoice</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      Loading sales…
                    </td>
                  </tr>
                ) : recentSales.length ? (
                  recentSales.map((sale) => {
                    const productName = products.find((p) => p.id === sale.product_id)?.name ?? 'Product'
                    const revenue = Number(sale.selling_price) * sale.quantity
                    const retailerName = sale.retailer?.name || sale.customer_name || '—'
                    return (
                      <tr key={sale.id}>
                        <td>{productName}</td>
                        <td>{sale.quantity}</td>
                        <td>{formatUnitSize(sale.unit_size_value, sale.unit_size_unit)}</td>
                        <td>{formatCurrency(revenue)}</td>
                        <td>{retailerName}</td>
                        <td>{sale.invoice_number || '—'}</td>
                        <td>{formatDate(sale.sale_date)}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="empty">
                      Record a sale to see it listed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Top sellers</h2>
          <p className="muted">Rolling view of best performing SKUs</p>
        </div>
        <ul className="list">
          {loading ? (
            <li className="empty">Loading analytics…</li>
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
            <li className="empty">Not enough sales yet.</li>
          )}
        </ul>
      </section>

      <section className="page-grid">
        <form className="panel form-card" onSubmit={handleRetailerSubmit}>
          <h2>Add retailer</h2>
          <p className="helper">Store every shop / distributor and reuse the details on each invoice.</p>

          <div className="field">
            <label htmlFor="retailer-name">Retailer name *</label>
            <input
              id="retailer-name"
              value={retailerForm.name}
              onChange={(event) => setRetailerForm({ ...retailerForm, name: event.target.value })}
              placeholder="Happy Mithai Stores"
              required
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="retailer-channel">Channel</label>
              <input
                id="retailer-channel"
                value={retailerForm.channel}
                onChange={(event) => setRetailerForm({ ...retailerForm, channel: event.target.value })}
                placeholder="Modern trade / Franchise"
              />
            </div>
            <div className="field">
              <label htmlFor="retailer-contact">Contact person</label>
              <input
                id="retailer-contact"
                value={retailerForm.contact_person}
                onChange={(event) => setRetailerForm({ ...retailerForm, contact_person: event.target.value })}
                placeholder="Sonia Jain"
              />
            </div>
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="retailer-phone">Phone</label>
              <input
                id="retailer-phone"
                value={retailerForm.phone}
                onChange={(event) => setRetailerForm({ ...retailerForm, phone: event.target.value })}
                placeholder="98989 22211"
              />
            </div>
            <div className="field">
              <label htmlFor="retailer-email">Email</label>
              <input
                id="retailer-email"
                value={retailerForm.email}
                onChange={(event) => setRetailerForm({ ...retailerForm, email: event.target.value })}
                placeholder="orders@happymithai.in"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="retailer-gst">GSTIN</label>
            <input
              id="retailer-gst"
              value={retailerForm.gst_number}
              onChange={(event) => setRetailerForm({ ...retailerForm, gst_number: event.target.value })}
              placeholder="27ABCDE1234F1Z5"
            />
          </div>

          {retailerStatus && (
            <div className={`status-banner ${retailerStatus.tone}`} role="status" aria-live="polite">
              {retailerStatus.message}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={savingRetailer}>
              {savingRetailer ? 'Saving…' : 'Save retailer'}
            </button>
          </div>
        </form>

        <article className="panel">
          <div className="panel-header">
            <h2>Retail partner list</h2>
            <p className="muted">Tracks top 10 for quick billing.</p>
          </div>
          {retailerRosterStatus && (
            <div className={`status-banner ${retailerRosterStatus.tone}`} role="status" aria-live="polite">
              {retailerRosterStatus.message}
            </div>
          )}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Channel</th>
                  <th>Phone</th>
                  <th>GSTIN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="empty">
                      Loading retailers…
                    </td>
                  </tr>
                ) : retailerRoster.length ? (
                  retailerRoster.map((retailer) => (
                    <tr key={retailer.id}>
                      <td>{retailer.name}</td>
                      <td>{retailer.channel || '—'}</td>
                      <td>{retailer.phone || '—'}</td>
                      <td>{retailer.gst_number || '—'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDeleteRetailer(retailer.id)}
                          disabled={removingRetailerId === retailer.id}
                        >
                          {removingRetailerId === retailer.id ? 'Removing…' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      Register your retail partners to keep billing organized.
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
