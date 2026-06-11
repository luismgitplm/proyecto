import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import NavInicio from './NavInicio'
import NavMobile from './NavMobile'

// Barra de navegación principal: obtiene usuario y rol en el servidor para mostrar los enlaces correctos.
// Sticky en la parte superior; adapta su contenido según si hay sesión activa y si el usuario es admin.
export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let rol = null
  if (user) {
    // Segunda query para conocer el rol y decidir si mostrar el enlace Admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    rol = profile?.rol
  }

  return (
    <header className="border-b border-zinc-300 bg-zinc-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex flex-col leading-tight hover:opacity-75 transition-opacity">
          <span className="font-semibold tracking-widest text-xs text-zinc-500 uppercase">Hotel</span>
          <span className="font-semibold text-lg text-zinc-900 tracking-wide">Terra Nova</span>
        </Link>

        {/* Nav escritorio */}
        <nav className="hidden sm:flex items-center gap-6">
          {user ? (
            <>
              {rol === 'admin' && (
                <Link href="/admin" className="text-sm text-terra-600 hover:text-terra-700 font-medium transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/reservas" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                Mis reservas
              </Link>
              <Link href="/perfil" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                Mi perfil
              </Link>
              <NavInicio />
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                Iniciar sesión
              </Link>
              <Link
                href="/auth/registro"
                className="text-sm bg-zinc-900 text-zinc-50 px-4 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>

        {/* Nav móvil */}
        <NavMobile user={user} rol={rol} />
      </div>
    </header>
  )
}
