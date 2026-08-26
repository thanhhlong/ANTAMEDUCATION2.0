# ANTAM EDUCATION 3.0 — ARCHITECTURE & SECURITY AUDIT

This document outlines the detailed architectural and security audit of the ANTAM EDUCATION 2.0 repository, analyzing its modules, dependencies, data flows, and security posture. It defines the current state and serves as the foundation for the ANTAM EDUCATION 3.0 refactor.

---

## 1. EXECUTIVE SUMMARY

The ANTAM EDUCATION 2.0 codebase is a functional, highly integrated, full-featured web application designed to manage educational centers and academies. It excels at local operations, combining a comprehensive suite of management modules (Students, Parents, Teachers, Tutors, Attendance, Timetable, LMS, CRM, and Finance) with elegant local data cleaning and Excel-based import/export logic.

However, from an architectural and security perspective, the system is configured as an **unauthenticated, client-side monolithic prototype with offline-first emulation**. This presents severe security vulnerabilities and architectural scaling limitations that must be addressed to ensure production-readiness for professional multi-tenant deployments (e.g., Viettel Web Hosting).

---

## 2. CURRENT ARCHITECTURE ANALYSIS

```
                       ANTAM EDUCATION 2.0 ARCHITECTURE
                       
       ┌────────────────────────────────────────────────────────┐
       │                       FRONTEND                         │
       │                                                        │
       │               React + Vite + Tailwind CSS              │
       │                            │                           │
       │                     [Tab Routing]                      │
       │                            │                           │
       │                 Monolithic AppContext                  │
       │                     (1640 lines)                       │
       │                            │                           │
       │             ┌──────────────┴──────────────┐            │
       │             ▼                             ▼            │
       │       LocalStorage                  Firestore Sync     │
       │     (Independent Keys)            (Full Backup Batch)  │
       └─────────────┬─────────────────────────────┬────────────┘
                     │                             │
                     ▼                             ▼
       ┌───────────────────────────┐ ┌───────────────────────────┐
       │     DEVELOPMENT DEV       │ │     PRODUCTION BACKEND    │
       │                           │ │                           │
       │    Vite Config Middleware │ │    Express (app.js/ts)    │
       │  API Proxy (Gemini 3.7)   │ │  API Proxy (Gemini 3.7)   │
       └───────────────────────────┘ └───────────────────────────┘
```

The system transitions between two execution modes:
1. **Development Mode**: Standard React Single-Page Application (SPA) compiled by Vite. API calls to Gemini are captured directly by a custom server plugin configured in `vite.config.ts` (`gemini-api-dev-server`).
2. **Production Mode**: Express server (`app.js` or `server.ts`) serving the compiled React static bundle (`dist/`) while hosting duplicate implementations of the Gemini API endpoints.

### Key Architectural Characteristics:
- **Monolithic State Engine**: All business logic, CRUD mutations, Excel parsing, local storage sync, and data-cleaning triggers are routed through a single 1640-line `AppContext.tsx` file.
- **Tab-Based Routing**: Rather than standard URI-based routing (e.g., React Router), view transitions are managed using an in-memory `activeTab` React state.
- **Offline-First Synchronization**: Differentiating from traditional Firestore applications where CRUD operations occur directly on individual database records (records fetched dynamically on-demand), ANTAM 2.0 loads all database collections at startup, caches them in `localStorage`, and synchronizes the entire database state back to Firestore as a single, compiled snapshot during explicit manual "Lưu đám mây" (Save all database) actions.

---

## 3. COMPONENT & MODULE AUDIT

The project has an exceptionally broad functional scope. The following modules are already implemented and must be carefully preserved and refactored:

