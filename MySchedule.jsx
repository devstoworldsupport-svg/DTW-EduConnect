// src/pages/student/MySchedule.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeSchedule } from '@/services/index'
import { PageHeader, SectionCard, LoadingPage } from '@/components/common'
import { Calendar } from 'lucide-react'

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
const SLOTS = ['07:30–09:00', '09:00–10:30', '10:30–12:00', '14:00–15:30', '15:30–17:00']

const SUBJECT_COLORS = {
  'Matemática': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Português': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Física': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Química': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Biologia': 'bg-green-500/20 text-green-300 border-green-500/30',
  'História': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Geografia': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Inglês': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Ed. Física': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
}

const getColor = (subject) => SUBJECT_COLORS[subject] || 'bg-white/10 text-white/60 border-white/10'
const today = new Date().getDay() // 1=Mon...5=Fri

export default function MySchedulePage() {
  const { profile } = useAuth()
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.classroomId) { setLoading(false); return }
    return subscribeSchedule(profile.classroomId, (s) => { setSchedule(s); setLoading(false) })
  }, [profile])

  const getSlot = (day, slot) => schedule.find((s) => s.day === day && s.slot === slot)

  if (loading) return <LoadingPage />

  // Today's classes
  const todayIdx = today >= 1 && today <= 5 ? today - 1 : 0
  const todayClasses = schedule.filter((s) => s.day === todayIdx).sort((a, b) => a.slot - b.slot)

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Horário Escolar" subtitle={`${profile?.classId} · Turma ${profile?.classroomName}`} />

      {/* Today's classes */}
      {todayClasses.length > 0 && (
        <SectionCard title={`Hoje — ${DAYS[todayIdx]}`}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {todayClasses.map((cls, i) => (
              <div key={i} className={`flex-shrink-0 p-3 rounded-xl border min-w-[130px] ${getColor(cls.subject)}`}>
                <div className="text-xs opacity-60 mb-1">{SLOTS[cls.slot]}</div>
                <div className="text-sm font-semibold">{cls.subject}</div>
                <div className="text-xs opacity-60 mt-0.5">{cls.teacher}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Full weekly grid */}
      <SectionCard title="Horário Semanal">
        {schedule.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <Calendar size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Horário ainda não configurado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-white/30 font-medium py-2 pr-3 text-left w-28">Horário</th>
                  {DAYS.map((d, i) => (
                    <th key={d} className={`text-center py-2 px-1 font-medium ${i === todayIdx - 1 ? 'text-brand' : 'text-white/40'}`}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((time, slotIdx) => (
                  <tr key={slotIdx}>
                    <td className="text-white/30 py-1.5 pr-3 text-xs">{time}</td>
                    {DAYS.map((_, dayIdx) => {
                      const cls = getSlot(dayIdx, slotIdx)
                      return (
                        <td key={dayIdx} className="py-1 px-1">
                          {cls ? (
                            <div className={`rounded-lg border p-1.5 text-center min-h-[44px] flex flex-col items-center justify-center ${getColor(cls.subject)}`}>
                              <div className="font-semibold text-[11px] leading-tight">{cls.subject}</div>
                              {cls.teacher && <div className="text-[10px] opacity-60 leading-tight mt-0.5">{cls.teacher}</div>}
                            </div>
                          ) : (
                            <div className="min-h-[44px] rounded-lg bg-white/3 border border-white/5" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
