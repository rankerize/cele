'use client'

import { useState, useEffect } from 'react'
import { AdminUser } from '@/app/api/admin/users/route'
import { 
  ShieldCheck, Users, Globe, Coins, RefreshCw, 
  Crown, User, Clock, Loader2, AlertTriangle, 
  CheckCircle2, XCircle, BarChart3, Search
} from 'lucide-react'

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setUsers(data.users ?? [])
      setLastRefresh(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName.toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const totalCredits = users.reduce((s, u) => s + (u.credits ?? 0), 0)
  const wpConnected  = users.filter(u => u.wpConnected).length
  const adminsCount  = users.filter(u => u.role === 'admin').length

  return (
    <div style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ padding: '8px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '12px' }}>
              <ShieldCheck style={{ width: '22px', height: '22px', color: '#a78bfa' }} />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f1f1', margin: 0 }}>
              Admin Panel
            </h1>
            <span style={{ padding: '3px 10px', background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: '#ff6b81', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PRIVADO
            </span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            Vista exclusiva del Administrador Maestro · cesar.jimenez@rankerize.com
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {lastRefresh && (
            <span style={{ fontSize: '12px', color: '#4b5563' }}>
              Actualizado: {lastRefresh.toLocaleTimeString('es-ES')}
            </span>
          )}
          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', color: '#9ca3af',
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', ...(loading ? { animation: 'spin 1s linear infinite' } : {}) }} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        {[
          { icon: Users, label: 'Total Usuarios', value: users.length, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
          { icon: Crown, label: 'Administradores', value: adminsCount, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
          { icon: Coins, label: 'Créditos Totales', value: totalCredits, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
          { icon: Globe, label: 'WP Conectados', value: wpConnected, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px', padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ padding: '6px', background: bg, borderRadius: '8px' }}>
                <Icon style={{ width: '16px', height: '16px', color }} />
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: '#f1f1f1', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#4b5563' }} />
        <input
          type="text"
          placeholder="Buscar por email o nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px 10px 40px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', color: '#f1f1f1', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '16px', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)', borderRadius: '12px', color: '#ff6b81', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          <Loader2 style={{ width: '32px', height: '32px', margin: '0 auto 12px', color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
          <p>Cargando usuarios de Firestore...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Tabla de usuarios */}
      {!loading && !error && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Header de tabla */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 80px 80px 100px 120px',
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            gap: '12px',
          }}>
            {['Usuario', 'Rol', 'Créditos', 'WordPress', 'Registro', 'UID'].map(h => (
              <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {/* Filas */}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#4b5563' }}>
              {search ? 'No se encontraron usuarios con ese filtro.' : 'No hay usuarios registrados aún.'}
            </div>
          )}

          {filtered.map((user, i) => (
            <div
              key={user.uid}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 80px 80px 100px 120px',
                padding: '14px 20px',
                gap: '12px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center',
                background: user.role === 'admin' ? 'rgba(167,139,250,0.04)' : 'transparent',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = user.role === 'admin' ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = user.role === 'admin' ? 'rgba(167,139,250,0.04)' : 'transparent'}
            >
              {/* Usuario */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: user.role === 'admin' ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: user.role === 'admin' ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.1)',
                }}>
                  {user.role === 'admin'
                    ? <Crown style={{ width: '16px', height: '16px', color: '#a78bfa' }} />
                    : <User style={{ width: '15px', height: '15px', color: '#6b7280' }} />
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f1f1f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                </div>
              </div>

              {/* Rol */}
              <span style={{
                padding: '3px 10px',
                background: user.role === 'admin' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${user.role === 'admin' ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                color: user.role === 'admin' ? '#a78bfa' : '#6b7280',
                textTransform: 'uppercase' as const, width: 'fit-content',
              }}>
                {user.role === 'admin' ? '👑 Admin' : 'User'}
              </span>

              {/* Créditos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 style={{ width: '14px', height: '14px', color: '#34d399', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f1f1' }}>{user.credits ?? 0}</span>
              </div>

              {/* WordPress */}
              <div>
                {user.wpConnected
                  ? <CheckCircle2 style={{ width: '18px', height: '18px', color: '#34d399' }} />
                  : <XCircle style={{ width: '18px', height: '18px', color: '#374151' }} />
                }
              </div>

              {/* Fecha registro */}
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {user.createdAt !== '—'
                  ? new Date(user.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
                  : '—'
                }
              </span>

              {/* UID */}
              <span style={{ fontSize: '11px', color: '#374151', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.uid}>
                {user.uid.slice(0, 12)}…
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '12px', color: '#374151', margin: 0 }}>
          Mostrando {filtered.length} de {users.length} usuarios
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151' }}>
          <ShieldCheck style={{ width: '14px', height: '14px', color: '#34d399' }} />
          Acceso cifrado · Solo Admin Maestro
        </div>
      </div>
    </div>
  )
}
