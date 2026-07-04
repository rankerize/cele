'use client'

import { useState, useEffect } from 'react'
import { Globe, User, Key, CheckCircle2, XCircle, Loader2, ExternalLink, Wifi, AlertCircle, ArrowRight, RotateCcw, Trash2, PlusCircle, Check } from 'lucide-react'

export interface WPConfig {
  apiUrl: string
  username: string
  appPassword: string
  hasWooCommerce?: boolean
}

export interface SavedSite extends WPConfig {
  id: string
}

interface Props {
  projectId?: string
  onWooCommerceDetected?: (hasWC: boolean) => void
}

type Status = 'idle' | 'testing' | 'success' | 'error' | 'saving'

interface TestResult {
  success: boolean
  message: string
  hint?: string
  categoriesFound?: number
  normalizedUrl?: string
  hasWooCommerce?: boolean
}

export default function WPSettingsForm({ projectId, onWooCommerceDetected }: Props) {
  const [config, setConfig] = useState<WPConfig>({ apiUrl: '', username: '', appPassword: '' })
  const [savedSites, setSavedSites] = useState<SavedSite[]>([])
  const [activeSiteUrl, setActiveSiteUrl] = useState<string | null>(null)
  
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)

  // Cargar configuración guardada
  useEffect(() => {
    let url = '/api/settings/wordpress'
    if (projectId) url += `?projectId=${projectId}`

    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          const { apiUrl, username, appPassword, hasWooCommerce, savedSites: loadedSites } = json.data
          if (apiUrl) {
            setActiveSiteUrl(apiUrl)
            setConfig({ apiUrl, username, appPassword })
            if (typeof hasWooCommerce === 'boolean') {
              onWooCommerceDetected?.(hasWooCommerce)
            }
          }
          if (loadedSites && Array.isArray(loadedSites)) {
            setSavedSites(loadedSites)
          } else if (apiUrl) {
             // Migrate the current one to savedSites if none exists
             setSavedSites([{
                id: apiUrl,
                apiUrl,
                username,
                appPassword,
                hasWooCommerce
             }])
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingInit(false))
  }, [projectId])

  const isFormComplete = config.apiUrl.trim() && config.username.trim() && config.appPassword.trim()

  const displayUrl = config.apiUrl
    ? config.apiUrl.replace('/wp-json/wp/v2', '')
    : ''

  // 1. Probar → si éxito, guardar en el listado y establecerlo como activo
  const handleTestAndSaveNew = async () => {
    if (!isFormComplete) return
    setStatus('testing')
    setTestResult(null)

    try {
      const res = await fetch('/api/wordpress/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data: TestResult & { normalizedUrl?: string } = await res.json()

      if (data.success) {
        const finalUrl = data.normalizedUrl || config.apiUrl
        const finalConfig = { ...config, apiUrl: finalUrl, hasWooCommerce: data.hasWooCommerce ?? false }
        
        // Crear nuevo item
        const newSite: SavedSite = {
           id: finalUrl, // we use URL as id for simplicity
           ...finalConfig
        }

        // Incorporarlo a savedSites (reemplazando si ya existia con la misma URL)
        const updatedSites = [
          ...savedSites.filter(s => s.apiUrl !== finalUrl),
          newSite
        ]

        setStatus('saving')

        // Guardar en la api
        const saveRes = await fetch('/api/settings/wordpress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...finalConfig,
            savedSites: updatedSites,
            projectId
          }),
        })
        const saveData = await saveRes.json()

        if (saveData.success) {
          setStatus('success')
          setSavedSites(updatedSites)
          setActiveSiteUrl(finalUrl)
          onWooCommerceDetected?.(data.hasWooCommerce ?? false)
          setTestResult({ success: true, message: 'Sitio añadido y activado.', categoriesFound: data.categoriesFound })
          
          // Limpiar formulario para permitir añadir otro sin confusiones
          // setConfig({ apiUrl: '', username: '', appPassword: '' })
          setTimeout(() => setStatus('idle'), 3000)
        } else {
          setStatus('error')
          setTestResult({ success: false, message: 'Conexión exitosa pero error al guardar: ' + (saveData.error || 'Error desconocido') })
        }
      } else {
        setStatus('error')
        setTestResult({ success: false, message: data.message || (data as unknown as { error?: string }).error || 'Error desconocido', hint: data.hint })
      }
    } catch {
      setStatus('error')
      setTestResult({ success: false, message: 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.' })
    }
  }

  // Activar un sitio existente
  const handleActivateSite = async (siteConfig: SavedSite) => {
     setActiveSiteUrl(siteConfig.apiUrl)
     setConfig({ apiUrl: siteConfig.apiUrl, username: siteConfig.username, appPassword: siteConfig.appPassword })
     onWooCommerceDetected?.(siteConfig.hasWooCommerce ?? false)

     await fetch('/api/settings/wordpress', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         ...siteConfig,
         savedSites: savedSites,
         projectId
       }),
     }).catch(console.error)
  }

  // Eliminar un sitio
  const handleRemoveSite = async (siteId: string) => {
     const updatedSites = savedSites.filter(s => s.id !== siteId)
     setSavedSites(updatedSites)
     
     // Si eliminamos el activo, desactivar actual si no quedan, o pasar al primero
     let newActive: SavedSite | undefined = undefined
     if (activeSiteUrl === siteId) {
        newActive = updatedSites[0]
        setActiveSiteUrl(newActive ? newActive.apiUrl : null)
        if (newActive) {
          setConfig({ apiUrl: newActive.apiUrl, username: newActive.username, appPassword: newActive.appPassword })
        } else {
          setConfig({ apiUrl: '', username: '', appPassword: '' })
        }
        onWooCommerceDetected?.(newActive ? (newActive.hasWooCommerce ?? false) : false)
     } else {
        newActive = savedSites.find(s => s.apiUrl === activeSiteUrl)
     }

     const payload: any = {
        savedSites: updatedSites,
        projectId
     }

     if (newActive) {
        Object.assign(payload, newActive)
     } else {
        // Ninguno activo, vaciar
        payload.clearAll = true
     }

     await fetch('/api/settings/wordpress', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload),
     }).catch(console.error)
  }

  if (loadingInit) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  // Helper para mostrar urls bonitas
  const getCleanUrl = (url: string) => url.replace('/wp-json/wp/v2', '').replace('https://', '').replace(/\/$/, '')

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* ── LISTA DE SITIOS CONECTADOS ── */}
      {savedSites.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-400" /> Sitios Guardados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {savedSites.map(site => {
                const isActive = site.apiUrl === activeSiteUrl

                return (
                   <div 
                      key={site.id} 
                      className={`relative p-4 rounded-xl border transition-all ${
                         isActive 
                         ? 'bg-brand-500/10 border-brand-500/30' 
                         : 'bg-white border-slate-200 hover:border-slate-200'
                      }`}
                   >
                     {isActive && (
                        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 animate-fade-in">
                           <span className="flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                           </span>
                        </div>
                     )}
                     
                     <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-bold truncate ${isActive ? 'text-brand-300' : 'text-slate-800'}`}>
                                 {getCleanUrl(site.apiUrl)}
                              </p>
                              {isActive && (
                                 <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-brand-500/20 text-brand-400">Activo</span>
                              )}
                           </div>
                           <p className="text-xs text-slate-500 truncate mt-1">
                              <User className="w-3 h-3 inline-block -mt-0.5 mr-1" /> {site.username}
                           </p>
                           {site.hasWooCommerce && (
                              <p className="inline-block px-1.5 py-0.5 mt-2 rounded text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                 WooCommerce
                              </p>
                           )}
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                           {!isActive && (
                              <button
                                 onClick={() => handleActivateSite(site)}
                                 className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white hover:bg-brand-500/20 text-slate-700 hover:text-brand-300 transition-colors flex items-center justify-center gap-1.5"
                              >
                                 <Check className="w-3.5 h-3.5" /> Fichar
                              </button>
                           )}
                           <button
                              onClick={() => handleRemoveSite(site.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
                           >
                              <Trash2 className="w-3 h-3" /> Borrar
                           </button>
                        </div>
                     </div>
                   </div>
                )
             })}
          </div>
        </div>
      )}

      <div className={savedSites.length > 0 ? "pt-6 mt-6 border-t border-slate-200" : ""}>
         <h3 className="font-display text-sm font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
           <PlusCircle className="w-4 h-4 text-emerald-400" /> Añadir nuevo WordPress
         </h3>

         {/* Formulario de 3 campos */}
         <div className="space-y-5">
           {/* Campo 1: URL del sitio */}
           <div className="space-y-2">
             <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
               <Globe className="w-3.5 h-3.5 text-brand-400" />
               URL de tu sitio WordPress
             </label>
             <input
               type="url"
               value={displayUrl || config.apiUrl}
               onChange={e => {
                 const val = e.target.value.trim()
                 setConfig(prev => ({ ...prev, apiUrl: val }))
                 setStatus('idle')
                 setTestResult(null)
               }}
               onBlur={e => {
                 const val = e.target.value.trim()
                 if (val && val.startsWith('http') && !val.includes('/wp-json')) {
                   setConfig(prev => ({ ...prev, apiUrl: `${val.replace(/\/$/, '')}/wp-json/wp/v2` }))
                 }
               }}
               placeholder="https://tu-sitio.com"
               className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
             />
             <p className="text-xs text-slate-600 flex items-center gap-1.5">
               <AlertCircle className="w-3 h-3 shrink-0" />
               Solo pon tu dominio principal. El endpoint <code className="text-slate-500">/wp-json/wp/v2</code> se añade solo.
             </p>
           </div>

           {/* Campo 2: Usuario */}
           <div className="space-y-2">
             <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
               <User className="w-3.5 h-3.5 text-brand-400" />
               Usuario de WordPress
             </label>
             <input
               type="text"
               value={config.username}
               onChange={e => {
                 setConfig(prev => ({ ...prev, username: e.target.value }))
                 setStatus('idle')
               }}
               placeholder="admin"
               autoComplete="username"
               className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
             />
             <p className="text-xs text-slate-600">El mismo usuario con el que entras a tu panel WP.</p>
           </div>

           {/* Campo 3: App Password */}
           <div className="space-y-2">
             <label className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
               <Key className="w-3.5 h-3.5 text-brand-400" />
               Contraseña de Aplicación
             </label>
             <div className="relative">
               <input
                 type={showPassword ? 'text' : 'password'}
                 value={config.appPassword}
                 onChange={e => {
                   setConfig(prev => ({ ...prev, appPassword: e.target.value }))
                   setStatus('idle')
                 }}
                 placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                 autoComplete="new-password"
                 className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors pr-24"
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <button
                   type="button"
                   onClick={() => setShowPassword(v => !v)}
                   className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                 >
                   {showPassword ? 'Ocultar' : 'Ver'}
                 </button>
                 {config.apiUrl && (
                   <a
                     href={`${config.apiUrl.replace('/wp-json/wp/v2', '')}/wp-admin/profile.php#application-passwords-section`}
                     target="_blank"
                     rel="noreferrer"
                     className="text-brand-400 hover:text-brand-300"
                     title="Generar contraseña en WP"
                   >
                     <ExternalLink className="w-4 h-4" />
                   </a>
                 )}
               </div>
             </div>

             {/* Instrucción simplificada en 1 línea */}
             <div className="flex items-start gap-2 text-xs text-slate-600 p-3 bg-white/30 rounded-xl border border-slate-200/50">
               <Key className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
               <span>
                 NO es tu contraseña normal. Entra a{' '}
                 <strong className="text-slate-600">WP Admin → Usuarios → Tu perfil</strong>
                 {' '}→ desplaza hasta{' '}
                 <strong className="text-slate-600">"Contraseñas de aplicación"</strong>
                 {' '}y genera una nueva. Cópiala aquí.
                 {config.apiUrl && (
                   <>
                     {' '}
                     <a
                       href={`${config.apiUrl.replace('/wp-json/wp/v2', '')}/wp-admin/profile.php#application-passwords-section`}
                       target="_blank"
                       rel="noreferrer"
                       className="text-brand-400 hover:underline inline-flex items-center gap-1"
                     >
                       Ir directamente <ExternalLink className="w-3 h-3" />
                     </a>
                   </>
                 )}
               </span>
             </div>
           </div>
         </div>

         {/* Botón único: Probar y Conectar */}
         <div className="pt-6">
           <button
             onClick={handleTestAndSaveNew}
             disabled={!isFormComplete || status === 'testing' || status === 'saving'}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-xl shadow-emerald-600/20 text-sm"
           >
             {status === 'testing' && <><Loader2 className="w-4 h-4 animate-spin" /> Probando conexión...</>}
             {status === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>}
             {(status === 'idle' || status === 'error') && <><Wifi className="w-4 h-4" /> Probar y Conectar <ArrowRight className="w-4 h-4" /></>}
             {status === 'success' && <><CheckCircle2 className="w-4 h-4" /> ¡Conectado!</>}
           </button>

           {!isFormComplete && (
             <p className="text-xs text-slate-600 mt-2">Completa los 3 campos para conectar.</p>
           )}
         </div>

         {/* Resultado del test */}
         {testResult && (
           <div className={`mt-4 p-4 rounded-2xl border animate-in slide-in-from-top-4 duration-300 ${
             testResult.success
               ? 'bg-emerald-500/8 border-emerald-500/20'
               : 'bg-red-500/8 border-red-500/20'
           }`}>
             <div className="flex items-start gap-3">
               {testResult.success
                 ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                 : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
               }
               <div className="flex-1">
                 <p className={`text-sm font-semibold ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                   {testResult.success ? '¡Conectado y añadido correctamente!' : 'No se pudo conectar'}
                 </p>
                 <p className="text-xs text-slate-600 mt-1">{testResult.message}</p>
                 {testResult.hint && (
                   <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                     <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                     {testResult.hint}
                   </p>
                 )}
               </div>
             </div>
           </div>
         )}
      </div>

    </div>
  )
}
