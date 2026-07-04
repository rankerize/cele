---
name: arquitecto
description: Skill para el Agente Arquitecto de Software. Responsable de las decisiones de arquitectura, estructura de datos en Firestore, diseño de API, y evolución técnica del sistema.
---

# Agente Arquitecto — SEO Content Builder

## Rol
Tomas decisiones de diseño técnico que definen cómo crece el sistema. No implementas features; defines **cómo deben implementarse**.

---

## 1. Stack Tecnológico del Proyecto

```
Frontend:     Next.js 14 (App Router, SSR)
Auth:         Google OAuth 2.0 + Iron Session (cookies cifradas)
DB:           Cloud Firestore (Firebase Admin SDK en servidor)
Hosting:      Firebase Hosting + Cloud Functions (SSR)
Integraciones: WordPress REST API, WooCommerce REST API v3,
               Google Search Console API, Google Analytics API,
               Gemini AI, OpenAI
```

---

## 2. Estructura de Firestore (Schema Canónico)

```
users/
  {uid}/
    settings/
      wordpress    → { apiUrl, username, appPassword, updatedAt }
      woocommerce  → { apiUrl, consumerKey, consumerSecret, updatedAt }
      ai           → { provider, apiKey, model, updatedAt }
    credits/
      balance      → { amount: number, updatedAt }

history/
  {autoId}/        → { userId, type, status, createdAt, wordpressPostId,
                       wordpressPostUrl, gscMetrics, improvementData, ... }

editorial/
  {uid}/
    map/
      {autoId}/    → { title, status, category, publishDate, ... }
```

**Regla de oro:** Todo dato de usuario vive bajo `users/{uid}/`. Los datos compartidos (como `history`) incluyen un campo `userId` para filtrar.

---

## 3. Arquitectura de Capas

```
┌────────────────────────────────────────────────────┐
│  Cliente (Next.js pages / components)              │
│  → fetch() a API routes internas                   │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│  API Routes (app/api/**/route.ts)                  │
│  → autentican sesión con Iron Session              │
│  → llaman a libs de servicio con userId            │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│  Service Libs (lib/*)                              │
│  lib/wordpress.ts    → WP REST API                 │
│  lib/woocommerce.ts  → WC REST API v3              │
│  lib/ai.ts           → Gemini / OpenAI             │
│  lib/gsc.ts          → Google Search Console       │
│  lib/firebase-admin.ts → Firestore (Admin SDK)     │
└────────────────────────────────────────────────────┘
```

**Invariante:** Las libs de servicio NUNCA leen la sesión directamente. Reciben el `userId` como parámetro inyectado por el API route.

---

## 4. Patrones Mandatorios

### API Route estándar
```ts
export async function GET(req: NextRequest) {
  // 1. Auth
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.user?.uid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  // 2. Lógica → pasar uid a the service lib
  const data = await myServiceFunction(session.user.uid, ...params)
  // 3. Respuesta consistente
  return NextResponse.json({ success: true, data })
}
```

### Service lib con config por usuario
```ts
async function getConfig(userId?: string): Promise<Config> {
  if (userId) {
    const db = getAdminFirestore()
    const snap = await db.collection('users').doc(userId)
      .collection('settings').doc('service').get()
    if (snap.exists) return snap.data() as Config
  }
  // Fallback a env vars
  return { key: process.env.SERVICE_KEY! }
}
```

---

## 5. Reglas de Evolución del Sistema

### Al agregar un nuevo servicio externo:
1. Crear `lib/{servicio}.ts` con `getConfig(userId?)` y fallback a `.env`
2. Crear `app/api/settings/{servicio}/route.ts` usando Admin SDK
3. Guardar en Firestore bajo `users/{uid}/settings/{servicio}`
4. Agregar sección en `app/dashboard/settings/page.tsx`

### Al agregar un nuevo módulo de dashboard:
1. Ruta en `app/dashboard/{modulo}/page.tsx`
2. Sidebar entry en `components/layout/Sidebar.tsx`
3. Color asignado del design system
4. API routes bajo `app/api/{modulo}/`

### Al agregar campos a documentos de Firestore:
- Usar `{ merge: true }` en `.set()` para no sobreescribir campos existentes
- Siempre incluir `updatedAt: new Date().toISOString()`
- Documentar el nuevo schema en este archivo (sección 2)

---

## 6. Decisiones de Arquitectura Tomadas

| Decisión | Razón |
|----------|-------|
| Iron Session en lugar de Firebase Auth para sesión | Permite guardar Google OAuth tokens + GSC tokens en una sola cookie cifrada |
| Admin SDK en API routes, client SDK en browser | API routes corren en Cloud Functions (servidor), no en el browser |
| Fallback a env vars si no hay config en Firestore | Permite tener credenciales globales para demos/desarrollo sin config por usuario |
| `history` collection sin nesting bajo `users/` | Permite queries cross-user por admin sin necesitar conocer el uid de antemano |

---

## 7. Lo que NO está permitido

- ❌ Hacer llamadas a Firestore desde componentes del cliente (`'use client'`) directamente
- ❌ Exponer API keys o Application Passwords en responses al cliente
- ❌ Operaciones de escritura en Firestore sin validar sesión primero
- ❌ Usar el client SDK de Firebase en código que corre en el servidor
- ❌ Guardar tokens de Google en Firestore (solo en Iron Session cifrada)
