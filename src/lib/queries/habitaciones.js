import { createClient } from '@/lib/supabase/server'

// Devuelve los tipos únicos de habitaciones activas para poblar las pills del filtro
export async function getTipos() {
  const supabase = await createClient()
  const { data } = await supabase.from('rooms').select('tipo').eq('activo', true)
  const filas = data ?? []
  const tipos = []
  for (const fila of filas) {
    if (!tipos.includes(fila.tipo)) {
      tipos.push(fila.tipo)
    }
  }
  return tipos
}

// Devuelve habitaciones activas aplicando filtro de tipo y/o disponibilidad de fechas.
// Si hay fechas, excluye las habitaciones con reservas confirmadas que se solapan con el rango pedido.
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

    const filasBloqueadas = reservadas ?? []
    const idsOcupadas = []
    for (const b of filasBloqueadas) {
      idsOcupadas.push(b.habitacion_id)
    }
    if (idsOcupadas.length > 0) {
      query = query.not('id', 'in', `(${idsOcupadas.join(',')})`)
    }
  }

  const { data } = await query.order('precio_por_noche', { ascending: true })
  return data ?? []
}
