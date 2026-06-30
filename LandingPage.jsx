// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom'
import { School, Users, GraduationCap, BookOpen, Bell, DollarSign, Bot, QrCode, Shield, Smartphone, CheckCircle, ArrowRight, Star, ChevronRight } from 'lucide-react'

const FEATURES = [
  { icon: Users, title: 'Gestão de Alunos', desc: 'Perfis completos com QR Code, foto, notas e frequência em tempo real.', color: 'text-blue-400 bg-blue-500/10' },
  { icon: GraduationCap, title: 'Professores', desc: 'Lançamento de notas, presenças e publicação de fichas e exercícios.', color: 'text-emerald-400 bg-emerald-500/10' },
  { icon: Bell, title: 'Avisos Segmentados', desc: 'Envie comunicados para toda a escola, classes específicas ou turmas.', color: 'text-purple-400 bg-purple-500/10' },
  { icon: DollarSign, title: 'Gestão Financeira', desc: 'Controlo de mensalidades, pagamentos e relatórios automáticos.', color: 'text-amber-400 bg-amber-500/10' },
  { icon: Bot, title: 'DTW EduAI', desc: 'IA inteligente com acesso a dados reais do Firestore via RAG.', color: 'text-pink-400 bg-pink-500/10' },
  { icon: QrCode, title: 'QR Code Escolar', desc: 'Cartão digital com QR para controlo de entradas e saídas.', color: 'text-cyan-400 bg-cyan-500/10' },
  { icon: Shield, title: 'Segurança Total', desc: 'Firestore Security Rules e controlo de permissões por perfil.', color: 'text-red-400 bg-red-500/10' },
  { icon: Smartphone, title: 'PWA Instalável', desc: 'Instale como app no Android, iPhone, Windows e Chromebook.', color: 'text-indigo-400 bg-indigo-500/10' },
]

const PROFILES = [
  { role: 'Direção', color: 'from-blue-600 to-blue-800', items: ['Dashboard analítico completo', 'Gestão de alunos e professores', 'Relatórios e estatísticas', 'Controlo financeiro', 'Gestão de avisos'] },
  { role: 'Professor', color: 'from-emerald-600 to-emerald-800', items: ['Lançamento de notas', 'Registo de presenças', 'Publicação de fichas', 'Geração de testes com IA', 'Calendário de avaliações'] },
  { role: 'Aluno', color: 'from-purple-600 to-purple-800', items: ['Dashboard pessoal', 'Consulta de notas e frequência', 'Horário escolar', 'Biblioteca digital', 'Assistente de estudo IA'] },
  { role: 'Encarregado', color: 'from-amber-600 to-amber-800', items: ['Acompanhamento de filhos', 'Notas e frequência', 'Histórico de pagamentos', 'Recepção de avisos', 'Relatórios simplificados'] },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-navy-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <School size={16} className="text-white" />
            </div>
            <span className="text-sm font-semibold">DTW EduConnect</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#features" className="text-sm text-white/50 hover:text-white hidden md:block transition-colors">Funcionalidades</a>
            <a href="#profiles" className="text-sm text-white/50 hover:text-white hidden md:block transition-colors">Perfis</a>
            <Link to="/login" className="btn-primary btn-sm">Entrar <ArrowRight size={13} /></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/6 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-xs text-brand mb-6">
            <Star size={11} /> Plataforma Escolar Inteligente · DTW (Devs To World)
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
            Gestão Escolar<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-purple-400">Inteligente e Moderna</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
            DTW EduConnect é a plataforma completa para escolas — conectando alunos, professores, encarregados e direcção numa única solução digital.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/login" className="btn-primary px-6 py-3 text-base">Começar agora <ArrowRight size={16} /></Link>
            <a href="#features" className="btn-secondary px-6 py-3 text-base">Ver funcionalidades</a>
          </div>
          {/* Stats */}
          <div className="flex gap-8 justify-center mt-12 flex-wrap">
            {[['4', 'Perfis de acesso'], ['12', 'Classes suportadas'], ['∞', 'Alunos e turmas'], ['PWA', 'Instalável como app']].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-bold text-white">{v}</div>
                <div className="text-xs text-white/30 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Tudo o que a sua escola precisa</h2>
            <p className="text-white/40">Uma plataforma completa, moderna e fácil de usar</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card p-5 hover:border-white/20 transition-all hover:-translate-y-0.5 duration-200">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Profiles */}
      <section id="profiles" className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Um sistema para todos</h2>
            <p className="text-white/40">Cada perfil tem o seu próprio dashboard e permissões</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROFILES.map((p) => (
              <div key={p.role} className="card overflow-hidden">
                <div className={`bg-gradient-to-br ${p.color} p-4`}>
                  <div className="text-lg font-bold text-white">{p.role}</div>
                </div>
                <div className="p-4 space-y-2">
                  {p.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-white/60">
                      <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8 bg-gradient-to-br from-brand/10 to-purple-500/10 border-brand/20 text-center">
            <div className="w-14 h-14 bg-brand/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot size={28} className="text-brand" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">DTW EduAI</h2>
            <p className="text-white/50 mb-4 max-w-xl mx-auto">Assistente inteligente com acesso a dados reais. Responde sobre notas, frequência, mensalidades e muito mais — em tempo real.</p>
            <div className="bg-white/5 rounded-xl p-4 text-left max-w-md mx-auto mb-6">
              <div className="text-xs text-white/30 mb-2">DTW EduAI</div>
              <p className="text-sm text-white/80">"Olá! Sou a DTW EduAI. A tua média de Matemática é <strong>15,5</strong> e tens <strong>96%</strong> de frequência este mês. Posso ajudar-te a melhorar? 📚"</p>
            </div>
            <Link to="/login" className="btn-primary px-6 py-2.5">Experimentar agora <ChevronRight size={15} /></Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Pronto para começar?</h2>
        <p className="text-white/40 mb-6">Transforme a gestão da sua escola hoje.</p>
        <Link to="/login" className="btn-primary px-8 py-3 text-base">Entrar na plataforma <ArrowRight size={16} /></Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center"><School size={14} /></div>
            <span className="text-sm font-semibold text-white">DTW EduConnect</span>
          </div>
          <p className="text-xs text-white/30">Desenvolvido por <span className="text-white/50 font-medium">DTW (Devs To World)</span> · {new Date().getFullYear()}</p>
          <div className="flex gap-4 text-xs text-white/30">
            <span>Privacidade</span><span>Termos</span><span>Suporte</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
