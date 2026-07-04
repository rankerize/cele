import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  // Si hay un Service Account JSON configurado (producción / CI)
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (serviceAccountPath) {
    try {
      const fs = require('fs')
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    } catch (e) {
      console.warn('[FirebaseAdmin] No se pudo cargar GOOGLE_APPLICATION_CREDENTIALS, usando projectId:', e)
    }
  }

  // Modo desarrollo: solo projectId — usa Application Default Credentials del sistema
  // o las reglas de Firestore configuradas para permitir acceso autenticado.
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

export function getAdminFirestore() {
  const app = getAdminApp()
  return getFirestore(app)
}

// Alias directo para uso en servicios
export const adminDb = getAdminFirestore()

export async function checkUserWallet(userId: string): Promise<boolean> {
  try {
    const db = getAdminFirestore()
    const doc = await db.collection('users').doc(userId).collection('credits').doc('balance').get()
    if (!doc.exists) return false
    const data = doc.data()
    return data?.balance > 0
  } catch (err) {
    console.error('Error checking wallet', err)
    return false
  }
}
