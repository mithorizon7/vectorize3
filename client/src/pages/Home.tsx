import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadArea from "@/components/UploadArea";
import SVGPreview from "@/components/SVGPreview";
import ConversionSettings from "@/components/ConversionSettings";
import { SVGOptions, initialSVGOptions } from "@/lib/svg-converter";

export default function Home() {
  // Single file state
  const [file, setFile] = useState<File | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  // Batch processing state
  const [files, setFiles] = useState<File[]>([]);
  const [svgContents, setSvgContents] = useState<(string | null)[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [batchMode, setBatchMode] = useState<boolean>(false);
  
  // Color customization state
  const [color, setColor] = useState<string>("#3B82F6");
  const [multiColorMode, setMultiColorMode] = useState<boolean>(false);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  
  // Split view comparison state
  const [showSplitView, setShowSplitView] = useState<boolean>(false);
  
  // Other state
  const [isTransparent, setIsTransparent] = useState<boolean>(false);
  const [conversionStatus, setConversionStatus] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({
    status: "idle",
    message: "No image uploaded",
  });
  const [options, setOptions] = useState<SVGOptions>(initialSVGOptions);

  return (
    <div className="bg-gray-50 font-sans text-gray-800 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-primary h-8 w-8 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.75 2.75V4.5h1.5V2.75h-1.5zm3.75 1.5h-1.5v1.75h1.5V4.25zM12.75 4.5v1.75h1.5V4.5h-1.5zM8.25 4.25v1.75h1.5V4.25h-1.5zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5zM4.25 8.25v1.5H6v-1.5H4.25zm13.5 0v1.5h1.75v-1.5h-1.75zM8.25 16v1.75h1.5V16h-1.5zm7.5 0v1.75h1.5V16h-1.5zm-3 1.75V19.5h1.5v-1.75h-1.5z" />
                <path d="M12 13.75a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold">SVG Converter</h1>
          </div>
          <div className="text-sm text-gray-600 hover:text-primary cursor-pointer">Help</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-7 space-y-6">
            <UploadArea 
              setFile={setFile}
              setFiles={setFiles}
              setBatchMode={setBatchMode}
              batchMode={batchMode}
              setConversionStatus={setConversionStatus}
              setSvgContent={setSvgContent}
              setSvgContents={setSvgContents}
              setActiveFileIndex={setActiveFileIndex}
              options={options}
            />

            <SVGPreview 
              svgContent={svgContent}
              svgContents={svgContents}
              batchMode={batchMode}
              activeFileIndex={activeFileIndex}
              setActiveFileIndex={setActiveFileIndex}
              files={files}
              conversionStatus={conversionStatus}
              isTransparent={isTransparent}
              setIsTransparent={setIsTransparent}
              color={color}
              setColor={setColor}
              multiColorMode={multiColorMode}
              setMultiColorMode={setMultiColorMode}
              colorMap={colorMap}
              setColorMap={setColorMap}
              showSplitView={showSplitView}
              setShowSplitView={setShowSplitView}
            />
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-5">
            <ConversionSettings 
              options={options} 
              setOptions={setOptions}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SVG Converter. All rights reserved.
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Privacy Policy</span>
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Terms of Service</span>
                  Terms of Service
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Contact</span>
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
