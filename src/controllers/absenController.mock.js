const { isWithinRadius, isValidGPSAccuracy } = require('../utils/haversine');
const { checkLateArrival, checkEarlyCheckout, calculateWorkDuration, hasAbsenToday } = require('../utils/timeValidator');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response');

/**
 * IMPORTANT: Controller ini adalah TEMPLATE
 * 
 * Anda perlu mengintegrasikan dengan database (MySQL/PostgreSQL)
 * Gunakan library seperti:
 * - mysql2 (untuk MySQL)
 * - pg (untuk PostgreSQL)
 * - sequelize (ORM)
 * - knex (Query Builder)
 * 
 * Contoh data yang perlu disimpan di database:
 * - users (id, name, email, password, role, office_lat, office_lon, shift_start, shift_end)
 * - attendance (id, user_id, check_in_time, check_out_time, check_in_photo, check_out_photo, 
 *              check_in_lat, check_in_lon, check_out_lat, check_out_lon, status, distance, duration)
 */

// MOCK DATA - Ganti dengan query database
const mockUsers = [];
const mockAttendance = [];

/**
 * Controller: Absen Masuk
 */
const checkIn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { latitude, longitude, accuracy } = req.body;
    const photo = req.file;
    const userAgent = req.headers['user-agent'];
    const timestamp = new Date();
    
    // TODO: Ambil data user dari database
    // const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // TODO: Cek apakah sudah absen masuk hari ini
    // const todayAttendance = await db.query('SELECT * FROM attendance WHERE user_id = ? AND DATE(check_in_time) = CURDATE()', [userId]);
    const todayAttendance = mockAttendance.find(a => 
      a.userId === userId && hasAbsenToday(a.checkInTime)
    );
    
    if (todayAttendance) {
      return errorResponse(res, 'Anda sudah absen masuk hari ini', 400);
    }
    
    // Validasi GPS Accuracy
    const maxAccuracy = parseInt(process.env.MAX_GPS_ACCURACY) || 50;
    if (!isValidGPSAccuracy(parseFloat(accuracy), maxAccuracy)) {
      return validationErrorResponse(res, [
        { field: 'accuracy', message: `GPS accuracy terlalu buruk (${accuracy}m). Maksimal ${maxAccuracy}m` }
      ]);
    }
    
    // Ambil lokasi kantor (bisa dari user atau dari env)
    const officeLat = parseFloat(user.officeLat || process.env.OFFICE_LATITUDE);
    const officeLon = parseFloat(user.officeLon || process.env.OFFICE_LONGITUDE);
    const officeRadius = parseInt(user.officeRadius || process.env.OFFICE_RADIUS);
    
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
        `Anda berada di luar radius kantor. Jarak Anda: ${locationCheck.distance}m (max: ${officeRadius}m)`, 
        400
      );
    }
    
    // Cek keterlambatan
    const shiftStart = user.shiftStart || '08:00';
    const lateCheck = checkLateArrival(timestamp, shiftStart);
    
    const status = lateCheck.isLate ? 'Late' : 'On Time';
    
    // TODO: Simpan ke database
    // await db.query(`
    //   INSERT INTO attendance 
    //   (user_id, check_in_time, check_in_lat, check_in_lon, check_in_photo, check_in_accuracy, 
    //    distance, status, device_info) 
    //   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    // `, [userId, timestamp, latitude, longitude, photo.filename, accuracy, locationCheck.distance, status, userAgent]);
    
    const attendanceRecord = {
      id: mockAttendance.length + 1,
      userId,
      checkInTime: timestamp,
      checkInLat: latitude,
      checkInLon: longitude,
      checkInPhoto: photo.filename,
      checkInAccuracy: accuracy,
      distance: locationCheck.distance,
      status,
      deviceInfo: userAgent,
      lateMinutes: lateCheck.lateMinutes
    };
    
    mockAttendance.push(attendanceRecord);
    
    return successResponse(res, {
      attendanceId: attendanceRecord.id,
      checkInTime: timestamp,
      status,
      distance: `${locationCheck.distance}m`,
      lateMinutes: lateCheck.lateMinutes,
      photo: photo.filename
    }, 'Absen masuk berhasil', 201);
    
  } catch (error) {
    console.error('Error check in:', error);
    return errorResponse(res, 'Gagal melakukan absen masuk');
  }
};

/**
 * Controller: Absen Pulang
 */
