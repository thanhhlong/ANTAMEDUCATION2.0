import * as XLSX from 'xlsx';
import { Student, ExpenseItem, ParentLead, TutorAssistant, InvoiceRecord, StudentAttendance, ScheduleSession, StudentEnrollment } from '../types';

export interface ExcelImportResult {
  sheetNames: string[];
  totalRowsParsed: number;
  diagnostics: {
    sheetName: string;
    detectedType: 'students' | 'expenses' | 'tutors' | 'leads' | 'unknown';
    rowCount: number;
    detectedColumns: string[];
    messages: string[];
  }[];
  students: {
    data: Partial<Student>;
    isDuplicate: boolean;
    duplicateReason?: string;
    errors: string[];
    grade: number;
  }[];
  expenses: {
    data: Partial<ExpenseItem>;
    errors: string[];
  }[];
  tutorApplicants: {
    data: Partial<TutorAssistant>;
    errors: string[];
  }[];
  parentLeads: {
    data: Partial<ParentLead>;
    errors: string[];
  }[];
}

// ---------------- HELPER UTILITIES ----------------

/**
 * Remove Vietnamese accents and convert to lower-case alphanumeric string
 */
export function normalizeKey(str: any): string {
  if (str === null || str === undefined) return '';
  const s = String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
  return s.replace(/[^a-z0-9]/g, '');
}

/**
 * Parse monetary/numeric values with support for dots, commas, currency symbols, and negatives
 */
export function cleanNumber(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const str = String(val).trim();
  // Remove currency words and symbols
  const cleaned = str.replace(/[^\d\-,.]/g, '');
  if (!cleaned) return fallback;

  // Handle format like 1.500.000 or 1,500,000
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Determine which is decimal
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      // 1.500,50
      const norm = cleaned.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(norm);
      return isNaN(num) ? fallback : num;
    } else {
      // 1,500.50
      const norm = cleaned.replace(/,/g, '');
      const num = parseFloat(norm);
      return isNaN(num) ? fallback : num;
    }
  }

  // Only dots e.g. 1.000.000
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      const num = parseInt(cleaned.replace(/\./g, ''), 10);
      return isNaN(num) ? fallback : num;
    }
  }

  // Only commas e.g. 1,000,000
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      const num = parseInt(cleaned.replace(/,/g, ''), 10);
      return isNaN(num) ? fallback : num;
    }
    // Single comma like 1,5 -> decimal
    const num = parseFloat(cleaned.replace(',', '.'));
    return isNaN(num) ? fallback : num;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Robust date parser handling Excel serial numbers, DD/MM/YYYY, YYYY-MM-DD, and Date objects
 */
