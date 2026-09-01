# E-Learning Platform — Feature List & Full Schema Reference

## 1. Full Feature List

### 🔐 Identity & Security
- User registration, login, credential validation, session handling
- Profile management with update tracking
- Role-Based Access Control (Admin / Instructor / Student) via `Roles` → `Permissions` → `Role_Permissions`
- Activity logging (action, timestamp, IP address) for auditing and fraud detection
- Account status control (active/inactive/banned)

### 👨‍🏫 Teaching & Instructor Ecosystem
- Instructor profiles (bio, expertise, experience, rating)
- Instructor-led course ownership

### 📚 Course & Content Management
- Course catalog with multi-category classification
- Curriculum structured into ordered lessons
- Lesson content with type, URL, duration, order index
- Course pricing, level, and duration metadata

### 🎯 Enrollment & Learning Experience
- Course enrollment with duplicate prevention
- Access restricted to enrolled users
- Lesson-level and course-level progress tracking, with resume support
- Completion percentage calculation

### 📝 Assessment & Grading
- Assignments with deadlines, max marks, and late-submission rules
- Student submissions (file upload, timestamp, marks, feedback)
- Exams with duration and total marks
- Results with grade and score history

### 🎓 Certification
- Eligibility check based on completion + results
- Auto-generated certificates with verifiable public URLs

### 💳 E-Commerce & Payments
- **Shopping cart** — add/remove courses before checkout
- **Wishlist** — save courses for later without adding to cart
- **Coupons** — flat or percentage discounts, usage limits, validity windows
- **Orders & order items** — multi-course checkout in a single transaction, price locked at purchase time
- Payment processing tied to orders (supports gateway integration, retries, failure states)
- Paywall enforcement — access only after successful payment

### 💬 Community & Communication
- Course reviews and 1–5 star ratings (enrolled users only)
- Rating aggregation per course
- In-app, email, and SMS notifications
- Notification retry logic and delivery status tracking

### 🏷️ Course Classification
- Category management with many-to-many course mapping
- Filtering/discovery by category

### 📊 System Monitoring & Logging
- Full activity/audit trail
- Debugging and security-monitoring support via logs

---

## 2. Entities, Attributes & Constraints

### Roles
| Attribute | Type | Constraints |
|---|---|---|
| role_id | INT | PK, AUTO_INCREMENT |
| role_name | VARCHAR(50) | NOT NULL, UNIQUE |

### Permissions
| Attribute | Type | Constraints |
|---|---|---|
| permission_id | INT | PK, AUTO_INCREMENT |
| permission_name | VARCHAR(100) | NOT NULL, UNIQUE |

### Role_Permissions
| Attribute | Type | Constraints |
|---|---|---|
| role_permission_id | INT | PK, AUTO_INCREMENT |
| role_id | INT | FK → Roles.role_id, NOT NULL |
| permission_id | INT | FK → Permissions.permission_id, NOT NULL |
| — | — | UNIQUE(role_id, permission_id) |

### Users
| Attribute | Type | Constraints |
|---|---|---|
| user_id | INT | PK, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| role_id | INT | FK → Roles.role_id, NOT NULL |
| phone | VARCHAR(20) | NULLABLE |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | NULLABLE, ON UPDATE CURRENT_TIMESTAMP |
| status | ENUM('active','inactive','banned') | NOT NULL, DEFAULT 'active' |

### Instructor_Profile
| Attribute | Type | Constraints |
|---|---|---|
| instructor_id | INT | PK, FK → Users.user_id |
| bio | TEXT | NULLABLE |
| expertise | VARCHAR(255) | NULLABLE |
| experience_years | INT | CHECK (experience_years >= 0) |
| rating | FLOAT | CHECK (rating BETWEEN 0 AND 5), DEFAULT 0 |

### Courses
| Attribute | Type | Constraints |
|---|---|---|
| course_id | INT | PK, AUTO_INCREMENT |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | NULLABLE |
| instructor_id | INT | FK → Users.user_id, NOT NULL |
| price | DECIMAL(10,2) | NOT NULL, CHECK (price >= 0) |
| duration | INT | CHECK (duration >= 0) — total minutes/hours |
| level | ENUM('beginner','intermediate','advanced') | NOT NULL |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | NULLABLE |
| status | ENUM('draft','published','archived') | NOT NULL, DEFAULT 'draft' |

