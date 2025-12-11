const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Kompresi foto dengan sharp
 * @param {String} filePath - Path file yang akan dikompres
 * @param {Object} options - Opsi kompresi
 * @returns {Promise<Object>} Info file hasil kompresi
 */
const compressImage = async (filePath, options = {}) => {
  try {
    const {
      quality = 80,           // Kualitas JPEG (1-100)
      maxWidth = 1024,        // Lebar maksimal
      maxHeight = 1024,       // Tinggi maksimal
      format = 'jpeg',        // Format output (jpeg, png, webp)
      removeOriginal = true   // Hapus file original setelah kompresi
    } = options;

    // Baca metadata file original
    const metadata = await sharp(filePath).metadata();
    
    // Tentukan ukuran resize
    let resizeOptions = {};
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      resizeOptions = {
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',        // Maintain aspect ratio
        withoutEnlargement: true
      };
    }

    // Generate output filename
    const parsedPath = path.parse(filePath);
    const outputPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}.${format}`
    );

    // Kompresi gambar
    let pipeline = sharp(filePath);

    // Apply resize jika perlu
    if (Object.keys(resizeOptions).length > 0) {
      pipeline = pipeline.resize(resizeOptions);
    }

    // Apply format dan kualitas
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ 
          quality, 
          compressionLevel: 9,
          progressive: true
        });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      default:
        pipeline = pipeline.jpeg({ quality });
    }

    // Save compressed image
    await pipeline.toFile(outputPath);

    // Get file sizes
    const originalStats = await fs.stat(filePath);
    const compressedStats = await fs.stat(outputPath);

    const result = {
      originalPath: filePath,
      compressedPath: outputPath,
      originalSize: originalStats.size,
      compressedSize: compressedStats.size,
      reduction: ((1 - compressedStats.size / originalStats.size) * 100).toFixed(2),
      originalDimensions: {
        width: metadata.width,
        height: metadata.height
      }
    };

    // Hapus file original jika diminta
    if (removeOriginal && outputPath !== filePath) {
      await fs.unlink(filePath);
      result.originalRemoved = true;
    }

    return result;
  } catch (error) {
    throw new Error(`Image compression failed: ${error.message}`);
  }
};

/**
 * Kompresi foto selfie untuk absensi
 * @param {String} filePath - Path file selfie
 * @returns {Promise<Object>} Info hasil kompresi
 */
const compressSelfiePhoto = async (filePath) => {
  return compressImage(filePath, {
    quality: 75,
    maxWidth: 800,
    maxHeight: 800,
    format: 'jpeg',
    removeOriginal: true
  });
};

/**
 * Kompresi foto profil user
 * @param {String} filePath - Path file foto profil
 * @returns {Promise<Object>} Info hasil kompresi
 */
const compressProfilePhoto = async (filePath) => {
  return compressImage(filePath, {
    quality: 80,
    maxWidth: 512,
    maxHeight: 512,
    format: 'jpeg',
    removeOriginal: true
  });
};

/**
 * Validasi apakah file adalah gambar valid
 * @param {String} filePath - Path file yang akan divalidasi
 * @returns {Promise<Boolean>} True jika valid
 */
const validateImage = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return metadata && metadata.width && metadata.height;
  } catch (error) {
    return false;
  }
};

module.exports = {
  compressImage,
  compressSelfiePhoto,
  compressProfilePhoto,
  validateImage
};
