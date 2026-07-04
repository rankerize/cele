---
description: Deploy the GSC SEO app to Firebase Hosting (gsc-seo.web.app)
---

# Deploy a Firebase Hosting

Sigue estos pasos en orden estricto. **No avances si el paso anterior falla.**

---

## Paso 0 — Auditoría del Supervisor QA (OBLIGATORIO)

Antes de cualquier build, activa el skill del Supervisor leyendo su archivo:
`.agents/skills/supervisor/SKILL.md`

Ejecuta los siguientes comandos de diagnóstico automáticamente:

```bash
# 1. Detectar client SDK en API routes (debe dar 0 resultados)
grep -r "from '@/lib/firebase'" app/api/ --include="*.ts" -l
```

```bash
# 2. Detectar rutas API sin verificación de sesión
grep -rL "session.isLoggedIn" app/api/ --include="route.ts"
```

```bash
# 3. Detectar operaciones a Firestore sin uid en la ruta
grep -rn "collection('users').doc()" app/api/ --include="*.ts"
```

**Evalúa los resultados:**
- Si el Paso 1 da resultados → **DETENER**. Hay client SDK en el servidor. Corregir antes de continuar.
- Si el Paso 2 da resultados → **ADVERTIR** al usuario con la lista de rutas sin auth.
- Si el Paso 3 da resultados sospechosos → **ADVERTIR** al usuario.

Genera un mini-reporte antes de continuar:
```
🔍 Reporte Supervisor Pre-Deploy
✅ Client SDK en API routes: [OK / N archivos con problema]
✅ Rutas sin auth: [OK / lista]
✅ Firestore sin uid: [OK / revisar]
→ Estado: APROBADO / BLOQUEADO
```

Si el estado es **BLOQUEADO** → detente y muestra los archivos problemáticos al usuario.
Si el estado es **APROBADO** → continúa al Paso 1.

---

## Paso 1 — Build de producción

// turbo
Ejecuta el build de Next.js y captura la salida completa:

```
npm run build 2>&1
```

- Si el build termina con **Exit code: 0** → continúa al Paso 2.
- Si hay **errores de TypeScript o compilación** → muéstraselos al usuario de inmediato y **detente**. NO hagas el deploy.

---

## Paso 2 — Deploy a Firebase Hosting

Ejecuta el deploy usando npx para no depender de firebase-tools global:

```
npx firebase-tools deploy --only hosting:gsc-seo
```

- Si pide confirmación `(y)` para instalar firebase-tools → responde `y` automáticamente.
- Espera a que aparezca la línea `Hosting URL:` o `Deploy complete!` para confirmar éxito.
- Si falla con error de autenticación → informa al usuario que debe hacer login con `npx firebase-tools login`.

---

## Paso 3 — Confirmación final

Cuando el deploy termine correctamente, informa al usuario con este formato:

```
🚀 Deploy completado — {fecha y hora}

✅ URL de producción: https://gsc-seo.web.app
✅ Supervisor QA: Aprobado
✅ Build: Sin errores

📦 Cambios incluidos en este deploy:
{lista de archivos modificados desde el commit anterior}

⚠️ Recomendaciones post-deploy:
- Verifica login en producción con una cuenta real
- Prueba guardar configuración WordPress en Settings
- Revisa Firebase Console → Functions para detectar errores en caliente
```
