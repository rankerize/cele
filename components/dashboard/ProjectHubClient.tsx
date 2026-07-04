'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Globe, ArrowRight, Sparkles, Search, FileText, Link2 } from 'lucide-react'
import { Project } from '@/lib/services/projects'

interface Props {
  projects: Project[]
  userId: string
}

export default function ProjectHubClient({ projects, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSelectProject = (projectId: string) => {
    setLoading(projectId)
    router.push(`/dashboard/${projectId}`)
  }

  const handleCreateProject = () => {
    // Navigate to a project creation page, or show a modal.
    // For now we could just have a generic create page or modal
    router.push('/dashboard/create-project')
  }

  return (
    <div className="max-w-6xl mx-auto p-8 pt-10">
      <div className="mb-10 rounded-[32px] border border-slate-900/8 bg-white p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
          <Sparkles className="h-3.5 w-3.5" />
          Copiloto SEO
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Tus workspaces SEO</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Selecciona un proyecto para entrar al diagnóstico, generar contenido o revisar oportunidades de enlazado interno.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-900/8 bg-white p-5 shadow-sm">
          <Search className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm font-black text-slate-950">Diagnóstico</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Detecta canibalizaciones, quick wins y problemas de arquitectura.</p>
        </div>
        <div className="rounded-3xl border border-slate-900/8 bg-white p-5 shadow-sm">
          <FileText className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm font-black text-slate-950">Contenido</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Briefs, borradores y publicación orientados a intención de búsqueda.</p>
        </div>
        <div className="rounded-3xl border border-slate-900/8 bg-white p-5 shadow-sm">
          <Link2 className="h-5 w-5 text-emerald-700" />
          <p className="mt-4 text-sm font-black text-slate-950">Interlinking</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Prioriza enlaces internos que fortalecen clusters y categorías.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Create Project Card */}
        <button
          onClick={handleCreateProject}
          className="flex min-h-[240px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-slate-500 transition-all group hover:border-emerald-500/60 hover:bg-emerald-50/60 hover:text-emerald-700"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white group-hover:bg-emerald-100 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-black">Añadir sitio web</span>
          <span className="mt-2 text-center text-sm text-slate-500">Crea un workspace SEO con dominio, país y CMS.</span>
        </button>

        {/* Existing Projects */}
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => handleSelectProject(project.id)}
            className="flex min-h-[240px] cursor-pointer flex-col rounded-[28px] border border-slate-900/8 bg-white p-6 shadow-sm transition-all group hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 to-emerald-700 text-white shadow-inner">
              <Globe className="w-6 h-6" />
            </div>
            
            <h3 className="mb-1 line-clamp-1 text-lg font-black text-slate-950">{project.name}</h3>
            <p className="mb-2 line-clamp-1 text-sm text-slate-500">{project.domain}</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {project.country && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {project.country}
                </span>
              )}
              {project.cms && (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  {project.cms}
                </span>
              )}
              {project.primaryGoal && (
                <span className="rounded-full bg-slate-900/5 px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {project.primaryGoal}
                </span>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                {/* Integration status indicators */}
                <div 
                  className={`w-2 h-2 rounded-full ${project.gscSiteUrl ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  title={project.gscSiteUrl ? 'Search Console Conectado' : 'Falta Search Console'}
                />
                <div 
                  className={`w-2 h-2 rounded-full ${project.wpUrl ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  title={project.wpUrl ? 'WordPress Conectado' : 'Falta WordPress'}
                />
              </div>
              
              <div className="flex items-center text-xs font-black text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
                {loading === project.id ? 'Entrando...' : 'Entrar'}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