1. **Dashboard Analytics (AdminOverview)**: Aggregates KPIs, financial revenue charts (using custom CSS or styling), overdue invoices, CRM leads, and quick action widgets.
2. **Student Manager (StudentManager)**: Direct student database, profile editing, class assignments, enrollment tracking, and fee overrides.
3. **Parents Portal (ParentPortal)**: Dedicated portal allowing parents to track their children's scheduling, attendance, LMS homework status, invoices, and payments.
4. **Teachers Portal (TeacherWorkspace)**: Workspaces for teachers to view schedules, log classroom attendance, assign homework, and input grades.
5. **Tutor Management (TutorManager)**: Database of student tutors and teaching assistants, including qualifications, subjects can teach, hourly rates, availability matrices, and contract statuses.
6. **Custom Tutoring Coordinator (CustomTutoringManager)**: Matches students' specific tutoring requests with tutors based on availability and subject matches.
7. **Timetable Scheduler (TimetableManager)**: Scheduling calendar for classes, sessions, subjects, rooms, and assigned teachers.
8. **Classroom Attendance (AttendanceManager)**: Session-by-session check-ins (Present, Late, Excused, Absent) with audit time-logging and face verification mock interfaces.
9. **LMS E-Learning (LMSManager)**: Course lessons, attachments, PDF/video materials, homework assignments, student answer submissions, grading interfaces, and feedback logs.
10. **Finance Ledger (FinanceManager)**: Central accounting hub for invoices, payments, payment transactions, expenses tracking, and revenue logs.
11. **Teacher Payroll (TeacherPayroll)**: Automated teacher salary calculation based on logged hours, class sessions, and hourly wages.
12. **CRM Admissions Pipeline (CrmManager)**: Consultations pipeline and lead cards categorized by progression columns (`NEW`, `CONTACTED`, `CONSULTING`, `TRIAL_SCHEDULED`, `ENROLLED`, `TUITION_PAID`).
13. **Data Diagnostics & Cleaner (DataCleanerModal)**: Standardizes Vietnamese text, reformats phone prefixes to `0`, audits tuition math, and identifies duplicates.
14. **Excel Module (ExcelModals)**: Highly flexible parsing engine to import/export student databases, lead files, and expense receipts via spreadsheet spreadsheets.

---

## 4. DEPENDENCY & PLATFORM ANALYSIS

### Dependency Graph (Defined in `package.json`):
- **Core Framework**: `react` (v19.0.1) & `react-dom` (v19.0.1).
- **Compilation Tooling**: `vite` (v6.2.3), `@tailwindcss/vite` (v4.1.14), `esbuild` (v0.25.0), and `tsx` (v4.21.0).
- **Core Dependencies**:
  - `@google/genai` (v2.4.0) — Modern official Google Gemini SDK.
  - `firebase` (v12.18.0) — Client SDK for authentication and Firestore storage.
  - `express` (v4.21.2) — Production server framework.
  - `lucide-react` (v0.546.0) — Icon set.
  - `motion` (v12.23.24) — Animations library (imported from `motion/react`).
  - `xlsx` (v0.18.5) — Spreadsheet processor (SheetJS).
  - `dotenv` (v17.2.3) — Server configuration settings.

### Target Environment:
- **Local/Development**: Vite Dev Server on Port 3000.
- **Production (Viettel Web Hosting / Cloud Run)**: Node.js standard environment running Express backend (serving `dist/` and exposing `/api/*` proxies) starting via `app.js` on Port 3000.

---

## 5. SEVERE ARCHITECTURAL & SECURITY DEFECTS

During our analysis, several critical vulnerabilities and architectural bugs were uncovered that prevent production deployment in their current state:

### ⚠️ Security Defect 1: Completely Open Firestore Database Rules
- **Vulnerability**: The `/firestore.rules` file contains:
  ```javascript
  match /{document=**} {
    allow read, write: if true;
  }
  ```
- **Severity**: **CRITICAL**. Anyone with the Firebase config (which is publicly readable in client-side JS bundles) can read, modify, or permanently delete the entire cloud database of all schools, students, and financial records.

### ⚠️ Security Defect 2: Plaintext Password Exposure & Emulated Authentication
- **Vulnerability**: There is no actual authentication server-side or via Firebase Auth. The "authentication" mechanism consists of querying the global `users` collection, matching the user-inputted password in raw plaintext (`user.password === inputPassword`), and saving the logged-in user's details into unencrypted `localStorage` keys.
- **Severity**: **CRITICAL**. Plaintext passwords are vulnerability vectors. Session stealing is trivial.

### ⚠️ Security Defect 3: Absolute Lack of Tenant Isolation
- **Vulnerability**: Every single query fetches records globally. There is no concept of `organizationId` or `tenantId`. Data from different branches, campuses, or independent tutoring centers are fully blended in a single pool, exposing everyone's data to everyone else.
- **Severity**: **CRITICAL**.

