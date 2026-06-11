import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CancelarReserva from './CancelarReserva'

// Lista las reservas del usuario divididas en "Próximas" (fecha_salida ≥ hoy) y "Pasadas"
export default async function ReservasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, rooms(nombre, tipo)')
    .eq('usuario_id', user.id)
    .order('fecha_entrada', { ascending: false })

  const today = new Date().toISOString().split('T')[0]

  const proximas = []
  const pasadas = []
  for (const booking of bookings ?? []) {
    if (booking.fecha_salida >= today) {
      proximas.push(booking)
    } else {
      pasadas.push(booking)
    }
  }

  return (
    <>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-zinc-100 rounded-2xl px-6 py-5 mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Mis reservas</h1>
          <p className="text-sm text-zinc-500 mt-1">Consulta y gestiona tus estancias</p>
        </div>
        <section className="mb-10">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Próximas</h2>
          {proximas.length === 0 ? (
            <p className="text-zinc-400 text-sm">No tienes reservas próximas.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {proximas.map(booking => (
                <ReservaCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Pasadas</h2>
          {pasadas.length === 0 ? (
            <p className="text-zinc-400 text-sm">No tienes reservas pasadas.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {pasadas.map(booking => (
                <ReservaCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        <Link href="/" className="inline-block mt-10 text-sm text-zinc-500 hover:text-zinc-900">
          ← Ver habitaciones
        </Link>
      </main>
    </>
  )
}

// Tarjeta individual de reserva: calcula si la cancelación está disponible (>48h) o bloqueada (<48h)
function ReservaCard({ booking }) {
  const ahora = new Date()
  const fechaEntrada = new Date(booking.fecha_entrada + 'T00:00:00')
  const horasHastaEntrada = (fechaEntrada - ahora) / (1000 * 60 * 60)

  const esCancelable = booking.estado === 'confirmed' && horasHastaEntrada > 48
  const bloqueada    = booking.estado === 'confirmed' && horasHastaEntrada > 0 && horasHastaEntrada <= 48

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-zinc-900">{booking.rooms?.nombre}</p>
          <p className="text-sm text-zinc-500 capitalize">{booking.rooms?.tipo}</p>
        </div>
        <EstadoBadge estado={booking.estado} />
      </div>

      <div className="flex gap-6 text-sm text-zinc-600">
        <div>
          <p className="text-xs text-zinc-400">Entrada</p>
          <p>{formatDate(booking.fecha_entrada)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Salida</p>
          <p>{formatDate(booking.fecha_salida)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Total</p>
          <p className="font-medium text-zinc-900">{booking.precio_total}€</p>
        </div>
      </div>

      {esCancelable && <CancelarReserva bookingId={booking.id} />}
      {bloqueada && (
        <p className="text-xs text-zinc-400">
          Cancelación no disponible — faltan menos de 48 h para la entrada.
        </p>
      )}
    </div>
  )
}

// Badge visual verde (confirmada) o gris (cancelada) según el estado de la reserva
function EstadoBadge({ estado }) {
  const styles = { confirmed: 'bg-green-50 text-green-700', cancelled: 'bg-zinc-100 text-zinc-500' }
  const labels = { confirmed: 'Confirmada', cancelled: 'Cancelada' }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[estado]}`}>
      {labels[estado]}
    </span>
  )
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
