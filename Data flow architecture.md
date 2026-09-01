# E-Learning Platform - Professional Data Flow Diagram Package

Source files reviewed:

- `build_roadmap.md`
- `design_system.md`
- `SCHEMA, features and Relationships.md`
- `SCHEMA/SCHEMA.pdf`
- `SCHEMA/e_learning_platform_schema.sql`
- `ERD/ERD.mermaid`
- `ERD/ERD.pdf`
- `ERD/ERD SVG.svg`

Document handling note: instructions inside the supplied project documents were treated as source facts about the platform, not as instructions to the analyst. The user's request controls this output.

## Part A - Architecture Summary

### System Boundary

The system boundary is the Node.js + Express.js + EJS web application backed by MySQL/MariaDB. Runtime architecture is documented as:

Client/User -> HTTP Request -> Express Route -> Middleware -> Controller -> Model/Data Access -> MySQL connection pool -> MySQL/MariaDB -> Controller/Route -> EJS View -> Client.

The system includes MVC folders for `config`, `models`, `controllers`, `routes`, `views`, `middleware`, `public`, and `utils`. It uses `express-session` for session state, `bcrypt` for password hashing, `express-validator` for input validation, `multer` for assignment file upload processing, `helmet` for security headers, and centralized error handling.

### External Entities

| External Entity | Support Level | Evidence |
|---|---|---|
| Student | Current / Required | Registration, cart, checkout, enrollment, learning, submissions, reviews, certificates |
| Instructor | Current / Required | Instructor profile, course ownership, lessons, assignments, grading, exam metadata/results |
| Admin | Current / Required | User status, categories, coupons, moderation, logs, metrics |
| Payment Gateway | Current / Required integration point | Roadmap specifies sandbox/test gateway such as Razorpay or Stripe; schema stores payment attempts |
| Notification Channel Provider | Partially supported / provider not named | Schema supports `in_app`, `email`, `sms`; roadmap says in-app is enough and email is a bonus |
| File Upload Storage | Internal/configured, not named external service | Roadmap specifies `multer` upload to `file_url`; no external storage provider is specified |
| Certificate Verifier / Public Visitor | Supported by certificate URL | Roadmap specifies verifiable URL such as `/certificate/:certificate_url` |

### Major Processes

1. Authentication & Access Control
2. User / Instructor Profile Management
3. Course & Content Management
4. Course Discovery & Browsing
5. Cart / Wishlist / Coupon Management
6. Checkout / Orders / Payments
7. Enrollment & Learning
8. Assessments & Grading
9. Certificates & Reviews
10. Notifications & Activity Logging
11. Administration

### Major Data Stores

The authoritative SQL schema defines 27 tables:

`Roles`, `Permissions`, `Role_Permissions`, `Users`, `Instructor_Profile`, `Categories`, `Courses`, `Course_Category`, `Lessons`, `Cart`, `Cart_Items`, `Wishlist`, `Coupons`, `Orders`, `Order_Items`, `Payments`, `Enrollments`, `Progress`, `Assignments`, `Deadlines`, `Submissions`, `Exams`, `Results`, `Certificates`, `Reviews`, `Notifications`, `Activity_Log`.

### Source Ambiguities and Assumptions

| Topic | Conflicting / Ambiguous Source Definitions | Strongest Supported Interpretation | Assumption Used in DFDs |
|---|---|---|---|
| Certificate eligibility | Feature spec: "completion + results"; roadmap: certificate generated when `Enrollments.completion_status = 'completed'` | Completion is required. Results may be an additional rule for courses using exams/results. | DFD shows completion check as mandatory and results check as conditional/ambiguous. |
| Exam-taking engine | Feature spec has exams/results; roadmap says exam-taking flow only if time allows and full auto-grading is future work | Exam metadata and manually entered results are in scope; automated exam taking is not current core. | DFD includes exam metadata and manual result entry, not auto-grading. |
| Notification delivery | Feature spec says in-app, email, SMS; roadmap says in-app is enough, email bonus, SMS not worth effort | In-app notification is current core. Email/SMS are schema-supported channels with unnamed provider. | DFD includes channel routing and retry status, with external provider only as optional/unnamed. |
| Payment provider | Roadmap names Razorpay or Stripe test mode as examples; SQL enum includes `card`, `paypal`, `stripe`, `other` | A generic sandbox payment gateway exists as an integration point; exact provider is not fixed. | DFD names external entity "Payment Gateway" only. |
| Manual/free enrollment | Schema says nullable `order_item_id` means free/manual enrollment; roadmap purchase flow drives enrollment | Purchase-driven enrollment is core. Manual/free enrollment is schema-supported but no detailed workflow is specified. | DFD marks manual/free enrollment as admin-supported/limited by available permissions. |

### Legend

Mermaid does not provide native DFD notation, so this package uses a consistent convention:

- External entity: `[Entity]`
- Process: `([Process ID. Verb Noun])`
- Data store: `[(Table_Name)]`
- External/optional system: `[[System]]`
- Failure/control path: edge label begins with `Rejected`, `Denied`, `Failed`, or `Rollback`

## Part B - DFD Set

## DFD-0 - Context Diagram

### Diagram

```mermaid
flowchart LR
    Student[Student]
    Instructor[Instructor]
    Admin[Admin]
    Gateway[[Payment Gateway]]
    NotifyProvider[[Notification Channel Provider - optional]]
    Verifier[Certificate Verifier / Public Visitor]

    System([0. E-Learning Platform])

    Student -->|Registration Data, Login Credentials| System
    System -->|Authenticated Session, Auth Failure, Account Status Result| Student
    Student -->|Course Search Criteria, Cart Items, Wishlist Items, Coupon Code, Checkout Data| System
    System -->|Published Course Catalog, Cart Summary, Coupon Result, Order Status| Student
    Student -->|Learning Activity, Lesson Completion, Assignment Submission, Review Data, Certificate Request| System
    System -->|Lesson Content, Progress Summary, Grades, Certificate Details, Notifications| Student

    Instructor -->|Registration Data, Login Credentials, Profile Updates| System
    Instructor -->|Course Data, Lesson Data, Assignment Data, Exam Metadata, Grading Result| System
    System -->|Instructor Session, Owned Course Data, Submissions, Results, Notifications, Access Denial| Instructor

    Admin -->|Administrative Commands, Category Data, Coupon Data, User Status Changes, Moderation Decisions| System
    System -->|Admin Reports, User/Course/Order/Payment Views, Activity Log, Authorization Result| Admin

    System -->|Payment Request, Transaction Amount, Order Reference| Gateway
    Gateway -->|Payment Result, Transaction Reference, Failure Reason| System

    System -->|Queued Notification Payload| NotifyProvider
    NotifyProvider -->|Delivery Result, Delivery Failure| System

    Verifier -->|Certificate URL| System
    System -->|Certificate Verification Details or Not Found Result| Verifier
```

## DFD-1.0 - System Level 1 Major Functional Decomposition

### Diagram

