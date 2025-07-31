import React from 'react';
import MisinformationScanner from '../components/MisinformationScanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface MisinfoLog {
  id: number;
  title: string;
  content: string;
  source: string;
  platform: string;
  riskScore: number;
  category: string;
  detectedAt: string;
  explanation?: string;
  flaggedClaims?: Array<{
    text: string;
    explanation: string;
    recommendation: string;
  }>;
}

export default function MisinformationMonitor() {
  // Fetch logs
  const { data: logs = [] } = useQuery({
    queryKey: ['misinfo-logs'],
    queryFn: async () => {
      const response = await fetch('/api/misinfo-logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json() as Promise<MisinfoLog[]>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getSeverityColor = (riskScore: number) => {
    if (riskScore >= 0.8) return 'bg-red-100 text-red-800';
    if (riskScore >= 0.6) return 'bg-orange-100 text-orange-800';
    if (riskScore >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getSeverityLabel = (riskScore: number) => {
    if (riskScore >= 0.8) return 'Critical';
    if (riskScore >= 0.6) return 'High';
    if (riskScore >= 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Misinformation Monitor</h1>
        <p className="text-gray-600">AI-powered detection of pediatric health misinformation</p>
      </div>

      {/* Scanner Component */}
      <MisinformationScanner />

      {/* Visual Explanation Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
          <CardDescription>Recent content analysis with detailed explanations</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No analysis logs yet. Start by scanning some content above.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{log.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {log.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Source: {log.source}</span>
                        <span>Platform: {log.platform}</span>
                        <span>Category: {log.category.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className={getSeverityColor(log.riskScore)}>
                        {getSeverityLabel(log.riskScore)}
                      </Badge>
                      <div className="text-sm font-medium">
                        {(log.riskScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.detectedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {log.explanation && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <h4 className="text-sm font-medium text-blue-900 mb-1">AI Analysis</h4>
                      <p className="text-sm text-blue-800">{log.explanation}</p>
                    </div>
                  )}

                  {/* Flagged Claims */}
                  {log.flaggedClaims && log.flaggedClaims.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">Flagged Claims</h4>
                      {log.flaggedClaims.map((claim, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <div className="font-medium text-sm text-yellow-900">{claim.text}</div>
                          <div className="text-xs text-yellow-700 mt-1">{claim.explanation}</div>
                          <div className="text-xs text-blue-700 mt-1">{claim.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
