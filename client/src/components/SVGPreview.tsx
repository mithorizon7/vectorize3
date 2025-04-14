import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DownloadIcon } from "lucide-react";
import ColorCustomizer from "./ColorCustomizer";

interface SVGPreviewProps {
  svgContent: string | null;
  conversionStatus: {
    status: "idle" | "loading" | "success" | "error";
    message: string;
  };
  isTransparent: boolean;
  setIsTransparent: Dispatch<SetStateAction<boolean>>;
  color: string;
  setColor: Dispatch<SetStateAction<string>>;
}

export default function SVGPreview({
  svgContent,
  conversionStatus,
  isTransparent,
  setIsTransparent,
  color,
  setColor
}: SVGPreviewProps) {
  const [modifiedSvgContent, setModifiedSvgContent] = useState<string | null>(null);

  // Apply color and transparency to SVG
  useEffect(() => {
    if (svgContent) {
      // Parse SVG content to modify it
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');

      if (svgElement) {
        // Apply color to all shapes (paths, rects, circles, etc.)
        const shapeTags = ['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline'];
        shapeTags.forEach(tag => {
          const elements = svgElement.querySelectorAll(tag);
          elements.forEach(el => {
            if (!el.getAttribute('fill') || el.getAttribute('fill') !== 'none') {
              el.setAttribute('fill', color);
            }
          });
        });

        // Set background transparency if needed
        const backgrounds = svgElement.querySelectorAll('rect[width="100%"][height="100%"], rect[x="0"][y="0"]');
        backgrounds.forEach(bg => {
          if (isTransparent) {
            bg.setAttribute('fill', 'none');
          } else {
            bg.setAttribute('fill', '#FFFFFF');
          }
        });

        // Convert back to string
        const serializer = new XMLSerializer();
        setModifiedSvgContent(serializer.serializeToString(svgDoc));
      }
    } else {
      setModifiedSvgContent(null);
    }
  }, [svgContent, color, isTransparent]);

  const handleDownload = () => {
    if (modifiedSvgContent) {
      // Create a blob from the SVG content
      const blob = new Blob([modifiedSvgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted-image.svg';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    }
  };

  return (
    <Card>
      <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-medium">Preview</h2>
        <div 
          className={`text-sm ${
            conversionStatus.status === 'loading' ? 'text-amber-500' : 
            conversionStatus.status === 'success' ? 'text-emerald-500' : 
            conversionStatus.status === 'error' ? 'text-red-500' : 
            'text-gray-500'
          }`}
        >
          {conversionStatus.message}
        </div>
      </div>
      
      <CardContent className="p-6">
        <div 
          className={`border border-gray-200 rounded-lg h-64 flex items-center justify-center relative overflow-hidden ${isTransparent ? 'bg-transparent' : 'bg-[#F3F4F6]'}`}
          style={{ 
            backgroundImage: isTransparent ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)' : 'none',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        >
          {!modifiedSvgContent && (
            <div className="text-gray-400 text-center px-4">
              <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Preview will appear here after conversion</p>
            </div>
          )}
          
          {modifiedSvgContent && (
            <div 
              className="w-full h-full flex items-center justify-center" 
              dangerouslySetInnerHTML={{ __html: modifiedSvgContent }} 
            />
          )}
        </div>
      </CardContent>

      <ColorCustomizer color={color} setColor={setColor} />
      
      <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="transparent-bg" 
            checked={isTransparent}
            onCheckedChange={(checked) => setIsTransparent(checked === true)}
          />
          <Label htmlFor="transparent-bg">Transparent background</Label>
        </div>
        <Button 
          onClick={handleDownload} 
          disabled={!modifiedSvgContent}
          variant="default"
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download SVG
        </Button>
      </div>
    </Card>
  );
}
