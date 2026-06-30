// src/pages/teacher/Attendance.jsx
import { useState, useEffect } from 'react'
import { Save, UserCheck, UserX } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { collection, getDocs, query, where, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { subscribeStudents } from '@/services/students'
import { subscribeClassroomAttendance, ATTENDANCE_STATUS } from '@/services/attendance'
import { PageHeader, SectionCard, Select, FormField, Avatar, StatusBadge } from '@/components/common'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: 'present', label: 'Presente', cls: 'bg-emerald-500/20 border-emerald-500 text-emerald-400' },
  { value: 'absent', label: 'Falta', cls: 'bg-red-500/20 border-red-500 text-red-400' },
  { value: 'late', label: 'Atraso', cls: 'bg-amber-500/20 border-amber-500 text-amber-400' },
  { value: 'justified', label: 'Justificada', cls: 'bg-blue-500/20 border-blue-500 text-blue-400' },
]

export default function AttendancePage() {
  const { profile } = useAuth()
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [students, setStudents] = useState([])
  const [existing, setExisting] = useState([])
  const [attendance, setAttendance] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getDocs(query(collection(db, 'classrooms'), where('teacherIds', 'array-contains', profile?.uid || '__'))).then((s) => setClassrooms(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [profile])

  useEffect(() => {
    if (!selectedClassroom) return
    const u = subscribeStudents({ classroomId: selectedClassroom }, (s) => {
      setStudents(s)
      const init = {}
      s.forEach((st) => { init[st.id] = 'present' })
      setAttendance(init)
    })
    return u
  }, [selectedClassroom])

  useEffect(() => {
    if (!selectedClassroom || !selectedDate) return
    const u = subscribeClassroomAttendance(selectedClassroom, selectedDate, selectedSubject || null, (recs) => {
      setExisting(recs)
      const vals = {}
      recs.forEach((r) => { vals[r.studentId] = r.status })
      setAttendance((prev) => ({ ...prev, ...vals }))
    })
    return u
  }, [selectedClassroom, selectedDate, selectedSubject])

  const handleSave = async () => {
    if (!selectedClassroom || !selectedDate) return toast.error('Seleccione turma e data')
    setSaving(true)
    try {
      const batch = writeBatch(db)
      for (const [studentId, status] of Object.entries(attendance)) {
        const ex = existing.find((r) => r.studentId === studentId)
        if (ex) {
          batch.update(doc(db, 'attendance', ex.id), { status, updatedAt: serverTimestamp() })
        } else {
          const r = doc(collection(db, 'attendance'))
          batch.set(r, { studentId, classroomId: selectedClassroom, subjectId: selectedSubject || null, date: selectedDate, status, teacherId: profile?.uid, createdAt: serverTimestamp() })
        }
      }
      await batch.commit()
      toast.success('Presenças registadas!')
    } catch { toast.error('Erro ao guardar') }
    setSaving(false)
  }

  const markAll = (status) => { const a = {}; students.forEach((s) => { a[s.id] = status }); setAttendance(a) }
  const classroom = classrooms.find((c) => c.id === selectedClassroom)

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Registo de Presenças" action={
        <button onClick={handleSave} disabled={saving || !selectedClassroom} className="btn-primary btn-sm"><Save size={14} />{saving ? 'A guardar...' : 'Guardar'}</button>
      } />
      <SectionCard>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <FormField label="Turma"><Select value={selectedClassroom} onChange={setSelectedClassroom} options={classrooms.map((c) => ({ value: c.id, label: `${c.className} · ${c.name}` }))} placeholder="Seleccionar turma" /></FormField>
          <FormField label="Data"><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input" /></FormField>
          <FormField label="Disciplina (opcional)"><Select value={selectedSubject} onChange={setSelectedSubject} options={(classroom?.subjects||[]).map((s) => ({ value: s, label: s }))} placeholder="Todas as disciplinas" /></FormField>
        </div>
      </SectionCard>

      {selectedClassroom && students.length > 0 && (
        <SectionCard title={`${classroom?.className} · Turma ${classroom?.name} — ${selectedDate}`}>
          <div className="flex gap-2 mb-4">
            <button onClick={() => markAll('present')} className="btn-secondary btn-sm"><UserCheck size={13} /> Todos presentes</button>
            <button onClick={() => markAll('absent')} className="btn-secondary btn-sm"><UserX size={13} /> Todos faltaram</button>
          </div>
          <div className="space-y-2">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors">
                <Avatar name={s.fullName} photo={s.photoUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{s.fullName}</div>
                  <div className="text-xs text-white/30">Nº {s.number}</div>
                </div>
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAttendance((p) => ({ ...p, [s.id]: opt.value }))}
                      className={`px-2.5 py-1 rounded text-xs border transition-all ${attendance[s.id] === opt.value ? opt.cls : 'bg-white/5 border-white/10 text-white/30 hover:border-white/30'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex gap-4 text-xs text-white/40">
            <span className="text-emerald-400">{Object.values(attendance).filter(v=>v==='present').length} presentes</span>
            <span className="text-red-400">{Object.values(attendance).filter(v=>v==='absent').length} faltas</span>
            <span className="text-amber-400">{Object.values(attendance).filter(v=>v==='late').length} atrasos</span>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
