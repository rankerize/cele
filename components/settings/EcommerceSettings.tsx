'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  Key,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Zap,
  Info,
  Package,
} from 'lucide-react'

interface WCConfig {
  apiUrl: string
  consumerKey: string
  consumerSecret: string
}

const STEPS = [
  {
    title: 'URL de tu Tienda WooCommerce',
    description: 'La URL base de tu tienda, incluyendo el path de la API REST.',
    icon: Globe,
    field: 'apiUrl' as keyof WCConfig,
    placeholder: 'https://tu-tienda.com/wp-json/wc/v3',
    type: 'text',
    help: 'Si tu tienda es https://mitienda.com, la URL será https://mitienda.com/wp-json/wc/v3',
  },
  {
    title: 'Consumer Key',
    description: 'La llave pública generada en WooCommerce → Ajustes → REST API.',
    icon: Key,
    field: 'consumerKey' as keyof WCConfig,
    placeholder: 'ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    type: 'text',
    help: 'Comienza con "ck_". La encontrarás en la pantalla de confirmación al crear la clave.',
  },
  {
    title: 'Consumer Secret',
    description: 'La llave privada. Solo se muestra una vez al crearla — guárdala bien.',
    icon: Lock,
    field: 'consumerSecret' as keyof WCConfig,
    placeholder: 'cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    type: 'password',
    help: 'Comienza con "cs_". Si la perdiste, deberás regenerar las claves en WooCommerce.',
  },
]

const MANUAL_STEPS = [
  {
    num: 1,
    title: 'Accede a WooCommerce',
    detail: 'Ve a tu panel de WordPress y en el menú lateral haz clic en WooCommerce → Ajustes.',
  },
  {
    num: 2,
    title: 'Abre la pestaña "Avanzado" → REST API',
    detail: 'Dentro de Ajustes, busca la pestaña "Avanzado" y luego la sub-sección "REST API".',
  },
  {
    num: 3,
    title: 'Crea una nueva clave',
    detail:
      'Haz clic en "Añadir clave". Ponle el nombre "Optimizador IA" y asegúrate de seleccionar permisos de Lectura/Escritura. Haz clic en "Generar clave API".',
  },
]

