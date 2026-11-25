# Rifq Platform — Design System & UI/UX Architecture (v1.5)

**Target Platforms:** Web Dashboard SPA (React.js + Tailwind CSS, RTL-first) & Mobile App (Flutter / React Native)  
**Design Philosophy:** *"Rifq" (Gentleness & Clarity)* — A serene, distraction-free, modern Islamic-academic visual language built for daily high-frequency teaching workflows, clear Quranic readability, and effortless parent/student tracking.

---

## 1. Brand Identity & Color System

The palette pairs **Deep Emerald** (calmness, heritage, focus) with **Warm Amber Gold** (achievement, highlights) over crisp **Slate/Alabaster** surfaces to prevent eye strain during long memorization and grading sessions.

### 1.1 Brand & Accent Tokens

| Token Name | Hex | Tailwind Equivalent | Usage |
| :--- | :--- | :--- | :--- |
| `brand-primary` | `#059669` | `emerald-600` | Primary CTAs, active navigation states, key progress indicators |
| `brand-primary-hover` | `#047857` | `emerald-700` | Hover/pressed state for primary buttons |
| `brand-primary-dark` | `#064E3B` | `emerald-900` | Sidebar accents, headers, Innovation Engine highlights |
| `brand-primary-soft` | `#ECFDF5` | `emerald-50` | Subtle tinted backgrounds, active pill fills |
| `brand-secondary` | `#D97706` | `amber-600` | Secondary accents, badges, Tajweed & streak highlights |
| `brand-secondary-soft` | `#FFFBEB` | `amber-50` | Draft banners, gentle callouts, Smart Insights cards |

### 1.2 Neutral Surface & Text Tokens (Light Mode Default)

| Token Name | Hex | Tailwind Equivalent | Usage |
| :--- | :--- | :--- | :--- |
| `surface-canvas` | `#F8FAFC` | `slate-50` | Main application background |
| `surface-card` | `#FFFFFF` | `white` | Cards, modals, tables, drawers |
| `surface-subtle` | `#F1F5F9` | `slate-100` | Table headers, secondary inputs, disabled backgrounds |
| `border-default` | `#E2E8F0` | `slate-200` | Card borders, dividers, input outlines |
| `text-primary` | `#0F172A` | `slate-900` | Headings, primary data values |
| `text-secondary` | `#475569` | `slate-600` | Labels, metadata, timestamps |
| `text-muted` | `#94A3B8` | `slate-400` | Placeholders, disabled text, helper hints |

### 1.3 Semantic & Domain-Specific Status Tokens

Designed specifically for **Rifq's domain rules** (Attendance, Revision Plan Lifecycle, RPI Priority, and Assignments):

| Domain | Status / State | Text / Border Hex | Background Hex | Visual Cue |
| :--- | :--- | :--- | :--- | :--- |
| **Smart Revision (RPI)** | `CRITICAL` | `#DC2626` (`red-600`) | `#FEF2F2` (`red-50`) | High-urgency revision item |
| **Smart Revision (RPI)** | `MODERATE` | `#D97706` (`amber-600`) | `#FFFBEB` (`amber-50`) | Medium-priority revision item |
| **Smart Revision (RPI)** | `STABLE` | `#059669` (`emerald-600`) | `#ECFDF5` (`emerald-50`) | Well-retained portion |
| **Plan Lifecycle** | `DRAFT` | `#B45309` (`amber-700`) | `#FEF3C7` (`amber-100`) | Hidden from Student/Parent |
| **Plan Lifecycle** | `APPROVED` | `#2563EB` (`blue-600`) | `#DBEAFE` (`blue-100`) | Teacher verified |
| **Plan Lifecycle** | `ACTIVE` | `#059669` (`emerald-600`) | `#D1FAE5` (`emerald-100`) | Live & trackable |
| **Plan Lifecycle** | `COMPLETED` | `#7C3AED` (`violet-600`) | `#EDE9FE` (`violet-100`) | Final / Immutable |
| **Plan Lifecycle** | `CANCELLED` | `#64748B` (`slate-500`) | `#F1F5F9` (`slate-100`) | Strikethrough / Immutable |
| **Attendance** | `PRESENT` | `#059669` | `#ECFDF5` | Check icon |
| **Attendance** | `ABSENT` | `#DC2626` | `#FEF2F2` | Cross icon |
| **Attendance** | `LATE` | `#D97706` | `#FFFBEB` | Clock icon |
| **Attendance** | `EXCUSED` | `#2563EB` | `#EFF6FF` | Info icon |
| **Assignments** | `isLate: true` | `#DC2626` | `#FEF2F2` | Automatic Late Badge |

