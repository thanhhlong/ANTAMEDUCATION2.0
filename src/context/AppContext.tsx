import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface AppContextType {
  // Authentication & Session
  currentUser: AuthUser | null;
  users: AuthUser[];
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isLoginPageView: boolean;
  setIsLoginPageView: (show: boolean) => void;
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

  // Student Actions
  addStudent: (student: Omit<Student, 'id' | 'totalTuitionDue' | 'totalPaid' | 'remainingDebt'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

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
  toggleUserStatus: (id: string) => void;

  // Excel Import
  importExcelData: (data: ExcelImportResult, duplicateAction: 'merge' | 'create_new' | 'skip') => { addedStudents: number; addedExpenses: number; addedLeads: number; addedTutors: number };
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'antam_education_app_state_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<AuthUser[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : INITIAL_AUTH_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_currentUser`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_AUTH_USERS[0];
      }
    }
    return INITIAL_AUTH_USERS[0];
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLoginPageView, setIsLoginPageView] = useState<boolean>(false);

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return currentUser ? currentUser.role : 'SUPER_ADMIN';
  });
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_students`);
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_subjects`);
    return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
  });

  const [tuitionPlans, setTuitionPlans] = useState<TuitionPlan[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tuitionPlans`);
    return saved ? JSON.parse(saved) : INITIAL_TUITION_PLANS;
  });

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [leads, setLeads] = useState<ParentLead[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_leads`);
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  const [tutors, setTutors] = useState<TutorAssistant[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tutors`);
    return saved ? JSON.parse(saved) : INITIAL_TUTORS;
  });

  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_classes`);
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  const [scheduleSessions, setScheduleSessions] = useState<ScheduleSession[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_scheduleSessions`);
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE_SESSIONS;
  });

  const [attendance, setAttendance] = useState<StudentAttendance[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_attendance`);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [lessons, setLessons] = useState<LMSLesson[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_lessons`);
    return saved ? JSON.parse(saved) : INITIAL_LMS_LESSONS;
  });

  const [assignments, setAssignments] = useState<LMSAssignment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_assignments`);
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [submissions, setSubmissions] = useState<LMSSubmission[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_submissions`);
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

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

  // Auth Handlers
  const login = async (identifier: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const q = identifier.trim().toLowerCase();
    if (!q) {
      return { success: false, message: 'Vui lòng nhập email, số điện thoại hoặc mã học sinh' };
    }

    // 1. Check in registered users list
    let matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === q ||
        u.username.toLowerCase() === q ||
        (u.phone && u.phone.includes(q)) ||
        (u.studentCode && u.studentCode.toLowerCase() === q)
    );

    // 2. If not found in users list, check in students directory to allow immediate student/parent login
    if (!matchedUser) {
      const studentMatch = students.find(
        (s) =>
          s.code.toLowerCase() === q ||
          s.email.toLowerCase() === q ||
          s.phone === q ||
          s.parentPhone === q
      );

      if (studentMatch) {
        const isParent = studentMatch.parentPhone === q;
        matchedUser = {
          id: isParent ? `usr-parent-${studentMatch.id}` : `usr-student-${studentMatch.id}`,
          username: isParent ? `ph.${studentMatch.code.toLowerCase()}` : `hs.${studentMatch.code.toLowerCase()}`,
          email: isParent ? (studentMatch.parentEmail || `${studentMatch.code.toLowerCase()}@parent.antam.edu.vn`) : studentMatch.email,
          phone: isParent ? studentMatch.parentPhone : studentMatch.phone,
          fullName: isParent ? studentMatch.parentName : studentMatch.fullName,
          role: isParent ? 'PARENT' : 'STUDENT',
          title: isParent
            ? `Phụ huynh em ${studentMatch.fullName} (${studentMatch.className})`
            : `Học sinh Lớp ${studentMatch.className} (Khối ${studentMatch.grade})`,
          grade: studentMatch.grade,
          studentCode: studentMatch.code,
          password: '123',
          createdAt: studentMatch.joinedDate || new Date().toISOString().split('T')[0],
          lastLogin: new Date().toLocaleString('vi-VN'),
        };
        // Add to users list
        setUsers((prev) => [...prev, matchedUser!]);
      }
    }

    if (!matchedUser) {
      return { success: false, message: 'Không tìm thấy tài khoản với thông tin đã nhập' };
    }

    // Validate password if user has password set (allow demo password bypass)
    if (password && matchedUser.password && matchedUser.password !== password && password !== '123' && password !== '123456') {
      return { success: false, message: 'Mật khẩu không chính xác. Mật khẩu mẫu là 123 hoặc 123456' };
    }

    const updatedUser = {
      ...matchedUser,
      lastLogin: new Date().toLocaleString('vi-VN'),
    };

    setCurrentUser(updatedUser);
    setCurrentRole(updatedUser.role);
    if (updatedUser.grade) {
      setSelectedGrade(updatedUser.grade);
    }
    setIsAuthModalOpen(false);
    setIsLoginPageView(false);

    return { success: true, message: `Chào mừng ${updatedUser.fullName} quay trở lại!` };
  };

  const loginUser = login;

  const quickLoginAsRole = (role: UserRole) => {
    const roleUser = users.find((u) => u.role === role) || INITIAL_AUTH_USERS.find((u) => u.role === role);
    if (roleUser) {
      const updated = {
        ...roleUser,
        lastLogin: new Date().toLocaleString('vi-VN'),
      };
      setCurrentUser(updated);
      setCurrentRole(role);
      if (updated.grade) {
        setSelectedGrade(updated.grade);
      }
    } else {
      setCurrentRole(role);
    }
    setIsLoginPageView(false);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoginPageView(true);
    localStorage.removeItem(`${STORAGE_KEY}_currentUser`);
  };

  const registerUser = async (data: Omit<AuthUser, 'id' | 'createdAt'> & { password: string }): Promise<{ success: boolean; message?: string }> => {
    const existing = users.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase() || (data.phone && u.phone === data.phone)
    );
    if (existing) {
      return { success: false, message: 'Email hoặc số điện thoại đã được đăng ký tài khoản khác' };
    }

    const newUser: AuthUser = {
      ...data,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toLocaleString('vi-VN'),
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setCurrentRole(newUser.role);
    if (newUser.grade) {
      setSelectedGrade(newUser.grade);
    }
    setIsAuthModalOpen(false);

    return { success: true, message: 'Tạo tài khoản và đăng nhập thành công!' };
  };

  const updateUserProfile = (updates: Partial<AuthUser>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) return { success: false, message: 'Chưa đăng nhập' };
    if (currentUser.password && currentUser.password !== oldPass && oldPass !== '123' && oldPass !== '123456') {
      return { success: false, message: 'Mật khẩu cũ không chính xác' };
    }
    if (!newPass || newPass.length < 3) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 3 ký tự' };
    }
    updateUserProfile({ password: newPass });
    return { success: true, message: 'Đổi mật khẩu thành công!' };
  };

  // Permissions & Role Access Control
  const hasPermission = (permission: PermissionKey): boolean => {
    if (!currentRole) return false;
    if (currentRole === 'SUPER_ADMIN') return true;
    if (currentUser?.customPermissions && currentUser.customPermissions.includes(permission)) {
      return true;
    }
    const config = ROLE_PERMISSION_CONFIGS.find((c) => c.role === currentRole);
    return config ? config.permissions.includes(permission) : false;
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
  const calculateStudentFees = (enrollments: Student['enrollments'], totalPaid: number, tuitionWaived?: boolean) => {
    const totalDue = tuitionWaived ? 0 : enrollments.reduce((acc, curr) => acc + (curr.finalFee || 0), 0);
    const remaining = Math.max(0, totalDue - totalPaid);
    return { totalTuitionDue: totalDue, remainingDebt: remaining };
  };

  const addStudent = (studentData: Omit<Student, 'id' | 'totalTuitionDue' | 'totalPaid' | 'remainingDebt'>): Student => {
    const id = `st-${Date.now()}`;
    const { totalTuitionDue, remainingDebt } = calculateStudentFees(studentData.enrollments, 0, studentData.tuitionWaived);
    const newStudent: Student = {
      ...studentData,
      id,
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
          const updatedWaived = updates.tuitionWaived !== undefined ? updates.tuitionWaived : st.tuitionWaived;
          const { totalTuitionDue, remainingDebt } = calculateStudentFees(updatedEnrollments, updatedPaid, updatedWaived);
          return {
            ...st,
            ...updates,
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
    data.students.forEach((item, index) => {
      if (item.isDuplicate && duplicateAction === 'skip') {
        return;
      }

      const id = `st-imp-${Date.now()}-${index}`;
      const defaultEnrollments: Student['enrollments'] = [
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

      const newStudent: Student = {
        id,
        code: item.isDuplicate && duplicateAction === 'create_new' ? `${item.data.code}-NEW` : item.data.code || `AT-K${item.grade}-${index + 10}`,
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
        parentRelationship: 'Bố',
        notes: item.data.notes || 'Import từ file Excel',
        enrollments: defaultEnrollments,
        joinedDate: new Date().toISOString().split('T')[0],
        totalTuitionDue: 1000000,
        totalPaid: 1000000,
        remainingDebt: 0,
      };

      newStudentsToAdd.push(newStudent);
      addedStudents++;
    });

    if (newStudentsToAdd.length > 0) {
      setStudents((prev) => [...newStudentsToAdd, ...prev]);
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

  const resetAllData = () => {
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
        toggleUserStatus,
        importExcelData,
        resetAllData,
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
