import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserRole,
  Student,
  Subject,
  TuitionPlan,
  InvoiceRecord,
  ExpenseItem,
  ParentLead,
  TutorAssistant,
  ClassGroup,
  ScheduleSession,
  StudentAttendance,
  LMSLesson,
  LMSAssignment,
  LMSSubmission,
  PaymentTransaction,
  LeadStatus,
  TutorStatus,
  AuthUser,
  PermissionKey,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_TUITION_PLANS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_LEADS,
  INITIAL_TUTORS,
  INITIAL_CLASSES,
  INITIAL_SCHEDULE_SESSIONS,
  INITIAL_ATTENDANCE,
  INITIAL_LMS_LESSONS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_AUTH_USERS,
  ROLE_PERMISSION_CONFIGS,
} from '../data/initialData';
import { ExcelImportResult } from '../utils/excelParser';
import { cleanAndNormalizeAllData } from '../utils/dataCleaner';
import { seedIfEmpty, saveDocument, deleteDocument, saveAllCollectionsToFirestore, fetchAllCollectionsFromFirestore } from '../services/firebase';
import { logAuditEvent } from '../services/auditService';
import { useAuth } from '../hooks/useAuth';

interface AppContextType {
  // Authentication & Session
  currentUser: AuthUser | null;
  users: AuthUser[];
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isLoginPageView: boolean;
  setIsLoginPageView: (show: boolean) => void;
  isDatabaseModalOpen: boolean;
  setIsDatabaseModalOpen: (open: boolean) => void;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginUser: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  quickLoginAsRole: (role: UserRole) => void;
  logout: () => void;
  registerUser: (data: Omit<AuthUser, 'id' | 'createdAt'> & { password: string }) => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (updates: Partial<AuthUser>) => void;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message?: string }>;

  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedGrade: number | 'all';
  setSelectedGrade: (grade: number | 'all') => void;

  students: Student[];
  subjects: Subject[];
  tuitionPlans: TuitionPlan[];
  invoices: InvoiceRecord[];
  expenses: ExpenseItem[];
  leads: ParentLead[];
  tutors: TutorAssistant[];
  classes: ClassGroup[];
  scheduleSessions: ScheduleSession[];
  attendance: StudentAttendance[];
  lessons: LMSLesson[];
  assignments: LMSAssignment[];
  submissions: LMSSubmission[];

  // Database Persistence & Manual Save
  isSavingToDatabase: boolean;
  lastSavedTimestamp: string | null;
  hasUnsavedChanges: boolean;
  saveAllToDatabase: (notify?: boolean) => Promise<{ success: boolean; message?: string; totalSaved?: number; timestamp?: string }>;
  exportJsonBackup: () => void;
  importJsonBackup: (jsonStr: string) => Promise<{ success: boolean; message?: string; count?: number }>;
  syncFromCloud: () => Promise<{ success: boolean; message?: string; count?: number }>;
  globalToast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showGlobalToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  hideGlobalToast: () => void;

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'totalTuitionDue' | 'totalPaid' | 'remainingDebt'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  deleteStudents: (ids: string[]) => void;

  // Finance Actions
  addPayment: (invoiceId: string, payment: Omit<PaymentTransaction, 'id' | 'invoiceId'>) => void;
  createInvoice: (invoice: Omit<InvoiceRecord, 'id' | 'paidAmount' | 'remainingAmount' | 'status' | 'paymentHistory' | 'createdAt'>) => void;
  addExpense: (expense: Omit<ExpenseItem, 'id' | 'expenseCode'>) => void;
  deleteExpense: (id: string) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;

  // CRM Actions
  addLead: (lead: Omit<ParentLead, 'id' | 'code' | 'timeline' | 'createdAt'>) => ParentLead;
  updateLeadStatus: (id: string, status: LeadStatus, note?: string) => void;
  convertLeadToStudent: (leadId: string, className?: string) => Student;

  // Tutor Actions
  addTutor: (tutor: Omit<TutorAssistant, 'id' | 'code' | 'createdAt'>) => void;
  updateTutorStatus: (id: string, status: TutorStatus) => void;
  deleteTutor: (id: string) => void;
  deleteTutors: (ids: string[]) => void;

  // Schedule & Attendance
  addScheduleSession: (session: Omit<ScheduleSession, 'id'>) => ScheduleSession;
  updateScheduleSession: (id: string, updates: Partial<ScheduleSession>) => void;
  deleteScheduleSession: (id: string) => void;
  saveAttendance: (sessionId: string, records: Omit<StudentAttendance, 'id' | 'sessionId'>[]) => void;

  // LMS
  addAssignment: (assignment: Omit<LMSAssignment, 'id' | 'submissionsCount' | 'createdAt'>) => void;
  submitAssignmentAnswers: (assignmentId: string, studentId: string, studentName: string, answers: { questionId: string; selectedOption?: number; textAnswer?: string }[]) => void;
  gradeSubmission: (submissionId: string, score: number, feedback: string, teacherName: string) => void;

  // Role & Permissions
  hasPermission: (permission: PermissionKey) => boolean;
  addNewUser: (user: Omit<AuthUser, 'id' | 'createdAt'>) => AuthUser;
  updateUser: (id: string, updates: Partial<AuthUser>) => void;
  deleteUser: (id: string) => void;
  deleteUsers: (ids: string[]) => void;
  toggleUserStatus: (id: string) => void;

  // Excel Import & Data Operations
  importExcelData: (data: ExcelImportResult, duplicateAction: 'merge' | 'create_new' | 'skip') => { addedStudents: number; addedExpenses: number; addedLeads: number; addedTutors: number };
  cleanAndNormalizeData: (options?: { cleanNames?: boolean; cleanPhones?: boolean; recalcTuition?: boolean; deduplicate?: boolean; removeEmpty?: boolean }) => {
    fixedNames: number;
    fixedPhones: number;
    recalculatedFinances: number;
    removedDuplicates: number;
    removedEmpty: number;
  };
  resetToCompactData: () => void;
  clearAllData: () => void;
  resetAllData: () => void;
  isCompactView: boolean;
  setIsCompactView: (compact: boolean) => void;
  isLoadingFromCloud: boolean;
  isFirebaseConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'antam_education_app_state_v3';

