import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Code2, 
  Copy, 
  Download, 
  ExternalLink, 
  Settings, 
  Play,
  FileText,
  Palette,
  Target,
  Clock,
  Zap
} from 'lucide-react';
import { 
  generateGSAPCode,
  generateCSSCode, 
  generateWAAPICode,
  CodeGeneratorOptions,
  AnimationElement,
  PivotPoint,
  GeneratedCode 
} from '@/lib/code-generators';

interface CodeExportPanelProps {
  svgContent: string;
  pivotPoints: PivotPoint[];
  elements: AnimationElement[];
  className?: string;
}

export function CodeExportPanel({ 
  svgContent, 
  pivotPoints, 
  elements = [],
  className = "" 
}: CodeExportPanelProps) {
  const [activeFramework, setActiveFramework] = useState<'gsap' | 'css' | 'waapi' | 'react'>('gsap');
  const [options, setOptions] = useState<CodeGeneratorOptions>({
    framework: 'gsap',
    includeComments: true,
    useCSSVariables: true,
    animationType: 'entrance',
    duration: 1.5,
    easing: 'power2.out',
    stagger: 0.1,
    responsive: true
  });
  
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Generate code based on current settings
  const generatedCode = useMemo(() => {
    if (!svgContent || elements.length === 0) {
      return null;
    }

    const currentOptions = { ...options, framework: activeFramework };
    
    switch (activeFramework) {
      case 'gsap':
        return generateGSAPCode(svgContent, elements, pivotPoints, currentOptions);
      case 'css':
        return generateCSSCode(svgContent, elements, pivotPoints, currentOptions);
      case 'waapi':
        return generateWAAPICode(svgContent, elements, pivotPoints, currentOptions);
      default:
        return generateGSAPCode(svgContent, elements, pivotPoints, currentOptions);
    }
  }, [svgContent, elements, pivotPoints, activeFramework, options]);

  // Copy to clipboard with feedback
  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Download code as file
  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get file extension for current framework
  const getFileExtension = () => {
    switch (activeFramework) {
      case 'css': return 'css';
      case 'waapi': return 'js';
      case 'react': return 'jsx';
      default: return 'js';
    }
  };

  if (!svgContent) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Code2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No SVG to export</p>
            <p className="text-xs mt-1">Upload and convert an image first</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Code2 className="h-4 w-4 mr-2" />
            Code Export
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {elements.length} element{elements.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Framework Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Animation Framework</Label>
          <Tabs value={activeFramework} onValueChange={(value) => setActiveFramework(value as any)}>
            <TabsList className="grid grid-cols-3 w-full text-xs">
              <TabsTrigger value="gsap" data-testid="framework-gsap">GSAP</TabsTrigger>
              <TabsTrigger value="css" data-testid="framework-css">CSS</TabsTrigger>
              <TabsTrigger value="waapi" data-testid="framework-waapi">Web API</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Animation Settings */}
        <div className="grid grid-cols-2 gap-3">
          {/* Animation Type */}
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select 
              value={options.animationType} 
              onValueChange={(value) => setOptions(prev => ({ ...prev, animationType: value as any }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrance">Entrance</SelectItem>
                <SelectItem value="loop">Loop</SelectItem>
                <SelectItem value="hover">Hover</SelectItem>
                <SelectItem value="scroll">Scroll</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <Label className="text-xs">Duration (s)</Label>
            <Input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={options.duration}
              onChange={(e) => setOptions(prev => ({ ...prev, duration: parseFloat(e.target.value) || 1.5 }))}
              className="h-8 text-xs"
            />
          </div>

          {/* Easing */}
          <div className="space-y-1">
            <Label className="text-xs">Easing</Label>
            <Select 
              value={options.easing} 
              onValueChange={(value) => setOptions(prev => ({ ...prev, easing: value }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="power2.out">Power 2 Out</SelectItem>
                <SelectItem value="power2.inOut">Power 2 InOut</SelectItem>
                <SelectItem value="back.out">Back Out</SelectItem>
                <SelectItem value="elastic.out">Elastic Out</SelectItem>
                <SelectItem value="bounce.out">Bounce Out</SelectItem>
                <SelectItem value="none">Linear</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stagger */}
          <div className="space-y-1">
            <Label className="text-xs">Stagger (s)</Label>
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={options.stagger || 0.1}
              onChange={(e) => setOptions(prev => ({ ...prev, stagger: parseFloat(e.target.value) || 0.1 }))}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Include Comments</Label>
            <Switch
              checked={options.includeComments}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeComments: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">CSS Variables</Label>
            <Switch
              checked={options.useCSSVariables}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, useCSSVariables: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Responsive</Label>
            <Switch
              checked={options.responsive}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, responsive: checked }))}
            />
          </div>
        </div>

        {/* Generated Code Display */}
        {generatedCode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Generated Code</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-6 px-2 text-xs"
                  data-testid="toggle-preview"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCode(generatedCode.code, `animation.${getFileExtension()}`)}
                  className="h-6 px-2 text-xs"
                  data-testid="download-code"
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Code Tabs */}
            <Tabs defaultValue="javascript" className="w-full">
              <TabsList className="grid grid-cols-3 w-full text-xs h-8">
                <TabsTrigger value="javascript" className="text-xs">JS</TabsTrigger>
                <TabsTrigger value="css" className="text-xs">CSS</TabsTrigger>
                <TabsTrigger value="instructions" className="text-xs">Setup</TabsTrigger>
              </TabsList>

              <TabsContent value="javascript" className="space-y-2">
                <div className="relative">
                  <Textarea
                    value={generatedCode.code}
                    readOnly
                    className="font-mono text-xs h-32 resize-none bg-gray-50"
                    data-testid="generated-js-code"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedCode.code, 'javascript')}
                    className="absolute top-2 right-2 h-6 px-2 text-xs"
                    data-testid="copy-js-code"
                  >
                    {copiedSection === 'javascript' ? (
                      <>✓ Copied</>
                    ) : (
                      <><Copy className="w-3 h-3 mr-1" />Copy</>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="css" className="space-y-2">
                <div className="relative">
                  <Textarea
                    value={generatedCode.css || '/* No CSS required for this framework */'}
                    readOnly
                    className="font-mono text-xs h-32 resize-none bg-gray-50"
                    data-testid="generated-css-code"
                  />
                  {generatedCode.css && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedCode.css!, 'css')}
                      className="absolute top-2 right-2 h-6 px-2 text-xs"
                      data-testid="copy-css-code"
                    >
                      {copiedSection === 'css' ? (
                        <>✓ Copied</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" />Copy</>
                      )}
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="instructions" className="space-y-2">
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                  <pre className="whitespace-pre-wrap font-mono">
                    {generatedCode.instructions}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>

            {/* Dependencies */}
            {generatedCode.dependencies && generatedCode.dependencies.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Dependencies</Label>
                <div className="flex flex-wrap gap-1">
                  {generatedCode.dependencies.map((dep, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Pivot Points Summary */}
            {pivotPoints.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center">
                  <Target className="w-3 h-3 mr-1" />
                  Pivot Points ({pivotPoints.length})
                </Label>
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                  {pivotPoints.map((pivot, index) => (
                    <div key={index} className="font-mono">
                      {pivot.elementId}: {pivot.transformOrigin}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && generatedCode?.preview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium">Animation Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </Button>
              </div>
              <div className="p-4 overflow-auto max-h-[70vh]">
                <iframe
                  srcDoc={generatedCode.preview}
                  className="w-full h-96 border rounded"
                  title="Animation Preview"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {options.duration}s duration
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {activeFramework.toUpperCase()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}