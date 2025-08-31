/**
 * Tests for the new Stage 3 completion logic
 */

import { getStage3RequiredInterventions, checkStage3Completion } from './completionLogic';

// Mock case data for testing
const mockCaseData = {
  id: 'aliem_case_01_anaphylaxis',
  variants: [{
    stages: [
      {
        stage: 1,
        requiredInterventions: ['IM epinephrine', 'Oxygen']
      },
      {
        stage: 2,
        requiredInterventions: ['IV fluids', 'Steroids']
      },
      {
        stage: 3,
        requiredInterventions: [
          'Discussion around need for admission',
          'Discussion with family about anaphylaxis/allergic reactions',
          'Outpatient treatment and follow up discussion'
        ]
      }
    ]
  }]
};

describe('Stage 3 Completion Logic', () => {
  test('should get Stage 3 required interventions', () => {
    const stage3Interventions = getStage3RequiredInterventions(mockCaseData);
    expect(stage3Interventions).toEqual([
      'Discussion around need for admission',
      'Discussion with family about anaphylaxis/allergic reactions',
      'Outpatient treatment and follow up discussion'
    ]);
  });

  test('should return false when not all Stage 3 interventions are applied', () => {
    const stage3Interventions = getStage3RequiredInterventions(mockCaseData);
    const appliedInterventions = [
      { name: 'Discussion around need for admission', success: true },
      { name: 'Discussion with family about anaphylaxis/allergic reactions', success: true }
      // Missing the third intervention
    ];
    
    const isCompleted = checkStage3Completion(stage3Interventions, appliedInterventions);
    expect(isCompleted).toBe(false);
  });

  test('should return true when all Stage 3 interventions are applied successfully', () => {
    const stage3Interventions = getStage3RequiredInterventions(mockCaseData);
    const appliedInterventions = [
      { name: 'Discussion around need for admission', success: true },
      { name: 'Discussion with family about anaphylaxis/allergic reactions', success: true },
      { name: 'Outpatient treatment and follow up discussion', success: true }
    ];
    
    const isCompleted = checkStage3Completion(stage3Interventions, appliedInterventions);
    expect(isCompleted).toBe(true);
  });

  test('should return false when Stage 3 intervention is applied but not successful', () => {
    const stage3Interventions = getStage3RequiredInterventions(mockCaseData);
    const appliedInterventions = [
      { name: 'Discussion around need for admission', success: true },
      { name: 'Discussion with family about anaphylaxis/allergic reactions', success: true },
      { name: 'Outpatient treatment and follow up discussion', success: false } // Failed
    ];
    
    const isCompleted = checkStage3Completion(stage3Interventions, appliedInterventions);
    expect(isCompleted).toBe(false);
  });

  test('should return false when no Stage 3 required interventions exist', () => {
    const emptyCaseData = {
      id: 'empty_case',
      variants: [{
        stages: [
          { stage: 1, requiredInterventions: ['Test'] },
          { stage: 2, requiredInterventions: ['Test2'] }
          // No stage 3
        ]
      }]
    };
    
    const stage3Interventions = getStage3RequiredInterventions(emptyCaseData);
    const appliedInterventions = [
      { name: 'Some intervention', success: true }
    ];
    
    const isCompleted = checkStage3Completion(stage3Interventions, appliedInterventions);
    expect(isCompleted).toBe(false);
  });

  test('should ignore non-Stage 3 interventions', () => {
    const stage3Interventions = getStage3RequiredInterventions(mockCaseData);
    const appliedInterventions = [
      { name: 'IM epinephrine', success: true }, // Stage 1
      { name: 'IV fluids', success: true }, // Stage 2
      { name: 'Discussion around need for admission', success: true }, // Stage 3
      { name: 'Discussion with family about anaphylaxis/allergic reactions', success: true }, // Stage 3
      { name: 'Outpatient treatment and follow up discussion', success: true } // Stage 3
    ];
    
    const isCompleted = checkStage3Completion(stage3Interventions, appliedInterventions);
    expect(isCompleted).toBe(true);
  });
});
