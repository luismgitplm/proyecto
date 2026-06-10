'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function NavInicio() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
      Inicio
    </Link>
  )
}
