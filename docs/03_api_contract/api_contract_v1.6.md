# Rifq Platform — REST API Contract (v1.6)

**Architecture:** Modular Monolith (Node.js / Express + MongoDB)  
**Protocol:** Stateless RESTful JSON API (Multi-Platform: React RTL Web SPA & Flutter/React Native Mobile App)  
**Base URL:** `https://api.rifq.app/api/v1` (Local: `http://localhost:5000/api/v1`)  
**Compatibility:** Backward-compatible superset of v1.5 (all v1.5 endpoints, envelopes, pagination, and auth rules preserved).

---

## 1. Global API Standards

### 1.1 Required Headers
| Header | Required | Description |
| :--- | :---: | :--- |
| `Content-Type` | Yes | `application/json` (or `multipart/form-data` for live audio upload endpoints such as `/recitations/ai-assess`) |
| `Accept-Language` | Optional | `ar` (default) or `en` for localized error/response messages |
| `Authorization` | Protected Routes | `Bearer <JWT_ACCESS_TOKEN>` |

### 1.2 Security & Scope Isolation (Server-Side RBAC)
* **Roles:** `ADMIN` | `MANAGER` | `TEACHER` | `STUDENT` | `PARENT`
* **Zero-Trust Scoping:** `userId`, `role`, `branchId`, and `academyId` are strictly extracted from the verified JWT payload on the server. Client-supplied scope overrides are rejected with `403 Forbidden`.
* **Pagination:** All list (`GET`) endpoints support query parameters: `?page=1&limit=20&sort=-createdAt` (default `limit=20`, max `100`).
* **v1.6 Enforcement:** All v1.6 endpoints strictly enforce server-side JWT authentication, sequential RBAC, and `branchId`/group isolation (including Teacher `Monitor` scope checks across `/monitor-queue` and `/quran-progress/:id/verify`).

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
| `400` | `ASSIGNMENT_TIME_EXPIRED` | Student attempted to submit a timed assignment after `timeLimitMinutes` elapsed. |
| `400` | `ASSIGNMENT_LIVE_AUDIO_REQUIRED` | Assignment enforces `isLiveRecordingOnly: true` (`RECITING` task) and live audio capture verification failed or a pre-recorded file was uploaded. |
| `401` | `AUTH_INVALID_CREDENTIALS` | Incorrect email or password. |
| `401` | `AUTH_TOKEN_EXPIRED` | Expired JWT (8-hour TTL) or revoked/blacklisted token. |
| `403` | `AUTH_ACCOUNT_LOCKED` | Account temporarily locked after 5 consecutive failed logins (returns `lockUntil`). |
| `403` | `AUTH_ACCOUNT_INACTIVE` | User account is deactivated (`status: INACTIVE`). |
| `403` | `RBAC_FORBIDDEN` | Authenticated role lacks permission for the requested action. |
| `403` | `SCOPE_BRANCH_ISOLATION` | Cross-branch access attempt or teacher accessing an unassigned group/student. |
| `403` | `MONITOR_SCOPE_FORBIDDEN` | Teacher (`Monitor`) attempted to access or verify a monitor queue item or `QuranProgress` record outside their branch or assigned groups. |
| `404` | `RESOURCE_NOT_FOUND` | Requested resource ID does not exist. |
| `409` | `DUPLICATE_RESOURCE` | Unique constraint conflict (e.g., duplicate email or branch name). |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests from the same IP/client. |
| `503` | `AI_ASSESSMENT_UNAVAILABLE` | Upstream AI recitation assessment engine is temporarily unavailable or timed out. |

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

## 6. Module 4: Quran Progress, AI-Assisted Recitation, Monitor Queue & Smart Revision Engine

