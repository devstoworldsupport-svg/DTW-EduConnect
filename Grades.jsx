// src/pages/teacher/Grades.jsx
import { useState, useEffect, useCallback } from 'react'
import { Save, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { collection, getDocs, query, where, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { subscribeStudents } from '@/services/students'
import { subscribeClassroomGrades } from '@/services/grades'
import { PageHeader, SectionCard, Select, FormField, GradePill, LoadingPage } from '@/components/common'
import toast from 'react-hot-toast'

const TERMS = [{ value: '1', label: '1º Trimestre' }, { value: '2', label: '2º Trimestre' }, { value: '3', label: '3º Trimestre' }]
const GRADE_TYPES = [{ value: 'test1', label: 'Teste 1' }, { value: 'test2', label: 'Teste 2' }, { value: 'work', label: 'Trabalho' }, { value: 'exam', label: 'Exame' }]

export default function GradesPage() {
  const { profile } = useAuth()
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('1')
  const [selectedType, setSelectedType] = useState('test1')
  const [students, setStudents] = useState([])
  const [existingGrades, setExistingGrades] = useState([])
  const [gradeValues, setGradeValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'classrooms'), where('teacherIds', 'array-contains', profile?.uid || '__'))).then((snap) => {
      setClassrooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [profile])

  useEffect(() => {
    if (!selectedClassroom) return
    const u = subscribeStudents({ classroomId: selectedClassroom }, (s) => {
      setStudents(s)
      const init = {}
      s.forEach((st) => { init[st.id] = '' })
      setGradeValues(init)
    })
    return u
  }, [selectedClassroom])

  useEffect(() => {
    if (!selectedClassroom || !selectedSubject || !selectedTerm || !selectedType) return
    const u = subscribeClassroomGrades(selectedClassroom, selectedSubject, selectedTerm, (grades) => {
      setExistingGrades(grades)
      const vals = {}
      grades.filter((g) => g.type === selectedType).forEach((g) => { vals[g.studentId] = g.value })
      setGradeValues((prev) => ({ ...prev, ...vals }))
    })
    return u
  }, [selectedClassroom, selectedSubject, selectedTerm, selectedType])

  const handleSave = async () => {
    if (!selectedClassroom || !selectedSubject || !selectedTerm) return toast.error('Seleccione turma, disciplina e trimestre')
    setSaving(true)
    try {
      const batch = writeBatch(db)
      for (const [studentId, value] of Object.entries(gradeValues)) {
        if (value === '' || value === null || value === undefined) continue
        const v = parseFloat(value)
        if (isNaN(v) || v < 0 || v > 20) continue
        const existing = existingGrades.find((g) => g.studentId === studentId && g.type === selectedType)
        if (existing) {
          batch.update(doc(db, 'grades', existing.id), { value: v, updatedAt: serverTimestamp() })
        } else {
          const ref = doc(collection(db, 'grades'))
          batch.set(ref, { studentId, classroomId: selectedClassroom, subjectId: selectedSubject, term: selectedTerm, type: selectedType, value: v, teacherId: profile?.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
        }
      }
      await batch.commit()
      toast.success('Notas guardadas com sucesso!')
    } catch (e) { toast.error('Erro ao guardar notas') }
    setSaving(false)
  }

  const calcAvg = (studentId) => {
    const sGrades = existingGrades.filter((g) => g.studentId === studentId)
    if (!sGrades.length) return null
    const sum = sGrades.reduce((s, g) => s + (parseFloat(g.value) || 0), 0)
    return Math.round((sum / sGrades.length) * 10) / 10
  }

  const classroom = classrooms.find((c) => c.id === selectedClassroom)
  const subjects = classroom?.subjects || profile?.subjects || []

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Lançamento de Notas" subtitle="Registe as avaliações dos alunos" action={
        <button onClick={handleSave} disabled={saving || !selectedClassroom} className="btn-primary btn-sm">
          <Save size={14} /> {saving ? 'A guardar...' : 'Guardar Notas'}
        </button>
      } />

      {/* Filters */}
      <SectionCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField label="Turma">
            <Select value={selectedClassroom} onChange={setSelectedClassroom} options={classrooms.map((c) => ({ value: c.id, label: `${c.className} · ${c.name}` }))} placeholder="Seleccionar turma" />
          </FormField>
          <FormField label="Disciplina">
            <Select value={selectedSubject} onChange={setSelectedSubject} options={subjects.map((s) => ({ value: s, label: s }))} placeholder="Seleccionar disciplina" />
          </FormField>
          <FormField label="Trimestre">
            <Select value={selectedTerm} onChange={setSelectedTerm} options={TERMS} />
          </FormField>
          <FormField label="Tipo de avaliação">
            <Select value={selectedType} onChange={setSelectedType} options={GRADE_TYPES} />
          </FormField>
        </div>
      </SectionCard>

      {selectedClassroom && selectedSubject ? (
        <SectionCard title={`${classroom?.className} · Turma ${classroom?.name} · ${selectedSubject}`}>
          {students.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">Nenhum aluno nesta turma</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data w-full">
                <thead>
                  <tr>
                    <th>Nº</th><th>Aluno</th>
                    {GRADE_TYPES.map((t) => <th key={t.value}>{t.label}</th>)}
                    <th>Média</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td className="text-white/40 text-xs font-mono">{s.number}</td>
                      <td>
                        <div className="font-medium text-white text-sm">{s.fullName}</div>
                      </td>
                      {GRADE_TYPES.map((t) => {
                        const existing = existingGrades.find((g) => g.studentId === s.id && g.type === t.value)
                        return (
                          <td key={t.value}>
                            {t.value === selectedType ? (
                              <input
                                type="number" min="0" max="20" step="0.5"
                                value={gradeValues[s.id] ?? ''}
                                onChange={(e) => setGradeValues((p) => ({ ...p, [s.id]: e.target.value }))}
                                className="w-16 bg-brand/10 border border-brand/30 rounded px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-brand"
                              />
                            ) : (
                              <GradePill value={existing?.value ?? '—'} />
                            )}
                          </td>
                        )
                      })}
                      <td><GradePill value={calcAvg(s.id) ?? '—'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      ) : (
        <SectionCard>
          <div className="text-center py-12 text-white/30">
            <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Seleccione uma turma e disciplina para lançar notas</p>
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// Missing import fix
function ClipboardList({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
}
