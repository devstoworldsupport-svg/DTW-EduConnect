// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { School, Eye, EyeOff, ArrowLeft, GraduationCap, BookOpen, Users, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_INFO = [
  { key: 'direction', label: 'Direção', icon: Building2, color: 'border-blue-500/50 hover:border-blue-500 bg-blue-500/5', iconColor: 'text-blue-400', desc: 'Acesso total ao sistema' },
  { key: 'teacher', label: 'Professor', icon: GraduationCap, color: 'border-emerald-500/50 hover:border-emerald-500 bg-emerald-500/5', iconColor: 'text-emerald-400', desc: 'Turmas e disciplinas' },
  { key: 'student', label: 'Aluno', icon: BookOpen, color: 'border-purple-500/50 hover:border-purple-500 bg-purple-500/5', iconColor: 'text-purple-400', desc: 'Dados escolares pessoais' },
  { key: 'parent', label: 'Encarregado', icon: Users, color: 'border-amber-500/50 hover:border-amber-500 bg-amber-500/5', iconColor: 'text-amber-400', desc: 'Acompanhar filhos' },
]

export default function LoginPage() {
  const [step, setStep] = useState('role') // 'role' | 'credentials'
  const [selectedRole, setSelectedRole] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/app'

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await login(email, password)
      // Verificar se o role do utilizador corresponde ao seleccionado
      navigate(from, { replace: true })
      toast.success('Bem-vindo à DTW EduConnect!')
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'Utilizador não encontrado',
        'auth/wrong-password': 'Palavra-passe incorrecta',
        'auth/invalid-email': 'Email inválido',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
      }
      toast.error(messages[err.code] || 'Erro ao iniciar sessão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
              <School size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-lg font-bold text-white">DTW EduConnect</div>
              <div className="text-xs text-white/30">Devs To World</div>
            </div>
          </Link>
        </div>

        <div className="card p-6 md:p-8 bg-white/[0.03] border-white/10">
          {step === 'role' ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Iniciar sessão</h2>
              <p className="text-sm text-white/40 mb-6">Seleccione o seu perfil de acesso</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_INFO.map((r) => {
                  const Icon = r.icon
                  return (
                    <button
                      key={r.key}
                      onClick={() => { setSelectedRole(r.key); setStep('credentials') }}
                      className={`p-4 rounded-xl border transition-all text-left ${r.color}`}
                    >
                      <Icon size={20} className={`${r.iconColor} mb-2`} />
                      <div className="text-sm font-medium text-white">{r.label}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">{r.desc}</div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setStep('role')} className="flex items-center gap-1 text-sm text-white/40 hover:text-white mb-5 transition-colors">
                <ArrowLeft size={14} /> Voltar
              </button>
              <h2 className="text-lg font-semibold text-white mb-1">
                {ROLE_INFO.find((r) => r.key === selectedRole)?.label}
              </h2>
              <p className="text-sm text-white/40 mb-6">Introduza as suas credenciais</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="input-label">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input"
                    placeholder="email@escola.co.mz"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="input-label">Palavra-passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? 'A entrar...' : 'Entrar'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-white/20 mt-6">
          Desenvolvido por <span className="text-white/40">DTW (Devs To World)</span>
        </p>
      </div>
    </div>
  )
}
