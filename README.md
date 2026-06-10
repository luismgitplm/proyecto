# Terra Nova — Hotel & Suites

Plataforma web de reservas hoteleras desarrollada con Next.js y Supabase. Permite a los usuarios consultar habitaciones disponibles, realizar y gestionar sus reservas, y a los administradores gestionar el hotel desde un panel dedicado.

## Características

- Catálogo de habitaciones con filtrado por tipo y fechas de disponibilidad
- Registro e inicio de sesión de usuarios
- Reserva de habitaciones con cálculo de precio en tiempo real
- Política de cancelación: las reservas pueden cancelarse hasta 48 horas antes de la entrada
- Área personal del usuario: consulta de reservas pasadas y próximas, edición de perfil
- Panel de administración con dashboard de estadísticas, gestión de habitaciones (CRUD + imágenes), reservas y usuarios
- Diseño responsivo adaptado a móvil y escritorio

## Stack tecnológico

- **Next.js 16** (App Router, Server Components)
- **Supabase** (autenticación, base de datos PostgreSQL, almacenamiento de imágenes)
- **Tailwind CSS v4**

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio
npm install
```

### 2. Crear un proyecto en Supabase

Entra en [supabase.com](https://supabase.com), crea una cuenta y un nuevo proyecto.

### 3. Crear las tablas

En el **SQL Editor** de Supabase, ejecuta el siguiente script:

```sql
-- Tabla de perfiles de usuario
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nombre_completo text,
  telefono text,
  email text,
  rol text not null default 'user',
  created_at timestamptz default now()
);

-- Trigger para crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre_completo)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabla de habitaciones
create table public.rooms (
  id bigint generated always as identity primary key,
  nombre text not null,
  tipo text not null,
  descripcion text,
  precio_por_noche numeric not null,
  capacidad int not null default 2,
  imagenes text[] default '{}',
  activo boolean not null default true,
  created_at timestamptz default now()
);

-- Tabla de reservas
create table public.bookings (
  id bigint generated always as identity primary key,
  usuario_id uuid references public.profiles(id) on delete cascade not null,
  habitacion_id bigint references public.rooms(id) on delete cascade not null,
  fecha_entrada date not null,
  fecha_salida date not null,
  precio_total numeric not null,
  estado text not null default 'confirmed',
  created_at timestamptz default now()
);
```

### 4. Crear el bucket de imágenes

En Supabase → **Storage**, crea un bucket llamado `habitaciones` y márcalo como **público**.

Añade la siguiente política para que los admins puedan subir imágenes:

```sql
create policy "Los admins pueden subir imágenes"
  on storage.objects for insert
  with check (bucket_id = 'habitaciones' and public.es_admin());

create policy "Los admins pueden eliminar imágenes"
  on storage.objects for delete
  using (bucket_id = 'habitaciones' and public.es_admin());
```

### 5. Configurar las variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables (las encontrarás en Supabase → **Project Settings** → **API**):

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
```

### 6. Arrancar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Añadir el primer administrador

El primer usuario con rol de administrador debe asignarse manualmente desde Supabase. Una vez registrado en la aplicación, ejecuta en el SQL Editor:

```sql
UPDATE public.profiles SET rol = 'admin' WHERE email = 'correo@ejemplo.com';
```

A partir de entonces, cualquier administrador puede promover a otros usuarios desde el panel → **Usuarios**.

---
