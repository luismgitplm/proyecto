'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CancelarReserva({ bookingId }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [cancelada, setCancelada] = useState(false)
  const [error, setError] = useState(false)

  async function handleCancelar() {
    setCancelada(true)
    setConfirmando(false)
    const supabase = createClient()
    const { error } = await supabase
      .from('bookings')
      .update({ estado: 'cancelled' })
      .eq('id', bookingId)
    if (error) {
      setCancelada(false)
      setError(true)
    } else {
      router.refresh()
    }
  }

  if (cancelada) {
    return <p className="text-sm text-zinc-400 self-start">Cancelando...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600 self-start">Error al cancelar. Inténtalo de nuevo.</p>
  }

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="text-sm text-red-600 hover:text-red-800 self-start"
      >
        Cancelar reserva
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-zinc-600">¿Seguro que quieres cancelar?</p>
      <button
        onClick={handleCancelar}
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        Sí, cancelar
      </button>
      <button
        onClick={() => setConfirmando(false)}
        className="text-sm text-zinc-500 hover:text-zinc-700"
      >
        No
      </button>
    </div>
  )
}