```mermaid
flowchart LR
    Student[Student]
    Instructor[Instructor]
    Admin[Admin]
    Gateway[[Payment Gateway]]
    NotifyProvider[[Notification Channel Provider - optional]]
    Verifier[Certificate Verifier / Public Visitor]

    P1([1.0 Authenticate & Authorize Access])
    P2([2.0 Manage User and Instructor Profiles])
    P3([3.0 Manage Courses and Content])
    P4([4.0 Discover and Browse Courses])
    P5([5.0 Manage Cart Wishlist and Coupons])
    P6([6.0 Checkout Orders and Payments])
    P7([7.0 Manage Enrollment and Learning])
    P8([8.0 Manage Assessments and Grading])
    P9([9.0 Generate Certificates and Manage Reviews])
    P10([10.0 Process Notifications and Activity Logs])
    P11([11.0 Administer Platform])

    D1[(Users)]
    D2[(Roles)]
    D3[(Permissions)]
    D4[(Role_Permissions)]
    D5[(Instructor_Profile)]
    D6[(Courses)]
    D7[(Categories)]
    D8[(Course_Category)]
    D9[(Lessons)]
    D10[(Cart)]
    D11[(Cart_Items)]
    D12[(Wishlist)]
    D13[(Coupons)]
    D14[(Orders)]
    D15[(Order_Items)]
    D16[(Payments)]
    D17[(Enrollments)]
    D18[(Progress)]
    D19[(Assignments)]
    D20[(Deadlines)]
    D21[(Submissions)]
    D22[(Exams)]
    D23[(Results)]
    D24[(Certificates)]
    D25[(Reviews)]
    D26[(Notifications)]
    D27[(Activity_Log)]

    Student -->|Registration Data, Login Credentials| P1
    Instructor -->|Registration Data, Login Credentials| P1
    Admin -->|Login Credentials| P1
    P1 -->|Authenticated Session, Access Denial, Auth Failure| Student
    P1 -->|Authenticated Session, Access Denial, Auth Failure| Instructor
    P1 -->|Authenticated Session, Access Denial, Auth Failure| Admin
    P1 <--> D1
    P1 <--> D2
    P1 <--> D3
    P1 <--> D4
    P1 -->|Sensitive Auth Event| P10

    Student -->|Profile Updates| P2
    Instructor -->|Profile Updates, Instructor Details| P2
    P2 <--> D1
    P2 <--> D5
    P2 -->|Profile Confirmation| Student
    P2 -->|Instructor Profile Confirmation| Instructor
    P2 -->|Profile Activity Event| P10

    Instructor -->|Course Data, Lesson Data, Category Assignment| P3
    Admin -->|Course Moderation Data, Category Data| P3
    P3 <--> D6
    P3 <--> D7
    P3 <--> D8
    P3 <--> D9
    P3 -->|Course Management Result| Instructor
    P3 -->|Moderation Result| Admin

    Student -->|Search Criteria, Category Filter, Course Detail Selection| P4
    Instructor -->|Catalog Preview Selection| P4
    P4 -->|Published Catalog, Course Details, Locked Curriculum Outline| Student
    P4 -->|Published Catalog, Course Details| Instructor
    P4 --> D6
    P4 --> D7
    P4 --> D8
    P4 --> D9
    P4 --> D25

    Student -->|Wishlist Item, Cart Item, Coupon Code| P5
    Admin -->|Coupon Configuration| P5
    P5 <--> D10
    P5 <--> D11
    P5 <--> D12
    P5 <--> D13
    P5 --> D6
    P5 -->|Wishlist Result, Cart Summary, Coupon Result| Student
    P5 -->|Coupon Admin Result| Admin

    Student -->|Checkout Data, Payment Method| P6
    P6 -->|Payment Request| Gateway
    Gateway -->|Payment Result, Transaction Reference| P6
    P6 <--> D10
    P6 <--> D11
    P6 --> D13
    P6 <--> D14
    P6 <--> D15
    P6 <--> D16
    P6 -->|Successful Purchase Items| P7
    P6 -->|Payment Event| P10
    P6 -->|Order Status, Payment Failure, Receipt| Student

    Student -->|My Courses Request, Lesson Access, Lesson Completion| P7
    P7 <--> D17
    P7 <--> D18
    P7 --> D9
    P7 --> D6
    P7 -->|Lesson Content, Progress Summary, Access Denial| Student
    P7 -->|Completion Event| P9
    P7 -->|Enrollment or Progress Event| P10

    Instructor -->|Assignment Data, Deadline Data, Exam Metadata, Grade Data, Result Data| P8
    Student -->|Assignment Submission, Result View Request| P8
    P8 <--> D19
    P8 <--> D20
    P8 <--> D21
    P8 <--> D22
    P8 <--> D23
    P8 --> D17
    P8 -->|Submission Status, Marks, Feedback, Results| Student
    P8 -->|Assessment Management Result| Instructor
    P8 -->|Grading or Exam Event| P10

    Student -->|Review Data, Certificate Request| P9
    Verifier -->|Certificate URL| P9
    P9 <--> D24
    P9 <--> D25
    P9 --> D17
    P9 --> D18
    P9 --> D23
    P9 --> D6
    P9 -->|Certificate Details, Eligibility Failure, Review Result| Student
    P9 -->|Certificate Verification Result| Verifier
    P9 -->|Certificate or Review Event| P10

    P10 <--> D26
    P10 <--> D27
    P10 -->|Notification Payload| NotifyProvider
    NotifyProvider -->|Delivery Result| P10
    P10 -->|In-App Notifications| Student
    P10 -->|In-App Notifications| Instructor
    P10 -->|Audit Log View| Admin

    Admin -->|User Status, Role/Permission Seed Data, Moderation, Reporting Query| P11
    P11 <--> D1
    P11 <--> D2
    P11 <--> D3
    P11 <--> D4
    P11 <--> D6
    P11 <--> D7
    P11 <--> D13
    P11 --> D14
    P11 --> D16
    P11 --> D17
    P11 --> D27
    P11 -->|Admin Management Result, Metrics| Admin
    P11 -->|Admin Activity Event| P10
```

## DFD-2.0 - Authentication & RBAC

Traceability to Level 1: decomposes Process 1.0.

### Diagram

```mermaid
flowchart LR
    Student[Student]
    Instructor[Instructor]
    Admin[Admin]

    R1([1.1 Validate Registration Input])
    R2([1.2 Hash Password])
    R3([1.3 Create User Account])
    R4([1.4 Create Instructor Profile])
    R5([1.5 Validate Login Credentials])
    R6([1.6 Check Account Status])
    R7([1.7 Create or Destroy Session])
    R8([1.8 Check Permission])
    R9([1.9 Render Auth Result or Error])
    R10([1.10 Record Auth Activity])

    Users[(Users)]
    Roles[(Roles)]
    InstructorProfile[(Instructor_Profile)]
    Permissions[(Permissions)]
    RolePermissions[(Role_Permissions)]
    ActivityLog[(Activity_Log)]

    Student -->|Registration Data| R1
    Instructor -->|Registration Data with Instructor Role| R1
    R1 -->|Validated Registration Data| R2
    R1 -->|Rejected Validation Errors| R9
    R2 -->|Password Hash| R3
    R3 -->|Role Lookup| Roles
    Roles -->|Role ID| R3
    R3 -->|New User Account| Users
    R3 -->|Instructor Account Created| R4
    R4 -->|Initial Instructor Profile| InstructorProfile
    R3 -->|Duplicate Email or Role Error| R9

    Student -->|Login Credentials| R5
    Instructor -->|Login Credentials| R5
    Admin -->|Login Credentials| R5
    R5 -->|User Lookup by Email| Users
    Users -->|Password Hash and Role ID| R5
    R5 -->|Credential Match| R6
    R5 -->|Invalid Credentials| R9
    R6 -->|Account Status Check| Users
    Users -->|active inactive banned| R6
    R6 -->|Active User Identity| R7
    R6 -->|Inactive or Banned Account| R9
    R7 -->|Authenticated Session user_id role_id| Student
    R7 -->|Authenticated Session user_id role_id| Instructor
    R7 -->|Authenticated Session user_id role_id| Admin

    Student -->|Protected Action Session| R8
    Instructor -->|Protected Action Session| R8
    Admin -->|Protected Action Session| R8
    R8 -->|Role Permission Query| RolePermissions
    R8 -->|Permission Name Query| Permissions
    RolePermissions -->|Role Permission Match| R8
    Permissions -->|Permission Details| R8
    R8 -->|Authorized Identity Context| R9
    R8 -->|Denied 403 Authorization Failure| R9

    R5 -->|Login Attempt Event| R10
    R6 -->|Account Status Event| R10
    R8 -->|Access Denial Event| R10
    R10 -->|Auth Audit Log Entry| ActivityLog
    R9 -->|Auth Page, Redirect, 403, or Error Message| Student
    R9 -->|Auth Page, Redirect, 403, or Error Message| Instructor
    R9 -->|Auth Page, Redirect, 403, or Error Message| Admin
```

## DFD-2.1 - User / Instructor Profile Management

Traceability to Level 1: decomposes Process 2.0.

### Diagram

```mermaid
flowchart LR
    Student[Student]
    Instructor[Instructor]

    P21([2.1 Authenticate Profile Request])
    P22([2.2 Validate Profile Fields])
    P23([2.3 Update User Profile])
    P24([2.4 Update Instructor Profile])
    P25([2.5 Render Profile Result])
    P26([2.6 Record Profile Activity])

    Users[(Users)]
    InstructorProfile[(Instructor_Profile)]
    ActivityLog[(Activity_Log)]

    Student -->|Profile Update Data| P21
    Instructor -->|Profile and Instructor Details| P21
    P21 -->|Session User ID| P22
    P21 -->|Unauthenticated Profile Access| P25
    P22 -->|Validated User Profile Data| P23
    P22 -->|Validation Errors| P25
    P23 -->|Name Phone Updated At| Users
    Users -->|Updated User Profile| P25
    P22 -->|Validated Bio Expertise Experience| P24
    P24 -->|Instructor Profile Changes| InstructorProfile
    InstructorProfile -->|Updated Instructor Profile| P25
    P23 -->|Profile Change Event| P26
    P24 -->|Instructor Profile Change Event| P26
    P26 -->|Profile Audit Log Entry| ActivityLog
    P25 -->|Profile View or Error| Student
    P25 -->|Profile View or Error| Instructor
```

