# 📮 Panduan Lengkap Testing API dengan Postman

## 🔐 Authentication Flow

### 1️⃣ LOGIN

**Endpoint:** `POST http://localhost:3001/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@test.com",
      "role": "admin",
      "phone": "081234567890",
      "address": "Jakarta",
      "officeLat": -6.2,
      "officeLon": 106.816666,
      "officeRadius": 100,
      "shiftStart": "08:00",
      "shiftEnd": "17:00",
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJuYW1lIjoiQWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDIyOTU4MjAsImV4cCI6MTcwMjI5OTQyMH0.abc123...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJuYW1lIjoiQWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDIyOTU4MjAsImV4cCI6MTcwMjkwMDYyMH0.xyz789..."
  }
}
```

**💡 PENTING:** 
- Copy `accessToken` untuk request selanjutnya
- Copy `refreshToken` untuk logout atau refresh token

---

### 2️⃣ LOGOUT

**Endpoint:** `POST http://localhost:3001/api/auth/logout`

**Headers:**
```
Content-Type: application/json
```

**⚠️ PENTING:** Logout **TIDAK** perlu Authorization header!

**Body (raw - JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Logout berhasil",
  "data": null
}
```

**📝 Catatan:**
- `refreshToken` wajib diisi (dari response login)
- **TIDAK** perlu Authorization header di logout
- Logout bisa dilakukan meskipun accessToken sudah expired
- Setelah logout, refreshToken akan dihapus dari server

---

### 3️⃣ REFRESH TOKEN

**Endpoint:** `POST http://localhost:3001/api/auth/refresh`

**Headers:**
```
Content-Type: application/json
```

**Body (raw - JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Token berhasil diperbarui",
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token..."
  }
}
```

**📝 Catatan:**
- Gunakan ketika `accessToken` sudah expired
- Akan mendapat token baru

---

### 4️⃣ GET PROFILE

**Endpoint:** `GET http://localhost:3001/api/auth/profile`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**No Body Required**

**Response Success:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Admin",
    "email": "admin@test.com",
    "role": "admin",
    "phone": "081234567890",
    "address": "Jakarta",
    "officeLat": -6.2,
    "officeLon": 106.816666,
    "officeRadius": 100,
    "shiftStart": "08:00",
    "shiftEnd": "17:00",
    "isActive": true
  }
}
```

---

### 5️⃣ UPDATE PROFILE

**Endpoint:** `PUT http://localhost:3001/api/auth/profile`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Body (raw - JSON):**
```json
{
  "name": "Admin Updated",
  "phone": "081234567899",
  "address": "Jakarta Selatan"
}
```

---

### 6️⃣ CHANGE PASSWORD

**Endpoint:** `PUT http://localhost:3001/api/auth/change-password`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Body (raw - JSON):**
```json
{
  "oldPassword": "admin123",
  "newPassword": "newpassword123"
}
```

---

## 📍 Absensi Endpoints

### 7️⃣ ABSEN MASUK (Check-In)

**Endpoint:** `POST http://localhost:3001/api/absen/check-in`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Body (form-data):**
```
latitude: -6.200000
longitude: 106.816666
accuracy: 20
photo: [Select File - JPG/PNG]
```

**Di Postman:**
1. Pilih tab **Body**
2. Pilih **form-data**
3. Tambahkan fields:
   - `latitude` (text): -6.200000
   - `longitude` (text): 106.816666
   - `accuracy` (text): 20
   - `photo` (file): Pilih gambar selfie

**Response Success:**
```json
{
  "success": true,
  "message": "Absen masuk berhasil",
  "data": {
    "attendanceId": 1,
    "checkInTime": "2025-12-11T07:58:30.000Z",
    "status": "On Time",
    "distance": "45.5m",
    "lateMinutes": 0,
    "photo": "1_1702287510123-selfie.jpg"
  }
}
```

---

### 8️⃣ ABSEN PULANG (Check-Out)

**Endpoint:** `POST http://localhost:3001/api/absen/check-out`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Body (form-data):**
```
latitude: -6.200000
longitude: 106.816666
accuracy: 25
photo: [Select File - JPG/PNG]
```

