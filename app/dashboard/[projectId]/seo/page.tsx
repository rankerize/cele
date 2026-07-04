'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { LineChart, Globe, AlertTriangle, Lightbulb, Link as LinkIcon, Loader2, RefreshCw, Download, TrendingUp, TrendingDown, Target, Calendar, FileText, PenLine, Clock } from 'lucide-react'
import { GscSite, GscKeywordOpportunity, GscCannibalizationRisk, SeoAuditPlan } from '@/types/gsc'

const MONTH_NAMES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface ActivityItem {
  id: string
  title: string
  date: string
  type: 'created' | 'improved' | 'wp_modified'
  url?: string
  keyword?: string
}

export default function SeoDashboardPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [sites, setSites] = useState<GscSite[]>([])
  const [selectedSite, setSelectedSite] = useState('')
  const [loadingSites, setLoadingSites] = useState(true)
  
  const [loadingData, setLoadingData] = useState(false)
  const [opportunities, setOpportunities] = useState<GscKeywordOpportunity[]>([])
  const [cannibalizations, setCannibalizations] = useState<GscCannibalizationRisk[]>([])
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  
  const [activeTab, setActiveTab] = useState<'keywords' | 'opportunities' | 'cannibalizations' | 'plan'>('keywords')
  const [error, setError] = useState('')

  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [auditPlan, setAuditPlan] = useState<SeoAuditPlan | null>(null)
  const planRef = useRef<HTMLDivElement>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [monthlyStats, setMonthlyStats] = useState({ created: 0, internalLinks: 0, improved: 0 })
  const [globalPerformance, setGlobalPerformance] = useState<any>(null)
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([])
  const [reportPeriod, setReportPeriod] = useState({ monthName: '', year: 0, startDate: '', endDate: '' })
  const [selectedReportMonth, setSelectedReportMonth] = useState(() => {
    const now = new Date()
    // Default to previous month if we're in the first 5 days
    if (now.getDate() <= 5) {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2,'0')}`
    }
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}`
  })

  useEffect(() => {
    fetchSites()
    fetchHistoryStats(selectedReportMonth)
  }, [])

  useEffect(() => {
    fetchHistoryStats(selectedReportMonth)
  }, [selectedReportMonth])

  const fetchHistoryStats = async (monthStr: string) => {
    try {
      const [yearS, monthS] = monthStr.split('-')
      const year = parseInt(yearS)
      const month = parseInt(monthS) - 1 // 0-indexed
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0, 23, 59, 59)

      setReportPeriod({
        monthName: MONTH_NAMES_ES[month],
        year,
        startDate: startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
        endDate: endDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
      })

      const activity: ActivityItem[] = []

      // 1. Pull from our history (created & improved items)
      const res = await fetch('/api/history')
      const json = await res.json()
      if (json.success && json.data) {
        const periodItems = json.data.filter((item: any) => {
          const d = new Date(item.createdAt)
          return d >= startDate && d <= endDate
        })
        const createdCount = periodItems.filter((i: any) => i.type === 'creation' || i.type === 'batch').length
        const improvedCount = periodItems.filter((i: any) => i.type === 'improvement').length
        const internalLinksCount = (createdCount * 2) + (improvedCount * 3)
        setMonthlyStats({ created: createdCount, internalLinks: internalLinksCount, improved: improvedCount })

        periodItems.forEach((item: any) => {
          if (item.type === 'creation' || item.type === 'batch') {
            activity.push({
              id: item.id,
              title: item.generatedContent?.titleSEO || item.editedContent?.title || 'Sin título',
              date: item.createdAt,
              type: 'created',
              url: item.wordpressPostUrl,
              keyword: item.formData?.keywordPrincipal,
            })
          } else if (item.type === 'improvement') {
            activity.push({
              id: item.id,
              title: item.improvementData?.improvedTitle || 'Artículo mejorado',
              date: item.createdAt,
              type: 'improved',
              url: item.wordpressPostUrl,
            })
          }
        })
      }

      // 2. Pull from WordPress posts modified in that period
      try {
        const afterStr = startDate.toISOString()
        const beforeStr = endDate.toISOString()
        const wpRes = await fetch(`/api/wordpress/posts?per_page=100&modified_after=${afterStr}&modified_before=${beforeStr}`)
        const wpJson = await wpRes.json()
        if (wpJson.success && wpJson.data?.posts) {
          wpJson.data.posts.forEach((post: any) => {
            const modDate = new Date(post.modified || post.date)
            if (modDate >= startDate && modDate <= endDate) {
              // Only add if not already tracked via our tool
              const alreadyTracked = activity.some(a => a.url === post.link)
              if (!alreadyTracked) {
                activity.push({
                  id: `wp-${post.id}`,
                  title: post.title?.rendered || 'Sin título',
                  date: post.modified || post.date,
                  type: 'wp_modified',
                  url: post.link,
                })
              }
            }
          })
        }
      } catch (wpErr) {
        console.warn('WP posts fetch skipped:', wpErr)
      }

      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setActivityItems(activity)
    } catch (err) {
      console.error('Error fetching history stats', err)
    }
  }

  const handleDownloadPDF = async () => {
    if (!planRef.current) return
    setDownloadingPdf(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(planRef.current, {
        scale: 2,
        backgroundColor: '#ffffff', // Matches light mode surface background
        useCORS: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      // If height > max page height, we could split, but a single long page is better for digital viewing.
      // However, jsPDF default doesn't allow 'long' arbitrary dimensions in generic mode, but we can set custom size.
      const customPdf = new jsPDF({
         orientation: 'portrait',
         unit: 'mm',
         format: [pdfWidth, pdfHeight]
      })

      customPdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      customPdf.save(`Plan_SEO_${selectedSite.replace(/^https?:\/\//, '').replace(/\/$/, '')}.pdf`)
    } catch (err) {
      console.error(err)
      setError('Error al generar el PDF. Revisa la consola.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/gsc/sites')
      const json = await res.json()
      
      if (!res.ok) {
         if (res.status === 401) {
            setLoadingSites(false)
            return
         }
         throw new Error(json.error || 'Error fetching sites')
      }

      setSites(json.data)
      if (json.currentSiteUrl) {
         setSelectedSite(json.currentSiteUrl)
         fetchAnalyzeData(json.currentSiteUrl)
      } else if (json.data.length > 0) {
         handleSiteSelect(json.data[0].siteUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoadingSites(false)
    }
  }

  const handleSiteSelect = async (url: string) => {
     setSelectedSite(url)
     try {
       await fetch('/api/gsc/sites', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ siteUrl: url })
       })
       fetchAnalyzeData(url)
     } catch (err) {
       console.error(err)
     }
  }

  const fetchAnalyzeData = async (siteUrl: string) => {
     setLoadingData(true)
     setError('')
     try {
       const res = await fetch(`/api/gsc/analyze?projectId=${encodeURIComponent(projectId)}`)
       const json = await res.json()
       if (!json.success) throw new Error(json.error)

       setOpportunities(json.data.opportunities)
       setCannibalizations(json.data.cannibalizations)
       setDateRange(json.data.dateRange)
       if (json.data.performance) setGlobalPerformance(json.data.performance)
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Error al analizar datos')
     } finally {
       setLoadingData(false)
     }
  }

  const handleGoogleConnect = () => {
    window.location.href = '/api/auth/google'
  }

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true)
    setError('')
    try {
      const kws = opportunities.filter(o => o.type === 'ok')
      const sortedKeywords = [...kws].sort((a,b) => b.clicks - a.clicks).slice(0, 10)
      const totalClicks = kws.reduce((acc, kw) => acc + kw.clicks, 0)
      const oppsCount = opportunities.filter(o => o.type !== 'ok' && o.type !== 'canibalization_risk').length
      
      const payload = {
        siteUrl: selectedSite,
        metrics: {
          totalClicks,
          topKeywords: sortedKeywords.map(k => ({ query: k.query, clicks: k.clicks, position: k.position })),
          cannibalizationCount: cannibalizations.length,
          opportunitiesCount: oppsCount
        }
      }

      const res = await fetch('/api/gsc/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      setAuditPlan(json.plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el plan')
    } finally {
      setGeneratingPlan(false)
    }
  }

  if (loadingSites) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div className="card text-center p-12 max-w-lg mx-auto mt-10 space-y-6 animate-fade-in shadow-2xl border-slate-200">
         <div className="w-20 h-20 bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-brand-500/20 shadow-xl shadow-brand-500/10">
            <Globe className="w-10 h-10 text-brand-400" />
         </div>
         <div className="space-y-2">
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight">Activar SEO Estratégico</h2>
            <p className="text-sm text-slate-600 leading-relaxed px-4">
              Para analizar Search Console necesitas vincular tu cuenta de Google en la sección de integraciones.
            </p>
         </div>
         <button 
           onClick={() => window.location.href = '/dashboard/settings'} 
           className="btn-primary bg-brand-600 hover:bg-brand-500 flex items-center justify-center gap-2 mx-auto mt-4 px-8 py-3.5 shadow-xl shadow-brand-600/20 transition-all font-bold uppercase tracking-widest text-xs"
         >
           Ir a Integraciones
         </button>
      </div>
    )
  }

  const activeKeywords = opportunities.filter(o => o.type === 'ok')
  const specificOops = opportunities.filter(o => o.type !== 'ok' && o.type !== 'canibalization_risk')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <LineChart className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">SEO Estratégico</h1>
            <p className="text-sm text-slate-500">
              {dateRange.startDate ? `Datos de GSC del ${dateRange.startDate} al ${dateRange.endDate}` : 'Analiza Search Console vs WordPress'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
             <Globe className="w-4 h-4 text-brand-400 shrink-0" />
             <span className="text-sm text-slate-700 max-w-[220px] truncate" title={selectedSite}>
               {selectedSite}
             </span>
           </div>
           <button onClick={() => fetchAnalyzeData(selectedSite)} className="btn-secondary px-3" title="Refrescar datos">
             <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
           {error}
        </div>
      )}

      {loadingData ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-slate-600 animate-pulse">Cruzando datos de Google y WordPress...</p>
        </div>
      ) : (
        <div className="space-y-6">
           {globalPerformance && (
             <div className="bg-white/50 border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden mb-8">
               <div className="flex flex-col md:flex-row gap-8">
                 {/* YoY Clicks Comparison */}
                 <div className="flex-1 border-r border-slate-200/60 pr-8">
                   <h3 className="font-display text-[10px] text-slate-500 uppercase tracking-widest font-black mb-4">Rendimiento YTD (Comparativa Anual)</h3>
                   <div className="flex items-end gap-3 mb-2">
                     <span className="text-4xl font-black text-white">{globalPerformance.currentYtd.clicks.toLocaleString()}</span>
                     <span className="text-sm text-slate-600 mb-1">clics</span>
                   </div>
                   {globalPerformance.previousYtd && (
                     <div className="flex items-center gap-2 text-sm mt-3">
                       {globalPerformance.currentYtd.clicks > globalPerformance.previousYtd.clicks ? (
                         <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                           <TrendingUp className="w-3 h-3" /> 
                           +{Math.round(((globalPerformance.currentYtd.clicks - globalPerformance.previousYtd.clicks) / (globalPerformance.previousYtd.clicks || 1)) * 100)}%
                         </span>
                       ) : (
                         <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-bold">
                           <TrendingDown className="w-3 h-3" /> 
                           {Math.round(((globalPerformance.currentYtd.clicks - globalPerformance.previousYtd.clicks) / (globalPerformance.previousYtd.clicks || 1)) * 100)}%
                         </span>
                       )}
                       <span className="text-slate-500 text-xs">vs {globalPerformance.previousYtd.clicks.toLocaleString()} del año pasado</span>
                     </div>
                   )}
                 </div>

                 {/* Position Buckets */}
                 <div className="flex-[1.5] border-r border-slate-200/60 pr-8">
                   <h3 className="font-display text-[10px] text-slate-500 uppercase tracking-widest font-black mb-4 flex items-center gap-2"><Target className="w-3 h-3"/> Distribución Top 20</h3>
                   <div className="grid grid-cols-4 gap-2">
                     <div className="bg-white/50 rounded-lg p-3 text-center border-b-2 border-brand-500">
                       <p className="text-xs text-slate-600 mb-1 font-semibold">Top 3</p>
                       <p className="text-xl font-bold text-white">{globalPerformance.positionBuckets.top3}</p>
                     </div>
                     <div className="bg-white/50 rounded-lg p-3 text-center border-b-2 border-emerald-500">
                       <p className="text-xs text-slate-600 mb-1 font-semibold">4 - 10</p>
                       <p className="text-xl font-bold text-white">{globalPerformance.positionBuckets.top10}</p>
                     </div>
                     <div className="bg-white/50 rounded-lg p-3 text-center border-b-2 border-amber-500">
                       <p className="text-xs text-slate-600 mb-1 font-semibold">11 - 20</p>
                       <p className="text-xl font-bold text-white">{globalPerformance.positionBuckets.top20}</p>
                     </div>
                     <div className="bg-white/50 rounded-lg p-3 text-center border-b-2 border-slate-300">
                       <p className="text-xs text-slate-600 mb-1 font-semibold">&gt; 20</p>
                       <p className="text-xl font-bold text-white">{globalPerformance.positionBuckets.beyond}</p>
                     </div>
                   </div>
                 </div>

                 {/* Top Keywords Quick View */}
                 <div className="flex-1">
                   <h3 className="font-display text-[10px] text-slate-500 uppercase tracking-widest font-black mb-3">Top Keywords de Tráfico</h3>
                   <div className="space-y-1.5">
                     {globalPerformance.topKeywords.slice(0, 5).map((kw: any, i: number) => (
                       <div key={i} className="flex justify-between items-center text-xs">
                         <span className="text-slate-700 truncate max-w-[150px]" title={kw.query}>{kw.query}</span>
                         <div className="flex gap-2">
                           <span className="text-brand-400 font-medium">{kw.clicks.toLocaleString()} clics</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
           )}

           <div className="flex border-b border-slate-200 overflow-x-auto">
              <button 
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'keywords' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('keywords')}
              >
                Tus Keywords ({activeKeywords.length})
              </button>
              <button 
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'opportunities' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('opportunities')}
              >
                <Lightbulb className="w-4 h-4" /> Oportunidades ({specificOops.length})
              </button>
              <button 
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'cannibalizations' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('cannibalizations')}
              >
                <AlertTriangle className="w-4 h-4" /> Canibalización ({cannibalizations.length})
              </button>
              <button 
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'plan' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('plan')}
              >
                🚀 Plan Mensual y Auditoría
              </button>
           </div>

           {/* CONTENIDO DE TABS */}
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             
             {/* KEYWORDS */}
             {activeTab === 'keywords' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-600 bg-white/50 uppercase">
                      <tr>
                        <th className="px-4 py-3">Query</th>
                        <th className="px-4 py-3 text-right">Impresiones</th>
                        <th className="px-4 py-3 text-right">Clics</th>
                        <th className="px-4 py-3 text-right">CTR</th>
                        <th className="px-4 py-3 text-right">Posición</th>
                        <th className="px-4 py-3">URL Rankeando</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeKeywords.slice(0, 100).map((kw, i) => (
                        <tr key={i} className="hover:bg-slate-50/30">
                          <td className="px-4 py-3 font-medium text-slate-800">{kw.query}</td>
                          <td className="px-4 py-3 text-right">{kw.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-brand-400">{kw.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{(kw.ctr * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-right text-emerald-400 font-medium">{Math.round(kw.position)}</td>
                          <td className="px-4 py-3 max-w-[200px] truncate text-slate-600" title={kw.page}>{kw.page}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {activeKeywords.length === 0 && <p className="p-8 text-center text-slate-500">No hay datos suficientes.</p>}
                </div>
             )}

             {/* OPPORTUNITIES */}
             {activeTab === 'opportunities' && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {specificOops.map((opp, i) => (
                     <div key={i} className="p-4 bg-white/50 border border-slate-200/50 rounded-xl flex flex-col h-full hover:border-slate-300 transition-colors shadow-sm">
                       <div className="flex justify-between items-start mb-2">
                         <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                           opp.type === 'orphaned' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                           opp.type === 'striking_distance' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                           'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                         }`}>
                           {opp.type === 'striking_distance' ? '🚀 Top 5-20' : opp.type === 'orphaned' ? '👻 Huérfana' : '📉 Bajo CTR'}
                         </span>
                         <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                           Pos. {Math.round(opp.position)}
                         </span>
                       </div>
                       
                       <h3 className="font-display font-bold text-white text-lg mb-1">{opp.query}</h3>
                       <p className="text-xs text-brand-400 truncate mb-3" title={opp.page}>{opp.page.replace('https://', '')}</p>
                       
                       <div className="grid grid-cols-2 gap-2 mb-3 mt-auto pt-3 border-t border-slate-200/50">
                         <div className="bg-white/50 rounded p-2">
                           <p className="text-[10px] text-slate-500 uppercase tracking-wider">Impresiones</p>
                           <p className="font-semibold text-slate-800">{opp.impressions.toLocaleString()}</p>
                         </div>
                         <div className="bg-white/50 rounded p-2">
                           <p className="text-[10px] text-slate-500 uppercase tracking-wider">CTR</p>
                           <p className="font-semibold text-slate-800">{(opp.ctr * 100).toFixed(1)}%</p>
                         </div>
                       </div>
                       
                       <ul className="text-xs text-slate-600 space-y-1.5 mb-4">
                         {opp.reasons.map((r, j) => <li key={j} className="flex gap-1.5 leading-snug"><Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {r}</li>)}
                       </ul>

                       <button 
                         className="btn-secondary py-2 w-full text-xs mt-auto font-medium"
                         onClick={() => {
                           if (opp.type === 'orphaned') window.open('/dashboard/create', '_blank')
                           else window.open('/dashboard/improve', '_blank')
                         }}
                       >
                         {opp.type === 'orphaned' ? 'Crear Contenido Nuevo' : 'Mejorar Post en WordPress'}
                       </button>
                     </div>
                   ))}
                   {specificOops.length === 0 && <p className="col-span-full text-center p-8 text-slate-500">No se detectaron oportunidades claras por el momento.</p>}
                </div>
             )}

             {/* CANNIBALIZATIONS */}
             {activeTab === 'cannibalizations' && (
                <div className="p-4 space-y-4">
                   {cannibalizations.map((risk, i) => (
                     <div key={i} className="p-5 bg-red-950/10 border border-red-900/40 rounded-xl shadow-sm">
                       <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                         <div className="flex items-center gap-2">
                           <AlertTriangle className="w-5 h-5 text-red-500" />
                           <span className="font-bold text-lg text-white">
                             Conflicto en la query: <span className="text-red-400 underline decoration-red-500/30 underline-offset-4">{risk.query}</span>
                           </span>
                         </div>
                         <span className="sm:ml-auto text-xs bg-white px-2 py-1 rounded text-slate-600 border border-slate-200/50 max-w-max">Total Imp: {risk.totalImpressions.toLocaleString()}</span>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {risk.competingPages.map((page, j) => (
                           <div key={j} className="p-3 bg-white/80 rounded-lg border border-slate-200">
                             <a href={page.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-400 hover:text-brand-300 flex items-center gap-1 mb-2 truncate" title={page.url}>
                               <LinkIcon className="w-3.5 h-3.5 shrink-0" /> {page.url.split('/').pop() || page.url}
                             </a>
                             <div className="flex justify-between text-xs text-slate-600 bg-white rounded p-1.5 border border-slate-200">
                               <span>Pos: <strong className="text-white">{Math.round(page.position)}</strong></span>
                               <span>Imp: <strong className="text-white">{page.impressions}</strong></span>
                               <span>Clics: <strong className="text-white">{page.clicks}</strong></span>
                             </div>
                             {page.post && (
                               <div className="mt-3">
                                 <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 font-medium">
                                   ✓ Post WP: {page.post.title}
                                 </span>
                               </div>
                             )}
                           </div>
                         ))}
                       </div>
                       
                       <div className="mt-4 pt-4 border-t border-red-900/30">
                         <button className="btn-secondary py-1.5 text-sm text-red-200 border-red-900/50 hover:bg-red-900/20" onClick={() => window.open('/dashboard/improve', '_blank')}>
                           Fusionar URLs / Redireccionar 301
                         </button>
                       </div>
                     </div>
                   ))}
                   {cannibalizations.length === 0 && <p className="text-center p-8 text-slate-500">No se detectaron canibalizaciones orgánicas (URLs compitiendo).</p>}
                 </div>
              )}

              {/* PLAN */}
              {activeTab === 'plan' && (
                <div className="p-4 sm:p-6 lg:p-8 shrink border-0 shadow-none">
                  {!auditPlan && !generatingPlan ? (
                     <div className="text-center bg-white/20 border-dashed border-2 border-slate-200/50 hover:border-purple-500/30 transition-colors rounded-3xl p-12 max-w-2xl mx-auto shadow-sm group">
                         {/* Month picker */}
                         <div className="mb-8 flex flex-col items-center gap-3">
                           <div className="flex items-center gap-2 text-slate-600">
                             <Calendar className="w-4 h-4" />
                             <span className="text-sm font-semibold">Período del informe</span>
                           </div>
                           <input
                             type="month"
                             value={selectedReportMonth}
                             onChange={(e) => setSelectedReportMonth(e.target.value)}
                             max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2,'0')}`}
                             className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                           />
                           {reportPeriod.monthName && (
                             <p className="text-xs text-slate-500">
                               {reportPeriod.startDate} — {reportPeriod.endDate}
                             </p>
                           )}
                         </div>
                         <div className="w-24 h-24 bg-purple-500/5 group-hover:bg-purple-500/10 text-purple-400/80 group-hover:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/5 border border-purple-500/10 transition-all duration-500 group-hover:scale-110">
                           <Lightbulb className="w-10 h-10" />
                         </div>
                         <h2 className="font-display text-2xl font-black text-white mb-4 tracking-tight">
                            Informe Mensual {reportPeriod.monthName} {reportPeriod.year || ''}
                         </h2>
                         <p className="text-slate-600 leading-relaxed max-w-lg mx-auto mb-8 text-sm">
                            La IA estructurará un diagnóstico avanzado On-Page y Off-Page basado en tus datos de Search Console, y te diagramará una hoja de ruta accionable de 30 días.
                         </p>
                         <button 
                           onClick={handleGeneratePlan}
                           className="btn-primary bg-gradient-to-r from-purple-600/90 to-purple-500/90 hover:from-purple-500 hover:to-purple-400 px-8 py-3.5 shadow-xl shadow-purple-500/20 uppercase tracking-widest text-xs font-bold"
                         >
                           Generar Informe {reportPeriod.monthName} y Plan
                         </button>
                      </div>
                  ) : generatingPlan ? (
                     <div className="text-center p-16 space-y-8 animate-fade-in bg-white/50 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
                        <div className="relative w-20 h-20 mx-auto">
                           <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin" style={{ animationDuration: '1s' }} />
                           <div className="absolute inset-2 rounded-full border-r-2 border-brand-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Globe className="w-6 h-6 text-slate-500 animate-pulse" />
                           </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-display text-lg font-bold text-white tracking-widest uppercase animate-pulse">Consultando Arquitectura Digital...</h3>
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold max-w-xs mx-auto leading-relaxed">
                            Procesando {cannibalizations.length} canibalizaciones y {specificOops.length} oportunidades detectadas
                          </p>
                        </div>
                     </div>
                  ) : auditPlan && (
                     <div className="space-y-6 sm:space-y-8 animate-fade-in" ref={planRef}>

                         {/* Report Header with Period */}
                         <div className="bg-gradient-to-r from-purple-900/30 to-brand-900/20 border border-purple-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                           <div>
                             <div className="flex items-center gap-2 mb-1">
                               <Calendar className="w-4 h-4 text-purple-400" />
                               <span className="text-xs text-purple-400 uppercase tracking-widest font-bold">Informe Mensual</span>
                             </div>
                             <h2 className="font-display text-2xl font-black text-white">{reportPeriod.monthName} {reportPeriod.year}</h2>
                             <p className="text-xs text-slate-500 mt-1">{reportPeriod.startDate} — {reportPeriod.endDate}</p>
                           </div>
                           <div className="flex gap-3">
                             <div className="text-center bg-white/60 rounded-xl px-4 py-3 border border-slate-200">
                               <p className="text-2xl font-black text-brand-400">{monthlyStats.created}</p>
                               <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Creados</p>
                             </div>
                             <div className="text-center bg-white/60 rounded-xl px-4 py-3 border border-slate-200">
                               <p className="text-2xl font-black text-purple-400">{monthlyStats.improved}</p>
                               <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Mejorados</p>
                             </div>
                             <div className="text-center bg-white/60 rounded-xl px-4 py-3 border border-slate-200">
                               <p className="text-2xl font-black text-emerald-400">{activityItems.filter(a => a.type === 'wp_modified').length}</p>
                               <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">WP Editados</p>
                             </div>
                           </div>
                         </div>

                         {/* Activity Log */}
                         {activityItems.length > 0 && (
                           <div className="bg-white/30 border border-slate-200/50 rounded-2xl p-6">
                             <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                               <Clock className="w-4 h-4 text-slate-600" />
                               Actividad del Período — {activityItems.length} acciones
                             </h3>
                             <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                               {activityItems.map((item) => (
                                 <div key={item.id} className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-slate-200 hover:border-slate-200 transition-colors">
                                   <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                     item.type === 'created' ? 'bg-brand-500/15 text-brand-400' :
                                     item.type === 'improved' ? 'bg-purple-500/15 text-purple-400' :
                                     'bg-amber-500/15 text-amber-400'
                                   }`}>
                                     {item.type === 'created' ? <FileText className="w-3 h-3" /> :
                                      item.type === 'improved' ? <PenLine className="w-3 h-3" /> :
                                      <RefreshCw className="w-3 h-3" />}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                     <p className="text-sm font-medium text-slate-800 truncate" dangerouslySetInnerHTML={{ __html: item.title }} />
                                     <div className="flex items-center gap-2 mt-0.5">
                                       <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                         item.type === 'created' ? 'text-brand-400' :
                                         item.type === 'improved' ? 'text-purple-400' :
                                         'text-amber-400'
                                       }`}>
                                         {item.type === 'created' ? '➕ Creado' : item.type === 'improved' ? '✎️ Mejorado' : '🔄 Editado en WP'}
                                       </span>
                                       {item.keyword && <span className="text-[10px] text-slate-500">· {item.keyword}</span>}
                                     </div>
                                   </div>
                                   <div className="text-right shrink-0">
                                     <p className="text-[10px] text-slate-500">
                                       {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                     </p>
                                     {item.url && (
                                       <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] text-brand-400 hover:text-brand-300">Ver ↗</a>
                                     )}
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                        {globalPerformance && (
                          <div className="bg-white/30 border border-slate-200/50 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                            <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-4">Métricas Globales Orgánicas (YTD)</h3>
                            <div className="flex flex-col md:flex-row gap-6">
                              <div className="flex-1 bg-white/50 p-4 rounded-xl border border-slate-200">
                                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-2">Tráfico Consolidado vs Año Anterior</p>
                                <div className="text-3xl font-black text-white">{globalPerformance.currentYtd.clicks.toLocaleString()} <span className="text-sm font-normal text-slate-500">clics</span></div>
                                <div className="mt-2 text-sm font-bold">
                                  {globalPerformance.currentYtd.clicks > (globalPerformance.previousYtd?.clicks || 1) ? (
                                    <span className="text-emerald-400">+{Math.round(((globalPerformance.currentYtd.clicks - globalPerformance.previousYtd.clicks) / (globalPerformance.previousYtd.clicks || 1)) * 100)}% YoY</span>
                                  ) : (
                                    <span className="text-red-400">{Math.round(((globalPerformance.currentYtd.clicks - globalPerformance.previousYtd.clicks) / (globalPerformance.previousYtd.clicks || 1)) * 100)}% YoY</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 bg-white/50 p-4 rounded-xl border border-slate-200">
                                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-3">Distribución de Keywords</p>
                                <div className="flex justify-between items-center text-xs text-white border-b border-slate-200 pb-1 mb-1">
                                  <span>Top 3</span><span className="font-bold text-brand-400">{globalPerformance.positionBuckets.top3}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-white border-b border-slate-200 pb-1 mb-1">
                                  <span>Posiciones 4 - 10</span><span className="font-bold text-emerald-400">{globalPerformance.positionBuckets.top10}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-white">
                                  <span>A distancia (11 - 20)</span><span className="font-bold text-amber-400">{globalPerformance.positionBuckets.top20}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Monthly Summary Section */}
                        <div className="bg-white/30 border border-slate-200/50 rounded-2xl p-6 relative overflow-hidden shadow-sm">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                           <h3 className="font-display text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                             Resumen de Impacto Mensual
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="bg-white/50 border border-slate-200 rounded-xl p-4 text-center">
                               <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5 font-semibold">Nuevos Artículos</p>
                               <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                                 {monthlyStats.created}
                               </div>
                             </div>
                             <div className="bg-white/50 border border-slate-200 rounded-xl p-4 text-center">
                               <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5 font-semibold">Artículos Optimizados</p>
                               <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-purple-600">
                                 {monthlyStats.improved}
                               </div>
                             </div>
                             <div className="bg-white/50 border border-slate-200 rounded-xl p-4 text-center">
                               <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1.5 font-semibold">Enlaces Internos</p>
                               <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600">
                                 {monthlyStats.internalLinks}
                               </div>
                             </div>
                           </div>
                        </div>
                        {/* Score Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                           <div className="bg-white/40 border border-slate-200/50 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-sm">
                              <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                 <LineChart className="w-24 h-24 text-emerald-500" />
                              </div>
                              <div className="flex justify-between items-start mb-5 relative z-10">
                                <div>
                                   <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-1">On-Page SEO</h3>
                                   <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Diagnóstico de Salud</p>
                                </div>
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-black text-lg shadow-lg ${auditPlan.onPage.score >= 80 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : auditPlan.onPage.score >= 50 ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'}`}>
                                  {auditPlan.onPage.score}
                                </div>
                              </div>
                              <p className="text-sm text-slate-700 mb-6 leading-relaxed relative z-10 font-medium bg-white/50 p-4 rounded-xl border border-slate-200/80">{auditPlan.onPage.diagnosis}</p>
                              <div className="space-y-3 relative z-10 p-1">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Recomendaciones Clave</h4>
                                <ul className="space-y-3 mt-3">
                                  {auditPlan.onPage.recommendations.map((r, i) => (
                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-3 leading-snug">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> 
                                      {r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                           </div>

                           <div className="bg-white/40 border border-slate-200/50 p-6 rounded-2xl relative overflow-hidden group hover:border-brand-500/30 transition-colors shadow-sm">
                              <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                 <Globe className="w-24 h-24 text-brand-500" />
                              </div>
                              <div className="flex justify-between items-start mb-5 relative z-10">
                                <div>
                                   <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-1">Off-Page SEO</h3>
                                   <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Footprint & Marca</p>
                                </div>
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-black text-lg shadow-lg ${auditPlan.offPage.score >= 80 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : auditPlan.offPage.score >= 50 ? 'border-brand-500/50 text-brand-400 bg-brand-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'}`}>
                                  {auditPlan.offPage.score}
                                </div>
                              </div>
                              <p className="text-sm text-slate-700 mb-3 leading-relaxed relative z-10 font-medium bg-white/50 p-4 rounded-xl border border-slate-200/80">{auditPlan.offPage.diagnosis}</p>
                              <div className="inline-block px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-md text-[10px] text-brand-400 uppercase tracking-widest font-bold mb-6">
                                Señal de Marca: {auditPlan.offPage.brandAuthority}
                              </div>
                              <div className="space-y-3 relative z-10 p-1">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estrategia Dinámica</h4>
                                <ul className="space-y-3 mt-3">
                                  {auditPlan.offPage.recommendations.map((r, i) => (
                                    <li key={i} className="text-sm text-slate-600 flex items-start gap-3 leading-snug">
                                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500/80 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" /> 
                                      {r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                           </div>
                        </div>

                        {/* Roadmap Section */}
                        <div className="mt-8 bg-white/50 border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm overflow-hidden">
                          <div className="text-center mb-12">
                            <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-3">Hoja de Ruta <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-brand-400">30 Días</span></h3>
                            <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">Sigue este sprint de 4 semanas, enfocado en solucionar errores canibalizadores y potenciar las long-tails identificadas.</p>
                          </div>
                          
                          <div className="relative max-w-4xl mx-auto">
                            <div className="absolute top-0 bottom-0 left-4 sm:left-1/2 w-[1px] bg-gradient-to-b from-purple-500/50 via-brand-500/20 to-transparent sm:-translate-x-1/2" />
                            
                            <div className="space-y-12">
                               {auditPlan.actionPlan.map((step, index) => (
                                 <div key={index} className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12 ${index % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
                                    {/* Timeline dot */}
                                    <div className="absolute left-4 sm:left-1/2 w-4 h-4 rounded-full bg-purple-500 border-[3px] border-slate-200 -translate-x-[7px] sm:-translate-x-1/2 shadow-[0_0_15px_rgba(168,85,247,0.4)] z-10" />
                                    
                                    <div className={`sm:w-1/2 pl-12 sm:pl-0 w-full ${index % 2 === 0 ? 'sm:text-left' : 'sm:text-right'}`}>
                                      <div className={`inline-block px-3 py-1 bg-white/80 border border-slate-200 rounded-full text-[9px] font-black tracking-[0.2em] text-purple-400 uppercase mb-4 ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'}`}>
                                        {step.week}
                                      </div>
                                      <h4 className="text-lg font-bold text-white mb-4 tracking-tight leading-tight">
                                        {step.title}
                                      </h4>
                                      <ul className={`space-y-3 text-sm text-slate-600 ${index % 2 === 0 ? '' : 'sm:flex sm:flex-col sm:items-end'}`}>
                                        {step.tasks.map((t, j) => (
                                          <li key={j} className={`flex items-start gap-3 w-full sm:max-w-md ${index % 2 === 0 ? '' : 'sm:flex-row-reverse sm:text-right'}`}>
                                            <div className="w-[5px] h-[5px] rounded-full bg-slate-400 mt-[7px] shrink-0" />
                                            <span className="leading-snug block w-full">{t}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="sm:w-1/2 hidden sm:block" />
                                 </div>
                               ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center gap-4 mt-12 pt-8 border-t border-slate-200/50" data-html2canvas-ignore="true">
                           <button 
                             onClick={handleDownloadPDF} 
                             disabled={downloadingPdf}
                             className="btn-primary flex items-center gap-2 text-[11px] uppercase font-bold tracking-[0.15em] px-8 py-3 rounded-full"
                           >
                             {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                             Descargar Informe Mensual (PDF)
                           </button>
                           <button onClick={() => setAuditPlan(null)} className="btn-secondary text-[11px] uppercase font-bold tracking-[0.15em] px-8 py-3 rounded-full hover:bg-slate-50">
                             Limpiar y Volver a Analizar
                           </button>
                        </div>
                     </div>
                  )}
                </div>
             )}
             
            </div>
        </div>
      )}
    </div>
  )
}
