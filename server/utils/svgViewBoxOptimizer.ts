import { JSDOM } from 'jsdom';

/**
 * SVG ViewBox Optimization for Animation-Ready Output
 * Ensures proper viewBox, removes hardcoded dimensions, and optimizes structure
 */

export interface ViewBoxOptimizationOptions {
  removeWidthHeight: boolean;
  addPreserveAspectRatio: boolean;
  optimizeForAnimation: boolean;
  ensureViewBox: boolean;
  addResponsiveClass: boolean;
}

export interface ViewBoxInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number;
  isOptimized: boolean;
}

/**
 * Optimize SVG viewBox and structure for animation
 */
export function optimizeSVGViewBox(
  svgContent: string,
  options: ViewBoxOptimizationOptions
): { svg: string; viewBoxInfo: ViewBoxInfo } {
  try {
    console.log('Optimizing SVG viewBox with options:', options);
    
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    // Extract or calculate viewBox
    let viewBoxInfo = extractViewBox(svgElement);
    
    if (!viewBoxInfo.isOptimized && options.ensureViewBox) {
      console.log('Calculating viewBox from content bounds');
      viewBoxInfo = calculateViewBoxFromContent(svgElement);
    }

    // Set proper viewBox
    if (viewBoxInfo.isOptimized) {
      const viewBoxValue = `${viewBoxInfo.x} ${viewBoxInfo.y} ${viewBoxInfo.width} ${viewBoxInfo.height}`;
      svgElement.setAttribute('viewBox', viewBoxValue);
      console.log('Set viewBox:', viewBoxValue);
    }

    // Remove width and height for responsive behavior
    if (options.removeWidthHeight) {
      svgElement.removeAttribute('width');
      svgElement.removeAttribute('height');
      console.log('Removed fixed width/height for responsive scaling');
    }

    // Add preserveAspectRatio for better scaling control
    if (options.addPreserveAspectRatio) {
      if (!svgElement.getAttribute('preserveAspectRatio')) {
        svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        console.log('Added preserveAspectRatio for consistent scaling');
      }
    }

    // Add animation-friendly attributes
    if (options.optimizeForAnimation) {
      // Ensure xmlns is present
      if (!svgElement.getAttribute('xmlns')) {
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      
      // Add vector-effect to ensure consistent rendering
      if (!svgElement.getAttribute('vector-effect')) {
        svgElement.setAttribute('vector-effect', 'non-scaling-stroke');
      }
      
      console.log('Added animation-friendly attributes');
    }

    // Add responsive class for CSS control
    if (options.addResponsiveClass) {
      const existingClass = svgElement.getAttribute('class') || '';
      if (!existingClass.includes('responsive-svg')) {
        svgElement.setAttribute('class', existingClass ? `${existingClass} responsive-svg` : 'responsive-svg');
        console.log('Added responsive CSS class');
      }
    }

    // Optimize structure for animation
    if (options.optimizeForAnimation) {
      optimizeStructureForAnimation(svgElement);
    }

    const optimizedSvg = dom.serialize();
    console.log('ViewBox optimization complete');

    return {
      svg: optimizedSvg,
      viewBoxInfo
    };
  } catch (error) {
    console.error('Error optimizing SVG viewBox:', error);
    return {
      svg: svgContent,
      viewBoxInfo: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        aspectRatio: 1,
        isOptimized: false
      }
    };
  }
}

/**
 * Extract viewBox information from SVG element
 */
function extractViewBox(svgElement: Element): ViewBoxInfo {
  const viewBoxAttr = svgElement.getAttribute('viewBox');
  
  if (viewBoxAttr) {
    const values = viewBoxAttr.split(/[\s,]+/).map(v => parseFloat(v));
    if (values.length === 4 && values.every(v => !isNaN(v))) {
      const [x, y, width, height] = values;
      return {
        x,
        y,
        width,
        height,
        aspectRatio: width / height,
        isOptimized: true
      };
    }
  }

  // Try to get from width/height attributes
  const width = parseFloat(svgElement.getAttribute('width') || '0');
  const height = parseFloat(svgElement.getAttribute('height') || '0');
  
  if (width > 0 && height > 0) {
    return {
      x: 0,
      y: 0,
      width,
      height,
      aspectRatio: width / height,
      isOptimized: false
    };
  }

  // Default fallback
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    aspectRatio: 1,
    isOptimized: false
  };
}

/**
 * Calculate viewBox from actual content bounds
 */
