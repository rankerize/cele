import Link from 'next/link'
import { ArrowLeft, Bot, ShieldAlert, Sparkles } from 'lucide-react'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,#f7f5ef_0%,#eef3f0_48%,#e7efe9_100%)] text-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-emerald-500/20">
            <Bot className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Cele</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Acceso temporal desactivado</h1>
          </div>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-amber-500/20 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Este login todavía depende de Firebase.</p>
              <p className="mt-1">
                En este entorno la clave pública de Firebase no está configurada, por eso aparece el error <code>auth/api-key-not-valid</code>.
                Para seguir probando la plataforma sin fricción, estamos usando una versión demo del acceso.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Qué sigue</p>
            <p className="mt-2 text-sm text-slate-700">Conectar Firebase real o reemplazar este login por un acceso propio del MVP.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Mientras tanto</p>
            <p className="mt-2 text-sm text-slate-700">Puedes usar la home y seguir probando el flujo de agente SEO sin bloqueo.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Volver a la home
          </Link>
          <a href="mailto:hello@rankerize.com" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Definir el acceso final
          </a>
        </div>
      </div>
    </main>
  )
}