const checkOut = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { latitude, longitude, accuracy } = req.body;
    const photo = req.file;
    const timestamp = new Date();
    
    // TODO: Cek absensi hari ini
    // const todayAttendance = await db.query('SELECT * FROM attendance WHERE user_id = ? AND DATE(check_in_time) = CURDATE()', [userId]);
    const todayAttendance = mockAttendance.find(a => 
      a.userId === userId && hasAbsenToday(a.checkInTime)
    );
    
    if (!todayAttendance) {
      return errorResponse(res, 'Anda belum absen masuk hari ini', 400);
    }
    
    if (todayAttendance.checkOutTime) {
      return errorResponse(res, 'Anda sudah absen pulang hari ini', 400);
    }
    
    // TODO: Ambil data user dari database
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return errorResponse(res, 'User tidak ditemukan', 404);
    }
    
    // Validasi GPS Accuracy
    const maxAccuracy = parseInt(process.env.MAX_GPS_ACCURACY) || 50;
    if (!isValidGPSAccuracy(parseFloat(accuracy), maxAccuracy)) {
      return validationErrorResponse(res, [
        { field: 'accuracy', message: `GPS accuracy terlalu buruk (${accuracy}m). Maksimal ${maxAccuracy}m` }
      ]);
    }
    
    // Ambil lokasi kantor
    const officeLat = parseFloat(user.officeLat || process.env.OFFICE_LATITUDE);
    const officeLon = parseFloat(user.officeLon || process.env.OFFICE_LONGITUDE);
    const officeRadius = parseInt(user.officeRadius || process.env.OFFICE_RADIUS);
    
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
        `Anda berada di luar radius kantor. Jarak Anda: ${locationCheck.distance}m (max: ${officeRadius}m)`, 
        400
      );
    }
    
    // Cek pulang lebih awal
    const shiftEnd = user.shiftEnd || '17:00';
    const earlyCheck = checkEarlyCheckout(timestamp, shiftEnd);
    
    // Hitung durasi kerja
    const duration = calculateWorkDuration(
      new Date(todayAttendance.checkInTime),
      timestamp
    );
    
    let status = todayAttendance.status; // Keep the original status (Late/On Time)
    if (earlyCheck.isEarly) {
      status = status + ', Early Checkout';
    }
    
    // TODO: Update database
    // await db.query(`
    //   UPDATE attendance 
    //   SET check_out_time = ?, check_out_lat = ?, check_out_lon = ?, 
    //       check_out_photo = ?, check_out_accuracy = ?, duration = ?, status = ?
    //   WHERE id = ?
    // `, [timestamp, latitude, longitude, photo.filename, accuracy, duration, status, todayAttendance.id]);
    
    todayAttendance.checkOutTime = timestamp;
    todayAttendance.checkOutLat = latitude;
    todayAttendance.checkOutLon = longitude;
    todayAttendance.checkOutPhoto = photo.filename;
    todayAttendance.checkOutAccuracy = accuracy;
    todayAttendance.duration = duration;
    todayAttendance.status = status;
    todayAttendance.earlyMinutes = earlyCheck.earlyMinutes;
    
    return successResponse(res, {
      attendanceId: todayAttendance.id,
      checkInTime: todayAttendance.checkInTime,
      checkOutTime: timestamp,
      duration: `${Math.floor(duration / 60)} jam ${duration % 60} menit`,
      status,
      earlyMinutes: earlyCheck.earlyMinutes,
      photo: photo.filename
    }, 'Absen pulang berhasil');
    
  } catch (error) {
    console.error('Error check out:', error);
    return errorResponse(res, 'Gagal melakukan absen pulang');
  }
};

/**
 * Controller: Riwayat Absensi User
 */
const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, limit = 30 } = req.query;
    
    // TODO: Query database dengan filter
    // const attendance = await db.query(`
    //   SELECT * FROM attendance 
    //   WHERE user_id = ? 
    //   AND DATE(check_in_time) BETWEEN ? AND ?
    //   ORDER BY check_in_time DESC 
    //   LIMIT ?
    // `, [userId, startDate, endDate, limit]);
    
    let attendance = mockAttendance.filter(a => a.userId === userId);
    
    // Filter by date if provided
    if (startDate && endDate) {
      attendance = attendance.filter(a => {
        const date = new Date(a.checkInTime);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
    
    // Sort by date desc
    attendance.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
    
    // Limit
    attendance = attendance.slice(0, parseInt(limit));
    
    return successResponse(res, {
      total: attendance.length,
      attendance
    });
    
  } catch (error) {
    console.error('Error get attendance:', error);
    return errorResponse(res, 'Gagal mengambil data absensi');
  }
};

/**
 * Controller: Absensi Hari Ini
 */
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // TODO: Query database
    // const attendance = await db.query('SELECT * FROM attendance WHERE user_id = ? AND DATE(check_in_time) = CURDATE()', [userId]);
    
    const attendance = mockAttendance.find(a => 
      a.userId === userId && hasAbsenToday(a.checkInTime)
    );
    
    if (!attendance) {
      return successResponse(res, {
        hasCheckedIn: false,
        hasCheckedOut: false,
        attendance: null
      }, 'Belum ada absensi hari ini');
    }
    
    return successResponse(res, {
      hasCheckedIn: true,
      hasCheckedOut: !!attendance.checkOutTime,
      attendance
    });
    
  } catch (error) {
    console.error('Error get today attendance:', error);
    return errorResponse(res, 'Gagal mengambil data absensi hari ini');
  }
};

/**
 * Controller: Semua Absensi (Admin/HRD)
 */
const getAllAttendance = async (req, res) => {
  try {
    const { startDate, endDate, userId, status, limit = 100 } = req.query;
    
    // TODO: Query database dengan filter
    let attendance = [...mockAttendance];
    
    // Filter
    if (userId) {
      attendance = attendance.filter(a => a.userId == userId);
    }
    
    if (status) {
      attendance = attendance.filter(a => a.status.includes(status));
    }
    
    if (startDate && endDate) {
      attendance = attendance.filter(a => {
        const date = new Date(a.checkInTime);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
    
    attendance.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
    attendance = attendance.slice(0, parseInt(limit));
    
    return successResponse(res, {
      total: attendance.length,
      attendance
    });
    
  } catch (error) {
    console.error('Error get all attendance:', error);
    return errorResponse(res, 'Gagal mengambil data absensi');
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getTodayAttendance,
  getAllAttendance
};
