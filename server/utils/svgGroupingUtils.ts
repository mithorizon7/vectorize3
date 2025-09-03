import { JSDOM } from 'jsdom';

export interface SVGGroupingOptions {
  shapeStacking: 'stacked' | 'layered' | 'flat' | 'placeCutouts';
  groupBy: 'color' | 'shape' | 'none';
  allowedCurveTypes?: string[];
}

/**
 * Apply advanced SVG grouping and layering based on options
 */
export async function applySVGGrouping(
  svgContent: string, 
  options: SVGGroupingOptions
): Promise<string> {
  try {
    console.log("Applying SVG grouping with options:", options);
    
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('Invalid SVG content - no SVG element found');
    }

    // Get all path elements
    const paths = Array.from(svgElement.querySelectorAll('path'));
    
    if (paths.length === 0) {
      console.log("No paths found to group");
      return svgContent;
    }

    console.log(`Processing ${paths.length} paths for grouping`);

    // Apply curve type filtering if specified
    if (options.allowedCurveTypes && options.allowedCurveTypes.length > 0) {
      console.log("Applying curve type restrictions:", options.allowedCurveTypes);
      paths.forEach(path => {
        const d = path.getAttribute('d');
        if (d && options.allowedCurveTypes) {
          const filteredPath = filterCurveTypes(d, options.allowedCurveTypes);
          path.setAttribute('d', filteredPath);
        }
      });
    }

    // Apply grouping strategy
    if (options.groupBy !== 'none') {
      console.log(`Grouping paths by: ${options.groupBy}`);
      
      // Clear existing content
      svgElement.innerHTML = '';
      
      if (options.groupBy === 'color') {
        applyColorGrouping(svgElement, paths, options.shapeStacking);
      } else if (options.groupBy === 'shape') {
        applyShapeGrouping(svgElement, paths, options.shapeStacking);
      }
    } else if (options.shapeStacking !== 'placeCutouts') {
      // Apply stacking without grouping
      console.log(`Applying stacking mode: ${options.shapeStacking}`);
      applyStackingMode(svgElement, paths, options.shapeStacking);
    }

    return dom.serialize();
  } catch (error) {
    console.error("Error applying SVG grouping:", error);
    // Return original content on error
    return svgContent;
  }
}

/**
 * Filter curve types in SVG path data based on allowed types
 */
function filterCurveTypes(pathData: string, allowedTypes: string[]): string {
  // Map curve commands to types
  const curveTypeMap: { [key: string]: string } = {
    'L': 'lines',
    'H': 'lines',
    'V': 'lines',
    'Q': 'quadraticBezier',
    'T': 'quadraticBezier',
    'C': 'cubicBezier',
    'S': 'cubicBezier',
    'A': 'ellipticalArcs'
  };

  // Convert path data to array of commands
  const commands = pathData.match(/[MLHVQTCSAZ][^MLHVQTCSAZ]*/gi) || [];
  
  const filteredCommands = commands.map(command => {
    const commandLetter = command[0].toUpperCase();
    const curveType = curveTypeMap[commandLetter];
    
    // If this curve type is not allowed, convert to lines
    if (curveType && !allowedTypes.includes(curveType)) {
      if (commandLetter === 'C' || commandLetter === 'S') {
        // Convert cubic bezier to line
        const coords = command.slice(1).trim().split(/[\s,]+/);
        if (coords.length >= 6) {
          return `L ${coords[coords.length - 2]} ${coords[coords.length - 1]}`;
        }
      } else if (commandLetter === 'Q' || commandLetter === 'T') {
        // Convert quadratic bezier to line
        const coords = command.slice(1).trim().split(/[\s,]+/);
        if (coords.length >= 4) {
          return `L ${coords[coords.length - 2]} ${coords[coords.length - 1]}`;
        }
      } else if (commandLetter === 'A') {
        // Convert arc to line (simplified)
        const coords = command.slice(1).trim().split(/[\s,]+/);
        if (coords.length >= 7) {
          return `L ${coords[5]} ${coords[6]}`;
        }
      }
    }
    
    return command;
  });

  return filteredCommands.join(' ');
}

/**
 * Group paths by color and apply stacking
 */
function applyColorGrouping(svgElement: Element, paths: Element[], stackingMode: string) {
  const colorGroups: { [color: string]: Element[] } = {};
  
  // Group paths by fill color
  paths.forEach(path => {
    const fill = path.getAttribute('fill') || '#000000';
    if (!colorGroups[fill]) {
      colorGroups[fill] = [];
    }
    colorGroups[fill].push(path);
  });

  console.log(`Created ${Object.keys(colorGroups).length} color groups`);

  // Create groups for each color
  Object.entries(colorGroups).forEach(([color, groupPaths], index) => {
    const group = svgElement.ownerDocument!.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', `color-group-${index}`);
    group.setAttribute('fill', color);
    group.setAttribute('data-color', color);
    
    // Apply stacking-specific attributes
    if (stackingMode === 'layered') {
      group.setAttribute('style', `z-index: ${index}; isolation: isolate;`);
    } else if (stackingMode === 'stacked') {
      group.setAttribute('data-layer', index.toString());
    }

    // Add paths to group (remove individual fill attributes to use group fill)
    groupPaths.forEach(path => {
      path.removeAttribute('fill');
      group.appendChild(path);
    });

    svgElement.appendChild(group);
  });
}

