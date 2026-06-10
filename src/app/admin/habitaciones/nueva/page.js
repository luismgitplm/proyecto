import Link from 'next/link'
import HabitacionForm from '../HabitacionForm'

export default function NuevaHabitacionPage() {
  return (
    <div>
      <Link href="/admin/habitaciones" className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 inline-block">
        ← Volver
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-8">Nueva habitación</h1>
      <HabitacionForm />
    </div>
  )
}
