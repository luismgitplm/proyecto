'use client'

import { useEffect } from 'react'

// Elimina la clase "no-transitions" del <html> tras dos frames de animación,
// evitando el flash visual de transiciones CSS al hidratarse la página
export default function HydrationFix() {
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-transitions')
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [])
  return null
}
