# Terra Nova — Flujo de lógica completo

---

## 1. `src/middleware.js`

```js
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedRoutes = ['/reservas', '/perfil', '/admin']
  const isProtected = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (profile?.rol !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**Descripción:** Es el guardián de toda la aplicación. Se ejecuta en el edge de Next.js antes de que cualquier página se renderice, interceptando cada petición HTTP que no sea de assets estáticos (imágenes, iconos, archivos de build, definido por `matcher`).

Crea un cliente de Supabase directamente sobre las cookies de la `request` (sin acceder a la base de datos de forma normal, sino a través del helper `@supabase/ssr` que gestiona la sesión de autenticación via cookies). Con ese cliente comprueba si hay una sesión de usuario activa llamando a `supabase.auth.getUser()`.

Hay dos capas de protección:

**Primera capa — rutas protegidas:** Si la ruta empieza por `/reservas`, `/perfil` o `/admin` y no hay usuario autenticado, redirige a `/auth/login`.

**Segunda capa — rol de administrador:** Si el usuario está autenticado pero intenta acceder a `/admin`, consulta la tabla `profiles` en Supabase para verificar que su campo `rol` sea `'admin'`. Si no lo es, redirige a `/`. Esto impide que un usuario normal acceda al panel aunque esté logado.

**Dependencias:** `@supabase/ssr` (para crear el cliente server-side), `next/server` (para `NextResponse`), variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y la tabla `profiles` de Supabase que tiene un campo `rol`.

---

## 2. `src/lib/supabase/server.js`

```js
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**Descripción:** Factoría que crea un cliente de Supabase para uso en Server Components y Server Actions (el entorno de servidor de Next.js). Es una función `async` porque `cookies()` de Next.js es asíncrona en versiones recientes. El cliente resultante tiene acceso a la sesión del usuario porque lee y escribe las cookies de autenticación a través del `cookieStore`. El bloque `try/catch` vacío en `setAll` es intencional: en Server Components de solo lectura intentar escribir cookies lanza un error que se ignora silenciosamente, ya que esas páginas no necesitan actualizar la sesión.

**Dependencias:** `@supabase/ssr`, `next/headers` (API de Next.js para acceder a cookies en el servidor), variables de entorno de Supabase.

---

## 3. `src/lib/supabase/client.js`

```js
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

**Descripción:** Factoría análoga a la anterior pero para el navegador. `createBrowserClient` de `@supabase/ssr` gestiona la sesión a través de las cookies del navegador y no necesita acceso manual al `cookieStore` de Next.js. Se usa exclusivamente en componentes marcados con `'use client'`. Las variables de entorno llevan el prefijo `NEXT_PUBLIC_` precisamente para que Next.js las exponga al bundle del cliente.

**Dependencias:** `@supabase/ssr`, variables de entorno de Supabase.

---

## 4. `src/app/globals.css`

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  --color-zinc-50:  #faf8f5;
  --color-zinc-100: #f0e9dd;
  --color-zinc-200: #dfd2c0;
  --color-zinc-300: #c8b49a;
  --color-zinc-400: #a99278;
  --color-zinc-500: #8a7358;
  --color-zinc-600: #6f5a42;
  --color-zinc-700: #54432f;
  --color-zinc-800: #3c2e1e;
  --color-zinc-900: #261a10;

  --color-terra-500: #c4622d;
  --color-terra-600: #a0491e;
  --color-terra-700: #7d3514;
}

body {
  background-color: #faf8f5;
  color: #261a10;
  font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif;
}

.no-transitions * {
  transition: none !important;
}
```

**Descripción:** Define la identidad visual completa de Terra Nova. Utiliza la sintaxis de Tailwind v4 con el bloque `@theme` para sobreescribir la escala de colores `zinc` con una paleta de tonos tierra y crema, de forma que cualquier clase de Tailwind que use `zinc` (por ejemplo `bg-zinc-100`, `text-zinc-900`) aplique automáticamente los colores personalizados sin necesidad de cambios en ningún otro archivo. Se añade también una escala `terra` para el color de acento naranja-tierra utilizado en los enlaces de administrador. La regla `.no-transitions *` desactiva todas las transiciones CSS mientras esté activa, utilizada por `HydrationFix` para evitar parpadeos al cargar la página.

**Dependencias:** Tailwind CSS v4 (con soporte para `@theme`), las fuentes Geist inyectadas como variables CSS por `layout.js`.

---

## 5. `src/app/layout.js`

```js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import HydrationFix from "./components/HydrationFix";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Terra Nova — Hotel & Suites",
  description: "Descubre el equilibrio entre confort y naturaleza. Reserva tu estancia en Terra Nova.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased no-transitions`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50">
        <HydrationFix />
        <Header />
        {children}
      </body>
    </html>
  );
}
```

**Descripción:** Es la envoltura raíz de toda la aplicación. Next.js lo aplica a todas las páginas. Carga las fuentes Geist (sans y mono) desde Google Fonts y las expone como variables CSS (`--font-geist-sans`, `--font-geist-mono`) que luego `globals.css` recoge en `@theme`. El `<html>` recibe la clase `no-transitions` desde el servidor para que la página se pinte sin animaciones desde el primer instante. `HydrationFix` la eliminará una vez React haya hidratado el árbol. El `<body>` usa `flex flex-col` para que el `Header` siempre quede arriba y `{children}` ocupe el resto del espacio vertical. Define el `<title>` y `<meta description>` globales para SEO.

**Dependencias:** `next/font/google` (fuentes), `globals.css` (paleta), `Header` (navegación global), `HydrationFix` (corrección de transiciones).

---

## 6. `src/app/components/HydrationFix.js`

```js
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
```

**Descripción:** Componente cliente invisible (no renderiza nada) cuyo único propósito es eliminar la clase `no-transitions` del elemento `<html>` después de que React haya completado la hidratación. Usa un doble `requestAnimationFrame`: el primero espera al siguiente ciclo de render del navegador (después de que React aplique los cambios al DOM), el segundo espera al siguiente frame de pintura, garantizando que las transiciones CSS solo se activan cuando la página ya está visualmente estabilizada. El `cleanup` del `useEffect` cancela el RAF si el componente se desmontara antes de que se ejecute.

**Dependencias:** React (`useEffect`), `globals.css` (la regla `.no-transitions`), `layout.js` (que pone la clase inicial en `<html>`).

---

## 7. `src/app/components/Header.js`

```js
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import NavInicio from './NavInicio'
import NavMobile from './NavMobile'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let rol = null
  if (user) {
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

        <NavMobile user={user} rol={rol} />
      </div>
    </header>
  )
}
```

**Descripción:** Componente de servidor asíncrono que actúa como barra de navegación global, pegada al tope de la pantalla (`sticky top-0 z-50`). Al ser un Server Component, puede consultar Supabase directamente: obtiene el usuario autenticado actual y, si existe, consulta la tabla `profiles` para conocer su rol. Con esa información decide qué enlaces mostrar. En escritorio (`hidden sm:flex`) muestra los enlaces según el estado de sesión: si no hay usuario, muestra "Iniciar sesión" y "Registrarse"; si hay usuario, muestra "Mis reservas", "Mi perfil", el enlace de "Admin" (solo si el rol es `'admin'`, en color `terra-600`), el enlace "Inicio" (que se muestra condicionalmente vía `NavInicio`) y el botón de cierre de sesión. En móvil delega toda la navegación en `NavMobile`, pasándole `user` y `rol` como props porque ese componente necesita ser Client Component y no puede consultar Supabase directamente.

**Dependencias:** `createClient` (servidor), `Link` de Next.js, `LogoutButton`, `NavInicio`, `NavMobile`, tabla `profiles` de Supabase.

---

## 8. `src/app/components/NavInicio.js`

```js
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
```

**Descripción:** Componente cliente mínimo que muestra el enlace "Inicio" en la barra de navegación de escritorio solo cuando el usuario no está en la homepage. Necesita ser Client Component porque `usePathname()` de Next.js solo funciona en el cliente. Si la ruta actual es `/`, devuelve `null` y no renderiza nada, evitando un enlace redundante.

**Dependencias:** `usePathname` de `next/navigation`, `Link` de Next.js.

---

## 9. `src/app/components/NavMobile.js`

```js
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
                <Link href="/admin" onClick={cerrar} className="text-sm font-medium text-terra-600">Admin</Link>
              )}
              <Link href="/reservas" onClick={cerrar} className="text-sm text-zinc-700 hover:text-zinc-900">Mis reservas</Link>
              <Link href="/perfil" onClick={cerrar} className="text-sm text-zinc-700 hover:text-zinc-900">Mi perfil</Link>
              {pathname !== '/' && (
                <Link href="/" onClick={cerrar} className="text-sm text-zinc-700 hover:text-zinc-900">Inicio</Link>
              )}
              <button onClick={handleLogout} className="text-sm text-zinc-700 hover:text-zinc-900 text-left">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" onClick={cerrar} className="text-sm text-zinc-700 hover:text-zinc-900">Iniciar sesión</Link>
              <Link href="/auth/registro" onClick={cerrar} className="text-sm font-medium text-zinc-900">Registrarse</Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

