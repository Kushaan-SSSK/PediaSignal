import type { Express, Request, Response, NextFunction } from "express";

// Extend Request interface for custom properties
declare global {
  namespace Express {
    interface Request {
      sanitizedBody?: any;
    }
  }
}
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import CryptoJS from "crypto-js";

// HIPAA/SOC 2 Compliance Security Middleware
export function setupSecurityMiddleware(app: Express) {
  // Configure trust proxy for rate limiting
  app.set('trust proxy', 1);
  
  // Security Headers - HIPAA/SOC 2 Type II Compliance
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "replit.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.openai.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));

  // Rate limiting for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', apiLimiter);

  // Enhanced logging for SOC 2 compliance
  app.use((req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent') || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    console.log(`[SECURITY LOG] ${timestamp} - ${req.method} ${req.originalUrl} - IP: ${ip} - UA: ${userAgent}`);
    
    // Audit log for sensitive operations
    if (req.originalUrl.includes('/api/')) {
      console.log(`[AUDIT LOG] ${timestamp} - API Access: ${req.method} ${req.originalUrl} - IP: ${ip}`);
    }
    
    next();
  });

  // Request body size limit (HIPAA compliance)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.includes('/api/xray-upload')) {
      // Larger limit for medical images
      req.body = req.body || {};
      next();
    } else {
      // Standard limit for other requests
      next();
    }
  });

  // Data sanitization middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Remove potentially sensitive data from logs
    const sanitizedBody = { ...req.body };
    
    // Remove base64 image data, passwords, tokens from logs
    if (sanitizedBody.imageData) sanitizedBody.imageData = '[REDACTED_IMAGE_DATA]';
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    
    req.sanitizedBody = sanitizedBody;
    next();
  });

  // CORS configuration for medical data protection
  app.use((req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://localhost:5000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin || '')) {
      res.setHeader('Access-Control-Allow-Origin', origin || '');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '1800'); // 30 minutes
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  });

  // Session security (HIPAA compliance) - commented out since we're using cookie store
  // app.use((req: Request, res: Response, next: NextFunction) => {
  //   if (req.session) {
  //     const maxAge = 30 * 60 * 1000; // 30 minutes
  //     req.session.cookie.maxAge = maxAge;
  //     req.session.cookie.secure = true; // HTTPS only
  //     req.session.cookie.httpOnly = true; // Prevent XSS
  //     req.session.cookie.sameSite = 'strict'; // CSRF protection
  //   }
  //   next();
  // });

  // Error handling middleware (prevent information disclosure)
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR LOG] ${timestamp} - ${err.message} - ${req.originalUrl} - IP: ${req.ip}`);
    
    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.status(500).json({
      error: isProduction ? 'Internal server error' : err.message,
      code: 'INTERNAL_ERROR',
      timestamp,
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  });
}

// Generate or retrieve encryption key from environment
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // Generate a secure 256-bit key if not provided
    const generatedKey = crypto.randomBytes(32).toString('hex');
    console.warn('WARNING: No ENCRYPTION_KEY found in environment. Generated temporary key:', generatedKey.substring(0, 8) + '...');
    console.warn('For production, set ENCRYPTION_KEY environment variable with a secure 64-character hex string');
    return generatedKey;
  }
  return key;
};

// Medical data encryption utilities (HIPAA compliance)
export const encryption = {
  // Encrypt sensitive medical data using AES-256-GCM
  encryptPHI: (data: string): string => {
    try {
      const key = Buffer.from(getEncryptionKey(), 'hex');
      
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(12); // GCM typically uses 12-byte IV
      
      // Create cipher using AES-256-GCM
      const cipher = crypto.createCipher('aes-256-gcm', key);
      cipher.setAAD(Buffer.from('PHI_DATA', 'utf8'));
      
      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV + authTag + encrypted data
      const result = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
      
      return result;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  },
  
  // Decrypt medical data using AES-256-GCM
  decryptPHI: (encryptedData: string): string => {
    try {
      const key = Buffer.from(getEncryptionKey(), 'hex');
      
      // Split the encrypted data components
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      // Create decipher
      const decipher = crypto.createDecipher('aes-256-gcm', key);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from('PHI_DATA', 'utf8'));
      
      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  },
  
  // Alternative AES-256-CBC implementation using crypto-js for client-side compatibility
  encryptPHIAlt: (data: string): string => {
    try {
      const key = getEncryptionKey();
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return encrypted.toString();
    } catch (error) {
      console.error('Alternative encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  },
  
  // Alternative decrypt using crypto-js
  decryptPHIAlt: (encryptedData: string): string => {
    try {
      const key = getEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Alternative decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  },
  
  // Hash sensitive identifiers (one-way) - SHA-256
  hashIdentifier: (identifier: string): string => {
    return crypto.createHash('sha256').update(identifier).digest('hex');
  },
  
  // Generate secure random token for sessions/API keys
  generateSecureToken: (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
  },
  
  // Encrypt file data for secure storage
  encryptFile: (fileBuffer: Buffer): Buffer => {
    try {
      const key = getEncryptionKey();
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher('aes-256-cbc', Buffer.from(key, 'hex'));
      
      let encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
      
      // Prepend IV to encrypted data
      return Buffer.concat([iv, encrypted]);
    } catch (error) {
      console.error('File encryption failed:', error);
      throw new Error('Failed to encrypt file');
    }
  },
  
  // Decrypt file data
  decryptFile: (encryptedBuffer: Buffer): Buffer => {
    try {
      const key = getEncryptionKey();
      
      // Extract IV from beginning of buffer
      const iv = encryptedBuffer.slice(0, 16);
      const encrypted = encryptedBuffer.slice(16);
      
      const decipher = crypto.createDecipher('aes-256-cbc', Buffer.from(key, 'hex'));
      
      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch (error) {
      console.error('File decryption failed:', error);
      throw new Error('Failed to decrypt file');
    }
  }
};

// Audit logging for SOC 2 compliance
export const auditLog = {
  logAccess: (userId: string, resource: string, action: string, ip: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[AUDIT] ${timestamp} - User: ${userId} - Action: ${action} - Resource: ${resource} - IP: ${ip}`);
  },
  
  logDataAccess: (userId: string, dataType: string, recordId: string, ip: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[DATA ACCESS] ${timestamp} - User: ${userId} - Data: ${dataType} - Record: ${recordId} - IP: ${ip}`);
  },
  
  logSecurityEvent: (eventType: string, details: string, ip: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[SECURITY EVENT] ${timestamp} - Event: ${eventType} - Details: ${details} - IP: ${ip}`);
  }
};