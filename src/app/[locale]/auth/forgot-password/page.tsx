'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Loader2, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/login`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('forgot_error_fallback'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <MailCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{t('forgot_check_email_title')}</h1>
          <p className="text-slate-500 mb-8">
            {t.rich('forgot_check_email_desc', {
              email,
              bold: (chunks) => <strong className="text-slate-700">{chunks}</strong>,
            })}
          </p>
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-primary font-bold hover:text-primary-dark">
            <ArrowLeft className="w-4 h-4" />
            {t('forgot_back_to_login')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('forgot_title')}</h1>
        <p className="text-slate-500 mt-2">{t('forgot_subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('placeholder_email')}
            required
            autoComplete="email"
          />
        </div>

        <Button type="submit" className="w-full gap-1.5" size="lg" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('forgot_send_button')}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>

      <div className="mt-7 text-center">
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium">
          <ArrowLeft className="w-4 h-4" />
          {t('forgot_back_to_login')}
        </Link>
      </div>
    </AuthLayout>
  )
}
