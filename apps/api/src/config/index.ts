import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.API_PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // URLs
  webUrl: process.env.WEB_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:4000',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://blind_user:blind_password@localhost:5432/blind_db',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Email
  email: {
    from: process.env.EMAIL_FROM || 'noreply@blind-platform.com',
    awsRegion: process.env.AWS_REGION || 'ap-northeast-2',
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // S3
  s3: {
    bucket: process.env.S3_BUCKET || 'blind-uploads',
    region: process.env.S3_REGION || 'ap-northeast-2',
    cloudfrontUrl: process.env.CLOUDFRONT_URL,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // 1000 per minute
  },

  // Auth
  auth: {
    verificationCodeExpiryMinutes: 10,
    tempTokenExpiryMinutes: 30,
    sessionExpiryDays: 7,
    maxLoginAttempts: 5,
    loginLockoutMinutes: 15,
  },
} as const;

export default config;
