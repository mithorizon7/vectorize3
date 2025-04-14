// SVG Converter Types and Utilities

export type SVGOptions = {
  fileFormat: string;
  svgVersion: string;
  drawStyle: string;
  shapeStacking: string;
  groupBy: string;
  lineFit: string;
  allowedCurveTypes: string[];
  fillGaps: boolean;
  clipOverflow: boolean;
  nonScalingStroke: boolean;
  strokeWidth: number;
};

export const initialSVGOptions: SVGOptions = {
  fileFormat: "svg",
  svgVersion: "1.1",
  drawStyle: "fillShapes",
  shapeStacking: "placeCutouts", 
  groupBy: "none",
  lineFit: "medium",
  allowedCurveTypes: ["lines", "quadraticBezier", "cubicBezier", "circularArcs", "ellipticalArcs"],
  fillGaps: true,
  clipOverflow: false,
  nonScalingStroke: true,
  strokeWidth: 2.0
};

export function updateSvgColor(svgContent: string, color: string): string {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Find all path, rect, circle, ellipse, polygon, polyline elements
    const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'];
    for (const tag of shapeTags) {
      const elements = svgDoc.querySelectorAll(tag);
      for (const el of elements) {
        const fill = el.getAttribute('fill');
        // Only update if fill is not explicitly set to 'none'
        if (!fill || fill !== 'none') {
          el.setAttribute('fill', color);
        }
        
        // If there's a stroke that isn't 'none', update it too
        const stroke = el.getAttribute('stroke');
        if (stroke && stroke !== 'none') {
          el.setAttribute('stroke', color);
        }
      }
    }
    
    // Groups often have fill/stroke attributes too
    const groups = svgDoc.querySelectorAll('g');
    for (const g of groups) {
      const fill = g.getAttribute('fill');
      if (fill && fill !== 'none') {
        g.setAttribute('fill', color);
      }
      
      const stroke = g.getAttribute('stroke');
      if (stroke && stroke !== 'none') {
        g.setAttribute('stroke', color);
      }
    }
    
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgDoc);
  } catch (error) {
    console.error('Error updating SVG color:', error);
    return svgContent; // Return original content on error
  }
}

export function setTransparentBackground(svgContent: string, isTransparent: boolean): string {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    
    if (svgElement) {
      // Look for background rectangles (often the first rect that covers the whole image)
      const backgrounds = svgElement.querySelectorAll('rect[width="100%"][height="100%"], rect[x="0"][y="0"]');
      
      if (backgrounds.length > 0) {
        backgrounds.forEach(bg => {
          bg.setAttribute('fill', isTransparent ? 'none' : '#FFFFFF');
        });
      } else {
        // If no background rect found, create one
        const newRect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
        newRect.setAttribute('x', '0');
        newRect.setAttribute('y', '0');
        newRect.setAttribute('width', '100%');
        newRect.setAttribute('height', '100%');
        newRect.setAttribute('fill', isTransparent ? 'none' : '#FFFFFF');
        
        // Insert as first child
        if (svgElement.firstChild) {
          svgElement.insertBefore(newRect, svgElement.firstChild);
        } else {
          svgElement.appendChild(newRect);
        }
      }
      
      const serializer = new XMLSerializer();
      return serializer.serializeToString(svgDoc);
    }
    
    return svgContent;
  } catch (error) {
    console.error('Error setting transparent background:', error);
    return svgContent; // Return original content on error
  }
}
