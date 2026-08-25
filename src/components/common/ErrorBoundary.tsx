import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in UI Boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Đã xảy ra lỗi hiển thị giao diện</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hệ thống ghi nhận có gián đoạn hiển thị. Bạn có thể làm mới trang hoặc xóa bộ nhớ tạm để tải lại dữ liệu mặc định.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/50 text-left font-mono text-xs text-rose-300 max-h-32 overflow-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm cursor-pointer shadow-md transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải Lại Trang</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm cursor-pointer border border-slate-600 transition-all"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Xóa Cache & Khởi Động Lại</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
