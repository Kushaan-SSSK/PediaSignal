/**
 * Simple Percentage Score + Feedback System for PediaSignal
 * 
 * Replaces complex weighted scoring with simple percentage:
 * finalScore% = round( correct / (correct + incorrect) * 100 )
 */

export interface SimpleInteractionRecord {
  stageNumber: number;
  label: string;
  category: 'required' | 'helpful' | 'neutral' | 'harmful' | 'correct' | 'incorrect';
  timestamp: string;
}

export interface SimpleStageDefinition {
  stageNumber: number;
  requiredLabels: string[];
  harmfulLabels?: string[];
  neutralLabels?: string[];
}

export interface FeedbackItem {
  label: string;
  stageNumber: number;
  what_went_wrong: string;
  why_wrong: string;
  how_to_improve: string;
}

export interface SimpleFeedbackResult {
  finalScorePercent: number;
  correctCount: number;
  incorrectCount: number;
  ignoredCount: number;
  countedSelections: number;
  feedback: {
    critical_misses: FeedbackItem[];
    harmful_actions: FeedbackItem[];
    prioritization_tips: string[];
    positives: string[];
  };
  disclaimer: string;
}

export interface SimpleFeedbackConfig {
  TREAT_HELPFUL_AS_CORRECT: boolean;
}

const DEFAULT_CONFIG: SimpleFeedbackConfig = {
  TREAT_HELPFUL_AS_CORRECT: false
};

/**
 * Generate simple percentage score and clinical feedback
 */
export function generateSimpleFeedback(
  interactionHistory: SimpleInteractionRecord[],
  stageDefinitions: SimpleStageDefinition[],
  config: SimpleFeedbackConfig = DEFAULT_CONFIG
): SimpleFeedbackResult {
  
  // Step 1: De-duplicate by (stageNumber, label) - keep first occurrence
  const deduplicated = deduplicateInteractions(interactionHistory);
  
  // Step 2: Classify each interaction
  const classified = classifyInteractions(deduplicated, stageDefinitions, config);
  
  // Step 3: Calculate simple percentage score
  const correctCount = classified.filter(i => i.classification === 'correct').length;
  const incorrectCount = classified.filter(i => i.classification === 'incorrect').length;
  const ignoredCount = classified.filter(i => i.classification === 'ignored').length;
  const countedSelections = correctCount + incorrectCount;
  
  const finalScorePercent = countedSelections > 0 
    ? Math.round((correctCount / countedSelections) * 100) 
    : 0;
  
  // Step 4: Generate clinical feedback
  const feedback = generateClinicalFeedback(classified, stageDefinitions);
  
  return {
    finalScorePercent,
    correctCount,
    incorrectCount,
    ignoredCount,
    countedSelections,
    feedback,
    disclaimer: "Educational use only. Not medical advice."
  };
}

/**
 * Remove duplicates by (stageNumber, label), keeping first occurrence
 */
