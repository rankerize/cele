'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Globe, LineChart, CheckCircle2, AlertTriangle, Loader2, Link2, ExternalLink, RefreshCw, BarChart3 } from 'lucide-react'

interface GscSite {
  siteUrl: string
  permissionLevel: string
}

interface GaProperty {
  name: string
  displayName: string
  propertyType: string
}

export default function GoogleSettingsForm({ projectId: propProjectId }: { projectId?: string }) {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const params = useParams()
  const projectId = propProjectId || (params?.projectId as string) || ''
  
  const [gscSites, setGscSites] = useState<GscSite[]>([])
  const [selectedGscSite, setSelectedGscSite] = useState('')
  
  const [gaProperties, setGaProperties] = useState<GaProperty[]>([])
  const [selectedGaProperty, setSelectedGaProperty] = useState('')
  
  const [savingGsc, setSavingGsc] = useState(false)
  const [savingGa, setSavingGa] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadStatus()
  }, [projectId])

  async function loadStatus() {
    setLoading(true)
    try {
      const gscRes = await fetch(`/api/gsc/sites?projectId=${projectId}`)
      if (gscRes.ok) {
        const gscData = await gscRes.json()
        setConnected(true)
        setGscSites(gscData.data || [])
        setSelectedGscSite(gscData.currentSiteUrl || '')
        
        // Load GA
        const gaRes = await fetch(`/api/ga/properties?projectId=${projectId}`)
        if (gaRes.ok) {
          const gaData = await gaRes.json()
          setGaProperties(gaData.data || [])
          setSelectedGaProperty(gaData.currentPropertyId || '')
        }
      } else {
        setConnected(false)
      }
    } catch (e) {
      console.error('Error loading Google status:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    let url = '/api/auth/google'
    if (projectId) url += `?projectId=${projectId}`
    window.location.href = url
  }

  const handleSaveGsc = async (url: string) => {
    setSelectedGscSite(url)
    setSavingGsc(true)
    try {
      const res = await fetch('/api/gsc/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl: url, projectId })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Propiedad de Search Console guardada.' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error al guardar GSC' })
    } finally {
      setSavingGsc(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleSaveGa = async (id: string) => {
    setSelectedGaProperty(id)
    setSavingGa(true)
    try {
      const res = await fetch('/api/ga/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id, projectId })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Propiedad de Analytics guardada.' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error al guardar GA' })
    } finally {
      setSavingGa(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20 shadow-xl shadow-brand-500/10">
          <Globe className="w-8 h-8 text-brand-400" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-slate-900 tracking-tight">Conecta con Google</h3>
          <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed">
            Vincula tus cuentas de Search Console y Google Analytics para desbloquear el análisis SEO avanzado y el seguimiento de conversiones.
          </p>
        </div>
        <button
          onClick={handleConnect}
          className="btn-primary bg-brand-600 hover:bg-brand-500 text-white px-8 py-3.5 shadow-xl shadow-brand-600/20 flex items-center gap-2 mx-auto transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Link2 className="w-5 h-5" />
          Vincular Google Services
        </button>
        <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">
          Requiere permisos de lectura de Search Console y Analytics
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      {/* Search Console Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
             <Globe className="w-4 h-4 text-brand-400" />
             Google Search Console
          </label>
          <div className="relative group/select">
            <select
              value={selectedGscSite}
              onChange={(e) => handleSaveGsc(e.target.value)}
              disabled={savingGsc}
              className="bg-slate-50 border-slate-200 text-slate-900 focus:border-brand-500 py-3.5 pl-4 pr-10 w-full appearance-none transition-all"
            >
              <option value="">Selecciona una propiedad...</option>
              {gscSites.map(s => (
                <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
               {savingGsc ? <Loader2 className="w-4 h-4 animate-spin text-brand-500" /> : <RefreshCw className="w-3.5 h-3.5 group-hover/select:rotate-180 transition-transform duration-500" />}
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">
            Esta propiedad se usará para extraer keywords, clics e impresiones.
          </p>
        </div>

        {/* Analytics Section */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
             <BarChart3 className="w-4 h-4 text-emerald-400" />
             Google Analytics 4
          </label>
          <div className="relative group/select">
            <select
              value={selectedGaProperty}
              onChange={(e) => handleSaveGa(e.target.value)}
              disabled={savingGa}
              className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 py-3.5 pl-4 pr-10 w-full appearance-none transition-all"
            >
              <option value="">Selecciona una propiedad GA4...</option>
              {gaProperties.map(p => (
                <option key={p.name} value={p.name}>{p.displayName}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
               {savingGa ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <RefreshCw className="w-3.5 h-3.5 group-hover/select:rotate-180 transition-transform duration-500" />}
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">
            Usado para medir el tráfico y las métricas de comportamiento (bounce rate, tiempo en página).
          </p>
        </div>
      </div>

      {/* Connection Status Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Cuenta conectada correctamente</p>
            <p className="text-[10px] text-slate-500 font-medium">Puedes refrescar los permisos si algo no aparece.</p>
          </div>
        </div>
        <button 
          onClick={handleConnect}
          className="p-2 text-slate-500 hover:text-brand-400 hover:bg-brand-500/5 rounded-lg border border-transparent hover:border-brand-500/20 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refrescar Tokens
        </button>
      </div>

      {message && (
        <div className={`fixed bottom-8 right-8 p-4 rounded-xl text-sm font-bold shadow-2xl flex items-center gap-3 animate-slide-up ${
          message.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {message.text}
        </div>
      )}
    </div>
  )
}
