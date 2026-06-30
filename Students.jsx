// src/pages/direction/Students.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Download, Upload, QrCode, Eye, Pencil, Trash2, User } from 'lucide-react'
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/config/firebase'
import { subscribeStudents } from '@/services/students'
import { subscribeClasses, subscribeClassrooms, subscribeParents } from '@/services/index'
import { PageHeader, SearchBar, DataTable, Modal, ConfirmDialog, Avatar, StatusBadge, FormField, Select, Pagination, SectionCard } from '@/components/common'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

const EMPTY = { fullName: '', number: '', classId: '', classroomId: '', parentId: '', birthDate: '', contact: '', photoUrl: '', active: true }

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [parents, setParents] = useState([])
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const PER_PAGE = 10

  useEffect(() => {
    const u1 = subscribeStudents({}, setStudents)
    const u2 = subscribeClasses(setClasses)
    const u3 = subscribeClassrooms(null, setClassrooms)
    const u4 = subscribeParents(setParents)
    return () => { u1(); u2(); u3(); u4() }
  }, [])

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.fullName?.toLowerCase().includes(q) || s.number?.toString().includes(q)
    const matchClass = !filterClass || s.classId === filterClass
    return matchSearch && matchClass
  })
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const openCreate = () => { setForm(EMPTY); setEditId(null); setPhotoFile(null); setModalOpen(true) }
  const openEdit = (s) => { setForm({ ...s }); setEditId(s.id); setPhotoFile(null); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.fullName || !form.classId) return toast.error('Nome e classe são obrigatórios')
    setSaving(true)
    try {
      let photoUrl = form.photoUrl
      if (photoFile) {
        const sRef = ref(storage, `students/${editId || Date.now()}/photo`)
        const snap = await uploadBytes(sRef, photoFile)
        photoUrl = await getDownloadURL(snap.ref)
      }
      const className = classes.find((c) => c.id === form.classId)?.name || form.classId
      const classroomName = classrooms.find((c) => c.id === form.classroomId)?.name || form.classroomId
      const data = { ...form, photoUrl, className, classroomName, updatedAt: serverTimestamp() }

      if (editId) {
        await updateDoc(doc(db, 'students', editId), data)
        toast.success('Aluno actualizado')
      } else {
        const r = await addDoc(collection(db, 'students'), { ...data, createdAt: serverTimestamp() })
        const qrCode = await QRCode.toDataURL(`dtw-edu://student/${r.id}`, { errorCorrectionLevel: 'H', margin: 1 })
        await updateDoc(doc(db, 'students', r.id), { id: r.id, qrCode })
        toast.success('Aluno criado com QR Code')
      }
      setModalOpen(false)
    } catch (e) { toast.error('Erro ao guardar') }
    setSaving(false)
  }

  const handleDelete = async () => {
    await updateDoc(doc(db, 'students', deleteTarget.id), { active: false })
    toast.success('Aluno removido')
    setDeleteTarget(null)
  }

  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))
  const filteredClassrooms = classrooms.filter((c) => !form.classId || c.classId === form.classId)

  const cols = [
    { key: 'fullName', label: 'Aluno', render: (v, r) => <div className="flex items-center gap-2.5"><Avatar name={v} photo={r.photoUrl} size="sm" /><div><div className="text-sm font-medium text-white">{v}</div><div className="text-xs text-white/30">Nº {r.number}</div></div></div> },
    { key: 'classId', label: 'Classe', render: (v, r) => <span className="text-sm text-white/70">{r.className || v}</span> },
    { key: 'classroomId', label: 'Turma', render: (v, r) => <span className="text-sm text-white/70">{r.classroomName || v}</span> },
    { key: 'contact', label: 'Contacto', render: (v) => <span className="text-sm text-white/50">{v || '—'}</span> },
    { key: 'active', label: 'Estado', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    { key: 'id', label: '', render: (v, r) => (
      <div className="flex gap-1 justify-end">
        <button onClick={() => setViewModal(r)} className="btn-icon text-white/40 hover:text-brand"><Eye size={15} /></button>
        <button onClick={() => openEdit(r)} className="btn-icon text-white/40 hover:text-white"><Pencil size={15} /></button>
        <button onClick={() => setDeleteTarget(r)} className="btn-icon text-white/40 hover:text-red-400"><Trash2 size={15} /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Gestão de Alunos"
        subtitle={`${filtered.length} aluno${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm"><Download size={14} /> Exportar</button>
            <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={14} /> Novo Aluno</button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48"><SearchBar value={search} onChange={setSearch} placeholder="Pesquisar por nome ou número..." /></div>
        <Select value={filterClass} onChange={setFilterClass} options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Todas as classes" className="w-40" />
      </div>

      {/* Table */}
      <SectionCard>
        <DataTable columns={cols} data={paginated} emptyMessage="Nenhum aluno encontrado" />
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
      </SectionCard>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Aluno' : 'Novo Aluno'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          {/* Photo */}
          <div className="col-span-2 flex items-center gap-4">
            <Avatar name={form.fullName} photo={photoFile ? URL.createObjectURL(photoFile) : form.photoUrl} size="xl" />
            <div>
              <label className="btn-secondary btn-sm cursor-pointer">
                <Upload size={14} /> Foto
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files[0])} />
              </label>
              <p className="text-[11px] text-white/30 mt-1">JPG, PNG até 5MB</p>
            </div>
          </div>
          <FormField label="Nome completo *">
            <input value={form.fullName} onChange={(e) => f('fullName')(e.target.value)} className="input" placeholder="Nome do aluno" />
          </FormField>
          <FormField label="Número">
            <input value={form.number} onChange={(e) => f('number')(e.target.value)} className="input" placeholder="Ex: 1042" />
          </FormField>
          <FormField label="Classe *">
            <Select value={form.classId} onChange={f('classId')} options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Seleccionar classe" />
          </FormField>
          <FormField label="Turma">
            <Select value={form.classroomId} onChange={f('classroomId')} options={filteredClassrooms.map((c) => ({ value: c.id, label: c.name }))} placeholder="Seleccionar turma" />
          </FormField>
          <FormField label="Encarregado">
            <Select value={form.parentId} onChange={f('parentId')} options={parents.map((p) => ({ value: p.id, label: p.fullName }))} placeholder="Seleccionar encarregado" />
          </FormField>
          <FormField label="Data de nascimento">
            <input type="date" value={form.birthDate} onChange={(e) => f('birthDate')(e.target.value)} className="input" />
          </FormField>
          <FormField label="Contacto" >
            <input value={form.contact} onChange={(e) => f('contact')(e.target.value)} className="input" placeholder="+258 8X XXX XXXX" />
          </FormField>
          <FormField label="Estado">
            <Select value={form.active ? 'true' : 'false'} onChange={(v) => f('active')(v === 'true')} options={[{value:'true',label:'Activo'},{value:'false',label:'Inactivo'}]} />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-white/10">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'A guardar...' : 'Guardar'}</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="Ficha do Aluno" size="md">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={viewModal.fullName} photo={viewModal.photoUrl} size="xl" />
              <div>
                <h3 className="text-lg font-semibold text-white">{viewModal.fullName}</h3>
                <p className="text-sm text-white/40">Nº {viewModal.number} · {viewModal.className} · Turma {viewModal.classroomName}</p>
                <StatusBadge status={viewModal.active ? 'active' : 'inactive'} />
              </div>
            </div>
            {viewModal.qrCode && (
              <div className="bg-white p-4 rounded-xl w-fit mx-auto">
                <img src={viewModal.qrCode} alt="QR Code" className="w-32 h-32" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Contacto', viewModal.contact], ['Nascimento', viewModal.birthDate]].map(([l, v]) => (
                <div key={l} className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-white/40 mb-0.5">{l}</div>
                  <div className="text-white font-medium">{v || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remover Aluno" message={`Tem a certeza que quer remover ${deleteTarget?.fullName}? Esta acção pode ser revertida.`} danger />
    </div>
  )
}
