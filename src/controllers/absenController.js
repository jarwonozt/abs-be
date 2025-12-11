const db = require('../config/database');
const { isWithinRadius, isValidGPSAccuracy } = require('../utils/haversine');
const { checkLateArrival, checkEarlyCheckout, calculateWorkDuration } = require('../utils/timeValidator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');

/**
 * Controller: Absen Masuk
 * @route POST /api/absen/check-in
 */
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, accuracy } = req.body;
    const photo = req.file;
    const userAgent = req.headers['user-agent'];
    const timestamp = new Date();
    
    // Validasi foto harus ada
    if (!photo) {
      return validationErrorResponse(res, 'Foto selfie wajib diupload');
    }
    
    // Ambil data user dari database
    const userResult = await db.query(
      'SELECT id, name, office_lat, office_lon, office_radius, shift_start FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0];
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Cek apakah sudah absen masuk hari ini
    const todayCheck = await db.query(
      `SELECT id FROM attendance 
       WHERE user_id = $1 
       AND DATE(check_in_time) = CURRENT_DATE`,
      [userId]
    );
    
    if (todayCheck.rows.length > 0) {
      return errorResponse(res, 'Anda sudah absen masuk hari ini', 400);
    }
    
    // Validasi GPS Accuracy
    const maxAccuracy = parseInt(process.env.MAX_GPS_ACCURACY) || 50;
    if (!isValidGPSAccuracy(parseFloat(accuracy), maxAccuracy)) {
      return validationErrorResponse(res, 
        `GPS accuracy terlalu buruk (${accuracy}m). Maksimal ${maxAccuracy}m`
      );
    }
    
    // Ambil lokasi kantor
    const officeLat = parseFloat(user.office_lat || process.env.OFFICE_LATITUDE);
    const officeLon = parseFloat(user.office_lon || process.env.OFFICE_LONGITUDE);
    const officeRadius = parseInt(user.office_radius || process.env.OFFICE_RADIUS);
    
    // Validasi Radius Lokasi
    const locationCheck = isWithinRadius(
      parseFloat(latitude),
      parseFloat(longitude),
      officeLat,
      officeLon,
      officeRadius
    );
    
    if (!locationCheck.isValid) {
      return errorResponse(res, 
        `Anda berada di luar radius kantor. Jarak Anda: ${locationCheck.distance.toFixed(0)}m (max: ${officeRadius}m)`, 
        400
      );
    }
    
    // Cek keterlambatan
    const lateCheck = checkLateArrival(timestamp, user.shift_start);
    
    // Simpan foto dengan nama file saja (sudah disimpan ke /uploads/selfie/ oleh multer)
    const photoFilename = photo.filename; // Format: selfie_userId_timestamp.ext
    
    // Simpan data absen ke database
    const result = await db.query(
      `INSERT INTO attendance (
        user_id, check_in_time, check_in_lat, check_in_lon, 
        check_in_photo, check_in_accuracy, distance, 
        status, device_info, late_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        timestamp,
        parseFloat(latitude),
        parseFloat(longitude),
        photoFilename,
        parseFloat(accuracy),
        locationCheck.distance,
        lateCheck.isLate ? 'Terlambat' : 'Hadir',
        userAgent,
        lateCheck.lateMinutes
      ]
    );
    
    const attendance = result.rows[0];
    
    // Log compression info jika ada
    if (req.compressionInfo) {
      console.log(`📸 Photo compressed: ${req.compressionInfo.originalSize} → ${req.compressionInfo.compressedSize} bytes (${req.compressionInfo.reduction}% reduction)`);
    }
    
    return successResponse(res, {
      id: attendance.id,
      checkInTime: attendance.check_in_time,
      photo: `/uploads/selfie/${photoFilename}`,
      distance: `${locationCheck.distance.toFixed(0)}m`,
      status: attendance.status,
      late: lateCheck.isLate,
      lateMinutes: lateCheck.lateMinutes,
      message: lateCheck.isLate 
        ? `Anda terlambat ${lateCheck.lateMinutes} menit` 
        : 'Absen masuk berhasil'
    }, 'Check-in berhasil');
    
  } catch (error) {
    console.error('Check-in error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat absen masuk');
  }
};

/**
 * Controller: Absen Pulang
 * @route POST /api/absen/check-out
 */
exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, accuracy } = req.body;
    const photo = req.file;
    const userAgent = req.headers['user-agent'];
    const timestamp = new Date();
    
    // Validasi foto harus ada
    if (!photo) {
      return validationErrorResponse(res, 'Foto selfie wajib diupload');
    }
    
    // Ambil data user dari database
    const userResult = await db.query(
      'SELECT id, name, office_lat, office_lon, office_radius, shift_end FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0];
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Cek apakah sudah check-in hari ini
    const todayAttendance = await db.query(
      `SELECT * FROM attendance 
       WHERE user_id = $1 
       AND DATE(check_in_time) = CURRENT_DATE
       AND check_out_time IS NULL`,
      [userId]
    );
    
    if (todayAttendance.rows.length === 0) {
      return errorResponse(res, 'Anda belum absen masuk hari ini atau sudah absen pulang', 400);
    }
    
    const attendance = todayAttendance.rows[0];
    
    // Validasi GPS Accuracy
    const maxAccuracy = parseInt(process.env.MAX_GPS_ACCURACY) || 50;
    if (!isValidGPSAccuracy(parseFloat(accuracy), maxAccuracy)) {
      return validationErrorResponse(res, 
        `GPS accuracy terlalu buruk (${accuracy}m). Maksimal ${maxAccuracy}m`
      );
    }
    
    // Ambil lokasi kantor
    const officeLat = parseFloat(user.office_lat || process.env.OFFICE_LATITUDE);
    const officeLon = parseFloat(user.office_lon || process.env.OFFICE_LONGITUDE);
    const officeRadius = parseInt(user.office_radius || process.env.OFFICE_RADIUS);
    
    // Validasi Radius Lokasi
    const locationCheck = isWithinRadius(
      parseFloat(latitude),
      parseFloat(longitude),
      officeLat,
      officeLon,
      officeRadius
    );
    
    if (!locationCheck.isValid) {
      return errorResponse(res, 
        `Anda berada di luar radius kantor. Jarak Anda: ${locationCheck.distance.toFixed(0)}m (max: ${officeRadius}m)`, 
        400
      );
    }
    
    // Cek pulang cepat
    const earlyCheck = checkEarlyCheckout(timestamp, user.shift_end);
    
    // Hitung durasi kerja
    const durationMinutes = calculateWorkDuration(
      attendance.check_in_time,
      timestamp
    );
    
    // Simpan foto dengan nama file saja
    const photoFilename = photo.filename; // Format: selfie_userId_timestamp.ext
    
    // Update data absen di database
    const result = await db.query(
      `UPDATE attendance 
       SET check_out_time = $1,
           check_out_lat = $2,
           check_out_lon = $3,
           check_out_photo = $4,
           check_out_accuracy = $5,
           duration = $6,
           early_minutes = $7,
           status = $8
       WHERE id = $9
       RETURNING *`,
      [
        timestamp,
        parseFloat(latitude),
        parseFloat(longitude),
        photoFilename,
        parseFloat(accuracy),
        durationMinutes,
        earlyCheck.earlyMinutes,
        earlyCheck.isEarly ? 'Pulang Cepat' : (attendance.status === 'Terlambat' ? 'Terlambat' : 'Hadir')
        ,
        attendance.id
      ]
    );
    
    const updatedAttendance = result.rows[0];
    
    // Log compression info jika ada
    if (req.compressionInfo) {
      console.log(`📸 Photo compressed: ${req.compressionInfo.originalSize} → ${req.compressionInfo.compressedSize} bytes (${req.compressionInfo.reduction}% reduction)`);
    }
    
    return successResponse(res, {
      id: updatedAttendance.id,
      checkInTime: updatedAttendance.check_in_time,
      checkOutTime: updatedAttendance.check_out_time,
      checkOutPhoto: `/uploads/selfie/${photoFilename}`,
      distance: `${locationCheck.distance.toFixed(0)}m`,
      duration: `${Math.floor(durationMinutes / 60)} jam ${durationMinutes % 60} menit`,
      status: updatedAttendance.status,
      early: earlyCheck.isEarly,
      earlyMinutes: earlyCheck.earlyMinutes,
      message: earlyCheck.isEarly 
        ? `Anda pulang ${earlyCheck.earlyMinutes} menit lebih awal` 
        : 'Absen pulang berhasil'
    }, 'Check-out berhasil');
    
  } catch (error) {
    console.error('Check-out error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat absen pulang');
  }
};

/**
 * Controller: Riwayat Absensi User Sendiri
 * @route GET /api/absen/my-attendance
 */
exports.getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;
    
    let query = `
      SELECT id, check_in_time, check_out_time, 
             check_in_photo, check_out_photo,
             check_in_lat, check_in_lon,
             check_out_lat, check_out_lon,
             distance, duration, status, 
             late_minutes, early_minutes,
             created_at
      FROM attendance 
      WHERE user_id = $1
    `;
    
    const params = [userId];
    
    if (startDate) {
      params.push(startDate);
      query += ` AND DATE(check_in_time) >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND DATE(check_in_time) <= $${params.length}`;
    }
    
    query += ` ORDER BY check_in_time DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await db.query(query, params);
    
    // Format response dengan URL foto
    const attendance = result.rows.map(a => ({
      ...a,
      check_in_photo: a.check_in_photo ? `/uploads/selfie/${a.check_in_photo}` : null,
      check_out_photo: a.check_out_photo ? `/uploads/selfie/${a.check_out_photo}` : null,
      duration_formatted: a.duration ? `${Math.floor(a.duration / 60)} jam ${a.duration % 60} menit` : null
    }));
    
    return successResponse(res, {
      total: result.rows.length,
      attendance
    }, 'Berhasil mengambil riwayat absensi');
    
  } catch (error) {
    console.error('Get my attendance error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data absensi');
  }
};