| Method | Endpoint | Allowed Roles | Description |
| :---: | :--- | :--- | :--- |
| `POST` | `/sessions/:sessionId/quran-progress` | `TEACHER` | Log daily memorization/revision with strict Surah & Ayah bounds validation (`source: "TEACHER"`, `verificationStatus: "VERIFIED"`) |
| `GET` | `/students/:studentId/quran-progress` | All (Scoped) | Retrieve Quran progress history (filterable by `surah`, `type`, `source`, `verificationStatus`, date range) |
| `POST` | `/recitations/ai-assess` | `STUDENT` | Submit live recitation audio (`LEARNING` \| `RECALL`) for AI draft assessment; persists `QuranProgress` with `source: "AI_ASSISTED"` & `verificationStatus: "PENDING_MONITOR"` |
| `GET` | `/monitor-queue` | `TEACHER` | Retrieve paginated Teacher (`Monitor`) queue of flagged items (high error rates, `PENDING_MONITOR` AI recitations, `REVIEW_REQUIRED` assignments), strictly scoped to teacher's branch and assigned groups |
| `PATCH` | `/quran-progress/:id/verify` | `TEACHER` | Approve or override an AI-assisted `QuranProgress` record (`verificationStatus: "VERIFIED"`, `monitoredBy: teacherId`) and trigger RPI recalculation |
| `POST` | `/revision-plans/generate` | `TEACHER` | Execute RPI algorithm (AI-Ready service) to create a `DRAFT` revision plan |
| `PATCH` | `/revision-plans/:id` | `TEACHER` | Edit revision items while plan status is `DRAFT` |
| `PATCH` | `/revision-plans/:id/approve` | `TEACHER` | Approve & activate plan (`ACTIVE`) + dispatch conditional alerts (Student + Parents if minor) |
| `PATCH` | `/revision-plans/:id/items/:itemId/complete` | `TEACHER`, `STUDENT` | Mark an item as completed (auto-transitions plan to `COMPLETED` when all items finish) |
| `PATCH` | `/revision-plans/:id/cancel` | `TEACHER` | Cancel a `DRAFT`, `APPROVED`, or `ACTIVE` plan (`CANCELLED` — immutable) |
| `GET` | `/students/:studentId/revision-plans` | All (Scoped) | List revision plans *(Students & Parents strictly never receive `DRAFT` plans)* |
| `GET` | `/students/:studentId/analytics` | All (Scoped) | Fetch progress KPIs, Tajweed trend, and weakness analytics (most-errored Surahs) |

### Example 1: `POST /api/v1/sessions/:sessionId/quran-progress`
* **v1.6 Schema Extension:** `QuranProgress` records now track provenance and Human-in-the-Loop verification metadata: `source` (`"TEACHER"` | `"AI_ASSISTED"`), `verificationStatus` (`"PENDING_MONITOR"` | `"VERIFIED"`), and `monitoredBy` (`ObjectId | null`). Teacher-logged entries default to `source: "TEACHER"`, `verificationStatus: "VERIFIED"`, and `monitoredBy` set to the authenticated teacher's `profileId` from JWT.

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
      "mistakeCount": 3,
      "source": "TEACHER",
      "verificationStatus": "VERIFIED",
      "monitoredBy": "665f1a2b3c4d5e6f7a8b9c22"
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

### Example 3: `POST /api/v1/recitations/ai-assess` (AI-Assisted Live Recitation Assessment)
* **Security & Validation:** Requires JWT (`STUDENT` role only). `studentId`, `branchId`, and `academyId` are strictly derived from the verified JWT. Validates Surah (`1–114`) and Ayah bounds (`QURAN_INVALID_AYAH_RANGE`). Accepts live audio payload (`application/json` base64/signed stream reference or `multipart/form-data` audio file) plus `surah`, `startAyah`, `endAyah`, and `mode` (`"LEARNING"` | `"RECALL"`). Returns `503 AI_ASSESSMENT_UNAVAILABLE` if the upstream AI recitation engine times out or is unavailable.

**Request:**
```json
{
  "audioPayload": "data:audio/m4a;base64,AAAAIGZ0eXBNNEEg...",
  "surah": 67,
  "startAyah": 1,
  "endAyah": 5,
  "mode": "RECALL"
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "AI draft assessment completed and queued for teacher monitor review",
  "data": {
    "assessment": {
      "provisionalScore": 7.8,
      "mistakeCount": 2,
      "hesitationFlags": [
        {
          "ayah": 3,
          "timestampMs": 14200,
          "durationMs": 2650,
          "reason": "PROLONGED_PAUSE"
        }
      ],
      "errorHighlights": [
        {
          "ayah": 2,
          "wordIndex": 4,
          "expectedWord": "أَحْسَنُ",
          "detectedIssue": "TAJWEED_GHUNNAH_OMISSION",
          "confidence": 0.91
        },
        {
          "ayah": 4,
          "wordIndex": 7,
          "expectedWord": "خَاسِئًا",
          "detectedIssue": "WORD_SUBSTITUTION",
          "confidence": 0.87
        }
      ]
    },
    "quranProgress": {
      "_id": "665f1a2b3c4d5e6f7a8b9c75",
      "studentId": "665f1a2b3c4d5e6f7a8b9c50",
      "branchId": "665f1a2b3c4d5e6f7a8b9c10",
      "surah": 67,
      "surahName": "Al-Mulk",
      "startAyah": 1,
      "endAyah": 5,
      "mode": "RECALL",
      "score": 7.8,
      "mistakeCount": 2,
      "source": "AI_ASSISTED",
      "verificationStatus": "PENDING_MONITOR",
      "monitoredBy": null,
      "createdAt": "2026-11-25T01:40:00Z"
    }
  }
}
```

