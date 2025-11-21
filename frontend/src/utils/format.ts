const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const quantityFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
})

export const formatCurrency = (value: number | string) => {
  const amount = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(amount)) {
    return '—'
  }
  return currencyFormatter.format(amount)
}

export const formatDate = (value: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export const formatUnitSize = (value: number | string, unit: 'g' | 'kg') => {
  const numericValue = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(numericValue)) {
    return '—'
  }
  const formatted = quantityFormatter.format(numericValue)
  return `${formatted} ${unit === 'kg' ? 'kg' : 'g'}`
}

export const formatWeightFromGrams = (grams: number) => {
  if (!Number.isFinite(grams)) {
    return '—'
  }
  if (Math.abs(grams) >= 1000) {
    const kgValue = grams / 1000
    return `${quantityFormatter.format(kgValue)} kg (${quantityFormatter.format(grams)} g)`
  }
  return `${quantityFormatter.format(grams)} g`
}
