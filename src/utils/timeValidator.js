/**
 * Utility untuk validasi waktu absensi
 */

/**
 * Cek apakah terlambat masuk
 * 
 * @param {Date} actualTime - Waktu absensi aktual
 * @param {string} shiftStartTime - Waktu mulai shift (format: "08:00")
 * @returns {Object} { isLate: boolean, lateMinutes: number }
 */
function checkLateArrival(actualTime, shiftStartTime) {
  const [hours, minutes] = shiftStartTime.split(':').map(Number);
  
  const shiftStart = new Date(actualTime);
  shiftStart.setHours(hours, minutes, 0, 0);
  
  const diffMs = actualTime - shiftStart;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  return {
    isLate: diffMinutes > 0,
    lateMinutes: diffMinutes > 0 ? diffMinutes : 0
  };
}

/**
 * Cek apakah pulang lebih awal
 * 
 * @param {Date} actualTime - Waktu checkout aktual
 * @param {string} shiftEndTime - Waktu selesai shift (format: "17:00")
 * @returns {Object} { isEarly: boolean, earlyMinutes: number }
 */
function checkEarlyCheckout(actualTime, shiftEndTime) {
  const [hours, minutes] = shiftEndTime.split(':').map(Number);
  
  const shiftEnd = new Date(actualTime);
  shiftEnd.setHours(hours, minutes, 0, 0);
  
  const diffMs = shiftEnd - actualTime;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  return {
    isEarly: diffMinutes > 0,
    earlyMinutes: diffMinutes > 0 ? diffMinutes : 0
  };
}

/**
 * Hitung durasi kerja dalam menit
 * 
 * @param {Date} checkInTime - Waktu masuk
 * @param {Date} checkOutTime - Waktu pulang
 * @returns {number} Durasi dalam menit
 */
function calculateWorkDuration(checkInTime, checkOutTime) {
  const diffMs = checkOutTime - checkInTime;
  return Math.floor(diffMs / 60000);
}

/**
 * Format durasi menjadi string jam:menit
 * 
 * @param {number} minutes - Durasi dalam menit
 * @returns {string} Format "X jam Y menit"
 */
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours} jam ${mins} menit`;
}

/**
 * Cek apakah hari ini user sudah absen
 * 
 * @param {Date} lastAbsenDate - Tanggal absen terakhir
 * @returns {boolean}
 */
function hasAbsenToday(lastAbsenDate) {
  if (!lastAbsenDate) return false;
  
  const today = new Date();
  const lastDate = new Date(lastAbsenDate);
  
  return (
    today.getFullYear() === lastDate.getFullYear() &&
    today.getMonth() === lastDate.getMonth() &&
    today.getDate() === lastDate.getDate()
  );
}

module.exports = {
  checkLateArrival,
  checkEarlyCheckout,
  calculateWorkDuration,
  formatDuration,
  hasAbsenToday
};
