'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ContentFormData, ContentIdea } from '@/types/content'
import { Sparkles, Send, User, Bot, RotateCcw, ChevronRight, Lightbulb, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onGenerate: (data: ContentFormData) => Promise<void>
  loading: boolean
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  field?: keyof ContentFormData | 'topic'
  ideas?: ContentIdea[]
}

const QUESTIONS: { field: keyof ContentFormData | 'topic'; question: string; suggestions?: string[] }[] = [
  { 
    field: 'topic', 
    question: '¡Hola! Soy tu asistente de contenido. ¿Sobre qué tema o título te gustaría escribir hoy?' 
  },
  { 
    field: 'nicho', 
    question: 'Entendido. ¿Para qué nicho o industria es este contenido?',
    suggestions: ['Marketing Digital', 'Fitness y Salud', 'Finanzas Personales', 'Tecnología', 'Viajes']
  },
  { 
    field: 'keywordPrincipal', 
    question: '¿Cuál es la keyword principal que quieres posicionar?',
  },
  { 
    field: 'paisMercado', 
    question: '¿A qué país o mercado objetivo nos dirigimos?',
    suggestions: ['España', 'México', 'Colombia', 'Chile', 'Latinoamérica']
  },
  { 
    field: 'intencionBusqueda', 
    question: '¿Cuál es la intención de búsqueda del usuario?',
    suggestions: ['Informativa', 'Comercial', 'Comparativa', 'Transaccional']
  },
  { 
    field: 'tipoPieza', 
    question: '¿Qué tipo de pieza estamos creando?',
    suggestions: ['Artículo de blog', 'Landing page', 'Página de servicio', 'Ficha de producto']
  },
  { 
    field: 'tono', 
    question: '¿Qué tono prefieres para el texto?',
    suggestions: ['Profesional y formal', 'Cercano y conversacional', 'Técnico y experto', 'Persuasivo y comercial']
  },
  { 
    field: 'longitudAproximada', 
    question: '¿Qué longitud aproximada debería tener?',
    suggestions: ['800 palabras', '1200 palabras', '2000 palabras', '3000 palabras']
  },
  { 
    field: 'ctaFinal', 
    question: 'Finalmente, ¿cuál es el Call to Action (CTA) al final del texto?',
    suggestions: ['Contáctanos hoy', 'Descarga la guía gratis', 'Inicia tu prueba gratuita', 'Compra ahora']
  }
]

// Map suggestions to values if needed
const getValueFromSuggestion = (field: string, suggestion: string) => {
  if (field === 'longitudAproximada') return suggestion.split(' ')[0]
  if (field === 'intencionBusqueda') return suggestion.toLowerCase() as any
  if (field === 'tipoPieza') {
    const maps: Record<string, string> = {
      'Artículo de blog': 'blog',
      'Landing page': 'landing',
      'Página de servicio': 'pagina-servicio',
      'Ficha de producto': 'ficha-producto'
    }
    return maps[suggestion] || 'blog'
  }
  return suggestion
}

