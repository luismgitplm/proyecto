import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ReservaForm from './ReservaForm'

// Página de reserva: verifica sesión activa (redirige a login si no) y carga los datos de la habitación
export default async function ReservarPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single()

  if (!room) notFound()

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <Link href={`/habitaciones/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 inline-block">
        ← Volver a la habitación
      </Link>

      <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Reservar</h1>
      <p className="text-zinc-500 text-sm mb-6">
        {room.nombre} · {room.precio_por_noche}€ / noche
      </p>

      <ReservaForm room={room} userId={user.id} />
    </main>
  )
}
