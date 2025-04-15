import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import path from "path";

// Create a DOMPurify instance
const window = new JSDOM("").window;
const purify = DOMPurify(window);

// Configure DOMPurify for SVG cleaning
purify.addHook("afterSanitizeAttributes", function (node) {
  // Set all elements owning target to target=_blank
  if ("target" in node) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
  // Set non-HTML/MathML links to xlink:show=new
  if (
    !node.hasAttribute("target") &&
    (node.hasAttribute("xlink:href") || node.hasAttribute("href"))
  ) {
    node.setAttribute("xlink:show", "new");
  }
});

// Zod schema for SVG conversion options
export const svgOptionsSchema = z.object({
  fileFormat: z.string().optional(),
  svgVersion: z.string().optional(),
  drawStyle: z.string().optional(),
  shapeStacking: z.string().optional(),
  groupBy: z.string().optional(),
  lineFit: z.string().optional(),
  allowedCurveTypes: z.string().optional(),
  fillGaps: z.string().optional(),
  clipOverflow: z.string().optional(),
  nonScalingStroke: z.string().optional(),
  strokeWidth: z.string().optional()
});

// Zod schema for color input
export const colorSchema = z.object({
  svg: z.string(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Invalid hex color format. Must be #RRGGBB or #RGB"
  })
});

// Zod schema for background transparency input
export const backgroundSchema = z.object({
  svg: z.string(),
  isTransparent: z.boolean()
});

/**
 * Sanitize filenames to prevent directory traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components (directory traversal)
  const sanitized = path.basename(filename);
  
  // Additional sanitization if needed
  return sanitized.replace(/[^\w\s.-]/g, '_');
}

/**
 * Middleware to validate SVG options
 */
export function validateSvgOptions(req: Request, res: Response, next: NextFunction) {
  try {
    svgOptionsSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid SVG options", 
        details: error.errors 
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
    colorSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid color input", 
        details: error.errors 
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
    // Convert string to boolean if it comes from form data
    if (typeof req.body.isTransparent === 'string') {
      req.body.isTransparent = req.body.isTransparent === 'true';
    }
    
    backgroundSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid background transparency input", 
        details: error.errors 
      });
    }
    next(error);
  }
}

/**
 * Sanitize SVG content to prevent XSS attacks
 */
export function sanitizeSvgContent(svg: string): string {
  // Configure specific options for SVG sanitization
  const sanitizeOptions = {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_ATTR: ['target', 'xlink:show'],
    ALLOWED_TAGS: [
      'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 
      'polygon', 'text', 'tspan', 'defs', 'clipPath', 'mask', 'pattern',
      'linearGradient', 'radialGradient', 'stop', 'filter', 'feGaussianBlur',
      'feOffset', 'feBlend', 'feColorMatrix', 'title', 'desc'
    ],
    ALLOWED_ATTR: [
      'viewBox', 'width', 'height', 'xmlns', 'xmlns:xlink', 'version',
      'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'transform',
      'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width',
      'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'stroke-dasharray',
      'stroke-dashoffset', 'opacity', 'points', 'x1', 'y1', 'x2', 'y2',
      'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform',
      'font-family', 'font-size', 'text-anchor', 'dominant-baseline',
      'clip-path', 'clip-rule', 'vector-effect', 'preserveAspectRatio',
      'mask', 'filter', 'id', 'class', 'style'
    ]
  };

  return purify.sanitize(svg, sanitizeOptions);
}