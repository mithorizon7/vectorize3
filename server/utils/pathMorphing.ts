import { JSDOM } from 'jsdom';

/**
 * Path Morphing and Normalization Utilities
 * Enables smooth shape transformations and morphing animations
 */

export interface PathPoint {
  x: number;
  y: number;
  command: string; // M, L, C, Q, Z, etc.
  controlPoints?: Array<{ x: number; y: number }>;
}

export interface NormalizedPath {
  id: string;
  originalPath: string;
  normalizedPath: string;
  pointCount: number;
  points: PathPoint[];
  bounds: { x: number; y: number; width: number; height: number };
}

export interface PathPair {
  sourceId: string;
  targetId: string;
  sourcePath: NormalizedPath;
  targetPath: NormalizedPath;
  morphingPath: string;
  compatibility: number; // 0-100 score
}

/**
 * Normalize path for morphing compatibility
 */
export function normalizePath(pathData: string, targetPointCount: number = 100): NormalizedPath {
  try {
    console.log('Normalizing path for morphing:', pathData.slice(0, 50) + '...');
    
    const points = parsePath(pathData);
    const normalizedPoints = normalizePointCount(points, targetPointCount);
    const bounds = calculateBounds(normalizedPoints);
    
    const normalizedPath = pointsToPath(normalizedPoints);
    
    return {
      id: generatePathId(pathData),
      originalPath: pathData,
      normalizedPath,
      pointCount: normalizedPoints.length,
      points: normalizedPoints,
      bounds
    };
    
  } catch (error) {
    console.error('Error normalizing path:', error);
    throw new Error(`Failed to normalize path: ${error}`);
  }
}

/**
 * Find optimal path pairs for morphing
 */
export function findMorphingPairs(paths: NormalizedPath[]): PathPair[] {
  const pairs: PathPair[] = [];
  
  // Compare each path with every other path
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      const sourcePath = paths[i];
      const targetPath = paths[j];
      
      const compatibility = calculateCompatibility(sourcePath, targetPath);
      
      if (compatibility > 50) { // Only pair if reasonably compatible
        const morphingPath = generateMorphingPath(sourcePath, targetPath);
        
        pairs.push({
          sourceId: sourcePath.id,
          targetId: targetPath.id,
          sourcePath,
          targetPath,
          morphingPath,
          compatibility
        });
      }
    }
  }
  
  // Sort by compatibility (best matches first)
  pairs.sort((a, b) => b.compatibility - a.compatibility);
  
  console.log(`Found ${pairs.length} morphing pairs`);
  return pairs;
}

/**
 * Generate morphing-ready SVG with paired paths
 */
export function generateMorphingReadySVG(
  svgContent: string, 
  targetPointCount: number = 100
): { svg: string; pairs: PathPair[]; paths: NormalizedPath[] } {
  try {
    console.log('Generating morphing-ready SVG...');
    
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    // Find all paths
    const pathElements = Array.from(svgElement.querySelectorAll('path'));
    const paths: NormalizedPath[] = [];
    
    // Normalize each path
    pathElements.forEach(pathElement => {
      const pathData = pathElement.getAttribute('d');
      if (pathData) {
        const normalized = normalizePath(pathData, targetPointCount);
        paths.push(normalized);
        
        // Update the path element with normalized data
        pathElement.setAttribute('d', normalized.normalizedPath);
        pathElement.setAttribute('data-original-path', pathData);
        pathElement.setAttribute('data-point-count', normalized.pointCount.toString());
        pathElement.setAttribute('data-morph-ready', 'true');
      }
    });
    
    // Find morphing pairs
    const pairs = findMorphingPairs(paths);
    
    // Add morphing pair metadata to SVG
    pairs.forEach((pair, index) => {
      const sourceElement = svgElement.querySelector(`path[d="${pair.sourcePath.originalPath}"]`);
      const targetElement = svgElement.querySelector(`path[d="${pair.targetPath.originalPath}"]`);
      
      if (sourceElement && targetElement) {
        sourceElement.setAttribute('data-morph-target', pair.targetId);
        sourceElement.setAttribute('data-morph-compatibility', pair.compatibility.toString());
        targetElement.setAttribute('data-morph-source', pair.sourceId);
      }
    });

    const processedSvg = dom.serialize();
    
    console.log(`Morphing-ready SVG generated with ${paths.length} normalized paths and ${pairs.length} pairs`);
    
    return {
      svg: processedSvg,
      pairs,
      paths
    };
    
  } catch (error) {
    console.error('Error generating morphing-ready SVG:', error);
    return {
      svg: svgContent,
      pairs: [],
      paths: []
    };
  }
}

/**
 * Parse SVG path data into points
 */
function parsePath(pathData: string): PathPoint[] {
  const points: PathPoint[] = [];
  
  // Simplified path parsing - in production, use a proper SVG path parser
  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  let currentX = 0;
  let currentY = 0;
  
  commands.forEach(command => {
    const type = command[0].toUpperCase();
    const params = command.slice(1).trim().split(/[\s,]+/).map(p => parseFloat(p)).filter(p => !isNaN(p));
    
    switch (type) {
      case 'M': // Move to
        if (params.length >= 2) {
          currentX = params[0];
          currentY = params[1];
          points.push({ x: currentX, y: currentY, command: 'M' });
        }
        break;
        
      case 'L': // Line to
        if (params.length >= 2) {
          currentX = params[0];
          currentY = params[1];
          points.push({ x: currentX, y: currentY, command: 'L' });
        }
        break;
        
      case 'C': // Cubic bezier curve
        if (params.length >= 6) {
          points.push({
            x: params[4],
            y: params[5],
            command: 'C',
            controlPoints: [
              { x: params[0], y: params[1] },
              { x: params[2], y: params[3] }
            ]
          });
          currentX = params[4];
          currentY = params[5];
        }
        break;
        
      case 'Q': // Quadratic bezier curve
        if (params.length >= 4) {
          points.push({
            x: params[2],
            y: params[3],
            command: 'Q',
            controlPoints: [{ x: params[0], y: params[1] }]
          });
          currentX = params[2];
          currentY = params[3];
        }
        break;
        
      case 'Z': // Close path
        points.push({ x: currentX, y: currentY, command: 'Z' });
        break;
    }
  });
  
  return points;
}

