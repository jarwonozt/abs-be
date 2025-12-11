const { validationErrorResponse } = require('../utils/response');

/**
 * Middleware untuk validasi input absensi
 */
const validateAbsenInput = (req, res, next) => {
  const errors = [];
  
  const { latitude, longitude, accuracy } = req.body;
  
  // Validasi latitude
  if (!latitude) {
    errors.push({ field: 'latitude', message: 'Latitude wajib diisi' });
  } else if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.push({ field: 'latitude', message: 'Latitude tidak valid (-90 sampai 90)' });
  }
  
  // Validasi longitude
  if (!longitude) {
    errors.push({ field: 'longitude', message: 'Longitude wajib diisi' });
  } else if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.push({ field: 'longitude', message: 'Longitude tidak valid (-180 sampai 180)' });
  }
  
  // Validasi accuracy
  if (!accuracy) {
    errors.push({ field: 'accuracy', message: 'GPS accuracy wajib diisi' });
  } else if (isNaN(accuracy) || accuracy < 0) {
    errors.push({ field: 'accuracy', message: 'GPS accuracy tidak valid' });
  }
  
  // Validasi foto
  if (!req.file) {
    errors.push({ field: 'photo', message: 'Foto selfie wajib diupload' });
  }
  
  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }
  
  next();
};

/**
 * Middleware untuk validasi input login
 */
const validateLoginInput = (req, res, next) => {
  const errors = [];
  
  const { email, password } = req.body;
  
  if (!email) {
    errors.push({ field: 'email', message: 'Email wajib diisi' });
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push({ field: 'email', message: 'Format email tidak valid' });
  }
  
  if (!password) {
    errors.push({ field: 'password', message: 'Password wajib diisi' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password minimal 6 karakter' });
  }
  
  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }
  
  next();
};

/**
 * Middleware untuk validasi input user
 */
const validateUserInput = (req, res, next) => {
  const errors = [];
  
  const { name, email, password, role } = req.body;
  
  if (!name) {
    errors.push({ field: 'name', message: 'Nama wajib diisi' });
  }
  
  if (!email) {
    errors.push({ field: 'email', message: 'Email wajib diisi' });
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push({ field: 'email', message: 'Format email tidak valid' });
  }
  
  if (req.method === 'POST' && !password) {
    errors.push({ field: 'password', message: 'Password wajib diisi' });
  } else if (password && password.length < 6) {
    errors.push({ field: 'password', message: 'Password minimal 6 karakter' });
  }
  
  if (role && !['admin', 'karyawan', 'hrd'].includes(role)) {
    errors.push({ field: 'role', message: 'Role tidak valid (admin, karyawan, hrd)' });
  }
  
  if (errors.length > 0) {
    return validationErrorResponse(res, errors);
  }
  
  next();
};

module.exports = {
  validateAbsenInput,
  validateLoginInput,
  validateUserInput
};
