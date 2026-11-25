# 📖 Rifq Platform (منصة رِفْق)
> **Enterprise-Grade Modular Monolith for Quranic & Islamic Studies Management**  
> *Graduation Project — Faculty of Computers and Artificial Intelligence*

---

## 🌟 Executive Summary

**Rifq Platform (منصة رِفْق)** is an all-in-one educational management platform engineered specifically for Quranic academies, Islamic institutes, and multi-branch educational organizations. It bridges traditional Quranic pedagogical workflows (Hifdh memorization, Tajweed, Muraja'ah spaced revision) with modern software engineering principles, automated assignment workflows, conditional age-based guardianship, and an algorithmic **Smart Revision Engine** powered by the **Retention & Performance Index (RPI)**.

---

## 🏛️ System Architecture

Rifq Platform adopts a **Modular Monolith** architecture pattern on the backend, combining the simplicity of a single deployment unit with the discipline, high domain cohesion, and loose coupling of microservices.

```
                           +------------------------------------------+
                           |         Multi-Platform Clients           |
                           |  +-------------------+ +---------------+ |
                           |  | React RTL Web SPA | |  Mobile App   | |
                           |  |  (Tailwind CSS)   | |(Flutter / RN) | |
                           |  +---------+---------+ +-------+-------+ |
                           +------------|-------------------|---------+
                                        |                   |
                                        | HTTPS / REST API  |
                                        v                   v
+-----------------------------------------------------------------------------------+
|                        MODULAR MONOLITH BACKEND (Node.js & Express)               |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                          API Security Pipeline                              |  |
|  |   [JWT Auth Middleware] -> [Sequential RBAC] -> [Branch Isolation Guard]    |  |
|  |               -> [Ayah Bounds & Age Constraint Validators]                  |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                            Domain Modules                                   |  |
|  |  +----------------+  +-----------------+  +-------------------------------+ |  |
|  |  |      Auth      |  |   Governance    |  |          Academics            | |  |
|  |  | (JWT, Lockout) |  | (Users, Branch) |  |  (Groups, Sessions, Attend)  | |  |
|  |  +----------------+  +-----------------+  +-------------------------------+ |  |
|  |  +----------------+  +-----------------+  +-------------------------------+ |  |
|  |  | Quran Progress |  | Smart Revision  |  |   Assignments & Evals         | |  |
|  |  | (Daily Logs)   |  | (RPI Algorithm) |  | (Submissions, Rubrics, Video) | |  |
|  |  +----------------+  +-----------------+  +-------------------------------+ |  |
|  |  +-------------------------------------+                                   |  |
|  |  |      Notifications & Audits         |                                   |  |
|  |  |  (In-App Alerts, System Audits)     |                                   |  |
|  |  +-------------------------------------+                                   |  |
|  +-----------------------------------------------------------------------------+  |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                          Data & External Integrations                             |
|  +------------------------------+  +---------------+  +-------------------------+ |
|  | MongoDB (16 Collections ODM) |  | Firebase FCM  |  | Virtual Classrooms      | |
|  | - Identity & Academics       |  | (Push Alerts) |  | (Zoom / Google Meet     | |
|  | - Quran, Revision & Audits   |  |               |  |  Dynamic Launch URLs)   | |
|  +------------------------------+  +---------------+  +-------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 👥 5 User Roles & Access Control

Rifq Platform implements a strict **Sequential Role-Based Access Control (RBAC)** model with multi-tenant branch isolation:

| Role | Arabic Title | Description & Responsibilities |
| :--- | :--- | :--- |
| **`ADMIN`** | مدير النظام الأكاديمي | Global administrator across all branches. Configures academy settings, creates branches, manages managers, and reviews platform-wide audit logs. |
| **`MANAGER`** | مدير الفرع | Branch-scoped supervisor. Manages teachers, enrolls students, forms academic circles (`Groups`), and monitors branch-level attendance and progress analytics. |
| **`TEACHER`** | الشيخ / المعلم | Instructs Quran and Islamic studies groups. Logs daily Quran progress (Surah/Ayah bounds), tracks session attendance, creates assignments, and approves Smart Revision Plans. |
| **`STUDENT`** | الطالب | Learner profile. Categorized into **Independent** ($\ge 18$ years) and **Minor** ($< 18$ years). Accesses personal Quran tracker, submits audio/text assignments, and executes revision plans. |
| **`PARENT`** | ولي الأمر | Guardian profile automatically linked to students under 18 years old. Provides a unified multi-child dashboard to monitor Quran retention, attendance, and teacher feedback. |

---

## 🗄️ Database Architecture (16 MongoDB Collections)

The database schema is organized across 5 functional domain modules:

```
+-----------------------------------------------------------------------------------+
|                            16 MongoDB Collections                                 |
+-----------------------------------------------------------------------------------+
| 1. Identity & Governance       | Users, Branches, Students, Teachers, Parents     |
| 2. Academic Operations         | Groups, Sessions, Attendance                     |
| 3. Quran Progress & Revision   | QuranProgress, RevisionPlans                     |
| 4. Assignments & Online Classes| Assignments, AssignmentSubmissions,              |
|                                | OnlineClasses, Evaluations                       |
| 5. Alerts & Security Audits    | Notifications, SystemAudits                      |
+-----------------------------------------------------------------------------------+
```

### Detailed Collection Breakdown

1. **`Users`**: Central credentials entity storing email, bcrypt-hashed passwords (`cost >= 10`), role enum, account status (`ACTIVE`, `INACTIVE`, `LOCKED`), brute-force lockout counters (`failedLoginAttempts`, `lockUntil`), branch association, and FCM device tokens.
2. **`Branches`**: Physical or virtual branches belonging to the academy, containing regional contact info, address, and localized academic configurations.
3. **`Students`**: Comprehensive student profiles referencing `Users`, birth dates, educational stages, enrolled groups, and conditional `guardianId` references.
4. **`Teachers`**: Instructor profiles referencing `Users`, tracking memorization Ijazat, specialties (Hifdh, Tajweed, Qira'at), bio, and assigned branches.
5. **`Parents`**: Guardian records referencing `Users`, emergency contact telephone numbers, and an array of linked `studentIds`.
6. **`Groups`**: Multi-track study circles (Quran Memorization, Islamic Studies, Tajweed) with defined capacity, gender segregation, schedule times, and assigned primary teachers.
7. **`Sessions`**: Individual recurring or ad-hoc class instances linked to a `Group`, tracking date, room, class status, and agenda.
8. **`Attendance`**: Granular per-student attendance records (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`), arrival timestamps, and teacher remarks.
9. **`QuranProgress`**: Atomic memorization and revision entries validating standard Quranic boundaries (Surah 1–114, valid Ayah ranges), recitation quality rating (1–5 stars), Tajweed error tags, and mastery state.
10. **`RevisionPlans`**: Algorithmic revision schedules generated by the Smart Revision Engine, maintaining items, targets, intervals, and plan lifecycle state.
11. **`Assignments`**: Academic homework tasks supporting dual targeting (assigned to an entire group or customized for an individual student), deadlines, and attached rubric files.
12. **`AssignmentSubmissions`**: Student submissions containing audio recitation URLs, text answers, automated late submission detection (`isLate`), grades, and teacher audio/written feedback.
13. **`OnlineClasses`**: Virtual classroom integration metadata holding dynamic Zoom or Google Meet links, session passcodes, and start/end time windows.
14. **`Evaluations`**: Periodic, midterm, and final oral exam assessments utilizing standardized rubrics (Tajweed accuracy, fluency, memorization strength, voice).
15. **`Notifications`**: Real-time push and in-app alert log storing recipient references, notification types, payload data, and read status.
16. **`SystemAudits`**: Tamper-evident security logs capturing administrative actions, authentication attempts, cross-branch access requests, and state changes.

