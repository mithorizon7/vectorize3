// SVG Converter Types and Utilities

export type SVGOptions = {
  // Common options
  fileFormat: string;
  svgVersion: string;
  drawStyle: string;
  strokeWidth: number;
  
  // Trace engine selection
  traceEngine: 'potrace' | 'imagetracer' | 'auto';
  
  // Potrace specific options
  shapeStacking: string;
  groupBy: string;
  lineFit: string;
  allowedCurveTypes: string[];
  fillGaps: boolean;
  clipOverflow: boolean;
  nonScalingStroke: boolean;
  
  // Potrace advanced options (for fine-tuning)
  turdSize?: number;      // Suppress speckles of this size or smaller
  alphaMax?: number;      // Corner threshold parameter
  optTolerance?: number;  // Curve optimization tolerance
  
  // ImageTracerJS specific options (for color tracing)
  numberOfColors: number;
  colorMode: 'color' | 'grayscale';
  minColorRatio: number;
  colorQuantization: 'default' | 'riemersma' | 'floyd-steinberg';
  blurRadius: number;
  preserveColors: boolean;
  
  // ImageTracer advanced options (for fine-tuning)
  colorSampling?: 0 | 1;  // 0: disabled, 1: enabled - Whether color sampling should be used
  ltres?: number;         // line threshold, default: 1
  qtres?: number;         // quadratic threshold, default: 1
  pathomit?: number;      // omit paths shorter than this, default: 8
  roundcoords?: number;   // rounding digits, default: 1
  
  // Custom palette option
  customPalette?: string[]; // Array of hex color codes to use as the palette
};

export const initialSVGOptions: SVGOptions = {
  // Common options
  fileFormat: "svg",
  svgVersion: "1.1",
  drawStyle: "fillShapes",
  strokeWidth: 2.0,
  
  // Trace engine selection (default to potrace for b&w images)
  traceEngine: "potrace",
  
  // Potrace specific options
  shapeStacking: "placeCutouts", 
  groupBy: "none",
  lineFit: "medium",
  allowedCurveTypes: ["lines", "quadraticBezier", "cubicBezier", "circularArcs", "ellipticalArcs"],
  fillGaps: true,
  clipOverflow: false,
  nonScalingStroke: true,
  
  // Potrace advanced options - defaults based on lineFit="medium"
  turdSize: 2,      // Suppress speckles of this size or smaller
  alphaMax: 1.0,    // Corner threshold parameter
  optTolerance: 0.2, // Curve optimization tolerance
  
  // ImageTracerJS specific options (for color tracing)
  numberOfColors: 16,
  colorMode: "color",
  minColorRatio: 0.02,
  colorQuantization: "default",
  blurRadius: 0,
  preserveColors: true,
  
  // ImageTracer advanced options - reasonable defaults
  colorSampling: 1,  // 1: enabled - Whether color sampling should be used
  ltres: 1,          // line threshold
  qtres: 1,          // quadratic threshold
  pathomit: 8,       // omit paths shorter than this
  roundcoords: 1,    // rounding digits
  
  // Custom palette starts empty - will be auto-detected
  customPalette: []  // Array of hex color codes to use as the palette
};

export function updateSvgColor(svgContent: string, color: string): string {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Find all path, rect, circle, ellipse, polygon, polyline elements
    const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'];
    for (const tag of shapeTags) {
      const elements = svgDoc.querySelectorAll(tag);
      // Convert NodeList to Array to avoid TypeScript iterability warnings
      Array.from(elements).forEach(el => {
        const fill = el.getAttribute('fill');
        // Only update if fill is not explicitly set to 'none'
        if (!fill || fill !== 'none') {
          el.setAttribute('fill', color);
        }
        
        // If there's a stroke that isn't 'none', update it too
        const stroke = el.getAttribute('stroke');
        if (stroke && stroke !== 'none') {
          el.setAttribute('stroke', color);
        }
      });
    }
    
    // Groups often have fill/stroke attributes too
    const groups = svgDoc.querySelectorAll('g');
    // Convert NodeList to Array to avoid TypeScript iterability warnings
    Array.from(groups).forEach(g => {
      const fill = g.getAttribute('fill');
      if (fill && fill !== 'none') {
        g.setAttribute('fill', color);
      }
      
      const stroke = g.getAttribute('stroke');
      if (stroke && stroke !== 'none') {
        g.setAttribute('stroke', color);
      }
    });
    
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgDoc);
  } catch (error) {
    console.error('Error updating SVG color:', error);
    return svgContent; // Return original content on error
  }
}

export function setTransparentBackground(svgContent: string, isTransparent: boolean): string {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    
    if (svgElement) {
      // Look for background rectangles (often the first rect that covers the whole image)
      const backgrounds = svgElement.querySelectorAll('rect[width="100%"][height="100%"], rect[x="0"][y="0"]');
      
      if (backgrounds.length > 0) {
        // Convert NodeList to Array to avoid TypeScript iterability warnings
        Array.from(backgrounds).forEach(bg => {
          bg.setAttribute('fill', isTransparent ? 'none' : '#FFFFFF');
        });
      } else {
        // If no background rect found, create one
        const newRect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
        newRect.setAttribute('x', '0');
        newRect.setAttribute('y', '0');
        newRect.setAttribute('width', '100%');
        newRect.setAttribute('height', '100%');
        newRect.setAttribute('fill', isTransparent ? 'none' : '#FFFFFF');
        
        // Insert as first child
        if (svgElement.firstChild) {
          svgElement.insertBefore(newRect, svgElement.firstChild);
        } else {
          svgElement.appendChild(newRect);
        }
      }
      
      const serializer = new XMLSerializer();
      return serializer.serializeToString(svgDoc);
    }
    
    return svgContent;
  } catch (error) {
    console.error('Error setting transparent background:', error);
    return svgContent; // Return original content on error
  }
}
