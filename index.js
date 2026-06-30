// src/services/index.js — All service exports

// ─── CLASSES & CLASSROOMS ─────────────────────────────────────────────────────
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/config/firebase'

export async function getClasses() {
  const snap = await getDocs(query(collection(db, 'classes'), orderBy('level')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
export async function createClass(data) {
  const r = await addDoc(collection(db, 'classes'), { ...data, createdAt: serverTimestamp() })
  return r.id
}
export function subscribeClasses(cb) {
  return onSnapshot(query(collection(db, 'classes'), orderBy('level')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

export async function getClassrooms(classId) {
  let q = query(collection(db, 'classrooms'), orderBy('name'))
  if (classId) q = query(q, where('classId', '==', classId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
export function subscribeClassrooms(classId, cb) {
  let q = query(collection(db, 'classrooms'), orderBy('name'))
  if (classId) q = query(q, where('classId', '==', classId))
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export async function createClassroom(data) {
  const r = await addDoc(collection(db, 'classrooms'), { ...data, createdAt: serverTimestamp() })
  return r.id
}
export async function updateClassroom(id, data) {
  await updateDoc(doc(db, 'classrooms', id), { ...data, updatedAt: serverTimestamp() })
}

// ─── TEACHERS ────────────────────────────────────────────────────────────────
export function subscribeTeachers(cb) {
  return onSnapshot(query(collection(db, 'teachers'), where('active', '==', true), orderBy('fullName')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export async function createTeacher(data) {
  const r = await addDoc(collection(db, 'teachers'), { ...data, active: true, createdAt: serverTimestamp() })
  return r.id
}
export async function updateTeacher(id, data) {
  await updateDoc(doc(db, 'teachers', id), { ...data, updatedAt: serverTimestamp() })
}
export async function deleteTeacher(id) {
  await updateDoc(doc(db, 'teachers', id), { active: false })
}

// ─── PARENTS ────────────────────────────────────────────────────────────────
export function subscribeParents(cb) {
  return onSnapshot(query(collection(db, 'parents'), where('active', '==', true), orderBy('fullName')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export async function createParent(data) {
  const r = await addDoc(collection(db, 'parents'), { ...data, active: true, createdAt: serverTimestamp() })
  return r.id
}
export async function updateParent(id, data) {
  await updateDoc(doc(db, 'parents', id), { ...data, updatedAt: serverTimestamp() })
}

// ─── SCHEDULES ───────────────────────────────────────────────────────────────
export function subscribeSchedule(classroomId, cb) {
  const q = query(collection(db, 'schedules'), where('classroomId', '==', classroomId), orderBy('day'), orderBy('startTime'))
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export async function setScheduleSlot(data) {
  const q = query(collection(db, 'schedules'), where('classroomId', '==', data.classroomId), where('day', '==', data.day), where('slot', '==', data.slot))
  const snap = await getDocs(q)
  if (!snap.empty) { await updateDoc(snap.docs[0].ref, { ...data, updatedAt: serverTimestamp() }); return }
  await addDoc(collection(db, 'schedules'), { ...data, createdAt: serverTimestamp() })
}

// ─── WORKSHEETS / EXERCISES ──────────────────────────────────────────────────
export function subscribeWorksheets(teacherId, cb) {
  let q = query(collection(db, 'worksheets'), orderBy('createdAt', 'desc'))
  if (teacherId) q = query(q, where('teacherId', '==', teacherId))
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export function subscribeStudentWorksheets(classroomId, cb) {
  const q = query(collection(db, 'worksheets'), where('classroomIds', 'array-contains', classroomId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export async function createWorksheet(data, file) {
  let fileUrl = null
  if (file) {
    const sRef = ref(storage, `worksheets/${Date.now()}_${file.name}`)
    const snap = await uploadBytes(sRef, file)
    fileUrl = await getDownloadURL(snap.ref)
  }
  const r = await addDoc(collection(db, 'worksheets'), { ...data, fileUrl, createdAt: serverTimestamp() })
  return r.id
}
export async function deleteWorksheet(id) {
  await deleteDoc(doc(db, 'worksheets', id))
}

// ─── LIBRARY ─────────────────────────────────────────────────────────────────
export function subscribeLibrary(cb) {
  return onSnapshot(query(collection(db, 'library'), orderBy('createdAt', 'desc')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export async function addLibraryItem(data, file) {
  let fileUrl = null
  if (file) {
    const sRef = ref(storage, `library/${Date.now()}_${file.name}`)
    const snap = await uploadBytes(sRef, file)
    fileUrl = await getDownloadURL(snap.ref)
  }
  const r = await addDoc(collection(db, 'library'), { ...data, fileUrl, createdAt: serverTimestamp() })
  return r.id
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export function subscribePayments(filters, cb) {
  let q = query(collection(db, 'payments'), orderBy('dueDate', 'desc'))
  if (filters?.studentId) q = query(collection(db, 'payments'), where('studentId', '==', filters.studentId), orderBy('dueDate', 'desc'))
  if (filters?.status) q = query(collection(db, 'payments'), where('status', '==', filters.status), orderBy('dueDate', 'desc'))
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export async function createPayment(data) {
  const r = await addDoc(collection(db, 'payments'), { ...data, createdAt: serverTimestamp() })
  return r.id
}
export async function updatePaymentStatus(id, status, proof) {
  await updateDoc(doc(db, 'payments', id), { status, paidAt: status === 'paid' ? serverTimestamp() : null, proofUrl: proof || null, updatedAt: serverTimestamp() })
}

// ─── QR LOGS ─────────────────────────────────────────────────────────────────
export function subscribeQRLogs(studentId, cb) {
  const q = query(collection(db, 'qr_logs'), where('studentId', '==', studentId), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
export async function recordQRLog(studentId, type) {
  const r = await addDoc(collection(db, 'qr_logs'), { studentId, type, timestamp: serverTimestamp() })
  return r.id
}

// ─── USERS ───────────────────────────────────────────────────────────────────
export async function createUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })
}
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export async function saveReport(data) {
  const r = await addDoc(collection(db, 'reports'), { ...data, createdAt: serverTimestamp() })
  return r.id
}
export function subscribeReports(cb) {
  return onSnapshot(query(collection(db, 'reports'), orderBy('createdAt', 'desc')), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
}
