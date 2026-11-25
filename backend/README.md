# Rifq Platform — Backend API (v1.6)

SOLID **Layered Modular Monolith** built with **Node.js (ES Modules)**, **Express.js**, **MongoDB / Mongoose**, **Zod**, and **Swagger UI**, aligned with [api_contract_v1.6.md](../docs/03_api_contract/api_contract_v1.6.md).

---

## 1. Prerequisites

- **Node.js** `>= 20.0.0`
- **MongoDB** `>= 6.0` (local instance or MongoDB Atlas URI)

---

## 2. Running Locally

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGODB_URI and a strong JWT_SECRET
npm run dev
```

| Endpoint | URL |
| :--- | :--- |
| Health Check | `http://localhost:5000/api/v1/health` |
| Swagger UI Docs | `http://localhost:5000/api/docs` |
| Auth Base Route | `http://localhost:5000/api/v1/auth` |

---

## 3. Architecture Overview

```text
backend/src/
├── config/                    # Env validation (Zod), MongoDB connection, Swagger OpenAPI spec
├── common/
│   ├── errors/                # AppError + LSP subclasses (Validation, Unauthorized, Forbidden, NotFound, Conflict)
│   ├── utils/                 # response.js, pagination.js, quranMetadata.js (114 Surahs), ageHelper.js
│   └── middlewares/           # authenticateJWT, authorizeRoles, enforceBranchIsolation, validateRequest, errorHandler
├── models/                    # Barrel re-export of all 16 v1.6 Mongoose models (index.js)
├── modules/                   # Bounded feature modules (auth implemented in Phase 1; all 16 models ready)
├── app.js                     # Express application setup & route mounting
└── server.js                  # MongoDB bootstrap + graceful shutdown
```

---

## 4. Feature Module Template (Strict SOLID Rules)

Every feature module inside `src/modules/<feature>/` must follow this 5-file layered structure:

| File | Responsibility (SRP) |
| :--- | :--- |
| `<feature>.model.js` | Mongoose schema, enums, validation hooks, and indexes |
| `<feature>.validation.js` | Zod request schemas (`body`, `query`, `params`) |
| `<feature>.service.js` | Pure business rules, RBAC/branch checks, database orchestration |
| `<feature>.controller.js` | Thin HTTP handlers calling services and `sendSuccess(...)` (zero business logic) |
| `<feature>.routes.js` | Express Router composing `authenticateJWT`, `authorizeRoles`, `enforceBranchIsolation`, `validateRequest`, and controller handlers |

### Architectural Invariants

1. **Zero Business Logic in Controllers/Routes:** Keep all calculations, age thresholds (`ageHelper.js`), Surah/Ayah checks (`quranMetadata.js`), and state transitions inside `*.service.js`.
2. **Zero-Trust Branch Isolation:** Always extract `userId`, `role`, and `branchId` from `req.user` (set by `authenticateJWT`) and enforce `enforceBranchIsolation()` for all non-`ADMIN` routes.
3. **Standardized Envelopes & Errors:** Return responses exclusively through `sendSuccess()` and throw `AppError` subclasses with error codes defined in `api_contract_v1.6.md`.
