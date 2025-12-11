# Testing Master Data Absensi

Panduan testing untuk endpoint master data absensi (office settings & shift settings).

## 📋 Prerequisites

1. Server running: `npm run dev`
2. Login sebagai admin untuk mendapatkan token
3. Siapkan tool testing: Postman, Thunder Client, atau cURL

## 🔑 Login Admin

Dapatkan accessToken terlebih dahulu:

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@test.com",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**💡 Copy `accessToken` untuk digunakan di request berikutnya!**

---

## 🏢 1. Update Office Settings

Update lokasi kantor (latitude, longitude, radius) untuk user tertentu.

### Request

```http
PUT http://localhost:3001/api/users/1/office-settings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "office_lat": -6.200000,
  "office_lon": 106.816666,
  "office_radius": 100
}
```

### cURL

```bash
curl -X PUT http://localhost:3001/api/users/1/office-settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "office_lat": -6.200000,
    "office_lon": 106.816666,
    "office_radius": 100
  }'
```

### Expected Response (200 OK)

```json
{
  "success": true,
  "message": "Pengaturan lokasi kantor berhasil diupdate",
  "data": {
    "id": 1,
    "office_lat": -6.200000,
    "office_lon": 106.816666,
    "office_radius": 100
  }
}
```

### Test Cases

#### ✅ Success Case
- User ID exists
- All fields provided (office_lat, office_lon, office_radius)
- Valid coordinates (-90 to 90 for lat, -180 to 180 for lon)
- Radius > 0

#### ❌ Error Cases

**1. User not found (404)**
```http
PUT http://localhost:3001/api/users/999/office-settings
```
Response:
```json
{
  "success": false,
  "message": "User tidak ditemukan"
}
```

**2. Missing fields (400)**
```json
{
  "office_lat": -6.200000
  // Missing office_lon and office_radius
}
```
Response:
```json
{
  "success": false,
  "message": "Semua field (office_lat, office_lon, office_radius) harus diisi"
}
```

**3. Unauthorized (401)**
```http
PUT http://localhost:3001/api/users/1/office-settings
# No Authorization header
```

**4. Forbidden - Not Admin (403)**
```http
PUT http://localhost:3001/api/users/1/office-settings
Authorization: Bearer <karyawan_token>
```

---

## ⏰ 2. Update Shift Settings

Update jam kerja (shift_start, shift_end) untuk user tertentu.

### Request

```http
PUT http://localhost:3001/api/users/1/shift-settings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "shift_start": "08:00",
  "shift_end": "17:00"
}
```

### cURL

```bash
curl -X PUT http://localhost:3001/api/users/1/shift-settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shift_start": "08:00",
    "shift_end": "17:00"
  }'
```

### Expected Response (200 OK)

```json
{
  "success": true,
  "message": "Pengaturan jam kerja berhasil diupdate",
  "data": {
    "id": 1,
    "shift_start": "08:00:00",
    "shift_end": "17:00:00"
  }
}
```

### Test Cases

#### ✅ Success Case
- User ID exists
- Both fields provided (shift_start, shift_end)
- Valid time format: HH:mm or HH:mm:ss

#### ❌ Error Cases

**1. User not found (404)**
```http
PUT http://localhost:3001/api/users/999/shift-settings
```

**2. Missing fields (400)**
```json
{
  "shift_start": "08:00"
  // Missing shift_end
}
```
Response:
```json
{
  "success": false,
  "message": "Kedua field (shift_start, shift_end) harus diisi"
}
```

**3. Invalid time format (400)**
```json
{
  "shift_start": "25:00",  // Invalid hour
  "shift_end": "17:00"
}
```

---

## 🧪 Complete Testing Scenario

### Scenario: Setup Karyawan Baru dengan Master Data

**Step 1: Login sebagai admin**
```http
POST /api/auth/login
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

**Step 2: Buat user baru**
```http
POST /api/users
Authorization: Bearer <admin_token>

{
  "name": "Budi Santoso",
  "email": "budi.santoso@company.com",
  "password": "password123",
  "role": "karyawan"
}
```
→ Get user ID dari response (misal: id = 5)

**Step 3: Set office settings untuk user baru**
```http
PUT /api/users/5/office-settings
Authorization: Bearer <admin_token>

{
  "office_lat": -6.175110,
  "office_lon": 106.865036,
  "office_radius": 150
}
```

**Step 4: Set shift settings untuk user baru**
```http
PUT /api/users/5/shift-settings
Authorization: Bearer <admin_token>

{
  "shift_start": "09:00",
  "shift_end": "18:00"
}
```

**Step 5: Verify - Get user details**
```http
GET /api/users/5
Authorization: Bearer <admin_token>
```

Expected response should include:
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Budi Santoso",
    "email": "budi.santoso@company.com",
    "role": "karyawan",
    "office_lat": -6.175110,
    "office_lon": 106.865036,
    "office_radius": 150,
    "shift_start": "09:00:00",
    "shift_end": "18:00:00"
  }
}
```

---

## 📊 Swagger Documentation

Buka dokumentasi interaktif di browser:

```
http://localhost:3001/api-docs
```

Cari section **"User Management"** → endpoints:
- `PUT /api/users/{id}/office-settings`
- `PUT /api/users/{id}/shift-settings`

Klik **"Try it out"** untuk testing langsung dari browser.

---

## 🔍 Database Verification

Setelah update master data, verifikasi di database:

```sql
-- Connect to PostgreSQL
psql -U postgres -d absensi_db

-- Check office settings
SELECT id, name, email, office_lat, office_lon, office_radius 
FROM users 
WHERE id = 1;

-- Check shift settings
SELECT id, name, email, shift_start, shift_end 
FROM users 
WHERE id = 1;

-- Check all master data for a user
SELECT id, name, email, role, 
       office_lat, office_lon, office_radius,
       shift_start, shift_end
FROM users 
WHERE id = 1;
```

---

## ✅ Checklist Testing

- [ ] Login sebagai admin berhasil
- [ ] Update office settings user berhasil
- [ ] Update shift settings user berhasil
- [ ] Verify data di database sesuai
- [ ] Test error: user not found (404)
- [ ] Test error: missing fields (400)
- [ ] Test error: unauthorized (401)
- [ ] Test error: forbidden - bukan admin (403)
- [ ] Swagger documentation tampil dengan benar
- [ ] Try it out di Swagger berfungsi

---

## 🎯 Expected Behavior

### Office Settings
- Latitude: -90 to 90
- Longitude: -180 to 180
- Radius: integer (in meters)
- Digunakan untuk validasi lokasi saat check-in/check-out

### Shift Settings
- Format: HH:mm atau HH:mm:ss
- Digunakan untuk validasi keterlambatan
- shift_end harus lebih besar dari shift_start

---

## 🚨 Common Issues

### 1. "User tidak ditemukan"
- **Cause**: User ID tidak ada di database
- **Solution**: Check ID user dengan `GET /api/users`

### 2. "Token tidak valid"
- **Cause**: Token expired atau salah
- **Solution**: Login ulang untuk mendapat token baru

### 3. "Anda tidak memiliki akses ke endpoint ini"
- **Cause**: Login sebagai karyawan/HRD (bukan admin)
- **Solution**: Login dengan akun admin

### 4. "Semua field harus diisi"
- **Cause**: Request body tidak lengkap
- **Solution**: Pastikan semua field required ada di body

---

## 📚 Related Documentation

- [API Documentation](./README.md)
- [Swagger UI](http://localhost:3001/api-docs)
- [Database Schema](./database.sql)
