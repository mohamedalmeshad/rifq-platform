# Rifq Platform — REST API Contract (v1.5)

**Architecture:** Modular Monolith (Node.js / Express + MongoDB)  
**Protocol:** Stateless RESTful JSON API (Multi-Platform: React RTL Web SPA & Flutter/React Native Mobile App)  
**Base URL:** `https://api.rifq.app/api/v1` (Local: `http://localhost:5000/api/v1`)

---

## 1. Global API Standards

### 1.1 Required Headers
| Header | Required | Description |
| :--- | :---: | :--- |
| `Content-Type` | Yes | `application/json` |
| `Accept-Language` | Optional | `ar` (default) or `en` for localized error/response messages |
| `Authorization` | Protected Routes | `Bearer <JWT_ACCESS_TOKEN>` |

### 1.2 Security & Scope Isolation (Server-Side RBAC)
* **Roles:** `ADMIN` | `MANAGER` | `TEACHER` | `STUDENT` | `PARENT`
* **Zero-Trust Scoping:** `userId`, `role`, `branchId`, and `academyId` are strictly extracted from the verified JWT payload on the server. Client-supplied scope overrides are rejected with `403 Forbidden`.
* **Pagination:** All list (`GET`) endpoints support query parameters: `?page=1&limit=20&sort=-createdAt` (default `limit=20`, max `100`).

### 1.3 Standard Response Envelopes

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 145,
    "totalPages": 8
  }
}
```
*(Note: `pagination` is included only on paginated list endpoints.)*

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "QURAN_INVALID_AYAH_RANGE",
    "message": "Invalid ayah range for Surah Al-Baqarah (max 286 ayahs).",
    "details": [
      {
        "field": "endAyah",
        "issue": "Must be between startAyah (1) and 286"
      }
    ]
  }
}
```

---

## 2. Standardized Error Codes Reference

| HTTP Status | Error Code (`error.code`) | Trigger Condition |
| :---: | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Missing required fields or malformed types (`ObjectId`, `Date`, `Email`). |
| `400` | `QURAN_INVALID_AYAH_RANGE` | Surah out of bounds (`1–114`), `startAyah > endAyah`, or `endAyah > totalAyahs(surah)`. |
| `400` | `STUDENT_GUARDIAN_REQUIRED` | Enrolling a minor student (`age < 18`) without valid `parentIds[]`. |
| `400` | `REVISION_PLAN_IMMUTABLE` | Attempting to modify or reopen a `COMPLETED` or `CANCELLED` revision plan. |
| `401` | `AUTH_INVALID_CREDENTIALS` | Incorrect email or password. |
| `401` | `AUTH_TOKEN_EXPIRED` | Expired JWT (8-hour TTL) or revoked/blacklisted token. |
| `403` | `AUTH_ACCOUNT_LOCKED` | Account temporarily locked after 5 consecutive failed logins (returns `lockUntil`). |
| `403` | `AUTH_ACCOUNT_INACTIVE` | User account is deactivated (`status: INACTIVE`). |
| `403` | `RBAC_FORBIDDEN` | Authenticated role lacks permission for the requested action. |
| `403` | `SCOPE_BRANCH_ISOLATION` | Cross-branch access attempt or teacher accessing an unassigned group/student. |
| `404` | `RESOURCE_NOT_FOUND` | Requested resource ID does not exist. |
| `409` | `DUPLICATE_RESOURCE` | Unique constraint conflict (e.g., duplicate email or branch name). |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests from the same IP/client. |

---

## 3. Module 1: Authentication & Security (`/auth`)

| Method | Endpoint | Allowed Roles | Description |
| :---: | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Authenticate user, enforce lockout policy, persist `fcmToken`, issue 8h JWT |
| `POST` | `/auth/logout` | All Authenticated | Blacklist active JWT and unregister device `fcmToken` |
| `GET` | `/auth/me` | All Authenticated | Retrieve authenticated user profile, role, and branch scope |
| `PATCH` | `/auth/change-password` | All Authenticated | Update password after verifying current `bcrypt` hash |
| `POST` | `/auth/fcm-token` | All Authenticated | Register or refresh Firebase Cloud Messaging token (Web/Mobile) |

