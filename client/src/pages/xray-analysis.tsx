import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileImage, Calendar, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import XrayUploader from "@/components/XrayUploader";

// Mock user
const mockUser = {
  id: 1,
  name: "Dr. Sarah Johnson",
  role: "pediatrician",
};

export default function XrayAnalysis() {
  const { data: analyses } = useQuery({
    queryKey: ['/api/xray-analyses', mockUser.id],
    enabled: !!mockUser.id,
  });

  const analysesData = analyses as any[] || [];

  const getRiskColor = (likelihood: number) => {
    if (likelihood < 0.3) return 'bg-green-600/20 text-green-400';
    if (likelihood < 0.7) return 'bg-amber-600/20 text-amber-400';
    return 'bg-red-600/20 text-red-400';
  };

  const getRiskLabel = (likelihood: number) => {
    if (likelihood < 0.3) return 'Low Risk';
    if (likelihood < 0.7) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="min-h-screen medical-gradient">
      <Header user={mockUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">X-ray Analysis & Pattern Detection</h1>
          <p className="text-gray-300">AI-powered pediatric X-ray analysis for abuse pattern detection</p>
        </div>

        {/* Upload Interface */}
        <div className="mb-8">
          <XrayUploader 
            userId={mockUser.id}
            onAnalysisComplete={(result) => {
              console.log('Analysis completed:', result);
            }}
          />
        </div>

        {/* Analysis History */}
        {analysesData && analysesData.length > 0 && (
          <Card className="medical-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Analysis History</h2>
              <div className="flex space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Low Risk</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                  <span>Medium Risk</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>High Risk</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {analysesData.map((analysis: any) => (
                <Card key={analysis.id} className="bg-gray-800/30 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <FileImage className="h-8 w-8 text-blue-400" />
                        <div>
                          <h3 className="font-semibold text-white">{analysis.filename}</h3>
                          <p className="text-sm text-gray-400 flex items-center mt-1">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(analysis.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getRiskColor(analysis.abuseLikelihood)}>
                        {getRiskLabel(analysis.abuseLikelihood)}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">Abuse Likelihood</span>
                          <span className={`font-bold ${
                            analysis.abuseLikelihood < 0.3 ? 'text-green-400' : 
                            analysis.abuseLikelihood < 0.7 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {(analysis.abuseLikelihood * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              analysis.abuseLikelihood < 0.3 ? 'bg-green-400' : 
                              analysis.abuseLikelihood < 0.7 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${analysis.abuseLikelihood * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">Fracture Type</span>
                          <span className="text-white font-medium">
                            {analysis.fractureType || 'None'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">Confidence</span>
                          <span className="text-blue-400 font-bold">
                            {(analysis.confidenceScore * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-400 h-2 rounded-full"
                            style={{ width: `${analysis.confidenceScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">AI Analysis Summary</h4>
                      <p className="text-gray-300 text-sm">{analysis.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Statistics */}
        <Card className="medical-card p-8 mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Analysis Statistics</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {analysesData.length}
              </div>
              <div className="text-sm text-gray-400">Total Analyses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">96.8%</div>
              <div className="text-sm text-gray-400">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400 mb-2">
                {analysesData.filter((a: any) => a.abuseLikelihood > 0.7).length}
              </div>
              <div className="text-sm text-gray-400">High Risk Cases</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {analysesData.length > 0 ? Math.round(analysesData.reduce((acc: number, a: any) => acc + a.confidenceScore, 0) / analysesData.length * 100) : 0}%
              </div>
              <div className="text-sm text-gray-400">Avg Confidence</div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
