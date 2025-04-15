import { useState, Dispatch, SetStateAction } from "react";
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
}

export default function ConversionSettings({
  options,
  setOptions,
}: ConversionSettingsProps) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const updateOption = <K extends keyof SVGOptions>(
    key: K,
    value: SVGOptions[K]
  ) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
    setActivePreset(null); // Clear active preset when manually changing options
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
  };

  const handleApplyPreset = (preset: Preset) => {
    setOptions(applyPreset(preset));
    setActivePreset(preset.id);
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
          Choose a preset or customize settings for optimal results
        </p>
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
