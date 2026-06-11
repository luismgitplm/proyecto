import Link from 'next/link'

// Grid de cards de habitaciones (1→2→3 columnas); muestra conteo de resultados si hay filtros activos
export default function CatalogoHabitaciones({ rooms, hayFiltros }) {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-zinc-900 mb-1">Nuestras habitaciones</h2>
        {hayFiltros ? (
          <p className="text-sm text-zinc-500">
            {rooms.length > 0
              ? `${rooms.length} habitación${rooms.length > 1 ? 'es' : ''} encontrada${rooms.length > 1 ? 's' : ''}`
              : 'No hay habitaciones disponibles con los filtros seleccionados'}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Encuentra la habitación perfecta para tu estancia</p>
        )}
      </div>

      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <Link
              key={room.id}
              href={`/habitaciones/${room.id}`}
              className="group border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white"
            >
              <div className="h-48 bg-zinc-100 flex items-center justify-center">
                {room.imagenes?.[0] ? (
                  <img src={room.imagenes[0]} alt={room.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-400 text-sm">Sin imagen</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-zinc-900 group-hover:underline">{room.nombre}</h3>
                  <span className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 capitalize">
                    {room.tipo}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mb-3 line-clamp-2">{room.descripcion}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">
                    {room.capacidad} persona{room.capacidad > 1 ? 's' : ''}
                  </span>
                  <span className="font-semibold text-zinc-900">
                    {room.precio_por_noche}€{' '}
                    <span className="text-xs font-normal text-zinc-400">/ noche</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : !hayFiltros ? (
        <p className="text-zinc-400">No hay habitaciones disponibles en este momento.</p>
      ) : null}
    </main>
  )
}
