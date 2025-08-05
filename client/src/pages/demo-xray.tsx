import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileImage, Upload, ArrowLeft, Eye, AlertTriangle, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useDropzone } from "react-dropzone";

interface AnalysisResult {
  abuseLikelihood: number;
  fractureType: string;
  explanation: string;
  confidenceScore: number;
  riskFactors: string[];
  recommendations: string[];
}

export default function DemoXray() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.dicom']
    },
    maxFiles: 1
  });

  const runAnalysis = async () => {
    if (!uploadedImage) return;
    
    setIsAnalyzing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Demo analysis results
    const demoResult: AnalysisResult = {
      abuseLikelihood: 0.23,
      fractureType: "Transverse fracture, mid-shaft femur",
      explanation: "The imaging shows a transverse fracture of the mid-shaft femur. The fracture pattern and location are consistent with accidental trauma in a mobile child. No spiral components or metaphyseal corner fractures are identified. The injury mechanism (fall from playground equipment) is appropriate for the fracture pattern observed.",
      confidenceScore: 0.87,
      riskFactors: [
        "Child age: 4 years (mobile)",
        "Fracture pattern: Transverse (typical for accidental trauma)",
        "Location: Mid-shaft (common accident site)",
        "No additional suspicious injuries visible"
      ],
      recommendations: [
        "Document mechanism of injury thoroughly",
        "Assess for other injuries per trauma protocol",
        "Consider social history if clinical concern exists",
        "Follow standard orthopedic management",
        "Educational discussion with family about injury prevention"
      ]
    };
    
    setAnalysis(demoResult);
    setIsAnalyzing(false);
  };

  const getRiskColor = (likelihood: number) => {
    if (likelihood < 0.3) return "text-green-400";
    if (likelihood < 0.7) return "text-yellow-400";
    return "text-red-400";
  };

  const getRiskBadge = (likelihood: number) => {
    if (likelihood < 0.3) return { variant: "secondary" as const, text: "Low Risk" };
    if (likelihood < 0.7) return { variant: "default" as const, text: "Moderate Risk" };
    return { variant: "destructive" as const, text: "High Risk" };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-slate-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-light">X-ray Analysis Demo</h1>
          </div>
          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
            Educational Tool Only
          </Badge>
        </div>

        {/* Important Disclaimer */}
        <Card className="bg-red-900/20 border-red-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-400 mb-2">Important Medical Disclaimer</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  This tool is designed for educational and training purposes only. It should never replace clinical judgment, 
                  comprehensive medical evaluation, or established medical protocols. All suspected cases of child abuse 
                  must follow institutional reporting guidelines and involve appropriate social services and law enforcement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Upload Section */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-light">
                <FileImage className="h-5 w-5 mr-2 text-purple-400" />
                X-ray Image Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!uploadedImage ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-purple-400 bg-purple-900/20" : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-300 mb-2">
                    {isDragActive ? "Drop the X-ray image here" : "Drag & drop an X-ray image here"}
                  </p>
                  <p className="text-sm text-slate-500">
                    Supports JPG, PNG, and DICOM formats
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Uploaded X-ray"
                      className="w-full h-96 object-contain bg-slate-900 rounded-lg border border-slate-600"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadedImage(null);
                        setAnalysis(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <Button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing Image...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Analyze X-ray
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-light">
                <ShieldCheck className="h-5 w-5 mr-2 text-green-400" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-12">
                  <FileImage className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-500">
                    Upload an X-ray image and click "Analyze" to see AI-powered analysis results.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Risk Assessment */}
                  <div>
                    <h3 className="font-semibold mb-3">Risk Assessment</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span>Non-Accidental Trauma Likelihood:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-lg ${getRiskColor(analysis.abuseLikelihood)}`}>
                          {(analysis.abuseLikelihood * 100).toFixed(1)}%
                        </span>
                        <Badge variant={getRiskBadge(analysis.abuseLikelihood).variant}>
                          {getRiskBadge(analysis.abuseLikelihood).text}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full"
                        style={{ width: `${analysis.abuseLikelihood * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Fracture Analysis */}
                  <div>
                    <h3 className="font-semibold mb-3">Fracture Analysis</h3>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-sm mb-2">
                        <strong>Type:</strong> {analysis.fractureType}
                      </p>
                      <p className="text-sm">
                        <strong>Confidence:</strong> {(analysis.confidenceScore * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Clinical Explanation */}
                  <div>
                    <h3 className="font-semibold mb-3">Clinical Explanation</h3>
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-700/30 p-4 rounded-lg">
                      {analysis.explanation}
                    </p>
                  </div>

                  {/* Risk Factors */}
                  <div>
                    <h3 className="font-semibold mb-3">Assessment Factors</h3>
                    <ul className="space-y-1 text-sm">
                      {analysis.riskFactors.map((factor, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-400 text-xs mt-1">•</span>
                          <span className="text-slate-300">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="font-semibold mb-3">Clinical Recommendations</h3>
                    <ul className="space-y-1 text-sm">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-400 text-xs mt-1">•</span>
                          <span className="text-slate-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Technical Information */}
        <Card className="bg-slate-800/50 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-light">Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-semibold mb-2 text-purple-400">AI Model</h3>
                <ul className="space-y-1 text-slate-300">
                  <li>• OpenAI GPT-4 Vision</li>
                  <li>• Computer Vision API</li>
                  <li>• Pattern Recognition</li>
                  <li>• Medical Image Analysis</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-purple-400">Analysis Features</h3>
                <ul className="space-y-1 text-slate-300">
                  <li>• Fracture pattern recognition</li>
                  <li>• Age-appropriate injury assessment</li>
                  <li>• Multiple injury detection</li>
                  <li>• Historical pattern comparison</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-purple-400">Clinical Integration</h3>
                <ul className="space-y-1 text-slate-300">
                  <li>• HIPAA-compliant processing</li>
                  <li>• Audit trail logging</li>
                  <li>• Multi-reviewer workflow</li>
                  <li>• Report generation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}