---

## 2. Typography & Arabic RTL Engineering

### 2.1 Font Stack

* **Primary Arabic & UI Font:** `IBM Plex Sans Arabic` *(Fallback: `Cairo`, `Tahoma`, `sans-serif`)* — Chosen for crisp geometric clarity in dense dashboards, tables, and mobile cards.
* **Quranic / Surah Text Font:** `Amiri Quran` *(Fallback: `Scheherazade New`, `serif`)* — Used exclusively when displaying Surah names in headers or Ayah text previews. **Must use `line-height: 2.2`** to prevent Arabic diacritics (Tashkeel) from clipping.
* **Numerals, Scores & Technical Data:** `Inter` with `font-variant-numeric: tabular-nums` so scores (`8.5 / 10`), Ayah ranges (`1–25`), RPI values (`42.6`), and dates align vertically in tables.

### 2.2 Type Scale

| Role | Size (Web) | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `Display / Page Title` | `24px` (`1.5rem`) | `700` (Bold) | `1.35` | Main screen headings |
| `Section Heading` | `18px` (`1.125rem`) | `600` (SemiBold) | `1.4` | Card titles, modal headers |
| `Subheading / KPI Label` | `15px` (`0.9375rem`) | `600` (SemiBold) | `1.45` | Group names, student names |
| `Body Default` | `14px` (`0.875rem`) | `400` (Regular) | `1.6` | Table cells, descriptions, notes |
| `Caption / Metadata` | `12px` (`0.75rem`) | `500` (Medium) | `1.4` | Badges, timestamps, helper text |
| `KPI Metric Number` | `28px` (`1.75rem`) | `700` (Bold) | `1.2` | Dashboard stat counters (`tabular-nums`) |

### 2.3 Strict RTL Layout Rules (Tailwind & Mobile)

1. **Root Direction:** Set `<html dir="rtl" lang="ar">` by default; support dynamic toggle to `dir="ltr" lang="en"`.
2. **Logical Properties Only:** Never use physical directional classes (`ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`). Always use logical equivalents:
   * `ms-*` (margin-inline-start), `me-*` (margin-inline-end)
   * `ps-*` (padding-inline-start), `pe-*` (padding-inline-end)
   * `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`
3. **Bi-Directional (BiDi) Isolation:** Emails, phone numbers (`+20100...`), Zoom/Google Meet URLs, and API error codes must be wrapped with `dir="ltr"` and `inline-block` so punctuation and `+` signs do not invert.
4. **Icon Mirroring:** Directional icons (arrows, chevrons, back buttons, logout, pagination) must mirror horizontally in RTL (`rtl:rotate-180`). Non-directional icons (checkmarks, clocks, bells, Quran book, search) remain unmirrored.

---

## 3. Spacing, Layout Grid & Elevation

* **Base Grid:** `4px` micro-unit, `8px` layout rhythm (`p-4` / `16px` mobile card padding, `p-6` / `24px` desktop card padding, `gap-6` between dashboard widgets).
* **Border Radius:**
  * Buttons & Inputs: `8px` (`rounded-lg`)
  * Cards & Modals: `12px` (`rounded-xl`)
  * Status Badges & Pills: `9999px` (`rounded-full`)
* **Elevation:** Flat-first design using subtle `1px solid #E2E8F0` borders instead of heavy drop shadows. Use `shadow-sm` for cards and `shadow-lg` exclusively for floating dropdowns, popovers, and modals.
* **Responsive Shell:**
  * **Desktop Web (`>= 1024px`):** Fixed right-hand Sidebar (`260px` width in RTL) + Top Header (`64px` height: Branch Scope indicator, Notification Bell with `unreadCount` badge, User Profile Menu) + Scrollable Main Content (`max-w-7xl mx-auto`).
  * **Mobile App / Mobile Web (`< 768px`):** Compact Top App Bar + Bottom Navigation Bar (max 4–5 primary tabs per role) + Floating Action Button (FAB) for Teacher's primary daily action (e.g., *Log Quran Progress*).

