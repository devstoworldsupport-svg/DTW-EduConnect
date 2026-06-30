// src/services/eduai.js
// DTW EduAI — Integração Gemini com RAG sobre Firestore
import { GoogleGenerativeAI } from '@google/generative-ai'
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { calculateOverallAverage, calculateAverage } from './grades'
import { calculateAttendanceRate } from './attendance'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

const SYSTEM_PROMPT = `És a DTW EduAI, a assistente escolar inteligente desenvolvida pela DTW (Devs To World).
Respondes sempre em português de Moçambique, de forma clara, amigável e profissional.
Quando tens dados reais do utilizador, usa-os nas respostas.
Não inventes dados — se não tiveres informação, diz que não tens acesso a esses dados.
Mantém um tom encorajador com alunos, informativo com professores e encarregados, e analítico com a direção.`

// Recolher contexto do utilizador no Firestore para RAG
async function buildUserContext(profile) {
  const context = { role: profile.role, name: profile.displayName }

  if (profile.role === 'student') {
    // Notas
    const gradesSnap = await getDocs(query(collection(db, 'grades'), where('studentId', '==', profile.studentId), limit(50)))
    const grades = gradesSnap.docs.map((d) => d.data())
    context.grades = grades
    context.overallAverage = calculateOverallAverage(grades)

    // Frequência
    const attSnap = await getDocs(query(collection(db, 'attendance'), where('studentId', '==', profile.studentId), limit(100)))
    const attendance = attSnap.docs.map((d) => d.data())
    context.attendanceRate = calculateAttendanceRate(attendance)
    context.totalAbsences = attendance.filter((a) => a.status === 'absent').length

    // Próximas avaliações
    const schedSnap = await getDocs(query(collection(db, 'schedules'), where('classroomId', '==', profile.classroomId), limit(20)))
    context.schedule = schedSnap.docs.map((d) => d.data())

    // Mensalidades pendentes
    const paySnap = await getDocs(query(collection(db, 'payments'), where('studentId', '==', profile.studentId), where('status', '==', 'pending'), limit(5)))
    context.pendingPayments = paySnap.docs.map((d) => d.data())
  }

  if (profile.role === 'teacher') {
    // Turmas do professor
    const classSnap = await getDocs(query(collection(db, 'classrooms'), where('teacherIds', 'array-contains', profile.uid), limit(10)))
    context.classrooms = classSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }

  if (profile.role === 'parent') {
    // Filhos do encarregado
    const studSnap = await getDocs(query(collection(db, 'students'), where('parentId', '==', profile.uid), where('active', '==', true)))
    context.children = studSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

    // Notas e frequência dos filhos
    for (const child of context.children) {
      const gSnap = await getDocs(query(collection(db, 'grades'), where('studentId', '==', child.id), limit(30)))
      child.grades = gSnap.docs.map((d) => d.data())
      child.overallAverage = calculateOverallAverage(child.grades)
      const aSnap = await getDocs(query(collection(db, 'attendance'), where('studentId', '==', child.id), limit(60)))
      const att = aSnap.docs.map((d) => d.data())
      child.attendanceRate = calculateAttendanceRate(att)
    }
  }

  if (profile.role === 'direction') {
    const studSnap = await getDocs(query(collection(db, 'students'), where('active', '==', true)))
    context.totalStudents = studSnap.size
    const teachSnap = await getDocs(query(collection(db, 'teachers'), where('active', '==', true)))
    context.totalTeachers = teachSnap.size
    const pendSnap = await getDocs(query(collection(db, 'payments'), where('status', '==', 'pending')))
    context.pendingPaymentsCount = pendSnap.size
  }

  return context
}

// Guardar conversa no Firestore
async function saveConversation(userId, messages, response) {
  await addDoc(collection(db, 'ai_conversations'), {
    userId, messages: messages.slice(-6), response,
    createdAt: serverTimestamp(),
  })
}

// Função principal do chat
export async function chatWithEduAI(userMessage, profile, conversationHistory = []) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  // Recolher contexto real do utilizador
  const userContext = await buildUserContext(profile)

  const contextStr = `
DADOS REAIS DO UTILIZADOR:
${JSON.stringify(userContext, null, 2)}

INSTRUÇÕES: Usa estes dados reais ao responder. Se o utilizador perguntar sobre notas, frequência, mensalidades ou horários, usa os dados acima.`

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT + contextStr }] },
      { role: 'model', parts: [{ text: 'Entendido. Estou pronto para ajudar com dados reais.' }] },
      ...conversationHistory.slice(-8).map((m) => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    ],
  })

  const result = await chat.sendMessage(userMessage)
  const response = result.response.text()

  // Guardar conversa
  await saveConversation(profile.uid, [...conversationHistory, { role: 'user', content: userMessage }], response)

  return response
}

// Funções especializadas por perfil
export async function generateStudyPlan(profile, subject) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const context = await buildUserContext(profile)
  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\nCria um plano de estudo personalizado para ${profile.displayName} para a disciplina de ${subject}.\nDados: ${JSON.stringify(context)}\n\nFormata em secções claras com horários e recursos.`
  )
  return result.response.text()
}

export async function generateTeacherTest(profile, subject, topic, classLevel) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\nCria um teste de avaliação para a disciplina de ${subject}, tema: ${topic}, nível: ${classLevel}ª Classe.\nInclui: 5 questões de escolha múltipla, 3 questões de desenvolvimento, 1 problema prático.\nAdiciona grelha de cotação no final.`
  )
  return result.response.text()
}

export async function generateLessonPlan(subject, topic, classLevel, duration) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\nCria um plano de aula detalhado para:\nDisciplina: ${subject}\nTema: ${topic}\nNível: ${classLevel}ª Classe\nDuração: ${duration} minutos\n\nEstrutura: objectivos, materiais, introdução, desenvolvimento, consolidação, avaliação.`
  )
  return result.response.text()
}

export async function analyzeStudentRisk(profile) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const context = await buildUserContext(profile)
  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\nAnalisa o risco de reprovação com base nos dados:\n${JSON.stringify(context)}\n\nIdentifica: alunos em risco, causas prováveis, recomendações de intervenção.`
  )
  return result.response.text()
}
