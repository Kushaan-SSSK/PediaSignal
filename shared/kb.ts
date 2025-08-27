import { z } from "zod";

// Core types for the RAG engine
export interface DrugDose {
  name: string;
  route: string;
  mgPerKgMin: number;
  mgPerKgMax: number;
  maxDose: number;
  weightBands: Array<{
    minWeight: number;
    maxWeight: number;
    dose: number;
  }>;
}

export interface AlgoStep {
  id: string;
  order: number;
  label: string;
  appliesIf?: Record<string, any>;
  hazards?: string[];
  nextSteps?: string[];
}

export interface VitalCurve {
  id: string;
  name: string;
  params: Record<string, number>;
  timeToEffect: number; // seconds
}

export interface CriticalAction {
  id: string;
  stage: number;
  label: string;
  synonyms?: string[];
  required: boolean;
  order: number;
  timeWindow?: number;
}

export interface EvidenceRef {
  caseId: string;
  section: string;
  passageId: number;
  sourceCitation: string;
  license: string;
}

export interface Vitals {
  heartRate: number;
  respRate: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  spo2: number;
  temperature: number;
  consciousness?: string;
  capillaryRefill?: number;
}

export interface GroundedBundle {
  explanation: string;
  evidenceSources: EvidenceRef[];
  objectiveHits: string[];
  riskFlags: string[];
  nextStageRecommendations: string[];
  vitalEffects: Partial<Vitals>;
  deteriorationRates?: Record<string, number>;
  license: string;
  sourceVersion: string;
  fallback?: boolean;
}

// Zod schemas for validation
export const DrugDoseSchema = z.object({
  name: z.string(),
  route: z.string(),
  mgPerKgMin: z.number().positive(),
  mgPerKgMax: z.number().positive(),
  maxDose: z.number().positive(),
  weightBands: z.array(z.object({
    minWeight: z.number().nonnegative(),
    maxWeight: z.number().positive(),
    dose: z.number().positive(),
  })),
});

export const AlgoStepSchema = z.object({
  id: z.string(),
  order: z.number().int().positive(),
  label: z.string(),
  appliesIf: z.record(z.any()).optional(),
  hazards: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional(),
});

export const CriticalActionSchema = z.object({
  id: z.string(),
  stage: z.number().int().positive(),
  label: z.string(),
  synonyms: z.array(z.string()).optional(),
  required: z.boolean(),
  order: z.number().int().positive(),
  timeWindow: z.number().int().positive().optional(),
});

export const VitalCurveSchema = z.object({
  id: z.string(),
  name: z.string(),
  params: z.record(z.number()),
  timeToEffect: z.number().positive(),
});

export const VitalsSchema = z.object({
  heartRate: z.number().nonnegative(),
  respRate: z.number().nonnegative(),
  bloodPressureSys: z.number(),
  bloodPressureDia: z.number(),
  spo2: z.number().min(0).max(100),
  temperature: z.number(),
  consciousness: z.string().optional(),
  capillaryRefill: z.number().optional(),
});

export const EvidenceRefSchema = z.object({
  caseId: z.string(),
  section: z.string(),
  passageId: z.number().int().positive(),
  sourceCitation: z.string(),
  license: z.string(),
});

export const GroundedBundleSchema = z.object({
  explanation: z.string(),
  evidenceSources: z.array(EvidenceRefSchema),
  objectiveHits: z.array(z.string()),
  riskFlags: z.array(z.string()),
  nextStageRecommendations: z.array(z.string()),
  vitalEffects: VitalsSchema.partial(),
  deteriorationRates: z.record(z.number()).optional(),
  license: z.string(),
  sourceVersion: z.string(),
  fallback: z.boolean().optional(),
});

// RAG query types
export interface RAGQuery {
  query: string;
  caseId?: string;
  stage?: number;
  section?: string;
  tags?: string[];
  limit?: number;
  userId?: string;
  sessionId?: string;
}

export interface RAGResult {
  passages: Array<{
    id: number;
    text: string;
    score: number;
    tags: string[];
    sourceCitation: string;
    license: string;
  }>;
  totalFound: number;
  query: string;
}

// Rules service types
export interface DoseRequest {
  drug: string;
  weight: number;
  age?: number;
}

export interface DoseResponse {
  dose: number;
  unit: string;
  route: string;
  warnings: string[];
  source: string;
}

export interface AlgoRequest {
  caseId: string;
  stage: number;
  currentVitals: Vitals;
}

export interface AlgoResponse {
  steps: AlgoStep[];
  criticalActions: CriticalAction[];
  nextStage: number;
  source: string;
}


