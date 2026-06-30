// src/services/notices.js
import { collection, addDoc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, doc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/config/firebase'

export const NOTICE_PRIORITY = { NORMAL: 'normal', IMPORTANT: 'important', URGENT: 'urgent' }
export const NOTICE_TARGET = {
  ALL: 'all', PRIMARY: 'primary', SECONDARY: 'secondary',
  CLASS: 'class', CLASSROOM: 'classroom', TEACHERS: 'teachers', STUDENTS: 'students', PARENTS: 'parents',
}

export async function createNotice(data, attachments = []) {
  const urls = []
  for (const file of attachments) {
    const sRef = ref(storage, `notices/${Date.now()}_${file.name}`)
    const snap = await uploadBytes(sRef, file)
    urls.push(await getDownloadURL(snap.ref))
  }
  const ref2 = await addDoc(collection(db, 'notices'), {
    ...data, attachments: urls, createdAt: serverTimestamp(), active: true,
  })
  return ref2.id
}

export function subscribeNotices(filters, callback) {
  let q = query(collection(db, 'notices'), where('active', '==', true), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    let notices = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    if (filters?.role) {
      notices = notices.filter((n) => {
        if (n.target === 'all') return true
        if (n.target === 'teachers' && filters.role === 'teacher') return true
        if (n.target === 'students' && filters.role === 'student') return true
        if (n.target === 'parents' && filters.role === 'parent') return true
        if (n.target === 'class' && n.targetId === filters.classId) return true
        if (n.target === 'classroom' && n.targetId === filters.classroomId) return true
        return false
      })
    }
    callback(notices)
  })
}

export async function markNoticeRead(noticeId, userId) {
  await updateDoc(doc(db, 'notices', noticeId), { [`readBy.${userId}`]: serverTimestamp() })
}


// src/services/payments.js — inline export
export async function createPayment(data) {
  const ref2 = await addDoc(collection(db, 'payments'), {
    ...data, createdAt: serverTimestamp(), status: 'pending',
  })
  return ref2.id
}

export function subscribeStudentPayments(studentId, callback) {
  const q = query(collection(db, 'payments'), where('studentId', '==', studentId), orderBy('dueDate', 'desc'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

export async function getPendingPayments() {
  const snap = await getDocs(query(collection(db, 'payments'), where('status', '==', 'pending')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function markPaymentPaid(paymentId, proofUrl) {
  await updateDoc(doc(db, 'payments', paymentId), {
    status: 'paid', paidAt: serverTimestamp(), proofUrl: proofUrl || null,
  })
}
