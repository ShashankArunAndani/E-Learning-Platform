# rules.md — AI Collaboration Rules for E-Learning Platform

This file governs how any AI assistant (Claude Code, Copilot, etc.) must behave while working on this project. It is binding. When in doubt, the assistant must stop and ask rather than guess.

---

## 0. Source of Truth (read before touching any code)

These project files are authoritative. Nothing outside them should be assumed:

| File / Folder | Authority over |
|---|---|
| `/SCHEMA/` (SQL script, `SCHEMA__features_and_Relationships.md`) | Table names, columns, types, constraints, FKs |
| `/ERD/` (`ERD.mermaid`, `ERD_SVG.svg`, `ERD.pdf`) | Entity relationships and cardinality |
| `/Data flow diagrams/` | Business logic, process order, success/failure paths, transaction boundaries |
| `build_roadmap.md` | Build phase order and scope per phase |
| `design_system.md` | Colors, typography, layout rules for all UI work |

**Rule:** if a task requires information not settled in one of these files, the assistant must ask the user rather than inventing an answer. It must never silently add a table, column, route, or business rule that isn't already documented.

---

## 1. Tech Stack — Required

| Layer | Use |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Views | EJS (server-rendered) — no client-side framework |
| Database | MySQL/MariaDB via XAMPP |
| DB driver | `mysql2` (connection pool, parameterized queries only) |
| Auth | `bcrypt` (hashing), `express-session` (sessions) |
| Validation | `express-validator` |
| File uploads | `multer` |
| Security middleware | `helmet`, `express-rate-limit` (login routes) |
| Logging | `morgan` (dev), `Activity_Log` table (audit) |
| Flash messages | `connect-flash` |
| Env config | `dotenv` |
| Certificate PDF (optional) | `pdfkit` |
| Email (optional, in-app is default) | `nodemailer` |

## 2. Tech Stack — Prohibited unless explicitly requested

- **No ORMs** (Sequelize, Prisma, TypeORM, etc.) — raw parameterized SQL via `mysql2` only. This is a deliberate choice for the project; do not introduce one to "simplify" data access.
- **No frontend frameworks** (React, Vue, Angular) — views are EJS only.
- **No TypeScript conversion** — project is plain JavaScript unless the user asks otherwise.
- **No new npm packages** outside the list above without asking first and stating why the existing stack can't do it.
- **No SMS notification implementation** — schema supports the enum value, but the roadmap explicitly scopes this out. Don't build it.
- **No student-facing auto-graded exam engine** — explicitly out of scope per roadmap; exams are instructor-entered metadata + manually entered results only.
- **No cloud storage integration** (S3, Cloudinary, etc.) unless requested — file uploads go to local disk via `multer`, path stored in the relevant `file_url`/`content_url` column.

## 3. Database Rules

- **Never** modify the schema (add/remove/rename tables or columns) without flagging it to the user first and explaining why. The schema in `/SCHEMA/` is finalized.
- **Never** write string-concatenated SQL. Every query uses `?` placeholders via `mysql2`.
- **Always** wrap multi-table writes in a transaction (`START TRANSACTION` / `COMMIT` / `ROLLBACK`) when the DFDs specify one — most notably checkout (`Orders` → `Order_Items` → clear `Cart`).
- **Always** respect existing `UNIQUE` constraints in application logic before insert (e.g., don't add duplicate cart items, wishlist entries, or reviews — check first or let the DB constraint fail gracefully and handle the error, don't suppress it).
- A failed payment must **never** result in an `Enrollments` row being created. This is a hard rule from the DFDs, not a suggestion.
- `Enrollments.completion_status` is derived from `Progress` (lesson completion), per the roadmap and DFDs. Do not gate it on assignments/exams unless the user explicitly changes this rule — it was previously flagged as an ambiguity and resolved this way; don't silently re-decide it.

## 4. Architecture Rules

- Follow the documented MVC structure exactly:
  ```
  /config  /models  /controllers  /routes  /views  /middleware  /public  /utils
  ```
- Controllers call models directly — **no service/repository layer** unless the user asks for one. Don't add architectural layers that aren't in the roadmap.
- Follow the roadmap's phase order. Don't build Phase 5 (assessments) features while Phase 1 (auth) is incomplete, even if asked for a "quick addition" — flag the ordering conflict instead of quietly skipping ahead.
- Match the DFD process logic for any workflow that has one documented (checkout, coupon validation, certificate eligibility, etc.) — don't invent a different flow that "seems simpler."

## 5. Security Rules

- Every route that touches user-specific or role-specific data must go through the `isAuthenticated` / `authorize(...)` middleware pattern — no exceptions "to save time."
- Passwords: `bcrypt` only, never store or log plaintext.
- Sessions: `httpOnly` cookies, session secret from `.env`, never hardcoded.
- All form input validated server-side with `express-validator`, regardless of any client-side validation present.
- CSRF protection required on all state-changing routes once implemented (Phase 9) — don't remove it later "to debug faster" without re-adding it before moving on.
- `.env` is never committed. If the assistant ever needs to reference credentials, it uses `process.env.*`, never literal values.

## 6. Error Handling Rules

- Centralized error-handling middleware in Express (`app.use((err, req, res, next) => ...)`) — don't scatter ad hoc `try/catch` + custom responses across every route.
- Every `async` route handler must have its errors caught and forwarded to `next(err)` — either via `try/catch` or an async-wrapper utility. No unhandled promise rejections.
- **Production:** never send raw stack traces or SQL error messages to the client. Log the detail server-side, return a generic message to the user.
- **Development:** fuller error detail is fine in server console/logs, gated by `NODE_ENV`.
- Database errors (constraint violations, connection failures) must be caught explicitly and translated into a meaningful user-facing message (e.g., duplicate cart item → "This course is already in your cart," not a raw MySQL error).
- Payment failures follow the DFD's documented path: mark `Payments.status = 'failed'`, leave `Orders.status` as `'failed'` or `'pending'` per the retry flow, notify the user, allow retry — never fail silently.

