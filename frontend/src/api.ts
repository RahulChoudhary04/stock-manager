import type {
  ExpiryAlert,
  Product,
  ProfitReport,
  PurchaseRead,
  Retailer,
  SaleRead,
  SlowProduct,
  StockOverview,
  Supplier,
  TopProduct,
  UnitMeasure,
} from './types'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000'
const MAX_RETRIES = 3
const RETRYABLE_STATUS = new Set([502, 503, 504])

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function request<T>(path: string, options: RequestInit = {}, attempt = 1): Promise<T> {
  const url = `${BASE_URL}${path}`
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_RETRIES) {
        await wait(200 * attempt)
        return request(path, options, attempt + 1)
      }
      let detail = response.statusText
      try {
        const data = await response.json()
        detail = data?.detail ?? JSON.stringify(data)
      } catch {
        /* ignore parse issues */
      }
      throw new Error(detail || 'Request failed')
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof TypeError && attempt < MAX_RETRIES) {
      await wait(200 * attempt)
      return request(path, options, attempt + 1)
    }
    throw error
  }
}

export const api = {
  getProducts: () => request<Product[]>('/api/products/'),
  createProduct: (payload: { name: string; category?: string; brand?: string }) =>
    request<Product>('/api/products/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createPurchase: (payload: {
    product_id: number
    batch_code: string
    quantity: number
    unit_cost: string
    expiry_date: string
    supplier_name?: string
    unit_size_value: string
    unit_size_unit: UnitMeasure
    supplier_id?: number
  }) =>
    request<PurchaseRead>('/api/purchases/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createSale: (payload: {
    product_id: number
    quantity: number
    selling_price: string
    customer_name?: string
    unit_size_value: string
    unit_size_unit: UnitMeasure
    retailer_id?: number
    invoice_number?: string
  }) =>
    request<SaleRead>('/api/sales/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getStock: () => request<StockOverview>('/api/stock/'),
  getExpiryAlerts: () => request<ExpiryAlert[]>('/api/stock/expiring'),
  getSales: () => request<SaleRead[]>('/api/sales/'),
  getTopSelling: (limit = 5) => request<TopProduct[]>(`/api/reports/top-selling?limit=${limit}`),
  getSlowMoving: (limit = 5) => request<SlowProduct[]>(`/api/reports/slow-moving?limit=${limit}`),
  getProfitReport: () => request<ProfitReport>('/api/reports/monthly-profit'),
  getSuppliers: () => request<Supplier[]>('/api/suppliers/'),
  createSupplier: (payload: Omit<Supplier, 'id' | 'created_at'>) =>
    request<Supplier>('/api/suppliers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSupplier: (supplierId: number) =>
    request<void>(`/api/suppliers/${supplierId}`, {
      method: 'DELETE',
    }),
  getRetailers: () => request<Retailer[]>('/api/retailers/'),
  createRetailer: (payload: Omit<Retailer, 'id' | 'created_at'>) =>
    request<Retailer>('/api/retailers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteRetailer: (retailerId: number) =>
    request<void>(`/api/retailers/${retailerId}`, {
      method: 'DELETE',
    }),
}