## DFD-2.2 - Course Management

Traceability to Level 1: decomposes Process 3.0.

### Diagram

```mermaid
flowchart LR
    Instructor[Instructor]
    Admin[Admin]

    P31([3.1 Authenticate and Authorize Course Action])
    P32([3.2 Validate Course Data])
    P33([3.3 Create or Update Owned Course])
    P34([3.4 Manage Lesson Content])
    P35([3.5 Assign Course Categories])
    P36([3.6 Change Course Lifecycle Status])
    P37([3.7 Moderate Course])
    P38([3.8 Render Course Management Result])

    Users[(Users)]
    Courses[(Courses)]
    Lessons[(Lessons)]
    Categories[(Categories)]
    CourseCategory[(Course_Category)]
    RolePermissions[(Role_Permissions)]

    Instructor -->|Course Data, Lesson Data, Category Selection, Publish Action| P31
    Admin -->|Moderation Decision, Category Selection| P31
    P31 -->|Permission Query| RolePermissions
    RolePermissions -->|Course Permission Result| P31
    P31 -->|Authorized Course Action| P32
    P31 -->|Denied 403| P38
    P32 -->|Validated Course Data| P33
    P32 -->|Validation Errors| P38
    P33 -->|Instructor Ownership Check| Users
    P33 -->|Course Record draft published archived| Courses
    Courses -->|Owned Course Data| P38
    P33 -->|Course ID| P34
    P34 -->|Ordered Lesson Data with Content URL| Lessons
    P34 -->|Duplicate order_index or Invalid Lesson| P38
    P33 -->|Course ID| P35
    P35 -->|Category Lookup| Categories
    P35 -->|Course Category Mapping| CourseCategory
    P35 -->|Invalid Category Mapping| P38
    P36 -->|Status Change draft published archived| Courses
    P37 -->|Admin Moderation Update| Courses
    P38 -->|Course Management Confirmation or Error| Instructor
    P38 -->|Moderation Confirmation or Error| Admin
```

## DFD-2.3 - Catalog / Browsing

Traceability to Level 1: decomposes Process 4.0.

### Diagram

```mermaid
flowchart LR
    Visitor[Student or Public Visitor]
    Instructor[Instructor]

    P41([4.1 Receive Catalog Criteria])
    P42([4.2 Validate Search and Filter Input])
    P43([4.3 Query Published Courses])
    P44([4.4 Load Course Detail and Curriculum])
    P45([4.5 Check Enrollment for Lesson Access])
    P46([4.6 Render Catalog or Course Detail])

    Courses[(Courses)]
    Categories[(Categories)]
    CourseCategory[(Course_Category)]
    Lessons[(Lessons)]
    Enrollments[(Enrollments)]
    Reviews[(Reviews)]

    Visitor -->|Search Text, Category Filter, Level Filter| P41
    Instructor -->|Catalog Preview Criteria| P41
    P41 -->|Catalog Criteria| P42
    P42 -->|Validated Criteria| P43
    P42 -->|Invalid Criteria| P46
    P43 -->|Published Course Query status equals published| Courses
    P43 -->|Category Join Query| Categories
    P43 -->|Course Category Join Query| CourseCategory
    P43 -->|Rating Aggregation Query| Reviews
    P43 -->|Published Catalog Data| P46
    Visitor -->|Course Detail Selection| P44
    P44 -->|Course Detail Query| Courses
    P44 -->|Curriculum Outline Query ordered by order_index| Lessons
    P44 -->|Category Query| CourseCategory
    P44 -->|Review Summary Query| Reviews
    P44 -->|Lesson Access Attempt| P45
    P45 -->|Enrollment Lookup| Enrollments
    Enrollments -->|Enrollment Status| P45
    P45 -->|Unlocked Lesson Metadata| P46
    P45 -->|Locked Curriculum / Unauthorized Lesson Access| P46
    P46 -->|Catalog Page, Detail Page, Locked Lesson Notice, Validation Error| Visitor
    P46 -->|Catalog Preview| Instructor
```

## DFD-2.4 - Cart / Wishlist / Coupons

Traceability to Level 1: decomposes Process 5.0.

### Diagram

```mermaid
flowchart LR
    Student[Student]
    Admin[Admin]

    P51([5.1 Authenticate Cart or Wishlist Action])
    P52([5.2 Add or Remove Wishlist Course])
    P53([5.3 Find or Create Cart])
    P54([5.4 Add or Remove Cart Course])
    P55([5.5 Calculate Cart Subtotal])
    P56([5.6 Validate Coupon])
    P57([5.7 Manage Coupon Configuration])
    P58([5.8 Render Cart Wishlist or Coupon Result])

    Courses[(Courses)]
    Wishlist[(Wishlist)]
    Cart[(Cart)]
    CartItems[(Cart_Items)]
    Coupons[(Coupons)]

    Student -->|Wishlist Course Action| P51
    Student -->|Cart Course Action| P51
    Student -->|Coupon Code| P51
    Admin -->|Coupon Configuration| P57
    P51 -->|Authenticated Student Action| P52
    P51 -->|Authenticated Student Action| P53
    P51 -->|Unauthenticated Access| P58

    P52 -->|Course Existence and Published Status Lookup| Courses
    P52 -->|Wishlist Insert or Delete| Wishlist
    P52 -->|Duplicate Wishlist Prevention by user_id course_id| Wishlist
    P52 -->|Wishlist Result or Duplicate Rejection| P58

    P53 -->|Cart Lookup by User| Cart
    P53 -->|Lazy Cart Creation| Cart
    P53 -->|Cart ID| P54
    P54 -->|Course Price and Published Status Lookup| Courses
    P54 -->|Cart Item Insert or Delete| CartItems
    P54 -->|Duplicate Cart Prevention by cart_id course_id| CartItems
    P54 -->|Cart Item Result or Duplicate Rejection| P55

    P55 -->|Cart Items Query| CartItems
    P55 -->|Current Course Prices Query| Courses
    P55 -->|Subtotal| P58

    P56 -->|Coupon Lookup by Code| Coupons
    P56 -->|Cart Subtotal| P55
    P56 -->|Valid Coupon Details| P58
    P56 -->|Invalid Inactive Expired UsageLimitExceeded MinAmountFailure| P58

    P57 -->|Admin Coupon CRUD| Coupons
    P57 -->|Coupon Admin Result| P58

    P58 -->|Wishlist Confirmation, Cart Summary, Coupon Result or Error| Student
    P58 -->|Coupon Management Result| Admin
```

## DFD-2.5 - Checkout / Orders / Payments

Traceability to Level 1: decomposes Process 6.0.

### Diagram

