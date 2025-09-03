import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import path from "path";
import sharp from "sharp";

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
  // Common options
  fileFormat: z.string().optional(),
  svgVersion: z.string().optional(),
  drawStyle: z.string().optional(),
  strokeWidth: z.string().optional(),
  traceEngine: z.string().optional(),
  
  // Potrace specific options
  shapeStacking: z.string().optional(),
  groupBy: z.string().optional(),
  lineFit: z.string().optional(),
  allowedCurveTypes: z.string().optional(),
  fillGaps: z.string().optional(),
  clipOverflow: z.string().optional(),
  nonScalingStroke: z.string().optional(),
  
  // Potrace advanced options
  turdSize: z.string().optional(),
  alphaMax: z.string().optional(),
  optTolerance: z.string().optional(),
  
  // ImageTracerJS specific options
  numberOfColors: z.string().optional(),
  colorMode: z.string().optional(),
  minColorRatio: z.string().optional(),
  colorQuantization: z.string().optional(),
  blurRadius: z.string().optional(),
  preserveColors: z.string().optional(),
  
  // ImageTracer advanced options
  colorSampling: z.string().optional(),
  ltres: z.string().optional(),
  qtres: z.string().optional(),
  pathomit: z.string().optional(),
  roundcoords: z.string().optional(),
  
  // Custom palette option
  customPalette: z.string().optional()
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
 * Validate and detect image format from buffer
 */
export async function validateImageFormat(buffer: Buffer, mimetype: string): Promise<{
  isValid: boolean;
  detectedFormat: string;
  supportedFormats: string[];
  error?: string;
}> {
  const supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg'];
  
  try {
    // Handle SVG separately since it's already vector format
    if (mimetype === 'image/svg+xml') {
      const svgContent = buffer.toString('utf8');
      if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
        return {
          isValid: true,
          detectedFormat: 'svg',
          supportedFormats
        };
      } else {
        return {
          isValid: false,
          detectedFormat: 'svg',
          supportedFormats,
          error: 'Invalid SVG format - missing required SVG tags'
        };
      }
    }
    
    // Use Sharp to detect and validate image format for raster images
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    if (!metadata.format) {
      return {
        isValid: false,
        detectedFormat: 'unknown',
        supportedFormats,
        error: 'Unable to detect image format'
      };
    }
    
    // Check if the detected format is supported
    const detectedFormat = metadata.format.toLowerCase();
    const isSupported = supportedFormats.includes(detectedFormat);
    
    if (!isSupported) {
      return {
        isValid: false,
        detectedFormat,
        supportedFormats,
        error: `Unsupported image format: ${detectedFormat}. Supported formats: ${supportedFormats.join(', ')}`
      };
    }
    
    // Additional validation for specific formats
    if (detectedFormat === 'jpeg' || detectedFormat === 'jpg') {
      if (!metadata.width || !metadata.height) {
        return {
          isValid: false,
          detectedFormat,
          supportedFormats,
          error: 'Invalid JPEG image - missing dimensions'
        };
      }
    }
    
    if (detectedFormat === 'png') {
      if (!metadata.width || !metadata.height) {
        return {
          isValid: false,
          detectedFormat,
          supportedFormats,
          error: 'Invalid PNG image - missing dimensions'
        };
      }
    }
    
    if (detectedFormat === 'gif') {
      // GIF might have animation, but we'll take the first frame
      console.log('GIF detected - will use first frame for conversion');
    }
    
    if (detectedFormat === 'webp') {
      // WebP supports both lossy and lossless compression
      console.log('WebP detected - processing as raster image');
    }
    
    if (detectedFormat === 'tiff') {
      // TIFF might have multiple pages, use first page
      console.log('TIFF detected - will use first page for conversion');
    }
    
    return {
      isValid: true,
      detectedFormat,
      supportedFormats
    };
    
  } catch (error) {
    return {
      isValid: false,
      detectedFormat: 'unknown',
      supportedFormats,
      error: `Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

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
  if (!svg) {
    console.warn("Attempting to sanitize empty or null SVG content");
    return "";
  }
  
  console.log("Original SVG length before sanitization:", svg.length);
  
  // Basic validation to ensure it contains SVG content
  if (!svg.includes("<svg") || !svg.includes("</svg>")) {
    console.error("Invalid SVG format - missing svg tags");
    return svg; // Return as is for debugging
  }
  
  try {
    // Configure specific options for SVG sanitization - more permissive options
    const sanitizeOptions = {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['svg', 'g', 'path', 'rect', 'circle', 'ellipse'],
      ADD_ATTR: [
        'target', 'xlink:show', 'xlink:href', 'xmlns', 'viewBox',
        'width', 'height', 'version', 'preserveAspectRatio',
      ],
      ALLOW_UNKNOWN_PROTOCOLS: true,
      ALLOWED_TAGS: [
        'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 
        'polygon', 'text', 'tspan', 'defs', 'clipPath', 'mask', 'pattern',
        'linearGradient', 'radialGradient', 'stop', 'filter', 'feGaussianBlur',
        'feOffset', 'feBlend', 'feColorMatrix', 'feComposite', 'feFlood',
        'feMerge', 'feMergeNode', 'title', 'desc', 'metadata', 'image'
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
        'mask', 'filter', 'id', 'class', 'style', 'patternUnits', 'patternTransform',
        'in', 'in2', 'result', 'stdDeviation', 'dx', 'dy', 'mode', 'type',
        'values', 'xlink:href', 'href', 'target', 'xmlns:svg', 'xmlns:xhtml',
        'markerWidth', 'markerHeight', 'refX', 'refY', 'orient', 'markerUnits'
      ]
    };

    const sanitized = purify.sanitize(svg, sanitizeOptions);
    console.log("Sanitized SVG length:", sanitized.length);
    
    // If sanitizing removed too much content (more than 20%), this might indicate a problem
    if (sanitized.length < svg.length * 0.8) {
      console.warn("Significant content removed during sanitization", {
        original: svg.length,
        sanitized: sanitized.length,
        percentRemoved: 100 - (sanitized.length / svg.length * 100)
      });
    }
    
    return sanitized;
  } catch (error) {
    console.error("Error during SVG sanitization:", error);
    return svg; // Return original content for debugging
  }
}