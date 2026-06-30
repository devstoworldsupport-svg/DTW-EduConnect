// src/pages/student/Library.jsx
import { useState, useEffect } from 'react'
import { BookOpen, Download, Search, FileText, ExternalLink } from 'lucide-react'
import { subscribeLibrary, subscribeStudentWorksheets } from '@/services/index'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader, SearchBar, SectionCard, EmptyState, Tabs } from '@/components/common'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'

const TYPE_COLORS = {
  worksheet: 'bg-blue-500/10 text-blue-400',
  exercise: 'bg-purple-500/10 text-purple-400',
  test: 'bg-amber-500/10 text-amber-400',
  material: 'bg-emerald-500/10 text-emerald-400',
  book: 'bg-pink-500/10 text-pink-400',
}
const TYPE_LABELS = { worksheet: 'Ficha', exercise: 'Exercício', test: 'Teste', material: 'Material', book: 'Livro' }
const TYPE_ICONS = { worksheet: '📄', exercise: '✏️', test: '📝', material: '📚', book: '📗' }

export default function LibraryPage() {
  const { profile } = useAuth()
  const [library, setLibrary] = useState([])
  const [worksheets, setWorksheets] = useState([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('worksheets')

  useEffect(() => {
    const u1 = subscribeLibrary(setLibrary)
    const u2 = profile?.classroomId
      ? subscribeStudentWorksheets(profile.classroomId, setWorksheets)
      : () => {}
    return () => { u1(); u2() }
  }, [profile])

  const items = tab === 'library' ? library : worksheets
  const filtered = items.filter((i) => {
    if (!search) return true
    const q = search.toLowerCase()
    return i.title?.toLowerCase().includes(q) || i.subject?.toLowerCase().includes(q)
  })

  const timeAgo = (ts) => { try { return formatDistanceToNow(ts.toDate(), { locale: pt, addSuffix: true }) } catch { return '' } }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Biblioteca Digital" subtitle="Fichas, exercícios e materiais de estudo" />
      <div className="flex gap-3">
        <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Pesquisar materiais..." /></div>
      </div>
      <Tabs
        tabs={[{ key: 'worksheets', label: 'Fichas e Exercícios' }, { key: 'library', label: 'Biblioteca' }]}
        active={tab}
        onChange={setTab}
      />

      {filtered.length === 0 ? (
        <SectionCard>
          <EmptyState icon={BookOpen} title="Sem materiais disponíveis" description="Os professores ainda não publicaram materiais para a sua turma" />
        </SectionCard>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="card p-4 hover:border-white/20 transition-all group">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${TYPE_COLORS[item.type] || 'bg-white/10 text-white/40'}`}>
                  {TYPE_ICONS[item.type] || '📄'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[item.type] || ''}`}>{TYPE_LABELS[item.type] || item.type}</span>
                    {item.subject && <span className="text-[10px] text-white/30">{item.subject}</span>}
                  </div>
                  {item.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{item.description}</p>}
                  <div className="text-[11px] text-white/20 mt-1.5">{timeAgo(item.createdAt)}</div>
                </div>
              </div>
              {item.fileUrl && (
                <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary btn-sm flex-1 text-center"
                  >
                    <ExternalLink size={13} /> Abrir
                  </a>
                  <a
                    href={item.fileUrl}
                    download
                    className="btn-secondary btn-sm"
                  >
                    <Download size={13} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
