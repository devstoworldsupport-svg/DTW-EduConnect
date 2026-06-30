// src/services/grades.js
import {
  collection, doc, addDoc, updateDoc, getDocs, query,
  where, orderBy, onSnapshot, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

const COL = 'grades'

// Lançar nota individual
export async function setGrade(data) {
  const q = query(
    collection(db, COL),
    where('studentId', '==', data.studentId),
    where('subjectId', '==', data.subjectId),
    where('term', '==', data.term),
    where('type', '==', data.type)
  )
  const snap = await getDocs(q)
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, { value: data.value, updatedAt: serverTimestamp() })
    return snap.docs[0].id
  }
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

// Lançar notas em batch (múltiplos alunos de uma vez)
export async function setBatchGrades(gradesArray) {
  const batch = writeBatch(db)
  for (const g of gradesArray) {
    const ref = doc(collection(db, COL))
    batch.set(ref, { ...g, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }
  await batch.commit()
}

// Notas de um aluno
export function subscribeStudentGrades(studentId, callback) {
  const q = query(collection(db, COL), where('studentId', '==', studentId), orderBy('term'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// Notas de uma turma por disciplina
export function subscribeClassroomGrades(classroomId, subjectId, term, callback) {
  let q = query(
    collection(db, COL),
    where('classroomId', '==', classroomId),
    where('subjectId', '==', subjectId)
  )
  if (term) q = query(q, where('term', '==', term))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

// Calcular média de um aluno numa disciplina
export function calculateAverage(grades, subjectId) {
  const subjectGrades = grades.filter((g) => g.subjectId === subjectId)
  if (!subjectGrades.length) return null
  const sum = subjectGrades.reduce((acc, g) => acc + (parseFloat(g.value) || 0), 0)
  return Math.round((sum / subjectGrades.length) * 10) / 10
}

// Calcular média geral do aluno
export function calculateOverallAverage(grades) {
  const subjects = [...new Set(grades.map((g) => g.subjectId))]
  if (!subjects.length) return null
  const avgs = subjects.map((s) => calculateAverage(grades, s)).filter(Boolean)
  const sum = avgs.reduce((acc, a) => acc + a, 0)
  return Math.round((sum / avgs.length) * 10) / 10
}

// Relatório de notas por turma
export async function getClassroomGradesReport(classroomId, term) {
  let q = query(collection(db, COL), where('classroomId', '==', classroomId))
  if (term) q = query(q, where('term', '==', term))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
