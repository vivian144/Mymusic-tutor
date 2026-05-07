import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';

/* Pages */
import LandingPage from './pages/LandingPage';
import HowItWorks from './pages/HowItWorks';
import Instruments from './pages/Instruments';
import MusicJourney from './pages/MusicJourney';
import Pricing from './pages/Pricing';
import TeachPage from './pages/TeachPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AuthCallback from './pages/AuthCallback';
import SearchPage from './pages/SearchPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import BookingPage from './pages/BookingPage';

/* Student pages */
import StudentDashboard from './pages/student/Dashboard';
import StudentProgress from './pages/student/Progress';
import StudentSessions from './pages/student/Sessions';
import StudentProfile from './pages/student/Profile';

/* Teacher pages */
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherStudents from './pages/teacher/Students';
import TeacherEarnings from './pages/teacher/Earnings';
import TeacherProfile from './pages/teacher/Profile';

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, role } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
          <circle cx="16" cy="16" r="12" stroke="var(--color-brown)" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 20" />
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/instruments" element={<Instruments />} />
          <Route path="/music-journey" element={<MusicJourney />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/teach" element={<TeachPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/teachers/:id" element={<TeacherProfilePage />} />
          <Route path="/book/:teacherId" element={<BookingPage />} />

          <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/dashboard/progress" element={<StudentProgress />} />
            <Route path="/dashboard/sessions" element={<StudentSessions />} />
            <Route path="/dashboard/profile" element={<StudentProfile />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/students" element={<TeacherStudents />} />
            <Route path="/teacher/earnings" element={<TeacherEarnings />} />
            <Route path="/teacher/profile" element={<TeacherProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}