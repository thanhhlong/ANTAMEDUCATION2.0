import { Student, InvoiceRecord, ExpenseItem, ParentLead, TutorAssistant, StudentEnrollment } from '../types';

/**
 * Normalizes Vietnamese proper names:
 * - Trims extra whitespaces (leading, trailing, consecutive)
 * - Converts each word to Proper Title Case: "  nguyễn   văn an " -> "Nguyễn Văn An"
 */
export function normalizeVietnameseName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  const cleaned = name.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalizes phone numbers:
 * - Removes spaces, dots, dashes, parentheses
 * - Converts +84 / 84 prefix to standard 0
 * - Handles 9-digit numbers missing leading 0
 */
export function normalizePhoneNumber(phone?: string): string {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+84')) {
    digits = '0' + digits.slice(3);
  } else if (digits.startsWith('84') && digits.length === 11) {
    digits = '0' + digits.slice(2);
  }
  
  // If 9 digits starting with typical mobile prefixes 3, 5, 7, 8, 9, add leading 0
  if (digits.length === 9 && /^[35789]/.test(digits)) {
    digits = '0' + digits;
  }
  
  return digits;
}

/**
 * Diagnostic analysis of all center data to find inconsistencies,
 * unformatted strings, mismatched tuitions, and duplicate records.
 */
export interface DataDiagnostics {
  totalStudents: number;
  totalInvoices: number;
  totalExpenses: number;
  totalLeads: number;
  totalTutors: number;
  unformattedNamesCount: number;
  unformattedPhonesCount: number;
  mismatchedDebtCount: number;
  duplicateStudentsCount: number;
  emptyRecordsCount: number;
  details: {
    nameIssues: string[];
    phoneIssues: string[];
    debtIssues: string[];
    duplicates: string[];
  };
}

export function diagnoseData(
  students: Student[],
  invoices: InvoiceRecord[],
  expenses: ExpenseItem[],
  leads: ParentLead[],
  tutors: TutorAssistant[]
): DataDiagnostics {
  let unformattedNamesCount = 0;
  let unformattedPhonesCount = 0;
  let mismatchedDebtCount = 0;
  let duplicateStudentsCount = 0;
  let emptyRecordsCount = 0;

  const nameIssues: string[] = [];
  const phoneIssues: string[] = [];
  const debtIssues: string[] = [];
  const duplicates: string[] = [];

  const seenCodes = new Set<string>();
  const seenNameAndPhone = new Set<string>();

  students.forEach((s) => {
    if (!s.fullName || !s.fullName.trim()) {
      emptyRecordsCount++;
    } else {
      const normalized = normalizeVietnameseName(s.fullName);
      if (normalized !== s.fullName) {
        unformattedNamesCount++;
        if (nameIssues.length < 5) {
          nameIssues.push(`"${s.fullName}" -> "${normalized}"`);
        }
      }
    }

    if (s.phone) {
      const normPhone = normalizePhoneNumber(s.phone);
      if (normPhone !== s.phone) {
        unformattedPhonesCount++;
        if (phoneIssues.length < 5) {
          phoneIssues.push(`${s.fullName}: "${s.phone}" -> "${normPhone}"`);
        }
      }
    }

    if (s.parentPhone) {
      const normParentPhone = normalizePhoneNumber(s.parentPhone);
      if (normParentPhone !== s.parentPhone) {
        unformattedPhonesCount++;
      }
    }

    // Check financial calculation
    const calculatedTuitionDue = s.enrollments && s.enrollments.length > 0
      ? s.enrollments.reduce((sum, e) => sum + (e.finalFee ?? e.monthlyFee ?? 0), 0)
      : s.totalTuitionDue;

    const expectedDebt = Math.max(0, calculatedTuitionDue - s.totalPaid);
    if (s.totalTuitionDue !== calculatedTuitionDue || s.remainingDebt !== expectedDebt) {
      mismatchedDebtCount++;
      if (debtIssues.length < 5) {
        debtIssues.push(`${s.fullName} (${s.code}): Khai báo ${s.totalTuitionDue.toLocaleString()}đ, tính lại ${calculatedTuitionDue.toLocaleString()}đ`);
      }
    }

    // Check duplicates
    if (s.code) {
      if (seenCodes.has(s.code.toUpperCase())) {
        duplicateStudentsCount++;
        if (duplicates.length < 5) {
          duplicates.push(`Trùng mã học sinh: ${s.code} (${s.fullName})`);
        }
      } else {
        seenCodes.add(s.code.toUpperCase());
      }
    }

    const key = `${normalizeVietnameseName(s.fullName)}_${normalizePhoneNumber(s.parentPhone || s.phone)}`;
    if (key.length > 3) {
      if (seenNameAndPhone.has(key)) {
        duplicateStudentsCount++;
        if (duplicates.length < 5) {
          duplicates.push(`Trùng tên & SĐT: ${s.fullName} - ${s.parentPhone || s.phone}`);
        }
      } else {
        seenNameAndPhone.add(key);
      }
    }
  });

  return {
    totalStudents: students.length,
    totalInvoices: invoices.length,
    totalExpenses: expenses.length,
    totalLeads: leads.length,
    totalTutors: tutors.length,
    unformattedNamesCount,
    unformattedPhonesCount,
    mismatchedDebtCount,
    duplicateStudentsCount,
    emptyRecordsCount,
    details: {
      nameIssues,
      phoneIssues,
      debtIssues,
      duplicates,
    },
  };
}

