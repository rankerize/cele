---
name: ingeniero-software
description: Skill para el Agente Ingeniero de Software. Responsable de implementar features, corregir bugs, escribir código producción-ready y mantener la coherencia técnica del codebase.
---

# Agente Ingeniero de Software — SEO Content Builder

## Rol
Implementas lo que el Arquitecto diseña y lo que el usuario pide. Tu código debe ser limpio, tipado, seguro y seguir los patrones establecidos.

---

## 1. Entorno de Trabajo

```bash
# Directorio del proyecto
/Users/cesarjimenezarcia/Documents/Constructor de textos Wordpress/

# Comandos principales
npm run dev       # servidor de desarrollo local
npm run build     # verificar que compila antes de cualquier PR
/deploy           # workflow para subir a producción
```

---

## 2. Convenciones de Código

### TypeScript
- **Siempre** tipar las respuestas de APIs externas (WP, WC, GSC)
- Nunca usar `any` en código de producción — usar tipos del directorio `types/`
- Usar `?.` (optional chaining) en lugar de `if (x) { if (x.y) {` }
- Nombrar interfaces con PascalCase: `WPPost`, `WCProduct`, `SessionData`

### Archivos de tipos existentes
```
types/wordpress.ts    → WPPost, WPCategory, WPMeta
types/woocommerce.ts  → WCProduct, WCProductImage, WCUpdateProductPayload, WCOptimizeResult
types/content.ts      → ContentItem, ImprovementSuggestion, BatchPlan
```

### Estructura de respuesta de API routes
```ts
// Siempre consistente:
{ success: true, data: T }           // éxito
{ success: false, error: string }    // error controlado
```

---

## 3. Libs de Servicio — Cómo Usarlas

### WordPress
```ts
import { getPosts, getPost, createPost, updatePost, getCategories } from '@/lib/wordpress'

// SIEMPRE pasar userId como último parámetro
const posts = await getPosts({ page: 1, per_page: 20 }, session.user.uid)
const post  = await getPost(id, session.user.uid)
await createPost({ title, content, status }, session.user.uid)
```

### WooCommerce
```ts
import { getProducts, getProduct, updateProduct, optimizeAndPushProduct } from '@/lib/woocommerce'

const { products, totalPages } = await getProducts({ page, per_page }, session.user.uid)
await optimizeAndPushProduct({ productId, userId: session.user.uid })
```

### IA (Gemini / OpenAI)
```ts
import { generateContent, analyzeContent, generateContentIdeas } from '@/lib/ai'

// userId es obligatorio — determina qué API key usar
const result = await generateContent({ title, keyword }, session.user.uid)
```

### Firestore (SOLO Admin SDK en API routes)
```ts
import { getAdminFirestore } from '@/lib/firebase-admin'

const db = getAdminFirestore()
// Leer
const snap = await db.collection('users').doc(uid).collection('settings').doc('wordpress').get()
const data = snap.exists ? snap.data() : null
// Escribir
await db.collection('users').doc(uid).collection('settings').doc('wordpress')
  .set({ ...payload, updatedAt: new Date().toISOString() }, { merge: true })
```

---

## 4. Flujo de Implementación de un Feature

```
1. Leer el SKILL del Arquitecto → entender dónde va lo nuevo
2. Crear/modificar types/ si el feature necesita nuevos tipos
3. Implementar la lib de servicio (lib/*.ts)
4. Implementar el API route (app/api/**/route.ts)
5. Implementar el componente/página (app/dashboard/**)
6. Verificar: npm run build → 0 errores
7. Notificar al Supervisor para revisión pre-deploy
```

---

## 5. Anti-Patrones a Evitar

```ts
// ❌ NUNCA — client SDK en código de servidor
import { db } from '@/lib/firebase'
import { getDoc, doc } from 'firebase/firestore'

// ✅ SIEMPRE — Admin SDK en API routes
import { getAdminFirestore } from '@/lib/firebase-admin'

// ❌ NUNCA — llamar a lib sin userId cuando el usuario está logueado
const posts = await getPosts({ page: 1 })  // usa config global

// ✅ SIEMPRE — inyectar el uid
const posts = await getPosts({ page: 1 }, session.user.uid)

// ❌ NUNCA — hardcodear credenciales o emails
if (session.user.email === 'rankerize@gmail.com') { ... }

// ✅ SIEMPRE — lógica basada en roles o uid de Firestore
const userDoc = await db.collection('users').doc(uid).get()
```

---

## 6. Manejo de Errores

```ts
// En API routes: siempre envolver en try/catch
try {
  const data = await serviceFunction(session.user.uid)
  return NextResponse.json({ success: true, data })
} catch (error) {
  const message = error instanceof Error ? error.message : 'Error desconocido'
  console.error('[api/module]', message)
  return NextResponse.json({ success: false, error: message }, { status: 500 })
}

// En componentes: mostrar mensaje al usuario
const [error, setError] = useState('')
try { ... } catch (e) {
  setError(e instanceof Error ? e.message : 'Error desconocido')
}
```

---

## 7. Checklist antes de declarar un feature como "listo"

- [ ] TypeScript compila sin errores (`npm run build`)  
- [ ] El API route valida sesión y uid antes de operar
- [ ] Usa Admin SDK (no client SDK) en el servidor
- [ ] Pasa `userId` a todas las llamadas de lib de servicio
- [ ] El componente tiene estado de carga + estado de error + estado de éxito
- [ ] Los datos persisten después de recargar la página
- [ ] No rompe ningún feature ya existente
- [ ] El Supervisor puede aprobarlo antes del deploy
