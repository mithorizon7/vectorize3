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
      drawStyle: "precise",
      shapeStacking: "stacked",
      groupBy: "color",
      lineFit: "precise",
      allowedCurveTypes: ["cubic", "quadratic", "arc"],
      fillGaps: true,
      clipOverflow: true,
      nonScalingStroke: false,
      strokeWidth: 0.25,
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
      drawStyle: "simple",
      shapeStacking: "layered",
      groupBy: "shape",
      lineFit: "optimized",
      allowedCurveTypes: ["arc", "cubic"],
      fillGaps: false,
      clipOverflow: true,
      nonScalingStroke: true,
      strokeWidth: 1.0,
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
      drawStyle: "detailed",
      shapeStacking: "stacked",
      groupBy: "color",
      lineFit: "balanced",
      allowedCurveTypes: ["cubic", "quadratic", "arc"],
      fillGaps: true,
      clipOverflow: true,
      nonScalingStroke: false,
      strokeWidth: 0.5,
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
      drawStyle: "precise",
      shapeStacking: "layered",
      groupBy: "shape",
      lineFit: "precise",
      allowedCurveTypes: ["linear", "cubic"],
      fillGaps: false,
      clipOverflow: true,
      nonScalingStroke: true,
      strokeWidth: 1.0,
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
      drawStyle: "simple",
      shapeStacking: "layered",
      groupBy: "shape",
      lineFit: "optimized",
      allowedCurveTypes: ["cubic", "quadratic"],
      fillGaps: false,
      clipOverflow: true,
      nonScalingStroke: true,
      strokeWidth: 0.5,
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
      drawStyle: "precise",
      shapeStacking: "flat",
      groupBy: "none",
      lineFit: "precise",
      allowedCurveTypes: ["linear", "cubic"],
      fillGaps: false,
      clipOverflow: true,
      nonScalingStroke: false,
      strokeWidth: 1.0,
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
      drawStyle: "detailed",
      shapeStacking: "stacked",
      groupBy: "color",
      lineFit: "precise",
      allowedCurveTypes: ["cubic", "quadratic", "arc"],
      fillGaps: true,
      clipOverflow: true,
      nonScalingStroke: false,
      strokeWidth: 0.25,
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
  return { ...preset.options };
}