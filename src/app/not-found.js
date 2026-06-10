import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-200 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Página no encontrada</h1>
        <p className="text-zinc-500 text-sm mb-8">
          La página que buscas no existe o ha sido eliminada.
        </p>
        <Link
          href="/"
          className="bg-zinc-900 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
