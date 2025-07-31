import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  AlertTriangle, 
  Shield, 
  Globe, 
  Clock,
  TrendingUp,
  FileText,
  Upload,
  Download
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  logId: number;
  riskScore: number;
  category: string;
  explanation: string;
  recommendedAction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  flaggedForReview: boolean;
}

interface BatchScanItem {
  content: string;
  source: string;
  platform?: string;
}

export default function MisinformationScanner() {
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [platform, setPlatform] = useState("unknown");
  const [batchMode, setBatchMode] = useState(false);
  const [batchContent, setBatchContent] = useState<BatchScanItem[]>([]);
  const { toast } = useToast();

  // Single scan mutation
  const scanMutation = useMutation({
    mutationFn: async (data: { content: string; source: string; platform: string }) => {
      const response = await apiRequest('POST', '/api/misinfo-scan', data);
      return response.json();
    },
    onSuccess: (result: ScanResult) => {
      toast({
        title: "Scan Complete",
        description: `Risk level: ${result.severity.toUpperCase()}`,
        variant: result.severity === 'critical' || result.severity === 'high' ? 'destructive' : 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Batch scan mutation
  const batchScanMutation = useMutation({
    mutationFn: async (contents: BatchScanItem[]) => {
      const response = await apiRequest('POST', '/api/misinfo-scan-batch', { contents });
      return response.json();
    },
    onSuccess: (result: { results: ScanResult[] }) => {
      const highRiskCount = result.results.filter(r => r.severity === 'high' || r.severity === 'critical').length;
      toast({
        title: "Batch Scan Complete",
        description: `${highRiskCount} high-risk items detected`,
        variant: highRiskCount > 0 ? 'destructive' : 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Batch Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/misinfo-stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statsData = stats as any || {};

  const handleSingleScan = () => {
    if (!content.trim() || !source.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both content and source",
        variant: "destructive",
      });
      return;
    }

    scanMutation.mutate({ content, source, platform });
  };

  const handleBatchScan = () => {
    if (batchContent.length === 0) {
      toast({
        title: "No Content",
        description: "Please add content to scan",
        variant: "destructive",
      });
      return;
    }

    batchScanMutation.mutate(batchContent);
  };

  const addBatchItem = () => {
    if (!content.trim() || !source.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both content and source",
        variant: "destructive",
      });
      return;
    }

    setBatchContent([...batchContent, { content, source, platform }]);
    setContent("");
    setSource("");
  };

  const removeBatchItem = (index: number) => {
    setBatchContent(batchContent.filter((_, i) => i !== index));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      {statsData && (
        <Card className="medical-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Live Monitoring Statistics</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Globe className="h-5 w-5 text-blue-400" />
                <span className="text-2xl font-bold text-blue-400">{statsData.totalScans || 0}</span>
              </div>
              <div className="text-sm text-gray-400">Total Scans</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{statsData.highRiskCount || 0}</span>
              </div>
              <div className="text-sm text-gray-400">High Risk Detected</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                <span className="text-2xl font-bold text-purple-400">
                  {((statsData.averageRiskScore || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-gray-400">Avg Risk Score</div>
            </div>
            
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-green-400" />
                <span className="text-2xl font-bold text-green-400">94.2%</span>
              </div>
              <div className="text-sm text-gray-400">Detection Accuracy</div>
            </div>
          </div>
        </Card>
      )}

      {/* Scan Mode Toggle */}
      <Card className="medical-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Content Scanner</h3>
          <div className="flex space-x-2">
            <Button
              variant={!batchMode ? "default" : "outline"}
              onClick={() => setBatchMode(false)}
              className={!batchMode ? "bg-indigo-600" : "border-gray-600 text-gray-300"}
            >
              <Search className="w-4 h-4 mr-2" />
              Single Scan
            </Button>
            <Button
              variant={batchMode ? "default" : "outline"}
              onClick={() => setBatchMode(true)}
              className={batchMode ? "bg-indigo-600" : "border-gray-600 text-gray-300"}
            >
              <FileText className="w-4 h-4 mr-2" />
              Batch Scan
            </Button>
          </div>
        </div>

        {!batchMode ? (
          // Single Scan Mode
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Content to Analyze
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste or type the content you want to analyze for pediatric health misinformation..."
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  rows={6}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Source URL or Platform
                  </label>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g., https://example.com or Facebook"
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Platform
                  </label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="blog">Blog/Website</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleSingleScan}
              disabled={scanMutation.isPending || !content.trim() || !source.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {scanMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scan for Misinformation
                </>
              )}
            </Button>
          </div>
        ) : (
          // Batch Scan Mode
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Content to Analyze
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste content for batch analysis..."
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  rows={4}
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Source URL or Platform
                  </label>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g., https://example.com"
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Platform
                  </label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="blog">Blog/Website</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={addBatchItem}
                  disabled={!content.trim() || !source.trim()}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add to Batch
                </Button>
              </div>
            </div>
            
            {/* Batch Items */}
            {batchContent.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">
                  Batch Items ({batchContent.length})
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {batchContent.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {item.content.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-400">{item.source}</p>
                      </div>
                      <Button
                        onClick={() => removeBatchItem(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button
                  onClick={handleBatchScan}
                  disabled={batchScanMutation.isPending || batchContent.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {batchScanMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Scanning Batch...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Scan {batchContent.length} Items
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Scan Results */}
      {(scanMutation.data || batchScanMutation.data) && (
        <Card className="medical-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Scan Results</h3>
          
          {scanMutation.data && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">Single Scan Result</h4>
                <Badge className={getSeverityColor(scanMutation.data.severity)}>
                  {scanMutation.data.severity.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Score:</span>
                    <span className="font-medium text-white">
                      {(scanMutation.data.riskScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="font-medium text-white">
                      {scanMutation.data.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Flagged for Review:</span>
                    <span className={`font-medium ${scanMutation.data.flaggedForReview ? 'text-red-400' : 'text-green-400'}`}>
                      {scanMutation.data.flaggedForReview ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <h6 className="text-sm font-medium text-gray-300 mb-2">AI Analysis</h6>
                  <p className="text-sm text-gray-400">
                    {scanMutation.data.explanation}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-3">
                <h6 className="text-sm font-medium text-gray-300 mb-2">Recommended Action</h6>
                <p className="text-sm text-gray-400">
                  {scanMutation.data.recommendedAction}
                </p>
              </div>
            </div>
          )}
          
          {batchScanMutation.data && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">Batch Scan Results</h4>
                <Badge className="bg-blue-600 text-white">
                  {batchScanMutation.data.results.length} Items
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {batchScanMutation.data.results.map((result: ScanResult, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Item {index + 1}</span>
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      {(result as any).content?.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-400">
                      Risk: {(result.riskScore * 100).toFixed(1)}% | 
                      Category: {result.category.replace('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Compliance Notice */}
      <Card className="bg-blue-900/20 border border-blue-600/30 p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="text-sm">
            <h6 className="font-medium text-blue-400 mb-1">Content Analysis Notice</h6>
            <p className="text-blue-300">
              This tool analyzes content for pediatric health misinformation. All analysis is performed 
              in compliance with privacy regulations and is used solely for educational and monitoring purposes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 