// src/pages/teacher/Worksheets.jsx
import { useState, useEffect } from 'react'
import { Plus, FileText, Trash2, Download, BookOpen } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { subscribeWorksheets, createWorksheet, deleteWorksheet } from '@/services/index'
import { PageHeader, SectionCard, Modal, FormField, Select, SearchBar, EmptyState, Tabs } from '@/components/common'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'

const TYPES = [{ value: 'worksheet', label: 'Ficha' }, { value: 'exercise', label: 'Exercício' }, { value: 'test', label: 'Teste' }, { value: 'material', label: 'Material' }]
const EMPTY = { title: '', subject: '', type: 'worksheet', description: '', classroomIds: [] }

export default function WorksheetsPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const u = subscribeWorksheets(profile?.uid, setItems)
    getDocs(query(collection(db, 'classrooms'), where('teacherIds', 'array-contains', profile?.uid || '__'))).then((s) => setClassrooms(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return u
  }, [profile])

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    const matchSearch = !q || i.title?.toLowerCase().includes(q) || i.subject?.toLowerCase().includes(q)
    const matchTab = tab === 'all' || i.type === tab
    return matchSearch && matchTab
  })

  const handleSave = async () => {
    if (!form.title || !form.subject) return toast.error('Título e disciplina são obrigatórios')
    setSaving(true)
    try {
      await createWorksheet({ ...form, teacherId: profile?.uid, teacherName: profile?.displayName }, file)
      toast.success('Publicado com sucesso!')
      setModalOpen(false); setForm(EMPTY); setFile(null)
    } catch { toast.error('Erro ao publicar') }
    setSaving(false)
  }

  const handleDelete = async (id) => { await deleteWorksheet(id); toast.success('Removido') }

  const toggleClassroom = (id) => setForm((p) => ({ ...p, classroomIds: p.classroomIds.includes(id) ? p.classroomIds.filter((x) => x !== id) : [...p.classroomIds, id] }))
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  const timeAgo = (ts) => { try { return formatDistanceToNow(ts.toDate(), { locale: pt, addSuffix: true }) } catch { return '' } }
  const typeIcon = { worksheet: '📄', exercise: '✏️', test: '📝', material: '📚' }
  const typeBadge = { worksheet: 'badge-blue', exercise: 'badge-purple', test: 'badge-amber', material: 'badge-green' }
  const typeLabel = { worksheet: 'Ficha', exercise: 'Exercício', test: 'Teste', material: 'Material' }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Fichas e Exercícios" subtitle="Publique materiais para os alunos" action={
        <button onClick={() => setModalOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Publicar</button>
      } />
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48"><SearchBar value={search} onChange={setSearch} placeholder="Pesquisar materiais..." /></div>
      </div>
      <Tabs tabs={[{key:'all',label:'Todos'},{key:'worksheet',label:'Fichas'},{key:'exercise',label:'Exercícios'},{key:'test',label:'Testes'},{key:'material',label:'Materiais'}]} active={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <SectionCard><EmptyState icon={BookOpen} title="Nenhum material publicado" description="Publique fichas e exercícios para os seus alunos" action={<button onClick={() => setModalOpen(true)} className="btn-primary btn-sm mx-auto flex"><Plus size={14}/>Publicar</button>} /></SectionCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="card p-4 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="text-2xl">{typeIcon[item.type] || '📄'}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={typeBadge[item.type] || 'badge-gray'}>{typeLabel[item.type] || item.type}</span>
                      <span className="text-xs text-white/30">{item.subject}</span>
                    </div>
                    {item.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{item.description}</p>}
                    <div className="text-[11px] text-white/25 mt-1">{timeAgo(item.createdAt)}</div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noreferrer" className="btn-icon text-white/30 hover:text-brand"><Download size={15} /></a>}
                  <button onClick={() => handleDelete(item.id)} className="btn-icon text-white/30 hover:text-red-400"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Publicar Material" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Título *"><input value={form.title} onChange={(e) => f('title')(e.target.value)} className="input" placeholder="Título do material" /></FormField>
            <FormField label="Disciplina *"><input value={form.subject} onChange={(e) => f('subject')(e.target.value)} className="input" placeholder="Ex: Matemática" /></FormField>
            <FormField label="Tipo"><Select value={form.type} onChange={f('type')} options={TYPES} /></FormField>
          </div>
          <FormField label="Descrição"><textarea value={form.description} onChange={(e) => f('description')(e.target.value)} className="input h-20 resize-none" placeholder="Descrição opcional..." /></FormField>
          <FormField label="Destino — Turmas">
            <div className="flex gap-2 flex-wrap mt-1">
              {classrooms.map((c) => (
                <button key={c.id} type="button" onClick={() => toggleClassroom(c.id)} className={`px-2.5 py-1 rounded-md text-xs border transition-all ${form.classroomIds.includes(c.id) ? 'bg-brand/20 border-brand text-brand' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}>
                  {c.className} {c.name}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Ficheiro (PDF ou imagem)">
            <label className="flex items-center gap-2 btn-secondary btn-sm cursor-pointer w-fit">
              <FileText size={14} /> {file ? file.name : 'Escolher ficheiro'}
              <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-white/10">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'A publicar...' : 'Publicar'}</button>
        </div>
      </Modal>
    </div>
  )
}
