// Plain utility (no 'use client' / 'use server' directive) shared between
// the admin dashboard server page and its client filter bar — quick-select
// day/week/month/year ranges resolved into from/to dates for the
// get_admin_financial_stats RPC.

export interface AdminFinancialFilters {
  range: 'day' | 'week' | 'month' | 'year' | ''
  city: string
}

export function rangeToDates(range: AdminFinancialFilters['range']): { from?: string; to?: string } {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  const from = new Date(today)
  if (range === 'day') {
    // from === to, computed below
  } else if (range === 'week') {
    from.setDate(from.getDate() - 7)
  } else if (range === 'month') {
    from.setMonth(from.getMonth() - 1)
  } else if (range === 'year') {
    from.setFullYear(from.getFullYear() - 1)
  } else {
    return {}
  }
  return { from: from.toISOString().slice(0, 10), to }
}
