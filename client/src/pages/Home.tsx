import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Shield, HelpCircle, Github } from "lucide-react";
import UploadArea from "@/components/UploadArea";
import SVGPreview from "@/components/SVGPreview";
import ConversionSettings from "@/components/ConversionSettings";
import PrivacyTermsDialog from "@/components/PrivacyTermsDialog";
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
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
              SVG Converter
            </h1>
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
              Secure
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <HelpCircle className="h-4 w-4 mr-1" />
              Help
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Github className="h-4 w-4 mr-1" />
              GitHub
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-7 space-y-6">
            <div id="upload-area">
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
            </div>

            <div id="svg-preview">
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
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} SVG Converter. All rights reserved.
              </div>
              <div className="flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                <Shield className="h-3 w-3 mr-1" />
                Secure &amp; Private
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex space-x-6 items-center">
                {/* Use the PrivacyTermsDialog component */}
                <PrivacyTermsDialog />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground"
                  onClick={() => window.open('mailto:support@svgconverter.app', '_blank')}
                >
                  Contact
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    if (svgContent || (batchMode && svgContents.length > 0)) {
                      // Scroll to SVGPreview section
                      document.getElementById('svg-preview')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      // Scroll to upload section
                      document.getElementById('upload-area')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
