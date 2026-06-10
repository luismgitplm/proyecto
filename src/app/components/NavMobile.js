'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NavMobile({ user, rol }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const cerrar = () => setOpen(false)

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-zinc-700 hover:text-zinc-900 transition-colors"
        aria-label="Menú"
      >
        {open ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-zinc-200 border-b border-zinc-300 px-6 py-4 flex flex-col gap-4 z-50">
          {user ? (
            <>
              {rol === 'admin' && (
                <Link href="/admin" onClick={cerrar} className="text-sm font-medium text-terra-600">
                  Admin
                </Link>
              )}
              <Link href="/reservas" onClick={cerrar} className="text-sm text-zinc-700 hover:text-zinc-900">
                Mis reservas
              </Link>
              <Link href="/perfil" onClick={cerrar} className="text-sm text-zinc-700 hover:text-zinc-900">
                Mi perfil
              </Link>
              {pathname !== '/' && (
                <Link href="/" onClick={cerrar} className="text-sm text-zinc-700 hover:text-zinc-900">
                  Inicio
                </Link>
              )}
              <button onClick={handleLogout} className="text-sm text-zinc-700 hover:text-zinc-900 text-left">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={cerrar} className="text-sm text-zinc-700 hover:text-zinc-900">
                Iniciar sesión
              </Link>
              <Link href="/auth/registro" onClick={cerrar} className="text-sm font-medium text-zinc-900">
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
