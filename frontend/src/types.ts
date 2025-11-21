export interface Product {
  id: number
  name: string
  category?: string | null
  brand?: string | null
  created_at: string
}

export type UnitMeasure = 'g' | 'kg'

export interface Supplier {
  id: number
  name: string
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  gst_number?: string | null
  city?: string | null
  created_at: string
}

export interface Retailer {
  id: number
  name: string
  channel?: string | null
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  gst_number?: string | null
  created_at: string
}

export interface PurchaseRead {
  id: number
  product_id: number
  batch_code: string
  quantity_initial: number
  quantity_remaining: number
  unit_cost: string
  unit_size_value: string
  unit_size_unit: UnitMeasure
  expiry_date: string
  supplier_name?: string | null
  supplier_id?: number | null
  purchased_at: string
  supplier?: Supplier | null
}

export interface StockBatch {
  batch_id: number
  product_id: number
  product_name: string
  batch_code: string
  quantity_remaining: number
  expiry_date: string
  unit_cost: string
  unit_size_value: string
  unit_size_unit: UnitMeasure
  supplier_id?: number | null
  supplier_name?: string | null
  purchased_at: string
}

export interface StockOverview {
  total_products: number
  total_batches: number
  total_units: number
  batches: StockBatch[]
}

export interface ExpiryAlert {
  product_id: number
  product_name: string
  batch_code: string
  expires_on: string
  days_remaining: number
  quantity_remaining: number
  unit_size_value: string
  unit_size_unit: UnitMeasure
}

export interface SaleAllocation {
  batch_id: number
  quantity: number
  unit_cost: string
}

export interface SaleRead {
  id: number
  product_id: number
  retailer_id?: number | null
  quantity: number
  selling_price: string
  sale_date: string
  customer_name?: string | null
  unit_size_value: string
  unit_size_unit: UnitMeasure
  invoice_number?: string | null
  retailer?: Retailer | null
  allocations: SaleAllocation[]
}

export interface TopProduct {
  product_id: number
  product_name: string
  total_quantity: number
  total_revenue: string
}

export interface SlowProduct {
  product_id: number
  product_name: string
  sold_last_30_days: number
}

export interface ProfitLine {
  month: string
  revenue: string
  cogs: string
  profit: string
}

export interface ProfitReport {
  currency: string
  months: ProfitLine[]
}

export type ProductForm = {
  name: string
  category: string
  brand: string
}

export type PurchaseForm = {
  product_id: string
  batch_code: string
  quantity: string
  unit_cost: string
  expiry_date: string
  supplier_name: string
  unit_size_value: string
  unit_size_unit: UnitMeasure
  supplier_id: string
}

export type SaleForm = {
  product_id: string
  quantity: string
  selling_price: string
  customer_name: string
  unit_size_value: string
  unit_size_unit: UnitMeasure
  retailer_id: string
  invoice_number: string
}

export type SupplierForm = {
  name: string
  contact_person: string
  phone: string
  email: string
  gst_number: string
  city: string
}

export type RetailerForm = {
  name: string
  channel: string
  contact_person: string
  phone: string
  email: string
  gst_number: string
}
