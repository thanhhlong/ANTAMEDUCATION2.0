import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize GoogleGenAI
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

// Endpoint for Business Insights
app.post('/api/gemini/insights', async (req, res) => {
  const { students, invoices, expenses, leads, tutors } = req.body;

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

// Endpoint for Quiz Generation
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

// Endpoint for AI Tutor
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

// Serve static assets in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// For SPA routing, redirect all other requests to index.html or helpful instructions
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <title>AN TÂM EDUCATION - Khởi động máy chủ</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
        .box { background: #1e293b; padding: 32px; border-radius: 16px; border: 1px solid #334155; max-width: 540px; }
        h1 { color: #6366f1; margin-top: 0; font-size: 22px; }
        p { color: #94a3b8; line-height: 1.6; font-size: 14px; }
        code { background: #0f172a; color: #38bdf8; padding: 3px 8px; border-radius: 6px; font-size: 13px; }
        .cmd-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin: 16px 0; text-align: left; font-family: monospace; color: #a5f3fc; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Hệ Thống AN TÂM EDUCATION</h1>
        <p>Máy chủ Node.js Backend đang chạy tại cổng <strong>3000</strong>. Để xem giao diện ứng dụng web React, bạn có 2 cách khởi động:</p>
        
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Cách 1 (Chế độ phát triển Dev - Đề xuất):</strong></p>
          <div class="cmd-box">npm run dev</div>
          
          <p><strong>Cách 2 (Chế độ sản xuất Production):</strong></p>
          <div class="cmd-box">npm run build<br/>npm run start</div>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