---

## 4. Core Component Inventory

### 4.1 Foundational UI Primitives
* **Buttons:** `Primary` (Emerald solid), `Secondary` (Slate outline), `Ghost` (Transparent hover), `Destructive` (Red solid — used for Account Deactivation or Plan Cancellation). All buttons must support `isLoading` spinner states and `disabled` states.
* **Form Controls:** Clear top-aligned labels, inline validation errors (mapped directly to `error.details[]` from the REST API Contract), and helper text.
* **Data Tables:** Sticky header, search/filter toolbar, server-side pagination bar (`20/page`), skeleton loading rows, and friendly Empty States with an actionable CTA.
* **Toasts & Banners:** Top-start non-blocking toast notifications for API success/error feedback, plus persistent inline banners for critical states (e.g., *Locked Account*, *Draft Revision Plan*).

### 4.2 Rifq Domain-Specific Components

1. **Quran Ayah Logger (`QuranProgressForm`):**
   * Searchable Surah Dropdown (`1–114`, showing Arabic name + total Ayahs).
   * `Start Ayah` & `End Ayah` numeric inputs with real-time client-side bounds hint (`1` to `totalAyahs(surah)`) matching server validation (`FR-QURAN-02`).
   * Segmented Control for `NEW_MEMORIZATION` vs `REVISION`.
   * Quick-select Score (`1–10`), Tajweed Score (`1–10`), and Mistake Counter (`-` / `+` stepper for fast mobile tapping during live recitation).

2. **Smart Revision Plan Card (`RevisionPlanWorkspace`):**
   * **Teacher View (Human-in-the-Loop):** Displays `DRAFT` warning banner (*"Hidden from student until approved"*), ordered `RevisionItem` list with `RPI Score`, priority pill (`CRITICAL` / `MODERATE` / `STABLE`), metrics breakdown tooltip (Days since review, Mistakes, Score, Absences), inline edit/remove buttons, and a primary **"Approve & Activate Plan"** CTA.
   * **Student / Parent View:** Clean checklist of `ACTIVE` items only, progress bar (`completedItems / totalItems`), and completion toggle.

3. **Bulk Attendance Sheet (`AttendanceMatrix`):**
   * Lists all students in the active session's group.
   * One-tap pill group per row (`PRESENT` | `ABSENT` | `LATE` | `EXCUSED`) + "Mark All Present" shortcut + optional note popover + single **"Save Attendance"** submit button.

4. **Conditional Student Enrollment Form (`StudentEnrollmentWizard`):**
   * Dynamically evaluates `dateOfBirth`.
   * If `age < 18`: Displays **"Minor Student — Guardian Required"** badge and reveals mandatory `Parent Selector (parentIds[])` + `guardianContact` fields.
   * If `age >= 18`: Displays **"Independent Student (18+)"** badge and marks guardian fields as optional.
   * Supports selecting `1 Primary Group` + `N Secondary Track Groups` (`TAJWEED`, `GENERAL`).

5. **Multi-Child Switcher (`ParentChildSelector`):**
   * Horizontal pill strip at the top of the Parent Dashboard allowing instant switching between linked children (`GET /parents/me/children`), displaying each child's avatar, name, and active alert dot.

6. **Assignment Card & Submission Box:**
   * Displays target badge (*Whole Group* vs *Individual*), `assignmentType` icon (`RECITING`, `QUIZ`, `WRITTEN`, `READING`), countdown to `dueDate`, and prominent red `LATE SUBMISSION` badge whenever `isLate === true`.

---

## 5. Information Architecture & Screen Map (5 Roles)

Every role receives a tailored navigation shell strictly matching the **Server-Side RBAC Matrix**.

