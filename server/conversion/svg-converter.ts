// @ts-ignore
import * as potrace from 'potrace';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Convert image buffer to SVG string
 */
export async function convertImageToSVG(
  imageBuffer: Buffer,
  options: TracingOptions
): Promise<string> {
  try {
    console.log("Converting image to SVG...");
    console.log("Image buffer size:", imageBuffer?.length || 0, "bytes");
    console.log("Options:", JSON.stringify(options, null, 2));
    
    // Create a temp file for potrace (it works better with files than buffers)
    const tmpFilePath = path.join(tempDir, `${crypto.randomUUID()}.png`);
    console.log("Temp file path:", tmpFilePath);
    fs.writeFileSync(tmpFilePath, imageBuffer);
    console.log("Temp file created. Size:", fs.statSync(tmpFilePath).size, "bytes");
    
    try {
      // Set up potrace parameters based on options
      const params: any = {
        background: '#fff',
        color: '#000',
        threshold: 128,
        turdSize: 2,
        alphaMax: 1,
        optCurve: true,
        optTolerance: getOptTolerance(options.lineFit),
        blackOnWhite: true,
        turnPolicy: 'minority',
        // Set curve type options
        curveOptions: {
          optCurve: true,
          threshold: getLineFitThreshold(options.lineFit),
          alphaMax: options.fillGaps ? 1.2 : 1,
        }
      };

      // Call potrace with the temp file path
      const svgString = await traceImageFile(tmpFilePath, params);
      
      // Apply SVG transformations
      let result = svgString;
      
      // Set proper SVG version
      result = setCorrectSvgVersion(result, options.svgVersion);
      
      // Apply non-scaling stroke if selected
      if (options.nonScalingStroke) {
        result = result.replace(/<path /g, '<path vector-effect="non-scaling-stroke" ');
      }
      
      // Set stroke width if provided
      if (options.strokeWidth > 0 && options.drawStyle === 'stroke') {
        result = result.replace(/<path /g, `<path stroke-width="${options.strokeWidth}" fill="none" stroke="black" `);
      }
      
      // Add clip path if selected
      if (options.clipOverflow) {
        // Extract viewBox dimensions
        const viewBoxMatch = result.match(/viewBox="([^"]+)"/);
        if (viewBoxMatch && viewBoxMatch[1]) {
          const viewBox = viewBoxMatch[1].split(' ');
          const width = viewBox[2];
          const height = viewBox[3];
          
          // Add clipPath
          result = result.replace(
            /<svg /,
            `<svg><defs><clipPath id="clip"><rect width="${width}" height="${height}" /></clipPath></defs><g clip-path="url(#clip)" `
          );
          
          // Close the added g tag
          result = result.replace(/<\/svg>/, '</g></svg>');
        }
      }
      
      return result;
    } finally {
      // Clean up the temp file
      try {
        if (fs.existsSync(tmpFilePath)) {
          fs.unlinkSync(tmpFilePath);
        }
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }
  } catch (error) {
    console.error("Error converting image to SVG:", error);
    throw error;
  }
}

/**
 * Trace an image file using potrace
 */
async function traceImageFile(filePath: string, params: any): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log("Creating Potrace tracer with params:", JSON.stringify(params));
      const tracer = new potrace.Potrace();
      
      // Configure the tracer with our params
      Object.keys(params).forEach(key => {
        if (key !== 'curveOptions') {
          (tracer as any)[key] = params[key];
        }
      });
      
      // Handle curve options separately if they exist
      if (params.curveOptions) {
        Object.keys(params.curveOptions).forEach(key => {
          (tracer as any)[key] = params.curveOptions[key];
        });
      }
      
      console.log("Loading image from file:", filePath);
      // Load the image from file
      tracer.loadImage(filePath, (err: any) => {
        if (err) {
          console.error("Error loading image with Potrace:", err);
          return reject(new Error(`Error loading image: ${err.message || err}`));
        }
        
        console.log("Image loaded successfully, getting SVG");
        // Get SVG string
        const svg = tracer.getSVG();
        console.log("SVG generated successfully, length:", svg?.length || 0);
        resolve(svg);
      });
    } catch (err) {
      console.error("Error in traceImageFile:", err);
      reject(err);
    }
  });
}

/**
 * Apply color to SVG content
 */
export async function applySvgColor(svgContent: string, color: string): Promise<string> {
  try {
    // Create a DOM parser
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    
    // Find all path elements
    const paths = document.querySelectorAll('path');
    paths.forEach(path => {
      if (path.hasAttribute('fill') && path.getAttribute('fill') !== 'none') {
        path.setAttribute('fill', color);
      }
      
      if (path.hasAttribute('stroke') && path.getAttribute('stroke') !== 'none') {
        path.setAttribute('stroke', color);
      }
    });
    
    // Return the modified SVG
    return dom.serialize();
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
    if (isTransparent) {
      // Remove any background rectangle if it exists
      return svgContent.replace(/<rect[^>]*?(?:id|class)="background"[^>]*?\/>/, '');
    } else {
      // Check if SVG already has a background rect
      if (svgContent.includes('id="background"') || svgContent.includes('class="background"')) {
        return svgContent;
      }
      
      // Extract viewBox to get dimensions
      const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
      if (viewBoxMatch && viewBoxMatch[1]) {
        const viewBox = viewBoxMatch[1].split(' ');
        const width = viewBox[2];
        const height = viewBox[3];
        
        // Add white background
        const backgroundRect = `<rect id="background" x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`;
        
        // Insert after the SVG opening tag
        return svgContent.replace(/<svg([^>]*)>/, `<svg$1>${backgroundRect}`);
      }
    }
    
    return svgContent;
  } catch (error) {
    console.error("Error setting SVG background:", error);
    throw error;
  }
}

/**
 * Set correct SVG version in the SVG content
 */
function setCorrectSvgVersion(svgContent: string, version: string): string {
  const versionMap: { [key: string]: string } = {
    '1.0': '1.0',
    '1.1': '1.1',
    '2.0': '2.0'
  };
  
  const actualVersion = versionMap[version] || '1.1';
  
  // Replace version attribute if it exists
  if (svgContent.includes('version="')) {
    return svgContent.replace(/version="[^"]*"/, `version="${actualVersion}"`);
  } else {
    // Add version attribute if it doesn't exist
    return svgContent.replace(/<svg/, `<svg version="${actualVersion}"`);
  }
}

/**
 * Get line fit threshold based on user selection
 */
function getLineFitThreshold(lineFit: string): number {
  switch (lineFit) {
    case 'loose':
      return 10.0;
    case 'default':
      return 4.0; 
    case 'tight':
      return 2.0;
    case 'optimized':
      return 1.0;
    default:
      return 4.0;
  }
}

/**
 * Get optimization tolerance based on line fit selection
 */
function getOptTolerance(lineFit: string): number {
  switch (lineFit) {
    case 'loose':
      return 1.0;
    case 'default':
      return 0.5;
    case 'tight':
      return 0.3;
    case 'optimized':
      return 0.2;
    default:
      return 0.5;
  }
}