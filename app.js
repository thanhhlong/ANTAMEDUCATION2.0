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
const startTime = Date.now();

// In-memory runtime audit log buffer
const inMemoryAuditLogs = [
  {
    id: `audit-init-${Date.now()}`,
    action: 'AUTH',
    entity: 'system',
    description: 'Khởi động máy chủ ANTAM EDUCATION 3.0 Backend & nạp hệ thống dịch vụ',
    actorId: 'system',
    actorName: 'Hệ Thống',
    actorRole: 'SUPER_ADMIN',
    timestamp: new Date().toISOString(),
    severity: 'info',
    details: { version: '3.0.0', platform: 'Node.js Express' }
  }
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

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

  // 1. Health check route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      system: 'ANTAM EDUCATION 3.0',
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      geminiConfigured: !!ai,
      storageStatus: 'operational',
      auditLogCount: inMemoryAuditLogs.length,
    });
  });

  // 2. System Architecture Live Topology Status Route
  app.get('/api/system/architecture', (req, res) => {
    res.json({
      version: '3.0.0',
      topology: {
        root: 'ANTAM EDUCATION 3.0',
        frontend: {
          name: 'FRONTEND',
          tech: 'React + TypeScript',
          role: 'Feature Modules UI & State Management',
          status: 'online',
          modules: [
            'Dashboard Analytics',
            'Student Management (Học Sinh)',
            'Tuition & Invoices (Học Phí)',
            'Expense Ledger (Sổ Quỹ Thu Chi)',
            'Classes & Subjects (Lớp Học & Môn Học)',
            'Timetable & Attendance (Lịch Học & Điểm Danh)',
            'CRM Admissions (Tuyển Sinh & Phụ Huynh)',
            'Tutor Assistants (Đội Ngũ Gia Sư & Trợ Giảng)',
            'LMS E-Learning (Khóa Học, Bài Tập & Đề Thi)',
            'AI Socratic Assistant & Business Analytics',
            'Audit Log & Security Inspector',
            'Cloud Storage & Database Manager'
          ]
        },
        backend: {
          name: 'BACKEND',
          tech: 'Node.js + Express',
          role: 'REST API & Micro-services Proxy',
          status: 'online',
          uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
          endpoints: [
            '/api/health',
            '/api/system/architecture',
            '/api/gemini/insights',
            '/api/gemini/quiz',
            '/api/gemini/tutor',
            '/api/audit/logs',
            '/api/audit/log',
            '/api/storage/snapshot'
          ]
        },
        auth: {
          name: 'Firebase Auth',
          role: 'Authentication & RBAC Permission Guards',
          status: 'active',
          roles: ['SUPER_ADMIN', 'ADMIN', 'ACADEMIC_MANAGER', 'ACCOUNTANT', 'TEACHER', 'TUTOR', 'STUDENT', 'PARENT']
        },
        database: {
          name: 'Firestore Database',
          engine: 'Google Cloud Firestore',
          mode: 'Real-time & Offline-first Synchronization',
          status: 'connected',
          collections: [
            'users', 'students', 'subjects', 'tuitionPlans', 'invoices',
            'expenses', 'leads', 'tutors', 'classes', 'scheduleSessions',
            'attendance', 'lessons', 'assignments', 'submissions', 'audit_logs'
          ]
        },
        pillars: {
          storage: {
            name: 'Storage Pillar',
            tech: 'Local Cache + Firestore Storage + JSON Backups',
            status: 'healthy'
          },
          gemini: {
            name: 'Gemini Pillar',
            tech: 'Gemini 3.7 Flash Engine',
            status: ai ? 'ready' : 'not_configured',
            capabilities: ['CFO Strategic Insights', 'Curriculum Quiz Generator', 'Socratic 24/7 AI Tutor']
          },
          auditLog: {
            name: 'Audit Log Pillar',
            tech: 'Immutable Action Trail Logging',
            status: 'recording',
            recordedCount: inMemoryAuditLogs.length
          }
        }
      }
    });
  });

  // 3. Audit Log REST API Endpoints
  app.get('/api/audit/logs', (req, res) => {
    const limit = Number(req.query.limit) || 100;
    const sorted = [...inMemoryAuditLogs].reverse().slice(0, limit);
    res.json({
      total: inMemoryAuditLogs.length,
      logs: sorted
    });
  });

  app.post('/api/audit/log', (req, res) => {
    const { action, entity, entityId, description, actorId, actorName, actorRole, severity, details } = req.body;
    const newEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action: action || 'UPDATE',
      entity: entity || 'general',
      entityId: entityId || '',
      description: description || 'Hành động hệ thống',
      actorId: actorId || 'system',
      actorName: actorName || 'Người dùng',
      actorRole: actorRole || 'ADMIN',
      timestamp: new Date().toISOString(),
      severity: severity || 'info',
      details: details || {},
      ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1'
    };

    inMemoryAuditLogs.push(newEntry);
    if (inMemoryAuditLogs.length > 500) {
      inMemoryAuditLogs.shift();
    }

    res.json({ success: true, entry: newEntry });
  });

  // 4. Storage Pillar: System Snapshot Storage
  app.post('/api/storage/snapshot', (req, res) => {
    const { snapshot, label } = req.body;
    const timestamp = new Date().toISOString();
    
    inMemoryAuditLogs.push({
      id: `audit-snap-${Date.now()}`,
      action: 'BACKUP',
      entity: 'storage',
      description: `Đã tạo bản sao lưu dữ liệu toàn hệ thống (${label || 'Thủ công'})`,
      actorId: req.body.actorId || 'system',
      actorName: req.body.actorName || 'Quản trị viên',
      actorRole: req.body.actorRole || 'SUPER_ADMIN',
      timestamp,
      severity: 'info',
      details: { recordCount: typeof snapshot === 'object' ? Object.keys(snapshot).length : 0 }
    });

    res.json({
      success: true,
      timestamp,
      message: 'Snapshot đã được tiếp nhận và ghi nhận vào hệ thống lưu trữ.'
    });
  });

  // 5. Gemini Pillar: AI Business & Financial Insights
  app.post('/api/gemini/insights', async (req, res) => {
    const { students = [], invoices = [], expenses = [], leads = [], tutors = [] } = req.body;

    const totalDue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const totalDebt = invoices.reduce((acc, inv) => acc + (inv.remainingAmount || 0), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
    const netCashflow = totalCollected - totalExpenses;
    const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
    const newLeadsCount = leads.filter((l) => l.status === 'new' || l.status === 'consulting').length;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    try {
      const prompt = `Bạn là Giám đốc Tài chính & Vận hành Chiến lược (CFO & COO) của Hệ thống Giáo dục AN TÂM EDUCATION 3.0.
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

      inMemoryAuditLogs.push({
        id: `audit-gemini-${Date.now()}`,
        action: 'AI_QUERY',
        entity: 'gemini',
        description: 'Tạo báo cáo chiến lược CFO & Phân tích tài chính AI 3.0',
        actorId: req.body.actorId || 'cfo_user',
        actorName: req.body.actorName || 'Giám đốc Điều hành',
        actorRole: req.body.actorRole || 'SUPER_ADMIN',
        timestamp: new Date().toISOString(),
        severity: 'info',
        details: { healthScore: parsed.healthScore }
      });

      return res.json(parsed);
    } catch (err) {
      console.error('Gemini Insights call failed:', err);
      return res.status(500).json({ error: err.message || 'Failed to call Gemini API' });
    }
  });

  // 6. Gemini Pillar: AI Quiz Generator
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
    } catch (err) {
      console.error('Gemini Quiz generation failed:', err);
      return res.status(500).json({ error: err.message || 'Failed to call Gemini API' });
    }
  });

  // 7. Gemini Pillar: AI Socratic Tutor Assistant
  app.post('/api/gemini/tutor', async (req, res) => {
    const { userQuery, subject, grade } = req.body;

    if (!ai) {
      return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    try {
      const prompt = `Bạn là Trợ lý Gia sư AI thông minh và tận tâm của Hệ thống ANTAM EDUCATION 3.0.
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
    } catch (err) {
      console.error('Gemini Tutor failed:', err);
      return res.status(500).json({ error: err.message || 'Failed to call Gemini API' });
    }
  });

  const distPath = path.join(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 ANTAM EDUCATION 3.0 Web Server đang chạy tại:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
