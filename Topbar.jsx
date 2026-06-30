// src/components/layout/Topbar.jsx
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { subscribeNotices } from '@/services/notices'

const PAGE_TITLES = {
  '/app/dashboard': 'Dashboard',
  '/app/students': 'Gestão de Alunos',
  '/app/teachers': 'Gestão de Professores',
  '/app/notices': 'Avisos',
  '/app/finance': 'Gestão Financeira',
  '/app/reports': 'Relatórios',
  '/app/teacher/dashboard': 'Dashboard',
  '/app/teacher/grades': 'Lançamento de Notas',
  '/app/teacher/attendance': 'Registo de Presenças',
  '/app/teacher/worksheets': 'Fichas e Exercícios',
  '/app/student/dashboard': 'Meu Dashboard',
  '/app/student/grades': 'Minhas Notas',
  '/app/student/schedule': 'Horário Escolar',
  '/app/student/library': 'Biblioteca Digital',
  '/app/student/qr': 'Cartão Escolar',
  '/app/parent/dashboard': 'Resumo do Meu Filho',
  '/app/parent/grades': 'Notas',
  '/app/parent/payments': 'Mensalidades',
  '/app/ai': 'DTW EduAI',
  '/app/profile': 'Meu Perfil',
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const { profile } = useAuth()
  const [unread, setUnread] = useState(0)
  const title = PAGE_TITLES[location.pathname] || 'DTW EduConnect'

  useEffect(() => {
    if (!profile) return
    const unsub = subscribeNotices({ role: profile.role, classId: profile.classId, classroomId: profile.classroomId }, (notices) => {
      const count = notices.filter((n) => !n.readBy?.[profile.uid]).length
      setUnread(count)
    })
    return unsub
  }, [profile])

  return (
    <header className="h-14 bg-[#0B1426] border-b border-white/5 flex items-center px-4 gap-3 flex-shrink-0">
      <button onClick={onMenuClick} className="md:hidden btn-icon text-white/60">
        <Menu size={20} />
      </button>

      <h1 className="text-sm font-semibold text-white flex-1">{title}</h1>

      <div className="flex items-center gap-2">
        <button className="btn-icon text-white/40 hover:text-white relative">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
