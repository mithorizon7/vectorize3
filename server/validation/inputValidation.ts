import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

// Create a window with JSDOM
const window = new JSDOM('').window;
// Create a DOMPurify instance using the window
const purify = DOMPurify(window);

// Zod schema for SVG options validation
export const svgOptionsSchema = z.object({
  fileFormat: z.enum(["svg", "png"]).default("svg"),
  svgVersion: z.enum(["1.0", "1.1", "2.0"]).default("1.1"),
  drawStyle: z.enum(["fillShapes", "outlineShapes", "fillAndOutline"]).default("fillShapes"),
  shapeStacking: z.enum(["stacked", "layered", "placeCutouts"]).default("placeCutouts"),
  groupBy: z.enum(["none", "color", "size", "position"]).default("none"),
  lineFit: z.enum(["low", "medium", "high", "veryHigh"]).default("medium"),
  allowedCurveTypes: z.union([
    z.array(z.enum(["lines", "quadraticBezier", "cubicBezier", "circularArcs", "ellipticalArcs"])),
    z.string().transform(val => val.split(','))
  ]).default(["lines", "quadraticBezier", "cubicBezier", "circularArcs", "ellipticalArcs"]),
  fillGaps: z.union([
    z.boolean(),
    z.enum(["true", "false"]).transform(val => val === "true")
  ]).default(false),
  clipOverflow: z.union([
    z.boolean(),
    z.enum(["true", "false"]).transform(val => val === "true")
  ]).default(false),
  nonScalingStroke: z.union([
    z.boolean(),
    z.enum(["true", "false"]).transform(val => val === "true")
  ]).default(false),
  strokeWidth: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).refine(val => !isNaN(val) && val > 0 && val <= 10, {
    message: "Stroke width must be a number between 0 and 10"
  }).default(2.0),
});

// Zod schema for color validation
export const colorSchema = z.object({
  svg: z.string().min(1, "SVG content is required"),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format. Use hex color (e.g., #FF0000)")
});

// Zod schema for background transparency validation
export const backgroundSchema = z.object({
  svg: z.string().min(1, "SVG content is required"),
  transparent: z.boolean().or(z.enum(["true", "false"]).transform(val => val === "true"))
});

/**
 * Sanitize filenames to prevent directory traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal characters and directory separators
  return filename
    .replace(/[/\\?%*:|"<>]/g, '_') // Replace invalid characters with underscore
    .replace(/^\.+/g, '') // Remove leading dots to prevent hidden files
    .substring(0, 255); // Limit filename length
}

/**
 * Middleware to validate SVG options
 */
export function validateSvgOptions(req: Request, res: Response, next: NextFunction) {
  try {
    // Parse and validate SVG options
    const validatedOptions = svgOptionsSchema.parse(req.body);
    
    // Replace the request body with the validated values
    req.body = validatedOptions;
    
    // Validate the file if it exists
    if (req.file) {
      // Check file size (maximum 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ error: "File size exceeds the 10MB limit" });
      }
      
      // Check file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, GIF, BMP, WebP, and TIFF are supported" });
      }
      
      // Sanitize the filename
      req.file.originalname = sanitizeFilename(req.file.originalname);
    }
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid input parameters", 
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      });
    }
    next(error);
  }
}

/**
 * Middleware to validate color input
 */
export function validateColorInput(req: Request, res: Response, next: NextFunction) {
  try {
    // Parse and validate color input
    const { svg, color } = colorSchema.parse(req.body);
    
    // Sanitize SVG content to prevent XSS attacks
    req.body.svg = sanitizeSvgContent(svg);
    req.body.color = color;
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid input parameters",
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      });
    }
    next(error);
  }
}

/**
 * Middleware to validate background input
 */
export function validateBackgroundInput(req: Request, res: Response, next: NextFunction) {
  try {
    // Parse and validate background input
    const { svg, transparent } = backgroundSchema.parse(req.body);
    
    // Sanitize SVG content to prevent XSS attacks
    req.body.svg = sanitizeSvgContent(svg);
    req.body.transparent = transparent;
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid input parameters",
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      });
    }
    next(error);
  }
}

/**
 * Sanitize SVG content to prevent XSS attacks
 */
export function sanitizeSvgContent(svg: string): string {
  // Configure DOMPurify for SVG
  const config = {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: [
      'svg', 'path', 'g', 'rect', 'circle', 'ellipse', 'line', 'polyline',
      'polygon', 'defs', 'style', 'linearGradient', 'radialGradient', 'stop',
      'filter', 'feGaussianBlur', 'feOffset', 'feBlend', 'title', 'desc'
    ],
    ALLOWED_ATTR: [
      'viewBox', 'width', 'height', 'xmlns', 'version', 'd', 'fill', 'stroke',
      'stroke-width', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
      'points', 'class', 'id', 'style', 'transform', 'offset', 'stop-color',
      'stop-opacity', 'gradient-transform', 'stdDeviation', 'result', 'in', 'dx', 'dy',
      'mode', 'path', 'patternUnits', 'preserveAspectRatio'
    ]
  };
  
  // Sanitize the SVG content
  return purify.sanitize(svg, config);
}