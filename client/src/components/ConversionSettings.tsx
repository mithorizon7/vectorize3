import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SVGOptions } from "@/lib/svg-converter";
import { presets, Preset, applyPreset } from "@/lib/conversion-presets";
import { SettingInfoTooltip } from "@/components/SettingInfoTooltip";
import { settingsHelpText, SettingId } from "@/lib/settings-help-text";
import { 
  Sparkles, 
  Image, 
  Layers, 
  Settings2, 
  ChevronDown,
  ChevronUp,
  Palette,
  PencilRuler
} from "lucide-react";

interface ConversionSettingsProps {
  options: SVGOptions;
  setOptions: Dispatch<SetStateAction<SVGOptions>>;
  // Properties for real-time conversion
  currentFile?: File | null;
  files?: File[];
  batchMode?: boolean;
  onSettingsChange?: () => void;
}

export default function ConversionSettings({
  options,
  setOptions,
  currentFile,
  files,
  batchMode,
  onSettingsChange,
}: ConversionSettingsProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Improved debouncing system for real-time preview updates
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const triggerSettingsChange = (immediate = false) => {
    if (onSettingsChange) {
      // Check if we have files to process
      if ((batchMode && files && files.length > 0) || (!batchMode && currentFile)) {
        
        // Clear existing timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        if (immediate) {
          // For critical settings like preserve colors, trigger immediately
          onSettingsChange();
        } else {
          // For other settings, use debounced approach with shorter delay for better UX
          const newTimer = setTimeout(() => onSettingsChange(), 300);
          setDebounceTimer(newTimer);
        }
      }
    }
  };

  const updateOption = <K extends keyof SVGOptions>(
    key: K,
    value: SVGOptions[K]
  ) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
    setActivePreset(null); // Clear active preset when manually changing options
    
    // Trigger conversion with new settings if a file is available
    triggerSettingsChange();
  };

  // For updating array values in options
  const toggleArrayOption = (key: keyof SVGOptions, value: string) => {
    setOptions((prev) => {
      const currentArray = prev[key] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [key]: newArray,
      };
    });
    setActivePreset(null); // Clear active preset when manually changing options
    
    // Trigger conversion with new settings if a file is available
    triggerSettingsChange();
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleApplyPreset = (preset: Preset) => {
    setOptions(applyPreset(preset));
    setActivePreset(preset.id);
    
    // Trigger immediate conversion for preset changes
    triggerSettingsChange(true);
  };
  
  // Helper to generate setting headers with tooltips
  const SettingHeader = ({ settingId }: { settingId: SettingId }) => (
    <div className="flex items-center mb-3">
      <h3 className="text-sm font-medium">{settingsHelpText[settingId].title}</h3>
      <SettingInfoTooltip 
        content={
          <div>
            <p>{settingsHelpText[settingId].description}</p>
            {settingsHelpText[settingId].tips && (
              <div className="mt-2">{settingsHelpText[settingId].tips}</div>
            )}
          </div>
        } 
      />
    </div>
  );

  return (
    <Card className="divide-y divide-gray-200">
      <CardContent className="px-6 py-4">
        <h2 className="text-lg font-medium">Conversion Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize how your image is transformed into SVG
        </p>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
          ✨ Changes will trigger immediate re-conversion and update the preview when an image is loaded
        </div>
        
        {/* Preserve Original Colors - Primary Setting */}
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Palette className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Preserve Original Colors</h4>
                  <p className="text-xs text-gray-600 mt-1">Keep the original image colors instead of converting to black silhouettes</p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="preserve-colors-main"
                checked={options.preserveColors}
                onChange={(e) => {
                  const preserveColors = e.target.checked;
                  // When preserving colors, force ImageTracer and set optimal color settings
                  updateOption('preserveColors', preserveColors);
                  if (preserveColors) {
                    updateOption('traceEngine', 'imagetracer');
                    updateOption('numberOfColors', Math.max(options.numberOfColors, 16));
                    updateOption('colorQuantization', 'floyd-steinberg');
                    updateOption('minColorRatio', 0.01);
                  }
                  // Trigger immediate conversion for this critical setting
                  setTimeout(() => triggerSettingsChange(true), 100);
                }}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
              />
              <SettingInfoTooltip 
                content={
                  <div>
                    <p>When enabled, uses advanced color tracing to preserve the original image colors.</p>
                    <ul className="mt-2 text-xs space-y-1">
                      <li>• Automatically switches to ImageTracer engine</li>
                      <li>• Optimizes color count and quantization</li>
                      <li>• Perfect for photos and colorful graphics</li>
                    </ul>
                  </div>
                } 
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Presets Section */}
      <div className="px-6 py-4">
        <h3 className="text-sm font-medium mb-3">Optimize For</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant={activePreset === preset.id ? "default" : "outline"}
              className={`justify-start text-left h-auto py-3 px-4 overflow-hidden ${
                activePreset === preset.id ? "border-primary bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => handleApplyPreset(preset)}
            >
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">
                  {preset.id === "logo" && <Image className="h-4 w-4" />}
                  {preset.id === "icon" && <Palette className="h-4 w-4" />}
                  {preset.id === "illustration" && <PencilRuler className="h-4 w-4" />}
                  {preset.id === "diagram" && <Layers className="h-4 w-4" />}
                  {preset.id === "webAnimation" && <Sparkles className="h-4 w-4" />}
                  {preset.id === "manufacturing" && <Settings2 className="h-4 w-4" />}
                  {preset.id === "print" && <Image className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{preset.name}</div>
                  <div className="text-xs opacity-70 mt-0.5 line-clamp-2 max-w-full break-words">{preset.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Toggle for Advanced Settings */}
      <div className="px-6 py-3">
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
        >
          <span className="font-medium text-sm">Advanced Settings</span>
          {showAdvancedSettings ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Advanced Settings Section */}
      {showAdvancedSettings && (
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="paths">Paths</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            {/* File Format Options */}
            <div className="px-6 py-4">
              <SettingHeader settingId="fileFormat" />
              <RadioGroup
                value={options.fileFormat}
                onValueChange={(value) => updateOption("fileFormat", value)}
                className="grid grid-cols-2 gap-4 sm:grid-cols-5"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="svg" id="format-svg" />
                  <Label htmlFor="format-svg">SVG</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="eps" id="format-eps" />
                  <Label htmlFor="format-eps">EPS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="format-pdf" />
                  <Label htmlFor="format-pdf">PDF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dxf" id="format-dxf" />
                  <Label htmlFor="format-dxf">DXF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="png" id="format-png" />
                  <Label htmlFor="format-png">PNG</Label>
                </div>
              </RadioGroup>
            </div>

            {/* SVG Version Options */}
            <div className="px-6 py-4">
              <SettingHeader settingId="svgVersion" />
              <RadioGroup
                value={options.svgVersion}
                onValueChange={(value) => updateOption("svgVersion", value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1.0" id="svg-1.0" />
                  <Label htmlFor="svg-1.0">SVG 1.0</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1.1" id="svg-1.1" />
                  <Label htmlFor="svg-1.1">SVG 1.1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tiny1.2" id="svg-tiny-1.2" />
                  <Label htmlFor="svg-tiny-1.2">SVG Tiny 1.2</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            {/* Draw Style Options */}
            <div className="px-6 py-4">
              <SettingHeader settingId="drawStyle" />
              <RadioGroup
                value={options.drawStyle}
                onValueChange={(value) => updateOption("drawStyle", value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fillShapes" id="fill-shapes" />
                  <Label htmlFor="fill-shapes">Fill shapes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="strokeOutlines" id="stroke-outlines" />
                  <Label htmlFor="stroke-outlines">Stroke shape outlines</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="strokeEdges" id="stroke-edges" />
                  <Label htmlFor="stroke-edges">
                    Stroke the edges between shapes
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Shape Stacking Options */}
            <div className="px-6 py-4">
              <SettingHeader settingId="shapeStacking" />
              <RadioGroup
                value={options.shapeStacking}
                onValueChange={(value) => updateOption("shapeStacking", value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="placeCutouts" id="place-cutouts" />
                  <Label htmlFor="place-cutouts">
                    Place shapes in cut-outs in shapes below
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stackTop" id="stack-top" />
                  <Label htmlFor="stack-top">Stack shapes on top of each other</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Group By Options */}
            <div className="px-6 py-4">
              <SettingHeader settingId="groupBy" />
              <RadioGroup
                value={options.groupBy}
                onValueChange={(value) => updateOption("groupBy", value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="group-none" />
                  <Label htmlFor="group-none">None</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="color" id="group-color" />
                  <Label htmlFor="group-color">Color</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="parent" id="group-parent" />
                  <Label htmlFor="group-parent">Parent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="layer" id="group-layer" />
                  <Label htmlFor="group-layer">Layer</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="paths" className="space-y-4">
            {/* Line Fit Tolerance Options */}
            <div className="px-6 py-4">
              <SettingHeader settingId="lineFit" />
              <RadioGroup
                value={options.lineFit}
                onValueChange={(value) => updateOption("lineFit", value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="coarse" id="fit-coarse" />
                  <Label htmlFor="fit-coarse">Coarse</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="fit-medium" />
                  <Label htmlFor="fit-medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fine" id="fit-fine" />
                  <Label htmlFor="fit-fine">Fine</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="superFine" id="fit-super-fine" />
                  <Label htmlFor="fit-super-fine">Super Fine</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Curve Type Options */}
            <div className="px-6 py-4">
              <SettingHeader settingId="allowedCurveTypes" />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="curves-lines"
                    checked={options.allowedCurveTypes.includes("lines")}
                    onCheckedChange={() => toggleArrayOption("allowedCurveTypes", "lines")}
                  />
                  <Label htmlFor="curves-lines">Lines</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="curves-quadratic"
                    checked={options.allowedCurveTypes.includes("quadraticBezier")}
                    onCheckedChange={() => toggleArrayOption("allowedCurveTypes", "quadraticBezier")}
                  />
                  <Label htmlFor="curves-quadratic">Quadratic Bézier Curves</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="curves-cubic"
                    checked={options.allowedCurveTypes.includes("cubicBezier")}
                    onCheckedChange={() => toggleArrayOption("allowedCurveTypes", "cubicBezier")}
                  />
                  <Label htmlFor="curves-cubic">Cubic Bézier Curves</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="curves-circular"
                    checked={options.allowedCurveTypes.includes("circularArcs")}
                    onCheckedChange={() => toggleArrayOption("allowedCurveTypes", "circularArcs")}
                  />
                  <Label htmlFor="curves-circular">Circular Arcs</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="curves-elliptical"
                    checked={options.allowedCurveTypes.includes("ellipticalArcs")}
                    onCheckedChange={() => toggleArrayOption("allowedCurveTypes", "ellipticalArcs")}
                  />
                  <Label htmlFor="curves-elliptical">Elliptical Arcs</Label>
                </div>
              </div>
            </div>

            {/* Gap Filler Options */}
            <div className="px-6 py-4">
              <div className="flex items-center mb-3">
                <h3 className="text-sm font-medium">Gap Filler</h3>
                <div className="flex space-x-1">
                  <SettingInfoTooltip 
                    content={
                      <div>
                        <p>{settingsHelpText.fillGaps.description}</p>
                        {settingsHelpText.fillGaps.tips && (
                          <div className="mt-2">{settingsHelpText.fillGaps.tips}</div>
                        )}
                      </div>
                    } 
                    width="narrow"
                  />
                  <SettingInfoTooltip 
                    content={
                      <div>
                        <p>{settingsHelpText.clipOverflow.description}</p>
                        {settingsHelpText.clipOverflow.tips && (
                          <div className="mt-2">{settingsHelpText.clipOverflow.tips}</div>
                        )}
                      </div>
                    } 
                    width="narrow"
                  />
                  <SettingInfoTooltip 
                    content={
                      <div>
                        <p>{settingsHelpText.strokeWidth.description}</p>
                        {settingsHelpText.strokeWidth.tips && (
                          <div className="mt-2">{settingsHelpText.strokeWidth.tips}</div>
                        )}
                      </div>
                    } 
                    width="narrow"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gap-fill"
                    checked={options.fillGaps}
                    onCheckedChange={(checked) => updateOption("fillGaps", !!checked)}
                  />
                  <Label htmlFor="gap-fill">Fill Gaps</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gap-overflow"
                    checked={options.clipOverflow}
                    onCheckedChange={(checked) => updateOption("clipOverflow", !!checked)}
                  />
                  <Label htmlFor="gap-overflow">Clip Overflow</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gap-non-scaling"
                    checked={options.nonScalingStroke}
                    onCheckedChange={(checked) => updateOption("nonScalingStroke", !!checked)}
                  />
                  <Label htmlFor="gap-non-scaling">Non-Scaling Stroke</Label>
                </div>
                <div className="flex flex-col space-y-1 mt-2">
                  <div className="flex justify-between">
                    <Label htmlFor="stroke-width" className="text-xs text-gray-500">
                      Stroke Width
                    </Label>
                    <span className="text-xs text-gray-500">{options.strokeWidth}px</span>
                  </div>
                  <Slider
                    id="stroke-width"
                    min={0.5}
                    max={5}
                    step={0.5}
                    value={[options.strokeWidth]}
                    onValueChange={(values) => updateOption("strokeWidth", values[0])}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
