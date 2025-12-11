require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const db = require('./config/database');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check allowed origins
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files - Serve uploaded photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logger (Development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Absensi - Documentation'
}));

// Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Absensi Karyawan',
    version: '1.0.0',
    documentation: '/api-docs',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/absen', require('./routes/absen'));
app.use('/api/users', require('./routes/user'));

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER
// ============================================

const PORT = process.env.PORT || 5000;

// Test database connection
(async () => {
  try {
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log(`📊 Database time: ${result.rows[0].current_time}`);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('⚠️  Server tetap berjalan, tapi fitur database tidak tersedia');
  }
})();

app.listen(PORT, () => {
  console.log('================================================');
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Upload Path: ${process.env.UPLOAD_PATH || './src/uploads'}`);
  console.log('================================================');
  console.log('\n📋 Endpoints:');
  console.log('   AUTH:');
  console.log('   - POST   /api/auth/login');
  console.log('   - POST   /api/auth/refresh');
  console.log('   - POST   /api/auth/logout');
  console.log('   - GET    /api/auth/profile');
  console.log('   - PUT    /api/auth/profile');
  console.log('   - PUT    /api/auth/change-password');
  console.log('\n   ABSENSI:');
  console.log('   - POST   /api/absen/check-in');
  console.log('   - POST   /api/absen/check-out');
  console.log('   - GET    /api/absen/my-attendance');
  console.log('   - GET    /api/absen/today');
  console.log('   - GET    /api/absen/all (Admin/HRD)');
  console.log('\n   USER MANAGEMENT:');
  console.log('   - GET    /api/users (Admin/HRD)');
  console.log('   - GET    /api/users/:id (Admin/HRD)');
  console.log('   - POST   /api/users (Admin)');
  console.log('   - PUT    /api/users/:id (Admin)');
  console.log('   - DELETE /api/users/:id (Admin)');
  console.log('   - PUT    /api/users/:id/reset-password (Admin)');
  console.log('   - POST   /api/users/:id/photo');
  console.log('\n================================================\n');
});

module.exports = app;