### Example: `POST /api/v1/auth/login`
**Request:**
```json
{
  "email": "teacher.ahmad@rifq.app",
  "password": "StrongPassword@123",
  "fcmToken": "fcm_device_token_xyz_optional"
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "8h",
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c01",
      "email": "teacher.ahmad@rifq.app",
      "role": "TEACHER",
      "branchId": "665f1a2b3c4d5e6f7a8b9c10",
      "academyId": "665f1a2b3c4d5e6f7a8b9c00",
      "profileId": "665f1a2b3c4d5e6f7a8b9c22",
      "fullName": "Ahmad Mahmoud"
    }
  }
}
```

---

## 4. Module 2: Governance & Identity (`/branches`, `/students`, `/teachers`, `/parents`, `/audits`)

| Method | Endpoint | Allowed Roles | Description |
| :---: | :--- | :--- | :--- |
| `GET` | `/branches` | `ADMIN` | List all academy branches |
| `POST` | `/branches` | `ADMIN` | Create a new branch and assign `managerUserId` |
| `PATCH` | `/branches/:id` | `ADMIN` | Update branch metadata or toggle `ACTIVE`/`INACTIVE` status |
| `GET` / `POST` | `/teachers` | `ADMIN`, `MANAGER` | List or register teachers (branch-scoped for `MANAGER`) |
| `GET` / `POST` | `/parents` | `ADMIN`, `MANAGER` | List or register guardian accounts |
| `GET` | `/students` | `ADMIN`, `MANAGER`, `TEACHER` | List students (scoped by branch or assigned groups) |
| `POST` | `/students` | `ADMIN`, `MANAGER` | Enroll student with age-based guardian rule & multi-track group sync |
| `GET` / `PATCH` | `/students/:id` | `ADMIN`, `MANAGER` | View or update student profile, secondary tracks, and linked parents |
| `PATCH` | `/users/:id/status` | `ADMIN`, `MANAGER` | Activate, deactivate, or unlock a user account |
| `GET` | `/audits` | `ADMIN`, `MANAGER` | Query `SystemAudits` logs (branch-scoped for `MANAGER`) |

### Example: `POST /api/v1/students` (Conditional Guardian Enrollment)
* **Business Rule:** If `age < 18`, server sets `isIndependent = false` and enforces non-empty valid `parentIds[]` (syncing `Parents.studentIds[]`). If `age >= 18`, `isIndependent = true` and `parentIds[]` is optional.

**Request:**
```json
{
  "fullName": "Omar Khaled Hassan",
  "email": "omar.student@rifq.app",
  "dateOfBirth": "2012-05-14",
  "primaryGroupId": "665f1a2b3c4d5e6f7a8b9c30",
  "secondaryGroupIds": ["665f1a2b3c4d5e6f7a8b9c31"],
  "parentIds": ["665f1a2b3c4d5e6f7a8b9c40"],
  "guardianContact": {
    "name": "Khaled Hassan",
    "phone": "+201001234567",
    "relation": "FATHER"
  }
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Student enrolled and synced with groups and guardians",
  "data": {
    "student": {
      "_id": "665f1a2b3c4d5e6f7a8b9c50",
      "userId": "665f1a2b3c4d5e6f7a8b9c51",
      "fullName": "Omar Khaled Hassan",
      "isIndependent": false,
      "branchId": "665f1a2b3c4d5e6f7a8b9c10",
      "primaryGroupId": "665f1a2b3c4d5e6f7a8b9c30",
      "secondaryGroupIds": ["665f1a2b3c4d5e6f7a8b9c31"],
      "parentIds": ["665f1a2b3c4d5e6f7a8b9c40"],
      "status": "ACTIVE"
    },
    "temporaryPassword": "Rifq#8492"
  }
}
```

---

## 5. Module 3: Academic Operations (`/groups`, `/sessions`, `/attendance`, `/online-classes`)

