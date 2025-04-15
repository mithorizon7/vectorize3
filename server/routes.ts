import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { convertImageToSVG, applySvgColor, setTransparentBackground } from "./conversion/svg-converter";
import { 
  upload, 
  apiLimiter, 
  conversionLimiter, 
  securityHeaders, 
  cleanupTempFiles, 
  errorHandler 
} from "./middleware/security";
import { 
  sanitizeFilename,
  validateSvgOptions,
  validateColorInput,
  validateBackgroundInput 
} from "./validation/inputValidation";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply global security middleware
  app.use(securityHeaders);
  app.use(apiLimiter);
  app.use(cleanupTempFiles);
  
  // Endpoint for image to SVG conversion with stricter rate limiting
  app.post(
    "/api/convert", 
    conversionLimiter, 
    upload.single("image"), 
    validateSvgOptions,
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file uploaded" });
        }

        // Convert the image to SVG using validated options from middleware
        const options = {
          fileFormat: req.body.fileFormat,
          svgVersion: req.body.svgVersion,
          drawStyle: req.body.drawStyle,
          shapeStacking: req.body.shapeStacking,
          groupBy: req.body.groupBy,
          lineFit: req.body.lineFit,
          allowedCurveTypes: Array.isArray(req.body.allowedCurveTypes) 
            ? req.body.allowedCurveTypes 
            : req.body.allowedCurveTypes?.split(',') || [],
          fillGaps: req.body.fillGaps === 'true',
          clipOverflow: req.body.clipOverflow === 'true',
          nonScalingStroke: req.body.nonScalingStroke === 'true',
          strokeWidth: parseFloat(req.body.strokeWidth) || 0.5,
        };

        const result = await convertImageToSVG(req.file.buffer, options);
        
        // Record conversion stats in database (can be implemented later)
        // await recordConversion(req.file.originalname, req.file.size);
        
        res.status(200).json({ svg: result });
      } catch (error) {
        next(error);
      }
    }
  );

  // Endpoint for applying color to SVG
  app.post(
    "/api/color", 
    validateColorInput, 
    async (req, res, next) => {
      try {
        const { svg, color } = req.body;
        const result = await applySvgColor(svg, color);
        res.status(200).json({ svg: result });
      } catch (error) {
        next(error);
      }
    }
  );

  // Endpoint for setting SVG background transparency
  app.post(
    "/api/background", 
    validateBackgroundInput, 
    async (req, res, next) => {
      try {
        const { svg, transparent } = req.body;
        const result = await setTransparentBackground(svg, transparent);
        res.status(200).json({ svg: result });
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Add privacy policy and terms of service routes
  app.get("/api/privacy-policy", (req, res) => {
    res.status(200).json({
      title: "Privacy Policy",
      lastUpdated: "April 15, 2025",
      content: [
        "We do not store your images permanently. All uploaded images are processed in memory and immediately deleted after conversion.",
        "We do not track individual users or store personal information.",
        "We use rate limiting to prevent abuse of our services.",
        "Images are only processed for conversion to SVG and are not shared with third parties."
      ]
    });
  });
  
  app.get("/api/terms", (req, res) => {
    res.status(200).json({
      title: "Terms of Service",
      lastUpdated: "April 15, 2025",
      content: [
        "This service is provided 'as is' without warranty of any kind.",
        "Do not upload illegal, offensive, or copyrighted material that you don't have permission to use.",
        "We reserve the right to block access for users who abuse the service.",
        "Usage of this service implies acceptance of these terms."
      ]
    });
  });

  // Error handling middleware should be registered last
  app.use(errorHandler);
  
  const httpServer = createServer(app);
  return httpServer;
}
