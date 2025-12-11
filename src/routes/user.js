const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  uploadProfilePhoto
} = require('../controllers/userController');

const { verifyToken, verifyRole } = require('../middlewares/auth');
const { uploadProfilePhoto: uploadPhoto, handleUploadError } = require('../middlewares/upload');
const { validateUserInput } = require('../middlewares/validator');

/**
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

module.exports = router;