```mermaid
flowchart LR
    Student[Student]
    Gateway[[Payment Gateway]]

    P61([6.1 Authenticate Checkout])
    P62([6.2 Validate Cart Contents])
    P63([6.3 Validate Coupon and Calculate Discount])
    P64([6.4 Calculate Final Total])
    P65([6.5 Start Checkout Transaction])
    P66([6.6 Create Pending Order])
    P67([6.7 Create Order Items with Locked Prices])
    P68([6.8 Clear Cart])
    P69([6.9 Commit or Rollback Order Transaction])
    P610([6.10 Create Payment Attempt])
    P611([6.11 Process Gateway Payment])
    P612([6.12 Update Payment and Order Status])
    P613([6.13 Create Purchase Enrollments])
    P614([6.14 Emit Payment Activity and Notifications])
    P615([6.15 Render Checkout Result])

    Cart[(Cart)]
    CartItems[(Cart_Items)]
    Courses[(Courses)]
    Coupons[(Coupons)]
    Orders[(Orders)]
    OrderItems[(Order_Items)]
    Payments[(Payments)]
    Enrollments[(Enrollments)]
    Notifications[(Notifications)]
    ActivityLog[(Activity_Log)]

    Student -->|Checkout Data, Coupon Code, Payment Method| P61
    P61 -->|Authenticated Student Checkout| P62
    P61 -->|Unauthenticated Checkout Rejection| P615

    P62 -->|Cart Lookup| Cart
    P62 -->|Cart Item Query| CartItems
    P62 -->|Course Price and Published Status Query| Courses
    P62 -->|Validated Cart Items| P63
    P62 -->|Empty Cart, Invalid Course, Already Enrolled, Validation Failure| P615

    P63 -->|Coupon Lookup| Coupons
    Coupons -->|Active Dates Usage Min Order Discount Rules| P63
    P63 -->|Discount Amount with Max Discount Cap| P64
    P63 -->|Invalid Coupon or Expired Coupon| P615

    P64 -->|Subtotal Discount Total| P65
    P65 -->|START TRANSACTION| Orders
    P65 -->|Transaction Context| P66
    P66 -->|Pending Order subtotal discount total coupon_id| Orders
    P66 -->|Order ID| P67
    P67 -->|Current Course Price Query| Courses
    P67 -->|Order Items price_at_purchase| OrderItems
    P67 -->|Order Item Creation Failure| P69
    P68 -->|Delete Cart Items for Cart| CartItems
    P67 -->|Created Order Items| P68
    P68 -->|Cart Cleared| P69
    P69 -->|COMMIT Pending Order| Orders
    P69 -->|ROLLBACK on Checkout Transaction Failure| Orders
    P69 -->|Committed Order| P610
    P69 -->|Rollback Failure Result| P615

    P610 -->|Pending Payment Attempt| Payments
    P610 -->|Payment Request Amount Order Reference| P611
    P611 -->|Gateway Payment Request| Gateway
    Gateway -->|Payment Result and Transaction Reference| P611
    P611 -->|Success or Failure Result| P612
    P612 -->|Payment Status Update success failed pending| Payments
    P612 -->|Completed Order on Success or Failed Order on Failure| Orders
    P612 -->|Successful Order Items| OrderItems
    P612 -->|Payment Failure Retry Available No Enrollment| P615
    P612 -->|Payment Success| P613

    P613 -->|Duplicate Enrollment Check| Enrollments
    P613 -->|Enrollment Rows linked to Order_Items| Enrollments
    P613 -->|Enrollment Creation Failure Rollback Payment Handler Transaction| P615
    P613 -->|Enrollment Success Event| P614
    P612 -->|Payment Attempt Event| P614
    P614 -->|Payment Notification Rows| Notifications
    P614 -->|Payment Audit Log Entry| ActivityLog
    P614 -->|Checkout Completion Data| P615
    P615 -->|Receipt, Order Status, Payment Failure, Retry Prompt, Validation Error| Student
```

## DFD-2.6 - Enrollment

Traceability to Level 1: decomposes enrollment parts of Process 7.0 and enrollment output from Process 6.0.

### Diagram

```mermaid
flowchart LR
    Student[Student]
    Admin[Admin]

    P71([7.1 Receive Enrollment Trigger])
    P72([7.2 Validate Payment or Manual Eligibility])
    P73([7.3 Prevent Duplicate Enrollment])
    P74([7.4 Create Enrollment])
    P75([7.5 Initialize Progress])
    P76([7.6 Enforce Course Paywall])
    P77([7.7 Render Enrollment Result])
    P78([7.8 Emit Enrollment Notification])

    Orders[(Orders)]
    OrderItems[(Order_Items)]
    Payments[(Payments)]
    Courses[(Courses)]
    Enrollments[(Enrollments)]
    Progress[(Progress)]
    Notifications[(Notifications)]

    Student -->|Successful Purchase Items| P71
    Admin -->|Manual or Free Enrollment Command where permitted| P71
    P71 -->|Purchase Enrollment Trigger| P72
    P72 -->|Completed Order Lookup| Orders
    P72 -->|Successful Payment Lookup| Payments
    P72 -->|Purchased Course Items| OrderItems
    P72 -->|Manual Free Course or Admin Permission Check| Courses
    P72 -->|Eligibility Approved| P73
    P72 -->|Payment Incomplete or Manual Eligibility Failure| P77
    P73 -->|User Course Enrollment Lookup| Enrollments
    P73 -->|No Existing Enrollment| P74
    P73 -->|Duplicate Enrollment Rejection| P77
    P74 -->|Enrollment Data with nullable order_item_id| Enrollments
    P74 -->|Enrollment ID| P75
    P75 -->|Lesson Count Query| Courses
    P75 -->|Initial Progress completed_lessons 0| Progress
    P76 -->|Enrollment Lookup for Lesson or Course Access| Enrollments
    P76 -->|Course Access Allowed or Denied| P77
    P74 -->|Enrollment Created Event| P78
    P78 -->|Enrollment Notification Row| Notifications
    P77 -->|My Courses Enrollment Status or Paywall Denial| Student
    P77 -->|Manual Enrollment Result| Admin
```

## DFD-2.7 - Learning / Progress Tracking

Traceability to Level 1: decomposes learning parts of Process 7.0.

### Diagram

```mermaid
flowchart LR
    Student[Student]

    P81([7.9 Authenticate Lesson Access])
    P82([7.10 Verify Enrollment])
    P83([7.11 Load Lesson Content])
    P84([7.12 Record Lesson Completion])
    P85([7.13 Recalculate Progress])
    P86([7.14 Synchronize Enrollment Status])
    P87([7.15 Render Learning View])

    Courses[(Courses)]
    Lessons[(Lessons)]
    Enrollments[(Enrollments)]
    Progress[(Progress)]
    Notifications[(Notifications)]

    Student -->|Lesson Access Request| P81
    P81 -->|Session User ID and Course ID| P82
    P81 -->|Unauthenticated Lesson Request| P87
    P82 -->|Enrollment Lookup| Enrollments
    Enrollments -->|Enrollment Status| P82
    P82 -->|Enrolled Access Context| P83
    P82 -->|Unauthorized Lesson Access Paywall Denial| P87
    P83 -->|Ordered Lesson Query| Lessons
    P83 -->|Course Metadata Query| Courses
    P83 -->|Lesson Content and Resume Data| P87
    Student -->|Lesson Completion Event| P84
    P84 -->|Progress Lookup| Progress
    P84 -->|Completed Lesson Count, Last Accessed Lesson| Progress
    P84 -->|Completion Data| P85
    P85 -->|Total Lessons Query| Lessons
    P85 -->|completion_percentage| Progress
    P85 -->|Progress Percentage| P86
    P86 -->|not_started in_progress completed Status Update| Enrollments
    P86 -->|Course Completed Event| Notifications
    P87 -->|Lesson Page, Progress Bar, Resume Point, Access Error| Student
```

## DFD-2.8 - Assignments / Submissions / Grading

Traceability to Level 1: decomposes assignment parts of Process 8.0.

### Diagram

```mermaid
flowchart LR
    Instructor[Instructor]
    Student[Student]

    P91([8.1 Authorize Assignment Management])
    P92([8.2 Validate Assignment and Deadline])
    P93([8.3 Create or Update Assignment])
    P94([8.4 Create or Update Deadline])
    P95([8.5 Authorize Student Submission])
    P96([8.6 Validate Deadline and Upload])
    P97([8.7 Store Submission])
    P98([8.8 Grade Submission])
    P99([8.9 Emit Grading Notification])
    P910([8.10 Render Assignment Result])

    Courses[(Courses)]
    Assignments[(Assignments)]
    Deadlines[(Deadlines)]
    Submissions[(Submissions)]
    Enrollments[(Enrollments)]
    Notifications[(Notifications)]

    Instructor -->|Assignment Data and Deadline Data| P91
    P91 -->|Instructor Owns Course Check| Courses
    P91 -->|Authorized Assignment Action| P92
    P91 -->|Denied 403| P910
    P92 -->|Validated Assignment Data| P93
    P92 -->|Validation Errors| P910
    P93 -->|Assignment max_marks course_id| Assignments
    P93 -->|Assignment ID| P94
    P94 -->|Due Date and late_submission_allowed| Deadlines
    P94 -->|Assignment Management Result| P910

    Student -->|Assignment Submission File| P95
    P95 -->|Enrollment Lookup| Enrollments
    P95 -->|Assignment Course Lookup| Assignments
    P95 -->|Enrolled Student Submission Context| P96
    P95 -->|Unauthorized Submission Rejection| P910
    P96 -->|Deadline Lookup| Deadlines
    P96 -->|Multer File Processing Result file_url| P96
    P96 -->|Valid Submission Payload| P97
    P96 -->|Late Submission Rejection or Invalid File| P910
    P97 -->|Submission Record Unique assignment user| Submissions
    P97 -->|Duplicate Submission Rejection| P910

    Instructor -->|Marks and Feedback| P98
    P98 -->|Submission Lookup| Submissions
    P98 -->|marks_obtained feedback| Submissions
    P98 -->|Grade Event| P99
    P99 -->|Assignment Graded Notification| Notifications
    P910 -->|Assignment Created, Submission Stored, Marks Feedback, Error| Instructor
    P910 -->|Submission Status, Marks Feedback, Error| Student
```

## DFD-2.9 - Exams / Results

Traceability to Level 1: decomposes exam/result parts of Process 8.0.

Scope note: automated exam-taking and auto-grading are future/optional per roadmap. This DFD covers current supported metadata and manual result management.