/**
 * Normalize point count for morphing compatibility
 */
function normalizePointCount(points: PathPoint[], targetCount: number): PathPoint[] {
  if (points.length === targetCount) return points;
  
  const normalized: PathPoint[] = [];
  
  if (points.length > targetCount) {
    // Reduce points by sampling
    const step = points.length / targetCount;
    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step);
      normalized.push(points[index] || points[points.length - 1]);
    }
  } else {
    // Increase points by interpolation
    const factor = targetCount / points.length;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      normalized.push(current);
      
      // Add interpolated points
      const interpolationCount = Math.floor(factor) - 1;
      for (let j = 1; j <= interpolationCount; j++) {
        const t = j / (interpolationCount + 1);
        normalized.push({
          x: current.x + (next.x - current.x) * t,
          y: current.y + (next.y - current.y) * t,
          command: 'L'
        });
      }
    }
    
    // Add the last point
    normalized.push(points[points.length - 1]);
  }
  
  return normalized.slice(0, targetCount);
}

/**
 * Calculate compatibility score between two paths
 */
function calculateCompatibility(path1: NormalizedPath, path2: NormalizedPath): number {
  let score = 0;
  
  // Point count compatibility (should be equal after normalization)
  if (path1.pointCount === path2.pointCount) {
    score += 30;
  }
  
  // Shape complexity similarity
  const complexity1 = path1.points.filter(p => p.command === 'C' || p.command === 'Q').length;
  const complexity2 = path2.points.filter(p => p.command === 'C' || p.command === 'Q').length;
  const complexityDiff = Math.abs(complexity1 - complexity2);
  score += Math.max(0, 30 - complexityDiff * 5);
  
  // Size similarity
  const area1 = path1.bounds.width * path1.bounds.height;
  const area2 = path2.bounds.width * path2.bounds.height;
  const sizeDiff = Math.abs(Math.log(area1) - Math.log(area2));
  score += Math.max(0, 20 - sizeDiff * 10);
  
  // Aspect ratio similarity
  const ratio1 = path1.bounds.width / path1.bounds.height;
  const ratio2 = path2.bounds.width / path2.bounds.height;
  const ratioDiff = Math.abs(ratio1 - ratio2);
  score += Math.max(0, 20 - ratioDiff * 10);
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Generate morphing path for GSAP MorphSVG
 */
function generateMorphingPath(source: NormalizedPath, target: NormalizedPath): string {
  // For GSAP MorphSVG, we just need the target path
  // The morphing is handled by the animation library
  return target.normalizedPath;
}

/**
 * Convert points back to path string
 */
function pointsToPath(points: PathPoint[]): string {
  if (points.length === 0) return '';
  
  let pathData = '';
  
  points.forEach((point, index) => {
    if (index === 0 || point.command === 'M') {
      pathData += `M ${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
    } else if (point.command === 'C' && point.controlPoints && point.controlPoints.length === 2) {
      pathData += `C ${point.controlPoints[0].x.toFixed(2)} ${point.controlPoints[0].y.toFixed(2)} `;
      pathData += `${point.controlPoints[1].x.toFixed(2)} ${point.controlPoints[1].y.toFixed(2)} `;
      pathData += `${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
    } else if (point.command === 'Q' && point.controlPoints && point.controlPoints.length === 1) {
      pathData += `Q ${point.controlPoints[0].x.toFixed(2)} ${point.controlPoints[0].y.toFixed(2)} `;
      pathData += `${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
    } else if (point.command === 'Z') {
      pathData += 'Z ';
    } else {
      pathData += `L ${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
    }
  });
  
  return pathData.trim();
}

/**
 * Calculate bounding box of points
 */
function calculateBounds(points: PathPoint[]): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  
  points.forEach(point => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Generate stable ID for path
 */
function generatePathId(pathData: string): string {
  // Simple hash-based ID generation
  let hash = 0;
  for (let i = 0; i < pathData.length; i++) {
    const char = pathData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `morph_${Math.abs(hash).toString(36)}`;
}

/**
 * Generate GSAP MorphSVG code for path morphing
 */
export function generateMorphingGSAP(pairs: PathPair[]): string {
  return `// GSAP MorphSVG Animation Code
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

// Path Morphing Animations
function createMorphingAnimations() {
  const tl = gsap.timeline({ repeat: -1, yoyo: true });
  
${pairs.map((pair, index) => `
  // Morph from ${pair.sourceId} to ${pair.targetId} (${pair.compatibility}% compatible)
  tl.to("#${pair.sourceId}", {
    morphSVG: "#${pair.targetId}",
    duration: 2,
    ease: "power2.inOut"
  }, ${index * 0.5});`).join('')}
  
  return tl;
}

// Usage
const morphingAnimation = createMorphingAnimations();

// Control functions
function startMorphing() {
  morphingAnimation.play();
}

function pauseMorphing() {
  morphingAnimation.pause();
}

function resetMorphing() {
  morphingAnimation.restart();
}

export { startMorphing, pauseMorphing, resetMorphing };`;