'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Barra de filtros del catálogo: fechas de entrada/salida + pills por tipo.
// Los cambios de tipo aplican el filtro inmediatamente sin necesidad de pulsar Buscar.
export default function FiltrosCatalogo({ fechaEntrada, fechaSalida, tipo, tipos }) {
  const router = useRouter()
  const hoy = new Date().toISOString().split('T')[0]

  const [entrada, setEntrada] = useState(fechaEntrada ?? '')
  const [salida, setSalida]   = useState(fechaSalida ?? '')
  const [tipoSel, setTipoSel] = useState(tipo ?? '')

  // Construye los searchParams con los filtros activos y navega sin resetear el scroll
  function handleSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (entrada)  params.set('fecha_entrada', entrada)
    if (salida)   params.set('fecha_salida', salida)
    if (tipoSel)  params.set('tipo', tipoSel)
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  // Al pulsar una pill de tipo aplica el filtro inmediatamente conservando las fechas ya seleccionadas
  function navegarConTipo(t) {
    setTipoSel(t)
    const params = new URLSearchParams()
    if (entrada) params.set('fecha_entrada', entrada)
    if (salida)  params.set('fecha_salida', salida)
    if (t)       params.set('tipo', t)
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  // Borra todos los filtros y vuelve al catálogo completo
  function handleLimpiar() {
    setEntrada('')
    setSalida('')
    setTipoSel('')
    router.push('/', { scroll: false })
  }

  const hayFiltros = fechaEntrada || fechaSalida || tipo

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <div className="flex flex-col sm:flex-row flex-wrap justify-center items-stretch sm:items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Entrada</label>
          <input
            type="date"
            min={hoy}
            value={entrada}
            onChange={e => {
              setEntrada(e.target.value)
              if (salida && e.target.value >= salida) setSalida('')
            }}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Salida</label>
          <input
            type="date"
            min={entrada || hoy}
            value={salida}
            onChange={e => setSalida(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
          />
        </div>

        <button
          type="submit"
          className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          Buscar
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
      </div>

      {/* Pills de tipo */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => navegarConTipo('')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !tipoSel
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-amber-100 hover:text-zinc-900'
          }`}
        >
          Todos
        </button>
        {tipos.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => navegarConTipo(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              tipoSel === t
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-amber-100 hover:text-zinc-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </form>
  )
}
