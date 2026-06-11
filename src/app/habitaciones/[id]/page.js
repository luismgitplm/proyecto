import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Detalle de habitación: carga por id, muestra 404 si no existe o está inactiva
export default async function HabitacionPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single()

  if (!room) notFound()

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 inline-block">
        ← Volver al catálogo
      </Link>

      <div className="h-72 bg-zinc-100 rounded-2xl flex items-center justify-center mb-8 overflow-hidden">
        {room.imagenes?.[0] ? (
          <img src={room.imagenes[0]} alt={room.nombre} className="w-full h-full object-cover" />
        ) : (
          <span className="text-zinc-400">Sin imagen</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 mb-1">{room.nombre}</h1>
          <span className="text-sm text-zinc-500 capitalize">
            {room.tipo} · {room.capacidad} persona{room.capacidad > 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-semibold text-zinc-900">{room.precio_por_noche}€</span>
          <p className="text-sm text-zinc-400">por noche</p>
        </div>
      </div>

      <p className="text-zinc-600 leading-relaxed mb-8">{room.descripcion}</p>

      <Link
        href={`/habitaciones/${room.id}/reservar`}
        className="inline-block bg-zinc-900 text-white rounded-xl px-8 py-3 font-medium hover:bg-zinc-700 transition-colors"
      >
        Reservar
      </Link>
    </main>
  )
}
