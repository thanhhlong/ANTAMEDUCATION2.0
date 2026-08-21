import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'gemini-api-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/gemini/')) {
              const url = new URL(req.url, `http://${req.headers.host}`);
              const pathname = url.pathname;
              
              let bodyStr = '';
              req.on('data', chunk => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const body = bodyStr ? JSON.parse(bodyStr) : {};
                  const apiKey = process.env.GEMINI_API_KEY;
                  if (!apiKey) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not defined in environment variables.' }));
                    return;
                  }
                  
                  const { GoogleGenAI } = await import('@google/genai');
                  const ai = new GoogleGenAI({
                    apiKey,
                    httpOptions: {
                      headers: {
                        'User-Agent': 'aistudio-build',
                      },
                    },
                  });
                  
                  if (pathname === '/api/gemini/insights') {
                    const { students, invoices, expenses, leads, tutors } = body;
                    const totalDue = invoices.reduce((acc: number, inv: any) => acc + (inv.totalAmount || 0), 0);
                    const totalCollected = invoices.reduce((acc: number, inv: any) => acc + (inv.paidAmount || 0), 0);
                    const totalDebt = invoices.reduce((acc: number, inv: any) => acc + (inv.remainingAmount || 0), 0);
                    const totalExpenses = expenses.reduce((acc: number, exp: any) => acc + (exp.amount || 0), 0);
                    const netCashflow = totalCollected - totalExpenses;
                    const overdueCount = invoices.filter((i: any) => i.status === 'overdue').length;
                    const newLeadsCount = leads.filter((l: any) => l.status === 'new' || l.status === 'consulting').length;
                    
                    const prompt = `Bạn là Giám đốc Tài chính & Vận hành Chiến lược (CFO & COO) của Hệ thống Giáo dục AN TÂM EDUCATION.
Hãy phân tích dữ liệu hoạt động thực tế sau và đưa ra Báo cáo Phân tích Kinh doanh & Đề xuất hành động theo định dạng JSON hợp lệ:

DỮ LIỆU HIỆN TẠI:
- Tổng số học sinh: ${students.length} (Khối 6, 7, 8, 9)
- Tổng doanh thu học phí dự kiến: ${totalDue.toLocaleString()} đ
- Đã thu: ${totalCollected.toLocaleString()} đ (${((totalCollected / (totalDue || 1)) * 100).toFixed(1)}%)
- Công nợ còn lại: ${totalDebt.toLocaleString()} đ
- Số học sinh quá hạn học phí: ${overdueCount}
- Chi phí vận hành: ${totalExpenses.toLocaleString()} đ
- Dòng tiền ròng hiện tại: ${netCashflow.toLocaleString()} đ
- Tổng số Lead CRM: ${leads.length} (Trong đó ${newLeadsCount} lead mới/đang tư vấn)
- Đội ngũ Trợ giảng/Gia sư: ${tutors.length} người

Hãy trả về JSON theo schema:
{
  "healthScore": number (1-100),
  "executiveSummary": string,
  "keyInsights": [
    { "title": string, "description": string, "impact": "positive"|"warning"|"critical"|"info" }
  ],
  "revenueOptimization": [string],
  "debtRecoveryPlan": [string],
  "enrollmentStrategy": [string],
  "nextMonthForecast": {
    "estimatedRevenue": number,
    "estimatedExpenses": number,
    "expectedNetProfit": number,
    "confidencePercent": number
  }
}
Chỉ trả về chuỗi JSON thuần, không bọc markdown.`;

                    const response = await ai.models.generateContent({
                      model: 'gemini-3.7-flash',
                      contents: prompt,
                    });
                    
                    const text = response.text?.trim() || '';
                    const cleanJson = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    const parsed = JSON.parse(cleanJson);
                    
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(parsed));
                  } else if (pathname === '/api/gemini/quiz') {
                    const { subjectName, grade, topic, questionCount } = body;
                    const prompt = `Tạo bộ ${questionCount || 4} câu hỏi trắc nghiệm khách quan chuẩn chương trình Bộ Giáo Dục Việt Nam cho:
- Môn học: ${subjectName}
- Khối lớp: Lớp ${grade}
- Chủ đề: ${topic}

Yêu cầu trả về định dạng JSON thuần túy (không markdown):
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "content": "Nội dung câu hỏi...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctOptionIndex": 0,
    "points": 2.5,
    "explanation": "Lời giải chi tiết từng bước..."
  }
]`;

                    const response = await ai.models.generateContent({
                      model: 'gemini-3.7-flash',
                      contents: prompt,
                    });
                    
                    const text = response.text?.trim() || '';
                    const cleanJson = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    const parsed = JSON.parse(cleanJson);
                    
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(parsed));
                  } else if (pathname === '/api/gemini/tutor') {
                    const { userQuery, subject, grade } = body;
                    const prompt = `Bạn là Trợ lý Gia sư AI thông minh và tận tâm của Hệ thống AN TÂM EDUCATION.
Môn: ${subject}, Khối: Lớp ${grade}.
Học sinh hoặc Giáo viên hỏi: "${userQuery}".

Hãy giải đáp bằng tiếng Việt với phong cách sư phạm chuẩn mực:
1. Trực quan, dễ hiểu, từng bước rõ ràng.
2. Nêu công thức hoặc định lý áp dụng.
3. Kèm ví dụ minh họa và mẹo ghi nhớ nếu có.
4. Động viên học sinh tự tin học tập.`;

                    const response = await ai.models.generateContent({
                      model: 'gemini-3.7-flash',
                      contents: prompt,
                    });
                    
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ text: response.text || 'Không có phản hồi từ AI.' }));
                  } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Endpoint not found' }));
                  }
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e.message || 'Server error calling Gemini API' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
