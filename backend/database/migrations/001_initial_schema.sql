CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'CUSTOMER', 'UMKM') NOT NULL,
  status ENUM('ACTIVE', 'PENDING', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS umkm_profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  business_name VARCHAR(160) NOT NULL,
  owner_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address VARCHAR(500) NOT NULL,
  business_type VARCHAR(100) NULL,
  storefront_photo_url VARCHAR(1000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_umkm_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS umkm_submissions (
  id CHAR(36) PRIMARY KEY,
  umkm_profile_id CHAR(36) NOT NULL UNIQUE,
  status ENUM('DRAFT', 'PENDING', 'REVISION', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'DRAFT',
  admin_note TEXT NULL,
  submitted_at TIMESTAMP NULL,
  reviewed_at TIMESTAMP NULL,
  reviewed_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_submissions_status_submitted (status, submitted_at),
  CONSTRAINT fk_submissions_profile FOREIGN KEY (umkm_profile_id) REFERENCES umkm_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_submissions_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS warungs (
  id CHAR(36) PRIMARY KEY,
  umkm_profile_id CHAR(36) NOT NULL UNIQUE,
  category_id CHAR(36) NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  description TEXT NULL,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(30) NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  price_min INT UNSIGNED NULL,
  price_max INT UNSIGNED NULL,
  status_override ENUM('AUTO', 'OPEN', 'CLOSED') NOT NULL DEFAULT 'AUTO',
  approval_status ENUM('PENDING', 'APPROVED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_warungs_discovery (approval_status, is_active, category_id),
  INDEX idx_warungs_price (price_min, price_max),
  CONSTRAINT fk_warungs_profile FOREIGN KEY (umkm_profile_id) REFERENCES umkm_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_warungs_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT chk_warung_price CHECK (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id CHAR(36) PRIMARY KEY,
  warung_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(1000) NULL,
  price INT UNSIGNED NOT NULL,
  photo_url VARCHAR(1000) NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_menu_warung_active (warung_id, is_active, is_available),
  INDEX idx_menu_name (name),
  CONSTRAINT fk_menu_warung FOREIGN KEY (warung_id) REFERENCES warungs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS operating_hours (
  warung_id CHAR(36) NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL,
  open_time TIME NULL,
  close_time TIME NULL,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (warung_id, day_of_week),
  CONSTRAINT fk_hours_warung FOREIGN KEY (warung_id) REFERENCES warungs(id) ON DELETE CASCADE,
  CONSTRAINT chk_day_of_week CHECK (day_of_week BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS facilities (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS warung_facilities (
  warung_id CHAR(36) NOT NULL,
  facility_id CHAR(36) NOT NULL,
  PRIMARY KEY (warung_id, facility_id),
  CONSTRAINT fk_wf_warung FOREIGN KEY (warung_id) REFERENCES warungs(id) ON DELETE CASCADE,
  CONSTRAINT fk_wf_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_methods (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS warung_payment_methods (
  warung_id CHAR(36) NOT NULL,
  payment_method_id CHAR(36) NOT NULL,
  PRIMARY KEY (warung_id, payment_method_id),
  CONSTRAINT fk_wpm_warung FOREIGN KEY (warung_id) REFERENCES warungs(id) ON DELETE CASCADE,
  CONSTRAINT fk_wpm_payment FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS photos (
  id CHAR(36) PRIMARY KEY,
  warung_id CHAR(36) NOT NULL,
  menu_item_id CHAR(36) NULL,
  url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(255) NULL,
  type ENUM('STOREFRONT', 'VENUE', 'MENU') NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_photos_warung (warung_id, type, sort_order),
  CONSTRAINT fk_photos_warung FOREIGN KEY (warung_id) REFERENCES warungs(id) ON DELETE CASCADE,
  CONSTRAINT fk_photos_menu FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favorites (
  user_id CHAR(36) NOT NULL,
  warung_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, warung_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_warung FOREIGN KEY (warung_id) REFERENCES warungs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  warung_id CHAR(36) NOT NULL,
  taste_rating TINYINT UNSIGNED NOT NULL,
  price_rating TINYINT UNSIGNED NOT NULL,
  portion_rating TINYINT UNSIGNED NOT NULL,
  cleanliness_rating TINYINT UNSIGNED NOT NULL,
  comfort_rating TINYINT UNSIGNED NOT NULL,
  speed_rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NULL,
  status ENUM('VISIBLE', 'HIDDEN') NOT NULL DEFAULT 'VISIBLE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review_user_warung (user_id, warung_id),
  INDEX idx_reviews_warung_status (warung_id, status, created_at),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_warung FOREIGN KEY (warung_id) REFERENCES warungs(id) ON DELETE CASCADE,
  CONSTRAINT chk_review_ratings CHECK (
    taste_rating BETWEEN 1 AND 5 AND price_rating BETWEEN 1 AND 5 AND portion_rating BETWEEN 1 AND 5
    AND cleanliness_rating BETWEEN 1 AND 5 AND comfort_rating BETWEEN 1 AND 5 AND speed_rating BETWEEN 1 AND 5
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_replies (
  review_id CHAR(36) PRIMARY KEY,
  warung_id CHAR(36) NOT NULL,
  reply_text VARCHAR(1500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_review_replies_warung (warung_id, updated_at),
  CONSTRAINT fk_review_replies_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_replies_warung FOREIGN KEY (warung_id) REFERENCES warungs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS warung_profile_views (
  id CHAR(36) PRIMARY KEY,
  warung_id CHAR(36) NOT NULL,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_profile_views_warung_date (warung_id, viewed_at),
  CONSTRAINT fk_profile_views_warung FOREIGN KEY (warung_id) REFERENCES warungs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reports (
  id CHAR(36) PRIMARY KEY,
  reporter_id CHAR(36) NOT NULL,
  target_type ENUM('REVIEW', 'WARUNG', 'INFORMATION') NOT NULL,
  target_id CHAR(36) NOT NULL,
  reason VARCHAR(160) NOT NULL,
  detail TEXT NULL,
  status ENUM('OPEN', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
  admin_note TEXT NULL,
  reviewed_by CHAR(36) NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reports_status_created (status, created_at),
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reports_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  user_agent VARCHAR(500) NULL,
  ip_address VARCHAR(64) NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refresh_user_active (user_id, revoked_at, expires_at),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  admin_id CHAR(36) NOT NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_entity (entity_type, entity_id),
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
