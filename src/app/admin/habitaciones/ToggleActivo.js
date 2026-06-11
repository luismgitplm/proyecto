'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Botón optimista verde/gris que activa o desactiva una habitación del catálogo público;
// el cambio visual es inmediato y se revierte si el servidor falla
export default function ToggleActivo({ roomId, activo }) {
  const router = useRouter()
  const [optimisticActivo, setOptimisticActivo] = useState(activo)

  async function toggle() {
    const anterior = optimisticActivo
    setOptimisticActivo(!optimisticActivo)
    const supabase = createClient()
    const { error } = await supabase.from('rooms').update({ activo: !anterior }).eq('id', roomId)
    if (error) {
      setOptimisticActivo(anterior)
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={toggle}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
        optimisticActivo
          ? 'bg-green-50 text-green-700 hover:bg-green-100'
          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
      }`}
    >
      {optimisticActivo ? 'Activa' : 'Inactiva'}
    </button>
  )
}
