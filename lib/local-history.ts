import fs from 'fs'
import path from 'path'
import { ContentItem } from '@/types/content'

const DATA_FILE = path.join(process.cwd(), '.history-data.json')

function readLocal(): ContentItem[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8')
      const parsed = JSON.parse(content)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (e) {
    console.error('[local-history] Error reading file:', e)
  }
  return []
}

function writeLocal(items: ContentItem[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8')
  } catch (e) {
    console.error('[local-history] Error writing file:', e)
  }
}

export function getLocalHistory(): ContentItem[] {
  const items = readLocal()
  return items.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 100)
}

export function upsertLocalHistory(item: Partial<ContentItem>): ContentItem | null {
  if (!item.id) return null
  const items = readLocal()
  const idx = items.findIndex(i => i.id === item.id)
  const now = new Date().toISOString()

  if (idx >= 0) {
    items[idx] = { ...items[idx], ...item, updatedAt: now } as ContentItem
  } else {
    items.unshift({ ...item, createdAt: item.createdAt || now, updatedAt: now } as ContentItem)
  }

  writeLocal(items)
  return idx >= 0 ? items[idx] : items[0]
}

export function deleteLocalHistoryItem(id: string): boolean {
  const items = readLocal()
  const filtered = items.filter(i => i.id !== id)
  if (filtered.length === items.length) return false
  writeLocal(filtered)
  return true
}
