import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { convertImageToSVG, applySvgColor, setTransparentBackground } from "./conversion/svg-converter";

// Set up multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Allow only image files
    const filetypes = /jpeg|jpg|png|gif|bmp|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: File upload only supports image files"));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint for image to SVG conversion
  app.post("/api/convert", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      // Extract options from the request body
      const options = {
        fileFormat: req.body.fileFormat || "svg",
        svgVersion: req.body.svgVersion || "1.1",
        drawStyle: req.body.drawStyle || "fillShapes",
        shapeStacking: req.body.shapeStacking || "placeCutouts",
        groupBy: req.body.groupBy || "none",
        lineFit: req.body.lineFit || "medium",
        allowedCurveTypes: req.body.allowedCurveTypes
          ? req.body.allowedCurveTypes.split(",")
          : ["lines", "quadraticBezier", "cubicBezier", "circularArcs", "ellipticalArcs"],
        fillGaps: req.body.fillGaps === "true",
        clipOverflow: req.body.clipOverflow === "true",
        nonScalingStroke: req.body.nonScalingStroke === "true",
        strokeWidth: parseFloat(req.body.strokeWidth) || 2.0,
      };

      // Convert the image to SVG
      const result = await convertImageToSVG(req.file.buffer, options);
      
      res.status(200).json({ svg: result });
    } catch (error) {
      console.error("Error in conversion:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred during conversion" 
      });
    }
  });

  // Endpoint for applying color to SVG
  app.post("/api/color", async (req, res) => {
    try {
      const { svg, color } = req.body;
      
      if (!svg || !color) {
        return res.status(400).json({ message: "SVG content and color are required" });
      }

      const result = await applySvgColor(svg, color);
      
      res.status(200).json({ svg: result });
    } catch (error) {
      console.error("Error applying color:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred while applying color" 
      });
    }
  });

  // Endpoint for setting SVG background transparency
  app.post("/api/background", async (req, res) => {
    try {
      const { svg, transparent } = req.body;
      
      if (!svg || transparent === undefined) {
        return res.status(400).json({ message: "SVG content and transparent flag are required" });
      }

      const result = await setTransparentBackground(svg, transparent);
      
      res.status(200).json({ svg: result });
    } catch (error) {
      console.error("Error setting background:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred while setting background" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
