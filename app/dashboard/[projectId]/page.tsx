import dynamic from 'next/dynamic'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/auth'
import { getProjectById } from '@/lib/services/projects'
import DashboardLoader from '@/components/dashboard/DashboardLoader'

const DiagnosticHome = dynamic(
  () => import('@/components/dashboard/DiagnosticHome'),
  { ssr: false, loading: () => <DashboardLoader /> }
)

export default async function DashboardPage({
  params
}: {
  params: { projectId: string }
}) {
  const { projectId } = params
  const cookieStore = cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  const project = await getProjectById(projectId)

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Proyecto no encontrado</h1>
        <p className="text-slate-600">El proyecto que buscas no existe o no tienes acceso.</p>
      </div>
    )
  }

  const hasWordPress = !!(project.wpUrl)
  const hasAI = !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY)
  const hasGSC = !!(session.googleTokens?.access_token && project.gscSiteUrl)

  return (
    <DiagnosticHome
      projectId={projectId}
      projectName={project.name}
      projectDomain={project.domain}
      projectCountry={project.country}
      projectCms={project.cms}
      hasWordPress={hasWordPress}
      hasAI={hasAI}
      hasGSC={hasGSC}
    />
  )
}
