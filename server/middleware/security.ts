import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Create temp upload directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp-uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 1. Secure File Upload Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, _file, cb) => {
    // Generate a unique filename to prevent overwriting and path traversal
    const uniqueFilename = `${uuidv4()}${path.extname(_file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Strict file validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only image files
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, BMP, WebP) are allowed.'));
  }
};

// Multer setup with limits
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Maximum 10 files at once
  },
  fileFilter
});

// 2. Rate Limiting Middleware
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  }
});

// More aggressive rate limiting for conversion endpoint
export const conversionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25, // limit each IP to 25 conversions per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'You have exceeded the maximum number of conversions. Please try again later.'
  }
});

// 3. Security Headers Middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for the app to function
      styleSrc: ["'self'", "'unsafe-inline'"], // Needed for the app to function
      imgSrc: ["'self'", "data:", "blob:"], // Allow data URLs for SVG preview
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // May need to adjust based on app requirements
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 15552000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// 4. Temporary File Cleanup Middleware
export const cleanupTempFiles = (req: Request, res: Response, next: NextFunction) => {
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function
  res.end = function(...args: any[]) {
    // Delete temp files after response is sent
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error cleaning up temp file:', err);
      }
    }
    
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error cleaning up temp file:', err);
        }
      });
    }
    
    // Call the original end function
    return originalEnd.apply(res, args);
  };
  
  next();
};

// 5. Error Handler Middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Maximum is 10 files at once.'
      });
    }
  }
  
  // Generic error without exposing details
  res.status(500).json({ 
    error: err.message || 'An unexpected error occurred.'
  });
};