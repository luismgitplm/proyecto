'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Botón optimista verde/gris que alterna el estado de una reserva entre confirmada y cancelada;
// el cambio visual es inmediato y se revierte si el servidor falla
export default function CambiarEstado({ bookingId, estado }) {
  const router = useRouter()
  const [optimisticEstado, setOptimisticEstado] = useState(estado)

  async function toggle() {
    const anterior = optimisticEstado
    const nuevoEstado = optimisticEstado === 'confirmed' ? 'cancelled' : 'confirmed'
    setOptimisticEstado(nuevoEstado)
    const supabase = createClient()
    const { error } = await supabase.from('bookings').update({ estado: nuevoEstado }).eq('id', bookingId)
    if (error) {
      setOptimisticEstado(anterior)
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={toggle}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
        optimisticEstado === 'confirmed'
          ? 'bg-green-50 text-green-700 hover:bg-green-100'
          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
      }`}
    >
      {optimisticEstado === 'confirmed' ? 'Confirmada' : 'Cancelada'}
    </button>
  )
}
