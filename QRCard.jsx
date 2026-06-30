// src/pages/student/QRCard.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getStudent } from '@/services/students'
import { subscribeQRLogs } from '@/services/index'
import { PageHeader, SectionCard, Avatar, LoadingPage } from '@/components/common'
import { Download, QrCode, Clock, LogIn, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

export default function StudentQRPage() {
  const { profile } = useAuth()
  const [student, setStudent] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const cardRef = useRef()

  const studentId = profile?.studentId || profile?.uid

  useEffect(() => {
    if (!studentId) return
    getStudent(studentId).then((s) => { setStudent(s); setLoading(false) })
    return subscribeQRLogs(studentId, setLogs)
  }, [studentId])

  const downloadCard = () => {
    if (!cardRef.current) return
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(cardRef.current, { backgroundColor: '#0F172A', scale: 2 }).then((canvas) => {
        const link = document.createElement('a')
        link.download = `cartao-${student?.fullName?.replace(/\s/g, '-')}.png`
        link.href = canvas.toDataURL()
        link.click()
      })
    }).catch(() => {
      // Fallback: just show the QR
      window.print()
    })
  }

  const timeStr = (ts) => {
    try { return format(ts.toDate(), "d MMM · HH:mm", { locale: pt }) } catch { return '' }
  }

  if (loading) return <LoadingPage />

  const data = student || profile

  return (
    <div className="space-y-5 animate-fade-in max-w-lg mx-auto">
      <PageHeader title="Cartão Escolar Digital" subtitle="O teu cartão de identificação com QR Code" />

      {/* Card */}
      <div ref={cardRef} className="rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-navy-800 to-[#1E3A5F] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-brand rounded flex items-center justify-center">
              <QrCode size={12} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white/80">DTW EduConnect</span>
            <span className="text-xs text-white/30 ml-auto">Devs To World</span>
          </div>
          <div className="flex items-center gap-4">
            <Avatar name={data?.fullName} photo={data?.photoUrl} size="xl" />
            <div>
              <div className="text-lg font-bold text-white">{data?.fullName}</div>
              <div className="text-sm text-white/60 mt-0.5">{data?.classId} · Turma {data?.classroomName}</div>
              <div className="text-xs text-white/40 mt-0.5">Nº {data?.number}</div>
            </div>
          </div>
        </div>

        {/* QR Code area */}
        <div className="bg-white p-6 flex items-center justify-center gap-6">
          {data?.qrCode ? (
            <img src={data.qrCode} alt="QR Code" className="w-36 h-36" />
          ) : (
            <div className="w-36 h-36 bg-gray-100 rounded-xl flex items-center justify-center">
              <QrCode size={48} className="text-gray-300" />
            </div>
          )}
          <div className="text-navy-950 space-y-1">
            <div className="text-xs text-gray-400">Identificação</div>
            <div className="font-mono text-sm font-bold text-navy-950">EDU-{new Date().getFullYear()}-{data?.number || '0000'}</div>
            <div className="text-xs text-gray-400 mt-2">Ano lectivo</div>
            <div className="text-sm font-semibold text-navy-950">{new Date().getFullYear()}</div>
          </div>
        </div>
      </div>

      <button onClick={downloadCard} className="btn-secondary w-full">
        <Download size={15} /> Descarregar Cartão
      </button>

      {/* Access logs */}
      <SectionCard title="Histórico de acessos">
        {logs.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-8">Sem registos de acesso</p>
        ) : (
          <div className="space-y-1">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${log.type === 'entry' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {log.type === 'entry' ? <LogIn size={13} className="text-emerald-400" /> : <LogOut size={13} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{log.type === 'entry' ? 'Entrada' : 'Saída'}</div>
                </div>
                <div className="text-xs text-white/30 flex items-center gap-1">
                  <Clock size={11} />
                  {timeStr(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
