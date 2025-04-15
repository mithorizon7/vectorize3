import React from "react";

export type SettingCategory = 
  | "format" 
  | "structure" 
  | "paths";

export type SettingId = 
  | "fileFormat"
  | "svgVersion"
  | "drawStyle"
  | "shapeStacking"
  | "groupBy"
  | "lineFit"
  | "allowedCurveTypes"
  | "fillGaps"
  | "clipOverflow"
  | "nonScalingStroke"
  | "strokeWidth";

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
};