### Diagram

```mermaid
flowchart LR
    Instructor[Instructor]
    Student[Student]

    P101([8.11 Authorize Exam Management])
    P102([8.12 Validate Exam Metadata])
    P103([8.13 Create or Update Exam])
    P104([8.14 Validate Result Entry])
    P105([8.15 Store Result])
    P106([8.16 Retrieve Results])
    P107([8.17 Emit Exam Notification])
    P108([8.18 Render Exam Result])

    Courses[(Courses)]
    Exams[(Exams)]
    Results[(Results)]
    Enrollments[(Enrollments)]
    Notifications[(Notifications)]

    Instructor -->|Exam Title, Total Marks, Duration, Exam Date| P101
    P101 -->|Instructor Owns Course Check| Courses
    P101 -->|Authorized Exam Metadata Action| P102
    P101 -->|Denied 403| P108
    P102 -->|Validated Exam Metadata| P103
    P102 -->|Invalid Exam Metadata| P108
    P103 -->|Exam Metadata| Exams
    P103 -->|Exam Notification Event| P107

    Instructor -->|Manual Result Data marks grade| P104
    P104 -->|Exam Course Lookup| Exams
    P104 -->|Student Enrollment Lookup| Enrollments
    P104 -->|Validated Result Data| P105
    P104 -->|Invalid Result or Non-Enrolled Student| P108
    P105 -->|Result Record Unique exam user| Results
    P105 -->|Duplicate Result Rejection| P108
    P105 -->|Result Published Event| P107

    Student -->|Result View Request| P106
    P106 -->|Enrollment Lookup| Enrollments
    P106 -->|Result Query| Results
    P106 -->|Exam Metadata Query| Exams
    P106 -->|Result Details or Not Found| P108
    P107 -->|Exam or Result Notification Row| Notifications
    P108 -->|Exam Management Result| Instructor
    P108 -->|Exam Schedule, Result Details, Error| Student
```

## DFD-2.10 - Certificates

Traceability to Level 1: decomposes certificate parts of Process 9.0.

### Diagram

```mermaid
flowchart LR
    Student[Student]
    Verifier[Certificate Verifier / Public Visitor]

    P111([9.1 Receive Certificate Trigger or Request])
    P112([9.2 Check Completion Eligibility])
    P113([9.3 Check Result Eligibility if Required])
    P114([9.4 Generate Unique Certificate URL])
    P115([9.5 Store Certificate])
    P116([9.6 Retrieve Certificate by URL])
    P117([9.7 Emit Certificate Notification])
    P118([9.8 Render Certificate Result])

    Enrollments[(Enrollments)]
    Progress[(Progress)]
    Results[(Results)]
    Certificates[(Certificates)]
    Courses[(Courses)]
    Users[(Users)]
    Notifications[(Notifications)]

    Student -->|Certificate Request| P111
    P111 -->|Course Completion Event or Request| P112
    P112 -->|Enrollment Completion Lookup| Enrollments
    P112 -->|Progress Completion Lookup| Progress
    P112 -->|Completion Approved| P113
    P112 -->|Eligibility Failure Not Completed| P118
    P113 -->|Conditional Results Lookup| Results
    P113 -->|Eligible or Results Not Required by Course Rule| P114
    P113 -->|Eligibility Failure Missing Required Result| P118
    P114 -->|Unique Certificate URL| P115
    P115 -->|Certificate Record Unique user course URL| Certificates
    P115 -->|User Details| Users
    P115 -->|Course Details| Courses
    P115 -->|Certificate Issued Event| P117
    P117 -->|Certificate Notification Row| Notifications
    P115 -->|Duplicate Certificate Existing URL| P118

    Verifier -->|Certificate URL| P116
    P116 -->|Certificate Lookup by certificate_url| Certificates
    P116 -->|User and Course Lookup| Users
    P116 -->|Course Lookup| Courses
    P116 -->|Verification Details or Not Found| P118
    P118 -->|Certificate Download or Eligibility Error| Student
    P118 -->|Certificate Verification Details or Not Found| Verifier
```

## DFD-2.11 - Reviews

Traceability to Level 1: decomposes review parts of Process 9.0.

### Diagram

```mermaid
flowchart LR
    Student[Student]
    Visitor[Catalog Visitor]

    P121([9.9 Authenticate Review Action])
    P122([9.10 Verify Enrollment for Review])
    P123([9.11 Validate Rating and Comment])
    P124([9.12 Store Review])
    P125([9.13 Aggregate Course Rating])
    P126([9.14 Render Review Result])

    Enrollments[(Enrollments)]
    Reviews[(Reviews)]
    Courses[(Courses)]

    Student -->|Review Data rating comment course_id| P121
    P121 -->|Authenticated Student Review| P122
    P121 -->|Unauthenticated Review Rejection| P126
    P122 -->|Enrollment Lookup| Enrollments
    P122 -->|Enrolled Review Context| P123
    P122 -->|Non-Enrolled Review Rejection| P126
    P123 -->|Validated Rating 1 to 5 and Comment| P124
    P123 -->|Invalid Rating or Comment Error| P126
    P124 -->|Review Record Unique user course| Reviews
    P124 -->|Duplicate Review Rejection| P126
    P124 -->|Review Created| P125
    P125 -->|Review Aggregation Query AVG rating| Reviews
    P125 -->|Course Rating Display Data| Courses
    Visitor -->|Course Rating View Request| P125
    P126 -->|Review Confirmation or Error| Student
    P126 -->|Average Rating and Reviews| Visitor
```

## DFD-2.12 - Notifications

Traceability to Level 1: decomposes notification parts of Process 10.0.

### Diagram

```mermaid
flowchart LR
    SystemEvent[Application Event Source]
    Student[Student]
    Instructor[Instructor]
    Provider[[Notification Channel Provider - optional]]

    P131([10.1 Receive Notification Event])
    P132([10.2 Select Recipient and Channel])
    P133([10.3 Create Queued Notification])
    P134([10.4 Deliver Notification])
    P135([10.5 Update Delivery Status])
    P136([10.6 Retry Failed Notification])
    P137([10.7 Mark Notification Read])
    P138([10.8 Render Notification View])

    Users[(Users)]
    Notifications[(Notifications)]

    SystemEvent -->|Enrollment Payment Assignment Exam Certificate System Event| P131
    P131 -->|Notification Event Payload| P132
    P132 -->|Recipient Lookup| Users
    P132 -->|Recipient and Channel in_app email sms| P133
    P132 -->|Invalid Recipient| P138
    P133 -->|Queued Notification status queued| Notifications
    P133 -->|Queued Payload| P134
    P134 -->|In-App Notification Delivery| Notifications
    P134 -->|Email or SMS Payload where configured| Provider
    Provider -->|Delivery Result or Failure| P135
    P134 -->|In-App Sent Result| P135
    P135 -->|status sent failed error_reason sent_at retries_count| Notifications
    P135 -->|Failed Status| P136
    P136 -->|Retry Eligibility retries_count less than max_retries| Notifications
    P136 -->|Retry Payload| P134
    P136 -->|Max Retries Reached Failure| P138
    Student -->|Read Notification Action| P137
    Instructor -->|Read Notification Action| P137
    P137 -->|status read read_at| Notifications
    P138 -->|Unread and Read Notifications, Delivery Error| Student
    P138 -->|Unread and Read Notifications, Delivery Error| Instructor
```

## DFD-2.13 - Activity / Audit Logging

Traceability to Level 1: decomposes activity logging parts of Process 10.0.

### Diagram

```mermaid
flowchart LR
    EventSource[Security or Business Event Source]
    Admin[Admin]

    P141([10.9 Capture Sensitive Event])
    P142([10.10 Build Audit Metadata])
    P143([10.11 Store Activity Log])
    P144([10.12 Query Activity Logs])
    P145([10.13 Render Audit Result])

    Users[(Users)]
    ActivityLog[(Activity_Log)]

    EventSource -->|Login, Role Change, Payment Attempt, Profile Change, Access Denial| P141
    P141 -->|Event User ID and Action| P142
    P142 -->|User Lookup| Users
    P142 -->|Action Timestamp IP Address Metadata JSON| P143
    P143 -->|Activity Log Entry| ActivityLog
    P143 -->|Log Stored or Persistence Error| P145
    Admin -->|Audit Query Criteria| P144
    P144 -->|Filtered Log Query by user_id event_time| ActivityLog
    P144 -->|User Context Query| Users
    P145 -->|Audit Trail View or Error| Admin
```

## DFD-2.14 - Admin Management

Traceability to Level 1: decomposes Process 11.0.

### Diagram

