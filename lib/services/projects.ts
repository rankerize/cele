import { adminDb } from '@/lib/firebase-admin'

export interface Project {
  id: string
  userId: string
  name: string
  domain: string
  country?: string | null
  cms?: 'wordpress' | 'shopify' | 'woocommerce' | 'other' | null
  primaryGoal?: string | null
  gscSiteUrl: string | null
  gaPropertyId?: string | null
  // WordPress
  wpUrl: string | null
  wpUsername?: string
  wpAppPassword?: string
  // AI Config
  aiProvider?: 'openai' | 'google' | 'anthropic'
  aiApiKey?: string
  aiModel?: string
  createdAt: number
}

const COLLECTION = 'projects'

export async function createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  const docRef = adminDb.collection(COLLECTION).doc()
  const project: Project = {
    ...data,
    id: docRef.id,
    createdAt: Date.now()
  }
  await docRef.set(project)
  return project
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const doc = await adminDb.collection(COLLECTION).doc(projectId).get()
  if (!doc.exists) return null
  return doc.data() as Project
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const snap = await adminDb.collection(COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get()
  
  return snap.docs.map(doc => doc.data() as Project)
}

export async function updateProject(projectId: string, data: Partial<Project>): Promise<void> {
  await adminDb.collection(COLLECTION).doc(projectId).update(data)
}

export async function deleteProject(projectId: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(projectId).delete()
}
