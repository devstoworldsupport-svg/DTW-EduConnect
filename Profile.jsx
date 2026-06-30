// src/pages/shared/Profile.jsx
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { PageHeader, SectionCard, Avatar, FormField } from '@/components/common'
import { Shield, Key, User, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_LABELS = { direction: 'Direcção', teacher: 'Professor', student: 'Aluno', parent: 'Encarregado de Educação' }
const ROLE_COLORS = { direction: 'badge-blue', teacher: 'badge-green', student: 'badge-purple', parent: 'badge-amber' }

export default function ProfilePage() {
  const { profile, user, changePassword } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [contact, setContact] = useState(profile?.contact || '')
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName, contact, updatedAt: serverTimestamp() })
      toast.success('Perfil actualizado')
    } catch { toast.error('Erro ao actualizar') }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) return toast.error('As palavras-passe não coincidem')
    if (pwForm.next.length < 6) return toast.error('Mínimo 6 caracteres')
    setChangingPw(true)
    try {
      await changePassword(pwForm.current, pwForm.next)
      toast.success('Palavra-passe alterada')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (e) {
      toast.error(e.code === 'auth/wrong-password' ? 'Palavra-passe actual incorrecta' : 'Erro ao alterar')
    }
    setChangingPw(false)
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader title="O meu perfil" subtitle="Gerir informações da conta" />

      {/* Profile card */}
      <SectionCard>
        <div className="flex items-center gap-4 mb-5">
          <Avatar name={profile?.displayName} photo={profile?.photoUrl} size="xl" />
          <div>
            <div className="text-lg font-semibold text-white">{profile?.displayName}</div>
            <div className="text-sm text-white/40">{user?.email}</div>
            <span className={`mt-1 inline-block ${ROLE_COLORS[profile?.role] || 'badge-gray'}`}>{ROLE_LABELS[profile?.role] || profile?.role}</span>
          </div>
        </div>
        <div className="space-y-3">
          <FormField label="Nome completo">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input" />
          </FormField>
          <FormField label="Email">
            <input value={user?.email || ''} disabled className="input opacity-50" />
          </FormField>
          <FormField label="Contacto">
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="input" placeholder="+258 8X XXX XXXX" />
          </FormField>
          {profile?.classId && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-white/40">Classe</div>
                <div className="text-sm font-medium text-white mt-0.5">{profile.classId}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-white/40">Turma</div>
                <div className="text-sm font-medium text-white mt-0.5">{profile.classroomName || '—'}</div>
              </div>
            </div>
          )}
          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full">
            <User size={15} /> {saving ? 'A guardar...' : 'Guardar perfil'}
          </button>
        </div>
      </SectionCard>

      {/* Change password */}
      <SectionCard title="Segurança">
        <div className="space-y-3">
          <FormField label="Palavra-passe actual">
            <input type="password" value={pwForm.current} onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} className="input" />
          </FormField>
          <FormField label="Nova palavra-passe">
            <input type="password" value={pwForm.next} onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} className="input" />
          </FormField>
          <FormField label="Confirmar nova palavra-passe">
            <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} className="input" />
          </FormField>
          <button onClick={handleChangePassword} disabled={changingPw || !pwForm.current || !pwForm.next} className="btn-secondary w-full">
            <Key size={15} /> {changingPw ? 'A alterar...' : 'Alterar palavra-passe'}
          </button>
        </div>
      </SectionCard>

      {/* App info */}
      <div className="text-center text-xs text-white/20 py-2">
        DTW EduConnect · Desenvolvido por <span className="text-white/40">DTW (Devs To World)</span>
      </div>
    </div>
  )
}
