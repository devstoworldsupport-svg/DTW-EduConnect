// src/pages/parent/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeStudentsByParent } from '@/services/students'
import { subscribeStudentGrades, calculateOverallAverage } from '@/services/grades'
import { subscribeStudentAttendance, calculateAttendanceRate } from '@/services/attendance'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { BarChart3, UserCheck, DollarSign, Bell, ChevronRight } from 'lucide-react'
import { MetricCard, SectionCard, Avatar, GradePill, StatusBadge, LoadingPage } from '@/components/common'
import { Link } from 'react-router-dom'
import { startOfMonth } from 'date-fns'

function ChildCard({ child }) {
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const u1 = subscribeStudentGrades(child.id, setGrades)
    const u2 = subscribeStudentAttendance(child.id, startOfMonth(new Date()), setAttendance)
    const u3 = onSnapshot(query(collection(db, 'payments'), where('studentId', '==', child.id), where('status', '==', 'pending'), limit(5)), (s) => setPayments(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => { u1(); u2(); u3() }
  }, [child.id])

  const avg = calculateOverallAverage(grades)
  const attRate = calculateAttendanceRate(attendance)
  const absences = attendance.filter((a) => a.status === 'absent').length

  const subjects = [...new Set(grades.map((g) => g.subjectId))]
  const subjectAverages = subjects.slice(0, 5).map((s) => {
    const sg = grades.filter((g) => g.subjectId === s)
    const a = sg.reduce((acc, g) => acc + parseFloat(g.value || 0), 0) / (sg.length || 1)
    return { name: s, avg: Math.round(a * 10) / 10 }
  })

  return (
    <div className="card p-5 space-y-4">
      {/* Child header */}
      <div className="flex items-center gap-3">
        <Avatar name={child.fullName} photo={child.photoUrl} size="lg" />
        <div>
          <div className="text-base font-semibold text-white">{child.fullName}</div>
          <div className="text-xs text-white/40">{child.classId} · Turma {child.classroomName} · Nº {child.number}</div>
        </div>
        <StatusBadge status="active" />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className={`text-xl font-bold ${avg && avg >= 10 ? 'text-emerald-400' : avg ? 'text-red-400' : 'text-white/30'}`}>{avg ?? '—'}</div>
          <div className="text-[10px] text-white/30 mt-0.5">Média Geral</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className={`text-xl font-bold ${attRate >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>{attRate}%</div>
          <div className="text-[10px] text-white/30 mt-0.5">Frequência</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className={`text-xl font-bold ${payments.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{payments.length}</div>
          <div className="text-[10px] text-white/30 mt-0.5">Pend. Pag.</div>
        </div>
      </div>

      {/* Grades preview */}
      {subjectAverages.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-white/40 mb-2">Notas por disciplina</div>
          {subjectAverages.map((s) => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="text-xs text-white/50 w-24 truncate">{s.name}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(s.avg / 20) * 100}%` }} />
              </div>
              <GradePill value={s.avg} />
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {absences > 3 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
          ⚠️ {child.fullName?.split(' ')[0]} tem {absences} faltas este mês. Contacte a escola se necessário.
        </div>
      )}
      {payments.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
          💰 {payments.length} mensalidade{payments.length > 1 ? 's' : ''} pendente{payments.length > 1 ? 's' : ''}. <Link to="/app/parent/payments" className="underline">Ver pagamentos →</Link>
        </div>
      )}

      <Link to="/app/parent/grades" className="btn-secondary btn-sm w-full flex items-center justify-center gap-1">
        Ver detalhe completo <ChevronRight size={13} />
      </Link>
    </div>
  )
}

export default function ParentDashboard() {
  const { profile } = useAuth()
  const [children, setChildren] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u1 = subscribeStudentsByParent(profile?.uid, (s) => { setChildren(s); setLoading(false) })
    const u2 = onSnapshot(query(collection(db, 'notices'), where('active', '==', true), orderBy('createdAt', 'desc'), limit(4)), (s) => setNotices(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => { u1(); u2() }
  }, [profile])

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-5 bg-gradient-to-r from-amber-900/30 to-navy-800/60 border-amber-500/20">
        <h2 className="text-base font-semibold text-white">Olá, {profile?.displayName?.split(' ')[0]}!</h2>
        <p className="text-xs text-white/40 mt-0.5">Acompanhe o progresso dos seus filhos</p>
      </div>

      {/* Children */}
      {children.length === 0 ? (
        <div className="card p-8 text-center text-white/30">
          <p className="text-sm">Nenhum filho associado à sua conta.</p>
          <p className="text-xs mt-1">Contacte a escola para associar os seus filhos.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {children.map((child) => <ChildCard key={child.id} child={child} />)}
        </div>
      )}

      {/* Notices */}
      <SectionCard title="Avisos da Escola" action={<Link to="/app/parent/notices" className="text-xs text-brand hover:underline">Ver todos →</Link>}>
        {notices.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-6">Sem avisos</p>
        ) : (
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className={`p-3 rounded-lg bg-white/5 border-l-2 ${n.priority === 'urgent' ? 'border-red-400' : n.priority === 'important' ? 'border-amber-400' : 'border-white/10'}`}>
                <div className="text-sm font-medium text-white">{n.title}</div>
                <div className="text-xs text-white/40 mt-0.5 line-clamp-1">{n.description}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
