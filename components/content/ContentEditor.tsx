'use client'

import { useState, useEffect } from 'react'
import { GeneratedContent, EditedContent, InternalLinkSuggestion } from '@/types/content'
import { Eye, Code2, Send, ArrowLeft, Tag, RefreshCw, Link as LinkIcon, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import InternalLinkSuggestions from './InternalLinkSuggestions'

interface Props {
  generatedContent: GeneratedContent
  onPublish: (edited: EditedContent) => Promise<void>
  onBack: () => void
  loading: boolean
}

type ViewMode = 'edit' | 'preview'

export default function ContentEditor({ generatedContent, onPublish, onBack, loading }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('edit')
  const [edited, setEdited] = useState<EditedContent>({
    title: generatedContent.titleSEO,
    slug: generatedContent.slugSugerido,
    metaDescription: generatedContent.metaDescription,
    categoria: generatedContent.categoriaSugerida,
    content: generatedContent.borrador,
    faqs: generatedContent.preguntasFrecuentes,
    excerpt: '',
    fuentes: generatedContent.fuentes || [],
    status: 'draft',
  })

  // Estados para enlazado interno
  const [linkingSuggestions, setLinkingSuggestions] = useState<InternalLinkSuggestion[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [appliedUrls, setAppliedUrls] = useState<string[]>([])
  const [showLinkingPanel, setShowLinkingPanel] = useState(false)

  // Actualizar FAQs
  function updateFaq(index: number, field: 'pregunta' | 'respuesta', value: string) {
    setEdited((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)),
    }))
  }

  function update<K extends keyof EditedContent>(key: K, value: EditedContent[K]) {
    setEdited((prev) => ({ ...prev, [key]: value }))
  }

  function updateFuente(index: number, value: string) {
    setEdited((prev) => ({
      ...prev,
      fuentes: prev.fuentes.map((f, i) => (i === index ? value : f)),
    }))
  }

  function addFuente() {
    setEdited((prev) => ({
      ...prev,
      fuentes: [...prev.fuentes, ''],
    }))
  }

  function removeFuente(index: number) {
    setEdited((prev) => ({
      ...prev,
      fuentes: prev.fuentes.filter((_, i) => i !== index),
    }))
  }

  async function handleAnalyzeLinks() {
    setLoadingLinks(true)
    setShowLinkingPanel(true)
    try {
      const res = await fetch('/api/editorial/suggest-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: edited.content })
      })
      const json = await res.json()
      if (json.success) {
        setLinkingSuggestions(json.data)
      }
    } catch (err) {
      console.error('Error al analizar enlaces:', err)
    } finally {
      setLoadingLinks(false)
    }
  }

  function applyLink(suggestion: InternalLinkSuggestion) {
    // Escapar caracteres especiales para el regex
    const escapedAnchor = suggestion.anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Regex para encontrar la primera coincidencia exacta (no sensible a mayúsculas si se prefiere)
    const regex = new RegExp(`(${escapedAnchor})`, 'i')
    
    // Crear el tag de enlace
    const linkedText = `<a href="${suggestion.suggestedUrl}" title="${suggestion.postTitle}">${suggestion.anchorText}</a>`
    
    // Reemplazar la primera ocurrencia que no esté ya dentro de un tag <a>
    // Una simplificación: reemplazamos la primera
    const newContent = edited.content.replace(regex, linkedText)
    
    update('content', newContent)
    setAppliedUrls(prev => [...prev, suggestion.suggestedUrl])
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Resumen generado */}
      <div className="card border-brand-500/20 bg-brand-950/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-green">Contenido generado</span>
              <span className="badge-blue">{generatedContent.keywordsSecundarias.length} keywords secundarias</span>
            </div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Intención refinada</p>
            <p className="text-sm text-slate-700 leading-relaxed">{generatedContent.intencionRefinada}</p>
          </div>
          <div className="min-w-[200px]">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Keywords secundarias</p>
            <div className="flex flex-wrap gap-1.5">
              {generatedContent.keywordsSecundarias.slice(0, 6).map((kw) => (
                <span key={kw} className="badge-gray text-xs">{kw}</span>
              ))}
              {generatedContent.keywordsSecundarias.length > 6 && (
                <span className="badge-gray text-xs">+{generatedContent.keywordsSecundarias.length - 6}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: metadatos */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-display text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-400" />
              Metadatos SEO
            </h3>
            <div className="space-y-3">
              <div className="form-group">
                <label htmlFor="ed-title">Título SEO</label>
                <input
                  id="ed-title"
                  value={edited.title}
                  onChange={(e) => update('title', e.target.value)}
                />
                <p className="text-xs text-slate-600 mt-1">{edited.title.length}/60 caracteres</p>
              </div>
              <div className="form-group">
                <label htmlFor="ed-slug">Slug URL</label>
                <input
                  id="ed-slug"
                  value={edited.slug}
                  onChange={(e) => update('slug', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="ed-meta">Meta descripción</label>
                <textarea
                  id="ed-meta"
                  rows={3}
                  value={edited.metaDescription}
                  onChange={(e) => update('metaDescription', e.target.value)}
                  className="resize-none text-xs"
                />
                <p className="text-xs text-slate-600 mt-1">{edited.metaDescription.length}/155 caracteres</p>
              </div>
              <div className="form-group">
                <label htmlFor="ed-excerpt">Excerpt (opcional)</label>
                <textarea
                  id="ed-excerpt"
                  rows={2}
                  value={edited.excerpt}
                  onChange={(e) => update('excerpt', e.target.value)}
                  placeholder="Resumen corto del artículo..."
                  className="resize-none text-xs"
                />
              </div>
            </div>
          </div>

          {/* Categoría */}
          <div className="card">
            <h3 className="font-display text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-400" />
              Categoría WordPress
            </h3>
            <div className="form-group">
              <label htmlFor="ed-cat">Categoría asignada</label>
              <input
                id="ed-cat"
                value={edited.categoria}
                onChange={(e) => update('categoria', e.target.value)}
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
              <p className="text-xs text-amber-400/80 leading-relaxed">
                Si esta categoría no existe en WordPress, se creará automáticamente al publicar.
              </p>
            </div>
          </div>

          {/* Fuentes */}
          <div className="card">
            <h3 className="font-display text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              Fuentes Bibliográficas
            </h3>
            <div className="space-y-2">
              {edited.fuentes.map((fuente, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={fuente}
                    onChange={(e) => updateFuente(i, e.target.value)}
                    placeholder="URL o nombre de la fuente"
                    className="text-xs flex-1"
                  />
                  <button 
                    onClick={() => removeFuente(i)}
                    className="text-red-500 hover:text-red-400 p-1 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                onClick={addFuente}
                className="text-[10px] text-brand-400 hover:text-brand-300 font-bold uppercase tracking-wider mt-2"
              >
                + Añadir Fuente
              </button>
            </div>
          </div>

          {/* Estructura */}
          <div className="card">
            <h3 className="font-display text-sm font-semibold text-white mb-3">Estructura de headings</h3>
            <div className="space-y-1.5">
              <div className="text-xs p-2 bg-white rounded-lg">
                <span className="text-slate-500 mr-2">H1</span>
                <span className="text-slate-800">{generatedContent.estructuraH1}</span>
              </div>
              {generatedContent.estructuraH2.slice(0, 3).map((h2, i) => (
                <div key={i} className="text-xs p-2 bg-white rounded-lg pl-5">
                  <span className="text-slate-600 mr-2">H2</span>
                  <span className="text-slate-700">{h2}</span>
                </div>
              ))}
              {generatedContent.estructuraH2.length > 3 && (
                <p className="text-xs text-slate-600 pl-2">+{generatedContent.estructuraH2.length - 3} más...</p>
              )}
            </div>
          </div>

          {/* Enlazado Interno Panel */}
          <div className="card border-brand-500/30 bg-brand-500/5">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  Optimización SEO
                </h3>
             </div>
             
             {!showLinkingPanel ? (
               <button 
                 onClick={handleAnalyzeLinks}
                 className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-2 bg-brand-600/10 border-brand-500/20 text-brand-400 hover:bg-brand-600/20"
               >
                 <LinkIcon className="w-3.5 h-3.5" />
                 Sugerir Enlaces Internos
               </button>
             ) : (
               <InternalLinkSuggestions 
                 suggestions={linkingSuggestions}
                 loading={loadingLinks}
                 onApply={applyLink}
                 appliedUrls={appliedUrls}
               />
             )}
          </div>
        </div>

        {/* Columna derecha: contenido */}
        <div className="lg:col-span-2 space-y-4">
          {/* Toggle vista */}
          <div className="flex items-center gap-2 p-1 bg-white rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'edit'
                  ? 'bg-slate-50 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              Editar HTML
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'preview'
                  ? 'bg-slate-50 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              Vista previa
            </button>
          </div>

          <div className="card">
            {viewMode === 'edit' ? (
              <div className="content-editor">
                <label htmlFor="ed-content" className="text-slate-600 text-xs uppercase tracking-wider font-semibold mb-3 block">
                  Contenido HTML
                </label>
                <textarea
                  id="ed-content"
                  value={edited.content}
                  onChange={(e) => update('content', e.target.value)}
                  className="font-mono text-xs leading-relaxed min-h-[400px] resize-y"
                />
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">Vista previa</p>
                <div
                  className="html-preview"
                  dangerouslySetInnerHTML={{ __html: edited.content }}
                />
              </div>
            )}
          </div>

          {/* FAQs */}
          <div className="card">
            <h3 className="font-display text-sm font-semibold text-white mb-4">
              Preguntas frecuentes ({edited.faqs.length})
            </h3>
            <div className="space-y-3">
              {edited.faqs.map((faq, i) => (
                <div key={i} className="p-3 bg-white rounded-lg space-y-2">
                  <div className="form-group mb-0">
                    <label className="text-slate-600 text-xs">Pregunta {i + 1}</label>
                    <input
                      value={faq.pregunta}
                      onChange={(e) => updateFaq(i, 'pregunta', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="text-slate-600 text-xs">Respuesta</label>
                    <textarea
                      value={faq.respuesta}
                      onChange={(e) => updateFaq(i, 'respuesta', e.target.value)}
                      rows={2}
                      className="resize-none text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-5 bg-white/60 border border-slate-200 rounded-xl">
        <button type="button" onClick={onBack} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Volver al chat
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-medium tracking-wider uppercase">Estado</label>
            <select
              value={edited.status || 'draft'}
              onChange={(e) => update('status', e.target.value as 'draft' | 'publish' | 'pending')}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
            >
              <option value="draft">Borrador (Draft)</option>
              <option value="pending">Revisión (Pending)</option>
              <option value="publish">Publicar (Publish)</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => onPublish(edited)}
            disabled={loading}
            className="btn-primary px-6 py-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Guardar en WordPress
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