| Method | Endpoint | Allowed Roles | Description |
| :---: | :--- | :--- | :--- |
| `GET` / `POST` | `/groups` | `ADMIN`, `MANAGER`, `TEACHER`(GET) | Manage multi-track groups (`QURAN`, `TAJWEED`, `GENERAL`) |
| `PATCH` | `/groups/:id` | `ADMIN`, `MANAGER` | Update group schedule, assigned teacher, or roster |
| `GET` / `POST` | `/sessions` | `TEACHER`, `MANAGER` | Create or list sessions (`MEM`, `REV`, `EVAL`, `ONLINE`, `LESSON`) |
| `POST` | `/sessions/:sessionId/attendance` | `TEACHER` | Bulk-record attendance for a session |
| `GET` | `/students/:studentId/attendance` | All (Scoped) | Retrieve student attendance log and overall attendance percentage |
| `GET` / `POST` | `/online-classes` | `TEACHER`, `MANAGER`, `STUDENT`(GET) | Schedule external Zoom/Google Meet links associated with a group/session |

### Example: `POST /api/v1/sessions/:sessionId/attendance` (Bulk Attendance)
**Request:**
```json
{
  "records": [
    {
      "studentId": "665f1a2b3c4d5e6f7a8b9c50",
      "status": "PRESENT",
      "notes": ""
    },
    {
      "studentId": "665f1a2b3c4d5e6f7a8b9c52",
      "status": "ABSENT",
      "notes": "Unexcused absence"
    }
  ]
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Attendance recorded for 2 students",
  "data": {
    "sessionId": "665f1a2b3c4d5e6f7a8b9c60",
    "summary": {
      "present": 1,
      "absent": 1,
      "late": 0,
      "excused": 0
    }
  }
}
```

---

## 6. Module 4: Quran Progress, Smart Revision Engine & Analytics

| Method | Endpoint | Allowed Roles | Description |
| :---: | :--- | :--- | :--- |
| `POST` | `/sessions/:sessionId/quran-progress` | `TEACHER` | Log daily memorization/revision with strict Surah & Ayah bounds validation |
| `GET` | `/students/:studentId/quran-progress` | All (Scoped) | Retrieve Quran progress history (filterable by `surah`, `type`, date range) |
| `POST` | `/revision-plans/generate` | `TEACHER` | Execute RPI algorithm (AI-Ready service) to create a `DRAFT` revision plan |
| `PATCH` | `/revision-plans/:id` | `TEACHER` | Edit revision items while plan status is `DRAFT` |
| `PATCH` | `/revision-plans/:id/approve` | `TEACHER` | Approve & activate plan (`ACTIVE`) + dispatch conditional alerts (Student + Parents if minor) |
| `PATCH` | `/revision-plans/:id/items/:itemId/complete` | `TEACHER`, `STUDENT` | Mark an item as completed (auto-transitions plan to `COMPLETED` when all items finish) |
| `PATCH` | `/revision-plans/:id/cancel` | `TEACHER` | Cancel a `DRAFT`, `APPROVED`, or `ACTIVE` plan (`CANCELLED` — immutable) |
| `GET` | `/students/:studentId/revision-plans` | All (Scoped) | List revision plans *(Students & Parents strictly never receive `DRAFT` plans)* |
| `GET` | `/students/:studentId/analytics` | All (Scoped) | Fetch progress KPIs, Tajweed trend, and weakness analytics (most-errored Surahs) |

### Example 1: `POST /api/v1/sessions/:sessionId/quran-progress`
**Request:**
```json
{
  "studentId": "665f1a2b3c4d5e6f7a8b9c50",
  "surah": 2,
  "startAyah": 1,
  "endAyah": 25,
  "type": "NEW_MEMORIZATION",
  "score": 8.5,
  "tajweedScore": 8.0,
  "mistakeCount": 3,
  "notes": "Needs practice on Ikhfa rules"
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Quran progress logged successfully",
  "data": {
    "record": {
      "_id": "665f1a2b3c4d5e6f7a8b9c70",
      "surah": 2,
      "surahName": "Al-Baqarah",
      "startAyah": 1,
      "endAyah": 25,
      "type": "NEW_MEMORIZATION",
      "score": 8.5,
      "tajweedScore": 8.0,
      "mistakeCount": 3
    },
    "updatedStats": {
      "totalMemorizedAyahs": 420,
      "averageScore": 8.7
    }
  }
}
```

