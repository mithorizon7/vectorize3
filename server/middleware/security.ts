import { Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

/**
 * File filter function for multer to validate file uploads
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only allow specific image formats
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, GIF, BMP, WebP, and TIFF are supported.`));
  }
};

/**
 * Configure multer for file uploads with security settings
 */
export const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for processing
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter
});

/**
 * Rate limiter for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
  skipSuccessfulRequests: false
});

/**
 * Stricter rate limiter for conversion endpoint which is more resource-intensive
 */
export const conversionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 conversion requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many conversion requests from this IP, please try again after 15 minutes",
  skipSuccessfulRequests: false
});

/**
 * Security headers configuration using helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For Vite in development
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      sandbox: ["allow-forms", "allow-scripts", "allow-same-origin"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // To allow loading of resources
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  // expectCt is deprecated in newer helmet versions
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 15552000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true
});

/**
 * Middleware to clean up temporary files (using simpler approach)
 */
export const cleanupTempFiles = (req: Request, res: Response, next: NextFunction) => {
  // Clean up on response finish instead of overriding res.end
  res.on('finish', () => {
    // Check if there's a file to clean up
    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
          console.log(`Cleaned up temporary file: ${req.file.path}`);
        }
      } catch (err) {
        console.error('Error cleaning up temporary file:', err);
      }
    }
    
    // Check if multiple files need to be cleaned up
    if (req.files) {
      try {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        
        files.forEach(file => {
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up temporary file: ${file.path}`);
          }
        });
      } catch (err) {
        console.error('Error cleaning up temporary files:', err);
      }
    }
  });
  
  next();
};

/**
 * Global error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error for debugging
  console.error('Server error:', err);
  
  // Determine status code based on the error
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  
  // Handle specific error types
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    
    // Provide friendly error messages for Multer errors
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = 'File size exceeds the 10MB limit';
        break;
      case 'LIMIT_FILE_COUNT':
        errorMessage = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage = 'Unexpected field name for file upload';
        break;
      default:
        errorMessage = `File upload error: ${err.message}`;
    }
  } else if (err.message.includes('Unsupported file type')) {
    statusCode = 400;
    errorMessage = err.message;
  }
  
  // Send the error response
  res.status(statusCode).json({
    error: errorMessage,
    status: statusCode
  });
};