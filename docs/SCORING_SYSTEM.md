# PediaSignal Emergency Pediatrics Scoring System

## Overview

The PediaSignal scoring system is a deterministic, configurable engine that converts user interventions and actions into a 0-100 final score with corresponding ratings. The system is designed to be fair, transparent, and easily adjustable without code changes.

## Features

- **Deterministic Scoring**: Same inputs always produce the same score
- **Configurable Weights**: Case-specific scoring rules via JSON configuration
- **Real-time Updates**: Running score calculation during simulation
- **Comprehensive Breakdown**: Detailed scoring analysis by stage
- **Bonus/Penalty System**: Rewards good clinical practice, penalizes errors
- **Time-based Scoring**: Considers intervention timing and stage completion

## Architecture

### Core Components

1. **ScoringCalculator** (`client/src/lib/scoringCalculator.ts`)
   - Main scoring logic engine
   - Pure TypeScript class with no external dependencies
   - Handles all scoring calculations and breakdowns

2. **ScoringConfigLoader** (`server/lib/scoringConfigLoader.ts`)
   - Loads case-specific configurations from JSON files
   - Provides fallback to default weights
   - Supports hot-reloading of configuration changes

3. **Configuration Files** (`server/config/scoringWeights.json`)
   - JSON-based configuration for easy modification
   - Case-specific weights and timing rules
   - No code deployment required for changes

## Scoring Categories

### Clinical Interventions

| Category | Points | Description |
|----------|--------|-------------|
| **Required** | +10 | Essential interventions for case progression |
| **Helpful** | +4 | Beneficial but not essential (capped per stage) |
| **Neutral** | 0 | No impact on patient outcome |
| **Harmful** | -12 | Interventions that worsen patient condition |

### Quiz/Assessment

| Category | Points | Description |
|----------|--------|-------------|
| **Correct** | +8 | Accurate clinical decision |
| **Partial** | +3 | Partially correct response |
| **Incorrect** | -6 | Wrong clinical decision |

### Bonuses & Penalties

| Type | Points | Condition |
|------|--------|-----------|
| **Order Bonus** | +5 | Complete all required before any harmful |
| **Early Action Bonus** | +5 | Critical intervention within time window |
| **Missed Required** | -8 | Required intervention not completed |
| **Timeout Penalty** | -5 | Exceed stage time limit |

## Rating System

| Score Range | Rating | Description |
|-------------|--------|-------------|
| 90-100 | **A (Gold)** | Outstanding performance |
| 80-89 | **B (Silver)** | Excellent performance |
| 70-79 | **C (Bronze)** | Good performance |
| <70 | **Needs Improvement** | Requires additional training |

## Configuration

### Default Weights

```json
{
  "required": 10,
  "helpful": 4,
  "neutral": 0,
  "harmful": -12,
  "missedRequired": -8,
  "timeoutPenalty": -5,
  "orderBonus": 5,
  "earlyActionBonus": 5,
  "maxHelpfulPerStage": 3
}
```

### Case-Specific Configuration

```json
{
  "aliem_case_01_anaphylaxis": {
    "description": "Anaphylaxis case - emphasizes rapid response",
    "weights": {
      "required": 12,
      "earlyActionBonus": 8,
      "criticalEarlyWindowSec": 60,
      "criticalEarlyLabels": ["IM Epinephrine", "IV Fluids Bolus"]
    }
  }
}
```

### Stage Time Limits

```json
{
  "aliem_case_01_anaphylaxis": {
    "1": 300,
    "2": 600,
    "3": 900,
    "4": 1200
  }
}
```

## Integration

### 1. Initialize Scoring Calculator

```typescript
import { ScoringCalculator, createCaseScoringCalculator } from '@/lib/scoringCalculator';

// Create calculator for specific case
const calculator = createCaseScoringCalculator(
  'aliem_case_01_anaphylaxis',
  stageDefinitions,
  customWeights
);
```

### 2. Track Interventions

```typescript
// Add intervention to scoring history
const result = calculator.addInteraction({
  stageNumber: 1,
  label: "IM Epinephrine",
  category: "required",
  timestamp: new Date().toISOString()
});

// Get running score
const runningScore = calculator.calculateRunningScore();
```

### 3. Set Stage Timing

```typescript
// Record stage start/end times
calculator.setStageTiming(1, Date.now()); // Stage 1 start
calculator.setStageTiming(1, Date.now(), Date.now() + 300000); // Stage 1 end
```

### 4. Calculate Final Score

