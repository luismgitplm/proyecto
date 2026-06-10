import { createClient } from '@/lib/supabase/server'

export async function getTipos() {
  const supabase = await createClient()
  const { data } = await supabase.from('rooms').select('tipo').eq('activo', true)
  return [...new Set(data?.map(r => r.tipo) ?? [])]
}

export async function getHabitacionesDisponibles({ fecha_entrada, fecha_salida, tipo } = {}) {
  const supabase = await createClient()
  let query = supabase.from('rooms').select('*').eq('activo', true)

  if (tipo) query = query.eq('tipo', tipo)

  if (fecha_entrada && fecha_salida) {
    const { data: reservadas } = await supabase
      .from('bookings')
      .select('habitacion_id')
      .eq('estado', 'confirmed')
      .lt('fecha_entrada', fecha_salida)
      .gt('fecha_salida', fecha_entrada)

    const idsOcupadas = reservadas?.map(b => b.habitacion_id) ?? []
    if (idsOcupadas.length > 0) {
      query = query.not('id', 'in', `(${idsOcupadas.join(',')})`)
    }
  }

  const { data } = await query.order('precio_por_noche', { ascending: true })
  return data ?? []
}
