# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with hot reload (tsx watch)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled output from dist/
```

No test framework is configured — `npm test` exits with an error.

## Environment Variables

Create a `.env` file with:

```
PORT=5000
NODE_ENV=development

JWT_SECRET=

DB_USER=
DB_PASS=
DB_NAME=
DB_HOST=
DB_NAME_TEST=
DB_NAME_PROD=

AZURE_STORAGE_CONNECTION_STRING=
AZURE_CONTAINER_NAME=
```

## Architecture

This is the backend API for **iSkolar Mobile**, a scholarship management platform for students and sponsors.

### Request Lifecycle

`routes/` → `middlewares/` → `controllers/` → `models/`

- Routes wire HTTP methods to controller functions, applying middleware as needed
- `middlewares/auth.middleware.ts` — JWT Bearer token authentication; injects `req.user` (`{ id, email }`)
- `middlewares/rateLimit.middleware.ts` — rate limiting on sensitive endpoints
- Controllers handle business logic and call Sequelize models directly
- `utils/responses.ts` — use these helpers (`ok`, `created`, `badRequest`, `notFound`, `serverError`, etc.) for all HTTP responses

### Database

Sequelize ORM over PostgreSQL. **There are no migrations** — the app calls `sequelize.sync({ alter: true })` on startup, which auto-alters tables to match model definitions. All model PKs are UUIDs (`DataTypes.UUIDV4`).

Model associations are defined as static `associate(models)` methods and wired together in `index.ts` before DB connection.

### Data Model

```
User (user_id, email, password, role: admin|student|sponsor, has_selected_role)
 ├─ Student (student profile, belongs to User)
 └─ Sponsor (sponsor profile, belongs to User)
       └─ Scholarship (scholarship_id, status: draft|active|closed|suspended|archived,
                       type: merit_based|skill_based, criteria[], custom_form_fields JSONB)
             ├─ ScholarshipApplication (per-student application with custom_form_response[])
             └─ SelectedScholar (scholars chosen from applications)
```

### Scholar Selection Algorithm

`utils/decision-tree-ranking.ts` exports `rankApplicants()` — a weighted decision tree that scores applicants across four nodes:
- **Criteria Matching** (40%) — fuzzy match of responses against scholarship criteria
- **Academic Performance** (25%) — normalizes GPA/GWA across percentage (0–100), GWA (1.0–5.0), and 4.0-scale systems
- **Form Completeness** (20%) — ratio of filled required fields
- **Response Quality** (15%) — average response length heuristic

Bonus points (+0.05 each) for 100% form completion and meeting all criteria. Scores are capped at 1.0.

### File Storage

`config/azure.ts` exports a `containerClient` for Azure Blob Storage, used for profile pictures and scholarship documents (via `multer` for upload handling).

### Validation & Security

`utils/validation.ts` provides `isSafeInput`, `sanitizeString`, `normalizeEmail`, `isValidPassword`, `isValidOTP`. The auth middleware uses `isSafeInput` to guard tokens before JWT verification.
