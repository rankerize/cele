'use client'

import { useEffect, useState } from 'react'

// ─── Tareas del diagnóstico ────────────────────────────────────────────────
const TASKS = [
  { icon: '🔌', label: 'Verificando conexión WordPress',   detail: 'REST API · autenticación' },
  { icon: '📊', label: 'Leyendo métricas Search Console',  detail: 'Últimas 4 semanas · impresiones y clics' },
  { icon: '📰', label: 'Procesando mapa editorial',        detail: 'Artículos · borradores · estados' },
  { icon: '🔗', label: 'Analizando enlazado interno',      detail: 'Oportunidades · anclas · cobertura' },
  { icon: '⚡', label: 'Calculando puntuaciones SEO',      detail: 'Score por artículo · alertas activas' },
  { icon: '🧠', label: 'Preparando motor de sugerencias', detail: 'Modelos cargados · configuración lista' },
]

// Mini-log de eventos que van apareciendo
const LOG_LINES = [
  '› Autenticando con WordPress API...',
  '› Obteniendo artículos del sitio...',
  '› Conectando con Google Search Console...',
  '› Calculando CTR medio de los últimos 30 días...',
  '› Detectando keywords en posición 4–20...',
  '› Mapeando oportunidades de contenido...',
  '› Construyendo score de salud del sitio...',
  '› Dashboard listo ✓',
]

