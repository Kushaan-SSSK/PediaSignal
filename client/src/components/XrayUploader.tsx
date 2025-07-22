import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileImage, Search, Download, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface XrayAnalysisResult {
  analysisId: number;
  abuseLikelihood: number;
  fractureType: string | null;
  explanation: string;
  confidenceScore: number;
}

interface XrayUploaderProps {
  userId: number;
  onAnalysisComplete?: (result: XrayAnalysisResult) => void;
}

export default function XrayUploader({ userId, onAnalysisComplete }: XrayUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<XrayAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('xray', file);
      formData.append('userId', userId.toString());

      const response = await fetch('/api/analyze-xray', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data: XrayAnalysisResult) => {
      setAnalysisResult(data);
      onAnalysisComplete?.(data);
      
      toast({
        title: "Analysis Complete",
        description: "X-ray has been successfully analyzed",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/xray-analyses', userId] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPEG, PNG, DICOM)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setAnalysisResult(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } } as any;
      handleFileSelect(event);
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getRiskColor = (likelihood: number) => {
    if (likelihood < 0.3) return 'text-green-400';
    if (likelihood < 0.7) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskLabel = (likelihood: number) => {
    if (likelihood < 0.3) return 'Low';
    if (likelihood < 0.7) return 'Medium';
    return 'High';
  };

  return (
    <Card className="medical-card p-8">
      <h3 className="text-2xl font-bold mb-6 text-white">X-ray Analysis & Pattern Detection</h3>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Interface */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-white">Upload Pediatric X-ray</h4>
          
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-300 mb-2">Drag and drop X-ray image here</p>
            <p className="text-sm text-gray-500 mb-4">Supports JPEG, PNG, DICOM formats</p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Browse Files
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile && (
            <Card className="mt-6 bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white flex items-center">
                    <FileImage className="w-4 h-4 mr-2" />
                    {selectedFile.name}
                  </span>
                  <Badge className="bg-green-600/20 text-green-400">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                </div>
                
                {previewUrl && (
                  <div className="mb-3">
                    <img 
                      src={previewUrl} 
                      alt="X-ray preview" 
                      className="w-full h-48 object-contain rounded-lg bg-gray-800"
                    />
                  </div>
                )}
                
                <Button
                  onClick={handleAnalyze}
                  disabled={uploadMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Analyze X-ray
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analysis Results */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-white">Analysis Results</h4>
          
          {analysisResult ? (
            <div className="space-y-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Abuse Likelihood</span>
                    <span className={`text-xl font-bold ${getRiskColor(analysisResult.abuseLikelihood)}`}>
                      {getRiskLabel(analysisResult.abuseLikelihood)} ({analysisResult.abuseLikelihood.toFixed(2)})
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${analysisResult.abuseLikelihood < 0.3 ? 'bg-green-400' : analysisResult.abuseLikelihood < 0.7 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${analysisResult.abuseLikelihood * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Fracture Detection</span>
                    <span className="text-lg font-medium text-green-400">
                      {analysisResult.fractureType || 'None Detected'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {analysisResult.fractureType ? `${analysisResult.fractureType} fracture pattern identified` : 'No suspicious fracture patterns identified'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="mb-2">
                    <span className="text-gray-400">AI Analysis Summary</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    {analysisResult.explanation}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Confidence Score</span>
                    <span className="text-lg font-medium text-blue-400">
                      {(analysisResult.confidenceScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full"
                      style={{ width: `${analysisResult.confidenceScore * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-8 text-center">
                  <FileImage className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400">Upload and analyze an X-ray to see results here</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
