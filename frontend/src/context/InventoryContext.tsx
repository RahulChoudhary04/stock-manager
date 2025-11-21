/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import type {
  ExpiryAlert,
  Product,
  ProfitReport,
  Retailer,
  SaleRead,
  SlowProduct,
  StockOverview,
  Supplier,
  TopProduct,
} from '../types'

interface InventoryContextValue {
  products: Product[]
  suppliers: Supplier[]
  retailers: Retailer[]
  stock: StockOverview | null
  expiryAlerts: ExpiryAlert[]
  topSelling: TopProduct[]
  slowMoving: SlowProduct[]
  profitReport: ProfitReport | null
  sales: SaleRead[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refreshAll: () => Promise<void>
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined)

export const InventoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [stock, setStock] = useState<StockOverview | null>(null)
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([])
  const [topSelling, setTopSelling] = useState<TopProduct[]>([])
  const [slowMoving, setSlowMoving] = useState<SlowProduct[]>([])
  const [profitReport, setProfitReport] = useState<ProfitReport | null>(null)
  const [sales, setSales] = useState<SaleRead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [productList, stockOverview, alerts, top, slow, profit, saleList, supplierList, retailerList] = await Promise.all([
        api.getProducts(),
        api.getStock(),
        api.getExpiryAlerts(),
        api.getTopSelling(5),
        api.getSlowMoving(5),
        api.getProfitReport(),
        api.getSales(),
        api.getSuppliers(),
        api.getRetailers(),
      ])
      setProducts(productList)
      setStock(stockOverview)
      setExpiryAlerts(alerts)
      setTopSelling(top)
      setSlowMoving(slow)
      setProfitReport(profit)
      setSales(saleList)
      setSuppliers(supplierList)
      setRetailers(retailerList)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the API')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const value = useMemo(
    () => ({
      products,
      suppliers,
      retailers,
      stock,
      expiryAlerts,
      topSelling,
      slowMoving,
      profitReport,
      sales,
      loading,
      error,
      lastUpdated,
      refreshAll,
    }),
    [
      products,
      suppliers,
      retailers,
      stock,
      expiryAlerts,
      topSelling,
      slowMoving,
      profitReport,
      sales,
      loading,
      error,
      lastUpdated,
      refreshAll,
    ],
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export const useInventory = (): InventoryContextValue => {
  const ctx = useContext(InventoryContext)
  if (!ctx) {
    throw new Error('useInventory must be used within InventoryProvider')
  }
  return ctx
}
