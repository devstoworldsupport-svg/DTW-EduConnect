// src/pages/direction/Teachers.jsx
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react'
import { subscribeTeachers, createTeacher, updateTeacher, deleteTeacher } from '@/services/index'
import { PageHeader, SearchBar, DataTable, Modal, FormField, Select, SectionCard, StatusBadge, Avatar, Pagination, EmptyState } from '@/components/common'
import toast from 'react-hot-toast'

const SUBJECTS = ['Matemática','Português','Física','Química','Biologia','História','Geografia','Inglês','Ed. Física','Filosofia','Economia','Informática']
const EMPTY = { fullName: '', email: '', contact: '', subjects: [], classroomIds: [], active: true }

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const PER_PAGE = 10

  useEffect(() => subscribeTeachers(setTeachers), [])

  const filtered = teachers.filter((t) => !search || t.fullName?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase()))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const openCreate = () => { setForm(EMPTY); setEditId(null); setModalOpen(true) }
  const openEdit = (t) => { setForm({ ...t, subjects: t.subjects || [] }); setEditId(t.id); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.fullName || !form.email) return toast.error('Nome e email são obrigatórios')
    setSaving(true)
    try {
      if (editId) { await updateTeacher(editId, form); toast.success('Professor actualizado') }
      else { await createTeacher(form); toast.success('Professor criado') }
      setModalOpen(false)
    } catch { toast.error('Erro ao guardar') }
    setSaving(false)
  }

  const handleDelete = async (id) => { await deleteTeacher(id); toast.success('Professor removido') }

  const toggleSubject = (s) => setForm((p) => ({ ...p, subjects: p.subjects.includes(s) ? p.subjects.filter((x) => x !== s) : [...p.subjects, s] }))
  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  const cols = [
    { key: 'fullName', label: 'Professor', render: (v, r) => <div className="flex items-center gap-2.5"><Avatar name={v} photo={r.photoUrl} size="sm" /><div><div className="text-sm font-medium text-white">{v}</div><div className="text-xs text-white/30">{r.email}</div></div></div> },
    { key: 'subjects', label: 'Disciplinas', render: (v) => <div className="flex gap-1 flex-wrap">{(v||[]).slice(0,2).map((s) => <span key={s} className="badge-blue text-[10px]">{s}</span>)}{(v||[]).length > 2 && <span className="badge-gray text-[10px]">+{v.length-2}</span>}</div> },
    { key: 'contact', label: 'Contacto', render: (v) => <span className="text-sm text-white/50">{v||'—'}</span> },
    { key: 'active', label: 'Estado', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    { key: 'id', label: '', render: (v, r) => <div className="flex gap-1 justify-end"><button onClick={() => openEdit(r)} className="btn-icon text-white/40 hover:text-white"><Pencil size={15}/></button><button onClick={() => handleDelete(v)} className="btn-icon text-white/40 hover:text-red-400"><Trash2 size={15}/></button></div> },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Gestão de Professores" subtitle={`${filtered.length} professor${filtered.length!==1?'es':''}`} action={<button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14}/>Novo Professor</button>} />
      <div className="flex gap-3"><div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Pesquisar professores..." /></div></div>
      <SectionCard>
        <DataTable columns={cols} data={paginated} emptyMessage="Nenhum professor encontrado" />
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
      </SectionCard>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Professor' : 'Novo Professor'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nome completo *"><input value={form.fullName} onChange={(e) => f('fullName')(e.target.value)} className="input" placeholder="Nome do professor" /></FormField>
            <FormField label="Email *"><input type="email" value={form.email} onChange={(e) => f('email')(e.target.value)} className="input" placeholder="email@escola.co.mz" /></FormField>
            <FormField label="Contacto"><input value={form.contact} onChange={(e) => f('contact')(e.target.value)} className="input" placeholder="+258 8X XXX XXXX" /></FormField>
            <FormField label="Estado"><Select value={form.active?'true':'false'} onChange={(v) => f('active')(v==='true')} options={[{value:'true',label:'Activo'},{value:'false',label:'Inactivo'}]} /></FormField>
          </div>
          <FormField label="Disciplinas que lecciona">
            <div className="flex gap-2 flex-wrap mt-1">
              {SUBJECTS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSubject(s)} className={`px-2.5 py-1 rounded-md text-xs border transition-all ${form.subjects?.includes(s) ? 'bg-brand/20 border-brand text-brand' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}>{s}</button>
              ))}
            </div>
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-white/10">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'A guardar...' : 'Guardar'}</button>
        </div>
      </Modal>
    </div>
  )
}
