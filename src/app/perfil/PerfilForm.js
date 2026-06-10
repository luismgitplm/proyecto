'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PerfilForm({ userId, profile }) {
  const [nombreCompleto, setNombreCompleto] = useState(profile?.nombre_completo ?? '')
  const [telefono, setTelefono] = useState(profile?.telefono ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ nombre_completo: nombreCompleto, telefono })
      .eq('id', userId)

    if (error) {
      setError('Error al guardar los cambios.')
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Nombre completo</label>
        <input
          type="text"
          value={nombreCompleto}
          onChange={e => setNombreCompleto(e.target.value)}
          required
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Teléfono</label>
        <input
          type="tel"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          placeholder="+34 600 000 000"
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      {success && <p className="text-sm text-green-600">Perfil actualizado correctamente.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-zinc-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
