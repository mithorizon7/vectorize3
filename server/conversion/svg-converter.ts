import sharp from "sharp";
import * as potrace from "potrace";
import { promisify } from "util";

// Promisify potrace methods
const traceFile = promisify(potrace.trace);
const posterize = promisify(potrace.posterize);

// Options type for image tracing
interface TracingOptions {
  fileFormat: string;
  svgVersion: string;
  drawStyle: string;
  shapeStacking: string;
  groupBy: string;
  lineFit: string;
  allowedCurveTypes: string[];
  fillGaps: boolean;
  clipOverflow: boolean;
  nonScalingStroke: boolean;
  strokeWidth: number;
}

/**
 * Convert image buffer to SVG string
 */
export async function convertImageToSVG(
  imageBuffer: Buffer,
  options: TracingOptions
): Promise<string> {
  try {
    // Preprocess image using sharp
    const processedImageBuffer = await preprocessImage(imageBuffer);

    // Trace options based on user settings
    const potraceParams: potrace.Parameters = {
      // Convert line fit setting to threshold
      turdSize: getLineFitThreshold(options.lineFit),
      alphaMax: 1,
      optCurve: true,
      // More detailed paths for fine settings
      optTolerance: getOptTolerance(options.lineFit),
      // Optional: Convert color to grayscale threshold
      threshold: -1, // Auto threshold
    };

    // If using "fillShapes" draw style, we use standard potrace
    // For other styles we'd need different approaches
    let svgString = '';
    
    if (options.drawStyle === "fillShapes") {
      const trace = await traceBuffer(processedImageBuffer, potraceParams);
      svgString = trace;
    } else {
      // For stroke options we need a different approach
      // This is a simplified version; in a real implementation
      // you would handle different draw styles differently
      const trace = await traceBuffer(processedImageBuffer, {
        ...potraceParams,
        background: options.clipOverflow ? '#FFFFFF' : 'transparent',
        color: '#000000',
      });
      svgString = trace;
    }

    // Apply SVG version
    svgString = setCorrectSvgVersion(svgString, options.svgVersion);

    return svgString;
  } catch (error) {
    console.error("Error converting image to SVG:", error);
    throw error;
  }
}

/**
 * Preprocess the image for better tracing
 */
async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  // Resize if too large, convert to png format for consistent processing
  return await sharp(imageBuffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
}

/**
 * Convert buffer to SVG using potrace
 */
async function traceBuffer(buffer: Buffer, params: potrace.Parameters): Promise<string> {
  return new Promise((resolve, reject) => {
    const instance = new potrace.Potrace();
    Object.assign(instance, params);
    
    instance.loadImage(buffer, (err) => {
      if (err) return reject(err);
      
      const svg = instance.getSVG(1.0);
      resolve(svg);
    });
  });
}

/**
 * Apply color to SVG content
 */
export async function applySvgColor(svgContent: string, color: string): Promise<string> {
  try {
    // Use regex to replace fill colors that aren't "none"
    // This is a simple approach; a real implementation might use an SVG parser
    const coloredSvg = svgContent.replace(
      /fill="([^"]+)"/g,
      (match, fill) => fill === "none" ? match : `fill="${color}"`
    );
    
    return coloredSvg;
  } catch (error) {
    console.error("Error applying color to SVG:", error);
    throw error;
  }
}

/**
 * Set SVG background transparency
 */
export async function setTransparentBackground(svgContent: string, isTransparent: boolean): Promise<string> {
  try {
    // Look for a background rect (usually first rect with width/height 100% or large dimensions)
    const bgRegex = /<rect[^>]*?(?:width="100%"|x="0"[^>]*?y="0")[^>]*?fill="([^"]+)"[^>]*?>/;
    
    if (bgRegex.test(svgContent)) {
      // Replace background fill
      return svgContent.replace(
        bgRegex,
        (match, fill) => match.replace(`fill="${fill}"`, `fill="${isTransparent ? 'none' : '#FFFFFF'}"`)
      );
    } else {
      // If no background rect found, add one at the beginning of the SVG content
      const svgTagRegex = /(<svg[^>]*?>)/;
      const bgRect = `<rect x="0" y="0" width="100%" height="100%" fill="${isTransparent ? 'none' : '#FFFFFF'}"/>`;
      
      return svgContent.replace(svgTagRegex, `$1${bgRect}`);
    }
  } catch (error) {
    console.error("Error setting SVG background:", error);
    throw error;
  }
}

/**
 * Set correct SVG version in the SVG content
 */
function setCorrectSvgVersion(svgContent: string, version: string): string {
  const versionMap: Record<string, string> = {
    "1.0": '1.0',
    "1.1": '1.1',
    "tiny1.2": '1.2',
  };
  
  const versionString = versionMap[version] || '1.1'; // Default to 1.1
  
  // Replace version in SVG tag
  return svgContent.replace(
    /<svg[^>]*?version="[^"]*?"[^>]*?>/,
    (match) => match.replace(/version="[^"]*?"/, `version="${versionString}"`)
  );
}

/**
 * Get line fit threshold based on user selection
 */
function getLineFitThreshold(lineFit: string): number {
  const thresholds: Record<string, number> = {
    "coarse": 5,
    "medium": 3,
    "fine": 2,
    "superFine": 1,
  };
  
  return thresholds[lineFit] || 3; // Default to medium
}

/**
 * Get optimization tolerance based on line fit selection
 */
function getOptTolerance(lineFit: string): number {
  const tolerances: Record<string, number> = {
    "coarse": 0.5,
    "medium": 0.2,
    "fine": 0.1,
    "superFine": 0.05,
  };
  
  return tolerances[lineFit] || 0.2; // Default to medium
}
