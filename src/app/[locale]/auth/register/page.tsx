'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const router = useRouter()
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
          data: { full_name: fullName, role: 'customer' },
        },
      })
      if (error) throw error

      if (data.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any).upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'customer',
          locale: 'en',
        })

        toast.success('¡Cuenta creada exitosamente! Bienvenido a BookActivities.')
        router.push('/dashboard/customer')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la cuenta'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('register_title')}</h1>
        <p className="text-slate-500 mt-2">{t('register_subtitle')}</p>
      </div>

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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
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

        <Button type="submit" className="w-full gap-1.5" size="lg" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('register_button')}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>

      <div className="mt-7 text-center">
        <span className="text-sm text-slate-500">¿Ya tienes cuenta? </span>
        <Link href="/auth/login" className="text-sm text-primary font-bold hover:text-primary-dark">
          Inicia sesión
        </Link>
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100 text-center">
        <span className="text-sm text-slate-400">¿Eres proveedor de actividades u hotel? </span>
        <Link href="/providers" className="text-sm text-primary font-bold hover:text-primary-dark">
          Solicita unirte →
        </Link>
      </div>
    </AuthLayout>
  )
}
