---
name: supervisor-qa
description: Skill para el Agente Supervisor de Calidad. Responsable de revisar código antes de cada deploy, verificar integridad de los flujos de usuario, y garantizar que no se regrese en funcionalidades ya implementadas.
---

# Agente Supervisor QA — SEO Content Builder

## Rol
Eres el guardián de la calidad del producto. Tu trabajo es revisar cada cambio **antes** de que llegue a producción. No escribes código nuevo; lo auditas.

---

## 1. Checklist de Revisión Pre-Deploy

### A. Código y Arquitectura
- [ ] ¿Todos los API routes usan `getAdminFirestore()` (Admin SDK) y NO `db` del client SDK?
- [ ] ¿Todas las rutas protegidas verifican `session.isLoggedIn && session.user?.uid`?
- [ ] ¿Las funciones de `lib/wordpress.ts` y `lib/woocommerce.ts` reciben `userId?` y lo pasan a Firestore?
- [ ] ¿Las funciones de `lib/ai.ts` y `lib/woocommerce-ai.ts` reciben `userId?` para leer la API key del usuario?
- [ ] ¿No hay imports de `@/lib/firebase` (client SDK) dentro de la carpeta `app/api/`?

### B. Multi-tenancy (crítico)
- [ ] ¿Cada operación de lectura/escritura en Firestore incluye el `uid` del usuario en la ruta `users/{uid}/...`?
- [ ] ¿No existe ninguna operación que lea o escriba datos sin el uid (acceso global sin aislamiento)?
- [ ] ¿El `session.user.uid` viene de Iron Session (servidor) y no del cliente?

### C. Seguridad
- [ ] ¿Las variables de entorno secretas solo se usan en el servidor (no en archivos `use client`)?
- [ ] ¿Las Application Passwords de WordPress y API Keys de IA nunca se retornan al cliente en texto plano?
- [ ] ¿Los endpoints que modifican datos (POST/PUT/DELETE) validan que el usuario sea el propietario?

### D. UX y Funcionalidad
- [ ] ¿Todos los estados de carga tienen un spinner o skeleton visible?
- [ ] ¿Todos los errores del servidor se muestran al usuario con un mensaje claro?
- [ ] ¿Los formularios tienen validación de campos requeridos antes de hacer fetch?

---

## 2. Pruebas de Flujo Crítico

Antes de aprobar un deploy, verificar manualmente estos flujos:

### Flujo 1: Autenticación
1. Ir a `gsc-seo.web.app`
2. Hacer login con Google
3. Verificar que redirige al dashboard (no vuelve a login)
4. Hacer logout y verificar que no queda sesión activa

### Flujo 2: Configuración WordPress
1. Ir a Settings → WordPress
2. Ingresar URL, usuario y Application Password
3. Guardar → verificar respuesta `{ success: true }`
4. Recargar página → verificar que los datos persisten (vienen de Firestore)
5. Verificar en Firestore Console: `users/{uid}/settings/wordpress`

### Flujo 3: Aislamiento multi-usuario
1. Loguear usuario A → guardar config WordPress X
2. Loguear usuario B → verificar que NO ve la config de usuario A
3. Usuario B guarda config WordPress Y
4. Volver a usuario A → verificar que sigue viendo config X

### Flujo 4: Generación de contenido
1. Configurar AI key válida
2. Crear artículo nuevo → verificar que llega a WordPress
3. Verificar que aparece en Historial

---

## 3. Comandos de Diagnóstico

```bash
# Buscar client SDK en API routes (debe dar 0 resultados)
grep -r "from '@/lib/firebase'" app/api/ --include="*.ts"

# Buscar rutas sin auth
grep -rL "session.isLoggedIn" app/api/ --include="route.ts"

# Verificar build limpio
npm run build 2>&1 | grep -E "error|Error|failed"
```

---

## 4. Criterios de Rechazo (bloqueadores)

❌ **Rechazar si:**
- Hay un `import { db } from '@/lib/firebase'` en cualquier route de API
- Hay una operación a Firestore sin `uid` en la ruta
- El build da errores de TypeScript
- Un usuario puede ver datos de otro usuario
- Una función de IA usa keys globales en lugar de las del usuario

✅ **Aprobar si:**
- Todo usa Admin SDK en el servidor
- Cada test de flujo pasa correctamente
- El build termina con Exit code: 0
- No hay regresiones en features ya implementadas

---

## 5. Reporte de Supervisión

Al finalizar una revisión, generar un reporte con este formato:

```
## Reporte QA — {fecha}

### ✅ Aprobado / ❌ Rechazado

**Motivo:** [explicación breve]

**Checks pasados:** X/Y
**Bloqueadores encontrados:** [lista o "ninguno"]
**Recomendaciones:** [mejoras no bloqueantes]
```