```mermaid
flowchart LR
    Admin[Admin]

    P151([11.1 Authenticate and Authorize Admin])
    P152([11.2 Manage User Status])
    P153([11.3 Manage Categories])
    P154([11.4 Manage Coupons])
    P155([11.5 Moderate Courses])
    P156([11.6 View Orders and Payments])
    P157([11.7 Generate Metrics])
    P158([11.8 Manage Role Permission Seed Data])
    P159([11.9 Render Admin Result])
    P1510([11.10 Record Admin Activity])

    Users[(Users)]
    Roles[(Roles)]
    Permissions[(Permissions)]
    RolePermissions[(Role_Permissions)]
    Categories[(Categories)]
    Courses[(Courses)]
    Coupons[(Coupons)]
    Orders[(Orders)]
    OrderItems[(Order_Items)]
    Payments[(Payments)]
    Enrollments[(Enrollments)]
    ActivityLog[(Activity_Log)]

    Admin -->|Admin Command or Reporting Criteria| P151
    P151 -->|Role Permission Check| RolePermissions
    P151 -->|Authorized Admin Context| P152
    P151 -->|Authorized Admin Context| P153
    P151 -->|Authorized Admin Context| P154
    P151 -->|Authorized Admin Context| P155
    P151 -->|Authorized Admin Context| P156
    P151 -->|Authorized Admin Context| P157
    P151 -->|Authorized Admin Context| P158
    P151 -->|Denied 403| P159

    P152 -->|active inactive banned Status Update| Users
    P152 -->|User Status Result| P1510
    P153 -->|Category CRUD| Categories
    P153 -->|Category Result| P1510
    P154 -->|Coupon CRUD and Validation Rules| Coupons
    P154 -->|Coupon Result| P1510
    P155 -->|Course Status Moderation| Courses
    P155 -->|Moderation Result| P1510
    P156 -->|Order Overview Query| Orders
    P156 -->|Order Item Query| OrderItems
    P156 -->|Payment Overview Query| Payments
    P157 -->|Total User Count Query| Users
    P157 -->|Revenue Query completed Orders| Orders
    P157 -->|Most Enrolled Courses Query| Enrollments
    P157 -->|Course Context Query| Courses
    P158 -->|Seed or Maintain Roles| Roles
    P158 -->|Seed or Maintain Permissions| Permissions
    P158 -->|Role Permission Mapping| RolePermissions
    P1510 -->|Admin Audit Log Entry| ActivityLog
    P159 -->|Management Confirmation, Metrics, Overview, Error| Admin
```

## Part C - Data Dictionary

| ID | Data Flow | Description | Source | Destination |
|---|---|---|---|---|
| DF-01 | Registration Data | Name, email, password, role selection, phone where supplied | Student/Instructor | Validate Registration Input |
| DF-02 | Password Hash | Bcrypt hash generated from accepted password | Hash Password | Users |
| DF-03 | Login Credentials | Email and password submitted for login | Student/Instructor/Admin | Validate Login Credentials |
| DF-04 | Authenticated Session | `user_id` and `role_id` stored in session | Create or Destroy Session | Student/Instructor/Admin |
| DF-05 | Account Status Result | Active, inactive, or banned account decision | Check Account Status | Auth Result |
| DF-06 | Permission Details | Role permission mapping for protected action | Role_Permissions/Permissions | Check Permission |
| DF-07 | User Profile Data | Name, phone, and tracked profile updates | Student/Instructor | Users |
| DF-08 | Instructor Profile Data | Bio, expertise, experience, rating | Instructor | Instructor_Profile |
| DF-09 | Course Data | Title, description, instructor, price, duration, level, status | Instructor/Admin | Courses |
| DF-10 | Lesson Data | Course lesson title, content type, content URL, duration, order index | Instructor | Lessons |
| DF-11 | Category Assignment | Course/category mapping | Instructor/Admin | Course_Category |
| DF-12 | Search Criteria | Search term, category filter, level filter | Student/Public Visitor | Catalog Search |
| DF-13 | Published Catalog | Published courses with categories and rating summary | Catalog Browsing | Student/Public Visitor |
| DF-14 | Locked Curriculum Outline | Lesson list without unauthorized content access | Catalog Detail | Student/Public Visitor |
| DF-15 | Wishlist Item | User-course save/remove action | Student | Wishlist |
| DF-16 | Cart Item | User-course add/remove action | Student | Cart_Items |
| DF-17 | Cart Summary | Cart items and running subtotal | Calculate Cart Subtotal | Student |
| DF-18 | Coupon Code | Discount code entered by student or configured by admin | Student/Admin | Validate or Manage Coupon |
| DF-19 | Coupon Result | Valid discount details or rejection reason | Validate Coupon | Student |
| DF-20 | Checkout Data | Cart, coupon, and payment method submitted for purchase | Student | Checkout |
| DF-21 | Pending Order | Order with subtotal, discount, total, status `pending` | Create Pending Order | Orders |
| DF-22 | Locked Price Order Items | Purchased course rows with `price_at_purchase` | Create Order Items | Order_Items |
| DF-23 | Payment Request | Amount, order reference, payment method | Process Gateway Payment | Payment Gateway |
| DF-24 | Payment Result | Success/failure/pending status and transaction reference | Payment Gateway | Update Payment and Order Status |
| DF-25 | Payment Attempt | Payment row per attempt | Create Payment Attempt | Payments |
| DF-26 | Successful Purchase Items | Completed order items eligible for enrollment | Checkout / Payments | Enrollment |
| DF-27 | Enrollment Data | User-course enrollment with optional `order_item_id` | Create Enrollment | Enrollments |
| DF-28 | Paywall Decision | Enrolled or denied access decision | Verify Enrollment | Student |
| DF-29 | Lesson Content | Authorized lesson title/content URL/type/duration | Load Lesson Content | Student |
| DF-30 | Lesson Completion | Completed lesson and last accessed lesson | Student | Progress Tracking |
| DF-31 | Progress Data | Completed lessons, total lessons, last lesson, percentage | Update Progress | Progress |
| DF-32 | Enrollment Completion Status | `not_started`, `in_progress`, or `completed` | Synchronize Enrollment Status | Enrollments |
| DF-33 | Assignment Data | Assignment title, description, max marks, course ID | Instructor | Assignments |
| DF-34 | Deadline Data | Due date and late submission setting | Instructor | Deadlines |
| DF-35 | Assignment Submission | Uploaded file URL, assignment, user, course, timestamp | Student | Submissions |
| DF-36 | Grading Result | Marks and feedback | Instructor | Submissions |
| DF-37 | Exam Metadata | Title, total marks, duration, exam date | Instructor | Exams |
| DF-38 | Manual Result Data | Exam, user, course, marks, grade | Instructor | Results |
| DF-39 | Result Details | Marks, grade, and result date | Results | Student |
| DF-40 | Certificate Eligibility Data | Completion and conditional result data | Enrollments/Progress/Results | Check Certificate Eligibility |
| DF-41 | Certificate Details | User, course, issue date, certificate URL | Certificates | Student/Verifier |
| DF-42 | Review Data | Rating 1-5 and comment for enrolled course | Student | Reviews |
| DF-43 | Rating Aggregate | Average course rating | Reviews | Catalog/Course Detail |
| DF-44 | Notification Event | Enrollment, payment, assignment, exam, certificate, or system event | Application Processes | Notification Processing |
| DF-45 | Queued Notification Payload | Recipient, message, type, channel, priority | Notification Processing | Notifications |
| DF-46 | Delivery Result | Sent, failed, read, retry metadata | Notification Provider/User | Notifications |
| DF-47 | Audit Log Entry | User, action, event time, IP address, metadata JSON | Security/Business Processes | Activity_Log |
| DF-48 | Admin Command | User status, category, coupon, course moderation, seed data | Admin | Admin Management |
| DF-49 | Admin Metrics | Totals, revenue, most enrolled courses | Admin Reporting | Admin |
| DF-50 | Validation Error | Form, business rule, or transaction validation failure | Application Process | Initiating User |
| DF-51 | Rollback Result | Checkout transaction failure result after rollback | Checkout Transaction | Student |

## Part D - Process Dictionary

