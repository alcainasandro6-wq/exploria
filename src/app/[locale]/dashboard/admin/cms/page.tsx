import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getAllBlogPostsAdmin } from '@/lib/services/blog'
import { CreateBlogPostForm } from '@/components/dashboard/admin/CreateBlogPostForm'
import { BlogPostRow } from '@/components/dashboard/admin/BlogPostRow'

export default async function AdminCmsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const posts = await getAllBlogPostsAdmin()

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Blog / CMS" subtitle={`${posts.length} artículos`} />

      <Card className="mb-6">
        <CardHeader><CardTitle>Nuevo artículo</CardTitle></CardHeader>
        <CardContent>
          <CreateBlogPostForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Todos los artículos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">Todavía no hay artículos creados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Título</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Categoría</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Creado</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => <BlogPostRow key={post.id} post={post} />)}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
