-- ================================================
-- Database Schema untuk Sistem Absensi Karyawan
-- PostgreSQL Version
-- ================================================

-- Hapus tabel jika sudah ada (optional - hati-hati di production)
-- DROP TABLE IF EXISTS refresh_tokens CASCADE;
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ================================================
-- Tabel: users
-- ================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'karyawan' CHECK (role IN ('admin', 'hrd', 'karyawan')),
  phone VARCHAR(20),
  address TEXT,
  office_lat DECIMAL(10, 8),
  office_lon DECIMAL(11, 8),
  office_radius INTEGER DEFAULT 100,
  shift_start TIME DEFAULT '08:00:00',
  shift_end TIME DEFAULT '17:00:00',
  photo VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performa
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ================================================
-- Tabel: attendance
-- ================================================
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  check_in_time TIMESTAMP NOT NULL,
  check_in_lat DECIMAL(10, 8),
  check_in_lon DECIMAL(11, 8),
  check_in_photo VARCHAR(255),
  check_in_accuracy FLOAT,
  check_out_time TIMESTAMP,
  check_out_lat DECIMAL(10, 8),
  check_out_lon DECIMAL(11, 8),
  check_out_photo VARCHAR(255),
  check_out_accuracy FLOAT,
  distance FLOAT,
  duration INTEGER,
  status VARCHAR(50),
  device_info TEXT,
  late_minutes INTEGER DEFAULT 0,
  early_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index untuk performa
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_check_in_time ON attendance(check_in_time);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_attendance_date ON attendance(DATE(check_in_time));

-- ================================================
-- Tabel: refresh_tokens
-- ================================================
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index untuk performa
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ================================================
-- Function: Auto update updated_at
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto update updated_at di tabel users
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- Insert Data Admin Default
-- ================================================
INSERT INTO users (name, email, password, role, office_lat, office_lon, office_radius, shift_start, shift_end) 
VALUES (
  'Admin', 
  'admin@test.com', 
  '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', -- password: admin123
  'admin',
  -6.200000,
  106.816666,
  100,
  '08:00:00',
  '17:00:00'
);

-- ================================================
-- Sample Data (Optional - untuk testing)
-- ================================================

-- Insert sample karyawan
INSERT INTO users (name, email, password, role, phone, address, office_lat, office_lon, shift_start, shift_end) 
VALUES 
  ('Budi Santoso', 'budi@test.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'karyawan', '081234567890', 'Jakarta', -6.200000, 106.816666, '08:00:00', '17:00:00'),
  ('Siti Nurhaliza', 'siti@test.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'karyawan', '081234567891', 'Bandung', -6.200000, 106.816666, '08:00:00', '17:00:00'),
  ('HRD Manager', 'hrd@test.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'hrd', '081234567892', 'Jakarta', -6.200000, 106.816666, '08:00:00', '17:00:00');

-- ================================================
-- Useful Queries
-- ================================================

-- Lihat semua user
-- SELECT id, name, email, role, is_active FROM users;

-- Lihat absensi hari ini
-- SELECT u.name, a.check_in_time, a.check_out_time, a.status, a.duration
-- FROM attendance a
-- JOIN users u ON a.user_id = u.id
-- WHERE DATE(a.check_in_time) = CURRENT_DATE;

-- Lihat user yang terlambat hari ini
-- SELECT u.name, a.check_in_time, a.late_minutes, a.status
-- FROM attendance a
-- JOIN users u ON a.user_id = u.id
-- WHERE DATE(a.check_in_time) = CURRENT_DATE AND a.late_minutes > 0;

-- Cleanup refresh tokens yang sudah expired
-- DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
