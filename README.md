# API Absensi Karyawan

Backend API untuk sistem absensi karyawan dengan fitur GPS tracking, upload foto selfie, dan manajemen user.

## 🚀 Teknologi

- **Node.js** + **Express.js**
- **JWT** untuk autentikasi
- **Multer** untuk upload file
- **Bcrypt** untuk hash password
- **Haversine Formula** untuk validasi lokasi GPS

## 📁 Struktur Folder

```
abs-be/
├── src/
│   ├── app.js                  # Entry point aplikasi
│   ├── routes/
│   │   ├── absen.js           # Routes absensi
│   │   ├── auth.js            # Routes authentication
│   │   └── user.js            # Routes user management
│   ├── controllers/
│   │   ├── absenController.js # Logic absensi
│   │   ├── authController.js  # Logic auth
│   │   └── userController.js  # Logic user management
│   ├── middlewares/
│   │   ├── auth.js            # JWT verification
│   │   ├── upload.js          # Multer configuration
│   │   └── validator.js       # Input validation
│   ├── utils/
│   │   ├── haversine.js       # GPS distance calculation
│   │   ├── response.js        # Response helper
│   │   └── timeValidator.js   # Time validation
│   └── uploads/               # Folder penyimpanan foto
├── .env                        # Environment variables
├── .env.example               # Template environment
├── .gitignore
└── package.json
```

## ⚙️ Instalasi

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy file `.env.example` ke `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

Edit file `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=absensi_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Office Location
OFFICE_LATITUDE=-6.200000
OFFICE_LONGITUDE=106.816666
OFFICE_RADIUS=100

# GPS Validation
MAX_GPS_ACCURACY=50

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./src/uploads

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Setup Database

**Database:** Aplikasi ini menggunakan **PostgreSQL**.

#### Install PostgreSQL:

