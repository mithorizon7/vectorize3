/**
 * CSS Variable Color System for Animation-Ready SVGs
 * Extracts colors and converts them to CSS custom properties for easy theming and animation
 */

export interface ColorPalette {
  colors: Array<{
    original: string;
    variable: string;
    name: string;
    usage: number;
    category: 'primary' | 'secondary' | 'accent' | 'neutral';
  }>;
  css: string;
  scss: string;
  json: string;
}

export interface PaletteExtractionOptions {
  maxColors: number;
  minUsage: number;
  generateSemanticNames: boolean;
  variablePrefix: string;
  groupSimilarColors: boolean;
  colorTolerance: number;
}

/**
 * Extract color palette from SVG content and generate CSS variables
 */
export function extractColorPalette(
  svgContent: string, 
  options: PaletteExtractionOptions
): ColorPalette {
  try {
    console.log('Extracting color palette from SVG with options:', options);
    
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'text/xml');
    
    if (svgDoc.documentElement.tagName === 'parsererror') {
      throw new Error('Invalid SVG content');
    }
    
    // Extract all colors from fill and stroke attributes
    const colorUsage = new Map<string, number>();
    const elements = svgDoc.querySelectorAll('*[fill], *[stroke]');
    
    Array.from(elements).forEach(element => {
      const fill = element.getAttribute('fill');
      const stroke = element.getAttribute('stroke');
      
      [fill, stroke].forEach(color => {
        if (color && color !== 'none' && color !== 'transparent') {
          const normalizedColor = normalizeColor(color);
          if (normalizedColor) {
            colorUsage.set(normalizedColor, (colorUsage.get(normalizedColor) || 0) + 1);
          }
        }
      });
    });
    
    console.log(`Found ${colorUsage.size} unique colors`);
    
    // Filter colors by minimum usage and group similar colors if enabled
    let colorEntries = Array.from(colorUsage.entries())
      .filter(([_, usage]) => usage >= options.minUsage)
      .sort((a, b) => b[1] - a[1]); // Sort by usage descending
    
    if (options.groupSimilarColors) {
      colorEntries = groupSimilarColors(colorEntries, options.colorTolerance);
    }
    
    // Limit to max colors
    if (colorEntries.length > options.maxColors) {
      colorEntries = colorEntries.slice(0, options.maxColors);
    }
    
    // Generate semantic names and categories
    const colors = colorEntries.map(([color, usage], index) => {
      const semanticName = options.generateSemanticNames 
        ? generateSemanticColorName(color, index, usage)
        : `color-${index + 1}`;
      
      const variable = `--${options.variablePrefix}${semanticName}`;
      const category = categorizeColor(color, index, usage);
      
      return {
        original: color,
        variable,
        name: semanticName,
        usage,
        category
      };
    });
    
    // Generate CSS output
    const css = generateCSS(colors);
    const scss = generateSCSS(colors);
    const json = generateJSON(colors);
    
    console.log(`Generated palette with ${colors.length} colors`);
    
    return {
      colors,
      css,
      scss,
      json
    };
  } catch (error) {
    console.error('Error extracting color palette:', error);
    return {
      colors: [],
      css: '',
      scss: '',
      json: '{}'
    };
  }
}

/**
 * Replace colors in SVG with CSS variables
 */
export function applyCSSVariables(
  svgContent: string, 
  palette: ColorPalette
): string {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'text/xml');
    
    if (svgDoc.documentElement.tagName === 'parsererror') {
      throw new Error('Invalid SVG content');
    }
    
    // Create color mapping
    const colorMap = new Map<string, string>();
    palette.colors.forEach(({ original, variable }) => {
      colorMap.set(original, `var(${variable})`);
    });
    
    // Replace colors in all elements
    const elements = svgDoc.querySelectorAll('*[fill], *[stroke]');
    Array.from(elements).forEach(element => {
      const fill = element.getAttribute('fill');
      const stroke = element.getAttribute('stroke');
      
      if (fill && colorMap.has(fill)) {
        element.setAttribute('fill', colorMap.get(fill)!);
      }
      
      if (stroke && colorMap.has(stroke)) {
        element.setAttribute('stroke', colorMap.get(stroke)!);
      }
    });
    
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgDoc);
  } catch (error) {
    console.error('Error applying CSS variables:', error);
    return svgContent;
  }
}

/**
 * Normalize color values to a consistent format
 */
function normalizeColor(color: string): string | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.toLowerCase();
    // Convert 3-digit hex to 6-digit
    if (hex.length === 4) {
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    if (hex.length === 7) {
      return hex;
    }
  }
  
  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbMatch) {
    const values = rgbMatch[1].split(',').map(v => parseFloat(v.trim()));
    if (values.length >= 3) {
      const [r, g, b] = values;
      const hex = ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b))
        .toString(16).slice(1);
      return '#' + hex;
    }
  }
  
  // Handle named colors (basic set)
  const namedColors: Record<string, string> = {
    'black': '#000000',
    'white': '#ffffff',
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'gray': '#808080',
    'grey': '#808080',
    'orange': '#ffa500',
    'purple': '#800080',
    'brown': '#a52a2a',
    'pink': '#ffc0cb'
  };
  
  const lowerColor = color.toLowerCase();
  if (namedColors[lowerColor]) {
    return namedColors[lowerColor];
  }
  
  return null;
}

