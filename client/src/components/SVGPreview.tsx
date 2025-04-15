import React, { useState, useEffect, Dispatch, SetStateAction, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Download, Copy, ClipboardCheck, Layers, Image, Palette, CheckCircle, SplitSquareVertical, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ColorCustomizer from "./ColorCustomizer";
import LoadingAnimation from "./LoadingAnimation";
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
  const [copied, setCopied] = useState(false);
  const [activeSvg, setActiveSvg] = useState<string | null>(null);
  const [originalSvg, setOriginalSvg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("preview");
  const [codeView, setCodeView] = useState(false);
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [previewScale, setPreviewScale] = useState(1);
  const [preserveOriginalColors, setPreserveOriginalColors] = useState(false);
  const { toast } = useToast();

  // Determine which SVG content to display
  useEffect(() => {
    let svg;
    if (batchMode) {
      svg = svgContents[activeFileIndex] || null;
    } else {
      svg = svgContent;
    }
    
    // Store the original SVG for later use (to preserve original colors)
    if (svg && !originalSvg) {
      setOriginalSvg(svg);
      
      // If "preserve original colors" is enabled, use the original SVG
      if (preserveOriginalColors) {
        setActiveSvg(svg);
      } else {
        setActiveSvg(svg);
      }
    } else {
      // Only update the active SVG if "preserve original colors" is not enabled
      // or if we're intentionally resetting to the original colors
      setActiveSvg(svg);
    }
    
    // Log detailed information about SVG content
    if (svgContent) {
      console.log("SVG content loaded, length:", svgContent.length);
      console.log("SVG preview:", svgContent.substring(0, 100) + "...");
    } else if (batchMode && svgContents[activeFileIndex]) {
      console.log("Batch SVG content loaded, length:", svgContents[activeFileIndex]?.length);
    } else {
      console.log("No SVG content available");
    }
  }, [svgContent, svgContents, activeFileIndex, batchMode]);

  // Extract colors from SVG for multi-color mode
  useEffect(() => {
    if (activeSvg && multiColorMode) {
      // Extract fill colors from SVG
      const colorRegex = /#[0-9A-Fa-f]{3,6}/g;
      const matches = activeSvg.match(colorRegex) || [];
      
      // Filter unique colors and limit to 20 for performance
      const uniqueColors = Array.from(new Set(matches)).slice(0, 20);
      setDetectedColors(uniqueColors);
      
      // Initialize color map if needed
      if (uniqueColors.length > 0 && Object.keys(colorMap).length === 0) {
        const initialColorMap: Record<string, string> = {};
        uniqueColors.forEach(color => {
          initialColorMap[color] = color;
        });
        setColorMap(initialColorMap);
      }
    }
  }, [activeSvg, multiColorMode]);

  const handleDownload = () => {
    if (!activeSvg) return;
    
    const blob = new Blob([activeSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = batchMode && files[activeFileIndex] 
      ? `${files[activeFileIndex].name.split('.')[0]}.svg` 
      : 'converted-image.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: `SVG file ${a.download} is being downloaded`,
    });
  };

  const handleCopy = () => {
    if (!activeSvg) return;
    
    navigator.clipboard.writeText(activeSvg)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "SVG copied to clipboard",
          description: "You can now paste it in another application",
        });
      })
      .catch(err => {
        toast({
          title: "Copy failed",
          description: "Could not copy SVG to clipboard",
          variant: "destructive",
        });
        console.error('Failed to copy:', err);
      });
  };

  const toggleMultiColorMode = () => {
    setMultiColorMode(!multiColorMode);
    
    if (multiColorMode) {
      // Reset color map when disabling multi-color mode
      setColorMap({});
    }
  };

  const toggleTransparency = () => {
    setIsTransparent(!isTransparent);
  };

  const toggleSplitView = () => {
    setShowSplitView(!showSplitView);
  };
  
  const togglePreserveOriginalColors = () => {
    const newValue = !preserveOriginalColors;
    setPreserveOriginalColors(newValue);
    
    if (newValue && originalSvg) {
      // Restore the original SVG with all its colors
      setActiveSvg(originalSvg);
    } else if (!newValue && originalSvg) {
      // Apply current color settings
      if (multiColorMode) {
        // If in multi-color mode, reapply the color mapping
        let coloredSvg = originalSvg;
        Object.keys(colorMap).forEach(originalColor => {
          const newColor = colorMap[originalColor];
          const regex = new RegExp(originalColor, 'g');
          coloredSvg = coloredSvg.replace(regex, newColor);
        });
        setActiveSvg(coloredSvg);
      } else {
        // In single color mode, apply the selected color to all fill attributes
        const parser = new DOMParser();
        const doc = parser.parseFromString(originalSvg, 'image/svg+xml');
        const elements = doc.querySelectorAll('[fill]');
        elements.forEach(el => {
          el.setAttribute('fill', color);
        });
        setActiveSvg(new XMLSerializer().serializeToString(doc));
      }
    }
  };

  const resetZoom = () => {
    setPreviewScale(1);
  };

  const zoomIn = () => {
    setPreviewScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setPreviewScale(prev => Math.max(prev - 0.25, 0.5));
  };

  // File navigation for batch mode
  const goToPrevious = () => {
    if (activeFileIndex > 0) {
      setActiveFileIndex(activeFileIndex - 1);
    }
  };

  const goToNext = () => {
    if (activeFileIndex < svgContents.length - 1) {
      setActiveFileIndex(activeFileIndex + 1);
    }
  };

  return (
    <Card className="relative h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">SVG Preview</h2>
            {conversionStatus.status === "success" && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 flex gap-1 items-center">
                <CheckCircle className="h-3 w-3" />
                Ready
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!batchMode && (
              <div className="flex items-center mr-2">
                <Switch
                  id="split-view"
                  checked={showSplitView}
                  onCheckedChange={toggleSplitView}
                  className="mr-2"
                />
                <Label htmlFor="split-view" className="text-xs cursor-pointer flex items-center">
                  <SplitSquareVertical className="h-3 w-3 mr-1" />
                  Split View
                </Label>
              </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:flex">
              <TabsList className="h-8">
                <TabsTrigger value="preview" className="text-xs px-2 h-7">
                  <Image className="h-3 w-3 mr-1" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs px-2 h-7" onClick={() => setCodeView(true)}>
                  <Layers className="h-3 w-3 mr-1" />
                  SVG Code
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Batch mode navigation */}
        {batchMode && svgContents.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPrevious}
              disabled={activeFileIndex === 0}
            >
              Previous
            </Button>
            <span className="text-sm">
              {activeFileIndex + 1} of {svgContents.length}
              {files[activeFileIndex] && ` (${files[activeFileIndex].name})`}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNext}
              disabled={activeFileIndex === svgContents.length - 1}
            >
              Next
            </Button>
          </div>
        )}
        
        {/* Main content area */}
        <div className={`flex-1 overflow-hidden mb-4 ${showSplitView ? 'flex gap-4' : ''}`}>
          {showSplitView && (
            <Card className="flex-1 rounded-lg overflow-hidden border">
              {files?.[0] && (
                <div className="h-full flex items-center justify-center bg-gray-100 relative p-4">
                  <img 
                    src={URL.createObjectURL(files[0])} 
                    alt="Original" 
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="text-xs">Original</Badge>
                  </div>
                </div>
              )}
            </Card>
          )}
          
          <Card className={`${showSplitView ? 'flex-1' : 'h-full'} rounded-lg overflow-hidden border relative`}>
            <Tabs value={activeTab} className="h-full flex flex-col">
              <TabsContent value="preview" className="m-0 p-0 h-full flex-1 data-[state=active]:flex flex-col">
                <div className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden">
                  {conversionStatus.status === "loading" ? (
                    <LoadingAnimation conversionStatus={conversionStatus} />
                  ) : conversionStatus.status === "error" ? (
                    <div className="text-center p-4">
                      <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                      <p className="text-lg font-medium text-gray-800 mb-1">Conversion Error</p>
                      <p className="text-sm text-gray-600">{conversionStatus.message}</p>
                    </div>
                  ) : activeSvg ? (
                    <>
                      <div 
                        className="svg-container w-full h-full flex items-center justify-center p-4 cursor-move transition-transform duration-200 overflow-hidden"
                        style={{ 
                          background: isTransparent ? 'transparent' : '#ffffff'
                        }}
                      >
                        <div
                          className="transform-gpu transition-transform duration-200 flex items-center justify-center"
                          style={{ 
                            transform: `scale(${previewScale})`,
                            width: '100%',
                            height: '100%'
                          }}
                        >
                          <div 
                            className="max-w-full max-h-full svg-content"
                            style={{ height: 'auto', width: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                            dangerouslySetInnerHTML={{ __html: activeSvg }}
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 flex space-x-1">
                        <Badge variant="secondary" className="text-xs">SVG</Badge>
                        {isTransparent && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            Transparent
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-md border shadow-sm p-1 flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} title="Zoom out">
                          <span className="sr-only">Zoom out</span>
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7.5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={resetZoom}>
                          {Math.round(previewScale * 100)}%
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} title="Zoom in">
                          <span className="sr-only">Zoom in</span>
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 4V11M4 7.5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Layers className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No SVG to display</p>
                      <p className="text-xs text-gray-400 mt-1">Upload an image to see the preview</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="code" className="m-0 p-0 h-full data-[state=active]:block">
                {activeSvg ? (
                  <div className="h-full overflow-auto bg-gray-50 border rounded-lg p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800 h-full overflow-auto">
                      {activeSvg}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <p className="text-gray-400">No SVG code available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* Color and transparency controls */}
        {activeSvg && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center">
                  <Switch
                    id="transparent-bg"
                    checked={isTransparent}
                    onCheckedChange={toggleTransparency}
                    className="mr-2"
                  />
                  <Label htmlFor="transparent-bg" className="cursor-pointer">Transparent Background</Label>
                </div>
                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                
                <div className="flex items-center">
                  <Switch
                    id="preserve-colors"
                    checked={preserveOriginalColors}
                    onCheckedChange={togglePreserveOriginalColors}
                    className="mr-2"
                  />
                  <Label htmlFor="preserve-colors" className="cursor-pointer flex items-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mr-1">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8" />
                      <path d="M8 12h8" />
                    </svg>
                    Preserve Original Colors
                  </Label>
                </div>

                <Separator orientation="vertical" className="h-6 hidden sm:block" />
                
                <div className="flex items-center">
                  <Switch
                    id="multi-color"
                    checked={multiColorMode}
                    onCheckedChange={toggleMultiColorMode}
                    className="mr-2"
                    disabled={preserveOriginalColors}
                  />
                  <Label 
                    htmlFor="multi-color" 
                    className={`cursor-pointer flex items-center ${preserveOriginalColors ? 'opacity-50' : ''}`}
                  >
                    <Palette className="h-4 w-4 mr-1" />
                    Multi-Color Mode
                  </Label>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopy}
                  disabled={!activeSvg}
                  className="flex items-center"
                >
                  {copied ? (
                    <>
                      <ClipboardCheck className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy SVG
                    </>
                  )}
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleDownload}
                  disabled={!activeSvg}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            {/* Render different color customizer based on mode */}
            {multiColorMode ? (
              <AdvancedColorCustomizer 
                colorMap={colorMap}
                setColorMap={setColorMap}
                detectedColors={detectedColors}
                svgContent={activeSvg}
                setSvgContent={setActiveSvg}
              />
            ) : (
              <ColorCustomizer 
                color={color} 
                setColor={setColor}
                onModeChange={setMultiColorMode}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}