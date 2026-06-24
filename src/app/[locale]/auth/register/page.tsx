'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { Eye, EyeOff, Loader2, User, Building2, Briefcase, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

const ROLES = [
  { value: 'customer' as UserRole, icon: User, labelKey: 'role_customer', desc: 'Reservar actividades turísticas' },
  { value: 'hotel' as UserRole, icon: Building2, labelKey: 'role_hotel', desc: 'Comisiones por reservas de clientes' },
  { value: 'provider' as UserRole, icon: Briefcase, labelKey: 'role_provider', desc: 'Publicar y gestionar actividades' },
]

export default function RegisterPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [step, setStep] = useState<'role' | 'details'>('role')
  const [role, setRole] = useState<UserRole>('customer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      })
      if (error) throw error

      if (data.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any).upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
          locale: 'es',
        })

        const roleRoutes: Record<UserRole, string> = {
          admin: '/dashboard/admin',
          provider: '/dashboard/provider',
          hotel: '/dashboard/hotel',
          customer: '/dashboard/customer',
        }

        toast.success('¡Cuenta creada exitosamente! Bienvenido a Exploria.')
        router.push(roleRoutes[role])
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-[#0066FF] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <span className="text-2xl font-extrabold text-slate-900">Exploria</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{t('register_title')}</h1>
          <p className="text-slate-500 mt-1">{t('register_subtitle')}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {['role', 'details'].map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  step === s || (idx === 1 && step === 'details')
                    ? 'bg-[#0066FF] text-white'
                    : idx === 0 && step === 'details'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                )}
              >
                {idx === 0 && step === 'details' ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className="text-sm text-slate-500 hidden sm:block">
                {idx === 0 ? 'Tipo de cuenta' : 'Datos personales'}
              </span>
              {idx === 0 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {step === 'role' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{t('select_role')}</h2>
              {ROLES.map(({ value, icon: Icon, labelKey, desc }) => (
                <button
                  key={value}
                  onClick={() => setRole(value)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                    role === value
                      ? 'border-[#0066FF] bg-[#0066FF]/5'
                      : 'border-slate-100 hover:border-slate-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                      role === value ? 'bg-[#0066FF] text-white' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{t(labelKey as 'role_customer' | 'role_hotel' | 'role_provider')}</div>
                    <div className="text-sm text-slate-500">{desc}</div>
                  </div>
                  {role === value && (
                    <div className="w-6 h-6 rounded-full bg-[#0066FF] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}

              {role === 'provider' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <strong>Nota:</strong> Como proveedor necesitarás una suscripción activa para publicar actividades. Planes desde <strong>€49/mes</strong>.
                </div>
              )}

              <Button onClick={() => setStep('details')} className="w-full mt-2" size="lg">
                Continuar →
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">{t('full_name')}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">{t('confirm_password')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep('role')} className="flex-1">
                  ← Atrás
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('register_button')}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <span className="text-sm text-slate-500">¿Ya tienes cuenta? </span>
            <Link href="/auth/login" className="text-sm text-[#0066FF] font-semibold hover:underline">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