/**
 * Controller: Absensi Hari Ini
 * @route GET /api/absen/today
 */
exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      `SELECT a.*, u.name as user_name
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = $1 
       AND DATE(a.check_in_time) = CURRENT_DATE`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return successResponse(res, {
        hasCheckedIn: false,
        message: 'Anda belum absen hari ini'
      }, 'Data absensi hari ini');
    }
    
    const attendance = result.rows[0];
    
    return successResponse(res, {
      hasCheckedIn: true,
      hasCheckedOut: !!attendance.check_out_time,
      attendance: {
        ...attendance,
        check_in_photo: attendance.check_in_photo ? `/uploads/selfie/${attendance.check_in_photo}` : null,
        check_out_photo: attendance.check_out_photo ? `/uploads/selfie/${attendance.check_out_photo}` : null,
        duration_formatted: attendance.duration ? `${Math.floor(attendance.duration / 60)} jam ${attendance.duration % 60} menit` : null
      }
    }, 'Data absensi hari ini');
    
  } catch (error) {
    console.error('Get today attendance error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data absensi');
  }
};

/**
 * Controller: Semua Absensi (Admin/HRD)
 * @route GET /api/absen/all
 */
exports.getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId, status, limit = 100 } = req.query;
    
    let query = `
      SELECT a.*, u.name as user_name, u.email, u.role
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (userId) {
      params.push(userId);
      query += ` AND a.user_id = $${params.length}`;
    }
    
    if (startDate) {
      params.push(startDate);
      query += ` AND DATE(a.check_in_time) >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(endDate);
      query += ` AND DATE(a.check_in_time) <= $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    
    query += ` ORDER BY a.check_in_time DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await db.query(query, params);
    
    // Format response dengan URL foto
    const attendance = result.rows.map(a => ({
      ...a,
      check_in_photo: a.check_in_photo ? `/uploads/selfie/${a.check_in_photo}` : null,
      check_out_photo: a.check_out_photo ? `/uploads/selfie/${a.check_out_photo}` : null,
      duration_formatted: a.duration ? `${Math.floor(a.duration / 60)} jam ${a.duration % 60} menit` : null
    }));
    
    return successResponse(res, {
      total: result.rows.length,
      attendance
    }, 'Berhasil mengambil data absensi');
    
  } catch (error) {
    console.error('Get all attendance error:', error);
    return errorResponse(res, 'Terjadi kesalahan saat mengambil data absensi');
  }
};