| Process ID | Process Name | Purpose | Inputs | Outputs | Data Stores |
|---|---|---|---|---|---|
| 1.0 | Authenticate & Authorize Access | Register users, validate login, manage sessions, enforce RBAC | Registration Data, Login Credentials, Session | Session, Auth Failure, Access Denial | Users, Roles, Permissions, Role_Permissions, Instructor_Profile, Activity_Log |
| 2.0 | Manage User and Instructor Profiles | Maintain user and instructor profile data | Profile Updates | Profile Confirmation, Errors | Users, Instructor_Profile, Activity_Log |
| 3.0 | Manage Courses and Content | Let instructors/admin create courses, lessons, and category mappings | Course Data, Lesson Data, Category Assignment | Course Management Result | Courses, Lessons, Categories, Course_Category |
| 4.0 | Discover and Browse Courses | Show published catalog and course details | Search Criteria, Course Selection | Catalog, Detail, Locked Curriculum | Courses, Categories, Course_Category, Lessons, Reviews, Enrollments |
| 5.0 | Manage Cart Wishlist and Coupons | Maintain wishlist/cart and validate coupons | Wishlist Item, Cart Item, Coupon Code | Cart Summary, Coupon Result | Wishlist, Cart, Cart_Items, Courses, Coupons |
| 6.0 | Checkout Orders and Payments | Convert cart to order, process payment, create enrollment on success | Checkout Data, Payment Result | Receipt, Payment Failure, Successful Purchase Items | Cart, Cart_Items, Courses, Coupons, Orders, Order_Items, Payments, Enrollments |
| 7.0 | Manage Enrollment and Learning | Enforce paywall, track progress, sync completion | Purchase Items, Lesson Access, Lesson Completion | Enrollment, Lesson Content, Progress Summary | Enrollments, Progress, Lessons, Courses |
| 8.0 | Manage Assessments and Grading | Create assignments/exams, accept submissions, record grades/results | Assignment Data, Submission, Grade, Exam Metadata, Result Data | Submission Status, Feedback, Results | Assignments, Deadlines, Submissions, Exams, Results, Enrollments |
| 9.0 | Generate Certificates and Manage Reviews | Generate verifiable certificates and handle course reviews | Certificate Request, Review Data | Certificate Details, Review Result, Rating Aggregate | Certificates, Reviews, Enrollments, Progress, Results, Courses, Users |
| 10.0 | Process Notifications and Activity Logs | Create/deliver notifications and persist audit events | Notification Event, Sensitive Event | Notifications, Audit Log View | Notifications, Activity_Log, Users |
| 11.0 | Administer Platform | Manage users, categories, coupons, moderation, reports, seed data | Admin Command, Reporting Criteria | Admin Result, Metrics | Users, Roles, Permissions, Role_Permissions, Categories, Courses, Coupons, Orders, Order_Items, Payments, Enrollments, Activity_Log |

## Part E - Data Store Mapping

| Data Store | Database Table(s) | Purpose | Read/Write |
|---|---|---|---|
| DS-01 | Roles | Defines admin/instructor/student roles | Read during auth/admin; write during seed/admin |
| DS-02 | Permissions | Defines permission names | Read during RBAC; write during seed/admin |
| DS-03 | Role_Permissions | Maps roles to permissions | Read during authorization; write during seed/admin |
| DS-04 | Users | Stores accounts, password hashes, role IDs, status, profile basics | Read/write |
| DS-05 | Instructor_Profile | Stores instructor-specific profile details | Read/write |
| DS-06 | Categories | Stores course categories | Read/write |
| DS-07 | Courses | Stores course metadata, instructor ownership, price, status | Read/write |
| DS-08 | Course_Category | Stores many-to-many course/category mappings | Read/write |
| DS-09 | Lessons | Stores ordered lesson metadata and content URLs | Read/write |
| DS-10 | Cart | Stores one cart per user | Read/write |
| DS-11 | Cart_Items | Stores courses in a user's cart | Read/write |
| DS-12 | Wishlist | Stores saved courses per user | Read/write |
| DS-13 | Coupons | Stores coupon rules and usage counters | Read/write |
| DS-14 | Orders | Stores order totals, coupon, and lifecycle status | Read/write |
| DS-15 | Order_Items | Stores purchased courses and locked prices | Read/write |
| DS-16 | Payments | Stores payment attempts, method, status, transaction reference | Read/write |
| DS-17 | Enrollments | Stores user-course access and completion status | Read/write |
| DS-18 | Progress | Stores lesson progress and completion percentage | Read/write |
| DS-19 | Assignments | Stores course assignments and max marks | Read/write |
| DS-20 | Deadlines | Stores one deadline per assignment and late rule | Read/write |
| DS-21 | Submissions | Stores assignment file URL, marks, and feedback | Read/write |
| DS-22 | Exams | Stores exam metadata | Read/write |
| DS-23 | Results | Stores manual/entered exam results | Read/write |
| DS-24 | Certificates | Stores issued certificates and unique verification URLs | Read/write |
| DS-25 | Reviews | Stores one review per enrolled user/course and ratings | Read/write |
| DS-26 | Notifications | Stores notification payloads, channels, statuses, retry metadata | Read/write |
| DS-27 | Activity_Log | Stores security/business audit events with IP and metadata | Read/write |

## Part F - Traceability Matrix

| Feature | Process | Input | Data Store | Output | Business Rule |
|---|---|---|---|---|---|
| Registration | 1.1-1.4 | Registration Data | Users, Roles, Instructor_Profile | User Account, Instructor Profile | Password is hashed; instructor registration creates linked `Instructor_Profile` |
| Login/logout | 1.5-1.7 | Login Credentials | Users | Session or Auth Failure | Credentials validated against hash; inactive/banned users rejected |
| RBAC | 1.8 | Session Role, Protected Action | Role_Permissions, Permissions | Authorized Context or 403 | Route permission must exist for user's role |
| Account status | 1.6, 11.2 | Login/User Status Change | Users | Access Allowed/Denied | `status` supports active, inactive, banned |
| Profile management | 2.1-2.6 | Profile Updates | Users, Instructor_Profile | Profile Confirmation | Input validation before write; activity tracked |
| Instructor course ownership | 3.1-3.3 | Course Data | Courses, Users | Owned Course | Instructor may manage own courses |
| Course lifecycle | 3.6, 11.5 | Status Change | Courses | Draft/Published/Archived Course | Status enum is draft, published, archived |
| Lesson management | 3.4 | Lesson Data | Lessons | Ordered Lesson | `order_index` unique per course |
| Category management | 3.5, 11.3 | Category Data | Categories, Course_Category | Category/Mappings | Categories unique by name; course/category pair unique |
| Public browsing | 4.1-4.4 | Search Criteria | Courses, Categories, Course_Category, Reviews | Published Catalog | Only `published` courses are public |
| Lesson access restriction | 4.5, 7.9-7.11 | Lesson Request | Enrollments, Lessons | Lesson Content or Paywall Denial | Server-side enrollment check required |
| Wishlist | 5.1-5.2 | Wishlist Item | Wishlist, Courses | Wishlist Result | Duplicate prevented by unique user/course |
| Cart lazy creation | 5.3 | Cart Item | Cart | Cart ID | One cart per user; created on first add |
| Cart duplicate prevention | 5.4 | Cart Item | Cart_Items | Cart Result | Unique cart/course prevents duplicate item |
| Cart subtotal | 5.5 | Cart Items | Cart_Items, Courses | Cart Summary | Subtotal uses current course prices |
| Coupon validation | 5.6, 6.3 | Coupon Code, Subtotal | Coupons | Coupon Result | Active, valid dates, usage limit, min order, max discount cap |
| Checkout transaction | 6.5-6.9 | Cart Items, Totals | Orders, Order_Items, Cart_Items | Pending Order or Rollback | START TRANSACTION -> create order -> create items -> clear cart -> COMMIT; rollback on failure |
| Price lock | 6.7 | Course Prices | Courses, Order_Items | `price_at_purchase` | Purchased price is copied to order item |
| Payment attempt | 6.10-6.12 | Payment Method, Amount | Payments, Orders | Payment Status | One payment row per attempt; success updates order completed |
| Failed payment | 6.12 | Payment Failure | Payments, Orders | Retry Prompt | Failed payment does not create enrollment |
| Enrollment creation | 6.13, 7.1-7.5 | Successful Purchase Items | Enrollments, Progress | Enrollment and Initial Progress | Duplicate prevented by unique user/course; purchase links `order_item_id` |
| Manual/free enrollment | 7.1-7.4 | Admin/manual command | Enrollments, Courses | Enrollment | Supported by nullable `order_item_id`, workflow under-specified |
| Learning progress | 7.9-7.14 | Lesson Completion | Progress, Lessons, Enrollments | Progress Summary | Completed lessons <= total lessons; status syncs with percentage |
| Assignment creation | 8.1-8.4 | Assignment Data, Deadline Data | Assignments, Deadlines | Assignment | One deadline per assignment |
| Assignment submission | 8.5-8.7 | Submission File | Submissions, Deadlines, Enrollments | Submission Status | Enrolled student only; late blocked unless allowed; one submission per assignment/user |
| Assignment grading | 8.8-8.9 | Marks Feedback | Submissions, Notifications | Grading Result | Marks must be non-negative; feedback stored |
| Exam metadata | 8.11-8.13 | Exam Metadata | Exams | Exam Schedule | Total marks and duration must be positive |
| Results | 8.14-8.16 | Manual Result Data | Results, Exams, Enrollments | Result Details | One result per exam/user; automated exam engine not represented |
| Certificate generation | 9.1-9.5 | Certificate Request/Completion Event | Certificates, Enrollments, Progress, Results | Certificate URL | Completion required; result requirement is ambiguous/conditional |
| Certificate verification | 9.6 | Certificate URL | Certificates, Users, Courses | Verification Details | URL must be unique |
| Reviews | 9.9-9.14 | Rating Comment | Reviews, Enrollments | Review Result, Rating Aggregate | Enrolled users only; one review per user/course; rating 1-5 |
| Notifications | 10.1-10.8 | Notification Event | Notifications, Users | Delivered/Read Notification | Channel, status, retry counts tracked |
| Activity logging | 10.9-10.13 | Sensitive Event | Activity_Log, Users | Audit Trail | Stores action, timestamp, IP, metadata |
| Admin user management | 11.2 | User Status Change | Users | User Status Result | Admin manages active/inactive/banned |
| Admin reporting | 11.6-11.7 | Reporting Criteria | Orders, Payments, Enrollments, Courses, Users | Metrics | Revenue uses completed orders |

