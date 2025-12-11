const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');

/**
 * Get all users
 * @route GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search, limit = 100 } = req.query;
    
    let query = `
      SELECT id, name, email, role, phone, address,
             office_lat, office_lon, office_radius,
             shift_start, shift_end, photo, is_active,
             created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    
    const params = [];
    
    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }
    
    if (isActive !== undefined) {
      params.push(isActive === 'true');
      query += ` AND is_active = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await db.query(query, params);
    
    return successResponse(res, {
      total: result.rows.length,
      users: result.rows
    }, 'Berhasil mengambil data user');
    
  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data user');
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT id, name, email, role, phone, address,
              office_lat, office_lon, office_radius,
              shift_start, shift_end, photo, is_active,
              created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    return successResponse(res, result.rows[0], 'Berhasil mengambil data user');
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data user');
  }
};

/**
 * Create new user
 * @route POST /api/users
 */
exports.createUser = async (req, res) => {
  try {
    const {
      name, email, password, role, phone, address,
      office_lat, office_lon, office_radius,
      shift_start, shift_end
    } = req.body;
    
    // Validasi required fields
    if (!name || !email || !password || !role) {
      return validationErrorResponse(res, 'Nama, email, password, dan role wajib diisi');
    }
    
    // Cek email sudah ada
    const checkEmail = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (checkEmail.rows.length > 0) {
      return errorResponse(res, 'Email sudah terdaftar', 400);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await db.query(
      `INSERT INTO users (
        name, email, password, role, phone, address,
        office_lat, office_lon, office_radius,
        shift_start, shift_end, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING id, name, email, role, phone, address,
                office_lat, office_lon, office_radius,
                shift_start, shift_end, is_active, created_at`,
      [
        name, email, hashedPassword, role, phone, address,
        office_lat || null,
        office_lon || null,
        office_radius || 100,
        shift_start || '08:00:00',
        shift_end || '17:00:00'
      ]
    );
    
    return successResponse(res, result.rows[0], 'User berhasil dibuat', 201);
    
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat membuat user');
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, role, phone, address,
      office_lat, office_lon, office_radius,
      shift_start, shift_end, is_active
    } = req.body;
    
    // Cek user exists
    const checkUser = await db.query('SELECT id FROM users WHERE id = $1', [id]);
    
    if (checkUser.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Cek email duplicate (kecuali email sendiri)
    if (email) {
      const checkEmail = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (checkEmail.rows.length > 0) {
        return errorResponse(res, 'Email sudah digunakan user lain', 400);
      }
    }
    
    // Update user
    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           office_lat = COALESCE($6, office_lat),
           office_lon = COALESCE($7, office_lon),
           office_radius = COALESCE($8, office_radius),
           shift_start = COALESCE($9, shift_start),
           shift_end = COALESCE($10, shift_end),
           is_active = COALESCE($11, is_active),
           updated_at = NOW()
       WHERE id = $12
       RETURNING id, name, email, role, phone, address,
                 office_lat, office_lon, office_radius,
                 shift_start, shift_end, is_active, updated_at`,
      [name, email, role, phone, address, office_lat, office_lon, office_radius, shift_start, shift_end, is_active, id]
    );
    
    return successResponse(res, result.rows[0], 'User berhasil diupdate');
    
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengupdate user');
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Jangan hapus user sendiri
    if (parseInt(id) === req.user.id) {
      return errorResponse(res, 'Tidak dapat menghapus akun sendiri', 400);
    }
    
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, email',
      [id]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    return successResponse(res, result.rows[0], 'User berhasil dihapus');
    
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat menghapus user');
  }
};

/**
 * Reset user password
 * @route PUT /api/users/:id/reset-password
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return validationErrorResponse(res, 'Password baru minimal 6 karakter');
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email',
      [hashedPassword, id]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Delete semua refresh token user (force re-login)
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
    
    return successResponse(res, result.rows[0], 'Password berhasil direset');
    
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat reset password');
  }
};

/**
 * Upload profile photo
 * @route POST /api/users/:id/photo
 */
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = req.file;
    
    // Validasi hanya bisa upload foto sendiri atau admin
    if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
      return errorResponse(res, 'Anda hanya bisa upload foto profil sendiri', 403);
    }
    
    if (!photo) {
      return validationErrorResponse(res, 'Foto wajib diupload');
    }
    
    const photoFilename = photo.filename;
    
    const result = await db.query(
      'UPDATE users SET photo = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, photo',
      [photoFilename, id]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    return successResponse(res, {
      ...result.rows[0],
      photo: `/uploads/profile/${photoFilename}`
    }, 'Foto profil berhasil diupload');
    
  } catch (error) {
    console.error('Upload photo error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat upload foto');
  }
};

/**
 * Update office settings (lokasi kantor)
 * @route PUT /api/users/:id/office-settings
 */
exports.updateOfficeSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { office_lat, office_lon, office_radius } = req.body;
    
    // Validasi
    if (!office_lat || !office_lon) {
      return validationErrorResponse(res, 'Latitude dan longitude wajib diisi');
    }
    
    const result = await db.query(
      `UPDATE users
       SET office_lat = $1,
           office_lon = $2,
           office_radius = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, office_lat, office_lon, office_radius`,
      [
        parseFloat(office_lat),
        parseFloat(office_lon),
        office_radius ? parseInt(office_radius) : 100,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    return successResponse(res, result.rows[0], 'Pengaturan lokasi kantor berhasil diupdate');
    
  } catch (error) {
    console.error('Update office settings error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengupdate pengaturan lokasi');
  }
};

/**
 * Update shift settings (jam kerja)
 * @route PUT /api/users/:id/shift-settings
 */
exports.updateShiftSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { shift_start, shift_end } = req.body;
    
    // Validasi
    if (!shift_start || !shift_end) {
      return validationErrorResponse(res, 'Jam mulai dan jam selesai wajib diisi');
    }
    
    const result = await db.query(
      `UPDATE users
       SET shift_start = $1,
           shift_end = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, shift_start, shift_end`,
      [shift_start, shift_end, id]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    return successResponse(res, result.rows[0], 'Pengaturan jam kerja berhasil diupdate');
    
  } catch (error) {
    console.error('Update shift settings error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengupdate pengaturan jam kerja');
  }
};