/**
 * Group paths by shape complexity
 */
function applyShapeGrouping(svgElement: Element, paths: Element[], stackingMode: string) {
  const shapeGroups: { [type: string]: Element[] } = {
    'simple': [],
    'complex': [],
    'curves': []
  };
  
  // Classify paths by complexity
  paths.forEach(path => {
    const d = path.getAttribute('d') || '';
    const hasComplexCurves = /[QCSTAZ]/i.test(d);
    const commandCount = (d.match(/[MLHVQTCSAZ]/gi) || []).length;
    
    if (hasComplexCurves) {
      shapeGroups['curves'].push(path);
    } else if (commandCount > 10) {
      shapeGroups['complex'].push(path);
    } else {
      shapeGroups['simple'].push(path);
    }
  });

  console.log("Shape groups:", {
    simple: shapeGroups.simple.length,
    complex: shapeGroups.complex.length,
    curves: shapeGroups.curves.length
  });

  // Create groups for each shape type
  Object.entries(shapeGroups).forEach(([type, groupPaths], index) => {
    if (groupPaths.length === 0) return;
    
    const group = svgElement.ownerDocument!.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('id', `shape-group-${type}`);
    group.setAttribute('class', `shapes-${type}`);
    
    // Apply stacking-specific attributes
    if (stackingMode === 'layered') {
      const layerOrder = { 'simple': 1, 'complex': 2, 'curves': 3 };
      group.setAttribute('style', `z-index: ${layerOrder[type as keyof typeof layerOrder]}; isolation: isolate;`);
    } else if (stackingMode === 'stacked') {
      group.setAttribute('data-layer', index.toString());
    }

    // Add paths to group
    groupPaths.forEach(path => {
      group.appendChild(path);
    });

    svgElement.appendChild(group);
  });
}

/**
 * Apply stacking mode without grouping
 */
function applyStackingMode(svgElement: Element, paths: Element[], stackingMode: string) {
  if (stackingMode === 'layered') {
    // Add layering styles to individual paths
    paths.forEach((path, index) => {
      const style = path.getAttribute('style') || '';
      path.setAttribute('style', `${style}; z-index: ${index}; isolation: isolate;`);
    });
  } else if (stackingMode === 'flat') {
    // Flatten all paths by removing any layering styles
    paths.forEach(path => {
      const style = path.getAttribute('style') || '';
      const cleanStyle = style.replace(/z-index\s*:\s*[^;]+;?/gi, '').replace(/isolation\s*:\s*[^;]+;?/gi, '');
      if (cleanStyle) {
        path.setAttribute('style', cleanStyle);
      } else {
        path.removeAttribute('style');
      }
    });
  }
}

/**
 * Optimize SVG for specific use cases
 */
export function optimizeSVGForUseCase(svgContent: string, useCase: string): string {
  try {
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) return svgContent;

    switch (useCase) {
      case 'logo':
        return optimizeForLogo(svgElement, dom);
      case 'icon':
        return optimizeForIcon(svgElement, dom);
      case 'manufacturing':
        return optimizeForManufacturing(svgElement, dom);
      case 'webAnimation':
        return optimizeForWebAnimation(svgElement, dom);
      default:
        return svgContent;
    }
  } catch (error) {
    console.error("Error optimizing SVG for use case:", error);
    return svgContent;
  }
}

/**
 * Optimize SVG for logo use - prioritize clean edges and scalability
 */
function optimizeForLogo(svgElement: Element, dom: JSDOM): string {
  // Add logo-specific attributes
  svgElement.setAttribute('vector-effect', 'non-scaling-stroke');
  
  // Optimize paths for crisp edges
  const paths = svgElement.querySelectorAll('path');
  paths.forEach(path => {
    path.setAttribute('shape-rendering', 'geometricPrecision');
  });

  return dom.serialize();
}

/**
 * Optimize SVG for icon use - minimize file size
 */
function optimizeForIcon(svgElement: Element, dom: JSDOM): string {
  // Remove unnecessary attributes and optimize for small size
  const paths = svgElement.querySelectorAll('path');
  paths.forEach(path => {
    // Remove redundant attributes
    path.removeAttribute('stroke-width');
    path.setAttribute('shape-rendering', 'optimizeSpeed');
  });

  return dom.serialize();
}

/**
 * Optimize SVG for manufacturing - ensure single continuous paths
 */
function optimizeForManufacturing(svgElement: Element, dom: JSDOM): string {
  svgElement.setAttribute('data-manufacturing', 'true');
  
  // Ensure paths are suitable for CNC/cutting
  const paths = svgElement.querySelectorAll('path');
  paths.forEach(path => {
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#000000');
    path.setAttribute('stroke-width', '1');
  });

  return dom.serialize();
}

/**
 * Optimize SVG for web animations - clean structure with IDs
 */
function optimizeForWebAnimation(svgElement: Element, dom: JSDOM): string {
  // Add IDs to elements for animation targeting
  const paths = svgElement.querySelectorAll('path');
  paths.forEach((path, index) => {
    if (!path.getAttribute('id')) {
      path.setAttribute('id', `path-${index + 1}`);
    }
    path.setAttribute('class', 'animatable-path');
  });

  return dom.serialize();
}