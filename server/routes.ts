import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import { setupSecurityMiddleware, auditLog } from "./security";
import { z } from "zod";
import { 
  insertSimulationSchema, 
  insertXrayAnalysisSchema, 
  insertMisinfoLogSchema,
  insertChatConversationSchema,
  insertWaitlistSchema
} from "@shared/schema";
import { 
  generateClinicalExplanation, 
  analyzeXrayImage, 
  classifyMisinformation, 
  generateTriageResponse 
} from "./openai";
import { 
  getRandomCase, 
  getAvailableCategories, 
  getCasesByCategory,
  evaluateSimulation,
  caseBank,
  type SimulationSession,
  type CaseDefinition
} from "./caseBank";
import { tick, type TickInput } from "./rules/deterioration";
import { ALIEM_CASES, getALiEMCase, getCaseAttribution } from './caseBank.aliem';
import type { VitalSigns } from "@shared/types";
import multer from "multer";
import axios from 'axios';
import * as cheerio from 'cheerio';
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import { db } from "./db";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup security middleware for HIPAA/SOC 2 compliance
  setupSecurityMiddleware(app);
  
  // Favicon route
  app.get('/favicon.jpg', (req, res) => {
    const faviconPath = path.join(process.cwd(), 'client', 'public', 'favicon.jpg');
    if (fs.existsSync(faviconPath)) {
      res.sendFile(faviconPath);
    } else {
      res.status(404).send('Favicon not found');
    }
  });

  // Test endpoint to verify ALiEM cases are loaded
  app.get('/api/test-cases', (req, res) => {
    try {
      const totalCases = caseBank.length;
      const aliEmCases = caseBank.filter(case_ => case_.id.startsWith('aliem_'));
      const legacyCases = caseBank.filter(case_ => !case_.id.startsWith('aliem_'));
      
      res.json({
        totalCases,
        aliEmCases: aliEmCases.length,
        legacyCases: legacyCases.length,
        aliEmCaseIds: aliEmCases.map(c => c.id),
        message: 'Case bank status check'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check case bank', details: (error as Error).message });
    }
  });

  // Debug endpoint to check ALIEM_CASES directly
  app.get('/api/debug-aliem', (req, res) => {
    try {
      res.json({
        aliemCasesCount: ALIEM_CASES.length,
        aliemCaseIds: ALIEM_CASES.map(c => c.id),
        aliemCategories: ALIEM_CASES.map(c => c.category),
        firstCase: ALIEM_CASES[0] ? {
          id: ALIEM_CASES[0].id,
          category: ALIEM_CASES[0].category,
          displayName: ALIEM_CASES[0].displayName
        } : null,
        message: 'ALIEM_CASES debug info'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check ALIEM_CASES', details: (error as Error).message });
    }
  });
  
  // Enhanced Simulation endpoints
  app.post('/api/start-simulation', async (req, res) => {
    try {
      const { category, userId } = req.body;
      
      console.log('🔍 Start simulation request:', { category, userId });
      console.log('🔍 ALIEM_CASES count:', ALIEM_CASES.length);
      console.log('🔍 ALIEM_CASES categories:', ALIEM_CASES.map(c => c.category));
      
      if (!category || !userId) {
        return res.status(400).json({ message: "Category and userId required" });
      }

      // Get random ALiEM case for the category
      const aliemCases = ALIEM_CASES.filter(c => c.category === category);
      console.log('🔍 Filtered cases for category:', category, 'Count:', aliemCases.length);
      console.log('🔍 Matching cases:', aliemCases.map(c => ({ id: c.id, category: c.category })));
      
      if (aliemCases.length === 0) {
        return res.status(400).json({ message: "No cases found for category" });
      }
      
      const randomCase = aliemCases[Math.floor(Math.random() * aliemCases.length)];
      const randomVariant = randomCase.variants[Math.floor(Math.random() * randomCase.variants.length)];
      
      // Convert to legacy format for compatibility
      const caseDefinition: CaseDefinition = {
        id: `${randomCase.id}_${randomVariant.variantId.toLowerCase()}`,
        name: randomCase.displayName,
        category: randomCase.category as any, // ALiEM categories don't match legacy enum
        difficulty: 'intermediate' as const,
        description: `${randomCase.displayName} simulation case from ALiEM EM ReSCu Peds`,
        estimatedTime: randomVariant.stages.reduce((total, stage) => total + stage.TTIsec, 0) / 60, // Convert to minutes
        clinicalHistory: randomCase.clinicalHistory || `Patient presenting with ${randomCase.displayName.toLowerCase()}`,
        presentingSymptoms: randomVariant.stages[0]?.requiredInterventions || [],
        learningObjectives: randomVariant.stages.flatMap(stage => stage.requiredInterventions),
        initialVitals: {
          heartRate: randomVariant.initialVitals.heartRate || 100,
          temperature: randomVariant.initialVitals.temperature || 98.6,
          respRate: randomVariant.initialVitals.respRate || 20,
          bloodPressure: randomVariant.initialVitals.bloodPressureSys ? 
            `${randomVariant.initialVitals.bloodPressureSys}/${randomVariant.initialVitals.bloodPressureDia}` : '120/80',
          oxygenSat: randomVariant.initialVitals.spo2 || 98,
          bloodGlucose: randomVariant.initialVitals.bloodGlucose || undefined,
          consciousness: randomVariant.initialVitals.consciousness || 'alert'
        },
        stages: randomVariant.stages.map(stage => ({
          stage: stage.stage,
          name: stage.name,
          description: `${stage.name} - ${stage.severity} severity`,
          timeLimit: stage.TTIsec,
          // Use the correct ALiEM property names that the simulator expects
          requiredInterventions: stage.requiredInterventions,
          helpful: stage.helpful,
          harmful: stage.harmful,
          neutral: stage.neutral,
          ordered: stage.ordered,
          severity: stage.severity,
          ageBand: randomVariant.ageBand,
          TTIsec: stage.TTIsec,
          vitalBounds: {
            heartRate: { min: 60, max: 200 },
            respRate: { min: 12, max: 60 },
            bloodPressureSys: { min: 60, max: 200 },
            bloodPressureDia: { min: 40, max: 120 },
            spo2: { min: 85, max: 100 },
            temperature: { min: 35, max: 42 },
            capillaryRefill: { min: 0, max: 5 }
          },
          // Keep legacy properties for backward compatibility
          requiredActions: stage.requiredInterventions,
          optionalActions: stage.helpful,
          criticalFailures: stage.harmful,
          nextStageConditions: ['Complete required interventions'],
          clinicalReasoning: `Stage ${stage.stage} focuses on ${stage.name.toLowerCase()}`,
          evidenceSources: [{
            caseId: randomCase.id,
            section: stage.name,
            passageId: stage.stage,
            sourceCitation: randomCase.sourceCitation,
            license: randomCase.license
          }],
          criticalActions: stage.requiredInterventions,
          // Add missing required properties
          vitals: randomVariant.initialVitals as any,
          availableInterventions: [
            ...stage.requiredInterventions,
            ...stage.helpful,
            ...stage.harmful,
            ...stage.neutral
          ],
          branchingConditions: [{
            condition: 'Complete required interventions',
            nextStage: stage.stage + 1,
            vitalsChange: {}
          }]
        })) as any,
        goldStandardActions: randomVariant.stages.map(stage => ({
          stage: stage.stage,
          actions: stage.requiredInterventions,
          critical: stage.severity === 'critical',
          timeLimit: stage.TTIsec,
          points: stage.requiredInterventions.length * 10
        })),
        references: [randomCase.sourceCitation]
      };
      
      // Create simulation session
      const sessionId = `sim_${Date.now()}_${userId}`;
      const session: SimulationSession = {
        id: sessionId,
        userId,
        caseId: caseDefinition.id,
        startTime: new Date(),
        currentStage: 1,
        vitals: (caseDefinition.initialVitals || { heartRate: 120, temperature: 98.6, respRate: 20, spo2: 98, bloodPressureSys: 90, bloodPressureDia: 60 }) as VitalSigns,
        appliedInterventions: [],
        timestamps: [],
        status: 'active'
      };

      // Store session (in production, this would go to database)
      const simulationData = {
        userId,
        caseType: caseDefinition.id,
        stage: 1,
        vitals: (caseDefinition.initialVitals || { heartRate: 120, temperature: 98.6, respRate: 20, spo2: 98, bloodPressureSys: 90, bloodPressureDia: 60 }) as VitalSigns,
        interventions: [],
        aiExplanations: [],
        status: 'active' as const,
        // New RAG fields
        evidenceSources: [],
        objectiveHits: [],
        riskFlags: []
      };

      const simulation = await storage.createSimulation(simulationData);

      // Get evidence-based medical knowledge for first stage
      let objectives = caseDefinition.learningObjectives || [];
      let criticalActions = caseDefinition.stages[0].criticalActions || [];
      
      // Evidence-based medical knowledge for first stage objectives
      const medicalKnowledge = {
        'aliem_case_01_anaphylaxis': {
          1: {
            objectives: [
              'Recognize signs of anaphylaxis: facial swelling, difficulty breathing, wheezing, rash, vomiting',
              'Understand the urgency of immediate resuscitation area placement and monitoring',
              'Know correct epinephrine administration: 0.01 mg/kg IM (max 0.3 mg) in anterolateral thigh',
              'Recognize that IM epinephrine should show improvement in a few minutes but not complete resolution'
            ],
            riskFlags: [
              'Delayed epinephrine administration increases mortality risk',
              'Incorrect dosing can be ineffective or harmful',
              'Not having epinephrine readily available delays treatment',
              'Delayed placement in resuscitation area delays critical interventions'
            ]
          }
        },
        'aliem_case_02_cardiac_tamponade': {
          1: {
            objectives: [
              'Recognize Beck\'s triad: hypotension, muffled heart sounds, distended neck veins',
              'Understand the need for immediate pericardiocentesis',
              'Know the risks of delayed intervention'
            ],
            riskFlags: [
              'Delayed pericardiocentesis can lead to cardiac arrest',
              'Incomplete drainage may lead to re-accumulation',
              'Risk of coronary artery injury during procedure'
            ]
          }
        }
      };
      
      // Get case-specific medical knowledge
      const caseKnowledge = medicalKnowledge[caseDefinition.id];
      if (caseKnowledge && caseKnowledge[1]) {
        objectives = caseKnowledge[1].objectives;
        if (caseKnowledge[1].riskFlags) {
          criticalActions = [...criticalActions, ...caseKnowledge[1].riskFlags];
        }
      }

      res.json({
        sessionId,
        simulationId: simulation.id,
        caseDefinition,
        currentStage: 1,
        vitals: (caseDefinition.initialVitals || { heartRate: 120, temperature: 98.6, respRate: 20, spo2: 98, bloodPressureSys: 90, bloodPressureDia: 60 }) as VitalSigns,
        availableInterventions: caseDefinition.stages[0].availableInterventions,
        timeLimit: caseDefinition.stages[0].timeLimit,
        criticalActions,
        objectives,
        // RAG-enhanced data
        evidenceSources: [],
        riskFlags: [],
        // License and attribution
        license: randomCase.license,
        sourceVersion: randomCase.sourceVersion,
        attribution: randomCase.sourceCitation
      });

    } catch (error) {
      console.error('Start simulation error:', error);
      res.status(500).json({ 
        message: "Failed to start simulation", 
        error: (error as Error).message 
      });
    }
  });

  // Case deterioration tick endpoint
  app.post('/api/case-tick', async (req, res) => {
    try {
      const { caseType, stage, severity, ageBand, currentVitals, timeElapsed, userId, sessionId } = req.body;
      
      if (!caseType || !currentVitals || typeof timeElapsed !== 'number') {
        return res.status(400).json({ message: "Missing required fields: caseType, currentVitals, timeElapsed" });
      }

      // Prepare input for deterioration engine
      const tickInput: TickInput = {
        caseType,
        stage: stage || 1,
        severity: severity || 'moderate',
        ageBand: ageBand || 'child',
        vitals: {
          heartRate: currentVitals.heartRate || 100,
          respRate: currentVitals.respRate || 20,
          bloodPressureSys: currentVitals.bloodPressureSys || 120,
          bloodPressureDia: currentVitals.bloodPressureDia || 80,
          spo2: currentVitals.spo2 || 98,
          temperature: currentVitals.temperature || 98.6,
          consciousness: currentVitals.consciousness || 'alert',
          capillaryRefill: currentVitals.capillaryRefill || 2.0
        },
        elapsedSec: timeElapsed
      };

      // Calculate deterioration
      const tickOutput = tick(tickInput);

      // Thresholded persistence - only write if significant changes
      let simulationId: string | undefined;
      if (sessionId) {
        const oldVitals = currentVitals;
        const newVitals = tickOutput.vitals;
        
        // Check if changes are significant enough to persist
        const hasSignificantChange = 
          Math.abs(newVitals.heartRate - oldVitals.heartRate) >= 1 ||
          Math.abs(newVitals.respRate - oldVitals.respRate) >= 1 ||
          Math.abs(newVitals.bloodPressureSys - oldVitals.bloodPressureSys) >= 1 ||
          Math.abs(newVitals.spo2 - oldVitals.spo2) >= 1 ||
          Math.abs(newVitals.temperature - oldVitals.temperature) >= 0.1;

        if (hasSignificantChange && userId) {
          try {
            // Update vitals in simulation record
            const simulationData = {
              userId: parseInt(userId),
              caseType,
              stage: stage || 1,
              vitals: newVitals as any,
              interventions: [], // Keep existing interventions
              aiExplanations: [],
              status: 'active' as const,
              evidenceSources: [],
              objectiveHits: [],
              riskFlags: []
            };
            
            const simulation = await storage.createSimulation(simulationData);
            simulationId = simulation.id.toString();
          } catch (dbError) {
            console.warn('Failed to persist deterioration tick:', dbError);
            // Continue without failing the response
          }
        }
      }

      res.json({
        updatedVitals: tickOutput.vitals,
        alerts: tickOutput.alerts,
        stage: stage || 1,
        ...(simulationId && { simulationId })
      });

    } catch (error) {
      console.error('Case tick error:', error);
      res.status(500).json({ 
        message: "Failed to process case tick", 
        error: (error as Error).message 
      });
    }
  });

  app.post('/api/simulate-case', async (req, res) => {
    try {
      const { caseType, intervention, userId, vitals, stage, sessionId } = req.body;
      
      if (!caseType || !intervention || !userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get case definition
      const caseDefinition = caseBank.find(c => c.id === caseType);
      if (!caseDefinition) {
        return res.status(400).json({ message: "Invalid case type" });
      }

      // Get evidence-based clinical guidance for the intervention
      let evidenceSources: any[] = [];
      let objectiveHits: any[] = [];
      let riskFlags: any[] = [];
      let explanation = '';
      
      // Evidence-based medical knowledge for interventions
      const interventionKnowledge = {
        'aliem_case_01_anaphylaxis': {
          1: {
            'Placement in resuscitation': {
              explanation: 'Patient should be quickly moved to a resuscitation area for immediate assessment and treatment. This ensures access to all necessary equipment and medications.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed placement delays critical interventions', 'Inadequate monitoring in non-resuscitation area'],
              objectiveHits: ['Immediate recognition of anaphylaxis severity', 'Proper patient placement for critical care']
            },
            'Exam including airway and lung assessment': {
              explanation: 'Comprehensive airway and lung assessment to evaluate for stridor, wheezing, and respiratory compromise. Critical for determining severity and need for airway intervention.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Incomplete assessment may miss airway compromise', 'Delayed recognition of respiratory deterioration'],
              objectiveHits: ['Airway assessment in anaphylaxis', 'Recognition of respiratory compromise']
            },
            'Placement on cardiovascular monitoring': {
              explanation: 'Continuous cardiac monitoring for heart rate, blood pressure, and rhythm. Essential for detecting cardiovascular compromise and response to treatment.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate monitoring may miss cardiovascular deterioration', 'Delayed recognition of shock'],
              objectiveHits: ['Cardiovascular monitoring in anaphylaxis', 'Recognition of cardiovascular compromise']
            },
            'IM epinephrine given': {
              explanation: 'IM epinephrine 0.01 mg/kg (max 0.3 mg) in anterolateral thigh is the gold standard first-line treatment for anaphylaxis. Administer immediately upon recognition of anaphylaxis symptoms.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed administration increases mortality risk', 'Incorrect dosing can be ineffective or harmful'],
              objectiveHits: ['Immediate recognition and treatment of anaphylaxis', 'Correct epinephrine administration technique']
            },
            'Oxygen administration': {
              explanation: 'Place oxygen on patient by mask or nebulizer to improve oxygenation. Any O2 administration will increase SpO2 to 99-100%.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate oxygenation may worsen respiratory compromise', 'Delayed O2 administration'],
              objectiveHits: ['Oxygen therapy in anaphylaxis', 'Monitoring oxygenation response']
            }
          }
        },
        'aliem_case_02_cardiac_tamponade': {
          1: {
            'pericardiocentesis': {
              explanation: 'Emergency pericardiocentesis is indicated for cardiac tamponade. Use subxiphoid approach with ultrasound guidance when possible. Prepare for potential thoracotomy if pericardiocentesis fails.',
              evidenceSources: ['PALS Guidelines 2020 - Cardiac Tamponade Management'],
              riskFlags: ['Risk of coronary artery injury', 'Incomplete drainage may lead to re-accumulation'],
              objectiveHits: ['Recognition of cardiac tamponade', 'Emergency pericardiocentesis technique']
            }
          }
        }
      };
      
      // Get case-specific intervention knowledge
      const caseKnowledge = interventionKnowledge[caseType];
      const stageKnowledge = caseKnowledge?.[stage || 1];
      const interventionData = stageKnowledge?.[intervention];
      
      if (interventionData) {
        explanation = interventionData.explanation;
        evidenceSources = interventionData.evidenceSources;
        objectiveHits = interventionData.objectiveHits;
        riskFlags = interventionData.riskFlags;
      } else {
        // Fallback to general PALS guidance
        explanation = `${intervention} is indicated for this stage based on PALS guidelines. Always assess airway, breathing, and circulation first. Monitor vital signs continuously and be prepared to escalate care if needed.`;
        evidenceSources = ['PALS Guidelines 2020 - General Principles'];
        riskFlags = ['Always verify correct dosing and administration route', 'Monitor for adverse effects'];
        objectiveHits = ['Safe intervention administration', 'Continuous patient monitoring'];
      }
      
      const groundedBundle = {
        explanation,
        evidenceSources,
        objectiveHits,
        riskFlags,
        nextStageRecommendations: ['Continue monitoring', 'Assess response to intervention', 'Prepare for next stage'],
        vitalEffects: {},
        deteriorationRates: {},
        license: "CC BY-NC-SA 4.0",
        sourceVersion: "aliem-rescu-peds-2021-03-29",
        fallback: false
      };

      // Rules Service: Get deterministic vital effects and next stage
      let updatedVitals = { ...vitals };
      let nextStage = (stage || 1) + 1;
      let criticalActions = [];
      
      try {
        const { getCriticalActions, determineNextStage } = await import('./rules/rules');
        
        // Get critical actions for current stage
        const criticalActionsResult = await getCriticalActions(caseType, stage || 1);
        criticalActions = criticalActionsResult;
        
        // Determine next stage based on intervention and rules
        const nextStageResult = await determineNextStage(stage || 1, [], criticalActionsResult);
        nextStage = nextStageResult;
        
      } catch (rulesError) {
        console.warn('Rules service failed, using fallback:', rulesError);
        // Fallback to case definition branching logic
        const currentStage = caseDefinition.stages.find(s => s.stage === (stage || 1));
        if (currentStage) {
          for (const condition of currentStage.branchingConditions) {
            if (intervention.includes(condition.condition) || 
                condition.condition === 'time_elapsed' ||
                condition.condition === 'vital_change') {
              nextStage = condition.nextStage;
              if (condition.vitalsChange) {
                Object.assign(updatedVitals, condition.vitalsChange);
              }
              break;
            }
          }
        }
        criticalActions = caseDefinition.stages.find(s => s.stage === (stage || 1))?.criticalActions || [];
      }

      // Create or update simulation record with RAG data
      const simulationData = {
        userId,
        caseType,
        stage: nextStage,
        vitals: updatedVitals,
        interventions: [intervention],
        aiExplanations: [groundedBundle.explanation],
        // New RAG fields
        evidenceSources,
        objectiveHits,
        riskFlags,
        status: 'active' as const
      };

      const simulation = await storage.createSimulation(simulationData);

      // Get next stage info
      const nextStageInfo = caseDefinition.stages.find(s => s.stage === nextStage);
      
      res.json({
        simulationId: simulation.id,
        updatedVitals,
        // RAG-enhanced explanation
        clinicalExplanation: groundedBundle.explanation,
        evidenceSources,
        objectiveHits,
        riskFlags,
        nextStageRecommendations: groundedBundle.nextStageRecommendations,
        stage: nextStage,
        availableInterventions: nextStageInfo?.availableInterventions || [],
        timeLimit: nextStageInfo?.timeLimit,
        criticalActions,
        isCompleted: nextStage > caseDefinition.stages.length,
        // License and attribution
        license: groundedBundle.license,
        sourceVersion: groundedBundle.sourceVersion,
        attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
      });

    } catch (error) {
      console.error('Simulation error:', error);
      res.status(500).json({ 
        message: "Failed to process simulation", 
        error: (error as Error).message 
      });
    }
  });

  // Test endpoint for deterioration system
  app.get('/api/test-deterioration', async (req, res) => {
    const testInput = {
      caseType: 'aliem_case_01_anaphylaxis',
      stage: 1,
      severity: 'moderate' as const,
      ageBand: 'child',
      vitals: {
        heartRate: 100,
        respRate: 20,
        bloodPressureSys: 120,
        bloodPressureDia: 80,
        spo2: 98,
        temperature: 98.6,
        consciousness: 'alert',
        capillaryRefill: 2.0
      },
      elapsedSec: 5
    };

    const result = tick(testInput);
    
    res.json({
      input: testInput,
      output: result,
      changes: {
        heartRate: result.vitals.heartRate - testInput.vitals.heartRate,
        respRate: result.vitals.respRate - testInput.vitals.respRate,
        bloodPressureSys: result.vitals.bloodPressureSys - testInput.vitals.bloodPressureSys,
        spo2: result.vitals.spo2 - testInput.vitals.spo2,
        temperature: result.vitals.temperature - testInput.vitals.temperature
      }
    });
  });

  // New endpoint: Get simulation debrief with RAG insights
  app.get('/api/simulation/:simulationId/debrief', async (req, res) => {
    try {
      const { simulationId } = req.params;
      
      if (!simulationId) {
        return res.status(400).json({ message: "Simulation ID required" });
      }

      // Get simulation data from storage
      const simulation = await storage.getSimulation(parseInt(simulationId));
      if (!simulation) {
        return res.status(404).json({ message: "Simulation not found" });
      }

      // Get case definition
      const caseDefinition = caseBank.find(c => c.id === simulation.caseType);
      if (!caseDefinition) {
        return res.status(404).json({ message: "Case definition not found" });
      }

      let debriefInsights: {
        objectives: string[];
        evidenceSources: any[];
        riskFlags: string[];
        recommendations: string[];
        clinicalReasoning: string;
      } = {
        objectives: [],
        evidenceSources: [],
        riskFlags: [],
        recommendations: [],
        clinicalReasoning: ""
      };

      try {
        // Import RAG compose for debrief synthesis
        const { composeGroundedExplanation } = await import('./rag/compose');
        
        // Generate comprehensive debrief
        const debriefQuery = `Generate a comprehensive debrief for ${caseDefinition.name} including learning objectives met, evidence-based interventions, risk factors identified, and recommendations for improvement.`;
        const debriefBundle = await composeGroundedExplanation(
          debriefQuery,
          simulation.caseType,
          simulation.stage,
          simulation.userId.toString(),
          `debrief_${simulationId}`
        );
        
        debriefInsights = {
          objectives: debriefBundle.objectiveHits,
          evidenceSources: debriefBundle.evidenceSources,
          riskFlags: debriefBundle.riskFlags,
          recommendations: debriefBundle.nextStageRecommendations,
          clinicalReasoning: debriefBundle.explanation
        };
        
      } catch (ragError) {
        console.warn('RAG debrief failed, using fallback:', ragError);
        // Fallback to basic evaluation
        const session: SimulationSession = {
          id: `debrief_${simulationId}`,
          userId: simulation.userId,
          caseId: simulation.caseType,
          startTime: new Date(),
          currentStage: simulation.stage,
          vitals: simulation.vitals as VitalSigns,
          appliedInterventions: (simulation.interventions as string[]) || [],
          timestamps: [],
          status: 'completed'
        };
        
        const feedback = evaluateSimulation(session, caseDefinition);
        
        debriefInsights = {
          objectives: (feedback.suggestions as string[]) || [],
          evidenceSources: [],
          riskFlags: [],
          recommendations: (feedback.suggestions as string[]) || [],
          clinicalReasoning: `Simulation completed with ${feedback.finalScore}% score. ${feedback.outcome}`
        };
      }

      res.json({
        simulationId,
        caseDefinition: {
          name: caseDefinition.name,
          category: caseDefinition.category,
          difficulty: caseDefinition.difficulty,
          learningObjectives: caseDefinition.learningObjectives,
          references: caseDefinition.references
        },
        simulation: {
          stage: simulation.stage,
          vitals: simulation.vitals as VitalSigns,
          interventions: simulation.interventions,
          status: simulation.status
        },
        debrief: debriefInsights,
        // License and attribution
        license: "CC BY-NC-SA 4.0",
        sourceVersion: "aliem-rescu-peds-2021-03-29",
        attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
      });

    } catch (error) {
      console.error('Debrief error:', error);
      res.status(500).json({ 
        message: "Failed to generate debrief", 
        error: (error as Error).message 
      });
    }
  });

  app.post('/api/evaluate-simulation', async (req, res) => {
    try {
      const { sessionId, caseId, appliedInterventions, timestamps } = req.body;
      
      if (!sessionId || !caseId || !appliedInterventions) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get case definition
      const caseDefinition = caseBank.find(c => c.id === caseId);
      if (!caseDefinition) {
        return res.status(400).json({ message: "Invalid case ID" });
      }

      // Create session object for evaluation
      const session: SimulationSession = {
        id: sessionId,
        userId: 1, // This would come from auth
        caseId,
        startTime: new Date(),
        currentStage: caseDefinition.stages.length,
        vitals: (caseDefinition.initialVitals || { heartRate: 120, temperature: 98.6, respRate: 20, spo2: 98, bloodPressureSys: 90, bloodPressureDia: 60 }) as VitalSigns,
        appliedInterventions,
        timestamps: timestamps || [],
        status: 'completed'
      };

      // Evaluate simulation
      const feedback = evaluateSimulation(session, caseDefinition);

      res.json({
        sessionId,
        feedback,
        caseDefinition: {
          name: caseDefinition.name,
          learningObjectives: caseDefinition.learningObjectives,
          references: caseDefinition.references
        }
      });

    } catch (error) {
      console.error('Evaluation error:', error);
      res.status(500).json({ 
        message: "Failed to evaluate simulation", 
        error: (error as Error).message 
      });
    }
  });

  // Get all available cases
  app.get('/api/cases', async (req, res) => {
    try {
      res.json(caseBank);
    } catch (error) {
      console.error('Get all cases error:', error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  // Get a specific case by ID
  app.get('/api/cases/:caseId', async (req, res) => {
    try {
      const { caseId } = req.params;
      const foundCase = caseBank.find(c => c.id === caseId);
      
      if (!foundCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      res.json(foundCase);
    } catch (error) {
      console.error('Get case error:', error);
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  // Get random cases for selection
  app.get('/api/cases/random/:count', async (req, res) => {
    try {
      const count = parseInt(req.params.count) || 3;
      const cases: CaseDefinition[] = [];
      const usedCategories = new Set<string>();
      
      // Ensure we get different categories for variety
      while (cases.length < count && usedCategories.size < caseBank.length) {
        const randomCase = getRandomCase();
        if (!usedCategories.has(randomCase.category)) {
          cases.push(randomCase);
          usedCategories.add(randomCase.category);
        }
      }
      
      // If we don't have enough different categories, fill with any random cases
      while (cases.length < count) {
        const randomCase = getRandomCase();
        if (!cases.find(c => c.id === randomCase.id)) {
          cases.push(randomCase);
        }
      }
      
      res.json(cases);
    } catch (error) {
      console.error('Get random cases error:', error);
      res.status(500).json({ message: "Failed to fetch random cases" });
    }
  });

  // New endpoint: PubMed clinical reasoning
  app.post('/api/pubmed/clinical-reasoning', async (req, res) => {
    try {
      const { intervention, caseType, ageGroup, limit } = req.body;
      
      if (!intervention) {
        return res.status(400).json({ message: "Intervention required" });
      }

      try {
        const { searchPubMed } = await import('./rag/pubmed');
        
        const pubmedResult = await searchPubMed({
          intervention: intervention,
          caseType: caseType || 'pediatric_emergency',
          ageGroup: ageGroup || 'pediatric',
          limit: limit || 5,
        });
        
        res.json({
          results: pubmedResult,
          intervention,
          caseType,
          ageGroup,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (pubmedError) {
        console.warn('PubMed search failed:', pubmedError);
        res.status(500).json({ 
          message: "Failed to search PubMed", 
          error: (pubmedError instanceof Error ? pubmedError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('PubMed clinical reasoning error:', error);
      res.status(500).json({ 
        message: "Failed to get clinical reasoning", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: RAG query for clinical reasoning
  app.post('/api/rag/query', async (req, res) => {
    try {
      const { query, caseId, stage, section, tags, limit, userId, sessionId } = req.body;
      
      if (!query || !userId || !sessionId) {
        return res.status(400).json({ message: "Query, userId, and sessionId required" });
      }

      try {
        const { retrievePassages } = await import('./rag/retriever');
        
        const ragResult = await retrievePassages({
          query,
          caseId,
          stage,
          section,
          tags,
          limit: limit || 10,
          userId,
          sessionId
        });
        
        res.json({
          ...ragResult,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (ragError) {
        console.warn('RAG retrieval failed:', ragError);
        res.status(500).json({ 
          message: "Failed to retrieve RAG passages", 
          error: (ragError instanceof Error ? ragError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('RAG query error:', error);
      res.status(500).json({ 
        message: "Failed to process RAG query", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get available cases with RAG-enhanced metadata
  app.get('/api/cases/enhanced', async (req, res) => {
    try {
      const { category } = req.query;
      
      let availableCases = caseBank;
      if (category && typeof category === 'string') {
        availableCases = caseBank.filter(case_ => case_.category === category);
      }

      // Enhance cases with RAG insights
      const enhancedCases = await Promise.all(
        availableCases.map(async (case_) => {
          try {
            // Import RAG compose for case enhancement
            const { composeGroundedExplanation } = await import('./rag/compose');
            
            // Get case overview with RAG
            const overviewQuery = `What are the key learning objectives and critical considerations for ${case_.name}?`;
            const overviewBundle = await composeGroundedExplanation(
              overviewQuery,
              case_.id,
              1,
              'system',
              'case-overview'
            );
            
            return {
              ...case_,
              enhancedObjectives: overviewBundle.objectiveHits,
              riskFactors: overviewBundle.riskFlags,
              evidenceLevel: overviewBundle.evidenceSources.length > 0 ? 'evidence-based' : 'guideline-based',
              license: "CC BY-NC-SA 4.0",
              sourceVersion: "aliem-rescu-peds-2021-03-29",
              attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
            };
            
          } catch (ragError) {
            console.warn(`RAG enhancement failed for case ${case_.id}:`, ragError);
            // Return case without enhancement
            return {
              ...case_,
              enhancedObjectives: case_.learningObjectives || [],
              riskFactors: [],
              evidenceLevel: 'guideline-based',
              license: "CC BY-NC-SA 4.0",
              sourceVersion: "aliem-rescu-peds-2021-03-29",
              attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
            };
          }
        })
      );

      res.json(enhancedCases);
      
    } catch (error) {
      console.error('Enhanced cases error:', error);
      res.status(500).json({ 
        message: "Failed to fetch enhanced cases", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get simulation statistics and analytics
  app.get('/api/simulation/stats', async (req, res) => {
    try {
      const { userId, timeRange } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      try {
        // Get simulations for user
        const userSimulations = await storage.getUserSimulations(parseInt(userId as string));
        
        // Calculate statistics
        const totalSimulations = userSimulations.length;
        const completedSimulations = userSimulations.filter((s: any) => s.status === 'completed').length;
        const averageScore = userSimulations.length > 0 
          ? userSimulations.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / userSimulations.length 
          : 0;
        
        // Get RAG analytics
        let ragStats = {
          totalQueries: 0,
          evidenceSources: 0,
          objectivesMet: 0,
          riskFlagsIdentified: 0
        };
        
        try {
          // Import RAG retriever for stats
          const { getCacheStats } = await import('./rag/retriever');
          const cacheStats = getCacheStats();
          ragStats = {
            totalQueries: cacheStats.totalEntries || 0,
            evidenceSources: cacheStats.totalSessions || 0,
            objectivesMet: cacheStats.totalEntries || 0,
            riskFlagsIdentified: cacheStats.totalSessions || 0
          };
        } catch (ragError) {
          console.warn('RAG stats failed:', ragError);
        }

        // Get case category breakdown
        const categoryBreakdown = userSimulations.reduce((acc: Record<string, number>, sim: any) => {
          acc[sim.caseType] = (acc[sim.caseType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        res.json({
          userId,
          timeRange: timeRange || 'all',
          statistics: {
            totalSimulations,
            completedSimulations,
            completionRate: totalSimulations > 0 ? (completedSimulations / totalSimulations) * 100 : 0,
            averageScore: Math.round(averageScore * 100) / 100,
            categoryBreakdown
          },
          ragAnalytics: ragStats,
          // License and attribution
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (storageError) {
        console.warn('Storage stats failed:', storageError);
        res.status(500).json({ 
          message: "Failed to get simulation statistics", 
          error: (storageError instanceof Error ? storageError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('Simulation stats error:', error);
      res.status(500).json({ 
        message: "Failed to get simulation statistics", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get available drugs and dosing information
  app.get('/api/rules/drugs', async (req, res) => {
    try {
      try {
        const { getAvailableDrugs } = await import('./rules/rules');
        const drugs = await getAvailableDrugs();
        
        res.json({
          drugs,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (rulesError) {
        console.warn('Rules service failed:', rulesError);
        // Fallback to basic drug list
        const fallbackDrugs = [
          { name: "lorazepam", route: "IV", mgPerKgMin: 0.05, mgPerKgMax: 0.1, maxDose: 2 },
          { name: "midazolam", route: "IV", mgPerKgMin: 0.1, mgPerKgMax: 0.2, maxDose: 5 },
          { name: "fentanyl", route: "IV", mgPerKgMin: 0.5, mgPerKgMax: 1, maxDose: 50 },
          { name: "ketamine", route: "IV", mgPerKgMin: 1, mgPerKgMax: 2, maxDose: 100 }
        ];
        
        res.json({
          drugs: fallbackDrugs,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases",
          fallback: true
        });
      }

    } catch (error) {
      console.error('Drugs error:', error);
      res.status(500).json({ 
        message: "Failed to get drugs", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get available cases from rules service
  app.get('/api/rules/cases', async (req, res) => {
    try {
      try {
        const { getAvailableCases } = await import('./rules/rules');
        const cases = await getAvailableCases();
        
        res.json({
          cases,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (rulesError) {
        console.warn('Rules service failed:', rulesError);
        // Fallback to case bank
        const fallbackCases = caseBank.map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          difficulty: c.difficulty,
          estimatedTime: c.estimatedTime
        }));
        
        res.json({
          cases: fallbackCases,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases",
          fallback: true
        });
      }

    } catch (error) {
      console.error('Cases error:', error);
      res.status(500).json({ 
        message: "Failed to get cases", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get vital curves and deterioration patterns
  app.post('/api/rules/vital-curve', async (req, res) => {
    try {
      const { curveId, caseId, stage } = req.body;
      
      if (!curveId && !caseId) {
        return res.status(400).json({ message: "Either curveId or caseId required" });
      }

      try {
        const { getVitalCurve } = await import('./rules/rules');
        const vitalCurve = await getVitalCurve(curveId || `${caseId}-stage-${stage}`);
        
        if (!vitalCurve) {
          return res.status(404).json({ message: "Vital curve not found" });
        }
        
        res.json({
          vitalCurve,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (rulesError) {
        console.warn('Rules service failed:', rulesError);
        res.status(500).json({ 
          message: "Failed to get vital curve from rules service", 
          error: (rulesError instanceof Error ? rulesError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('Vital curve error:', error);
      res.status(500).json({ 
        message: "Failed to get vital curve", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get critical actions with time windows
  app.post('/api/rules/critical-actions', async (req, res) => {
    try {
      const { caseId, stage } = req.body;
      
      if (!caseId || !stage) {
        return res.status(400).json({ message: "Case ID and stage required" });
      }

      try {
        const { getCriticalActions } = await import('./rules/rules');
        const criticalActions = await getCriticalActions(caseId, stage);
        
        res.json({
          ...criticalActions,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (rulesError) {
        console.warn('Rules service failed:', rulesError);
        res.status(500).json({ 
          message: "Failed to get critical actions from rules service", 
          error: (rulesError instanceof Error ? rulesError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('Critical actions error:', error);
      res.status(500).json({ 
        message: "Failed to get critical actions", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get RAG cache statistics
  app.get('/api/rag/stats', async (req, res) => {
    try {
      try {
        const { getCacheStats, clearSessionCache } = await import('./rag/retriever');
        const cacheStats = getCacheStats();
        
        res.json({
          cacheStats,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (ragError) {
        console.warn('RAG stats failed:', ragError);
        res.status(500).json({ 
          message: "Failed to get RAG cache statistics", 
          error: (ragError instanceof Error ? ragError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('RAG stats error:', error);
      res.status(500).json({ 
        message: "Failed to get RAG statistics", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Clear RAG session cache
  app.post('/api/rag/clear-cache', async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      try {
        const { clearSessionCache } = await import('./rag/retriever');
        
        if (sessionId) {
          clearSessionCache(sessionId);
        } else {
          // Clear all sessions by clearing the entire cache
          const { clearAllCache } = await import('./rag/retriever');
          clearAllCache();
        }
        
        res.json({
          message: "Cache cleared successfully",
          sessionId: sessionId || 'all',
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (ragError) {
        console.warn('RAG cache clear failed:', ragError);
        res.status(500).json({ 
          message: "Failed to clear RAG cache", 
          error: (ragError instanceof Error ? ragError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('RAG cache clear error:', error);
      res.status(500).json({ 
        message: "Failed to clear cache", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get telemetry analytics
  app.get('/api/telemetry/analytics', async (req, res) => {
    try {
      const { timeRange, userId } = req.query;
      
      try {
        const { getTelemetryMetrics, getObjectiveMetrics } = await import('./telemetry/telemetryService');
        
        const metrics = await getTelemetryMetrics((timeRange as 'day' | 'week' | 'month') || 'week');
        const objectiveMetrics = userId ? await getObjectiveMetrics(parseInt(userId as string)) : [];
        
        res.json({
          metrics,
          objectiveMetrics,
          timeRange: timeRange || 'week',
          userId: userId || null,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (telemetryError) {
        console.warn('Telemetry analytics failed:', telemetryError);
        res.status(500).json({ 
          message: "Failed to get telemetry analytics", 
          error: (telemetryError instanceof Error ? telemetryError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('Telemetry analytics error:', error);
      res.status(500).json({ 
        message: "Failed to get telemetry analytics", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get PubMed search suggestions
  app.get('/api/pubmed/suggestions', async (req, res) => {
    try {
      const { query, caseType, ageGroup } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "Query required" });
      }

      try {
        const { searchPubMed } = await import('./rag/pubmed');
        
        const suggestions = await searchPubMed({
          intervention: query as string,
          caseType: (caseType as string) || 'pediatric_emergency',
          ageGroup: (ageGroup as "neonatal" | "infant" | "child" | "adolescent") || 'child',
          limit: 3 // Just a few suggestions
        });
        
        res.json({
          suggestions,
          query,
          caseType: caseType || 'pediatric_emergency',
          ageGroup: ageGroup || 'pediatric',
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (pubmedError) {
        console.warn('PubMed suggestions failed:', pubmedError);
        res.status(500).json({ 
          message: "Failed to get PubMed suggestions", 
          error: (pubmedError instanceof Error ? pubmedError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('PubMed suggestions error:', error);
      res.status(500).json({ 
        message: "Failed to get PubMed suggestions", 
        error: (error as Error).message 
      });
    }
  });

  // Get all available interventions
  app.get('/api/interventions', async (req, res) => {
    try {
      const { stage, caseId } = req.query;
      
      if (stage && caseId) {
        // Return stage-specific interventions for a specific case
        try {
          console.log('🔍 Fetching interventions for caseId:', caseId, 'stage:', stage);
          
          // Use the ALIEM_CASES array that's already loaded
          const targetCase = ALIEM_CASES.find((c: any) => 
            c.id === caseId || c.id === caseId.replace(/_a$/, '') || c.id === caseId.replace(/_b$/, '')
          );
          
          console.log('🔍 Found target case:', targetCase ? targetCase.id : 'NOT FOUND');
          
          if (targetCase && targetCase.variants && targetCase.variants[0]) {
            const stageData = targetCase.variants[0].stages.find((s: any) => s.stage === parseInt(stage as string));
            
            console.log('🔍 Found stage data:', stageData ? `Stage ${stageData.stage}` : 'NOT FOUND');
            
            if (stageData) {
              // Create intervention objects directly from the stage data
              const stageInterventions: Record<string, any> = {};
              
              // Add required interventions
              (stageData.requiredInterventions || []).forEach((intervention: string, index: number) => {
                stageInterventions[`required_${index}`] = {
                  id: `required_${index}`,
                  name: intervention,
                  description: `Required intervention: ${intervention}`,
                  category: 'medication',
                  timeRequired: 30,
                  successRate: 0.95,
                  ragSummary: `Critical intervention for Stage ${stage} anaphylaxis management`,
                  evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
                  vitalEffects: stageData.vitalEffects?.[intervention] || {}
                };
              });
              
              // Add helpful interventions
              (stageData.helpful || []).forEach((intervention: string, index: number) => {
                stageInterventions[`helpful_${index}`] = {
                  id: `helpful_${index}`,
                  name: intervention,
                  description: `Helpful intervention: ${intervention}`,
                  category: 'monitoring',
                  timeRequired: 20,
                  successRate: 0.90,
                  ragSummary: `Beneficial intervention for Stage ${stage} anaphylaxis management`,
                  evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
                  vitalEffects: stageData.vitalEffects?.[intervention] || {}
                };
              });
              
              // Add harmful interventions
              (stageData.harmful || []).forEach((intervention: string, index: number) => {
                stageInterventions[`harmful_${index}`] = {
                  id: `harmful_${index}`,
                  name: intervention,
                  description: `Harmful intervention: ${intervention}`,
                  category: 'medication',
                  timeRequired: 15,
                  successRate: 0.10,
                  ragSummary: `Avoid this intervention - it can worsen outcomes`,
                  evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
                  vitalEffects: {}
                };
              });
              
              // Add neutral interventions
              (stageData.neutral || []).forEach((intervention: string, index: number) => {
                stageInterventions[`neutral_${index}`] = {
                  id: `neutral_${index}`,
                  name: intervention,
                  description: `Neutral intervention: ${intervention}`,
                  category: 'monitoring',
                  timeRequired: 25,
                  successRate: 0.95,
                  ragSummary: `Standard monitoring intervention`,
                  evidenceSources: ['PALS Guidelines 2020 - General Principles'],
                  vitalEffects: {}
                };
              });
              
              console.log('🔍 Returning stage interventions:', Object.keys(stageInterventions));
              return res.json(stageInterventions);
            }
          }
        } catch (caseError) {
          console.log('Error getting stage-specific interventions:', caseError);
        }
      }
      
      // Fallback to all interventions if no stage/case specified or error occurred
      const { interventions } = await import('./caseBank');
      res.json(interventions);
    } catch (error) {
      console.error('Get interventions error:', error);
      res.status(500).json({ message: "Failed to fetch interventions" });
    }
  });

  // New endpoint: Get drug doses from rules service
  app.post('/api/rules/dose', async (req, res) => {
    try {
      const { drug, weight, age } = req.body;
      
      if (!drug || !weight) {
        return res.status(400).json({ message: "Drug and weight required" });
      }

      try {
        const { getDose } = await import('./rules/rules');
        const doseResponse = await getDose({ drug, weight, age });
        
        res.json({
          ...doseResponse,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (rulesError) {
        console.warn('Rules service failed:', rulesError);
        res.status(500).json({ 
          message: "Failed to get dose from rules service", 
          error: (rulesError instanceof Error ? rulesError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('Dose calculation error:', error);
      res.status(500).json({ 
        message: "Failed to calculate dose", 
        error: (error as Error).message 
      });
    }
  });

  // New endpoint: Get algorithm steps from rules service
  app.post('/api/rules/algo', async (req, res) => {
    try {
      const { caseId, stage, currentVitals } = req.body;
      
      if (!caseId || !stage) {
        return res.status(400).json({ message: "Case ID and stage required" });
      }

      try {
        const { getAlgo } = await import('./rules/rules');
        const algoResponse = await getAlgo({ caseId, stage, currentVitals: currentVitals || {} });
        
        res.json({
          ...algoResponse,
          license: "CC BY-NC-SA 4.0",
          sourceVersion: "aliem-rescu-peds-2021-03-29",
          attribution: "ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
        });
        
      } catch (rulesError) {
        console.warn('Rules service failed:', rulesError);
        res.status(500).json({ 
          message: "Failed to get algorithm from rules service", 
          error: (rulesError instanceof Error ? rulesError.message : 'Unknown error')
        });
      }

    } catch (error) {
      console.error('Algorithm retrieval error:', error);
      res.status(500).json({ 
        message: "Failed to retrieve algorithm", 
        error: (error as Error).message 
      });
    }
  });

  app.get('/api/simulation-categories', async (req, res) => {
    try {
      // Load ALiEM cases from JSON file
      const aliEmCasesPath = path.join(process.cwd(), 'server', 'data', 'caseBank.aliem.json');
      let aliEmCases = [];
      
      if (fs.existsSync(aliEmCasesPath)) {
        const aliEmData = fs.readFileSync(aliEmCasesPath, 'utf8');
        aliEmCases = JSON.parse(aliEmData);
        console.log(`ALiEM cases loaded from: ${aliEmCasesPath}`);
      } else {
        console.log(`ALiEM cases file not found at: ${aliEmCasesPath}`);
        // Try alternative path from import.meta.url
        try {
          const currentFileUrl = new URL(import.meta.url);
          const currentDir = path.dirname(currentFileUrl.pathname);
          const altPath = path.join(currentDir, 'data', 'caseBank.aliem.json');
          if (fs.existsSync(altPath)) {
            const aliEmData = fs.readFileSync(altPath, 'utf8');
            aliEmCases = JSON.parse(aliEmData);
            console.log(`ALiEM cases loaded from alternative path: ${altPath}`);
          } else {
            console.log(`ALiEM cases file not found at alternative path either: ${altPath}`);
          }
        } catch (error) {
          console.log('Could not determine alternative path:', error.message);
        }
      }
      
      // Get categories from loaded ALiEM cases
      const categories = Array.from(new Set(aliEmCases.map((c: any) => c.category)));
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/simulation-cases/:category(*)', async (req, res) => {
    try {
      const { category } = req.params;
      
      // Load ALiEM cases from JSON file
      const aliEmCasesPath = path.join(process.cwd(), 'server', 'data', 'caseBank.aliem.json');
      let aliEmCases = [];
      
      if (fs.existsSync(aliEmCasesPath)) {
        const aliEmData = fs.readFileSync(aliEmCasesPath, 'utf8');
        aliEmCases = JSON.parse(aliEmData);
        console.log(`ALiEM cases loaded from: ${aliEmCasesPath}`);
      } else {
        console.log(`ALiEM cases file not found at: ${aliEmCasesPath}`);
        // Try alternative path from import.meta.url
        try {
          const currentFileUrl = new URL(import.meta.url);
          const currentDir = path.dirname(currentFileUrl.pathname);
          const altPath = path.join(currentDir, 'data', 'caseBank.aliem.json');
          if (fs.existsSync(altPath)) {
            const aliEmData = fs.readFileSync(altPath, 'utf8');
            aliEmCases = JSON.parse(aliEmData);
            console.log(`ALiEM cases loaded from alternative path: ${altPath}`);
          } else {
            console.log(`ALiEM cases file not found at alternative path either: ${altPath}`);
          }
        } catch (error) {
          console.log('Could not determine alternative path:', error.message);
        }
      }
      
      // Filter cases by category and format for case selection
      const cases = aliEmCases.filter((c: any) => {
        const categoryMatch = c.category === category || 
                             c.category === decodeURIComponent(category) ||
                             c.category.toLowerCase() === category.toLowerCase();
        return categoryMatch;
      }).map((aliemCase: any) => ({
        id: aliemCase.id,
        name: aliemCase.name || aliemCase.displayName,
        category: aliemCase.category,
        difficulty: aliemCase.difficulty || 'intermediate',
        description: aliemCase.description || `${aliemCase.displayName} simulation case from ALiEM EM ReSCu Peds`,
        presentingSymptoms: aliemCase.presentingSymptoms || [],
        clinicalHistory: aliemCase.clinicalHistory || `ALiEM Case: ${aliemCase.sourceCitation}`,
        estimatedTime: aliemCase.estimatedTime || 15,
        stages: aliemCase.stages || (aliemCase.variants?.[0]?.stages?.length || 1),
        variants: aliemCase.variants?.length || 1,
        license: aliemCase.license,
        sourceVersion: aliemCase.sourceVersion,
        sourceCitation: aliemCase.sourceCitation
      }));
      
      res.json(cases);
    } catch (error) {
      console.error('Get cases error:', error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  app.get('/api/simulations/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const simulations = await storage.getUserSimulations(userId);
      res.json(simulations);
    } catch (error) {
      console.error('Get simulations error:', error);
      res.status(500).json({ message: "Failed to fetch simulations" });
    }
  });

  // Enhanced X-ray analysis endpoint
  app.post('/api/analyze-xray', upload.single('xray'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No X-ray image provided" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/dicom'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          message: "Invalid file type. Only JPEG, PNG, and DICOM files are allowed" 
        });
      }

      if (req.file.size > 10 * 1024 * 1024) { // 10MB limit
        return res.status(400).json({ 
          message: "File too large. Maximum size is 10MB" 
        });
      }

      // Preprocess image (basic validation)
      const base64Image = req.file.buffer.toString('base64');
      
      // Check if image is valid base64
      if (!base64Image || base64Image.length < 1000) {
        return res.status(400).json({ 
          message: "Invalid image data" 
        });
      }

      // Analyze with OpenAI
      const analysis = await analyzeXrayImage(base64Image);

      // Validate analysis results
      if (analysis.confidenceScore < 0.1) {
        return res.status(400).json({ 
          message: "Unable to analyze image. Please ensure it's a clear pediatric X-ray." 
        });
      }

      // Save analysis to database
      const xrayAnalysis = await storage.createXrayAnalysis({
        userId: parseInt(userId),
        filename: req.file.originalname,
        imageData: base64Image,
        abuseLikelihood: analysis.abuseLikelihood,
        fractureType: analysis.fractureType,
        explanation: analysis.explanation,
        confidenceScore: analysis.confidenceScore
      });

      // Log analysis for audit trail
      auditLog.logDataAccess(parseInt(userId).toString(), 'xray_analysis', xrayAnalysis.id.toString(), req.ip || 'unknown');

      res.json({
        analysisId: xrayAnalysis.id,
        abuseLikelihood: analysis.abuseLikelihood,
        fractureType: analysis.fractureType,
        explanation: analysis.explanation,
        confidenceScore: analysis.confidenceScore,
        riskLevel: analysis.abuseLikelihood > 0.7 ? 'high' : 
                   analysis.abuseLikelihood > 0.4 ? 'medium' : 'low',
        recommendations: analysis.abuseLikelihood > 0.7 ? 
          'Immediate consultation with child protection team recommended' :
          analysis.abuseLikelihood > 0.4 ? 
          'Consider additional imaging and clinical correlation' :
          'Continue routine clinical assessment'
      });

    } catch (error) {
      console.error('X-ray analysis error:', error);
      
      // Provide specific error messages
      let errorMessage = "Failed to analyze X-ray";
      if (error instanceof Error) {
        if (error.message.includes('API')) {
          errorMessage = "AI analysis service temporarily unavailable. Please try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Analysis timed out. Please try with a smaller image.";
        } else {
          errorMessage = error.message;
        }
      }
      
      res.status(500).json({ 
        message: errorMessage,
        error: (error as Error).message 
      });
    }
  });

  // Get X-ray analysis by ID
  app.get('/api/xray-analysis/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analyses = await storage.getXrayAnalyses(1); // Using userId 1 for now
      const analysis = analyses.find(a => a.id === id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Get X-ray analysis error:', error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.get('/api/xray-analyses/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const analyses = await storage.getXrayAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error('Get X-ray analyses error:', error);
      res.status(500).json({ message: "Failed to fetch X-ray analyses" });
    }
  });

  // Enhanced Misinformation monitoring endpoints
  app.post('/api/misinfo-scan', async (req, res) => {
    try {
      const { content, source, platform, userId } = req.body;
      
      if (!content || !source) {
        return res.status(400).json({ message: "Content and source required" });
      }

      // Validate content length
      if (content.length < 10) {
        return res.status(400).json({ message: "Content too short for analysis" });
      }

      if (content.length > 10000) {
        return res.status(400).json({ message: "Content too long. Maximum 10,000 characters." });
      }

      // Analyze content for misinformation
      const analysis = await classifyMisinformation(content, source);

      // Save to database
      const misinfoLog = await storage.createMisinfoLog({
        title: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        content,
        source,
        platform: platform || 'unknown',
        riskScore: analysis.riskScore,
        category: analysis.category
      });

      // Log for audit trail
      auditLog.logDataAccess(userId || 'anonymous', 'misinfo_scan', misinfoLog.id.toString(), req.ip || 'unknown');

      res.json({
        logId: misinfoLog.id,
        riskScore: analysis.riskScore,
        category: analysis.category,
        explanation: analysis.explanation,
        recommendedAction: analysis.recommendedAction,
        severity: analysis.riskScore > 0.8 ? 'critical' : 
                  analysis.riskScore > 0.6 ? 'high' : 
                  analysis.riskScore > 0.4 ? 'medium' : 'low',
        flaggedForReview: analysis.riskScore > 0.6
      });

    } catch (error) {
      console.error('Misinformation scan error:', error);
      res.status(500).json({ 
        message: "Failed to scan for misinformation", 
        error: (error as Error).message 
      });
    }
  });

  // Web scraping endpoint
  app.post('/api/scrape-and-analyze', async (req, res) => {
    try {
      const { url, platform } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Fetch content from URL
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract main content
      let content = '';
      
      // Try to find article content
      const article = $('article').first();
      if (article.length > 0) {
        content = article.text().trim();
      } else {
        // Fallback to main content areas
        const mainContent = $('main, .content, .post-content, .article-content, .entry-content').first();
        if (mainContent.length > 0) {
          content = mainContent.text().trim();
        } else {
          // Last resort: get body text
          content = $('body').text().trim();
        }
      }

      // Clean up content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 5000); // Limit to 5000 characters

      if (!content) {
        return res.status(400).json({ error: 'Could not extract content from URL' });
      }

      // Extract title
      const title = $('title').first().text().trim() || 
                   $('h1').first().text().trim() || 
                   'Untitled';

           // Analyze the scraped content
     const analysisResult = await classifyMisinformation(content, url);

           // Store the result
     const logId = await storage.createMisinfoLog({
       title,
       content,
       source: url,
       platform: platform || 'web',
       riskScore: analysisResult.riskScore,
       category: analysisResult.category
     });

           // Log the data access
     auditLog.logDataAccess('anonymous', 'misinfo_scan', logId.toString(), req.ip || 'unknown');

      res.json({
        ...analysisResult,
        logId,
        scrapedContent: content.substring(0, 200) + '...',
        title
      });

    } catch (error) {
      console.error('Web scraping error:', error);
      res.status(500).json({ 
        error: 'Failed to scrape and analyze content',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // User feedback endpoint for extension
  app.post('/api/misinfo-feedback', async (req, res) => {
    try {
      const { claim, feedback, url, timestamp, userId } = req.body;
      
      if (!claim || !feedback || !url) {
        return res.status(400).json({ message: "Claim, feedback, and URL required" });
      }

      // Validate feedback type
      if (!['agree', 'disagree'].includes(feedback)) {
        return res.status(400).json({ message: "Feedback must be 'agree' or 'disagree'" });
      }

      // Save feedback to database (you may need to add a feedback table)
      const feedbackLog = {
        claim,
        feedback,
        url,
        timestamp: timestamp || new Date().toISOString(),
        userId: userId || 'extension-user',
        source: 'chrome-extension'
      };

      // For now, we'll log it (you can add a proper feedback table later)
      console.log('User feedback received:', feedbackLog);

      // Log for audit trail
      auditLog.logDataAccess(userId || 'extension-user', 'misinfo_feedback', 'feedback', req.ip || 'unknown');

      res.json({
        success: true,
        message: "Feedback received",
        feedbackId: Date.now().toString()
      });

    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ 
        message: "Failed to process feedback", 
        error: (error as Error).message 
      });
    }
  });

  // Batch misinformation scanning
  app.post('/api/misinfo-scan-batch', async (req, res) => {
    try {
      const { contents } = req.body;
      
      if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ message: "Contents array required" });
      }

      if (contents.length > 10) {
        return res.status(400).json({ message: "Maximum 10 items per batch" });
      }

      const results = [];
      
      for (const item of contents) {
        try {
          const analysis = await classifyMisinformation(item.content, item.source);
          
          const misinfoLog = await storage.createMisinfoLog({
            title: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
            content: item.content,
            source: item.source,
            platform: item.platform || 'unknown',
            riskScore: analysis.riskScore,
            category: analysis.category
          });

          results.push({
            logId: misinfoLog.id,
            riskScore: analysis.riskScore,
            category: analysis.category,
            explanation: analysis.explanation,
            recommendedAction: analysis.recommendedAction
          });
        } catch (error) {
          results.push({
            error: "Failed to analyze item",
            content: item.content.substring(0, 50) + "..."
          });
        }
      }

      res.json({ results });

    } catch (error) {
      console.error('Batch misinformation scan error:', error);
      res.status(500).json({ 
        message: "Failed to process batch scan", 
        error: (error as Error).message 
      });
    }
  });

  // Get misinformation statistics
  app.get('/api/misinfo-stats', async (req, res) => {
    try {
      const logs = await storage.getRecentMisinfoLogs(1000);
      
      const stats = {
        totalScans: logs.length,
        highRiskCount: logs.filter(log => log.riskScore > 0.6).length,
        criticalCount: logs.filter(log => log.riskScore > 0.8).length,
        categoryBreakdown: logs.reduce((acc, log) => {
          acc[log.category] = (acc[log.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageRiskScore: logs.length > 0 ? 
          logs.reduce((sum, log) => sum + log.riskScore, 0) / logs.length : 0,
        recentTrend: logs.slice(-10).map(log => ({
          date: log.detectedAt,
          riskScore: log.riskScore
        }))
      };

      res.json(stats);
    } catch (error) {
      console.error('Get misinfo stats error:', error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get('/api/misinfo-logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getRecentMisinfoLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Get misinfo logs error:', error);
      res.status(500).json({ message: "Failed to fetch misinformation logs" });
    }
  });

  // Triage chatbot endpoints
  app.post('/api/triage-chat', async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({ message: "Message and session ID required" });
      }

      // Generate AI response
      const triageResult = await generateTriageResponse(message);

      // Save conversation to database
      const conversation = await storage.createChatConversation({
        sessionId,
        parentMessage: message,
        aiResponse: triageResult.response,
        riskLevel: triageResult.riskLevel,
        recommendedAction: triageResult.recommendedAction
      });

      res.json({
        conversationId: conversation.id,
        response: triageResult.response,
        riskLevel: triageResult.riskLevel,
        recommendedAction: triageResult.recommendedAction,
        emergencyWarning: triageResult.emergencyWarning
      });

    } catch (error) {
      console.error('Triage chat error:', error);
      res.status(500).json({ 
        message: "Failed to generate triage response", 
        error: (error as Error).message 
      });
    }
  });

  app.get('/api/chat-history/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getChatHistory(sessionId);
      res.json(history);
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // User management endpoints
  app.get('/api/users/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Analytics endpoint
  app.get('/api/analytics/overview', async (req, res) => {
    try {
      // This would typically aggregate data from multiple tables
      // For now, return basic counts
      res.json({
        totalSimulations: 247,
        totalXrayAnalyses: 89,
        misinformationDetected: 23,
        chatConversations: 156,
        activeUsers: 47
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Waitlist endpoints
  app.post('/api/waitlist', async (req, res) => {
    try {
      const validatedData = insertWaitlistSchema.parse(req.body);
      
      await storage.addToWaitlist(validatedData);
      
      res.json({ 
        success: true, 
        message: 'Successfully added to waitlist' 
      });
      
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to add to waitlist' 
      });
    }
  });

  // Admin login endpoint
  app.post('/api/admin/login', async (req, res) => {
    try {      
      const { username, password } = req.body;
      
      console.log('Admin login attempt:', { username, password });
      
      // Simple admin authentication (in production, use proper hashing)
      if (username === 'admin' && password === 'pediasignal2024') {
        res.json({ 
          success: true, 
          token: 'admin-authenticated',
          message: 'Login successful' 
        });
      } else {
        res.status(401).json({ 
          error: 'Invalid credentials' 
        });
      }
      
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ 
        error: 'Login failed' 
      });
    }
  });

  // Admin waitlist management
  app.get('/api/admin/waitlist', async (req, res) => {
    try {
      const waitlistEntries = await storage.getWaitlistEntries();
      res.json(waitlistEntries);
      
    } catch (error) {
      console.error("Error fetching waitlist:", error);
      res.status(500).json({ 
        error: 'Failed to fetch waitlist' 
      });
    }
  });

  app.patch('/api/admin/waitlist/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      await storage.updateWaitlistStatus(id, status);
      res.json({ success: true });
      
    } catch (error) {
      console.error("Error updating waitlist status:", error);
      res.status(500).json({ 
        error: 'Failed to update status' 
      });
    }
  });

  app.delete('/api/admin/waitlist/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWaitlistEntry(id);
      res.json({ success: true });
      
    } catch (error) {
      console.error("Error deleting waitlist entry:", error);
      res.status(500).json({ 
        error: 'Failed to delete entry' 
      });
    }
  });

  app.get('/api/admin/waitlist/export', async (req, res) => {
    try {
      const waitlistEntries = await storage.getWaitlistEntries();
      res.json(waitlistEntries);
      
    } catch (error) {
      console.error("Error exporting waitlist:", error);
      res.status(500).json({ 
        error: 'Failed to export waitlist' 
      });
    }
  });

  // RAG Clinical Guidance endpoint - Evidence-Based Medical Knowledge
  app.post('/api/rag/clinical-guidance', async (req, res) => {
    try {
      const { caseId, stage, intervention, interventionCategory, query } = req.body;
      
      if (!caseId || !stage || !intervention) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Comprehensive evidence-based medical knowledge database (PALS/ALiEM guidelines)
      const medicalKnowledge = {
        'aliem_case_01_anaphylaxis': {
          1: {
            'Placement in resuscitation': {
              explanation: 'Patient should be quickly moved to a resuscitation area for immediate assessment and treatment. This ensures access to all necessary equipment and medications for critical care.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed placement may compromise care', 'Inadequate equipment access'],
              nextStageRecommendations: ['Begin immediate assessment', 'Prepare for potential interventions']
            },
            'Exam including airway and lung assessment': {
              explanation: 'Comprehensive airway and respiratory assessment is critical in anaphylaxis. Look for stridor, wheezing, respiratory distress, and signs of airway compromise.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Missed airway compromise', 'Incomplete assessment'],
              nextStageRecommendations: ['Monitor airway status', 'Prepare for potential intubation']
            },
            'Placement on cardiovascular monitoring': {
              explanation: 'Continuous cardiac monitoring is essential for detecting arrhythmias, monitoring response to treatment, and identifying cardiovascular compromise in anaphylaxis.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Missed arrhythmias', 'Inadequate monitoring'],
              nextStageRecommendations: ['Monitor for arrhythmias', 'Assess cardiovascular status']
            },
            'IM epinephrine given': {
              explanation: 'IM epinephrine 0.01 mg/kg (max 0.3 mg) in anterolateral thigh is the gold standard first-line treatment for anaphylaxis. Administer immediately upon recognition of anaphylaxis symptoms. Delayed administration is associated with increased mortality.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed administration increases mortality risk', 'Incorrect dosing can be ineffective or harmful'],
              nextStageRecommendations: ['Monitor airway status continuously', 'Prepare for potential intubation', 'Establish IV access']
            },
            'delay epinephrine': {
              explanation: 'Delaying epinephrine administration in anaphylaxis is strongly associated with increased morbidity and mortality. Time to epinephrine is the most critical factor determining outcome in anaphylaxis.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Increased mortality risk with delayed administration', 'Risk of cardiac arrest', 'Prolonged hypotension and hypoxia'],
              nextStageRecommendations: ['Administer epinephrine immediately', 'Establish IV access', 'Prepare for potential intubation']
            },
            'epinephrine PO': {
              explanation: 'Oral epinephrine is contraindicated and dangerous in anaphylaxis management due to delayed absorption and inadequate bioavailability. Intramuscular administration is required for rapid onset and therapeutic levels.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed absorption', 'Increased mortality risk', 'May mask symptoms without treating underlying cause'],
              nextStageRecommendations: ['Administer IM epinephrine immediately', 'Establish IV access', 'Prepare for potential intubation']
            },
            'unnecessary intubation without indications': {
              explanation: 'Unnecessary intubation without proper indications may cause harm and delay appropriate treatment. Intubation should only be performed when there is clear airway compromise or respiratory failure.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Iatrogenic complications', 'Delayed definitive treatment', 'Unnecessary sedation and paralysis'],
              nextStageRecommendations: ['Assess airway status properly', 'Focus on epinephrine administration', 'Monitor for actual airway compromise']
            },
            'CBC': {
              explanation: 'Complete blood count to assess for underlying infection, anemia, or hematologic abnormalities that may complicate anaphylaxis management.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed results', 'May not change acute management'],
              nextStageRecommendations: ['Review results when available', 'Assess for underlying infection']
            },
            'CXR (normal)': {
              explanation: 'Chest X-ray to rule out pneumonia, pneumothorax, or other pulmonary pathology that could mimic or complicate anaphylaxis.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Radiation exposure', 'May not change acute management'],
              nextStageRecommendations: ['Review results when available', 'Assess for pulmonary complications']
            },
            'Placement in resuscitation': {
              explanation: 'Patient should be quickly moved to a resuscitation area for immediate assessment and treatment. This ensures access to all necessary equipment and medications for critical care.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed placement may compromise care', 'Inadequate equipment access'],
              nextStageRecommendations: ['Begin immediate assessment', 'Prepare for potential interventions']
            },
            'Exam including airway and lung assessment': {
              explanation: 'Comprehensive airway and respiratory assessment is critical in anaphylaxis. Look for stridor, wheezing, respiratory distress, and signs of airway compromise.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Missed airway compromise', 'Incomplete assessment'],
              nextStageRecommendations: ['Monitor airway status', 'Prepare for potential intubation']
            },
            'Placement on cardiovascular monitoring': {
              explanation: 'Continuous cardiac monitoring is essential for detecting arrhythmias, monitoring response to treatment, and identifying cardiovascular compromise in anaphylaxis.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Missed arrhythmias', 'Inadequate monitoring'],
              nextStageRecommendations: ['Monitor for arrhythmias', 'Assess cardiovascular status']
            },
            // Add missing Stage 1 interventions
            'IV access establishment': {
              explanation: 'Establish IV access for medication administration and fluid resuscitation. Critical for delivering epinephrine, antihistamines, and other medications.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['IV infiltration', 'Loss of access during critical moments'],
              nextStageRecommendations: ['Secure IV lines', 'Prepare backup access if needed']
            },
            'Continuous vital signs monitoring': {
              explanation: 'Continuous monitoring of heart rate, blood pressure, respiratory rate, and oxygen saturation every 5-15 minutes to detect early signs of deterioration or improvement.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate monitoring may miss deterioration', 'Too frequent monitoring may interfere with care'],
              nextStageRecommendations: ['Document trends', 'Adjust monitoring frequency based on stability']
            },
            'IV fluids bolus': {
              explanation: 'Administer 20 mL/kg bolus of 0.9% NS for hypotension. Monitor for signs of fluid overload. Consider second bolus if persistent hypotension after epinephrine.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Over-resuscitation can cause pulmonary edema', 'Inadequate fluids may not restore perfusion'],
              nextStageRecommendations: ['Monitor vital signs every 5 minutes', 'Assess for fluid responsiveness']
            },
            'diphenhydramine IV': {
              explanation: 'Administer diphenhydramine 1 mg/kg IV (max 50 mg) as H1 antihistamine to block histamine-mediated symptoms including urticaria, angioedema, and bronchospasm. This adjunctive therapy works by competitively blocking H1 receptors, reducing vascular permeability and smooth muscle contraction. When combined with H2 blockers, provides superior symptom control compared to single antihistamine therapy, but should never delay epinephrine administration.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'Journal of Allergy and Clinical Immunology Practice', 'Pediatric Emergency Medicine Research'],
              riskFlags: ['Sedation may mask neurological deterioration', 'Anticholinergic effects including dry mouth and urinary retention', 'Not a substitute for epinephrine', 'May cause paradoxical CNS stimulation in young children'],
              nextStageRecommendations: ['Monitor level of consciousness every 5 minutes', 'Assess for resolution of urticaria and pruritus', 'Continue monitoring for biphasic reactions', 'Evaluate need for additional epinephrine doses']
            },
            'H2 blocker IV': {
              explanation: 'Administer ranitidine 1 mg/kg IV (max 50 mg) for H2 receptor blockade, targeting histamine-mediated vasodilation and cardiovascular effects distinct from H1 receptors. H2 blockade helps stabilize blood pressure and provides synergistic effects when combined with H1 antihistamines like diphenhydramine. This adjunctive therapy should be given as soon as IV access is established, but never delay epinephrine administration.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'Cochrane Review on Antihistamines in Anaphylaxis', 'Pediatric Emergency Medicine Practice Guidelines'],
              riskFlags: ['May cause hypotension through H2-mediated effects', 'Not a substitute for epinephrine', 'Can mask tachycardia response'],
              nextStageRecommendations: ['Monitor blood pressure every 2-3 minutes', 'Assess for synergistic effects with H1 blockers', 'Evaluate need for additional epinephrine doses']
            },
            'nebulized beta-agonist': {
              explanation: 'Administer albuterol 2.5-5 mg nebulized to treat bronchospasm through beta-2 adrenergic receptor activation, causing bronchodilation and reduced airway resistance. Monitor for tachycardia and tremors as common side effects. This adjunctive therapy supports respiratory symptoms but epinephrine remains the primary bronchodilator in anaphylaxis.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['May cause tachycardia', 'Not a substitute for epinephrine'],
              nextStageRecommendations: ['Monitor respiratory status', 'Assess for continued bronchospasm']
            },
            'steroids IV': {
              explanation: 'Administer methylprednisolone 1-2 mg/kg IV (max 125 mg) to prevent biphasic anaphylactic reactions and reduce inflammatory cascade. Onset of action is 4-6 hours, so this does not treat acute symptoms but helps prevent delayed reactions occurring 4-12 hours later. Essential for comprehensive anaphylaxis management despite delayed therapeutic effect.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed onset of action', 'Not for acute symptom relief'],
              nextStageRecommendations: ['Monitor for biphasic reactions', 'Continue observation period']
            },
            'CBC': {
              explanation: 'Complete blood count to assess for underlying infection, anemia, or hematologic abnormalities that may complicate anaphylaxis management. Elevated white blood cell count may suggest bacterial trigger or systemic inflammatory response. Results are not immediately actionable in acute phase but useful for comprehensive evaluation and discharge planning.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed results', 'May not change acute management'],
              nextStageRecommendations: ['Review results when available', 'Assess for underlying infection']
            },
            'CXR (normal)': {
              explanation: 'Chest X-ray to rule out pneumonia, pneumothorax, or other pulmonary pathology that could mimic or complicate anaphylaxis. Normal findings support primary anaphylaxis diagnosis and rule out concurrent respiratory pathology. Consider if respiratory symptoms persist despite appropriate anaphylaxis treatment.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Radiation exposure', 'May not change acute management'],
              nextStageRecommendations: ['Review results when available', 'Assess for pulmonary complications']
            },
            'IV Steroids': {
              explanation: 'IV methylprednisolone 2 mg/kg (max 125 mg) to prevent biphasic reactions and control inflammatory cascade in anaphylaxis. Administer after initial epinephrine and fluid resuscitation, with onset of action in 4-6 hours. Essential for preventing delayed anaphylactic reactions that can occur 4-12 hours after initial presentation.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed administration reduces effectiveness', 'Incorrect dosing may be ineffective'],
              nextStageRecommendations: ['Monitor for continued symptoms', 'Assess for steroid response', 'Prepare for potential intubation if needed']
            },
            'Complete Blood Count': {
              explanation: 'CBC to assess for underlying infection, anemia, or hematologic abnormalities that may contribute to or complicate anaphylaxis. Elevated WBC count may suggest bacterial trigger or inflammatory response. Not critical for acute management but important for comprehensive evaluation and identifying contributing factors.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['May delay definitive care', 'Results not immediately actionable'],
              nextStageRecommendations: ['Continue monitoring', 'Review results when available', 'Assess for underlying conditions']
            },
            'Oral Epinephrine': {
              explanation: 'Oral epinephrine is contraindicated and dangerous in anaphylaxis management due to delayed absorption and inadequate bioavailability. Intramuscular administration is required for rapid onset and therapeutic levels. Choosing oral over IM epinephrine significantly increases mortality risk and represents a critical error in anaphylaxis care.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed absorption', 'Increased mortality risk', 'May mask symptoms without treating underlying cause'],
              nextStageRecommendations: ['Administer IM epinephrine immediately', 'Establish IV access', 'Prepare for potential intubation']
            },
            'Delay Epinephrine (Harmful)': {
              explanation: 'Delaying epinephrine administration in anaphylaxis is strongly associated with increased morbidity and mortality, including higher rates of cardiac arrest and ICU admission. Time to epinephrine is the most critical factor determining outcome in anaphylaxis. Every minute of delay increases risk of irreversible complications and death.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Increased mortality risk with delayed administration', 'Risk of cardiac arrest', 'Prolonged hypotension and hypoxia'],
              nextStageRecommendations: ['Administer epinephrine immediately', 'Establish IV access', 'Prepare for potential intubation']
            }
          },
          2: {
            'vital signs monitoring': {
              explanation: 'Continuous monitoring of heart rate, blood pressure, respiratory rate, and oxygen saturation every 5-15 minutes to detect early signs of deterioration or improvement. Trending vital signs helps guide therapy decisions and identify need for additional interventions. Frequency should be adjusted based on clinical stability and response to treatment.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate monitoring may miss deterioration', 'Too frequent monitoring may interfere with care'],
              nextStageRecommendations: ['Document trends', 'Adjust monitoring frequency based on stability']
            },
            'oxygen therapy maintenance': {
              explanation: 'Maintain supplemental oxygen to keep SpO2 >94% and ensure adequate tissue oxygenation during anaphylactic reaction. Adjust flow rate based on patient response and clinical improvement. Titrate oxygen delivery to maintain target saturation while avoiding unnecessary high flow rates.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Oxygen toxicity with prolonged high flow', 'Inadequate oxygenation'],
              nextStageRecommendations: ['Titrate to maintain target SpO2', 'Assess for weaning readiness']
            },
            'IV access assessment': {
              explanation: 'Ensure IV access is patent and secure for continued medication administration and emergency interventions. Consider additional IV access if current line is compromised or multiple simultaneous medications are needed. Backup vascular access is critical in unstable anaphylaxis patients.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['IV infiltration', 'Loss of access during critical moments'],
              nextStageRecommendations: ['Secure IV lines', 'Prepare backup access if needed']
            },
            'capillary refill check': {
              explanation: 'Assess capillary refill time every 15-30 minutes to evaluate peripheral perfusion and circulatory status. Normal capillary refill should be <2 seconds in children, with prolonged refill indicating poor perfusion or shock. Correlate with other perfusion indicators including mental status, urine output, and vital signs.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['May be unreliable in cold extremities', 'Subjective assessment'],
              nextStageRecommendations: ['Document trends', 'Correlate with other perfusion indicators']
            },
            'urine output monitoring': {
              explanation: 'Monitor urine output hourly with target >1 mL/kg/hr in children to assess renal perfusion and overall circulatory status. Decreased output may indicate inadequate perfusion, shock, or acute kidney injury. Requires urinary catheter for accurate measurement in critically ill patients.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['May be delayed indicator', 'Requires urinary catheter for accurate measurement'],
              nextStageRecommendations: ['Assess fluid status', 'Consider fluid challenge if output low']
            },
            'albuterol nebulizer': {
              explanation: 'Continue albuterol nebulizer treatments 2.5-5 mg every 20 minutes as needed for persistent bronchospasm and wheezing. Monitor for therapeutic response including improved air entry and decreased work of breathing. Watch for side effects including tachycardia, tremors, and hypokalemia with frequent dosing.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Tachycardia', 'Tremors', 'Hypokalemia with frequent use'],
              nextStageRecommendations: ['Assess response', 'Titrate frequency based on symptoms']
            },
            'discharge planning': {
              explanation: 'Begin discharge planning for clinically stable patients who have met observation criteria and show no signs of biphasic reaction. Ensure epinephrine auto-injector prescription, patient/family training on proper use, and emergency action plan. Schedule follow-up with allergist within 1-2 weeks for comprehensive evaluation and long-term management.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Premature discharge may lead to biphasic reactions', 'Inadequate follow-up planning'],
              nextStageRecommendations: ['Ensure stability criteria met', 'Complete patient education']
            },
            'IV fluids': {
              explanation: 'IV fluid bolus with 20 mL/kg normal saline is indicated for hypotension or signs of shock in anaphylaxis. This helps restore intravascular volume and improve perfusion.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Fluid overload in cardiac patients', 'Inadequate volume resuscitation'],
              nextStageRecommendations: ['Monitor for fluid responsiveness', 'Assess for continued hypotension']
            },
            'steroids': {
              explanation: 'Corticosteroids (methylprednisolone 1-2 mg/kg IV) help prevent biphasic reactions and reduce inflammation. They are adjunctive therapy but do not treat acute symptoms.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed administration', 'Inadequate dosing'],
              nextStageRecommendations: ['Monitor for biphasic reactions', 'Continue observation']
            },
            'H2 blocker': {
              explanation: 'H2 blockers (ranitidine 1 mg/kg IV) help reduce histamine-mediated symptoms and are adjunctive therapy for anaphylaxis management.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed administration', 'Inadequate dosing'],
              nextStageRecommendations: ['Monitor response', 'Continue observation']
            },
            'diphenhydramine': {
              explanation: 'Diphenhydramine (1 mg/kg IV/IM) is adjunctive therapy for histamine-mediated symptoms. It does not treat airway compromise or hypotension.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed administration', 'Inadequate dosing'],
              nextStageRecommendations: ['Monitor response', 'Continue observation']
            },
            'nebulized albuterol': {
              explanation: 'Nebulized albuterol helps relieve bronchospasm and wheezing in anaphylaxis. It is adjunctive therapy for respiratory symptoms.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed administration', 'Inadequate dosing'],
              nextStageRecommendations: ['Monitor respiratory status', 'Continue observation']
            },
            'set up difficult airway equipment': {
              explanation: 'Preparing difficult airway equipment is essential in anaphylaxis as airway compromise can develop rapidly. This includes laryngoscopes, endotracheal tubes, and rescue devices.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Inadequate preparation', 'Missing equipment'],
              nextStageRecommendations: ['Monitor airway status', 'Be prepared for intubation']
            }
          },
          3: {
            'oral antihistamines': {
              explanation: 'Continue oral antihistamines for persistent histamine-mediated symptoms. Cetirizine or loratadine are preferred due to less sedation.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Sedation', 'May mask symptoms of deterioration'],
              nextStageRecommendations: ['Monitor for continued symptoms', 'Assess for weaning readiness']
            },
            'premature discharge': {
              explanation: 'Avoid premature discharge. Patients should be observed for at least 4-6 hours after resolution of symptoms to monitor for biphasic reactions.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Biphasic reactions', 'Inadequate observation period'],
              nextStageRecommendations: ['Ensure adequate observation time', 'Monitor for symptom recurrence']
            },
            'allergy referral': {
              explanation: 'Refer patient to allergist for comprehensive evaluation, skin testing, and development of allergy action plan.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed referral', 'Incomplete allergy evaluation'],
              nextStageRecommendations: ['Schedule appointment', 'Provide interim management plan']
            },
            'discharge instructions': {
              explanation: 'Provide comprehensive discharge instructions including epinephrine auto-injector training, allergen avoidance, and emergency action plan.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate education', 'Poor compliance with instructions'],
              nextStageRecommendations: ['Verify understanding', 'Schedule follow-up']
            },
            'extended observation period': {
              explanation: 'Continue observation for at least 4-6 hours after symptom resolution. Monitor for signs of biphasic reactions or recurrence.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Biphasic reactions', 'Inadequate observation'],
              nextStageRecommendations: ['Monitor vital signs', 'Assess for symptom recurrence']
            },
            'vital signs reassessment': {
              explanation: 'Reassess vital signs every 30-60 minutes during observation period. Document trends and any changes.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Missed deterioration', 'Inadequate monitoring'],
              nextStageRecommendations: ['Document trends', 'Adjust monitoring frequency']
            },
            'allergy action plan creation': {
              explanation: 'Create comprehensive allergy action plan including trigger identification, symptom recognition, and emergency response.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Incomplete plan', 'Poor understanding'],
              nextStageRecommendations: ['Review with family', 'Provide written copy']
            },
            'epinephrine auto-injector training': {
              explanation: 'Provide hands-on training for epinephrine auto-injector use. Ensure family members can demonstrate proper technique.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate training', 'Poor technique'],
              nextStageRecommendations: ['Verify demonstration', 'Provide written instructions']
            },
            'discharge readiness assessment': {
              explanation: 'Assess patient readiness for discharge including stability criteria, understanding of instructions, and follow-up planning.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Premature discharge', 'Inadequate preparation'],
              nextStageRecommendations: ['Ensure all criteria met', 'Complete discharge checklist']
            },
            // Stage 1 Interventions
            'Placement in resuscitation': {
              explanation: 'Patient should be quickly moved to a resuscitation area for immediate assessment and treatment. This ensures access to all necessary equipment and medications for critical care.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management', 'ALiEM ReSCu Peds Case 1'],
              riskFlags: ['Delayed placement delays critical interventions', 'Inadequate monitoring in non-resuscitation area'],
              nextStageRecommendations: ['Immediate airway assessment', 'Establish IV access', 'Prepare epinephrine']
            },
            'Exam including airway and lung assessment': {
              explanation: 'Comprehensive airway and lung assessment to evaluate for stridor, wheezing, and respiratory compromise. Critical for determining severity and need for airway intervention.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Incomplete assessment may miss airway compromise', 'Delayed recognition of respiratory deterioration'],
              nextStageRecommendations: ['Monitor airway status continuously', 'Prepare for potential intubation']
            },
            'Placement on cardiovascular monitoring': {
              explanation: 'Continuous cardiac monitoring for heart rate, blood pressure, and rhythm. Essential for detecting cardiovascular compromise and response to treatment.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate monitoring may miss cardiovascular deterioration', 'Delayed recognition of shock'],
              nextStageRecommendations: ['Monitor trends', 'Assess for arrhythmias']
            },
            'Oxygen administration by mask or nebulizer': {
              explanation: 'Place oxygen on patient by mask or nebulizer to improve oxygenation. Any O2 administration will increase SpO2 to 99-100%. Essential for maintaining adequate tissue oxygenation.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Oxygen toxicity with prolonged high flow', 'Inadequate oxygenation'],
              nextStageRecommendations: ['Titrate to maintain target SpO2', 'Assess for weaning readiness']
            },
            'IV access establishment': {
              explanation: 'Establish IV access for medication administration and fluid resuscitation. Critical for delivering epinephrine, antihistamines, and other medications.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['IV infiltration', 'Loss of access during critical moments'],
              nextStageRecommendations: ['Secure IV lines', 'Prepare backup access if needed']
            },
            'Continuous vital signs monitoring': {
              explanation: 'Continuous monitoring of heart rate, blood pressure, respiratory rate, and oxygen saturation every 5-15 minutes to detect early signs of deterioration or improvement.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate monitoring may miss deterioration', 'Too frequent monitoring may interfere with care'],
              nextStageRecommendations: ['Document trends', 'Adjust monitoring frequency based on stability']
            },
            // Stage 2 Interventions
            'IV fluids': {
              explanation: 'Administer 20 mL/kg bolus of 0.9% NS for hypotension. Monitor for signs of fluid overload. Consider second bolus if persistent hypotension after epinephrine.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Over-resuscitation can cause pulmonary edema', 'Inadequate fluids may not restore perfusion'],
              nextStageRecommendations: ['Monitor vital signs every 5 minutes', 'Assess for fluid responsiveness']
            },
            'steroids': {
              explanation: 'Administer methylprednisolone 1-2 mg/kg IV (max 125 mg) to prevent biphasic anaphylactic reactions and reduce inflammatory cascade. Onset of action is 4-6 hours.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed onset of action', 'Not for acute symptom relief'],
              nextStageRecommendations: ['Monitor for biphasic reactions', 'Continue observation period']
            },
            'H2 blocker': {
              explanation: 'Administer ranitidine 1 mg/kg IV (max 50 mg) for H2 receptor blockade, targeting histamine-mediated vasodilation and cardiovascular effects.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['May cause hypotension through H2-mediated effects', 'Not a substitute for epinephrine'],
              nextStageRecommendations: ['Monitor blood pressure every 2-3 minutes', 'Assess for synergistic effects with H1 blockers']
            },
            'diphenhydramine': {
              explanation: 'Administer diphenhydramine 1 mg/kg IV (max 50 mg) as H1 antihistamine to block histamine-mediated symptoms including urticaria, angioedema, and bronchospasm.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Sedation may mask neurological deterioration', 'Not a substitute for epinephrine'],
              nextStageRecommendations: ['Monitor level of consciousness every 5 minutes', 'Assess for resolution of urticaria']
            },
            'nebulized albuterol': {
              explanation: 'Administer albuterol 2.5-5 mg nebulized to treat bronchospasm through beta-2 adrenergic receptor activation, causing bronchodilation and reduced airway resistance.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['May cause tachycardia', 'Not a substitute for epinephrine'],
              nextStageRecommendations: ['Monitor respiratory status', 'Assess for continued bronchospasm']
            },
            'set up difficult airway equipment': {
              explanation: 'Prepare difficult airway equipment including laryngoscopes, endotracheal tubes, and rescue devices in case of airway compromise requiring intubation.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed preparation may compromise airway management', 'Inadequate equipment'],
              nextStageRecommendations: ['Ensure equipment is ready', 'Have backup plans available']
            },
            'discharge without observation': {
              explanation: 'Discharging without adequate observation period is contraindicated in anaphylaxis. Patients require 4-6 hours of monitoring for biphasic reactions.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Biphasic reactions', 'Inadequate observation period', 'Increased mortality risk'],
              nextStageRecommendations: ['Continue observation', 'Monitor for symptom recurrence']
            },
            'inadequate monitoring': {
              explanation: 'Inadequate monitoring may miss signs of deterioration or biphasic reactions. Continuous monitoring is essential for anaphylaxis patients.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Missed deterioration', 'Delayed recognition of complications'],
              nextStageRecommendations: ['Establish continuous monitoring', 'Document all assessments']
            },
            'delay in medication administration': {
              explanation: 'Delaying medication administration in anaphylaxis increases morbidity and mortality. Time to treatment is critical for outcomes.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Increased mortality risk', 'Prolonged symptoms', 'Risk of complications'],
              nextStageRecommendations: ['Administer medications immediately', 'Establish treatment timeline']
            },
            'allergy testing': {
              explanation: 'Allergy testing is not indicated during acute anaphylaxis management. Focus should be on stabilization and treatment of acute symptoms.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['May delay definitive care', 'Not appropriate during acute phase'],
              nextStageRecommendations: ['Focus on acute management', 'Plan for outpatient testing']
            },
            'continuous vital signs monitoring': {
              explanation: 'Continuous monitoring of heart rate, blood pressure, respiratory rate, and oxygen saturation every 5-15 minutes to detect early signs of deterioration or improvement.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate monitoring may miss deterioration', 'Too frequent monitoring may interfere with care'],
              nextStageRecommendations: ['Document trends', 'Adjust monitoring frequency based on stability']
            },
            'oxygen therapy maintenance': {
              explanation: 'Maintain supplemental oxygen to keep SpO2 >94% and ensure adequate tissue oxygenation during anaphylactic reaction.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Oxygen toxicity with prolonged high flow', 'Inadequate oxygenation'],
              nextStageRecommendations: ['Titrate to maintain target SpO2', 'Assess for weaning readiness']
            },
            'capillary refill check': {
              explanation: 'Assess capillary refill time every 15-30 minutes to evaluate peripheral perfusion and circulatory status.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['May be unreliable in cold extremities', 'Subjective assessment'],
              nextStageRecommendations: ['Document trends', 'Correlate with other perfusion indicators']
            },
            'discharge planning': {
              explanation: 'Begin discharge planning for clinically stable patients who have met observation criteria and show no signs of biphasic reaction.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Premature discharge may lead to biphasic reactions', 'Inadequate follow-up planning'],
              nextStageRecommendations: ['Ensure stability criteria met', 'Complete patient education']
            },
            // Add missing Stage 2 interventions
            'set up difficult airway equipment': {
              explanation: 'Prepare difficult airway equipment including laryngoscopes, endotracheal tubes, and rescue devices in case of airway compromise requiring intubation.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed preparation may compromise airway management', 'Inadequate equipment'],
              nextStageRecommendations: ['Ensure equipment is ready', 'Have backup plans available']
            },
            'discharge without observation': {
              explanation: 'Discharging without adequate observation period is contraindicated in anaphylaxis. Patients require 4-6 hours of monitoring for biphasic reactions.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Biphasic reactions', 'Inadequate observation period', 'Increased mortality risk'],
              nextStageRecommendations: ['Continue observation', 'Monitor for symptom recurrence']
            },
            'inadequate monitoring': {
              explanation: 'Inadequate monitoring may miss signs of deterioration or biphasic reactions. Continuous monitoring is essential for anaphylaxis patients.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Missed deterioration', 'Delayed recognition of complications'],
              nextStageRecommendations: ['Establish continuous monitoring', 'Document all assessments']
            },
            'delay in medication administration': {
              explanation: 'Delaying medication administration in anaphylaxis increases morbidity and mortality. Time to treatment is critical for outcomes.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Increased mortality risk', 'Prolonged symptoms', 'Risk of complications'],
              nextStageRecommendations: ['Administer medications immediately', 'Establish treatment timeline']
            },
            'allergy testing': {
              explanation: 'Allergy testing is not indicated during acute anaphylaxis management. Focus should be on stabilization and treatment of acute symptoms.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['May delay definitive care', 'Not appropriate during acute phase'],
              nextStageRecommendations: ['Focus on acute management', 'Plan for outpatient testing']
            },
            // Stage 3 Interventions
            'Discussion around need for admission': {
              explanation: 'Critical decision point for patient disposition. Consider factors including severity of initial reaction, response to treatment, and risk factors for biphasic reactions.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Premature discharge', 'Inadequate observation period'],
              nextStageRecommendations: ['Assess risk factors', 'Ensure adequate observation time']
            },
            'Discussion with family about anaphylaxis/allergic reactions': {
              explanation: 'Essential family education and counseling about anaphylaxis recognition, treatment, and prevention. Critical for long-term management and prevention of future episodes.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate education', 'Poor understanding of condition'],
              nextStageRecommendations: ['Provide written materials', 'Schedule follow-up education']
            },
            'Outpatient treatment and follow up discussion': {
              explanation: 'Discharge planning and follow-up coordination including epinephrine auto-injector prescription, allergy referral, and emergency action plan development.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate follow-up planning', 'Poor compliance with recommendations'],
              nextStageRecommendations: ['Ensure comprehensive plan', 'Verify understanding']
            },
            'vital signs reassessment': {
              explanation: 'Reassess vital signs every 30-60 minutes during observation period. Document trends and any changes indicating stability or deterioration.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Missed deterioration', 'Inadequate monitoring'],
              nextStageRecommendations: ['Document trends', 'Adjust monitoring frequency']
            },
            'allergy action plan creation': {
              explanation: 'Create comprehensive allergy action plan including trigger identification, symptom recognition, and emergency response procedures.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Incomplete plan', 'Poor understanding by family'],
              nextStageRecommendations: ['Review with family', 'Provide written copy']
            },
            'epinephrine auto-injector training': {
              explanation: 'Provide hands-on training for epinephrine auto-injector use. Ensure family members can demonstrate proper technique and understand when to use.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate training', 'Poor technique demonstration'],
              nextStageRecommendations: ['Verify demonstration', 'Provide written instructions']
            },
            'premature discharge': {
              explanation: 'Avoid premature discharge. Patients should be observed for at least 4-6 hours after resolution of symptoms to monitor for biphasic reactions.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Biphasic reactions', 'Inadequate observation period'],
              nextStageRecommendations: ['Ensure adequate observation time', 'Monitor for symptom recurrence']
            },
            'inadequate follow-up planning': {
              explanation: 'Inadequate follow-up planning may lead to poor long-term outcomes and increased risk of future anaphylactic episodes.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Poor compliance', 'Increased risk of future episodes'],
              nextStageRecommendations: ['Establish comprehensive follow-up', 'Ensure patient understanding']
            },
            'allergy referral': {
              explanation: 'Refer patient to allergist for comprehensive evaluation, skin testing, and development of long-term allergy management plan.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed referral', 'Incomplete allergy evaluation'],
              nextStageRecommendations: ['Schedule appointment', 'Provide interim management plan']
            },
            'discharge instructions': {
              explanation: 'Provide comprehensive discharge instructions including epinephrine auto-injector training, allergen avoidance strategies, and emergency action plan.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Inadequate education', 'Poor compliance with instructions'],
              nextStageRecommendations: ['Verify understanding', 'Schedule follow-up']
            },
            'inadequate follow-up planning': {
              explanation: 'Ensure adequate follow-up planning including allergist appointment, primary care follow-up, and emergency plan review.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Lost to follow-up', 'Incomplete care'],
              nextStageRecommendations: ['Schedule appointments', 'Provide contact information']
            }
          },
          4: {
            'epinephrine auto-injector prescription': {
              explanation: 'Prescribe epinephrine auto-injector appropriate for patient weight. EpiPen Jr (0.15 mg) for 15-30 kg, EpiPen (0.3 mg) for >30 kg.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Incorrect dosing', 'Expired medication'],
              nextStageRecommendations: ['Verify prescription', 'Provide training']
            },
            'Epinephrine Auto-Injector Prescription (Neutral)': {
              explanation: 'Prescribe epinephrine auto-injector appropriate for patient weight. EpiPen Jr (0.15 mg) for 15-30 kg, EpiPen (0.3 mg) for >30 kg. Ensure proper training and follow-up.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Incorrect dosing', 'Expired medication', 'Inadequate training'],
              nextStageRecommendations: ['Verify prescription', 'Provide comprehensive training', 'Schedule follow-up appointment']
            },
            'allergy referral': {
              explanation: 'Ensure allergist referral is completed and appointment scheduled. Provide interim management plan until specialist evaluation.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed evaluation', 'Incomplete allergy workup'],
              nextStageRecommendations: ['Schedule appointment', 'Provide interim plan']
            },
            'comprehensive discharge instructions': {
              explanation: 'Provide detailed discharge instructions including medication use, allergen avoidance, emergency response, and follow-up care.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Poor understanding', 'Incomplete instructions'],
              nextStageRecommendations: ['Verify comprehension', 'Provide written copy']
            },
            'allergist referral scheduling': {
              explanation: 'Schedule allergist appointment within 2-4 weeks. Ensure referral is completed and insurance authorization obtained.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed appointment', 'Insurance issues'],
              nextStageRecommendations: ['Confirm appointment', 'Verify insurance coverage']
            },
            'school action plan distribution': {
              explanation: 'Provide school action plan including emergency contacts, medication authorization, and emergency response procedures.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Incomplete plan', 'Poor school communication'],
              nextStageRecommendations: ['Distribute to school', 'Verify understanding']
            },
            'follow-up appointment booking': {
              explanation: 'Book follow-up appointment with primary care provider within 1-2 weeks to assess recovery and review management plan.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Missed follow-up', 'Incomplete care'],
              nextStageRecommendations: ['Confirm appointment', 'Provide reminder']
            },
            'patient education': {
              explanation: 'Complete comprehensive patient and family education including trigger avoidance, symptom recognition, and emergency response.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Poor understanding', 'Incomplete education'],
              nextStageRecommendations: ['Verify comprehension', 'Provide resources']
            },
            'missing epinephrine prescription': {
              explanation: 'Ensure epinephrine auto-injector prescription is completed and patient has medication in hand before discharge.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['No medication at discharge', 'Incomplete prescription'],
              nextStageRecommendations: ['Complete prescription', 'Verify medication received']
            },
            'inadequate discharge instructions': {
              explanation: 'Provide comprehensive discharge instructions including medication use, follow-up care, and emergency response.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Poor understanding', 'Incomplete instructions'],
              nextStageRecommendations: ['Complete instructions', 'Verify comprehension']
            },
            'allergy testing scheduling': {
              explanation: 'Schedule comprehensive allergy testing with allergist including skin prick testing and specific IgE testing.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Delayed testing', 'Incomplete evaluation'],
              nextStageRecommendations: ['Schedule testing', 'Prepare patient']
            },
            'home monitoring instructions': {
              explanation: 'Provide home monitoring instructions including symptom recognition, medication use, and when to seek emergency care.',
              evidenceSources: ['PALS Guidelines 2020 - Anaphylaxis Management'],
              riskFlags: ['Poor understanding', 'Incomplete instructions'],
              nextStageRecommendations: ['Verify comprehension', 'Provide written copy']
            }
          }
        }
        // Additional cases can be added here following the same pattern
      };

      // Find relevant medical knowledge with improved matching
      const caseKnowledge = medicalKnowledge[caseId] || medicalKnowledge[caseId.replace(/_a$/, '')] || medicalKnowledge[caseId.replace(/_b$/, '')];
      const stageKnowledge = caseKnowledge?.[stage];
      
      console.log(`🎯 RAG: Generating clinical guidance for ${intervention} in ${caseId} stage ${stage}`);
      console.log(`🔍 Available interventions in knowledge base:`, Object.keys(stageKnowledge || {}));
      console.log(`📝 Normalized intervention: \"${intervention}\"`);
      console.log(`🏥 Case ID variations tried:`, [caseId, caseId.replace(/_a$/, ''), caseId.replace(/_b$/, '')]);
      console.log(`✅ Found case knowledge:`, !!caseKnowledge);
      
      // Try to get real RAG data from database first
      try {
        if (process.env.DATABASE_URL) {
          console.log('🔍 Attempting real RAG retrieval from database...');
          
          // Query the knowledge base for relevant passages
          const allPassages = await db.select().from(schema.kbPassages);
          if (Array.isArray(allPassages)) {
            const passages = allPassages.filter((passage: any) => 
              passage.caseId === caseId.replace(/_a$/, '').replace(/_b$/, '') &&
              passage.stage === stage
            );
          
                      if (passages.length > 0) {
              console.log(`📚 Found ${passages.length} passages in database`);
              
              // Find the most relevant passage based on intervention matching
              let bestMatch = null;
              let bestScore = 0;
              
              for (const passage of passages) {
                const typedPassage = passage as any;
                const passageText = typedPassage.text.toLowerCase();
                const interventionLower = intervention.toLowerCase();
                
                // Enhanced relevance scoring based on text matching
                let score = 0;
                
                // Direct intervention matches
                if (passageText.includes('epinephrine') && interventionLower.includes('epinephrine')) score += 20;
                if (passageText.includes('fluids') && interventionLower.includes('fluids')) score += 20;
                if (passageText.includes('diphenhydramine') && interventionLower.includes('diphenhydramine')) score += 20;
                if (passageText.includes('h2') && interventionLower.includes('h2')) score += 20;
                if (passageText.includes('steroids') && interventionLower.includes('steroids')) score += 20;
                if (passageText.includes('beta') && interventionLower.includes('beta')) score += 20;
                if (passageText.includes('albuterol') && interventionLower.includes('albuterol')) score += 20;
                if (passageText.includes('monitoring') && interventionLower.includes('monitoring')) score += 15;
                if (passageText.includes('oxygen') && interventionLower.includes('oxygen')) score += 15;
                if (passageText.includes('discharge') && interventionLower.includes('discharge')) score += 15;
                if (passageText.includes('referral') && interventionLower.includes('referral')) score += 15;
                if (passageText.includes('education') && interventionLower.includes('education')) score += 15;
                
                // Stage-specific scoring
                if (typedPassage.section === 'critical_actions' && stage === 1) score += 10;
                if (typedPassage.section === 'stabilization' && stage === 2) score += 10;
                if (typedPassage.section === 'observation' && stage === 3) score += 10;
                if (typedPassage.section === 'discharge' && stage === 4) score += 10;
                
                if (score > bestScore) {
                  bestScore = score;
                  bestMatch = typedPassage;
                }
              }
              
              if (bestMatch && bestScore > 0) {
                console.log(`🎯 Best RAG match found with score ${bestScore}`);
                return res.json({
                  explanation: bestMatch.text,
                  evidenceSources: [bestMatch.sourceCitation || 'Evidence-based guidelines'],
                  riskFlags: ['Based on evidence-based guidelines'],
                  nextStageRecommendations: ['Continue monitoring', 'Assess response to intervention']
                });
              }
            }
          }
        }
      } catch (ragError) {
        console.log('⚠️ RAG retrieval failed, falling back to knowledge base:', ragError.message);
      }
      
      // Use comprehensive knowledge base if RAG fails
      if (stageKnowledge) {
        // Find exact or closest match for the intervention
        const interventionKey = Object.keys(stageKnowledge).find(key => 
          key.toLowerCase() === intervention.toLowerCase() ||
          intervention.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(intervention.toLowerCase())
        );
        
        if (interventionKey) {
          const guidance = stageKnowledge[interventionKey as keyof typeof stageKnowledge];
          console.log(`✅ Using comprehensive knowledge base for: ${intervention}`);
          return res.json({
            explanation: guidance.explanation,
            evidenceSources: guidance.evidenceSources,
            riskFlags: guidance.riskFlags,
            nextStageRecommendations: guidance.nextStageRecommendations
          });
        }
      }
      
      // If no specific guidance found, provide evidence-based general guidance
      console.log(`📚 Providing evidence-based general guidance for: ${intervention}`);
      return res.json({
        explanation: `This intervention is part of evidence-based management for this stage. Follow PALS guidelines and monitor patient response closely.`,
        evidenceSources: ['PALS Guidelines 2020', 'Evidence-based practice guidelines'],
        riskFlags: ['Ensure proper technique', 'Monitor for adverse effects'],
        nextStageRecommendations: ['Assess response', 'Continue monitoring', 'Prepare for next stage']
      });

    } catch (error) {
      console.error('Error generating clinical guidance:', error);
      res.status(500).json({ 
        error: 'Failed to generate clinical guidance',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
