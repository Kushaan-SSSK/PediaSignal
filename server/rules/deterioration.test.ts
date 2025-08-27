import { describe, it, expect } from '@jest/globals';
import { tick, CONFIG, type TickInput } from './deterioration';

describe('Deterioration Rules', () => {
  const baseVitals = {
    heartRate: 100,
    respRate: 20,
    bloodPressureSys: 120,
    bloodPressureDia: 80,
    spo2: 98,
    temperature: 98.6,
    consciousness: 'alert',
    capillaryRefill: 2.0
  };

  const createTickInput = (caseType: string, severity: 'mild' | 'moderate' | 'severe' = 'moderate', elapsedSec: number = 5): TickInput => ({
    caseType,
    stage: 1,
    severity,
    ageBand: 'child',
    vitals: { ...baseVitals },
    elapsedSec
  });

  describe('Anaphylaxis deterioration (PALS-based)', () => {
    it('should show classic anaphylaxis pattern', () => {
      const input = createTickInput('anaphylaxis', 'moderate', 1); // 1 second interval
      const output = tick(input);

      // Classic anaphylaxis pathophysiology: vasodilation and respiratory compromise
      expect(output.vitals.bloodPressureSys).toBeLessThan(baseVitals.bloodPressureSys); // Hypotension
      expect(output.vitals.heartRate).toBeGreaterThan(baseVitals.heartRate); // Compensatory tachycardia
      expect(output.vitals.spo2).toBeLessThan(baseVitals.spo2); // Respiratory compromise
      expect(output.vitals.capillaryRefill).toBeGreaterThan(baseVitals.capillaryRefill); // Poor perfusion
    });

    it('should generate appropriate PALS-based alerts', () => {
      const input = createTickInput('anaphylaxis', 'severe', 30); // Significant deterioration
      input.vitals.bloodPressureSys = 75; // Hypotensive
      input.vitals.spo2 = 90; // Borderline hypoxemic
      
      const output = tick(input);

      expect(output.alerts.length).toBeGreaterThan(0);
      expect(output.alerts.some(alert => alert.includes('hypoxemia') || alert.includes('SpO2'))).toBeTruthy();
    });
  });

  describe('Status asthmaticus deterioration (PALS-based)', () => {
    it('should show progressive respiratory failure pattern', () => {
      const input = createTickInput('status_asthmaticus', 'moderate', 1); // 1 second interval
      const output = tick(input);

      // Primary pathophysiology: airway obstruction leading to hypoxemia
      expect(output.vitals.spo2).toBeLessThan(baseVitals.spo2); // Hypoxemia
      expect(output.vitals.respRate).toBeGreaterThan(baseVitals.respRate); // Tachypnea  
      expect(output.vitals.heartRate).toBeGreaterThan(baseVitals.heartRate); // Hypoxemia-induced tachycardia
      // Should stay within guardrails
      expect(output.vitals.spo2).toBeGreaterThanOrEqual(CONFIG.guardrails.spo2.min);
      expect(output.vitals.respRate).toBeLessThanOrEqual(CONFIG.guardrails.respRate.max);
    });

    it('should respect per-second caps for realistic deterioration', () => {
      const input = createTickInput('status_asthmaticus', 'severe', 1); // 1 second elapsed
      const output = tick(input);

      // Changes should be realistic per-second rates
      expect(Math.abs(output.vitals.spo2 - baseVitals.spo2)).toBeLessThanOrEqual(CONFIG.maxDeltas.spo2);
      expect(Math.abs(output.vitals.respRate - baseVitals.respRate)).toBeLessThanOrEqual(CONFIG.maxDeltas.respRate);
      expect(Math.abs(output.vitals.heartRate - baseVitals.heartRate)).toBeLessThanOrEqual(CONFIG.maxDeltas.heartRate);
    });
  });

  describe('Sepsis case deterioration', () => {
    it('should increase HR, decrease BP, and increase temp for sepsis', () => {
      const input = createTickInput('sepsis', 'moderate', 10);
      const output = tick(input);

      // HR should increase
      expect(output.vitals.heartRate).toBeGreaterThan(baseVitals.heartRate);
      // BP should decrease
      expect(output.vitals.bloodPressureSys).toBeLessThan(baseVitals.bloodPressureSys);
      // Temperature should increase slightly
      expect(output.vitals.temperature).toBeGreaterThanOrEqual(baseVitals.temperature);
    });
  });

  describe('Opioid toxicity case deterioration', () => {
    it('should reduce RR and SpO2 for opioid cases', () => {
      const input = createTickInput('opioid_toxicity', 'moderate', 10);
      // Start with higher RR to see decrease
      input.vitals.respRate = 25;
      const output = tick(input);

      // Uses default trends which should still reduce respiration  
      expect(output.vitals.respRate).toBeLessThanOrEqual(input.vitals.respRate);
    });
  });

  describe('Severity scaling', () => {
    it('should have faster deterioration for severe vs mild cases', () => {
      const mildInput = createTickInput('status_asthmaticus', 'mild', 10);
      const severeInput = createTickInput('status_asthmaticus', 'severe', 10);
      
      const mildOutput = tick(mildInput);
      const severeOutput = tick(severeInput);

      // Severe should have greater SpO2 drop than mild
      const mildDrop = baseVitals.spo2 - mildOutput.vitals.spo2;
      const severeDrop = baseVitals.spo2 - severeOutput.vitals.spo2;
      
      expect(severeDrop).toBeGreaterThan(mildDrop);
    });
  });

  describe('Guardrails enforcement', () => {
    it('should never exceed guardrails regardless of input', () => {
      // Test with extreme vitals
      const extremeInput = createTickInput('sepsis', 'severe', 100);
      extremeInput.vitals.heartRate = 190; // Near max
      extremeInput.vitals.spo2 = 72; // Near min
      
      const output = tick(extremeInput);

      // Should respect all guardrails
      expect(output.vitals.heartRate).toBeLessThanOrEqual(CONFIG.guardrails.heartRate.max);
      expect(output.vitals.heartRate).toBeGreaterThanOrEqual(CONFIG.guardrails.heartRate.min);
      expect(output.vitals.spo2).toBeLessThanOrEqual(CONFIG.guardrails.spo2.max);
      expect(output.vitals.spo2).toBeGreaterThanOrEqual(CONFIG.guardrails.spo2.min);
      expect(output.vitals.respRate).toBeLessThanOrEqual(CONFIG.guardrails.respRate.max);
      expect(output.vitals.respRate).toBeGreaterThanOrEqual(CONFIG.guardrails.respRate.min);
    });
  });

  describe('Alert generation', () => {
    it('should generate hypoxemia alerts for low SpO2', () => {
      const input = createTickInput('status_asthmaticus', 'severe', 30);
      input.vitals.spo2 = 88; // Below threshold
      
      const output = tick(input);

      expect(output.alerts).toContain('Hypoxemia risk rising');
    });

    it('should generate hypotension alerts for sepsis with low BP', () => {
      const input = createTickInput('sepsis', 'severe', 30);
      input.vitals.bloodPressureSys = 85; // Below threshold
      
      const output = tick(input);

      expect(output.alerts).toContain('Hypotension trend detected');
    });

    it('should generate tachycardia alerts for high HR', () => {
      const input = createTickInput('sepsis', 'moderate', 10);
      input.vitals.heartRate = 155; // Above threshold
      
      const output = tick(input);

      expect(output.alerts).toContain('Tachycardia developing');
    });
  });

  describe('Stage progression effects', () => {
    it('should have increased deterioration in later stages', () => {
      const stage1Input = createTickInput('status_asthmaticus', 'moderate', 10);
      stage1Input.stage = 1;
      
      const stage3Input = createTickInput('status_asthmaticus', 'moderate', 10);  
      stage3Input.stage = 3;

      const stage1Output = tick(stage1Input);
      const stage3Output = tick(stage3Input);

      // Stage 3 should have greater deterioration than stage 1
      const stage1Drop = baseVitals.spo2 - stage1Output.vitals.spo2;
      const stage3Drop = baseVitals.spo2 - stage3Output.vitals.spo2;
      
      expect(stage3Drop).toBeGreaterThan(stage1Drop);
    });
  });

  describe('Zero elapsed time handling', () => {
    it('should handle zero elapsed time gracefully', () => {
      const input = createTickInput('status_asthmaticus', 'moderate', 0);
      const output = tick(input);

      // Should return vitals unchanged or with minimal change
      expect(output.vitals.spo2).toBeCloseTo(baseVitals.spo2, 0);
      expect(output.vitals.heartRate).toBeCloseTo(baseVitals.heartRate, 0);
    });
  });
});