**Descripción:** Navegación móvil completa. Solo visible en pantallas pequeñas (`sm:hidden`). Gestiona un estado `open` que alterna entre mostrar el icono hamburguesa (tres líneas) y el icono de cerrar (X). Al abrirse, despliega un panel con posición `absolute` que se extiende de borde a borde justo debajo del header. Recibe `user` y `rol` como props desde el Server Component `Header` para evitar tener que hacer consultas de base de datos en el cliente. El logout se hace directamente en este componente llamando a `supabase.auth.signOut()` con el cliente de browser, cerrando el menú, redirigiendo a `/` y llamando a `router.refresh()` para que el Server Component `Header` se recargue y refleje el estado de sesión actualizado. El enlace "Inicio" se muestra condicionalmente igual que en `NavInicio`, usando `usePathname()`.

**Dependencias:** `createClient` (browser), `usePathname` y `useRouter` de `next/navigation`, tabla de auth de Supabase, props `user` y `rol` de `Header`.

---

## 10. `src/app/components/LogoutButton.js`

```js
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
    >
      Cerrar sesión
    </button>
  )
}
```

**Descripción:** Botón de cierre de sesión para escritorio. Al hacer clic llama a `supabase.auth.signOut()` que invalida la sesión tanto en el servidor como en las cookies del navegador, luego redirige a `/` y fuerza un `router.refresh()` para que el `Header` (Server Component) se vuelva a ejecutar en el servidor y deje de mostrar los enlaces de usuario autenticado.

**Dependencias:** `createClient` (browser), `useRouter` de Next.js.

---

## 11. `src/lib/queries/habitaciones.js`

```js
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
```

**Descripción:** Capa de acceso a datos para las habitaciones, pensada para ser reutilizada desde cualquier Server Component. Exporta dos funciones:

`getTipos()` devuelve un array de strings únicos con todos los tipos de habitación que estén activas en la base de datos. Usa `Set` para eliminar duplicados.

`getHabitacionesDisponibles()` implementa el filtrado de disponibilidad. Primero construye una query base que solo incluye habitaciones activas. Si se pasa `tipo`, añade ese filtro a la query. Si se pasan ambas fechas, realiza una segunda consulta a la tabla `bookings` buscando reservas confirmadas cuyo intervalo de fechas se solape con el solicitado (condición estándar de solapamiento de intervalos: `fecha_entrada_reserva < fecha_salida_buscada` Y `fecha_salida_reserva > fecha_entrada_buscada`). Con los IDs de habitaciones ocupadas, excluye esas habitaciones de la query principal. Ordena siempre por precio ascendente.

**Dependencias:** `createClient` (servidor), tablas `rooms` y `bookings` de Supabase.

---

## 12. `src/app/components/SeccionServicios.js`

```js
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

const SERVICIOS = [
  { icon: <IconWifi />,       nombre: 'WiFi gratuito',     desc: 'En todas las zonas del hotel' },
  { icon: <IconParking />,    nombre: 'Parking incluido',  desc: 'Plazas disponibles 24 h' },
  { icon: <IconPool />,       nombre: 'Piscina exterior',  desc: 'Abierta de mayo a octubre' },
  { icon: <IconRestaurant />, nombre: 'Restaurante',       desc: 'Cocina local y de temporada' },
  { icon: <IconSpa />,        nombre: 'Spa & Wellness',    desc: 'Relax y bienestar total' },
]

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
```

**Descripción:** Componente de servidor completamente estático, sin props ni consultas. Define cinco funciones de icono SVG inline y el array `SERVICIOS` que las agrupa con nombre y descripción. Renderiza una sección en grid responsivo: 2 columnas en móvil, 3 en tablet, 5 en escritorio, una por servicio. Es puro HTML estático generado en el servidor, sin ninguna interactividad.

**Dependencias:** Ninguna externa. Solo utiliza la paleta de colores del tema (`text-zinc-*`).

---

