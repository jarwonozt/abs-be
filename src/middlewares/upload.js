const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { compressSelfiePhoto, compressProfilePhoto } = require('../utils/imageCompressor');

// Pastikan folder uploads dan subfolder ada
const uploadDir = process.env.UPLOAD_PATH || './src/uploads';
const selfieDir = path.join(uploadDir, 'selfie');
const profileDir = path.join(uploadDir, 'profile');

// Buat folder jika belum ada
[uploadDir, selfieDir, profileDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Konfigurasi storage untuk selfie absensi
const selfieStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, selfieDir);
  },
  filename: (req, file, cb) => {
    // Format: userId_timestamp.ext
    const userId = req.user?.id || 'guest';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `selfie_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// Konfigurasi storage untuk foto profil
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileDir);
  },
  filename: (req, file, cb) => {
    // Format: profile_userId_timestamp.ext
    const userId = req.user?.id || req.params?.id || 'guest';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `profile_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// Filter file (hanya terima gambar)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG, JPG, PNG, WEBP) yang diizinkan'), false);
  }
};

// Konfigurasi multer untuk selfie
const uploadSelfie = multer({
  storage: selfieStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // Default 5MB
  }
});

// Konfigurasi multer untuk profile
const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // Default 5MB
  }
});

/**
 * Middleware untuk upload selfie absensi
 */
const uploadSelfiePhoto = uploadSelfie.single('photo');

/**
 * Middleware untuk upload foto profil
 */
const uploadProfilePhoto = uploadProfile.single('photo');

/**
 * Middleware error handler untuk multer
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file terlalu besar. Maksimal 5MB'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Error upload: ${error.message}`
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
};

/**
 * Fungsi untuk menghapus file
 * 
 * @param {string} filename - Nama file yang akan dihapus
 * @param {string} type - Tipe file ('selfie' atau 'profile')
 */
const deleteFile = (filename, type = 'selfie') => {
  const dir = type === 'profile' ? profileDir : selfieDir;
  const filePath = path.join(dir, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  
  return false;
};

/**
 * Middleware untuk kompresi foto selfie setelah upload
 */
const compressSelfie = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const filePath = req.file.path;
    
    // Kompresi foto
    const compressionResult = await compressSelfiePhoto(filePath);
    
    // Update req.file dengan info file yang sudah dikompres
    req.file.path = compressionResult.compressedPath;
    req.file.filename = path.basename(compressionResult.compressedPath);
    req.file.size = compressionResult.compressedSize;
    
    // Simpan info kompresi untuk logging
    req.compressionInfo = {
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      reduction: compressionResult.reduction
    };

    next();
  } catch (error) {
    console.error('Error compressing selfie:', error);
    // Jika kompresi gagal, lanjutkan dengan file original
    next();
  }
};

/**
 * Middleware untuk kompresi foto profil setelah upload
 */
const compressProfile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const filePath = req.file.path;
    
    // Kompresi foto
    const compressionResult = await compressProfilePhoto(filePath);
    
    // Update req.file dengan info file yang sudah dikompres
    req.file.path = compressionResult.compressedPath;
    req.file.filename = path.basename(compressionResult.compressedPath);
    req.file.size = compressionResult.compressedSize;
    
    // Simpan info kompresi untuk logging
    req.compressionInfo = {
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      reduction: compressionResult.reduction
    };

    next();
  } catch (error) {
    console.error('Error compressing profile photo:', error);
    // Jika kompresi gagal, lanjutkan dengan file original
    next();
  }
};

module.exports = {
  uploadSelfiePhoto,
  uploadProfilePhoto,
  handleUploadError,
  deleteFile,
  compressSelfie,
  compressProfile
};

