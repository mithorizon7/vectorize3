import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Code, 
  Layers, 
  Target, 
  Palette, 
  Download,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
  Zap
} from "lucide-react";
import UploadArea, { convertImageWithOptions } from "@/components/UploadArea";
import SVGPreview from "@/components/SVGPreview";
import ConversionSettings from "@/components/ConversionSettings";
import { PivotPointEditor } from "@/components/PivotPointEditor";
import { SVGOptions, initialSVGOptions } from "@/lib/svg-converter";

export default function AnimationWorkspace() {
  // Core file and conversion state
  const [file, setFile] = useState<File | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [conversionStatus, setConversionStatus] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({
    status: "idle",
    message: "Upload an image to begin creating animation-ready SVGs",
  });
  const [options, setOptions] = useState<SVGOptions>({
    ...initialSVGOptions,
    // Animation-optimized defaults
    shapeStacking: "layered",
    groupBy: "color",
    preserveColors: true,
    traceEngine: "imagetracer",
    allowedCurveTypes: ["lines", "quadraticBezier", "cubicBezier"],
    // Enable animation mode by default in this workspace
    animationMode: true,
    idPrefix: 'anim_',
    flattenTransforms: false,
    generateStableIds: true,
  });

  // Animation-specific state
  const [animationData, setAnimationData] = useState<{
    groups: Array<{
      id: string;
      name: string;
      visible: boolean;
      locked: boolean;
      pivot: { x: number; y: number } | null;
    }>;
    selectedGroupId: string | null;
    previewMode: "static" | "pivot" | "animation";
  }>({
    groups: [],
    selectedGroupId: null,
    previewMode: "static",
  });

  // Active workspace panels
  const [activePanels, setActivePanels] = useState({
    layers: true,
    pivot: false,
    colors: false,
    export: false,
  });

  // Pivot point state
  const [pivotPoints, setPivotPoints] = useState<Array<{
    x: number;
    y: number;
    elementId: string;
    transformOrigin: string;
    relativeX: number;
    relativeY: number;
  }>>([]);

  // Handler for settings changes with animation awareness
  const handleSettingsChange = useCallback(async () => {
    if (file) {
      setConversionStatus({
        status: "loading",
        message: "Converting to animation-ready SVG...",
      });
      
      const newSvgContent = await convertImageWithOptions(
        file,
        options,
        setConversionStatus,
        false
      );
      
      if (newSvgContent) {
        setSvgContent(newSvgContent);
        // TODO: Extract groups and animation data from SVG
        // This will be implemented in the grouping tasks
      }
    }
  }, [file, options]);

  return (
    <div className="bg-gray-50 font-sans text-gray-800 min-h-screen">
      {/* Animation Mode Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="text-primary h-8 w-8 mr-3">
                <Play className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Animation Studio
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Professional SVG animation preparation
                </p>
              </div>
              <Badge variant="secondary" className="ml-3 text-xs">
                Pro Mode
              </Badge>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAnimationData(prev => ({ 
                  ...prev, 
                  previewMode: prev.previewMode === "animation" ? "static" : "animation" 
                }))}
                className="text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                {animationData.previewMode === "animation" ? "Stop" : "Preview"}
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                Code
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          
          {/* Left Sidebar - Layers & Tools */}
          <div className="col-span-3 space-y-4">
            
            {/* Upload Area */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Source Image
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <UploadArea
                  setFile={setFile}
                  setFiles={() => {}}
                  setBatchMode={() => {}}
                  batchMode={false}
                  setConversionStatus={setConversionStatus}
                  setSvgContent={setSvgContent}
                  setSvgContents={() => {}}
                  setActiveFileIndex={() => {}}
                  options={options}
                />
              </CardContent>
            </Card>

            {/* Layer Tree Panel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Layers
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Settings className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {animationData.groups.length > 0 ? (
                  <div className="space-y-1">
                    {animationData.groups.map((group) => (
                      <div
                        key={group.id}
                        className={`flex items-center justify-between p-2 rounded text-xs border transition-colors ${
                          animationData.selectedGroupId === group.id 
                            ? "bg-blue-50 border-blue-200" 
                            : "hover:bg-gray-50 border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-blue-500 rounded-sm"></div>
                          <span className="truncate font-medium">{group.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 p-0"
                            onClick={() => {
                              // TODO: Toggle visibility
                            }}
                          >
                            {group.visible ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3 opacity-50" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 w-5 p-0"
                            onClick={() => {
                              // TODO: Toggle lock
                            }}
                          >
                            {group.locked ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <Unlock className="h-3 w-3 opacity-50" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Upload an image to see layers</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tools Panel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <Button 
                  variant={activePanels.pivot ? "default" : "outline"} 
                  size="sm" 
                  className="w-full justify-start text-xs"
                  onClick={() => setActivePanels(prev => ({ ...prev, pivot: !prev.pivot }))}
                  data-testid="toggle-pivot-mode"
                >
                  <Target className="h-3 w-3 mr-2" />
                  {activePanels.pivot ? "Exit Pivot Mode" : "Set Pivot Points"}
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <Palette className="h-3 w-3 mr-2" />
                  Extract Colors
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Auto-Group
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Canvas - SVG Preview */}
          <div className="col-span-6">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">Canvas</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={activePanels.pivot ? "destructive" : animationData.previewMode === "static" ? "default" : "secondary"} className="text-xs">
                      {activePanels.pivot ? "Pivot Mode" : animationData.previewMode === "static" ? "Static" : "Preview"}
                    </Badge>
                    {conversionStatus.status === "loading" && (
                      <div className="flex items-center text-xs text-gray-500">
                        <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-500 rounded-full mr-2"></div>
                        Converting...
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 h-[calc(100%-80px)]">
                {svgContent ? (
                  activePanels.pivot ? (
                    // Pivot Point Editor Mode
                    <PivotPointEditor
                      svgContent={svgContent}
                      onPivotPointsChange={setPivotPoints}
                      className="h-full"
                    />
                  ) : (
                    // Standard SVG Preview Mode
                    <div className="w-full h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <div className="max-w-full max-h-full">
                        <SVGPreview
                          svgContent={svgContent}
                          conversionStatus={conversionStatus}
                          isTransparent={false}
                          setIsTransparent={() => {}}
                          color="#3B82F6"
                          setColor={() => {}}
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Play className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No SVG loaded</p>
                      <p className="text-xs mt-1">Upload an image to begin</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Settings & Export */}
          <div className="col-span-3 space-y-4">
            
            {/* Animation Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Animation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="structure" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 text-xs">
                    <TabsTrigger value="structure">Structure</TabsTrigger>
                    <TabsTrigger value="export">Export</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="structure" className="space-y-3 mt-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        ID Prefix
                      </label>
                      <input 
                        type="text"
                        placeholder="anim_"
                        className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-700">
                        Flatten Transforms
                      </label>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-700">
                        Preserve Hierarchy
                      </label>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="export" className="space-y-3 mt-3">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Code className="h-3 w-3 mr-2" />
                      GSAP Code
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Code className="h-3 w-3 mr-2" />
                      CSS Keyframes
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Code className="h-3 w-3 mr-2" />
                      React Component
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Core Settings (Simplified) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Core Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ConversionSettings
                  options={options}
                  setOptions={setOptions}
                  onSettingsChange={handleSettingsChange}
                  // Simplified mode for animation workspace
                  animationMode={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}