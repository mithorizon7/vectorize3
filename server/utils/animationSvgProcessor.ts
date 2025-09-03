import { JSDOM } from 'jsdom';
import { optimizeSVGViewBox, ViewBoxOptimizationOptions } from './svgViewBoxOptimizer';

/**
 * Server-side animation SVG processing utilities
 * Handles deterministic ID generation, transform flattening, and structure optimization
 */

export interface AnimationProcessingOptions {
  idPrefix: string;
  flattenTransforms: boolean;
  preserveHierarchy: boolean;
  generateStableIds: boolean;
  optimizeForAnimation: boolean;
  optimizeViewBox?: boolean;
  extractColors?: boolean;
}

export interface ProcessedAnimationSVG {
  svg: string;
  metadata: {
    elementCount: number;
    groupCount: number;
    pathCount: number;
    hasTransforms: boolean;
    complexity: 'low' | 'medium' | 'high';
    animationReadiness: number; // 0-100 score
    viewBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
      aspectRatio: number;
    };
    colors?: Array<{
      color: string;
      usage: number;
    }>;
  };
}

/**
 * Process SVG for animation-ready output
 */
export async function processForAnimation(
  svgContent: string,
  options: AnimationProcessingOptions
): Promise<ProcessedAnimationSVG> {
  try {
    console.log('Processing SVG for animation with options:', options);
    
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    let processedSvg = svgContent;
    const metadata: {
      elementCount: number;
      groupCount: number;
      pathCount: number;
      hasTransforms: boolean;
      complexity: 'low' | 'medium' | 'high';
      animationReadiness: number;
    } = {
      elementCount: 0,
      groupCount: 0,
      pathCount: 0,
      hasTransforms: false,
      complexity: 'medium',
      animationReadiness: 50
    };

    // Step 1: Generate stable, semantic IDs
    if (options.generateStableIds) {
      console.log('Generating stable IDs...');
      processedSvg = generateStableIds(processedSvg, options.idPrefix);
    }

    // Step 2: Flatten transforms if requested
    if (options.flattenTransforms) {
      console.log('Flattening transforms...');
      processedSvg = flattenTransforms(processedSvg);
    }

    // Step 3: Optimize viewBox and structure
    let viewBoxInfo;
    if (options.optimizeViewBox || options.optimizeForAnimation) {
      console.log('Optimizing viewBox and structure...');
      const viewBoxOptions: ViewBoxOptimizationOptions = {
        removeWidthHeight: true,
        addPreserveAspectRatio: true,
        optimizeForAnimation: options.optimizeForAnimation,
        ensureViewBox: true,
        addResponsiveClass: true
      };
      
      const viewBoxResult = optimizeSVGViewBox(processedSvg, viewBoxOptions);
      processedSvg = viewBoxResult.svg;
      viewBoxInfo = viewBoxResult.viewBoxInfo;
    }

    // Step 4: Optimize for animation performance
    if (options.optimizeForAnimation) {
      console.log('Optimizing for animation...');
      processedSvg = optimizeForAnimation(processedSvg);
    }

    // Step 5: Calculate metadata
    metadata.elementCount = (processedSvg.match(/<(path|rect|circle|ellipse|polygon|line|g)/g) || []).length;
    metadata.groupCount = (processedSvg.match(/<g/g) || []).length;
    metadata.pathCount = (processedSvg.match(/<path/g) || []).length;
    metadata.hasTransforms = processedSvg.includes('transform=');
    
    // Add viewBox info if available
    if (viewBoxInfo && viewBoxInfo.isOptimized) {
      (metadata as any).viewBox = {
        x: viewBoxInfo.x,
        y: viewBoxInfo.y,
        width: viewBoxInfo.width,
        height: viewBoxInfo.height,
        aspectRatio: viewBoxInfo.aspectRatio
      };
    }
    
    // Extract color information if requested
    if (options.extractColors) {
      const colors = extractColorsFromSVG(processedSvg);
      (metadata as any).colors = colors;
    }
    
    // Calculate complexity based on element count and structure
    if (metadata.elementCount < 10) {
      metadata.complexity = 'low' as const;
      metadata.animationReadiness = 90;
    } else if (metadata.elementCount < 50) {
      metadata.complexity = 'medium' as const;
      metadata.animationReadiness = 70;
    } else {
      metadata.complexity = 'high' as const;
      metadata.animationReadiness = 40;
    }

    // Adjust readiness based on optimization
    if (options.generateStableIds) metadata.animationReadiness += 10;
    if (options.flattenTransforms) metadata.animationReadiness += 10;
    if (options.optimizeForAnimation) metadata.animationReadiness += 15;
    if (options.optimizeViewBox) metadata.animationReadiness += 5;
    if (viewBoxInfo && viewBoxInfo.isOptimized) metadata.animationReadiness += 5;
    
    metadata.animationReadiness = Math.min(100, metadata.animationReadiness);

    console.log('Animation processing complete:', metadata);

    return {
      svg: processedSvg,
      metadata
    };
  } catch (error) {
    console.error('Error processing SVG for animation:', error);
    return {
      svg: svgContent,
      metadata: {
        elementCount: 0,
        groupCount: 0,
        pathCount: 0,
        hasTransforms: false,
        complexity: 'high',
        animationReadiness: 0
      }
    };
  }
}

