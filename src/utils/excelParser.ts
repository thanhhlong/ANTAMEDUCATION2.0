import * as XLSX from 'xlsx';
import { Student, ExpenseItem, ParentLead, TutorAssistant, InvoiceRecord, StudentAttendance, ScheduleSession } from '../types';

export interface ExcelImportResult {
  sheetNames: string[];
  totalRowsParsed: number;
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

export async function parseUploadedExcel(file: File, existingStudents: Student[]): Promise<ExcelImportResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  
  const result: ExcelImportResult = {
    sheetNames: workbook.SheetNames,
    totalRowsParsed: 0,
    students: [],
    expenses: [],
    tutorApplicants: [],
    parentLeads: [],
  };

  const existingCodes = new Set(existingStudents.map((s) => s.code.toLowerCase().trim()));
  const existingNamePhones = new Set(
    existingStudents.map((s) => `${s.fullName.toLowerCase().trim()}_${s.parentPhone.trim()}`)
  );

  workbook.SheetNames.forEach((sheetName) => {
    const cleanSheetName = sheetName.trim().toUpperCase();
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

    if (!rows || rows.length === 0) return;
    result.totalRowsParsed += rows.length;

    // Detect Grade sheets: KHỐI 6, KHỐI 7, KHỐI 8, KHỐI 9, LỚP 6, v.v.
    if (
      cleanSheetName.includes('KHỐI 6') ||
      cleanSheetName.includes('KHỐI 7') ||
      cleanSheetName.includes('KHỐI 8') ||
      cleanSheetName.includes('KHỐI 9') ||
      cleanSheetName.includes('KHOI') ||
      cleanSheetName.includes('HỌC SINH') ||
      cleanSheetName.includes('STUDENT')
    ) {
      let defaultGrade = 8;
      if (cleanSheetName.includes('6')) defaultGrade = 6;
      else if (cleanSheetName.includes('7')) defaultGrade = 7;
      else if (cleanSheetName.includes('8')) defaultGrade = 8;
      else if (cleanSheetName.includes('9')) defaultGrade = 9;

      rows.forEach((row, idx) => {
        const fullName = (row['Họ và tên'] || row['Họ tên'] || row['Họ tên học sinh'] || row['Tên học sinh'] || row['Name'] || '').toString().trim();
        if (!fullName) return;

        const code = (row['Mã học sinh'] || row['Mã HS'] || row['Mã'] || `AT-K${defaultGrade}-${String(idx + 1).padStart(3, '0')}`).toString().trim();
        const phone = (row['Số điện thoại'] || row['SĐT'] || row['Điện thoại'] || row['Phone'] || '').toString().trim();
        const parentName = (row['Người liên hệ phụ huynh'] || row['Họ tên phụ huynh'] || row['Phụ huynh'] || row['Tên phụ huynh'] || 'Phụ huynh').toString().trim();
        const parentPhone = (row['Số điện thoại phụ huynh'] || row['SĐT Phụ huynh'] || row['SĐT PH'] || phone || '').toString().trim();
        const school = (row['Trường đang học'] || row['Trường'] || row['Trường học'] || '').toString().trim();
        const className = (row['Lớp'] || `${defaultGrade}A1`).toString().trim();
        const address = (row['Địa chỉ'] || '').toString().trim();
        const notes = (row['Ghi chú'] || '').toString().trim();
        const dob = (row['Ngày sinh'] || '').toString().trim();
        const gender = (row['Giới tính'] || 'Nam').toString().trim() as 'Nam' | 'Nữ' | 'Khác';

        // Check duplicates
        let isDuplicate = false;
        let duplicateReason = '';

        if (existingCodes.has(code.toLowerCase())) {
          isDuplicate = true;
          duplicateReason = `Mã học sinh ${code} đã tồn tại trong hệ thống.`;
        } else if (existingNamePhones.has(`${fullName.toLowerCase()}_${parentPhone}`)) {
          isDuplicate = true;
          duplicateReason = `Họ tên "${fullName}" và SĐT phụ huynh "${parentPhone}" đã trùng khớp.`;
        }

        const errors: string[] = [];
        if (!fullName) errors.push('Thiếu họ và tên học sinh');
        if (!parentPhone && !phone) errors.push('Thiếu số điện thoại liên hệ');

        result.students.push({
          data: {
            code,
            fullName,
            dob: dob || '2012-01-01',
            gender,
            phone,
            zalo: phone,
            email: '',
            address,
            currentSchool: school,
            grade: defaultGrade,
            className,
            status: 'active',
            parentName,
            parentPhone,
            parentRelationship: 'Bố',
            notes,
            joinedDate: new Date().toISOString().split('T')[0],
          },
          isDuplicate,
          duplicateReason,
          errors,
          grade: defaultGrade,
        });
      });
    }

    // Detect Expense sheet: CHI PHÍ
    else if (cleanSheetName.includes('CHI PHÍ') || cleanSheetName.includes('CHI PHI') || cleanSheetName.includes('EXPENSE')) {
      rows.forEach((row, idx) => {
        const description = (row['Nội dung'] || row['Mô tả'] || row['Tên khoản chi'] || row['Nội dung chi'] || '').toString().trim();
        if (!description) return;

        const rawAmount = row['Số tiền'] || row['Chi phí'] || row['Số tiền chi'] || row['Amount'] || 0;
        const amount = typeof rawAmount === 'number' ? rawAmount : parseInt(String(rawAmount).replace(/[^\d]/g, '') || '0', 10);
        const categoryName = (row['Loại chi'] || row['Danh mục'] || 'Khác').toString().trim();
        const date = (row['Ngày'] || row['Ngày chi'] || new Date().toISOString().split('T')[0]).toString().trim();
        const payer = (row['Người thanh toán'] || row['Người chi'] || 'Kế toán').toString().trim();
        const notes = (row['Ghi chú'] || '').toString().trim();

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
          errors: amount <= 0 ? ['Số tiền không hợp lệ'] : [],
        });
      });
    }

