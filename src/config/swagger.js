const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Absensi Karyawan',
      version: '1.0.0',
      description: 'Backend API untuk sistem absensi karyawan dengan fitur GPS tracking, upload foto selfie, dan manajemen user.',
      contact: {
        name: 'API Support',
        email: 'support@absensi.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.absensi.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan access token JWT yang didapat dari endpoint login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Admin'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@test.com'
            },
            role: {
              type: 'string',
              enum: ['admin', 'hrd', 'karyawan'],
              example: 'admin'
            },
            phone: {
              type: 'string',
              example: '081234567890'
            },
            address: {
              type: 'string',
              example: 'Jakarta'
            },
            office_lat: {
              type: 'number',
              format: 'float',
              example: -6.200000
            },
            office_lon: {
              type: 'number',
              format: 'float',
              example: 106.816666
            },
            office_radius: {
              type: 'integer',
              example: 100
            },
            shift_start: {
              type: 'string',
              format: 'time',
              example: '08:00:00'
            },
            shift_end: {
              type: 'string',
              format: 'time',
              example: '17:00:00'
            },
            photo: {
              type: 'string',
              nullable: true,
              example: '/uploads/profile/profile_1_1234567890.jpg'
            },
            is_active: {
              type: 'boolean',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Attendance: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            user_id: {
              type: 'integer',
              example: 1
            },
            check_in_time: {
              type: 'string',
              format: 'date-time'
            },
            check_in_lat: {
              type: 'number',
              format: 'float',
              example: -6.200000
            },
            check_in_lon: {
              type: 'number',
              format: 'float',
              example: 106.816666
            },
            check_in_photo: {
              type: 'string',
              example: '/uploads/selfie/selfie_1_1234567890.jpg'
            },
            check_in_accuracy: {
              type: 'number',
              format: 'float',
              example: 20.5
            },
            check_out_time: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            check_out_lat: {
              type: 'number',
              format: 'float',
              nullable: true
            },
            check_out_lon: {
              type: 'number',
              format: 'float',
              nullable: true
            },
            check_out_photo: {
              type: 'string',
              nullable: true
            },
            check_out_accuracy: {
              type: 'number',
              format: 'float',
              nullable: true
            },
            distance: {
              type: 'number',
              format: 'float',
              example: 45.5
            },
            duration: {
              type: 'integer',
              description: 'Durasi kerja dalam menit',
              example: 480
            },
            status: {
              type: 'string',
              enum: ['Hadir', 'Terlambat', 'Pulang Cepat'],
              example: 'Hadir'
            },
            late_minutes: {
              type: 'integer',
              example: 0
            },
            early_minutes: {
              type: 'integer',
              example: 0
            },
            device_info: {
              type: 'string',
              nullable: true
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'object',
              nullable: true
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Success message'
            },
            data: {
              type: 'object'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoint untuk autentikasi user (login, logout, dll)'
      },
      {
        name: 'Absensi',
        description: 'Endpoint untuk absensi karyawan (check-in, check-out, riwayat)'
      },
      {
        name: 'User Management',
        description: 'Endpoint untuk manajemen user (CRUD, reset password)'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
