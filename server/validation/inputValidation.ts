import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a DOMPurify instance with JSDOM window
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Valid SVG version values
const SVG_VERSIONS = ['1.0', '1.1', '2.0'];

// Valid draw style values
const DRAW_STYLES = ['fillShapes', 'outlineShapes', 'centerLine'];

// Valid shape stacking values
const SHAPE_STACKING = ['placeCutouts', 'stacked', 'noOverlap'];

// Valid group by values
const GROUP_BY = ['none', 'color', 'layer'];

// Valid line fit values
const LINE_FIT = ['low', 'medium', 'high', 'auto'];

// Valid curve types
const CURVE_TYPES = ['lines', 'quadraticBezier', 'cubicBezier', 'circularArcs', 'ellipticalArcs'];

// Schema for SVG options
export const svgOptionsSchema = z.object({
  fileFormat: z.enum(['svg']).default('svg'),
  svgVersion: z.enum(SVG_VERSIONS as [string, ...string[]]).default('1.1'),
  drawStyle: z.enum(DRAW_STYLES as [string, ...string[]]).default('fillShapes'),
  shapeStacking: z.enum(SHAPE_STACKING as [string, ...string[]]).default('placeCutouts'),
  groupBy: z.enum(GROUP_BY as [string, ...string[]]).default('none'),
  lineFit: z.enum(LINE_FIT as [string, ...string[]]).default('medium'),
  allowedCurveTypes: z.array(z.enum(CURVE_TYPES as [string, ...string[]])).default(CURVE_TYPES),
  fillGaps: z.boolean().default(false),
  clipOverflow: z.boolean().default(false),
  nonScalingStroke: z.boolean().default(false),
  strokeWidth: z.number().min(0.1).max(10).default(2.0),
});

// Schema for color input
export const colorSchema = z.object({
  svg: z.string().min(1),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color')
});

// Schema for background transparency
export const backgroundSchema = z.object({
  svg: z.string().min(1),
  transparent: z.boolean()
});

// Middleware to sanitize filenames
export function sanitizeFilename(filename: string): string {
  // Remove path components and special characters from a filename
  return path.basename(filename)
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace invalid chars with underscore
    .replace(/\.{2,}/g, '.'); // Replace multiple dots with single dot
}

// Middleware to validate SVG options
export function validateSvgOptions(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract options from the request body
    const options = {
      fileFormat: req.body.fileFormat || 'svg',
      svgVersion: req.body.svgVersion || '1.1',
      drawStyle: req.body.drawStyle || 'fillShapes',
      shapeStacking: req.body.shapeStacking || 'placeCutouts',
      groupBy: req.body.groupBy || 'none',
      lineFit: req.body.lineFit || 'medium',
      allowedCurveTypes: req.body.allowedCurveTypes
        ? req.body.allowedCurveTypes.split(',')
        : ['lines', 'quadraticBezier', 'cubicBezier', 'circularArcs', 'ellipticalArcs'],
      fillGaps: req.body.fillGaps === 'true',
      clipOverflow: req.body.clipOverflow === 'true',
      nonScalingStroke: req.body.nonScalingStroke === 'true',
      strokeWidth: parseFloat(req.body.strokeWidth) || 2.0,
    };

    // Validate options against schema
    const validatedOptions = svgOptionsSchema.parse(options);
    
    // Replace request body with validated options
    req.body = { ...req.body, ...validatedOptions };
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid conversion options', 
        details: error.errors 
      });
    }
    next(error);
  }
}

// Middleware to validate color input
export function validateColorInput(req: Request, res: Response, next: NextFunction) {
  try {
    const { svg, color } = req.body;
    
    // Validate against schema
    const validated = colorSchema.parse({ svg, color });
    
    // Sanitize SVG content
    validated.svg = purify.sanitize(validated.svg);
    
    // Replace request body with validated data
    req.body = validated;
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.errors 
      });
    }
    next(error);
  }
}

// Middleware to validate background input
export function validateBackgroundInput(req: Request, res: Response, next: NextFunction) {
  try {
    const { svg, transparent } = req.body;
    
    // Validate against schema
    const validated = backgroundSchema.parse({ 
      svg, 
      transparent: transparent === 'true' || transparent === true 
    });
    
    // Sanitize SVG content
    validated.svg = purify.sanitize(validated.svg);
    
    // Replace request body with validated data
    req.body = validated;
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.errors 
      });
    }
    next(error);
  }
}

// Sanitize SVG content
export function sanitizeSvgContent(svg: string): string {
  return purify.sanitize(svg);
}