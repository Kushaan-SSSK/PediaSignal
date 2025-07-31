import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/use-toast';

interface MisinfoScanResult {
  riskScore: number;
  category: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  flaggedClaims?: Array<{
    text: string;
    explanation: string;
    recommendation: string;
  }>;
  title?: string;
  scrapedContent?: string;
}

interface MisinfoStats {
  totalScans: number;
  highRiskCount: number;
  averageRiskScore: number;
  categories: Record<string, number>;
}

export default function MisinformationScanner() {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [platform, setPlatform] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchItems, setBatchItems] = useState<Array<{ content: string; source: string; platform: string }>>([]);
  const [userFeedback, setUserFeedback] = useState<'agree' | 'disagree' | null>(null);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const { toast } = useToast();

  // Single scan mutation
  const scanMutation = useMutation({
    mutationFn: async (data: { content: string; source: string; platform: string }) => {
      const response = await fetch('/api/misinfo-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Scan failed');
      return response.json() as Promise<MisinfoScanResult>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Scan Complete',
        description: `Risk Score: ${(data.riskScore * 100).toFixed(1)}% - ${data.severity.toUpperCase()}`,
      });
    },
    onError: () => {
      toast({
        title: 'Scan Failed',
        description: 'Failed to analyze content. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Batch scan mutation
  const batchScanMutation = useMutation({
    mutationFn: async (items: Array<{ content: string; source: string; platform: string }>) => {
      const response = await fetch('/api/misinfo-scan-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error('Batch scan failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Batch Scan Complete',
        description: `Processed ${data.length} items successfully`,
      });
    },
    onError: () => {
      toast({
        title: 'Batch Scan Failed',
        description: 'Failed to process batch. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (data: { 
      logId: number; 
      feedback: 'agree' | 'disagree'; 
      reason?: string 
    }) => {
      const response = await fetch('/api/misinfo-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Feedback submission failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback!',
      });
    },
    onError: () => {
      toast({
        title: 'Feedback Failed',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Web scraping mutation
  const scrapeMutation = useMutation({
    mutationFn: async (data: { url: string; platform: string }) => {
      const response = await fetch('/api/scrape-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Scraping failed');
      return response.json() as Promise<MisinfoScanResult>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Web Scraping Complete',
        description: `Analyzed content from ${data.title || 'webpage'}`,
      });
    },
    onError: () => {
      toast({
        title: 'Scraping Failed',
        description: 'Failed to scrape and analyze the webpage. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Fetch statistics
  const { data: stats = {} as MisinfoStats } = useQuery({
    queryKey: ['misinfo-stats'],
    queryFn: async () => {
      const response = await fetch('/api/misinfo-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json() as Promise<MisinfoStats>;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleSingleScan = () => {
    if (!content.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter content to scan.',
        variant: 'destructive',
      });
      return;
    }
    scanMutation.mutate({ content, source, platform });
  };

  const handleBatchScan = () => {
    if (batchItems.length === 0) {
      toast({
        title: 'No Items',
        description: 'Please add items to batch scan.',
        variant: 'destructive',
      });
      return;
    }
    batchScanMutation.mutate(batchItems);
  };

  const addBatchItem = () => {
    if (!content.trim()) return;
    setBatchItems([...batchItems, { content, source, platform }]);
    setContent('');
    setSource('');
    setPlatform('');
  };

  const removeBatchItem = (index: number) => {
    setBatchItems(batchItems.filter((_, i) => i !== index));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFeedback = (feedback: 'agree' | 'disagree') => {
    if (!scanMutation.data) return;
    
    setUserFeedback(feedback);
    feedbackMutation.mutate({
      logId: (scanMutation.data as any).logId || 0,
      feedback,
      reason: feedback === 'disagree' ? 'User disagrees with analysis' : 'User agrees with analysis'
    });
  };

  const handleWebScrape = () => {
    if (!scrapeUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a URL to scrape and analyze.',
        variant: 'destructive',
      });
      return;
    }
    scrapeMutation.mutate({ url: scrapeUrl, platform: 'web' });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Misinformation Monitor Dashboard</CardTitle>
          <CardDescription>Real-time monitoring statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalScans || 0}</div>
              <div className="text-sm text-gray-600">Total Scans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.highRiskCount || 0}</div>
              <div className="text-sm text-gray-600">High Risk Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.averageRiskScore ? (stats.averageRiskScore * 100).toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-gray-600">Avg Risk Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(stats.categories || {}).length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              variant={!batchMode ? 'default' : 'outline'}
              onClick={() => setBatchMode(false)}
            >
              Single Scan
            </Button>
            <Button
              variant={batchMode ? 'default' : 'outline'}
              onClick={() => setBatchMode(true)}
            >
              Batch Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Content Analysis</CardTitle>
          <CardDescription>
            {batchMode ? 'Add multiple items for batch processing' : 'Analyze content for misinformation'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Web Scraping Section */}
          <div className="border-b pb-4">
            <Label htmlFor="scrape-url">Web Scraping</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="scrape-url"
                placeholder="https://example.com/article"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleWebScrape}
                disabled={scrapeMutation.isPending || !scrapeUrl.trim()}
              >
                {scrapeMutation.isPending ? (
                  <>
                    <Progress value={33} className="w-4 h-4 mr-2" />
                    Scraping...
                  </>
                ) : (
                  'Scrape & Analyze'
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Content to Analyze</Label>
            <Textarea
              id="content"
              placeholder="Paste the content you want to analyze for misinformation..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source">Source URL (Optional)</Label>
              <Input
                id="source"
                placeholder="https://example.com/article"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="blog">Blog/Website</SelectItem>
                  <SelectItem value="news">News Article</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {batchMode ? (
            <div className="space-y-4">
              <Button onClick={addBatchItem} disabled={!content.trim()}>
                Add to Batch
              </Button>
              
              {batchItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Batch Items ({batchItems.length})</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {batchItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate">{item.content.substring(0, 50)}...</div>
                          <div className="text-xs text-gray-500">{item.source || 'No source'} • {item.platform || 'No platform'}</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBatchItem(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={handleBatchScan}
                    disabled={batchScanMutation.isPending}
                    className="w-full"
                  >
                    {batchScanMutation.isPending ? (
                      <>
                        <Progress value={33} className="w-4 h-4 mr-2" />
                        Processing Batch...
                      </>
                    ) : (
                      `Process ${batchItems.length} Items`
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Button 
              onClick={handleSingleScan}
              disabled={scanMutation.isPending || !content.trim()}
              className="w-full"
            >
              {scanMutation.isPending ? (
                <>
                  <Progress value={33} className="w-4 h-4 mr-2" />
                  Analyzing Content...
                </>
              ) : (
                'Analyze Content'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {scanMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {(scanMutation.data.riskScore * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Risk Score</div>
              </div>
              <Badge className={getSeverityColor(scanMutation.data.severity)}>
                {scanMutation.data.severity.toUpperCase()}
              </Badge>
            </div>

            <div>
              <Label>Category</Label>
              <div className="text-sm font-medium capitalize">{scanMutation.data.category.replace('_', ' ')}</div>
            </div>

            <div>
              <Label>Analysis</Label>
              <div className="text-sm text-gray-700 mt-1">{scanMutation.data.explanation}</div>
            </div>

            {scanMutation.data.flaggedClaims && scanMutation.data.flaggedClaims.length > 0 && (
              <div>
                <Label>Flagged Claims</Label>
                <div className="space-y-2 mt-2">
                  {scanMutation.data.flaggedClaims.map((claim, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="font-medium text-sm">{claim.text}</div>
                      <div className="text-xs text-gray-600 mt-1">{claim.explanation}</div>
                      <div className="text-xs text-blue-600 mt-1">{claim.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            <div className="border-t pt-4">
              <Label>Was this analysis helpful?</Label>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant={userFeedback === 'agree' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFeedback('agree')}
                  disabled={feedbackMutation.isPending}
                >
                  👍 Agree
                </Button>
                <Button
                  variant={userFeedback === 'disagree' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleFeedback('disagree')}
                  disabled={feedbackMutation.isPending}
                >
                  👎 Disagree
                </Button>
              </div>
              {feedbackMutation.isPending && (
                <div className="text-xs text-gray-500 mt-1">Submitting feedback...</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 