**Response Success:**
```json
{
  "success": true,
  "message": "Absen pulang berhasil",
  "data": {
    "attendanceId": 1,
    "checkInTime": "2025-12-11T07:58:30.000Z",
    "checkOutTime": "2025-12-11T17:05:00.000Z",
    "duration": "9 jam 6 menit",
    "status": "On Time",
    "earlyMinutes": 0,
    "photo": "1_1702320300456-checkout.jpg"
  }
}
```

---

### 9️⃣ GET ABSENSI HARI INI

**Endpoint:** `GET http://localhost:3001/api/absen/today`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response Success:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "hasCheckedIn": true,
    "hasCheckedOut": true,
    "attendance": {
      "id": 1,
      "checkInTime": "2025-12-11T07:58:30.000Z",
      "checkOutTime": "2025-12-11T17:05:00.000Z",
      "status": "On Time",
      "duration": 546
    }
  }
}
```

---

### 🔟 GET RIWAYAT ABSENSI

**Endpoint:** `GET http://localhost:3001/api/absen/my-attendance?limit=10`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters (Optional):**
- `startDate`: 2025-12-01
- `endDate`: 2025-12-31
- `limit`: 30 (default)

**Response Success:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "total": 5,
    "attendance": [...]
  }
}
```

---

## 👥 User Management (Admin Only)

### 1️⃣1️⃣ GET ALL USERS

**Endpoint:** `GET http://localhost:3001/api/users`

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters (Optional):**
- `role`: admin | hrd | karyawan
- `isActive`: true | false
- `search`: nama atau email
- `limit`: 50 (default)

---

### 1️⃣2️⃣ CREATE USER

**Endpoint:** `POST http://localhost:3001/api/users`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Body (raw - JSON):**
```json
{
  "name": "Karyawan Baru",
  "email": "karyawan@test.com",
  "password": "password123",
  "role": "karyawan",
  "phone": "081234567890",
  "address": "Jakarta",
  "shiftStart": "08:00",
  "shiftEnd": "17:00"
}
```

---

## 🎯 Tips Menggunakan Postman

### 1. Setup Environment Variables

Buat environment di Postman:
- `baseUrl`: http://localhost:3001
- `accessToken`: (kosong, akan diisi otomatis)
- `refreshToken`: (kosong, akan diisi otomatis)

### 2. Auto Save Token

Di tab **Tests** pada request Login, tambahkan:
```javascript
const response = pm.response.json();

if (response.success) {
    pm.environment.set("accessToken", response.data.accessToken);
    pm.environment.set("refreshToken", response.data.refreshToken);
}
```

### 3. Gunakan Variable

Di request lain, gunakan:
- URL: `{{baseUrl}}/api/auth/profile`
- Header: `Bearer {{accessToken}}`

### 4. Create Collection

Buat collection dengan folder:
- 📁 Authentication
  - Login
  - Logout
  - Refresh Token
  - Get Profile
  - Change Password
- 📁 Absensi
  - Check In
  - Check Out
  - Get Today
  - My Attendance
- 📁 User Management
  - Get All Users
  - Create User
  - Update User
  - Delete User

---

## 🧪 Testing Scenarios

### Scenario 1: Login Flow
1. Login → Dapat token
2. Get Profile → Cek data user
3. Update Profile → Update data
4. Logout → Hapus token

### Scenario 2: Absensi Flow
1. Login
2. Get Today → Cek sudah absen atau belum
3. Check In → Absen masuk
4. Check Out → Absen pulang
5. My Attendance → Lihat riwayat

### Scenario 3: Admin Flow
1. Login as Admin
2. Get All Users → Lihat semua user
3. Create User → Tambah karyawan baru
4. Reset Password → Reset password user

---

## ⚠️ Common Errors

### Error 401 Unauthorized
```json
{
  "success": false,
  "message": "Token tidak ditemukan"
}
```
**Solusi:** Tambahkan header `Authorization: Bearer <token>`

### Error 403 Forbidden
```json
{
  "success": false,
  "message": "Akses ditolak. Role karyawan tidak memiliki izin."
}
```
**Solusi:** Login dengan akun yang memiliki role sesuai (admin/hrd)

### Error 422 Validation Error
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "field": "latitude",
      "message": "Latitude wajib diisi"
    }
  ]
}
```
**Solusi:** Lengkapi field yang wajib diisi

---

## 📝 Akun Test

| Email | Password | Role |
|-------|----------|------|
| admin@test.com | admin123 | admin |
| hrd@test.com | admin123 | hrd |
| budi@test.com | admin123 | karyawan |
