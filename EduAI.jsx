// src/pages/shared/EduAI.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { chatWithEduAI, generateStudyPlan, generateTeacherTest, generateLessonPlan } from '@/services/eduai'
import { Bot, Send, User, Sparkles, BookOpen, ClipboardList, GraduationCap, Trash2, Copy, Check } from 'lucide-react'
import { Spinner } from '@/components/common'
import toast from 'react-hot-toast'

const QUICK_PROMPTS = {
  student: [
    'Qual é a minha média geral?',
    'Quantas faltas tenho este mês?',
    'Cria um plano de estudo para Matemática',
    'Explica-me o teorema de Pitágoras',
    'Quais são as minhas notas de Português?',
  ],
  teacher: [
    'Gera um teste de Matemática para o 10º ano',
    'Cria um plano de aula sobre funções',
    'Cria exercícios de revisão',
    'Quais os alunos com mais dificuldades?',
  ],
  parent: [
    'Como está o desempenho do meu filho?',
    'Quantas faltas tem o meu filho?',
    'Qual a próxima mensalidade?',
    'Há avisos importantes esta semana?',
  ],
  direction: [
    'Quantos alunos temos este ano?',
    'Quais turmas têm menor frequência?',
    'Relatório financeiro do mês',
    'Identifica alunos em risco de reprovação',
  ],
}

function ChatMessage({ msg, onCopy }) {
  const [copied, setCopied] = useState(false)
  const isAI = msg.role === 'ai'

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy?.()
  }

  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isAI ? 'bg-brand' : 'bg-white/10'}`}>
        {isAI ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white/60" />}
      </div>
      <div className={`max-w-[80%] group`}>
        {isAI && <div className="text-[10px] text-brand mb-1 font-semibold">DTW EduAI</div>}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isAI ? 'bg-white/5 text-white/90 rounded-tl-sm' : 'bg-brand text-white rounded-tr-sm'}`}>
          {msg.content}
        </div>
        {isAI && (
          <button onClick={handleCopy} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/60">
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function EduAIPage() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([
    { role: 'ai', content: `Olá! Sou a DTW EduAI, assistente escolar inteligente desenvolvida pela DTW (Devs To World).\n\nPosso ajudar com notas, frequência, mensalidades, planos de estudo e muito mais — usando os seus dados reais.\n\nComo posso ajudar?` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeMode, setActiveMode] = useState(null)
  const bottomRef = useRef()
  const inputRef = useRef()

  const role = profile?.role || 'student'
  const quickPrompts = QUICK_PROMPTS[role] || QUICK_PROMPTS.student

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const history = messages.slice(-10)
      const response = await chatWithEduAI(msg, profile, history)
      setMessages((prev) => [...prev, { role: 'ai', content: response }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Ocorreu um erro. Verifique a configuração da Gemini API e tente novamente.' }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const handleSpecial = async (mode) => {
    setActiveMode(mode)
    setLoading(true)
    let response = ''
    try {
      if (mode === 'studyplan') response = await generateStudyPlan(profile, 'Matemática')
      else if (mode === 'test') response = await generateTeacherTest(profile, 'Matemática', 'Funções', '10')
      else if (mode === 'lesson') response = await generateLessonPlan('Matemática', 'Funções quadráticas', '10', 90)
    } catch { response = 'Erro ao gerar conteúdo. Verifique a sua chave Gemini API.' }
    setMessages((prev) => [...prev, { role: 'ai', content: response }])
    setLoading(false)
    setActiveMode(null)
  }

  const clearChat = () => {
    setMessages([{ role: 'ai', content: 'Chat limpo. Como posso ajudar?' }])
    toast.success('Chat limpo')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4 flex-shrink-0">
        <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">DTW EduAI</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            Online · Gemini 1.5 Flash + RAG Firestore
          </div>
        </div>
        <button onClick={clearChat} className="ml-auto btn-icon text-white/30 hover:text-white/60">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Special tools for teachers */}
      {(role === 'teacher' || role === 'direction') && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
          <button onClick={() => handleSpecial('test')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-purple-500/20 transition-colors whitespace-nowrap">
            <ClipboardList size={13} /> Gerar Teste
          </button>
          <button onClick={() => handleSpecial('lesson')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 hover:bg-blue-500/20 transition-colors whitespace-nowrap">
            <GraduationCap size={13} /> Plano de Aula
          </button>
        </div>
      )}
      {role === 'student' && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0">
          <button onClick={() => handleSpecial('studyplan')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors whitespace-nowrap">
            <BookOpen size={13} /> Plano de Estudo
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-xs text-white/40">DTW EduAI está a pensar...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1 flex-shrink-0">
        {quickPrompts.map((p) => (
          <button key={p} onClick={() => sendMessage(p)} className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 hover:bg-white/10 hover:text-white transition-colors">
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-3 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          placeholder="Escreva a sua mensagem..."
          className="input flex-1"
          disabled={loading}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="btn-primary px-3 disabled:opacity-30">
          <Send size={16} />
        </button>
      </div>
      <p className="text-[10px] text-white/20 text-center mt-2">DTW EduAI pode cometer erros. Verifique informações importantes.</p>
    </div>
  )
}