/**
 * Cleans, normalizes, and reconciles all data in the system.
 */
export function cleanAndNormalizeAllData(
  students: Student[],
  invoices: InvoiceRecord[],
  expenses: ExpenseItem[],
  leads: ParentLead[],
  tutors: TutorAssistant[],
  options = {
    cleanNames: true,
    cleanPhones: true,
    recalcTuition: true,
    deduplicate: true,
    removeEmpty: true,
  }
): {
  cleanedStudents: Student[];
  cleanedInvoices: InvoiceRecord[];
  cleanedExpenses: ExpenseItem[];
  cleanedLeads: ParentLead[];
  cleanedTutors: TutorAssistant[];
  stats: {
    fixedNames: number;
    fixedPhones: number;
    recalculatedFinances: number;
    removedDuplicates: number;
    removedEmpty: number;
  };
} {
  let fixedNames = 0;
  let fixedPhones = 0;
  let recalculatedFinances = 0;
  let removedDuplicates = 0;
  let removedEmpty = 0;

  // 1. Process Students
  let processedStudents = [...students];

  if (options.removeEmpty) {
    const beforeCount = processedStudents.length;
    processedStudents = processedStudents.filter((s) => s.fullName && s.fullName.trim().length > 0);
    removedEmpty += beforeCount - processedStudents.length;
  }

  // Deduplication map
  const uniqueStudentsMap = new Map<string, Student>();

  processedStudents.forEach((s) => {
    let updated = { ...s };

    // Clean name
    if (options.cleanNames) {
      const normName = normalizeVietnameseName(updated.fullName);
      if (normName !== updated.fullName) {
        fixedNames++;
        updated.fullName = normName;
      }
      if (updated.parentName) {
        const normParent = normalizeVietnameseName(updated.parentName);
        if (normParent !== updated.parentName) {
          fixedNames++;
          updated.parentName = normParent;
        }
      }
    }

    // Clean phones
    if (options.cleanPhones) {
      if (updated.phone) {
        const norm = normalizePhoneNumber(updated.phone);
        if (norm !== updated.phone) {
          fixedPhones++;
          updated.phone = norm;
        }
      }
      if (updated.parentPhone) {
        const norm = normalizePhoneNumber(updated.parentPhone);
        if (norm !== updated.parentPhone) {
          fixedPhones++;
          updated.parentPhone = norm;
        }
      }
      if (updated.zalo) {
        const norm = normalizePhoneNumber(updated.zalo);
        if (norm !== updated.zalo) {
          updated.zalo = norm;
        }
      }
    }

    // Recalculate tuitions
    if (options.recalcTuition) {
      const calculatedTuitionDue = updated.enrollments && updated.enrollments.length > 0
        ? updated.enrollments.reduce((sum, e) => sum + (e.finalFee ?? e.monthlyFee ?? 0), 0)
        : updated.totalTuitionDue;

      const remaining = Math.max(0, calculatedTuitionDue - (updated.totalPaid || 0));

      if (updated.totalTuitionDue !== calculatedTuitionDue || updated.remainingDebt !== remaining) {
        recalculatedFinances++;
        updated.totalTuitionDue = calculatedTuitionDue;
        updated.remainingDebt = remaining;
      }
    }

    // Deduplication check key: Code or (Name + ParentPhone)
    const dedupKey = updated.code?.toUpperCase() || `${updated.fullName}_${updated.parentPhone || updated.phone}`;

    if (options.deduplicate && uniqueStudentsMap.has(dedupKey)) {
      removedDuplicates++;
      const existing = uniqueStudentsMap.get(dedupKey)!;
      // Merge enrollments if any missing
      const existingSubjIds = new Set(existing.enrollments.map((e) => e.subjectId));
      const mergedEnrollments = [...existing.enrollments];
      
      updated.enrollments.forEach((e) => {
        if (!existingSubjIds.has(e.subjectId)) {
          mergedEnrollments.push(e);
          existingSubjIds.add(e.subjectId);
        }
      });

      const totalPaid = (existing.totalPaid || 0) + (updated.totalPaid || 0);
      const totalDue = mergedEnrollments.reduce((sum, e) => sum + (e.finalFee ?? e.monthlyFee ?? 0), 0);

      uniqueStudentsMap.set(dedupKey, {
        ...existing,
        enrollments: mergedEnrollments,
        totalTuitionDue: totalDue,
        totalPaid: totalPaid,
        remainingDebt: Math.max(0, totalDue - totalPaid),
        notes: [existing.notes, updated.notes].filter(Boolean).join(' | '),
      });
    } else {
      uniqueStudentsMap.set(dedupKey, updated);
    }
  });

  const finalStudents = Array.from(uniqueStudentsMap.values());

  // 2. Clean Leads
  const cleanedLeads = leads.map((l) => {
    let updated = { ...l };
    if (options.cleanNames) {
      if (updated.parentName) updated.parentName = normalizeVietnameseName(updated.parentName);
      if (updated.studentName) updated.studentName = normalizeVietnameseName(updated.studentName);
    }
    if (options.cleanPhones) {
      if (updated.phone) updated.phone = normalizePhoneNumber(updated.phone);
      if (updated.zalo) updated.zalo = normalizePhoneNumber(updated.zalo);
    }
    return updated;
  });

  // 3. Clean Tutors
  const cleanedTutors = tutors.map((t) => {
    let updated = { ...t };
    if (options.cleanNames) {
      if (updated.fullName) updated.fullName = normalizeVietnameseName(updated.fullName);
    }
    if (options.cleanPhones) {
      if (updated.phone) updated.phone = normalizePhoneNumber(updated.phone);
    }
    return updated;
  });

  // 4. Clean Expenses
  const cleanedExpenses = expenses.filter((e) => {
    if (options.removeEmpty && (!e.amount || e.amount <= 0)) return false;
    return true;
  });

  // 5. Clean Invoices
  const cleanedInvoices = invoices.map((inv) => {
    let updated = { ...inv };
    if (options.cleanNames && updated.studentName) {
      updated.studentName = normalizeVietnameseName(updated.studentName);
    }
    return updated;
  });

  return {
    cleanedStudents: finalStudents,
    cleanedInvoices,
    cleanedExpenses,
    cleanedLeads,
    cleanedTutors,
    stats: {
      fixedNames,
      fixedPhones,
      recalculatedFinances,
      removedDuplicates,
      removedEmpty,
    },
  };
}
