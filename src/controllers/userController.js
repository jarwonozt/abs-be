const bcrypt = require('bcryptjs');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');
const { deleteFile } = require('../middlewares/upload');

/**
 * IMPORTANT: Controller ini adalah TEMPLATE untuk User Management (Admin/HRD)
 * 
 * Tabel users diperlukan dengan struktur lengkap
 */

// MOCK DATA
const mockUsers = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@test.com',
    password: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
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
    createdAt: new Date()
  }
];

/**
 * Controller: Get All Users
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search, limit = 50 } = req.query;
    
    // TODO: Query database
    let users = [...mockUsers];
    
    // Filter
    if (role) {
      users = users.filter(u => u.role === role);
    }
    
    if (isActive !== undefined) {
      users = users.filter(u => u.isActive === (isActive === 'true'));
    }
    
    if (search) {
      users = users.filter(u => 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    users = users.slice(0, parseInt(limit));
    
    // Remove passwords
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    
    return successResponse(res, {
      total: usersWithoutPassword.length,
      users: usersWithoutPassword
    });
    
  } catch (error) {
    console.error('Error get all users:', error);
    return errorResponse(res, 'Gagal mengambil data user');
  }
};

/**
 * Controller: Get User by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: Query database
    const user = mockUsers.find(u => u.id == id);
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    return successResponse(res, userWithoutPassword);
    
  } catch (error) {
    console.error('Error get user:', error);
    return errorResponse(res, 'Gagal mengambil data user');
  }
};

/**
 * Controller: Create User
 */
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'karyawan',
      phone,
      address,
      officeLat,
      officeLon,
      officeRadius,
      shiftStart = '08:00',
      shiftEnd = '17:00'
    } = req.body;
    
    // Cek email sudah ada
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return validationErrorResponse(res, [
        { field: 'email', message: 'Email sudah terdaftar' }
      ]);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // TODO: Insert ke database
    const newUser = {
      id: mockUsers.length + 1,
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || null,
      address: address || null,
      officeLat: officeLat || parseFloat(process.env.OFFICE_LATITUDE),
      officeLon: officeLon || parseFloat(process.env.OFFICE_LONGITUDE),
      officeRadius: officeRadius || parseInt(process.env.OFFICE_RADIUS),
      shiftStart,
      shiftEnd,
      photo: null,
      isActive: true,
      createdAt: new Date()
    };
    
    mockUsers.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    return successResponse(res, userWithoutPassword, 'User berhasil dibuat', 201);
    
  } catch (error) {
    console.error('Error create user:', error);
    return errorResponse(res, 'Gagal membuat user');
  }
};

/**
 * Controller: Update User
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      phone,
      address,
      officeLat,
      officeLon,
      officeRadius,
      shiftStart,
      shiftEnd,
      isActive
    } = req.body;
    
    // TODO: Query database
    const user = mockUsers.find(u => u.id == id);
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Cek email conflict (jika email diubah)
    if (email && email !== user.email) {
      const existingUser = mockUsers.find(u => u.email === email && u.id != id);
      if (existingUser) {
        return validationErrorResponse(res, [
          { field: 'email', message: 'Email sudah digunakan user lain' }
        ]);
      }
    }
    
    // TODO: Update database
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.phone = phone !== undefined ? phone : user.phone;
    user.address = address !== undefined ? address : user.address;
    user.officeLat = officeLat !== undefined ? parseFloat(officeLat) : user.officeLat;
    user.officeLon = officeLon !== undefined ? parseFloat(officeLon) : user.officeLon;
    user.officeRadius = officeRadius !== undefined ? parseInt(officeRadius) : user.officeRadius;
    user.shiftStart = shiftStart || user.shiftStart;
    user.shiftEnd = shiftEnd || user.shiftEnd;
    user.isActive = isActive !== undefined ? isActive : user.isActive;
    user.updatedAt = new Date();
    
    const { password: _, ...userWithoutPassword } = user;
    
    return successResponse(res, userWithoutPassword, 'User berhasil diperbarui');
    
  } catch (error) {
    console.error('Error update user:', error);
    return errorResponse(res, 'Gagal memperbarui user');
  }
};

/**
 * Controller: Delete User
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek user ada
    const userIndex = mockUsers.findIndex(u => u.id == id);
    
    if (userIndex === -1) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Cek tidak boleh hapus diri sendiri
    if (mockUsers[userIndex].id === req.user.userId) {
      return errorResponse(res, 'Tidak dapat menghapus akun sendiri', 400);
    }
    
    // Hapus foto jika ada
    if (mockUsers[userIndex].photo) {
      deleteFile(mockUsers[userIndex].photo);
    }
    
    // TODO: Soft delete atau hard delete
    // Soft delete: UPDATE users SET is_active = 0, deleted_at = NOW() WHERE id = ?
    // Hard delete: DELETE FROM users WHERE id = ?
    
    mockUsers.splice(userIndex, 1);
    
    return successResponse(res, null, 'User berhasil dihapus');
    
  } catch (error) {
    console.error('Error delete user:', error);
    return errorResponse(res, 'Gagal menghapus user');
  }
};

/**
 * Controller: Reset Password User
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return validationErrorResponse(res, [
        { field: 'newPassword', message: 'Password baru wajib diisi' }
      ]);
    }
    
    if (newPassword.length < 6) {
      return validationErrorResponse(res, [
        { field: 'newPassword', message: 'Password minimal 6 karakter' }
      ]);
    }
    
    // TODO: Query database
    const user = mockUsers.find(u => u.id == id);
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // TODO: Update database
    user.password = hashedPassword;
    user.updatedAt = new Date();
    
    return successResponse(res, null, 'Password berhasil direset');
    
  } catch (error) {
    console.error('Error reset password:', error);
    return errorResponse(res, 'Gagal mereset password');
  }
};

/**
 * Controller: Upload Profile Photo
 */
const uploadProfilePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = req.file;
    
    if (!photo) {
      return validationErrorResponse(res, [
        { field: 'photo', message: 'File foto wajib diupload' }
      ]);
    }
    
    // TODO: Query database
    const user = mockUsers.find(u => u.id == id);
    
    if (!user) {
      // Hapus foto yang baru diupload
      deleteFile(photo.filename);
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Hapus foto lama jika ada
    if (user.photo) {
      deleteFile(user.photo);
    }
    
    // TODO: Update database
    user.photo = photo.filename;
    user.updatedAt = new Date();
    
    return successResponse(res, {
      photo: photo.filename,
      photoUrl: `/uploads/${photo.filename}`
    }, 'Foto profil berhasil diupload');
    
  } catch (error) {
    console.error('Error upload photo:', error);
    return errorResponse(res, 'Gagal mengupload foto');
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  uploadProfilePhoto
};
