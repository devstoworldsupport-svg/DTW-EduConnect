// src/config/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// INSTRUÇÕES DE CONFIGURAÇÃO:
// 1. Crie um projecto no Firebase Console (https://console.firebase.google.com)
// 2. Active: Authentication, Firestore, Storage, Cloud Functions, Hosting
// 3. Substitua os valores abaixo com as credenciais do seu projecto
// 4. Copie as regras de segurança de /firestore.rules para o seu projecto
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getMessaging, isSupported } from 'firebase/messaging'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'us-central1')
export const analytics = getAnalytics(app)

// Persistência offline para PWA
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistência offline: múltiplos separadores abertos')
  } else if (err.code === 'unimplemented') {
    console.warn('Persistência offline não suportada neste browser')
  }
})

// Mensagens push (opcional, falha graciosamente em ambientes sem suporte)
export let messaging = null
isSupported().then((supported) => {
  if (supported) messaging = getMessaging(app)
})

export default app
