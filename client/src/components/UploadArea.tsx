import { useState, useRef, Dispatch, SetStateAction } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SVGOptions } from "@/lib/svg-converter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface UploadAreaProps {
  setFile: Dispatch<SetStateAction<File | null>>;
  setFiles: Dispatch<SetStateAction<File[]>>;
  setBatchMode: Dispatch<SetStateAction<boolean>>;
  batchMode: boolean;
  setConversionStatus: Dispatch<SetStateAction<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>>;
  setSvgContent: Dispatch<SetStateAction<string | null>>;
  setSvgContents: Dispatch<SetStateAction<(string | null)[]>>;
  setActiveFileIndex: Dispatch<SetStateAction<number>>;
  options: SVGOptions;
}

export default function UploadArea({ 
  setFile, 
  setFiles,
  setBatchMode,
  batchMode,
  setConversionStatus, 
  setSvgContent,
  setSvgContents,
  setActiveFileIndex,
  options
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
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
      if (files.length === 1 && !batchMode) {
        await processFile(files[0]);
      } else {
        processMultipleFiles(Array.from(files));
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleMultipleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processMultipleFiles(Array.from(files));
    }
  };

  const processMultipleFiles = (fileList: File[]) => {
    // Filter out non-image files
    const imageFiles = fileList.filter(file => file.type.match('image.*'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please upload image files (JPEG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    if (imageFiles.length !== fileList.length) {
      toast({
        title: "Some files skipped",
        description: `${fileList.length - imageFiles.length} non-image files were skipped.`,
        variant: "default",
      });
    }
    
    setSelectedFiles(imageFiles);
    setFiles(imageFiles);
    setBatchMode(true);
    
    // Start processing the first file
    if (imageFiles.length > 0) {
      setActiveFileIndex(0);
      processFile(imageFiles[0], 0, true);
    }
  };

  const processFile = async (file: File, fileIndex = 0, isBatch = false) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (!isBatch) {
      setBatchMode(false);
      setFile(file);
    }
    
    setConversionStatus({
      status: "loading",
      message: isBatch ? `Converting ${fileIndex + 1} of ${selectedFiles.length}...` : "Converting...",
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
      
      if (isBatch) {
        setSvgContents(prev => {
          const newContents = [...prev];
          newContents[fileIndex] = data.svg;
          return newContents;
        });
      } else {
        setSvgContent(data.svg);
      }
      
      setConversionStatus({
        status: "success",
        message: isBatch 
          ? `Converted ${fileIndex + 1} of ${selectedFiles.length}` 
          : "Conversion successful",
      });
      
      // Process next file in batch if there are more
      if (isBatch && fileIndex < selectedFiles.length - 1) {
        setTimeout(() => {
          processFile(selectedFiles[fileIndex + 1], fileIndex + 1, true);
        }, 100);
      }
    } catch (error) {
      console.error('Error converting image:', error);
      setConversionStatus({
        status: "error",
        message: isBatch 
          ? `Error converting file ${fileIndex + 1} of ${selectedFiles.length}` 
          : "Conversion failed",
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
  
  const handleMultipleButtonClick = () => {
    if (multipleFileInputRef.current) {
      multipleFileInputRef.current.click();
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      if (newFiles.length === 0) {
        setBatchMode(false);
      }
      return newFiles;
    });
    
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    setSvgContents(prev => {
      const newContents = [...prev];
      newContents.splice(index, 1);
      return newContents;
    });
    
    // Adjust active index if needed
    setActiveFileIndex(prev => {
      if (prev >= index && prev > 0) {
        return prev - 1;
      }
      return 0;
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Upload Image{batchMode ? 's' : ''}</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleButtonClick}
            >
              Single File
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMultipleButtonClick}
            >
              Multiple Files
            </Button>
          </div>
        </div>
        
        {batchMode && selectedFiles.length > 0 ? (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedFiles.map((file, idx) => (
                <Badge key={idx} variant="secondary" className="flex items-center gap-1 p-1 pl-3">
                  {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5" 
                    onClick={() => handleRemoveFile(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        ) : (
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
        )}
        
        {/* Hidden input for multiple files */}
        <input 
          type="file" 
          multiple 
          className="sr-only" 
          accept="image/*" 
          ref={multipleFileInputRef}
          onChange={handleMultipleFileInputChange}
        />
      </CardContent>
    </Card>
  );
}
