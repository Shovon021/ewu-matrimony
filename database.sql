-- =====================================================
-- EWU Matrimony Database Schema
-- Version: 1.0
-- Run this in phpMyAdmin SQL tab or MySQL command line
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS ewu_matrimony;
USE ewu_matrimony;

-- =====================================================
-- TABLE 1: users (Core Registration Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    dob DATE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    religion VARCHAR(30) NOT NULL,
    status ENUM('undergraduate', 'graduate', 'alumni') NOT NULL,
    batch_year VARCHAR(10) NOT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    id_card_image VARCHAR(255) DEFAULT NULL, /* Added field */
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_verification (verification_status),
    INDEX idx_gender (gender)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLE 2: profiles (Extended Biodata Information)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT(6) UNSIGNED NOT NULL UNIQUE,
    
    -- Basic Info
    photo VARCHAR(255) DEFAULT NULL,
    about_me TEXT,
    height VARCHAR(20),
    weight VARCHAR(20),
    blood_group VARCHAR(10),
    skin_tone ENUM('fair', 'light brown', 'brown', 'dark') DEFAULT NULL,
    marital_status VARCHAR(30),
    
    -- Education & Career
    education VARCHAR(100),
    occupation VARCHAR(100),
    company VARCHAR(100),
    income VARCHAR(50),
    
    -- Address
    present_address TEXT,
    permanent_address TEXT,
    
    -- Family Info
    father_name VARCHAR(100),
    father_occupation VARCHAR(100), /* Match save.php */
    mother_name VARCHAR(100),
    mother_occupation VARCHAR(100), /* Match save.php */
    siblings INT DEFAULT 0, /* Match save.php integer */
    family_type VARCHAR(30),
    family_status ENUM('lower class', 'lower middle class', 'middle class', 'upper middle class', 'rich') DEFAULT NULL, /* Match save.php */
    
    -- Partner Preferences
    partner_min_age INT,
    partner_max_age INT,
    partner_min_height VARCHAR(30),
    partner_religion VARCHAR(50), /* Added partner_religion */
    partner_education VARCHAR(100), /* Match save.php */
    partner_occupation VARCHAR(100), /* Match save.php */
    preferred_location VARCHAR(100),
    expectations TEXT,
    
    -- Status
    biodata_status ENUM('draft', 'pending', 'verified', 'rejected') DEFAULT 'pending',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_biodata_status (biodata_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLE 3: interests (Who Liked Who - for Matching)
-- =====================================================
CREATE TABLE IF NOT EXISTS interests (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT(6) UNSIGNED NOT NULL,
    to_user_id INT(6) UNSIGNED NOT NULL,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_interest (from_user_id, to_user_id),
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLE 4: messages (Chat between Matched Users)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT(6) UNSIGNED NOT NULL,
    to_user_id INT(6) UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (from_user_id, to_user_id),
    INDEX idx_unread (to_user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLE 5: favorites (User Shortlist)
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT(6) UNSIGNED NOT NULL,
    favorite_id INT(6) UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_favorite (user_id, favorite_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (favorite_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLE 6: contact_shares (Contact Info Sharing)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_shares (
    id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT(6) UNSIGNED NOT NULL,
    to_user_id INT(6) UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_share (from_user_id, to_user_id),
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- OPTIONAL: Sample Admin User (uncomment to use)
-- =====================================================
-- INSERT INTO users (student_id, first_name, last_name, email, password, gender, dob, phone, religion, status, batch_year, verification_status)
-- VALUES ('admin001', 'Admin', 'User', 'admin@ewu.edu', '$2y$10$...', 'male', '1990-01-01', '01700000000', 'Islam', 'alumni', '2010', 'verified');

-- =====================================================
-- Done! Database ready to use.
-- =====================================================