## 13. `src/app/components/FiltrosCatalogo.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FiltrosCatalogo({ fechaEntrada, fechaSalida, tipo, tipos }) {
  const router = useRouter()
  const hoy = new Date().toISOString().split('T')[0]

  const [entrada, setEntrada] = useState(fechaEntrada ?? '')
  const [salida, setSalida]   = useState(fechaSalida ?? '')
  const [tipoSel, setTipoSel] = useState(tipo ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (entrada)  params.set('fecha_entrada', entrada)
    if (salida)   params.set('fecha_salida', salida)
    if (tipoSel)  params.set('tipo', tipoSel)
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  function navegarConTipo(t) {
    setTipoSel(t)
    const params = new URLSearchParams()
    if (entrada) params.set('fecha_entrada', entrada)
    if (salida)  params.set('fecha_salida', salida)
    if (t)       params.set('tipo', t)
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  function handleLimpiar() {
    setEntrada('')
    setSalida('')
    setTipoSel('')
    router.push('/', { scroll: false })
  }

  const hayFiltros = fechaEntrada || fechaSalida || tipo

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <div className="flex flex-col sm:flex-row flex-wrap justify-center items-stretch sm:items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Entrada</label>
          <input
            type="date"
            min={hoy}
            value={entrada}
            onChange={e => {
              setEntrada(e.target.value)
              if (salida && e.target.value >= salida) setSalida('')
            }}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Salida</label>
          <input
            type="date"
            min={entrada || hoy}
            value={salida}
            onChange={e => setSalida(e.target.value)}
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
          />
        </div>

        <button
          type="submit"
          className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          Buscar
        </button>

        {hayFiltros && (
          <button
            type="button"
            onClick={handleLimpiar}
            className="bg-zinc-200 text-zinc-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-300 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => navegarConTipo('')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !tipoSel
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-amber-100 hover:text-zinc-900'
          }`}
        >
          Todos
        </button>
        {tipos.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => navegarConTipo(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              tipoSel === t
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-amber-100 hover:text-zinc-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </form>
  )
}
```

**Descripción:** Componente cliente que gestiona dos tipos de filtrado para el catálogo de habitaciones. Recibe como props los valores actuales de los filtros (venidos de los `searchParams` de la URL) y el listado de tipos disponibles. Mantiene estado local para los tres campos: `entrada`, `salida` y `tipoSel`.

El filtro por fechas funciona con un formulario HTML: al pulsar "Buscar", construye una `URLSearchParams` con los valores actuales y navega a `/?...params`. Si se selecciona una fecha de entrada posterior o igual a la salida, el campo salida se vacía automáticamente. El `min` del input de salida se actualiza dinámicamente al valor de entrada para impedir seleccionar fechas incoherentes.

El filtro por tipo usa pills (botones de tipo `button` para no disparar el submit del formulario). Al pulsar uno, llama a `navegarConTipo()` que aplica el nuevo tipo manteniendo las fechas actuales. El botón activo se muestra en `bg-zinc-900 text-white`, los inactivos en `bg-zinc-100` con hover en `amber`.

Todas las navegaciones usan `{ scroll: false }` para evitar que la página salte al inicio del scroll al cambiar los filtros.

El botón "Limpiar" aparece solo cuando hay algún filtro activo (evaluado sobre las props, no el estado local, para reflejar el estado real de la URL).

**Dependencias:** `useRouter` de Next.js, props `fechaEntrada`, `fechaSalida`, `tipo`, `tipos` de `page.js`.

---

## 14. `src/app/components/CatalogoHabitaciones.js`

```js
import Link from 'next/link'

export default function CatalogoHabitaciones({ rooms, hayFiltros }) {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-zinc-900 mb-1">Nuestras habitaciones</h2>
        {hayFiltros ? (
          <p className="text-sm text-zinc-500">
            {rooms.length > 0
              ? `${rooms.length} habitación${rooms.length > 1 ? 'es' : ''} encontrada${rooms.length > 1 ? 's' : ''}`
              : 'No hay habitaciones disponibles con los filtros seleccionados'}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Encuentra la habitación perfecta para tu estancia</p>
        )}
      </div>

      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <Link
              key={room.id}
              href={`/habitaciones/${room.id}`}
              className="group border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow bg-white"
            >
              <div className="h-48 bg-zinc-100 flex items-center justify-center">
                {room.imagenes?.[0] ? (
                  <img src={room.imagenes[0]} alt={room.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-zinc-400 text-sm">Sin imagen</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-zinc-900 group-hover:underline">{room.nombre}</h3>
                  <span className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 capitalize">
                    {room.tipo}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mb-3 line-clamp-2">{room.descripcion}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">
                    {room.capacidad} persona{room.capacidad > 1 ? 's' : ''}
                  </span>
                  <span className="font-semibold text-zinc-900">
                    {room.precio_por_noche}€{' '}
                    <span className="text-xs font-normal text-zinc-400">/ noche</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : !hayFiltros ? (
        <p className="text-zinc-400">No hay habitaciones disponibles en este momento.</p>
      ) : null}
    </main>
  )
}
```

**Descripción:** Componente de servidor que recibe el array de habitaciones ya filtrado y el flag `hayFiltros`, ambos calculados en `page.js`. Muestra el subtítulo dinámico: si hay filtros activos, informa del número de resultados con concordancia de género y número en español; si no hay filtros, muestra el texto genérico de invitación.

Las cards son elementos `<Link>` que envuelven todo el contenido, por lo que la card entera es clickable y navega a `/habitaciones/[id]`. Usan la clase `group` para que el `group-hover:underline` del título funcione al pasar el ratón sobre cualquier parte de la card. Cada card muestra la primera imagen del array `imagenes` (campo de Supabase de tipo array de URLs), o un placeholder gris si no hay imagen. La descripción usa `line-clamp-2` para truncar a dos líneas. El indicador de tipo se muestra como pill en la esquina superior derecha de la sección de texto.

**Dependencias:** `Link` de Next.js, props `rooms` (array de objetos de la tabla `rooms`) y `hayFiltros` (booleano) de `page.js`.

---

## 15. `src/app/page.js`

```js
import { getTipos, getHabitacionesDisponibles } from '@/lib/queries/habitaciones'
import FiltrosCatalogo from './components/FiltrosCatalogo'
import SeccionServicios from './components/SeccionServicios'
import CatalogoHabitaciones from './components/CatalogoHabitaciones'

export default async function Home({ searchParams }) {
  const { fecha_entrada, fecha_salida, tipo } = await searchParams

  const [tipos, rooms] = await Promise.all([
    getTipos(),
    getHabitacionesDisponibles({ fecha_entrada, fecha_salida, tipo }),
  ])

  const hayFiltros = (fecha_entrada && fecha_salida) || tipo

  return (
    <>
      {/* Hero */}
      <section className="bg-zinc-300 px-4 py-16 text-center">
        <p className="text-zinc-600 tracking-widest text-xs uppercase mb-3">Bienvenido a</p>
        <h1 className="text-3xl sm:text-5xl font-semibold text-zinc-900 tracking-wide mb-3">Terra Nova</h1>
        <p className="text-zinc-700 text-lg max-w-md mx-auto">
          Donde el confort se encuentra con la naturaleza
        </p>
      </section>

      <SeccionServicios />

      {/* Filtros */}
      <section className="bg-zinc-50 border-b border-zinc-200 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <FiltrosCatalogo
            fechaEntrada={fecha_entrada}
            fechaSalida={fecha_salida}
            tipo={tipo}
            tipos={tipos}
          />
        </div>
      </section>

      <CatalogoHabitaciones rooms={rooms} hayFiltros={hayFiltros} />
    </>
  )
}
```

**Descripción:** Página principal de la aplicación, Server Component asíncrono. En Next.js App Router, los `searchParams` son una Promise que hay que `await`ar. Extrae `fecha_entrada`, `fecha_salida` y `tipo` de los parámetros de la URL (los que pone `FiltrosCatalogo` al navegar).

Ejecuta en paralelo con `Promise.all` las dos queries de base de datos: `getTipos()` para saber qué pills de tipo mostrar en el filtro, y `getHabitacionesDisponibles()` con los filtros activos para obtener las habitaciones a mostrar. El paralelismo reduce el tiempo de respuesta respecto a hacerlas secuenciales.

Calcula `hayFiltros` como booleano para pasarlo a `CatalogoHabitaciones`. El JSX es la composición de cuatro secciones: Hero (inline, 5 líneas estáticas), `SeccionServicios`, la sección de filtros que envuelve `FiltrosCatalogo` con el centrado y el fondo, y `CatalogoHabitaciones`.

**Dependencias:** `getTipos` y `getHabitacionesDisponibles` de `lib/queries/habitaciones`, `FiltrosCatalogo`, `SeccionServicios`, `CatalogoHabitaciones`.

---

## 16. `src/app/auth/login/page.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-zinc-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-6 text-sm text-zinc-500 text-center">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/registro" className="text-zinc-900 font-medium hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
```

**Descripción:** Página de inicio de sesión, Client Component porque gestiona estado de formulario. Al enviar, llama a `supabase.auth.signInWithPassword()` con email y contraseña. Supabase valida las credenciales contra su sistema de autenticación y, si son correctas, establece la sesión en las cookies del navegador. En caso de error, muestra el mensaje genérico (no el específico de Supabase, para no revelar si el email existe o no). En caso de éxito, navega a `/` y hace `router.refresh()` para que el `Header` recargue su estado de servidor. El botón queda deshabilitado durante la petición y muestra "Entrando...".

**Dependencias:** `createClient` (browser), auth de Supabase.

---

## 17. `src/app/auth/registro/page.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegistroPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Nombre completo</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-zinc-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="mt-6 text-sm text-zinc-500 text-center">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-zinc-900 font-medium hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
```

**Descripción:** Página de registro, Client Component. Llama a `supabase.auth.signUp()` pasando email, contraseña y el nombre completo en el campo `data` de `options`. Supabase crea el usuario en su sistema de autenticación y, a través de un trigger de base de datos configurado en el proyecto, también crea automáticamente una fila en la tabla `profiles` con el `full_name` y el rol por defecto `'user'`. La contraseña requiere mínimo 6 caracteres (validación del `<input>`). Si el registro tiene éxito, navega a `/` igual que el login.

**Dependencias:** `createClient` (browser), auth de Supabase, trigger de base de datos que crea el perfil en `profiles`.

---

## 18. `src/app/habitaciones/[id]/page.js`

```js
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function HabitacionPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single()

  if (!room) notFound()

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 inline-block">
        ← Volver al catálogo
      </Link>

      <div className="h-72 bg-zinc-100 rounded-2xl flex items-center justify-center mb-8 overflow-hidden">
        {room.imagenes?.[0] ? (
          <img src={room.imagenes[0]} alt={room.nombre} className="w-full h-full object-cover" />
        ) : (
          <span className="text-zinc-400">Sin imagen</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 mb-1">{room.nombre}</h1>
          <span className="text-sm text-zinc-500 capitalize">
            {room.tipo} · {room.capacidad} persona{room.capacidad > 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-semibold text-zinc-900">{room.precio_por_noche}€</span>
          <p className="text-sm text-zinc-400">por noche</p>
        </div>
      </div>

      <p className="text-zinc-600 leading-relaxed mb-8">{room.descripcion}</p>

      <Link
        href={`/habitaciones/${room.id}/reservar`}
        className="inline-block bg-zinc-900 text-white rounded-xl px-8 py-3 font-medium hover:bg-zinc-700 transition-colors"
      >
        Reservar
      </Link>
    </main>
  )
}
```

**Descripción:** Página de detalle de una habitación. Server Component que recibe el `id` de la habitación desde los `params` dinámicos de la ruta `[id]`. Consulta la tabla `rooms` filtrando por `id` y por `activo = true`: si la habitación no existe o está desactivada, llama a `notFound()` que activa la página `not-found.js`. Muestra la imagen principal, el nombre, tipo, capacidad, precio por noche y descripción completa. El botón "Reservar" es un `<Link>` hacia `/habitaciones/[id]/reservar`, protegido por el middleware que redirigirá al login si no hay sesión.

**Dependencias:** `createClient` (servidor), `notFound` de Next.js, tabla `rooms` de Supabase.

---

## 19. `src/app/habitaciones/[id]/reservar/page.js`

```js
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import ReservaForm from './ReservaForm'

export default async function ReservarPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .single()

  if (!room) notFound()

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <Link href={`/habitaciones/${id}`} className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 inline-block">
        ← Volver a la habitación
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Reservar</h1>
      <p className="text-zinc-500 text-sm mb-6">{room.nombre} · {room.precio_por_noche}€ / noche</p>
      <ReservaForm room={room} userId={user.id} />
    </main>
  )
}
```

**Descripción:** Página intermedia que actúa como puerta del formulario de reserva. Aunque el middleware ya protege `/reservas` y `/perfil`, esta ruta está bajo `/habitaciones` y no tiene protección de middleware, por lo que verifica la sesión manualmente con `redirect('/auth/login')`. Obtiene los datos de la habitación y los pasa junto con el `userId` al Client Component `ReservaForm`. La separación Server/Client aquí es importante: el servidor obtiene los datos de forma segura y los inyecta en el formulario como props.

**Dependencias:** `createClient` (servidor), `redirect` y `notFound` de Next.js, `ReservaForm`.

---

## 20. `src/app/habitaciones/[id]/reservar/ReservaForm.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ReservaForm({ room, userId }) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const noches = checkIn && checkOut
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    : 0

  const precioTotal = noches > 0 ? noches * room.precio_por_noche : 0

  const horasHastaEntrada = checkIn
    ? (new Date(checkIn + 'T00:00:00') - new Date()) / (1000 * 60 * 60)
    : null

  const advertencia48h = horasHastaEntrada !== null && horasHastaEntrada > 0 && horasHastaEntrada <= 48

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (noches <= 0) {
      setError('La fecha de salida debe ser posterior a la de entrada.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: solapamiento } = await supabase
      .from('bookings')
      .select('id')
      .eq('habitacion_id', room.id)
      .eq('estado', 'confirmed')
      .lt('fecha_entrada', checkOut)
      .gt('fecha_salida', checkIn)

    if (solapamiento?.length > 0) {
      setError('La habitación no está disponible para las fechas seleccionadas.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('bookings').insert({
      usuario_id: userId,
      habitacion_id: room.id,
      fecha_entrada: checkIn,
      fecha_salida: checkOut,
      precio_total: precioTotal,
    })

    if (error) {
      setError('Error al crear la reserva. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    router.push('/reservas')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Fecha de entrada</label>
        <input type="date" min={today} value={checkIn}
          onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut('') }}
          required className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Fecha de salida</label>
        <input type="date" min={checkIn || today} value={checkOut}
          onChange={e => setCheckOut(e.target.value)}
          required className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
      </div>
      {advertencia48h && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <p className="text-sm text-amber-700">
            La entrada es en menos de 48 horas. Esta reserva no podrá cancelarse una vez confirmada.
          </p>
        </div>
      )}
      {noches > 0 && (
        <div className="bg-zinc-50 rounded-xl p-4 flex justify-between items-center">
          <span className="text-sm text-zinc-600">{noches} noche{noches > 1 ? 's' : ''} × {room.precio_por_noche}€</span>
          <span className="font-semibold text-zinc-900">{precioTotal.toFixed(2)}€ total</span>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading || noches <= 0}
        className="bg-zinc-900 text-white rounded-xl py-3 font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
        {loading ? 'Reservando...' : 'Confirmar reserva'}
      </button>
    </form>
  )
}
```

**Descripción:** Formulario de reserva, la pieza más compleja del flujo de usuario. Calcula en tiempo real el número de noches como diferencia entre fechas en milisegundos dividido entre milisegundos por día, y multiplica por el precio para mostrar el total actualizado instantáneamente. Detecta si la entrada seleccionada está a menos de 48 horas y muestra un aviso en un recuadro ámbar.

Al enviar realiza una verificación de disponibilidad en tiempo real (consulta de solapamiento idéntica a la de `getHabitacionesDisponibles`) para protegerse de race conditions: es posible que otro usuario haya reservado la habitación desde que se cargó el catálogo. Si hay solapamiento, muestra error sin insertar. Si la habitación sigue libre, inserta en la tabla `bookings` con `estado: 'confirmed'` (el estado por defecto definido en la base de datos) y redirige a `/reservas`.

**Dependencias:** `createClient` (browser), tablas `bookings` y `rooms` de Supabase, props `room` y `userId` de la página padre.

---

## 21. `src/app/reservas/page.js`

```js
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CancelarReserva from './CancelarReserva'

export default async function ReservasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, rooms(nombre, tipo)')
    .eq('usuario_id', user.id)
    .order('fecha_entrada', { ascending: false })

  const today = new Date().toISOString().split('T')[0]

  const proximas = bookings?.filter(b => b.fecha_salida >= today) ?? []
  const pasadas  = bookings?.filter(b => b.fecha_salida < today)  ?? []

  return (
    <>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-zinc-100 rounded-2xl px-6 py-5 mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Mis reservas</h1>
          <p className="text-sm text-zinc-500 mt-1">Consulta y gestiona tus estancias</p>
        </div>
        <section className="mb-10">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Próximas</h2>
          {proximas.length === 0 ? (
            <p className="text-zinc-400 text-sm">No tienes reservas próximas.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {proximas.map(booking => <ReservaCard key={booking.id} booking={booking} />)}
            </div>
          )}
        </section>
        <section>
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">Pasadas</h2>
          {pasadas.length === 0 ? (
            <p className="text-zinc-400 text-sm">No tienes reservas pasadas.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {pasadas.map(booking => <ReservaCard key={booking.id} booking={booking} />)}
            </div>
          )}
        </section>
        <Link href="/" className="inline-block mt-10 text-sm text-zinc-500 hover:text-zinc-900">← Ver habitaciones</Link>
      </main>
    </>
  )
}

function ReservaCard({ booking }) {
  const ahora = new Date()
  const fechaEntrada = new Date(booking.fecha_entrada + 'T00:00:00')
  const horasHastaEntrada = (fechaEntrada - ahora) / (1000 * 60 * 60)

  const esCancelable = booking.estado === 'confirmed' && horasHastaEntrada > 48
  const bloqueada    = booking.estado === 'confirmed' && horasHastaEntrada > 0 && horasHastaEntrada <= 48

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-zinc-900">{booking.rooms?.nombre}</p>
          <p className="text-sm text-zinc-500 capitalize">{booking.rooms?.tipo}</p>
        </div>
        <EstadoBadge estado={booking.estado} />
      </div>
      <div className="flex gap-6 text-sm text-zinc-600">
        <div><p className="text-xs text-zinc-400">Entrada</p><p>{formatDate(booking.fecha_entrada)}</p></div>
        <div><p className="text-xs text-zinc-400">Salida</p><p>{formatDate(booking.fecha_salida)}</p></div>
        <div><p className="text-xs text-zinc-400">Total</p><p className="font-medium text-zinc-900">{booking.precio_total}€</p></div>
      </div>
      {esCancelable && <CancelarReserva bookingId={booking.id} />}
      {bloqueada && (
        <p className="text-xs text-zinc-400">Cancelación no disponible — faltan menos de 48 h para la entrada.</p>
      )}
    </div>
  )
}