## 7. Process Rules — How the AI Should Work

- **Ask before deviating.** If a request conflicts with the schema, roadmap, DFDs, or design system, say so explicitly and ask how to proceed — don't silently pick an interpretation.
- **Don't invent scope.** If a feature isn't in the documented plan (e.g., live classes, gamification, a service layer), don't add it "for completeness" — mention it as a possible future addition instead and wait for confirmation.
- **Preserve prior decisions.** Assumptions and ambiguity resolutions already made (documented in `Data flow architecture` and this file) are binding until the user changes them — don't re-litigate them each session.
- **Small, reviewable changes.** Prefer completing one roadmap phase/checkpoint at a time over large multi-phase commits, so the user can verify each checkpoint before moving on.
- **Match the design system.** Any HTML/EJS/CSS output uses the tokens and typography rules in `design_system.md` — don't default to generic Bootstrap-style components or arbitrary colors.
- **Explain non-obvious choices.** When a business rule from the DFDs is being implemented (e.g., coupon validation order, transaction rollback), leave a short comment referencing which rule it satisfies — this project is being built for an internship portfolio, so code should read as intentional, not improvised.

## 8. What the AI Should NOT Do

- Do not rewrite or "clean up" the schema, ERD, or DFDs on its own initiative.
- Do not silently downgrade a transactional operation (e.g., checkout) to non-transactional "for simplicity."
- Do not add authentication bypasses, hardcoded test users, or disabled validation "temporarily" and leave them in place.
- Do not fabricate data (fake reviews, fake enrollments, seed data beyond what's needed for testing) without labeling it clearly as test/seed data.
- Do not introduce a payment gateway other than the documented test/sandbox integration (Razorpay or Stripe test mode) without being asked.
- Do not skip the confirmation step before actions that modify shared state in ambiguous ways (e.g., bulk data changes, deleting seed data).

## 9. What the AI Should Do

- Reference the DFDs for the correct process/data-store sequence before implementing any non-trivial workflow.
- Keep `/SCHEMA/`, `/ERD/`, `/Data flow diagrams/`, `build_roadmap.md`, and `design_system.md` as living references — read the relevant one before starting a feature in that domain.
- Flag any place where implementation reveals a gap or contradiction in the existing docs (this has already happened once — certificate eligibility and course-moderation states were ambiguous and got explicitly resolved; treat future gaps the same way).
- Write parameterized queries, transactions, and validation as the default, not as an afterthought pass.
- Keep commits scoped to one roadmap phase or checkpoint where possible.

## 10. Session Memory — `memory.md`

The project root also contains `memory.md`. Its job is to carry state across sessions and across AI tools, so context is never rebuilt from scratch and never fabricated.

**Read it first, every session, before doing anything else.** If `memory.md` exists, treat it as the authoritative record of what's already built. Do not re-read the entire codebase "to be safe" — spot-check only the specific files relevant to the current task. Re-deriving project state from scratch every session is exactly the token waste this file exists to prevent.

**Update it immediately after any meaningful unit of work** — a completed route, a finished feature, a resolved bug, a roadmap checkpoint hit. Do not wait until the end of a session to update it; sessions can end abruptly (context limit, tool switch, user closing the chat) and an unrecorded change is a lost change.

**Format discipline:**
- Bullet points and short lines only — this is a state file, not a journal or a changelog narrative.
- Append to "Decisions & Resolved Ambiguities" — never delete or rewrite history there, even if a decision is later reversed (add a new entry noting the reversal instead).
- Keep "Current State" and "Next Steps" short and current — overwrite these freely, they reflect *now*, not history.
- Every entry that matters should be dated.

**If `memory.md` is missing:** create it using the template below before starting work.

**If `memory.md` contradicts the actual code** (e.g., it says a route is done but the file doesn't exist): stop, flag the mismatch to the user, and reconcile before proceeding — don't silently trust either source over the other.

### `memory.md` template

```markdown
# Project Memory — E-Learning Platform

Last updated: <date> by <AI tool/session>

## Current Phase
Phase <N> — <name>, per build_roadmap.md

## Completed Checkpoints
- [ ] Phase 0 — Project Setup & Architecture
- [ ] Phase 1 — Auth & Access Control
- [ ] Phase 2 — Course Catalog
- [ ] Phase 3 — Cart, Wishlist, Coupons & Checkout
- [ ] Phase 4 — Learning Experience
- [ ] Phase 5 — Assessments
- [ ] Phase 6 — Certificates & Reviews
- [ ] Phase 7 — Notifications & Activity Log
- [ ] Phase 8 — Admin Panel
- [ ] Phase 9 — Hardening, Testing, Polish
- [ ] Phase 10 — Deployment

## Current State
- What's built and working right now (files/routes/models that exist and function):
- What's in progress / half-built:

## Decisions & Resolved Ambiguities
(append-only — do not delete past entries)
- <date>: <decision and why>

## Known Issues / Blockers
- 

## Next Steps
1. 
2. 

## File/Route Inventory
| File | Purpose | Status |
|---|---|---|
```

---

**This file should be updated whenever a new binding decision is made** (e.g., a new ambiguity gets resolved, a new library gets approved) — it is meant to stay in sync with the project's actual rules, not be written once and ignored.
