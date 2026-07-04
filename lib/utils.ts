import { type ClassValue, clsx } from 'clsx'
import { ContentItem } from '@/types/content'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// History functions using server-side API
export async function getHistory(): Promise<ContentItem[]> {
  try {
    const res = await fetch('/api/history')
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    return json.data
  } catch (error) {
    console.error('Error fetching history:', error)
    return []
  }
}

export async function saveToHistory(item: ContentItem): Promise<boolean> {
  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    const json = await res.json()
    return json.success
  } catch (error) {
    console.error('Error saving history:', error)
    return false
  }
}

export async function updateHistoryItem(id: string, updates: Partial<ContentItem>): Promise<boolean> {
  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    const json = await res.json()
    return json.success
  } catch (error) {
    console.error('Error updating history:', error)
    return false
  }
}

