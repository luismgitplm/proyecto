function IconWifi() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function IconParking() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
    </svg>
  )
}

function IconPool() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 16c2.5-2 5-2 7.5 0s5 2 7.5 0"/>
      <path d="M2 20c2.5-2 5-2 7.5 0s5 2 7.5 0"/>
      <circle cx="12" cy="6" r="2"/>
      <path d="M12 8v4"/>
      <path d="M10 12l-2 2"/>
      <path d="M14 12l2 2"/>
    </svg>
  )
}

function IconRestaurant() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/>
      <path d="M18 22v-7"/>
    </svg>
  )
}

function IconSpa() {
  return (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.54a1 1 0 0 0 1.36 1.35C8.4 19.06 15 17 17 8z"/>
      <path d="M17 8l1-5"/>
      <path d="M3.82 19.54c1.18-.97 2.46-2.63 3.18-4.54"/>
    </svg>
  )
}

// Array estático con los 5 servicios del hotel: icono SVG, nombre y descripción corta
const SERVICIOS = [
  { icon: <IconWifi />,       nombre: 'WiFi gratuito',     desc: 'En todas las zonas del hotel' },
  { icon: <IconParking />,    nombre: 'Parking incluido',  desc: 'Plazas disponibles 24 h' },
  { icon: <IconPool />,       nombre: 'Piscina exterior',  desc: 'Abierta de mayo a octubre' },
  { icon: <IconRestaurant />, nombre: 'Restaurante',       desc: 'Cocina local y de temporada' },
  { icon: <IconSpa />,        nombre: 'Spa & Wellness',    desc: 'Relax y bienestar total' },
]

// Grid responsivo de servicios (2→3→5 columnas), sección estática entre el hero y los filtros
export default function SeccionServicios() {
  return (
    <section className="border-b border-zinc-200 py-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
        {SERVICIOS.map(s => (
          <div key={s.nombre} className="flex flex-col items-center text-center gap-2">
            <div className="text-zinc-600">{s.icon}</div>
            <p className="text-sm font-medium text-zinc-900">{s.nombre}</p>
            <p className="text-xs text-zinc-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