```typescript
const finalResult = calculator.calculateFinalScore();

console.log(`Final Score: ${finalResult.finalScore}/100`);
console.log(`Rating: ${finalResult.rating}`);
console.log(`Breakdown:`, finalResult.breakdown);
```

## Usage Examples

### Example 1: Perfect Anaphylaxis Case

```typescript
const calculator = new ScoringCalculator();
calculator.setStageTiming(1, Date.now());

// Complete all required interventions
calculator.addInteraction({
  stageNumber: 1,
  label: "IM Epinephrine",
  category: "required",
  timestamp: new Date().toISOString()
});

calculator.addInteraction({
  stageNumber: 1,
  label: "IV Fluids Bolus",
  category: "required",
  timestamp: new Date().toISOString()
});

const result = calculator.calculateFinalScore();
// Expected: 100 points, A (Gold) rating
```

### Example 2: Case with Errors

```typescript
// Complete some required interventions
calculator.addInteraction({
  stageNumber: 1,
  label: "IM Epinephrine",
  category: "required",
  timestamp: new Date().toISOString()
});

// Take harmful action
calculator.addInteraction({
  stageNumber: 1,
  label: "Oral Epinephrine",
  category: "harmful",
  timestamp: new Date().toISOString()
});

// Missing: IV Fluids Bolus, Diphenhydramine IV
const result = calculator.calculateFinalScore();
// Expected: Lower score due to harmful action (-12) and missed required (-16)
```

## Configuration Management

### Modifying Weights

1. **Edit JSON File**: Modify `server/config/scoringWeights.json`
2. **No Code Changes**: Weights update automatically on next load
3. **Version Control**: Track configuration changes in git
4. **Validation**: System validates configuration on load

### Adding New Cases

```json
{
  "aliem_case_17_new_case": {
    "description": "New emergency case description",
    "weights": {
      "required": 11,
      "helpful": 5,
      "maxHelpfulPerStage": 4
    }
  }
}
```

### Custom Time Limits

```json
{
  "aliem_case_17_new_case": {
    "1": 450,
    "2": 750,
    "3": 1050,
    "4": 1350
  }
}
```

## Testing

### Unit Tests

```typescript
import { ScoringCalculator, EXAMPLE_1, EXAMPLE_2, EXAMPLE_3 } from '@/lib/scoringCalculator';

describe('ScoringCalculator', () => {
  test('Perfect case should score 100', () => {
    const calculator = new ScoringCalculator(
      DEFAULT_WEIGHTS,
      EXAMPLE_1.stageDefinitions
    );
    
    EXAMPLE_1.interactions.forEach(interaction => {
      calculator.addInteraction(interaction);
    });
    
    const result = calculator.calculateFinalScore();
    expect(result.finalScore).toBe(100);
    expect(result.rating).toBe('A (Gold)');
  });
});
```

### Integration Tests

```typescript
test('Case completion produces valid scoring result', async () => {
  const result = await completeCase('aliem_case_01_anaphylaxis');
  
  expect(result.finalScore).toBeGreaterThanOrEqual(0);
  expect(result.finalScore).toBeLessThanOrEqual(100);
  expect(result.breakdown.byStage).toHaveLength(4);
  expect(result.configVersion).toBeDefined();
});
```

## Performance Considerations

- **Memory Efficient**: Calculator maintains minimal state
- **Fast Calculations**: O(n) complexity for n interactions
- **Lazy Loading**: Configuration loaded only when needed
- **Caching**: Configuration cached with 5-minute refresh

## Troubleshooting

### Common Issues

1. **Configuration Not Loading**
   - Check file path: `server/config/scoringWeights.json`
   - Verify JSON syntax validity
   - Check file permissions

2. **Scores Not Calculating**
   - Ensure stage timing is set
   - Verify intervention categories are valid
   - Check for missing required interventions

3. **Unexpected Scores**
   - Review case-specific weights
   - Check time limits and early windows
   - Validate intervention categorization

### Debug Mode

```typescript
// Enable detailed logging
const calculator = new ScoringCalculator();
calculator.setDebugMode(true);

// Log all scoring decisions
const result = calculator.calculateFinalScore();
console.log('Scoring breakdown:', JSON.stringify(result.breakdown, null, 2));
```

## Future Enhancements

- **Team Scoring**: Multi-player simulation scoring
- **Learning Analytics**: Performance trend analysis
- **Adaptive Difficulty**: Dynamic weight adjustment
- **Competitive Mode**: Leaderboards and rankings
- **Export Reports**: Detailed performance analytics

## Support

For questions or issues with the scoring system:

1. Check this documentation
2. Review configuration examples
3. Test with provided examples
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2024-08-24  
**Maintainer**: PediaSignal Development Team
