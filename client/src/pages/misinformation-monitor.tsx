import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Globe, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Bell,
  TrendingUp,
  Eye,
  Clock
} from "lucide-react";
import Header from "@/components/Header";

// Mock user
const mockUser = {
  id: 1,
  name: "Dr. Sarah Johnson",
  role: "pediatrician",
};

export default function MisinformationMonitor() {
  const { data: misinfoLogs, isLoading } = useQuery({
    queryKey: ['/api/misinfo-logs'],
    refetchInterval: 60000, // Refresh every minute for live monitoring
  });

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.8) return 'bg-red-600 text-white';
    if (riskScore >= 0.6) return 'bg-amber-600 text-white';
    if (riskScore >= 0.4) return 'bg-yellow-600 text-white';
    return 'bg-green-600 text-white';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore >= 0.8) return 'Critical';
    if (riskScore >= 0.6) return 'High Risk';
    if (riskScore >= 0.4) return 'Medium Risk';
    return 'Low Risk';
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vaccine':
        return 'bg-red-900/20 border-red-600/30 text-red-300';
      case 'treatment':
        return 'bg-amber-900/20 border-amber-600/30 text-amber-300';
      case 'emergency_care':
        return 'bg-red-900/20 border-red-600/30 text-red-300';
      default:
        return 'bg-blue-900/20 border-blue-600/30 text-blue-300';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  // Calculate metrics from logs
  const misinfoLogsData = misinfoLogs as any[] || [];
  const highRiskCount = misinfoLogsData.filter((log: any) => log.riskScore >= 0.7).length;
  const totalSources = 247; // This would come from a separate API endpoint
  const articlesAnalyzed = misinfoLogsData.length;

  return (
    <div className="min-h-screen medical-gradient">
      <Header user={mockUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Global Misinformation Monitor</h1>
          <p className="text-gray-300">Real-time monitoring of pediatric health misinformation across global platforms</p>
        </div>

        {/* Control Panel */}
        <Card className="medical-card p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-medium">Live Monitor Active</span>
              </div>
              <span className="text-gray-400 text-sm">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-red-600 hover:bg-red-700">
                <Bell className="w-4 h-4 mr-2" />
                Create Alert
              </Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Real-time Metrics */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="medical-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Live Metrics</h3>
              <div className="space-y-4">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Globe className="h-5 w-5 text-blue-400" />
                    <span className="text-2xl font-bold text-blue-400">{totalSources}</span>
                  </div>
                  <div className="text-sm text-gray-400">Sources Monitored</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="h-5 w-5 text-green-400" />
                    <span className="text-2xl font-bold text-green-400">{articlesAnalyzed}</span>
                  </div>
                  <div className="text-sm text-gray-400">Articles Analyzed</div>
                  <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <span className="text-2xl font-bold text-red-400">{highRiskCount}</span>
                  </div>
                  <div className="text-sm text-gray-400">High-Risk Detected</div>
                  <div className="text-xs text-gray-500 mt-1">Flagged for review</div>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    <span className="text-2xl font-bold text-purple-400">94.2%</span>
                  </div>
                  <div className="text-sm text-gray-400">Detection Accuracy</div>
                </div>
              </div>
            </Card>

            {/* Category Breakdown */}
            <Card className="medical-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Risk by Category</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Vaccine</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full w-3/4"></div>
                    </div>
                    <span className="text-red-400 text-sm font-medium">12</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Treatment</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div className="bg-amber-400 h-2 rounded-full w-1/2"></div>
                    </div>
                    <span className="text-amber-400 text-sm font-medium">8</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Emergency Care</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full w-1/3"></div>
                    </div>
                    <span className="text-red-400 text-sm font-medium">3</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">General</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full w-1/4"></div>
                    </div>
                    <span className="text-blue-400 text-sm font-medium">5</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent High-Risk Content */}
          <div className="lg:col-span-3">
            <Card className="medical-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Recent High-Risk Content</h3>
                <div className="flex space-x-2">
                  <Badge className="bg-red-600/20 text-red-400">
                    {highRiskCount} Critical Alerts
                  </Badge>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800/30 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : misinfoLogsData.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {misinfoLogsData
                    .sort((a: any, b: any) => b.riskScore - a.riskScore)
                    .slice(0, 20)
                    .map((log: any) => (
                    <Card
                      key={log.id}
                      className={`border ${getCategoryColor(log.category)} bg-gray-800/30`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-white">{log.title}</h4>
                              <Badge className={getRiskColor(log.riskScore)}>
                                {getRiskLabel(log.riskScore)} ({log.riskScore.toFixed(2)})
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                              "{log.content.substring(0, 150)}..."
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-4 text-gray-500">
                            <span className="flex items-center">
                              <Globe className="h-3 w-3 mr-1" />
                              {log.platform}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimeAgo(log.detectedAt)}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {log.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No misinformation detected</h3>
                  <p className="text-gray-500">The monitoring system is active and scanning content.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