export default function DiagnosticLoadingScreen() {
  const [activeTask, setActiveTask] = useState(0)
  const [doneTasks, setDoneTasks] = useState<number[]>([])
  const [progress, setProgress] = useState(3)
  const [logLines, setLogLines] = useState<string[]>([LOG_LINES[0]])

  useEffect(() => {
    // Avanza las tareas cada ~700ms
    const taskTimer = setInterval(() => {
      setActiveTask(prev => {
        const next = prev + 1
        if (next < TASKS.length) {
          setDoneTasks(d => [...d, prev])
          return next
        }
        clearInterval(taskTimer)
        setDoneTasks(d => [...d, prev])
        return prev
      })
    }, 700)

    // Barra de progreso suave
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const target = 90
        if (prev >= target) return prev
        return prev + (prev < 50 ? 3.5 : prev < 75 ? 1.8 : 0.6)
      })
    }, 80)

    // Log de eventos — uno nuevo cada ~500ms
    let logIdx = 1
    const logTimer = setInterval(() => {
      if (logIdx < LOG_LINES.length) {
        setLogLines(prev => [...prev.slice(-4), LOG_LINES[logIdx]])
        logIdx++
      } else {
        clearInterval(logTimer)
      }
    }, 500)

    return () => {
      clearInterval(taskTimer)
      clearInterval(progressTimer)
      clearInterval(logTimer)
    }
  }, [])

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Header con badge de escaneo en vivo ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-900 tracking-tight">
            Centro de Control <span className="gradient-text">SEO</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">Diagnóstico en tiempo real de tu sitio</p>
        </div>
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" style={{ animation: 'dls-blink 1s ease-in-out infinite' }} />
          Analizando...
        </span>
      </div>

      {/* ── Panel principal: tasks + log ─────────────────────────────────── */}
      <div className="card overflow-hidden border-slate-200">

        {/* Barra de progreso superior */}
        <div className="relative h-0.5 bg-white overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-600 via-purple-400 to-violet-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Shimmer sobre la barra */}
          <div className="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ animation: 'dls-shimmer 1.6s ease-in-out infinite' }} />
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Lista de tareas */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
              Módulos verificados
            </p>
            {TASKS.map((task, idx) => {
              const isDone   = doneTasks.includes(idx)
              const isActive = activeTask === idx && !isDone
              const isPending = idx > activeTask

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 transition-all duration-500"
                  style={{
                    opacity: isPending ? 0.3 : 1,
                    animation: `dls-task-in 0.4s ease-out ${idx * 60}ms both`,
                  }}
                >
                  {/* Status dot */}
                  <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all duration-400 ${
                    isDone   ? 'bg-emerald-500/20 border border-emerald-500/40'
                    : isActive ? 'bg-violet-500/20 border border-violet-500/40'
                    : 'bg-white border border-slate-200'
                  }`}>
                    {isDone
                      ? <span>✅</span>
                      : isActive
                        ? <span style={{ animation: 'dls-spin 1.2s linear infinite', display:'inline-block' }}>⚙️</span>
                        : task.icon
                    }
                  </div>

                  {/* Label */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold leading-none mb-0.5 ${
                      isDone ? 'text-emerald-400/80' : isActive ? 'text-slate-900' : 'text-slate-600'
                    }`}>
                      {task.label}
                    </p>
                    <p className="text-[10px] text-slate-600 truncate">{task.detail}</p>
                  </div>

                  {/* Dots pulsantes si está activo */}
                  {isActive && (
                    <div className="flex gap-0.5 shrink-0">
                      {[0,1,2].map(d => (
                        <div key={d} className="w-1 h-1 rounded-full bg-violet-400"
                          style={{ animation: 'dls-dot 1.1s ease-in-out infinite', animationDelay: `${d*160}ms` }} />
                      ))}
                    </div>
                  )}
                  {isDone && (
                    <span className="text-[10px] text-emerald-500 font-bold shrink-0">ok</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mini terminal / log */}
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
              Registro en vivo
            </p>
            <div className="flex-1 bg-[#090c13] rounded-xl border border-slate-200 p-3.5 font-mono text-[10px] space-y-1.5 overflow-hidden min-h-[140px]">
              {logLines.map((line, i) => (
                <p
                  key={`${i}-${line}`}
                  className="text-emerald-400/80 leading-relaxed"
                  style={{ animation: 'dls-log-in 0.3s ease-out' }}
                >
                  {line}
                </p>
              ))}
              {/* Cursor parpadeante */}
              <p className="text-violet-400" style={{ animation: 'dls-cursor 1s step-end infinite' }}>█</p>
            </div>

            {/* Progreso numérico */}
            <div className="flex justify-between text-[10px] text-slate-600 mt-2">
              <span>Diagnóstico del sitio</span>
              <span className="text-violet-400 font-bold">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Skeleton cards abajo — con shimmer, no vacías ─────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {['Clics', 'Impresiones', 'Posición', 'Keywords'].map((label, i) => (
          <div key={label} className="card p-4 overflow-hidden relative"
            style={{ animation: `dls-task-in 0.4s ease-out ${300 + i*80}ms both` }}>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full"
                style={{ animation: `dls-shimmer 2.2s ease-in-out infinite ${i*200}ms` }} />
            </div>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">{label}</p>
            <div className="h-6 w-16 rounded-md bg-white/80" />
            <div className="h-2 w-10 rounded-md bg-white/50 mt-1.5" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Alertas Activas', 'Pipeline de Contenido'].map((label, i) => (
          <div key={label} className="card p-5 overflow-hidden relative"
            style={{ animation: `dls-task-in 0.4s ease-out ${600 + i*100}ms both` }}>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full"
                style={{ animation: `dls-shimmer 2.4s ease-in-out infinite ${i*300}ms` }} />
            </div>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">{label}</p>
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex gap-3 items-center">
                  <div className="w-5 h-5 rounded-md bg-white/70 shrink-0" />
                  <div className="h-2.5 rounded-full bg-white/70 flex-1" style={{ width: `${55 + j*15}%` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Keyframes ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes dls-blink    { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes dls-shimmer  { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes dls-task-in  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dls-spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes dls-dot      { 0%,80%,100%{transform:scale(.7);opacity:.3} 40%{transform:scale(1.2);opacity:1} }
        @keyframes dls-log-in   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes dls-cursor   { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
