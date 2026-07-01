import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EmployeesPage from './pages/EmployeesPage'
import AttendancePage from './pages/AttendancePage'
import ProfilePage from './pages/ProfilePage'
import LeaveRequestsPage from './pages/LeaveRequestsPage'
import LeaveBalancePage from './pages/LeaveBalancePage'
import LeaveTypesPage from './pages/LeaveTypesPage'
import SalaryPage from './pages/SalaryPage'
import PayrollPeriodsPage from './pages/PayrollPeriodsPage'
import PayrollPage from './pages/PayrollPage'
import ReportsDashboard from './pages/reports/ReportsDashboard'
import AttendanceSummaryPage from './pages/reports/AttendanceSummaryPage'
import TardinessReportPage from './pages/reports/TardinessReportPage'
import PayrollSummaryPage from './pages/reports/PayrollSummaryPage'
import HeadcountPage from './pages/reports/HeadcountsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/leaves" element={<LeaveRequestsPage />} />
              <Route path="/leaves/balance" element={<LeaveBalancePage />} />
              <Route path="/leave-types" element={<LeaveTypesPage />} />
              <Route path="/salary" element={<SalaryPage />} />
              <Route path="/payroll-periods" element={<PayrollPeriodsPage />} />
              <Route path="/payroll" element={<PayrollPage />} />
              <Route path="/reports" element={<ReportsDashboard />} />
              <Route path="/reports/attendance" element={<AttendanceSummaryPage />} />
              <Route path="/reports/tardiness" element={<TardinessReportPage />} />
              <Route path="/reports/payroll-summary" element={<PayrollSummaryPage />} />
              <Route path="/reports/headcount" element={<HeadcountPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}