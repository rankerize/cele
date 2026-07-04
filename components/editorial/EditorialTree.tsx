import { EditorialMapItem } from '@/types/content'
import { FolderTree, FileText } from 'lucide-react'

interface Props {
  data: EditorialMapItem[]
}

export default function EditorialTree({ data }: Props) {
  // agrupar por categoría
  const byCategory = data.reduce((acc, item) => {
    const cat = item.categoria || 'Sin categoría'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, EditorialMapItem[]>)

  return (
    <div className="p-4 space-y-6">
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} className="space-y-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-brand-400" />
            <h3 className="font-display text-lg font-semibold text-white">{cat}</h3>
            <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full">
              {items.length} items
            </span>
          </div>
          
          <div className="pl-6 space-y-2 border-l border-slate-200 ml-2.5">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50/50 transition-colors group">
                <FileText className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.slug}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-brand-400/80 font-medium">
                    {item.keywordPrincipal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {data.length === 0 && (
        <div className="text-center text-slate-500 py-10">
          No hay posts para mostrar en el grafo
        </div>
      )}
    </div>
  )
}
