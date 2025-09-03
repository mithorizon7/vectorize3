import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';
import { processImageBuffer } from '../utils/imageProcessing';
import { ensureTransparentBackground, removeTracerBackgrounds } from '../utils/transparencyUtils';
import { applySVGGrouping, optimizeSVGForUseCase } from '../utils/svgGroupingUtils';
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
  
  // Advanced grouping options now supported by ImageTracer
  shapeStacking?: 'stacked' | 'layered' | 'flat' | 'placeCutouts';
  groupBy?: 'color' | 'shape' | 'none';
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
  
  // NEW: Advanced ImageTracer options
  colorSampling?: 0 | 1; // 0: disabled, 1: enabled - Whether color sampling should be used
  ltres?: number; // line threshold, default: 1
  qtres?: number; // quadratic threshold, default: 1
  pathomit?: number; // omit paths shorter than this, default: 8
  roundcoords?: number; // rounding digits, default: 1
  
  // NEW: Custom palette for color mapping
  customPalette?: string[]; // Array of hex color codes to use as the palette
  
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
    
    // Process the image buffer to normalize format and preserve quality
    const { processedBuffer, metadata, format } = await processImageBuffer(imageBuffer, 'ImageTracer conversion');
    
    console.log(`Processed ${format.toUpperCase()} image for ImageTracer conversion`);
    
    // Create a temp file for ImageTracer using the processed PNG buffer
    const tmpFilePath = path.join(tempDir, `${crypto.randomUUID()}.png`);
    console.log("Temp file path:", tmpFilePath);
    fs.writeFileSync(tmpFilePath, processedBuffer);
    console.log("Temp file created. Size:", fs.statSync(tmpFilePath).size, "bytes");
    
    try {
      // Configure ImageTracer params based on options with optimized defaults
      const params = {
        // Core tracing - adaptive color count based on preserveColors setting
        numberofcolors: options.preserveColors ? 
          Math.max(options.numberOfColors || 24, 16) : // Higher default when preserving colors
          (options.numberOfColors || 16),
        colorquantcycles: options.preserveColors ? 4 : 3, // More quantization cycles for better color accuracy
        layering: 0, // 0: sequential, 1: parallel
        
        // Color selection - improved for color preservation
        colorsampling: options.colorSampling !== undefined ? options.colorSampling : 
                      (options.colorMode === 'grayscale' ? 0 : 1), // 0: disabled, 1: enabled
        mincolorratio: options.preserveColors ? 
          Math.min(options.minColorRatio || 0.01, 0.015) : // Lower threshold to capture more colors
          (options.minColorRatio || 0.02),
        colorquantization: 
          options.colorQuantization === 'riemersma' ? 1 :
          options.colorQuantization === 'floyd-steinberg' ? 2 : 
          (options.preserveColors ? 2 : 0), // Default to floyd-steinberg for better color gradients when preserving colors
        
        // Tracing - optimized for detail preservation
        ltres: options.ltres !== undefined ? options.ltres : 
               (options.preserveColors ? 0.8 : 1), // Lower line threshold for more detail when preserving colors
        qtres: options.qtres !== undefined ? options.qtres : 
               (options.preserveColors ? 0.8 : 1), // Lower quadratic threshold for smoother curves
        
        // Path optimization - balance between detail and file size
        pathomit: options.pathomit !== undefined ? options.pathomit : 
                  (options.preserveColors ? 6 : 8), // Keep smaller paths when preserving colors
        
        // Edge enhancement
        strokewidth: options.strokeWidth || 1, // SVG stroke-width
        
        // SVG attributes
        linefilter: true, // enable line filter for noise reduction
        scale: 1, // scale the SVG
        roundcoords: options.roundcoords !== undefined ? options.roundcoords : 
                    (options.preserveColors ? 2 : 1), // Higher precision when preserving colors
        viewbox: true, // include viewBox
        
        // Preprocessing options - optimized for color preservation
        blurradius: options.blurRadius || (options.preserveColors ? 0 : 0), // No blur when preserving colors
        blurdelta: options.preserveColors ? 10 : 20, // Lower blur delta for better color accuracy
        
        // Output options - use custom palette if provided
        pal: options.customPalette ? 
             options.customPalette.map(color => {
               // Convert hex to RGB array for ImageTracer
               const hex = color.replace('#', '');
               return [
                 parseInt(hex.substring(0, 2), 16),
                 parseInt(hex.substring(2, 4), 16),
                 parseInt(hex.substring(4, 6), 16)
               ];
             }) : []
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
          let processedSVG = setCorrectSvgVersion(svgString, options.svgVersion);
          
          // IMPORTANT: Remove any backgrounds by default for transparent output
          console.log("Applying transparent background processing...");
          processedSVG = removeTracerBackgrounds(processedSVG, 'imagetracer');
          
          // Apply advanced SVG grouping and layering for ImageTracer
          console.log("Applying SVG grouping and layering to ImageTracer output...");
          if (options.shapeStacking || options.groupBy) {
            applySVGGrouping(processedSVG, {
              shapeStacking: options.shapeStacking || 'placeCutouts',
              groupBy: options.groupBy || 'none',
              allowedCurveTypes: options.allowedCurveTypes
            }).then(groupedSVG => {
              resolve(groupedSVG);
            }).catch(err => {
              console.error("Error applying SVG grouping:", err);
              resolve(processedSVG); // Return original on error
            });
          } else {
            resolve(processedSVG);
          }
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
 * Returns a comprehensive color analysis using Sharp
 */
export async function detectColorComplexity(imageBuffer: Buffer): Promise<{
  isColorImage: boolean;
  colorComplexity: number;
  distinctColors: number;
  entropy: number;
  dominantColors: string[];
  hasAlpha: boolean;
}> {
  try {
    console.log("Analyzing image color complexity with Sharp...");
    const image = sharp(imageBuffer);
    
    // Get image stats (dominant color, entropy)
    const stats = await image.stats();
    
    // Get metadata (channels, alpha)
    const metadata = await image.metadata();
    
    console.log("Image metadata:", {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha
    });
    
    console.log("Image stats entropy:", stats.entropy);
    
    // Calculate dominant colors from channel stats
    const dominantColors: string[] = [];
    
    if (stats.channels) {
      // Get channels mean values to determine dominant colors
      const redMean = stats.channels[0].mean;
      const greenMean = stats.channels[1].mean;
      const blueMean = stats.channels[2].mean;
      
      // Add dominant color as hex
      const dominantHex = '#' + 
        Math.round(redMean).toString(16).padStart(2, '0') +
        Math.round(greenMean).toString(16).padStart(2, '0') +
        Math.round(blueMean).toString(16).padStart(2, '0');
      
      dominantColors.push(dominantHex);
      
      // Check if image has more than one dominant color by analyzing standard deviation
      const colorVariation = 
        stats.channels[0].stdev + 
        stats.channels[1].stdev + 
        stats.channels[2].stdev;
      
      console.log("Color variation score:", colorVariation);
      
      // Higher variation indicates more colors
      if (colorVariation > 50) {
        // Create additional color variations based on the stats
        const altColor1 = '#' + 
          Math.min(255, Math.round(redMean + stats.channels[0].stdev)).toString(16).padStart(2, '0') +
          Math.min(255, Math.round(greenMean + stats.channels[1].stdev)).toString(16).padStart(2, '0') +
          Math.min(255, Math.round(blueMean + stats.channels[2].stdev)).toString(16).padStart(2, '0');
          
        const altColor2 = '#' + 
          Math.max(0, Math.round(redMean - stats.channels[0].stdev)).toString(16).padStart(2, '0') +
          Math.max(0, Math.round(greenMean - stats.channels[1].stdev)).toString(16).padStart(2, '0') +
          Math.max(0, Math.round(blueMean - stats.channels[2].stdev)).toString(16).padStart(2, '0');
          
        dominantColors.push(altColor1, altColor2);
      }
    }
    
    console.log("Detected dominant colors:", dominantColors);
    
    // Determine if it's a color image based on channel stats
    let isColorImage = false;
    let colorComplexity = 0;
    let distinctColors = 0;
    
    if (stats.channels && stats.channels.length >= 3) {
      // Calculate standard deviation across RGB to detect color variation
      const redStd = stats.channels[0].stdev;
      const greenStd = stats.channels[1].stdev;
      const blueStd = stats.channels[2].stdev;
      
      // Mean standard deviation indicates color complexity
      const meanStdDev = (redStd + greenStd + blueStd) / 3;
      
      // Calculate color similarity (normalized 0-1)
      const meanValues = [stats.channels[0].mean, stats.channels[1].mean, stats.channels[2].mean];
      const maxDiff = Math.max(
        Math.abs(meanValues[0] - meanValues[1]),
        Math.abs(meanValues[0] - meanValues[2]),
        Math.abs(meanValues[1] - meanValues[2])
      );
      
      // Normalized color difference (0 = grayscale, 1 = maximum color difference)
      const normalizedColorDiff = maxDiff / 255;
      
      console.log("Color metrics:", {
        meanStdDev,
        normalizedColorDiff,
        channelMeans: meanValues
      });
      
      // Combine metrics for overall color complexity
      colorComplexity = (normalizedColorDiff * 0.7) + (Math.min(meanStdDev / 50, 1) * 0.3);
      
      // Estimate distinct colors from stats
      // Higher stdev and entropy indicate more distinct colors
      distinctColors = Math.round(
        (meanStdDev / 10) * 
        (stats.entropy * 5) * 
        Math.max(metadata.width || 100, metadata.height || 100) / 1000
      );
      
      // Cap distinct colors at a reasonable maximum
      distinctColors = Math.min(distinctColors, 256);
      
      // Image is considered color if complexity exceeds threshold
      isColorImage = colorComplexity > 0.1 || normalizedColorDiff > 0.15;
    }
    
    // Check if image has alpha channel
    const hasAlpha = metadata.hasAlpha || false;
    
    const result = {
      isColorImage,
      colorComplexity,
      distinctColors: Math.max(distinctColors, dominantColors.length),
      entropy: stats.entropy,
      dominantColors,
      hasAlpha
    };
    
    console.log("Color analysis result:", result);
    
    return result;
  } catch (error) {
    console.error('Error detecting color complexity with Sharp:', error);
    
    // Fallback to default values if Sharp analysis fails
    return {
      isColorImage: false,
      colorComplexity: 0,
      distinctColors: 0,
      entropy: 0,
      dominantColors: ['#000000'],
      hasAlpha: false
    };
  }
}