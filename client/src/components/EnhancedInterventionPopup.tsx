import React, { useEffect, useRef } from 'react';

import { X } from 'lucide-react';

interface Intervention {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Classification {
  type: 'required' | 'helpful' | 'harmful' | 'neutral';
  severity: 'low' | 'moderate' | 'severe';
}

interface EvidenceSource {
  caseId: string;
  section: string;
  passageId: number;
  sourceCitation: string;
  license: string;
}

interface EnhancedInterventionPopupProps {
  isOpen: boolean;
  onClose: (isAutoClose?: boolean) => void;
  intervention: Intervention | null;
  classification: Classification;
  vitalsBefore: any;
  vitalsAfter: any;
  ragInsights: string[];
  evidenceSources: EvidenceSource[];
  clinicalGuidance?: string;
  suggestedNextSteps?: string[];
  autoCloseDelay?: number; // milliseconds, 0 to disable
}

export default function EnhancedInterventionPopup({
  isOpen,
  onClose,
  intervention,
  classification,
  vitalsBefore,
  vitalsAfter,
  ragInsights,
  evidenceSources,
  clinicalGuidance,
  suggestedNextSteps = [],
  autoCloseDelay = 10000 // 10 seconds default
}: EnhancedInterventionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close functionality
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      autoCloseTimeoutRef.current = setTimeout(() => {
        onClose(true); // Pass true to indicate auto-close
      }, autoCloseDelay);
    }

    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, [isOpen, autoCloseDelay, onClose]);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (isOpen && popupRef.current) {
      const firstFocusableElement = popupRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !intervention) return null;

  const getClassificationColor = (type: string) => {
    switch (type) {
      case 'required':
        return 'bg-blue-900/30 text-blue-300 border-blue-700/50';
      case 'helpful':
        return 'bg-green-900/30 text-green-300 border-green-700/50';
      case 'harmful':
        return 'bg-red-900/30 text-red-300 border-red-700/50';
      case 'neutral':
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const getClassificationIcon = (type: string) => {
    switch (type) {
      case 'required':
        return '🔵';
      case 'helpful':
        return '✅';
      case 'harmful':
        return '❌';
      case 'neutral':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-900/30 text-green-300';
      case 'moderate':
        return 'bg-amber-900/30 text-amber-300';
      case 'severe':
        return 'bg-red-900/30 text-red-300';
      default:
        return 'bg-slate-700/50 text-slate-300';
    }
  };

  const generateGroundedExplanation = (): string => {
    let explanation = '';
    
    // Start with intervention description
    explanation += `${intervention.description} `;
    
    // Add classification-specific context
    switch (classification.type) {
      case 'required':
        explanation += 'This intervention is essential for patient safety and follows established clinical guidelines. ';
        break;
      case 'helpful':
        explanation += 'This intervention provides additional benefit and supports optimal patient outcomes. ';
        break;
      case 'harmful':
        explanation += 'This intervention may delay definitive care or cause complications. ';
        break;
      case 'neutral':
        explanation += 'This intervention does not significantly impact the current clinical situation. ';
        break;
    }
    
    // Add severity context
    explanation += `The patient's current condition is ${classification.severity} severity, requiring appropriate clinical attention. `;
    
    // Add RAG insights if available
    if (ragInsights.length > 0) {
      explanation += ragInsights[0] + ' ';
    }
    
    return explanation.trim();
  };

  const getTopCitations = () => {
    // Return top 3 citations as specified in requirements
    return evidenceSources.slice(0, 3);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intervention-popup-title"
    >
      <div 
        ref={popupRef}
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getClassificationIcon(classification.type)}</span>
            <div>
              <h2 id="intervention-popup-title" className="text-xl font-semibold text-slate-200">
                Intervention Applied: {intervention.name}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getClassificationColor(classification.type)}`}>
                  {classification.type.charAt(0).toUpperCase() + classification.type.slice(1)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(classification.severity)}`}>
                  {classification.severity.charAt(0).toUpperCase() + classification.severity.slice(1)} Severity
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-slate-400 hover:text-slate-300 transition-colors"
            aria-label="Close clinical guidance popup"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Clinical Guidance - Primary Section */}
          <div>
            <h3 className="text-lg font-medium text-slate-200 mb-3 flex items-center gap-2">
              <span className="text-purple-400">🧠</span>
              Clinical Guidance
            </h3>
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-lg p-4">
              {clinicalGuidance ? (
                <p className="text-slate-300 leading-relaxed">
                  {clinicalGuidance}
                </p>
              ) : (
                <p className="text-slate-400 italic">
                  No guidance available for this action
                </p>
              )}
            </div>
          </div>

          {/* Suggested Next Steps - Optional Section */}
          {suggestedNextSteps && suggestedNextSteps.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-slate-200 mb-3 flex items-center gap-2">
                <span className="text-blue-400">🎯</span>
                Suggested Next Steps
              </h3>
              <div className="bg-blue-950/20 border border-blue-500/30 rounded-lg p-4">
                <ul className="space-y-2">
                  {suggestedNextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300">
                      <span className="text-blue-400 font-medium text-sm mt-0.5">•</span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}



          {/* Risk Assessment (for harmful interventions) */}
          {classification.type === 'harmful' && (
            <div>
              <h3 className="text-lg font-medium text-red-300 mb-3">
                ⚠️ Risk Assessment
              </h3>
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <p className="text-red-300">
                  This intervention may delay definitive care or cause complications. Consider alternative approaches that align with current clinical guidelines.
                </p>
              </div>
            </div>
          )}

          {/* Evidence Sources */}
          <div>
            <h3 className="text-lg font-medium text-slate-200 mb-3">
              Evidence Sources
            </h3>
            <div className="space-y-3">
              {getTopCitations().map((source, index) => (
                <div key={index} className="bg-slate-700/30 border border-slate-600 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400 font-medium text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-200 font-medium">
                        {source.sourceCitation}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Section: {source.section} | License: {source.license}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            {autoCloseDelay > 0 && (
              <span>Auto-closes in {Math.ceil(autoCloseDelay / 1000)}s</span>
            )}
          </div>
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

