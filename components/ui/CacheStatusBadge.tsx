'use client'

/**
 * CacheStatusBadge
 * Muestra cuándo se cargaron los datos por última vez.
 * Si están frescos → verde "En caché · hace Xm"
 * Si están obsoletos → gris "Sin datos"
 * Incluye botón de refresh opcional.
 */

import { useState, useEffect } from 'react'
import { RefreshCw, Clock, Wifi } from 'lucide-react'

interface CacheStatusBadgeProps {
  /** Timestamp Unix (ms) del último fetch. 0 o undefined = sin datos */
  lastFetch?: number
  /** Milisegundos antes de considerar los datos obsoletos (default 5 min) */
  maxAgeMs?: number
  /** Callback al hacer clic en refresh */
  onRefresh?: () => void
  /** Si está cargando actualmente */
  loading?: boolean
  /** Clase CSS adicional */
  className?: string
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 60_000) return 'ahora mismo'
  if (diff < 3_600_000) return `hace ${Math.floor(diff / 60_000)}m`
  return `hace ${Math.floor(diff / 3_600_000)}h`
}

export default function CacheStatusBadge({
  lastFetch,
  maxAgeMs = 5 * 60_000,
  onRefresh,
  loading = false,
  className = '',
}: CacheStatusBadgeProps) {
  const [label, setLabel] = useState('')
  const [isStale, setIsStale] = useState(false)

  // Actualizar el label cada 30 segundos
  useEffect(() => {
    function update() {
      if (!lastFetch) {
        setLabel('')
        setIsStale(true)
        return
      }
      setLabel(timeAgo(lastFetch))
      setIsStale(Date.now() - lastFetch > maxAgeMs)
    }
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [lastFetch, maxAgeMs])

  // Sin datos cargados todavía
  if (!lastFetch) return null

  return (
    <div
      className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 border transition-all
        ${isStale
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        } ${className}`}
    >
      {/* Indicador de estado */}
      <span className="flex items-center gap-1.5 font-medium">
        {loading ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : isStale ? (
          <Clock className="w-3 h-3" />
        ) : (
          /* Dot pulsante verde */
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        )}
        {loading ? 'Actualizando…' : isStale ? `Desactualizado · ${label}` : `En caché · ${label}`}
      </span>

      {/* Botón de refresh */}
      {onRefresh && !loading && (
        <button
          onClick={onRefresh}
          title="Actualizar ahora"
          className={`ml-0.5 p-0.5 rounded hover:opacity-80 transition-opacity
            ${isStale ? 'text-amber-400' : 'text-emerald-400'}`}
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
