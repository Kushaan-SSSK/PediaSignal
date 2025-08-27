import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  BookOpen,
  Users,
  Activity,
  Award,
  RefreshCw
} from 'lucide-react';
import { EvidenceChips } from './EvidenceChips';
import { LicenseBanner } from './LicenseBanner';

interface DebriefInsights {
  objectives: Array<{
    id: string;
    text: string;
    status: 'completed' | 'partially' | 'not-met';
    score: number;
    evidenceSources: Array<{
      caseId: string;
      section: string;
      passageId: number;
      sourceCitation: string;
      license: string;
    }>;
    whatWentWell: string[];
    improvements: string[];
    timeToComplete?: number;
  }>;
  evidenceSources: Array<{
    caseId: string;
    section: string;
    passageId: number;
    sourceCitation: string;
    license: string;
  }>;
  riskFlags: string[];
  recommendations: string[];
  clinicalReasoning: string;
}

interface DebriefScreenProps {
  simulationId: number;
  caseName: string;
  totalTime: number;
  finalScore: number;
  debriefInsights: DebriefInsights;
  license: string;
  sourceVersion: string;
  attribution: string;
  onRestart?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function DebriefScreen({
  simulationId,
  caseName,
  totalTime,
  finalScore,
  debriefInsights,
  license,
  sourceVersion,
  attribution,
  onRestart,
  onViewDetails,
  className = ''
}: DebriefScreenProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partially': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'not-met': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'partially': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'not-met': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const overallScore = debriefInsights.objectives.reduce((sum, obj) => sum + obj.score, 0) / debriefInsights.objectives.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Award className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Simulation Complete!</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          {caseName} - Simulation #{simulationId}
        </p>
      </div>

      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {finalScore}%
              </div>
              <div className="text-sm text-muted-foreground">Final Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatTime(totalTime)}
              </div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(overallScore)}%
              </div>
              <div className="text-sm text-muted-foreground">Objective Score</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{Math.round(overallScore)}%</span>
            </div>
            <Progress value={overallScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Learning Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Objectives
            <Badge variant="outline" className="ml-auto">
              {debriefInsights.objectives.length} objectives
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {debriefInsights.objectives.map((objective, index) => (
            <div key={objective.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(objective.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{objective.text}</h4>
                    <Badge variant={getScoreVariant(objective.score)} className="text-xs">
                      {objective.score}%
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(objective.status)}`}>
                      {objective.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        What Went Well
                      </h5>
                      <ul className="space-y-1">
                        {objective.whatWentWell.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                        Areas for Improvement
                      </h5>
                      <ul className="space-y-1">
                        {objective.improvements.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {objective.timeToComplete && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Time to complete: {formatTime(objective.timeToComplete)}
                    </div>
                  )}
                </div>
              </div>
              
              {index < debriefInsights.objectives.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Evidence Sources */}
      {debriefInsights.evidenceSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Evidence Sources
              <Badge variant="outline" className="ml-auto">
                {debriefInsights.evidenceSources.length} sources
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EvidenceChips 
              evidenceSources={debriefInsights.evidenceSources}
              className="mb-4"
            />
            <p className="text-sm text-muted-foreground">
              These evidence sources support the clinical decisions and learning objectives in this simulation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Risk Flags */}
      {debriefInsights.riskFlags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Risk Factors Identified
              <Badge variant="outline" className="ml-auto">
                {debriefInsights.riskFlags.length} risks
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debriefInsights.riskFlags.map((risk, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{risk}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              These risk factors were identified during the simulation and should be addressed in future practice.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {debriefInsights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recommendations for Future Practice
              <Badge variant="outline" className="ml-auto">
                {debriefInsights.recommendations.length} recommendations
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {debriefInsights.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinical Reasoning */}
      {debriefInsights.clinicalReasoning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Clinical Reasoning Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {debriefInsights.clinicalReasoning}
            </p>
          </CardContent>
        </Card>
      )}

      {/* License Banner */}
      <LicenseBanner
        license={license}
        sourceVersion={sourceVersion}
        attribution={attribution}
        variant="footer"
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-6">
        {onRestart && (
          <Button onClick={onRestart} size="lg" className="min-w-[140px]">
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Case
          </Button>
        )}
        
        {onViewDetails && (
          <Button variant="outline" onClick={onViewDetails} size="lg" className="min-w-[140px]">
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}