export default function ContentChatAssistant({ onGenerate, loading }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: QUESTIONS[0].question,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<Partial<ContentFormData>>({
    intencionBusqueda: 'informativa',
    tipoPieza: 'blog',
    tono: 'Profesional y formal',
    longitudAproximada: '1200',
  })
  const [loadingIdeas, setLoadingIdeas] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (text: string = input) => {
    if (!text.trim() || loading) return

    const currentQuestion = QUESTIONS[step]
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Handle topic and fetch ideas
    if (currentQuestion.field === 'topic') {
      fetchIdeas(text)
    }

    // Update form data (skip 'topic' as it's general info)
    if (currentQuestion.field !== 'topic') {
      const value = getValueFromSuggestion(currentQuestion.field as string, text)
      setFormData(prev => ({ ...prev, [currentQuestion.field]: value }))
    }

    // Check if there are more questions
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => {
        const nextStep = step + 1
        setStep(nextStep)
        const nextQuestion = QUESTIONS[nextStep]
        
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: nextQuestion.question,
          suggestions: nextQuestion.suggestions,
          field: nextQuestion.field as keyof ContentFormData,
          timestamp: new Date()
        }])
      }, 600)
    } else {
      // Final confirmation message before generation
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '¡Perfecto! Tengo toda la información necesaria. Haz clic en el botón de abajo para empezar a generar tu contenido premium.',
          timestamp: new Date()
        }])
      }, 600)
    }
  }

  const fetchIdeas = async (topic: string) => {
    setLoadingIdeas(true)
    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      })
      const json = await res.json()
      if (json.success && json.data) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `He encontrado estas ideas estratégicas para "${topic}". Selecciona una para usar su keyword y ángulo, o sigue respondiendo mis preguntas.`,
          ideas: json.data,
          timestamp: new Date()
        }])
      }
    } catch (e) {
      console.error('Error fetching ideas:', e)
    } finally {
      setLoadingIdeas(false)
    }
  }

  const selectIdea = (idea: ContentIdea) => {
    setFormData(prev => ({
      ...prev,
      keywordPrincipal: idea.keyword,
      tono: idea.angle === 'Educativo' ? 'Profesional y formal' : 
            idea.angle === 'Inspirador' ? 'Cercano y conversacional' : 
            'Técnico y experto'
    }))
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: `Usar idea: ${idea.title} (Keyword: ${idea.keyword})`,
      timestamp: new Date()
    }, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Excelente elección. He configurado la keyword principal como "${idea.keyword}". Sigamos con lo demás.`,
      timestamp: new Date()
    }])
    
    // Jump to next logical step if they selected an idea
    if (step < 2) { // 2 is keywordPrincipal
       setStep(3) // Jump to market/country
       const nextQuestion = QUESTIONS[3]
       setTimeout(() => {
         setMessages(prev => [...prev, {
           id: (Date.now() + 3).toString(),
           role: 'assistant',
           content: nextQuestion.question,
           suggestions: nextQuestion.suggestions,
           field: nextQuestion.field as any,
           timestamp: new Date()
         }])
       }, 800)
    }
  }

  const handleReset = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: QUESTIONS[0].question,
      timestamp: new Date()
    }])
    setStep(0)
    setFormData({
      intencionBusqueda: 'informativa',
      tipoPieza: 'blog',
      tono: 'Profesional y formal',
      longitudAproximada: '1200',
    })
  }

  const handleGenerate = () => {
    onGenerate(formData as ContentFormData)
  }

  const isComplete = step === QUESTIONS.length - 1 && messages.length > QUESTIONS.length * 2

  return (
    <div className="flex flex-col h-[600px] bg-white/60 border border-slate-200 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center border border-brand-500/30">
            <Bot className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white tracking-tight">Asistente de Contenido</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">En línea</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleReset}
          className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-white transition-colors"
          title="Reiniciar conversación"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className={cn(
            "flex gap-3 max-w-[85%] animate-fade-in-up",
            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1",
              msg.role === 'assistant' ? "bg-brand-600/10 border border-brand-500/20" : "bg-white border border-slate-200"
            )}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-brand-400" /> : <User className="w-4 h-4 text-slate-600" />}
            </div>
            <div className="space-y-2">
              <div className={cn(
                "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'assistant' 
                  ? "bg-white border border-slate-200 text-slate-800 rounded-tl-none" 
                  : "bg-brand-600 text-white rounded-tr-none shadow-[0_4px_12px_rgba(var(--brand-600-rgb),0.3)]"
              )}>
                {msg.content}
              </div>
              
              {msg.suggestions && msg.role === 'assistant' && msg.id === messages[messages.length-1].id && !isComplete && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {msg.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="px-3 py-1.5 text-xs bg-white hover:bg-brand-600/20 border border-slate-200 hover:border-brand-500/50 text-slate-600 hover:text-brand-400 rounded-full transition-all duration-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {msg.ideas && msg.role === 'assistant' && (
                <div className="grid grid-cols-1 gap-3 pt-2 w-full max-w-lg">
                  {msg.ideas.map((idea, idx) => (
                    <div 
                      key={idx}
                      className="bg-white/80 border border-slate-200 rounded-xl p-4 hover:border-brand-500/50 transition-all group cursor-pointer"
                      onClick={() => selectIdea(idea)}
                    >
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded uppercase tracking-wider">{idea.angle}</span>
                         <Check className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{idea.title}</h4>
                      <p className="text-xs text-slate-600 mb-3">{idea.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                          <span className="text-[11px] font-medium text-slate-700">Keyword: <span className="text-brand-400">{idea.keyword}</span></span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {idea.longTails?.map((lt, i) => (
                            <span key={i} className="text-[9px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                              {lt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loadingIdeas && (
          <div className="flex gap-3 max-w-[85%] animate-fade-in-up">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-brand-600/10 border border-brand-500/20">
              <Bot className="w-4 h-4 text-brand-400" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
               <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
               <span className="text-xs text-slate-600 font-medium tracking-tight">Analizando keywords long-tail y ángulos estratégicos...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-brand-600/5 border-t border-brand-500/10">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
            {Object.keys(formData).length > 0 && (
              <span className="text-[10px] text-brand-400/70 font-medium whitespace-nowrap bg-brand-500/10 px-2 rounded">
                Configuración guardada: {Object.keys(formData).length}/9
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 bg-white/40 border-t border-slate-200">
        {!isComplete ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu respuesta aquí..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-11 h-11 flex items-center justify-center bg-brand-600 hover:bg-brand-500 disabled:bg-white disabled:text-slate-600 text-white rounded-xl shadow-lg transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(var(--brand-600-rgb),0.4)] transition-all animate-bounce-soft"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                GENERAR CONTENIDO PREMIUM
              </>
            )}
          </button>
        )}
      </div>

      <style jsx>{`
        .animate-bounce-soft {
          animation: bounce-soft 2s infinite;
        }
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
