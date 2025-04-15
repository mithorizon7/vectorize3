import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  DownloadIcon, 
  ChevronLeft, 
  ChevronRight, 
  Columns, 
  Maximize, 
  MinusCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ColorCustomizer from "./ColorCustomizer";
import AdvancedColorCustomizer from "./AdvancedColorCustomizer";

interface SVGPreviewProps {
  svgContent: string | null;
  svgContents?: (string | null)[];
  batchMode?: boolean;
  activeFileIndex?: number;
  setActiveFileIndex?: Dispatch<SetStateAction<number>>;
  files?: File[];
  conversionStatus: {
    status: "idle" | "loading" | "success" | "error";
    message: string;
  };
  isTransparent: boolean;
  setIsTransparent: Dispatch<SetStateAction<boolean>>;
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
  multiColorMode?: boolean;
  setMultiColorMode?: Dispatch<SetStateAction<boolean>>;
  colorMap?: Record<string, string>;
  setColorMap?: Dispatch<SetStateAction<Record<string, string>>>;
  showSplitView?: boolean;
  setShowSplitView?: Dispatch<SetStateAction<boolean>>;
}

export default function SVGPreview({
  svgContent,
  svgContents = [],
  batchMode = false,
  activeFileIndex = 0,
  setActiveFileIndex = () => {},
  files = [],
  conversionStatus,
  isTransparent,
  setIsTransparent,
  color,
  setColor,
  multiColorMode = false,
  setMultiColorMode = () => {},
  colorMap = {},
  setColorMap = () => {},
  showSplitView = false,
  setShowSplitView = () => {}
}: SVGPreviewProps) {
  const [modifiedSvgContent, setModifiedSvgContent] = useState<string | null>(null);
  const [originalSvgContent, setOriginalSvgContent] = useState<string | null>(null);
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'preview' | 'comparison'>('preview');

  // Store original SVG content
  useEffect(() => {
    if (svgContent) {
      setOriginalSvgContent(svgContent);
      
      // Detect colors in SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      
      if (svgElement) {
        const detectedColors = new Set<string>();
        const colorAttributes = ['fill', 'stroke'];
        const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'g'];
        
        shapeTags.forEach(tag => {
          const elements = svgDoc.querySelectorAll(tag);
          elements.forEach(el => {
            colorAttributes.forEach(attr => {
              const colorValue = el.getAttribute(attr);
              if (colorValue && colorValue !== 'none' && colorValue !== 'transparent') {
                detectedColors.add(colorValue);
              }
            });
          });
        });
        
        setDetectedColors(Array.from(detectedColors));
        
        // Initialize color map if empty
        if (Object.keys(colorMap).length === 0 && detectedColors.size > 0) {
          const newColorMap: Record<string, string> = {};
          detectedColors.forEach(c => {
            newColorMap[c] = c;
          });
          setColorMap(newColorMap);
        }
      }
    } else {
      setOriginalSvgContent(null);
      setDetectedColors([]);
    }
  }, [svgContent]);

  // Apply color and transparency to SVG based on mode
  useEffect(() => {
    if (originalSvgContent) {
      // Parse SVG content to modify it
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(originalSvgContent, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');

      if (svgElement) {
        if (multiColorMode) {
          // Apply multi-color mapping
          const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'g'];
          shapeTags.forEach(tag => {
            const elements = svgElement.querySelectorAll(tag);
            elements.forEach(el => {
              // Check fill attribute
              const originalFill = el.getAttribute('fill');
              if (originalFill && originalFill !== 'none' && colorMap[originalFill]) {
                el.setAttribute('fill', colorMap[originalFill]);
              }
              
              // Check stroke attribute
              const originalStroke = el.getAttribute('stroke');
              if (originalStroke && originalStroke !== 'none' && colorMap[originalStroke]) {
                el.setAttribute('stroke', colorMap[originalStroke]);
              }
            });
          });
        } else {
          // Apply single color to all shapes
          const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'];
          shapeTags.forEach(tag => {
            const elements = svgElement.querySelectorAll(tag);
            elements.forEach(el => {
              if (!el.getAttribute('fill') || el.getAttribute('fill') !== 'none') {
                el.setAttribute('fill', color);
              }
              
              // Also set stroke to match if it exists and isn't 'none'
              const stroke = el.getAttribute('stroke');
              if (stroke && stroke !== 'none') {
                el.setAttribute('stroke', color);
              }
            });
          });
        }

        // Set background transparency if needed
        const backgrounds = svgElement.querySelectorAll('rect[width="100%"][height="100%"], rect[x="0"][y="0"]');
        backgrounds.forEach(bg => {
          if (isTransparent) {
            bg.setAttribute('fill', 'none');
          } else {
            bg.setAttribute('fill', '#FFFFFF');
          }
        });

        // Convert back to string
        const serializer = new XMLSerializer();
        setModifiedSvgContent(serializer.serializeToString(svgDoc));
      }
    } else {
      setModifiedSvgContent(null);
    }
  }, [originalSvgContent, color, isTransparent, multiColorMode, colorMap]);

  // Get active SVG content in batch mode
  useEffect(() => {
    if (batchMode && svgContents.length > 0 && activeFileIndex < svgContents.length) {
      const activeSvg = svgContents[activeFileIndex];
      if (activeSvg) {
        setOriginalSvgContent(activeSvg);
      }
    }
  }, [batchMode, svgContents, activeFileIndex]);

  const handleDownload = () => {
    if (modifiedSvgContent) {
      // Create a blob from the SVG content
      const blob = new Blob([modifiedSvgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      const filename = batchMode && files[activeFileIndex] 
        ? `${files[activeFileIndex].name.split('.')[0]}.svg`
        : 'converted-image.svg';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    }
  };

  const handleBatchDownloadAll = () => {
    if (!batchMode || svgContents.length === 0) return;
    
    // Use setTimeout to process files one by one to avoid browser freezing
    const downloadFile = (index: number) => {
      if (index >= svgContents.length) return;
      
      const svgContent = svgContents[index];
      if (!svgContent) {
        // Skip to next file if this one has no content
        setTimeout(() => downloadFile(index + 1), 100);
        return;
      }
      
      // Process this SVG with the current settings
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      
      if (svgElement) {
        if (multiColorMode) {
          // Apply multi-color mapping
          const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'g'];
          shapeTags.forEach(tag => {
            const elements = svgElement.querySelectorAll(tag);
            elements.forEach(el => {
              // Check fill attribute
              const originalFill = el.getAttribute('fill');
              if (originalFill && originalFill !== 'none' && colorMap[originalFill]) {
                el.setAttribute('fill', colorMap[originalFill]);
              }
              
              // Check stroke attribute
              const originalStroke = el.getAttribute('stroke');
              if (originalStroke && originalStroke !== 'none' && colorMap[originalStroke]) {
                el.setAttribute('stroke', colorMap[originalStroke]);
              }
            });
          });
        } else {
          // Apply single color
          const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'];
          shapeTags.forEach(tag => {
            const elements = svgElement.querySelectorAll(tag);
            elements.forEach(el => {
              if (!el.getAttribute('fill') || el.getAttribute('fill') !== 'none') {
                el.setAttribute('fill', color);
              }
              
              // Also set stroke color
              const stroke = el.getAttribute('stroke');
              if (stroke && stroke !== 'none') {
                el.setAttribute('stroke', color);
              }
            });
          });
        }
        
        // Set background transparency
        const backgrounds = svgElement.querySelectorAll('rect[width="100%"][height="100%"], rect[x="0"][y="0"]');
        backgrounds.forEach(bg => {
          if (isTransparent) {
            bg.setAttribute('fill', 'none');
          } else {
            bg.setAttribute('fill', '#FFFFFF');
          }
        });
        
        // Convert to string and download
        const serializer = new XMLSerializer();
        const processedSvg = serializer.serializeToString(svgDoc);
        
        const blob = new Blob([processedSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        const filename = files[index] 
          ? `${files[index].name.split('.')[0]}.svg`
          : `converted-image-${index + 1}.svg`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
          // Process next file
          downloadFile(index + 1);
        }, 200);
      }
    };
    
    // Start downloading the first file
    downloadFile(0);
  };

  const handlePrevious = () => {
    if (activeFileIndex > 0) {
      setActiveFileIndex(activeFileIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeFileIndex < svgContents.length - 1) {
      setActiveFileIndex(activeFileIndex + 1);
    }
  };

  const toggleSplitView = () => {
    setShowSplitView(!showSplitView);
  };

  return (
    <Card>
      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium">Preview</h2>
          {batchMode && (
            <span className="text-sm text-gray-500">
              {activeFileIndex + 1} of {svgContents.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-2"
              onClick={toggleSplitView}
              title={showSplitView ? "Hide original" : "Show side-by-side comparison"}
            >
              {showSplitView ? <MinusCircle className="h-4 w-4" /> : <Columns className="h-4 w-4" />}
            </Button>
          </div>
          <div 
            className={`text-sm ${
              conversionStatus.status === 'loading' ? 'text-amber-500' : 
              conversionStatus.status === 'success' ? 'text-emerald-500' : 
              conversionStatus.status === 'error' ? 'text-red-500' : 
              'text-gray-500'
            }`}
          >
            {conversionStatus.message}
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className={`${showSplitView ? 'grid grid-cols-2 gap-4' : ''}`}>
          {/* Original SVG preview in split view mode */}
          {showSplitView && originalSvgContent && (
            <div>
              <div className="text-sm text-gray-500 mb-2 text-center">Original</div>
              <div 
                className="border border-gray-200 rounded-lg h-64 flex items-center justify-center overflow-hidden bg-[#F3F4F6]"
              >
                <div 
                  className="w-full h-full flex items-center justify-center" 
                  dangerouslySetInnerHTML={{ __html: originalSvgContent }} 
                />
              </div>
            </div>
          )}
          
          {/* Modified SVG preview */}
          <div>
            {showSplitView && modifiedSvgContent && (
              <div className="text-sm text-gray-500 mb-2 text-center">Modified</div>
            )}
            <div 
              className={`border border-gray-200 rounded-lg h-64 flex items-center justify-center relative overflow-hidden ${isTransparent ? 'bg-transparent' : 'bg-[#F3F4F6]'}`}
              style={{ 
                backgroundImage: isTransparent ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)' : 'none',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            >
              {!modifiedSvgContent && (
                <div className="text-gray-400 text-center px-4">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Preview will appear here after conversion</p>
                </div>
              )}
              
              {modifiedSvgContent && (
                <div 
                  className="w-full h-full flex items-center justify-center" 
                  dangerouslySetInnerHTML={{ __html: modifiedSvgContent }} 
                />
              )}
              
              {/* Batch navigation buttons */}
              {batchMode && svgContents.length > 1 && modifiedSvgContent && (
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevious}
                    disabled={activeFileIndex === 0}
                    className="bg-white/80 backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNext}
                    disabled={activeFileIndex === svgContents.length - 1}
                    className="bg-white/80 backdrop-blur-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <Tabs defaultValue="basic" className="border-t border-gray-200">
        <TabsList className="justify-start rounded-none px-6 pt-2 border-b">
          <TabsTrigger value="basic">Basic Colors</TabsTrigger>
          <TabsTrigger value="advanced" onClick={() => setMultiColorMode(true)}>Advanced Colors</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="pt-2">
          <ColorCustomizer 
            color={color} 
            setColor={setColor} 
            onModeChange={(isMulti) => setMultiColorMode(isMulti)} 
          />
        </TabsContent>
        <TabsContent value="advanced" className="pt-2">
          <AdvancedColorCustomizer 
            colorMap={colorMap}
            setColorMap={setColorMap}
            detectedColors={detectedColors}
          />
        </TabsContent>
      </Tabs>
      
      <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="transparent-bg" 
            checked={isTransparent}
            onCheckedChange={(checked) => setIsTransparent(checked === true)}
          />
          <Label htmlFor="transparent-bg">Transparent background</Label>
        </div>
        <div className="flex space-x-2">
          {batchMode && svgContents.length > 1 && (
            <Button 
              onClick={handleBatchDownloadAll} 
              variant="outline"
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download All
            </Button>
          )}
          <Button 
            onClick={handleDownload} 
            disabled={!modifiedSvgContent}
            variant="default"
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download SVG
          </Button>
        </div>
      </div>
    </Card>
  );
}
