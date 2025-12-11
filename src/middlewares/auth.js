const jwt = require('jsonwebtoken');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/response');

/**
 * Middleware untuk verifikasi JWT token
 */
const verifyToken = (req, res, next) => {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return unauthorizedResponse(res, 'Token tidak ditemukan');
    }
    
    // Format: Bearer <token>
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return unauthorizedResponse(res, 'Format token tidak valid');
    }
    
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Simpan data user ke request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Token tidak valid');
    }
    
    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Token sudah kadaluarsa');
    }
    
    return unauthorizedResponse(res, 'Autentikasi gagal');
  }
};

/**
 * Middleware untuk verifikasi role
 * 
 * @param  {...string} allowedRoles - Role yang diizinkan
 * @returns {Function}
 */
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return unauthorizedResponse(res, 'User tidak terautentikasi');
      }
      
      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return forbiddenResponse(res, `Akses ditolak. Role ${userRole} tidak memiliki izin.`);
      }
      
      next();
    } catch (error) {
      return forbiddenResponse(res, 'Verifikasi role gagal');
    }
  };
};

/**
 * Middleware untuk verifikasi refresh token
 */
const verifyRefreshToken = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return unauthorizedResponse(res, 'Refresh token tidak ditemukan');
    }
    
    // Verifikasi refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Simpan data user ke request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Refresh token tidak valid');
    }
    
    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Refresh token sudah kadaluarsa');
    }
    
    return unauthorizedResponse(res, 'Verifikasi refresh token gagal');
  }
};

/**
 * Middleware untuk generate JWT token
 * 
 * @param {Object} payload - Data yang akan di-encode
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokens = (payload) => {
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

module.exports = {
  verifyToken,
  verifyRole,
  verifyRefreshToken,
  generateTokens
};
