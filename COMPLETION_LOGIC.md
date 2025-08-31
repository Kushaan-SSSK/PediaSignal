# PediaSignal Completion Logic

## Overview

PediaSignal now uses a simple, deterministic completion rule: **Case completion is triggered ONLY when ALL Stage 3 required interventions have been successfully applied**. No other metrics (scores, time, vitals, etc.) trigger completion.

## Completion Rule

### Single Condition
- `caseComplete = true` IFF every intervention flagged as `stage === 3` and `required === true` has `applied === true`
- Nothing else triggers completion

### Data Model
- **Canonical List**: Maintains a normalized list of Stage 3 required interventions for the active case
- **Boolean Tracking**: Tracks `applied` boolean per intervention (idempotent - re-applying has no side-effects)
- **Derived State**: `allStage3Applied` computed from current intervention state
- **Single Trigger**: When `allStage3Applied` flips to `true` for the first time, trigger Case Completed page once

## Implementation

### Core Functions (`client/src/lib/completionLogic.ts`)

```typescript
// Get Stage 3 required interventions for current case
getStage3RequiredInterventions(caseData: any): string[]

// Check if all Stage 3 required interventions are applied
checkStage3Completion(
  stage3RequiredInterventions: string[],
  allAppliedInterventions: Array<{name: string, success: boolean}>
): boolean

// Emit completion event for telemetry
emitCompletionEvent(caseId: string, appliedInterventionIds: string[]): void
```

### Case Completed Page (`client/src/pages/case-completed.tsx`)
- **Title**: "Case Completed"
- **Subtitle**: "All Stage 3 required interventions have been applied"
- **No Scores**: No percentages, ranks, or grades displayed
- **Summary**: Lists Stage 3 required interventions with ✅ checkmarks
- **Actions**: Restart case, try another case

## Content Contract (for Case Authors)

### Stage 3 Definition Requirements
- Stage 3 required interventions must have stable unique IDs
- Avoid synonyms/duplicates - only one canonical entry per clinical action
- If authors change Stage 3 definitions, the new list governs completion immediately

### Example Stage 3 Structure
```json
{
  "stage": 3,
  "name": "Observation & Prevention",
  "requiredInterventions": [
    "Discussion around need for admission",
    "Discussion with family about anaphylaxis/allergic reactions", 
    "Outpatient treatment and follow up discussion"
  ]
}
```

## Error Handling & Edge Cases

### Misconfigured Content
- If case has zero Stage 3 required interventions: never auto-complete
- Log error: `stage3_required_missing`
- Show non-blocking banner in dev mode

### Runtime Behavior
- **Disabled/Hidden Interventions**: Exclude from required set at runtime (respect gating/branching)
- **Idempotency**: Marking same intervention applied multiple times doesn't retrigger completion
- **Persistence**: Page reload keeps current applied state; completion persists

## Telemetry

### Completion Event
```typescript
{
  event: 'case_completed',
  timestamp: '2025-01-01T00:00:00.000Z',
  payload: {
    caseId: 'aliem_case_01_anaphylaxis',
    completedBy: 'stage3_all_required_applied',
    appliedInterventionIds: ['intervention1', 'intervention2', 'intervention3'],
    attemptsPerIntervention: {}
  }
}
```

## QA Checklist

### Manual Testing
- [ ] Start case with ≥2 required Stage 3 interventions
- [ ] Apply only some Stage 3 required → no completion
- [ ] Apply all Stage 3 required → completion fires immediately once
- [ ] Toggle optional or Stage 1/2/4 interventions → no effect on completion
- [ ] Refresh after partial progress → still not complete
- [ ] Refresh after full set → still complete
- [ ] Confirm no scores/percentages appear anywhere
- [ ] Confirm telemetry event payload is correct

### Unit Tests (`client/src/lib/completionLogic.test.ts`)
- [ ] Predicate returns false until every Stage 3 required applied === true
- [ ] Predicate ignores non-required and non-Stage-3 interventions
- [ ] No score values are produced anywhere

## Migration Notes

### Removed Components
- `client/src/lib/scoringCalculator.ts` - Complete scoring system
- `client/src/lib/simpleFeedback.ts` - Simple feedback system
- `client/src/lib/anaphylaxisStageDefinitions.ts` - Anaphylaxis-specific scoring
- `docs/SCORING_SYSTEM.md` - Scoring documentation
- `server/lib/scoringConfigLoader.ts` - Scoring configuration loader
- `server/config/scoringWeights.json` - Scoring weights configuration

### Updated Components
- `client/src/pages/simulator.tsx` - Uses new completion logic
- `client/src/pages/score-calculator.tsx` - Redirects to Case Completed page
- `client/src/App.tsx` - Added route for `/case-completed`

### New Components
- `client/src/lib/completionLogic.ts` - New completion logic
- `client/src/pages/case-completed.tsx` - New completion page

## Performance & Race Conditions

### Optimization
- Predicate computed from in-memory state in O(n_stage3)
- Guard against double dispatch when multiple interventions finalize simultaneously
- Use single-flight completion guard

### Developer Experience
- Concise logging for debugging completion state
- Clear error messages for misconfigured cases
- TypeScript interfaces for type safety
