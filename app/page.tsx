import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/auth'
import LandingPage from '@/components/landing/LandingPage'

export default async function HomePage() {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  return <LandingPage isLoggedIn={Boolean(session.isLoggedIn)} />
}
