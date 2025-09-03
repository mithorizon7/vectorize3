import { SVGOptions } from "./svg-converter";

export type PresetCategory = 
  | "logo" 
  | "icon" 
  | "illustration" 
  | "diagram" 
  | "webAnimation" 
  | "manufacturing" 
  | "print";

export interface Preset {
  id: PresetCategory;
  name: string;
  description: string;
  options: SVGOptions;
  colorSettings?: {
    defaultColor?: string;
    preserveOriginalColors?: boolean;
    recommendedPalette?: string[];
  };
}

export const presets: Preset[] = [
  {
    id: "logo",
    name: "Logo & Brand Graphics",
    description: "Maximum clarity, exact color matching, and scalability for brand assets",
    options: {
      fileFormat: "svg",
      svgVersion: "1.1",
      drawStyle: "fillShapes",
      strokeWidth: 0.25,
      traceEngine: "imagetracer", // Force ImageTracer for color accuracy
      shapeStacking: "layered", // Layer shapes for clean brand graphics
      groupBy: "color", // Group by color for easy brand color management
      lineFit: "fine", // High precision for crisp logos
      allowedCurveTypes: ["lines", "quadraticBezier", "cubicBezier"],
      fillGaps: true,
      clipOverflow: false,
      nonScalingStroke: true,
      turdSize: 1, // Remove even small speckles for clean look
      alphaMax: 0.8, // Tighter corners for precision
      optTolerance: 0.1, // High precision optimization
      numberOfColors: 12, // Optimized for brand colors - not too many, not too few
      colorMode: "color",
      minColorRatio: 0.005, // Lower threshold to preserve brand colors
      colorQuantization: "floyd-steinberg",
      blurRadius: 0, // No blur for sharp logos
      preserveColors: true,
      colorSampling: 1,
      ltres: 0.5, // Lower line threshold for detail preservation
      qtres: 0.5, // Lower quadratic threshold for smooth curves
      pathomit: 4, // Keep more detail for logos
      roundcoords: 2, // Higher precision coordinates
      customPalette: [],
    },
    colorSettings: {
      preserveOriginalColors: true,
      recommendedPalette: ["#000000", "#FFFFFF", "#0099ff", "#ff3366", "#ffcc00"],
    }
  },
  {
    id: "icon",
    name: "Icons & UI Elements",
    description: "Minimal file size, clarity at small sizes, consistent style",
    options: {
      fileFormat: "svg",
      svgVersion: "1.1",
      drawStyle: "fillShapes",
      strokeWidth: 1.0,
      traceEngine: "potrace", // Use Potrace for smaller file sizes
      shapeStacking: "flat", // Flatten for minimal complexity
      groupBy: "shape", // Group by shape type for UI consistency
      lineFit: "medium",
      allowedCurveTypes: ["lines", "quadraticBezier"], // Simpler curves for icons
      fillGaps: false, // Keep clean edges
      clipOverflow: false,
      nonScalingStroke: true,
      turdSize: 4, // Remove more noise for clean icons
      alphaMax: 1.2, // Slightly softer corners for UI friendliness
      optTolerance: 0.3, // Balance file size vs quality
      numberOfColors: 4, // Minimal colors for small file size
      colorMode: "grayscale", // Single-color icons
      minColorRatio: 0.05, // Higher threshold to reduce unnecessary detail
      colorQuantization: "default", // Simple quantization for speed
      blurRadius: 0,
      preserveColors: false,
      colorSampling: 0, // Disable for speed
      ltres: 1.5, // Higher threshold for simpler paths
      qtres: 1.5,
      pathomit: 12, // Remove small paths aggressively
      roundcoords: 1, // Standard precision is enough
      customPalette: [],
    },
    colorSettings: {
      defaultColor: "#000000",
      preserveOriginalColors: false,
      recommendedPalette: ["#000000", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db"],
    }
  },
  {
    id: "illustration",
    name: "Illustrations & Detailed Graphics",
    description: "Balance between detail and performance for complex images",
    options: {
      fileFormat: "svg",
      svgVersion: "1.1",
      drawStyle: "fillShapes",
      strokeWidth: 0.5,
      traceEngine: "auto",
      shapeStacking: "placeCutouts",
      groupBy: "none",
      lineFit: "medium",
      allowedCurveTypes: ["lines", "quadraticBezier", "cubicBezier"],
      fillGaps: true,
      clipOverflow: false,
      nonScalingStroke: true,
      turdSize: 2,
      alphaMax: 1.0,
      optTolerance: 0.2,
      numberOfColors: 20,
      colorMode: "color",
      minColorRatio: 0.01,
      colorQuantization: "floyd-steinberg",
      blurRadius: 0,
      preserveColors: true,
      colorSampling: 1,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      roundcoords: 1,
      customPalette: [],
    },
    colorSettings: {
      preserveOriginalColors: true,
    }
  },
  {
    id: "diagram",
    name: "Technical Diagrams & Charts",
    description: "Precision, clarity, scalability, and structure for technical content",
    options: {
      fileFormat: "svg",
      svgVersion: "1.1",
      drawStyle: "fillShapes",
      strokeWidth: 1.0,
      traceEngine: "auto",
      shapeStacking: "placeCutouts",
      groupBy: "none",
      lineFit: "medium",
      allowedCurveTypes: ["lines", "quadraticBezier", "cubicBezier"],
      fillGaps: false,
      clipOverflow: false,
      nonScalingStroke: true,
      turdSize: 2,
      alphaMax: 1.0,
      optTolerance: 0.2,
      numberOfColors: 12,
      colorMode: "color",
      minColorRatio: 0.01,
      colorQuantization: "floyd-steinberg",
      blurRadius: 0,
      preserveColors: true,
      colorSampling: 1,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      roundcoords: 1,
      customPalette: [],
    },
    colorSettings: {
      preserveOriginalColors: true,
      recommendedPalette: ["#000000", "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"],
    }
  },
  {
    id: "webAnimation",
    name: "Web Animations & Interactive Graphics",
    description: "Clean structure optimized for CSS/JavaScript interactions",
    options: {
      fileFormat: "svg",
      svgVersion: "1.1",
      drawStyle: "fillShapes",
      strokeWidth: 0.5,
      traceEngine: "imagetracer", // Color tracing for rich animations
      shapeStacking: "layered", // Layered structure for animation targeting
      groupBy: "color", // Group by color for easy animation control
      lineFit: "fine", // Smooth paths for animation
      allowedCurveTypes: ["lines", "quadraticBezier", "cubicBezier"],
      fillGaps: false,
      clipOverflow: false,
      nonScalingStroke: true,
      turdSize: 1, // Clean details for animation
      alphaMax: 0.9, // Smooth corners for fluid animation
      optTolerance: 0.15, // Balance between smoothness and file size
      numberOfColors: 16, // Rich color palette for animations
      colorMode: "color",
      minColorRatio: 0.01,
      colorQuantization: "floyd-steinberg",
      blurRadius: 0,
      preserveColors: true,
      colorSampling: 1,
      ltres: 0.8, // Lower threshold for smooth animation paths
      qtres: 0.8,
      pathomit: 6,
      roundcoords: 1,
      customPalette: [],
    },
    colorSettings: {
      preserveOriginalColors: true,
    }
  },
  {
    id: "manufacturing",
    name: "Manufacturing (CNC/Embroidery)",
    description: "Single continuous paths or precise vector paths for production",
    options: {
      fileFormat: "svg",
      svgVersion: "1.1",
      drawStyle: "strokeOutlines", // Stroke-only for manufacturing
      strokeWidth: 1.0,
      traceEngine: "potrace", // Potrace for simple, continuous paths
      shapeStacking: "flat", // Flat structure for manufacturing tools
      groupBy: "shape", // Group by shape for tool path optimization
      lineFit: "coarse", // Simplified paths for manufacturing
      allowedCurveTypes: ["lines"], // Lines only for CNC compatibility
      fillGaps: false,
      clipOverflow: false,
      nonScalingStroke: true,
      turdSize: 8, // Aggressively remove small details
      alphaMax: 1.5, // Very smooth corners
      optTolerance: 0.5, // Heavy simplification
      numberOfColors: 1, // Single color/path for manufacturing
      colorMode: "grayscale",
      minColorRatio: 0.1, // High threshold for simplicity
      colorQuantization: "default",
      blurRadius: 0,
      preserveColors: false,
      colorSampling: 0,
      ltres: 2, // High threshold for simple lines
      qtres: 2,
      pathomit: 16, // Remove small paths aggressively
      roundcoords: 0, // Integer coordinates for manufacturing
      customPalette: [],
    },
    colorSettings: {
      defaultColor: "#000000",
      preserveOriginalColors: false,
    }
  },
  {
    id: "print",
    name: "Print Media",
    description: "Precise color and high-quality vector paths suitable for printing",
    options: {
      fileFormat: "svg",
      svgVersion: "1.1",
      drawStyle: "fillShapes",
      strokeWidth: 0.25,
      traceEngine: "auto",
      shapeStacking: "placeCutouts",
      groupBy: "none",
      lineFit: "medium",
      allowedCurveTypes: ["lines", "quadraticBezier", "cubicBezier"],
      fillGaps: true,
      clipOverflow: false,
      nonScalingStroke: true,
      turdSize: 2,
      alphaMax: 1.0,
      optTolerance: 0.2,
      numberOfColors: 24,
      colorMode: "color",
      minColorRatio: 0.01,
      colorQuantization: "floyd-steinberg",
      blurRadius: 0,
      preserveColors: true,
      colorSampling: 1,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      roundcoords: 1,
      customPalette: [],
    },
    colorSettings: {
      preserveOriginalColors: true,
    }
  },
];

export function getPresetById(id: PresetCategory): Preset | undefined {
  return presets.find(preset => preset.id === id);
}

export function applyPreset(preset: Preset): SVGOptions {
  const options = { ...preset.options };
  
  // Apply color settings from preset if they exist
  if (preset.colorSettings) {
    if (preset.colorSettings.preserveOriginalColors !== undefined) {
      options.preserveColors = preset.colorSettings.preserveOriginalColors;
      
      // If preserving colors, ensure ImageTracer is used and optimize settings
      if (options.preserveColors) {
        options.traceEngine = 'imagetracer';
        options.numberOfColors = Math.max(options.numberOfColors, 16);
        options.colorQuantization = 'floyd-steinberg';
        options.minColorRatio = 0.01;
      }
    }
    
    // Apply recommended palette if available
    if (preset.colorSettings.recommendedPalette) {
      options.customPalette = preset.colorSettings.recommendedPalette;
    }
  }
  
  return options;
}