### Categories
| Attribute | Type | Constraints |
|---|---|---|
| category_id | INT | PK, AUTO_INCREMENT |
| category_name | VARCHAR(100) | NOT NULL, UNIQUE |
| description | TEXT | NULLABLE |

### Course_Category
| Attribute | Type | Constraints |
|---|---|---|
| id | INT | PK, AUTO_INCREMENT |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| category_id | INT | FK → Categories.category_id, NOT NULL |
| — | — | UNIQUE(course_id, category_id) |

### Lessons
| Attribute | Type | Constraints |
|---|---|---|
| lesson_id | INT | PK, AUTO_INCREMENT |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| title | VARCHAR(200) | NOT NULL |
| content_type | ENUM('video','document','quiz','other') | NOT NULL |
| content_url | VARCHAR(500) | NOT NULL |
| duration | INT | CHECK (duration >= 0) |
| order_index | INT | NOT NULL |
| — | — | UNIQUE(course_id, order_index) |

### Cart
| Attribute | Type | Constraints |
|---|---|---|
| cart_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → Users.user_id, NOT NULL, UNIQUE |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | NULLABLE |

### Cart_Items
| Attribute | Type | Constraints |
|---|---|---|
| cart_item_id | INT | PK, AUTO_INCREMENT |
| cart_id | INT | FK → Cart.cart_id, NOT NULL |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| added_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| — | — | UNIQUE(cart_id, course_id) |

### Wishlist
| Attribute | Type | Constraints |
|---|---|---|
| wishlist_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → Users.user_id, NOT NULL |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| added_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| — | — | UNIQUE(user_id, course_id) |

### Coupons
| Attribute | Type | Constraints |
|---|---|---|
| coupon_id | INT | PK, AUTO_INCREMENT |
| code | VARCHAR(50) | NOT NULL, UNIQUE |
| discount_type | ENUM('flat','percent') | NOT NULL |
| discount_value | DECIMAL(10,2) | NOT NULL, CHECK (discount_value > 0) |
| max_discount_amount | DECIMAL(10,2) | NULLABLE — caps a percent discount |
| min_order_amount | DECIMAL(10,2) | NULLABLE, DEFAULT 0 |
| valid_from | DATETIME | NOT NULL |
| valid_to | DATETIME | NOT NULL, CHECK (valid_to > valid_from) |
| usage_limit | INT | NULLABLE — null = unlimited |
| times_used | INT | NOT NULL, DEFAULT 0 |
| is_active | BOOLEAN | NOT NULL, DEFAULT true |

### Orders
| Attribute | Type | Constraints |
|---|---|---|
| order_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → Users.user_id, NOT NULL |
| coupon_id | INT | FK → Coupons.coupon_id, NULLABLE |
| subtotal_amount | DECIMAL(10,2) | NOT NULL, CHECK (subtotal_amount >= 0) |
| discount_amount | DECIMAL(10,2) | NOT NULL, DEFAULT 0 |
| total_amount | DECIMAL(10,2) | NOT NULL, CHECK (total_amount >= 0) |
| status | ENUM('pending','completed','failed','cancelled') | NOT NULL, DEFAULT 'pending' |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | NULLABLE |

### Order_Items
| Attribute | Type | Constraints |
|---|---|---|
| order_item_id | INT | PK, AUTO_INCREMENT |
| order_id | INT | FK → Orders.order_id, NOT NULL |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| price_at_purchase | DECIMAL(10,2) | NOT NULL, CHECK (price_at_purchase >= 0) |
| — | — | UNIQUE(order_id, course_id) |

### Payments
| Attribute | Type | Constraints |
|---|---|---|
| payment_id | INT | PK, AUTO_INCREMENT |
| order_id | INT | FK → Orders.order_id, NOT NULL |
| amount | DECIMAL(10,2) | NOT NULL, CHECK (amount >= 0) |
| payment_date | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| payment_method | ENUM('card','paypal','stripe','other') | NOT NULL |
| status | ENUM('success','failed','pending') | NOT NULL |
| transaction_ref | VARCHAR(100) | NOT NULL, UNIQUE |

