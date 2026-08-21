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
import { AIBusinessAdvisor } from './components/ai/AIBusinessAdvisor';
import { ParentPortal } from './components/parent/ParentPortal';
import { PaymentModal } from './components/finance/PaymentModal';
import { ExcelImportModal } from './components/excel/ExcelModals';
import { PublicRegistrationForm } from './components/public/PublicRegistrationForm';
import { generateCenterExcelExport } from './utils/excelParser';

const MainAppContent: React.FC = () => {
  const { students, invoices, expenses, leads, tutors, scheduleSessions, currentRole } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals state
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPublicFormOpen, setIsPublicFormOpen] = useState(false);
  const [targetTutoringLeadId, setTargetTutoringLeadId] = useState<string | undefined>(undefined);
  const [targetAttendanceSessionId, setTargetAttendanceSessionId] = useState<string | undefined>(undefined);

  // Export Excel Handler
  const handleExportExcel = () => {
    generateCenterExcelExport(students, invoices, expenses, leads, tutors, scheduleSessions);
  };

  // Download Sample Template Handler
  const handleDownloadTemplate = () => {
    generateCenterExcelExport(students, invoices, expenses, leads, tutors, scheduleSessions);
    alert('Đã tải xuống file mẫu AN TÂM EDUCATION.xlsx thành công!');
  };

  // Navigation callbacks
  const handleNavigateToTutoring = (leadId: string) => {
    setTargetTutoringLeadId(leadId);
    setActiveTab('tutoring');
  };

  const handleTakeAttendance = (sessionId: string) => {
    setTargetAttendanceSessionId(sessionId);
    setActiveTab('attendance');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExport={handleExportExcel}
        onOpenAIReport={() => setActiveTab('ai_insights')}
        onDownloadTemplate={handleDownloadTemplate}
        onOpenPublicForm={() => setIsPublicFormOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
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
              onOpenAIAdvisor={() => setActiveTab('ai_insights')}
            />
          )}

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

          {activeTab === 'ai_insights' && <AIBusinessAdvisor />}

          {activeTab === 'parent_portal' && (
            <ParentPortal
              onOpenPaymentModal={(id) => setPaymentInvoiceId(id)}
              onNavigateToTutoring={handleNavigateToTutoring}
            />
          )}
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

      {isPublicFormOpen && (
        <PublicRegistrationForm
          isOpen={isPublicFormOpen}
          onClose={() => setIsPublicFormOpen(false)}
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
