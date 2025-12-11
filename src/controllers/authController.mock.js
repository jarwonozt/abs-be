const bcrypt = require('bcryptjs');
const { generateTokens } = require('../middlewares/auth');
const { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } = require('../utils/response');

/**
 * IMPORTANT: Controller ini adalah TEMPLATE
 * 
 * Anda perlu mengintegrasikan dengan database
 * Tabel users perlu memiliki kolom:
 * - id, name, email, password (hashed), role, phone, address
 * - office_lat, office_lon, office_radius
 * - shift_start, shift_end
 * - photo, is_active, created_at, updated_at
 */

// MOCK DATA - Ganti dengan query database PostgreSQL
// Hash password dibuat dengan: bcrypt.hash('admin123', 10)
const mockUsers = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@test.com',
    password: '$2b$10$dMFt/cawWm9jnrU9x0Y0mOR3KqEbSyvbntFkbEpO7wKJjDIB5hYwK', // password: admin123
    role: 'admin',
    phone: '081234567890',
    address: 'Jakarta',
    officeLat: -6.200000,
    officeLon: 106.816666,
    officeRadius: 100,
    shiftStart: '08:00',
    shiftEnd: '17:00',
    photo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: 'HRD Manager',
    email: 'hrd@test.com',
    password: '$2b$10$dMFt/cawWm9jnrU9x0Y0mOR3KqEbSyvbntFkbEpO7wKJjDIB5hYwK', // password: admin123
    role: 'hrd',
    phone: '081234567891',
    address: 'Jakarta',
    officeLat: -6.200000,
    officeLon: 106.816666,
    officeRadius: 100,
    shiftStart: '08:00',
    shiftEnd: '17:00',
    photo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: 'Budi Santoso',
    email: 'budi@test.com',
    password: '$2b$10$dMFt/cawWm9jnrU9x0Y0mOR3KqEbSyvbntFkbEpO7wKJjDIB5hYwK', // password: admin123
    role: 'karyawan',
    phone: '081234567892',
    address: 'Bandung',
    officeLat: -6.200000,
    officeLon: 106.816666,
    officeRadius: 100,
    shiftStart: '08:00',
    shiftEnd: '17:00',
    photo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

let refreshTokenStore = []; // Simpan refresh token di database/redis

/**
 * Controller: Login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // TODO: Query database
    // const user = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    const user = mockUsers.find(u => u.email === email && u.isActive);
    
    if (!user) {
      return unauthorizedResponse(res, 'Email atau password salah');
    }
    
    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Email atau password salah');
    }
    
    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    const { accessToken, refreshToken } = generateTokens(payload);
    
    // TODO: Simpan refresh token ke database
    // await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', 
    //   [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);
    refreshTokenStore.push({
      userId: user.id,
      token: refreshToken,
      createdAt: new Date()
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return successResponse(res, {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    }, 'Login berhasil');
    
  } catch (error) {
    console.error('Error login:', error);
    return errorResponse(res, 'Login gagal');
  }
};

/**
 * Controller: Refresh Token
 */
const refreshToken = async (req, res) => {
  try {
    // req.user sudah diset oleh middleware verifyRefreshToken
    const userId = req.user.userId;
    const oldRefreshToken = req.body.refreshToken;
    
    // TODO: Cek apakah refresh token ada di database
    // const storedToken = await db.query('SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?', 
    //   [oldRefreshToken, userId]);
    const storedToken = refreshTokenStore.find(t => 
      t.token === oldRefreshToken && t.userId === userId
    );
    
    if (!storedToken) {
      return unauthorizedResponse(res, 'Refresh token tidak valid');
    }
    
    // Generate new tokens
    const payload = {
      userId: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    };
    
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);
    
    // TODO: Hapus refresh token lama dan simpan yang baru
    // await db.query('DELETE FROM refresh_tokens WHERE token = ?', [oldRefreshToken]);
    // await db.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', 
    //   [userId, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]);
    
    const index = refreshTokenStore.findIndex(t => t.token === oldRefreshToken);
    if (index > -1) {
      refreshTokenStore.splice(index, 1);
    }
    
    refreshTokenStore.push({
      userId,
      token: newRefreshToken,
      createdAt: new Date()
    });
    
    return successResponse(res, {
      accessToken,
      refreshToken: newRefreshToken
    }, 'Token berhasil diperbarui');
    
  } catch (error) {
    console.error('Error refresh token:', error);
    return errorResponse(res, 'Refresh token gagal');
  }
};

/**
 * Controller: Logout
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Validasi refresh token wajib ada
    if (!refreshToken) {
      return validationErrorResponse(res, [
        { field: 'refreshToken', message: 'Refresh token wajib diisi' }
      ]);
    }
    
    // Hapus refresh token dari store
    // TODO: Hapus refresh token dari database
    // await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    
    const index = refreshTokenStore.findIndex(t => t.token === refreshToken);
    if (index > -1) {
      refreshTokenStore.splice(index, 1);
      return successResponse(res, null, 'Logout berhasil');
    }
    
    // Jika token tidak ditemukan, tetap return success (idempotent)
    return successResponse(res, null, 'Logout berhasil');
    
  } catch (error) {
    console.error('Error logout:', error);
    return errorResponse(res, 'Logout gagal');
  }
};

/**
 * Controller: Get Profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // TODO: Query database
    // const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return successResponse(res, userWithoutPassword);
    
  } catch (error) {
    console.error('Error get profile:', error);
    return errorResponse(res, 'Gagal mengambil data profil');
  }
};

/**
 * Controller: Update Profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, address } = req.body;
    
    // TODO: Update database
    // await db.query('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', 
    //   [name, phone, address, userId]);
    
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.name = name || user.name;
      user.phone = phone || user.phone;
      user.address = address || user.address;
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    return successResponse(res, userWithoutPassword, 'Profil berhasil diperbarui');
    
  } catch (error) {
    console.error('Error update profile:', error);
    return errorResponse(res, 'Gagal memperbarui profil');
  }
};

/**
 * Controller: Change Password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return validationErrorResponse(res, [
        { field: 'password', message: 'Password lama dan baru wajib diisi' }
      ]);
    }
    
    if (newPassword.length < 6) {
      return validationErrorResponse(res, [
        { field: 'newPassword', message: 'Password baru minimal 6 karakter' }
      ]);
    }
    
    // TODO: Query database
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Password lama salah');
    }
    
    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // TODO: Update database
    // await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    user.password = hashedPassword;
    
    return successResponse(res, null, 'Password berhasil diubah');
    
  } catch (error) {
    console.error('Error change password:', error);
    return errorResponse(res, 'Gagal mengubah password');
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword
};