function EstadoBadge({ estado }) {
  const styles = { confirmed: 'bg-green-50 text-green-700', cancelled: 'bg-zinc-100 text-zinc-500' }
  const labels = { confirmed: 'Confirmada', cancelled: 'Cancelada' }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[estado]}`}>{labels[estado]}</span>
  )
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
```

**Descripción:** Página personal del usuario que muestra todas sus reservas. La query usa join implícito de Supabase: `select('*, rooms(nombre, tipo)')` trae todos los campos de `bookings` más los campos `nombre` y `tipo` de la habitación relacionada. Las reservas se dividen en "Próximas" (fecha de salida mayor o igual a hoy) y "Pasadas" (fecha de salida anterior a hoy).

Cada `ReservaCard` calcula si la reserva es cancelable: debe estar confirmada y la entrada debe estar a más de 48 horas. Si está confirmada pero a menos de 48h, la reserva está bloqueada y se muestra un texto explicativo. Si ya está cancelada, no se muestra ningún control. `EstadoBadge` mapea el estado de la base de datos a colores y etiquetas en español. `formatDate` usa `Intl` via `toLocaleDateString` para dar formato legible en español.

**Dependencias:** `createClient` (servidor), `CancelarReserva`, tablas `bookings` y `rooms` (join).

---

