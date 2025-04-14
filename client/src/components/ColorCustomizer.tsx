import { Dispatch, SetStateAction } from "react";

interface ColorCustomizerProps {
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
}

export default function ColorCustomizer({ color, setColor }: ColorCustomizerProps) {
  const predefinedColors = [
    { value: "#000000", label: "Black" },
    { value: "#FFFFFF", label: "White" },
    { value: "#3B82F6", label: "Blue" },
    { value: "#10B981", label: "Green" },
    { value: "#F59E0B", label: "Yellow" },
    { value: "#EF4444", label: "Red" },
  ];

  return (
    <div className="px-6 py-4 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-shrink-0">
          <h3 className="text-sm font-medium">Color</h3>
        </div>
        <div className="flex space-x-2">
          {predefinedColors.map((colorOption) => (
            <button
              key={colorOption.value}
              className={`color-swatch w-8 h-8 rounded-full border ${color === colorOption.value ? 'ring-2 ring-offset-2 ring-primary' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform`}
              style={{ backgroundColor: colorOption.value }}
              onClick={() => setColor(colorOption.value)}
              aria-label={`Set color to ${colorOption.label}`}
            />
          ))}
          <div className="flex items-center">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
              aria-label="Select custom color"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
