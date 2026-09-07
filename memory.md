# Project Memory — E-Learning Platform

Last updated: 2026-09-07 by Antigravity (Phase 8 completed)

## Current Phase
Phase 8 — Admin Panel completed. Ready for Phase 9 (Hardening, Testing, Polish).

## Completed Checkpoints
- [x] Phase 0 — Project Setup & Architecture
- [x] Phase 1 — Auth & Access Control
- [x] Phase 2 — Course Catalog
- [x] Phase 3 — Cart, Wishlist, Coupons & Checkout
- [x] Phase 4 — Learning Experience
- [x] Phase 5 — Assessments
- [x] Phase 6 — Certificates & Reviews
- [x] Phase 7 — Notifications & Activity Log
- [x] Phase 8 — Admin Panel
- [ ] Phase 9 — Hardening, Testing, Polish
- [ ] Phase 10 — Deployment

## Current State
- What's built and working right now:
  - Phase 0–7: (unchanged — see prior entries in Decisions section)
  - Phase 8 Admin Panel:
    - `models/Metric.js`: Analytics and reporting model providing platform-wide KPI metrics (`total_users`, breakdown by role/status, completed order `total_revenue`, `course_metrics`, and `most_enrolled_courses` via multi-table `JOIN` + `GROUP BY`).
    - `models/User.js`: Extended with `findAllUsers` joining `Roles` and `updateStatus` for account lifecycle management.
    - `models/Order.js`: Extended with `findAllOrdersForAdmin` with customer info, coupon details, line-item aggregates, and full order details with payment attempts.
    - `controllers/dashboardController.js`: Updated `renderAdminDashboard` to parallel-load recent `ActivityLog` entries and comprehensive KPI metrics.
    - `controllers/adminController.js`: Handles user status modification (`active`/`inactive`/`banned`) with self-protection and audit logging, course moderation (`draft`/`published`/`archived`) with audit logging, and orders/payments overview and details inspection.
    - `routes/adminRoutes.js`: Admin-protected routes (`/admin/users`, `/admin/courses`, `/admin/orders`, `/admin/orders/:order_id`) protected by `isAuthenticated` and `authorize('user:manage')`.
    - `views/dashboard.ejs`: Admin panel mode updated with financial revenue cards, user demographics, course distribution stats, top enrolled courses leaderboard, recent audit log table, and direct management shortcuts.
    - `views/admin/users.ejs`: Filterable user table with role pills, account status badges, and inline status update actions.
    - `views/admin/courses.ejs`: Platform-wide course catalog moderation workspace with status lifecycle triggers (Publish / Draft / Archive).
    - `views/admin/orders.ejs`: Financial transaction table with customer names, applied coupons, item counts, totals, and link to inspection.
    - `views/admin/order-details.ejs`: Detailed receipt view with purchased courses, student summary, coupon breakdown, and payment attempt history.
    - `views/partials/navbar.ejs`: Streamlined admin navigation with direct links to Users, Course Moderation, Orders, Categories, and Coupons.
    - `server.js`: Mounted `adminRoutes` into the middleware pipeline.
- What's in progress / half-built: None — Phase 8 checkpoint verified with syntax checks and module import verification.

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
- 2026-09-04: **Phase 6 certificates** — Certificates are issued from progress/enrollment completion only, using a unique `certificate_url` token and public `/certificate/:certificate_url` verification route per DFD-2.10. PDF generation is not added because `pdfkit` is optional and not currently installed; the certificate page supports browser print/save-as-PDF.
- 2026-09-04: **Phase 6 reviews** — Reviews require authentication plus enrollment, validate rating 1-5, and rely on the schema unique key for one review per user/course with friendly duplicate handling per DFD-2.11.
- 2026-09-05: **Phase 7 notifications** — In-app is the only implemented notification channel. App events create `Notifications.channel = 'in_app'` rows with `status = 'sent'`; read actions update `status = 'read'` and `read_at`, matching DFD-2.12 without adding email/SMS providers.
- 2026-09-05: **Phase 7 audit log** — Existing `Activity_Log` writes remain the audit source; admin visibility is through `/dashboard/admin`, which now renders metadata JSON alongside action, user, IP, and timestamp per DFD-2.13.
- 2026-09-07: **Phase 8 Admin metrics & governance** — Admin panel utilizes `Metric.js` for non-trivial SQL aggregation (`SUM`, `COUNT`, `AVG`, `GROUP BY`). User status updates prevent self-deactivation and trigger `Activity_Log` records. Course status moderation allows direct lifecycle transitions (`draft`, `published`, `archived`) with audit logging. All admin endpoints enforce RBAC `user:manage` permission.

## Known Issues / Blockers
- None.

## Next Steps
1. Phase 9 — Hardening, Testing, Polish:
   - Run input validation audit across forms.
   - Verify CSRF & SQL injection protections.
   - Create tests and finalize README documentation.
2. Phase 10 — Deployment preparations.

