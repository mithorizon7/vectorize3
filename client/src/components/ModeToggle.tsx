import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Wand2 } from "lucide-react";

export default function ModeToggle() {
  const [location, setLocation] = useLocation();
  
  const isAnimationMode = location === "/animation";
  
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <Button
        variant={!isAnimationMode ? "default" : "ghost"}
        size="sm"
        onClick={() => setLocation("/")}
        className={`text-xs px-3 py-1.5 rounded-md transition-all ${
          !isAnimationMode 
            ? "bg-white shadow-sm text-gray-900" 
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <Wand2 className="h-3 w-3 mr-1.5" />
        Standard
      </Button>
      
      <Button
        variant={isAnimationMode ? "default" : "ghost"}
        size="sm"
        onClick={() => setLocation("/animation")}
        className={`text-xs px-3 py-1.5 rounded-md transition-all ml-1 ${
          isAnimationMode 
            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm" 
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <Play className="h-3 w-3 mr-1.5" />
        Animation
        <Badge 
          variant="secondary" 
          className={`ml-1.5 text-[10px] px-1 py-0 ${
            isAnimationMode ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          Pro
        </Badge>
      </Button>
    </div>
  );
}