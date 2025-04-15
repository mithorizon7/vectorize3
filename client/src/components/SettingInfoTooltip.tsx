import React from "react";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SettingInfoTooltipProps {
  content: React.ReactNode;
  width?: "narrow" | "default" | "wide";
}

export function SettingInfoTooltip({ 
  content, 
  width = "default" 
}: SettingInfoTooltipProps) {
  const widthClass = 
    width === "narrow" 
      ? "max-w-[200px]" 
      : width === "wide" 
        ? "max-w-[350px]" 
        : "max-w-[280px]";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors"
            aria-label="More information"
          >
            <InfoIcon className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          align="start" 
          className={`text-sm p-3 ${widthClass} text-left`}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}