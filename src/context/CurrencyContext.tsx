'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type Currency = 'EUR' | 'USD' | 'GBP'

interface CurrencyContextValue {
  currency: Currency
  setCurrency: (c: Currency) => void
  symbol: string
  rate: number
}

const RATES: Record<Currency, number> = { EUR: 1, USD: 1.09, GBP: 0.86 }
const SYMBOLS: Record<Currency, string> = { EUR: '€', USD: '$', GBP: '£' }

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'EUR',
  setCurrency: () => {},
  symbol: '€',
  rate: 1,
})

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('EUR')
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, symbol: SYMBOLS[currency], rate: RATES[currency] }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}

export function formatWithCurrency(amount: number, currency: Currency): string {
  const converted = amount * RATES[currency]
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(converted)
}
