export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ACADEMIC_MANAGER'
  | 'ACCOUNTANT'
  | 'TEACHER'
  | 'TUTOR'
  | 'STUDENT'
  | 'PARENT';

export type StudentStatus = 'active' | 'dropped';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'qr_code' | 'momo' | 'vnpay';

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultFee: number; // e.g. 1000000 (Toán), 400000 (Văn, Anh, KHTN)
  color: string;
  gradeLevels: number[]; // [6, 7, 8, 9]
  iconName?: string;
  active: boolean;
  gradeFees?: { [grade: number]: number }; // Specific overrides per grade
}

export interface TuitionPlan {
  id: string;
  name: string;
  subjectId: string;
  grade: number;
  feePerMonth: number;
  sessionCountPerMonth: number;
  description?: string;
  active: boolean;
}

export interface StudentEnrollment {
  id: string;
  subjectId: string;
  subjectName: string;
  monthlyFee: number;
  discount: number;
  finalFee: number;
  startDate: string;
  status: 'active' | 'dropped';
  classId?: string;
  notes?: string;
  lastPaidDate?: string; // Ngày nộp tiền gần nhất của môn học này
  paidStatus?: 'paid' | 'partial' | 'unpaid';
}

export interface Student {
  id: string;
  code: string; // e.g., "AT-K8-012"
  fullName: string;
  dob?: string;
  dateOfBirth?: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  phone: string;
  zalo: string;
  email: string;
  address: string;
  currentSchool: string; // e.g. "THCS Trưng Vương"
  grade: number; // 6, 7, 8, 9
  className: string; // e.g. "8A1"
  status: StudentStatus; // 'active' (Đang học) | 'dropped' (Nghỉ học)
  leaveDate?: string; // Ngày tháng năm nghỉ học (YYYY-MM-DD)
  parentName: string;
  parentPhone: string;
  parentZalo?: string;
  parentEmail?: string;
  parentRelationship: 'Bố' | 'Mẹ' | 'Người giám hộ';
  notes?: string;
  enrollments: StudentEnrollment[];
  avatarUrl?: string;
  joinedDate: string;
  totalTuitionDue: number; // Auto calculated sum
  totalPaid: number;
  remainingDebt: number;
  tuitionDiscountPercent?: number; // Tỉ lệ phần trăm miễn giảm học phí (0% - 100%)
  tuitionWaived?: boolean; // Tương đương 100% miễn học phí
}

export type PaymentMode = 'full' | 'per_subject'; // 'full' (Nộp tổng tất cả môn) | 'per_subject' (Nộp từng môn riêng biệt)

export interface SubjectPaymentItem {
  subjectId: string;
  subjectName: string;
  amount: number;
  paidDate?: string; // Ngày nộp của môn
  notes?: string;
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceCode?: string;
  collectedBy: string;
  notes?: string;
  receiptUrl?: string;
  paymentMode?: PaymentMode;
  subjectBreakdown?: SubjectPaymentItem[];
}

export interface InvoiceLineItem {
  subjectId: string;
  subjectName: string;
  amount: number;
  paidAmount?: number;
  remainingAmount?: number;
  paidDate?: string; // Lưu ngày nộp tiền của từng môn
  status?: 'paid' | 'partial' | 'unpaid';
  paymentMode?: PaymentMode;
  notes?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceCode: string; // e.g., "INV-2026-08-001"
  studentId: string;
  studentName: string;
  studentCode: string;
  grade: number;
  month: number;
  year: number;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  lineItems: InvoiceLineItem[];
  paymentHistory: PaymentTransaction[];
  notes?: string;
  createdAt: string;
  lastReminderSentAt?: string;
  isSettled?: boolean; // Đã quyết toán tháng
  settledDate?: string;
}

export interface MonthlySettlementRecord {
  id: string;
  month: number;
  year: number;
  totalStudents: number;
  totalDue: number;
  totalPaid: number;
  totalDebt: number;
  collectionRate: number;
  closedAt?: string;
  closedBy?: string;
  status: 'open' | 'reconciled' | 'closed';
  subjectStats: {
    subjectId: string;
    subjectName: string;
    studentCount: number;
    expectedFee: number;
    collectedFee: number;
    debtFee: number;
  }[];
}

