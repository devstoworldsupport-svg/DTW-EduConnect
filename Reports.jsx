// src/pages/direction/Reports.jsx
import { useState, useEffect } from 'react'
import { Download, FileText, BarChart3, Users, DollarSign, TrendingUp } from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { PageHeader, SectionCard, MetricCard, LoadingPage } from '@/components/common'
import { BarChartWidget, LineChartWidget, PieChartWidget } from '@/components/charts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [data, setData] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [studSnap, paySnap, attSnap] = await Promise.all([
        getDocs(query(collection(db, 'students'), where('active', '==', true))),
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'attendance')),
      ])
      const students = studSnap.docs.map((d) => d.data())
      const payments = paySnap.docs.map((d) => d.data())
      const attendance = attSnap.docs.map((d) => d.data())

      const byClass = {}
      students.forEach((s) => { byClass[s.classId] = (byClass[s.classId] || 0) + 1 })

      const payStats = {
        paid: payments.filter((p) => p.status === 'paid').length,
        pending: payments.filter((p) => p.status === 'pending').length,
        late: payments.filter((p) => p.status === 'late').length,
        revenue: payments.filter((p) => p.status === 'paid').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
      }

      const attRate = attendance.length ? Math.round(attendance.filter((a) => a.status === 'present').length / attendance.length * 100) : 0

      const classDist = Object.entries(byClass).map(([k, v]) => ({ name: k, alunos: v })).sort((a, b) => a.name.localeCompare(b.name))
      const payChart = [
        { name: 'Pagos', value: payStats.paid },
        { name: 'Pendentes', value: payStats.pending },
        { name: 'Atrasados', value: payStats.late },
      ]
      setData({ students: students.length, payStats, attRate, classDist, payChart, payments, attendance })
      setLoading(false)
    }
    load()
  }, [])

  const generatePDF = async (type) => {
    setGenerating(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      pdf.setFont('helvetica')
      // Header
      pdf.setFillColor(15, 26, 42)
      pdf.rect(0, 0, 210, 35, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(16)
      pdf.text('DTW EduConnect', 15, 15)
      pdf.setFontSize(10)
      pdf.text(`Relatório: ${type}`, 15, 23)
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, 15, 30)

      pdf.setTextColor(15, 26, 42)
      pdf.setFontSize(12)
      pdf.text(`DTW EduConnect — Relatório ${type}`, 15, 50)
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Total de Alunos: ${data.students}`, 15, 60)
      pdf.text(`Taxa de Frequência: ${data.attRate}%`, 15, 68)
      pdf.text(`Receita Total: ${data.payStats.revenue.toLocaleString('pt-MZ')} MT`, 15, 76)

      if (type === 'Financeiro' && data.payments.length) {
        autoTable(pdf, {
          startY: 90,
          head: [['Aluno', 'Mês', 'Valor', 'Estado']],
          body: data.payments.slice(0, 30).map((p) => [p.studentName || '—', p.month, `${p.amount} MT`, p.status]),
          headStyles: { fillColor: [30, 58, 95], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          styles: { fontSize: 9 },
        })
      }

      pdf.setFontSize(8)
      pdf.setTextColor(150)
      pdf.text('Desenvolvido por DTW (Devs To World)', 15, 285)
      pdf.save(`DTW-EduConnect-Relatorio-${type}-${Date.now()}.pdf`)
      toast.success('Relatório exportado com sucesso')
    } catch (e) { toast.error('Erro ao gerar relatório') }
    setGenerating(false)
  }

  if (loading) return <LoadingPage />

  const reportTypes = [
    { icon: Users, label: 'Alunos', desc: 'Lista completa de alunos activos', color: 'blue' },
    { icon: DollarSign, label: 'Financeiro', desc: 'Mensalidades, pagamentos e receita', color: 'green' },
    { icon: BarChart3, label: 'Frequência', desc: 'Presenças e faltas por turma', color: 'purple' },
    { icon: TrendingUp, label: 'Notas', desc: 'Desempenho académico geral', color: 'amber' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Relatórios e Estatísticas" subtitle="Visão analítica da escola" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total de Alunos" value={data.students} color="blue" />
        <MetricCard icon={BarChart3} label="Taxa de Frequência" value={`${data.attRate}%`} color="green" />
        <MetricCard icon={DollarSign} label="Receita Total" value={`${(data.payStats.revenue/1000).toFixed(0)}K MT`} color="amber" />
        <MetricCard icon={TrendingUp} label="Pagamentos Pagos" value={data.payStats.paid} color="purple" />
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reportTypes.map((r) => {
          const Icon = r.icon
          return (
            <div key={r.label} className="card p-4 hover:border-white/20 transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-${r.color}-500/10`}>
                <Icon size={18} className={`text-${r.color}-400`} />
              </div>
              <div className="text-sm font-medium text-white mb-0.5">{r.label}</div>
              <div className="text-xs text-white/40 mb-3">{r.desc}</div>
              <button onClick={() => generatePDF(r.label)} disabled={generating} className="btn-secondary btn-sm w-full">
                <Download size={12} /> {generating ? 'A gerar...' : 'Exportar PDF'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard title="Alunos por Classe">
          <BarChartWidget data={data.classDist} dataKey="alunos" xKey="name" color="#3B82F6" height={200} />
        </SectionCard>
        <SectionCard title="Estado de Pagamentos">
          <PieChartWidget data={data.payChart} height={200} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[{l:'Pagos',v:data.payStats.paid,c:'text-emerald-400'},{l:'Pendentes',v:data.payStats.pending,c:'text-amber-400'},{l:'Atrasados',v:data.payStats.late,c:'text-red-400'}].map((i)=>(
              <div key={i.l} className="text-center bg-white/5 rounded-lg py-2">
                <div className={`text-lg font-semibold ${i.c}`}>{i.v}</div>
                <div className="text-[11px] text-white/40">{i.l}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
