// src/pages/parent/ChildGrades.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeStudentsByParent } from '@/services/students'
import { subscribeStudentGrades, calculateOverallAverage } from '@/services/grades'
import { subscribeStudentAttendance, calculateAttendanceRate } from '@/services/attendance'
import { PageHeader, SectionCard, GradePill, Avatar, AttendanceDots, Tabs, LoadingPage, Select } from '@/components/common'
import { startOfMonth } from 'date-fns'

export default function ChildGradesPage() {
  const { profile } = useAuth()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [tab, setTab] = useState('grades')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return subscribeStudentsByParent(profile?.uid, (s) => {
      setChildren(s)
      if (s.length > 0 && !selectedChild) setSelectedChild(s[0].id)
      setLoading(false)
    })
  }, [profile])

  useEffect(() => {
    if (!selectedChild) return
    const u1 = subscribeStudentGrades(selectedChild, setGrades)
    const u2 = subscribeStudentAttendance(selectedChild, startOfMonth(new Date()), setAttendance)
    return () => { u1(); u2() }
  }, [selectedChild])

  const child = children.find((c) => c.id === selectedChild)
  const subjects = [...new Set(grades.map((g) => g.subjectId))]
  const subjectAverages = subjects.map((s) => {
    const sg = grades.filter((g) => g.subjectId === s)
    const avg = sg.length ? Math.round(sg.reduce((a, g) => a + parseFloat(g.value || 0), 0) / sg.length * 10) / 10 : null
    const byType = {}
    sg.forEach((g) => { byType[g.type] = g.value })
    return { subject: s, avg, ...byType }
  })

  const overallAvg = calculateOverallAverage(grades)
  const attRate = calculateAttendanceRate(attendance)

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Notas e Frequência" subtitle="Acompanhe o desempenho dos seus filhos" />

      {children.length > 1 && (
        <Select
          value={selectedChild || ''}
          onChange={setSelectedChild}
          options={children.map((c) => ({ value: c.id, label: c.fullName }))}
        />
      )}

      {child && (
        <div className="flex items-center gap-3 card p-4">
          <Avatar name={child.fullName} photo={child.photoUrl} size="md" />
          <div>
            <div className="text-sm font-semibold text-white">{child.fullName}</div>
            <div className="text-xs text-white/40">{child.classId} · Turma {child.classroomName}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-white/30">Média geral</div>
            <div className={`text-lg font-bold ${overallAvg >= 10 ? 'text-emerald-400' : 'text-red-400'}`}>{overallAvg ?? '—'}</div>
          </div>
        </div>
      )}

      <Tabs tabs={[{ key: 'grades', label: 'Notas' }, { key: 'attendance', label: 'Frequência' }]} active={tab} onChange={setTab} />

      {tab === 'grades' && (
        <SectionCard title="Notas por disciplina">
          {subjectAverages.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">Sem notas lançadas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data w-full">
                <thead><tr><th>Disciplina</th><th>T1</th><th>T2</th><th>Trab.</th><th>Exame</th><th>Média</th></tr></thead>
                <tbody>
                  {subjectAverages.map((s) => (
                    <tr key={s.subject}>
                      <td className="font-medium text-white">{s.subject}</td>
                      <td><GradePill value={s.test1 ?? '—'} /></td>
                      <td><GradePill value={s.test2 ?? '—'} /></td>
                      <td><GradePill value={s.work ?? '—'} /></td>
                      <td><GradePill value={s.exam ?? '—'} /></td>
                      <td><GradePill value={s.avg ?? '—'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {tab === 'attendance' && (
        <SectionCard title={`Frequência — ${attRate}%`}>
          <AttendanceDots records={attendance} limit={31} />
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { l: 'Presenças', v: attendance.filter(a => a.status === 'present').length, c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { l: 'Faltas', v: attendance.filter(a => a.status === 'absent').length, c: 'text-red-400', bg: 'bg-red-500/10' },
              { l: 'Atrasos', v: attendance.filter(a => a.status === 'late').length, c: 'text-amber-400', bg: 'bg-amber-500/10' },
              { l: 'Justif.', v: attendance.filter(a => a.status === 'justified').length, c: 'text-blue-400', bg: 'bg-blue-500/10' },
            ].map((i) => (
              <div key={i.l} className={`${i.bg} rounded-xl p-3 text-center`}>
                <div className={`text-xl font-bold ${i.c}`}>{i.v}</div>
                <div className="text-[10px] text-white/30">{i.l}</div>
              </div>
            ))}
          </div>
          {attendance.filter(a => a.status === 'absent').length > 3 && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
              ⚠️ Atenção: {child?.fullName?.split(' ')[0]} tem mais de 3 faltas este mês. Contacte a escola.
            </div>
          )}
        </SectionCard>
      )}
    </div>
  )
}