export function parseExcelDate(val: any, fallbackYear = 2012): string {
  if (!val) return `${fallbackYear}-01-01`;

  // Excel serial number (e.g. 44561)
  if (typeof val === 'number') {
    // Excel epoch begins Dec 30 1899
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  if (!str) return `${fallbackYear}-01-01`;

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (dmyMatch) {
    const day = String(dmyMatch[1]).padStart(2, '0');
    const month = String(dmyMatch[2]).padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) {
      year = parseInt(year, 10) > 30 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = String(ymdMatch[2]).padStart(2, '0');
    const day = String(ymdMatch[3]).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Match 4-digit year only
  const yearOnly = str.match(/\b(19\d\d|20\d\d)\b/);
  if (yearOnly) {
    return `${yearOnly[1]}-01-01`;
  }

  return `${fallbackYear}-01-01`;
}

/**
 * Standardize Vietnamese phone numbers
 */
export function cleanPhone(val: any): string {
  if (!val) return '';
  let str = String(val).trim().replace(/[^\d+]/g, '');
  if (str.startsWith('+84')) {
    str = '0' + str.substring(3);
  }
  return str;
}

/**
 * Extract Grade number (6, 7, 8, 9, 10, 11, 12) from text or fallback
 */
export function extractGradeNumber(val: any, fallback = 8): number {
  if (!val) return fallback;
  const str = String(val);
  const match = str.match(/\b(6|7|8|9|10|11|12)\b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const digits = str.replace(/[^\d]/g, '');
  if (digits) {
    const num = parseInt(digits, 10);
    if (num >= 6 && num <= 12) return num;
  }
  return fallback;
}

// ---------------- ROW LOOKUP UTILITIES ----------------

interface NormalizedRow {
  raw: Record<string, any>;
  norm: Record<string, any>;
  keys: string[];
}

function createNormalizedRow(rawRow: Record<string, any>): NormalizedRow {
  const norm: Record<string, any> = {};
  const keys: string[] = [];
  for (const k in rawRow) {
    if (Object.prototype.hasOwnProperty.call(rawRow, k)) {
      const cleanK = normalizeKey(k);
      norm[cleanK] = rawRow[k];
      keys.push(cleanK);
    }
  }
  return { raw: rawRow, norm, keys };
}

function getVal(row: NormalizedRow, possibleKeys: string[], fallback: any = ''): any {
  for (const k of possibleKeys) {
    const cleanK = normalizeKey(k);
    if (row.norm[cleanK] !== undefined && row.norm[cleanK] !== null && String(row.norm[cleanK]).trim() !== '') {
      return row.norm[cleanK];
    }
  }
  // Try partial match
  for (const rKey of row.keys) {
    for (const pKey of possibleKeys) {
      const cleanP = normalizeKey(pKey);
      if (cleanP.length >= 3 && (rKey.includes(cleanP) || cleanP.includes(rKey))) {
        if (row.norm[rKey] !== undefined && row.norm[rKey] !== null && String(row.norm[rKey]).trim() !== '') {
          return row.norm[rKey];
        }
      }
    }
  }
  return fallback;
}

// ---------------- SMART SHEET PARSER ----------------

export async function parseUploadedExcel(file: File, existingStudents: Student[] = []): Promise<ExcelImportResult> {
  const data = await file.arrayBuffer();
  // Read workbook with cellDates: false for predictable formatting
  const workbook = XLSX.read(data, { type: 'array', raw: false });

  const result: ExcelImportResult = {
    sheetNames: workbook.SheetNames,
    totalRowsParsed: 0,
    diagnostics: [],
    students: [],
    expenses: [],
    tutorApplicants: [],
    parentLeads: [],
  };

  const existingCodes = new Set(existingStudents.map((s) => s.code.toLowerCase().trim()));
  const existingNamePhones = new Set(
    existingStudents.map((s) => `${s.fullName.toLowerCase().trim()}_${cleanPhone(s.parentPhone)}`)
  );

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    // Convert sheet to 2D array to find actual header row
    const raw2D = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
    if (!raw2D || raw2D.length === 0) return;

    // Find the header row (0 to 15) by scoring keywords
    let headerRowIdx = 0;
    let maxHeaderScore = -1;

    const studentKeywords = ['hoten', 'hovaten', 'tenhocsinh', 'mahs', 'mahocsinh', 'sdt', 'phuhuynh', 'ngaysinh', 'gioitinh', 'truong', 'lop', 'khoi', 'hocphi'];
    const expenseKeywords = ['noidung', 'mota', 'sotien', 'chiphi', 'ngaychi', 'nguoichi', 'danhmuc', 'loaichi'];
    const tutorKeywords = ['trogiang', 'giasu', 'daihoc', 'truongdaihoc', 'chuyennganh', 'moncotheday'];
    const leadKeywords = ['bieumau2', 'nhucau', 'monquantam', 'phuhuynh', 'khoidukien', 'nguonbietden'];

    for (let r = 0; r < Math.min(raw2D.length, 15); r++) {
      const rowArr = raw2D[r];
      if (!Array.isArray(rowArr)) continue;
      let score = 0;
      rowArr.forEach((cell) => {
        const norm = normalizeKey(cell);
        if (!norm) return;
        if (studentKeywords.some((k) => norm.includes(k) || k.includes(norm))) score += 2;
        if (expenseKeywords.some((k) => norm.includes(k) || k.includes(norm))) score += 2;
        if (tutorKeywords.some((k) => norm.includes(k) || k.includes(norm))) score += 2;
        if (leadKeywords.some((k) => norm.includes(k) || k.includes(norm))) score += 2;
      });
      if (score > maxHeaderScore) {
        maxHeaderScore = score;
        headerRowIdx = r;
      }
    }

    // Convert to JSON with identified header row
    const headerRow = raw2D[headerRowIdx] || [];
    const dataRows = raw2D.slice(headerRowIdx + 1);
    const jsonRows: Record<string, any>[] = [];

    dataRows.forEach((rowArr) => {
      if (!Array.isArray(rowArr) || rowArr.every((c) => c === '' || c === null || c === undefined)) return;
      const obj: Record<string, any> = {};
      let hasData = false;
      headerRow.forEach((hName, colIdx) => {
        const key = String(hName || `Col_${colIdx + 1}`).trim();
        const val = rowArr[colIdx];
        obj[key] = val !== undefined ? val : '';
        if (val !== '' && val !== null && val !== undefined) hasData = true;
      });
      if (hasData) jsonRows.push(obj);
    });

    if (jsonRows.length === 0) return;
    result.totalRowsParsed += jsonRows.length;

    const normalizedRows = jsonRows.map(createNormalizedRow);
    const cleanSheetName = normalizeKey(sheetName);

    // Detect sheet type
    let detectedType: 'students' | 'expenses' | 'tutors' | 'leads' | 'unknown' = 'unknown';

    // 1. Check by Sheet Name first
    if (
      cleanSheetName.includes('khoi') ||
      cleanSheetName.includes('lop') ||
      cleanSheetName.includes('hocsinh') ||
      cleanSheetName.includes('student') ||
      cleanSheetName.includes('hocvien') ||
      cleanSheetName.includes('danhsach') ||
      cleanSheetName.includes('dshs') ||
      /k[6-9]|k1[0-2]/.test(cleanSheetName)
    ) {
      detectedType = 'students';
    } else if (
      cleanSheetName.includes('chiphi') ||
      cleanSheetName.includes('expense') ||
      cleanSheetName.includes('thuchi') ||
      cleanSheetName.includes('phieuchi') ||
      cleanSheetName.includes('cost')
    ) {
      detectedType = 'expenses';
    } else if (
      cleanSheetName.includes('trogiang') ||
      cleanSheetName.includes('bieumau1') ||
      cleanSheetName.includes('tutor') ||
      cleanSheetName.includes('ungvien')
    ) {
      detectedType = 'tutors';
    } else if (
      cleanSheetName.includes('bieumau2') ||
      cleanSheetName.includes('lead') ||
      cleanSheetName.includes('crm') ||
      cleanSheetName.includes('phuhuynh') ||
      cleanSheetName.includes('dangky') ||
      cleanSheetName.includes('tuvan')
    ) {
      detectedType = 'leads';
    }

    // 2. Fallback: Detect by Column Contents if still unknown
    if (detectedType === 'unknown') {
      const sampleRow = normalizedRows[0];
      const hasStudentName = getVal(sampleRow, ['Họ và tên', 'Họ tên', 'Tên học sinh', 'Học sinh', 'Full Name', 'Name']) !== '';
      const hasExpenseDesc = getVal(sampleRow, ['Nội dung', 'Mô tả', 'Nội dung chi', 'Khoản chi', 'Tên khoản chi']) !== '';
      const hasTutorUniv = getVal(sampleRow, ['Trường đại học', 'Đại học', 'Chuyên ngành', 'Môn có thể trợ giảng']) !== '';
      const hasLeadNeed = getVal(sampleRow, ['Nhu cầu học tập', 'Nhu cầu', 'Môn quan tâm', 'Khung thời gian mong muốn']) !== '';

      if (hasStudentName && !hasExpenseDesc) {
        detectedType = 'students';
      } else if (hasExpenseDesc) {
        detectedType = 'expenses';
      } else if (hasTutorUniv) {
        detectedType = 'tutors';
      } else if (hasLeadNeed) {
        detectedType = 'leads';
      } else if (hasStudentName) {
        detectedType = 'students';
      }
    }

    const detectedColumns = headerRow.map((h) => String(h).trim()).filter(Boolean);

    // Process rows according to detected type
    if (detectedType === 'students') {
      const defaultGrade = extractGradeNumber(sheetName, 8);

      normalizedRows.forEach((row, idx) => {
        const fullName = String(
          getVal(row, [
            'Họ và tên',
            'Họ & tên',
            'Họ tên',
            'Họ tên học sinh',
            'Tên học sinh',
            'Họ và tên học sinh',
            'Tên',
            'Học sinh',
            'Học viên',
            'Full Name',
            'Fullname',
            'Name',
            'Student Name',
            'Họ và tên đệm',
          ])
        ).trim();

        if (!fullName || fullName.length < 2) return;

        const rawGrade = getVal(row, ['Khối', 'Khối lớp', 'Grade'], defaultGrade);
        const grade = extractGradeNumber(rawGrade, defaultGrade);

        const codeRaw = getVal(row, ['Mã học sinh', 'Mã HS', 'Mã', 'Mã số', 'Code', 'Student Code', 'ID']);
        const code = codeRaw ? String(codeRaw).trim() : `AT-K${grade}-${String(idx + 1).padStart(3, '0')}`;

        const phone = cleanPhone(getVal(row, ['Số điện thoại', 'SĐT', 'Điện thoại', 'Phone', 'Mobile', 'SĐT Học sinh', 'Tel']));
        const parentName = String(
          getVal(row, ['Người liên hệ phụ huynh', 'Họ tên phụ huynh', 'Phụ huynh', 'Tên phụ huynh', 'Họ và tên phụ huynh', 'Bố/Mẹ', 'Parent Name', 'Parent'], 'Phụ huynh')
        ).trim();
        const parentPhone = cleanPhone(
          getVal(row, ['Số điện thoại phụ huynh', 'SĐT phụ huynh', 'SĐT PH', 'Điện thoại phụ huynh', 'SĐT Bố/Mẹ', 'Parent Phone'], phone)
        );

        const school = String(getVal(row, ['Trường đang học', 'Trường', 'Trường học', 'School', 'Current School'], 'THCS')).trim();
        const rawClass = getVal(row, ['Lớp', 'Lớp học', 'Class', 'ClassName'], `${grade}A1`);
        const className = String(rawClass).trim() || `${grade}A1`;
        const address = String(getVal(row, ['Địa chỉ', 'Nơi ở', 'Address', 'Hộ khẩu'], 'Hà Nội')).trim();
        const notes = String(getVal(row, ['Ghi chú', 'Note', 'Notes', 'Nhận xét'], '')).trim();
        const rawDob = getVal(row, ['Ngày sinh', 'DOB', 'Date of Birth', 'Sinh ngày', 'Năm sinh']);
        const dob = parseExcelDate(rawDob, 2020 - grade);
        const rawGender = String(getVal(row, ['Giới tính', 'Gender', 'Sex'], 'Nam')).trim().toLowerCase();
        const gender: 'Nam' | 'Nữ' | 'Khác' = rawGender.includes('nữ') || rawGender.includes('nu') || rawGender.includes('female') ? 'Nữ' : 'Nam';

        // Extract individual subject enrollments if present in columns
        const enrollments: StudentEnrollment[] = [];
        const mathFee = cleanNumber(getVal(row, ['Toán', 'Toán học', 'Math'], 0));
        const litFee = cleanNumber(getVal(row, ['Ngữ văn', 'Văn', 'Literature'], 0));
        const engFee = cleanNumber(getVal(row, ['Tiếng Anh', 'Anh', 'English'], 0));
        const sciFee = cleanNumber(getVal(row, ['KHTN', 'Khoa học tự nhiên', 'Vật lý', 'Hóa học', 'Science'], 0));

        if (mathFee > 0) {
          enrollments.push({
            id: `en-imp-${idx}-toan`,
            subjectId: 'sub-toan',
            subjectName: 'Toán học',
            monthlyFee: mathFee,
            discount: 0,
            finalFee: mathFee,
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
          });
        }
        if (litFee > 0) {
          enrollments.push({
            id: `en-imp-${idx}-van`,
            subjectId: 'sub-van',
            subjectName: 'Ngữ văn',
            monthlyFee: litFee,
            discount: 0,
            finalFee: litFee,
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
          });
        }
        if (engFee > 0) {
          enrollments.push({
            id: `en-imp-${idx}-anh`,
            subjectId: 'sub-anh',
            subjectName: 'Tiếng Anh',
            monthlyFee: engFee,
            discount: 0,
            finalFee: engFee,
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
          });
        }
        if (sciFee > 0) {
          enrollments.push({
            id: `en-imp-${idx}-khtn`,
            subjectId: 'sub-khtn',
            subjectName: 'Khoa học tự nhiên',
            monthlyFee: sciFee,
            discount: 0,
            finalFee: sciFee,
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
          });
        }

        // Fallback default enrollment if none detected
        if (enrollments.length === 0) {
          enrollments.push({
            id: `en-imp-${idx}-default`,
            subjectId: 'sub-toan',
            subjectName: 'Toán học',
            monthlyFee: 1000000,
            discount: 0,
            finalFee: 1000000,
            startDate: new Date().toISOString().split('T')[0],
            status: 'active',
          });
        }

        // Parse total fees and payments
        const calculatedTuition = enrollments.reduce((sum, e) => sum + e.finalFee, 0);
        const parsedTotalTuition = cleanNumber(getVal(row, ['Tổng học phí', 'Học phí', 'Học phí hàng tháng', 'Phải thu', 'Tuition'], calculatedTuition));
        const parsedPaid = cleanNumber(getVal(row, ['Đã nộp', 'Đã đóng', 'Đã thu', 'Paid'], parsedTotalTuition));
        const parsedDebt = cleanNumber(getVal(row, ['Còn nợ', 'Nợ', 'Remaining', 'Debt'], Math.max(0, parsedTotalTuition - parsedPaid)));

        // Check duplicates
        let isDuplicate = false;
        let duplicateReason = '';

        if (existingCodes.has(code.toLowerCase())) {
          isDuplicate = true;
          duplicateReason = `Mã học sinh ${code} đã tồn tại trên hệ thống.`;
        } else if (parentPhone && existingNamePhones.has(`${fullName.toLowerCase()}_${parentPhone}`)) {
          isDuplicate = true;
          duplicateReason = `Họ tên "${fullName}" và SĐT phụ huynh "${parentPhone}" đã trùng khớp.`;
        }

        const errors: string[] = [];
        if (!fullName) errors.push('Thiếu họ và tên học sinh');

        result.students.push({
          data: {
            code,
            fullName,
            dob,
            gender,
            phone,
            zalo: phone,
            email: '',
            address,
            currentSchool: school,
            grade,
            className,
            status: 'active',
            parentName,
            parentPhone,
            parentRelationship: 'Bố',
            notes,
            enrollments,
            totalTuitionDue: parsedTotalTuition,
            totalPaid: parsedPaid,
            remainingDebt: parsedDebt,
            joinedDate: new Date().toISOString().split('T')[0],
          },
          isDuplicate,
          duplicateReason,
          errors,
          grade,
        });
      });
    } else if (detectedType === 'expenses') {
      normalizedRows.forEach((row, idx) => {
        const description = String(
          getVal(row, ['Nội dung', 'Mô tả', 'Nội dung chi', 'Khoản chi', 'Tên khoản chi', 'Lý do chi', 'Diễn giải', 'Description'])
        ).trim();

        if (!description) return;

        const amount = cleanNumber(getVal(row, ['Số tiền', 'Chi phí', 'Số tiền chi', 'Tiền', 'Amount', 'Tổng tiền', 'Cost'], 0));
        const categoryName = String(getVal(row, ['Loại chi', 'Danh mục', 'Loại khoản chi', 'Category', 'Nhóm chi'], 'Khác')).trim();
        const rawDate = getVal(row, ['Ngày', 'Ngày chi', 'Ngày tháng', 'Date']);
        const date = parseExcelDate(rawDate, new Date().getFullYear());
        const payer = String(getVal(row, ['Người thanh toán', 'Người chi', 'Người lập phiếu', 'Payer', 'Người thực hiện'], 'Kế toán')).trim();
        const notes = String(getVal(row, ['Ghi chú', 'Note', 'Notes'], '')).trim();

        result.expenses.push({
          data: {
            expenseCode: `EXP-IMP-${String(idx + 1).padStart(3, '0')}`,
            date,
            category: 'other',
            categoryName,
            description,
            amount,
            payer,
            status: 'paid',
            notes,
          },
          errors: amount <= 0 ? ['Số tiền chi phải lớn hơn 0'] : [],
        });
      });
    } else if (detectedType === 'tutors') {
      normalizedRows.forEach((row, idx) => {
        const fullName = String(getVal(row, ['Họ và tên', 'Họ tên', 'Tên', 'Tên gia sư', 'Tên trợ giảng', 'Full Name', 'Name'])).trim();
        if (!fullName) return;

        const phone = cleanPhone(getVal(row, ['Số điện thoại', 'SĐT', 'Điện thoại', 'Phone', 'Mobile']));
        const email = String(getVal(row, ['Email', 'Mail'], '')).trim();
        const university = String(getVal(row, ['Trường đại học', 'Trường', 'Đại học', 'University'], 'Đại học Sư Phạm Hà Nội')).trim();
        const major = String(getVal(row, ['Chuyên ngành', 'Ngành học', 'Major'], 'Sư phạm Toán học')).trim();
        const rawSubjects = String(getVal(row, ['Môn có thể trợ giảng', 'Môn', 'Môn học', 'Môn có thể dạy'], 'Toán học'));
        const subjects = rawSubjects.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
        const bio = String(getVal(row, ['Giới thiệu bản thân', 'Kinh nghiệm', 'Kinh nghiệm giảng dạy', 'Bio'], 'Gia sư tận tâm')).trim();
        const expectations = String(getVal(row, ['Mong muốn', 'Nguyện vọng', 'Ghi chú'], 'Làm việc linh hoạt')).trim();

        result.tutorApplicants.push({
          data: {
            code: `TA-IMP-${String(idx + 1).padStart(2, '0')}`,
            fullName,
            phone,
            email,
            university,
            major,
            subjectsCanTeach: subjects.length > 0 ? subjects : ['Toán học'],
            gradesCanTeach: [6, 7, 8, 9],
            experienceYears: 1,
            bio,
            expectations,
            status: 'new_applicant',
            hourlyRate: 150000,
            rating: 5.0,
            availability: {
              2: { shift1: false, shift2: true, shift3: true, shift4: false },
              3: { shift1: false, shift2: true, shift3: true, shift4: false },
              4: { shift1: false, shift2: true, shift3: true, shift4: false },
              5: { shift1: false, shift2: true, shift3: true, shift4: false },
              6: { shift1: false, shift2: true, shift3: true, shift4: false },
              7: { shift1: true, shift2: true, shift3: true, shift4: true },
              8: { shift1: true, shift2: true, shift3: true, shift4: true },
            },
          },
          errors: !phone ? ['Thiếu số điện thoại liên hệ'] : [],
        });
      });
    } else if (detectedType === 'leads') {
      normalizedRows.forEach((row, idx) => {
        const studentName = String(getVal(row, ['Họ tên học sinh', 'Tên học sinh', 'Họ và tên', 'Học sinh', 'Student Name'])).trim();
        const parentName = String(getVal(row, ['Họ tên phụ huynh', 'Phụ huynh', 'Tên phụ huynh', 'Parent Name'], 'Phụ huynh')).trim();
        const phone = cleanPhone(getVal(row, ['Số điện thoại', 'SĐT/Zalo', 'Số điện thoại/Zalo', 'SĐT', 'Phone', 'Mobile']));
        if (!studentName && !phone) return;

        const school = String(getVal(row, ['Trường', 'Trường đang học', 'School'], '')).trim();
        const rawGrade = getVal(row, ['Khối dự kiến', 'Khối', 'Lớp', 'Grade'], 8);
        const targetGrade = extractGradeNumber(rawGrade, 8);
        const rawSubjects = String(getVal(row, ['Môn quan tâm', 'Môn', 'Môn học'], 'Toán học'));
        const subjects = rawSubjects.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
        const customNeed = String(getVal(row, ['Nhu cầu học tập theo yêu cầu', 'Nhu cầu học tập', 'Nhu cầu', 'Yêu cầu', 'Ghi chú'], '')).trim();
        const rawSchedule = String(getVal(row, ['Khung thời gian mong muốn', 'Thời gian', 'Lịch học'], 'Tối Thứ 3, Thứ 5'));
        const preferredSchedule = rawSchedule.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
        const referralSource = String(getVal(row, ['Nguồn biết đến', 'Nguồn', 'Source'], 'Google Form / Excel Import')).trim();

        result.parentLeads.push({
          data: {
            code: `LEAD-IMP-${String(idx + 1).padStart(3, '0')}`,
            parentName,
            studentName: studentName || 'Học sinh mới',
            phone,
            zalo: phone,
            currentSchool: school,
            targetGrade,
            interestedSubjects: subjects.length > 0 ? subjects : ['Toán học'],
            interestedServices: ['Lớp học tiêu chuẩn', customNeed ? 'Học tập theo yêu cầu' : ''],
            customTutoring: customNeed
              ? {
                  subject: subjects[0] || 'Toán học',
                  topic: customNeed,
                  targetGoal: 'Tiến bộ nhanh & Ôn thi',
                  timeSlots: preferredSchedule,
                  sessionsPerWeek: 2,
                  format: '1-on-1',
                  notes: customNeed,
                }
              : undefined,
            preferredSchedule,
            referralSource,
            status: 'new',
            assignedConsultant: 'Tư vấn viên Thanh Hương',
            timeline: [
              { date: new Date().toISOString().replace('T', ' ').slice(0, 16), action: 'Nhập dữ liệu từ Excel', by: 'Excel Import' },
            ],
            createdAt: new Date().toISOString().split('T')[0],
          },
          errors: !phone ? ['Thiếu số điện thoại liên hệ'] : [],
        });
      });
    }

    result.diagnostics.push({
      sheetName,
      detectedType,
      rowCount: jsonRows.length,
      detectedColumns,
      messages: [
        detectedType === 'unknown'
          ? 'Không nhận diện được phân hệ tự động. Hãy đảm bảo các cột chứa "Họ và tên", "Số điện thoại", "Số tiền" hoặc "Nội dung".'
          : `Nhận diện thành công phân hệ: ${
              detectedType === 'students'
                ? 'Học sinh'
                : detectedType === 'expenses'
                ? 'Chi phí vận hành'
                : detectedType === 'tutors'
                ? 'Trợ giảng ứng tuyển'
                : 'Lead CRM tuyển sinh'
            }`,
      ],
    });
  });

  return result;
}

// ---------------- EXPORT FUNCTIONS ----------------

export function exportStudentsToExcel(students: Student[], fileName = 'ANTAM_Danh_Sach_Hoc_Sinh.xlsx') {
  const data = students.map((s, index) => ({
    'STT': index + 1,
    'Mã học sinh': s.code,
    'Họ và tên': s.fullName,
    'Khối': `Khối ${s.grade}`,
    'Lớp': s.className,
    'Trường đang học': s.currentSchool,
    'Giới tính': s.gender,
    'Ngày sinh': s.dob,
    'SĐT Học sinh': s.phone,
    'Phụ huynh': s.parentName,
    'Quan hệ': s.parentRelationship,
    'SĐT Phụ huynh': s.parentPhone,
    'Địa chỉ': s.address,
    'Môn đăng ký': s.enrollments.map((e) => e.subjectName).join(', '),
    'Học phí hàng tháng (VNĐ)': s.totalTuitionDue,
    'Tỉ lệ giảm (%)': s.tuitionDiscountPercent || (s.tuitionWaived ? 100 : 0),
    'Đã nộp (VNĐ)': s.totalPaid,
    'Công nợ còn lại (VNĐ)': s.remainingDebt,
    'Trạng thái': s.status === 'active' ? 'Đang học' : 'Nghỉ học',
    'Ngày nghỉ học': s.leaveDate || '',
    'Ghi chú': s.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DANH SÁCH HỌC SINH');
  XLSX.writeFile(workbook, fileName);
}

export function exportFinanceToExcel(invoices: InvoiceRecord[], expenses: ExpenseItem[], fileName = 'ANTAM_Bao_Cao_Tai_Chinh.xlsx') {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Thu học phí & Công nợ
  const invoiceData = invoices.map((inv, idx) => ({
    'STT': idx + 1,
    'Mã hóa đơn': inv.invoiceCode,
    'Mã HS': inv.studentCode,
    'Họ tên học sinh': inv.studentName,
    'Khối': `Khối ${inv.grade}`,
    'Tháng/Năm': `Tháng ${inv.month}/${inv.year}`,
    'Tổng học phí (VNĐ)': inv.totalAmount,
    'Đã thu (VNĐ)': inv.paidAmount,
    'Còn nợ (VNĐ)': inv.remainingAmount,
    'Hạn đóng': inv.dueDate,
    'Trạng thái': inv.status === 'paid' ? 'Đã thu đủ' : inv.status === 'partial' ? 'Đóng thiếu' : inv.status === 'overdue' ? 'Quá hạn' : 'Chưa thu',
    'Chi tiết môn': inv.lineItems.map((li) => `${li.subjectName} (${li.amount.toLocaleString()}đ)`).join('; '),
  }));
  const invoiceSheet = XLSX.utils.json_to_sheet(invoiceData);
  XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'DOANH THU & CÔNG NỢ');

  // Sheet 2: Chi phí trung tâm
  const expenseData = expenses.map((exp, idx) => ({
    'STT': idx + 1,
    'Mã phiếu chi': exp.expenseCode,
    'Ngày chi': exp.date,
    'Danh mục': exp.categoryName,
    'Nội dung chi': exp.description,
    'Số tiền (VNĐ)': exp.amount,
    'Người thanh toán': exp.payer,
    'Trạng thái': exp.status === 'approved' ? 'Đã duyệt' : exp.status === 'paid' ? 'Đã thanh toán' : 'Chờ duyệt',
    'Ghi chú': exp.notes || '',
  }));
  const expenseSheet = XLSX.utils.json_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(workbook, expenseSheet, 'CHI PHÍ VẬN HÀNH');

  XLSX.writeFile(workbook, fileName);
}

export function exportLeadsToExcel(leads: ParentLead[], fileName = 'ANTAM_CRM_Leads_Phu_Huynh.xlsx') {
  const data = leads.map((l, idx) => ({
    'STT': idx + 1,
    'Mã Lead': l.code,
    'Phụ huynh': l.parentName,
    'Học sinh': l.studentName,
    'SĐT/Zalo': l.phone,
    'Trường': l.currentSchool || '',
    'Khối quan tâm': `Khối ${l.targetGrade}`,
    'Môn quan tâm': l.interestedSubjects.join(', '),
    'Học tập theo yêu cầu': l.customTutoring ? `${l.customTutoring.topic} (${l.customTutoring.format})` : 'Không',
    'Khung giờ mong muốn': l.preferredSchedule.join(', '),
    'Nguồn': l.referralSource,
    'Trạng thái': l.status === 'new' ? 'Lead Mới' : l.status === 'consulting' ? 'Đang tư vấn' : l.status === 'trial_scheduled' ? 'Lịch học thử' : l.status === 'enrolled' ? 'Đã đăng ký' : 'Khác',
    'Nhân viên tư vấn': l.assignedConsultant,
    'Ghi chú': l.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'LEAD CRM PHỤ HUYNH');
  XLSX.writeFile(workbook, fileName);
}

export function exportAttendanceToExcel(attendance: StudentAttendance[], sessions: ScheduleSession[], fileName = 'ANTAM_Diem_Danh.xlsx') {
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const data = attendance.map((att, idx) => {
    const s = sessionMap.get(att.sessionId);
    return {
      'STT': idx + 1,
      'Lớp': s ? s.className : '-',
      'Môn': s ? s.subjectName : '-',
      'Ngày': s ? s.date : '-',
      'Ca': s ? `Ca ${s.shift} (${s.startTime} - ${s.endTime})` : '-',
      'Mã HS': att.studentCode,
      'Họ tên học sinh': att.studentName,
      'Trạng thái': att.status === 'present' ? 'Có mặt' : att.status === 'late' ? 'Đi muộn' : att.status === 'absent_excused' ? 'Vắng có phép' : 'Vắng không phép',
      'Giờ vào lớp': att.checkinTime || '-',
      'Nhận diện khuôn mặt': att.faceVerified ? 'Đã xác thực AI Face' : 'Chưa',
      'Ghi chú': att.notes || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SỔ ĐIỂM DANH');
  XLSX.writeFile(workbook, fileName);
}

export function generateSampleExcelWorkbook(): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: DASHBOARD summary
  const dashboardData = [
    { 'Chỉ tiêu': 'Tổng số học sinh', 'Giá trị': 58, 'Đơn vị': 'Học sinh' },
    { 'Chỉ tiêu': 'Giáo viên & Trợ giảng', 'Giá trị': 12, 'Đơn vị': 'Thành viên' },
    { 'Chỉ tiêu': 'Lead phụ huynh mới', 'Giá trị': 24, 'Đơn vị': 'Lead' },
    { 'Chỉ tiêu': 'Tổng doanh thu dự kiến', 'Giá trị': 65000000, 'Đơn vị': 'VNĐ' },
    { 'Chỉ tiêu': 'Tổng đã thu', 'Giá trị': 52000000, 'Đơn vị': 'VNĐ' },
    { 'Chỉ tiêu': 'Tổng công nợ còn lại', 'Giá trị': 13000000, 'Đơn vị': 'VNĐ' },
    { 'Chỉ tiêu': 'Tổng chi phí vận hành', 'Giá trị': 18000000, 'Đơn vị': 'VNĐ' },
    { 'Chỉ tiêu': 'Dòng tiền lợi nhuận ròng', 'Giá trị': 34000000, 'Đơn vị': 'VNĐ' },
  ];
  const wsDashboard = XLSX.utils.json_to_sheet(dashboardData);
  XLSX.utils.book_append_sheet(workbook, wsDashboard, 'DASHBOARD');

  // Sheet 2: KHỐI 8
  const k8Data = [
    {
      'Mã học sinh': 'AT-K8-001',
      'Họ và tên': 'Nguyễn Minh Quân',
      'Ngày sinh': '2012-04-15',
      'Giới tính': 'Nam',
      'Số điện thoại': '0912345601',
      'Người liên hệ phụ huynh': 'Nguyễn Văn Hùng',
      'Số điện thoại phụ huynh': '0988112201',
      'Trường đang học': 'THCS Cầu Giấy',
      'Lớp': '8A1',
      'Toán': '1.000.000',
      'Ngữ văn': '400.000',
      'Tiếng Anh': '400.000',
      'KHTN': '400.000',
      'Tổng học phí': '2.200.000',
      'Đã nộp': '2.200.000',
      'Còn nợ': '0',
      'Ghi chú': 'Học sinh giỏi',
    },
    {
      'Mã học sinh': 'AT-K8-002',
      'Họ và tên': 'Trần Bảo Châu',
      'Ngày sinh': '2012-08-22',
      'Giới tính': 'Nữ',
      'Số điện thoại': '0912345602',
      'Người liên hệ phụ huynh': 'Lê Thị Thu Hà',
      'Số điện thoại phụ huynh': '0988112202',
      'Trường đang học': 'THCS Trưng Vương',
      'Lớp': '8A1',
      'Toán': '1.000.000',
      'Tiếng Anh': '400.000',
      'Tổng học phí': '1.400.000',
      'Đã nộp': '1.400.000',
      'Còn nợ': '0',
    },
    {
      'Mã học sinh': 'AT-K8-003',
      'Họ và tên': 'Hoàng Đức Duy',
      'Ngày sinh': '2012-11-05',
      'Giới tính': 'Nam',
      'Số điện thoại': '0912345603',
      'Người liên hệ phụ huynh': 'Hoàng Minh Tuấn',
      'Số điện thoại phụ huynh': '0988112203',
      'Trường đang học': 'THCS Giảng Võ',
      'Lớp': '8A2',
      'Toán': '1.000.000',
      'KHTN': '400.000',
      'Tổng học phí': '1.400.000',
      'Đã nộp': '500.000',
      'Còn nợ': '900.000',
    },
  ];
  const wsK8 = XLSX.utils.json_to_sheet(k8Data);
  XLSX.utils.book_append_sheet(workbook, wsK8, 'KHỐI 8');

  // Sheet 3: KHỐI 9
  const k9Data = [
    {
      'Mã học sinh': 'AT-K9-001',
      'Họ và tên': 'Vũ Hải Đăng',
      'Ngày sinh': '2011-03-12',
      'Giới tính': 'Nam',
      'Số điện thoại': '0912345606',
      'Người liên hệ phụ huynh': 'Vũ Đình Trọng',
      'Số điện thoại phụ huynh': '0988112206',
      'Trường đang học': 'THCS Cầu Giấy',
      'Lớp': '9A1',
      'Toán': '1.000.000',
      'Ngữ văn': '400.000',
      'Tiếng Anh': '400.000',
      'Tổng học phí': '1.800.000',
      'Đã nộp': '1.800.000',
      'Còn nợ': '0',
    },
  ];
  const wsK9 = XLSX.utils.json_to_sheet(k9Data);
  XLSX.utils.book_append_sheet(workbook, wsK9, 'KHỐI 9');

  // Sheet 4: CHI PHÍ
  const chiPhiData = [
    { 'Ngày': '2026-08-01', 'Loại chi': 'Thuê nhà', 'Nội dung': 'Tiền thuê mặt bằng Cầu Giấy T8', 'Số tiền': 15000000, 'Người thanh toán': 'Giám đốc', 'Ghi chú': 'BIDV' },
    { 'Ngày': '2026-08-03', 'Loại chi': 'Máy lạnh', 'Nội dung': 'Bảo dưỡng 4 điều hòa Daikin', 'Số tiền': 1800000, 'Người thanh toán': 'Quản lý', 'Ghi chú': '' },
    { 'Ngày': '2026-08-04', 'Loại chi': 'Bàn ghế', 'Nội dung': '10 bộ bàn ghế học sinh chống gù', 'Số tiền': 3200000, 'Người thanh toán': 'Kế toán', 'Ghi chú': 'Xuân Hòa' },
    { 'Ngày': '2026-08-07', 'Loại chi': 'Vệ sinh', 'Nội dung': 'Vệ sinh công nghiệp định kỳ', 'Số tiền': 1200000, 'Người thanh toán': 'Quản lý', 'Ghi chú': '' },
    { 'Ngày': '2026-08-08', 'Loại chi': 'Khóa', 'Nội dung': 'Lắp khóa thông minh vân tay', 'Số tiền': 850000, 'Người thanh toán': 'Kế toán', 'Ghi chú': '' },
    { 'Ngày': '2026-08-10', 'Loại chi': 'Văn phòng phẩm', 'Nội dung': 'Giấy A4, bút dạ, mực in', 'Số tiền': 980000, 'Người thanh toán': 'Lễ tân', 'Ghi chú': '' },
  ];
  const wsChiPhi = XLSX.utils.json_to_sheet(chiPhiData);
  XLSX.utils.book_append_sheet(workbook, wsChiPhi, 'CHI PHÍ');

  // Sheet 5: Câu trả lời biểu mẫu 1 (Trợ giảng)
  const bieuMau1Data = [
    {
      'Họ và tên': 'Nguyễn Thùy Linh',
      'Số điện thoại': '0966778899',
      'Email': 'linh.sp@gmail.com',
      'Trường đại học': 'ĐH Sư Phạm Hà Nội',
      'Chuyên ngành': 'Sư phạm Toán học CLC',
      'Môn có thể trợ giảng': 'Toán học, Khoa học tự nhiên',
      'Kinh nghiệm': '2 năm trợ giảng',
      'Mong muốn': 'Làm việc lâu dài tại trung tâm',
    },
  ];
  const wsBieuMau1 = XLSX.utils.json_to_sheet(bieuMau1Data);
  XLSX.utils.book_append_sheet(workbook, wsBieuMau1, 'Câu trả lời biểu mẫu 1');

  // Sheet 6: Câu trả lời biểu mẫu 2 (Phụ huynh CRM & Học tập theo yêu cầu)
  const bieuMau2Data = [
    {
      'Họ tên phụ huynh': 'Nguyễn Thị Bích Thủy',
      'Họ tên học sinh': 'Nguyễn Đức Anh',
      'Số điện thoại/Zalo': '0977223344',
      'Trường đang học': 'THCS Giảng Võ',
      'Khối dự kiến': 'Khối 8',
      'Môn quan tâm': 'Toán học, Khoa học tự nhiên',
      'Nhu cầu học tập theo yêu cầu': 'Lấy lại căn bản Đại số & Hình học đầu năm',
      'Khung thời gian mong muốn': 'Tối Thứ 3, Chiều Thứ 7',
      'Nguồn biết đến': 'Facebook',
    },
  ];
  const wsBieuMau2 = XLSX.utils.json_to_sheet(bieuMau2Data);
  XLSX.utils.book_append_sheet(workbook, wsBieuMau2, 'Câu trả lời biểu mẫu 2');

  XLSX.writeFile(workbook, 'AN_TAM_EDUCATION_Mau_Thuc_Te.xlsx');
}

export function generateSampleStudentsTemplate(): void {
  const workbook = XLSX.utils.book_new();
  const k8Data = [
    {
      'Mã học sinh': 'AT-K8-001',
      'Họ và tên': 'Nguyễn Minh Quân',
      'Ngày sinh': '2012-04-15',
      'Giới tính': 'Nam',
      'Số điện thoại': '0912345601',
      'Người liên hệ phụ huynh': 'Nguyễn Văn Hùng',
      'Số điện thoại phụ huynh': '0988112201',
      'Trường đang học': 'THCS Cầu Giấy',
      'Lớp': '8A1',
      'Toán': '1.000.000',
      'Ngữ văn': '400.000',
      'Tiếng Anh': '400.000',
      'KHTN': '400.000',
      'Tổng học phí': '2.200.000',
      'Đã nộp': '2.200.000',
      'Còn nợ': '0',
      'Ghi chú': 'Học sinh giỏi',
    },
    {
      'Mã học sinh': 'AT-K8-002',
      'Họ và tên': 'Trần Bảo Châu',
      'Ngày sinh': '2012-08-22',
      'Giới tính': 'Nữ',
      'Số điện thoại': '0912345602',
      'Người liên hệ phụ huynh': 'Lê Thị Thu Hà',
      'Số điện thoại phụ huynh': '0988112202',
      'Trường đang học': 'THCS Trưng Vương',
      'Lớp': '8A1',
      'Toán': '1.000.000',
      'Tiếng Anh': '400.000',
      'Tổng học phí': '1.400.000',
      'Đã nộp': '1.400.000',
      'Còn nợ': '0',
    },
  ];
  const wsK8 = XLSX.utils.json_to_sheet(k8Data);
  XLSX.utils.book_append_sheet(workbook, wsK8, 'DANH SÁCH HỌC SINH');
  XLSX.writeFile(workbook, 'AN_TAM_Mau_Hoc_Sinh_Chuan.xlsx');
}

export function generateSampleExpensesTemplate(): void {
  const workbook = XLSX.utils.book_new();
  const chiPhiData = [
    { 'Ngày': '2026-08-01', 'Loại chi': 'Thuê nhà', 'Nội dung': 'Tiền thuê mặt bằng Cầu Giấy T8', 'Số tiền': 15000000, 'Người thanh toán': 'Giám đốc', 'Ghi chú': 'BIDV' },
    { 'Ngày': '2026-08-03', 'Loại chi': 'Máy lạnh', 'Nội dung': 'Bảo dưỡng 4 điều hòa Daikin', 'Số tiền': 1800000, 'Người thanh toán': 'Quản lý', 'Ghi chú': '' },
    { 'Ngày': '2026-08-10', 'Loại chi': 'Văn phòng phẩm', 'Nội dung': 'Giấy A4, bút dạ, mực in', 'Số tiền': 980000, 'Người thanh toán': 'Lễ tân', 'Ghi chú': '' },
  ];
  const wsChiPhi = XLSX.utils.json_to_sheet(chiPhiData);
  XLSX.utils.book_append_sheet(workbook, wsChiPhi, 'CHI PHÍ');
  XLSX.writeFile(workbook, 'AN_TAM_Mau_Chi_Phi_Van_Hanh.xlsx');
}

export function generateSampleTutorsTemplate(): void {
  const workbook = XLSX.utils.book_new();
  const bieuMau1Data = [
    {
      'Họ và tên': 'Nguyễn Thùy Linh',
      'Số điện thoại': '0966778899',
      'Email': 'linh.sp@gmail.com',
      'Trường đại học': 'ĐH Sư Phạm Hà Nội',
      'Chuyên ngành': 'Sư phạm Toán học CLC',
      'Môn có thể trợ giảng': 'Toán học, Khoa học tự nhiên',
      'Kinh nghiệm': '2 năm trợ giảng',
      'Mong muốn': 'Làm việc lâu dài tại trung tâm',
    },
    {
      'Họ và tên': 'Phạm Hoàng Nam',
      'Số điện thoại': '0912345678',
      'Email': 'nam.ph@gmail.com',
      'Trường đại học': 'ĐH Bách Khoa Hà Nội',
      'Chuyên ngành': 'Kỹ thuật Điện',
      'Môn có thể trợ giảng': 'Vật lý, Toán học',
      'Kinh nghiệm': 'Gia sư lớp 9 thi vào 10',
      'Mong muốn': 'Lịch dạy buổi tối linh hoạt',
    },
  ];
  const wsBieuMau1 = XLSX.utils.json_to_sheet(bieuMau1Data);
  XLSX.utils.book_append_sheet(workbook, wsBieuMau1, 'Câu trả lời biểu mẫu 1');
  XLSX.writeFile(workbook, 'AN_TAM_Mau_Tro_Giang_Ung_Tuyen.xlsx');
}

export function generateSampleLeadsTemplate(): void {
  const workbook = XLSX.utils.book_new();
  const bieuMau2Data = [
    {
      'Họ tên phụ huynh': 'Nguyễn Thị Bích Thủy',
      'Họ tên học sinh': 'Nguyễn Đức Anh',
      'Số điện thoại/Zalo': '0977223344',
      'Trường đang học': 'THCS Giảng Võ',
      'Khối dự kiến': 'Khối 8',
      'Môn quan tâm': 'Toán học, Khoa học tự nhiên',
      'Nhu cầu học tập theo yêu cầu': 'Lấy lại căn bản Đại số & Hình học đầu năm',
      'Khung thời gian mong muốn': 'Tối Thứ 3, Chiều Thứ 7',
      'Nguồn biết đến': 'Facebook',
    },
    {
      'Họ tên phụ huynh': 'Lê Minh Tuấn',
      'Họ tên học sinh': 'Lê Minh Hằng',
      'Số điện thoại/Zalo': '0912998877',
      'Trường đang học': 'THCS Cầu Giấy',
      'Khối dự kiến': 'Khối 9',
      'Môn quan tâm': 'Tiếng Anh, Ngữ Văn',
      'Nhu cầu học tập theo yêu cầu': 'Ôn thi chuyên Anh vào 10',
      'Khung thời gian mong muốn': 'Chiều Chủ Nhật',
      'Nguồn biết đến': 'Người quen giới thiệu',
    },
  ];
  const wsBieuMau2 = XLSX.utils.json_to_sheet(bieuMau2Data);
  XLSX.utils.book_append_sheet(workbook, wsBieuMau2, 'Câu trả lời biểu mẫu 2');
  XLSX.writeFile(workbook, 'AN_TAM_Mau_Tuyen_Sinh_CRM_Leads.xlsx');
}

// Aliases for seamless imports across components
export const parseCenterExcelFile = async (
  file: File,
  _existingCodes?: string[],
  _existingPhoneParents?: string[]
): Promise<ExcelImportResult> => {
  return parseUploadedExcel(file, []);
};

export interface TuitionExportOptions {
  filterType: 'all' | 'paid' | 'debt' | 'partial';
  grade: number | 'all';
  month: number;
  year: number;
}

export function exportTuitionStudentsExcel(
  students: Student[],
  invoices: InvoiceRecord[],
  options: TuitionExportOptions
): string {
  let filtered = students;
  if (options.grade !== 'all') {
    filtered = filtered.filter((s) => s.grade === options.grade);
  }

  if (options.filterType === 'paid') {
    filtered = filtered.filter((s) => s.remainingDebt === 0 && s.totalTuitionDue > 0);
  } else if (options.filterType === 'debt') {
    filtered = filtered.filter((s) => s.remainingDebt > 0);
  } else if (options.filterType === 'partial') {
    filtered = filtered.filter((s) => s.totalPaid > 0 && s.remainingDebt > 0);
  }

  const exportData = filtered.map((s, idx) => {
    const matchingInvoice = invoices.find(
      (inv) => inv.studentId === s.id && inv.month === options.month && inv.year === options.year
    ) || invoices.find((inv) => inv.studentId === s.id);

    const subjectDetailStr = matchingInvoice && matchingInvoice.lineItems
      ? matchingInvoice.lineItems
          .map(
            (li) =>
              `${li.subjectName}: ${li.paidAmount || 0}/${li.amount}đ ${
                li.paidDate ? `(Ngày nộp: ${li.paidDate})` : '(Chưa nộp)'
              }`
          )
          .join(' | ')
      : s.enrollments.map((e) => `${e.subjectName}: ${e.finalFee}đ`).join(', ');

    return {
      'STT': idx + 1,
      'Mã học sinh': s.code,
      'Họ và tên': s.fullName,
      'Khối': `Khối ${s.grade}`,
      'Lớp': s.className,
      'Số điện thoại': s.phone || '',
      'Phụ huynh': s.parentName,
      'SĐT Phụ huynh': s.parentPhone || '',
      'Chi tiết môn & Ngày nộp': subjectDetailStr,
      'Học phí phải thu (VNĐ)': s.totalTuitionDue,
      'Đã nộp (VNĐ)': s.totalPaid,
      'Còn nợ (VNĐ)': s.remainingDebt,
      'Trạng thái': s.remainingDebt === 0 ? 'Đã hoàn thành' : s.totalPaid > 0 ? 'Đóng thiếu' : 'Chưa nộp',
      'Ghi chú': s.notes || '',
    };
  });

  const fileName = `ANTAM_Hoc_Phi_${options.filterType.toUpperCase()}_K${options.grade}_T${options.month}_${options.year}.xlsx`;
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DANH SÁCH HỌC PHÍ');
  XLSX.writeFile(workbook, fileName);
  return fileName;
}

export function exportMonthlySettlementExcel(
  invoices: InvoiceRecord[],
  month: number,
  year: number
): string {
  const monthInvoices = invoices.filter((inv) => inv.month === month && inv.year === year);
  const workbook = XLSX.utils.book_new();

  // Sheet 1: TỔNG QUAN QUYẾT TOÁN
  const totalAmount = monthInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = monthInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalDebt = monthInvoices.reduce((s, i) => s + i.remainingAmount, 0);
  const settledCount = monthInvoices.filter((i) => i.isSettled || i.status === 'paid').length;

  const summaryRows = [
    { 'Chỉ tiêu quyết toán': 'Kỳ quyết toán', 'Giá trị': `Tháng ${month}/${year}` },
    { 'Chỉ tiêu quyết toán': 'Tổng số hóa đơn phát hành', 'Giá trị': monthInvoices.length },
    { 'Chỉ tiêu quyết toán': 'Tổng học phí dự thu (VNĐ)', 'Giá trị': totalAmount },
    { 'Chỉ tiêu quyết toán': 'Tổng học phí thực thu (VNĐ)', 'Giá trị': totalPaid },
    { 'Chỉ tiêu quyết toán': 'Tổng công nợ còn lại (VNĐ)', 'Giá trị': totalDebt },
    { 'Chỉ tiêu quyết toán': 'Tỷ lệ thu hồi học phí', 'Giá trị': `${((totalPaid / (totalAmount || 1)) * 100).toFixed(1)}%` },
    { 'Chỉ tiêu quyết toán': 'Số hóa đơn đã quyết toán/thu đủ', 'Giá trị': `${settledCount}/${monthInvoices.length}` },
    { 'Chỉ tiêu quyết toán': 'Ngày lập báo cáo', 'Giá trị': new Date().toLocaleDateString('vi-VN') },
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'TỔNG QUAN QUYẾT TOÁN');

  // Sheet 2: CHI TIẾT TỪNG MÔN HỌC & NGÀY NỘP
  const lineItemRows: any[] = [];
  let rowIdx = 1;

  monthInvoices.forEach((inv) => {
    inv.lineItems.forEach((li) => {
      lineItemRows.push({
        'STT': rowIdx++,
        'Mã hóa đơn': inv.invoiceCode,
        'Họ tên học sinh': inv.studentName,
        'Mã HS': inv.studentCode,
        'Khối': `Khối ${inv.grade}`,
        'Môn học': li.subjectName,
        'Học phí môn (VNĐ)': li.amount,
        'Đã nộp môn (VNĐ)': li.paidAmount || 0,
        'Còn nợ môn (VNĐ)': li.remainingAmount !== undefined ? li.remainingAmount : (li.amount - (li.paidAmount || 0)),
        'Ngày nộp tiền': li.paidDate || 'Chưa nộp',
        'Hình thức nộp': li.paymentMode === 'per_subject' ? 'Nộp từng môn' : li.paymentMode === 'full' ? 'Nộp tổng' : 'Chưa thu',
        'Trạng thái môn': li.status === 'paid' ? 'Đã thu đủ' : li.status === 'partial' ? 'Nộp một phần' : 'Chưa thu',
        'Trạng thái HĐ': inv.status === 'paid' ? 'Đã hoàn thành' : inv.status === 'partial' ? 'Đóng thiếu' : 'Chưa nộp',
        'Quyết toán': inv.isSettled ? `Đã quyết toán (${inv.settledDate || ''})` : 'Chưa khóa sổ',
      });
    });
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(lineItemRows), 'CHI TIẾT TỪNG MÔN & NGÀY NỘP');

  // Sheet 3: LỊCH SỬ GIAO DỊCH THU TIỀN
  const transactionRows: any[] = [];
  let txIdx = 1;

  monthInvoices.forEach((inv) => {
    inv.paymentHistory.forEach((tx) => {
      transactionRows.push({
        'STT': txIdx++,
        'Mã hóa đơn': inv.invoiceCode,
        'Mã giao dịch': tx.referenceCode || tx.id,
        'Họ tên học sinh': tx.studentName,
        'Số tiền nộp (VNĐ)': tx.amount,
        'Ngày nộp tiền': tx.paymentDate,
        'Hình thức': tx.paymentMode === 'per_subject' ? 'Nộp từng môn riêng' : 'Nộp tổng',
        'Phương thức': tx.method === 'bank_transfer' ? 'Chuyển khoản' : tx.method === 'qr_code' ? 'VietQR' : 'Tiền mặt',
        'Người thu': tx.collectedBy,
        'Môn nộp cụ thể': tx.subjectBreakdown ? tx.subjectBreakdown.map((s) => `${s.subjectName} (${s.amount}đ, ${s.paidDate || tx.paymentDate})`).join('; ') : 'Nộp tổng toàn bộ môn',
        'Ghi chú': tx.notes || '',
      });
    });
  });
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionRows), 'LỊCH SỬ THU TIỀN');

  const fileName = `ANTAM_QUYET_TOAN_THANG_${month}_${year}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  return fileName;
}

export const generateCenterExcelExport = (
  students: Student[],
  invoices: InvoiceRecord[],
  expenses: ExpenseItem[],
  leads: ParentLead[],
  tutors: TutorAssistant[],
  _sessions?: ScheduleSession[],
  fileName = 'ANTAM_EDUCATION_MASTER_REPORT.xlsx'
) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: DASHBOARD
  const totalRevenue = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalDebt = invoices.reduce((s, i) => s + i.remainingAmount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  const dashRows = [
    { 'Chỉ tiêu': 'Tổng số học sinh', 'Giá trị': students.length },
    { 'Chỉ tiêu': 'Tổng doanh thu học phí', 'Giá trị': totalRevenue },
    { 'Chỉ tiêu': 'Học phí đã thu', 'Giá trị': totalPaid },
    { 'Chỉ tiêu': 'Công nợ phải thu', 'Giá trị': totalDebt },
    { 'Chỉ tiêu': 'Tổng chi phí vận hành', 'Giá trị': totalExpense },
    { 'Chỉ tiêu': 'Lợi nhuận ròng hiện tại', 'Giá trị': totalPaid - totalExpense },
    { 'Chỉ tiêu': 'Số lượng Lead CRM', 'Giá trị': leads.length },
    { 'Chỉ tiêu': 'Đội ngũ Trợ giảng & Gia sư', 'Giá trị': tutors.length },
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(dashRows), 'DASHBOARD');

  // Sheets by Grade
  [6, 7, 8, 9].forEach((g) => {
    const gStudents = students.filter((s) => s.grade === g);
    if (gStudents.length > 0) {
      const gRows = gStudents.map((st) => ({
        'Mã học sinh': st.code,
        'Họ và tên': st.fullName,
        'Ngày sinh': st.dob || '',
        'Giới tính': st.gender,
        'Số điện thoại': st.phone,
        'Người liên hệ phụ huynh': st.parentName,
        'Số điện thoại phụ huynh': st.parentPhone,
        'Trường đang học': st.currentSchool,
        'Lớp': st.className,
        'Môn học': st.enrollments.map((e) => e.subjectName).join(', '),
        'Tổng học phí': st.totalTuitionDue,
        'Đã nộp': st.totalPaid,
        'Còn nợ': st.remainingDebt,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(gRows), `KHỐI ${g}`);
    }
  });

  // Sheet: CHI PHÍ
  const expRows = expenses.map((e) => ({
    'Mã phiếu': e.expenseCode,
    'Ngày': e.date,
    'Loại chi': e.categoryName,
    'Nội dung': e.description,
    'Số tiền': e.amount,
    'Người thanh toán': e.payer,
    'Trạng thái': e.status,
    'Ghi chú': e.notes || '',
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expRows), 'CHI PHÍ');

  // Sheet: Câu trả lời biểu mẫu 1 (Tutors)
  const tutRows = tutors.map((t) => ({
    'Mã TG': t.code,
    'Họ và tên': t.fullName,
    'Số điện thoại': t.phone,
    'Email': t.email,
    'Trường đại học': t.university,
    'Chuyên ngành': t.major,
    'Môn có thể dạy': t.subjectsCanTeach.join(', '),
    'Kinh nghiệm': `${t.experienceYears || 0} năm`,
    'Đánh giá': t.rating,
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(tutRows), 'Câu trả lời biểu mẫu 1');

  // Sheet: Câu trả lời biểu mẫu 2 (Leads)
  const leadRows = leads.map((l) => ({
    'Mã Lead': l.code,
    'Họ tên phụ huynh': l.parentName,
    'Họ tên học sinh': l.studentName,
    'Số điện thoại/Zalo': l.phone,
    'Trường đang học': l.currentSchool,
    'Khối dự kiến': `Khối ${l.targetGrade}`,
    'Môn quan tâm': l.interestedSubjects.join(', '),
    'Yêu cầu đặc biệt': l.customTutoring ? l.customTutoring.topic : '',
    'Trạng thái': l.status,
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(leadRows), 'Câu trả lời biểu mẫu 2');

  XLSX.writeFile(workbook, fileName);
};
