// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/config/firebase'

const AuthContext = createContext(null)

export const ROLES = {
  DIRECTION: 'direction',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setProfile(data)
          setUser(firebaseUser)
          // Registar último acesso
          await setDoc(doc(db, 'users', firebaseUser.uid), { lastLogin: serverTimestamp() }, { merge: true })
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result
  }

  const logout = async () => {
    await signOut(auth)
  }

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  const changePassword = async (currentPassword, newPassword) => {
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
  }

  // Helpers de permissão
  const isDirection = () => profile?.role === ROLES.DIRECTION
  const isTeacher = () => profile?.role === ROLES.TEACHER
  const isStudent = () => profile?.role === ROLES.STUDENT
  const isParent = () => profile?.role === ROLES.PARENT
  const can = (action) => {
    const permissions = {
      manageUsers: [ROLES.DIRECTION],
      viewAllStudents: [ROLES.DIRECTION],
      editGrades: [ROLES.TEACHER, ROLES.DIRECTION],
      viewFinance: [ROLES.DIRECTION],
      createNotices: [ROLES.DIRECTION, ROLES.TEACHER],
      viewOwnData: [ROLES.STUDENT, ROLES.PARENT, ROLES.TEACHER, ROLES.DIRECTION],
    }
    return permissions[action]?.includes(profile?.role) ?? false
  }

  const value = { user, profile, loading, login, logout, resetPassword, changePassword, isDirection, isTeacher, isStudent, isParent, can, ROLES }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