---

## 🧠 Smart Revision Engine & RPI

One of Rifq Platform's primary innovations is the **Smart Revision Engine**, which prevents Quranic forgetfulness by continuously computing the **Retention & Performance Index (RPI)** for every memorized Surah and Juz'.

### 1. RPI Algorithmic Factors
The engine calculates an RPI score ($0.0 \text{ to } 1.0$) based on:
- **Recency Decay**: Time elapsed since the last verified recitation.
- **Historical Error Density**: Frequency of hesitation and Tajweed errors recorded in `QuranProgress`.
- **Evaluation Scores**: Grades achieved during formal oral exams in `Evaluations`.
- **Difficulty Weighting**: Specific Surahs with frequent Mutashabihat (similar verses) receive higher decay weighting.

### 2. Human-in-the-Loop State Machine Lifecycle

To preserve teacher authority while leveraging automated algorithmic intelligence, revision plans follow an immutable state transition:

```
  [ RPI Engine Triggers ]
             |
             v
        +----------+
        |  DRAFT   |  <--- Generated algorithmically; hidden from student
        +----+-----+
             |  Teacher edits & fine-tunes
             v
       +------------+
       |  APPROVED  |  <--- Verified by Teacher (approvedBy, approvedAt)
       +-----+------+
             |  Dispatched to Student & Guardian
             v
        +----------+
        |  ACTIVE  |  <--- Visible in Student & Mobile revision checklists
        +----+-----+
             |
     +-------+-------+
     |               |  (All items checked)
     v               v
+-----------+  +-------------+
| CANCELLED |  |  COMPLETED  |
+-----------+  +-------------+
```

