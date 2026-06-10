'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BuscadorFechas({ fechaEntrada, fechaSalida }) {
  const router = useRouter()
  const hoy = new Date().toISOString().split('T')[0]
  const [entrada, setEntrada] = useState(fechaEntrada ?? '')
  const [salida, setSalida] = useState(fechaSalida ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!entrada || !salida) return
    router.push(`/?fecha_entrada=${entrada}&fecha_salida=${salida}`)
  }

  function handleLimpiar() {
    setEntrada('')
    setSalida('')
    router.push('/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 bg-white border border-zinc-200 rounded-2xl p-4 mb-8">
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
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Salida</label>
        <input
          type="date"
          min={entrada || hoy}
          value={salida}
          onChange={e => setSalida(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <button
        type="submit"
        disabled={!entrada || !salida}
        className="bg-zinc-900 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        Buscar
      </button>

      {(fechaEntrada || fechaSalida) && (
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
