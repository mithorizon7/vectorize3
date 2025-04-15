import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { securityHeaders } from "./middleware/security";
import * as pathModule from "path";
import fs from "fs";

// Create logs directory if it doesn't exist
const logsDir = pathModule.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Setup express app with security
const app = express();

// Enable trust proxy to correctly identify users behind proxies for rate limiting
// This is required for express-rate-limit to work properly with X-Forwarded-For headers
app.set('trust proxy', 1);

// Apply security headers to all requests
app.use(securityHeaders);

// Set limits on JSON and URL-encoded data to prevent attacks
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Enhanced secure logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const routePath = req.path;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  
  // Don't capture response bodies in logs to prevent data leakage
  // Only capture metadata
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Create secure log with anonymized IP and minimal data
    if (routePath.startsWith("/api")) {
      // Format: timestamp | method | path | status | ip (anonymized) | duration | user-agent
      const timestamp = new Date().toISOString();
      const anonymizedIP = ipAddress.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.XXX.XXX');
      
      // Log to console and also to file for API requests
      let logLine = `${timestamp} | ${req.method} | ${routePath} | ${statusCode} | ${anonymizedIP} | ${duration}ms`;
      
      // Include truncated user agent
      if (userAgent.length > 30) {
        logLine += ` | ${userAgent.substring(0, 30)}...`;
      } else {
        logLine += ` | ${userAgent}`;
      }
      
      // Log additional info for error responses
      if (statusCode >= 400) {
        logLine += ` | ERROR`;
        
        // To filesystem for security monitoring
        try {
          const logFile = pathModule.join(process.cwd(), 'logs', 'error_log.txt');
          fs.appendFileSync(logFile, logLine + '\n');
        } catch (err) {
          console.error('Error writing to log file:', err);
        }
      }
      
      // Log to console (truncated for readability)
      if (logLine.length > 120) {
        log(logLine.slice(0, 119) + "…");
      } else {
        log(logLine);
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Secure error handling that doesn't leak sensitive info
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Log the full error for debugging
    console.error('Server error:', err);
    
    // Determine status code
    const status = err.status || err.statusCode || 500;
    
    // For production, don't expose internal error messages
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction && status === 500 
      ? "Internal Server Error" 
      : err.message || "Internal Server Error";
    
    // Don't include stack traces in response
    res.status(status).json({ error: message });
    
    // Don't throw the error again as it can lead to unhandled rejections
    // and potentially crash the server
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