---

## 💻 Multi-Platform Frontend Strategy

1. **Web Dashboard (`/web`)**:
   - **Framework**: React.js (Single Page Application) with Tailwind CSS.
   - **Localization**: Native Right-to-Left (RTL) Arabic layout (`dir="rtl"`) with high-contrast Islamic typography (Amiri / Cairo fonts).
   - **Primary Users**: Academy Administrators, Branch Managers, and Teachers for rich tabular data, group management, grading rubrics, and detailed analytics.

2. **Mobile Application (`/mobile`)**:
   - **Framework**: Flutter / Cross-Platform Mobile Client.
   - **Key Features**: Audio recording for Quran homework, quick Surah progress loggers, push notification listener (Firebase Cloud Messaging), and synchronized parent monitoring.
   - **Primary Users**: Students and Parents for quick, daily on-the-go interactions.

---

## 📁 Repository Directory Structure

```text
.
├── docs/
│   ├── 01_srs/                                 # Software Requirements Specification (SRS Volumes I, II, III)
│   ├── 02_diagrams/
│   │   ├── svg/
│   │   │   └── 03_sequence_diagrams/           # System, Database ERD, State Machine & Sequence SVGs
│   │   └── d2_sources/                         # Declarative D2 & Mermaid diagram source files
│   ├── 03_api_contract/                       # OpenAPI / Swagger specifications & REST contracts
│   ├── 04_design_system/                       # UI/UX design tokens, Arabic typography, color palette
│   └── 05_thesis_and_presentation/             # Graduation project thesis chapters, slides & defense assets
├── backend/
│   └── src/
│       ├── config/                             # Environment validation, database & external client configs
│       ├── middlewares/                        # Sequential JWT Auth, RBAC, Branch Isolation, Error Handler
│       ├── modules/                            # Modular Monolith bounded contexts:
│       │   ├── auth/                           # Authentication, JWT issuance, password hashing & lockout
│       │   ├── governance/                     # Multi-branch management, user profiles & parent-student linkage
│       │   ├── academics/                      # Circles (Groups), scheduled Sessions, and Attendance
│       │   ├── quran_progress/                 # Daily Surah/Ayah logs with boundary validation & ratings
│       │   ├── smart_revision/                 # RPI calculation engine & Human-in-the-Loop plan state machine
│       │   ├── assignments/                    # Homework tasks, audio submissions, rubrics & online classes
│       │   └── notifications/                  # In-app alerts, FCM push dispatchers & audit logging
│       └── utils/                              # Shared helpers, Quran metadata constants & mathematical tools
├── web/                                        # React RTL Web Application (Tailwind CSS Arabic dashboard)
├── mobile/                                     # Flutter / Mobile Cross-Platform Client (Student & Parent app)
├── .gitignore                                  # Production gitignore for Node.js, React, Mobile, OS & Secrets
└── README.md                                   # Root platform documentation & architectural guide
```

---

## 🔒 Architectural Rules & Guidelines

- **Zero Direct Cross-Module Database Coupling**: A module must not directly import or alter Mongoose models of another module; cross-module operations must go through designated service interfaces.
- **Mandatory Branch Scoping**: Except for global `ADMIN` requests, every database query must strictly enforce `branchId` filtering to prevent multi-tenant cross-branch data leaks.
- **Ayah Boundary Invariants**: Progress logging must validate Surah IDs ($1 \dots 114$) and Ayah boundaries using the standard Quranic metadata utilities in `backend/src/utils/`.
- **Conditional Guardianship**: Students with `age < 18` must have a valid `guardianId` assigned upon registration; parents are automatically linked to their children's academic alerts.

---

## 👨‍💻 Project Information

- **Project Name**: Rifq Platform (منصة رِفْق)
- **Specialization**: Software Engineering & Intelligent Systems
- **Platform Type**: Modular Monolith Backend + React RTL Web + Flutter Mobile
- **Status**: Phase 1 — Project Architecture & Monorepo Scaffolding Completed.