export default function EcommerceSettings({ projectId }: { projectId?: string }) {
  const [config, setConfig] = useState<WCConfig>({
    apiUrl: '',
    consumerKey: '',
    consumerSecret: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    productCount?: number
  } | null>(null)
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  
  // ── Cargar configuración guardada ──
  useEffect(() => {
    async function loadSettings() {
      try {
        let url = '/api/settings/woocommerce'
        if (projectId) url += `?projectId=${projectId}`
        const res = await fetch(url)
        const json = await res.json()
        if (json.success && json.data) {
          setConfig(json.data)
        }
      } catch (e) {
        console.error('Error loading WC settings:', e)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [projectId])

  // ── Guardar ──
  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const res = await fetch('/api/settings/woocommerce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, projectId }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error del servidor (${res.status})`)
      }

      const json = await res.json()
      if (json.success) {
        setSaveMessage({ type: 'success', text: 'Credenciales guardadas correctamente en la nube.' })
      } else {
        throw new Error(json.error || 'Error al guardar')
      }
    } catch (err) {
      clearTimeout(timeoutId)
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'La conexión tardó demasiado. Revisa tu internet e intenta de nuevo.'
          : err instanceof Error
          ? err.message
          : 'Error desconocido'
      setSaveMessage({ type: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  // ── Probar conexión ──
  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      let url = '/api/ecommerce-engine/products?per_page=1'
      if (projectId) url += `&projectId=${projectId}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setTestResult({
          success: true,
          message: `¡Conexión perfecta! Tu tienda WooCommerce está lista para el Optimizador IA.`,
          productCount: data.data?.total ?? 0,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'No pudimos conectar. Revisa tus credenciales y permisos.',
        })
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Error de red al intentar conectar con WooCommerce.',
      })
    } finally {
      setTesting(false)
    }
  }

  const isComplete = config.apiUrl && config.consumerKey && config.consumerSecret
  const filledCount = [config.apiUrl, config.consumerKey, config.consumerSecret].filter(Boolean).length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Progress bar ── */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>{filledCount} de 3 campos completados</span>
          {isComplete && (
            <span className="text-orange-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Listo para conectar
            </span>
          )}
        </div>
        <div className="h-1.5 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${(filledCount / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Campos del formulario ── */}
      <div className="grid grid-cols-1 gap-6">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const value = config[step.field]
          const filled = Boolean(value)

          return (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border transition-colors duration-300 ${
                    filled
                      ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                      : 'bg-white/50 border-slate-200/40 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {idx + 1}. {step.title}
                    {filled && <CheckCircle2 className="w-4 h-4 text-orange-400 animate-in zoom-in" />}
                  </h4>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              </div>

              <div className="max-w-xl space-y-2">
                <input
                  type={step.type}
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value
                    setConfig((prev) => ({ ...prev, [step.field]: val }))
                    // Auto-normalize URL
                    if (step.field === 'apiUrl') {
                      try {
                        if (val.includes('http') && !val.includes('/wp-json/wc/v3')) {
                          const url = new URL(val)
                          setTimeout(() => {
                            setConfig((prev) => ({
                              ...prev,
                              apiUrl: `${url.protocol}//${url.host}/wp-json/wc/v3`,
                            }))
                          }, 800)
                        }
                      } catch {}
                    }
                  }}
                  placeholder={step.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3.5 placeholder-slate-600 focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all font-mono"
                />

                <div
                  className={`flex gap-2 p-3 rounded-lg border transition-all ${
                    filled
                      ? 'bg-orange-500/5 border-orange-500/15'
                      : 'bg-white/20 border-slate-200/10'
                  }`}
                >
                  <Info className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${filled ? 'text-orange-400' : 'text-slate-600'}`} />
                  <p className="text-xs text-slate-500 leading-relaxed italic">{step.help}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Botones de acción ── */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
        <button
          id="wc-save-btn"
          onClick={handleSave}
          disabled={saving || !isComplete}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:from-orange-500 hover:to-amber-400 shadow-xl shadow-orange-600/20 w-full sm:w-auto justify-center"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Credenciales
        </button>

        <button
          id="wc-test-btn"
          onClick={handleTest}
          disabled={testing || !isComplete}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm border border-slate-200 bg-white/50 text-slate-700 hover:border-orange-500/40 hover:text-orange-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
        >
          {testing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          Probar Conexión
        </button>

        {saveMessage && (
          <div
            className={`flex-1 p-3 rounded-xl text-sm flex gap-3 items-start animate-in slide-in-from-top-2 duration-300 ${
              saveMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0" />
            )}
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* ── Resultado del test ── */}
      {testResult && (
        <div
          className={`p-5 rounded-2xl text-sm animate-in zoom-in slide-in-from-top-4 duration-500 shadow-2xl flex flex-col gap-4 ${
            testResult.success
              ? 'bg-emerald-500/10 border-2 border-emerald-500/30 ring-4 ring-emerald-500/5'
              : 'bg-red-500/10 border-2 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-4">
            {testResult.success ? (
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse rounded-full" />
                <div className="relative p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-500 rounded-2xl shadow-xl shadow-red-500/20">
                <XCircle className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h4
                className={`text-lg font-black tracking-tight ${
                  testResult.success ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {testResult.success ? '¡TIENDA CONECTADA!' : 'Fallo en la conexión'}
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed mt-0.5">{testResult.message}</p>
            </div>
          </div>

          {testResult.success && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Productos</p>
                  <p className="text-base font-black text-emerald-400">
                    {testResult.productCount?.toLocaleString() ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Estado</p>
                  <p className="text-xs font-bold text-emerald-400">Listo para optimizar</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Manual Visual — Acordeón ── */}
      <div className="border border-slate-200/50 rounded-2xl overflow-hidden">
        <button
          id="wc-guide-toggle"
          onClick={() => setGuideOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-5 py-4 bg-white/40 hover:bg-slate-50/70 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Key className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900">¿Cómo obtengo mis llaves de WooCommerce?</p>
              <p className="text-xs text-slate-500">3 pasos simples · Solo se hace una vez</p>
            </div>
          </div>
          {guideOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-600 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-600 shrink-0" />
          )}
        </button>

        {guideOpen && (
          <div className="p-5 bg-white/40 border-t border-slate-200/60 space-y-4 animate-in slide-in-from-top-2 duration-300">
            {MANUAL_STEPS.map((step) => (
              <div key={step.num} className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <span className="text-xs font-black text-amber-400">{step.num}</span>
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">{step.detail}</p>
                </div>
              </div>
            ))}

            <div className="mt-2 flex items-start gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/15">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-amber-400">Importante:</strong> El Consumer Secret solo se muestra
                una vez. Cópialo y guárdalo antes de cerrar la ventana de WooCommerce.
              </p>
            </div>

            <a
              href="https://woocommerce.com/document/woocommerce-rest-api/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors font-semibold mt-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver documentación oficial de WooCommerce REST API
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
