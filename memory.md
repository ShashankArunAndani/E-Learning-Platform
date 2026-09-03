# Project Memory — E-Learning Platform

Last updated: 2026-09-03 by Cursor (Phase 4 completed)

## Current Phase
Phase 5 — Assessments complete. Ready for Phase 6 (Certificates & Reviews).

## Completed Checkpoints
- [x] Phase 0 — Project Setup & Architecture
- [x] Phase 1 — Auth & Access Control
- [x] Phase 2 — Course Catalog
- [x] Phase 3 — Cart, Wishlist, Coupons & Checkout
- [x] Phase 4 — Learning Experience
- [x] Phase 5 — Assessments
- [ ] Phase 6 — Certificates & Reviews
- [ ] Phase 7 — Notifications & Activity Log
- [ ] Phase 8 — Admin Panel
- [ ] Phase 9 — Hardening, Testing, Polish
- [ ] Phase 10 — Deployment

## Current State
- What's built and working right now:
  - Phase 0–3: (unchanged — see prior entries in Decisions section)
  - Phase 4 Learning Experience:
    - `models/Progress.js`: getProgress (auto-init), updateLastAccessed, recordLessonCompletion (transaction syncs Enrollments.completion_status + progress_percentage per DFD-2.7).
    - `models/Enrollment.js`: extended with getUserEnrollments, getEnrollment (JOIN Progress).
    - `controllers/learnController.js`: My Courses dashboard, smart resume (`/learn/:course_id`), gated lesson player, lesson completion (JSON + redirect).
    - `routes/learnRoutes.js`: `/my-courses`, `/learn/:course_id`, `/learn/:course_id/lessons/:lesson_id`, POST complete.
    - `views/learn/myCourses.ejs`: enrolled courses with verdant progress bars and stats.
    - `views/learn/player.ejs`: sidebar curriculum, content player, Mark Complete with real-time progress update.
    - `public/js/learn-player.js`: fetch-based completion (DFD-2.7 7.12–7.14).
    - `public/css/styles.css`: learning component styles (progress bars, player layout).
    - Navbar: "My Courses" link for students.
    - Course detail: enrolled state shows progress + Continue Learning; curriculum unlocked for enrolled users.
    - Order success page links to `/my-courses`.
    - Routes mounted in `server.js`.
  - Phase 5 Assessments:
    - `models/Assignment.js`: Transactional assignment and deadline creation.
    - `models/Submission.js`: Submit assignment and grade logic.
    - `models/Exam.js`: Metadata creation and manual Results entry (UPSERT).
    - `controllers/assignmentController.js`: Instructor CRUD, student submit, instructor grade.
    - `controllers/examController.js`: Instructor CRUD, instructor result entry.
    - `routes/assignmentRoutes.js` & `routes/examRoutes.js`: Mounted securely under `/courses/:course_id/*`.
    - `middleware/uploadMiddleware.js`: multer setup to `public/uploads/assignments`.
    - `views/assessments/`: EJS templates for assignments, assignment details (grading), exams, exam details (result entry).
    - Dashboard updates: `manage.ejs` and `myCourses.ejs` now have links to assignments and exams.
- What's in progress / half-built: None — Phase 5 checkpoint verified.

