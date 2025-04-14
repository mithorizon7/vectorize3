import { useState, useRef, Dispatch, SetStateAction } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SVGOptions } from "@/lib/svg-converter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadAreaProps {
  setFile: Dispatch<SetStateAction<File | null>>;
  setConversionStatus: Dispatch<SetStateAction<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>>;
  setSvgContent: Dispatch<SetStateAction<string | null>>;
  options: SVGOptions;
}

export default function UploadArea({ 
  setFile, 
  setConversionStatus, 
  setSvgContent,
  options
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    setFile(file);
    setConversionStatus({
      status: "loading",
      message: "Converting...",
    });

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Add conversion options to formData
      Object.entries(options).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formData.append(key, value.toString());
        } else if (Array.isArray(value)) {
          formData.append(key, value.join(','));
        } else {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSvgContent(data.svg);
      
      setConversionStatus({
        status: "success",
        message: "Conversion successful",
      });
    } catch (error) {
      console.error('Error converting image:', error);
      setConversionStatus({
        status: "error",
        message: "Conversion failed",
      });
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium mb-4">Upload Image</h2>
        
        <div 
          className={`custom-file-upload border-2 border-dashed ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-300'} rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-all duration-200`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m-4 0v-8m-12 12V8m0 12v12m0 0h12a4 4 0 004-4v-4m-16 0h-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600 justify-center">
              <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none">
                <span>Click to upload</span>
                <input 
                  id="file-upload" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">Support for PNG, JPG, GIF, BMP</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
