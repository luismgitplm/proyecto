import Link from 'next/link'

export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col sm:flex-row flex-1">
      <aside className="sm:w-52 border-b sm:border-b-0 sm:border-r border-zinc-200 bg-zinc-100 p-4 sm:p-6 flex flex-row sm:flex-col overflow-x-auto gap-1 shrink-0">
        <p className="hidden sm:block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Panel admin</p>
        <Link href="/admin" className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 px-3 py-2 rounded-lg transition-colors">
          Dashboard
        </Link>
        <Link href="/admin/habitaciones" className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 px-3 py-2 rounded-lg transition-colors">
          Habitaciones
        </Link>
        <Link href="/admin/reservas" className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 px-3 py-2 rounded-lg transition-colors">
          Reservas
        </Link>
        <Link href="/admin/usuarios" className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 px-3 py-2 rounded-lg transition-colors">
          Usuarios
        </Link>
      </aside>
      <main className="flex-1 p-8 bg-zinc-50">{children}</main>
    </div>
  )
}
