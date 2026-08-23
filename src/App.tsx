import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { AdminOverview } from './components/dashboard/AdminOverview';
import { StudentManager } from './components/students/StudentManager';
import { FinanceManager } from './components/finance/FinanceManager';
import { ExpenseManager } from './components/expenses/ExpenseManager';
import { CrmManager } from './components/crm/CrmManager';
import { CustomTutoringManager } from './components/tutoring/CustomTutoringManager';
import { TutorManager } from './components/tutors/TutorManager';
import { TimetableManager } from './components/timetable/TimetableManager';
import { AttendanceManager } from './components/attendance/AttendanceManager';
import { LMSManager } from './components/lms/LMSManager';
import { ParentPortal } from './components/parent/ParentPortal';
import { TeacherWorkspace } from './components/teacher/TeacherWorkspace';
import { RolePermissionManager } from './components/admin/RolePermissionManager';
import { SubjectManager } from './components/subjects/SubjectManager';
import { TeacherPayroll } from './components/finance/TeacherPayroll';
import { PaymentModal } from './components/finance/PaymentModal';
import { ExcelImportModal } from './components/excel/ExcelModals';
import { DataCleanerModal } from './components/common/DataCleanerModal';
import { PublicRegistrationForm } from './components/public/PublicRegistrationForm';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { LoginPage } from './components/auth/LoginPage';
import { generateCenterExcelExport, generateSampleExcelWorkbook } from './utils/excelParser';

const MainAppContent: React.FC = () => {
  const {
    students,
    invoices,
    expenses,
    leads,
    tutors,
    scheduleSessions,
    currentRole,
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isLoginPageView,
    setIsLoginPageView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Automatically adjust default tab when role switches or user logs in
  React.useEffect(() => {
    if (currentRole === 'TEACHER') {
      setActiveTab('teacher_workspace');
    } else if (currentRole === 'PARENT') {
      setActiveTab('parent_portal');
    } else if (currentRole === 'STUDENT') {
      setActiveTab('lms');
    } else if (currentRole === 'ACCOUNTANT') {
      setActiveTab('finance');
    } else if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') {
      if (activeTab === 'teacher_workspace') {
        setActiveTab('overview');
      }
    }
  }, [currentRole]);

  // Modals state
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDataCleanerOpen, setIsDataCleanerOpen] = useState(false);
  const [isPublicFormOpen, setIsPublicFormOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [targetTutoringLeadId, setTargetTutoringLeadId] = useState<string | undefined>(undefined);
  const [targetAttendanceSessionId, setTargetAttendanceSessionId] = useState<string | undefined>(undefined);

  // Export Excel Handler
  const handleExportExcel = () => {
    generateCenterExcelExport(students, invoices, expenses, leads, tutors, scheduleSessions);
  };

  // Download Sample Template Handler
  const handleDownloadTemplate = () => {
    generateSampleExcelWorkbook();
  };

  // Navigation callbacks
  const handleNavigateToTutoring = (leadId: string) => {
    setTargetTutoringLeadId(leadId);
    setActiveTab('tutoring');
  };

  const handleTakeAttendance = (sessionId?: string) => {
    if (sessionId) {
      setTargetAttendanceSessionId(sessionId);
    }
    setActiveTab('attendance');
  };

  // If user requested the dedicated Login Page or is logged out, render standalone LoginPage
  if (isLoginPageView || !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={() => setIsLoginPageView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExport={handleExportExcel}
        onDownloadTemplate={handleDownloadTemplate}
        onOpenPublicForm={() => setIsPublicFormOpen(true)}
        onOpenDataCleaner={() => setIsDataCleanerOpen(true)}
        onOpenLogin={() => setIsLoginPageView(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50 text-slate-800">
          {activeTab === 'overview' && (
            <AdminOverview
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenPaymentModal={(id) => setPaymentInvoiceId(id)}
              onOpenAddStudent={() => setActiveTab('students')}
              onOpenAddExpense={() => setActiveTab('expenses')}
              onOpenAddLead={() => setActiveTab('crm')}
            />
          )}

          {activeTab === 'teacher_workspace' && (
            <TeacherWorkspace
              onNavigateToAttendance={handleTakeAttendance}
              onNavigateToLMS={() => setActiveTab('lms')}
              onNavigateToTimetable={() => setActiveTab('timetable')}
              onNavigateToStudents={() => setActiveTab('students')}
            />
          )}

          {activeTab === 'user_roles' && <RolePermissionManager />}

          {activeTab === 'students' && (
            <StudentManager
              onOpenPaymentModal={(id) => setPaymentInvoiceId(id)}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceManager
              onOpenPaymentModal={(id) => setPaymentInvoiceId(id)}
            />
          )}

          {activeTab === 'expenses' && <ExpenseManager />}

          {activeTab === 'crm' && (
            <CrmManager onNavigateToTutoring={handleNavigateToTutoring} />
          )}

          {activeTab === 'tutoring' && (
            <CustomTutoringManager
              initialLeadId={targetTutoringLeadId}
              onNavigateToTimetable={() => setActiveTab('timetable')}
            />
          )}

          {activeTab === 'tutors' && <TutorManager />}

          {activeTab === 'timetable' && (
            <TimetableManager onTakeAttendance={handleTakeAttendance} />
          )}

          {activeTab === 'attendance' && (
            <AttendanceManager initialSessionId={targetAttendanceSessionId} />
          )}

          {activeTab === 'lms' && <LMSManager />}

          {activeTab === 'parent_portal' && (
            <ParentPortal
              onOpenPaymentModal={(id) => setPaymentInvoiceId(id)}
              onNavigateToTutoring={handleNavigateToTutoring}
            />
          )}

          {activeTab === 'subjects' && <SubjectManager />}

          {activeTab === 'teacher_payroll' && <TeacherPayroll />}
        </main>
      </div>

      {/* Global Modals */}
      {paymentInvoiceId && (
        <PaymentModal
          invoiceId={paymentInvoiceId}
          onClose={() => setPaymentInvoiceId(null)}
        />
      )}

      {isImportModalOpen && (
        <ExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {isDataCleanerOpen && (
        <DataCleanerModal
          isOpen={isDataCleanerOpen}
          onClose={() => setIsDataCleanerOpen(false)}
        />
      )}

      {isPublicFormOpen && (
        <PublicRegistrationForm
          isOpen={isPublicFormOpen}
          onClose={() => setIsPublicFormOpen(false)}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onOpenLoginModal={() => setIsAuthModalOpen(true)}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
