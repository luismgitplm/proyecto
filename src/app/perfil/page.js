import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerfilForm from './PerfilForm'

export default async function PerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo, telefono')
    .eq('id', user.id)
    .single()

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <div className="bg-zinc-100 rounded-2xl px-6 py-5 mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Mi perfil</h1>
        <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
      </div>
      <div className="bg-white border border-zinc-200 rounded-2xl p-6">
        <PerfilForm userId={user.id} profile={profile} />
      </div>
    </main>
  )
}