/**
 * Group similar colors together to reduce palette size
 */
function groupSimilarColors(
  colorEntries: Array<[string, number]>, 
  tolerance: number
): Array<[string, number]> {
  const grouped: Array<[string, number]> = [];
  const used = new Set<number>();
  
  for (let i = 0; i < colorEntries.length; i++) {
    if (used.has(i)) continue;
    
    const [color1, usage1] = colorEntries[i];
    let totalUsage = usage1;
    let dominantColor = color1;
    let maxUsage = usage1;
    
    // Find similar colors
    for (let j = i + 1; j < colorEntries.length; j++) {
      if (used.has(j)) continue;
      
      const [color2, usage2] = colorEntries[j];
      if (calculateColorDistance(color1, color2) <= tolerance) {
        totalUsage += usage2;
        if (usage2 > maxUsage) {
          dominantColor = color2;
          maxUsage = usage2;
        }
        used.add(j);
      }
    }
    
    grouped.push([dominantColor, totalUsage]);
    used.add(i);
  }
  
  return grouped.sort((a, b) => b[1] - a[1]);
}

/**
 * Calculate color distance using simple RGB difference
 */
function calculateColorDistance(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1000; // Max distance if invalid
  
  const deltaR = rgb1.r - rgb2.r;
  const deltaG = rgb1.g - rgb2.g;
  const deltaB = rgb1.b - rgb2.b;
  
  return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#([a-f\d]{6})$/i);
  if (!match) return null;
  
  const [, hexValue] = match;
  return {
    r: parseInt(hexValue.slice(0, 2), 16),
    g: parseInt(hexValue.slice(2, 4), 16),
    b: parseInt(hexValue.slice(4, 6), 16)
  };
}

/**
 * Generate semantic names for colors
 */
function generateSemanticColorName(color: string, index: number, usage: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return `color-${index + 1}`;
  
  const { r, g, b } = rgb;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Check for common colors
  const colorNames: Array<[string, [number, number, number], number]> = [
    ['red', [255, 0, 0], 60],
    ['green', [0, 128, 0], 60],
    ['blue', [0, 0, 255], 60],
    ['yellow', [255, 255, 0], 60],
    ['cyan', [0, 255, 255], 60],
    ['magenta', [255, 0, 255], 60],
    ['orange', [255, 165, 0], 60],
    ['purple', [128, 0, 128], 60],
    ['pink', [255, 192, 203], 60],
    ['brown', [165, 42, 42], 60]
  ];
  
  for (const [name, [tr, tg, tb], threshold] of colorNames) {
    const distance = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);
    if (distance <= threshold) {
      return usage > 10 ? `${name}-primary` : name;
    }
  }
  
  // Fallback to brightness-based names
  if (brightness < 50) {
    return usage > 10 ? 'dark-primary' : 'dark';
  } else if (brightness > 200) {
    return usage > 10 ? 'light-primary' : 'light';
  } else {
    return usage > 10 ? 'mid-primary' : 'mid';
  }
}

/**
 * Categorize colors for UI organization
 */
function categorizeColor(
  color: string, 
  index: number, 
  usage: number
): 'primary' | 'secondary' | 'accent' | 'neutral' {
  if (index === 0) return 'primary';
  if (usage > 5) return 'secondary';
  
  const rgb = hexToRgb(color);
  if (!rgb) return 'neutral';
  
  const { r, g, b } = rgb;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  
  if (brightness < 50 || brightness > 200) return 'neutral';
  if (saturation > 50) return 'accent';
  
  return 'secondary';
}

/**
 * Generate CSS output
 */
function generateCSS(colors: Array<{ variable: string; original: string; name: string }>): string {
  const variables = colors
    .map(({ variable, original }) => `  ${variable}: ${original};`)
    .join('\n');
  
  return `:root {\n${variables}\n}`;
}

/**
 * Generate SCSS output
 */
function generateSCSS(colors: Array<{ variable: string; original: string; name: string }>): string {
  const variables = colors
    .map(({ variable, original }) => `$${variable.slice(2)}: ${original};`)
    .join('\n');
  
  const cssVariables = colors
    .map(({ variable, name }) => `  ${variable}: $${variable.slice(2)};`)
    .join('\n');
  
  return `// SCSS Variables\n${variables}\n\n// CSS Custom Properties\n:root {\n${cssVariables}\n}`;
}

/**
 * Generate JSON output
 */
function generateJSON(colors: Array<{ variable: string; original: string; name: string; category: string }>): string {
  const colorObj = colors.reduce((acc, { variable, original, name, category }) => {
    acc[name] = {
      variable: variable,
      value: original,
      category: category
    };
    return acc;
  }, {} as Record<string, any>);
  
  return JSON.stringify(colorObj, null, 2);
}