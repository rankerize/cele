import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getUserProjects } from '@/lib/services/projects'
import ProjectHubClient from '@/components/dashboard/ProjectHubClient'

export default async function ProjectsHubPage() {
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  const userId = session.user?.uid

  if (!session.isLoggedIn || !userId) {
    redirect('/login')
  }

  // Fetch user projects
  const projects = await getUserProjects(userId)

  return <ProjectHubClient projects={projects} userId={userId} />
}