### Example 2: `POST /api/v1/revision-plans/generate` (RPI Engine)
* **Formula:** $\text{RPI} = (\text{Days} \times 1.5) + (\text{Mistakes} \times 2.0) + ((10 - \text{Score}) \times 2.5) + (\text{MissedSessions} \times 1.8)$

**Request:**
```json
{
  "studentId": "665f1a2b3c4d5e6f7a8b9c50",
  "maxItems": 5
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Draft revision plan generated (awaiting teacher approval)",
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c80",
    "studentId": "665f1a2b3c4d5e6f7a8b9c50",
    "status": "DRAFT",
    "items": [
      {
        "itemId": "item_01",
        "surah": 67,
        "surahName": "Al-Mulk",
        "startAyah": 1,
        "endAyah": 30,
        "rpiScore": 42.6,
        "priority": "CRITICAL",
        "metrics": {
          "daysSinceReview": 14,
          "mistakes": 4,
          "lastScore": 6.5,
          "missedSessions": 2
        },
        "isCompleted": false
      },
      {
        "itemId": "item_02",
        "surah": 78,
        "surahName": "An-Naba",
        "startAyah": 1,
        "endAyah": 40,
        "rpiScore": 24.5,
        "priority": "MODERATE",
        "metrics": {
          "daysSinceReview": 9,
          "mistakes": 2,
          "lastScore": 8.0,
          "missedSessions": 1
        },
        "isCompleted": false
      }
    ]
  }
}
```

---

## 7. Module 5: Assignments & Evaluations (`/assignments`, `/submissions`, `/evaluations`)

| Method | Endpoint | Allowed Roles | Description |
| :---: | :--- | :--- | :--- |
| `POST` | `/assignments` | `TEACHER` | Create dual-target assignment (`groupId` OR `studentId`) with `assignmentType` |
| `GET` | `/assignments` | `TEACHER`, `STUDENT`, `PARENT` | List scoped assignments |
| `POST` | `/assignments/:id/submit` | `STUDENT` | Submit assignment with server-side `isLate` evaluation |
| `GET` | `/assignments/:id/submissions` | `TEACHER` | List all student submissions for an assignment |
| `PATCH` | `/submissions/:subId/grade` | `TEACHER` | Grade submission, attach feedback, and trigger conditional notifications |
| `GET` / `POST` | `/evaluations` | `TEACHER`, All (GET Scoped) | Record or retrieve `REGULAR` and `FINAL` evaluations |

### Example: `POST /api/v1/assignments/:id/submit` (Auto-Late Detection)
**Request:**
```json
{
  "submissionContent": "https://storage.rifq.app/recitations/omar_mulk.m4a",
  "notes": "Full Surah Al-Mulk recitation uploaded"
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Assignment submitted (marked as late)",
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c90",
    "assignmentId": "665f1a2b3c4d5e6f7a8b9c88",
    "studentId": "665f1a2b3c4d5e6f7a8b9c50",
    "submissionDate": "2026-11-21T20:15:00Z",
    "isLate": true,
    "score": null
  }
}
```

---

## 8. Module 6: Notifications & Parent Portal (`/notifications`, `/parents/me/children`)

| Method | Endpoint | Allowed Roles | Description |
| :---: | :--- | :--- | :--- |
| `GET` | `/notifications` | All Authenticated | Retrieve paginated in-app notifications + `unreadCount` |
| `PATCH` | `/notifications/:id/read` | All Authenticated | Mark a single notification as read |
| `PATCH` | `/notifications/read-all` | All Authenticated | Mark all user notifications as read |
| `GET` | `/parents/me/children` | `PARENT` | Multi-child overview with quick summary (attendance %, latest score, active revision plan) |

### Example: `GET /api/v1/parents/me/children`
**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Linked children retrieved successfully",
  "data": [
    {
      "studentId": "665f1a2b3c4d5e6f7a8b9c50",
      "fullName": "Omar Khaled Hassan",
      "primaryGroup": "Halaqat Al-Noor (Quran)",
      "attendanceRate": 92.5,
      "averageQuranScore": 8.7,
      "activeRevisionPlan": {
        "planId": "665f1a2b3c4d5e6f7a8b9c80",
        "completedItems": 2,
        "totalItems": 5
      }
    }
  ]
}
```