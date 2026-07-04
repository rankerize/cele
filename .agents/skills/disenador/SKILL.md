---
name: disenador-ui
description: Skill para el Agente Diseñador UI/UX del proyecto SEO Content Builder. Define los estándares visuales, sistema de diseño, componentes y patrones de interacción que debe seguir en toda la interfaz.
---

# Agente Diseñador UI/UX — SEO Content Builder

## Contexto del Proyecto
App SaaS de gestión de contenido WordPress con IA. Stack: Next.js 14 (App Router), Tailwind CSS, Lucide Icons. Desplegado en Firebase Hosting (gsc-seo.web.app).

---

## 1. Sistema de Diseño (Design Tokens)

### Paleta de Colores
```css
/* Superficie (fondos) */
--surface-900: #0a0a0f   /* fondo base */
--surface-800: #12121a   /* cards */
--surface-700: #1a1a28   /* inputs */

/* Marca (acciones primarias) */
--brand-400: #818cf8     /* indigo-400 */
--brand-600: #4f46e5     /* indigo-600 */

/* Estados */
--success: #10b981       /* emerald-500 */
--warning: #f59e0b       /* amber-500 */
--danger:  #ef4444       /* red-500 */

/* Módulos (color por sección) */
--color-create:  #a855f7  /* purple - Crear contenido */
--color-improve: #6366f1  /* indigo - Mejorar contenido */
--color-seo:     #3b82f6  /* blue   - SEO Estratégico */
--color-wc:      #10b981  /* emerald- WooCommerce */
--color-history: #f59e0b  /* amber  - Historial */
```

### Tipografía
- **Fuente**: Inter (Google Fonts), sans-serif
- **Escala**: text-xs (11px) / text-sm (13px) / text-base (15px) / text-lg-2xl para headings
- **Pesos**: 400 (body), 500 (labels), 600 (semi), 700 (bold títulos)

---

## 2. Componentes Base

### Cards
```tsx
// Siempre usar esta clase base para contenedores
className="bg-surface-800 border border-surface-700 rounded-2xl p-5"

// Card con hover interactivo
className="... hover:border-surface-600 transition-colors cursor-pointer"

// Card activo/seleccionado
className="... border-brand-500/50 bg-brand-600/10"
```

### Botones
```tsx
// Primario
className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-brand-900/30"

// Secundario
className="flex items-center gap-2 px-4 py-2.5 bg-surface-700 hover:bg-surface-600 text-slate-300 font-medium text-sm rounded-xl border border-surface-600 transition-all"

// Destructivo
className="... bg-red-600/10 text-red-400 border-red-500/30 hover:bg-red-600/20"
```

### Inputs y Formularios
```tsx
// Input base
className="w-full px-3 py-2 bg-surface-700 border border-surface-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50 transition-colors"

// Label
className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
```

### Estados de carga
```tsx
// Skeleton loader
className="h-4 bg-surface-700 rounded animate-pulse"

// Spinner inline
<Loader2 className="w-4 h-4 animate-spin text-brand-400" />

// Estado vacío
<div className="flex flex-col items-center justify-center py-12 text-slate-500">
  <Icon className="w-10 h-10 mb-3 opacity-20" />
  <p className="text-sm">Mensaje descriptivo de estado vacío</p>
</div>
```

---

## 3. Layout y Estructura

### Grid del Dashboard
- Sidebar fijo de 240px a la izquierda
- Contenido principal con `max-w-7xl` y `px-6 py-6`
- Header de sección siempre con icono + título + subtítulo

### Header de Sección (patrón obligatorio)
```tsx
<div className="flex items-center gap-3 mb-6">
  <div className="w-10 h-10 rounded-xl bg-{color}-600/20 border border-{color}-500/30 flex items-center justify-center">
    <Icon className="w-5 h-5 text-{color}-400" />
  </div>
  <div>
    <h1 className="text-2xl font-bold text-white">{Título de la sección}</h1>
    <p className="text-sm text-slate-500">{Descripción breve}</p>
  </div>
</div>
```

### Tab Switchers
```tsx
<div className="flex gap-1 p-1 bg-surface-900 border border-surface-800 rounded-xl w-fit">
  <button className={activeTab === 'tab1'
    ? 'bg-{color}-600 text-white shadow-lg shadow-{color}-900/40 px-4 py-2 rounded-lg text-sm font-medium'
    : 'text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-all'
  }>Tab 1</button>
</div>
```

---

## 4. Animaciones y Micro-interacciones

```css
/* Entrada de página */
.animate-fade-in { animation: fadeIn 0.3s ease; }

/* Hover en cards clickeables */
transition: all 0.15s ease;
transform: translateY(-1px) on hover;

/* Loading pulse lento */
.animate-pulse-slow { animation: pulse 2s ease-in-out infinite; }
```

**Reglas:**
- Nunca usar animaciones de más de 300ms en interacciones rápidas
- Usar `transition-all duration-150` para hovers
- Spinner siempre en el color del módulo activo

---

## 5. Iconografía

**Biblioteca**: Lucide React (única, no mezclar con otras)

**Asignación por módulo:**
- Crear contenido → `PenLine`, `Sparkles`
- Mejorar contenido → `RefreshCw`, `Zap`
- SEO Estratégico → `BarChart3`, `TrendingUp`
- WooCommerce → `ShoppingBag`, `Package`
- Historial → `History`, `Clock`
- Settings → `Settings`, `Key`
- IA / AI → `Brain`, `Bot`
- Error → `AlertTriangle`
- Éxito → `CheckCircle2`

---

## 6. Mensajes de Error y Éxito

```tsx
// Error
<div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
  {mensaje}
</div>

// Éxito
<div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
  {mensaje}
</div>

// Warning
<div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
  {mensaje}
</div>
```

---

## 7. Responsividad

- Mobile: stack vertical, `flex-col`
- Tablet (md): `grid-cols-2`
- Desktop (lg): `grid-cols-[240px_1fr]` para dashboard
- Nunca ocultar información crítica en mobile, solo reorganizar

---

## 8. Checklist antes de entregar cualquier componente

- [ ] ¿Usa los colores del design token del módulo al que pertenece?
- [ ] ¿Tiene estado de carga (skeleton/spinner)?
- [ ] ¿Tiene estado vacío con icono + mensaje?
- [ ] ¿Tiene manejo de error visible para el usuario?
- [ ] ¿Los inputs tienen focus ring visible?
- [ ] ¿Los botones tienen estado `disabled` correcto?
- [ ] ¿Es responsive en mobile?
