import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crosshair, RotateCw, Move, Target, Zap } from 'lucide-react';

interface PivotPoint {
  x: number;
  y: number;
  elementId: string;
  transformOrigin: string;
  relativeX: number; // 0-1 position within element
  relativeY: number; // 0-1 position within element
}

interface ElementBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  element: Element;
}

interface PivotPointEditorProps {
  svgContent: string;
  onPivotPointsChange: (pivots: PivotPoint[]) => void;
  selectedElementId?: string;
  className?: string;
}

export function PivotPointEditor({ 
  svgContent, 
  onPivotPointsChange, 
  selectedElementId,
  className = "" 
}: PivotPointEditorProps) {
  const [pivotPoints, setPivotPoints] = useState<PivotPoint[]>([]);
  const [isPlacingPivot, setIsPlacingPivot] = useState(false);
  const [elementBounds, setElementBounds] = useState<ElementBounds[]>([]);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [testAnimation, setTestAnimation] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse SVG and extract element bounds
  useEffect(() => {
    if (!svgContent) return;

    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      if (svgElement.tagName !== 'svg') {
        console.error('Invalid SVG content');
        return;
      }

      // Extract viewBox for coordinate conversion
      const viewBox = svgElement.getAttribute('viewBox');
      const [vbX = 0, vbY = 0, vbWidth = 100, vbHeight = 100] = viewBox 
        ? viewBox.split(' ').map(Number) 
        : [0, 0, 100, 100];

      // Find all animatable elements
      const animatableElements = svgElement.querySelectorAll(
        'path[id], rect[id], circle[id], ellipse[id], polygon[id], line[id], g[id]'
      );

      const bounds: ElementBounds[] = [];

      Array.from(animatableElements).forEach(element => {
        const id = element.getAttribute('id');
        if (!id) return;

        let bbox: DOMRect | null = null;
        let x = 0, y = 0, width = 0, height = 0;

        try {
          // Calculate bounds based on element type
          const tagName = element.tagName.toLowerCase();
          
          switch (tagName) {
            case 'rect': {
              x = parseFloat(element.getAttribute('x') || '0');
              y = parseFloat(element.getAttribute('y') || '0');
              width = parseFloat(element.getAttribute('width') || '0');
              height = parseFloat(element.getAttribute('height') || '0');
              break;
            }
            case 'circle': {
              const cx = parseFloat(element.getAttribute('cx') || '0');
              const cy = parseFloat(element.getAttribute('cy') || '0');
              const r = parseFloat(element.getAttribute('r') || '0');
              x = cx - r;
              y = cy - r;
              width = r * 2;
              height = r * 2;
              break;
            }
            case 'ellipse': {
              const cx = parseFloat(element.getAttribute('cx') || '0');
              const cy = parseFloat(element.getAttribute('cy') || '0');
              const rx = parseFloat(element.getAttribute('rx') || '0');
              const ry = parseFloat(element.getAttribute('ry') || '0');
              x = cx - rx;
              y = cy - ry;
              width = rx * 2;
              height = ry * 2;
              break;
            }
            case 'line': {
              const x1 = parseFloat(element.getAttribute('x1') || '0');
              const y1 = parseFloat(element.getAttribute('y1') || '0');
              const x2 = parseFloat(element.getAttribute('x2') || '0');
              const y2 = parseFloat(element.getAttribute('y2') || '0');
              x = Math.min(x1, x2);
              y = Math.min(y1, y2);
              width = Math.abs(x2 - x1);
              height = Math.abs(y2 - y1);
              break;
            }
            default: {
              // For paths, polygons, groups - use more complex bounds calculation
              const pathBounds = calculatePathBounds(element);
              if (pathBounds) {
                x = pathBounds.x;
                y = pathBounds.y;
                width = pathBounds.width;
                height = pathBounds.height;
              }
            }
          }

          bounds.push({
            id,
            x,
            y,
            width,
            height,
            centerX: x + width / 2,
            centerY: y + height / 2,
            element
          });
        } catch (error) {
          console.warn(`Error calculating bounds for element ${id}:`, error);
        }
      });

      setElementBounds(bounds);
      console.log(`Extracted bounds for ${bounds.length} elements`);
    } catch (error) {
      console.error('Error parsing SVG for pivot points:', error);
    }
  }, [svgContent]);

  // Calculate transform-origin value from pixel coordinates
  const calculateTransformOrigin = useCallback((
    clickX: number, 
    clickY: number, 
    element: ElementBounds
  ): { transformOrigin: string; relativeX: number; relativeY: number } => {
    // Calculate relative position within the element (0-1)
    const relativeX = Math.max(0, Math.min(1, (clickX - element.x) / element.width));
    const relativeY = Math.max(0, Math.min(1, (clickY - element.y) / element.height));
    
    // Convert to percentage for CSS transform-origin
    const percentX = (relativeX * 100).toFixed(1);
    const percentY = (relativeY * 100).toFixed(1);
    
    return {
      transformOrigin: `${percentX}% ${percentY}%`,
      relativeX,
      relativeY
    };
  }, []);

  // Handle SVG click for pivot placement
  const handleSvgClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isPlacingPivot || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.getAttribute('viewBox');
    
    if (!viewBox) return;

    const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);
    
    // Convert screen coordinates to SVG coordinates
    const scaleX = vbWidth / rect.width;
    const scaleY = vbHeight / rect.height;
    
    const svgX = (event.clientX - rect.left) * scaleX + vbX;
    const svgY = (event.clientY - rect.top) * scaleY + vbY;

    // Find which element was clicked
    const clickedElement = elementBounds.find(element => 
      svgX >= element.x && svgX <= element.x + element.width &&
      svgY >= element.y && svgY <= element.y + element.height
    );

    if (clickedElement) {
      const { transformOrigin, relativeX, relativeY } = calculateTransformOrigin(
        svgX, svgY, clickedElement
      );

      const newPivot: PivotPoint = {
        x: svgX,
        y: svgY,
        elementId: clickedElement.id,
        transformOrigin,
        relativeX,
        relativeY
      };

      // Remove existing pivot for this element and add new one
      const updatedPivots = pivotPoints.filter(p => p.elementId !== clickedElement.id);
      updatedPivots.push(newPivot);
      
      setPivotPoints(updatedPivots);
      onPivotPointsChange(updatedPivots);
      setIsPlacingPivot(false);
      
      console.log(`Placed pivot for ${clickedElement.id} at ${transformOrigin}`);
    }
  }, [isPlacingPivot, elementBounds, pivotPoints, calculateTransformOrigin, onPivotPointsChange]);

  // Auto-place pivots at element centers
  const autoPlacePivots = useCallback(() => {
    const autoPivots: PivotPoint[] = elementBounds.map(element => ({
      x: element.centerX,
      y: element.centerY,
      elementId: element.id,
      transformOrigin: '50% 50%',
      relativeX: 0.5,
      relativeY: 0.5
    }));
    
    setPivotPoints(autoPivots);
    onPivotPointsChange(autoPivots);
    console.log(`Auto-placed ${autoPivots.length} pivot points`);
  }, [elementBounds, onPivotPointsChange]);

  // Test animation with current pivot
  const testRotation = useCallback((elementId: string) => {
    setTestAnimation(elementId);
    
    // Remove animation after 2 seconds
    setTimeout(() => setTestAnimation(null), 2000);
  }, []);

  // Clear all pivot points
  const clearPivots = useCallback(() => {
    setPivotPoints([]);
    onPivotPointsChange([]);
  }, [onPivotPointsChange]);

  // Render SVG with pivot points and hover effects
  const renderSVGWithPivots = () => {
    if (!svgContent) return null;

    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      // Add hover highlighting style
      const style = svgDoc.createElement('style');
      style.textContent = `
        .pivot-editor-element {
          cursor: crosshair;
          transition: opacity 0.2s ease;
        }
        .pivot-editor-element:hover {
          opacity: 0.7;
          filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
        }
        .pivot-editor-highlight {
          stroke: #3b82f6 !important;
          stroke-width: 2px !important;
          stroke-dasharray: 4,2 !important;
        }
        .pivot-editor-test-animation {
          animation: pivotTest 2s ease-in-out;
          transform-box: fill-box;
        }
        @keyframes pivotTest {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.1); }
          50% { transform: rotate(180deg) scale(1); }
          75% { transform: rotate(270deg) scale(1.1); }
        }
      `;
      svgElement.insertBefore(style, svgElement.firstChild);

      // Add classes and event handlers to animatable elements
      const animatableElements = svgElement.querySelectorAll(
        'path[id], rect[id], circle[id], ellipse[id], polygon[id], line[id], g[id]'
      );

      Array.from(animatableElements).forEach(element => {
        const id = element.getAttribute('id');
        if (!id) return;

        element.setAttribute('class', 
          `pivot-editor-element ${hoveredElement === id ? 'pivot-editor-highlight' : ''} ${testAnimation === id ? 'pivot-editor-test-animation' : ''}`
        );

        // Set transform-origin for elements with pivot points
        const pivot = pivotPoints.find(p => p.elementId === id);
        if (pivot) {
          element.setAttribute('style', 
            `transform-origin: ${pivot.transformOrigin}; ${element.getAttribute('style') || ''}`
          );
        }
      });

      return (
        <div 
          ref={containerRef}
          className="relative w-full h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50"
          data-testid="pivot-editor-canvas"
        >
          <svg
            ref={svgRef}
            className="w-full h-full cursor-crosshair"
            dangerouslySetInnerHTML={{ __html: svgElement.outerHTML }}
            onClick={handleSvgClick}
            data-testid="pivot-editor-svg"
          />
          
          {/* Render pivot point crosshairs */}
          {pivotPoints.map((pivot, index) => (
            <PivotCrosshair
              key={`${pivot.elementId}-${index}`}
              pivot={pivot}
              svgRef={svgRef}
              onTest={() => testRotation(pivot.elementId)}
              onRemove={() => {
                const updated = pivotPoints.filter(p => p !== pivot);
                setPivotPoints(updated);
                onPivotPointsChange(updated);
              }}
            />
          ))}
        </div>
      );
    } catch (error) {
      console.error('Error rendering SVG with pivots:', error);
      return (
        <div className="w-full h-[400px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500">
          Error rendering SVG preview
        </div>
      );
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5" />
                Pivot Point Editor
              </h3>
              <p className="text-sm text-gray-600">
                Click on elements to set custom rotation/scale points
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {pivotPoints.length} pivot{pivotPoints.length !== 1 ? 's' : ''} placed
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsPlacingPivot(!isPlacingPivot)}
              variant={isPlacingPivot ? "default" : "outline"}
              size="sm"
              data-testid="toggle-pivot-placement"
            >
              <Crosshair className="w-4 h-4 mr-2" />
              {isPlacingPivot ? 'Cancel Placing' : 'Place Pivot'}
            </Button>
            
            <Button
              onClick={autoPlacePivots}
              variant="outline"
              size="sm"
              disabled={elementBounds.length === 0}
              data-testid="auto-place-pivots"
            >
              <Target className="w-4 h-4 mr-2" />
              Auto-Center All
            </Button>
            
            <Button
              onClick={clearPivots}
              variant="outline"
              size="sm"
              disabled={pivotPoints.length === 0}
              data-testid="clear-pivots"
            >
              Clear All
            </Button>
          </div>

          {/* SVG Canvas */}
          <div className="relative">
            {renderSVGWithPivots()}
          </div>

          {/* Pivot List */}
          {pivotPoints.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Active Pivot Points</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {pivotPoints.map((pivot, index) => (
                  <div 
                    key={`${pivot.elementId}-${index}`}
                    className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded"
                  >
                    <span className="font-mono">
                      {pivot.elementId}: {pivot.transformOrigin}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => testRotation(pivot.elementId)}
                        variant="outline"
                        size="sm"
                        className="h-6 px-2"
                        data-testid={`test-pivot-${pivot.elementId}`}
                      >
                        <RotateCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {isPlacingPivot && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Pivot Placement Mode Active</strong>
                  <p>Click anywhere on an element to set its rotation/scale center point.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Individual pivot point crosshair component
interface PivotCrosshairProps {
  pivot: PivotPoint;
  svgRef: React.RefObject<SVGSVGElement>;
  onTest: () => void;
  onRemove: () => void;
}

function PivotCrosshair({ pivot, svgRef, onTest, onRemove }: PivotCrosshairProps) {
  const [screenPosition, setScreenPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const viewBox = svg.getAttribute('viewBox');
      
      if (!viewBox) return;

      const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);
      
      // Convert SVG coordinates to screen coordinates
      const scaleX = rect.width / vbWidth;
      const scaleY = rect.height / vbHeight;
      
      const screenX = (pivot.x - vbX) * scaleX;
      const screenY = (pivot.y - vbY) * scaleY;
      
      setScreenPosition({ x: screenX, y: screenY });
    };

    updatePosition();
    
    // Update on window resize
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [pivot, svgRef]);

  if (!screenPosition) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: screenPosition.x,
        top: screenPosition.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Crosshair */}
      <div className="relative">
        <div className="absolute w-8 h-0.5 bg-red-500 -translate-x-1/2 -translate-y-px"></div>
        <div className="absolute w-0.5 h-8 bg-red-500 -translate-x-px -translate-y-1/2"></div>
        
        {/* Center dot */}
        <div className="absolute w-2 h-2 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Test button */}
        <button
          onClick={onTest}
          className="absolute top-4 left-4 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 pointer-events-auto"
          title={`Test rotation for ${pivot.elementId}`}
          data-testid={`pivot-test-${pivot.elementId}`}
        >
          <RotateCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Helper function to calculate path bounds
function calculatePathBounds(element: Element): { x: number; y: number; width: number; height: number } | null {
  try {
    // For groups, find bounds of all children
    if (element.tagName.toLowerCase() === 'g') {
      const children = Array.from(element.children);
      if (children.length === 0) return null;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      children.forEach(child => {
        const childBounds = calculatePathBounds(child);
        if (childBounds) {
          minX = Math.min(minX, childBounds.x);
          minY = Math.min(minY, childBounds.y);
          maxX = Math.max(maxX, childBounds.x + childBounds.width);
          maxY = Math.max(maxY, childBounds.y + childBounds.height);
        }
      });
      
      if (minX === Infinity) return null;
      
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    
    // For paths and polygons, extract coordinates
    if (element.tagName.toLowerCase() === 'path') {
      const d = element.getAttribute('d');
      if (!d) return null;
      
      // Simple path bounds calculation
      const coords = d.match(/[-+]?(\d*\.?\d+)/g);
      if (!coords || coords.length < 2) return null;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
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
      
      if (minX === Infinity) return null;
      
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    
    // For polygon
    if (element.tagName.toLowerCase() === 'polygon') {
      const points = element.getAttribute('points');
      if (!points) return null;
      
      const coords = points.split(/[\s,]+/).map(v => parseFloat(v));
      if (coords.length < 4) return null;
      
      let minX = coords[0], minY = coords[1], maxX = coords[0], maxY = coords[1];
      
      for (let i = 2; i < coords.length; i += 2) {
        if (i + 1 < coords.length) {
          const x = coords[i];
          const y = coords[i + 1];
          
          if (!isNaN(x) && !isNaN(y)) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Error calculating bounds for element:', error);
    return null;
  }
}