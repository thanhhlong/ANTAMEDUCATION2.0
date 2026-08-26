# ANTAM EDUCATION 3.0 — SYSTEM MIGRATION PLAN

This document outlines the detailed, step-by-step migration plan for upgrading ANTAM EDUCATION from version 2.0 to 3.0. It defines the implementation roadmap, file transformation matrix, and safe deprecation strategy for the monolithic `AppContext.tsx`.

---

## 1. STRATEGIC REFACTORING TIMELINE (13 PHASES)

The upgrade will be executed incrementally in 13 self-contained phases. This prevents breaking compilation and allows continuous validation of business rules.

```
                           MIGRATION PIPELINE
                           
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  PHASE 1: AUDIT & TAG   │ ──>  │ PHASE 2: AUTH & RBAC   │ ──>  │ PHASE 3: SECURE RULES  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                             │
┌────────────────────────┐      ┌────────────────────────┐                   ▼
│  PHASE 6: BACKEND RENEW │ <──  │  PHASE 5: STATE SPLIT   │ <──  │ PHASE 4: REPO PATTERN  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
            │
            ▼
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  PHASE 7: CORE DOMAINS │ ──>  │ PHASE 8: PORTAL VIEWS  │ ──>  │ PHASE 9: ACADEMIC LMS  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                                                             │
┌────────────────────────┐      ┌────────────────────────┐                   ▼
│ PHASE 12: SECURITY TEST│ <──  │ PHASE 11: ALERTS & REPS│ <──  │ PHASE 10: AI PLATFORM  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
            │
            ▼
┌────────────────────────┐
│ PHASE 13: VIETTEL DEPLOY│
└────────────────────────┘
```

- **PHASE 1: Audit & Snapshot Tagging** (COMPLETE)
  - Verify repository structure, analyze data synchronization, set up local Git tracking, and commit the tagged backup `ANTAM-2.0-BEFORE-V3`.
- **PHASE 2: Firebase Authentication & RBAC Engine**
  - Integrate Firebase Auth (email/password, password resets, session persistence). Establish client-side Auth Context (`AuthContext`), roles, and custom custom permissions hooks (`usePermission`).
- **PHASE 3: Database Security Configuration (firestore.rules)**
  - Implement secure rules in `firestore.rules` preventing unauthenticated access, isolating data by `organizationId`, and locking parent/student queries to authorized entities.
- **PHASE 4: Document Repository Pattern**
  - Create repository classes (`studentRepository.ts`, `invoiceRepository.ts`, etc.) to handle individual record CRUD operations on Firestore, abandoning the heavy bulk snapshot uploads.
- **PHASE 5: Monolithic AppContext Migration**
  - Tách (split) `AppContext` into focused custom hooks (`useStudents`, `useFinance`, `useLMS`, etc.). Support coexistence of legacy context and modular hooks to guarantee backward compatibility.
- **PHASE 6: Backend Architecture & Server Refactor**
  - Establish standard backend folders (`server/`). Move Gemini API handlers from Vite config to Express controllers, clean up server duplicates, and set up the `/api/health` diagnostics.
- **PHASE 7: Refactor Core Business Domains**
  - Move frontend views and services of Student, CRM, and Finance into their modular folders inside `/src/features/`.
- **PHASE 8: Portal Layout Views**
  - Refactor Parent, Student, and Teacher portals to load personalized, isolated dashboards rather than querying global state.
- **PHASE 9: LMS, Timetable & Attendance upgrade**
  - Improve learning analytics on the LMS. Implement double-booking conflict checks inside the Timetable scheduler.
- **PHASE 10: Gemini AI Platform Integration**
  - Consolidate AI services, logging tokens, daily API rate-limiting quotas, and usage dashboards.
- **PHASE 11: Real-time Notifications & Reports Hub**
  - Setup modular administrative and learning activity notifications and charts.
- **PHASE 12: Automated Security Testing**
  - Write test cases for authentication, RBAC permission doors, and data isolation boundaries.
