// src/pages/student/MyGrades.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeStudentGrades, calculateAverage, calculateOverallAverage } from '@/services/grades'
import { PageHeader, SectionCard, GradePill, Tabs, LoadingPage } from '@/components/common'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const TERMS = [{ key: 'all', label: 'Todos' }, { key: '1', label: '1º Trimestre' }, { key: '2', label: '2º Trimestre' }, { key: '3', label: '3º Trimestre' }]

export default function MyGradesPage() {
  const { profile } = useAuth()
  const [grades, setGrades] = useState([])
  const [term, setTerm] = useState('all')
  const [loading, setLoading] = useState(true)

  const studentId = profile?.studentId || profile?.uid

  useEffect(() => {
    if (!studentId) return
    return subscribeStudentGrades(studentId, (g) => { setGrades(g); setLoading(false) })
  }, [studentId])

  const filtered = term === 'all' ? grades : grades.filter((g) => g.term === term)
  const subjects = [...new Set(grades.map((g) => g.subjectId))]

  const subjectData = subjects.map((s) => {
    const sg = filtered.filter((g) => g.subjectId === s)
    const avg = sg.length ? Math.round(sg.reduce((a, g) => a + parseFloat(g.value || 0), 0) / sg.length * 10) / 10 : null
    const byType = {}
    sg.forEach((g) => { byType[g.type] = g.value })
    return { subject: s, avg, ...byType }
  })

  const overallAvg = calculateOverallAverage(filtered)

  const radarData = subjectData.map((s) => ({ subject: s.subject.slice(0, 6), media: s.avg || 0 }))

  const tooltipStyle = { backgroundColor: '#1E3A5F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Minhas Notas" subtitle={`Média geral: ${overallAvg ?? '—'} valores`} />

      <Tabs tabs={TERMS} active={term} onChange={setTerm} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-white">{overallAvg ?? '—'}</div>
          <div className="text-xs text-white/40 mt-1">Média Geral</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">{subjectData.filter(s => (s.avg||0) >= 14).length}</div>
          <div className="text-xs text-white/40 mt-1">Disciplinas Bom+</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">{subjectData.filter(s => s.avg && s.avg >= 10 && s.avg < 14).length}</div>
          <div className="text-xs text-white/40 mt-1">Disciplinas Suf.</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{subjectData.filter(s => s.avg && s.avg < 10).length}</div>
          <div className="text-xs text-white/40 mt-1">Neg. / Em risco</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Grade table */}
        <SectionCard title="Notas por disciplina">
          {subjectData.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">Sem notas registadas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data w-full">
                <thead>
                  <tr>
                    <th>Disciplina</th>
                    <th>T1</th><th>T2</th><th>Trab.</th><th>Exame</th>
                    <th>Média</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectData.map((s) => (
                    <tr key={s.subject}>
                      <td className="font-medium text-white text-sm">{s.subject}</td>
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

        {/* Radar chart */}
        {radarData.length > 2 && (
          <SectionCard title="Perfil académico">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Radar dataKey="media" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2 text-xs text-white/30">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>≥14 Bom</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>≥10 Suf.</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>&lt;10 Neg.</span>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