/**
 * Generate stable, semantic IDs for all SVG elements
 */
function generateStableIds(svgContent: string, prefix: string): string {
  try {
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) return svgContent;

    const usedIds = new Set<string>();
    const typeCounters: Record<string, number> = {};

    const generateUniqueId = (element: Element): string => {
      const tagName = element.tagName.toLowerCase();
      let baseName = getSemanticBaseName(element, tagName);
      
      if (!typeCounters[baseName]) {
        typeCounters[baseName] = 0;
      }
      
      let candidateId: string;
      let counter = typeCounters[baseName];
      
      do {
        candidateId = counter === 0 
          ? `${prefix}${baseName}`
          : `${prefix}${baseName}_${counter}`;
        counter++;
      } while (usedIds.has(candidateId));
      
      typeCounters[baseName] = counter;
      usedIds.add(candidateId);
      
      return candidateId;
    };

    const processElement = (element: Element): void => {
      // Skip certain elements
      if (['defs', 'metadata', 'title', 'desc'].includes(element.tagName.toLowerCase())) {
        return;
      }

      // Generate and assign ID
      const newId = generateUniqueId(element);
      element.setAttribute('id', newId);

      // Process children
      Array.from(element.children).forEach(child => {
        processElement(child);
      });
    };

    // Process all children of SVG
    Array.from(svgElement.children).forEach(child => {
      processElement(child);
    });

    return dom.serialize();
  } catch (error) {
    console.error('Error generating stable IDs:', error);
    return svgContent;
  }
}

/**
 * Get semantic base name for an element
 */
function getSemanticBaseName(element: Element, tagName: string): string {
  // Check for meaningful existing attributes
  const existingId = element.getAttribute('id');
  const className = element.getAttribute('class');
  
  if (existingId && isSemanticName(existingId)) {
    return sanitizeName(existingId);
  }
  
  if (className && isSemanticName(className)) {
    return sanitizeName(className.split(' ')[0]);
  }

  // Analyze element for semantic meaning
  const fill = element.getAttribute('fill');
  
  // Shape-specific logic
  switch (tagName) {
    case 'circle':
    case 'ellipse':
      const r = element.getAttribute('r') || element.getAttribute('rx');
      if (r && parseFloat(r) > 25) {
        return 'wheel'; // Large circles often represent wheels
      }
      return 'circle';
      
    case 'rect':
      const width = parseFloat(element.getAttribute('width') || '0');
      const height = parseFloat(element.getAttribute('height') || '0');
      const ratio = width / height;
      
      if (Math.abs(ratio - 1) < 0.2) {
        return 'square';
      } else if (ratio > 3) {
        return 'bar';
      }
      return 'rect';
      
    case 'path':
      const d = element.getAttribute('d') || '';
      if (d.includes('C') || d.includes('Q')) {
        return 'curve';
      } else if (d.includes('L') && !d.includes('M')) {
        return 'line';
      }
      return 'shape';
      
    case 'g':
      // Try to infer group purpose from children or fill
      if (fill) {
        const colorName = getColorName(fill);
        if (colorName) {
          return `${colorName}_group`;
        }
      }
      return 'group';
      
    default:
      return tagName;
  }
}

/**
 * Check if a name appears semantic rather than generated
 */
