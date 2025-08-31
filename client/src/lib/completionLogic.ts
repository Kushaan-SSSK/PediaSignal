/**
 * Simple Stage 3 Completion Logic
 * 
 * Case completion is triggered ONLY when ALL Stage 3 required interventions 
 * have been successfully applied. No other metrics (scores, time, vitals) 
 * should trigger completion.
 */

export interface Stage3Intervention {
  id: string;
  name: string;
  applied: boolean;
  success: boolean;
}

export interface CompletionState {
  allStage3Applied: boolean;
  stage3RequiredInterventions: Stage3Intervention[];
  completionTriggered: boolean;
}

/**
 * Get Stage 3 required interventions for the current case
 */
export function getStage3RequiredInterventions(caseData: any): string[] {
  console.log('🔍 getStage3RequiredInterventions called with caseData:', caseData);
  
  // Check if caseData has the expected structure (legacy format)
  if (!caseData?.stages) {
    console.error('No case data or stages found');
    console.log('🔍 caseData structure:', {
      hasCaseData: !!caseData,
      hasStages: !!caseData?.stages,
      stagesLength: caseData?.stages?.length
    });
    return [];
  }

  const stage3Data = caseData.stages.find((s: any) => s.stage === 3);
  console.log('🔍 Stage 3 data found:', stage3Data);
  
  if (!stage3Data) {
    console.error('Stage 3 not found in case data');
    console.log('🔍 Available stages:', caseData.stages.map((s: any) => s.stage));
    return [];
  }

  const requiredInterventions = stage3Data.requiredInterventions || [];
  console.log('🔍 Stage 3 required interventions:', requiredInterventions);
  return requiredInterventions;
}

/**
 * Check if all Stage 3 required interventions have been applied
 */
export function checkStage3Completion(
  stage3RequiredInterventions: string[],
  allAppliedInterventions: Array<{name: string, success: boolean}>
): boolean {
  if (stage3RequiredInterventions.length === 0) {
    console.warn('No Stage 3 required interventions found - case may be misconfigured');
    return false;
  }

  console.log('🔍 Detailed completion check:');
  console.log('🔍 Required interventions:', stage3RequiredInterventions);
  console.log('🔍 Applied interventions:', allAppliedInterventions.map(i => ({ name: i.name, success: i.success })));

  // Check if each required intervention has been applied successfully
  const allCompleted = stage3RequiredInterventions.every(requiredName => {
    const applied = allAppliedInterventions.find(applied => 
      applied.name === requiredName
    );
    console.log(`🔍 Checking "${requiredName}":`, applied ? `Found with success=${applied.success}` : 'NOT FOUND');
    return applied && applied.success;
  });

  console.log(`🎯 Stage 3 completion check:`, {
    requiredInterventions: stage3RequiredInterventions,
    appliedInterventions: allAppliedInterventions.map(i => ({ name: i.name, success: i.success })),
    allCompleted,
    completedCount: allAppliedInterventions.filter(i => 
      stage3RequiredInterventions.includes(i.name) && i.success
    ).length,
    requiredCount: stage3RequiredInterventions.length
  });

  return allCompleted;
}

/**
 * Emit completion event for telemetry
 */
export function emitCompletionEvent(
  caseId: string,
  appliedInterventionIds: string[]
): void {
  const event = {
    event: 'case_completed',
    timestamp: new Date().toISOString(),
    payload: {
      caseId,
      completedBy: 'stage3_all_required_applied',
      appliedInterventionIds,
      attemptsPerIntervention: {} // Could be enhanced if needed
    }
  };

  console.log('📊 Completion event:', event);
  
  // In a real implementation, this would be sent to analytics
  // For now, just log it
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'case_completed', event.payload);
  }
}
