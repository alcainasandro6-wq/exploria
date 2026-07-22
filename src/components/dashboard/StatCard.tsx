import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  color?: 'primary' | 'emerald' | 'amber' | 'purple' | 'rose' | 'blue' | 'indigo' | 'cyan' | 'green'
  trend?: { value: number; label?: string }
}

const COLOR_MAP: Record<NonNullable<StatCardProps['color']>, string> = {
  primary: 'text-primary bg-primary/10',
  emerald: 'text-emerald-600 bg-emerald-50',
  amber: 'text-amber-600 bg-amber-50',
  purple: 'text-purple-600 bg-purple-50',
  rose: 'text-rose-600 bg-rose-50',
  blue: 'text-blue-600 bg-blue-50',
  indigo: 'text-indigo-600 bg-indigo-50',
  cyan: 'text-cyan-600 bg-cyan-50',
  green: 'text-green-600 bg-green-50',
}

export function StatCard({ icon: Icon, label, value, color = 'primary', trend }: StatCardProps) {
  return (
    <div className="group bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105', COLOR_MAP[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md',
              trend.value >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
            )}
          >
            {trend.value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}
