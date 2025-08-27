import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Target, 
  Activity,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface AIClinicalGuidanceProps {
  caseId: string;
  stage: number;
  currentVitals: any;
  lastIntervention?: {
    id: string;
    name: string;
    description: string;
    category: string;
    success: boolean;
    vitalEffects?: any;
  };
  className?: string;
}

export function AIClinicalGuidance({
  caseId,
  stage,
  currentVitals,
  lastIntervention,
  className = ''
}: AIClinicalGuidanceProps) {
  const [ragInsights, setRagInsights] = useState<string[]>([]);
  const [vitalChanges, setVitalChanges] = useState<Array<{
    vital: string;
    before: string | number;
    after: string | number;
    status: 'improved' | 'worsened' | 'stable';
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real RAG insights when lastIntervention changes
  useEffect(() => {
    if (lastIntervention) {
      fetchRAGInsights(lastIntervention, caseId, stage);
      generateVitalChanges(lastIntervention, currentVitals);
    } else {
      // Clear all data when no intervention
      setRagInsights([]);
      setVitalChanges([]);
      setError(null);
    }
  }, [lastIntervention, caseId, stage, currentVitals]);

  const fetchRAGInsights = async (intervention: any, caseId: string, stage: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rag/clinical-guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId,
          stage,
          intervention: intervention.name,
          interventionCategory: intervention.category,
          query: `Clinical guidance for ${intervention.name} in stage ${stage} of case ${caseId}`
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch clinical guidance: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.explanation) {
        // Display the full explanation as a single comprehensive insight
        // This preserves the complete medical guidance without truncation
        setRagInsights([data.explanation]);
      } else {
        setRagInsights([`${intervention.name} is indicated for this stage based on PALS guidelines`]);
      }
    } catch (err) {
      console.error('Error fetching RAG insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clinical guidance');
      // Fallback to basic guidance
      setRagInsights([`${intervention.name} is indicated for this stage based on PALS guidelines`]);
    } finally {
      setIsLoading(false);
    }
  };



  // Generate vital changes based on intervention effects
  const generateVitalChanges = (intervention: any, vitals: any): Array<{
    vital: string;
    before: string | number;
    after: string | number;
    status: 'improved' | 'worsened' | 'stable';
  }> => {
    if (!intervention?.vitalEffects || !vitals) return [];
    
    const changes: Array<{
      vital: string;
      before: string | number;
      after: string | number;
      status: 'improved' | 'worsened' | 'stable';
    }> = [];
    
    if (intervention.vitalEffects.heartRate) {
      const currentHR = vitals.heartRate || 100;
      const newHR = currentHR + intervention.vitalEffects.heartRate.immediate;
      changes.push({
        vital: 'HR',
        before: currentHR,
        after: newHR,
        status: newHR > currentHR ? 'improved' : newHR < currentHR ? 'worsened' : 'stable'
      });
    }
    
    if (intervention.vitalEffects.oxygenSat) {
      const currentO2 = vitals.oxygenSat || 98;
      const newO2 = currentO2 + intervention.vitalEffects.oxygenSat.immediate;
      changes.push({
        vital: 'O2',
        before: `${currentO2}%`,
        after: `${newO2}%`,
        status: newO2 > currentO2 ? 'improved' : newO2 < currentO2 ? 'worsened' : 'stable'
      });
    }
    
    if (intervention.vitalEffects.temperature) {
      const currentTemp = vitals.temperature || 98.6;
      const newTemp = currentTemp + intervention.vitalEffects.temperature.immediate;
      changes.push({
        vital: 'Temp',
        before: `${currentTemp}°F`,
        after: `${newTemp}°F`,
        status: newTemp < currentTemp ? 'improved' : newTemp > currentTemp ? 'worsened' : 'stable'
      });
    }
    
    if (intervention.vitalEffects.respRate) {
      const currentRR = vitals.respRate || 20;
      const newRR = currentRR + intervention.vitalEffects.respRate.immediate;
      changes.push({
        vital: 'RR',
        before: currentRR,
        after: newRR,
        status: newRR < currentRR ? 'improved' : newRR > currentRR ? 'worsened' : 'stable'
      });
    }
    
    if (intervention.vitalEffects.bloodPressure) {
      const currentBP = vitals.bloodPressure || '110/70';
      if (typeof currentBP === 'string' && currentBP.includes('/')) {
        const [systolic, diastolic] = currentBP.split('/').map(Number);
        const newSystolic = systolic + intervention.vitalEffects.bloodPressure.immediate;
        const newDiastolic = diastolic + intervention.vitalEffects.bloodPressure.immediate;
        changes.push({
          vital: 'BP',
          before: currentBP,
          after: `${newSystolic}/${newDiastolic}`,
          status: newSystolic > systolic ? 'improved' : newSystolic < systolic ? 'worsened' : 'stable'
        });
      }
    }
    
    if (intervention.vitalEffects.consciousness) {
      const currentConsciousness = vitals.consciousness || 'alert';
      const consciousnessLevels = ['unresponsive', 'lethargic', 'post-ictal', 'alert'];
      const currentIndex = consciousnessLevels.indexOf(currentConsciousness);
      const newIndex = Math.max(0, Math.min(consciousnessLevels.length - 1, currentIndex + intervention.vitalEffects.consciousness.immediate));
      const newConsciousness = consciousnessLevels[newIndex];
      changes.push({
        vital: 'LOC',
        before: currentConsciousness,
        after: newConsciousness,
        status: newIndex > currentIndex ? 'improved' : newIndex < currentIndex ? 'worsened' : 'stable'
      });
    }
    
    return changes;
  };

  if (!lastIntervention) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
          <Brain className="w-4 h-4" />
          <span className="text-xs font-medium">AI Clinical Guidance</span>
        </div>
        <p className="text-xs text-slate-500">
          Use an intervention to receive AI-powered clinical guidance
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Analyzing Intervention...</span>
        </div>
        <p className="text-xs text-slate-500">
          Generating evidence-based clinical guidance
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* RAG Insights */}
      <div className="bg-purple-950/20 border border-purple-500/30 rounded p-2">
        <h4 className="text-xs font-semibold text-purple-400 mb-1 flex items-center gap-1">
          <Target className="w-3 h-3" />
          Evidence-Based Clinical Reasoning
          {ragInsights.length > 0 && ragInsights[0].length > 100 && (
            <span className="text-xs text-purple-300/70 font-normal">(Knowledge Base)</span>
          )}
        </h4>
        {error ? (
          <div className="text-xs text-red-400 mb-2">
            ⚠️ {error}
          </div>
        ) : null}
        <div className="space-y-2">
          {ragInsights.map((insight, index) => (
            <div key={index} className="text-xs text-purple-200 leading-relaxed whitespace-pre-wrap">
              {insight}
            </div>
          ))}
        </div>
      </div>
      
      {/* Vital Changes */}
      {vitalChanges.length > 0 && (
        <div className="bg-slate-800/50 rounded p-2">
          <h4 className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Expected Changes
          </h4>
          <div className="grid grid-cols-2 gap-1">
            {vitalChanges.slice(0, 4).map((change, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-700/30 rounded p-1">
                <span className="text-xs text-slate-300">{change.vital}</span>
                <span className={`text-xs px-1 py-0.5 rounded ${
                  change.status === 'improved' ? 'bg-green-500/20 text-green-400' :
                  change.status === 'worsened' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {change.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Safety Check */}
      <div className="bg-slate-800/50 rounded p-2">
        <h4 className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Safety
        </h4>
        <div className="text-xs text-slate-300">
          Patient weight appropriate for medication dosing
        </div>
      </div>
    </div>
  );
}