### Enrollments
| Attribute | Type | Constraints |
|---|---|---|
| enrollment_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → Users.user_id, NOT NULL |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| order_item_id | INT | FK → Order_Items.order_item_id, NULLABLE (null = free/manual enrollment) |
| enrollment_date | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| completion_status | ENUM('not_started','in_progress','completed') | NOT NULL, DEFAULT 'not_started' |
| progress_percentage | FLOAT | CHECK (progress_percentage BETWEEN 0 AND 100), DEFAULT 0 |
| — | — | UNIQUE(user_id, course_id) |

### Progress
| Attribute | Type | Constraints |
|---|---|---|
| progress_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → Users.user_id, NOT NULL |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| completed_lessons | INT | NOT NULL, DEFAULT 0 |
| total_lessons | INT | NOT NULL |
| last_accessed_lesson | INT | FK → Lessons.lesson_id, NULLABLE |
| completion_percentage | FLOAT | CHECK (completion_percentage BETWEEN 0 AND 100) |
| — | — | UNIQUE(user_id, course_id) |

### Assignments
| Attribute | Type | Constraints |
|---|---|---|
| assignment_id | INT | PK, AUTO_INCREMENT |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | NULLABLE |
| max_marks | DECIMAL(6,2) | NOT NULL, CHECK (max_marks > 0) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Deadlines
| Attribute | Type | Constraints |
|---|---|---|
| deadline_id | INT | PK, AUTO_INCREMENT |
| assignment_id | INT | FK → Assignments.assignment_id, NOT NULL, UNIQUE |
| due_date | DATETIME | NOT NULL |
| late_submission_allowed | BOOLEAN | NOT NULL, DEFAULT false |

### Submissions
| Attribute | Type | Constraints |
|---|---|---|
| submission_id | INT | PK, AUTO_INCREMENT |
| assignment_id | INT | FK → Assignments.assignment_id, NOT NULL |
| user_id | INT | FK → Users.user_id, NOT NULL |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| file_url | VARCHAR(500) | NOT NULL |
| submission_date | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| marks_obtained | DECIMAL(6,2) | NULLABLE, CHECK (marks_obtained >= 0) |
| feedback | TEXT | NULLABLE |
| — | — | UNIQUE(assignment_id, user_id) |

### Exams
| Attribute | Type | Constraints |
|---|---|---|
| exam_id | INT | PK, AUTO_INCREMENT |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| title | VARCHAR(200) | NOT NULL |
| total_marks | DECIMAL(6,2) | NOT NULL, CHECK (total_marks > 0) |
| duration | INT | NOT NULL, CHECK (duration > 0) |
| exam_date | DATETIME | NOT NULL |

### Results
| Attribute | Type | Constraints |
|---|---|---|
| result_id | INT | PK, AUTO_INCREMENT |
| exam_id | INT | FK → Exams.exam_id, NOT NULL |
| user_id | INT | FK → Users.user_id, NOT NULL |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| marks_obtained | DECIMAL(6,2) | NOT NULL, CHECK (marks_obtained >= 0) |
| grade | VARCHAR(5) | NULLABLE |
| result_date | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| — | — | UNIQUE(exam_id, user_id) |

### Certificates
| Attribute | Type | Constraints |
|---|---|---|
| certificate_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → Users.user_id, NOT NULL |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| issue_date | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| certificate_url | VARCHAR(500) | NOT NULL, UNIQUE |
| — | — | UNIQUE(user_id, course_id) |

### Reviews
| Attribute | Type | Constraints |
|---|---|---|
| review_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → Users.user_id, NOT NULL |
| course_id | INT | FK → Courses.course_id, NOT NULL |
| rating | INT | NOT NULL, CHECK (rating BETWEEN 1 AND 5) |
| comment | TEXT | NULLABLE |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| — | — | UNIQUE(user_id, course_id) |

