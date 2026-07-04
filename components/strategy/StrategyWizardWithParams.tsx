'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import StrategyWizard from '@/components/strategy/StrategyWizard'
import { ProjectContext } from '@/types/strategy'

/**
 * Thin wrapper that reads optional Viral Hunter query params
 * and passes them as initialData to StrategyWizard.
 *
 * Must be rendered inside <Suspense> because useSearchParams()
 * requires it in Next.js App Router.
 */
interface Props {
  projectContext?: ProjectContext
}

export default function StrategyWizardWithParams({ projectContext: initialProjectContext }: Props = {}) {
  const params = useSearchParams()
  const routeParams = useParams()
  const projectId = routeParams.projectId as string | undefined
  const [projectContext, setProjectContext] = useState<ProjectContext | undefined>(initialProjectContext)

  const keyword = params.get('keyword') ?? ''
  const titulo  = params.get('titulo')  ?? ''
  const nicho   = params.get('nicho')   ?? ''
  const pais    = params.get('pais')    ?? ''

  useEffect(() => {
    if (projectContext || !projectId) return

    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`)
        const json = await res.json()
        if (!res.ok || !json.success || !active) return
        setProjectContext(json.data)
      } catch {
        // Silencioso: si no podemos leer el proyecto, seguimos con el formulario manual.
      }
    })()

    return () => {
      active = false
    }
  }, [projectContext, projectId])

  const hasPreFill = !!(keyword || titulo || nicho || pais)

  return (
    <StrategyWizard
      initialData={
        hasPreFill
          ? {
              keyword: keyword || titulo,   // Use idea as keyword hint if no explicit keyword
              niche:   nicho || undefined,
              country: pais  || projectContext?.country || undefined,
            }
          : undefined
      }
      projectContext={projectContext}
    />
  )
}
