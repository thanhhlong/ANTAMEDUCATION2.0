import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AuthUser, Subject } from '../../types';
import { 
  Users, 
  Coins, 
  Calendar, 
  Percent, 
  CheckCircle2, 
  History, 
  FileSpreadsheet, 
  Search, 
  DollarSign, 
  PlusCircle, 
  Trash2, 
  Filter, 
  AlertCircle, 
  ArrowRight,
  Info,
  Layers,
  BookOpen
} from 'lucide-react';

interface PayrollRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string; // Keep for compatibility (comma separated subject ids or main subject id)
  subjectName: string; // Display string of subjects & grades (e.g., "Toán (K8), Văn (K9)")
  month: number;
  year: number;
  studentCount: number;
  totalTuitionAmount: number;
  percentageShare: number; // Average or main percentage
  totalPayoutAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate: string;
  status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
}

interface PayoutBlock {
  id: string;
  subjectId: string;
  subjectName: string;
  grade: number | 'all';
  percentageShare: number;
}

export const TeacherPayroll: React.FC = () => {
  const { users, subjects, students } = useApp();

  // Get only users who are Teachers
  const teachers = users.filter(u => u.role === 'TEACHER');

  // Load / Save Payroll records from localStorage
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('antam_teacher_payroll_records');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    
    // Default seed payroll history for 2026 to make the UI look polished on first load
    const defaultRecords: PayrollRecord[] = [
      {
        id: 'pay-001',
        teacherId: 'usr-teacher-01',
        teacherName: 'Thầy Nguyễn Văn Nam',
        subjectId: 'sub-toan',
        subjectName: 'Toán học (Khối 8)',
        month: 7,
        year: 2026,
        studentCount: 15,
        totalTuitionAmount: 14500000,
        percentageShare: 40,
        totalPayoutAmount: 5800000,
        paidAmount: 5800000,
        remainingAmount: 0,
        paymentDate: '2026-07-31',
        status: 'paid',
        notes: 'Thanh toán % học phí lớp Toán khối 8 tháng 7.'
      },
      {
        id: 'pay-002',
        teacherId: 'usr-teacher-02',
        teacherName: 'Cô Lê Thu Trang',
        subjectId: 'sub-anh',
        subjectName: 'Tiếng Anh (Khối 8, Khối 9)',
        month: 7,
        year: 2026,
        studentCount: 12,
        totalTuitionAmount: 4800000,
        percentageShare: 45,
        totalPayoutAmount: 2160000,
        paidAmount: 2160000,
        remainingAmount: 0,
        paymentDate: '2026-07-31',
        status: 'paid',
        notes: 'Chi trả tiền dạy Tiếng Anh khối 8, 9 tháng 7.'
      },
      {
        id: 'pay-003',
        teacherId: 'usr-teacher-03',
        teacherName: 'Thầy Đỗ Quốc Tuấn',
        subjectId: 'sub-khtn',
        subjectName: 'Khoa học tự nhiên (Tất cả khối)',
        month: 7,
        year: 2026,
        studentCount: 8,
        totalTuitionAmount: 3200000,
        percentageShare: 40,
        totalPayoutAmount: 1280000,
        paidAmount: 1000000,
        remainingAmount: 280000,
        paymentDate: '2026-07-30',
        status: 'partial',
        notes: 'Tạm ứng chi trả tiền dạy KHTN tháng 7.'
      }
    ];
    localStorage.setItem('antam_teacher_payroll_records', JSON.stringify(defaultRecords));
    return defaultRecords;
  });

  useEffect(() => {
    localStorage.setItem('antam_teacher_payroll_records', JSON.stringify(payrollRecords));
  }, [payrollRecords]);

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'calculator' | 'history'>('overview');

  // Filters for history
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [filterTeacher, setFilterTeacher] = useState<string | 'all'>('all');

  // Calculator State
  const [calcTeacherId, setCalcTeacherId] = useState<string>(teachers[0]?.id || '');
  const [calcMonth, setCalcMonth] = useState<number>(new Date().getMonth() + 1);
  const [calcYear, setCalcYear] = useState<number>(2026);
  const [calcNotes, setCalcNotes] = useState<string>('');
  
  // Multiple Subject + Grade blocks added to calculator sheet
  const [payoutBlocks, setPayoutBlocks] = useState<PayoutBlock[]>([]);

  // Temp form inputs to add a block
  const [blockSubjectId, setBlockSubjectId] = useState<string>('');
  const [blockGrade, setBlockGrade] = useState<number | 'all'>('all');
  const [blockPercentage, setBlockPercentage] = useState<number>(40);

  // Custom manual state edits inside calculation screen (using enrollmentKey: `studentId-subjectId`)
  const [customStudentFees, setCustomStudentFees] = useState<{ [enrollmentKey: string]: number }>({});
  const [customStudentPercents, setCustomStudentPercents] = useState<{ [enrollmentKey: string]: number }>({});
  const [recordPaidAmount, setRecordPaidAmount] = useState<number>(0);

  // Set default subject and block when teacher is selected
  useEffect(() => {
    const selectedTeacherObj = teachers.find(t => t.id === calcTeacherId);
    if (selectedTeacherObj) {
      const defaultSubId = (selectedTeacherObj.teachingSubjects && selectedTeacherObj.teachingSubjects.length > 0)
        ? selectedTeacherObj.teachingSubjects[0]
        : (subjects[0]?.id || '');
      
      setBlockSubjectId(defaultSubId);
      setBlockGrade('all');
      setBlockPercentage(40);

      const subObj = subjects.find(s => s.id === defaultSubId);
      if (subObj) {
        setPayoutBlocks([
          {
            id: `blk-${Date.now()}`,
            subjectId: defaultSubId,
            subjectName: subObj.name,
            grade: 'all',
            percentageShare: 40
          }
        ]);
      } else {
        setPayoutBlocks([]);
      }
    } else {
      setPayoutBlocks([]);
    }
    // Clear temp overrides when switching teacher
    setCustomStudentFees({});
    setCustomStudentPercents({});
  }, [calcTeacherId]);

  // Format Currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Add payout block
  const handleAddPayoutBlock = () => {
    if (!blockSubjectId) {
      alert('Vui lòng chọn môn học để thêm.');
      return;
    }
    const subObj = subjects.find(s => s.id === blockSubjectId);
    if (!subObj) return;

    // Check if duplicate block already added
    const isDuplicate = payoutBlocks.some(
      b => b.subjectId === blockSubjectId && b.grade === blockGrade
    );

    if (isDuplicate) {
      alert(`Môn học "${subObj.name}" với khối đã chọn đã được thêm vào bảng tính trước đó.`);
      return;
    }

    const newBlock: PayoutBlock = {
      id: `blk-${Date.now()}`,
      subjectId: blockSubjectId,
      subjectName: subObj.name,
      grade: blockGrade,
      percentageShare: blockPercentage
    };

    setPayoutBlocks([...payoutBlocks, newBlock]);
  };

  // Remove payout block
  const handleRemovePayoutBlock = (id: string) => {
    setPayoutBlocks(payoutBlocks.filter(b => b.id !== id));
  };

  // Get active student list matching the added payout blocks
  const getEnrolledStudents = () => {
    if (payoutBlocks.length === 0) return [];
    
    const enrolledList: any[] = [];
    const matchedKeys = new Set<string>();

    students.forEach(student => {
      // Only active students
      if (student.status !== 'active') return;

      payoutBlocks.forEach(block => {
        // Check if grade matches
        const matchesGrade = block.grade === 'all' || student.grade === block.grade;
        if (!matchesGrade) return;

        // Check if student is active in this subject
        const enrollment = student.enrollments.find(
          e => e.subjectId === block.subjectId && e.status === 'active'
        );
        if (!enrollment) return;

        const enrollmentKey = `${student.id}-${block.subjectId}`;
        if (matchedKeys.has(enrollmentKey)) return;
        matchedKeys.add(enrollmentKey);

        // Tuition Waived logic
        const baseFee = student.tuitionWaived ? 0 : enrollment.finalFee;

        // Fetch overrides
        const actualFee = customStudentFees[enrollmentKey] !== undefined 
          ? customStudentFees[enrollmentKey] 
          : baseFee;

        const actualPercent = customStudentPercents[enrollmentKey] !== undefined 
          ? customStudentPercents[enrollmentKey] 
          : block.percentageShare;

        const payAmount = Math.round(actualFee * (actualPercent / 100));

        enrolledList.push({
          id: student.id,
          enrollmentKey,
          code: student.code,
          fullName: student.fullName,
          grade: student.grade,
          className: student.className,
          tuitionWaived: student.tuitionWaived,
          subjectId: block.subjectId,
          subjectName: block.subjectName,
          baseFee,
          actualFee,
          actualPercent,
          payAmount,
        });
      });
    });

    return enrolledList;
  };

  const calcEnrolled = getEnrolledStudents();
  const totalTuitionCalculated = calcEnrolled.reduce((sum, item) => sum + item.actualFee, 0);
  const totalTeacherPayoutCalculated = calcEnrolled.reduce((sum, item) => sum + item.payAmount, 0);

  // Sync default paid amount when total payouts change
  useEffect(() => {
    setRecordPaidAmount(totalTeacherPayoutCalculated);
  }, [totalTeacherPayoutCalculated]);

  // Handle Recording of Payout
  const handleRecordPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTeacherObj = teachers.find(t => t.id === calcTeacherId);

    if (!selectedTeacherObj) {
      alert('Vui lòng chọn Giáo viên.');
      return;
    }

    if (payoutBlocks.length === 0) {
      alert('Vui lòng thêm ít nhất một môn học chi trả theo khối lớp để tính lương.');
      return;
    }

    if (calcEnrolled.length === 0) {
      alert('Các khối môn học đã thêm hiện chưa có học sinh nào đăng ký học để tính tiền.');
      return;
    }

    const isPaid = recordPaidAmount >= totalTeacherPayoutCalculated;
    const status = recordPaidAmount === 0 
      ? 'unpaid' 
      : (recordPaidAmount < totalTeacherPayoutCalculated ? 'partial' : 'paid');

    // Build beautiful display string for subjects & grades
    const blockSummaries = payoutBlocks.map(b => {
      const gradeStr = b.grade === 'all' ? 'Tất cả khối' : `Khối ${b.grade}`;
      return `${b.subjectName} (${gradeStr} - ${b.percentageShare}%)`;
    });
    const subjectsDisplayString = blockSummaries.join(', ');

    const newRecord: PayrollRecord = {
      id: `pay-${Date.now()}`,
      teacherId: calcTeacherId,
      teacherName: selectedTeacherObj.fullName,
      subjectId: payoutBlocks.map(b => b.subjectId).join(','),
      subjectName: subjectsDisplayString,
      month: calcMonth,
      year: calcYear,
      studentCount: calcEnrolled.length,
      totalTuitionAmount: totalTuitionCalculated,
      percentageShare: Math.round(payoutBlocks.reduce((sum, b) => sum + b.percentageShare, 0) / payoutBlocks.length),
      totalPayoutAmount: totalTeacherPayoutCalculated,
      paidAmount: recordPaidAmount,
      remainingAmount: Math.max(0, totalTeacherPayoutCalculated - recordPaidAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      status,
      notes: calcNotes || `Chi trả học phí: ${subjectsDisplayString} tháng ${calcMonth}/${calcYear}.`
    };

    setPayrollRecords([newRecord, ...payrollRecords]);
    alert(`Đã ghi nhận chi trả thành công cho ${selectedTeacherObj.fullName} số tiền ${formatCurrency(recordPaidAmount)}!`);
    
    // Clear state
    setCustomStudentFees({});
    setCustomStudentPercents({});
    setCalcNotes('');
    setActiveSubTab('overview');
  };

  // Delete a payroll record
  const handleDeleteRecord = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa lịch sử chi trả này? Thao tác này sẽ hoàn tác số tiền đã ghi nhận.')) {
      setPayrollRecords(payrollRecords.filter(r => r.id !== id));
    }
  };

  // Get statistics for the "Overview" section per teacher
  const getTeacherStats = (teacherId: string) => {
    const teacherRecords = payrollRecords.filter(r => r.teacherId === teacherId);
    const totalCalculated = teacherRecords.reduce((sum, r) => sum + r.totalPayoutAmount, 0);
    const totalPaid = teacherRecords.reduce((sum, r) => sum + r.paidAmount, 0);
    const remaining = teacherRecords.reduce((sum, r) => sum + r.remainingAmount, 0);

    return {
      totalCalculated,
      totalPaid,
      remaining,
      recordCount: teacherRecords.length
    };
  };

  // Filter history records
  const filteredHistory = payrollRecords.filter(rec => {
    const matchMonth = filterMonth === 'all' || rec.month === Number(filterMonth);
    const matchYear = rec.year === Number(filterYear);
    const matchTeacher = filterTeacher === 'all' || rec.teacherId === filterTeacher;
    return matchMonth && matchYear && matchTeacher;
  });

  // Total sums of filtered history
  const historyTotalCalculated = filteredHistory.reduce((sum, r) => sum + r.totalPayoutAmount, 0);
  const historyTotalPaid = filteredHistory.reduce((sum, r) => sum + r.paidAmount, 0);
  const historyTotalRemaining = filteredHistory.reduce((sum, r) => sum + r.remainingAmount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 text-slate-800">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600" />
            <span>Quản Lý Chi Trả Giáo Viên</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tính toán phí chia sẻ học phí phải trả cho giáo viên, hỗ trợ cấu hình linh hoạt từng khối lớp và môn học học sinh học.
          </p>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeSubTab === 'overview' 
                ? 'bg-white text-emerald-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Công Dồn & Thanh Toán</span>
          </button>
          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeSubTab === 'calculator' 
                ? 'bg-white text-emerald-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tính Lương & Trả Phí</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeSubTab === 'history' 
                ? 'bg-white text-emerald-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch Sử Ghi Sổ</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CUMULATIVE OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Lũy Kế Đã Thanh Toán</span>
                <span className="text-xl font-black text-emerald-800 font-mono mt-1 block">
                  {formatCurrency(payrollRecords.reduce((sum, r) => sum + r.paidAmount, 0))}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Ghi nhận từ {payrollRecords.length} giao dịch chi</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Còn Lại Chưa Trả</span>
                <span className="text-xl font-black text-amber-800 font-mono mt-1 block">
                  {formatCurrency(payrollRecords.reduce((sum, r) => sum + r.remainingAmount, 0))}
                </span>
                <span className="text-[10px] text-amber-600 font-bold mt-1 block">Cộng dồn nợ lương qua các tháng</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-600/10 text-amber-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Tổng Chi Phí Dạy Học</span>
                <span className="text-xl font-black text-indigo-800 font-mono mt-1 block">
                  {formatCurrency(payrollRecords.reduce((sum, r) => sum + r.totalPayoutAmount, 0))}
                </span>
                <span className="text-[10px] text-indigo-600 font-bold mt-1 block">Học phí chia sẻ cho giáo viên</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-600/10 text-indigo-700 shrink-0">
                <Coins className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Teacher Cumulative Profiles */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Lũy Kế Trả Phí Từng Giáo Viên</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teachers.map(t => {
                const stats = getTeacherStats(t.id);
                const hasTeachingSubjects = t.teachingSubjects && t.teachingSubjects.length > 0;
                
                return (
                  <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                          <h4 className="font-extrabold text-slate-900 text-sm">{t.fullName}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">{t.title} • {t.department}</p>
                        
                        {/* Teaching subjects */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {hasTeachingSubjects ? (
                            t.teachingSubjects?.map(subId => {
                              const sub = subjects.find(s => s.id === subId);
                              return (
                                <span 
                                  key={subId} 
                                  className="text-[9px] font-bold px-2 py-0.5 rounded border"
                                  style={{ color: sub?.color || '#555', borderColor: sub?.color ? `${sub.color}40` : '#ccc', backgroundColor: sub?.color ? `${sub.color}08` : '#fff' }}
                                >
                                  {sub?.name || subId}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">Chưa gán môn dạy</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-bold text-slate-400 block">Số lần quyết toán</span>
                        <span className="text-xs font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 inline-block mt-0.5">
                          {stats.recordCount} lần
                        </span>
                      </div>
                    </div>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-150 p-2.5 rounded-xl mt-4 text-center">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 block uppercase">Đã Tính</span>
                        <span className="text-xs font-bold text-slate-800 font-mono mt-0.5 block">{formatCurrency(stats.totalCalculated)}</span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[9px] font-bold text-emerald-600 block uppercase">Đã Trả</span>
                        <span className="text-xs font-black text-emerald-700 font-mono mt-0.5 block">{formatCurrency(stats.totalPaid)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-rose-500 block uppercase">Còn Nợ</span>
                        <span className={`text-xs font-black font-mono mt-0.5 block ${stats.remaining > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {formatCurrency(stats.remaining)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => {
                          setCalcTeacherId(t.id);
                          setActiveSubTab('calculator');
                        }}
                        className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Tính lương môn học</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALCULATOR */}
      {activeSubTab === 'calculator' && (
        <form onSubmit={handleRecordPayout} className="space-y-6 animate-fadeIn max-w-4xl">
          {/* Config Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 lg:p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Cấu Hình Thông Tin Quyết Toán Lương</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Teacher Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Giáo Viên Nhận Chi Trả <span className="text-rose-500">*</span></label>
                <select
                  value={calcTeacherId}
                  onChange={(e) => setCalcTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 font-semibold cursor-pointer bg-white"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Month Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Tháng Tính Học Phí <span className="text-rose-500">*</span></label>
                <select
                  value={calcMonth}
                  onChange={(e) => setCalcMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 font-semibold cursor-pointer bg-white font-mono"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>

              {/* Year Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Năm <span className="text-rose-500">*</span></label>
                <select
                  value={calcYear}
                  onChange={(e) => setCalcYear(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 font-semibold cursor-pointer bg-white font-mono"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {/* ADD SUBJECT BY GRADE BLOCK FORM */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                  Thêm Môn Học & Khối Lớp Muốn Trả Phí
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                {/* Subject dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Môn Học</label>
                  <select
                    value={blockSubjectId}
                    onChange={(e) => setBlockSubjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 font-semibold bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                {/* Grade dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Khối Lớp (Thêm Theo Khối)</label>
                  <select
                    value={blockGrade}
                    onChange={(e) => setBlockGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 font-semibold bg-white cursor-pointer font-mono"
                  >
                    <option value="all">Tất cả khối lớp</option>
                    <option value={6}>Khối lớp 6</option>
                    <option value={7}>Khối lớp 7</option>
                    <option value={8}>Khối lớp 8</option>
                    <option value={9}>Khối lớp 9</option>
                  </select>
                </div>

                {/* Percentage default */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">% Giáo Viên Được Nhận</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={blockPercentage}
                      onChange={(e) => setBlockPercentage(Number(e.target.value) || 0)}
                      className="w-full pl-2.5 pr-8 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900 font-semibold bg-white font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] font-mono">%</span>
                  </div>
                </div>

                {/* Action button */}
                <div>
                  <button
                    type="button"
                    onClick={handleAddPayoutBlock}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 rounded shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Thêm Khối Môn</span>
                  </button>
                </div>
              </div>

              {/* List of currently added payout blocks */}
              {payoutBlocks.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">Danh sách khối môn đang tính:</span>
                  <div className="flex flex-wrap gap-2">
                    {payoutBlocks.map((block) => (
                      <span 
                        key={block.id} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-200 rounded-md shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-slate-800">{block.subjectName}</span>
                        <span className="text-indigo-600 font-mono bg-indigo-50 border border-indigo-100/50 px-1 py-0.2 rounded text-[10px]">
                          {block.grade === 'all' ? 'Tất cả khối' : `K${block.grade}`}
                        </span>
                        <span className="text-emerald-700 font-mono">({block.percentageShare}%)</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePayoutBlock(block.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                          title="Xóa khối dạy khỏi bảng tính"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Student List & Real-time Math Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Danh Sách Học Viên Thu Phí Thực Tế Theo Môn & Khối ({calcEnrolled.length} học viên)
              </span>
              <span className="text-[10px] font-bold bg-white text-indigo-600 px-2.5 py-1 rounded-md border border-slate-200 font-mono uppercase">
                Áp dụng tháng {calcMonth}/{calcYear}
              </span>
            </div>

            {calcEnrolled.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Không tìm thấy học sinh nào đang theo học các khối dạy này.</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto">Vui lòng thay đổi Môn học hoặc thêm Khối lớp thích hợp phía trên để hiển thị danh sách.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs lg:text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <th className="px-4 py-3">Mã & Họ Tên</th>
                      <th className="px-4 py-3 text-center">Khối Lớp</th>
                      <th className="px-4 py-3 text-center">Môn Học Chi Trả</th>
                      <th className="px-4 py-3 text-right">Phí Môn Học Thực Tế (₫)</th>
                      <th className="px-4 py-3 text-center">% Hưởng</th>
                      <th className="px-4 py-3 text-right text-indigo-700">Giáo Viên Nhận (₫)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calcEnrolled.map((item) => (
                      <tr key={item.enrollmentKey} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-[10px] text-slate-400 font-bold block">{item.code}</span>
                          <span className="font-bold text-slate-800">{item.fullName}</span>
                          {item.tuitionWaived && (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-200 ml-1.5">
                              Miễn học phí
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                            Lớp {item.className} (K{item.grade})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md">
                            {item.subjectName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              value={item.actualFee}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setCustomStudentFees({
                                  ...customStudentFees,
                                  [item.enrollmentKey]: isNaN(val) ? 0 : val
                                });
                              }}
                              className="w-24 px-1.5 py-1 text-right font-mono font-bold text-xs rounded border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">₫</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.actualPercent}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setCustomStudentPercents({
                                  ...customStudentPercents,
                                  [item.enrollmentKey]: isNaN(val) ? 0 : val
                                });
                              }}
                              className="w-12 px-1 py-1 text-center font-mono font-bold text-xs rounded border border-slate-200 text-indigo-700 focus:outline-none focus:border-indigo-500 bg-white"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-indigo-700">
                          {formatCurrency(item.payAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr className="font-bold text-slate-800">
                      <td colSpan={3} className="px-4 py-3 text-right text-xs uppercase">Tổng Cộng:</td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-700 text-xs">
                        {formatCurrency(totalTuitionCalculated)}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">—</td>
                      <td className="px-4 py-3 text-right font-mono font-black text-indigo-700 text-sm">
                        {formatCurrency(totalTeacherPayoutCalculated)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Save / Record Payment Form */}
          {calcEnrolled.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 lg:p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Thông Tin Thanh Toán & Ghi Nhận Chi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount to pay */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Số Tiền Thực Tế Chi Trả (VND) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={recordPaidAmount}
                      onChange={(e) => setRecordPaidAmount(parseInt(e.target.value, 10) || 0)}
                      className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono text-slate-950 font-black"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₫</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-0.5">
                    <span>Mức tính toán: {formatCurrency(totalTeacherPayoutCalculated)}</span>
                    <button
                      type="button"
                      onClick={() => setRecordPaidAmount(totalTeacherPayoutCalculated)}
                      className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Chi trả đủ 100%
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Ghi Chú Phiếu Chi</label>
                  <input
                    type="text"
                    value={calcNotes}
                    onChange={(e) => setCalcNotes(e.target.value)}
                    placeholder="Ví dụ: Đã trả đủ hoa hồng các khối môn đã thêm. Anh Lâm duyệt..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Submit Section */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPayoutBlocks([]);
                    setActiveSubTab('overview');
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận & Ghi Sổ Quỹ</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: HISTORY LIST */}
      {activeSubTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Quick Filters Toolbar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Teacher selector filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Giáo Viên:</span>
                <select
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">-- Tất cả giáo viên --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Month Selector Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tháng:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none cursor-pointer font-mono"
                >
                  <option value="all">Tất cả tháng</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>

              {/* Year Selector Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Năm:</span>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none cursor-pointer font-mono"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            {/* Total count indicator */}
            <div className="text-right">
              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-bold">
                Tìm thấy {filteredHistory.length} phiếu chi
              </span>
            </div>
          </div>

          {/* Sum Stats of Filtered Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Đã Trả (Lọc)</span>
              <span className="text-sm font-black text-emerald-700 font-mono block mt-0.5">{formatCurrency(historyTotalPaid)}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Còn Nợ (Lọc)</span>
              <span className="text-sm font-black text-rose-600 font-mono block mt-0.5">{formatCurrency(historyTotalRemaining)}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Đã Ghi (Lọc)</span>
              <span className="text-sm font-black text-slate-800 font-mono block mt-0.5">{formatCurrency(historyTotalCalculated)}</span>
            </div>
          </div>

          {/* History Data Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Không tìm thấy bản ghi chi trả nào phù hợp bộ lọc.</p>
                <p className="text-[10px] text-slate-400">Hãy thử điều chỉnh bộ lọc hoặc tạo một phiếu chi mới ở tab "Tính Lương & Trả Phí".</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs lg:text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] lg:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                      <th className="px-4 py-3.5">Giáo Viên & Môn Khối Trả Phí</th>
                      <th className="px-4 py-3.5 text-center">Kỳ Lương (Tháng/Năm)</th>
                      <th className="px-4 py-3.5 text-center">Sĩ Số</th>
                      <th className="px-4 py-3.5 text-right">Tổng Thu Học Viên (₫)</th>
                      <th className="px-4 py-3.5 text-center">TB % Hưởng</th>
                      <th className="px-4 py-3.5 text-right">Học Phí Tính (₫)</th>
                      <th className="px-4 py-3.5 text-right text-emerald-700">Đã Chi Trả (₫)</th>
                      <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                      <th className="px-4 py-3.5 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.map((rec) => {
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <span className="font-bold text-slate-900 block">{rec.teacherName}</span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded mt-1 inline-block max-w-[320px] truncate" title={rec.subjectName}>
                              {rec.subjectName}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-mono font-bold text-slate-600">
                            Tháng {rec.month}/{rec.year}
                          </td>
                          <td className="px-4 py-4 text-center font-bold font-mono text-slate-700">
                            {rec.studentCount} HS
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-slate-600">
                            {formatCurrency(rec.totalTuitionAmount)}
                          </td>
                          <td className="px-4 py-4 text-center font-mono font-bold text-indigo-700">
                            {rec.percentageShare}%
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-slate-800">
                            {formatCurrency(rec.totalPayoutAmount)}
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-black text-emerald-700">
                            {formatCurrency(rec.paidAmount)}
                            {rec.remainingAmount > 0 && (
                              <span className="text-[9px] font-bold text-rose-500 block">Nợ: {formatCurrency(rec.remainingAmount)}</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border inline-block ${
                              rec.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : rec.status === 'partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {rec.status === 'paid' ? 'Đã Trả Đủ' : rec.status === 'partial' ? 'Tạm Ứng' : 'Chưa Chi'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer inline-flex items-center"
                              title="Xóa phiếu ghi nhận"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
