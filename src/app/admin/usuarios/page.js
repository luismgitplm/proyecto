import { createClient } from '@/lib/supabase/server'
import CambiarRol from './CambiarRol'

// Lista todos los usuarios registrados con nombre, email y botón para cambiar su rol
export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-8">Usuarios</h1>

      <div className="flex flex-col gap-3">
        {users?.map(user => (
          <div key={user.id} className="border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900">{user.nombre_completo ?? 'Sin nombre'}</p>
              <p className="text-sm text-zinc-500">{user.email}</p>
            </div>
            <CambiarRol userId={user.id} rol={user.rol} />
          </div>
        ))}
      </div>
    </div>
  )
}