**Windows:**
- Download dari [postgresql.org](https://www.postgresql.org/download/windows/)

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Buat Database:

```bash
# Akses PostgreSQL
psql -U postgres

# Atau jika menggunakan user lain
# psql -U your_username
```

Di dalam psql console:
```sql
-- Buat database
CREATE DATABASE absensi_db;

-- Keluar dari psql
\q
```

#### Import Schema:

```bash
# Import schema ke database
psql -U postgres -d absensi_db -f database.sql
```

File `database.sql` sudah berisi:
- ✅ Tabel users, attendance, refresh_tokens
- ✅ Index untuk performa
- ✅ Trigger auto update updated_at
- ✅ Data admin default (email: admin@test.com, password: admin123)
- ✅ Sample data karyawan untuk testing

#### Verifikasi Database:

```bash
# Cek koneksi
psql -U postgres -d absensi_db

# Di dalam psql:
\dt              # Lihat semua tabel
\d users         # Lihat struktur tabel users
SELECT * FROM users;  # Lihat data user
```

### 4. Jalankan Server

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server akan berjalan di: `http://localhost:3001`

**⚠️ Catatan:** Port default adalah 3001 karena port 5000 sering digunakan oleh AirPlay/AirTunes di macOS. Jika ingin mengubah port, edit file `.env`.

### 5. Akses API Documentation

Buka browser dan akses:
```
http://localhost:3001/api-docs
```

Swagger UI akan menampilkan semua endpoint API dengan dokumentasi lengkap, contoh request/response, dan fitur "Try it out" untuk test API langsung dari browser!

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Deskripsi | Access |
|--------|----------|-----------|--------|
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/refresh` | Refresh token | Public |
| POST | `/api/auth/logout` | Logout user | Private |
| GET | `/api/auth/profile` | Get profil user | Private |
| PUT | `/api/auth/profile` | Update profil | Private |
| PUT | `/api/auth/change-password` | Ubah password | Private |

### Absensi

| Method | Endpoint | Deskripsi | Access |
|--------|----------|-----------|--------|
| POST | `/api/absen/check-in` | Absen masuk | Private |
| POST | `/api/absen/check-out` | Absen pulang | Private |
| GET | `/api/absen/my-attendance` | Riwayat absensi sendiri | Private |
| GET | `/api/absen/today` | Absensi hari ini | Private |
| GET | `/api/absen/all` | Semua absensi | Admin/HRD |

### User Management

| Method | Endpoint | Deskripsi | Access |
|--------|----------|-----------|--------|
| GET | `/api/users` | Get semua user | Admin/HRD |
| GET | `/api/users/:id` | Get user by ID | Admin/HRD |
| POST | `/api/users` | Buat user baru | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Hapus user | Admin |
| PUT | `/api/users/:id/reset-password` | Reset password | Admin |
| POST | `/api/users/:id/photo` | Upload foto profil | Private |

### Master Data Absensi (NEW!)

| Method | Endpoint | Deskripsi | Access |
|--------|----------|-----------|--------|
| PUT | `/api/users/:id/office-settings` | Update lokasi kantor (lat, lon, radius) | Admin |
| PUT | `/api/users/:id/shift-settings` | Update jam kerja (shift_start, shift_end) | Admin |

## 🔐 Testing dengan Postman/Thunder Client

### 1. Login

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
    "user": {...},
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**💡 Simpan `accessToken` dan `refreshToken` untuk request selanjutnya!**

### 2. Logout

```http
POST http://localhost:3001/api/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**⚠️ Catatan:** Logout **tidak perlu** Authorization header, cukup kirim `refreshToken` di body.

Response:
```json
{
  "success": true,
  "message": "Logout berhasil",
  "data": null
}
```

### 3. Get Profile

```http
GET http://localhost:3001/api/auth/profile
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Admin",
    "email": "admin@test.com",
    "role": "admin",
    ...
  }
}
```

### 4. Absen Masuk

```http
POST http://localhost:3001/api/absen/check-in
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

latitude: -6.200000
longitude: 106.816666
accuracy: 20
photo: [file]
```

### 5. Absen Pulang

```http
POST http://localhost:3001/api/absen/check-out
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

latitude: -6.200000
longitude: 106.816666
accuracy: 25
photo: [file]
```

### 6. Update Office Settings (Admin Only)

```http
PUT http://localhost:3001/api/users/1/office-settings
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "office_lat": -6.200000,
  "office_lon": 106.816666,
  "office_radius": 100
}
```

### 7. Update Shift Settings (Admin Only)

```http
PUT http://localhost:3001/api/users/1/shift-settings
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "shift_start": "08:00",
  "shift_end": "17:00"
}
```

## ✨ Fitur

### ✅ Authentication & Security
- ✅ Login & Logout dengan JWT
- ✅ Token Refresh untuk sesi panjang
- ✅ Middleware proteksi JWT
- ✅ Role Management (Admin, HRD, Karyawan)
- ✅ Password hashing dengan bcrypt

### ✅ User Management
- ✅ CRUD User (Create, Read, Update, Delete)
- ✅ Upload foto profil
- ✅ Tetapkan lokasi kantor per user
- ✅ Reset password
- ✅ Filter & search users (by role, status, name/email)

### ✅ Master Data Absensi
- ✅ Pengaturan lokasi kantor (lat, lon, radius) - **Endpoint khusus**
- ✅ Pengaturan jam kerja/shift (shift_start, shift_end) - **Endpoint khusus**
- ✅ Anti-fake GPS (validasi accuracy)
- ✅ Database terintegrasi dengan PostgreSQL

### ✅ Absensi (Core Feature)
- ✅ Absen masuk dengan foto selfie
- ✅ Absen pulang dengan foto selfie
- ✅ Validasi radius lokasi (Haversine Formula)
- ✅ Validasi jam kerja (terlambat/pulang cepat)
- ✅ Cegah double absensi
- ✅ Validasi GPS accuracy
- ✅ Simpan device info

### ✅ Upload Foto
- ✅ Upload selfie via multer
- ✅ Validasi tipe file (JPEG, PNG, WEBP)
- ✅ Limit ukuran file (5MB)
- ✅ Simpan ke folder lokal
- ✅ **Kompresi otomatis dengan Sharp**
  - Selfie absensi: max 800x800px, quality 75%
  - Foto profil: max 512x512px, quality 80%
  - Auto-convert ke JPEG untuk efisiensi
  - Maintain aspect ratio
  - Logging compression ratio

## 🔧 Konfigurasi Lanjutan

### Ubah Lokasi Kantor

Edit file `.env`:
```env
OFFICE_LATITUDE=-6.200000
OFFICE_LONGITUDE=106.816666
OFFICE_RADIUS=100
```

Atau set per user di database:
```sql
UPDATE users 
SET office_lat = -6.175110, 
    office_lon = 106.865036, 
    office_radius = 150 
WHERE id = 1;
```

### Ubah Jam Kerja

Edit di database:
```sql
UPDATE users 
SET shift_start = '09:00:00', 
    shift_end = '18:00:00' 
WHERE id = 1;
```

### Upload ke AWS S3 (Opsional)

```bash
npm install aws-sdk
```

Edit `src/middlewares/upload.js` untuk menggunakan S3.

## 📝 TODO List

- [x] Setup PostgreSQL database
- [x] Buat schema database
- [x] Koneksi database dengan pg
- [x] Integrasi controller dengan database PostgreSQL
- [x] Master data absensi (office & shift settings)
- [x] Swagger/OpenAPI documentation
- [x] Kompresi foto otomatis
- [ ] Implementasi Sequelize ORM (optional)
- [ ] Upload foto ke AWS S3
- [ ] Kompresi foto otomatis
- [ ] Multiple shift support
- [ ] Cuti & izin management
- [ ] Lembur tracking
- [ ] Export report (Excel/PDF)
- [ ] Email notification
- [ ] Dashboard analytics
- [ ] Unit testing

## 🐛 Troubleshooting

### Error: "Connected to PostgreSQL database"
- ✅ Koneksi berhasil!

### Error: "connection refused"
- Pastikan PostgreSQL sudah running: `brew services list` (macOS) atau `sudo systemctl status postgresql` (Linux)
- Cek port di `.env` sesuai dengan port PostgreSQL (default: 5432)
- Cek username dan password di `.env`

### Error: "database does not exist"
- Buat database dulu: `createdb -U postgres absensi_db`
- Atau via psql: `CREATE DATABASE absensi_db;`

### Error: "Token tidak ditemukan"
- Pastikan mengirim header `Authorization: Bearer <token>`

### Error: "GPS accuracy terlalu buruk"
- Gunakan accuracy < 50 meter
- Pastikan GPS device aktif

### Error: "Anda berada di luar radius kantor"
- Cek koordinat lokasi kantor sudah benar
- Sesuaikan radius di `.env`

## 📄 License

MIT

## 👨‍💻 Author

Backend API Absensi Karyawan - 2025
