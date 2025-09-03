import { JSDOM } from 'jsdom';

/**
 * Animation-ready SVG processing utilities
 * Provides deterministic ID generation, transform flattening, and structure optimization
 */

export interface AnimationSettings {
  idPrefix: string;
  flattenTransforms: boolean;
  preserveHierarchy: boolean;
  generatePivots: boolean;
  extractColors: boolean;
}

export interface SVGElement {
  id: string;
  name: string;
  type: 'group' | 'path' | 'rect' | 'circle' | 'ellipse' | 'polygon' | 'line';
  visible: boolean;
  locked: boolean;
  pivot?: { x: number; y: number };
  bbox?: { x: number; y: number; width: number; height: number };
  fill?: string;
  stroke?: string;
  parent?: string;
  children?: string[];
}

export interface AnimationSVGData {
  elements: Record<string, SVGElement>;
  hierarchy: string[];
  palette: Record<string, string>;
  viewBox: { x: number; y: number; width: number; height: number };
}

/**
 * Generate deterministic, human-readable IDs for SVG elements
 */
export class SVGIDGenerator {
  private usedIds: Set<string> = new Set();
  private typeCounters: Record<string, number> = {};
  private prefix: string;

  constructor(prefix: string = 'anim_') {
    this.prefix = prefix;
  }

  /**
   * Generate a unique, readable ID based on element type and attributes
   */
  generateId(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    let baseName = this.getSemanticName(element, tagName);
    
    // Increment counter for this type
    if (!this.typeCounters[baseName]) {
      this.typeCounters[baseName] = 0;
    }
    
    let candidateId: string;
    let counter = this.typeCounters[baseName];
    
    do {
      candidateId = counter === 0 
        ? `${this.prefix}${baseName}`
        : `${this.prefix}${baseName}_${counter}`;
      counter++;
    } while (this.usedIds.has(candidateId));
    
    this.typeCounters[baseName] = counter;
    this.usedIds.add(candidateId);
    
    return candidateId;
  }

  /**
   * Extract semantic meaning from element attributes and content
   */
  private getSemanticName(element: Element, tagName: string): string {
    // Check for existing meaningful IDs or classes
    const existingId = element.getAttribute('id');
    const className = element.getAttribute('class');
    
    if (existingId && this.isSemanticName(existingId)) {
      return this.sanitizeName(existingId);
    }
    
    if (className && this.isSemanticName(className)) {
      return this.sanitizeName(className.split(' ')[0]);
    }

    // Analyze element properties for semantic meaning
    const fill = element.getAttribute('fill');
    const stroke = element.getAttribute('stroke');
    
    // Color-based naming
    if (fill && fill !== 'none') {
      const colorName = this.getColorName(fill);
      if (colorName) {
        return `${tagName}_${colorName}`;
      }
    }

    // Shape-based analysis
    if (tagName === 'circle' || tagName === 'ellipse') {
      const r = element.getAttribute('r') || element.getAttribute('rx');
      if (r && parseFloat(r) > 30) {
        return 'wheel'; // Large circles are often wheels
      }
      return 'circle';
    }

    if (tagName === 'rect') {
      const width = parseFloat(element.getAttribute('width') || '0');
      const height = parseFloat(element.getAttribute('height') || '0');
      const ratio = width / height;
      
      if (Math.abs(ratio - 1) < 0.1) {
        return 'square';
      } else if (ratio > 3) {
        return 'bar';
      }
      return 'rect';
    }

    if (tagName === 'path') {
      const d = element.getAttribute('d') || '';
      if (d.includes('C') || d.includes('Q')) {
        return 'curve';
      } else if (d.includes('L')) {
        return 'line';
      }
      return 'shape';
    }

    return tagName;
  }

