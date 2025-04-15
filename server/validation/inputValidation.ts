import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import path from "path";

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Schema for SVG conversion options validation
export const svgOptionsSchema = z.object({
  fileFormat: z.string().min(1).max(10),
  svgVersion: z.string().min(1).max(10),
  drawStyle: z.string().min(1).max(20),
  shapeStacking: z.string().min(1).max(20),
  groupBy: z.string().min(1).max(20),
  lineFit: z.string().min(1).max(20),
  allowedCurveTypes: z.array(z.string().min(1).max(20)),
  fillGaps: z.boolean(),
  clipOverflow: z.boolean(),
  nonScalingStroke: z.boolean(),
  strokeWidth: z.number().min(0).max(10)
});

// Schema for color customization validation
export const colorSchema = z.object({
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
});

// Schema for background transparency validation
export const backgroundSchema = z.object({
  isTransparent: z.boolean()
});

/**
 * Sanitize filenames to prevent directory traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components (directories)
  return path.basename(filename);
}

/**
 * Middleware to validate SVG options
 */
export function validateSvgOptions(req: Request, res: Response, next: NextFunction) {
  try {
    // For form data, we need to parse the values appropriately
    if (req.body) {
      // Don't strictly validate here - we'll handle the conversion in the route handler
      // This allows for FormData submissions where everything is a string
      next();
    } else {
      res.status(400).json({ error: "Missing SVG options" });
    }
  } catch (error) {
    console.error("SVG options validation error:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(400).json({ error: "Invalid SVG options" });
    }
  }
}

/**
 * Middleware to validate color input
 */
export function validateColorInput(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.body) {
      colorSchema.parse(req.body);
      next();
    } else {
      res.status(400).json({ error: "Missing color data" });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(400).json({ error: "Invalid color format" });
    }
  }
}

/**
 * Middleware to validate background input
 */
export function validateBackgroundInput(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.body) {
      backgroundSchema.parse(req.body);
      next();
    } else {
      res.status(400).json({ error: "Missing background data" });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(400).json({ error: "Invalid background format" });
    }
  }
}

/**
 * Sanitize SVG content to prevent XSS attacks
 */
export function sanitizeSvgContent(svg: string): string {
  // Configure DOMPurify to only allow SVG-specific tags and attributes
  const purifyConfig = {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['svg', 'path', 'g', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan'],
    ADD_ATTR: ['viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'd', 'transform'],
    WHOLE_DOCUMENT: true
  };
  
  return purify.sanitize(svg, purifyConfig);
}