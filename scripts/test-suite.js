/**
 * Automated Verification & Test Suite for E-Learning Platform (Phase 9 Hardening & Quality Assurance)
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = require('../config/db');
const User = require('../models/User');
const Role = require('../models/Role');
const Course = require('../models/Course');
const Category = require('../models/Category');
const Lesson = require('../models/Lesson');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const Certificate = require('../models/Certificate');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Metric = require('../models/Metric');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('  E-Learning Platform — Phase 9 Comprehensive Verification Test');
  console.log('===============================================================\n');

  try {
    // 1. Database Connection & Table Schema Verification
    console.log('1. Database Pool & Table Schema Verification:');
    const tables = await db.query('SHOW TABLES');
    assert(tables.length >= 20, `Database has ${tables.length} schema tables`);

    // 2. Roles & Permissions RBAC Verification
    console.log('\n2. RBAC & Roles Verification:');
    const roles = await db.query('SELECT role_id, role_name FROM Roles');
    assert(roles.some(r => r.role_name === 'Admin'), 'Admin role exists');
    assert(roles.some(r => r.role_name === 'Instructor'), 'Instructor role exists');
    assert(roles.some(r => r.role_name === 'Student'), 'Student role exists');

    const adminRole = roles.find(r => r.role_name === 'Admin');
    const adminPerms = await Role.getPermissionsByRoleId(adminRole.role_id);
    assert(adminPerms.includes('user:manage'), 'Admin has user:manage permission');
    assert(adminPerms.includes('course:publish'), 'Admin has course:publish permission');

    // 3. Auth Hardening & Password Security
    console.log('\n3. Auth Hardening & Password Security:');
    const testEmail = `test.student.${Date.now()}@example.com`;
    const password = 'Password@123';
    const hash = await bcrypt.hash(password, 10);
    
    const studentId = await User.createStudent({
      name: 'Test Student QA',
      email: testEmail,
      passwordHash: hash,
      phone: '1122334455'
    });
    assert(studentId > 0, 'Student created successfully');

    const studentUser = await User.findById(studentId);
    assert(studentUser.status === 'active', 'New account status defaults to active');
    const isPasswordValid = await bcrypt.compare(password, hash);
    assert(isPasswordValid, 'Password hash matches original plain text');

    // Test status update and revocation
    await User.updateStatus(studentId, 'banned');
    const bannedUser = await User.findById(studentId);
    assert(bannedUser.status === 'banned', 'Account status updated to banned in database');
    await User.updateStatus(studentId, 'active'); // restore

    // 4. Course Catalog & Multi-Category Association
    console.log('\n4. Course Catalog & Multi-Category Transaction:');
    const categories = await Category.getAll();
    assert(categories.length > 0, `Loaded ${categories.length} categories`);

    const instructors = await db.query(
      `SELECT u.user_id FROM Users u JOIN Roles r ON u.role_id = r.role_id WHERE r.role_name = 'Instructor' LIMIT 1`
    );
    const instructorId = instructors.length > 0 ? instructors[0].user_id : studentId;

    const courseTitle = `Automated QA Course ${Date.now()}`;
    const courseId = await Course.create({
      title: courseTitle,
      description: 'Comprehensive automated test course for platform verification.',
      instructor_id: instructorId,
      price: 49.99,
      duration: 120,
      level: 'intermediate',
      status: 'published',
      category_ids: [categories[0].category_id]
    });
    assert(courseId > 0, `Course created successfully with ID: ${courseId}`);

    // Create 2 Ordered Lessons
    const lesson1Id = await Lesson.create({
      course_id: courseId,
      title: 'Introduction & Foundations',
      content_type: 'video',
      content_url: 'https://example.com/video1.mp4',
      duration: 15,
      order_index: 1
    });
    const lesson2Id = await Lesson.create({
      course_id: courseId,
      title: 'Advanced Core Concepts',
      content_type: 'document',
      content_url: 'https://example.com/doc2.pdf',
      duration: 25,
      order_index: 2
    });
    assert(lesson1Id > 0 && lesson2Id > 0, 'Ordered lessons created for course');

    // 5. Cart, Coupon & Checkout Transaction
    console.log('\n5. Cart, Coupon & Checkout Transaction:');
    await Cart.addItem(studentId, courseId);
    const cartSummary = await Cart.getCartSummary(studentId);
    assert(cartSummary.items.length === 1, 'Course added to student cart');
    assert(cartSummary.subtotal === 49.99, 'Cart subtotal matches course price ($49.99)');

    // Validate Coupon
    const testCouponCode = `QA10_${Date.now()}`;
    const couponId = await Coupon.create({
      code: testCouponCode,
      discount_type: 'percent',
      discount_value: 10,
      min_order_amount: 20,
      max_discount_amount: 10,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      usage_limit: 50
    });
    const couponVal = await Coupon.validateCoupon(testCouponCode, cartSummary.subtotal);
    assert(couponVal.valid && couponVal.discount_amount === 5.00, 'Coupon 10% applied correctly ($5.00 off)');

    // Create Order Transaction
    const totalAfterDiscount = 44.99;
    const orderId = await Order.createOrderFromCart({
      userId: studentId,
      couponId,
      subtotalAmount: cartSummary.subtotal,
      discountAmount: couponVal.discount_amount,
      totalAmount: totalAfterDiscount,
      cartId: cartSummary.cart_id,
      items: cartSummary.items
    });
    assert(orderId > 0, `Order #${orderId} created atomically from cart`);

    const cartAfterCheckout = await Cart.getCartSummary(studentId);
    assert(cartAfterCheckout.items.length === 0, 'Cart cleared after order creation');

    // 6. Payment Processing & Auto-Enrollment
    console.log('\n6. Payment Gateway Simulation & Auto-Enrollment:');
    const paymentResult = await Payment.processPaymentAndEnroll({
      orderId,
      amount: totalAfterDiscount,
      paymentMethod: 'card',
      transactionRef: `TXN_QA_${Date.now()}`,
      isSuccess: true
    });
    assert(paymentResult.status === 'success', 'Payment transaction succeeded with status success');

    const isEnrolled = await Enrollment.isEnrolled(studentId, courseId);
    assert(isEnrolled, 'Student automatically enrolled in purchased course');

    // 7. Learning Experience & Progress Calculation
    console.log('\n7. Learning Experience, Progress & Completion Sync:');
    // Complete lesson 1 (1 of 2 -> 50%)
    await Progress.recordLessonCompletion(studentId, courseId, lesson1Id, 1);
    let progress = await Progress.getProgress(studentId, courseId);
    assert(progress.completed_lessons === 1, 'Lesson 1 recorded in progress');
    assert(parseFloat(progress.completion_percentage) === 50, 'Progress percentage calculated as 50%');

    // Complete lesson 2 (2 of 2 -> 100% and completion status completed)
    await Progress.recordLessonCompletion(studentId, courseId, lesson2Id, 2);
    progress = await Progress.getProgress(studentId, courseId);
    assert(progress.completed_lessons === 2, 'Lesson 2 recorded in progress');
    assert(parseFloat(progress.completion_percentage) === 100, 'Progress percentage reached 100%');

    const enrollment = await Enrollment.getEnrollment(studentId, courseId);
    assert(enrollment.completion_status === 'completed', 'Enrollment completion_status synced to completed');

    // 8. Certificates & Reviews
    console.log('\n8. Certificates & Course Reviews:');
    const certRecord = await Certificate.issueIfEligible(studentId, courseId);
    const certUrl = certRecord.certificate_url;
    assert(certUrl && certUrl.length > 10, `Certificate issued with URL token: ${certUrl}`);

    const verifiedCert = await Certificate.findByUrl(certUrl);
    assert(verifiedCert && verifiedCert.student_name === 'Test Student QA', 'Public certificate verified student details');

    // Submit Review
    await Review.create(studentId, courseId, 5, 'Exceptional course with thorough practical material!');
    const reviewSummary = await Review.getSummary(courseId);
    assert(reviewSummary.review_count >= 1 && parseFloat(reviewSummary.average_rating) > 0, 'Review stored and average rating calculated');

    // 9. Assessments: Assignments & Exams
    console.log('\n9. Assessments, Submissions & Grading:');
    const assignmentId = await Assignment.create({
      course_id: courseId,
      title: 'QA Final Capstone Project',
      description: 'Submit full source repository zip archive.',
      max_marks: 100,
      due_date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 19).replace('T', ' '),
      late_submission_allowed: true
    });
    assert(assignmentId > 0, `Assignment created with ID: ${assignmentId}`);

    const submissionId = await Submission.submit({
      assignment_id: assignmentId,
      user_id: studentId,
      course_id: courseId,
      file_url: '/uploads/assignments/qa-test-submission.pdf'
    });
    assert(submissionId > 0, `Student submitted file with ID: ${submissionId}`);

    await Submission.grade(submissionId, 95.5, 'Outstanding implementation and thorough test coverage.');
    const gradedSub = await Submission.findById(submissionId);
    assert(parseFloat(gradedSub.marks_obtained) === 95.5, 'Submission graded 95.5/100 with feedback');

    // Exams & Manual Results
    const examId = await Exam.create({
      course_id: courseId,
      title: 'QA Certification Examination',
      total_marks: 100,
      duration: 60,
      exam_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 19).replace('T', ' ')
    });
    assert(examId > 0, `Exam scheduled with ID: ${examId}`);

    await Exam.enterResult({
      exam_id: examId,
      user_id: studentId,
      course_id: courseId,
      marks_obtained: 98,
      grade: 'A+'
    });
    const examResult = await Exam.findResultByStudentAndExam(studentId, examId);
    assert(examResult && parseFloat(examResult.marks_obtained) === 98 && examResult.grade === 'A+', 'Exam result recorded and verified');

    // 10. Notifications & Audit Logs
    console.log('\n10. In-App Notifications & Audit Logs:');
    await Notification.createInApp(studentId, 'Test Notification for QA', 'course', 'normal');
    const unreadCount = await Notification.getUnreadCount(studentId);
    assert(unreadCount > 0, `Unread notifications count: ${unreadCount}`);

    await ActivityLog.logAction(studentId, 'QA_TEST_RUN', '127.0.0.1', { test: true });
    const logs = await ActivityLog.getRecentLogs(5);
    assert(logs.some(l => l.action === 'QA_TEST_RUN'), 'Audit log recorded action');

    // 11. Admin Metrics & Analytics KPIs
    console.log('\n11. Admin KPI Analytics:');
    const metrics = await Metric.getAdminSummary();
    assert(metrics.users.total_users > 0, `KPI Total Users: ${metrics.users.total_users}`);
    assert(metrics.revenue.completed_orders_count > 0, `KPI Completed Orders: ${metrics.revenue.completed_orders_count}`);
    assert(metrics.revenue.total_revenue > 0, `KPI Total Revenue: $${metrics.revenue.total_revenue.toFixed(2)}`);

    console.log('\n===============================================================');
    console.log(`  Test Execution Completed: ${passedTests} Passed, ${failedTests} Failed`);
    console.log('===============================================================');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n[FATAL ERROR during test execution]:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
