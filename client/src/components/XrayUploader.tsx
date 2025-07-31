import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileImage, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  Shield
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface XrayUploaderProps {
  userId: number;
  onAnalysisComplete?: (result: any) => void;
}

interface AnalysisResult {
  analysisId: number;
  abuseLikelihood: number;
  fractureType: string | null;
  explanation: string;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string;
}

export default function XrayUploader({ userId, onAnalysisComplete }: XrayUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('xray', file);
      formData.append('userId', userId.toString());

      const response = await apiRequest('POST', '/api/analyze-xray', formData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Analysis failed');
      }

      return response.json();
    },
    onSuccess: (result: AnalysisResult) => {
      toast({
        title: "Analysis Complete",
        description: `Risk level: ${result.riskLevel.toUpperCase()}`,
        variant: result.riskLevel === 'high' ? 'destructive' : 'default',
      });
      onAnalysisComplete?.(result);
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPEG or PNG image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const startAnalysis = () => {
    if (!selectedFile) return;
    analysisMutation.mutate(selectedFile);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'medium':
        return 'bg-amber-600/20 text-amber-400 border-amber-600/30';
      case 'low':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  return (
    <Card className="medical-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">X-ray Analysis</h3>
          <p className="text-gray-300 text-sm">
            Upload pediatric X-ray images for AI-powered abuse pattern detection
          </p>
        </div>
        <Shield className="h-8 w-8 text-blue-400" />
      </div>

      {!selectedFile ? (
        // Upload Area
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">
            Upload Pediatric X-ray
          </h4>
          <p className="text-gray-400 mb-4">
            Drag and drop your image here, or click to browse
          </p>
          
          <div className="space-y-2 text-sm text-gray-500">
            <p>Supported formats: JPEG, PNG</p>
            <p>Maximum size: 10MB</p>
            <p>For best results, ensure clear image quality</p>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
          >
            <FileImage className="w-4 h-4 mr-2" />
            Choose File
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        // File Preview and Analysis
        <div className="space-y-6">
          {/* File Preview */}
          <div className="flex items-start space-x-4">
            <div className="relative">
              <img
                src={preview!}
                alt="X-ray preview"
                className="w-32 h-32 object-cover rounded-lg border border-gray-600"
              />
              <Badge className="absolute top-2 right-2 bg-black/50 text-white text-xs">
                {selectedFile.type.split('/')[1].toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-white mb-2">{selectedFile.name}</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>Type: {selectedFile.type}</p>
                <p>Uploaded: {new Date().toLocaleTimeString()}</p>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={startAnalysis}
                  disabled={analysisMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {analysisMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Analyze X-ray
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Analysis Progress */}
          {analysisMutation.isPending && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                  <span className="text-white font-medium">Analyzing X-ray...</span>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-sm text-gray-400 mt-2">
                  AI is examining the image for fracture patterns and abuse indicators
                </p>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisMutation.data && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-white">Analysis Results</h5>
                  <Badge className={getRiskColor(analysisMutation.data.riskLevel)}>
                    {analysisMutation.data.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Abuse Likelihood:</span>
                      <span className="font-medium text-white">
                        {(analysisMutation.data.abuseLikelihood * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Confidence Score:</span>
                      <span className="font-medium text-white">
                        {(analysisMutation.data.confidenceScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fracture Type:</span>
                      <span className="font-medium text-white">
                        {analysisMutation.data.fractureType || 'None detected'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <h6 className="text-sm font-medium text-gray-300 mb-2">Recommendations</h6>
                    <p className="text-sm text-gray-400">
                      {analysisMutation.data.recommendations}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <h6 className="text-sm font-medium text-gray-300 mb-2">AI Analysis</h6>
                  <p className="text-sm text-gray-400">
                    {analysisMutation.data.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {analysisMutation.error && (
            <Card className="bg-red-900/20 border-red-600/30">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <h5 className="font-medium text-red-400">Analysis Failed</h5>
                    <p className="text-sm text-red-300">
                      {analysisMutation.error.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Compliance Notice */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="text-sm">
            <h6 className="font-medium text-blue-400 mb-1">HIPAA Compliant Analysis</h6>
            <p className="text-blue-300">
              All uploaded images are processed securely and in compliance with HIPAA regulations. 
              Images are not stored permanently and are used solely for AI analysis.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
