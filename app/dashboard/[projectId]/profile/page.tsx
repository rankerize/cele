'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { updateProfile, updatePassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { User, Shield, CreditCard, LogOut, Key, AlertCircle, RefreshCw, Layers } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState(auth.currentUser)
  const [loading, setLoading] = useState(true)
  
  // Credits State
  const [credits, setCredits] = useState<number | null>(null)
  const [wordsGenerated, setWordsGenerated] = useState<number>(0)
  
  // Form States
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI States
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setDisplayName(currentUser.displayName || '')
        
        // Fetch credits
        try {
          const creditsDoc = await getDoc(doc(db, 'users', currentUser.uid, 'credits', 'balance'))
          if (creditsDoc.exists()) {
            const data = creditsDoc.data()
            setCredits(data.balance ?? 0)
            setWordsGenerated(data.wordsGenerated ?? 0)
          } else {
            setCredits(0) // Default if doesn't exist
          }
        } catch (error) {
          console.error("Error fetching credits:", error)
          setCredits(0)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    setMessage(null)

    try {
      await updateProfile(user, { displayName })
      
      // Update in Firestore as well for consistency
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, { displayName })

      setMessage({ text: 'Perfil actualizado exitosamente', type: 'success' })
    } catch (error: any) {
      setMessage({ text: error.message || 'Error al actualizar el perfil', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Las contraseñas no coinciden', type: 'error' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'La contraseña debe tener al menos 6 caracteres', type: 'error' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await updatePassword(user, newPassword)
      setMessage({ text: 'Contraseña actualizada correctamente', type: 'success' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      // Handle requirement to re-authenticate
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ text: 'Por seguridad, debes cerrar sesión y volver a entrar para cambiar tu contraseña.', type: 'error' })
      } else {
        setMessage({ text: error.message || 'Error al actualizar contraseña', type: 'error' })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      // Redirect happens in layout/guard automatically
    } catch (error) {
      console.error("Error al cerrar sesión", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400 shadow-lg shadow-brand-500/10">
            <User className="w-6 h-6" />
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-white uppercase">
            Perfil de Usuario
          </h1>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
          Gestiona tu información personal, seguridad de cuenta y revisa el estado de tu plan y uso de créditos.
        </p>
      </header>

      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Shield className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column (Plan & Credits) */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col items-center justify-center text-center">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'U')}&background=0D8ABC&color=fff&size=128`}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-slate-200 shadow-xl mb-4"
              />
              <h2 className="font-display text-xl font-bold text-white tracking-tight">{user.displayName || 'Usuario'}</h2>
              <p className="text-sm text-slate-500 truncate w-full">{user.email}</p>
              
              <div className="mt-4 px-3 py-1 bg-gradient-to-r from-brand-500/20 to-purple-500/20 border border-brand-500/30 rounded-full inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 uppercase tracking-widest">
                <CreditCard className="w-3 h-3" /> Plan Pro
              </div>
            </div>
            
            <div className="p-6 bg-white/50 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5 text-sm">
                  <span className="text-slate-600">Créditos Disponibles</span>
                  <span className="font-bold text-white">{credits !== null ? credits.toLocaleString() : '...'}</span>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-500 to-indigo-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5 text-sm">
                  <span className="text-slate-600">Palabras Generadas</span>
                  <span className="font-bold text-white">{wordsGenerated.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={async () => {
                  const btn = document.getElementById('btn-extra') as HTMLButtonElement
                  if(btn) { btn.disabled = true; btn.innerHTML = 'Conectando...' }
                  try {
                    const res = await fetch('/api/payments/checkout-extra', { method: 'POST' })
                    const data = await res.json()
                    if (data.init_point) window.location.href = data.init_point
                    else alert(data.error || 'Error al generar compra extra')
                  } catch(e) {
                    alert('Error de conexión')
                  } finally {
                    if (btn) { btn.disabled = false; btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers w-4 h-4"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg> Recargar Créditos Extra' }
                  }
                }}
                id="btn-extra"
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                <Layers className="w-4 h-4" /> Recargar Créditos Extra
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Forms) */}
        <div className="md:col-span-2 space-y-8">
          {/* Datos Personales */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-brand-400" />
              <h2 className="font-display text-xl font-bold text-white tracking-tight">Información Personal</h2>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nombre de Visualización</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/50 border border-slate-200 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Correo Electrónico</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full bg-white/30 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-500">El correo electrónico no puede ser modificado aquí.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-100 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </section>

          {/* Seguridad */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-5 h-5 text-emerald-400" />
              <h2 className="font-display text-xl font-bold text-white tracking-tight">Seguridad</h2>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/50 border border-slate-200 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/50 border border-slate-200 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="Repite la contraseña"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving || !newPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cambiar Contraseña
                </button>
              </div>
            </form>
          </section>

          {/* Zona de Peligro / Sesión */}
          <section className="bg-red-500/5 border border-red-500/10 rounded-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-white font-bold mb-1">Cerrar Sesión</h3>
                <p className="text-sm text-slate-600">Desconecta tu sesión actual de Rankerize Hub en este dispositivo.</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
