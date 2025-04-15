import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { HexColorPicker } from "react-colorful";
import { Badge } from "@/components/ui/badge";
import { 
  InfoIcon, 
  PlusCircle, 
  RefreshCw, 
  Trash2 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdvancedColorCustomizerProps {
  colorMap: Record<string, string>;
  setColorMap: Dispatch<SetStateAction<Record<string, string>>>;
  detectedColors: string[];
}

export default function AdvancedColorCustomizer({
  colorMap,
  setColorMap,
  detectedColors,
}: AdvancedColorCustomizerProps) {
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [suggestedPalettes, setSuggestedPalettes] = useState<Record<string, string[]>>({
    "Monochromatic": ["#000000", "#333333", "#666666", "#999999", "#CCCCCC"],
    "Nature": ["#2E7D32", "#1B5E20", "#8BC34A", "#558B2F", "#33691E"],
    "Ocean": ["#0288D1", "#01579B", "#03A9F4", "#039BE5", "#0277BD"],
    "Warm": ["#FF5722", "#E64A19", "#FF9800", "#F57C00", "#EF6C00"],
    "Cool": ["#673AB7", "#512DA8", "#7E57C2", "#5E35B1", "#4527A0"]
  });
  
  // Auto-select the first color when the component mounts
  useEffect(() => {
    if (detectedColors.length > 0 && !activeColor) {
      setActiveColor(detectedColors[0]);
    }
  }, [detectedColors, activeColor]);

  // Update color map when a color changes
  const handleColorChange = (newColor: string) => {
    if (activeColor) {
      setColorMap(prev => ({
        ...prev,
        [activeColor]: newColor
      }));
    }
  };

  // Reset a specific color to its original value
  const resetColor = (originalColor: string) => {
    setColorMap(prev => ({
      ...prev,
      [originalColor]: originalColor
    }));
  };

  // Reset all colors to their original values
  const resetAllColors = () => {
    const resetMap: Record<string, string> = {};
    detectedColors.forEach(color => {
      resetMap[color] = color;
    });
    setColorMap(resetMap);
  };

  // Apply a palette of colors to the detected colors
  const applyPalette = (palette: string[]) => {
    const newColorMap = { ...colorMap };
    
    // Map each detected color to a color from the palette
    detectedColors.forEach((color, index) => {
      const paletteIndex = index % palette.length;
      newColorMap[color] = palette[paletteIndex];
    });
    
    setColorMap(newColorMap);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium">Advanced Color Editor</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetAllColors} 
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Color Selector */}
          <div className="md:col-span-3 border rounded-md p-3 h-[260px] overflow-y-auto">
            <h4 className="text-sm font-medium mb-2">Detected Colors</h4>
            <div className="space-y-2">
              {detectedColors.map((color) => (
                <div 
                  key={color} 
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted ${
                    activeColor === color ? 'bg-accent' : ''
                  }`}
                  onClick={() => setActiveColor(color)}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="h-5 w-5 rounded-full border" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs">{color}</span>
                  </div>
                  <div className="flex items-center">
                    <div 
                      className="h-5 w-5 rounded-full border ml-1" 
                      style={{ backgroundColor: colorMap[color] || color }}
                    />
                    {colorMap[color] !== color && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          resetColor(color);
                        }}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="md:col-span-4 border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">
              Color Picker
              {activeColor && (
                <span className="ml-2">
                  <Badge variant="outline" className="text-xs">
                    {activeColor} → {colorMap[activeColor] || activeColor}
                  </Badge>
                </span>
              )}
            </h4>
            
            {activeColor ? (
              <div className="flex flex-col items-center">
                <HexColorPicker 
                  color={colorMap[activeColor] || activeColor} 
                  onChange={handleColorChange} 
                  className="mb-3"
                />
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => resetColor(activeColor)}
                    className="text-xs"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                Select a color to edit
              </div>
            )}
          </div>

          {/* Color Palettes */}
          <div className="md:col-span-5 border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              Suggested Palettes
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3 w-3 ml-1 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">
                      Apply a color palette to automatically assign harmonious colors to your SVG elements.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h4>
            
            <div className="space-y-3">
              {Object.entries(suggestedPalettes).map(([name, colors]) => (
                <div key={name} className="border rounded-md p-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => applyPalette(colors)}
                      className="h-6 text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                  <div className="flex space-x-1">
                    {colors.map(color => (
                      <div 
                        key={color}
                        className="h-6 flex-1 rounded-sm" 
                        style={{ backgroundColor: color }} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}