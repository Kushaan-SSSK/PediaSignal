import React from 'react';
import { X, Trophy, Clock, Target, BookOpen, AlertTriangle } from 'lucide-react';

interface EvidenceSource {
  caseId: string;
  section: string;
  passageId: number;
  sourceCitation: string;
  license: string;
}

interface CaseCompletionDebriefProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: {
    name: string;
    category: string;
    difficulty: string;
    sourceVersion?: string;
    license?: string;
  };
  performance: {
    accuracy: number;
    timeScore: number;
    compositeScore: number;
    totalTime: number;
    expectedTime: number;
    interventionsApplied: number;
    requiredInterventions: number;
    harmfulActions: number;
  };
  feedback: {
    strengths: string[];
    areasForImprovement: string[];
    learningRecommendations: string[];
  };
  evidenceSources: EvidenceSource[];
  scoringResult?: {
    finalScore: number;
    rating: string;
    breakdown: {
      stages: Array<{
        stageNumber: number;
        score: number;
        maxPossible: number;
        breakdown: {
          required: number;
          helpful: number;
          neutral: number;
          harmful: number;
          missedRequired: number;
          timeouts: number;
          bonuses: number;
        };
      }>;
      total: {
        score: number;
        maxPossible: number;
        breakdown: {
          required: number;
          helpful: number;
          neutral: number;
          harmful: number;
          missedRequired: number;
          timeouts: number;
          bonuses: number;
        };
      };
    };
    configVersion: string;
  } | null;
}

export default function CaseCompletionDebrief({
  isOpen,
  onClose,
  caseData,
  performance,
  feedback,
  evidenceSources,
  scoringResult
}: CaseCompletionDebriefProps) {
  console.log('🎯 CaseCompletionDebrief - Received props:');
  console.log('  isOpen:', isOpen);
  console.log('  performance:', performance);
  console.log('  feedback:', feedback);
  console.log('  scoringResult:', scoringResult);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (score >= 80) return <Target className="w-6 h-6 text-blue-500" />;
    if (score >= 70) return <Clock className="w-6 h-6 text-yellow-500" />;
    if (score >= 60) return <AlertTriangle className="w-6 h-6 text-orange-500" />;
    return <AlertTriangle className="w-6 h-6 text-red-500" />;
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return 'Outstanding';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getTopCitations = () => {
    // Return top 6 citations as specified in requirements (3-6 citations)
    return evidenceSources.slice(0, 6);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getScoreIcon(performance.compositeScore)}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Case Completion Debrief
              </h2>
              <p className="text-gray-600">
                {caseData.name} - {caseData.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Performance Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Performance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Accuracy Score */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(performance.accuracy)}`}>
                  {performance.accuracy}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Accuracy Score</div>
                <div className="text-xs text-gray-500 mt-1">
                  {performance.interventionsApplied}/{performance.requiredInterventions} interventions applied
                </div>
              </div>

              {/* Time Score */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(performance.timeScore)}`}>
                  {performance.timeScore}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Time Efficiency</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.floor(performance.totalTime / 60)}m {performance.totalTime % 60}s
                </div>
              </div>

              {/* Composite Score */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(performance.compositeScore)}`}>
                  {performance.compositeScore}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Overall Score</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getPerformanceLevel(performance.compositeScore)}
                </div>
              </div>
            </div>
          </div>

          {/* Scoring System Results */}
          {scoringResult && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-green-600" />
                <span>Scoring System Results</span>
              </h3>
              
              {/* Final Score and Rating */}
              <div className="text-center mb-6">
                <div className={`text-5xl font-bold ${getScoreColor(scoringResult.finalScore)}`}>
                  {scoringResult.finalScore}/100
                </div>
                <div className="text-2xl font-semibold text-gray-700 mt-2">
                  {scoringResult.rating}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Config Version: {scoringResult.configVersion}
                </div>
              </div>

              {/* Stage Breakdown */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-800">Stage Breakdown</h4>
                {scoringResult.breakdown.stages.map((stage, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">Stage {stage.stageNumber}</span>
                      <span className={`text-lg font-bold ${getScoreColor(stage.score)}`}>
                        {stage.score}/{stage.maxPossible}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                      <div>Required: {stage.breakdown.required}</div>
                      <div>Helpful: {stage.breakdown.helpful}</div>
                      <div>Neutral: {stage.breakdown.neutral}</div>
                      <div>Harmful: {stage.breakdown.harmful}</div>
                      <div>Missed: {stage.breakdown.missedRequired}</div>
                      <div>Timeouts: {stage.breakdown.timeouts}</div>
                      <div>Bonuses: {stage.breakdown.bonuses}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Breakdown */}
              <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-lg font-medium text-gray-800 mb-3">Total Performance</h4>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-700">Final Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(scoringResult.breakdown.total.score)}`}>
                    {scoringResult.breakdown.total.score}/{scoringResult.breakdown.total.maxPossible}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>Required: {scoringResult.breakdown.total.breakdown.required}</div>
                  <div>Helpful: {scoringResult.breakdown.total.breakdown.helpful}</div>
                  <div>Neutral: {scoringResult.breakdown.total.breakdown.neutral}</div>
                  <div>Harmful: {scoringResult.breakdown.total.breakdown.harmful}</div>
                  <div>Missed: {scoringResult.breakdown.total.breakdown.missedRequired}</div>
                  <div>Timeouts: {scoringResult.breakdown.total.breakdown.timeouts}</div>
                  <div>Bonuses: {scoringResult.breakdown.total.breakdown.bonuses}</div>
                </div>
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Score Breakdown
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Clinical Accuracy (70%)</span>
                <span className="font-medium">{performance.accuracy}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${performance.accuracy}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Time Efficiency (30%)</span>
                <span className="font-medium">{performance.timeScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${performance.timeScore}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">Composite Score</span>
                <span className="font-bold text-lg">{performance.compositeScore}%</span>
              </div>
            </div>
          </div>

          {/* Clinical Feedback */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Clinical Feedback
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-green-900 mb-2">
                  ✅ Strengths
                </h4>
                <ul className="space-y-1">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-green-800">
                      • {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-yellow-900 mb-2">
                  📚 Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {feedback.areasForImprovement.map((area, index) => (
                    <li key={index} className="text-sm text-yellow-800">
                      • {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Learning Recommendations */}
          {feedback.learningRecommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Learning Recommendations
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {feedback.learningRecommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start">
                      <span className="text-blue-600 mr-2">📖</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Evidence Sources */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Evidence Sources
            </h3>
            <div className="space-y-3">
              {getTopCitations().map((source, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 font-medium text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">
                        {source.sourceCitation}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Section: {source.section} | License: {source.license}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attribution */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Source Attribution</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              {caseData.sourceVersion && (
                <p>Source: {caseData.sourceVersion}</p>
              )}
              {caseData.license && (
                <p>License: {caseData.license}</p>
              )}
              <p>This debrief is based on evidence from clinical guidelines and peer-reviewed literature.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close Debrief
          </button>
        </div>
      </div>
    </div>
  );
}

