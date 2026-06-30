// src/pages/NotFound.jsx
import { Link } from 'react-router-dom'
import { School, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-center p-4">
      <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <School size={28} className="text-brand" />
      </div>
      <div className="text-7xl font-bold text-white/10 mb-4">404</div>
      <h1 className="text-xl font-semibold text-white mb-2">Página não encontrada</h1>
      <p className="text-white/40 text-sm mb-6">A página que procura não existe ou foi movida.</p>
      <Link to="/" className="btn-primary"><ArrowLeft size={15} /> Voltar ao início</Link>
      <p className="text-xs text-white/20 mt-8">DTW EduConnect · Devs To World</p>
    </div>
  )
}
