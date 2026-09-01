# E-Learning Platform — Build Roadmap
**Stack:** Node.js + Express.js + EJS + MySQL (XAMPP/MariaDB)
**Schema:** 27 tables, already finalized and validated (SQL script ready to run in phpMyAdmin)

This roadmap sequences work so each phase only depends on tables/features already built in a prior phase — you should never be blocked waiting on something "later" in the plan.

---

## Phase 0 — Project Setup & Architecture

1. `npm init`, install core deps: `express`, `ejs`, `mysql2`, `dotenv`, `bcrypt`, `express-session`, `connect-flash`, `express-validator`, `multer` (file uploads), `helmet`, `morgan`.
2. Start XAMPP (Apache not required, just MySQL), create the `e_learning_platform` DB, run your existing `.sql` file in phpMyAdmin.
3. Set up **MVC folder structure**:
   ```
   /config      → db.js, session config
   /models      → one file per table (or grouped by domain)
   /controllers → business logic per route group
   /routes      → route definitions
   /views       → EJS templates + partials (header/footer/navbar)
   /middleware  → auth, RBAC, error handling, validation
   /public      → CSS, client JS, images
   /utils       → helpers (e.g., price calc, slugify)
   .env         → DB creds, session secret — never commit this
   ```
4. Set up `mysql2` connection pool (not single connection) in `config/db.js`. Use `?namedPlaceholders=true` or parameterized `?` queries everywhere — **never** string-concatenate SQL (this is the #1 thing interviewers/reviewers check for).
5. Push to GitHub immediately, `.gitignore` for `node_modules` and `.env`. Commit early and often — internship reviewers look at commit history, not just the final zip.

**Checkpoint:** server boots, connects to DB, renders one static EJS page.

---

## Phase 1 — Auth & Access Control
*Tables: `Roles`, `Permissions`, `Role_Permissions`, `Users`, `Instructor_Profile`*

1. Seed `Roles` (admin/instructor/student) and `Permissions` + `Role_Permissions` manually via SQL — this data is static, no UI needed for it yet.
2. Build registration (student + instructor sign-up flows), hash passwords with `bcrypt`.
3. Build login with `express-session`, store `user_id` + `role_id` in session.
4. Build `middleware/auth.js`: `isAuthenticated`, and `authorize(...permissions)` that checks the session role against `Role_Permissions`.
5. Build instructor onboarding: creating a `Users` row with role=instructor auto-creates a linked `Instructor_Profile` row (bio/expertise fields editable after).
6. Protect routes by role from day one — this is much harder to retrofit later.

**Checkpoint:** you can register as student or instructor, log in/out, and hitting a protected route without the right role returns a 403.

---

## Phase 2 — Course Catalog (Instructor CRUD + Public Browsing)
*Tables: `Courses`, `Categories`, `Course_Category`, `Lessons`*

1. Instructor dashboard: create/edit/delete own courses (`status`: draft → published).
2. Category management (admin-only CRUD) + assign multiple categories per course via `Course_Category`.
3. Lesson management: instructors add ordered lessons (`order_index`) with `content_type` (video/document/quiz/other) under a course.
4. Public catalog page: list published courses, filter by category/level, search by title.
5. Course detail page: shows curriculum outline (locked lessons for non-enrolled users — enforce this server-side, not just by hiding UI).

**Checkpoint:** an instructor can publish a course with a lesson list; anyone can browse and view course details without logging in.

---

## Phase 3 — Cart, Wishlist, Coupons & Checkout
*Tables: `Cart`, `Cart_Items`, `Wishlist`, `Coupons`, `Orders`, `Order_Items`, `Payments`*

This is the most relationally complex part of your schema — build it carefully in this sub-order:

1. **Wishlist** first (simplest — single table, no transaction logic): add/remove course.
2. **Cart**: on first "Add to Cart," lazily create a `Cart` row for the user; add rows to `Cart_Items`. Show running subtotal.
3. **Coupons**: admin CRUD for coupon codes; apply-coupon endpoint validates `valid_from`/`valid_to`, `usage_limit` vs `times_used`, `min_order_amount` before accepting it.
4. **Checkout → Orders**: this must be a **DB transaction** (`START TRANSACTION` / `COMMIT` / `ROLLBACK` via `mysql2`):
   - Create `Orders` row (subtotal, discount, total, status=`pending`)
   - Copy each `Cart_Items` row into `Order_Items` with `price_at_purchase` locked from current `Courses.price`
   - Clear the cart
5. **Payments**: for a college project, integrate a **sandbox/test gateway** (Razorpay test mode or Stripe test mode — both are free and look legitimate on a resume). Create a `Payments` row per attempt; on gateway success, update `Orders.status = 'completed'`.
6. On `Orders.status = 'completed'`, auto-generate one `Enrollments` row per `Order_Item` (with `order_item_id` set) inside the same transaction/webhook handler.

**Checkpoint:** a student can add multiple courses to cart, apply a coupon, pay via test gateway, and land on "My Courses" with all purchased courses enrolled.

---

## Phase 4 — Learning Experience
*Tables: `Enrollments`, `Progress`, `Lessons` (already built)*

1. "My Courses" dashboard listing all `Enrollments` for the logged-in student.
2. Lesson player page — gate access with a check: enrolled users only.
3. On lesson completion, update `Progress.completed_lessons`, `last_accessed_lesson`, and recompute `completion_percentage`.
4. Sync `Enrollments.completion_status` (`not_started` → `in_progress` → `completed`) based on `Progress`.

**Checkpoint:** progress bar updates in real time as a student moves through lessons, and resumes from `last_accessed_lesson` on return.

---

## Phase 5 — Assessments
*Tables: `Assignments`, `Deadlines`, `Submissions`, `Exams`, `Results`*

1. Instructor: create assignments per course with `max_marks`, linked `Deadlines`.
2. Student: submit assignment (`multer` file upload → `file_url`), block submission after `due_date` unless `late_submission_allowed`.
3. Instructor: grade submissions (`marks_obtained`, `feedback`).
4. Exams: instructor creates exam metadata; build exam-taking flow only if time allows (for an MVP, admin/instructor can manually enter `Results` — a full auto-graded exam engine is a good "future work" item to mention in your README rather than build under deadline pressure).

**Checkpoint:** a student can submit an assignment before the deadline and see instructor feedback and marks.

---

## Phase 6 — Certificates & Reviews
*Tables: `Certificates`, `Reviews`*

1. On `Enrollments.completion_status = 'completed'`, trigger certificate generation: create a `Certificates` row with a unique verifiable URL (e.g., `/certificate/:certificate_url`) — generate an actual PDF with a library like `pdfkit` if you want it to look real.
2. Reviews: only enrolled users can review a course, one review per `(user_id, course_id)`. Show average rating on course cards.

**Checkpoint:** completing a course produces a downloadable/verifiable certificate; enrolled students can leave one review each.

---

## Phase 7 — Notifications & Activity Log
*Tables: `Notifications`, `Activity_Log`*

1. Fire `Notifications` rows on key events (enrollment success, payment success, assignment graded, certificate issued). In-app channel is enough for a project — email via `nodemailer` is a strong bonus if time allows, SMS is not worth the effort here.
2. Write `Activity_Log` entries on sensitive actions (login, role changes, payment attempts) — this is a good talking point in an interview ("I built audit logging for security-relevant events").

**Checkpoint:** a bell icon shows unread notifications; an admin can view the activity log.

---

## Phase 8 — Admin Panel
*Cuts across most tables*

1. Admin dashboard: user management (ban/activate), course moderation (approve/reject published courses), coupon management, category management, order/payment overview.
2. Basic metrics: total users, total revenue (`SUM(Orders.total_amount)` where completed), most enrolled courses — this is a good place to show off a non-trivial SQL query (`JOIN` + `GROUP BY`) since interviewers often ask about this exact thing.

**Checkpoint:** an admin can manage the whole platform without touching phpMyAdmin.

---

## Phase 9 — Hardening, Testing, Polish
*What actually gets you noticed in an SDE internship review*

1. **Input validation** on every form with `express-validator` — never trust client input.
2. **SQL injection check** — verify every query uses parameterized placeholders, no template-string SQL anywhere.
3. **Password/session security** — `helmet`, `httpOnly` cookies, CSRF protection (`csurf` or double-submit token pattern), rate-limit login attempts (`express-rate-limit`).
4. **Error handling** — centralized error middleware, no raw stack traces sent to the client in production.
5. **Environment separation** — `.env.example` committed, real `.env` gitignored, README documents required env vars.
6. **Testing** — at minimum, a Postman collection covering all major routes; if time allows, `jest` + `supertest` for a few critical flows (checkout transaction, auth).
7. **README** — architecture diagram (you already have the ERD), setup instructions, tech stack, screenshots, and a "Future Work" section (this is where `Student_Profile`, live classes, quiz engine, etc. from earlier go — showing you know what's next signals seniority).

---

## Phase 10 — Deployment (optional but strongly recommended for internship applications)

XAMPP is local-only, so for a live demo link:
1. Move DB to a free-tier hosted MySQL (Railway, Aiven, or Clever Cloud).
2. Deploy the Express app to Render or Railway.
3. Update `.env` with production DB credentials; confirm connection pooling settings work under a hosted DB's connection limits.

**Why this matters for internships:** a live link in your resume/GitHub README that a recruiter can click is worth more than a polished local-only project — most reviewers will not clone and run your code.

---

## Suggested Build Order Summary

```
Setup → Auth/RBAC → Course Catalog → Cart/Checkout/Payments →
Enrollment/Progress → Assessments → Certificates/Reviews →
Notifications/Logs → Admin Panel → Security Hardening → Deployment
```

Each phase produces something demoable — don't move to the next phase until the current one's checkpoint works end-to-end. For an internship portfolio, a fully working Phase 0–6 (even without exams/admin panel polish) beats a half-finished Phase 0–9.