- **PHASE 13: Production Deployment to Viettel Hosting**
  - Build script bundles and verify production startup using `npm run build && npm start`.

---

## 2. FILE TRANSFORMATION MATRIX

This matrix details the migration path of every major system file, categorized by action: `KEEP`, `REFACTOR`, `MOVE`, `REPLACE`, or `DELETE`.

| Current File | Action | New File | Reason |
| :--- | :--- | :--- | :--- |
| `/package.json` | **REFACTOR** | `/package.json` | Update build, compile, and startup script definitions. |
| `/vite.config.ts` | **REFACTOR** | `/vite.config.ts` | Eliminate the duplicate Gemini development server middleware. |
| `/app.js` | **DELETE** | *Obsolete* | Consolidate and replace with TypeScript-based unified server. |
| `/server.ts` | **REFACTOR** | `/server.ts` | Turn into a clean, bundled node production startup server. |
| `/firestore.rules` | **REPLACE** | `/firestore.rules` | Replace `allow read, write: if true` with strict isolated controls. |
| `/src/App.tsx` | **REFACTOR** | `/src/app/App.tsx` | Add React Router routing and role-based Route Guards. |
| `/src/context/AppContext.tsx` | **MOVE & DEPRECATE** | `/src/app/providers.tsx` | Split into sub-hooks, keep standard global states, deprecate v2 logic. |
| `/src/services/firebase.ts` | **REFACTOR** | `/src/services/firebase/client.ts` | Standardize Firestore initialization and handle offline mode. |
| `/src/services/auditService.ts` | **REPLACE** | `/src/services/api/auditService.ts` | Proxy logs to the backend database rather than saving raw local arrays. |
| `/src/utils/dataCleaner.ts` | **MOVE** | `/src/utils/data-cleaner/cleaner.ts` | Relocate to isolated utilities directory. |
| `/src/utils/excelParser.ts` | **MOVE** | `/src/utils/excel/parser.ts` | Relocate to standard Excel directory without breaking imports. |

---

## 3. MONOLITHIC `APPCONTEXT` DECOMPOSITION BLUEPRINT

Decomposing a 1640-line context file while keeping the system stable requires a careful **Coexistence and Proxying** approach:

```
                      MIGRATION STATE BRIDGE
                      
         [Legacy View Components]      [New Feature Modules]
                    │                            │
                    ▼                            ▼
           ┌─────────────────┐          ┌─────────────────┐
           │ Legacy Context  │ <──────  │   useStudents   │
           │ (State Proxy)   │  Bridge  │   useFinance    │
           │                 │          │   useLMS, etc.  │
           └─────────────────┘          └─────────────────┘
                    │                            │
                    ▼                            ▼
               LocalStorage                 Firestore Repo
```

### Steps for Decomposition:
1. **Isolate state domain-by-domain**: Create focused hooks in `/src/hooks/` (e.g., `useStudents.ts`).
2. **Move mutation logic inside repositories**: Create repos in `/src/services/firebase/repositories/` to conduct CRUD by record.
3. **Bridge within legacy context**: Refactor `AppContext.tsx` to call these new hooks internally and proxy their states, so any component still using `useApp()` continues to function.
4. **Iterative file replacement**: Refactor components one-by-one to import `useStudents()` or `useFinance()` directly instead of `useApp()`.
5. **Final Clean Up**: When `AppContext.tsx` is only proxying empty declarations, delete the file and replace it with clean, isolated provider files (`/src/app/providers.tsx`).

---

## 4. BACKWARD COMPATIBILITY & DATA CONVERSION

To ensure zero downtime and prevent data loss for existing users:
- **Client Hydration Bridge**: At startup, if the client has a legacy LocalStorage database state (`antam_education_app_state_v3`), a migration script will transform the raw data models, append a unique `organizationId`, upload individual records to Firestore, and clear the legacy key.
- **Model Preserves**: Standard parameters like student codes (`AT-K8-012`), invoices codes, and timeline details are strictly preserved during the schema transition.

---
*Prepared by Google AI Studio Principal Architect — August 2026*