function deduplicateInteractions(interactions: SimpleInteractionRecord[]): SimpleInteractionRecord[] {
  const seen = new Set<string>();
  const deduplicated: SimpleInteractionRecord[] = [];
  
  for (const interaction of interactions) {
    const key = `${interaction.stageNumber}-${interaction.label}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(interaction);
    }
  }
  
  return deduplicated;
}

/**
 * Classify interactions as correct/incorrect/ignored
 */
function classifyInteractions(
  interactions: SimpleInteractionRecord[], 
  stageDefinitions: SimpleStageDefinition[],
  config: SimpleFeedbackConfig
): Array<SimpleInteractionRecord & { classification: 'correct' | 'incorrect' | 'ignored' }> {
  
  const classified = interactions.map(interaction => {
    const stageDef = stageDefinitions.find(s => s.stageNumber === interaction.stageNumber);
    
    let classification: 'correct' | 'incorrect' | 'ignored' = 'ignored';
    
    // Handle explicit correct/incorrect categories first
    if (interaction.category === 'correct') {
      classification = 'correct';
    } else if (interaction.category === 'incorrect') {
      classification = 'incorrect';
    } else if (interaction.category === 'neutral') {
      classification = 'ignored';
    } else if (stageDef) {
      // Check against stage definitions
      if (stageDef.requiredLabels.includes(interaction.label)) {
        classification = 'correct';
      } else if (config.TREAT_HELPFUL_AS_CORRECT && interaction.category === 'helpful') {
        classification = 'correct';
      } else if (interaction.category === 'harmful' || stageDef.harmfulLabels?.includes(interaction.label)) {
        classification = 'incorrect';
      } else if (stageDef.neutralLabels?.includes(interaction.label)) {
        classification = 'ignored';
      } else {
        // Action not permitted at this stage
        classification = 'incorrect';
      }
    }
    
    return { ...interaction, classification };
  });
  
  return classified;
}

/**
 * Generate clinical feedback based on classified interactions
 */
function generateClinicalFeedback(
  classifiedInteractions: Array<SimpleInteractionRecord & { classification: 'correct' | 'incorrect' | 'ignored' }>,
  stageDefinitions: SimpleStageDefinition[]
): SimpleFeedbackResult['feedback'] {
  
  const feedback: SimpleFeedbackResult['feedback'] = {
    critical_misses: [],
    harmful_actions: [],
    prioritization_tips: [],
    positives: []
  };
  
  // Find critical misses - required actions not taken
  for (const stageDef of stageDefinitions) {
    const stageInteractions = classifiedInteractions.filter(i => i.stageNumber === stageDef.stageNumber);
    const completedRequired = stageInteractions
      .filter(i => i.classification === 'correct' && stageDef.requiredLabels.includes(i.label))
      .map(i => i.label);
    
    const missedRequired = stageDef.requiredLabels.filter(label => !completedRequired.includes(label));
    
    for (const missedLabel of missedRequired.slice(0, 3)) { // Limit to 3 most important
      const feedbackItem = generateCriticalMissFeedback(missedLabel, stageDef.stageNumber);
      if (feedbackItem) {
        feedback.critical_misses.push(feedbackItem);
      }
    }
  }
  
  // Find harmful actions taken
  const harmfulInteractions = classifiedInteractions.filter(i => i.classification === 'incorrect' && i.category === 'harmful');
  for (const harmfulAction of harmfulInteractions.slice(0, 3)) { // Limit to 3 most important
    const feedbackItem = generateHarmfulActionFeedback(harmfulAction.label, harmfulAction.stageNumber);
    if (feedbackItem) {
      feedback.harmful_actions.push(feedbackItem);
    }
  }
  
  // Generate prioritization tips
  feedback.prioritization_tips = generatePrioritizationTips(classifiedInteractions);
  
  // Generate positive reinforcement
  feedback.positives = generatePositiveReinforcement(classifiedInteractions, stageDefinitions);
  
  // Limit total feedback items to 6
  const totalItems = feedback.critical_misses.length + feedback.harmful_actions.length;
  if (totalItems > 6) {
    // Prioritize critical misses, then harmful actions
    if (feedback.critical_misses.length > 4) {
      feedback.critical_misses = feedback.critical_misses.slice(0, 4);
      feedback.harmful_actions = feedback.harmful_actions.slice(0, 2);
    } else {
      const remainingSlots = 6 - feedback.critical_misses.length;
      feedback.harmful_actions = feedback.harmful_actions.slice(0, remainingSlots);
    }
  }
  
  return feedback;
}

/**
 * Generate feedback for missed critical actions
 */
function generateCriticalMissFeedback(label: string, stageNumber: number): FeedbackItem | null {
  const feedbackMap: Record<string, Omit<FeedbackItem, 'label' | 'stageNumber'>> = {
    'IM Epinephrine': {
      what_went_wrong: 'IM epinephrine not administered',
      why_wrong: 'IM epinephrine is first-line treatment for anaphylaxis to reverse airway compromise and shock',
      how_to_improve: 'Administer IM epinephrine promptly when anaphylaxis signs appear'
    },
    'IV Access': {
      what_went_wrong: 'IV access not established',
      why_wrong: 'IV access is essential for fluid resuscitation and medication administration',
      how_to_improve: 'Establish IV access early in emergency presentations'
    },
    'Continuous Monitoring': {
      what_went_wrong: 'Continuous monitoring not initiated',
      why_wrong: 'Continuous monitoring is required to detect rapid changes in pediatric patients',
      how_to_improve: 'Start continuous cardiac and respiratory monitoring immediately'
    },
    'High-Flow Oxygen': {
      what_went_wrong: 'High-flow oxygen not provided',
      why_wrong: 'High-flow oxygen supports oxygenation in respiratory distress',
      how_to_improve: 'Provide supplemental oxygen for any respiratory compromise'
    },
    'Albuterol Nebulizer': {
      what_went_wrong: 'Albuterol nebulizer not administered',
      why_wrong: 'Bronchodilators are first-line treatment for bronchospasm in asthma',
      how_to_improve: 'Administer bronchodilators early for wheeze and respiratory distress'
    }
  };
  
  const feedback = feedbackMap[label];
  if (!feedback) return null;
  
  return {
    label,
    stageNumber,
    ...feedback
  };
}

/**
 * Generate feedback for harmful actions taken
 */
function generateHarmfulActionFeedback(label: string, stageNumber: number): FeedbackItem | null {
  const feedbackMap: Record<string, Omit<FeedbackItem, 'label' | 'stageNumber'>> = {
    'Oral Epinephrine': {
      what_went_wrong: 'Oral epinephrine administered instead of IM',
      why_wrong: 'Oral epinephrine has poor absorption and delayed onset in shock states',
      how_to_improve: 'Always use IM epinephrine for anaphylaxis - faster and more reliable'
    },
    'Unnecessary Intubation': {
      what_went_wrong: 'Premature or unnecessary intubation attempted',
      why_wrong: 'Intubation carries risks and may worsen airway edema in anaphylaxis',
      how_to_improve: 'Try medical management first; reserve intubation for true airway failure'
    },
    'Excessive IV Fluids': {
      what_went_wrong: 'Excessive IV fluid administration',
      why_wrong: 'Fluid overload can worsen pulmonary edema and cardiac strain',
      how_to_improve: 'Give measured fluid boluses and reassess frequently'
    }
  };
  
  const feedback = feedbackMap[label];
  if (!feedback) return null;
  
  return {
    label,
    stageNumber,
    ...feedback
  };
}

/**
 * Generate prioritization tips
 */
function generatePrioritizationTips(
  interactions: Array<SimpleInteractionRecord & { classification: 'correct' | 'incorrect' | 'ignored' }>
): string[] {
  const tips: string[] = [];
  
  // Check if ABCs were prioritized
  const earlyInteractions = interactions.filter(i => 
    new Date(i.timestamp).getTime() < (interactions[0] ? new Date(interactions[0].timestamp).getTime() + 120000 : 0)
  );
  
  const hasEarlyAirway = earlyInteractions.some(i => i.label.includes('Oxygen') || i.label.includes('Airway'));
  const hasEarlyCirculation = earlyInteractions.some(i => i.label.includes('IV') || i.label.includes('Epinephrine'));
  
  if (!hasEarlyAirway || !hasEarlyCirculation) {
    tips.push('Complete ABCs (Airway, Breathing, Circulation) before other interventions');
  }
  
  tips.push('Start continuous monitoring early to detect changes quickly');
  tips.push('Reassess vitals after each intervention to guide next steps');
  
  return tips.slice(0, 3);
}

/**
 * Generate positive reinforcement
 */
function generatePositiveReinforcement(
  interactions: Array<SimpleInteractionRecord & { classification: 'correct' | 'incorrect' | 'ignored' }>,
  stageDefinitions: SimpleStageDefinition[]
): string[] {
  const positives: string[] = [];
  
  const correctActions = interactions.filter(i => i.classification === 'correct');
  const criticalActions = ['IM Epinephrine', 'IV Access', 'High-Flow Oxygen', 'Continuous Monitoring'];
  
  const criticalCompleted = correctActions.filter(i => criticalActions.includes(i.label));
  
  if (criticalCompleted.length > 0) {
    positives.push(`Correctly performed ${criticalCompleted.length} critical intervention(s)`);
  }
  
  // Check for early action
  const earlyActions = correctActions.filter(i => {
    const timestamp = new Date(i.timestamp).getTime();
    const firstTimestamp = interactions[0] ? new Date(interactions[0].timestamp).getTime() : timestamp;
    return (timestamp - firstTimestamp) < 60000; // Within first minute
  });
  
  if (earlyActions.length > 0) {
    positives.push('Good rapid response time for initial interventions');
  }
  
  return positives.slice(0, 2);
}