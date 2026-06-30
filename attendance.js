// src/services/attendance.js
import {
  collection, doc, addDoc, updateDoc, getDocs, query,
  where, orderBy, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { startOfMonth, endOfMonth, format } from 'date-fns'

const COL = 'attendance'

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  JUSTIFIED: 'justified',
}

// Registar presença/falta
export async function recordAttendance(data) {
  const q = query(
    collection(db, COL),
    where('studentId', '==', data.studentId),
    where('date', '==', data.date),
    where('subjectId', '==', data.subjectId)
  )
  const snap = await getDocs(q)
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { status: data.status, updatedAt: serverTimestamp() })
    return snap.docs[0].id
  }
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() })
  return ref.id
}

// Registar via QR Code (entrada/saída)
export async function recordQRAttendance(studentId, type = 'entry') {
  const today = format(new Date(), 'yyyy-MM-dd')
  const ref = await addDoc(collection(db, 'qr_logs'), {
    studentId, type, date: today,
    timestamp: serverTimestamp(),
  })
  return ref.id
}

// Frequência de um aluno num mês
export function subscribeStudentAttendance(studentId, month, callback) {
  const start = format(startOfMonth(month), 'yyyy-MM-dd')
  const end = format(endOfMonth(month), 'yyyy-MM-dd')
  const q = query(
    collection(db, COL),
    where('studentId', '==', studentId),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date')
  )
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// Frequência de uma turma numa data
export function subscribeClassroomAttendance(classroomId, date, subjectId, callback) {
  let q = query(
    collection(db, COL),
    where('classroomId', '==', classroomId),
    where('date', '==', date)
  )
  if (subjectId) q = query(q, where('subjectId', '==', subjectId))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// Calcular percentagem de frequência
export function calculateAttendanceRate(records) {
  if (!records.length) return 100
  const present = records.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT || r.status === ATTENDANCE_STATUS.LATE).length
  return Math.round((present / records.length) * 100)
}

// Alunos com baixa frequência (< 75%)
export async function getLowAttendanceStudents(classroomId, threshold = 75) {
  const snap = await getDocs(query(collection(db, COL), where('classroomId', '==', classroomId)))
  const byStudent = {}
  snap.docs.forEach((d) => {
    const { studentId, status } = d.data()
    if (!byStudent[studentId]) byStudent[studentId] = { total: 0, present: 0 }
    byStudent[studentId].total++
    if (status === 'present' || status === 'late') byStudent[studentId].present++
  })
  return Object.entries(byStudent)
    .map(([id, data]) => ({ studentId: id, rate: Math.round((data.present / data.total) * 100) }))
    .filter((s) => s.rate < threshold)
}