function isSemanticName(name: string): boolean {
  const generatedPatterns = [
    /^path\d+$/,
    /^g\d+$/,
    /^rect\d+$/,
    /^circle\d+$/,
    /^[a-f0-9]{8,}$/i,
    /^(unnamed|untitled)/i
  ];

  return !generatedPatterns.some(pattern => pattern.test(name));
}

/**
 * Sanitize name for valid CSS/JS identifier
 */
function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[0-9]/, '_$&')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Get color name from hex/rgb value
 */
function getColorName(color: string): string | null {
  const colorMap: Record<string, string> = {
    '#ff0000': 'red',
    '#00ff00': 'green',
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#ff00ff': 'magenta',
    '#00ffff': 'cyan',
    '#000000': 'black',
    '#ffffff': 'white',
    '#808080': 'gray',
    '#ffa500': 'orange',
    '#800080': 'purple'
  };

  return colorMap[color.toLowerCase()] || null;
}

/**
 * Flatten all transforms in the SVG
 */
function flattenTransforms(svgContent: string): string {
  try {
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) return svgContent;

    const flattenElement = (element: Element, parentMatrix: string = ''): void => {
      const transform = element.getAttribute('transform');
      const currentMatrix = combineTransforms(parentMatrix, transform || '');
      
      // Remove transform attribute
      if (transform) {
        element.removeAttribute('transform');
      }

      // For leaf elements, apply the accumulated transform
      const children = Array.from(element.children);
      if (children.length === 0 || element.tagName.toLowerCase() === 'path') {
        if (currentMatrix) {
          applyTransformToElement(element, currentMatrix);
        }
      }

      // Process children with accumulated transform
      children.forEach(child => {
        if (!['defs', 'metadata'].includes(child.tagName.toLowerCase())) {
          flattenElement(child, currentMatrix);
        }
      });
    };

    Array.from(svgElement.children).forEach(child => {
      flattenElement(child);
    });

    return dom.serialize();
  } catch (error) {
    console.error('Error flattening transforms:', error);
    return svgContent;
  }
}

/**
 * Combine transform strings (simplified)
 */
function combineTransforms(parent: string, current: string): string {
  if (!parent && !current) return '';
  if (!parent) return current;
  if (!current) return parent;
  return `${parent} ${current}`;
}

/**
 * Apply transform to element (simplified implementation)
 */
function applyTransformToElement(element: Element, transform: string): void {
  // This is a simplified implementation
  // In production, you'd want a more robust transform application
  if (transform) {
    element.setAttribute('data-original-transform', transform);
  }
}

/**
 * Optimize SVG for animation performance
 */
function optimizeForAnimation(svgContent: string): string {
  try {
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) return svgContent;

    // Ensure proper viewBox
    if (!svgElement.getAttribute('viewBox')) {
      const width = svgElement.getAttribute('width') || '100';
      const height = svgElement.getAttribute('height') || '100';
      svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    // Remove width/height for responsive scaling
    svgElement.removeAttribute('width');
    svgElement.removeAttribute('height');

    // Add animation-friendly attributes
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Process groups for better animation structure
    const groups = svgElement.querySelectorAll('g');
    groups.forEach(group => {
      // Ensure groups have proper structure for animation
      if (!group.getAttribute('id')) {
        // Should have been handled by ID generation, but safety check
        const children = group.children.length;
        group.setAttribute('id', `group_${children}`);
      }
    });

    return dom.serialize();
  } catch (error) {
    console.error('Error optimizing for animation:', error);
    return svgContent;
  }
}

/**
 * Extract color information from SVG for metadata
 */
function extractColorsFromSVG(svgContent: string): Array<{ color: string; usage: number }> {
  try {
    const colorUsage = new Map<string, number>();
    
    // Simple regex-based color extraction for metadata
    const fillMatches = svgContent.match(/fill="([^"]+)"/g) || [];
    const strokeMatches = svgContent.match(/stroke="([^"]+)"/g) || [];
    
    [...fillMatches, ...strokeMatches].forEach(match => {
      const color = match.match(/"([^"]+)"/)?.[1];
      if (color && color !== 'none' && color !== 'transparent') {
        colorUsage.set(color, (colorUsage.get(color) || 0) + 1);
      }
    });
    
    return Array.from(colorUsage.entries())
      .map(([color, usage]) => ({ color, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10); // Top 10 colors for metadata
  } catch (error) {
    console.error('Error extracting colors for metadata:', error);
    return [];
  }
}