## 22. `src/app/reservas/CancelarReserva.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CancelarReserva({ bookingId }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [cancelada, setCancelada] = useState(false)
  const [error, setError] = useState(false)

  async function handleCancelar() {
    setCancelada(true)
    setConfirmando(false)
    const supabase = createClient()
    const { error } = await supabase
      .from('bookings')
      .update({ estado: 'cancelled' })
      .eq('id', bookingId)
    if (error) {
      setCancelada(false)
      setError(true)
    } else {
      router.refresh()
    }
  }

  if (cancelada) return <p className="text-sm text-zinc-400 self-start">Cancelando...</p>
  if (error) return <p className="text-sm text-red-600 self-start">Error al cancelar. Inténtalo de nuevo.</p>
  if (!confirmando) return (
    <button onClick={() => setConfirmando(true)} className="text-sm text-red-600 hover:text-red-800 self-start">
      Cancelar reserva
    </button>
  )

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-zinc-600">¿Seguro que quieres cancelar?</p>
      <button onClick={handleCancelar} className="text-sm font-medium text-red-600 hover:text-red-800">Sí, cancelar</button>
      <button onClick={() => setConfirmando(false)} className="text-sm text-zinc-500 hover:text-zinc-700">No</button>
    </div>
  )
}
```

**Descripción:** Implementa un patrón de confirmación en dos pasos con UI optimista. El primer clic muestra "¿Seguro que quieres cancelar?" con botones "Sí, cancelar" y "No". Al confirmar, actualiza el estado local a `cancelada = true` de forma inmediata (el usuario ve "Cancelando..." antes de que la petición termine) y a continuación hace la actualización en Supabase. Si la petición falla, revierte el estado local mostrando el error. Si tiene éxito, llama a `router.refresh()` para que el Server Component `ReservasPage` se recargue y refleje el nuevo estado desde la base de datos.

**Dependencias:** `createClient` (browser), tabla `bookings` de Supabase.

---

## 23. `src/app/perfil/page.js`

```js
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PerfilForm from './PerfilForm'