## Decisions & Resolved Ambiguities
(append-only — do not delete past entries)
- 2026-09-01: **Certificate eligibility** — resolved as Progress-based only (100% `completed_lessons`/`total_lessons` → `Enrollments.completion_status = 'completed'` → certificate eligible). Roadmap Phase 4 only ties completion sync to `Progress`, not to assignments/exams, so that's the binding rule. Do not re-litigate without explicit user instruction.
- 2026-09-01: **Course moderation states** — `Courses.status` enum is only `draft`/`published`/`archived` (no `pending_approval`/`rejected`). Admin "moderation" (Phase 8) = directly toggling among these three values, not a separate approval queue.
- 2026-09-01: **Payment gateway** — sandbox/test mode only (Razorpay or Stripe test mode per roadmap Phase 3). Not a production integration.
- 2026-09-01: **Notification channels** — `in_app` is the only channel to actually build. `email` is optional/bonus (via `nodemailer` if time allows). `sms` is schema-supported but explicitly out of scope — do not implement.
- 2026-09-01: **Exams/Results** — no student-facing exam-taking or auto-grading UI. Instructor creates exam metadata; instructor/admin manually enters `Results`. Auto-grading is future work only.
- 2026-09-01: **Payments → Orders redesign** — `Payments` links to `Orders` (not directly to `user_id`/`course_id`), specifically to support multi-course cart checkout in a single transaction. `price_at_purchase` on `Order_Items` locks price at time of purchase.
- 2026-09-01: **Users table** — single `role_id` FK + role-specific extension tables (`Instructor_Profile`, 1:1) — not separate nullable `student_id`/`faculty_id` FKs. This is the correct "class table inheritance" pattern; do not restructure it.
- 2026-09-01: **No ORM, no frontend framework** — raw `mysql2` parameterized queries and server-rendered EJS only, per `rules.md` Section 2. Don't introduce Sequelize/Prisma/React etc. without asking.
- 2026-09-01: **Instructor Registration Transaction** — User registration with role='Instructor' creates both `Users` record and `Instructor_Profile` record within a single database transaction via `db.withTransaction`.
- 2026-09-01: **RBAC Architecture** — Permissions checked dynamically against `Role_Permissions` table using `authorize(...permissions)` middleware.
- 2026-09-01: **Rate Limiting & Auth Hardening** — Auth routes protected by `express-rate-limit` (max 30 requests per 15 min per IP) and `helmet` CSP configured for Google Fonts.
- 2026-09-01: **Multi-Category Course Mapping** — Multi-category assignment for courses uses atomic database transactions (`Course.create` and `Course.update`) to sync `Course_Category` junction rows without ORM overhead.
- 2026-09-01: **Instructor Ownership Scope** — Instructors can only view, edit, publish, or delete courses they own (`instructor_id = user_id`). Admins can moderate all courses.
- 2026-09-01: **Server-Side Lesson Protection** — Lesson content URLs are kept locked on the server side for non-enrolled users viewing the public course detail page (`/courses/:id`).
- 2026-09-01: **Checkout DB Transaction** — Order initiation (`Order.createOrderFromCart`) executes inside a MySQL transaction creating `Orders`, locking `price_at_purchase` in `Order_Items`, clearing cart items, and incrementing coupon usage.
- 2026-09-01: **Payment Auto-Enrollment Hard Rule** — `Payment.processPaymentAndEnroll` executes inside a MySQL transaction. On payment success, updates `Orders.status = 'completed'` and auto-creates `Enrollments` and `Progress` rows. Failed payments set `Orders.status = 'failed'` and NEVER create `Enrollments`.
- 2026-09-03: **Progress completion logic** — `recordLessonCompletion` advances `completed_lessons` to `max(current, lesson.order_index)` inside a transaction, recalculates `completion_percentage`, syncs `Enrollments.completion_status` (`not_started`/`in_progress`/`completed`) per DFD-2.7 Process 7.13–7.14.
- 2026-09-03: **Lesson player access** — Enrolled students + course owner/admin can access `/learn/:course_id/lessons/:lesson_id`. Non-enrolled users redirected with paywall denial (DFD-2.7 Process 7.10).

## Known Issues / Blockers
- None.

## Next Steps
1. Phase 6 — Certificates & Reviews:
   - Auto-generate certificates on completion (`pdfkit`).
   - Allow enrolled students to leave reviews (1-5 stars).

