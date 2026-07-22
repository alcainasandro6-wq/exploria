interface DashboardHeaderProps {
  title: string
  subtitle?: React.ReactNode
  action?: React.ReactNode
}

export function DashboardHeader({ title, subtitle, action }: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-[#0F6FA3] p-6 sm:p-8 mb-8">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 15% 30%, white 0%, transparent 45%)' }} />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-white/75 mt-1.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
