'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-200 mb-4">500</p>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Algo ha ido mal</h1>
        <p className="text-zinc-500 text-sm mb-8">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-zinc-900 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="bg-zinc-100 text-zinc-700 rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