### Example 4: `GET /api/v1/monitor-queue` (Teacher Monitor Queue)
* **Security & Scope Isolation:** Requires JWT (`TEACHER` role only). Results are strictly scoped server-side to the authenticated teacher's JWT `branchId` and assigned `groupIds`. Supplying a `groupId` query parameter outside the teacher's assigned groups or branch returns `403 MONITOR_SCOPE_FORBIDDEN`.
* **Query Parameters:** `?page=1&limit=20&type=ALL|AI_RECITATION|HIGH_ERROR|INTEGRITY_FLAG&groupId=<ObjectId>`

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Monitor queue items retrieved successfully",
  "data": [
    {
      "queueItemId": "mq_665f1a2b3c4d5e6f7a8b9d01",
      "queueType": "AI_RECITATION",
      "priority": "HIGH",
      "studentId": "665f1a2b3c4d5e6f7a8b9c50",
      "studentName": "Omar Khaled Hassan",
      "groupId": "665f1a2b3c4d5e6f7a8b9c30",
      "resourceType": "QuranProgress",
      "resourceId": "665f1a2b3c4d5e6f7a8b9c75",
      "summary": {
        "surah": 67,
        "surahName": "Al-Mulk",
        "ayahRange": "1-5",
        "source": "AI_ASSISTED",
        "verificationStatus": "PENDING_MONITOR",
        "provisionalScore": 7.8,
        "mistakeCount": 2
      },
      "flaggedAt": "2026-11-25T01:40:00Z"
    },
    {
      "queueItemId": "mq_665f1a2b3c4d5e6f7a8b9d02",
      "queueType": "HIGH_ERROR",
      "priority": "CRITICAL",
      "studentId": "665f1a2b3c4d5e6f7a8b9c52",
      "studentName": "Youssef Tariq Ali",
      "groupId": "665f1a2b3c4d5e6f7a8b9c30",
      "resourceType": "QuranProgress",
      "resourceId": "665f1a2b3c4d5e6f7a8b9c76",
      "summary": {
        "surah": 2,
        "surahName": "Al-Baqarah",
        "ayahRange": "142-160",
        "source": "AI_ASSISTED",
        "verificationStatus": "PENDING_MONITOR",
        "provisionalScore": 5.2,
        "mistakeCount": 7
      },
      "flaggedAt": "2026-11-25T01:25:00Z"
    },
    {
      "queueItemId": "mq_665f1a2b3c4d5e6f7a8b9d03",
      "queueType": "INTEGRITY_FLAG",
      "priority": "MEDIUM",
      "studentId": "665f1a2b3c4d5e6f7a8b9c53",
      "studentName": "Zayd Ibrahim Adel",
      "groupId": "665f1a2b3c4d5e6f7a8b9c30",
      "resourceType": "AssignmentSubmission",
      "resourceId": "665f1a2b3c4d5e6f7a8b9c92",
      "summary": {
        "assignmentId": "665f1a2b3c4d5e6f7a8b9c89",
        "integrityFlag": "REVIEW_REQUIRED",
        "tabSwitchesCount": 6,
        "pasteEventCount": 2,
        "isLate": false
      },
      "flaggedAt": "2026-11-25T01:10:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 3,
    "totalPages": 1
  }
}
```

### Example 5: `PATCH /api/v1/quran-progress/:id/verify` (Human-in-the-Loop Verification)
* **Security & Scope Isolation:** Requires JWT (`TEACHER` role only). Server verifies the target `QuranProgress` record belongs to a student within the teacher's JWT `branchId` and assigned `groupIds`; cross-branch or unassigned-group access is rejected with `403 MONITOR_SCOPE_FORBIDDEN`. Sets `verificationStatus: "VERIFIED"`, `monitoredBy` from JWT `profileId`, and triggers RPI recalculation for the student.

**Request:**
```json
{
  "score": 8.0,
  "tajweedScore": 7.5,
  "mistakeCount": 2,
  "notes": "Verified live audio: Ghunnah missed in ayah 2, otherwise fluent recall."
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Quran progress verified and RPI recalculation triggered",
  "data": {
    "record": {
      "_id": "665f1a2b3c4d5e6f7a8b9c75",
      "studentId": "665f1a2b3c4d5e6f7a8b9c50",
      "surah": 67,
      "surahName": "Al-Mulk",
      "startAyah": 1,
      "endAyah": 5,
      "score": 8.0,
      "tajweedScore": 7.5,
      "mistakeCount": 2,
      "notes": "Verified live audio: Ghunnah missed in ayah 2, otherwise fluent recall.",
      "source": "AI_ASSISTED",
      "verificationStatus": "VERIFIED",
      "monitoredBy": "665f1a2b3c4d5e6f7a8b9c22",
      "verifiedAt": "2026-11-25T01:50:00Z"
    },
    "rpiRecalculation": {
      "triggered": true,
      "surah": 67,
      "updatedRpiScore": 31.4
    }
  }
}
```

---

## 7. Module 5: Assignments & Evaluations (`/assignments`, `/submissions`, `/evaluations`)

| Method | Endpoint | Allowed Roles | Description |
| :---: | :--- | :--- | :--- |
| `POST` | `/assignments` | `TEACHER` | Create dual-target assignment (`groupId` OR `studentId`) with `assignmentType` and anti-cheat/integrity controls (`timeLimitMinutes`, `isLiveRecordingOnly`, `randomizeQuestions`) |
| `GET` | `/assignments` | `TEACHER`, `STUDENT`, `PARENT` | List scoped assignments |
| `POST` | `/assignments/:id/submissions` | `STUDENT` | Submit assignment with server-side `isLate`, time-limit & live-audio enforcement, advisory telemetry, and `integrityFlag` evaluation |
| `POST` | `/assignments/:id/submit` | `STUDENT` | Backward-compatible v1.5 alias for `POST /assignments/:id/submissions` (identical schema & rules) |
| `GET` | `/assignments/:id/submissions` | `TEACHER` | List all student submissions for an assignment (includes `isLate`, `integrityFlag`, and advisory telemetry) |
| `PATCH` | `/submissions/:subId/grade` | `TEACHER` | Grade submission, attach feedback, and trigger conditional notifications |
| `GET` / `POST` | `/evaluations` | `TEACHER`, All (GET Scoped) | Record or retrieve `REGULAR` and `FINAL` evaluations |

### Example 1: `POST /api/v1/assignments` (Assignment Creation with Integrity Controls)
* **Security & Validation:** Requires JWT (`TEACHER` role only) with strict `branchId` and assigned-group verification (`SCOPE_BRANCH_ISOLATION`). For `assignmentType: "RECITING"`, `isLiveRecordingOnly` can be enabled to enforce live microphone capture rather than pre-recorded file uploads.

**Request:**
```json
{
  "title": "Surah Al-Mulk Live Recitation Assessment",
  "description": "Recite Ayahs 1-15 from memory in a single uninterrupted live session.",
  "groupId": "665f1a2b3c4d5e6f7a8b9c30",
  "assignmentType": "RECITING",
  "dueDate": "2026-11-28T23:59:59Z",
  "maxScore": 10,
  "timeLimitMinutes": 15,
  "isLiveRecordingOnly": true,
  "randomizeQuestions": false
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c88",
    "branchId": "665f1a2b3c4d5e6f7a8b9c10",
    "teacherId": "665f1a2b3c4d5e6f7a8b9c22",
    "groupId": "665f1a2b3c4d5e6f7a8b9c30",
    "studentId": null,
    "title": "Surah Al-Mulk Live Recitation Assessment",
    "description": "Recite Ayahs 1-15 from memory in a single uninterrupted live session.",
    "assignmentType": "RECITING",
    "dueDate": "2026-11-28T23:59:59Z",
    "maxScore": 10,
    "timeLimitMinutes": 15,
    "isLiveRecordingOnly": true,
    "randomizeQuestions": false,
    "createdAt": "2026-11-25T01:30:00Z"
  }
}
```

### Example 2: `POST /api/v1/assignments/:id/submissions` (Telemetry, Integrity Check & Auto-Late Detection)
* **Security & Validation:** Requires JWT (`STUDENT` role only). Verifies assignment belongs to the student's `branchId` and target group/student (`SCOPE_BRANCH_ISOLATION`). Enforces `timeLimitMinutes` (`400 ASSIGNMENT_TIME_EXPIRED`) and `isLiveRecordingOnly` (`400 ASSIGNMENT_LIVE_AUDIO_REQUIRED`). Evaluates server-side `isLate` and computes `integrityFlag` (`"NONE"` | `"REVIEW_REQUIRED"`) from advisory telemetry and recitation consistency checks; submissions marked `"REVIEW_REQUIRED"` are automatically surfaced in `/monitor-queue`.

**Request:**
```json
{
  "submissionContent": "https://storage.rifq.app/recitations/omar_mulk_live.m4a",
  "notes": "Full Surah Al-Mulk live recitation completed",
  "submissionDurationSeconds": 412,
  "tabSwitchesCount": 3,
  "pasteEventCount": 0,
  "isLiveAudioVerified": true
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Assignment submitted (marked as late; flagged for monitor review)",
  "data": {
    "_id": "665f1a2b3c4d5e6f7a8b9c90",
    "assignmentId": "665f1a2b3c4d5e6f7a8b9c88",
    "studentId": "665f1a2b3c4d5e6f7a8b9c50",
    "submissionDate": "2026-11-29T00:15:00Z",
    "isLate": true,
    "integrityFlag": "REVIEW_REQUIRED",
    "telemetry": {
      "submissionDurationSeconds": 412,
      "tabSwitchesCount": 3,
      "pasteEventCount": 0,
      "isLiveAudioVerified": true
    },
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

---

## 9. Module 7: Inclusive Accessibility & Quran Text/Audio Service (`/students/me/accessibility`, `/quran`)

| Method | Endpoint | Allowed Roles | Description |
| :---: | :--- | :--- | :--- |
| `PATCH` | `/students/me/accessibility` | `STUDENT` | Update authenticated student's inclusive `accessibilityPreferences` |
| `GET` | `/quran/surahs/:surahNumber` | All Authenticated | Retrieve structured Surah metadata and Ayah array (Uthmani/Amiri-ready text + per-ayah Tap-to-Listen audio URLs), supporting `?context=LEARNING\|ACCESSIBILITY\|ERROR_REVIEW` |

### Example 1: `PATCH /api/v1/students/me/accessibility`
* **Security & Scope Isolation:** Requires JWT (`STUDENT` role only). Target student identity and `branchId` are strictly extracted from the verified JWT payload (`me` pattern); no client-supplied student ID is accepted.

**Request:**
```json
{
  "visualMode": "HIGH_CONTRAST",
  "fontSizeScale": 1.35,
  "audioGuidance": true,
  "tapToListenEnabled": true,
  "screenReaderOptimized": true
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Accessibility preferences updated successfully",
  "data": {
    "studentId": "665f1a2b3c4d5e6f7a8b9c50",
    "accessibilityPreferences": {
      "visualMode": "HIGH_CONTRAST",
      "fontSizeScale": 1.35,
      "audioGuidance": true,
      "tapToListenEnabled": true,
      "screenReaderOptimized": true
    },
    "updatedAt": "2026-11-25T01:45:00Z"
  }
}
```

### Example 2: `GET /api/v1/quran/surahs/:surahNumber`
* **Security & Validation:** Requires valid JWT (any authenticated role: `ADMIN`, `MANAGER`, `TEACHER`, `STUDENT`, `PARENT`). Validates `surahNumber` within `1–114` (`400 QURAN_INVALID_AYAH_RANGE` if out of bounds). Supports optional query parameter `context` (`LEARNING` | `ACCESSIBILITY` | `ERROR_REVIEW`, default: `LEARNING`) to tailor metadata hints and audio playback cues.

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Surah metadata and ayahs retrieved successfully",
  "data": {
    "surahNumber": 112,
    "arabicName": "سورة الإخلاص",
    "englishName": "Al-Ikhlas",
    "revelationType": "MAKKI",
    "totalAyahs": 4,
    "context": "ACCESSIBILITY",
    "ayahs": [
      {
        "ayahNumber": 1,
        "textUthmani": "قُلْ هُوَ اللَّهُ أَحَدٌ",
        "audioUrl": "https://cdn.rifq.app/audio/112/001.mp3",
        "durationMs": 2850
      },
      {
        "ayahNumber": 2,
        "textUthmani": "اللَّهُ الصَّمَدُ",
        "audioUrl": "https://cdn.rifq.app/audio/112/002.mp3",
        "durationMs": 2400
      },
      {
        "ayahNumber": 3,
        "textUthmani": "لَمْ يَلِدْ وَلَمْ يُولَدْ",
        "audioUrl": "https://cdn.rifq.app/audio/112/003.mp3",
        "durationMs": 3100
      },
      {
        "ayahNumber": 4,
        "textUthmani": "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
        "audioUrl": "https://cdn.rifq.app/audio/112/004.mp3",
        "durationMs": 3950
      }
    ]
  }
}
```