### ⚠️ Security Defect 4: Parent & Student Access Trait Violations
- **Vulnerability**: The "Parent Portal" and "Student Portal" screens determine which student data to display using local UI state variables. If a malicious student or parent overrides local parameters in the browser console, they can view or edit financial and grade sheets of any student in the entire database.
- **Severity**: **CRITICAL**.

### 🛠️ Architectural Debt 5: Server Logic Duplication
- **Defect**: The Gemini AI proxying and health status endpoints are duplicated. They are written as custom Connect middleware in `vite.config.ts` (active during `npm run dev`) and written as Express route definitions in `app.js` and `server.ts` (active during `npm run start`). This leads to desynchronization bugs and heavy maintenance drag.
- **Severity**: **MEDIUM-HIGH**.

### 🛠️ Architectural Debt 6: The "Save All" Sync Bottleneck
- **Defect**: Saving any change (e.g., adding a single class session, changing a grade) requires committing a bulk upload of the entire database in a sequence of large write-batches. As the school's dataset grows (e.g., 10,000+ records), this snapshot sync strategy will trigger severe performance degradation, network timeouts, and extremely expensive Firebase pricing bills.
- **Severity**: **MEDIUM-HIGH**.

### 🛠️ Architectural Debt 7: Giant Monolithic AppContext
- **Defect**: Consolidating all functions in `AppContext.tsx` creates a file that is highly fragile, slow to compile, and extremely difficult for multiple developers to modify simultaneously without causing git merge conflicts.
- **Severity**: **MEDIUM**.

---

## 6. FILES AUDIT MATRIX

The following table tracks the disposition of all current and planned files for the transition to ANTAM EDUCATION 3.0:

| File / Folder Path | Action | Role in 3.0 | Justification |
| :--- | :--- | :--- | :--- |
| `/package.json` | **REFACTOR** | Dependency & Script Specs | Configure compile/bundle commands for Express + React. |
| `/vite.config.ts` | **REFACTOR** | Bundling Config Only | Clean up duplicated dev-server Gemini proxying middleware. |
| `/firestore.rules` | **REPLACE** | Secure Security Rules | Restructure to enforce Auth, RBAC, and Tenant isolation. |
| `/app.js` | **DELETE** | *Obsolete* | Consolidate and replace with TypeScript-based unified server. |
| `/server.ts` | **REFACTOR** | Unified Backend Entry | Become the single production startup script for the server. |
| `/src/App.tsx` | **REFACTOR** | Core Router Component | Integrate React Router and clean up local mock routes. |
| `/src/context/AppContext.tsx` | **MOVE & DEPRECATE**| *Migration Target* | Gradually move functions into hooks/repositories, then delete. |
| `/src/services/firebase.ts` | **REFACTOR** | Firebase Client Init | Configure safe initialization and client-side auth state. |
| `/src/services/auditService.ts`| **REPLACE** | Unified Audit Logger | Replace local in-memory mock logs with secure backend API logs. |
| `/src/app/` | **CREATE** | Main App Core Config | Core permissions map, constant parameters, and React Router routing. |
| `/src/features/` | **CREATE** | Feature-based Modules | Split the app into self-contained directory modules (Students, Finance, LMS, etc.) |
| `/src/hooks/` | **CREATE** | Custom State Hooks | Decentralize `AppContext` (e.g., `useStudents`, `useFinance`, `useLMS`). |
| `/src/services/auth/` | **CREATE** | Auth Services | Implement Firebase Authentication wrappers. |
| `/src/services/firebase/repos/`| **CREATE** | Repository Layer | Implement CRUD-by-record database operations. |
| `/tests/` | **CREATE** | Testing Suite | Establish core verification scripts for Security, Units, and APIs. |

---

## 7. MIGRATION GOALS & VERIFICATION CRITERIA

ANTAM EDUCATION 3.0 will be structurally robust, completely secure, and optimized for low-latency operations.

### Verification Matrix:
- **Build Outcome**: Seamless compilation via `npm run build` and zero TypeScript linter failures.
- **Identity Isolation**: All database operations include an encrypted `organizationId` payload checked at the database layer.
- **Vulnerability Mitigation**: 100% of plain-text passwords and open database access rules are eliminated.
- **Operational Auditability**: All actions logged immutably via the Audit log endpoint.
- **Backward Compatibility**: Fully load and reconcile existing v2 LocalStorage states safely during first-run migrations.

---
*Prepared by Google AI Studio Principal Architect — August 2026*
