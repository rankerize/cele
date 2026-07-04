# 📋 Constructor de textos WordPress — Estado del Proyecto

> Última actualización: 2026-04-01
> Dev server: `npm run dev` → http://localhost:3000

---

## ✅ Módulos completados

- [x] **Login / Auth** — Habilitado en Firebase + iron-session (Usuario rankerize@gmail.com registrado)
- [x] **Redirección de Plataforma** — Root `/` y `/hub` redirigen directamente al Dashboard
- [x] **Unificación SEO** — Eliminado módulo ADS, Flow es ahora 100% SEO (Landing page y Dashboard limpios)
- [x] **Dashboard diagnóstico** — Cockpit con KPIs de GSC, barra de salud del sitio, alertas, pipeline editorial y actividad reciente
- [x] **Onboarding wizard** — Configuración guiada inicial (WP + IA + GSC)
- [x] **Crear contenido** — Flujo conversacional con anti-canibalización via GSC
- [x] **Mejorar contenido** — Post selector + editor SEO para artículos existentes
- [x] **Batch / Planificación** — Generación masiva de artículos basada en datos de GSC
- [x] **Mapa editorial** — Vista kanban/tabla con gestión de estados y filtros
- [x] **Estrategia SEO** — Auditoría mensual, plan editorial, métricas YTD con comparativa YoY
- [x] **Enlazado interno** — Diagnóstico + tabla de oportunidades + análisis por lote + panel de detalle
- [x] **Action Center** — Hub centralizado de todas las recomendaciones (GSC, WP, canibalización, interlinking)
- [x] **Historial** — Registro persistente en `.history-data.json` con análisis de impacto
- [x] **Settings** — Configuración de integraciones (WordPress, GSC, IA)

---

## 🔄 En progreso

- [x] **Configurar OAuth de Google en Firebase** — Aprovisionado y configurado en local. Pendiente validación de URIs en producción.

---

## ⏳ Pendiente

### 🔥 Alta prioridad
- [ ] **Deploy final a Firebase Hosting** — Ejecutar `npm run build` + `firebase deploy` para pasar a producción los cambios de SEO-only.
- [ ] **Conectar Action Center con datos reales** — Actualmente puede estar usando seed data, necesita leer de GSC + WP + módulos reales

### 🟡 Media prioridad
- [ ] **Probar flujo completo en producción** — Login → GSC conectado → generar artículo → publicar en WordPress
- [ ] **Validar historial en producción** — Confirmar que `.history-data.json` persiste correctamente en el entorno de Firebase

---

## 🏗️ Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | iron-session + Google OAuth |
| Hosting | Firebase Hosting |
| Base de datos | Firebase Firestore + archivos locales JSON |
| IA | Google Gemini / OpenAI (configurable) |
| Datos SEO | Google Search Console API |
| CMS | WordPress REST API |
| Estilos | Tailwind CSS |

---

## 📁 Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `.wp-config.json` | Credenciales de WordPress |
| `.ai-config.json` | API Key de IA |
| `.env.local` | Variables de entorno (tokens, secrets) |
| `.history-data.json` | Historial de acciones persistente |
| `lib/auth.ts` | Configuración de iron-session |
| `lib/google-auth.ts` | Integración con Google OAuth / GSC |
| `components/layout/Sidebar.tsx` | Navegación principal |
