'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FiltrosReservas({ estado, desde, hasta }) {
  const router = useRouter()
  const [filtroEstado, setFiltroEstado] = useState(estado ?? '')
  const [filtroDesde, setFiltroDesde] = useState(desde ?? '')
  const [filtroHasta, setFiltroHasta] = useState(hasta ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (filtroEstado) params.set('estado', filtroEstado)
    if (filtroDesde) params.set('desde', filtroDesde)
    if (filtroHasta) params.set('hasta', filtroHasta)
    router.push(`/admin/reservas?${params.toString()}`)
  }

  function handleLimpiar() {
    setFiltroEstado('')
    setFiltroDesde('')
    setFiltroHasta('')
    router.push('/admin/reservas')
  }

  const hayFiltros = estado || desde || hasta

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-6">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Estado</label>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
        >
          <option value="">Todas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Fecha de entrada</label>
        <input
          type="date"
          value={filtroDesde}
          onChange={e => {
            setFiltroDesde(e.target.value)
            if (filtroHasta && e.target.value > filtroHasta) setFiltroHasta('')
          }}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Fecha de salida</label>
        <input
          type="date"
          min={filtroDesde}
          value={filtroHasta}
          onChange={e => setFiltroHasta(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
        />
      </div>

      <button
        type="submit"
        className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
      >
        Filtrar
      </button>

      {hayFiltros && (
        <button
          type="button"
          onClick={handleLimpiar}
          className="bg-zinc-200 text-zinc-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-300 transition-colors"
        >
          Limpiar
        </button>
      )}
    </form>
  )
}