## File/Route Inventory
| File | Purpose | Status |
|---|---|---|
| `package.json` | Project dependencies & scripts | Built |
| `server.js` | Express app entry point, middleware pipeline, unread notification locals, admin routes mount | Built & Updated |
| `config/db.js` | MySQL pool setup & parameterized query helper | Built |
| `config/session.js` | express-session configuration | Built |
| `scripts/initDb.js` | Database & schema initializer & seed script | Built & Executed |
| `scripts/seedCatalog.js` | Course catalog & categories seed script | Built & Executed |
| `scripts/seedCoupons.js` | Test coupon codes seed script | Built & Executed |
| `models/Role.js` | Roles & Role_Permissions data model | Built |
| `models/User.js` | User CRUD, transactional instructor registration, and user listing/status updates | Built & Updated |
| `models/InstructorProfile.js` | Instructor_Profile data model | Built |
| `models/ActivityLog.js` | Activity_Log audit logging model | Built |
| `models/Category.js` | Categories table raw SQL model | Built |
| `models/Course.js` | Courses & Course_Category raw SQL model | Built |
| `models/Lesson.js` | Lessons table raw SQL model | Built |
| `models/Wishlist.js` | Wishlist table raw SQL model | Built |
| `models/Cart.js` | Cart and Cart_Items raw SQL model | Built |
| `models/Coupon.js` | Coupons table & discount calculation model | Built |
| `models/Order.js` | Orders & Order_Items transactional model with admin overview query | Built & Updated |
| `models/Payment.js` | Payments, Auto-Enrollment, and payment/enrollment notifications | Built & Updated |
| `models/Enrollment.js` | Enrollments query model with progress JOINs | Built & Updated |
| `models/Progress.js` | Progress tracking & enrollment sync model | Built |
| `models/Certificate.js` | Certificates issuance and verification lookup model | Built & Updated |
| `models/Review.js` | Enrolled student reviews and rating aggregation model | Built |
| `models/Notification.js` | In-app notification creation, unread count, and read actions | Built |
| `models/Metric.js` | Platform analytics and admin KPI summary SQL model | Built |
| `models/Assignment.js` | Assignment & Deadlines model | Built |
| `models/Submission.js` | Submission model | Built & Updated |
| `models/Exam.js` | Exam & Results model | Built & Updated |
| `middleware/authMiddleware.js` | `isAuthenticated` & `authorize` RBAC middleware | Built |
| `middleware/validationMiddleware.js` | express-validator for auth, course, category, lesson, and coupon forms | Built & Updated |
| `middleware/uploadMiddleware.js` | Multer upload configuration | Built |
| `middleware/errorHandler.js` | Centralized error handler | Built |
| `utils/asyncHandler.js` | Controller async error forwarding helper | Built |
| `controllers/homeController.js` | Landing page controller | Built |
| `controllers/authController.js` | Register, Login, Logout, Audit log controller | Built |
| `controllers/dashboardController.js` | Main, Instructor & Admin dashboard controller with KPI metrics & audit log | Built & Updated |
| `controllers/categoryController.js` | Admin Category CRUD controller | Built |
| `controllers/courseController.js` | Public Catalog & Instructor Course CRUD controller | Built & Updated |
| `controllers/lessonController.js` | Ordered Lesson Management controller | Built |
| `controllers/wishlistController.js` | Student Wishlist controller | Built |
| `controllers/cartController.js` | Shopping Cart & Coupon application controller | Built |
| `controllers/couponController.js` | Admin Coupon Management controller | Built |
| `controllers/checkoutController.js` | Transactional Checkout & Test Payment Gateway controller | Built |
| `controllers/learnController.js` | My Courses, lesson player, completion sync, certificate notification controller | Built & Updated |
| `controllers/certificateController.js` | Certificate request, notification, and public verification controller | Built & Updated |
| `controllers/reviewController.js` | Course review submission controller | Built |
| `controllers/notificationController.js` | Notification inbox and read-state controller | Built |
| `controllers/assignmentController.js` | Assignment and Submission controller with grading notifications | Built & Updated |
| `controllers/examController.js` | Exam and Result controller with result notifications | Built & Updated |
| `controllers/adminController.js` | Admin User Management, Course Moderation, and Orders & Payments controller | Built |
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
| `routes/certificateRoutes.js` | Certificate request and `/certificate/:certificate_url` verification routes | Built |
| `routes/reviewRoutes.js` | Enrolled student course review submission route | Built |
| `routes/notificationRoutes.js` | Notification inbox and mark-read routes | Built |
| `routes/assignmentRoutes.js` | Assignment & Submission routes with seeded permissions | Built & Updated |
| `routes/examRoutes.js` | Exam & Result routes with seeded permissions | Built & Updated |
| `routes/adminRoutes.js` | Admin `/admin/users`, `/admin/courses`, `/admin/orders` routes | Built |
| `public/css/tokens.css` | Design system CSS tokens | Built |
| `public/css/styles.css` | Academic typography, component styling, notification/activity styles | Built & Updated |
| `public/js/learn-player.js` | Real-time lesson completion & progress bar update | Built |
| `views/partials/head.ejs` | HTML head with Google Fonts & CSS links | Built |
| `views/partials/navbar.ejs` | Responsive navigation partial with admin links | Built & Updated |
| `views/partials/footer.ejs` | Footer partial | Built |
| `views/partials/flash.ejs` | Alert notification partial | Built |
| `views/index.ejs` | Home landing page with hero certificate mockup | Built |
| `views/auth/login.ejs` | Sign in form view | Built |
| `views/auth/register.ejs` | Registration form view (Student/Instructor) | Built |
| `views/dashboard.ejs` | Role-based dashboard view with admin KPI analytics | Built & Updated |
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
| `views/certificates/show.ejs` | Public verifiable certificate page | Built |
| `views/notifications/index.ejs` | In-app notification inbox | Built |
| `views/assessments/assignments.ejs` | Instructor & student assignments view | Built |
| `views/assessments/assignment_details.ejs` | Instructor grading view | Built |
| `views/assessments/exams.ejs` | Instructor & student exams view | Built |
| `views/assessments/exam_details.ejs` | Instructor manual results entry view | Built |
| `views/admin/users.ejs` | Admin User Management view with status controls | Built |
| `views/admin/courses.ejs` | Admin Course Moderation view with lifecycle actions | Built |
| `views/admin/orders.ejs` | Admin Orders & Payments overview table | Built |
| `views/admin/order-details.ejs` | Admin Order inspection & payment transaction breakdown | Built |
| `views/error.ejs` | Error page template | Built |
