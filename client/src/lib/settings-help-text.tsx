import React from "react";

export type SettingCategory = 
  | "format" 
  | "structure" 
  | "paths";

export type SettingId = 
  // Common options
  | "fileFormat"
  | "svgVersion"
  | "drawStyle"
  | "strokeWidth"
  | "traceEngine"
  
  // Potrace specific options
  | "shapeStacking"
  | "groupBy"
  | "lineFit"
  | "allowedCurveTypes"
  | "fillGaps"
  | "clipOverflow"
  | "nonScalingStroke"
  
  // Potrace advanced options
  | "turdSize"
  | "alphaMax"
  | "optTolerance"
  
  // ImageTracerJS specific options
  | "numberOfColors"
  | "colorMode"
  | "minColorRatio"
  | "colorQuantization"
  | "blurRadius"
  | "preserveColors"
  
  // ImageTracer advanced options
  | "colorSampling"
  | "ltres"
  | "qtres"
  | "pathomit"
  | "roundcoords"
  
  // Custom palette option
  | "customPalette";

interface SettingHelpText {
  title: string;
  description: React.ReactNode;
  tips?: React.ReactNode;
}

export const settingsHelpText: Record<SettingId, SettingHelpText> = {
  fileFormat: {
    title: "Output Format",
    description: 
      "The file format for your converted image. Each format has different use cases and compatibility considerations.",
    tips: (
      <>
        <strong>SVG</strong>: Best for web, scales infinitely, supports animations and interactivity. <br />
        <strong>PDF/EPS</strong>: Ideal for print, widely supported in design applications. <br />
        <strong>DXF</strong>: Used primarily for CAD and CNC applications. <br />
        <strong>PNG</strong>: Creates raster image with transparency, not scalable like vector formats.
      </>
    )
  },
  
  svgVersion: {
    title: "SVG Version",
    description: 
      "Specifies which SVG specification to follow. Affects compatibility with different browsers and applications.",
    tips: (
      <>
        <strong>SVG 1.1</strong>: The current standard with wide support (recommended for most uses). <br />
        <strong>SVG 1.0</strong>: Older specification with more limited features but broader legacy support. <br />
        <strong>SVG Tiny 1.2</strong>: Optimized for mobile devices with reduced feature set.
      </>
    )
  },
  
  drawStyle: {
    title: "Draw Style",
    description: 
      "Determines how shapes are rendered in the SVG output, affecting both appearance and file size.",
    tips: (
      <>
        <strong>Fill shapes</strong>: Creates solid filled areas (best for logos and icons). <br />
        <strong>Stroke outlines</strong>: Creates outlines of shapes (best for technical drawings). <br />
        <strong>Stroke edges between shapes</strong>: Only draws lines where shapes meet (creates a sketch-like effect).
      </>
    )
  },
  
  shapeStacking: {
    title: "Shape Stacking",
    description: 
      "Controls how overlapping shapes are handled in the SVG structure.",
    tips: (
      <>
        <strong>Place shapes in cut-outs</strong>: Creates "holes" in shapes below for complex artwork (best for logos). <br />
        <strong>Stack shapes on top</strong>: Simple layering of shapes (easier to edit later, but may create unexpected results with transparency).
      </>
    )
  },
  
  groupBy: {
    title: "Group By",
    description: 
      "Determines how elements are organized in the SVG structure, which affects editability in vector software.",
    tips: (
      <>
        <strong>None</strong>: No grouping of elements. <br />
        <strong>Color</strong>: Groups elements by their color (best for editing entire color schemes). <br />
        <strong>Parent</strong>: Preserves structure from the original image. <br />
        <strong>Layer</strong>: Groups elements by their depth in the image (best for advanced editing).
      </>
    )
  },
  
  lineFit: {
    title: "Line Fit Tolerance",
    description: 
      "Controls how closely the vector paths follow the original image contours. Higher precision results in larger file sizes.",
    tips: (
      <>
        <strong>Coarse</strong>: Simplified paths with fewer points (smallest file size). <br />
        <strong>Medium</strong>: Balanced setting for most images. <br />
        <strong>Fine</strong>: More detailed tracing (better for complex images). <br />
        <strong>Super Fine</strong>: Highest detail with many path points (largest file size).
      </>
    )
  },
  
  allowedCurveTypes: {
    title: "Allowed Curve Types",
    description: 
      "Specifies which mathematical curve types can be used when tracing the image, affecting complexity and editability.",
    tips: (
      <>
        <strong>Lines</strong>: Straight line segments only (most compatible, angular result). <br />
        <strong>Quadratic/Cubic Bezier</strong>: Curved lines with control points (smoother results). <br />
        <strong>Arcs</strong>: Circle and ellipse segments (good for mechanical drawings). <br />
        <strong>Pro tip</strong>: For simplest output, use only Lines. For smoothest results, use all types.
      </>
    )
  },
  
  fillGaps: {
    title: "Fill Gaps",
    description: 
      "When enabled, small gaps between shapes will be closed automatically during tracing.",
    tips: (
      <>
        <strong>Enable</strong> for cleaner results with solid shapes (logos, icons). <br />
        <strong>Disable</strong> for technical drawings where gaps are intentional. <br />
        <strong>Pro tip</strong>: If your image has intentional negative space, disabling may preserve it better.
      </>
    )
  },
  
  clipOverflow: {
    title: "Clip Overflow",
    description: 
      "Controls whether elements extending beyond the canvas boundaries are trimmed in the output.",
    tips: (
      <>
        <strong>Enable</strong> for clean edges that match the exact dimensions of your source image. <br />
        <strong>Disable</strong> if you want to preserve elements that extend past the canvas boundary.
      </>
    )
  },
  
  nonScalingStroke: {
    title: "Non-Scaling Stroke",
    description: 
      "When enabled, stroke widths remain constant regardless of how the SVG is scaled.",
    tips: (
      <>
        <strong>Enable</strong> for technical drawings and UI elements where line thickness should remain consistent at any scale. <br />
        <strong>Disable</strong> for artwork where strokes should scale proportionally with the image. <br />
        <strong>Pro tip</strong>: This particularly affects how your SVG will look when resized in different contexts.
      </>
    )
  },
  
  strokeWidth: {
    title: "Stroke Width",
    description: 
      "Defines the thickness of lines in the output SVG.",
    tips: (
      <>
        <strong>Thinner strokes</strong> (0.5-1.0px): Best for detailed illustrations and technical drawings. <br />
        <strong>Medium strokes</strong> (1.5-2.5px): Good for general use and small icons. <br />
        <strong>Thicker strokes</strong> (3.0-5.0px): Best for bold, simplified graphics and larger displays. <br />
        <strong>Pro tip</strong>: Consider your end-use case - thinner lines may disappear at small sizes.
      </>
    )
  },
  
  // Trace engine setting
  traceEngine: {
    title: "Trace Engine",
    description: 
      "Selects which tracing algorithm to use for converting your image to SVG.",
    tips: (
      <>
        <strong>Auto</strong>: Automatically selects the best engine based on your image (recommended). <br />
        <strong>Potrace</strong>: Excellent for black & white images, logos, and line art. <br />
        <strong>ImageTracer</strong>: Better for color images, photographs, and detailed illustrations.
      </>
    )
  },
  
  // Potrace advanced options
  turdSize: {
    title: "Speckle Removal (turdSize)",
    description: 
      "Advanced Potrace option: Controls the size of noise/speckles that will be removed during tracing.",
    tips: (
      <>
        <strong>Lower values</strong> (0-2): Preserves more detail but may include noise. <br />
        <strong>Medium values</strong> (3-5): Balanced noise removal for most images. <br />
        <strong>Higher values</strong> (6+): Aggressively removes small details and noise. <br />
        <strong>Pro tip</strong>: Increase for noisy scans or decrease for intricate details.
      </>
    )
  },
  
  alphaMax: {
    title: "Corner Threshold (alphaMax)",
    description: 
      "Advanced Potrace option: Controls how corner points are detected and created in vector paths.",
    tips: (
      <>
        <strong>Lower values</strong> (0.5-0.9): Creates more angular corners with sharper turns. <br />
        <strong>Standard value</strong> (1.0): Balanced corner detection for most images. <br />
        <strong>Higher values</strong> (1.1-1.5): Creates smoother curves with fewer sharp corners. <br />
        <strong>Pro tip</strong>: Lower values create more defined corners but potentially more complex paths.
      </>
    )
  },
  
  optTolerance: {
    title: "Optimization Tolerance",
    description: 
      "Advanced Potrace option: Controls how aggressively paths are simplified after initial tracing.",
    tips: (
      <>
        <strong>Lower values</strong> (0.1-0.2): Minimal simplification, preserves more path details. <br />
        <strong>Medium values</strong> (0.3-0.5): Balanced optimization for most images. <br />
        <strong>Higher values</strong> (0.6-1.0): Aggressive simplification for smaller file sizes. <br />
        <strong>Pro tip</strong>: Use lower values for intricate artwork and higher values for simpler graphics.
      </>
    )
  },
  
  // ImageTracerJS specific options
  numberOfColors: {
    title: "Number of Colors",
    description: 
      "Controls how many distinct colors will be used in the traced SVG output.",
    tips: (
      <>
        <strong>Few colors</strong> (2-8): Creates simple, graphic-style images with flat colors. <br />
        <strong>Medium range</strong> (9-24): Good balance for most colorful images. <br />
        <strong>Many colors</strong> (25-256): Better for photographic or gradient-rich images. <br />
        <strong>Pro tip</strong>: Fewer colors means smaller file size and more abstract/posterized look.
      </>
    )
  },
  
  colorMode: {
    title: "Color Mode",
    description: 
      "Determines whether the image will be traced in full color or converted to grayscale first.",
    tips: (
      <>
        <strong>Color</strong>: Preserves original colors, best for colorful artwork and photos. <br />
        <strong>Grayscale</strong>: Converts to black, white and grays, best for documents and sketches. <br />
        <strong>Pro tip</strong>: Grayscale often creates cleaner SVGs with simpler paths.
      </>
    )
  },
  
  minColorRatio: {
    title: "Minimum Color Ratio",
    description: 
      "The threshold for including a color in the output. Colors appearing less frequently than this ratio will be merged with similar colors.",
    tips: (
      <>
        <strong>Lower values</strong> (0.001-0.01): Preserves rare/small color details in the image. <br />
        <strong>Medium values</strong> (0.02-0.05): Balanced for most images. <br />
        <strong>Higher values</strong> (0.05-0.2): Only keeps dominant colors, simplifies the output. <br />
        <strong>Pro tip</strong>: Increase for cleaner result with fewer colors, decrease to preserve details.
      </>
    )
  },
  
  colorQuantization: {
    title: "Color Quantization Method",
    description: 
      "The algorithm used to reduce the number of colors in the image.",
    tips: (
      <>
        <strong>Default</strong>: Standard method, good for most images. <br />
        <strong>Riemersma</strong>: Often produces more vibrant colors with better distribution. <br />
        <strong>Floyd-Steinberg</strong>: Creates a dithered effect, good for gradients and photographs. <br />
        <strong>Pro tip</strong>: Try different methods to see which works best for your specific image.
      </>
    )
  },
  
  blurRadius: {
    title: "Blur Radius",
    description: 
      "Pre-processing blur applied to smooth the image before tracing. Helps reduce noise and create cleaner vectors.",
    tips: (
      <>
        <strong>No blur</strong> (0): No smoothing, preserves original pixel detail. <br />
        <strong>Light blur</strong> (1-2): Slight smoothing while preserving most details. <br />
        <strong>Medium blur</strong> (3-5): Balanced for most images, reduces noise. <br />
        <strong>Heavy blur</strong> (6+): Creates highly simplified, abstract results. <br />
        <strong>Pro tip</strong>: Higher values work well for noisy photos but will lose fine details.
      </>
    )
  },
  
  preserveColors: {
    title: "Preserve Original Colors",
    description: 
      "When enabled, tries to match the original image colors as closely as possible.",
    tips: (
      <>
        <strong>Enable</strong> for accurate color reproduction in photographs and artwork. <br />
        <strong>Disable</strong> for more stylized, posterized results with optimized color palette.
      </>
    )
  },
  
  // ImageTracer advanced options
  colorSampling: {
    title: "Color Sampling",
    description: 
      "Advanced ImageTracer option: Controls how colors are sampled from the original image.",
    tips: (
      <>
        <strong>Disabled</strong> (0): Uses a mathematical approach to select colors. <br />
        <strong>Enabled</strong> (1): Selects colors based on actual pixel sampling from the image. <br />
        <strong>Pro tip</strong>: Enabled usually produces better color reproduction for photographs.
      </>
    )
  },
  
  ltres: {
    title: "Line Threshold",
    description: 
      "Advanced ImageTracer option: Controls how curved lines are converted to straight line segments.",
    tips: (
      <>
        <strong>Lower values</strong> (0.1-0.5): Creates more line segments for smoother curves. <br />
        <strong>Standard value</strong> (1.0): Balanced for most images. <br />
        <strong>Higher values</strong> (1.5-3.0): Creates fewer, longer line segments. <br />
        <strong>Pro tip</strong>: Lower values create smoother curves but larger file sizes.
      </>
    )
  },
  
  qtres: {
    title: "Quadratic Threshold",
    description: 
      "Advanced ImageTracer option: Controls how curved lines are converted to quadratic Bézier curves.",
    tips: (
      <>
        <strong>Lower values</strong> (0.1-0.5): Creates more quadratic curves for smoother results. <br />
        <strong>Standard value</strong> (1.0): Balanced for most images. <br />
        <strong>Higher values</strong> (1.5-3.0): Creates fewer, simpler curve segments. <br />
        <strong>Pro tip</strong>: Lower values produce smoother curves but larger file sizes.
      </>
    )
  },
  
  pathomit: {
    title: "Path Omit",
    description: 
      "Advanced ImageTracer option: Suppresses paths shorter than this value (in pixels).",
    tips: (
      <>
        <strong>Lower values</strong> (0-4): Preserves tiny details and texture. <br />
        <strong>Standard value</strong> (8): Balanced for most images. <br />
        <strong>Higher values</strong> (10+): Aggressively removes small paths, creating simplified results. <br />
        <strong>Pro tip</strong>: Increase to reduce file size and remove noise, decrease to preserve tiny details.
      </>
    )
  },
  
  roundcoords: {
    title: "Round Coordinates",
    description: 
      "Advanced ImageTracer option: Controls decimal place rounding for coordinates in the SVG.",
    tips: (
      <>
        <strong>Lower values</strong> (0-1): Minimal rounding, preserves precise path coordinates. <br />
        <strong>Medium values</strong> (2-3): Balanced precision and file size. <br />
        <strong>Higher values</strong> (4+): Aggressive rounding, smaller file size but less precise paths. <br />
        <strong>Pro tip</strong>: Higher values create smaller files but may distort intricate details.
      </>
    )
  },
  
  // Custom palette option
  customPalette: {
    title: "Custom Color Palette",
    description: 
      "Specify exact colors to use in the traced SVG, overriding automatic color selection.",
    tips: (
      <>
        <strong>Brand colors</strong>: Ensure SVG uses only your brand's official color palette. <br />
        <strong>Limited palette</strong>: Create stylized results with a specific color scheme. <br />
        <strong>Pro tip</strong>: For best results, include colors that cover the main tones in your image.
      </>
    )
  },
};