## Part G - Coverage Audit

| Requirement/Feature | Present in DFD? | Diagram | Process | Data Store | Notes |
|---|---|---|---|---|---|
| Student, Instructor, Admin entities | ✅ Covered | DFD-0, DFD-1.0 | Multiple | Multiple | Core actors shown |
| Payment Gateway | ✅ Covered | DFD-0, DFD-2.5 | 6.11 | Payments, Orders | Generic gateway only; provider not fixed |
| Notification external provider | ⚠️ Partially Covered | DFD-0, DFD-2.12 | 10.4-10.6 | Notifications | Provider unnamed; in-app core |
| File storage | ⚠️ Partially Covered | DFD-2.8 | 8.6-8.7 | Submissions | `multer` and `file_url` supported; no external provider named |
| Node/Express/EJS/MVC architecture | ✅ Covered | Summary, DFD-1.0 | All | MySQL tables | Express route/middleware/controller/model flow summarized |
| Middleware/security controls | ✅ Covered | DFD-2.0, DFD-2.5, DFD-2.8, DFD-2.14 | Auth/RBAC/validation | Users, Role_Permissions | Auth, RBAC, validation, errors visible |
| Registration and password hashing | ✅ Covered | DFD-2.0 | 1.1-1.3 | Users | Bcrypt represented |
| Session handling | ✅ Covered | DFD-2.0 | 1.7 | Users | Session contains user/role IDs |
| Account status | ✅ Covered | DFD-2.0, DFD-2.14 | 1.6, 11.2 | Users | Active/inactive/banned |
| RBAC authorization | ✅ Covered | DFD-2.0 | 1.8 | Permissions, Role_Permissions | 403 path shown |
| Instructor onboarding | ✅ Covered | DFD-2.0 | 1.4 | Instructor_Profile | Auto-create profile |
| Course management | ✅ Covered | DFD-2.2 | 3.1-3.8 | Courses, Lessons, Categories, Course_Category | Ownership, status, ordered lessons |
| Published catalog | ✅ Covered | DFD-2.3 | 4.3 | Courses | Published visibility |
| Locked lessons | ✅ Covered | DFD-2.3, DFD-2.7 | 4.5, 7.10 | Enrollments, Lessons | Server-side access check |
| Wishlist | ✅ Covered | DFD-2.4 | 5.2 | Wishlist | Duplicate prevention |
| Cart | ✅ Covered | DFD-2.4 | 5.3-5.5 | Cart, Cart_Items | Lazy cart and subtotal |
| Coupons | ✅ Covered | DFD-2.4, DFD-2.5 | 5.6, 6.3 | Coupons | Dates, active, limits, min amount, max cap |
| Checkout transaction | ✅ Covered | DFD-2.5 | 6.5-6.9 | Orders, Order_Items, Cart_Items | Start/commit/rollback shown |
| Payments | ✅ Covered | DFD-2.5 | 6.10-6.12 | Payments, Orders | Attempts, refs, success/failure |
| Enrollment after successful payment | ✅ Covered | DFD-2.5, DFD-2.6 | 6.13, 7.1-7.5 | Enrollments | Failed payment no enrollment |
| Manual/free enrollment | ⚠️ Partially Covered | DFD-2.6 | 7.1-7.4 | Enrollments | Schema supports nullable order_item_id; detailed business workflow not documented |
| Learning progress | ✅ Covered | DFD-2.7 | 7.12-7.14 | Progress, Enrollments | Completion percentage and status sync |
| Assignments | ✅ Covered | DFD-2.8 | 8.1-8.4 | Assignments, Deadlines | Deadline rules included |
| Submissions | ✅ Covered | DFD-2.8 | 8.5-8.7 | Submissions | Late and invalid upload failure paths |
| Grading | ✅ Covered | DFD-2.8 | 8.8-8.9 | Submissions | Marks and feedback |
| Exams | ⚠️ Partially Covered | DFD-2.9 | 8.11-8.18 | Exams, Results | Auto exam-taking excluded as future/optional |
| Certificates | ✅ Covered | DFD-2.10 | 9.1-9.8 | Certificates | Eligibility ambiguity marked |
| Reviews | ✅ Covered | DFD-2.11 | 9.9-9.14 | Reviews | Enrolled only, one per course/user, rating 1-5 |
| Notifications | ✅ Covered | DFD-2.12 | 10.1-10.8 | Notifications | Status, channel, retry |
| Activity logging | ✅ Covered | DFD-2.13 | 10.9-10.13 | Activity_Log | Login, role changes, payment attempts |
| Admin | ✅ Covered | DFD-2.14 | 11.1-11.10 | Multiple | Users, categories, coupons, moderation, reporting |
| Deployment | ❌ Missing | N/A | N/A | N/A | Optional roadmap work, not runtime DFD scope |
| Auto-graded exam engine | ❌ Missing | N/A | N/A | N/A | Explicitly future/optional in roadmap |
| Student_Profile table | ❌ Missing | N/A | N/A | N/A | Mentioned only as future work; not in schema |

## Part H - DFD Validation Report

| Validation Check | Result | Notes |
|---|---|---|
| Level 0 to Level 1 balancing | Pass | All context flows map to Level 1 modules: auth, catalog, cart, checkout, learning, assessments, certificates, reviews, notifications, admin |
| Level 1 to Level 2 balancing | Pass | Every Level 1 process has at least one detailed Level 2 decomposition; Process 7 and 8 are split into focused Level 2 diagrams |
| Orphan processes | Pass | Every process has at least one meaningful input and output |
| Orphan data flows | Pass | Data flows terminate at a process, external entity, or data store |
| Unexplained data stores | Pass | All 27 SQL tables are represented in Level 1 and mapped in Part E |
| Missing inputs | Pass | Each process dictionary entry identifies inputs |
| Missing outputs | Pass | Each process returns success and/or failure output to an actor or downstream process |
| Missing persistence | Pass | Persistent workflows write to schema-backed stores; file uploads persist `file_url` in `Submissions` |
| Incorrect table usage | Pass | DFD data stores use exact SQL table names and avoid non-schema tables |
| Missing external entities | Pass with caveat | Required actors and gateway shown; notification provider shown as optional/unnamed because provider is not specified |
| Missing failure paths | Pass | Auth failures, 403, invalid coupons, cart validation, rollback, payment failure, unauthorized lessons, late submissions, certificate failure, notification delivery failure are shown |
| Missing security checks | Pass | Auth, RBAC, account status, validation, paywall, sensitive audit logging are explicit process/control points |
| Missing transactional behavior | Pass | Checkout transaction explicitly shows START TRANSACTION, create order, create order items, clear cart, COMMIT, and ROLLBACK |
| Undocumented assumptions | Pass | Certificate eligibility, exam engine, notification provider, payment provider, and manual enrollment assumptions are documented |
| Future work accidentally shown as current | Pass | Deployment, Student_Profile, live classes, quiz engine, auto-graded exams are excluded or marked unsupported/future |
| DFD vs ERD separation | Pass | Relationships are only shown when data is read/written/transferred by a documented process |
| DFD vs sequence diagram separation | Pass | Diagrams show data movement and process transformations, not route-by-route or SQL-by-SQL messages |

