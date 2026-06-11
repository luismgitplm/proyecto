'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Formulario de creación y edición de habitación (room=null crear, room con datos editar).
// Gestiona también la subida y eliminación de imágenes en el bucket "habitaciones" de Supabase Storage.
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

  // Sube la imagen al bucket con nombre único (timestamp + random), obtiene la URL pública y la añade al estado
  async function handleImagenChange(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setSubiendo(true)
    setError(null)

    const supabase = createClient()
    const extension = archivo.name.split('.').pop()
    const nombreArchivo = `${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('habitaciones')
      .upload(nombreArchivo, archivo)

    if (uploadError) {
      setError('Error al subir la imagen.')
      setSubiendo(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('habitaciones')
      .getPublicUrl(nombreArchivo)

    setImagenes(prev => {
      const nuevas = []
      for (const img of prev) nuevas.push(img)
      nuevas.push(publicUrl)
      return nuevas
    })
    setSubiendo(false)
    e.target.value = ''
  }

  // Elimina la imagen del bucket de Storage y la quita del array local
  async function eliminarImagen(url) {
    const supabase = createClient()
    const nombreArchivo = url.split('/').pop()
    await supabase.storage.from('habitaciones').remove([nombreArchivo])
    setImagenes(prev => {
      const nuevas = []
      for (const img of prev) {
        if (img !== url) nuevas.push(img)
      }
      return nuevas
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const datos = {
      nombre,
      tipo,
      descripcion,
      precio_por_noche: Number(precio),
      capacidad: Number(capacidad),
      imagenes,
    }

    const { error } = room
      ? await supabase.from('rooms').update(datos).eq('id', room.id)
      : await supabase.from('rooms').insert(datos)

    if (error) {
      setError('Error al guardar la habitación.')
      setLoading(false)
      return
    }

    router.push('/admin/habitaciones')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Tipo</label>
        <select
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="individual">Individual</option>
          <option value="doble">Doble</option>
          <option value="suite">Suite</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Descripción</label>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          rows={3}
          className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-medium text-zinc-700">Precio por noche (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            required
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-medium text-zinc-700">Capacidad</label>
          <input
            type="number"
            min="1"
            max="10"
            value={capacidad}
            onChange={e => setCapacidad(e.target.value)}
            required
            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700">Imágenes</label>

        {imagenes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imagenes.map(url => (
              <div key={url} className="relative">
                <img src={url} alt="" className="h-20 w-20 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => eliminarImagen(url)}
                  className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <label className={`flex items-center justify-center border border-dashed border-zinc-300 rounded-lg px-3 py-3 cursor-pointer hover:border-zinc-500 transition-colors ${subiendo ? 'opacity-50 pointer-events-none' : ''}`}>
          <span className="text-sm text-zinc-500">
            {subiendo ? 'Subiendo...' : '+ Añadir imagen'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImagenChange}
            disabled={subiendo}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || subiendo}
          className="bg-zinc-900 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : room ? 'Guardar cambios' : 'Crear habitación'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
