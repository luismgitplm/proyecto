import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const hoy = new Date().toISOString().split('T')[0]
  const primeroDeMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: totalConfirmadas },
    { count: totalCanceladas },
    { count: habitacionesActivas },
    { count: entradasHoy },
    { data: ingresosData },
  ] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('estado', 'confirmed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('estado', 'cancelled'),
    supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('estado', 'confirmed').eq('fecha_entrada', hoy),
    supabase.from('bookings').select('precio_total').eq('estado', 'confirmed').gte('created_at', primeroDeMes),
  ])

  const ingresosMes = ingresosData?.reduce((sum, b) => sum + Number(b.precio_total), 0) ?? 0
  const total = (totalConfirmadas ?? 0) + (totalCanceladas ?? 0)
  const tasaCancelacion = total > 0 ? ((totalCanceladas ?? 0) / total * 100).toFixed(1) : '0.0'

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Reservas confirmadas" value={totalConfirmadas ?? 0} />
        <StatCard label="Reservas canceladas"  value={totalCanceladas ?? 0} />
        <StatCard label="Habitaciones activas" value={habitacionesActivas ?? 0} />
        <StatCard label="Entradas hoy"         value={entradasHoy ?? 0} />
        <StatCard label="Ingresos este mes"    value={`${ingresosMes.toFixed(2)}€`} />
        <StatCard label="Tasa de cancelación"  value={`${tasaCancelacion}%`} />
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <p className="text-sm text-zinc-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  )
}
