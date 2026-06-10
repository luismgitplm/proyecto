import { createClient } from '@/lib/supabase/server'
import CambiarEstado from './CambiarEstado'
import FiltrosReservas from './FiltrosReservas'

export default async function AdminReservasPage({ searchParams }) {
  const { estado, desde, hasta } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select('*, rooms(nombre)')
    .order('fecha_entrada', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (desde) query = query.gte('fecha_entrada', desde)
  if (hasta) query = query.lte('fecha_salida', hasta)

  const { data: bookings } = await query

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Reservas</h1>

      <FiltrosReservas estado={estado} desde={desde} hasta={hasta} />

      {bookings?.length === 0 ? (
        <p className="text-zinc-400 text-sm">No hay reservas con los filtros seleccionados.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings?.map(booking => (
            <div key={booking.id} className="border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">{booking.rooms?.nombre}</p>
                <p className="text-sm text-zinc-500">
                  {formatDate(booking.fecha_entrada)} → {formatDate(booking.fecha_salida)} · {booking.precio_total}€
                </p>
              </div>
              <CambiarEstado bookingId={booking.id} estado={booking.estado} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
