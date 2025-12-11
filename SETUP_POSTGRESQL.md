# 🚀 Quick Start Guide - PostgreSQL

## 1️⃣ Install PostgreSQL

### macOS:
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows:
- Download installer dari https://www.postgresql.org/download/windows/

## 2️⃣ Setup Database

```bash
# Buat database
createdb -U postgres absensi_db

# Import schema
psql -U postgres -d absensi_db -f database.sql
```

Atau manual via psql:
```bash
psql -U postgres

# Di dalam psql console:
CREATE DATABASE absensi_db;
\c absensi_db
\i database.sql
```

## 3️⃣ Konfigurasi .env

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here  # Isi password PostgreSQL
DB_NAME=absensi_db
```

## 4️⃣ Test Koneksi

```bash
npm run dev
```

Jika berhasil, akan muncul:
```
✅ Connected to PostgreSQL database
🚀 Server berjalan di http://localhost:3001
```

**⚠️ Catatan:** Port 5000 sering dipakai oleh AirPlay/AirTunes di macOS. Jika ada error 403 Forbidden, gunakan port lain (3001, 3000, 8000, dll).

## 5️⃣ Test Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

Atau gunakan script test:
```bash
chmod +x test-login.sh
./test-login.sh
```

## 🎯 Default Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@test.com | admin123 | admin |
| hrd@test.com | admin123 | hrd |
| budi@test.com | admin123 | karyawan |
| siti@test.com | admin123 | karyawan |

## 🔍 Useful Commands

```bash
# Cek database
psql -U postgres -l

# Connect ke database
psql -U postgres -d absensi_db

# Lihat tabel
\dt

# Lihat user
SELECT id, name, email, role FROM users;

# Lihat attendance
SELECT * FROM attendance;

# Backup database
pg_dump -U postgres absensi_db > backup.sql

# Restore database
psql -U postgres absensi_db < backup.sql
```

## ⚠️ Troubleshooting

### Error: "password authentication failed"
```bash
# Ubah password postgres
sudo -u postgres psql
ALTER USER postgres PASSWORD 'newpassword';
```

### Error: "connection refused"
```bash
# Start PostgreSQL
# macOS
brew services start postgresql@16

# Linux
sudo systemctl start postgresql
```

### Error: "database does not exist"
```bash
createdb -U postgres absensi_db
```
