import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import fs from "fs";

/**
 * File filter function for multer to validate file uploads
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files (MIME types)
  const allowedMimeTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/bmp', 
    'image/tiff',
    'image/webp',
    'image/svg+xml'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, BMP, TIFF, WebP, and SVG are allowed.'));
  }
};

// Ensure temp directory exists
const uploadDir = path.join(process.cwd(), 'temp-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configure multer for file uploads with security settings
 */
export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate a secure filename to prevent directory traversal
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(file.originalname);
      cb(null, `${timestamp}-${randomString}${ext}`);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10                  // Maximum 10 files
  }
});

/**
 * Rate limiter for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // Limit each IP to 100 requests per windowMs
  standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,     // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too many requests, please try again later."
  }
});

/**
 * Stricter rate limiter for conversion endpoint which is more resource-intensive
 */
export const conversionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 20,                  // Limit each IP to 20 requests per windowMs
  standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,     // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too many conversion requests, please try again later."
  }
});

/**
 * Security headers configuration using helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      // Allow inline styles and scripts for development
      ...(process.env.NODE_ENV === "development" && {
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", "ws:"]
      })
    }
  },
  crossOriginEmbedderPolicy: false, // Allow embedding from same origin
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  xssFilter: true,
  hsts: {
    maxAge: 15552000, // 180 days in seconds
    includeSubDomains: true
  }
});

/**
 * Middleware to clean up temporary files (using simpler approach)
 */
export const cleanupTempFiles = (req: Request, res: Response, next: NextFunction) => {
  // Store the original end method
  const originalEnd = res.end;
  
  // Override the end method
  res.end = function (...args: any[]) {
    // Perform cleanup if a file was uploaded
    if (req.file) {
      const filePath = req.file.path;
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Error removing temp file ${filePath}:`, err);
      }
    }
    
    // Multiple files case
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error(`Error removing temp file ${file.path}:`, err);
        }
      });
    }
    
    // Call the original end method
    return originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Global error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server error:", err);
  
  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: "File too large",
        details: "Maximum file size is 5MB."
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: "Too many files",
        details: "Maximum 10 files allowed."
      });
    }
    
    return res.status(400).json({ 
      error: "File upload error",
      details: err.message
    });
  }
  
  // Generic error response
  res.status(500).json({ 
    error: "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};