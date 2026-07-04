import { Metadata } from 'next'
import AdminPanel from '@/components/admin/AdminPanel'

export const metadata: Metadata = {
  title: 'Admin Panel · Rankerize',
  description: 'Panel de control exclusivo del administrador maestro.',
  robots: 'noindex, nofollow',
}

export default function AdminPage() {
  return <AdminPanel />
}
