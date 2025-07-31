import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  BookOpen, 
  Target,
  Clock,
  Star,
  TrendingUp,
  FileText,
  Download
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SimulationFeedbackProps {
  sessionId: string;
  caseId: string;
  appliedInterventions: string[];
  timestamps: { intervention: string; time: Date }[];
  onClose: () => void;
  onRestart: () => void;
}

interface FeedbackData {
  summary: string;
  missedActions: string[];
  unnecessaryActions: string[];
  suggestions: string[];
  finalScore: number;
  outcome: 'excellent' | 'good' | 'fair' | 'poor';
  caseDefinition: {
    name: string;
    learningObjectives: string[];
    references: string[];
  };
}

export default function SimulationFeedback({
  sessionId,
  caseId,
  appliedInterventions,
  timestamps,
  onClose,
  onRestart
}: SimulationFeedbackProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const { toast } = useToast();

  const evaluationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/evaluate-simulation', {
        sessionId,
        caseId,
        appliedInterventions,
        timestamps
      });
      return response.json();
    },
    onSuccess: (data) => {
      setFeedback(data.feedback);
      setIsEvaluating(false);
      
      toast({
        title: "Evaluation Complete",
        description: `Score: ${data.feedback.finalScore}% - ${data.feedback.outcome.toUpperCase()}`,
        variant: data.feedback.outcome === 'excellent' || data.feedback.outcome === 'good' ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      setIsEvaluating(false);
      toast({
        title: "Evaluation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEvaluate = () => {
    setIsEvaluating(true);
    evaluationMutation.mutate();
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'excellent':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'good':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'fair':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'poor':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="medical-card w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Simulation Evaluation</h2>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ×
            </Button>
          </div>

          {!feedback ? (
            // Evaluation Setup
            <div className="space-y-6">
              <div className="text-center">
                <Target className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Ready to Evaluate Your Performance
                </h3>
                <p className="text-gray-300">
                  Review your actions and receive detailed feedback on your pediatric emergency management skills.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-white mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      Actions Taken
                    </h4>
                    <div className="space-y-2">
                      {appliedInterventions.map((intervention, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span className="text-sm text-gray-300">
                            {intervention.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-white mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-400" />
                      Time Analysis
                    </h4>
                    <div className="space-y-2">
                      {timestamps.map((timestamp, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">
                            {timestamp.intervention.replace('_', ' ')}
                          </span>
                          <span className="text-gray-400">
                            {timestamp.time.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isEvaluating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Evaluate Performance
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Feedback Results
            <div className="space-y-6">
              {/* Score and Outcome */}
              <div className="text-center">
                <div className="mb-4">
                  <div className={`text-6xl font-bold ${getScoreColor(feedback.finalScore)}`}>
                    {feedback.finalScore}%
                  </div>
                  <Badge className={`mt-2 ${getOutcomeColor(feedback.outcome)}`}>
                    {feedback.outcome.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-300">{feedback.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Missed Actions */}
                <Card className="bg-red-900/20 border-red-600/30">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-red-400 mb-3 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Missed Critical Actions
                    </h4>
                    {feedback.missedActions.length > 0 ? (
                      <div className="space-y-2">
                        {feedback.missedActions.map((action, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <XCircle className="w-3 h-3 text-red-400 mt-0.5" />
                            <span className="text-sm text-red-300">{action}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-green-400">No critical actions missed!</p>
                    )}
                  </CardContent>
                </Card>

                {/* Unnecessary Actions */}
                <Card className="bg-yellow-900/20 border-yellow-600/30">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-yellow-400 mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Unnecessary Actions
                    </h4>
                    {feedback.unnecessaryActions.length > 0 ? (
                      <div className="space-y-2">
                        {feedback.unnecessaryActions.map((action, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5" />
                            <span className="text-sm text-yellow-300">{action}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-green-400">No unnecessary actions performed!</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Suggestions */}
              <Card className="bg-blue-900/20 border-blue-600/30">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-400 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Improvement Suggestions
                  </h4>
                  <div className="space-y-2">
                    {feedback.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-blue-300">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Objectives */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Learning Objectives
                  </h4>
                  <div className="space-y-2">
                    {feedback.caseDefinition.learningObjectives.map((objective, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-300">{objective}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* References */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    References
                  </h4>
                  <div className="space-y-2">
                    {feedback.caseDefinition.references.map((reference, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-400">{reference}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={onRestart}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 