-- E-Learning Platform schema for XAMPP MySQL/MariaDB.
-- Run this file in phpMyAdmin, MySQL CLI, or any XAMPP SQL client.
--
-- This script intentionally does not insert fake/sample data.
-- Future seed data can be added in the marked section at the bottom using
-- INSERT ... ON DUPLICATE KEY UPDATE so the same script remains re-runnable.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS `e_learning_platform`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `e_learning_platform`;

CREATE TABLE IF NOT EXISTS `Roles` (
  `role_id` INT NOT NULL AUTO_INCREMENT,
  `role_name` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uk_roles_role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Permissions` (
  `permission_id` INT NOT NULL AUTO_INCREMENT,
  `permission_name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `uk_permissions_permission_name` (`permission_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Role_Permissions` (
  `role_permission_id` INT NOT NULL AUTO_INCREMENT,
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  PRIMARY KEY (`role_permission_id`),
  UNIQUE KEY `uk_role_permissions_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_permissions_permission_id` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role`
    FOREIGN KEY (`role_id`) REFERENCES `Roles` (`role_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_role_permissions_permission`
    FOREIGN KEY (`permission_id`) REFERENCES `Permissions` (`permission_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Users` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `phone` VARCHAR(20) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `status` ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role_id` (`role_id`),
  CONSTRAINT `fk_users_role`
    FOREIGN KEY (`role_id`) REFERENCES `Roles` (`role_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Instructor_Profile` (
  `instructor_id` INT NOT NULL,
  `bio` TEXT NULL,
  `expertise` VARCHAR(255) NULL,
  `experience_years` INT NULL,
  `rating` FLOAT NOT NULL DEFAULT 0,
  PRIMARY KEY (`instructor_id`),
  CONSTRAINT `chk_instructor_profile_experience_years`
    CHECK (`experience_years` IS NULL OR `experience_years` >= 0),
  CONSTRAINT `chk_instructor_profile_rating`
    CHECK (`rating` BETWEEN 0 AND 5),
  CONSTRAINT `fk_instructor_profile_user`
    FOREIGN KEY (`instructor_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Categories` (
  `category_id` INT NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uk_categories_category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Courses` (
  `course_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `instructor_id` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `duration` INT NULL,
  `level` ENUM('beginner','intermediate','advanced') NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `status` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  PRIMARY KEY (`course_id`),
  KEY `idx_courses_instructor_id` (`instructor_id`),
  CONSTRAINT `chk_courses_price`
    CHECK (`price` >= 0),
  CONSTRAINT `chk_courses_duration`
    CHECK (`duration` IS NULL OR `duration` >= 0),
  CONSTRAINT `fk_courses_instructor`
    FOREIGN KEY (`instructor_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Course_Category` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_course_category_course_category` (`course_id`, `category_id`),
  KEY `idx_course_category_category_id` (`category_id`),
  CONSTRAINT `fk_course_category_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_course_category_category`
    FOREIGN KEY (`category_id`) REFERENCES `Categories` (`category_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Lessons` (
  `lesson_id` INT NOT NULL AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `content_type` ENUM('video','document','quiz','other') NOT NULL,
  `content_url` VARCHAR(500) NOT NULL,
  `duration` INT NULL,
  `order_index` INT NOT NULL,
  PRIMARY KEY (`lesson_id`),
  UNIQUE KEY `uk_lessons_course_order` (`course_id`, `order_index`),
  KEY `idx_lessons_lesson_course` (`lesson_id`, `course_id`),
  CONSTRAINT `chk_lessons_duration`
    CHECK (`duration` IS NULL OR `duration` >= 0),
  CONSTRAINT `fk_lessons_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Cart` (
  `cart_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`),
  UNIQUE KEY `uk_cart_user_id` (`user_id`),
  CONSTRAINT `fk_cart_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Cart_Items` (
  `cart_item_id` INT NOT NULL AUTO_INCREMENT,
  `cart_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `added_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_item_id`),
  UNIQUE KEY `uk_cart_items_cart_course` (`cart_id`, `course_id`),
  KEY `idx_cart_items_course_id` (`course_id`),
  CONSTRAINT `fk_cart_items_cart`
    FOREIGN KEY (`cart_id`) REFERENCES `Cart` (`cart_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Wishlist` (
  `wishlist_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `added_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`wishlist_id`),
  UNIQUE KEY `uk_wishlist_user_course` (`user_id`, `course_id`),
  KEY `idx_wishlist_course_id` (`course_id`),
  CONSTRAINT `fk_wishlist_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_wishlist_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Coupons` (
  `coupon_id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `discount_type` ENUM('flat','percent') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `max_discount_amount` DECIMAL(10,2) NULL,
  `min_order_amount` DECIMAL(10,2) NULL DEFAULT 0,
  `valid_from` DATETIME NOT NULL,
  `valid_to` DATETIME NOT NULL,
  `usage_limit` INT NULL,
  `times_used` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`coupon_id`),
  UNIQUE KEY `uk_coupons_code` (`code`),
  CONSTRAINT `chk_coupons_discount_value`
    CHECK (`discount_value` > 0),
  CONSTRAINT `chk_coupons_max_discount_amount`
    CHECK (`max_discount_amount` IS NULL OR `max_discount_amount` >= 0),
  CONSTRAINT `chk_coupons_min_order_amount`
    CHECK (`min_order_amount` IS NULL OR `min_order_amount` >= 0),
  CONSTRAINT `chk_coupons_valid_dates`
    CHECK (`valid_to` > `valid_from`),
  CONSTRAINT `chk_coupons_usage_limit`
    CHECK (`usage_limit` IS NULL OR `usage_limit` >= 0),
  CONSTRAINT `chk_coupons_times_used`
    CHECK (`times_used` >= 0),
  CONSTRAINT `chk_coupons_percent_value`
    CHECK (`discount_type` <> 'percent' OR `discount_value` <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Orders` (
  `order_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `coupon_id` INT NULL,
  `subtotal_amount` DECIMAL(10,2) NOT NULL,
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_coupon_id` (`coupon_id`),
  CONSTRAINT `chk_orders_subtotal_amount`
    CHECK (`subtotal_amount` >= 0),
  CONSTRAINT `chk_orders_discount_amount`
    CHECK (`discount_amount` >= 0),
  CONSTRAINT `chk_orders_total_amount`
    CHECK (`total_amount` >= 0),
  CONSTRAINT `chk_orders_total_calculation`
    CHECK (`total_amount` = `subtotal_amount` - `discount_amount`),
  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_coupon`
    FOREIGN KEY (`coupon_id`) REFERENCES `Coupons` (`coupon_id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Order_Items` (
  `order_item_id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `price_at_purchase` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  UNIQUE KEY `uk_order_items_order_course` (`order_id`, `course_id`),
  KEY `idx_order_items_course_id` (`course_id`),
  CONSTRAINT `chk_order_items_price_at_purchase`
    CHECK (`price_at_purchase` >= 0),
  CONSTRAINT `fk_order_items_order`
    FOREIGN KEY (`order_id`) REFERENCES `Orders` (`order_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_order_items_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Payments` (
  `payment_id` INT NOT NULL AUTO_INCREMENT,
  `order_id` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` ENUM('card','paypal','stripe','other') NOT NULL,
  `status` ENUM('success','failed','pending') NOT NULL,
  `transaction_ref` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uk_payments_transaction_ref` (`transaction_ref`),
  KEY `idx_payments_order_id` (`order_id`),
  CONSTRAINT `chk_payments_amount`
    CHECK (`amount` >= 0),
  CONSTRAINT `fk_payments_order`
    FOREIGN KEY (`order_id`) REFERENCES `Orders` (`order_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Enrollments` (
  `enrollment_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `order_item_id` INT NULL,
  `enrollment_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completion_status` ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  `progress_percentage` FLOAT NOT NULL DEFAULT 0,
  PRIMARY KEY (`enrollment_id`),
  UNIQUE KEY `uk_enrollments_user_course` (`user_id`, `course_id`),
  UNIQUE KEY `uk_enrollments_order_item_id` (`order_item_id`),
  KEY `idx_enrollments_course_id` (`course_id`),
  CONSTRAINT `chk_enrollments_progress_percentage`
    CHECK (`progress_percentage` BETWEEN 0 AND 100),
  CONSTRAINT `fk_enrollments_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_enrollments_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_enrollments_order_item`
    FOREIGN KEY (`order_item_id`) REFERENCES `Order_Items` (`order_item_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Progress` (
  `progress_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `completed_lessons` INT NOT NULL DEFAULT 0,
  `total_lessons` INT NOT NULL,
  `last_accessed_lesson` INT NULL,
  `completion_percentage` FLOAT NULL,
  PRIMARY KEY (`progress_id`),
  UNIQUE KEY `uk_progress_user_course` (`user_id`, `course_id`),
  KEY `idx_progress_course_id` (`course_id`),
  KEY `idx_progress_last_accessed_lesson_course` (`last_accessed_lesson`, `course_id`),
  CONSTRAINT `chk_progress_completed_lessons`
    CHECK (`completed_lessons` >= 0),
  CONSTRAINT `chk_progress_total_lessons`
    CHECK (`total_lessons` >= 0),
  CONSTRAINT `chk_progress_lesson_counts`
    CHECK (`completed_lessons` <= `total_lessons`),
  CONSTRAINT `chk_progress_completion_percentage`
    CHECK (`completion_percentage` IS NULL OR `completion_percentage` BETWEEN 0 AND 100),
  CONSTRAINT `fk_progress_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_progress_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_progress_last_accessed_lesson`
    FOREIGN KEY (`last_accessed_lesson`, `course_id`) REFERENCES `Lessons` (`lesson_id`, `course_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Assignments` (
  `assignment_id` INT NOT NULL AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `max_marks` DECIMAL(6,2) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_assignments_course_id` (`course_id`),
  KEY `idx_assignments_assignment_course` (`assignment_id`, `course_id`),
  CONSTRAINT `chk_assignments_max_marks`
    CHECK (`max_marks` > 0),
  CONSTRAINT `fk_assignments_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Deadlines` (
  `deadline_id` INT NOT NULL AUTO_INCREMENT,
  `assignment_id` INT NOT NULL,
  `due_date` DATETIME NOT NULL,
  `late_submission_allowed` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`deadline_id`),
  UNIQUE KEY `uk_deadlines_assignment_id` (`assignment_id`),
  CONSTRAINT `fk_deadlines_assignment`
    FOREIGN KEY (`assignment_id`) REFERENCES `Assignments` (`assignment_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Submissions` (
  `submission_id` INT NOT NULL AUTO_INCREMENT,
  `assignment_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `file_url` VARCHAR(500) NOT NULL,
  `submission_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `marks_obtained` DECIMAL(6,2) NULL,
  `feedback` TEXT NULL,
  PRIMARY KEY (`submission_id`),
  UNIQUE KEY `uk_submissions_assignment_user` (`assignment_id`, `user_id`),
  KEY `idx_submissions_user_id` (`user_id`),
  KEY `idx_submissions_course_id` (`course_id`),
  KEY `idx_submissions_assignment_course` (`assignment_id`, `course_id`),
  CONSTRAINT `chk_submissions_marks_obtained`
    CHECK (`marks_obtained` IS NULL OR `marks_obtained` >= 0),
  CONSTRAINT `fk_submissions_assignment`
    FOREIGN KEY (`assignment_id`) REFERENCES `Assignments` (`assignment_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_submissions_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_submissions_assignment_course`
    FOREIGN KEY (`assignment_id`, `course_id`) REFERENCES `Assignments` (`assignment_id`, `course_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Exams` (
  `exam_id` INT NOT NULL AUTO_INCREMENT,
  `course_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `total_marks` DECIMAL(6,2) NOT NULL,
  `duration` INT NOT NULL,
  `exam_date` DATETIME NOT NULL,
  PRIMARY KEY (`exam_id`),
  KEY `idx_exams_course_id` (`course_id`),
  KEY `idx_exams_exam_course` (`exam_id`, `course_id`),
  CONSTRAINT `chk_exams_total_marks`
    CHECK (`total_marks` > 0),
  CONSTRAINT `chk_exams_duration`
    CHECK (`duration` > 0),
  CONSTRAINT `fk_exams_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Results` (
  `result_id` INT NOT NULL AUTO_INCREMENT,
  `exam_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `marks_obtained` DECIMAL(6,2) NOT NULL,
  `grade` VARCHAR(5) NULL,
  `result_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`result_id`),
  UNIQUE KEY `uk_results_exam_user` (`exam_id`, `user_id`),
  KEY `idx_results_user_id` (`user_id`),
  KEY `idx_results_course_id` (`course_id`),
  KEY `idx_results_exam_course` (`exam_id`, `course_id`),
  CONSTRAINT `chk_results_marks_obtained`
    CHECK (`marks_obtained` >= 0),
  CONSTRAINT `fk_results_exam`
    FOREIGN KEY (`exam_id`) REFERENCES `Exams` (`exam_id`)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_results_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_results_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_results_exam_course`
    FOREIGN KEY (`exam_id`, `course_id`) REFERENCES `Exams` (`exam_id`, `course_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Certificates` (
  `certificate_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `issue_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `certificate_url` VARCHAR(500) NOT NULL,
  PRIMARY KEY (`certificate_id`),
  UNIQUE KEY `uk_certificates_user_course` (`user_id`, `course_id`),
  UNIQUE KEY `uk_certificates_certificate_url` (`certificate_url`),
  KEY `idx_certificates_course_id` (`course_id`),
  CONSTRAINT `fk_certificates_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_certificates_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Reviews` (
  `review_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `uk_reviews_user_course` (`user_id`, `course_id`),
  KEY `idx_reviews_course_id` (`course_id`),
  CONSTRAINT `chk_reviews_rating`
    CHECK (`rating` BETWEEN 1 AND 5),
  CONSTRAINT `fk_reviews_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_reviews_course`
    FOREIGN KEY (`course_id`) REFERENCES `Courses` (`course_id`)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Notifications` (
  `notification_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('enrollment','payment','assignment','exam','certificate','system') NOT NULL,
  `channel` ENUM('in_app','email','sms') NOT NULL,
  `priority` ENUM('low','normal','high') NOT NULL DEFAULT 'normal',
  `status` ENUM('queued','sent','failed','read') NOT NULL DEFAULT 'queued',
  `retries_count` INT NOT NULL DEFAULT 0,
  `max_retries` INT NOT NULL DEFAULT 3,
  `error_reason` VARCHAR(255) NULL,
  `scheduled_at` DATETIME NULL,
  `sent_at` DATETIME NULL,
  `read_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_status_scheduled_at` (`status`, `scheduled_at`),
  CONSTRAINT `chk_notifications_retries_count`
    CHECK (`retries_count` >= 0),
  CONSTRAINT `chk_notifications_max_retries`
    CHECK (`max_retries` >= 0),
  CONSTRAINT `chk_notifications_retry_bounds`
    CHECK (`retries_count` <= `max_retries`),
  CONSTRAINT `fk_notifications_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Activity_Log` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `action` VARCHAR(150) NOT NULL,
  `event_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) NULL,
  `metadata_json` JSON NULL,
  PRIMARY KEY (`log_id`),
  KEY `idx_activity_log_user_id` (`user_id`),
  KEY `idx_activity_log_event_time` (`event_time`),
  CONSTRAINT `fk_activity_log_user`
    FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Future seed-data section
-- ---------------------------------------------------------------------------
-- Keep this section empty for now, as requested.
--
-- When you want to seed real data later, add statements here in parent-before-
-- child order. Prefer INSERT ... ON DUPLICATE KEY UPDATE so repeated runs update
-- existing rows instead of creating duplicates or failing on unique keys.
--
-- Example pattern only; leave commented until you are ready:
--
-- INSERT INTO `Roles` (`role_name`) VALUES ('Admin')
-- ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);
