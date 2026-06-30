// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Direction pages
import DirectionDashboard from '@/pages/direction/Dashboard'
import StudentsPage from '@/pages/direction/Students'
import TeachersPage from '@/pages/direction/Teachers'
import NoticesPage from '@/pages/direction/Notices'
import FinancePage from '@/pages/direction/Finance'
import ReportsPage from '@/pages/direction/Reports'

// Teacher pages
import TeacherDashboard from '@/pages/teacher/Dashboard'
import GradesPage from '@/pages/teacher/Grades'
import AttendancePage from '@/pages/teacher/Attendance'
import WorksheetsPage from '@/pages/teacher/Worksheets'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import MyGradesPage from '@/pages/student/MyGrades'
import MySchedulePage from '@/pages/student/MySchedule'
import LibraryPage from '@/pages/student/Library'
import StudentQRPage from '@/pages/student/QRCard'

// Parent pages
import ParentDashboard from '@/pages/parent/Dashboard'
import ChildGradesPage from '@/pages/parent/ChildGrades'
import PaymentsPage from '@/pages/parent/Payments'

// Shared
import EduAIPage from '@/pages/shared/EduAI'
import ProfilePage from '@/pages/shared/Profile'
import NotFoundPage from '@/pages/NotFound'

function RoleRouter() {
  const { profile } = useAuth()
  const role = profile?.role
  if (role === 'direction') return <Navigate to="/app/dashboard" replace />
  if (role === 'teacher') return <Navigate to="/app/teacher/dashboard" replace />
  if (role === 'student') return <Navigate to="/app/student/dashboard" replace />
  if (role === 'parent') return <Navigate to="/app/parent/dashboard" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected App */}
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<RoleRouter />} />

        {/* Direction */}
        <Route path="dashboard" element={<ProtectedRoute roles={['direction']}><DirectionDashboard /></ProtectedRoute>} />
        <Route path="students" element={<ProtectedRoute roles={['direction']}><StudentsPage /></ProtectedRoute>} />
        <Route path="teachers" element={<ProtectedRoute roles={['direction']}><TeachersPage /></ProtectedRoute>} />
        <Route path="notices" element={<ProtectedRoute roles={['direction', 'teacher']}><NoticesPage /></ProtectedRoute>} />
        <Route path="finance" element={<ProtectedRoute roles={['direction']}><FinancePage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['direction']}><ReportsPage /></ProtectedRoute>} />

        {/* Teacher */}
        <Route path="teacher/dashboard" element={<ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="teacher/grades" element={<ProtectedRoute roles={['teacher']}><GradesPage /></ProtectedRoute>} />
        <Route path="teacher/attendance" element={<ProtectedRoute roles={['teacher']}><AttendancePage /></ProtectedRoute>} />
        <Route path="teacher/worksheets" element={<ProtectedRoute roles={['teacher']}><WorksheetsPage /></ProtectedRoute>} />
        <Route path="teacher/notices" element={<ProtectedRoute roles={['teacher']}><NoticesPage /></ProtectedRoute>} />

        {/* Student */}
        <Route path="student/dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="student/grades" element={<ProtectedRoute roles={['student']}><MyGradesPage /></ProtectedRoute>} />
        <Route path="student/schedule" element={<ProtectedRoute roles={['student']}><MySchedulePage /></ProtectedRoute>} />
        <Route path="student/library" element={<ProtectedRoute roles={['student']}><LibraryPage /></ProtectedRoute>} />
        <Route path="student/qr" element={<ProtectedRoute roles={['student']}><StudentQRPage /></ProtectedRoute>} />
        <Route path="student/notices" element={<ProtectedRoute roles={['student']}><NoticesPage /></ProtectedRoute>} />

        {/* Parent */}
        <Route path="parent/dashboard" element={<ProtectedRoute roles={['parent']}><ParentDashboard /></ProtectedRoute>} />
        <Route path="parent/grades" element={<ProtectedRoute roles={['parent']}><ChildGradesPage /></ProtectedRoute>} />
        <Route path="parent/payments" element={<ProtectedRoute roles={['parent']}><PaymentsPage /></ProtectedRoute>} />
        <Route path="parent/notices" element={<ProtectedRoute roles={['parent']}><NoticesPage /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="ai" element={<EduAIPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
