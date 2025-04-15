import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { JSDOM } from 'jsdom';
// Use dynamic import for imagetracer since it's a dual module (supports CJS and ESM)
// This is a workaround for the "require is not defined in ES module scope" error
let ImageTracer: any = null;
import('imagetracer').then(module => {
  ImageTracer = module.default || module;
});

// Define the interface to accept all options from the client but only use what we need
export interface ColorTracingOptions {
  // Common options from SVGOptions
  fileFormat?: string;
  svgVersion: string;
  drawStyle?: string;
  strokeWidth: number;
  traceEngine?: 'potrace' | 'imagetracer' | 'auto';
  
  // We accept but ignore these Potrace-specific options
  shapeStacking?: string;
  groupBy?: string;
  lineFit?: string;
  allowedCurveTypes?: string[];
  fillGaps?: boolean;
  clipOverflow?: boolean;
  nonScalingStroke?: boolean;
  
  // ImageTracerJS specific options
  numberOfColors: number; // 2-256
  colorMode: 'color' | 'grayscale'; // color or grayscale
  minColorRatio: number; // 0-1, colors below this ratio are ignored
  colorQuantization: 'default' | 'riemersma' | 'floyd-steinberg'; // dithering method
  blurRadius: number; // preprocessing blur kernel radius, 0 = no blur
  preserveColors?: boolean;
  
  // Additional options that may not be in the client-side options
  lineJoin?: 'round' | 'bevel' | 'miter';
  lineCap?: 'round' | 'square' | 'butt';
  trackColors?: boolean; // tracks colors for multicolor mode
}

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Convert image buffer to color SVG using ImageTracerJS
 */
export async function convertImageToColorSVG(
  imageBuffer: Buffer,
  options: ColorTracingOptions
): Promise<string> {
  try {
    console.log("Converting image to Color SVG with ImageTracerJS...");
    console.log("Image buffer size:", imageBuffer?.length || 0, "bytes");
    console.log("Options:", JSON.stringify(options, null, 2));
    
    // Create a temp file for ImageTracer (it works with files)
    const tmpFilePath = path.join(tempDir, `${crypto.randomUUID()}.png`);
    console.log("Temp file path:", tmpFilePath);
    fs.writeFileSync(tmpFilePath, imageBuffer);
    console.log("Temp file created. Size:", fs.statSync(tmpFilePath).size, "bytes");
    
    try {
      // Configure ImageTracer params based on options
      const params = {
        // Core tracing
        numberofcolors: options.numberOfColors || 16,
        colorquantcycles: 3,
        layering: 0, // 0: sequential, 1: parallel
        
        // Color selection
        colorsampling: options.colorMode === 'grayscale' ? 0 : 1, // 0: disabled, 1: enabled
        mincolorratio: options.minColorRatio || 0.02,
        colorquantization: 
          options.colorQuantization === 'riemersma' ? 1 :
          options.colorQuantization === 'floyd-steinberg' ? 2 : 0, // 0: default, 1: riemersma, 2: floyd-steinberg
        
        // Tracing
        ltres: 1, // line threshold, default: 1
        qtres: 1, // quadratic threshold, default: 1
        
        // Path optimization
        pathomit: 8, // omit paths shorter than this, default: 8
        
        // Edge enhancement
        strokewidth: options.strokeWidth || 1, // SVG stroke-width
        
        // SVG attributes
        linefilter: true, // enable line filter for noise reduction
        scale: 1, // scale the SVG
        roundcoords: 1, // rounding digits (0 = no rounding)
        viewbox: true, // include viewBox
        
        // Debug options
        blurradius: options.blurRadius || 0, // blur radius
        blurdelta: 20, // blur delta
        
        // Output options
        pal: [] // custom palette, empty = generate automatically
      };
      
      // Log the ImageTracer parameters
      console.log("ImageTracer parameters:", JSON.stringify(params, null, 2));
      
      // Trace the image using ImageTracer and get SVG string
      return new Promise((resolve, reject) => {
        try {
          // Use the correct method name from the package
          const svgString = ImageTracer.imageTracer(
            tmpFilePath,
            params
          );
          
          console.log("SVG generation successful, length:", svgString?.length || 0);
          
          // Set proper SVG version
          const processedSVG = setCorrectSvgVersion(svgString, options.svgVersion);
          
          resolve(processedSVG);
        } catch (traceErr) {
          console.error("Error in ImageTracer.imageTracer:", traceErr);
          reject(new Error(`ImageTracer error: ${traceErr}`));
        }
      });
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
    console.error("Error converting image to color SVG:", error);
    throw error;
  }
}

/**
 * Apply a specific color palette to the SVG
 */
export async function applySVGColorPalette(svgContent: string, colorPalette: string[]): Promise<string> {
  try {
    // Create a DOM parser
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    
    // Find all path elements
    const paths = document.querySelectorAll('path');
    
    // Get current colors from paths
    const currentColors = new Set<string>();
    paths.forEach(path => {
      if (path.hasAttribute('fill') && path.getAttribute('fill') !== 'none') {
        currentColors.add(path.getAttribute('fill')!);
      }
    });
    
    // Map existing colors to new palette colors
    const colorMap: Record<string, string> = {};
    const colorArray = Array.from(currentColors);
    
    colorArray.forEach((color, index) => {
      // Map each color to a color in the palette, cycling if needed
      colorMap[color] = colorPalette[index % colorPalette.length];
    });
    
    // Apply new colors
    paths.forEach(path => {
      if (path.hasAttribute('fill') && path.getAttribute('fill') !== 'none') {
        const currentColor = path.getAttribute('fill')!;
        path.setAttribute('fill', colorMap[currentColor] || currentColor);
      }
      
      if (path.hasAttribute('stroke') && path.getAttribute('stroke') !== 'none') {
        const currentColor = path.getAttribute('stroke')!;
        path.setAttribute('stroke', colorMap[currentColor] || currentColor);
      }
    });
    
    // Return the modified SVG
    return dom.serialize();
  } catch (error) {
    console.error("Error applying color palette to SVG:", error);
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
 * Detect if an image is better suited for color tracing vs. black and white tracing
 * Returns a value from 0 (definitely B&W) to 1 (definitely color)
 */
export async function detectColorComplexity(imageBuffer: Buffer): Promise<{
  isColorImage: boolean;
  colorScore: number;
  distinctColors: number;
}> {
  try {
    // This is a placeholder - in a real implementation, you would:
    // 1. Use Sharp or another image processing library to analyze the image
    // 2. Detect the number of distinct colors
    // 3. Measure color variance and distribution
    // 4. Return a score based on these metrics
    
    // For now we'll return a default that suggests moderate color complexity
    return {
      isColorImage: true,
      colorScore: 0.7,
      distinctColors: 24
    };
  } catch (error) {
    console.error("Error detecting color complexity:", error);
    // Default to black and white on error
    return {
      isColorImage: false,
      colorScore: 0,
      distinctColors: 2
    };
  }
}