## File/Route Inventory
| File | Purpose | Status |
|---|---|---|
| `package.json` | Project dependencies & scripts | Built |
| `server.js` | Express app entry point & middleware pipeline | Built & Updated |
| `config/db.js` | MySQL pool setup & parameterized query helper | Built |
| `config/session.js` | express-session configuration | Built |
| `scripts/initDb.js` | Database & schema initializer & seed script | Built & Executed |
| `scripts/seedCatalog.js` | Course catalog & categories seed script | Built & Executed |
| `scripts/seedCoupons.js` | Test coupon codes seed script | Built & Executed |
| `models/Role.js` | Roles & Role_Permissions data model | Built |
| `models/User.js` | User CRUD & transactional instructor registration | Built |
| `models/InstructorProfile.js` | Instructor_Profile data model | Built |
| `models/ActivityLog.js` | Activity_Log audit logging model | Built |
| `models/Category.js` | Categories table raw SQL model | Built |
| `models/Course.js` | Courses & Course_Category raw SQL model | Built |
| `models/Lesson.js` | Lessons table raw SQL model | Built |
| `models/Wishlist.js` | Wishlist table raw SQL model | Built |
| `models/Cart.js` | Cart and Cart_Items raw SQL model | Built |
| `models/Coupon.js` | Coupons table & discount calculation model | Built |
| `models/Order.js` | Orders & Order_Items transactional model | Built |
| `models/Payment.js` | Payments & Auto-Enrollment transaction model | Built |
| `models/Enrollment.js` | Enrollments query model with progress JOINs | Built & Updated |
| `models/Progress.js` | Progress tracking & enrollment sync model | Built |
| `middleware/authMiddleware.js` | `isAuthenticated` & `authorize` RBAC middleware | Built |
| `middleware/validationMiddleware.js` | express-validator for auth, course, category, lesson, and coupon forms | Built & Updated |
| `middleware/errorHandler.js` | Centralized error handler | Built |
| `utils/asyncHandler.js` | Controller async error forwarding helper | Built |
| `controllers/homeController.js` | Landing page controller | Built |
| `controllers/authController.js` | Register, Login, Logout, Audit log controller | Built |
| `controllers/dashboardController.js` | Main, Instructor & Admin dashboard controller | Built |
| `controllers/categoryController.js` | Admin Category CRUD controller | Built |
| `controllers/courseController.js` | Public Catalog & Instructor Course CRUD controller | Built & Updated |
| `controllers/lessonController.js` | Ordered Lesson Management controller | Built |
| `controllers/wishlistController.js` | Student Wishlist controller | Built |
| `controllers/cartController.js` | Shopping Cart & Coupon application controller | Built |
| `controllers/couponController.js` | Admin Coupon Management controller | Built |
| `controllers/checkoutController.js` | Transactional Checkout & Test Payment Gateway controller | Built |
| `controllers/learnController.js` | My Courses, lesson player, completion sync controller | Built |
| `routes/indexRoutes.js` | `/` route | Built |
| `routes/authRoutes.js` | `/register`, `/login`, `/logout` routes | Built |
| `routes/dashboardRoutes.js` | `/dashboard`, `/dashboard/instructor`, `/dashboard/admin` | Built |
| `routes/categoryRoutes.js` | `/categories` (GET, POST), edit, delete routes | Built |
| `routes/courseRoutes.js` | `/courses`, `/courses/manage`, `/courses/new`, `/courses/:id`, edit, status, delete routes | Built |
| `routes/lessonRoutes.js` | `/courses/:course_id/lessons`, edit, delete routes | Built |
| `routes/wishlistRoutes.js` | `/wishlist` (GET, POST add/remove) routes | Built |
| `routes/cartRoutes.js` | `/cart` (GET, POST add/remove/coupon) routes | Built |
| `routes/couponRoutes.js` | `/coupons` (GET, POST, toggle) routes | Built |
| `routes/checkoutRoutes.js` | `/checkout/initiate`, `/checkout/:id`, `/checkout/:id/pay`, `/orders`, `/orders/:id/success` routes | Built |
| `routes/learnRoutes.js` | `/my-courses`, `/learn/:course_id`, lesson player, complete routes | Built |
| `public/css/tokens.css` | Design system CSS tokens | Built |
| `public/css/styles.css` | Academic typography & component styling | Built & Updated |
| `public/js/learn-player.js` | Real-time lesson completion & progress bar update | Built |
| `views/partials/head.ejs` | HTML head with Google Fonts & CSS links | Built |
| `views/partials/navbar.ejs` | Responsive navigation partial with My Courses link | Built & Updated |
| `views/partials/footer.ejs` | Footer partial | Built |
| `views/partials/flash.ejs` | Alert notification partial | Built |
| `views/index.ejs` | Home landing page with hero certificate mockup | Built |
| `views/auth/login.ejs` | Sign in form view | Built |
| `views/auth/register.ejs` | Registration form view (Student/Instructor) | Built |
| `views/dashboard.ejs` | Role-based dashboard view | Built |
| `views/categories/index.ejs` | Category management view for admins | Built |
| `views/courses/index.ejs` | Filterable public course catalog view | Built |
| `views/courses/show.ejs` | Course detail with enrollment progress & unlocked curriculum | Built & Updated |
| `views/courses/manage.ejs` | Instructor course management workspace | Built |
| `views/courses/form.ejs` | Create and edit course form view | Built |
| `views/courses/lessons.ejs` | Lesson manager view for courses | Built |
| `views/wishlist/index.ejs` | Student Wishlist view | Built |
| `views/cart/index.ejs` | Student Cart view with coupon form & summary | Built |
| `views/coupons/index.ejs` | Admin Coupon Management view | Built |
| `views/checkout/index.ejs` | Sandbox Test Payment Gateway page | Built |
| `views/orders/success.ejs` | Order success confirmation receipt view | Built & Updated |
| `views/orders/index.ejs` | Student Order History view | Built |
| `views/learn/myCourses.ejs` | Student enrolled courses dashboard with progress | Built |
| `views/learn/player.ejs` | Gated lesson player with curriculum sidebar | Built |
| `views/error.ejs` | Error page template | Built |
| `models/Assignment.js` | Assignment & Deadlines model | Built |
| `models/Submission.js` | Submission model | Built |
| `models/Exam.js` | Exam & Results model | Built |
| `controllers/assignmentController.js` | Assignment and Submission controller | Built |
| `controllers/examController.js` | Exam and Result controller | Built |
| `routes/assignmentRoutes.js` | Assignment & Submission routes | Built |
| `routes/examRoutes.js` | Exam & Result routes | Built |
| `middleware/uploadMiddleware.js` | Multer upload configuration | Built |
| `views/assessments/assignments.ejs` | Instructor & student assignments view | Built |
| `views/assessments/assignment_details.ejs` | Instructor grading view | Built |
| `views/assessments/exams.ejs` | Instructor & student exams view | Built |
| `views/assessments/exam_details.ejs` | Instructor manual results entry view | Built |
