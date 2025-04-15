import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { HexColorPicker } from "react-colorful";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Palette, RefreshCw, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { applySvgColor } from "@/lib/fetch-helpers";

interface AdvancedColorCustomizerProps {
  colorMap: Record<string, string>;
  setColorMap: Dispatch<SetStateAction<Record<string, string>>>;
  detectedColors: string[];
  svgContent: string | null;
  setSvgContent: Dispatch<SetStateAction<string | null>>;
}

export default function AdvancedColorCustomizer({
  colorMap,
  setColorMap,
  detectedColors,
  svgContent,
  setSvgContent
}: AdvancedColorCustomizerProps) {
  const { toast } = useToast();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [replacementColor, setReplacementColor] = useState("#000000");
  const [loading, setLoading] = useState(false);

  // Detect colors if detectedColors is empty
  useEffect(() => {
    if (detectedColors.length === 0 && svgContent) {
      // Simple color extraction from SVG
      const colorRegex = /#[0-9A-Fa-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g;
      const matches = svgContent.match(colorRegex) || [];
      
      // Create unique set of detected colors
      const uniqueColors = Array.from(new Set(matches));
      
      // Initialize color map
      const initialColorMap: Record<string, string> = {};
      uniqueColors.forEach(color => {
        initialColorMap[color] = color;
      });
      
      setColorMap(initialColorMap);
    }
  }, [svgContent, detectedColors, setColorMap]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setReplacementColor(colorMap[color] || color);
  };

  const handleReplacementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplacementColor(e.target.value);
  };

  const applyColorChange = async () => {
    if (!selectedColor || !svgContent) return;
    
    try {
      setLoading(true);
      
      // Update color map
      const updatedColorMap = { ...colorMap, [selectedColor]: replacementColor };
      setColorMap(updatedColorMap);
      
      // Apply all color replacements to SVG
      let updatedSvg = svgContent;
      Object.entries(updatedColorMap).forEach(([originalColor, newColor]) => {
        if (originalColor !== newColor) {
          // Replace color in attributes
          const colorRegex = new RegExp(`${originalColor}(?=["\s;])`, 'g');
          updatedSvg = updatedSvg.replace(colorRegex, newColor);
        }
      });
      
      setSvgContent(updatedSvg);
      
      toast({
        title: "Color updated",
        description: `Changed ${selectedColor} to ${replacementColor}`,
      });
    } catch (error) {
      toast({
        title: "Error updating color",
        description: "Failed to apply color changes",
        variant: "destructive",
      });
      console.error("Error applying color:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetColors = () => {
    const resetMap: Record<string, string> = {};
    Object.keys(colorMap).forEach(color => {
      resetMap[color] = color;
    });
    
    setColorMap(resetMap);
    setSelectedColor(null);
    setReplacementColor("#000000");
    
    toast({
      title: "Colors reset",
      description: "All colors have been reset to their original values",
    });
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center">
              <Palette className="h-4 w-4 mr-1" />
              Multi-Color Management
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={resetColors}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-2 block">Colors in SVG</Label>
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.keys(colorMap).length > 0 ? (
                  Object.keys(colorMap).map((color) => (
                    <Badge
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      className="flex items-center cursor-pointer"
                      style={{ 
                        backgroundColor: selectedColor === color ? undefined : color,
                        color: selectedColor === color ? undefined : getContrastColor(color),
                        borderColor: isLightColor(color) ? '#ddd' : 'transparent'
                      }}
                      onClick={() => handleColorSelect(color)}
                    >
                      {color}
                      {selectedColor === color && <CheckCircle className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No colors detected</p>
                )}
              </div>
              
              {selectedColor && (
                <div className="mb-4">
                  <Label className="text-xs mb-2 block">Replace with</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={replacementColor}
                      onChange={handleReplacementChange}
                      type="text"
                      className="h-8 text-xs"
                    />
                    <div 
                      className="h-8 w-8 rounded border" 
                      style={{ backgroundColor: replacementColor }}
                    />
                  </div>
                </div>
              )}
              
              <Button
                size="sm"
                disabled={!selectedColor || loading}
                onClick={applyColorChange}
                className="w-full"
              >
                Apply Color Change
              </Button>
            </div>
            
            <div>
              {selectedColor && (
                <div>
                  <Label className="text-xs mb-2 block">Color Picker</Label>
                  <HexColorPicker 
                    color={replacementColor} 
                    onChange={setReplacementColor} 
                    className="w-full" 
                  />
                  <div className="flex justify-between mt-2">
                    <Badge variant="outline" style={{ backgroundColor: selectedColor }}>
                      Original
                    </Badge>
                    <Badge variant="outline" style={{ backgroundColor: replacementColor }}>
                      New
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions for color contrast
function isLightColor(color: string): boolean {
  // Simple check for light colors (for border visibility)
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r*0.299 + g*0.587 + b*0.114) > 150;
  }
  return false;
}

function getContrastColor(color: string): string {
  // Return black or white depending on background color
  if (isLightColor(color)) {
    return '#000000';
  }
  return '#ffffff';
}