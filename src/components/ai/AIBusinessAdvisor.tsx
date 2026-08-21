import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getAIBusinessInsights, BusinessAIInsight } from '../../services/geminiService';
import { formatCurrency } from '../../utils/formatters';
import {
  Sparkles,
  Award,
  AlertTriangle,
  DollarSign,
  Users,
  RefreshCw,
} from 'lucide-react';

export const AIBusinessAdvisor: React.FC = () => {
  const { students, invoices, expenses, leads, tutors } = useApp();

  const [insight, setInsight] = useState<BusinessAIInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await getAIBusinessInsights(students, invoices, expenses, leads, tutors);
      setInsight(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [students.length, invoices.length, expenses.length, leads.length]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Chiến Lược</span>
            <span>/</span>
            <span className="text-slate-700">AI Cố Vấn</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>AI CỐ VẤN CHIẾN LƯỢC & PHÂN TÍCH KINH DOANH</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">
            Báo cáo phân tích tổng thể tài chính, dự báo doanh thu và chiến lược thu hồi công nợ
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs lg:text-sm font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang phân tích...' : 'Cập Nhật Lại Phân Tích'}</span>
        </button>
      </div>

      {/* Top Banner: Health Score & Executive Summary */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              Báo Cáo Giám Đốc Điều Hành (Executive Report)
            </span>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 mt-2">
              Chỉ Số Sức Khỏe Vận Hành Trung Tâm
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-medium">Điểm sức khỏe</div>
              <div className="text-2xl font-bold text-emerald-600">
                {insight?.healthScore || 85} / 100
              </div>
            </div>
            <Award className="w-8 h-8 text-amber-500" />
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed max-w-5xl">
          {insight?.executiveSummary}
        </p>
      </div>

      {/* Next Month Forecast Cards */}
      {insight?.nextMonthForecast && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dự Báo Doanh Thu Tháng Tới
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(insight.nextMonthForecast.estimatedRevenue)}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              Độ tin cậy mô hình: {insight.nextMonthForecast.confidencePercent}%
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dự Báo Chi Phí Vận Hành
            </div>
            <div className="text-2xl font-bold text-rose-600 font-mono">
              {formatCurrency(insight.nextMonthForecast.estimatedExpenses)}
            </div>
            <div className="text-[11px] text-slate-500">Bao gồm lương GV & trợ giảng</div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Lợi Nhuận Ròng Kỳ Vọng
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono">
              {formatCurrency(insight.nextMonthForecast.expectedNetProfit)}
            </div>
            <div className="text-[11px] text-emerald-600">Tăng trưởng ổn định</div>
          </div>
        </div>
      )}

      {/* 3 Columns: Action Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Col 1: Tối ưu doanh thu */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Chiến Lược Tối Ưu Doanh Thu</span>
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-700">
            {insight?.revenueOptimization.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 2: Kế hoạch thu hồi công nợ */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Kế Hoạch Thu Hồi Công Nợ</span>
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-700">
            {insight?.debtRecoveryPlan.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-rose-600 font-bold">!</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Tuyển sinh & CRM */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Chiến Lược Tuyển Sinh & Chốt Lớp</span>
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-700">
            {insight?.enrollmentStrategy.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-amber-600 font-bold">★</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
