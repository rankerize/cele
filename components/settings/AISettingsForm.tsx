'use client'

import { useState, useEffect } from 'react'
import { Brain, Sparkles, CheckCircle2, XCircle, Loader2, Save, Key, ShieldCheck } from 'lucide-react'

interface AIConfig {
  provider: 'gemini' | 'openai'
  apiKey: string
  model?: string
}

const MODELS = {
  gemini: [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Súper rápido y muy económico (Recomendado para alto volumen)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'El más reciente y equilibrado (Requiere cuenta de pago)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Mejor razonamiento complejo, pero consume más tokens' }
  ],
  openai: [
    { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', desc: 'La versión más rápida y rentable (Recomendado para generar decenas de artículos)' },
    { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', desc: 'Versión más pequeña y veloz, perfecta para SEO general' },
    { id: 'gpt-5.4', name: 'GPT-5.4 (Frontier)', desc: 'El más inteligente, con razonamiento avanzado (Consume bastantes tokens)' }
  ]
}

interface Props {
  projectId?: string
}

export default function AISettingsForm({ projectId }: Props) {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-flash'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        let url = '/api/settings/ai'
        if (projectId) url += `?projectId=${projectId}`
        
        const res = await fetch(url)
        const json = await res.json()
        if (json.success && json.data) {
          setConfig(json.data)
        }
      } catch (e) {
        console.error('Error cargando config de IA:', e)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [projectId])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, projectId })
      })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: 'Configuración de IA guardada correctamente.' })
      } else {
        throw new Error(json.error || 'Error al guardar')
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error desconocido' })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/settings/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, projectId })
      })
      const data = await res.json()
      if (data.success) {
        setTestResult({ success: true, message: data.message })
      } else {
        setTestResult({ success: false, message: data.error || 'No se pudo conectar con la IA.' })
      }
    } catch (e) {
      setTestResult({ success: false, message: 'Error de red al intentar conectar con la IA.' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-6">
        {/* Selector de Proveedor */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-500" />
            1. Selecciona tu Motor de IA
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'gemini', name: 'Google Gemini', icon: Sparkles, desc: 'Rápido, económico y gran ventana de contexto.' },
              { id: 'openai', name: 'OpenAI', icon: Brain, desc: 'Excelente precisión y razonamiento lógico.' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setConfig(prev => ({ 
                  ...prev, 
                  provider: p.id as any,
                  model: p.id === 'gemini' ? 'gemini-1.5-flash' : 'gpt-5.4-nano'
                }))}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                  config.provider === p.id 
                    ? 'bg-brand-600/10 border-brand-500 ring-1 ring-brand-500' 
                    : 'bg-white border-slate-200 hover:border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${config.provider === p.id ? 'bg-brand-500 text-white' : 'bg-white text-slate-600'}`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-tight">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-500" />
            2. Introduce tu API Key
          </label>
          <div className="max-w-xl space-y-3">
            <div className="relative">
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={config.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                className="bg-white border-slate-300 text-slate-900 focus:border-brand-500 py-3.5 pr-10 focus:ring-1 focus:ring-brand-500 rounded-xl px-4 w-full"
              />
              <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500 w-4 h-4" />
            </div>

            {/* Enlace directo para crear la API Key */}
            {config.provider === 'gemini' ? (
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl bg-brand-50 border border-brand-200 hover:border-brand-300 hover:bg-brand-100 transition-all duration-200 no-underline"
              >
                <div className="p-2 bg-brand-100 rounded-lg shrink-0">
                  <svg className="w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-700 group-hover:text-brand-800 transition-colors">Crear API Key gratuita en Google AI Studio</p>
                  <p className="text-xs text-slate-500 truncate">aistudio.google.com/apikey</p>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100 transition-all duration-200 no-underline"
              >
                <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">Crear API Key en OpenAI Platform</p>
                  <p className="text-xs text-slate-500 truncate">platform.openai.com/api-keys</p>
                </div>
                <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            <p className="text-xs text-slate-600 italic mt-4">
              🔒 Tu clave se guarda de forma segura y nunca se comparte.
            </p>
          </div>
        </div>

        {/* Selector de Modelo */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-500" />
            3. Selecciona el Modelo a utilizar
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 max-w-xl">
            {MODELS[config.provider].map((m) => (
              <button
                key={m.id}
                onClick={() => setConfig(prev => ({ ...prev, model: m.id }))}
                className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                  config.model === m.id 
                    ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <h4 className={`text-sm font-bold ${config.model === m.id ? 'text-brand-700' : 'text-slate-900'}`}>{m.name}</h4>
                  {config.model === m.id && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
        <button
          onClick={handleSave}
          disabled={saving || !config.apiKey}
          className="btn-primary w-full sm:w-auto px-8 py-3.5 justify-center shadow-xl shadow-brand-600/20 text-base"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Configuración
        </button>
        <button
          onClick={handleTest}
          disabled={testing || !config.apiKey}
          className="btn-secondary w-full sm:w-auto px-8 py-3.5 justify-center text-base"
        >
          {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Probar IA'}
        </button>

        {message && (
          <div className={`flex-1 p-3 rounded-xl text-sm animate-slide-up flex gap-3 ${
            message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            {message.text}
          </div>
        )}
      </div>

      {/* Feedback de Conexión Exitosa Brillante */}
      {testResult && (
        <div className={`p-5 rounded-2xl text-sm animate-in zoom-in slide-in-from-top-4 duration-500 flex flex-col gap-4 ${
          testResult.success 
            ? 'bg-emerald-50 border border-emerald-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {testResult.success 
              ? <div className="p-2 bg-emerald-100 rounded-full text-emerald-600 animate-pulse"><CheckCircle2 className="w-6 h-6" /></div> 
              : <XCircle className="w-8 h-8 text-red-500" />
            }
            <div>
              <h4 className={`text-base font-bold ${testResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                {testResult.success ? '¡IA Conectada Exitosamente!' : 'Fallo en la conexión'}
              </h4>
              <p className="text-slate-600 mt-0.5">{testResult.message}</p>
            </div>
          </div>
          {testResult.success && (
            <div className="text-xs text-emerald-500/80 font-medium px-4 py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
              ✨ Ya puedes empezar a generar contenido profesional con {config.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
