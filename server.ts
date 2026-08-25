import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = Number(process.env.PORT) || 3000;

  // Initialize GoogleGenAI (Gemini AI API)
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      system: 'AN TAM EDUCATION Management System',
      geminiConfigured: !!ai,
    });
  });

  // API: AI Business & Financial Insights
  app.post('/api/gemini/insights', async (req, res) => {
    const { students = [], invoices = [], expenses = [], leads = [], tutors = [] } = req.body;

    const totalDue = invoices.reduce((acc: number, inv: any) => acc + (inv.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((acc: number, inv: any) => acc + (inv.paidAmount || 0), 0);
    const totalDebt = invoices.reduce((acc: number, inv: any) => acc + (inv.remainingAmount || 0), 0);
    const totalExpenses = expenses.reduce((acc: number, exp: any) => acc + (exp.amount || 0), 0);
    const netCashflow = totalCollected - totalExpenses;
    const overdueCount = invoices.filter((i: any) => i.status === 'overdue').length;
    const newLeadsCount = leads.filter((l: any) => l.status === 'new' || l.status === 'consulting').length;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    try {
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
      return res.json(parsed);
    } catch (err: any) {
      console.error('Gemini Insights call failed:', err);
      return res.status(500).json({ error: err.message || 'Failed to call Gemini API' });
    }
  });

  // API: AI Quiz Generator
  app.post('/api/gemini/quiz', async (req, res) => {
    const { subjectName, grade, topic, questionCount } = req.body;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    try {
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
      return res.json(parsed);
    } catch (err: any) {
      console.error('Gemini Quiz generation failed:', err);
      return res.status(500).json({ error: err.message || 'Failed to call Gemini API' });
    }
  });

  // API: AI Socratic Tutor Assistant
  app.post('/api/gemini/tutor', async (req, res) => {
    const { userQuery, subject, grade } = req.body;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    try {
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

      return res.json({ text: response.text || 'Không có phản hồi từ AI.' });
    } catch (err: any) {
      console.error('Gemini Tutor failed:', err);
      return res.status(500).json({ error: err.message || 'Failed to call Gemini API' });
    }
  });

  const distPath = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' && hasDist) {
    // Serve static assets in production
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development mode or on-the-fly Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