function calculateViewBoxFromContent(svgElement: Element): ViewBoxInfo {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasContent = false;

  // Helper function to update bounds
  function updateBounds(x: number, y: number) {
    if (!isNaN(x) && !isNaN(y)) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      hasContent = true;
    }
  }

  // Process different shape types
  const shapes = svgElement.querySelectorAll('path, rect, circle, ellipse, line, polygon, polyline');
  
  Array.from(shapes).forEach(shape => {
    const tagName = shape.tagName.toLowerCase();
    
    switch (tagName) {
      case 'rect': {
        const x = parseFloat(shape.getAttribute('x') || '0');
        const y = parseFloat(shape.getAttribute('y') || '0');
        const width = parseFloat(shape.getAttribute('width') || '0');
        const height = parseFloat(shape.getAttribute('height') || '0');
        
        updateBounds(x, y);
        updateBounds(x + width, y + height);
        break;
      }
      
      case 'circle': {
        const cx = parseFloat(shape.getAttribute('cx') || '0');
        const cy = parseFloat(shape.getAttribute('cy') || '0');
        const r = parseFloat(shape.getAttribute('r') || '0');
        
        updateBounds(cx - r, cy - r);
        updateBounds(cx + r, cy + r);
        break;
      }
      
      case 'ellipse': {
        const cx = parseFloat(shape.getAttribute('cx') || '0');
        const cy = parseFloat(shape.getAttribute('cy') || '0');
        const rx = parseFloat(shape.getAttribute('rx') || '0');
        const ry = parseFloat(shape.getAttribute('ry') || '0');
        
        updateBounds(cx - rx, cy - ry);
        updateBounds(cx + rx, cy + ry);
        break;
      }
      
      case 'line': {
        const x1 = parseFloat(shape.getAttribute('x1') || '0');
        const y1 = parseFloat(shape.getAttribute('y1') || '0');
        const x2 = parseFloat(shape.getAttribute('x2') || '0');
        const y2 = parseFloat(shape.getAttribute('y2') || '0');
        
        updateBounds(x1, y1);
        updateBounds(x2, y2);
        break;
      }
      
      case 'polygon':
      case 'polyline': {
        const points = shape.getAttribute('points');
        if (points) {
          const coords = points.split(/[\s,]+/).map(v => parseFloat(v));
          for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              updateBounds(coords[i], coords[i + 1]);
            }
          }
        }
        break;
      }
      
      case 'path': {
        const d = shape.getAttribute('d');
        if (d) {
          const bounds = calculatePathBounds(d);
          if (bounds) {
            updateBounds(bounds.minX, bounds.minY);
            updateBounds(bounds.maxX, bounds.maxY);
          }
        }
        break;
      }
    }
  });

  if (!hasContent) {
    // Fallback to default
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      aspectRatio: 1,
      isOptimized: false
    };
  }

  // Add some padding
  const padding = Math.max((maxX - minX) * 0.05, (maxY - minY) * 0.05, 5);
  
  const x = minX - padding;
  const y = minY - padding;
  const width = (maxX - minX) + (padding * 2);
  const height = (maxY - minY) + (padding * 2);

  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100,
    aspectRatio: width / height,
    isOptimized: true
  };
}

/**
 * Calculate bounds for path data (simplified)
 */
function calculatePathBounds(pathData: string): { minX: number; minY: number; maxX: number; maxY: number } | null {
  // This is a simplified path bounds calculator
  // For production, you'd want a more robust path parser
  
  const coords = pathData.match(/[-+]?(\d*\.?\d+)/g);
  if (!coords || coords.length < 2) return null;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (let i = 0; i < coords.length; i += 2) {
    if (i + 1 < coords.length) {
      const x = parseFloat(coords[i]);
      const y = parseFloat(coords[i + 1]);
      
      if (!isNaN(x) && !isNaN(y)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  return { minX, minY, maxX, maxY };
}

/**
 * Optimize SVG structure for animation performance
 */
function optimizeStructureForAnimation(svgElement: Element): void {
  console.log('Optimizing SVG structure for animation');
  
  // Remove unnecessary elements that can hurt animation performance
  const elementsToRemove = svgElement.querySelectorAll('metadata, comment, desc:empty, title:empty');
  Array.from(elementsToRemove).forEach(el => {
    el.remove();
  });
  
  // Optimize groups - remove single-child groups that don't add value
  const groups = svgElement.querySelectorAll('g');
  Array.from(groups).forEach(group => {
    const children = Array.from(group.children);
    const hasAttributes = group.attributes.length > 0;
    
    // If group has only one child and no attributes, consider flattening
    if (children.length === 1 && !hasAttributes) {
      const child = children[0];
      const parent = group.parentNode;
      
      if (parent && child) {
        parent.insertBefore(child, group);
        parent.removeChild(group);
      }
    }
  });
  
  // Ensure all animatable elements have IDs (if they don't already)
  const animatableElements = svgElement.querySelectorAll('path, rect, circle, ellipse, polygon, line, g');
  Array.from(animatableElements).forEach((element, index) => {
    if (!element.getAttribute('id')) {
      const tagName = element.tagName.toLowerCase();
      element.setAttribute('id', `anim_${tagName}_${index}`);
    }
  });
  
  console.log('Structure optimization complete');
}

/**
 * Generate responsive CSS for the SVG
 */
export function generateResponsiveCSS(viewBoxInfo: ViewBoxInfo): string {
  const aspectRatio = (viewBoxInfo.height / viewBoxInfo.width * 100).toFixed(2);
  
  return `
/* Responsive SVG Styles */
.responsive-svg {
  width: 100%;
  height: auto;
  max-width: 100%;
  display: block;
}

/* Maintain aspect ratio */
.responsive-svg-container {
  position: relative;
  width: 100%;
  padding-bottom: ${aspectRatio}%;
  height: 0;
  overflow: hidden;
}

.responsive-svg-container .responsive-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Animation-friendly base styles */
.responsive-svg * {
  vector-effect: non-scaling-stroke;
}

.responsive-svg path,
.responsive-svg circle,
.responsive-svg rect,
.responsive-svg ellipse,
.responsive-svg polygon,
.responsive-svg line {
  transform-origin: center;
  transform-box: fill-box;
}
`;
}