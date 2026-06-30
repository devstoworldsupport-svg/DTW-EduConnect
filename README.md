# DTW EduConnect

**Plataforma escolar inteligente desenvolvida pela DTW (Devs To World)**

[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-10-orange)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-cyan)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-green)](https://web.dev/pwa)

---

## 📋 Visão Geral

DTW EduConnect é uma plataforma web completa e PWA para gestão escolar, desenvolvida com React + Vite + Firebase. Suporta 4 perfis de acesso com dashboards independentes, IA integrada (Gemini) e funciona offline.

### Perfis de Acesso
| Perfil | Acesso |
|--------|--------|
| **Direcção** | Gestão total: alunos, professores, finanças, relatórios |
| **Professor** | Notas, presenças, fichas, exercícios |
| **Aluno** | Notas, horário, biblioteca, EduAI |
| **Encarregado** | Filhos associados, notas, mensalidades |

---

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js ≥ 18
- npm ≥ 9
- Conta Firebase (gratuita em [console.firebase.google.com](https://console.firebase.google.com))
- Chave Gemini API (gratuita em [aistudio.google.com](https://aistudio.google.com))

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Firebase

1. Aceda a [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projecto (ex: `dtw-educonnect-escola`)
3. Active os seguintes serviços:
   - **Authentication** → Email/Password
   - **Firestore Database** → Modo de produção
   - **Storage** → Modo de produção
   - **Hosting**
   - **Cloud Functions** (requer plano Blaze/pay-as-you-go)
4. Nas **Definições do projecto** → **Apps web** → Adicionar app → copie as credenciais

### 3. Variáveis de ambiente

Copie o ficheiro de exemplo:
```bash
cp .env.example .env
```

Preencha o `.env` com as suas credenciais:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projecto
VITE_FIREBASE_STORAGE_BUCKET=seu-projecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google AI Studio → https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=AIzaSy...

# Firebase Cloud Messaging (opcional, para push notifications)
VITE_VAPID_KEY=BK...
```

### 4. Iniciar em desenvolvimento

```bash
npm run dev
```

Aceda em: **http://localhost:5173**

---

## 📦 Build e Deploy

### Build de produção

```bash
npm run build
```

Os ficheiros são gerados em `dist/`.

### Deploy no Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar (se necessário)
firebase init

# Deploy completo
firebase deploy

# Apenas hosting
firebase deploy --only hosting

# Apenas Cloud Functions
cd functions && npm install && npm run build
firebase deploy --only functions
```

---

## 🔥 Configurar Firestore

### Publicar Regras de Segurança

```bash
firebase deploy --only firestore:rules
```

### Publicar Índices

```bash
firebase deploy --only firestore:indexes
```

### Criar primeiro utilizador (Direcção)

No Firebase Console → Authentication → Adicionar utilizador:
- Email: `direccao@escola.co.mz`
- Password: `senha-segura`

No Firestore → `users` → Criar documento com o UID do utilizador:
```json
{
  "uid": "UID_DO_UTILIZADOR",
  "displayName": "Directora Isabel Neves",
  "email": "direccao@escola.co.mz",
  "role": "direction",
  "active": true,
  "createdAt": "timestamp"
}
```

---

## 🏗️ Estrutura do Projecto

```
DTW-EduConnect/
├── public/
│   ├── favicon.svg
│   ├── sw.js                    # Service Worker PWA
│   └── icons/                   # Ícones PWA (72→512px)
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── charts/
│   │   │   └── index.jsx        # Recharts wrappers
│   │   ├── common/
│   │   │   └── index.jsx        # UI components (MetricCard, Modal, Table...)
│   │   └── layout/
│   │       ├── AppLayout.jsx
│   │       ├── Sidebar.jsx      # Nav role-based
│   │       └── Topbar.jsx
│   │
│   ├── config/
│   │   └── firebase.js          # Firebase init
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx      # Auth + RBAC
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── NotFound.jsx
│   │   ├── direction/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Students.jsx     # CRUD completo
│   │   │   ├── Teachers.jsx     # CRUD completo
│   │   │   ├── Notices.jsx      # Avisos segmentados
│   │   │   ├── Finance.jsx      # Gestão financeira
│   │   │   └── Reports.jsx      # Relatórios + export PDF
│   │   ├── teacher/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Grades.jsx       # Lançamento de notas
│   │   │   ├── Attendance.jsx   # Registo de presenças
│   │   │   └── Worksheets.jsx   # Fichas e exercícios
│   │   ├── student/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyGrades.jsx
│   │   │   ├── MySchedule.jsx
│   │   │   ├── Library.jsx
│   │   │   └── QRCard.jsx
│   │   ├── parent/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ChildGrades.jsx
│   │   │   └── Payments.jsx
│   │   └── shared/
│   │       ├── EduAI.jsx        # DTW EduAI (Gemini + RAG)
│   │       └── Profile.jsx
│   │
│   ├── services/
│   │   ├── students.js
│   │   ├── grades.js
│   │   ├── attendance.js
│   │   ├── notices.js
│   │   ├── eduai.js             # Gemini + RAG Firestore
│   │   └── index.js             # teachers, payments, QR, library...
│   │
│   ├── App.jsx                  # Router principal
│   ├── main.jsx
│   └── index.css                # Tailwind + custom classes
│
├── functions/
│   └── src/
│       └── index.ts             # Cloud Functions
│
├── firestore.rules              # Regras de segurança
├── firestore.indexes.json       # Índices compostos
├── storage.rules                # Regras Storage
├── firebase.json                # Configuração Firebase
├── vite.config.js               # Vite + PWA plugin
├── tailwind.config.js
├── .env.example
└── README.md
```

---

## 🔑 Roles e Permissões

| Operação | Direcção | Professor | Aluno | Encarregado |
|----------|----------|-----------|-------|-------------|
| Ver todos os alunos | ✅ | ✅ | ❌ | ❌ |
| Ver próprio perfil | ✅ | ✅ | ✅ | ✅ |
| Lançar notas | ✅ | ✅ | ❌ | ❌ |
| Gerir utilizadores | ✅ | ❌ | ❌ | ❌ |
| Ver finanças | ✅ | ❌ | ❌ | Próprios filhos |
| Criar avisos | ✅ | ✅ | ❌ | ❌ |
| Ver biblioteca | ✅ | ✅ | ✅ | ✅ |

---

## 🤖 DTW EduAI

Integração com **Google Gemini 1.5 Flash** com RAG sobre Firestore.

A IA recolhe dados reais do utilizador autenticado antes de responder:
- **Alunos**: notas, frequência, horário, mensalidades pendentes
- **Professores**: turmas atribuídas, disciplinas
- **Encarregados**: filhos, notas e frequência dos filhos
- **Direcção**: estatísticas gerais

### Configurar Gemini

1. Aceda a [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Crie uma nova chave API
3. Adicione ao `.env`: `VITE_GEMINI_API_KEY=sua-chave`

---

## 📱 PWA — Instalar como App

A aplicação é instalável em:
- **Android** (Chrome): botão "Instalar app" na barra de endereço
- **iPhone** (Safari): Partilhar → Adicionar ao ecrã inicial
- **Windows** (Edge/Chrome): ícone de instalação na barra
- **Chromebook**: menu do browser → Instalar

---

## 💰 Integração de Pagamentos (futuro)

O sistema financeiro está preparado para integração futura com:
- **M-Pesa** (Vodacom Moçambique)
- **e-Mola** (Emola Moçambique)

A estrutura de dados e as Cloud Functions já contemplam o fluxo de pagamentos.

---

## 🛡️ Segurança

- Firestore Security Rules completas por colecção
- RBAC (Role-Based Access Control) no cliente e servidor
- Storage Rules com limite de tamanho por tipo de ficheiro
- Autenticação Firebase Auth (Email/Password)
- Logs de actividade via `ai_conversations` e `qr_logs`

---

## 📞 Suporte

**DTW (Devs To World)**
- Email: suporte@dtw.co.mz
- Web: https://dtw.co.mz

---

*Desenvolvido por DTW (Devs To World) · DTW EduConnect v1.0.0*
