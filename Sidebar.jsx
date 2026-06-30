// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { School, LayoutDashboard, Users, UserCheck, Bell, DollarSign, BookOpen, Calendar, ClipboardList, FileText, Bot, QrCode, BarChart3, GraduationCap, X, LogOut, User, Library, ClipboardCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const NAV_CONFIG = {
  direction: [
    { section: 'Principal' },
    { icon: LayoutDashboard, label: 'Dashboard', to: '/app/dashboard' },
    { section: 'Gestão Escolar' },
    { icon: Users, label: 'Alunos', to: '/app/students' },
    { icon: GraduationCap, label: 'Professores', to: '/app/teachers' },
    { icon: Bell, label: 'Avisos', to: '/app/notices' },
    { section: 'Administração' },
    { icon: DollarSign, label: 'Financeiro', to: '/app/finance' },
    { icon: BarChart3, label: 'Relatórios', to: '/app/reports' },
    { section: 'Inteligência' },
    { icon: Bot, label: 'DTW EduAI', to: '/app/ai' },
  ],
  teacher: [
    { section: 'Principal' },
    { icon: LayoutDashboard, label: 'Dashboard', to: '/app/teacher/dashboard' },
    { section: 'Sala de Aula' },
    { icon: ClipboardList, label: 'Lançar Notas', to: '/app/teacher/grades' },
    { icon: ClipboardCheck, label: 'Presenças', to: '/app/teacher/attendance' },
    { icon: FileText, label: 'Fichas e Exercícios', to: '/app/teacher/worksheets' },
    { section: 'Comunicação' },
    { icon: Bell, label: 'Avisos', to: '/app/teacher/notices' },
    { section: 'Inteligência' },
    { icon: Bot, label: 'DTW EduAI', to: '/app/ai' },
  ],
  student: [
    { section: 'Minha Área' },
    { icon: LayoutDashboard, label: 'Dashboard', to: '/app/student/dashboard' },
    { icon: BarChart3, label: 'Minhas Notas', to: '/app/student/grades' },
    { icon: Calendar, label: 'Horário', to: '/app/student/schedule' },
    { icon: UserCheck, label: 'Frequência', to: '/app/student/dashboard' },
    { section: 'Aprendizagem' },
    { icon: Library, label: 'Biblioteca', to: '/app/student/library' },
    { icon: FileText, label: 'Fichas', to: '/app/student/library' },
    { section: 'Escola' },
    { icon: Bell, label: 'Avisos', to: '/app/student/notices' },
    { icon: QrCode, label: 'Cartão Escolar', to: '/app/student/qr' },
    { section: 'Inteligência' },
    { icon: Bot, label: 'DTW EduAI', to: '/app/ai' },
  ],
  parent: [
    { section: 'Meu Filho' },
    { icon: LayoutDashboard, label: 'Resumo', to: '/app/parent/dashboard' },
    { icon: BarChart3, label: 'Notas', to: '/app/parent/grades' },
    { icon: Calendar, label: 'Horário', to: '/app/student/schedule' },
    { section: 'Escola' },
    { icon: DollarSign, label: 'Mensalidades', to: '/app/parent/payments' },
    { icon: Bell, label: 'Avisos', to: '/app/parent/notices' },
    { section: 'Suporte' },
    { icon: Bot, label: 'DTW EduAI', to: '/app/ai' },
  ],
}

const ROLE_LABELS = { direction: 'Direção', teacher: 'Professor', student: 'Aluno', parent: 'Encarregado' }
const ROLE_COLORS = { direction: 'bg-blue-500', teacher: 'bg-emerald-500', student: 'bg-purple-500', parent: 'bg-amber-500' }

export default function Sidebar({ open, onClose }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const navItems = NAV_CONFIG[profile?.role] || []

  const handleLogout = async () => {
    await logout()
    navigate('/')
    toast.success('Sessão terminada')
  }

  return (
    <aside className={`
      fixed md:relative inset-y-0 left-0 z-30
      flex flex-col w-60 bg-[#0B1426] border-r border-white/5 flex-shrink-0
      transition-transform duration-250
      ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
            <School size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">DTW EduConnect</div>
            <div className="text-[10px] text-white/30 leading-tight">Devs To World</div>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden p-1 btn-ghost">
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={i} className="pt-4 pb-1 first:pt-1">
                <span className="text-[10px] font-medium text-white/25 uppercase tracking-widest px-3">{item.section}</span>
              </div>
            )
          }
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-white/5 p-3 space-y-1">
        <NavLink to="/app/profile" onClick={onClose} className="nav-item">
          <User size={16} />
          <div className="min-w-0">
            <div className="text-xs font-medium text-white truncate">{profile?.displayName || 'Utilizador'}</div>
            <div className="text-[10px] text-white/40">{ROLE_LABELS[profile?.role]}</div>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut size={16} />
          <span>Terminar sessão</span>
        </button>
      </div>
    </aside>
  )
}