  /**
   * Check if a name appears to be semantic rather than generated
   */
  private isSemanticName(name: string): boolean {
    // Skip obviously generated IDs
    const generatedPatterns = [
      /^path\d+$/,
      /^g\d+$/,
      /^rect\d+$/,
      /^circle\d+$/,
      /^[a-f0-9]{8,}$/i, // Hex strings
      /^(unnamed|untitled)/i
    ];

    return !generatedPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Convert colors to semantic names
   */
  private getColorName(color: string): string | null {
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
      '#800080': 'purple',
      '#ffc0cb': 'pink',
      '#a52a2a': 'brown'
    };

    const normalized = color.toLowerCase();
    return colorMap[normalized] || null;
  }

  /**
   * Sanitize names for valid CSS/JS identifiers
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^[0-9]/, '_$&')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  reset(): void {
    this.usedIds.clear();
    this.typeCounters = {};
  }
}

/**
 * Transform flattening utility to bake nested transforms
 */
export class SVGTransformFlattener {
  /**
   * Flatten all nested transforms in an SVG, making each group have a clean local origin
   */
  static flattenTransforms(svgContent: string): string {
    try {
      const dom = new JSDOM(svgContent);
      const document = dom.window.document;
      const svgElement = document.querySelector('svg');
      
      if (!svgElement) {
        throw new Error('No SVG element found');
      }

      // Walk the tree and flatten transforms
      this.flattenElement(svgElement);
      
      return dom.serialize();
    } catch (error) {
      console.error('Error flattening transforms:', error);
      return svgContent;
    }
  }

  /**
   * Recursively flatten transforms on an element and its children
   */
  private static flattenElement(element: Element, parentTransform: DOMMatrix = new DOMMatrix()): void {
    const transform = element.getAttribute('transform');
    let currentTransform = parentTransform;

    if (transform) {
      // Parse and combine with parent transform
      const transformMatrix = this.parseTransform(transform);
      currentTransform = parentTransform.multiply(transformMatrix);
      
      // Remove the transform attribute
      element.removeAttribute('transform');
    }

    // Apply flattened transform to child elements
    const children = Array.from(element.children);
    children.forEach(child => {
      if (child.tagName !== 'defs' && child.tagName !== 'metadata') {
        this.flattenElement(child, currentTransform);
      }
    });

    // For leaf elements (paths, rects, etc.), apply the final transform
    if (children.length === 0 || element.tagName === 'path') {
      this.applyTransformToElement(element, currentTransform);
    }
  }

  /**
   * Parse SVG transform string into DOMMatrix
   */
  private static parseTransform(transform: string): DOMMatrix {
    // This is a simplified transform parser
    // In a real implementation, you'd want a more robust parser
    const matrix = new DOMMatrix();
    
    // Basic transform parsing - extend this for full SVG transform support
    const translateMatch = transform.match(/translate\(([^)]+)\)/);
    if (translateMatch) {
      const values = translateMatch[1].split(/[\s,]+/).map(parseFloat);
      matrix.translateSelf(values[0] || 0, values[1] || 0);
    }

    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    if (scaleMatch) {
      const values = scaleMatch[1].split(/[\s,]+/).map(parseFloat);
      matrix.scaleSelf(values[0] || 1, values[1] || values[0] || 1);
    }

    const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
    if (rotateMatch) {
      const values = rotateMatch[1].split(/[\s,]+/).map(parseFloat);
      matrix.rotateSelf(values[0] || 0);
    }

    return matrix;
  }

