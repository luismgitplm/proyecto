import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ToggleActivo from './ToggleActivo'

export default async function AdminHabitacionesPage() {
  const supabase = await createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Habitaciones</h1>
        <Link
          href="/admin/habitaciones/nueva"
          className="bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
        >
          + Nueva habitación
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {rooms?.map(room => (
          <div key={room.id} className="border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900">{room.nombre}</p>
              <p className="text-sm text-zinc-500 capitalize">
                {room.tipo} · {room.capacidad} personas · {room.precio_por_noche}€/noche
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ToggleActivo roomId={room.id} activo={room.activo} />
              <Link
                href={`/admin/habitaciones/${room.id}`}
                className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