    // Detect Biểu mẫu 1: Trợ giảng / Tutor candidate applications
    else if (cleanSheetName.includes('BIỂU MẪU 1') || cleanSheetName.includes('BIEU MAU 1') || cleanSheetName.includes('TRỢ GIẢNG') || cleanSheetName.includes('TRO GIANG')) {
      rows.forEach((row, idx) => {
        const fullName = (row['Họ và tên'] || row['Họ tên'] || row['Tên'] || '').toString().trim();
        if (!fullName) return;

        const phone = (row['Số điện thoại'] || row['SĐT'] || '').toString().trim();
        const email = (row['Email'] || '').toString().trim();
        const university = (row['Trường đại học'] || row['Trường'] || '').toString().trim();
        const major = (row['Chuyên ngành'] || row['Ngành học'] || '').toString().trim();
        const subjects = (row['Môn có thể trợ giảng'] || row['Môn'] || 'Toán học').toString().split(',').map((s: string) => s.trim());
        const bio = (row['Giới thiệu bản thân'] || row['Kinh nghiệm'] || '').toString().trim();
        const expectations = (row['Mong muốn'] || '').toString().trim();

        result.tutorApplicants.push({
          data: {
            code: `TA-IMP-${String(idx + 1).padStart(2, '0')}`,
            fullName,
            phone,
            email,
            university,
            major,
            subjectsCanTeach: subjects,
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
    }

    // Detect Biểu mẫu 2: CRM Parent inquiries & Custom tutoring requests
    else if (cleanSheetName.includes('BIỂU MẪU 2') || cleanSheetName.includes('BIEU MAU 2') || cleanSheetName.includes('PHỤ HUYNH') || cleanSheetName.includes('LEAD') || cleanSheetName.includes('ĐĂNG KÝ')) {
      rows.forEach((row, idx) => {
        const studentName = (row['Họ tên học sinh'] || row['Tên học sinh'] || row['Họ và tên'] || '').toString().trim();
        const parentName = (row['Họ tên phụ huynh'] || row['Phụ huynh'] || 'Phụ huynh').toString().trim();
        const phone = (row['Số điện thoại'] || row['SĐT/Zalo'] || row['Số điện thoại/Zalo'] || row['SĐT'] || '').toString().trim();
        if (!studentName && !phone) return;

        const school = (row['Trường'] || row['Trường đang học'] || '').toString().trim();
        const gradeRaw = row['Khối dự kiến'] || row['Khối'] || row['Lớp'] || 8;
        const targetGrade = parseInt(String(gradeRaw).replace(/[^\d]/g, '') || '8', 10);
        const subjects = (row['Môn quan tâm'] || row['Môn'] || 'Toán học').toString().split(',').map((s: string) => s.trim());
        const customNeed = (row['Nhu cầu học tập theo yêu cầu'] || row['Nhu cầu học tập'] || row['Ghi chú'] || '').toString().trim();
        const preferredSchedule = (row['Khung thời gian mong muốn'] || row['Thời gian'] || '').toString().split(',').map((s: string) => s.trim());
        const referralSource = (row['Nguồn biết đến'] || 'Google Form (Biểu mẫu 2)').toString().trim();

        result.parentLeads.push({
          data: {
            code: `LEAD-IMP-${String(idx + 1).padStart(3, '0')}`,
            parentName,
            studentName: studentName || 'Học sinh',
            phone,
            zalo: phone,
            currentSchool: school,
            targetGrade,
            interestedSubjects: subjects,
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
              { date: new Date().toISOString().replace('T', ' ').slice(0, 16), action: 'Import từ Excel Biểu mẫu 2', by: 'Excel Import' },
            ],
            createdAt: new Date().toISOString().split('T')[0],
          },
          errors: !phone ? ['Thiếu số điện thoại liên hệ'] : [],
        });
      });
    }
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
    'Đã nộp (VNĐ)': s.totalPaid,
    'Công nợ còn lại (VNĐ)': s.remainingDebt,
    'Trạng thái': s.status === 'active' ? 'Đang học' : s.status === 'paused' ? 'Tạm dừng' : 'Học thử',
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
      'Lý chuyên': '500.000',
      'Tổng học phí': '2.300.000',
      'Đã nộp': '2.300.000',
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

// Aliases for seamless imports across components
export const parseCenterExcelFile = async (
  file: File,
  _existingCodes?: string[],
  _existingPhoneParents?: string[]
): Promise<ExcelImportResult> => {
  return parseUploadedExcel(file, []);
};

export const generateCenterExcelExport = (
  students: Student[],
  invoices: InvoiceRecord[],
  expenses: ExpenseItem[],
  leads: ParentLead[],
  tutors: TutorAssistant[],
  sessions: ScheduleSession[],
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
        'Ngày sinh': st.dateOfBirth || '',
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
    'Thù lao/buổi': t.hourlyRate,
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

