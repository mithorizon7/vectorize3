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
      numberOfColors: 16,
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
      numberOfColors: 8,
      colorMode: "color",
      minColorRatio: 0.02,
      colorQuantization: "floyd-steinberg",
      blurRadius: 0,
      preserveColors: false,
      colorSampling: 1,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      roundcoords: 1,
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
      numberOfColors: 16,
      colorMode: "color",
      minColorRatio: 0.01,
      colorQuantization: "floyd-steinberg",
      blurRadius: 0,
      preserveColors: true,
      colorSampling: 1,
      ltres: 1,
      qtres: 1,
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
      drawStyle: "fillShapes",
      strokeWidth: 1.0,
      traceEngine: "potrace",
      shapeStacking: "placeCutouts",
      groupBy: "none",
      lineFit: "medium",
      allowedCurveTypes: ["lines", "quadraticBezier"],
      fillGaps: false,
      clipOverflow: false,
      nonScalingStroke: true,
      turdSize: 2,
      alphaMax: 1.0,
      optTolerance: 0.2,
      numberOfColors: 4,
      colorMode: "grayscale",
      minColorRatio: 0.05,
      colorQuantization: "default",
      blurRadius: 0,
      preserveColors: false,
      colorSampling: 1,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      roundcoords: 1,
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