  /**
   * Apply a transform matrix to SVG element coordinates
   */
  private static applyTransformToElement(element: Element, transform: DOMMatrix): void {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'path':
        this.transformPath(element, transform);
        break;
      case 'rect':
        this.transformRect(element, transform);
        break;
      case 'circle':
        this.transformCircle(element, transform);
        break;
      case 'ellipse':
        this.transformEllipse(element, transform);
        break;
      case 'line':
        this.transformLine(element, transform);
        break;
      case 'polygon':
      case 'polyline':
        this.transformPolygon(element, transform);
        break;
    }
  }

  /**
   * Transform path data
   */
  private static transformPath(element: Element, transform: DOMMatrix): void {
    const d = element.getAttribute('d');
    if (!d) return;

    // Basic path transformation - in practice, you'd use a proper path parser
    const transformedD = this.transformPathData(d, transform);
    element.setAttribute('d', transformedD);
  }

  /**
   * Transform path data string
   */
  private static transformPathData(pathData: string, transform: DOMMatrix): string {
    // This is a simplified path transformer
    // For production, use a proper SVG path manipulation library
    return pathData.replace(/([ML])\s*([0-9.-]+)[\s,]+([0-9.-]+)/g, (match, command, x, y) => {
      const point = transform.transformPoint(new DOMPoint(parseFloat(x), parseFloat(y)));
      return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    });
  }

  /**
   * Transform rectangle
   */
  private static transformRect(element: Element, transform: DOMMatrix): void {
    const x = parseFloat(element.getAttribute('x') || '0');
    const y = parseFloat(element.getAttribute('y') || '0');
    const width = parseFloat(element.getAttribute('width') || '0');
    const height = parseFloat(element.getAttribute('height') || '0');

    // Transform corner points
    const topLeft = transform.transformPoint(new DOMPoint(x, y));
    const bottomRight = transform.transformPoint(new DOMPoint(x + width, y + height));

    element.setAttribute('x', topLeft.x.toFixed(2));
    element.setAttribute('y', topLeft.y.toFixed(2));
    element.setAttribute('width', Math.abs(bottomRight.x - topLeft.x).toFixed(2));
    element.setAttribute('height', Math.abs(bottomRight.y - topLeft.y).toFixed(2));
  }

  /**
   * Transform circle
   */
  private static transformCircle(element: Element, transform: DOMMatrix): void {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');

    const center = transform.transformPoint(new DOMPoint(cx, cy));
    element.setAttribute('cx', center.x.toFixed(2));
    element.setAttribute('cy', center.y.toFixed(2));
  }

  /**
   * Transform ellipse
   */
  private static transformEllipse(element: Element, transform: DOMMatrix): void {
    const cx = parseFloat(element.getAttribute('cx') || '0');
    const cy = parseFloat(element.getAttribute('cy') || '0');

    const center = transform.transformPoint(new DOMPoint(cx, cy));
    element.setAttribute('cx', center.x.toFixed(2));
    element.setAttribute('cy', center.y.toFixed(2));
  }

  /**
   * Transform line
   */
  private static transformLine(element: Element, transform: DOMMatrix): void {
    const x1 = parseFloat(element.getAttribute('x1') || '0');
    const y1 = parseFloat(element.getAttribute('y1') || '0');
    const x2 = parseFloat(element.getAttribute('x2') || '0');
    const y2 = parseFloat(element.getAttribute('y2') || '0');

    const start = transform.transformPoint(new DOMPoint(x1, y1));
    const end = transform.transformPoint(new DOMPoint(x2, y2));

    element.setAttribute('x1', start.x.toFixed(2));
    element.setAttribute('y1', start.y.toFixed(2));
    element.setAttribute('x2', end.x.toFixed(2));
    element.setAttribute('y2', end.y.toFixed(2));
  }

  /**
   * Transform polygon/polyline
   */
  private static transformPolygon(element: Element, transform: DOMMatrix): void {
    const points = element.getAttribute('points');
    if (!points) return;

    const transformedPoints = points
      .split(/[\s,]+/)
      .reduce((acc: number[], coord, index) => {
        acc.push(parseFloat(coord));
        return acc;
      }, [])
      .reduce((acc: string[], coord, index, array) => {
        if (index % 2 === 0 && index + 1 < array.length) {
          const point = transform.transformPoint(new DOMPoint(coord, array[index + 1]));
          acc.push(`${point.x.toFixed(2)},${point.y.toFixed(2)}`);
        }
        return acc;
      }, [])
      .join(' ');

    element.setAttribute('points', transformedPoints);
  }
}

/**
 * Extract and process SVG structure for animation
 */
