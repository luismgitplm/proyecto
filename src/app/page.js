import { getTipos, getHabitacionesDisponibles } from '@/lib/queries/habitaciones'
import FiltrosCatalogo from './components/FiltrosCatalogo'
import SeccionServicios from './components/SeccionServicios'
import CatalogoHabitaciones from './components/CatalogoHabitaciones'

export default async function Home({ searchParams }) {
  const { fecha_entrada, fecha_salida, tipo } = await searchParams

  const [tipos, rooms] = await Promise.all([
    getTipos(),
    getHabitacionesDisponibles({ fecha_entrada, fecha_salida, tipo }),
  ])

  const hayFiltros = (fecha_entrada && fecha_salida) || tipo

  return (
    <>
      {/* Hero */}
      <section className="bg-zinc-300 px-4 py-16 text-center">
        <p className="text-zinc-900 tracking-widest text-xs uppercase mb-3">Bienvenido a</p>
        <h1 className="text-3xl sm:text-5xl font-semibold text-zinc-900 tracking-wide mb-3">Terra Nova</h1>
        <p className="text-zinc-700 text-lg max-w-md mx-auto">
          Donde el confort se encuentra con la naturaleza
        </p>
      </section>

      <SeccionServicios />

      {/* Filtros */}
      <section className="bg-zinc-50 border-b border-zinc-200 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <FiltrosCatalogo
            fechaEntrada={fecha_entrada}
            fechaSalida={fecha_salida}
            tipo={tipo}
            tipos={tipos}
          />
        </div>
      </section>

      <CatalogoHabitaciones rooms={rooms} hayFiltros={hayFiltros} />
    </>
  )
}

