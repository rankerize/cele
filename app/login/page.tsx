'use client'

export const dynamic = 'force-dynamic'

import { useState, FormEvent, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, Eye, EyeOff, User, AlertCircle, CheckCircle2, Loader2, ArrowRight, ChevronRight } from 'lucide-react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getAuth,
} from 'firebase/auth'
import { app } from '@/lib/firebase'

// ── Tipos de vista ────────────────────────────────────────────────────────────
type View = 'login' | 'register' | 'forgot'

// ── Fortaleza de contraseña ───────────────────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: 'Muy débil', color: 'bg-red-500' },
    { label: 'Débil', color: 'bg-orange-500' },
    { label: 'Regular', color: 'bg-amber-400' },
    { label: 'Fuerte', color: 'bg-emerald-400' },
    { label: 'Muy fuerte', color: 'bg-emerald-500' },
  ]
  return { score, ...map[score] }
}

// ── Helper: sincronizar Firebase UID con iron-session ─────────────────────────
async function syncSession(uid: string, email: string | null, displayName: string | null, photoURL: string | null) {
  await fetch('/api/auth/firebase-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email, displayName, photoURL }),
  })
}

// ── Traducciones de errores Firebase ─────────────────────────────────────────
function firebaseError(code: string, originalMessage?: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google.',
    'auth/cancelled-popup-request': '',
    'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
    'auth/operation-not-allowed': 'El registro con correo no está habilitado en Firebase.',
  }
  return map[code] || `Error (${code || 'desconocido'}): ${originalMessage || 'Intenta de nuevo'}`
}

// ── Componente principal ──────────────────────────────────────────────────────
function AuthForm() {
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const auth = getAuth(app)
  const strength = getPasswordStrength(password)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'oauth_denied') setError('Cancelaste el acceso con Google.')
    else if (err === 'token_exchange') setError('Error al conectar con Google. Intenta de nuevo.')
    else if (err) setError('Error de autenticación. Intenta de nuevo.')
  }, [searchParams])

  // Reset state on view change
  function switchView(v: View) {
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
    setView(v)
  }

  // ── Google Sign-In (Redirect to Custom OAuth) ──────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    try {
      // Usamos nuestro propio flujo de OAuth que es más robusto para localhost
      // y maneja Search Console + Analytics en un solo paso.
      window.location.href = '/api/auth/google'
    } catch (err: unknown) {
      setError('Error al iniciar el flujo de Google.')
      setGoogleLoading(false)
    }
  }

  // ── Email/Password Login ──────────────────────────────────────────────────
  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password)
      const user = result.user
      await syncSession(user.uid, user.email, user.displayName, user.photoURL)
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(firebaseError((err as any).code || '', (err as any).message))
    } finally {
      setLoading(false)
    }
  }

  // ── Registro ──────────────────────────────────────────────────────────────
  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (strength.score < 2) {
      setError('La contraseña es demasiado débil. Añade números o mayúsculas.')
      return
    }
    setLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const user = result.user
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() })
      }
      await syncSession(user.uid, user.email, name.trim() || user.displayName, user.photoURL)
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(firebaseError((err as any).code || '', (err as any).message))
    } finally {
      setLoading(false)
    }
  }

  // ── Recuperar contraseña ──────────────────────────────────────────────────
  async function handleForgot(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSuccess(`Enviamos un enlace de recuperación a ${email.trim()}. Revisa tu bandeja.`)
    } catch (err: unknown) {
      setError(firebaseError((err as any).code || '', (err as any).message))
    } finally {
      setLoading(false)
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  const inputClass = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 selection:bg-brand-500/20 font-sans relative overflow-hidden">
      {/* Glows de fondo limpios */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[20%] left-[10%] w-[600px] h-[600px] rounded-full blur-[120px] bg-brand-500/10" />
        <div className="absolute bottom-[-20%] right-[0%] w-[700px] h-[700px] rounded-full blur-[140px] bg-purple-500/10" />
      </div>

      <div className="relative w-full max-w-[420px] animate-slide-up z-10">

        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900">Cele</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {view === 'login' && 'Bienvenido de vuelta'}
            {view === 'register' && 'Crea tu cuenta gratis'}
            {view === 'forgot' && 'Recupera tu acceso'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 space-y-6">

          {/* ── Tabs LOGIN / REGISTER ── */}
          {view !== 'forgot' && (
           <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 border border-slate-200/60">
              {(['login', 'register'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => switchView(v)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    view === v
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {v === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>
          )}

          {/* ── GOOGLE BUTTON ── */}
          {view !== 'forgot' && (
            <button
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all shadow-sm hover:shadow text-sm"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94L5.84 14.1z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>{googleLoading ? 'Conectando...' : 'Continuar con Google'}</span>
            </button>
          )}

          {/* ── Divider ── */}
          {view !== 'forgot' && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-white px-3 text-slate-400 font-bold">o con correo</span>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
               LOGIN FORM
          ───────────────────────────────────────────────────────────────── */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    autoFocus
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`${inputClass} pl-10 pr-10`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end -mt-1">
                <button type="button" onClick={() => switchView('forgot')}
                  className="text-[11px] text-brand-500 hover:text-brand-600 transition-colors font-semibold">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/20 text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Entrando...</> : <><ArrowRight className="w-4 h-4 shrink-0" />Entrar al panel</>}
              </button>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────────
               REGISTER FORM
          ───────────────────────────────────────────────────────────────── */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Tu nombre (opcional)</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Juan García"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    autoFocus
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className={`${inputClass} pl-10 pr-10`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength meter */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className={`text-[10px] font-bold ${strength.score <= 1 ? 'text-red-500' : strength.score === 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    className={`${inputClass} pl-10 pr-10 ${confirmPassword && confirmPassword !== password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : confirmPassword && confirmPassword === password ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/10' : ''}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword === password && (
                  <p className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Las contraseñas coinciden
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading || !email || !password || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/20 text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Creando cuenta...</> : <><CheckCircle2 className="w-4 h-4 shrink-0" />Crear cuenta gratis</>}
              </button>

              <p className="text-center text-[10px] text-slate-500">
                Al registrarte aceptas los{' '}
                <span className="text-brand-500 hover:underline cursor-pointer">términos de uso</span>
              </p>
            </form>
          )}

          {/* ─────────────────────────────────────────────────────────────────
               FORGOT PASSWORD FORM
          ───────────────────────────────────────────────────────────────── */}
          {view === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="text-center space-y-1 pb-2">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-5 h-5 text-brand-500" />
                </div>
                <h2 className="text-slate-900 font-display font-bold text-base">Recuperar contraseña</h2>
                <p className="text-slate-500 text-xs">Te enviaremos un enlace para restablecerla.</p>
              </div>

              {success ? (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-emerald-700 text-sm">{success}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        autoFocus
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg disabled:opacity-50 shadow-md shadow-brand-500/20 text-sm">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Enviando...</> : <><Mail className="w-4 h-4 shrink-0" />Enviar enlace</>}
                  </button>
                </>
              )}

              <button type="button" onClick={() => switchView('login')}
                className="w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium py-1 mt-2">
                <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Rankerize Flow · Plataforma SEO Privada
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