export default async function PerfilPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre_completo, telefono')
    .eq('id', user.id)
    .single()

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <div className="bg-zinc-100 rounded-2xl px-6 py-5 mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Mi perfil</h1>
        <p className="text-sm text-zinc-500 mt-1">{user.email}</p>
      </div>
      <div className="bg-white border border-zinc-200 rounded-2xl p-6">
        <PerfilForm userId={user.id} profile={profile} />
      </div>
    </main>
  )
}
```

**Descripción:** Página de perfil del usuario. Server Component que obtiene el usuario y su perfil de la tabla `profiles` (que contiene `nombre_completo` y `telefono`, campos editables, mientras que el email viene de la tabla de auth de Supabase y se muestra como dato no editable). Pasa el `userId` y el `profile` al Client Component `PerfilForm`.

**Dependencias:** `createClient` (servidor), tablas `profiles` y auth de Supabase, `PerfilForm`.

---

## 24. `src/app/perfil/PerfilForm.js`

```js
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PerfilForm({ userId, profile }) {
  const [nombreCompleto, setNombreCompleto] = useState(profile?.nombre_completo ?? '')
  const [telefono, setTelefono] = useState(profile?.telefono ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ nombre_completo: nombreCompleto, telefono })
      .eq('id', userId)

    if (error) {
      setError('Error al guardar los cambios.')
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Nombre completo</label>
        <input type="text" value={nombreCompleto} onChange={e => setNombreCompleto(e.target.value)} required
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Teléfono</label>
        <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+34 600 000 000"
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
      </div>
      {success && <p className="text-sm text-green-600">Perfil actualizado correctamente.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading}
        className="bg-zinc-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
```

**Descripción:** Formulario de edición del perfil. Inicializa su estado local con los valores actuales del perfil (con `?? ''` para manejar el caso de que el perfil no tenga valor). Al guardar, hace un `UPDATE` en la tabla `profiles` con los nuevos valores. No redirige ni recarga la página; simplemente muestra un mensaje de éxito o error en línea, lo que es apropiado para una operación de edición donde el usuario puede querer hacer más cambios.

**Dependencias:** `createClient` (browser), tabla `profiles` de Supabase.

---

## 25. `src/app/admin/layout.js`

```js
import Link from 'next/link'

export default function AdminLayout({ children }) {
  return (
    <div className="flex flex-col sm:flex-row flex-1">
      <aside className="sm:w-52 border-b sm:border-b-0 sm:border-r border-zinc-200 bg-zinc-100 p-4 sm:p-6 flex flex-row sm:flex-col overflow-x-auto gap-1 shrink-0">
        <p className="hidden sm:block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">Panel admin</p>
        <Link href="/admin" className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 px-3 py-2 rounded-lg transition-colors">Dashboard</Link>
        <Link href="/admin/habitaciones" className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 px-3 py-2 rounded-lg transition-colors">Habitaciones</Link>
        <Link href="/admin/reservas" className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 px-3 py-2 rounded-lg transition-colors">Reservas</Link>
        <Link href="/admin/usuarios" className="text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 px-3 py-2 rounded-lg transition-colors">Usuarios</Link>
      </aside>
      <main className="flex-1 p-8 bg-zinc-50">{children}</main>
    </div>
  )
}
```

**Descripción:** Layout específico del panel de administración, aplicado a todas las rutas bajo `/admin`. Define la estructura de dos columnas: sidebar izquierdo con los cuatro enlaces de navegación del panel y contenido principal a la derecha. En móvil el sidebar se convierte en una barra horizontal con scroll horizontal (`flex-row overflow-x-auto`) para que los enlaces queden accesibles. El label "Panel admin" se oculta en móvil. La protección de acceso no está aquí sino en el middleware.

**Dependencias:** `Link` de Next.js. Sin consultas a la base de datos.

---

## 26. `src/app/admin/page.js`

```js
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
```

**Descripción:** Dashboard del panel de administración. Lanza cinco consultas en paralelo con `Promise.all`. Las cuatro primeras usan `{ count: 'exact', head: true }` que indica a Supabase que solo devuelva el recuento sin datos, lo que es mucho más eficiente. La quinta trae los `precio_total` de las reservas confirmadas creadas desde el primer día del mes actual para sumarlos en JavaScript. Calcula la tasa de cancelación como porcentaje sobre el total de reservas (confirmadas + canceladas). Muestra seis tarjetas estadísticas en un grid 2×3.

**Dependencias:** `createClient` (servidor), tablas `bookings` y `rooms` de Supabase.

---

## 27. `src/app/admin/habitaciones/page.js`

```js
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ToggleActivo from './ToggleActivo'

export default async function AdminHabitacionesPage() {
  const supabase = await createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Habitaciones</h1>
        <Link href="/admin/habitaciones/nueva" className="bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors">
          + Nueva habitación
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {rooms?.map(room => (
          <div key={room.id} className="border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900">{room.nombre}</p>
              <p className="text-sm text-zinc-500 capitalize">{room.tipo} · {room.capacidad} personas · {room.precio_por_noche}€/noche</p>
            </div>
            <div className="flex items-center gap-4">
              <ToggleActivo roomId={room.id} activo={room.activo} />
              <Link href={`/admin/habitaciones/${room.id}`} className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Editar</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Descripción:** Listado de todas las habitaciones del hotel, incluyendo las inactivas (a diferencia del catálogo público). Muestra nombre, tipo, capacidad y precio. Por cada habitación hay dos controles: `ToggleActivo` para activar/desactivar sin recargar la página, y un enlace "Editar" que va a la página de edición de esa habitación.

**Dependencias:** `createClient` (servidor), `ToggleActivo`, tabla `rooms`.

---

## 28. `src/app/admin/habitaciones/ToggleActivo.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ToggleActivo({ roomId, activo }) {
  const router = useRouter()
  const [optimisticActivo, setOptimisticActivo] = useState(activo)

  async function toggle() {
    const anterior = optimisticActivo
    setOptimisticActivo(!optimisticActivo)
    const supabase = createClient()
    const { error } = await supabase.from('rooms').update({ activo: !anterior }).eq('id', roomId)
    if (error) {
      setOptimisticActivo(anterior)
    } else {
      router.refresh()
    }
  }

  return (
    <button
      onClick={toggle}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
        optimisticActivo
          ? 'bg-green-50 text-green-700 hover:bg-green-100'
          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
      }`}
    >
      {optimisticActivo ? 'Activa' : 'Inactiva'}
    </button>
  )
}
```

**Descripción:** Botón de activación/desactivación de habitaciones con UI optimista. Al hacer clic guarda el estado anterior, actualiza el estado local de forma inmediata (el botón cambia visualmente al instante) y luego hace el `UPDATE` en base de datos. Si la petición falla, revierte al estado anterior. Si tiene éxito, llama a `router.refresh()` para sincronizar el estado del servidor. El color verde indica activa, gris indica inactiva.

**Dependencias:** `createClient` (browser), tabla `rooms`.

---

## 29. `src/app/admin/habitaciones/nueva/page.js` y `src/app/admin/habitaciones/[id]/page.js`

```js
// nueva/page.js
import Link from 'next/link'
import HabitacionForm from '../HabitacionForm'

export default function NuevaHabitacionPage() {
  return (
    <div>
      <Link href="/admin/habitaciones" className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 inline-block">← Volver</Link>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-8">Nueva habitación</h1>
      <HabitacionForm />
    </div>
  )
}

// [id]/page.js
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import HabitacionForm from '../HabitacionForm'

export default async function EditarHabitacionPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: room } = await supabase.from('rooms').select('*').eq('id', id).single()

  if (!room) notFound()

  return (
    <div>
      <Link href="/admin/habitaciones" className="text-sm text-zinc-500 hover:text-zinc-900 mb-6 inline-block">← Volver</Link>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-8">Editar habitación</h1>
      <HabitacionForm room={room} />
    </div>
  )
}
```

**Descripción:** Dos páginas que comparten el mismo componente `HabitacionForm`. La página de creación (`nueva`) lo renderiza sin props, por lo que el formulario arranca vacío. La página de edición (`[id]`) obtiene los datos actuales de la habitación y los pasa como prop `room`, por lo que el formulario se pre-rellena con los valores existentes. La distinción entre crear y editar la gestiona internamente `HabitacionForm`.

---

## 30. `src/app/admin/habitaciones/HabitacionForm.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HabitacionForm({ room }) {
  const router = useRouter()
  const [nombre, setNombre] = useState(room?.nombre ?? '')
  const [tipo, setTipo] = useState(room?.tipo ?? 'doble')
  const [descripcion, setDescripcion] = useState(room?.descripcion ?? '')
  const [precio, setPrecio] = useState(room?.precio_por_noche ?? '')
  const [capacidad, setCapacidad] = useState(room?.capacidad ?? 2)
  const [imagenes, setImagenes] = useState(room?.imagenes ?? [])
  const [subiendo, setSubiendo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleImagenChange(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setSubiendo(true)
    setError(null)
    const supabase = createClient()
    const extension = archivo.name.split('.').pop()
    const nombreArchivo = `${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`
    const { error: uploadError } = await supabase.storage.from('habitaciones').upload(nombreArchivo, archivo)
    if (uploadError) { setError('Error al subir la imagen.'); setSubiendo(false); return }
    const { data: { publicUrl } } = supabase.storage.from('habitaciones').getPublicUrl(nombreArchivo)
    setImagenes(prev => [...prev, publicUrl])
    setSubiendo(false)
    e.target.value = ''
  }

  async function eliminarImagen(url) {
    const supabase = createClient()
    const nombreArchivo = url.split('/').pop()
    await supabase.storage.from('habitaciones').remove([nombreArchivo])
    setImagenes(prev => prev.filter(img => img !== url))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const datos = { nombre, tipo, descripcion, precio_por_noche: Number(precio), capacidad: Number(capacidad), imagenes }
    const { error } = room
      ? await supabase.from('rooms').update(datos).eq('id', room.id)
      : await supabase.from('rooms').insert(datos)
    if (error) { setError('Error al guardar la habitación.'); setLoading(false); return }
    router.push('/admin/habitaciones')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      {/* campos nombre, tipo, descripcion, precio, capacidad */}
      {/* gestión de imágenes con preview y botón eliminar */}
      {/* botones guardar y cancelar */}
    </form>
  )
}
```

**Descripción:** El formulario más complejo del proyecto. Gestiona creación y edición de habitaciones en un único componente: si recibe la prop `room` hace `UPDATE`, si no hace `INSERT`. Maneja tres flujos independientes de estado: el estado del formulario (`nombre`, `tipo`, `descripcion`, `precio`, `capacidad`), el array `imagenes` y el estado de carga (`loading`, `subiendo`).

La subida de imágenes funciona con el bucket `habitaciones` de Supabase Storage: al seleccionar un archivo, genera un nombre único combinando timestamp y string aleatorio, lo sube al bucket, obtiene la URL pública y la añade al array `imagenes` del estado local. Al guardar el formulario, ese array de URLs se persiste en el campo `imagenes` de la tabla `rooms` (campo de tipo array en PostgreSQL). La eliminación de imágenes borra el archivo del Storage y lo quita del array local. El botón de submit queda deshabilitado mientras se sube una imagen (`subiendo`) o se guarda el formulario (`loading`).

**Dependencias:** `createClient` (browser), Supabase Storage (bucket `habitaciones`), tabla `rooms`.

---

## 31. `src/app/admin/reservas/page.js`

```js
import { createClient } from '@/lib/supabase/server'
import CambiarEstado from './CambiarEstado'
import FiltrosReservas from './FiltrosReservas'

export default async function AdminReservasPage({ searchParams }) {
  const { estado, desde, hasta } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('bookings')
    .select('*, rooms(nombre)')
    .order('fecha_entrada', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (desde) query = query.gte('fecha_entrada', desde)
  if (hasta) query = query.lte('fecha_salida', hasta)

  const { data: bookings } = await query

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Reservas</h1>
      <FiltrosReservas estado={estado} desde={desde} hasta={hasta} />
      {bookings?.length === 0 ? (
        <p className="text-zinc-400 text-sm">No hay reservas con los filtros seleccionados.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings?.map(booking => (
            <div key={booking.id} className="border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">{booking.rooms?.nombre}</p>
                <p className="text-sm text-zinc-500">
                  {formatDate(booking.fecha_entrada)} → {formatDate(booking.fecha_salida)} · {booking.precio_total}€
                </p>
              </div>
              <CambiarEstado bookingId={booking.id} estado={booking.estado} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
```

**Descripción:** Listado de todas las reservas del hotel con filtros. Lee tres `searchParams` de la URL: `estado`, `desde` y `hasta`. Construye la query de forma condicional añadiendo filtros solo cuando existen. Muestra el nombre de la habitación a través de un join (`rooms(nombre)`). Cada fila tiene el componente `CambiarEstado` para alternar entre confirmada y cancelada.

**Dependencias:** `createClient` (servidor), `CambiarEstado`, `FiltrosReservas`, tablas `bookings` y `rooms`.

---

## 32. `src/app/admin/reservas/FiltrosReservas.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FiltrosReservas({ estado, desde, hasta }) {
  const router = useRouter()
  const [filtroEstado, setFiltroEstado] = useState(estado ?? '')
  const [filtroDesde, setFiltroDesde] = useState(desde ?? '')
  const [filtroHasta, setFiltroHasta] = useState(hasta ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (filtroEstado) params.set('estado', filtroEstado)
    if (filtroDesde) params.set('desde', filtroDesde)
    if (filtroHasta) params.set('hasta', filtroHasta)
    router.push(`/admin/reservas?${params.toString()}`)
  }

  function handleLimpiar() {
    setFiltroEstado(''); setFiltroDesde(''); setFiltroHasta('')
    router.push('/admin/reservas')
  }

  const hayFiltros = estado || desde || hasta

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-4 mb-6">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Estado</label>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white">
          <option value="">Todas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Fecha de entrada</label>
        <input type="date" value={filtroDesde}
          onChange={e => { setFiltroDesde(e.target.value); if (filtroHasta && e.target.value > filtroHasta) setFiltroHasta('') }}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500">Fecha de salida</label>
        <input type="date" min={filtroDesde} value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white" />
      </div>
      <button type="submit" className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors">Filtrar</button>
      {hayFiltros && (
        <button type="button" onClick={handleLimpiar} className="bg-zinc-200 text-zinc-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-300 transition-colors">Limpiar</button>
      )}
    </form>
  )
}
```

**Descripción:** Formulario de filtros para el panel de reservas. Permite filtrar por estado mediante un `<select>`, y por rango de fechas con dos inputs de fecha. Al enviar navega a `/admin/reservas?estado=...&desde=...&hasta=...`, actualizando los `searchParams` que lee el Server Component padre. El botón "Limpiar" solo aparece si hay algún filtro activo (evaluado sobre las props de la URL actual).

**Dependencias:** `useRouter` de Next.js. Sin consultas a base de datos.

---

## 33. `src/app/admin/reservas/CambiarEstado.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CambiarEstado({ bookingId, estado }) {
  const router = useRouter()
  const [optimisticEstado, setOptimisticEstado] = useState(estado)

  async function toggle() {
    const anterior = optimisticEstado
    const nuevoEstado = optimisticEstado === 'confirmed' ? 'cancelled' : 'confirmed'
    setOptimisticEstado(nuevoEstado)
    const supabase = createClient()
    const { error } = await supabase.from('bookings').update({ estado: nuevoEstado }).eq('id', bookingId)
    if (error) { setOptimisticEstado(anterior) } else { router.refresh() }
  }

  return (
    <button onClick={toggle}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
        optimisticEstado === 'confirmed'
          ? 'bg-green-50 text-green-700 hover:bg-green-100'
          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
      }`}>
      {optimisticEstado === 'confirmed' ? 'Confirmada' : 'Cancelada'}
    </button>
  )
}
```

**Descripción:** Idéntico en estructura a `ToggleActivo` pero para el estado de las reservas. Alterna entre `'confirmed'` y `'cancelled'` con UI optimista. El color verde indica confirmada, gris cancelada.

**Dependencias:** `createClient` (browser), tabla `bookings`.

---

## 34. `src/app/admin/usuarios/page.js`

```js
import { createClient } from '@/lib/supabase/server'
import CambiarRol from './CambiarRol'

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
```

**Descripción:** Lista todos los usuarios registrados en el sistema leyendo la tabla `profiles`, ordenados del más reciente al más antiguo. Muestra el nombre completo (o "Sin nombre" si no lo han rellenado), el email y el botón `CambiarRol`.

**Dependencias:** `createClient` (servidor), `CambiarRol`, tabla `profiles`.

---

## 35. `src/app/admin/usuarios/CambiarRol.js`

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CambiarRol({ userId, rol }) {
  const router = useRouter()
  const [optimisticRol, setOptimisticRol] = useState(rol)

  async function toggle() {
    const anterior = optimisticRol
    const nuevoRol = optimisticRol === 'admin' ? 'user' : 'admin'
    setOptimisticRol(nuevoRol)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ rol: nuevoRol }).eq('id', userId)
    if (error) { setOptimisticRol(anterior) } else { router.refresh() }
  }

  return (
    <button onClick={toggle}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
        optimisticRol === 'admin'
          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
      }`}>
      {optimisticRol === 'admin' ? 'Admin' : 'Usuario'}
    </button>
  )
}
```

**Descripción:** Idéntico en estructura a `ToggleActivo` y `CambiarEstado` pero para el rol de usuario. Alterna entre `'admin'` y `'user'` con UI optimista. Color azul para admin, gris para usuario. Actualiza la tabla `profiles`. El middleware leerá este cambio en la siguiente petición del usuario afectado.

**Dependencias:** `createClient` (browser), tabla `profiles`.

---

## 36. `src/app/not-found.js`

```js
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-200 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Página no encontrada</h1>
        <p className="text-zinc-500 text-sm mb-8">La página que buscas no existe o ha sido eliminada.</p>
        <Link href="/" className="bg-zinc-900 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-zinc-700 transition-colors">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
```

**Descripción:** Página de error 404 activada automáticamente por Next.js cuando cualquier Server Component llama a `notFound()` (páginas de habitación inexistente, reserva inexistente, etc.) o cuando se navega a una ruta que no existe en el sistema de ficheros. Server Component, sin interactividad.

---

## 37. `src/app/error.js`

```js
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-200 mb-4">500</p>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Algo ha ido mal</h1>
        <p className="text-zinc-500 text-sm mb-8">Ha ocurrido un error inesperado.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="bg-zinc-900 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-zinc-700 transition-colors">
            Intentar de nuevo
          </button>
          <Link href="/" className="bg-zinc-100 text-zinc-700 rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-zinc-200 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
```

**Descripción:** Boundary de error global de Next.js. Debe ser Client Component obligatoriamente (requerimiento del framework) porque recibe la prop `reset`, una función que intenta re-renderizar el árbol de componentes que falló. Registra el error en la consola vía `useEffect`. Ofrece dos opciones al usuario: reintentar (útil para errores transitorios de red) o volver al inicio.
