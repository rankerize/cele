/**
 * Script: create-admin-user.mjs
 * Crea el usuario administrador en Firebase Auth y le asigna 5000 créditos en Firestore.
 * 
 * Uso: node scripts/create-admin-user.mjs
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Configuración admin ───────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'cesar.jimenez@rankerize.com'
const ADMIN_PASSWORD = 'Celeste.01'
const ADMIN_CREDITS  = 5000
const PROJECT_ID     = 'bienestar-integral-545e7'

// ── Inicializar Firebase Admin ────────────────────────────────────────────────
let app
if (getApps().length === 0) {
  // Intenta con service account si existe
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (saPath) {
    try {
      const require = createRequire(import.meta.url)
      const serviceAccount = require(saPath)
      app = initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID })
      console.log('✅ Firebase Admin iniciado con Service Account')
    } catch {
      app = initializeApp({ projectId: PROJECT_ID })
      console.log('⚠️  Firebase Admin iniciado con Application Default Credentials')
    }
  } else {
    app = initializeApp({ projectId: PROJECT_ID })
    console.log('⚠️  Firebase Admin iniciado con Application Default Credentials (ADC)')
  }
}

const auth = getAuth()
const db   = getFirestore()

async function run() {
  console.log('\n🚀 Creando usuario administrador...\n')

  // ── 1. Crear usuario en Firebase Auth ────────────────────────────────────
  let uid
  try {
    // Verificar si ya existe
    const existing = await auth.getUserByEmail(ADMIN_EMAIL)
    uid = existing.uid
    console.log(`ℹ️  El usuario ya existe en Firebase Auth`)
    console.log(`   Email: ${existing.email}`)
    console.log(`   UID: ${uid}`)

    // Actualizar contraseña de todas formas
    await auth.updateUser(uid, { password: ADMIN_PASSWORD })
    console.log(`✅ Contraseña actualizada a: ${ADMIN_PASSWORD}`)

  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      // Crear usuario nuevo
      const newUser = await auth.createUser({
        email:         ADMIN_EMAIL,
        password:      ADMIN_PASSWORD,
        displayName:   'César Jiménez',
        emailVerified: true,
      })
      uid = newUser.uid
      console.log(`✅ Usuario creado exitosamente en Firebase Auth`)
      console.log(`   Email: ${ADMIN_EMAIL}`)
      console.log(`   UID: ${uid}`)
    } else {
      throw err
    }
  }

  // ── 2. Crear/actualizar documento en Firestore ────────────────────────────
  const userRef = db.collection('users').doc(uid)
  await userRef.set({
    uid,
    email:       ADMIN_EMAIL,
    displayName: 'César Jiménez',
    role:        'admin',
    credits:     ADMIN_CREDITS,
    activeModules: ['seo', 'ads'],
    adminSince:  new Date().toISOString(),
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  }, { merge: true })

  console.log(`\n✅ Documento Firestore creado/actualizado`)
  console.log(`   Colección: users/${uid}`)
  console.log(`   Créditos: ${ADMIN_CREDITS}`)
  console.log(`   Role: admin`)
  console.log(`   Módulos: seo, ads`)

  // ── 3. Verificar que los otros usuarios tienen 0 créditos ─────────────────
  const allUsers = await db.collection('users').get()
  console.log(`\n📋 Estado de créditos de todos los usuarios:`)
  for (const doc of allUsers.docs) {
    const data = doc.data()
    const isAdmin = doc.id === uid
    const credits = data.credits ?? 0
    console.log(`   ${isAdmin ? '👑' : '👤'} ${data.email || doc.id} → ${credits} créditos ${isAdmin ? '(ADMIN)' : ''}`)
  }

  console.log(`\n🎉 ¡Todo listo!`)
  console.log(`   ┌───────────────────────────────────────┐`)
  console.log(`   │  Usuario Admin: ${ADMIN_EMAIL}   │`)
  console.log(`   │  Password: ${ADMIN_PASSWORD}                  │`)
  console.log(`   │  Créditos: ${ADMIN_CREDITS} tokens             │`)
  console.log(`   │  UID: ${uid.slice(0, 20)}...        │`)
  console.log(`   └───────────────────────────────────────┘`)
  console.log(`\n  ⚠️  Guarda el UID del admin para futuras referencias.`)
}

run().catch(err => {
  console.error('\n❌ Error:', err.message)
  if (err.code) console.error('   Código:', err.code)
  process.exit(1)
})