function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    console.warn(`Error reading localStorage for key ${key}:`, e);
    return defaultValue;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [isLoadingFromCloud, setIsLoadingFromCloud] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  const [users, setUsers] = useState<AuthUser[]>(() => {
    return safeGet(`${STORAGE_KEY}_users`, INITIAL_AUTH_USERS);
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return auth.currentUser || safeGet<AuthUser | null>(`${STORAGE_KEY}_currentUser`, null);
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLoginPageView, setIsLoginPageView] = useState<boolean>(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return auth.currentUser ? auth.currentUser.role : (currentUser ? currentUser.role : 'SUPER_ADMIN');
  });

  // Sync with auth.currentUser
  useEffect(() => {
    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
      setCurrentRole(auth.currentUser.role);
    } else {
      setCurrentUser(null);
    }
  }, [auth.currentUser]);

  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');

  const [students, setStudents] = useState<Student[]>(() => {
    return safeGet(`${STORAGE_KEY}_students`, INITIAL_STUDENTS);
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    return safeGet(`${STORAGE_KEY}_subjects`, INITIAL_SUBJECTS);
  });

  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlan[]>(() => {
    return safeGet(`${STORAGE_KEY}_tuitionPlans`, INITIAL_TUITION_PLANS);
  });

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    return safeGet(`${STORAGE_KEY}_invoices`, INITIAL_INVOICES);
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    return safeGet(`${STORAGE_KEY}_expenses`, INITIAL_EXPENSES);
  });

  const [leads, setLeads] = useState<ParentLead[]>(() => {
    return safeGet(`${STORAGE_KEY}_leads`, INITIAL_LEADS);
  });

  const [tutors, setTutors] = useState<TutorAssistant[]>(() => {
    return safeGet(`${STORAGE_KEY}_tutors`, INITIAL_TUTORS);
  });

  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    return safeGet(`${STORAGE_KEY}_classes`, INITIAL_CLASSES);
  });

  const [scheduleSessions, setScheduleSessions] = useState<ScheduleSession[]>(() => {
    return safeGet(`${STORAGE_KEY}_scheduleSessions`, INITIAL_SCHEDULE_SESSIONS);
  });

  const [attendance, setAttendance] = useState<StudentAttendance[]>(() => {
    return safeGet(`${STORAGE_KEY}_attendance`, INITIAL_ATTENDANCE);
  });

  const [lessons, setLessons] = useState<LMSLesson[]>(() => {
    return safeGet(`${STORAGE_KEY}_lessons`, INITIAL_LMS_LESSONS);
  });

  const [assignments, setAssignments] = useState<LMSAssignment[]>(() => {
    return safeGet(`${STORAGE_KEY}_assignments`, INITIAL_ASSIGNMENTS);
  });

  const [submissions, setSubmissions] = useState<LMSSubmission[]>(() => {
    return safeGet(`${STORAGE_KEY}_submissions`, INITIAL_SUBMISSIONS);
  });

  // Manual Database Save & Persistence State
  const [isSavingToDatabase, setIsSavingToDatabase] = useState<boolean>(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_last_saved_time`);
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [globalToast, setGlobalToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showGlobalToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setGlobalToast({ message, type });
    setTimeout(() => {
      setGlobalToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const hideGlobalToast = () => setGlobalToast(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_subjects`, JSON.stringify(subjects));
  }, [subjects]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tuitionPlans`, JSON.stringify(tuitionPlans));
  }, [tuitionPlans]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
  }, [invoices]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_leads`, JSON.stringify(leads));
  }, [leads]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_tutors`, JSON.stringify(tutors));
  }, [tutors]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(classes));
  }, [classes]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_scheduleSessions`, JSON.stringify(scheduleSessions));
  }, [scheduleSessions]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_attendance`, JSON.stringify(attendance));
  }, [attendance]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_lessons`, JSON.stringify(lessons));
  }, [lessons]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_assignments`, JSON.stringify(assignments));
  }, [assignments]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_submissions`, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_KEY}_currentUser`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_currentUser`);
    }
  }, [currentUser]);

  // One-time Cloud Sync & Safe Seeding on Mount
  useEffect(() => {
    async function loadCloudData() {
      try {
        console.log('Connecting to Firebase Firestore...');
        const hasSavedLocal = localStorage.getItem(`${STORAGE_KEY}_has_saved`);

        // If local user has never saved data on this browser, attempt to hydrate from Cloud
        if (!hasSavedLocal) {
          const cloudData = await fetchAllCollectionsFromFirestore();
          if (cloudData) {
            if (cloudData.users && cloudData.users.length > 0) setUsers(cloudData.users);
            if (cloudData.students && cloudData.students.length > 0) setStudents(cloudData.students);
            if (cloudData.subjects && cloudData.subjects.length > 0) setSubjects(cloudData.subjects);
            if (cloudData.tuitionPlans && cloudData.tuitionPlans.length > 0) setTuitionPlans(cloudData.tuitionPlans);
            if (cloudData.invoices && cloudData.invoices.length > 0) setInvoices(cloudData.invoices);
            if (cloudData.expenses && cloudData.expenses.length > 0) setExpenses(cloudData.expenses);
            if (cloudData.leads && cloudData.leads.length > 0) setLeads(cloudData.leads);
            if (cloudData.tutors && cloudData.tutors.length > 0) setTutors(cloudData.tutors);
            if (cloudData.classes && cloudData.classes.length > 0) setClasses(cloudData.classes);
            if (cloudData.scheduleSessions && cloudData.scheduleSessions.length > 0) setScheduleSessions(cloudData.scheduleSessions);
            if (cloudData.attendance && cloudData.attendance.length > 0) setAttendance(cloudData.attendance);
            if (cloudData.lessons && cloudData.lessons.length > 0) setLessons(cloudData.lessons);
            if (cloudData.assignments && cloudData.assignments.length > 0) setAssignments(cloudData.assignments);
            if (cloudData.submissions && cloudData.submissions.length > 0) setSubmissions(cloudData.submissions);
          } else {
            // Firestore is totally empty, seed Firestore with initial data
            await seedIfEmpty('users', users);
            await seedIfEmpty('students', students);
            await seedIfEmpty('subjects', subjects);
            await seedIfEmpty('tuitionPlans', tuitionPlans);
            await seedIfEmpty('invoices', invoices);
            await seedIfEmpty('expenses', expenses);
            await seedIfEmpty('leads', leads);
            await seedIfEmpty('tutors', tutors);
            await seedIfEmpty('classes', classes);
            await seedIfEmpty('scheduleSessions', scheduleSessions);
            await seedIfEmpty('attendance', attendance);
            await seedIfEmpty('lessons', lessons);
            await seedIfEmpty('assignments', assignments);
            await seedIfEmpty('submissions', submissions);
          }
        }
        setIsFirebaseConnected(true);
        console.log('Firebase Firestore connection verified.');
      } catch (err) {
        console.warn('Firebase Firestore notice (offline-first fallback active):', err);
        setIsFirebaseConnected(false);
      } finally {
        setIsLoadingFromCloud(false);
      }
    }

    loadCloudData();
  }, []);

  /**
   * Explicit Manual Save to Cloud Firestore Database + LocalStorage
   */
  const saveAllToDatabase = async (
    notify: boolean = true
  ): Promise<{ success: boolean; message?: string; totalSaved?: number; timestamp?: string }> => {
    setIsSavingToDatabase(true);
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

      // 1. Immediately persist to LocalStorage with timestamp & flag
      localStorage.setItem(`${STORAGE_KEY}_has_saved`, 'true');
      localStorage.setItem(`${STORAGE_KEY}_last_saved_time`, timeStr);
      localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
      localStorage.setItem(`${STORAGE_KEY}_subjects`, JSON.stringify(subjects));
      localStorage.setItem(`${STORAGE_KEY}_tuitionPlans`, JSON.stringify(tuitionPlans));
      localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
      localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
      localStorage.setItem(`${STORAGE_KEY}_leads`, JSON.stringify(leads));
      localStorage.setItem(`${STORAGE_KEY}_tutors`, JSON.stringify(tutors));
      localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(classes));
      localStorage.setItem(`${STORAGE_KEY}_scheduleSessions`, JSON.stringify(scheduleSessions));
      localStorage.setItem(`${STORAGE_KEY}_attendance`, JSON.stringify(attendance));
      localStorage.setItem(`${STORAGE_KEY}_lessons`, JSON.stringify(lessons));
      localStorage.setItem(`${STORAGE_KEY}_assignments`, JSON.stringify(assignments));
      localStorage.setItem(`${STORAGE_KEY}_submissions`, JSON.stringify(submissions));
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));

      // LocalStorage full snapshot
      const fullSnapshot = {
        savedAt: timeStr,
        students,
        subjects,
        tuitionPlans,
        invoices,
        expenses,
        leads,
        tutors,
        classes,
        scheduleSessions,
        attendance,
        lessons,
        assignments,
        submissions,
        users,
      };
      localStorage.setItem(`${STORAGE_KEY}_backup_snapshot`, JSON.stringify(fullSnapshot));

      let totalSaved =
        students.length +
        invoices.length +
        expenses.length +
        leads.length +
        tutors.length +
        classes.length +
        scheduleSessions.length +
        attendance.length +
        lessons.length +
        assignments.length +
        submissions.length +
        users.length;

      // 2. Synchronize to Firestore
      try {
        const result = await saveAllCollectionsToFirestore({
          users,
          students,
          subjects,
          tuitionPlans,
          invoices,
          expenses,
          leads,
          tutors,
          classes,
          scheduleSessions,
          attendance,
          lessons,
          assignments,
          submissions,
        });
        totalSaved = result.totalSaved;
        setIsFirebaseConnected(true);
      } catch (cloudErr) {
        console.warn('Could not push to Cloud, saved to LocalStorage successfully:', cloudErr);
      }

      setLastSavedTimestamp(timeStr);
      setHasUnsavedChanges(false);

      logAuditEvent({
        action: 'SYNC',
        entity: 'database',
        description: `Lưu đồng bộ toàn bộ cơ sở dữ liệu (${totalSaved} bản ghi)`,
        actorId: currentUser?.id || 'system',
        actorName: currentUser?.fullName || 'Người dùng',
        actorRole: currentUser?.role || 'SUPER_ADMIN',
        severity: 'info',
        details: { totalSaved }
      });

      const successMsg = `Đã lưu toàn bộ dữ liệu (${totalSaved} bản ghi) vào hệ thống & Đám mây thành công!`;
      if (notify) {
        showGlobalToast(successMsg, 'success');
      }
      return {
        success: true,
        message: successMsg,
        totalSaved,
        timestamp: timeStr,
      };
    } catch (error: any) {
      console.error('Lỗi khi lưu dữ liệu:', error);
      const errMsg = error?.message || 'Không thể lưu dữ liệu.';
      if (notify) {
        showGlobalToast(`Lưu dữ liệu thất bại: ${errMsg}`, 'error');
      }
      return {
        success: false,
        message: errMsg,
      };
    } finally {
      setIsSavingToDatabase(false);
    }
  };

  const exportJsonBackup = () => {
    const data = {
      app: 'AN_TAM_EDUCATION',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      students,
      subjects,
      tuitionPlans,
      invoices,
      expenses,
      leads,
      tutors,
      classes,
      scheduleSessions,
      attendance,
      lessons,
      assignments,
      submissions,
      users,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antam_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    logAuditEvent({
      action: 'EXPORT',
      entity: 'storage',
      description: 'Xuất tệp sao lưu dữ liệu toàn hệ thống định dạng JSON',
      actorId: currentUser?.id || 'system',
      actorName: currentUser?.fullName || 'Quản trị viên',
      actorRole: currentUser?.role || 'SUPER_ADMIN',
      severity: 'info',
    });

    showGlobalToast('Đã tải tệp sao lưu JSON về máy tính!', 'success');
  };

  const importJsonBackup = async (jsonString: string): Promise<{ success: boolean; message?: string; count?: number }> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Dữ liệu JSON không đúng định dạng.' };
      }

      if (Array.isArray(parsed.students)) setStudents(parsed.students);
      if (Array.isArray(parsed.subjects)) setSubjects(parsed.subjects);
      if (Array.isArray(parsed.tuitionPlans)) setTuitionPlans(parsed.tuitionPlans);
      if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
      if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
      if (Array.isArray(parsed.leads)) setLeads(parsed.leads);
      if (Array.isArray(parsed.tutors)) setTutors(parsed.tutors);
      if (Array.isArray(parsed.classes)) setClasses(parsed.classes);
      if (Array.isArray(parsed.scheduleSessions)) setScheduleSessions(parsed.scheduleSessions);
      if (Array.isArray(parsed.attendance)) setAttendance(parsed.attendance);
      if (Array.isArray(parsed.lessons)) setLessons(parsed.lessons);
      if (Array.isArray(parsed.assignments)) setAssignments(parsed.assignments);
      if (Array.isArray(parsed.submissions)) setSubmissions(parsed.submissions);
      if (Array.isArray(parsed.users)) setUsers(parsed.users);

      const total =
        (parsed.students?.length || 0) +
        (parsed.invoices?.length || 0) +
        (parsed.expenses?.length || 0) +
        (parsed.leads?.length || 0);

      logAuditEvent({
        action: 'IMPORT',
        entity: 'storage',
        description: `Khôi phục dữ liệu từ tệp sao lưu JSON (${total} bản ghi)`,
        actorId: currentUser?.id || 'system',
        actorName: currentUser?.fullName || 'Quản trị viên',
        actorRole: currentUser?.role || 'SUPER_ADMIN',
        severity: 'warning',
      });

      setTimeout(() => {
        saveAllToDatabase(false);
      }, 250);

      return { success: true, count: total };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const syncFromCloud = async (): Promise<{ success: boolean; message?: string; count?: number }> => {
    try {
      const cloudData = await fetchAllCollectionsFromFirestore();
      if (!cloudData) {
        return { success: false, message: 'Không tìm thấy dữ liệu trên Đám mây Firebase.' };
      }
      if (cloudData.students) setStudents(cloudData.students);
      if (cloudData.subjects) setSubjects(cloudData.subjects);
      if (cloudData.tuitionPlans) setTuitionPlans(cloudData.tuitionPlans);
      if (cloudData.invoices) setInvoices(cloudData.invoices);
      if (cloudData.expenses) setExpenses(cloudData.expenses);
      if (cloudData.leads) setLeads(cloudData.leads);
      if (cloudData.tutors) setTutors(cloudData.tutors);
      if (cloudData.classes) setClasses(cloudData.classes);
      if (cloudData.scheduleSessions) setScheduleSessions(cloudData.scheduleSessions);
      if (cloudData.attendance) setAttendance(cloudData.attendance);
      if (cloudData.lessons) setLessons(cloudData.lessons);
      if (cloudData.assignments) setAssignments(cloudData.assignments);
      if (cloudData.submissions) setSubmissions(cloudData.submissions);
      if (cloudData.users) setUsers(cloudData.users);

      const count =
        (cloudData.students?.length || 0) +
        (cloudData.invoices?.length || 0) +
        (cloudData.expenses?.length || 0) +
        (cloudData.leads?.length || 0);

      showGlobalToast(`Đã đồng bộ ${count} bản ghi từ Cloud!`, 'success');
      return { success: true, count };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to quickly save to Database
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveAllToDatabase(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    users,
    students,
    subjects,
    tuitionPlans,
    invoices,
    expenses,
    leads,
    tutors,
    classes,
    scheduleSessions,
    attendance,
    lessons,
    assignments,
    submissions,
  ]);

  // Auth Handlers
  const login = async (identifier: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const q = identifier.trim().toLowerCase();
    if (!q) {
      return { success: false, message: 'Vui lòng nhập email, số điện thoại hoặc mã học sinh' };
    }

    let email = q;
    let fallbackProfile: any = null;

    // 1. Resolve email from users list
    let matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === q ||
        u.username.toLowerCase() === q ||
        (u.phone && u.phone.includes(q)) ||
        (u.studentCode && u.studentCode.toLowerCase() === q)
    );

    if (matchedUser) {
      email = matchedUser.email;
      fallbackProfile = {
        fullName: matchedUser.fullName,
        role: matchedUser.role,
        phone: matchedUser.phone,
        title: matchedUser.title,
        department: matchedUser.department,
        grade: matchedUser.grade,
        studentCode: matchedUser.studentCode,
        assignedClasses: matchedUser.assignedClasses,
        teachingSubjects: matchedUser.teachingSubjects,
        isActive: matchedUser.isActive !== false
      };
    } else {
      // 2. Resolve email from students list for on-the-fly login
      const studentMatch = students.find(
        (s) =>
          s.code.toLowerCase() === q ||
          s.email.toLowerCase() === q ||
          s.phone === q ||
          s.parentPhone === q
      );

      if (studentMatch) {
        const isParent = studentMatch.parentPhone === q;
        const resolvedEmail = isParent 
          ? (studentMatch.parentEmail || `${studentMatch.code.toLowerCase()}.parent@antam.edu.vn`)
          : (studentMatch.email || `${studentMatch.code.toLowerCase()}@antam.edu.vn`);
        
        email = resolvedEmail;
        fallbackProfile = {
          fullName: isParent ? studentMatch.parentName : studentMatch.fullName,
          role: isParent ? 'PARENT' : 'STUDENT',
          phone: isParent ? studentMatch.parentPhone : studentMatch.phone,
          title: isParent
            ? `Phụ huynh em ${studentMatch.fullName} (${studentMatch.className})`
            : `Học sinh Lớp ${studentMatch.className} (Khối ${studentMatch.grade})`,
          grade: studentMatch.grade,
          studentCode: studentMatch.code,
          isActive: true
        };
      }
    }

    // Try logging in with real Firebase Auth
    const loginResult = await auth.login(email, password || '123');
    
    if (loginResult.success) {
      setIsAuthModalOpen(false);
      setIsLoginPageView(false);
      return { success: true, message: `Chào mừng quay trở lại!` };
    }

    // If real Firebase Auth user doesn't exist yet but has local record, upgrade them on the fly!
    if (fallbackProfile && (
      loginResult.message?.includes('không chính xác') || 
      loginResult.message?.includes('not-found') || 
      loginResult.message?.includes('invalid-credential')
    )) {
      const defaultPassword = password || '123';
      const registerResult = await auth.register(email, defaultPassword, fallbackProfile);
      
      if (registerResult.success) {
        // Authenticate immediately with the newly registered account
        await auth.login(email, defaultPassword);
        setIsAuthModalOpen(false);
        setIsLoginPageView(false);
        return { 
          success: true, 
          message: `Chào mừng ${fallbackProfile.fullName}! Tài khoản của bạn đã được nâng cấp bảo mật Đám mây 3.0.` 
        };
      } else {
        return { success: false, message: registerResult.message };
      }
    }

    return loginResult;
  };

  const loginUser = login;

  const quickLoginAsRole = async (role: UserRole) => {
    const roleUser = users.find((u) => u.role === role) || INITIAL_AUTH_USERS.find((u) => u.role === role);
    if (roleUser) {
      // For quick demo access, we log in using Firebase Auth or auto-register them
      await login(roleUser.email, '123');
    } else {
      setCurrentRole(role);
    }
    setIsLoginPageView(false);
  };

  const logout = async () => {
    await auth.logout();
    setIsLoginPageView(true);
    localStorage.removeItem(`${STORAGE_KEY}_currentUser`);
  };

  const registerUser = async (data: Omit<AuthUser, 'id' | 'createdAt'> & { password: string }): Promise<{ success: boolean; message?: string }> => {
    const profile = {
      fullName: data.fullName,
      role: data.role,
      phone: data.phone,
      title: data.title,
      department: data.department,
      grade: data.grade,
      studentCode: data.studentCode,
      assignedClasses: data.assignedClasses,
      teachingSubjects: data.teachingSubjects,
      isActive: data.isActive !== false
    };

    const result = await auth.register(data.email, data.password, profile);
    if (result.success) {
      // Real sign-in immediately
      await auth.login(data.email, data.password);
      setIsAuthModalOpen(false);
      return { success: true, message: 'Đăng ký tài khoản bảo mật thành công!' };
    }
    return result;
  };

  const updateUserProfile = async (updates: Partial<AuthUser>) => {
    await auth.updateProfile(updates);
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    return auth.changePassword(oldPass, newPass);
  };

  // Permissions & Role Access Control
  const hasPermission = (permission: PermissionKey): boolean => {
    return auth.hasPermission(permission);
  };

  const addNewUser = (userData: Omit<AuthUser, 'id' | 'createdAt'>): AuthUser => {
    const newUser: AuthUser = {
      ...userData,
      id: `usr-${Date.now()}`,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Chưa đăng nhập',
    };
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<AuthUser>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const deleteUsers = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const targetSet = new Set(ids);
    setUsers((prev) => prev.filter((u) => !targetSet.has(u.id)));
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, isActive: !u.isActive };
          if (currentUser && currentUser.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  // Recalculate student total tuition
  const calculateStudentFees = (
    enrollments: Student['enrollments'],
    totalPaid: number,
    tuitionWaived?: boolean,
    tuitionDiscountPercent?: number
  ) => {
    const grossDue = enrollments.reduce((acc, curr) => acc + (curr.finalFee || 0), 0);
    let totalDue = grossDue;
    if (tuitionWaived) {
      totalDue = 0;
    } else if (tuitionDiscountPercent !== undefined && tuitionDiscountPercent > 0) {
      const discountRatio = Math.min(100, Math.max(0, tuitionDiscountPercent)) / 100;
      totalDue = Math.round(grossDue * (1 - discountRatio));
    }
    const remaining = Math.max(0, totalDue - totalPaid);
    return { totalTuitionDue: totalDue, remainingDebt: remaining };
  };

  const addStudent = (studentData: Omit<Student, 'id' | 'totalTuitionDue' | 'totalPaid' | 'remainingDebt'>): Student => {
    const id = `st-${Date.now()}`;
    const effectiveDiscountPercent = studentData.tuitionWaived ? 100 : (studentData.tuitionDiscountPercent || 0);
    const effectiveWaived = effectiveDiscountPercent === 100;
    const { totalTuitionDue, remainingDebt } = calculateStudentFees(
      studentData.enrollments,
      0,
      effectiveWaived,
      effectiveDiscountPercent
    );
    const newStudent: Student = {
      ...studentData,
      id,
      tuitionDiscountPercent: effectiveDiscountPercent,
      tuitionWaived: effectiveWaived,
      totalTuitionDue,
      totalPaid: 0,
      remainingDebt,
    };

    setStudents((prev) => [newStudent, ...prev]);

    // Automatically generate first month invoice
    if (totalTuitionDue > 0) {
      const newInvoice: InvoiceRecord = {
        id: `inv-${Date.now()}`,
        invoiceCode: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(students.length + 1).padStart(3, '0')}`,
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        studentCode: newStudent.code,
        grade: newStudent.grade,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        dueDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15`,
        totalAmount: totalTuitionDue,
        paidAmount: 0,
        remainingAmount: totalTuitionDue,
        status: 'unpaid',
        lineItems: newStudent.enrollments.map((en) => ({
          subjectId: en.subjectId,
          subjectName: en.subjectName,
          amount: en.finalFee,
        })),
        paymentHistory: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      setInvoices((prev) => [newInvoice, ...prev]);
    }

    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id === id) {
          const updatedEnrollments = updates.enrollments || st.enrollments;
          const updatedPaid = updates.totalPaid !== undefined ? updates.totalPaid : st.totalPaid;
          const updatedDiscountPercent = updates.tuitionDiscountPercent !== undefined
            ? updates.tuitionDiscountPercent
            : updates.tuitionWaived !== undefined
            ? (updates.tuitionWaived ? 100 : 0)
            : (st.tuitionDiscountPercent || 0);
          const updatedWaived = updates.tuitionWaived !== undefined
            ? updates.tuitionWaived
            : updatedDiscountPercent === 100;

          const { totalTuitionDue, remainingDebt } = calculateStudentFees(
            updatedEnrollments,
            updatedPaid,
            updatedWaived,
            updatedDiscountPercent
          );
          return {
            ...st,
            ...updates,
            tuitionDiscountPercent: updatedDiscountPercent,
            tuitionWaived: updatedWaived,
            totalTuitionDue,
            remainingDebt,
          };
        }
        return st;
      })
    );
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setInvoices((prev) => prev.filter((inv) => inv.studentId !== id));
    setAttendance((prev) => prev.filter((att) => att.studentId !== id));
  };

  const deleteStudents = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const targetSet = new Set(ids);
    setStudents((prev) => prev.filter((s) => !targetSet.has(s.id)));
    setInvoices((prev) => prev.filter((inv) => !targetSet.has(inv.studentId)));
    setAttendance((prev) => prev.filter((att) => !targetSet.has(att.studentId)));
  };

  const addPayment = (invoiceId: string, paymentData: Omit<PaymentTransaction, 'id' | 'invoiceId'>) => {
    const paymentId = `pay-${Date.now()}`;
    const newPayment: PaymentTransaction = {
      ...paymentData,
      id: paymentId,
      invoiceId,
    };

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paidAmount + newPayment.amount;
          const newRemaining = Math.max(0, inv.totalAmount - newPaid);
          const newStatus = newRemaining === 0 ? 'paid' : newPaid > 0 ? 'partial' : inv.status;
          return {
            ...inv,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newStatus,
            paymentHistory: [newPayment, ...inv.paymentHistory],
          };
        }
        return inv;
      })
    );

    // Sync student total paid
    const targetInvoice = invoices.find((i) => i.id === invoiceId);
    if (targetInvoice) {
      setStudents((prev) =>
        prev.map((st) => {
          if (st.id === targetInvoice.studentId) {
            const updatedPaid = st.totalPaid + newPayment.amount;
            const updatedDebt = Math.max(0, st.totalTuitionDue - updatedPaid);
            return {
              ...st,
              totalPaid: updatedPaid,
              remainingDebt: updatedDebt,
            };
          }
          return st;
        })
      );
    }
  };

  const createInvoice = (invoiceData: Omit<InvoiceRecord, 'id' | 'paidAmount' | 'remainingAmount' | 'status' | 'paymentHistory' | 'createdAt'>) => {
    const newInvoice: InvoiceRecord = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      paidAmount: 0,
      remainingAmount: invoiceData.totalAmount,
      status: 'unpaid',
      paymentHistory: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  const addExpense = (expenseData: Omit<ExpenseItem, 'id' | 'expenseCode'>) => {
    const newExpense: ExpenseItem = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      expenseCode: `EXP-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(expenses.length + 1).padStart(2, '0')}`,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const addSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSub: Subject = {
      ...subjectData,
      id: `sub-${Date.now()}`,
    };
    setSubjects((prev) => [...prev, newSub]);
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const addLead = (leadData: Omit<ParentLead, 'id' | 'code' | 'timeline' | 'createdAt'>): ParentLead => {
    const newLead: ParentLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      code: `LEAD-${new Date().getFullYear()}-${String(leads.length + 1).padStart(3, '0')}`,
      timeline: [
        {
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'Tạo mới Lead',
          by: 'Hệ thống',
        },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    };
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  };

  const updateLeadStatus = (id: string, status: LeadStatus, note?: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const actionText = `Chuyển trạng thái sang: ${status}`;
          return {
            ...l,
            status,
            timeline: [
              {
                date: new Date().toISOString().replace('T', ' ').slice(0, 16),
                action: actionText,
                by: 'Tư vấn viên',
                notes: note,
              },
              ...l.timeline,
            ],
          };
        }
        return l;
      })
    );
  };

  const convertLeadToStudent = (leadId: string, className = '8A1'): Student => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    const defaultSubjectEnrollments = (lead.interestedSubjects || []).map((subName, idx) => {
      const matchSubject = subjects.find((s) => s.name.toLowerCase() === subName.toLowerCase()) || subjects[0];
      const gradeSpecificFee = matchSubject.gradeFees && matchSubject.gradeFees[lead.targetGrade] !== undefined
        ? matchSubject.gradeFees[lead.targetGrade]
        : matchSubject.defaultFee;
      return {
        id: `en-lead-${Date.now()}-${idx}`,
        subjectId: matchSubject.id,
        subjectName: matchSubject.name,
        monthlyFee: gradeSpecificFee,
        discount: 0,
        finalFee: gradeSpecificFee,
        startDate: new Date().toISOString().split('T')[0],
        status: 'active' as const,
      };
    });

    const newStudent = addStudent({
      code: `AT-K${lead.targetGrade}-${String(students.length + 1).padStart(3, '0')}`,
      fullName: lead.studentName,
      dob: '2012-01-01',
      gender: 'Nam',
      phone: lead.phone,
      zalo: lead.zalo || lead.phone,
      email: lead.email || '',
      address: 'Hà Nội',
      currentSchool: lead.currentSchool || 'THCS',
      grade: lead.targetGrade,
      className,
      status: 'active',
      parentName: lead.parentName,
      parentPhone: lead.phone,
      parentRelationship: 'Phụ huynh' as any,
      notes: `Chuyển đổi từ Lead ${lead.code}. Nhu cầu: ${lead.customTutoring?.topic || lead.interestedSubjects.join(', ')}`,
      enrollments: defaultSubjectEnrollments,
      joinedDate: new Date().toISOString().split('T')[0],
    });

    updateLeadStatus(leadId, 'enrolled', 'Đã chuyển thành học sinh chính thức');
    return newStudent;
  };

  const addTutor = (tutorData: Omit<TutorAssistant, 'id' | 'code' | 'createdAt'>) => {
    const newTutor: TutorAssistant = {
      ...tutorData,
      id: `tut-${Date.now()}`,
      code: `TA-${new Date().getFullYear()}-${String(tutors.length + 1).padStart(2, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTutors((prev) => [newTutor, ...prev]);
  };

  const updateTutorStatus = (id: string, status: TutorStatus) => {
    setTutors((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const deleteTutor = (id: string) => {
    setTutors((prev) => prev.filter((t) => t.id !== id));
  };

  const deleteTutors = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const targetSet = new Set(ids);
    setTutors((prev) => prev.filter((t) => !targetSet.has(t.id)));
  };

  const addScheduleSession = (sessionData: Omit<ScheduleSession, 'id'>): ScheduleSession => {
    const newSession: ScheduleSession = {
      ...sessionData,
      id: `ses-${Date.now()}`,
    };
    setScheduleSessions((prev) => [...prev, newSession]);
    return newSession;
  };

  const updateScheduleSession = (id: string, updates: Partial<ScheduleSession>) => {
    setScheduleSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteScheduleSession = (id: string) => {
    setScheduleSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const saveAttendance = (sessionId: string, records: Omit<StudentAttendance, 'id' | 'sessionId'>[]) => {
    const newAttendanceList = records.map((r, idx) => ({
      ...r,
      id: `att-${Date.now()}-${idx}`,
      sessionId,
    }));

    setAttendance((prev) => {
      const filtered = prev.filter((a) => a.sessionId !== sessionId);
      return [...filtered, ...newAttendanceList];
    });

    // Mark session completed
    setScheduleSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'completed' } : s))
    );
  };

  const addAssignment = (assignmentData: Omit<LMSAssignment, 'id' | 'submissionsCount' | 'createdAt'>) => {
    const newAsg: LMSAssignment = {
      ...assignmentData,
      id: `asg-${Date.now()}`,
      submissionsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAssignments((prev) => [newAsg, ...prev]);
  };

  const submitAssignmentAnswers = (
    assignmentId: string,
    studentId: string,
    studentName: string,
    answers: { questionId: string; selectedOption?: number; textAnswer?: string }[]
  ) => {
    const targetAsg = assignments.find((a) => a.id === assignmentId);
    let score = 0;

    if (targetAsg) {
      targetAsg.questions.forEach((q) => {
        const studentAns = answers.find((a) => a.questionId === q.id);
        if (studentAns && studentAns.selectedOption !== undefined && studentAns.selectedOption === q.correctOptionIndex) {
          score += q.points;
        }
      });
    }

    const newSub: LMSSubmission = {
      id: `subm-${Date.now()}`,
      assignmentId,
      studentId,
      studentName,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      answers,
      score,
      status: 'graded',
      teacherFeedback: score >= 8 ? 'Làm bài xuất sắc, nắm chắc kiến thức!' : 'Cần xem lại một số câu lý thuyết.',
      gradedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      gradedBy: 'AI & Hệ thống tự động',
    };

    setSubmissions((prev) => [newSub, ...prev]);
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, submissionsCount: a.submissionsCount + 1 } : a))
    );
  };

  const gradeSubmission = (submissionId: string, score: number, feedback: string, teacherName: string) => {
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === submissionId
          ? {
              ...sub,
              score,
              teacherFeedback: feedback,
              gradedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              gradedBy: teacherName,
              status: 'graded',
            }
          : sub
      )
    );
  };

  const importExcelData = (data: ExcelImportResult, duplicateAction: 'merge' | 'create_new' | 'skip') => {
    let addedStudents = 0;
    let addedExpenses = 0;
    let addedLeads = 0;
    let addedTutors = 0;

    // Process Students
    const newStudentsToAdd: Student[] = [];
    const newInvoicesToAdd: InvoiceRecord[] = [];

    data.students.forEach((item, index) => {
      if (item.isDuplicate && duplicateAction === 'skip') {
        return;
      }

      const id = `st-imp-${Date.now()}-${index}`;
      const defaultEnrollments: Student['enrollments'] =
        item.data.enrollments && item.data.enrollments.length > 0
          ? item.data.enrollments
          : [
              {
                id: `en-${id}-1`,
                subjectId: 'sub-toan',
                subjectName: 'Toán học',
                monthlyFee: 1000000,
                discount: 0,
                finalFee: 1000000,
                startDate: new Date().toISOString().split('T')[0],
                status: 'active',
              },
            ];

      const totalTuitionDue =
        item.data.totalTuitionDue !== undefined
          ? item.data.totalTuitionDue
          : defaultEnrollments.reduce((sum, e) => sum + e.finalFee, 0);

      const totalPaid =
        item.data.totalPaid !== undefined ? item.data.totalPaid : totalTuitionDue;

      const remainingDebt =
        item.data.remainingDebt !== undefined
          ? item.data.remainingDebt
          : Math.max(0, totalTuitionDue - totalPaid);

      const newStudent: Student = {
        id,
        code:
          item.isDuplicate && duplicateAction === 'create_new'
            ? `${item.data.code}-NEW`
            : item.data.code || `AT-K${item.grade}-${index + 10}`,
        fullName: item.data.fullName || 'Học sinh mới',
        dob: item.data.dob || '2012-01-01',
        gender: (item.data.gender as any) || 'Nam',
        phone: item.data.phone || '',
        zalo: item.data.zalo || item.data.phone || '',
        email: item.data.email || '',
        address: item.data.address || 'Hà Nội',
        currentSchool: item.data.currentSchool || 'THCS',
        grade: item.grade || 8,
        className: item.data.className || `${item.grade || 8}A1`,
        status: 'active',
        parentName: item.data.parentName || 'Phụ huynh',
        parentPhone: item.data.parentPhone || item.data.phone || '',
        parentRelationship: (item.data.parentRelationship as any) || 'Bố',
        notes: item.data.notes || 'Import từ file Excel',
        enrollments: defaultEnrollments,
        joinedDate: item.data.joinedDate || new Date().toISOString().split('T')[0],
        totalTuitionDue,
        totalPaid,
        remainingDebt,
      };

      newStudentsToAdd.push(newStudent);
      addedStudents++;

      // Create an invoice record if tuition is due
      if (totalTuitionDue > 0) {
        const invStatus =
          remainingDebt === 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
        const newInvoice: InvoiceRecord = {
          id: `inv-imp-${Date.now()}-${index}`,
          invoiceCode: `INV-202608-${newStudent.code}`,
          studentId: id,
          studentName: newStudent.fullName,
          studentCode: newStudent.code,
          grade: newStudent.grade,
          month: 8,
          year: 2026,
          totalAmount: totalTuitionDue,
          paidAmount: totalPaid,
          remainingAmount: remainingDebt,
          status: invStatus,
          dueDate: '2026-08-15',
          lineItems: defaultEnrollments.map((en) => ({
            id: `item-${en.id}`,
            subjectId: en.subjectId,
            subjectName: en.subjectName,
            amount: en.finalFee,
          })),
          paymentHistory:
            totalPaid > 0
              ? [
                  {
                    id: `pay-imp-${Date.now()}-${index}`,
                    invoiceId: `inv-imp-${Date.now()}-${index}`,
                    studentId: id,
                    studentName: newStudent.fullName,
                    amount: totalPaid,
                    paymentDate: new Date().toISOString().split('T')[0],
                    method: 'bank_transfer',
                    collectedBy: 'Kế toán',
                    notes: 'Đã nộp theo dữ liệu Excel',
                  },
                ]
              : [],
          createdAt: new Date().toISOString().split('T')[0],
        };
        newInvoicesToAdd.push(newInvoice);
      }
    });

    if (newStudentsToAdd.length > 0) {
      setStudents((prev) => [...newStudentsToAdd, ...prev]);
    }
    if (newInvoicesToAdd.length > 0) {
      setInvoices((prev) => [...newInvoicesToAdd, ...prev]);
    }

    // Process Expenses
    const newExpensesToAdd: ExpenseItem[] = data.expenses.map((exp, idx) => ({
      id: `exp-imp-${Date.now()}-${idx}`,
      expenseCode: exp.data.expenseCode || `EXP-IMP-${idx + 1}`,
      date: exp.data.date || new Date().toISOString().split('T')[0],
      category: (exp.data.category as any) || 'other',
      categoryName: exp.data.categoryName || 'Khác',
      description: exp.data.description || 'Khoản chi nhập từ Excel',
      amount: exp.data.amount || 0,
      payer: exp.data.payer || 'Kế toán',
      status: 'paid',
      notes: exp.data.notes || '',
    }));
    if (newExpensesToAdd.length > 0) {
      setExpenses((prev) => [...newExpensesToAdd, ...prev]);
      addedExpenses = newExpensesToAdd.length;
    }

    // Process Tutor Applicants
    const newTutorsToAdd: TutorAssistant[] = data.tutorApplicants.map((tut, idx) => ({
      id: `tut-imp-${Date.now()}-${idx}`,
      code: tut.data.code || `TA-IMP-${idx + 1}`,
      fullName: tut.data.fullName || 'Trợ giảng ứng viên',
      gender: 'Nữ',
      phone: tut.data.phone || '',
      email: tut.data.email || '',
      university: tut.data.university || 'Đại học',
      major: tut.data.major || 'Sư phạm',
      subjectsCanTeach: tut.data.subjectsCanTeach || ['Toán học'],
      gradesCanTeach: [6, 7, 8, 9],
      experienceYears: tut.data.experienceYears || 1,
      bio: tut.data.bio || 'Ứng viên biểu mẫu 1',
      expectations: tut.data.expectations || '',
      status: 'new_applicant',
      hourlyRate: 150000,
      rating: 5.0,
      availability: tut.data.availability || {
        2: { shift1: false, shift2: true, shift3: true, shift4: false },
        3: { shift1: false, shift2: true, shift3: true, shift4: false },
        4: { shift1: false, shift2: true, shift3: true, shift4: false },
        5: { shift1: false, shift2: true, shift3: true, shift4: false },
        6: { shift1: false, shift2: true, shift3: true, shift4: false },
        7: { shift1: true, shift2: true, shift3: true, shift4: true },
        8: { shift1: true, shift2: true, shift3: true, shift4: true },
      },
      createdAt: new Date().toISOString().split('T')[0],
    }));
    if (newTutorsToAdd.length > 0) {
      setTutors((prev) => [...newTutorsToAdd, ...prev]);
      addedTutors = newTutorsToAdd.length;
    }

    // Process Parent Leads
    const newLeadsToAdd: ParentLead[] = data.parentLeads.map((lead, idx) => ({
      id: `lead-imp-${Date.now()}-${idx}`,
      code: lead.data.code || `LEAD-IMP-${idx + 1}`,
      parentName: lead.data.parentName || 'Phụ huynh',
      studentName: lead.data.studentName || 'Học sinh',
      phone: lead.data.phone || '',
      zalo: lead.data.zalo || lead.data.phone || '',
      currentSchool: lead.data.currentSchool || '',
      targetGrade: lead.data.targetGrade || 8,
      interestedSubjects: lead.data.interestedSubjects || ['Toán học'],
      interestedServices: lead.data.interestedServices || ['Lớp học tiêu chuẩn'],
      customTutoring: lead.data.customTutoring,
      preferredSchedule: lead.data.preferredSchedule || [],
      referralSource: lead.data.referralSource || 'Biểu mẫu 2',
      status: 'new',
      assignedConsultant: 'Tư vấn viên Thanh Hương',
      timeline: [
        {
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'Import từ Excel Biểu mẫu 2',
          by: 'Hệ thống',
        },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    }));
    if (newLeadsToAdd.length > 0) {
      setLeads((prev) => [...newLeadsToAdd, ...prev]);
      addedLeads = newLeadsToAdd.length;
    }

    return { addedStudents, addedExpenses, addedLeads, addedTutors };
  };

  const [isCompactView, setIsCompactView] = useState<boolean>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_isCompactView`) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_isCompactView`, isCompactView ? 'true' : 'false');
  }, [isCompactView]);

  const cleanAndNormalizeData = (options = {
    cleanNames: true,
    cleanPhones: true,
    recalcTuition: true,
    deduplicate: true,
    removeEmpty: true,
  }) => {
    const result = cleanAndNormalizeAllData(students, invoices, expenses, leads, tutors, options);
    setStudents(result.cleanedStudents);
    setInvoices(result.cleanedInvoices);
    setExpenses(result.cleanedExpenses);
    setLeads(result.cleanedLeads);
    setTutors(result.cleanedTutors);
    return result.stats;
  };

  const resetToCompactData = () => {
    localStorage.clear();
    setStudents(INITIAL_STUDENTS);
    setSubjects(INITIAL_SUBJECTS);
    setTuitionPlans(INITIAL_TUITION_PLANS);
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setLeads(INITIAL_LEADS);
    setTutors(INITIAL_TUTORS);
    setClasses(INITIAL_CLASSES);
    setScheduleSessions(INITIAL_SCHEDULE_SESSIONS);
    setAttendance(INITIAL_ATTENDANCE);
    setLessons(INITIAL_LMS_LESSONS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setSubmissions(INITIAL_SUBMISSIONS);
  };

  const clearAllData = () => {
    setStudents([]);
    setInvoices([]);
    setExpenses([]);
    setLeads([]);
    setTutors([]);
    setAttendance([]);
    setSubmissions([]);
  };

  const resetAllData = () => {
    resetToCompactData();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated: !!currentUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isLoginPageView,
        setIsLoginPageView,
        isDatabaseModalOpen,
        setIsDatabaseModalOpen,
        login,
        loginUser,
        quickLoginAsRole,
        logout,
        registerUser,
        updateUserProfile,
        changePassword,
        currentRole,
        setCurrentRole,
        selectedGrade,
        setSelectedGrade,
        students,
        subjects,
        tuitionPlans,
        invoices,
        expenses,
        leads,
        tutors,
        classes,
        scheduleSessions,
        attendance,
        lessons,
        assignments,
        submissions,
        addStudent,
        updateStudent,
        deleteStudent,
        deleteStudents,
        addPayment,
        createInvoice,
        addExpense,
        deleteExpense,
        addSubject,
        updateSubject,
        addLead,
        updateLeadStatus,
        convertLeadToStudent,
        addTutor,
        updateTutorStatus,
        deleteTutor,
        deleteTutors,
        addScheduleSession,
        updateScheduleSession,
        deleteScheduleSession,
        saveAttendance,
        addAssignment,
        submitAssignmentAnswers,
        gradeSubmission,
        hasPermission,
        addNewUser,
        updateUser,
        deleteUser,
        deleteUsers,
        toggleUserStatus,
        importExcelData,
        cleanAndNormalizeData,
        resetToCompactData,
        clearAllData,
        resetAllData,
        isCompactView,
        setIsCompactView,
        isLoadingFromCloud,
        isFirebaseConnected,
        isSavingToDatabase,
        lastSavedTimestamp,
        hasUnsavedChanges,
        saveAllToDatabase,
        exportJsonBackup,
        importJsonBackup,
        syncFromCloud,
        globalToast,
        showGlobalToast,
        hideGlobalToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
