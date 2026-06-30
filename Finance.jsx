// src/pages/direction/Finance.jsx
import { useState, useEffect } from 'react'
import { Plus, DollarSign, CheckCircle, Clock, AlertTriangle, Download, Filter } from 'lucide-react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { subscribePayments, createPayment, updatePaymentStatus } from '@/services/index'
import { subscribeStudents } from '@/services/students'
import { PageHeader, MetricCard, SectionCard, DataTable, Modal, FormField, Select, SearchBar, StatusBadge, Pagination, Avatar } from '@/components/common'
import { AreaChartWidget } from '@/components/charts'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const CURRENT_YEAR = new Date().getFullYear()
const EMPTY = { studentId: '', month: '', year: CURRENT_YEAR, amount: '', dueDate: '', status: 'pending', notes: '' }

export default function FinancePage() {
  const [payments, setPayments] = useState([])
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const PER_PAGE = 15

  useEffect(() => {
    const u1 = subscribePayments({}, setPayments)
    const u2 = subscribeStudents({}, setStudents)
    return () => { u1(); u2() }
  }, [])

  const metrics = {
    total: payments.length,
    paid: payments.filter((p) => p.status === 'paid').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    late: payments.filter((p) => p.status === 'late').length,
    revenue: payments.filter((p) => p.status === 'paid').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
  }

  const filtered = payments.filter((p) => {
    const student = students.find((s) => s.id === p.studentId)
    const q = search.toLowerCase()
    const matchSearch = !q || student?.fullName?.toLowerCase().includes(q)
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchStatus
  })
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSave = async () => {
    if (!form.studentId || !form.month || !form.amount) return toast.error('Preencha todos os campos obrigatórios')
    setSaving(true)
    try {
      const student = students.find((s) => s.id === form.studentId)
      await createPayment({ ...form, studentName: student?.fullName, amount: parseFloat(form.amount), year: parseInt(form.year) })
      toast.success('Mensalidade registada')
      setModalOpen(false); setForm(EMPTY)
    } catch { toast.error('Erro ao registar') }
    setSaving(false)
  }

  const handleMarkPaid = async (id) => {
    await updatePaymentStatus(id, 'paid')
    toast.success('Marcado como pago')
  }
  const handleMarkLate = async (id) => {
    await updatePaymentStatus(id, 'late')
    toast.success('Marcado como atrasado')
  }

  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }))

  const monthlyRevenue = MONTHS_PT.slice(0, 8).map((m, i) => ({
    name: m.slice(0, 3),
    valor: payments.filter((p) => p.status === 'paid' && parseInt(p.month) === i + 1 && p.year === CURRENT_YEAR).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
  }))

  const cols = [
    { key: 'studentId', label: 'Aluno', render: (v) => { const s = students.find((st) => st.id === v); return s ? <div className="flex items-center gap-2"><Avatar name={s.fullName} photo={s.photoUrl} size="sm" /><span className="text-sm text-white">{s.fullName}</span></div> : <span className="text-white/30">—</span> } },
    { key: 'month', label: 'Mês/Ano', render: (v, r) => <span className="text-sm text-white/70">{MONTHS_PT[parseInt(v)-1]} {r.year}</span> },
    { key: 'amount', label: 'Valor', render: (v) => <span className="text-sm font-medium text-white">{parseFloat(v || 0).toLocaleString('pt-MZ')} MT</span> },
    { key: 'dueDate', label: 'Vencimento', render: (v) => <span className="text-sm text-white/50">{v || '—'}</span> },
    { key: 'status', label: 'Estado', render: (v) => <StatusBadge status={v} /> },
    { key: 'id', label: '', render: (v, r) => (
      <div className="flex gap-1 justify-end">
        {r.status !== 'paid' && <button onClick={() => handleMarkPaid(v)} className="btn btn-sm bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[11px] px-2 py-1">Pago</button>}
        {r.status === 'pending' && <button onClick={() => handleMarkLate(v)} className="btn btn-sm bg-red-500/20 text-red-400 text-[11px] px-2 py-1">Atrasado</button>}
      </div>
    )},
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Gestão Financeira"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary btn-sm"><Download size={14} /> Exportar</button>
            <button onClick={() => setModalOpen(true)} className="btn-primary btn-sm"><Plus size={14} /> Nova Mensalidade</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Receita Total" value={`${metrics.revenue.toLocaleString('pt-MZ')} MT`} color="green" trend="up" sub="Pagamentos recebidos" />
        <MetricCard icon={CheckCircle} label="Pagamentos Feitos" value={metrics.paid} color="green" sub={`de ${metrics.total} total`} />
        <MetricCard icon={Clock} label="Pendentes" value={metrics.pending} color="amber" trend="neutral" />
        <MetricCard icon={AlertTriangle} label="Atrasados" value={metrics.late} color="red" trend="down" />
      </div>

      <SectionCard title="Receita Mensal (MT)">
        <AreaChartWidget data={monthlyRevenue} dataKey="valor" xKey="name" color="#10B981" height={180} />
      </SectionCard>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48"><SearchBar value={search} onChange={setSearch} placeholder="Pesquisar por aluno..." /></div>
        <Select value={filterStatus} onChange={setFilterStatus} options={[{value:'paid',label:'Pago'},{value:'pending',label:'Pendente'},{value:'late',label:'Atrasado'}]} placeholder="Todos os estados" className="w-44" />
      </div>

      <SectionCard>
        <DataTable columns={cols} data={paginated} emptyMessage="Nenhuma mensalidade encontrada" />
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
      </SectionCard>

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Mensalidade" size="md">
        <div className="space-y-4">
          <FormField label="Aluno *">
            <Select value={form.studentId} onChange={f('studentId')} options={students.map((s) => ({ value: s.id, label: s.fullName }))} placeholder="Seleccionar aluno" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mês *">
              <Select value={form.month} onChange={f('month')} options={MONTHS_PT.map((m, i) => ({ value: String(i + 1), label: m }))} placeholder="Seleccionar mês" />
            </FormField>
            <FormField label="Ano *">
              <input type="number" value={form.year} onChange={(e) => f('year')(e.target.value)} className="input" min="2020" max="2030" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Valor (MT) *">
              <input type="number" value={form.amount} onChange={(e) => f('amount')(e.target.value)} className="input" placeholder="2500" />
            </FormField>
            <FormField label="Data de vencimento">
              <input type="date" value={form.dueDate} onChange={(e) => f('dueDate')(e.target.value)} className="input" />
            </FormField>
          </div>
          <FormField label="Estado">
            <Select value={form.status} onChange={f('status')} options={[{value:'pending',label:'Pendente'},{value:'paid',label:'Pago'},{value:'late',label:'Atrasado'}]} />
          </FormField>
          <FormField label="Notas">
            <input value={form.notes} onChange={(e) => f('notes')(e.target.value)} className="input" placeholder="Observações..." />
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
