/**
 * Haversine Formula
 * Menghitung jarak antara dua titik koordinat (latitude, longitude)
 * dalam satuan meter
 * 
 * @param {number} lat1 - Latitude titik 1
 * @param {number} lon1 - Longitude titik 1
 * @param {number} lat2 - Latitude titik 2
 * @param {number} lon2 - Longitude titik 2
 * @returns {number} Jarak dalam meter
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ dalam radian
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // dalam meter
  
  return distance;
}

/**
 * Validasi apakah koordinat berada dalam radius yang ditentukan
 * 
 * @param {number} userLat - Latitude user
 * @param {number} userLon - Longitude user
 * @param {number} officeLat - Latitude kantor
 * @param {number} officeLon - Longitude kantor
 * @param {number} radius - Radius dalam meter
 * @returns {Object} { isValid: boolean, distance: number }
 */
function isWithinRadius(userLat, userLon, officeLat, officeLon, radius) {
  const distance = calculateDistance(userLat, userLon, officeLat, officeLon);
  
  return {
    isValid: distance <= radius,
    distance: Math.round(distance * 100) / 100 // Pembulatan 2 desimal
  };
}

/**
 * Validasi akurasi GPS
 * 
 * @param {number} accuracy - Akurasi GPS dalam meter
 * @param {number} maxAccuracy - Maksimal akurasi yang diizinkan
 * @returns {boolean}
 */
function isValidGPSAccuracy(accuracy, maxAccuracy = 50) {
  return accuracy <= maxAccuracy;
}

module.exports = {
  calculateDistance,
  isWithinRadius,
  isValidGPSAccuracy
};