export function processAnimationSVG(
  svgContent: string, 
  settings: AnimationSettings
): AnimationSVGData {
  try {
    const dom = new JSDOM(svgContent);
    const document = dom.window.document;
    const svgElement = document.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('No SVG element found');
    }

    // Generate deterministic IDs
    const idGenerator = new SVGIDGenerator(settings.idPrefix);
    const elements: Record<string, SVGElement> = {};
    const hierarchy: string[] = [];
    const palette: Record<string, string> = {};

    // Process elements recursively
    processElement(svgElement, elements, hierarchy, palette, idGenerator, null);

    // Extract viewBox
    const viewBoxAttr = svgElement.getAttribute('viewBox');
    const viewBox = viewBoxAttr 
      ? (() => {
          const [x, y, width, height] = viewBoxAttr.split(/[\s,]+/).map(parseFloat);
          return { x, y, width, height };
        })()
      : { x: 0, y: 0, width: 100, height: 100 };

    return {
      elements,
      hierarchy,
      palette,
      viewBox
    };
  } catch (error) {
    console.error('Error processing animation SVG:', error);
    return {
      elements: {},
      hierarchy: [],
      palette: {},
      viewBox: { x: 0, y: 0, width: 100, height: 100 }
    };
  }
}

/**
 * Recursively process SVG elements
 */
function processElement(
  element: Element,
  elements: Record<string, SVGElement>,
  hierarchy: string[],
  palette: Record<string, string>,
  idGenerator: SVGIDGenerator,
  parentId: string | null
): void {
  if (element.tagName === 'svg') {
    // Process children of SVG root
    Array.from(element.children).forEach(child => {
      processElement(child, elements, hierarchy, palette, idGenerator, null);
    });
    return;
  }

  // Skip non-visual elements
  if (['defs', 'metadata', 'title', 'desc'].includes(element.tagName.toLowerCase())) {
    return;
  }

  const id = idGenerator.generateId(element);
  element.setAttribute('id', id);

  const tagName = element.tagName.toLowerCase();
  const elementType = ['g'].includes(tagName) ? 'group' : tagName as any;

  const svgElement: SVGElement = {
    id,
    name: getDisplayName(element, id),
    type: elementType,
    visible: true,
    locked: false,
    parent: parentId || undefined
  };

  // Extract colors for palette
  const fill = element.getAttribute('fill');
  const stroke = element.getAttribute('stroke');
  
  if (fill && fill !== 'none') {
    svgElement.fill = fill;
    palette[fill] = fill;
  }
  
  if (stroke && stroke !== 'none') {
    svgElement.stroke = stroke;
    palette[stroke] = stroke;
  }

  // Calculate bounding box (simplified)
  svgElement.bbox = calculateBoundingBox(element);

  elements[id] = svgElement;
  
  if (!parentId) {
    hierarchy.push(id);
  } else {
    // Add to parent's children
    if (elements[parentId]) {
      if (!elements[parentId].children) {
        elements[parentId].children = [];
      }
      elements[parentId].children!.push(id);
    }
  }

  // Process children
  Array.from(element.children).forEach(child => {
    processElement(child, elements, hierarchy, palette, idGenerator, id);
  });
}

/**
 * Get display name for element
 */
function getDisplayName(element: Element, id: string): string {
  const tagName = element.tagName.toLowerCase();
  const className = element.getAttribute('class');
  
  if (className) {
    return className.split(' ')[0];
  }
  
  return id.replace(/^anim_/, '');
}

/**
 * Calculate simplified bounding box
 */
function calculateBoundingBox(element: Element): { x: number; y: number; width: number; height: number } {
  const tagName = element.tagName.toLowerCase();
  
  switch (tagName) {
    case 'rect':
      return {
        x: parseFloat(element.getAttribute('x') || '0'),
        y: parseFloat(element.getAttribute('y') || '0'),
        width: parseFloat(element.getAttribute('width') || '0'),
        height: parseFloat(element.getAttribute('height') || '0')
      };
    case 'circle':
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const r = parseFloat(element.getAttribute('r') || '0');
      return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
    default:
      // Simplified fallback
      return { x: 0, y: 0, width: 100, height: 100 };
  }
}