export type ExpenseCategory =
  | 'rent'
  | 'cleaning'
  | 'equipment'
  | 'ac'
  | 'tv'
  | 'furniture'
  | 'lock_security'
  | 'stationery'
  | 'salary'
  | 'marketing'
  | 'internet'
  | 'utilities'
  | 'other';

export interface ExpenseItem {
  id: string;
  expenseCode: string; // e.g. "EXP-08-01"
  date: string;
  category: ExpenseCategory;
  categoryName: string;
  description: string;
  amount: number;
  payer: string;
  status: 'paid' | 'pending' | 'approved';
  receiptMetadata?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  };
  notes?: string;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'consulting'
  | 'trial_scheduled'
  | 'enrolled'
  | 'tuition_paid'
  | 'unfit'
  | 'no_response'
  | 'rescheduled';

export interface CustomTutoringNeed {
  subject?: string;
  topic: string; // e.g. "Ôn thi giữa kỳ 1", "Mất gốc hình học"
  targetGoal?: string; // e.g. "Đạt 8+ điểm kiểm tra"
  preferredSchedule?: string[];
  timeSlots?: string[]; // e.g. ["Tối Thứ 3 (17:30-19:00)", "Chiều Thứ 7 (14:00-15:30)"]
  sessionsPerWeek?: number;
  estimatedHours?: number;
  format?: '1-on-1' | 'nhóm_nhỏ_3_5' | 'online' | 'offline_trung_tam' | string;
  status?: string;
  notes?: string;
  matchedTutorId?: string;
  matchedTutorName?: string;
  matchingScore?: number;
}

export interface ParentLead {
  id: string;
  code: string;
  parentName: string;
  studentName: string;
  phone: string;
  zalo?: string;
  email?: string;
  currentSchool?: string;
  targetGrade: number;
  interestedSubjects: string[];
  interestedServices: string[];
  customTutoring?: CustomTutoringNeed;
  preferredSchedule: string[];
  referralSource: string; // e.g. "Facebook", "Bạn bè giới thiệu", "Google Form", "Biểu mẫu 2"
  status: LeadStatus;
  assignedConsultant: string;
  notes?: string;
  timeline: {
    date: string;
    action: string;
    by: string;
    notes?: string;
  }[];
  createdAt: string;
}

export type TutorStatus =
  | 'new_applicant'
  | 'contacted'
  | 'interviewing'
  | 'passed'
  | 'rejected'
  | 'active_contract'
  | 'ended';

export interface TutorAvailability {
  // Day: 2 (Mon) to 8 (Sun)
  // Shift: 1 (14:00-15:30), 2 (15:45-17:15), 3 (17:30-19:00), 4 (19:15-20:45)
  [dayOfWeek: number]: {
    shift1: boolean;
    shift2: boolean;
    shift3: boolean;
    shift4: boolean;
  };
}

export interface TutorAssistant {
  id: string;
  code: string;
  fullName: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  phone: string;
  email: string;
  university: string; // e.g. "ĐH Sư Phạm Hà Nội", "ĐH Ngoại Thương"
  major: string; // e.g. "Sư phạm Toán học", "Ngôn ngữ Anh"
  subjectsCanTeach: string[];
  gradesCanTeach: number[];
  experienceYears: number;
  bio: string;
  expectations: string;
  availability: TutorAvailability;
  status: TutorStatus;
  hourlyRate: number;
  rating: number; // 1 to 5
  avatarUrl?: string;
  createdAt: string;
}

export interface ClassGroup {
  id: string;
  code: string; // e.g. "TOAN-8A1"
  name: string;
  subjectId: string;
  subjectName: string;
  grade: number;
  teacherId: string;
  teacherName: string;
  tutorId?: string;
  tutorName?: string;
  room: string; // e.g. "Phòng 1", "Phòng 2"
  scheduleRules: {
    dayOfWeek: number; // 2 to 8
    shift: number; // 1 to 4
    startTime: string; // "17:30"
    endTime: string; // "19:00"
  }[];
  studentIds: string[];
  maxCapacity: number;
  active: boolean;
}