### 5.1 Academy Admin (`ADMIN`)
*Global governance across all branches.*
1. **Executive Overview:** Cross-branch KPIs (Total Branches, Active Students, Teachers, Overall Attendance Rate).
2. **Branches Management:** Create/edit branches, assign Branch Managers, toggle `ACTIVE`/`INACTIVE`.
3. **Global Users Directory:** Manage Managers, Teachers, Students, and Parents; unlock/deactivate accounts.
4. **System Audits Log:** Filterable read-only timeline of sensitive actions (`SystemAudits`).
5. **Academy Settings:** Global configuration & profile.

### 5.2 Branch Manager (`MANAGER`)
*Strictly scoped to `user.branchId` (Branch badge always visible in header).*
1. **Branch Dashboard:** Branch KPIs (Active Groups, Today's Sessions, Attendance %, Low-Performance Alerts).
2. **Students & Enrollment:** Directory + Conditional Age-Based Enrollment Form + Multi-Track Group assignment.
3. **Teachers & Parents:** Branch staff directory and Guardian account linking.
4. **Multi-Track Groups:** Create/edit `QURAN`, `TAJWEED`, and `GENERAL` groups, schedules, and teacher assignments.
5. **Branch Reports & Audits:** Branch-scoped performance summaries and audit logs.

### 5.3 Teacher (`TEACHER`)
*Optimized for fast daily operational workflows (Web & Mobile).*
1. **Today's Schedule (Home):** Upcoming sessions, quick "Start Session" button, and active Online Class links.
2. **My Groups & Sessions:** Roster view per group, session history, and Bulk Attendance Sheet.
3. **Daily Quran Logging:** Fast Ayah Logger form + immediate student stats feedback.
4. **Smart Revision Studio:** Generate RPI Draft plans per student, edit items, approve/activate, or cancel plans.
5. **Assignments & Grading:** Create dual-target assignments, review submissions (with `isLate` flags), and enter scores/feedback.
6. **Student Evaluations & Online Classes:** Record `REGULAR`/`FINAL` evaluations and post Zoom/Google Meet links.

### 5.4 Student (`STUDENT`)
*Clean, encouraging learning companion (Minor `< 18` or Independent `>= 18`).*
1. **My Learning Home:** Active Revision Plan progress bar, next session/online class card, and recent Quran score.
2. **Active Revision Plan:** Step-by-step checklist of prioritized portions (`CRITICAL` → `STABLE`) with completion toggles.
3. **My Progress & Weakness Analytics:** Memorized Ayahs counter, Tajweed trend chart, and "Surahs Needing Focus" visual breakdown.
4. **Assignments:** Pending, Submitted, and Graded tabs with one-click submission form and deadline countdown.
5. **Schedule & Notifications:** Weekly multi-track timetable, Zoom/Meet join buttons, and In-App notification center.

### 5.5 Parent (`PARENT`)
*Read-only monitoring & alerts for linked minor children.*
1. **Children Overview (Home):** Multi-Child Switcher + summary cards (Attendance %, Latest Score, Active Revision Plan progress).
2. **Child Quran & Analytics View:** Read-only view of memorization history, Tajweed scores, and weakness analytics.
3. **Attendance & Assignments Tracker:** Attendance calendar/log and assignment completion status (highlighting late or missing tasks).
4. **Evaluations & Smart Alerts:** Teacher periodic evaluations and In-App/FCM notification feed (Revision Plan activations, absences, grades).

---

## 6. Tailwind CSS Theme Configuration Reference

Ready-to-use token snippet for `web/tailwind.config.js` to keep implementation 100% aligned with this Design System:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', "Inter", "sans-serif"],
        quran: ['"Amiri Quran"', '"Scheherazade New"', "serif"],
        mono: ["Inter", "monospace"],
      },
      colors: {
        rifq: {
          primary: "#059669",
          primaryHover: "#047857",
          primaryDark: "#064E3B",
          primarySoft: "#ECFDF5",
          secondary: "#D97706",
          secondarySoft: "#FFFBEB",
          canvas: "#F8FAFC",
          border: "#E2E8F0",
        },
        rpi: {
          critical: "#DC2626",
          moderate: "#D97706",
          stable: "#059669",
        },
      },
      borderRadius: {
        card: "0.75rem", // 12px
      },
    },
  },
  plugins: [],
};
```