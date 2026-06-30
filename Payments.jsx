// src/pages/parent/Payments.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeStudentsByParent } from '@/services/students'
import { subscribePayments } from '@/services/index'
import { PageHeader, SectionCard, StatusBadge, Avatar, LoadingPage, Select } from '@/components/common'
import { DollarSign, CheckCircle, Clock, AlertTriangle, Upload } from 'lucide-react'

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function PaymentsPage() {
  const { profile } = useAuth()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [payments, setPayments] = useState([])
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
    return subscribePayments({ studentId: selectedChild }, setPayments)
  }, [selectedChild])

  const child = children.find((c) => c.id === selectedChild)
  const paid = payments.filter((p) => p.status === 'paid')
  const pending = payments.filter((p) => p.status === 'pending')
  const late = payments.filter((p) => p.status === 'late')
  const totalPaid = paid.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Mensalidades" subtitle="Consulte o estado dos pagamentos" />

      {children.length > 1 && (
        <Select value={selectedChild || ''} onChange={setSelectedChild} options={children.map((c) => ({ value: c.id, label: c.fullName }))} />
      )}

      {child && (
        <div className="flex items-center gap-3 card p-4">
          <Avatar name={child.fullName} photo={child.photoUrl} size="md" />
          <div>
            <div className="text-sm font-semibold text-white">{child.fullName}</div>
            <div className="text-xs text-white/40">{child.classId} · Turma {child.classroomName}</div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, l: 'Total Pago', v: `${totalPaid.toLocaleString('pt-MZ')} MT`, c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: CheckCircle, l: 'Pagos', v: paid.length, c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Clock, l: 'Pendentes', v: pending.length, c: 'text-amber-400', bg: 'bg-amber-500/10' },
          { icon: AlertTriangle, l: 'Atrasados', v: late.length, c: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((i) => {
          const Icon = i.icon
          return (
            <div key={i.l} className={`card p-4 ${i.bg} border-0`}>
              <Icon size={18} className={i.c} />
              <div className={`text-xl font-bold mt-2 ${i.c}`}>{i.v}</div>
              <div className="text-xs text-white/40 mt-0.5">{i.l}</div>
            </div>
          )
        })}
      </div>

      {/* Alerts for pending */}
      {late.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
          <strong>Atenção!</strong> Tem {late.length} mensalidade{late.length > 1 ? 's' : ''} em atraso.
          Contacte a secretaria da escola para regularizar a situação.
        </div>
      )}

      {/* Payments list */}
      <SectionCard title="Histórico de Mensalidades">
        {payments.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-8">Sem registos de mensalidades</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p.status === 'paid' ? 'bg-emerald-500/20' : p.status === 'late' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
                  {p.status === 'paid' ? <CheckCircle size={16} className="text-emerald-400" /> : p.status === 'late' ? <AlertTriangle size={16} className="text-red-400" /> : <Clock size={16} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{MONTHS_PT[parseInt(p.month) - 1] || p.month} {p.year}</div>
                  {p.dueDate && <div className="text-xs text-white/30">Vence: {p.dueDate}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-white">{parseFloat(p.amount || 0).toLocaleString('pt-MZ')} MT</div>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* M-Pesa / e-Mola notice */}
      <div className="card p-4 border-dashed border-white/10 text-center">
        <p className="text-xs text-white/30">Integração M-Pesa e e-Mola em breve disponível.</p>
        <p className="text-xs text-white/20 mt-0.5">Para já, efectue o pagamento presencialmente e solicite o recibo à secretaria.</p>
      </div>
    </div>
  )
}
