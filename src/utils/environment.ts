import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid PostgreSQL connection string')
    .refine(url => url.startsWith('postgresql://'), {
      message: 'DATABASE_URL must be a PostgreSQL connection string'
    }),

  // JWT Configuration
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long')
    .refine(secret => secret !== 'your-super-secret-jwt-key-change-this-in-production-abc123', {
      message: 'JWT_SECRET must be changed from the default value'
    }),

  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN must be in format like "15m", "1h", "24h", "7d"')
    .default('15m'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long')
    .refine(secret => secret !== 'your-super-secret-refresh-key-change-this-in-production-xyz789', {
      message: 'JWT_REFRESH_SECRET must be changed from the default value'
    }),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_REFRESH_EXPIRES_IN must be in format like "15m", "1h", "24h", "7d"')
    .default('7d'),

  // Server Configuration
  PORT: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(port => port > 0 && port < 65536, 'PORT must be between 1 and 65535')
    .default('3000'),

  HOST: z
    .string()
    .default('0.0.0.0'),

  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),

  // CORS Configuration
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://localhost:3001'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'RATE_LIMIT_WINDOW_MS must be a positive number')
    .default('900000'),

  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'RATE_LIMIT_MAX_REQUESTS must be a positive number')
    .default('100'),

  // Optional configurations
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default('info'),

  ENABLE_REQUEST_LOGGING: z
    .string()
    .transform(val => val === 'true')
    .default('true'),

  WS_MAX_CONNECTIONS_PER_USER: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'WS_MAX_CONNECTIONS_PER_USER must be a positive number')
    .default('5'),

  WS_HEARTBEAT_INTERVAL: z
    .string()
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'WS_HEARTBEAT_INTERVAL must be a positive number')
    .default('30000'),

  SESSION_SECRET: z
    .string()
    .min(16, 'SESSION_SECRET must be at least 16 characters long')
    .optional(),

  FORCE_HTTPS: z
    .string()
    .transform(val => val === 'true')
    .default('false'),

  TRUST_PROXY: z
    .string()
    .transform(val => val === 'true')
    .default('false'),

  ENABLE_API_DOCS: z
    .string()
    .transform(val => val === 'true')
    .default('true'),

  ENABLE_DETAILED_ERRORS: z
    .string()
    .transform(val => val === 'true')
    .default('true'),

  REDIS_URL: z
    .string()
    .url('REDIS_URL must be a valid Redis connection string')
    .optional(),

  SENTRY_DSN: z
    .string()
    .url('SENTRY_DSN must be a valid URL')
    .optional()
});

export type Environment = z.infer<typeof envSchema>;

class EnvironmentValidator {
  private static instance: Environment | null = null;

  static validate(): Environment {
    if (this.instance) {
      return this.instance;
    }

    try {
      this.instance = envSchema.parse(process.env);
      return this.instance;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Environment validation failed:');
        error.errors.forEach(err => {
          console.error(`   • ${err.path.join('.')}: ${err.message}`);
        });
        
        console.error('\n💡 Tips:');
        console.error('   • Copy .env.example to .env');
        console.error('   • Generate secure JWT secrets:');
        console.error('     node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
        console.error('   • Check your DATABASE_URL format');
        
        process.exit(1);
      }
      throw error;
    }
  }

  static get(): Environment {
    if (!this.instance) {
      throw new Error('Environment not validated. Call validate() first.');
    }
    return this.instance;
  }

  static isDevelopment(): boolean {
    return this.get().NODE_ENV === 'development';
  }

  static isProduction(): boolean {
    return this.get().NODE_ENV === 'production';
  }

  static isTest(): boolean {
    return this.get().NODE_ENV === 'test';
  }

  static getJWTConfig() {
    const env = this.get();
    return {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshSecret: env.JWT_REFRESH_SECRET,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
    };
  }

  static getDatabaseConfig() {
    const env = this.get();
    return {
      url: env.DATABASE_URL
    };
  }

  static getServerConfig() {
    const env = this.get();
    return {
      port: env.PORT,
      host: env.HOST,
      corsOrigin: env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    };
  }

  static getRateLimitConfig() {
    const env = this.get();
    return {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS
    };
  }

  static getWebSocketConfig() {
    const env = this.get();
    return {
      maxConnectionsPerUser: env.WS_MAX_CONNECTIONS_PER_USER,
      heartbeatInterval: env.WS_HEARTBEAT_INTERVAL
    };
  }

  static printSummary() {
    const env = this.get();
    console.log('🔧 Environment Configuration:');
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Server: ${env.HOST}:${env.PORT}`);
    console.log(`   Database: ${env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@')}`);
    console.log(`   CORS Origins: ${env.CORS_ORIGIN.split(',').length} configured`);
    console.log(`   Rate Limit: ${env.RATE_LIMIT_MAX_REQUESTS} requests per ${env.RATE_LIMIT_WINDOW_MS / 1000}s`);
    
    if (env.REDIS_URL) {
      console.log(`   Redis: ${env.REDIS_URL.replace(/\/\/.*@/, '//***:***@')}`);
    }
    
    console.log(`   JWT Expiry: ${env.JWT_EXPIRES_IN} (refresh: ${env.JWT_REFRESH_EXPIRES_IN})`);
    console.log('');
  }
}

export default EnvironmentValidator;
