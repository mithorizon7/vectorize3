import { Dispatch, SetStateAction, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

  const handleColorChange = (newColor: string) => {
    if (activeColor) {
      setColorMap((prev) => ({
        ...prev,
        [activeColor]: newColor,
      }));
    }
  };

  const resetColors = () => {
    const resetMap: Record<string, string> = {};
    detectedColors.forEach((color) => {
      resetMap[color] = color;
    });
    setColorMap(resetMap);
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Multiple Color Editing</h3>
        <Button variant="outline" size="sm" onClick={resetColors}>
          Reset Colors
        </Button>
      </div>

      {detectedColors.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">
          No colors detected in the SVG. Upload an image first.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {detectedColors.map((originalColor) => (
            <div
              key={originalColor}
              className="flex items-center space-x-2 border border-gray-200 rounded-md p-2"
            >
              <div className="flex-shrink-0">
                <div
                  className="w-6 h-6 rounded-sm border border-gray-300"
                  style={{ backgroundColor: originalColor }}
                  title={originalColor}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs text-gray-500 truncate">
                  {originalColor}
                </div>
              </div>
              <div className="ml-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-8 h-8 p-0 border-gray-200"
                      onClick={() => setActiveColor(originalColor)}
                    >
                      <div
                        className="w-6 h-6 rounded-sm"
                        style={{
                          backgroundColor: colorMap[originalColor] || originalColor,
                        }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <HexColorPicker
                      color={
                        activeColor
                          ? colorMap[activeColor] || activeColor
                          : "#000000"
                      }
                      onChange={handleColorChange}
                    />
                    <div className="px-4 py-2">
                      <div className="text-xs text-center text-gray-500">
                        {activeColor ? colorMap[activeColor] || activeColor : ""}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}