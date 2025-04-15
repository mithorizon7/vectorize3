import { useState, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paintbrush, Palette } from "lucide-react";

interface ColorCustomizerProps {
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
  onModeChange?: (isMultiColor: boolean) => void;
}

const colorPresets = [
  { value: "#000000", label: "Black" },
  { value: "#FFFFFF", label: "White" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Yellow" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#F97316", label: "Orange" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#6B7280", label: "Gray" },
  { value: "#78350F", label: "Brown" },
];

export default function ColorCustomizer({ 
  color, 
  setColor,
  onModeChange 
}: ColorCustomizerProps) {
  const [customColor, setCustomColor] = useState(color);
  
  const handleColorChange = (newColor: string) => {
    setCustomColor(newColor);
    setColor(newColor);
  };
  
  const handlePresetClick = (preset: string) => {
    setColor(preset);
    setCustomColor(preset);
  };
  
  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex flex-col mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Color Customization</h3>
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-full border border-gray-300 shadow-sm" 
              style={{ backgroundColor: color }}
            ></div>
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-10 h-10 cursor-pointer"
              aria-label="Select custom color"
            />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-1 text-xs text-blue-800">
          <p>Changes made here are immediately applied to the SVG preview above. Try different colors!</p>
        </div>
      </div>
      
      <Tabs defaultValue="presets">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="custom" className="flex items-center gap-1">
            <Paintbrush className="h-3.5 w-3.5" />
            <span>Custom</span>
          </TabsTrigger>
          <TabsTrigger value="presets" className="flex items-center gap-1">
            <Palette className="h-3.5 w-3.5" />
            <span>Presets</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="custom" className="space-y-4">
          <div>
            <div className="mb-4">
              <Label htmlFor="hex-color">Hex Color</Label>
              <Input
                id="hex-color"
                type="text"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              {['#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFF00'].map((gradientColor) => (
                <button
                  key={gradientColor}
                  className="h-10 rounded-md border border-gray-200 hover:scale-105 transition-transform"
                  style={{ 
                    background: `linear-gradient(to right, #FFFFFF, ${gradientColor})` 
                  }}
                  onClick={() => handlePresetClick(gradientColor)}
                />
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="presets">
          <div className="grid grid-cols-6 gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.value}
                className={`w-10 h-10 rounded-md border ${color === preset.value ? 'ring-2 ring-offset-2 ring-primary' : 'border-gray-200'} hover:scale-110 transition-transform`}
                style={{ backgroundColor: preset.value }}
                onClick={() => handlePresetClick(preset.value)}
                title={preset.label}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
