const bcrypt = require('bcryptjs');
const { generateTokens } = require('../middlewares/auth');
const { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } = require('../utils/response');
const db = require('../config/database');

/**
 * Login user
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return validationErrorResponse(res, 'Email dan password harus diisi');
    }

    // Cari user berdasarkan email
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return unauthorizedResponse(res, 'Email atau password salah');
    }

    // Cek apakah user aktif
    if (!user.is_active) {
      return unauthorizedResponse(res, 'Akun Anda tidak aktif. Hubungi administrator');
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Email atau password salah');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Simpan refresh token ke database
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, refreshToken]
    );

    // Hapus password dari response
    delete user.password;

    return successResponse(res, {
      user,
      accessToken,
      refreshToken
    }, 'Login berhasil');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat login');
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return validationErrorResponse(res, 'Refresh token harus diisi');
    }

    // Cek apakah refresh token ada di database dan masih valid
    const result = await db.query(
      `SELECT rt.*, u.email, u.role 
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 
       AND rt.expires_at > NOW()
       AND rt.revoked = false`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return unauthorizedResponse(res, 'Refresh token tidak valid atau sudah kadaluarsa');
    }

    const tokenData = result.rows[0];

    // Generate access token baru
    const { accessToken } = generateTokens({
      id: tokenData.user_id,
      email: tokenData.email,
      role: tokenData.role
    });

    return successResponse(res, {
      accessToken
    }, 'Access token berhasil diperbarui');

  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat refresh token');
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return validationErrorResponse(res, 'Refresh token harus diisi');
    }

    // Revoke refresh token di database
    await db.query(
      'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
      [refreshToken]
    );

    return successResponse(res, null, 'Logout berhasil');

  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat logout');
  }
};

/**
 * Get user profile
 * @route GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, nama, email, role, nik, jabatan, departemen, telepon, alamat, foto, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    return successResponse(res, user, 'Berhasil mengambil data profile');

  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data profile');
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nama, telepon, alamat } = req.body;

    // Update profile
    const result = await db.query(
      `UPDATE users 
       SET nama = COALESCE($1, nama),
           telepon = COALESCE($2, telepon),
           alamat = COALESCE($3, alamat),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, nama, email, role, nik, jabatan, departemen, telepon, alamat, foto, is_active, created_at, updated_at`,
      [nama, telepon, alamat, userId]
    );

    const user = result.rows[0];

    return successResponse(res, user, 'Profile berhasil diperbarui');

  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengupdate profile');
  }
};

/**
 * Change password
 * @route PUT /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // Validasi input
    if (!oldPassword || !newPassword) {
      return validationErrorResponse(res, 'Password lama dan password baru harus diisi');
    }

    if (newPassword.length < 6) {
      return validationErrorResponse(res, 'Password baru minimal 6 karakter');
    }

    // Ambil user dari database
    const result = await db.query(
      'SELECT id, password FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }

    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Password lama tidak sesuai');
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    // Revoke semua refresh token user (force re-login)
    await db.query(
      'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
      [userId]
    );

    return successResponse(res, null, 'Password berhasil diubah. Silakan login kembali');

  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengubah password');
  }
};
