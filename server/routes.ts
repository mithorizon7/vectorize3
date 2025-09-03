import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import * as fs from "fs";
import { storage } from "./storage";
import { convertImageToSVG, applySvgColor, setTransparentBackground } from "./conversion/svg-converter";
import { convertImageToColorSVG, detectColorComplexity } from "./conversion/color-tracer";
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
import { queueController } from "./queue/controller";
import { initializeJobProcessors, setSocketServer } from "./queue/processor";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply global security middleware
  app.use(securityHeaders);
  app.use(apiLimiter);
  app.use(cleanupTempFiles);
  
  // Create HTTP server for both Express and Socket.IO
  const httpServer = createServer(app);
  
  // Create Socket.IO server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Allow all origins for development, restrict in production
      methods: ["GET", "POST"]
    }
  });
  
  // Set up Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log('WebSocket client connected');
    
    // Handle client subscription to job progress
    socket.on('subscribe:job', (jobId) => {
      socket.join(`job:${jobId}`);
      console.log(`Client subscribed to job ${jobId}`);
    });
    
    // Handle client unsubscription from job progress
    socket.on('unsubscribe:job', (jobId) => {
      socket.leave(`job:${jobId}`);
      console.log(`Client unsubscribed from job ${jobId}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Set the socket server in the processor
  setSocketServer(io);
  
  // Initialize job processors
  initializeJobProcessors();
  
  // Endpoint for image to SVG conversion with stricter rate limiting
  app.post(
    "/api/convert", 
    conversionLimiter, 
    upload.single("image"), 
    async (req, res) => {
      try {
        console.log("Received conversion request");
        
        if (!req.file) {
          console.error("No file uploaded in request");
          return res.status(400).json({ error: "No image file uploaded" });
        }
        
        console.log("File details:", {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path
        });

        // Convert form data strings to appropriate types
        const options = {
          // Common options
          fileFormat: req.body.fileFormat || "svg",
          svgVersion: req.body.svgVersion || "1.1",
          drawStyle: req.body.drawStyle || "fillShapes",
          strokeWidth: parseFloat(req.body.strokeWidth) || 0.5,
          
          // Engine selection
          traceEngine: req.body.traceEngine || "auto", // potrace, imagetracer, or auto
          
          // Potrace specific options
          shapeStacking: req.body.shapeStacking || "placeCutouts",
          groupBy: req.body.groupBy || "none",
          lineFit: req.body.lineFit || "medium",
          allowedCurveTypes: req.body.allowedCurveTypes?.split(',') || ["lines", "quadraticBezier", "cubicBezier"],
          fillGaps: req.body.fillGaps === 'true',
          clipOverflow: req.body.clipOverflow === 'true',
          nonScalingStroke: req.body.nonScalingStroke === 'true',
          
          // Potrace advanced options (exposed for fine-tuning)
          turdSize: req.body.turdSize ? parseInt(req.body.turdSize) : undefined,
          alphaMax: req.body.alphaMax ? parseFloat(req.body.alphaMax) : undefined,
          optTolerance: req.body.optTolerance ? parseFloat(req.body.optTolerance) : undefined,
          
          // ImageTracerJS specific options
          numberOfColors: parseInt(req.body.numberOfColors || "16"),
          colorMode: (req.body.colorMode || "color") as 'color' | 'grayscale',
          minColorRatio: parseFloat(req.body.minColorRatio || "0.02"),
          colorQuantization: (req.body.colorQuantization || "default") as 'default' | 'riemersma' | 'floyd-steinberg',
          blurRadius: parseInt(req.body.blurRadius || "0"),
          preserveColors: req.body.preserveColors === 'true',
          
          // ImageTracer advanced options (exposed for fine-tuning)
          colorSampling: req.body.colorSampling !== undefined ? 
            parseInt(req.body.colorSampling) as 0 | 1 : undefined,
          ltres: req.body.ltres ? parseFloat(req.body.ltres) : undefined,
          qtres: req.body.qtres ? parseFloat(req.body.qtres) : undefined,
          pathomit: req.body.pathomit ? parseInt(req.body.pathomit) : undefined,
          roundcoords: req.body.roundcoords ? parseInt(req.body.roundcoords) : undefined,
          
          // Custom palette option
          customPalette: req.body.customPalette ? 
            (typeof req.body.customPalette === 'string' ? 
              JSON.parse(req.body.customPalette) : req.body.customPalette) : undefined
        };

        console.log("Processing conversion with options:", options);
        
        // Get the file path from multer
        if (!req.file.path) {
          console.error("File path missing in uploaded file");
          return res.status(400).json({ error: "No file path available" });
        }
        
        // Verify the file exists
        if (!fs.existsSync(req.file.path)) {
          console.error(`File does not exist at path: ${req.file.path}`);
          return res.status(400).json({ error: "File does not exist on server" });
        }
        
        console.log(`Reading file from ${req.file.path}`);
        // Read the file for conversion
        const fileBuffer = fs.readFileSync(req.file.path);
        console.log(`File buffer created, size: ${fileBuffer.length} bytes`);
        
        // Choose conversion method based on traceEngine option
        console.log(`Starting SVG conversion with ${options.traceEngine} engine...`);
        
        let result: string;
        
        // PRIORITY: If preserveColors is enabled, always use color tracing
        if (options.preserveColors) {
          console.log("Using ImageTracerJS to preserve original colors");
          result = await convertImageToColorSVG(fileBuffer, options);
        }
        // Use color analysis to auto-detect the best engine if not explicitly specified
        else if (options.traceEngine === 'auto') {
          const colorAnalysis = await detectColorComplexity(fileBuffer);
          console.log("Image color analysis:", colorAnalysis);
          
          // Choose engine based on color complexity - lowered threshold for better color preservation
          if (colorAnalysis.isColorImage && colorAnalysis.distinctColors > 4) {
            console.log("Auto-selected imagetracer for color image");
            result = await convertImageToColorSVG(fileBuffer, options);
          } else {
            console.log("Auto-selected potrace for black and white/low-color image");
            result = await convertImageToSVG(fileBuffer, options);
          }
        } 
        // Otherwise use the explicitly selected engine
        else if (options.traceEngine === 'imagetracer') {
          console.log("Using ImageTracerJS for color conversion");
          result = await convertImageToColorSVG(fileBuffer, options);
        } 
        else {
          // Default to potrace
          console.log("Using Potrace for black and white conversion");
          result = await convertImageToSVG(fileBuffer, options);
        }
        
        console.log(`Conversion complete, SVG length: ${result?.length || 0} characters`);
        
        // Sanitize SVG content for security
        console.log("Sanitizing SVG content...");
        const sanitizedSvg = sanitizeSvgContent(result);
        console.log(`Sanitization complete, final SVG length: ${sanitizedSvg?.length || 0} characters`);
        
        if (!sanitizedSvg || sanitizedSvg.length === 0) {
          console.error("SVG generation produced empty result");
          return res.status(500).json({ error: "SVG generation failed - empty result" });
        }
        
        console.log("Sending successful response with SVG data");
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
  
  // Add queue-based API routes
  app.post('/api/queue/convert', conversionLimiter, upload.single('image'), queueController.queueConversion);
  app.post('/api/queue/batch', conversionLimiter, upload.array('images', 20), queueController.queueBatchConversion);
  app.post('/api/queue/color', validateColorInput, queueController.queueColorApplication);
  app.post('/api/queue/background', validateBackgroundInput, queueController.queueBackgroundSetting);
  app.get('/api/queue/job/:jobId', queueController.getJobStatus);
  
  return httpServer;
}