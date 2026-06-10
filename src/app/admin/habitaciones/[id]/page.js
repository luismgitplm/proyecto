import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import HabitacionForm from '../HabitacionForm'

export default async function EditarHabitacionPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: room } = await supabase.from('rooms').select('*').eq('id', id).single()

  if (!room) notFound()

  return (
    <div>
      <Link href="/admin/habitaciones" className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 inline-block">
        ← Volver
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-8">Editar habitación</h1>
      <HabitacionForm room={room} />
    </div>
  )
}
