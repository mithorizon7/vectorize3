import { JSDOM } from 'jsdom';

/**
 * Stroke Preparation for Draw-On Animations
 * Calculates path lengths and sets up dasharray/dashoffset for animation
 */

export interface StrokePreparationOptions {
  addPathLengths: boolean;
  setupDrawOn: boolean;
  expandStrokesToFills: boolean;
  preserveOriginalStrokes: boolean;
}

export interface PathLengthInfo {
  pathId: string;
  length: number;
  hasStroke: boolean;
  strokeWidth: string;
  strokeColor: string;
}

/**
 * Prepare SVG strokes for animation
 */
export function prepareStrokesForAnimation(
  svgContent: string,
  options: StrokePreparationOptions
): { svg: string; pathLengths: PathLengthInfo[] } {
  try {
    console.log('Preparing strokes for animation with options:', options);
    
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    const pathLengths: PathLengthInfo[] = [];
    
    // Find all paths with strokes
    const pathElements = svgElement.querySelectorAll('path');
    
    Array.from(pathElements).forEach((pathElement, index) => {
      const stroke = pathElement.getAttribute('stroke');
      const strokeWidth = pathElement.getAttribute('stroke-width') || '1';
      const pathId = pathElement.getAttribute('id') || `path_${index}`;
      
      // Only process paths that have strokes and aren't "none"
      if (stroke && stroke !== 'none' && stroke !== 'transparent') {
        const pathData = pathElement.getAttribute('d');
        
        if (pathData) {
          // Calculate path length
          const length = calculatePathLength(pathData);
          
          if (length > 0) {
            const pathInfo: PathLengthInfo = {
              pathId,
              length,
              hasStroke: true,
              strokeWidth,
              strokeColor: stroke
            };
            
            pathLengths.push(pathInfo);
            
            if (options.addPathLengths) {
              // Add data-length attribute
              pathElement.setAttribute('data-length', length.toFixed(2));
              console.log(`Added data-length="${length.toFixed(2)}" to ${pathId}`);
            }
            
            if (options.setupDrawOn) {
              // Set up for draw-on animation
              const roundedLength = Math.ceil(length);
              pathElement.setAttribute('stroke-dasharray', roundedLength.toString());
              pathElement.setAttribute('stroke-dashoffset', roundedLength.toString());
              pathElement.setAttribute('data-draw-length', roundedLength.toString());
              
              console.log(`Set up draw-on for ${pathId}: dasharray=${roundedLength}`);
            }
          }
        }
      }
    });
    
    // Process line elements (they can also be stroked)
    const lineElements = svgElement.querySelectorAll('line');
    Array.from(lineElements).forEach((lineElement, index) => {
      const stroke = lineElement.getAttribute('stroke');
      const strokeWidth = lineElement.getAttribute('stroke-width') || '1';
      const lineId = lineElement.getAttribute('id') || `line_${index}`;
      
      if (stroke && stroke !== 'none' && stroke !== 'transparent') {
        const x1 = parseFloat(lineElement.getAttribute('x1') || '0');
        const y1 = parseFloat(lineElement.getAttribute('y1') || '0');
        const x2 = parseFloat(lineElement.getAttribute('x2') || '0');
        const y2 = parseFloat(lineElement.getAttribute('y2') || '0');
        
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        if (length > 0) {
          const pathInfo: PathLengthInfo = {
            pathId: lineId,
            length,
            hasStroke: true,
            strokeWidth,
            strokeColor: stroke
          };
          
          pathLengths.push(pathInfo);
          
          if (options.addPathLengths) {
            lineElement.setAttribute('data-length', length.toFixed(2));
          }
          
          if (options.setupDrawOn) {
            const roundedLength = Math.ceil(length);
            lineElement.setAttribute('stroke-dasharray', roundedLength.toString());
            lineElement.setAttribute('stroke-dashoffset', roundedLength.toString());
            lineElement.setAttribute('data-draw-length', roundedLength.toString());
          }
        }
      }
    });

    // Handle stroke expansion if requested
    if (options.expandStrokesToFills) {
      console.log('Expanding strokes to fills...');
      // This is a complex operation that would require a proper geometry library
      // For now, we'll add a placeholder and log the requirement
      console.warn('Stroke-to-fill expansion requires additional geometry processing library');
      
      // Add metadata about strokes that could be expanded
      pathLengths.forEach(pathInfo => {
        const element = svgElement.querySelector(`#${pathInfo.pathId}`);
        if (element) {
          element.setAttribute('data-expandable-stroke', 'true');
        }
      });
    }

    const processedSvg = dom.serialize();
    
    console.log(`Processed ${pathLengths.length} stroked paths for animation`);
    
    return {
      svg: processedSvg,
      pathLengths
    };
    
  } catch (error) {
    console.error('Error preparing strokes for animation:', error);
    return {
      svg: svgContent,
      pathLengths: []
    };
  }
}

/**
 * Calculate the length of an SVG path
 * Uses a simplified approach - in production you'd want svg-path-properties
 */
