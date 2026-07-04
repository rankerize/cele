import { z } from 'zod'

export const ContentFormSchema = z.object({
  projectId: z.string().optional(),
  nicho: z.string().min(2, 'El nicho es obligatorio'),
  keywordPrincipal: z.string().min(2, 'La keyword principal es obligatoria'),
  paisMercado: z.string().min(2, 'El país o mercado es obligatorio'),
  intencionBusqueda: z.enum(['informativa', 'comercial', 'comparativa', 'transaccional']),
  tipoPieza: z.enum(['blog', 'landing', 'pagina-servicio', 'categoria', 'ficha-producto']),
  ctaFinal: z.string().min(2, 'El CTA final es obligatorio'),
  tono: z.string().min(2, 'El tono es obligatorio'),
  longitudAproximada: z.string().min(1, 'La longitud es obligatoria'),
  categoriaDeseada: z.string().optional(),
})

export const PublishSchema = z.object({
  title: z.string().min(2, 'El título es obligatorio'),
  slug: z.string().min(2, 'El slug es obligatorio'),
  content: z.string().min(10, 'El contenido es obligatorio'),
  excerpt: z.string().optional(),
  metaDescription: z.string().optional(),
  categoria: z.string().min(2, 'La categoría es obligatoria'),
  status: z.enum(['draft', 'publish', 'pending']).default('draft'),
  faqs: z
    .array(
      z.object({
        pregunta: z.string(),
        respuesta: z.string(),
      })
    )
    .optional(),
})

export const LoginSchema = z.object({
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
export const AnalyzeConflictSchema = z.object({
  keywordPrincipal: z.string().min(1, 'Keyword requerida'),
  title: z.string().min(1, 'Título requerido'),
  slug: z.string().min(1, 'Slug requerido'),
  intencionBusqueda: z.string().optional(),
  categoria: z.string().optional(),
})

export const ImproveSchema = z.object({
  content: z.string().min(1, 'Contenido requerido'),
  title: z.string().min(1, 'Título requerido'),
  keyword: z.string().optional(),
  category: z.string().optional(),
})