### Notifications
| Attribute | Type | Constraints |
|---|---|---|
| notification_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → Users.user_id, NOT NULL |
| message | TEXT | NOT NULL |
| type | ENUM('enrollment','payment','assignment','exam','certificate','system') | NOT NULL |
| channel | ENUM('in_app','email','sms') | NOT NULL |
| priority | ENUM('low','normal','high') | NOT NULL, DEFAULT 'normal' |
| status | ENUM('queued','sent','failed','read') | NOT NULL, DEFAULT 'queued' |
| retries_count | INT | NOT NULL, DEFAULT 0 |
| max_retries | INT | NOT NULL, DEFAULT 3 |
| error_reason | VARCHAR(255) | NULLABLE |
| scheduled_at | DATETIME | NULLABLE |
| sent_at | DATETIME | NULLABLE |
| read_at | DATETIME | NULLABLE |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Activity_Log
| Attribute | Type | Constraints |
|---|---|---|
| log_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → Users.user_id, NOT NULL |
| action | VARCHAR(150) | NOT NULL |
| event_time | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| ip_address | VARCHAR(45) | NULLABLE |
| metadata_json | JSON | NULLABLE |

---

## 3. Relationships & Cardinality

### User & Access Control
| Relationship | Cardinality | Notes |
|---|---|---|
| Users → Roles | M:1 | Each user has exactly one role |
| Roles ↔ Permissions | M:N | Via `Role_Permissions` |
| Users → Instructor_Profile | 1:1 | Only users acting as instructors have a row |
| Users → Activity_Log | 1:M | One user generates many log entries |

### Course & Content Management
| Relationship | Cardinality | Notes |
|---|---|---|
| Users (instructor) → Courses | 1:M | One instructor teaches many courses |
| Courses ↔ Categories | M:N | Via `Course_Category` |
| Courses → Lessons | 1:M | Ordered by `order_index` |
| Courses → Assignments | 1:M | |
| Assignments → Deadlines | 1:1 | One deadline per assignment |
| Courses → Exams | 1:M | |

### Enrollment & Learning
| Relationship | Cardinality | Notes |
|---|---|---|
| Users ↔ Courses | M:N | Via `Enrollments` |
| Users ↔ Courses | M:N | Via `Progress` (mirrors enrollment, tracked separately) |
| Lessons → Progress | 1:M | Via `last_accessed_lesson` (optional FK) |

### Assessment System
| Relationship | Cardinality | Notes |
|---|---|---|
| Assignments → Submissions | 1:M | |
| Users → Submissions | 1:M | |
| Exams → Results | 1:M | |
| Users → Results | 1:M | |

### Certification & Feedback
| Relationship | Cardinality | Notes |
|---|---|---|
| Users ↔ Courses | M:N | Via `Certificates` (one cert per user/course pair) |
| Users ↔ Courses | M:N | Via `Reviews` (one review per user/course pair) |
| Users → Notifications | 1:M | |

### E-Commerce: Cart, Wishlist, Coupons, Orders
| Relationship | Cardinality | Notes |
|---|---|---|
| Users → Cart | 1:1 | One active cart per user |
| Cart → Cart_Items | 1:M | |
| Courses → Cart_Items | 1:M | A course can sit in many users' carts |
| Users → Wishlist | 1:M | |
| Courses → Wishlist | 1:M | |
| Users → Orders | 1:M | |
| Coupons → Orders | 1:M, optional | An order may use zero or one coupon |
| Orders → Order_Items | 1:M | |
| Courses → Order_Items | 1:M | A course can appear across many orders |
| Orders → Payments | 1:M | Supports failed attempts followed by a successful retry |
| Order_Items → Enrollments | 1:1, optional | Null when enrollment wasn't purchase-driven (free/manual) |

### End-to-End Flow Summary
```
Cart_Items → Orders/Order_Items → Payments → Enrollments → Progress → Results → Certificates
                                                     ↓
                                              Activity_Log / Notifications (triggered throughout)
```

---

**Total: 27 entities** — 21 from the original design + `Cart`, `Cart_Items`, `Wishlist`, `Coupons`, `Orders`, `Order_Items`.
