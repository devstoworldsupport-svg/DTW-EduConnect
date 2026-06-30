// src/services/students.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, limit,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/config/firebase'
import QRCode from 'qrcode'

const COL = 'students'

// Gerar QR Code único para o aluno
async function generateQRCode(studentId) {
  const url = await QRCode.toDataURL(`dtw-edu://student/${studentId}`, {
    errorCorrectionLevel: 'H', type: 'image/png', quality: 0.95,
    margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' },
  })
  return url
}

// Upload de foto do aluno para Firebase Storage
export async function uploadStudentPhoto(studentId, file) {
  const storageRef = ref(storage, `students/${studentId}/photo`)
  const snap = await uploadBytes(storageRef, file, { contentType: file.type })
  return getDownloadURL(snap.ref)
}

// Criar aluno
export async function createStudent(data) {
  const docRef = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    active: true,
  })
  const qrCode = await generateQRCode(docRef.id)
  await updateDoc(docRef, { id: docRef.id, qrCode })
  return docRef.id
}

// Actualizar aluno
export async function updateStudent(id, data) {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

// Apagar aluno (soft delete)
export async function deleteStudent(id) {
  await updateDoc(doc(db, COL, id), { active: false, updatedAt: serverTimestamp() })
}

// Obter aluno por ID
export async function getStudent(id) {
  const snap = await getDoc(doc(db, COL, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Listar todos os alunos activos
export async function getStudents(filters = {}) {
  let q = query(collection(db, COL), where('active', '==', true), orderBy('fullName'))
  if (filters.classId) q = query(q, where('classId', '==', filters.classId))
  if (filters.classroomId) q = query(q, where('classroomId', '==', filters.classroomId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Listener em tempo real
export function subscribeStudents(filters, callback) {
  let q = query(collection(db, COL), where('active', '==', true), orderBy('fullName'))
  if (filters?.classId) q = query(q, where('classId', '==', filters.classId))
  if (filters?.classroomId) q = query(q, where('classroomId', '==', filters.classroomId))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// Busca rápida por nome ou número
export async function searchStudents(term) {
  const snap = await getDocs(query(collection(db, COL), where('active', '==', true), orderBy('fullName'), limit(20)))
  const lower = term.toLowerCase()
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => s.fullName?.toLowerCase().includes(lower) || s.number?.toString().includes(term))
}

// Alunos por encarregado
export function subscribeStudentsByParent(parentId, callback) {
  const q = query(collection(db, COL), where('parentId', '==', parentId), where('active', '==', true))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// Estatísticas para dashboard
export async function getStudentStats() {
  const snap = await getDocs(query(collection(db, COL), where('active', '==', true)))
  const students = snap.docs.map((d) => d.data())
  const byClass = {}
  students.forEach((s) => {
    byClass[s.classId] = (byClass[s.classId] || 0) + 1
  })
  return { total: students.length, byClass }
}
