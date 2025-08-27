import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Target,
  Clock,
  Activity
} from 'lucide-react';

interface InterventionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  intervention: {
    id: string;
    name: string;
    description: string;
    category: string;
  };
  success: boolean;
  complications?: string[];
  ragInsights?: string[];
  evidenceSources?: Array<{
    caseId: string;
    section: string;
    passageId: number;
    sourceCitation: string;
    license: string;
  }>;
  physiologicalGuardrails?: {
    vitalChanges: Array<{
      vital: string;
      before: string | number;
      after: string | number;
      status: 'improved' | 'worsened' | 'stable';
    }>;
    safetyChecks: string[];
    contraindications: string[];
  };
}

export function InterventionPopup({
  isOpen,
  onClose,
  intervention,
  success,
  complications = [],
  ragInsights = [],
  evidenceSources = [],
  physiologicalGuardrails
}: InterventionPopupProps) {
  // Debug logging
  console.log('InterventionPopup render:', { isOpen, intervention: intervention?.name });
  
  // Use useRef to store timer ID and countdown
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = React.useState<number>(3);
  
  // Auto-close after 3 seconds with visible countdown
  useEffect(() => {
    console.log('InterventionPopup useEffect triggered:', { isOpen });
    
    if (isOpen) {
      console.log('Setting timer for 3 seconds...');
      setCountdown(3);
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Use setInterval for countdown and then setTimeout for final close
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          const newCount = prev - 1;
          console.log('Countdown:', newCount);
          
          if (newCount <= 0) {
            clearInterval(countdownInterval);
            console.log('Countdown finished, calling onClose');
            onClose();
            return 0;
          }
          return newCount;
        });
      }, 1000);
      
      // Fallback setTimeout in case setInterval fails
      timerRef.current = setTimeout(() => {
        console.log('Fallback timer expired, calling onClose');
        clearInterval(countdownInterval);
        onClose();
      }, 4000);
      
      console.log('Timer and countdown set');
    }
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        console.log('Cleaning up timer:', timerRef.current);
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getStatusIcon = () => {
    if (success) {
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    }
    return <XCircle className="w-8 h-8 text-red-500" />;
  };

  const getStatusColor = () => {
    if (success) {
      return 'border-green-500 bg-green-950';
    }
    return 'border-red-500 bg-red-950';
  };

  const getStatusText = () => {
    if (success) {
      return 'Intervention Successful';
    }
    return 'Intervention Failed';
  };

  const getStatusDescription = () => {
    if (success) {
      return 'The intervention was applied successfully and produced the expected clinical response.';
    }
    return 'The intervention did not achieve the desired outcome. Consider alternative approaches.';
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-2xl ${getStatusColor()} border-2`}>
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            {getStatusIcon()}
            <div>
              <CardTitle className={`text-2xl font-bold ${success ? 'text-green-400' : 'text-red-400'}`}>
                {getStatusText()}
              </CardTitle>
              <p className="text-slate-300 text-sm mt-1">
                {intervention.name}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* What You Did */}
          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              What You Did
            </h3>
            <p className="text-slate-300 text-sm">
              {intervention.description}
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {intervention.category}
              </Badge>
            </div>
          </div>

          {/* Why It Works */}
          {success && ragInsights.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Why It Works
              </h3>
              <div className="space-y-2">
                {ragInsights.slice(0, 2).map((insight, index) => (
                  <div key={index} className="text-slate-300 text-sm">
                    • {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expected Vital Changes */}
          {physiologicalGuardrails && physiologicalGuardrails.vitalChanges.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Expected Vital Changes
              </h3>
              <div className="space-y-2">
                {physiologicalGuardrails.vitalChanges.map((change, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-700 rounded-lg p-2">
                    <span className="text-slate-300 text-sm font-medium">{change.vital}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs">{change.before} → {change.after}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        change.status === 'improved' ? 'bg-green-500/20 text-green-400' :
                        change.status === 'worsened' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {change.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-close indicator */}
          <div className="text-center pt-2">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>Auto-closing in {countdown} seconds</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
            >
              Close Now
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
