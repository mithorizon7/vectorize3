import { JSDOM } from 'jsdom';

/**
 * Enhanced background removal utility for ensuring transparent SVG outputs
 * Removes various types of background elements that tracing engines might add
 */
export function ensureTransparentBackground(svgContent: string): string {
  try {
    console.log("Ensuring transparent SVG background...");
    
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      console.warn("No SVG element found, returning original content");
      return svgContent;
    }
    
    // Track what we remove for logging
    let removedElements: string[] = [];
    
    // 1. Remove rectangles that span the entire SVG (common background patterns)
    const fullSizeRects = document.querySelectorAll('rect');
    fullSizeRects.forEach(rect => {
      const x = rect.getAttribute('x');
      const y = rect.getAttribute('y');
      const width = rect.getAttribute('width');
      const height = rect.getAttribute('height');
      const fill = rect.getAttribute('fill');
      
      // Check if this is likely a background rectangle
      const isBackground = (
        // Positioned at origin with full dimensions
        (x === '0' && y === '0' && (width === '100%' || height === '100%')) ||
        // Has background-related attributes
        rect.hasAttribute('id') && rect.getAttribute('id')?.includes('background') ||
        rect.hasAttribute('class') && rect.getAttribute('class')?.includes('background') ||
        // White or light fills that span large areas
        (fill === '#ffffff' || fill === 'white' || fill === '#fff') &&
        (parseInt(width || '0') > 100 || parseInt(height || '0') > 100 || width === '100%' || height === '100%')
      );
      
      if (isBackground) {
        removedElements.push(`rect(${x},${y},${width}x${height},fill:${fill})`);
        rect.remove();
      }
    });
    
    // 2. Remove any g (group) elements that only contain background rects
    const groups = document.querySelectorAll('g');
    groups.forEach(group => {
      const children = Array.from(group.children);
      if (children.length === 1 && children[0].tagName === 'rect') {
        const rect = children[0];
        const fill = rect.getAttribute('fill');
        if (fill === '#ffffff' || fill === 'white' || fill === '#fff') {
          removedElements.push(`group with background rect`);
          group.remove();
        }
      }
    });
    
    // 3. Remove any paths that might be background fills (large filled areas with light colors)
    const paths = document.querySelectorAll('path');
    paths.forEach(path => {
      const fill = path.getAttribute('fill');
      const d = path.getAttribute('d');
      
      // Check if this is likely a background path (starts with large movements, light fill)
      if ((fill === '#ffffff' || fill === 'white' || fill === '#fff') && 
          d && d.includes('M0') && d.includes('L')) {
        // This might be a background path created by some tracers
        const pathLength = d.length;
        if (pathLength > 200) { // Long path that might be a background
          removedElements.push(`background path(fill:${fill})`);
          path.remove();
        }
      }
    });
    
    // 4. Clean up any style attributes that set background colors
    if (svgElement.hasAttribute('style')) {
      const style = svgElement.getAttribute('style') || '';
      const cleanedStyle = style
        .replace(/background[^;]*;?/g, '')
        .replace(/background-color[^;]*;?/g, '')
        .trim();
      
      if (cleanedStyle) {
        svgElement.setAttribute('style', cleanedStyle);
      } else {
        svgElement.removeAttribute('style');
        removedElements.push('background styles');
      }
    }
    
    // 5. Ensure no fill is set on the SVG element itself
    if (svgElement.hasAttribute('fill')) {
      removedElements.push(`svg fill:${svgElement.getAttribute('fill')}`);
      svgElement.removeAttribute('fill');
    }
    
    // Log what we removed
    if (removedElements.length > 0) {
      console.log(`Removed background elements: ${removedElements.join(', ')}`);
    } else {
      console.log("No background elements found to remove");
    }
    
    return dom.window.document.documentElement.outerHTML;
    
  } catch (error) {
    console.error("Error ensuring transparent background:", error);
    // Return original content on error to avoid breaking the SVG
    return svgContent;
  }
}

/**
 * Advanced background removal with pattern detection
 * Handles more complex background patterns that tracers might create
 */
export function removeTracerBackgrounds(svgContent: string, tracerType: 'potrace' | 'imagetracer'): string {
  try {
    console.log(`Removing ${tracerType} backgrounds...`);
    
    let processedSvg = svgContent;
    
    if (tracerType === 'potrace') {
      // Potrace-specific background removal
      // Potrace sometimes creates large filled paths that represent the background
      processedSvg = processedSvg.replace(
        /<path[^>]*fill=["'](?:#ffffff|white|#fff)["'][^>]*d=["']M0[^"']*["'][^>]*\/?>(?:\s*<\/path>)?/gi,
        ''
      );
      
      // Remove any rect elements that potrace might add for backgrounds
      processedSvg = processedSvg.replace(
        /<rect[^>]*(?:x=["']0["']|y=["']0["'])[^>]*fill=["'](?:#ffffff|white|#fff)["'][^>]*\/?>(?:\s*<\/rect>)?/gi,
        ''
      );
    } 
    
    if (tracerType === 'imagetracer') {
      // ImageTracer-specific background removal
      // ImageTracer might create layered backgrounds with specific patterns
      processedSvg = processedSvg.replace(
        /<polygon[^>]*fill=["'](?:#ffffff|white|#fff)["'][^>]*points=["']0[^"']*["'][^>]*\/?>(?:\s*<\/polygon>)?/gi,
        ''
      );
      
      // Remove first path if it's a large white fill (common ImageTracer pattern)
      const pathMatch = processedSvg.match(/<path[^>]*fill=["'](?:#ffffff|white|#fff)["'][^>]*>/i);
      if (pathMatch && processedSvg.indexOf(pathMatch[0]) < 100) {
        // If the first white path appears early in the SVG, it's likely a background
        processedSvg = processedSvg.replace(pathMatch[0], '');
        processedSvg = processedSvg.replace(/<\/path>/, ''); // Remove corresponding closing tag
        console.log("Removed ImageTracer background path");
      }
    }
    
    // Apply general transparent background cleaning
    return ensureTransparentBackground(processedSvg);
    
  } catch (error) {
    console.error(`Error removing ${tracerType} backgrounds:`, error);
    return ensureTransparentBackground(svgContent); // Fallback to general cleaning
  }
}