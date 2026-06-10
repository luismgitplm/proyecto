'use client'

import { useEffect } from 'react'

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
