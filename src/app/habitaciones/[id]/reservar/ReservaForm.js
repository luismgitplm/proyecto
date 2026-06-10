'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ReservaForm({ room, userId }) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const noches =
    checkIn && checkOut
      ? Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
      : 0

  const precioTotal = noches > 0 ? noches * room.precio_por_noche : 0

  const horasHastaEntrada = checkIn
    ? (new Date(checkIn + 'T00:00:00') - new Date()) / (1000 * 60 * 60)
    : null

  const advertencia48h = horasHastaEntrada !== null && horasHastaEntrada > 0 && horasHastaEntrada <= 48

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (noches <= 0) {
      setError('La fecha de salida debe ser posterior a la de entrada.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: solapamiento } = await supabase
      .from('bookings')
      .select('id')
      .eq('habitacion_id', room.id)
      .eq('estado', 'confirmed')
      .lt('fecha_entrada', checkOut)
      .gt('fecha_salida', checkIn)

    if (solapamiento?.length > 0) {
      setError('La habitación no está disponible para las fechas seleccionadas.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('bookings').insert({
      usuario_id: userId,
      habitacion_id: room.id,
      fecha_entrada: checkIn,
      fecha_salida: checkOut,
      precio_total: precioTotal,
    })

    if (error) {
      setError('Error al crear la reserva. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    router.push('/reservas')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Fecha de entrada</label>
        <input
          type="date"
          min={today}
          value={checkIn}
          onChange={e => {
            setCheckIn(e.target.value)
            if (checkOut && e.target.value >= checkOut) setCheckOut('')
          }}
          required
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Fecha de salida</label>
        <input
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={e => setCheckOut(e.target.value)}
          required
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {advertencia48h && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <p className="text-sm text-amber-700">
            La entrada es en menos de 48 horas. Esta reserva no podrá cancelarse una vez confirmada.
          </p>
        </div>
      )}

      {noches > 0 && (
        <div className="bg-zinc-50 rounded-xl p-4 flex justify-between items-center">
          <span className="text-sm text-zinc-600">
            {noches} noche{noches > 1 ? 's' : ''} × {room.precio_por_noche}€
          </span>
          <span className="font-semibold text-zinc-900">{precioTotal.toFixed(2)}€ total</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || noches <= 0}
        className="bg-zinc-900 text-white rounded-xl py-3 font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Reservando...' : 'Confirmar reserva'}
      </button>
    </form>
  )
}
