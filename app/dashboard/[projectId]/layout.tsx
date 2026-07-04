import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'
import PageTransition from '@/components/ui/PageTransition'
import DashboardCacheWrapper from '@/components/layout/DashboardCacheWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth guard server-side con iron-session v8
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    redirect('/login')
  }

  return (
    <DashboardCacheWrapper>
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="max-w-5xl mx-auto p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </DashboardCacheWrapper>
  )
}