export interface ScheduleSession {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  grade: number;
  teacherId: string;
  teacherName: string;
  tutorId?: string;
  tutorName?: string;
  room: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 2..8
  shift: number; // 1..4
  startTime: string;
  endTime: string;
  topic: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export type AttendanceStatus = 'present' | 'late' | 'absent_excused' | 'absent_unexcused';

export interface StudentAttendance {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  status: AttendanceStatus;
  checkinTime?: string;
  faceVerified?: boolean;
  notes?: string;
}

export type AvailabilityMatrix = TutorAvailability;

export interface LMSLesson {
  id: string;
  subjectId: string;
  grade: number;
  classId?: string;
  title: string;
  chapter: string;
  description: string;
  content: string;
  videoUrl?: string;
  attachments: {
    name: string;
    url: string;
    size: string;
  }[];
  createdAt: string;
}

export interface LMSQuestion {
  id: string;
  type: 'multiple_choice' | 'essay';
  content: string;
  options?: string[];
  correctOptionIndex?: number;
  sampleAnswer?: string;
  points: number;
  explanation?: string;
}

export interface LMSAssignment {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  grade: number;
  classId?: string;
  description?: string;
  dueDate: string;
  questions: LMSQuestion[];
  totalPoints?: number;
  maxScore?: number;
  assignedStudentIds?: string[];
  submissionsCount: number;
  createdAt: string;
}

export interface LMSSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  answers: {
    questionId: string;
    selectedOption?: number;
    textAnswer?: string;
  }[];
  score?: number;
  teacherFeedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  status: 'submitted' | 'graded';
}

export interface AIInsightReport {
  timestamp: string;
  healthScore: number;
  summary: string;
  highlights: string[];
  financialForecast: {
    nextMonthRevenue: number;
    expectedTuitionCollection: number;
    estimatedExpenses: number;
    netProfit: number;
  };
  debtRecoveryAdvice: string[];
  conversionOptimization: string[];
  classRecommendations: string[];
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  title: string;
  department?: string;
  grade?: number;
  studentCode?: string;
  assignedClasses?: string[]; // e.g. ['8A1', '8A2', '9A1']
  teachingSubjects?: string[]; // e.g. ['sub-toan', 'sub-khtn']
  password?: string;
  isActive?: boolean;
  customPermissions?: string[];
  lastLogin?: string;
  createdAt: string;
}

export type PermissionKey =
  | 'VIEW_DASHBOARD'
  | 'MANAGE_STUDENTS'
  | 'VIEW_ALL_STUDENTS'
  | 'MANAGE_FINANCE'
  | 'VIEW_FINANCE'
  | 'MANAGE_EXPENSES'
  | 'MANAGE_CRM'
  | 'MANAGE_TIMETABLE'
  | 'MANAGE_ATTENDANCE'
  | 'MANAGE_LMS'
  | 'GRADE_SUBMISSIONS'
  | 'MANAGE_TUTORING'
  | 'MANAGE_USERS'
  | 'VIEW_AI_INSIGHTS';

export interface RolePermissionConfig {
  role: UserRole;
  roleName: string;
  description: string;
  color: string;
  badgeBg: string;
  permissions: PermissionKey[];
}

export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PAYMENT'
  | 'EXPORT'
  | 'IMPORT'
  | 'AUTH'
  | 'AI_QUERY'
  | 'BACKUP'
  | 'SYNC';

export interface AuditLogEntry {
  id: string;
  action: AuditActionType;
  entity: string; // 'student', 'invoice', 'expense', 'lead', 'class', 'grade', 'system', etc.
  entityId?: string;
  description: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string; // ISO 8601
  severity: 'info' | 'warning' | 'critical';
  details?: Record<string, any>;
  ipAddress?: string;
}

export interface SystemArchitectureStatus {
  version: string;
  frontend: {
    framework: string;
    runtime: string;
    modulesCount: number;
    activeUsersCount: number;
  };
  backend: {
    framework: string;
    runtime: string;
    status: 'online' | 'degraded' | 'offline';
    uptimeSeconds: number;
  };
  auth: {
    provider: string;
    status: 'active' | 'offline';
  };
  database: {
    engine: string;
    totalDocuments: number;
    collectionsCount: number;
    connected: boolean;
  };
  pillars: {
    storage: {
      status: 'healthy';
      storageType: string;
      lastBackupTime?: string;
    };
    gemini: {
      status: 'ready' | 'not_configured';
      model: string;
      capabilities: string[];
    };
    auditLog: {
      status: 'recording';
      totalLogs: number;
    };
  };
}

