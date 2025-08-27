import React from 'react';
import { X, Trophy, AlertTriangle, CheckCircle, BookOpen, RotateCcw, ArrowLeft } from 'lucide-react';
import { SimpleFeedbackResult } from '@/lib/simpleFeedback';

interface SimpleFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbackResult: SimpleFeedbackResult;
  onRestartCase: () => void;
  onBackToCases: () => void;
}

export function SimpleFeedbackModal({
  isOpen,
  onClose,
  feedbackResult,
  onRestartCase,
  onBackToCases
}: SimpleFeedbackModalProps) {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <Trophy className="w-8 h-8 text-green-400" />;
    if (score >= 80) return <CheckCircle className="w-8 h-8 text-blue-400" />;
    if (score >= 70) return <BookOpen className="w-8 h-8 text-yellow-400" />;
    return <AlertTriangle className="w-8 h-8 text-red-400" />;
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-labelledby="feedback-modal-title"
      aria-describedby="feedback-modal-description"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            {getScoreIcon(feedbackResult.finalScorePercent)}
            <div>
              <h2 id="feedback-modal-title" className="text-2xl font-bold text-white">
                Case Finished
              </h2>
              <p className="text-slate-400">Review your performance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close feedback modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Score Section */}
        <div className="p-6 border-b border-slate-700">
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(feedbackResult.finalScorePercent)} mb-2`}>
              {feedbackResult.finalScorePercent}%
            </div>
            <div className="text-slate-400 text-lg">
              Final Score
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="text-center">
                <div className="text-green-400 text-xl font-semibold">{feedbackResult.correctCount}</div>
                <div className="text-xs text-slate-500">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 text-xl font-semibold">{feedbackResult.incorrectCount}</div>
                <div className="text-xs text-slate-500">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-xl font-semibold">{feedbackResult.ignoredCount}</div>
                <div className="text-xs text-slate-500">Ignored</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Sections */}
        <div id="feedback-modal-description" className="p-6 space-y-6">
          {/* Critical Misses */}
          {feedbackResult.feedback.critical_misses.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold text-lg mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Critical Misses
              </h3>
              <div className="space-y-3">
                {feedbackResult.feedback.critical_misses.map((item, index) => (
                  <div key={index} className="bg-slate-800/50 rounded p-3">
                    <div className="text-white font-medium mb-1">
                      Stage {item.stageNumber}: {item.label}
                    </div>
                    <div className="text-red-300 text-sm mb-1">
                      <strong>What went wrong:</strong> {item.what_went_wrong}
                    </div>
                    <div className="text-slate-300 text-sm mb-1">
                      <strong>Why wrong:</strong> {item.why_wrong}
                    </div>
                    <div className="text-blue-300 text-sm">
                      <strong>How to improve:</strong> {item.how_to_improve}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Harmful Actions */}
          {feedbackResult.feedback.harmful_actions.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h3 className="text-orange-400 font-semibold text-lg mb-3 flex items-center">
                <X className="w-5 h-5 mr-2" />
                Harmful Actions Taken
              </h3>
              <div className="space-y-3">
                {feedbackResult.feedback.harmful_actions.map((item, index) => (
                  <div key={index} className="bg-slate-800/50 rounded p-3">
                    <div className="text-white font-medium mb-1">
                      Stage {item.stageNumber}: {item.label}
                    </div>
                    <div className="text-orange-300 text-sm mb-1">
                      <strong>What went wrong:</strong> {item.what_went_wrong}
                    </div>
                    <div className="text-slate-300 text-sm mb-1">
                      <strong>Why wrong:</strong> {item.why_wrong}
                    </div>
                    <div className="text-blue-300 text-sm">
                      <strong>How to improve:</strong> {item.how_to_improve}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prioritization Tips */}
          {feedbackResult.feedback.prioritization_tips.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold text-lg mb-3 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Prioritization & Optimization Tips
              </h3>
              <ul className="space-y-2">
                {feedbackResult.feedback.prioritization_tips.map((tip, index) => (
                  <li key={index} className="text-slate-300 text-sm flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Positive Reinforcement */}
          {feedbackResult.feedback.positives.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold text-lg mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                What You Did Well
              </h3>
              <ul className="space-y-2">
                {feedbackResult.feedback.positives.map((positive, index) => (
                  <li key={index} className="text-slate-300 text-sm flex items-start">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                    {positive}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-6 pb-4">
          <div className="text-xs text-slate-500 italic text-center">
            {feedbackResult.disclaimer}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4 p-6 border-t border-slate-700">
          <button
            onClick={onRestartCase}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            aria-label="Restart this case"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Case</span>
          </button>
          <button
            onClick={onBackToCases}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            aria-label="Go back to case selection"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cases</span>
          </button>
        </div>
      </div>
    </div>
  );
}