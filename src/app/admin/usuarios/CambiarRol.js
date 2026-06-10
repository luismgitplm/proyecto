'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CambiarRol({ userId, rol }) {
  const router = useRouter()
  const [optimisticRol, setOptimisticRol] = useState(rol)

  async function toggle() {
    const anterior = optimisticRol
    const nuevoRol = optimisticRol === 'admin' ? 'user' : 'admin'
    setOptimisticRol(nuevoRol)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ rol: nuevoRol }).eq('id', userId)
    if (error) {
      setOptimisticRol(anterior)
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={toggle}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
        optimisticRol === 'admin'
          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
      }`}
    >
      {optimisticRol === 'admin' ? 'Admin' : 'Usuario'}
    </button>
  )
}
