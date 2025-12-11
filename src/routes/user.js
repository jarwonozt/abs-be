const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  uploadProfilePhoto,
  updateOfficeSettings,
  updateShiftSettings
} = require('../controllers/userController');

const { verifyToken, verifyRole } = require('../middlewares/auth');
const { uploadProfilePhoto: uploadPhoto, handleUploadError } = require('../middlewares/upload');
const { validateUserInput } = require('../middlewares/validator');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get semua user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, hrd, karyawan]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limit results
 *     responses:
 *       200:
 *         description: Daftar user berhasil diambil
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * 
 * @route   GET /api/users
 * @desc    Get semua user
 * @access  Private (Admin, HRD)
 * @query   role, isActive, search, limit
 */
router.get(
  '/',
  verifyToken,
  verifyRole('admin', 'hrd'),
  getAllUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin, HRD)
 */
router.get(
  '/:id',
  verifyToken,
  verifyRole('admin', 'hrd'),
  getUserById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Buat user baru
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [admin, hrd, karyawan]
 *               office_lat:
 *                 type: number
 *               office_lon:
 *                 type: number
 *               office_radius:
 *                 type: integer
 *               shift_start:
 *                 type: string
 *                 format: time
 *               shift_end:
 *                 type: string
 *                 format: time
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Email sudah terdaftar
 * 
 * @route   POST /api/users
 * @desc    Buat user baru
 * @access  Private (Admin)
 */
router.post(
  '/',
  verifyToken,
  verifyRole('admin'),
  validateUserInput,
  createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, hrd, karyawan]
 *               is_active:
 *                 type: boolean
 *               office_lat:
 *                 type: number
 *               office_lon:
 *                 type: number
 *               office_radius:
 *                 type: integer
 *               shift_start:
 *                 type: string
 *               shift_end:
 *                 type: string
 *     responses:
 *       200:
 *         description: User berhasil diupdate
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  verifyToken,
  verifyRole('admin'),
  validateUserInput,
  updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Hapus user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User berhasil dihapus
 *       400:
 *         description: Tidak dapat menghapus diri sendiri
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * @route   DELETE /api/users/:id
 * @desc    Hapus user
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  verifyToken,
  verifyRole('admin'),
  deleteUser
);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   put:
 *     summary: Reset password user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password berhasil direset
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset password user
 * @access  Private (Admin)
 */
router.put(
  '/:id/reset-password',
  verifyToken,
  verifyRole('admin'),
  resetUserPassword
);

/**
 * @swagger
 * /api/users/{id}/photo:
 *   post:
 *     summary: Upload foto profil user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto profil berhasil diupload
 *       403:
 *         description: Tidak ada permission
 * 
 * @route   POST /api/users/:id/photo
 * @desc    Upload foto profil user
 * @access  Private (Admin, atau user sendiri)
 */
router.post(
  '/:id/photo',
  verifyToken,
  uploadPhoto,
  handleUploadError,
  uploadProfilePhoto
);

/**
 * @swagger
 * /api/users/{id}/office-settings:
 *   put:
 *     summary: Update pengaturan lokasi kantor
 *     description: Update latitude, longitude, dan radius lokasi kantor untuk validasi absensi
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - office_lat
 *               - office_lon
 *               - office_radius
 *             properties:
 *               office_lat:
 *                 type: number
 *                 format: float
 *                 example: -6.2088
 *                 description: Latitude lokasi kantor
 *               office_lon:
 *                 type: number
 *                 format: float
 *                 example: 106.8456
 *                 description: Longitude lokasi kantor
 *               office_radius:
 *                 type: integer
 *                 example: 100
 *                 description: Radius dalam meter untuk validasi lokasi
 *     responses:
 *       200:
 *         description: Pengaturan lokasi kantor berhasil diupdate
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
 *                     office_lat:
 *                       type: number
 *                     office_lon:
 *                       type: number
 *                     office_radius:
 *                       type: integer
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * @route   PUT /api/users/:id/office-settings
 * @desc    Update pengaturan lokasi kantor (latitude, longitude, radius)
 * @access  Private (Admin)
 */
router.put(
  '/:id/office-settings',
  verifyToken,
  verifyRole('admin'),
  updateOfficeSettings
);

/**
 * @swagger
 * /api/users/{id}/shift-settings:
 *   put:
 *     summary: Update pengaturan jam kerja (shift)
 *     description: Update waktu mulai dan selesai shift kerja karyawan
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shift_start
 *               - shift_end
 *             properties:
 *               shift_start:
 *                 type: string
 *                 format: time
 *                 example: "08:00"
 *                 description: Waktu mulai shift (HH:mm)
 *               shift_end:
 *                 type: string
 *                 format: time
 *                 example: "17:00"
 *                 description: Waktu selesai shift (HH:mm)
 *     responses:
 *       200:
 *         description: Pengaturan jam kerja berhasil diupdate
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
 *                     shift_start:
 *                       type: string
 *                     shift_end:
 *                       type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 * @route   PUT /api/users/:id/shift-settings
 * @desc    Update pengaturan jam kerja (shift_start, shift_end)
 * @access  Private (Admin)
 */
router.put(
  '/:id/shift-settings',
  verifyToken,
  verifyRole('admin'),
  updateShiftSettings
);

module.exports = router;
module.exports = router;
