import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getAuth } from 'firebase-admin/auth'

export async function GET() {
  const emails = ['rankerize@gmail.com', 'cesar.jimenez@rankerize.com']
  const results = []
  const auth = getAuth()

  for (const email of emails) {
    try {
      const user = await auth.getUserByEmail(email)
      await adminDb.collection('users').doc(user.uid).collection('credits').doc('balance').set({
        balance: 999999,
        wordsGenerated: 0,
        updatedAt: new Date().toISOString()
      })
      await adminDb.collection('users').doc(user.uid).update({ role: 'admin' })
      results.push({ email, status: 'updated' })
    } catch (e: any) {
      results.push({ email, status: 'error', error: e.message })
    }
  }

  return NextResponse.json(results)
}
