const express = require('express');
const router = express.Router();

const {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayAttendance,
  getAllAttendance
} = require('../controllers/absenController');

const { verifyToken, verifyRole } = require('../middlewares/auth');
const { uploadSelfiePhoto, handleUploadError, compressSelfie } = require('../middlewares/upload');
const { validateAbsenInput } = require('../middlewares/validator');

/**
 * @swagger
 * /api/absen/check-in:
 *   post:
 *     summary: Absen masuk (check-in)
 *     description: Melakukan absen masuk dengan upload foto selfie dan validasi GPS
 *     tags: [Absensi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *               - accuracy
 *               - photo
 *             properties:
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: -6.200000
 *                 description: Latitude lokasi user
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 106.816666
 *                 description: Longitude lokasi user
 *               accuracy:
 *                 type: number
 *                 format: float
 *                 example: 20.5
 *                 description: GPS accuracy dalam meter
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Foto selfie (max 5MB, format JPEG/PNG/WEBP)
 *     responses:
 *       200:
 *         description: Check-in berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     checkInTime:
 *                       type: string
 *                       format: date-time
 *                     photo:
 *                       type: string
 *                       example: /uploads/selfie/selfie_1_1234567890.jpg
 *                     distance:
 *                       type: string
 *                       example: 45m
 *                     status:
 *                       type: string
 *                       example: Hadir
 *                     late:
 *                       type: boolean
 *                     lateMinutes:
 *                       type: integer
 *       400:
 *         description: Validasi gagal atau sudah absen hari ini
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/check-in',
  verifyToken,
  uploadSelfiePhoto,
  handleUploadError,
  compressSelfie,
  validateAbsenInput,
  checkIn
);

/**
 * @swagger
 * /api/absen/check-out:
 *   post:
 *     summary: Absen pulang (check-out)
 *     description: Melakukan absen pulang dengan upload foto selfie dan validasi GPS
 *     tags: [Absensi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *               - accuracy
 *               - photo
 *             properties:
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: -6.200000
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 106.816666
 *               accuracy:
 *                 type: number
 *                 format: float
 *                 example: 25.0
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Foto selfie (max 5MB)
 *     responses:
 *       200:
 *         description: Check-out berhasil
 *       400:
 *         description: Belum check-in atau sudah check-out
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/check-out',
  verifyToken,
  uploadSelfiePhoto,
  handleUploadError,
  compressSelfie,
  validateAbsenInput,
  checkOut
);

/**
 * @swagger
 * /api/absen/my-attendance:
 *   get:
 *     summary: Riwayat absensi user sendiri
 *     description: Mendapatkan riwayat absensi user yang sedang login
 *     tags: [Absensi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal mulai (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal akhir (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Jumlah maksimal data
 *     responses:
 *       200:
 *         description: Berhasil mengambil riwayat absensi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     attendance:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attendance'
 */
router.get(
  '/my-attendance',
  verifyToken,
  getMyAttendance
);

/**
 * @swagger
 * /api/absen/today:
 *   get:
 *     summary: Absensi hari ini
 *     description: Cek status absensi user hari ini
 *     tags: [Absensi]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data absensi hari ini
 */
router.get(
  '/today',
  verifyToken,
  getTodayAttendance
);

/**
 * @swagger
 * /api/absen/all:
 *   get:
 *     summary: Semua absensi (Admin/HRD)
 *     description: Mendapatkan semua data absensi karyawan
 *     tags: [Absensi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Hadir, Terlambat, Pulang Cepat]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Berhasil mengambil data absensi
 *       403:
 *         description: Forbidden - Hanya Admin/HRD
 */
router.get(
  '/all',
  verifyToken,
  verifyRole('admin', 'hrd'),
  getAllAttendance
);

module.exports = router;