function calculatePathLength(pathData: string): number {
  try {
    // This is a simplified path length calculator
    // In production, you'd use a library like svg-path-properties or paper.js
    
    // Parse basic path commands and approximate length
    const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
    let totalLength = 0;
    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;
    
    commands.forEach(command => {
      const type = command[0].toUpperCase();
      const params = command.slice(1).trim().split(/[\s,]+/).map(p => parseFloat(p)).filter(p => !isNaN(p));
      
      switch (type) {
        case 'M': // Move to
          if (params.length >= 2) {
            currentX = params[0];
            currentY = params[1];
            startX = currentX;
            startY = currentY;
          }
          break;
          
        case 'L': // Line to
          if (params.length >= 2) {
            const dx = params[0] - currentX;
            const dy = params[1] - currentY;
            totalLength += Math.sqrt(dx * dx + dy * dy);
            currentX = params[0];
            currentY = params[1];
          }
          break;
          
        case 'H': // Horizontal line
          if (params.length >= 1) {
            totalLength += Math.abs(params[0] - currentX);
            currentX = params[0];
          }
          break;
          
        case 'V': // Vertical line
          if (params.length >= 1) {
            totalLength += Math.abs(params[0] - currentY);
            currentY = params[0];
          }
          break;
          
        case 'C': // Cubic bezier curve
          if (params.length >= 6) {
            // Approximate cubic bezier length (simplified)
            const dx = params[4] - currentX;
            const dy = params[5] - currentY;
            const chordLength = Math.sqrt(dx * dx + dy * dy);
            
            // Rough approximation: chord length * 1.2 for typical curves
            totalLength += chordLength * 1.2;
            currentX = params[4];
            currentY = params[5];
          }
          break;
          
        case 'Q': // Quadratic bezier curve
          if (params.length >= 4) {
            // Approximate quadratic bezier length
            const dx = params[2] - currentX;
            const dy = params[3] - currentY;
            const chordLength = Math.sqrt(dx * dx + dy * dy);
            totalLength += chordLength * 1.15;
            currentX = params[2];
            currentY = params[3];
          }
          break;
          
        case 'A': // Arc
          if (params.length >= 7) {
            // Very rough arc approximation
            const dx = params[5] - currentX;
            const dy = params[6] - currentY;
            const chordLength = Math.sqrt(dx * dx + dy * dy);
            const rx = params[0];
            const ry = params[1];
            const avgRadius = (rx + ry) / 2;
            
            // Estimate arc length based on chord and radius
            totalLength += Math.max(chordLength, avgRadius * 0.5);
            currentX = params[5];
            currentY = params[6];
          }
          break;
          
        case 'Z': // Close path
          const dx = startX - currentX;
          const dy = startY - currentY;
          totalLength += Math.sqrt(dx * dx + dy * dy);
          currentX = startX;
          currentY = startY;
          break;
      }
    });
    
    return Math.max(0, totalLength);
    
  } catch (error) {
    console.error('Error calculating path length:', error);
    return 0;
  }
}

/**
 * Generate CSS for draw-on animations using calculated path lengths
 */
export function generateDrawOnCSS(pathLengths: PathLengthInfo[]): string {
  const css = pathLengths.map(pathInfo => {
    const { pathId, length } = pathInfo;
    const roundedLength = Math.ceil(length);
    
    return `
/* Draw-on animation for ${pathId} */
#${pathId} {
  stroke-dasharray: ${roundedLength};
  stroke-dashoffset: ${roundedLength};
  --path-length: ${roundedLength};
}

#${pathId}.draw-on {
  animation: drawOn-${pathId} 1.5s ease-out forwards;
}

@keyframes drawOn-${pathId} {
  to {
    stroke-dashoffset: 0;
  }
}`;
  }).join('\n');

  return `/* Auto-generated draw-on animations */
${css}

/* Generic draw-on class for all paths */
.draw-on-all path[data-draw-length] {
  animation-name: drawOnGeneric;
  animation-duration: 1.5s;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
}

@keyframes drawOnGeneric {
  to {
    stroke-dashoffset: 0;
  }
}`;
}

/**
 * Generate GSAP code for draw-on animations
 */
export function generateDrawOnGSAP(pathLengths: PathLengthInfo[]): string {
  const animations = pathLengths.map(pathInfo => {
    const { pathId, length } = pathInfo;
    
    return `// Draw-on animation for ${pathId}
gsap.fromTo("#${pathId}", {
  strokeDashoffset: ${Math.ceil(length)}
}, {
  strokeDashoffset: 0,
  duration: 1.5,
  ease: "power2.out"
});`;
  }).join('\n\n');

  return `// Auto-generated GSAP draw-on animations
import { gsap } from "gsap";

${animations}

// Batch animate all draw-on paths
function animateAllPaths() {
  const tl = gsap.timeline();
  
${pathLengths.map((pathInfo, index) => {
  return `  tl.fromTo("#${pathInfo.pathId}", {
    strokeDashoffset: ${Math.ceil(pathInfo.length)}
  }, {
    strokeDashoffset: 0,
    duration: 1.5,
    ease: "power2.out"
  }, ${index * 0.2});`;
}).join('\n')}
  
  return tl;
}`;
}