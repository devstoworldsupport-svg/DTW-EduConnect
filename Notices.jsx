// src/pages/direction/Notices.jsx
import { useState, useEffect } from 'react'
import { Plus, Bell, Paperclip, Trash2, Eye, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createNotice, subscribeNotices, markNoticeRead } from '@/services/notices'
import { subscribeClasses, subscribeClassrooms } from '@/services/index'
import { PageHeader, SearchBar, Modal, ConfirmDialog, FormField, Select, SectionCard, StatusBadge, EmptyState } from '@/components/common'
import { deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'

const PRIORITIES = [{ value: 'normal', label: 'Normal' }, { value: 'important', label: 'Importante' }, { value: 'urgent', label: 'Urgente' }]
const TARGETS = [
  { value: 'all', label: 'Toda a escola' },
  { value: 'primary', label: 'Ensino Primário (1ª–7ª)' },
  { value: 'secondary', label: 'Ensino Secundário (8ª–12ª)' },
  { value: 'teachers', label: 'Professores' },
  { value: 'students', label: 'Alunos' },
  { value: 'parents', label: 'Encarregados' },
  { value: 'class', label: 'Classe específica' },
  { value: 'classroom', label: 'Turma específica' },
]

const EMPTY_FORM = { title: '', description: '', priority: 'normal', target: 'all', targetId: '' }

const PrioIcon = ({ p }) => {
  if (p === 'urgent') return <AlertTriangle size={14} className="text-red-400" />
  if (p === 'important') return <AlertCircle size={14} className="text-amber-400" />
  return <Info size={14} className="text-white/30" />
}

export default function NoticesPage() {
  const { profile } = useAuth()
  const [notices, setNotices] = useState([])
  const [classes, setClasses] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [search, setSearch] = useState('')
  const [filterPrio, setFilterPrio] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewNotice, setViewNotice] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [attachments, setAttachments] = useState([])
  const [saving, setSaving] = useState(false)
  const canCreate = ['direction', 'teacher'].includes(profile?.role)

  useEffect(() => {
    const u1 = subscribeNotices({ role: profile?.role, classId: profile?.classId, classroomId: profile?.classroomId }, setNotices)
    const u2 = subscribeClasses(setClasses)
    const u3 = subscribeClassrooms(null, setClassrooms)
    return () => { u1(); u2(); u3() }
  }, [profile])

  const filtered = notices.filter((n) => {
    const q = search.toLowerCase()
    const matchSearch = !q || n.title?.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q)
    const matchPrio = !filterPrio || n.priority === filterPrio
    return matchSearch && matchPrio
  })

  const handleSave = async () => {
    if (!form.title || !form.description) return toast.error('Título e descrição são obrigatórios')
    setSaving(true)
    try {
      await createNotice({ ...form, authorId: profile.uid, authorName: profile.displayName }, attachments)
      toast.success('Aviso publicado com sucesso')
      setModalOpen(false)
      setForm(EMPTY_FORM)
      setAttachments([])
    } catch (e) { toast.error('Erro ao publicar aviso') }
    setSaving(false)
  }

  const handleDelete = async () => {
    await updateDoc(doc(db, 'notices', deleteTarget.id), { active: false })
    toast.success('Aviso removido')
    setDeleteTarget(null)
  }

  const timeAgo = (ts) => {
    if (!ts?.toDate) return ''
    try { return formatDistanceToNow(ts.toDate(), { locale: pt, addSuffix: true }) } catch { return '' }
  }

  const borderColor = (p) => p === 'urgent' ? 'border-red-400/60' : p === 'important' ? 'border-amber-400/60' : 'border-white/10'

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Avisos"
        subtitle={`${filtered.length} aviso${filtered.length !== 1 ? 's' : ''}`}
        action={canCreate && <button onClick={() => setModalOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Novo Aviso</button>}
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48"><SearchBar value={search} onChange={setSearch} placeholder="Pesquisar avisos..." /></div>
        <Select value={filterPrio} onChange={setFilterPrio} options={PRIORITIES} placeholder="Todas as prioridades" className="w-44" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <SectionCard><EmptyState icon={Bell} title="Sem avisos" description="Nenhum aviso encontrado" action={canCreate && <button onClick={() => setModalOpen(true)} className="btn-primary btn-sm mx-auto flex"><Plus size={14} />Criar aviso</button>} /></SectionCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div key={n.id} className={`card p-4 border-l-4 ${borderColor(n.priority)} hover:border-opacity-100 transition-colors`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><PrioIcon p={n.priority} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <StatusBadge status={n.priority} />
                    </div>
                  </div>
                  <p className="text-sm text-white/50 mt-1 line-clamp-2">{n.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-white/25">
                    <span>{TARGETS.find((t) => t.value === n.target)?.label || n.target}</span>
                    <span>·</span>
                    <span>{n.authorName || 'Escola'}</span>
                    <span>·</span>
                    <span>{timeAgo(n.createdAt)}</span>
                    {n.attachments?.length > 0 && <><span>·</span><span className="flex items-center gap-0.5"><Paperclip size={10} />{n.attachments.length} anexo{n.attachments.length > 1 ? 's' : ''}</span></>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setViewNotice(n)} className="btn-icon text-white/30 hover:text-brand"><Eye size={15} /></button>
                  {canCreate && <button onClick={() => setDeleteTarget(n)} className="btn-icon text-white/30 hover:text-red-400"><Trash2 size={15} /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Aviso" size="lg">
        <div className="space-y-4">
          <FormField label="Título *">
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input" placeholder="Título do aviso" />
          </FormField>
          <FormField label="Descrição *">
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="input h-28 resize-none" placeholder="Mensagem do aviso..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioridade">
              <Select value={form.priority} onChange={(v) => setForm((p) => ({ ...p, priority: v }))} options={PRIORITIES} />
            </FormField>
            <FormField label="Destino">
              <Select value={form.target} onChange={(v) => setForm((p) => ({ ...p, target: v, targetId: '' }))} options={TARGETS} />
            </FormField>
          </div>
          {form.target === 'class' && (
            <FormField label="Classe">
              <Select value={form.targetId} onChange={(v) => setForm((p) => ({ ...p, targetId: v }))} options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Seleccionar classe" />
            </FormField>
          )}
          {form.target === 'classroom' && (
            <FormField label="Turma">
              <Select value={form.targetId} onChange={(v) => setForm((p) => ({ ...p, targetId: v }))} options={classrooms.map((c) => ({ value: c.id, label: `${c.className} · ${c.name}` }))} placeholder="Seleccionar turma" />
            </FormField>
          )}
          <FormField label="Anexos (opcional)">
            <label className="flex items-center gap-2 btn-secondary btn-sm cursor-pointer w-fit">
              <Paperclip size={14} /> Adicionar ficheiros
              <input type="file" multiple className="hidden" onChange={(e) => setAttachments(Array.from(e.target.files))} />
            </label>
            {attachments.length > 0 && <div className="mt-2 space-y-1">{attachments.map((f, i) => <div key={i} className="text-xs text-white/50 flex items-center gap-1"><Paperclip size={10} />{f.name}</div>)}</div>}
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-white/10">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'A publicar...' : 'Publicar Aviso'}</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewNotice} onClose={() => setViewNotice(null)} title="Detalhe do Aviso">
        {viewNotice && (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><PrioIcon p={viewNotice.priority} /><StatusBadge status={viewNotice.priority} /></div>
            <h3 className="text-base font-semibold text-white">{viewNotice.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{viewNotice.description}</p>
            <div className="border-t border-white/10 pt-3 space-y-1 text-xs text-white/30">
              <div>Destino: {TARGETS.find((t) => t.value === viewNotice.target)?.label}</div>
              <div>Autor: {viewNotice.authorName}</div>
              <div>Data: {timeAgo(viewNotice.createdAt)}</div>
            </div>
            {viewNotice.attachments?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-white/40 font-medium">Anexos:</p>
                {viewNotice.attachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-brand hover:underline"><Paperclip size={11} />Ficheiro {i + 1}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remover Aviso" message={`Remover o aviso "${deleteTarget?.title}"?`} danger />
    </div>
  )
}
