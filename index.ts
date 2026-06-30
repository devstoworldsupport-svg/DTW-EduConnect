// functions/src/index.ts
// DTW EduConnect — Cloud Functions
// Desenvolvido por DTW (Devs To World)

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()
const db = admin.firestore()
const messaging = admin.messaging()

// ─── Helper: Send Push Notification ──────────────────────────────────────────
async function sendPushToUser(userId: string, title: string, body: string, data: Record<string, string> = {}) {
  try {
    const userDoc = await db.collection('users').doc(userId).get()
    const fcmToken = userDoc.data()?.fcmToken
    if (!fcmToken) return
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: { priority: 'high', notification: { channelId: 'educonnect' } },
      apns: { payload: { aps: { badge: 1, sound: 'default' } } },
    })
  } catch (e) {
    functions.logger.warn('Push notification failed for user:', userId, e)
  }
}

async function sendPushToRole(role: string, title: string, body: string) {
  const usersSnap = await db.collection('users').where('role', '==', role).get()
  const promises = usersSnap.docs.map((d) => sendPushToUser(d.id, title, body))
  await Promise.allSettled(promises)
}

// ─── Trigger: New Grade → Notify Student & Parent ────────────────────────────
export const onGradeCreated = functions.firestore
  .document('grades/{gradeId}')
  .onCreate(async (snap) => {
    const grade = snap.data()
    const studentSnap = await db.collection('students').doc(grade.studentId).get()
    const student = studentSnap.data()
    if (!student) return

    const subjectName = grade.subjectId || 'disciplina'
    const msg = `${student.fullName}: ${grade.value} valores em ${subjectName}`

    // Notify student
    if (student.userId) await sendPushToUser(student.userId, '📊 Nova nota lançada', msg)
    // Notify parent
    if (student.parentId) await sendPushToUser(student.parentId, '📊 Nota do seu filho', msg)
  })

// ─── Trigger: New Absence → Notify Parent ────────────────────────────────────
export const onAbsenceRecorded = functions.firestore
  .document('attendance/{recordId}')
  .onCreate(async (snap) => {
    const record = snap.data()
    if (record.status !== 'absent') return

    const studentSnap = await db.collection('students').doc(record.studentId).get()
    const student = studentSnap.data()
    if (!student?.parentId) return

    await sendPushToUser(
      student.parentId,
      '⚠️ Falta registada',
      `${student.fullName} faltou à aula em ${record.date}.`
    )
  })

// ─── Trigger: New Notice → Notify All Relevant Users ─────────────────────────
export const onNoticeCreated = functions.firestore
  .document('notices/{noticeId}')
  .onCreate(async (snap) => {
    const notice = snap.data()
    const emoji = notice.priority === 'urgent' ? '🚨' : notice.priority === 'important' ? '⚠️' : '📢'
    const title = `${emoji} ${notice.title}`
    const body = notice.description?.slice(0, 120) || ''

    const targetMap: Record<string, string[]> = {
      all: ['direction', 'teacher', 'student', 'parent'],
      teachers: ['teacher'],
      students: ['student'],
      parents: ['parent'],
      primary: ['student', 'parent'],
      secondary: ['student', 'parent'],
    }

    const roles = targetMap[notice.target] || []
    await Promise.allSettled(roles.map((role) => sendPushToRole(role, title, body)))
  })

// ─── Trigger: Worksheet Published → Notify Students ──────────────────────────
export const onWorksheetCreated = functions.firestore
  .document('worksheets/{worksheetId}')
  .onCreate(async (snap) => {
    const ws = snap.data()
    const typeLabel = { worksheet: 'Ficha', exercise: 'Exercício', test: 'Teste' }[ws.type] || 'Material'
    await sendPushToRole('student', `📄 Novo ${typeLabel} publicado`, `${ws.subject}: ${ws.title}`)
  })

// ─── Scheduled: Check overdue payments daily ──────────────────────────────────
export const checkOverduePayments = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('Africa/Maputo')
  .onRun(async () => {
    const today = new Date().toISOString().split('T')[0]
    const snap = await db.collection('payments')
      .where('status', '==', 'pending')
      .where('dueDate', '<', today)
      .get()

    const batch = db.batch()
    const notifyPromises: Promise<void>[] = []

    for (const doc of snap.docs) {
      const payment = doc.data()
      batch.update(doc.ref, { status: 'late', updatedAt: admin.firestore.FieldValue.serverTimestamp() })
      // Get student info for parent notification
      notifyPromises.push(
        db.collection('students').doc(payment.studentId).get().then(async (stSnap) => {
          const student = stSnap.data()
          if (student?.parentId) {
            await sendPushToUser(
              student.parentId,
              '💸 Mensalidade em atraso',
              `A mensalidade de ${student.fullName} está em atraso. Por favor regularize na escola.`
            )
          }
        })
      )
    }

    await Promise.all([batch.commit(), ...notifyPromises])
    functions.logger.info(`Marked ${snap.size} payments as late`)
  })

// ─── Callable: Register FCM Token ─────────────────────────────────────────────
export const registerFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')
  const { token } = data
  if (!token) throw new functions.https.HttpsError('invalid-argument', 'Token required')
  await db.collection('users').doc(context.auth.uid).update({ fcmToken: token, updatedAt: admin.firestore.FieldValue.serverTimestamp() })
  return { success: true }
})

// ─── Callable: Generate School Statistics ─────────────────────────────────────
export const getSchoolStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required')
  const userDoc = await db.collection('users').doc(context.auth.uid).get()
  if (userDoc.data()?.role !== 'direction') throw new functions.https.HttpsError('permission-denied', 'Direction only')

  const [students, teachers, payments, attendance] = await Promise.all([
    db.collection('students').where('active', '==', true).count().get(),
    db.collection('teachers').where('active', '==', true).count().get(),
    db.collection('payments').get(),
    db.collection('attendance').get(),
  ])

  const payDocs = payments.docs.map((d) => d.data())
  const attDocs = attendance.docs.map((d) => d.data())
  const attRate = attDocs.length ? Math.round(attDocs.filter((a) => a.status === 'present').length / attDocs.length * 100) : 0

  return {
    totalStudents: students.data().count,
    totalTeachers: teachers.data().count,
    paymentStats: {
      paid: payDocs.filter((p) => p.status === 'paid').length,
      pending: payDocs.filter((p) => p.status === 'pending').length,
      late: payDocs.filter((p) => p.status === 'late').length,
      revenue: payDocs.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0),
    },
    attendanceRate: attRate,
  }
})
