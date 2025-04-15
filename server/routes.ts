import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import * as fs from "fs";
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
  validateBackgroundInput,
  sanitizeSvgContent
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
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file uploaded" });
        }

        // Convert form data strings to appropriate types
        const options = {
          fileFormat: req.body.fileFormat || "svg",
          svgVersion: req.body.svgVersion || "1.1",
          drawStyle: req.body.drawStyle || "fill",
          shapeStacking: req.body.shapeStacking || "stacked",
          groupBy: req.body.groupBy || "color",
          lineFit: req.body.lineFit || "default",
          allowedCurveTypes: req.body.allowedCurveTypes?.split(',') || ["all"],
          fillGaps: req.body.fillGaps === 'true',
          clipOverflow: req.body.clipOverflow === 'true',
          nonScalingStroke: req.body.nonScalingStroke === 'true',
          strokeWidth: parseFloat(req.body.strokeWidth) || 0.5,
        };

        console.log("Processing conversion with options:", options);
        
        // Get the file path from multer
        if (!req.file.path) {
          return res.status(400).json({ error: "No file path available" });
        }
        
        // Read the file for conversion
        const fileBuffer = fs.readFileSync(req.file.path);
        
        // Call the conversion function with the processed options
        const result = await convertImageToSVG(fileBuffer, options);
        
        // Sanitize SVG content for security
        const sanitizedSvg = sanitizeSvgContent(result);
        
        res.status(200).json({ svg: sanitizedSvg });
      } catch (error) {
        console.error("Error in image conversion:", error);
        
        if (error instanceof Error) {
          return res.status(400).json({ 
            error: "Failed to convert image", 
            details: error.message 
          });
        }
        
        return res.status(500).json({ 
          error: "An unexpected error occurred during conversion" 
        });
      }
    }
  );

  // Endpoint for applying color to SVG
  app.post(
    "/api/color", 
    validateColorInput, 
    async (req, res) => {
      try {
        const { svg, color } = req.body;
        const result = await applySvgColor(svg, color);
        res.status(200).json({ svg: sanitizeSvgContent(result) });
      } catch (error) {
        console.error("Error applying color:", error);
        
        if (error instanceof Error) {
          return res.status(400).json({ 
            error: "Failed to apply color", 
            details: error.message 
          });
        }
        
        return res.status(500).json({ 
          error: "An unexpected error occurred while applying color" 
        });
      }
    }
  );

  // Endpoint for setting SVG background transparency
  app.post(
    "/api/background", 
    validateBackgroundInput, 
    async (req, res) => {
      try {
        const { svg, isTransparent } = req.body;
        const result = await setTransparentBackground(svg, isTransparent);
        res.status(200).json({ svg: sanitizeSvgContent(result) });
      } catch (error) {
        console.error("Error setting background:", error);
        
        if (error instanceof Error) {
          return res.status(400).json({ 
            error: "Failed to set background transparency", 
            details: error.message 
          });
        }
        
        return res.status(500).json({ 
          error: "An unexpected error occurred while setting background" 
        });
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