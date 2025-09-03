import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Shield, HelpCircle, Github } from "lucide-react";
import UploadArea, { convertImageWithOptions } from "@/components/UploadArea";
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

  // Handler for settings changes to trigger real-time conversion
  const handleSettingsChange = useCallback(async () => {
    if (batchMode && files.length > 0) {
      // Handle batch mode: convert only the active file for preview
      const activeFile = files[activeFileIndex];
      
      // Show loading indicator
      setConversionStatus({
        status: "loading",
        message: `Updating preview for ${activeFile.name || `file ${activeFileIndex + 1}`}...`,
      });
      
      // Convert the active file with new settings
      const newSvgContent = await convertImageWithOptions(
        activeFile,
        options,
        setConversionStatus,
        true,
        activeFileIndex,
        files.length
      );
      
      if (newSvgContent) {
        // Update only the active file's SVG content
        setSvgContents(prev => {
          const newContents = [...prev];
          newContents[activeFileIndex] = newSvgContent;
          return newContents;
        });
      }
    } 
    else if (file) {
      // Single file mode
      // Show loading indicator
      setConversionStatus({
        status: "loading",
        message: "Applying new settings...",
      });
      
      // Use the utility function to convert with new settings
      const newSvgContent = await convertImageWithOptions(
        file,
        options,
        setConversionStatus,
        false
      );
      
      if (newSvgContent) {
        setSvgContent(newSvgContent);
      }
    }
  }, [file, files, batchMode, activeFileIndex, options]);

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
        {/* Step 1: Upload & Settings - Side by Side */}
        <div className="mb-8">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Step 1: Upload Image & Configure Settings</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Upload Area */}
            <div className="lg:col-span-5" id="upload-area">
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

            {/* Settings */}
            <div className="lg:col-span-7">
              <ConversionSettings 
                options={options} 
                setOptions={setOptions}
                currentFile={file}
                files={files}
                batchMode={batchMode}
                onSettingsChange={handleSettingsChange}
              />
              
              {/* Enhanced Status Display with Professional Loading Animation */}
              {conversionStatus.status !== "idle" && (
                <div className={`mt-4 p-4 rounded-lg border transition-all duration-300 ${
                  conversionStatus.status === "loading" ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm" :
                  conversionStatus.status === "success" ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm" :
                  conversionStatus.status === "error" ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-200 shadow-sm" : ""
                }`}>
                  <div className="flex items-center">
                    {conversionStatus.status === "loading" && (
                      <div className="flex items-center mr-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                      </div>
                    )}
                    {conversionStatus.status === "success" && (
                      <div className="h-5 w-5 mr-3 text-green-600 animate-pulse">✅</div>
                    )}
                    {conversionStatus.status === "error" && (
                      <div className="h-5 w-5 mr-3 text-red-600">❌</div>
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        conversionStatus.status === "loading" ? "text-blue-800" :
                        conversionStatus.status === "success" ? "text-green-800" :
                        conversionStatus.status === "error" ? "text-red-800" : ""
                      }`}>
                        {conversionStatus.message}
                      </p>
                      {conversionStatus.status === "loading" && (
                        <p className="text-xs text-blue-600 mt-1 opacity-75">
                          🔄 Analyzing edges, paths, and optimizing vector output...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Step 2: SVG Preview & Customization */}
        <div>
          <h2 className="text-xl font-medium text-gray-800 mb-4">Step 2: Preview & Customize SVG</h2>
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
