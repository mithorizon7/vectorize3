import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Palette, Pipette, Plus, X, Copy, CheckCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { presets } from "@/lib/conversion-presets";

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
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [currentHexValue, setCurrentHexValue] = useState("#000000");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [suggestedPalettes, setSuggestedPalettes] = useState<Record<string, string[]>>({
    grayscale: ["#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF"],
    primary: ["#1E88E5", "#1565C0", "#0D47A1", "#82B1FF", "#E3F2FD"],
    accent: ["#F44336", "#4CAF50", "#FFC107", "#9C27B0", "#FF9800"]
  });

  // Update suggestions based on detected colors
  useEffect(() => {
    // Initialize suggestions from preset palettes when detected colors change
    if (detectedColors.length > 0) {
      const suitablePreset = presets.find(p => 
        p.colorSettings?.recommendedPalette && p.colorSettings.recommendedPalette.length > 0
      );
      
      if (suitablePreset?.colorSettings?.recommendedPalette) {
        setSuggestedPalettes(prev => ({
          ...prev,
          recommended: suitablePreset.colorSettings.recommendedPalette
        }));
      }
    }
  }, [detectedColors]);

  // Initialize color selection when detected colors change
  useEffect(() => {
    if (detectedColors.length > 0 && selectedColor === null) {
      setSelectedColor(detectedColors[0]);
      setCurrentHexValue(colorMap[detectedColors[0]] || "#000000");
    }
  }, [detectedColors, colorMap, selectedColor]);

  // Update current hex value when selection changes
  useEffect(() => {
    if (selectedColor) {
      setCurrentHexValue(colorMap[selectedColor] || selectedColor);
    }
  }, [selectedColor, colorMap]);

  const handleColorChange = (color: string) => {
    setCurrentHexValue(color);
    if (selectedColor) {
      setColorMap(prev => ({ ...prev, [selectedColor]: color }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
      handleColorChange(value);
    } else {
      setCurrentHexValue(value);
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setCurrentHexValue(colorMap[color] || color);
  };

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const getContrastColor = (hexColor: string) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substring(1, 3), 16);
    const g = parseInt(hexColor.substring(3, 5), 16);
    const b = parseInt(hexColor.substring(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  const ColorPalette = ({ colors, title }: { colors: string[], title: string }) => (
    <div className="space-y-2 mb-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <Button
            key={`${title}-${color}-${index}`}
            variant="outline"
            className="p-0 h-8 w-8 rounded-md relative group"
            style={{ background: color, borderColor: getContrastColor(color) === '#000000' ? '#ddd' : '#555' }}
            onClick={() => handleColorChange(color)}
          >
            <span className="sr-only">Select {color}</span>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Pipette 
                className="h-4 w-4" 
                style={{ color: getContrastColor(color) }} 
              />
            </div>
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Multi-Color Customization</h2>
        <p className="text-sm text-muted-foreground">
          Customize each detected color in your SVG individually
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Color selector and detected colors */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Detected Colors</h3>
                <Badge variant="outline" className="ml-2">
                  {detectedColors.length} colors
                </Badge>
              </div>
              
              <ScrollArea className="h-[120px] rounded-md border">
                <div className="flex flex-wrap gap-2 p-3">
                  {detectedColors.map((color) => (
                    <div 
                      key={color}
                      className="relative group"
                    >
                      <Button
                        variant={selectedColor === color ? "default" : "outline"}
                        size="sm"
                        className={`h-8 flex items-center gap-2 ${
                          selectedColor === color ? "border-2 border-primary" : ""
                        }`}
                        onClick={() => handleColorSelect(color)}
                      >
                        <div 
                          className="w-4 h-4 rounded-sm border"
                          style={{ 
                            backgroundColor: colorMap[color] || color,
                            borderColor: getContrastColor(colorMap[color] || color) === '#000000' ? '#ddd' : '#555'
                          }}
                        />
                        <span className="text-xs">{colorMap[color] || color}</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 absolute -right-2 -top-2 bg-background border rounded-full opacity-0 group-hover:opacity-100"
                        onClick={() => handleCopyColor(colorMap[color] || color)}
                      >
                        {copiedColor === (colorMap[color] || color) ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          {selectedColor && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-sm border"
                      style={{ 
                        backgroundColor: selectedColor,
                        borderColor: getContrastColor(selectedColor) === '#000000' ? '#ddd' : '#555'
                      }}
                    />
                    <span className="text-sm font-medium">Original: {selectedColor}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-sm border"
                      style={{ 
                        backgroundColor: colorMap[selectedColor] || selectedColor,
                        borderColor: getContrastColor(colorMap[selectedColor] || selectedColor) === '#000000' ? '#ddd' : '#555'
                      }}
                    />
                    <span className="text-sm font-medium">New: {colorMap[selectedColor] || selectedColor}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="hexColor" className="text-xs">Hex Color</Label>
                    <div className="flex">
                      <Input
                        id="hexColor"
                        value={currentHexValue}
                        onChange={handleInputChange}
                        className="font-mono"
                        placeholder="#RRGGBB"
                      />
                    </div>
                  </div>
                </div>
                
                <HexColorPicker 
                  color={currentHexValue} 
                  onChange={handleColorChange} 
                  className="w-full !h-[160px]"
                />
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right column: Color palettes and suggestions */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="recommended">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="recommended">
                    <Palette className="h-4 w-4 mr-2" />
                    Recommended
                  </TabsTrigger>
                  <TabsTrigger value="basic">
                    <Palette className="h-4 w-4 mr-2" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="custom">
                    <Palette className="h-4 w-4 mr-2" />
                    Custom
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="recommended" className="mt-0 space-y-4">
                  {suggestedPalettes.recommended ? (
                    <ColorPalette 
                      colors={suggestedPalettes.recommended} 
                      title="Recommended Colors" 
                    />
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No recommended colors available for this SVG.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="basic" className="mt-0 space-y-4">
                  <ColorPalette 
                    colors={suggestedPalettes.grayscale} 
                    title="Grayscale" 
                  />
                  <ColorPalette 
                    colors={suggestedPalettes.primary} 
                    title="Primary" 
                  />
                  <ColorPalette 
                    colors={suggestedPalettes.accent} 
                    title="Accent" 
                  />
                </TabsContent>
                
                <TabsContent value="custom" className="mt-0 space-y-4">
                  <div className="text-center py-4 space-y-4">
                    <p className="text-muted-foreground">Coming soon: Create and save your own custom color palettes</p>
                    <Button variant="outline" disabled>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Custom Palette
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Tips for Multi-Color SVGs</h3>
            <ul className="text-sm space-y-2 text-muted-foreground list-disc list-inside">
              <li>Select a color from the detected colors list on the left</li>
              <li>Use the color picker or enter a hex value to change it</li>
              <li>Try using a consistent color palette for better visual harmony</li>
              <li>Consider accessibility and contrast when choosing colors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}