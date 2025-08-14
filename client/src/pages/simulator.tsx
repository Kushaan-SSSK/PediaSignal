import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Heart, 
  Thermometer, 
  Activity, 
  Clock, 
  ArrowLeft, 
  PlayCircle, 
  PauseCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Target,
  BookOpen
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface CaseDefinition {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  stages: {
    stage: number;
    description: string;
    vitals: any;
    availableInterventions: string[];
    timeLimit: number;
    criticalActions: string[];
    branchingConditions: any[];
  }[];
  clinicalHistory: string;
  presentingSymptoms: string[];
  learningObjectives: string[];
  initialVitals: any;
  idealInterventionProgression?: {
    stage: number;
    interventionId: string;
    timeWindow: number; // seconds
    priority: number; // lower number means higher priority
    reasoning: string;
    alternatives?: string[];
  }[];
}

interface Intervention {
  id: string;
  name: string;
  description: string;
  category: string;
  timeRequired: number;
  successRate: number;
  contraindications?: string[];
  vitalEffects?: {
    immediate?: number;
    delayed?: number;
    duration?: number;
  };
}

// Interventions will be fetched from API
let interventions: Record<string, Intervention> = {};

interface VitalSigns {
  heartRate: number;
  temperature: number;
  respRate: number;
  oxygenSat?: number;
  bloodPressure?: string;
  consciousness?: string;
}

interface AppliedIntervention {
  id: string;
  name: string;
  applied: boolean;
  timeApplied?: number;
  cooldownEnd?: number;
  success: boolean;
}

export default function Simulator() {
  const [location] = useLocation();
  const [currentCase, setCurrentCase] = useState<CaseDefinition | null>(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [vitals, setVitals] = useState<VitalSigns>({} as VitalSigns);
  const [availableInterventions, setAvailableInterventions] = useState<AppliedIntervention[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [stageTime, setStageTime] = useState(0);
  const [aiExplanation, setAiExplanation] = useState("");
  const [caseComplete, setCaseComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergencyEvents, setEmergencyEvents] = useState<string[]>([]);
  const [patientDeterioration, setPatientDeterioration] = useState(false);
  const [complications, setComplications] = useState<string[]>([]);
  const [lastInterventionTime, setLastInterventionTime] = useState(0);

  // Immediate debugging
  console.log('Simulator component rendered');
  console.log('Current URL:', window.location.href);
  console.log('Loading state:', loading);
  console.log('Error state:', error);
  console.log('Component state initialized');

  // Fetch interventions and case data when component mounts
  useEffect(() => {
    console.log('useEffect triggered - starting initialization');
    console.log('useEffect callback executing...');
    
    const initializeSimulator = async () => {
      try {
        console.log('Initializing simulator...');
        setLoading(true);
        setError(null);
        
        // Fetch interventions first
        console.log('Fetching interventions...');
        const interventionsResponse = await fetch('/api/interventions');
        console.log('Interventions response status:', interventionsResponse.status);
        
        if (interventionsResponse.ok) {
          const interventionsData = await interventionsResponse.json();
          interventions = interventionsData;
          console.log('Interventions loaded:', Object.keys(interventionsData).length);
        } else {
          console.error('Failed to fetch interventions');
        }
        
        // Then fetch case data
        const urlParams = new URLSearchParams(window.location.search);
        const caseId = urlParams.get('caseId');
        console.log('Case ID from URL:', caseId);
        
        if (!caseId) {
          setError('No case ID provided');
          setLoading(false);
          return;
        }
        
        console.log('Fetching case data...');
        const caseResponse = await fetch(`/api/cases/${caseId}`);
        console.log('Case response status:', caseResponse.status);
        
        if (caseResponse.ok) {
          const foundCase = await caseResponse.json();
          console.log('Case loaded:', foundCase.name);
          setCurrentCase(foundCase);
          setVitals(foundCase.initialVitals);
          
          // Only initialize interventions if we have both case and interventions data
          if (interventions && Object.keys(interventions).length > 0) {
            initializeInterventions(foundCase.stages[0]);
          } else {
            console.log('Waiting for interventions to load before initializing...');
          }
        } else {
          setError('Case not found');
          console.error('Case not found');
        }
      } catch (error) {
        setError('Failed to load case');
        console.error('Error fetching case:', error);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };
    
    console.log('About to call initializeSimulator...');
    initializeSimulator();
    console.log('initializeSimulator called');
  }, []); // Remove location dependency to run only once on mount

  // Initialize interventions once both case and interventions are loaded
  useEffect(() => {
    if (currentCase && interventions && Object.keys(interventions).length > 0) {
      console.log('Both case and interventions loaded, initializing interventions...');
      initializeInterventions(currentCase.stages[0]);
    }
  }, [currentCase, interventions]);

  // Define initializeInterventions function before useEffect hooks
  const initializeInterventions = (stage: any) => {
    if (!stage || !stage.availableInterventions || !interventions) {
      console.log('Cannot initialize interventions - missing data:', { 
        hasStage: !!stage, 
        hasInterventions: !!stage?.availableInterventions,
        interventionsLoaded: !!interventions 
      });
      return;
    }
    
    const stageInterventions = stage.availableInterventions.map((interventionId: string) => {
      const intervention = interventions[interventionId];
      if (!intervention) {
        console.warn(`Intervention not found: ${interventionId}`);
        return {
          id: interventionId,
          name: `Unknown Intervention (${interventionId})`,
          applied: false,
          timeApplied: undefined,
          cooldownEnd: undefined,
          success: false
        };
      }
      
      return {
        id: interventionId,
        name: intervention.name,
        applied: false,
        timeApplied: undefined,
        cooldownEnd: undefined,
        success: false
      };
    });
    setAvailableInterventions(stageInterventions);
  };

  // Check URL changes and reload if needed
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId');
    
    if (caseId && (!currentCase || currentCase.id !== caseId)) {
      console.log('URL changed, reloading case:', caseId);
      setLoading(true);
      setError(null);
      
      // Reload the case
      const reloadCase = async () => {
        try {
          const caseResponse = await fetch(`/api/cases/${caseId}`);
          if (caseResponse.ok) {
            const foundCase = await caseResponse.json();
            setCurrentCase(foundCase);
            setVitals(foundCase.initialVitals);
            if (interventions && Object.keys(interventions).length > 0) {
              initializeInterventions(foundCase.stages[0]);
            }
          } else {
            setError('Case not found');
          }
        } catch (error) {
          setError('Failed to load case');
        } finally {
          setLoading(false);
        }
      };
      
      reloadCase();
    }
  }, [location, currentCase, interventions]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && currentCase) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
        setStageTime(prev => prev + 1);
        
        // Check for stage progression
        checkStageProgression();
        
        // Update vitals based on interventions and time
        updateVitals();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentCase, availableInterventions]);

  const checkStageProgression = () => {
    if (!currentCase) return;
    
    const currentStageData = currentCase.stages.find(s => s.stage === currentStage);
    if (!currentStageData) return;

    // Check if stage time limit exceeded
    if (currentStageData.timeLimit && stageTime >= currentStageData.timeLimit) {
      // Auto-advance to next stage or complete case
      if (currentStage < currentCase.stages.length) {
        advanceStage();
      } else {
        completeCase();
      }
    }

    // Check branching conditions
    currentStageData.branchingConditions.forEach(condition => {
      if (shouldTriggerBranching(condition)) {
        advanceStage();
        // Apply vital changes from branching
        setVitals(prev => ({ ...prev, ...condition.vitalsChange }));
      }
    });
  };

  const shouldTriggerBranching = (condition: any) => {
    // This is a simplified branching logic - in practice, you'd have more complex conditions
    switch (condition.condition) {
      case 'airway_compromised':
        return vitals.oxygenSat && vitals.oxygenSat < 90;
      case 'recurrent_seizure':
        return vitals.consciousness === 'seizing';
      case 'respiratory_failure':
        return vitals.oxygenSat && vitals.oxygenSat < 85;
      case 'severe_exacerbation':
        return vitals.oxygenSat && vitals.oxygenSat < 88;
      case 'improvement':
        return vitals.oxygenSat && vitals.oxygenSat > 92;
      default:
        return false;
    }
  };

  const advanceStage = () => {
    if (!currentCase) return;
    
    const nextStage = currentStage + 1;
    if (nextStage <= currentCase.stages.length) {
      setCurrentStage(nextStage);
      setStageTime(0);
      
      const nextStageData = currentCase.stages.find(s => s.stage === nextStage);
      if (nextStageData) {
        setVitals(nextStageData.vitals);
        initializeInterventions(nextStageData);
        
        // Show stage transition message
        setAiExplanation(`<strong>Stage ${nextStage} Started</strong>\n\n<em>New Phase:</em> ${nextStageData.description}\n\n<em>Available Interventions:</em> ${nextStageData.availableInterventions.map(id => interventions[id]?.name || id).join(', ')}\n\n<em>Time Limit:</em> ${nextStageData.timeLimit ? Math.floor(nextStageData.timeLimit / 60) : 'No'} minutes\n\n<em>Critical Actions:</em> ${nextStageData.criticalActions.join(', ')}`);
      }
    } else {
      completeCase();
    }
  };

  const updateVitals = useCallback(() => {
    if (!currentCase) return;

    setVitals(prev => {
      let newVitals = { ...prev };
      
      // Apply intervention effects based on evidence-based vitalEffects
      availableInterventions.forEach(intervention => {
        if (intervention.applied && intervention.success) {
          const interventionDef = interventions[intervention.id];
          if (!interventionDef || !interventionDef.vitalEffects) return;
          
          const timeSinceApplied = timeElapsed - (intervention.timeApplied || 0);
          
          // Apply immediate effects (within first 30 seconds)
          if (timeSinceApplied <= 30) {
            Object.entries(interventionDef.vitalEffects).forEach(([vital, effect]) => {
              if (effect.immediate !== 0) {
                switch (vital) {
                  case 'heartRate':
                    newVitals.heartRate = Math.max(40, Math.min(220, (newVitals.heartRate || 120) + effect.immediate));
                    break;
                  case 'respRate':
                    newVitals.respRate = Math.max(8, Math.min(80, (newVitals.respRate || 20) + effect.immediate));
                    break;
                  case 'oxygenSat':
                    newVitals.oxygenSat = Math.max(70, Math.min(100, (newVitals.oxygenSat || 95) + effect.immediate));
                    break;
                  case 'temperature':
                    newVitals.temperature = Math.max(95, Math.min(107, (newVitals.temperature || 98.6) + effect.immediate));
                    break;
                  case 'bloodPressure':
                    if (newVitals.bloodPressure && effect.immediate !== 0) {
                      const [systolic, diastolic] = newVitals.bloodPressure.split('/').map(Number);
                      const newSystolic = Math.max(50, Math.min(200, systolic + effect.immediate));
                      const newDiastolic = Math.max(30, Math.min(120, diastolic + effect.immediate));
                      newVitals.bloodPressure = `${newSystolic}/${newDiastolic}`;
                    }
                    break;
                }
              }
            });
          }
          
          // Apply delayed effects (after immediate phase, within duration)
          if (timeSinceApplied > 30 && timeSinceApplied <= (interventionDef.vitalEffects.duration || 0)) {
            Object.entries(interventionDef.vitalEffects).forEach(([vital, effect]) => {
              if (effect.delayed !== 0) {
                switch (vital) {
                  case 'heartRate':
                    newVitals.heartRate = Math.max(40, Math.min(220, (newVitals.heartRate || 120) + effect.delayed));
                    break;
                  case 'respRate':
                    newVitals.respRate = Math.max(8, Math.min(80, (newVitals.respRate || 20) + effect.delayed));
                    break;
                  case 'oxygenSat':
                    newVitals.oxygenSat = Math.max(70, Math.min(100, (newVitals.oxygenSat || 95) + effect.delayed));
                    break;
                  case 'temperature':
                    newVitals.temperature = Math.max(95, Math.min(107, (newVitals.temperature || 98.6) + effect.delayed));
                    break;
                  case 'bloodPressure':
                    if (newVitals.bloodPressure && effect.delayed !== 0) {
                      const [systolic, diastolic] = newVitals.bloodPressure.split('/').map(Number);
                      const newSystolic = Math.max(50, Math.min(200, systolic + effect.delayed));
                      const newDiastolic = Math.max(30, Math.min(120, diastolic + effect.delayed));
                      newVitals.bloodPressure = `${newSystolic}/${newDiastolic}`;
                    }
                    break;
                }
              }
            });
          }
        }
      });
      
      // Natural progression of vitals based on underlying condition
      const currentStageData = currentCase.stages.find(s => s.stage === currentStage);
      if (currentStageData && currentStageData.vitals) {
        // Apply natural disease progression if no effective interventions
        const hasEffectiveO2Intervention = availableInterventions.some(i => 
          i.applied && i.success && 
          (i.id === 'oxygen_support' || i.id === 'high_flow_nasal_cannula' || i.id === 'noninvasive_ventilation')
        );
        
        const hasEffectiveFeverIntervention = availableInterventions.some(i => 
          i.applied && i.success && 
          (i.id === 'antipyretic' || i.id === 'cooling_measures')
        );
        
        const hasEffectiveSeizureIntervention = availableInterventions.some(i => 
          i.applied && i.success && 
          (i.id === 'benzodiazepine' || i.id === 'levetiracetam')
        );
        
        // Natural oxygen deterioration if no effective O2 intervention
        if (newVitals.oxygenSat && newVitals.oxygenSat < 90 && !hasEffectiveO2Intervention) {
          newVitals.oxygenSat = Math.max(70, newVitals.oxygenSat - 1);
        }
        
        // Natural fever progression if no antipyretic
        if (newVitals.temperature && newVitals.temperature > 100.4 && !hasEffectiveFeverIntervention) {
          newVitals.temperature = Math.min(105, newVitals.temperature + 0.1);
        }
        
        // Natural respiratory deterioration if no effective intervention
        if (newVitals.respRate && newVitals.respRate > 30 && !hasEffectiveO2Intervention) {
          newVitals.respRate = Math.min(60, newVitals.respRate + 1);
        }
        
        // Natural tachycardia if no effective intervention
        if (newVitals.heartRate && newVitals.heartRate > 140 && !hasEffectiveO2Intervention) {
          newVitals.heartRate = Math.min(200, newVitals.heartRate + 2);
        }
        
        // Natural consciousness deterioration if no effective seizure intervention
        if (newVitals.consciousness && newVitals.consciousness === 'post-ictal' && !hasEffectiveSeizureIntervention) {
          // 30% chance of recurrent seizure if no intervention
          if (Math.random() < 0.3) {
            newVitals.consciousness = 'seizing';
            newVitals.heartRate = Math.min(200, (newVitals.heartRate || 120) + 20);
            newVitals.respRate = Math.min(80, (newVitals.respRate || 20) + 10);
          }
        }
      }
      
      return newVitals;
    });
  }, [currentCase, availableInterventions, currentStage, timeElapsed, interventions]);

  const applyIntervention = (interventionId: string) => {
    const intervention = interventions[interventionId];
    if (!intervention) return;

    const now = Date.now();
    setLastInterventionTime(now);
    
    // Determine success with potential complications
    const success = Math.random() < intervention.successRate;
    let complications = [];
    
    if (success) {
      // SUCCESS: Comprehensive vital sign improvements across ALL systems
      setVitals(prev => {
        const newVitals = { ...prev };
        
        // Every intervention affects multiple vital systems
        if (interventionId === 'assess_airway') {
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 8);
          newVitals.consciousness = newVitals.consciousness === 'unresponsive' ? 'lethargic' : 
                                   newVitals.consciousness === 'lethargic' ? 'anxious' : 'alert';
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 3);
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 10);
        }
        
        if (interventionId === 'oxygen_support') {
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 15);
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 5);
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 15);
          newVitals.consciousness = newVitals.consciousness === 'unresponsive' ? 'lethargic' : 
                                   newVitals.consciousness === 'lethargic' ? 'anxious' : 'alert';
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 8) : Math.min(90, parseInt(bp) + 5)
            ).join('/') : "100/70";
        }
        
        if (interventionId === 'nebulizer') {
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 8);
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 12);
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 8);
          newVitals.consciousness = newVitals.consciousness === 'anxious' ? 'alert' : newVitals.consciousness;
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 5) : Math.min(90, parseInt(bp) + 3)
            ).join('/') : "100/70";
        }
        
        if (interventionId === 'continuous_nebulizer') {
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 12);
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 18);
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 12);
          newVitals.consciousness = 'alert';
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 8) : Math.min(90, parseInt(bp) + 5)
            ).join('/') : "100/70";
        }
        
        if (interventionId === 'antipyretic') {
          newVitals.temperature = Math.max(95, (newVitals.temperature || 100) - 2.5);
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 15);
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 5);
          newVitals.consciousness = newVitals.consciousness === 'seizing' ? 'lethargic' : 
                                   newVitals.consciousness === 'lethargic' ? 'anxious' : 'alert';
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 5);
        }
        
        if (interventionId === 'benzodiazepine') {
          newVitals.consciousness = 'alert';
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 20);
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 8);
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 10);
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 10) : Math.min(90, parseInt(bp) + 6)
            ).join('/') : "100/70";
        }
        
        if (interventionId === 'iv_fluids') {
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 12) : Math.min(90, parseInt(bp) + 8)
            ).join('/') : "100/70";
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 8);
          newVitals.consciousness = newVitals.consciousness === 'lethargic' ? 'anxious' : newVitals.consciousness;
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 3);
        }
        
        if (interventionId === 'vasopressors') {
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 20) : Math.min(90, parseInt(bp) + 15)
            ).join('/') : "120/85";
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 5);
          newVitals.consciousness = newVitals.consciousness === 'unresponsive' ? 'lethargic' : 
                                   newVitals.consciousness === 'lethargic' ? 'anxious' : 'alert';
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 8);
        }
        
        if (interventionId === 'endotracheal_intubation') {
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 25);
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 10);
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 15);
          newVitals.consciousness = 'sedated';
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 15) : Math.min(90, parseInt(bp) + 10)
            ).join('/') : "110/75";
        }
        
        if (interventionId === 'chest_compressions') {
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 25);
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 18) : Math.min(90, parseInt(bp) + 12)
            ).join('/') : "115/80";
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 12);
          newVitals.consciousness = newVitals.consciousness === 'unresponsive' ? 'lethargic' : newVitals.consciousness;
        }
        
        if (interventionId === 'defibrillation') {
          newVitals.heartRate = 80; // Normal sinus rhythm
          newVitals.bloodPressure = "110/70";
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 15);
          newVitals.consciousness = 'lethargic';
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 5);
        }
        
        // Rapid Response Interventions
        if (interventionId === 'rapid_oxygen_boost') {
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 15);
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 5);
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 8);
          newVitals.consciousness = newVitals.consciousness === 'unresponsive' ? 'lethargic' : 
                                   newVitals.consciousness === 'lethargic' ? 'anxious' : 'alert';
        }
        
        if (interventionId === 'rapid_cardiac_stabilization') {
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 25);
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 10) : Math.min(90, parseInt(bp) + 6)
            ).join('/') : "100/70";
          newVitals.consciousness = newVitals.consciousness === 'unresponsive' ? 'lethargic' : 
                                   newVitals.consciousness === 'lethargic' ? 'anxious' : 'alert';
        }
        
        if (interventionId === 'rapid_airway_protection') {
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 20);
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 8);
          newVitals.consciousness = 'lethargic';
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 10);
        }
        
        if (interventionId === 'rapid_pressure_support') {
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.min(140, parseInt(bp) + 15) : Math.min(90, parseInt(bp) + 10)
            ).join('/') : "100/70";
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 10);
          newVitals.consciousness = newVitals.consciousness === 'unresponsive' ? 'lethargic' : 
                                   newVitals.consciousness === 'lethargic' ? 'anxious' : 'alert';
        }
        
        if (interventionId === 'rapid_fever_control') {
          newVitals.temperature = Math.max(95, (newVitals.temperature || 100) - 3);
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 20);
          newVitals.consciousness = newVitals.consciousness === 'seizing' ? 'lethargic' : 
                                   newVitals.consciousness === 'lethargic' ? 'anxious' : 'alert';
        }
        
        if (interventionId === 'rapid_respiratory_control') {
          newVitals.respRate = Math.max(12, (newVitals.respRate || 20) - 15);
          newVitals.oxygenSat = Math.min(100, (newVitals.oxygenSat || 95) + 8);
          newVitals.heartRate = Math.max(60, (newVitals.heartRate || 120) - 12);
          newVitals.consciousness = newVitals.consciousness === 'anxious' ? 'alert' : newVitals.consciousness;
        }
        
        return newVitals;
      });
      
      // Success but with potential side effects (reduced from 20% to 10%)
      if (intervention.category === 'medication') {
        if (Math.random() < 0.1) {
          if (interventionId === 'nebulizer' || interventionId === 'continuous_nebulizer') {
            complications.push("💊 Side Effect: Patient experiencing mild tachycardia from bronchodilator");
            setVitals(prev => ({
              ...prev,
              heartRate: Math.min(200, (prev.heartRate || 120) + 8)
            }));
          }
          if (interventionId === 'benzodiazepine') {
            complications.push("💊 Side Effect: Mild respiratory depression noted - monitor closely");
            setVitals(prev => ({
              ...prev,
              respRate: Math.max(8, (prev.respRate || 20) - 3)
            }));
          }
        }
      }
      
      if (intervention.category === 'procedure') {
        if (Math.random() < 0.08) { // Reduced from 15% to 8%
          if (interventionId === 'iv_access') {
            complications.push("🔧 Complication: IV infiltration - site needs monitoring");
          }
          if (interventionId === 'chest_xray') {
            complications.push("🔧 Complication: Patient movement during imaging - may need repeat");
          }
        }
      }
    } else {
      // FAILURE: Dramatic deterioration across ALL systems
      setVitals(prev => {
        const newVitals = { ...prev };
        
        if (interventionId === 'assess_airway') {
          newVitals.oxygenSat = Math.max(60, (newVitals.oxygenSat || 95) - 15);
          newVitals.consciousness = newVitals.consciousness === 'alert' ? 'lethargic' : 'unresponsive';
          newVitals.respRate = Math.min(80, (newVitals.respRate || 20) + 12);
          newVitals.heartRate = Math.min(200, (newVitals.heartRate || 120) + 20);
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.max(50, parseInt(bp) - 15) : Math.max(30, parseInt(bp) - 10)
            ).join('/') : "70/45";
        }
        
        if (interventionId === 'oxygen_support') {
          newVitals.oxygenSat = Math.max(55, (newVitals.oxygenSat || 95) - 20);
          newVitals.respRate = Math.min(80, (newVitals.respRate || 20) + 15);
          newVitals.heartRate = Math.min(200, (newVitals.heartRate || 120) + 25);
          newVitals.consciousness = 'unresponsive';
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.max(45, parseInt(bp) - 20) : Math.max(25, parseInt(bp) - 15)
            ).join('/') : "60/40";
        }
        
        if (interventionId === 'nebulizer') {
          newVitals.respRate = Math.min(80, (newVitals.respRate || 20) + 20);
          newVitals.oxygenSat = Math.max(60, (newVitals.oxygenSat || 95) - 18);
          newVitals.heartRate = Math.min(200, (newVitals.heartRate || 120) + 30);
          newVitals.consciousness = 'lethargic';
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.max(50, parseInt(bp) - 18) : Math.max(30, parseInt(bp) - 12)
            ).join('/') : "65/43";
        }
        
        if (interventionId === 'antipyretic') {
          newVitals.temperature = Math.min(107, (newVitals.temperature || 100) + 2.5);
          newVitals.consciousness = 'seizing';
          newVitals.heartRate = Math.min(200, (newVitals.heartRate || 120) + 35);
          newVitals.respRate = Math.min(80, (newVitals.respRate || 20) + 18);
          newVitals.oxygenSat = Math.max(65, (newVitals.oxygenSat || 95) - 12);
        }
        
        if (interventionId === 'benzodiazepine') {
          newVitals.consciousness = 'seizing';
          newVitals.heartRate = Math.min(200, (newVitals.heartRate || 120) + 40);
          newVitals.respRate = Math.min(80, (newVitals.respRate || 20) + 25);
          newVitals.oxygenSat = Math.max(60, (newVitals.oxygenSat || 95) - 20);
          newVitals.bloodPressure = newVitals.bloodPressure ? 
            newVitals.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.max(45, parseInt(bp) - 25) : Math.max(25, parseInt(bp) - 18)
            ).join('/') : "55/37";
        }
        
        return newVitals;
      });
      
      // Failure consequences
      if (interventionId === 'assess_airway') {
        complications.push("❌ FAILURE: Airway assessment incomplete - patient at risk!");
      }
      
      if (interventionId === 'oxygen_support') {
        complications.push("❌ FAILURE: Oxygen delivery ineffective - patient deteriorating!");
      }
      
      if (interventionId === 'nebulizer') {
        complications.push("❌ FAILURE: Bronchodilator ineffective - bronchospasm worsening!");
      }
      
      if (interventionId === 'antipyretic') {
        complications.push("❌ FAILURE: Fever not responding - risk of recurrent seizure!");
      }
      
      if (interventionId === 'benzodiazepine') {
        complications.push("❌ FAILURE: Seizure not controlled - status epilepticus risk!");
      }
    }
    
    // Update interventions with DRAMATICALLY REDUCED cooldowns
    setAvailableInterventions(prev => prev.map(i => {
      if (i.id === interventionId) {
        // Emergency interventions have very short cooldowns
        let cooldownMultiplier = 1;
        
        if (intervention.category === 'critical') cooldownMultiplier = 0.1; // 90% reduction
        else if (intervention.category === 'emergency') cooldownMultiplier = 0.2; // 80% reduction
        else if (intervention.category === 'medication') cooldownMultiplier = 0.3; // 70% reduction
        else if (intervention.category === 'procedure') cooldownMultiplier = 0.4; // 60% reduction
        else cooldownMultiplier = 0.5; // 50% reduction for supportive
        
        const cooldownDuration = Math.max(5000, intervention.timeRequired * 1000 * cooldownMultiplier); // Minimum 5 seconds
        
        return {
          ...i,
          applied: true,
          timeApplied: timeElapsed,
          cooldownEnd: now + cooldownDuration,
          success: success
        };
      }
      return i;
    }));
    
    // Show complications if any
    if (complications.length > 0) {
      setComplications(prev => [...prev, ...complications]);
      setTimeout(() => {
        setComplications(prev => prev.filter(c => !complications.includes(c)));
      }, 8000);
    }
    
    // Reset patient deterioration if intervention successful
    if (success) {
      setPatientDeterioration(false);
    }
    
    // Generate AI explanation
    generateAIExplanation(interventionId);
  };

  const generateAIExplanation = (interventionId: string) => {
    const intervention = interventions[interventionId];
    if (!intervention) return;

    let explanation = `<strong>${intervention.name}</strong> - Clinical Guidance\n\n`;
    
    // Add intervention description in conversational tone
    explanation += `<em>What you're doing:</em> ${intervention.description}\n\n`;
    
    // Check if this intervention is optimal at this moment
    if (currentCase && currentCase.idealInterventionProgression) {
      const idealProgression = currentCase.idealInterventionProgression.filter(
        p => p.stage === currentStage && p.interventionId === interventionId
      );
      
      if (idealProgression.length > 0) {
        const ideal = idealProgression[0];
        const timeSinceStageStart = stageTime;
        
        if (timeSinceStageStart <= ideal.timeWindow) {
          explanation += `<em>Great timing!</em> This intervention is being applied at the optimal moment. ${ideal.reasoning}\n\n`;
        } else {
          explanation += `<em>Timing consideration:</em> While this intervention is still valuable, it would have been more effective earlier. ${ideal.reasoning}\n\n`;
          
          // Suggest what might have been better to do first
          const earlierInterventions = currentCase.idealInterventionProgression.filter(
            p => p.stage === currentStage && p.priority < ideal.priority
          );
          
          if (earlierInterventions.length > 0) {
            explanation += `<em>For future reference:</em> In similar cases, consider addressing these first:\n`;
            earlierInterventions.forEach(earlier => {
              const earlierIntervention = interventions[earlier.interventionId];
              if (earlierIntervention) {
                explanation += `• ${earlierIntervention.name} - ${earlier.reasoning}\n`;
              }
            });
            explanation += '\n';
          }
        }
        
        // Suggest alternatives if available
        if (ideal.alternatives && ideal.alternatives.length > 0) {
          explanation += `<em>Alternative approaches:</em> You could also consider:\n`;
          ideal.alternatives.forEach(altId => {
            const altIntervention = interventions[altId];
            if (altIntervention) {
              explanation += `• ${altIntervention.name}\n`;
            }
          });
          explanation += '\n';
        }
      } else {
        // This intervention is not in the ideal progression for this stage
        const stageInterventions = currentCase.idealInterventionProgression.filter(
          p => p.stage === currentStage
        );
        
        if (stageInterventions.length > 0) {
          explanation += `<em>Clinical consideration:</em> This intervention isn't typically the first choice for this stage. The usual priorities are:\n`;
          stageInterventions.slice(0, 3).forEach(priority => {
            const priorityIntervention = interventions[priority.interventionId];
            if (priorityIntervention) {
              explanation += `• ${priorityIntervention.name} - ${priority.reasoning}\n`;
            }
          });
          explanation += '\n';
        }
      }
    }
    
    // Add evidence-based details conversationally
    explanation += `This approach is backed by solid medical research and current clinical guidelines.\n\n`;
    
    // Add vital sign effects if available
    if (intervention.vitalEffects) {
      explanation += `<em>What to expect:</em>\n`;
      Object.entries(intervention.vitalEffects).forEach(([vital, effect]) => {
        if (effect.immediate !== 0 || effect.delayed !== 0) {
          const vitalName = vital.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          if (effect.immediate !== 0) {
            explanation += `• ${vitalName}: You'll see a change of ${effect.immediate > 0 ? '+' : ''}${effect.immediate} right away\n`;
          }
          if (effect.delayed !== 0) {
            explanation += `• ${vitalName}: Over time, expect a change of ${effect.delayed > 0 ? '+' : ''}${effect.delayed}\n`;
          }
          if (effect.duration > 0) {
            const durationMinutes = Math.round(effect.duration / 60);
            explanation += `• This effect will last about ${durationMinutes} minutes\n`;
          }
        }
      });
      explanation += '\n';
    }
    
    // Add contraindications if available
    if (intervention.contraindications && intervention.contraindications.length > 0) {
      explanation += `<em>Watch out for:</em>\n`;
      intervention.contraindications.forEach(contraindication => {
        explanation += `• ${contraindication}\n`;
      });
      explanation += '\n';
    }
    
    // Add clinical reasoning conversationally
    switch (intervention.category) {
      case 'medication':
        explanation += `<em>Why this makes sense:</em> This medication targets the root cause of the problem. Keep an eye on how the patient responds and watch for any side effects.\n\n`;
        break;
      case 'procedure':
        explanation += `<em>Why this makes sense:</em> This procedure will give us important information or provide direct treatment. Make sure you're following proper technique and watch for any complications.\n\n`;
        break;
      case 'monitoring':
        explanation += `<em>Why this makes sense:</em> Keeping a close watch lets us catch any changes early and see how well our treatments are working.\n\n`;
        break;
      case 'supportive':
        explanation += `<em>Why this makes sense:</em> This helps keep the patient comfortable and creates the best conditions for recovery.\n\n`;
        break;
    }
    
    // Add success rate information conversationally
    explanation += `Based on clinical studies, this intervention works about ${Math.round(intervention.successRate * 100)}% of the time.\n\n`;
    
    // Add time requirement conversationally
    explanation += `This will take about ${intervention.timeRequired} seconds to complete.\n\n`;
    
    // Add next steps recommendation conversationally
    explanation += `<em>What to do next:</em> Keep monitoring the patient's vital signs and overall condition. Based on how they respond, you might want to consider additional interventions.\n\n`;
    
    // Add evidence-based practice note conversationally
    explanation += `This approach follows current best practices in pediatric emergency care, based on solid medical evidence.`;
    
    setAiExplanation(explanation);
  };

  const completeCase = () => {
    setIsRunning(false);
    setCaseComplete(true);
    
    // Calculate score based on PALS/PEM standards
    const criticalActions = currentCase?.stages.flatMap(s => s.criticalActions) || [];
    const appliedActions = availableInterventions.filter(i => i.applied && i.success).map(i => i.name);
    
    let score = 0;
    const missedActions: string[] = [];
    const timeEfficiency = [];
    
    // Evaluate critical actions (70% of score)
    criticalActions.forEach(action => {
      if (appliedActions.includes(action)) {
        score += 14; // 70% / 5 critical actions = 14 points each
      } else {
        missedActions.push(action);
      }
    });
    
    // Evaluate time efficiency (20% of score)
    const expectedTime = currentCase?.estimatedTime || 15;
    const timeRatio = timeElapsed / (expectedTime * 60);
    if (timeRatio <= 1.2) {
      score += 20;
      timeEfficiency.push("Excellent time management - met PALS time standards");
    } else if (timeRatio <= 1.5) {
      score += 15;
      timeEfficiency.push("Good time management - within acceptable limits");
    } else if (timeRatio <= 2.0) {
      score += 10;
      timeEfficiency.push("Moderate time management - consider efficiency improvements");
    } else {
      timeEfficiency.push("Time management needs improvement - review PALS time standards");
    }
    
    // Evaluate intervention appropriateness (10% of score)
    const appropriateInterventions = appliedActions.filter(action => {
      const intervention = interventions[action];
      return intervention && intervention.successRate > 0.7;
    });
    const appropriatenessScore = (appropriateInterventions.length / appliedActions.length) * 10;
    score += appropriatenessScore;
    
    setScore(Math.min(100, Math.round(score)));
    
    // Generate evidence-based feedback
    const feedbackItems = [];
    
    if (missedActions.length > 0) {
      feedbackItems.push(`🚨 **Critical Actions Missed:** ${missedActions.join(', ')}`);
      feedbackItems.push("These actions are essential for patient safety and PALS compliance");
    }
    
    if (timeEfficiency.length > 0) {
      feedbackItems.push(`⏱️ **${timeEfficiency[0]}`);
    }
    
    // PALS-specific feedback
    if (score >= 90) {
      feedbackItems.push("🏆 **Outstanding Performance:** Excellent PALS protocol adherence and clinical decision-making!");
      feedbackItems.push("You demonstrated mastery of pediatric emergency assessment and management");
    } else if (score >= 80) {
      feedbackItems.push("✅ **Excellent Performance:** Strong PALS protocol adherence with minor areas for improvement");
      feedbackItems.push("Focus on time efficiency and intervention timing for even better outcomes");
    } else if (score >= 70) {
      feedbackItems.push("👍 **Good Performance:** Adequate PALS protocol adherence with room for improvement");
      feedbackItems.push("Review critical action sequences and time management strategies");
    } else if (score >= 60) {
      feedbackItems.push("⚠️ **Fair Performance:** Basic PALS protocol understanding with significant improvement needed");
      feedbackItems.push("Focus on critical action completion and evidence-based practice");
    } else {
      feedbackItems.push("❌ **Needs Improvement:** Review PALS protocols and evidence-based guidelines");
      feedbackItems.push("Practice fundamental assessment and intervention skills");
    }
    
    // Add specific learning recommendations
    if (currentCase?.category === 'febrile_seizure') {
      feedbackItems.push("📚 **Learning Focus:** Review AAP febrile seizure guidelines and PALS post-ictal management");
    } else if (currentCase?.category === 'respiratory_distress') {
      feedbackItems.push("📚 **Learning Focus:** Review PALS respiratory assessment and AAP bronchiolitis protocols");
    }
    
    setFeedback(feedbackItems);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVitalStatus = (vital: keyof VitalSigns, value: number | string | undefined) => {
    const status = {
      color: 'text-gray-600',
      icon: null,
      description: { normal: '', critical: '' }
    };

    if (value === undefined) {
      status.description.normal = 'N/A';
      return status;
    }

    switch (vital) {
      case 'heartRate':
        const hr = Number(value);
        if (hr < 60 || hr > 180) { // PALS bradycardia/tachycardia for infants/children
          status.color = 'text-red-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.critical = "Critical - Assess perfusion & rhythm";
        } else if (hr < 80 || hr > 160) {
          status.color = 'text-orange-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.normal = "Abnormal - Monitor closely";
        } else {
          status.color = 'text-green-500';
          status.icon = <CheckCircle className="w-4 h-4" />;
          status.description.normal = "Normal";
        }
        if (hr < 60) status.description.critical += " - Consider CPR if poor perfusion";
        break;
      case 'respRate':
        const rr = Number(value);
        if (rr < 10 || rr > 60) { // PALS bradypnea/tachypnea for infants/children
          status.color = 'text-red-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.critical = "Critical - Assess respiratory effort & oxygenation";
        } else if (rr < 15 || rr > 40) {
          status.color = 'text-orange-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.normal = "Abnormal - Monitor closely";
        } else {
          status.color = 'text-green-500';
          status.icon = <CheckCircle className="w-4 h-4" />;
          status.description.normal = "Normal";
        }
        if (rr > 60) status.description.critical += " - Sign of respiratory distress/failure";
        break;
      case 'oxygenSat':
        const o2 = Number(value);
        if (o2 < 90) { // PALS hypoxemia
          status.color = 'text-red-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.critical = "Critical - Administer oxygen, assess airway";
        } else if (o2 < 94) {
          status.color = 'text-orange-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.normal = "Low - Consider oxygen support";
        } else {
          status.color = 'text-green-500';
          status.icon = <CheckCircle className="w-4 h-4" />;
          status.description.normal = "Normal";
        }
        break;
      case 'temperature':
        const temp = Number(value);
        if (temp > 102.2 || temp < 96.8) { // PALS fever/hypothermia
          status.color = 'text-red-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.critical = "Critical - Address temperature dysregulation";
        } else if (temp > 100.4) {
          status.color = 'text-orange-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.normal = "Elevated - Consider antipyretics";
        } else {
          status.color = 'text-green-500';
          status.icon = <CheckCircle className="w-4 h-4" />;
          status.description.normal = "Normal";
        }
        if (temp > 104) status.description.critical += " - Consider cooling measures";
        break;
      case 'bloodPressure':
        const bp = String(value);
        // Simplified BP check, ideally age-specific
        if (bp.includes('/')) {
          const [systolic, diastolic] = bp.split('/').map(Number);
          if (systolic < 70 || systolic > 120) { // Example for a child
            status.color = 'text-red-500';
            status.icon = <AlertTriangle className="w-4 h-4" />;
            status.description.critical = "Critical - Assess perfusion, consider fluid bolus";
          } else if (systolic < 80 || systolic > 110) {
            status.color = 'text-orange-500';
            status.icon = <AlertTriangle className="w-4 h-4" />;
            status.description.normal = "Abnormal - Monitor closely";
          } else {
            status.color = 'text-green-500';
            status.icon = <CheckCircle className="w-4 h-4" />;
            status.description.normal = "Normal";
          }
        } else {
          status.description.normal = 'N/A';
        }
        break;
      case 'consciousness':
        const cons = String(value).toLowerCase();
        if (cons === 'unresponsive' || cons === 'seizing' || cons === 'lethargic') {
          status.color = 'text-red-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.critical = "Critical - Assess neurological status, protect airway";
        } else if (cons === 'irritable' || cons === 'drowsy') {
          status.color = 'text-orange-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.normal = "Abnormal - Monitor closely";
        } else {
          status.color = 'text-green-500';
          status.icon = <CheckCircle className="w-4 h-4" />;
          status.description.normal = "Normal";
        }
        break;
      default:
        status.description.normal = 'N/A';
        break;
    }
    
    return status;
  };

  // Emergency Event System - Creates real-time complications and urgency
  const triggerEmergencyEvent = useCallback(() => {
    if (!currentCase || !isRunning) return;
    
    const currentStageData = currentCase.stages.find(s => s.stage === currentStage);
    if (!currentStageData) return;
    
    const events = [];
    const now = Date.now();
    
    // Only trigger events if no intervention in last 30 seconds (patient deteriorating)
    if (now - lastInterventionTime > 30000) {
      // Random emergency events based on case type and current vitals
      if (currentCase.category === 'febrile_seizure') {
        if (vitals.temperature > 102 && Math.random() < 0.3) {
          events.push("🚨 RECURRENT SEIZURE! Patient is seizing again - immediate intervention required!");
          setVitals(prev => ({
            ...prev,
            consciousness: 'seizing',
            heartRate: Math.min(200, (prev.heartRate || 120) + 30),
            respRate: Math.min(80, (prev.respRate || 20) + 15)
          }));
        }
        if (vitals.oxygenSat < 90 && Math.random() < 0.4) {
          events.push("🚨 RESPIRATORY DISTRESS! Oxygen saturation dropping rapidly!");
          setVitals(prev => ({
            ...prev,
            oxygenSat: Math.max(70, (prev.oxygenSat || 95) - 5),
            respRate: Math.min(80, (prev.respRate || 20) + 8)
          }));
        }
      }
      
      if (currentCase.category === 'respiratory_distress') {
        if (vitals.oxygenSat < 85 && Math.random() < 0.5) {
          events.push("🚨 RESPIRATORY FAILURE! Patient developing respiratory fatigue!");
          setVitals(prev => ({
            ...prev,
            consciousness: 'lethargic',
            oxygenSat: Math.max(70, (prev.oxygenSat || 95) - 8),
            respRate: Math.min(80, (prev.respRate || 20) + 12)
          }));
        }
        if (vitals.heartRate > 180 && Math.random() < 0.3) {
          events.push("🚨 CARDIOVASCULAR COMPROMISE! Tachycardia worsening!");
          setVitals(prev => ({
            ...prev,
            heartRate: Math.min(200, (prev.heartRate || 120) + 15),
            bloodPressure: prev.bloodPressure ? 
              prev.bloodPressure.split('/').map((bp, i) => 
                i === 0 ? Math.max(50, parseInt(bp) - 8) : Math.max(30, parseInt(bp) - 5)
              ).join('/') : "80/50"
          }));
        }
      }
      
      if (currentCase.category === 'asthma_exacerbation') {
        if (vitals.respRate > 45 && Math.random() < 0.4) {
          events.push("🚨 SEVERE BRONCHOSPASM! Respiratory rate critically elevated!");
          setVitals(prev => ({
            ...prev,
            oxygenSat: Math.max(70, (prev.oxygenSat || 95) - 6),
            consciousness: 'anxious'
          }));
        }
        if (vitals.consciousness === 'anxious' && Math.random() < 0.3) {
          events.push("🚨 PATIENT AGITATION! Consciousness level deteriorating!");
          setVitals(prev => ({
            ...prev,
            consciousness: 'lethargic',
            heartRate: Math.min(200, (prev.heartRate || 120) + 20)
          }));
        }
      }
      
      // Universal emergency events
      if (vitals.oxygenSat && vitals.oxygenSat < 80 && Math.random() < 0.6) {
        events.push("🚨 CRITICAL HYPOXEMIA! Oxygen saturation critically low - immediate airway intervention needed!");
        setVitals(prev => ({
          ...prev,
          consciousness: 'unresponsive',
          heartRate: Math.min(200, (prev.heartRate || 120) + 25)
        }));
      }
      
      if (vitals.heartRate && vitals.heartRate > 190 && Math.random() < 0.4) {
        events.push("🚨 CRITICAL TACHYCARDIA! Heart rate critically elevated - risk of cardiovascular collapse!");
        setVitals(prev => ({
          ...prev,
          bloodPressure: prev.bloodPressure ? 
            prev.bloodPressure.split('/').map((bp, i) => 
              i === 0 ? Math.max(40, parseInt(bp) - 15) : Math.max(25, parseInt(bp) - 10)
            ).join('/') : "70/45"
        }));
      }
      
      if (vitals.consciousness === 'unresponsive' && Math.random() < 0.7) {
        events.push("🚨 PATIENT UNRESPONSIVE! Airway protection critical - consider intubation!");
        setVitals(prev => ({
          ...prev,
          respRate: Math.max(5, (prev.respRate || 20) - 10),
          oxygenSat: Math.max(60, (prev.oxygenSat || 95) - 15)
        }));
      }
    }
    
    if (events.length > 0) {
      setEmergencyEvents(prev => [...prev, ...events]);
      setPatientDeterioration(true);
      
      // Clear events after 10 seconds
      setTimeout(() => {
        setEmergencyEvents(prev => prev.filter(e => !events.includes(e)));
      }, 10000);
    }
  }, [currentCase, currentStage, vitals, isRunning, lastInterventionTime]);

  // Trigger emergency events every 15-45 seconds
  useEffect(() => {
    if (!isRunning || !currentCase) return;
    
    const emergencyInterval = setInterval(() => {
      triggerEmergencyEvent();
    }, Math.random() * 30000 + 15000); // Random interval between 15-45 seconds
    
    return () => clearInterval(emergencyInterval);
  }, [isRunning, currentCase, triggerEmergencyEvent]);

  // Critical Time Pressure System - Makes every second count
  const checkTimePressure = useCallback(() => {
    if (!currentCase || !isRunning) return;
    
    const currentStageData = currentCase.stages.find(s => s.stage === currentStage);
    if (!currentStageData) return;
    
    // Critical time warnings based on stage progress
    if (currentStageData.timeLimit) {
      const timeRemaining = currentStageData.timeLimit - stageTime;
      
      if (timeRemaining <= 30 && timeRemaining > 0) {
        // Last 30 seconds - critical urgency
        if (!emergencyEvents.some(e => e.includes('CRITICAL TIME PRESSURE'))) {
          setEmergencyEvents(prev => [...prev, "🚨 CRITICAL TIME PRESSURE! Only 30 seconds remaining - patient outcome depends on your actions NOW!"]);
          
          // Patient deteriorates rapidly in last 30 seconds
          setVitals(prev => ({
            ...prev,
            oxygenSat: prev.oxygenSat ? Math.max(60, prev.oxygenSat - 3) : prev.oxygenSat,
            heartRate: prev.heartRate ? Math.min(200, prev.heartRate + 8) : prev.heartRate,
            consciousness: prev.consciousness === 'alert' ? 'lethargic' : prev.consciousness
          }));
        }
      } else if (timeRemaining <= 60 && timeRemaining > 30) {
        // Last minute warning
        if (!emergencyEvents.some(e => e.includes('TIME RUNNING OUT'))) {
          setEmergencyEvents(prev => [...prev, "⏰ TIME RUNNING OUT! Less than 1 minute remaining - apply critical interventions immediately!"]);
        }
      }
      
      // Auto-fail if time runs out
      if (timeRemaining <= 0) {
        setEmergencyEvents(prev => [...prev, "💀 TIME EXPIRED! Patient condition has deteriorated due to delayed intervention!"]);
        
        // Severe deterioration when time expires
        setVitals(prev => ({
          ...prev,
          oxygenSat: prev.oxygenSat ? Math.max(50, prev.oxygenSat - 15) : prev.oxygenSat,
          heartRate: prev.heartRate ? Math.min(200, prev.heartRate + 20) : prev.heartRate,
          consciousness: 'unresponsive',
          respRate: prev.respRate ? Math.max(5, prev.respRate - 8) : prev.respRate
        }));
        
        setPatientDeterioration(true);
      }
    }
  }, [currentCase, currentStage, stageTime, isRunning, emergencyEvents]);

  // Check time pressure every 5 seconds
  useEffect(() => {
    if (!isRunning || !currentCase) return;
    
    const timePressureInterval = setInterval(() => {
      checkTimePressure();
    }, 5000);
    
    return () => clearInterval(timePressureInterval);
  }, [isRunning, currentCase, checkTimePressure]);

  // Rapid Response Intervention System - Provides critical interventions when vitals are dangerous
  const checkForRapidResponseInterventions = useCallback(() => {
    if (!currentCase || !isRunning) return;
    
    const currentStageData = currentCase.stages.find(s => s.stage === currentStage);
    if (!currentStageData) return;
    
    const rapidInterventions = [];
    
    // Check each vital and provide rapid response options
    if (vitals.oxygenSat && vitals.oxygenSat < 85) {
      rapidInterventions.push({
        id: 'rapid_oxygen_boost',
        name: '🚨 RAPID OXYGEN BOOST',
        description: 'Immediate high-flow oxygen to prevent respiratory failure',
        category: 'critical',
        timeRequired: 5, // 5 seconds
        successRate: 0.95,
        vitalEffects: {
          oxygenSat: { immediate: 15, delayed: 0, duration: 0 },
          respRate: { immediate: -5, delayed: 0, duration: 0 },
          heartRate: { immediate: -8, delayed: 0, duration: 0 }
        }
      });
    }
    
    if (vitals.heartRate && vitals.heartRate > 180) {
      rapidInterventions.push({
        id: 'rapid_cardiac_stabilization',
        name: '🚨 RAPID CARDIAC STABILIZATION',
        description: 'Immediate intervention to control dangerous tachycardia',
        category: 'critical',
        timeRequired: 8, // 8 seconds
        successRate: 0.90,
        vitalEffects: {
          heartRate: { immediate: -25, delayed: 0, duration: 0 },
          bloodPressure: { immediate: 0, delayed: 10, duration: 0 },
          consciousness: { immediate: 0, delayed: 0, duration: 0 }
        }
      });
    }
    
    if (vitals.consciousness === 'unresponsive') {
      rapidInterventions.push({
        id: 'rapid_airway_protection',
        name: '🚨 RAPID AIRWAY PROTECTION',
        description: 'Immediate airway intervention to prevent respiratory arrest',
        category: 'critical',
        timeRequired: 10, // 10 seconds
        successRate: 0.85,
        vitalEffects: {
          consciousness: { immediate: 0, delayed: 0, duration: 0 },
          oxygenSat: { immediate: 20, delayed: 0, duration: 0 },
          respRate: { immediate: -8, delayed: 0, duration: 0 }
        }
      });
    }
    
    if (vitals.bloodPressure && vitals.bloodPressure.split('/')[0] < 70) {
      rapidInterventions.push({
        id: 'rapid_pressure_support',
        name: '🚨 RAPID PRESSURE SUPPORT',
        description: 'Immediate intervention to support dangerously low blood pressure',
        category: 'critical',
        timeRequired: 12, // 12 seconds
        successRate: 0.88,
        vitalEffects: {
          bloodPressure: { immediate: 0, delayed: 15, duration: 0 },
          heartRate: { immediate: -10, delayed: 0, duration: 0 },
          consciousness: { immediate: 0, delayed: 0, duration: 0 }
        }
      });
    }
    
    if (vitals.temperature && vitals.temperature > 104) {
      rapidInterventions.push({
        id: 'rapid_fever_control',
        name: '🚨 RAPID FEVER CONTROL',
        description: 'Immediate cooling intervention to prevent brain damage',
        category: 'critical',
        timeRequired: 15, // 15 seconds
        successRate: 0.92,
        vitalEffects: {
          temperature: { immediate: -3, delayed: 0, duration: 0 },
          heartRate: { immediate: -20, delayed: 0, duration: 0 },
          consciousness: { immediate: 0, delayed: 0, duration: 0 }
        }
      });
    }
    
    if (vitals.respRate && vitals.respRate > 50) {
      rapidInterventions.push({
        id: 'rapid_respiratory_control',
        name: '🚨 RAPID RESPIRATORY CONTROL',
        description: 'Immediate intervention to control dangerously high respiratory rate',
        category: 'critical',
        timeRequired: 10, // 10 seconds
        successRate: 0.87,
        vitalEffects: {
          respRate: { immediate: -15, delayed: 0, duration: 0 },
          oxygenSat: { immediate: 8, delayed: 0, duration: 0 },
          heartRate: { immediate: -12, delayed: 0, duration: 0 }
        }
      });
    }
    
    // Add rapid response interventions to available interventions
    if (rapidInterventions.length > 0) {
      setAvailableInterventions(prev => {
        const existingIds = prev.map(i => i.id);
        const newRapidInterventions = rapidInterventions
          .filter(rapid => !existingIds.includes(rapid.id))
          .map(rapid => ({
            ...rapid,
            applied: false,
            timeApplied: 0,
            cooldownEnd: 0,
            success: null
          }));
        
        return [...prev, ...newRapidInterventions];
      });
    }
  }, [currentCase, currentStage, vitals, isRunning]);

  // Check for rapid response interventions every 10 seconds
  useEffect(() => {
    if (!isRunning || !currentCase) return;
    
    const rapidResponseInterval = setInterval(() => {
      checkForRapidResponseInterventions();
    }, 10000);
    
    return () => clearInterval(rapidResponseInterval);
  }, [isRunning, currentCase, checkForRapidResponseInterventions]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading case...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Case</h1>
          <p className="text-slate-300 mb-6">{error}</p>
          <Link href="/case-selection">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Back to Case Selection
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-6xl mx-auto text-center py-20">
          <h1 className="text-2xl font-bold text-white mb-4">Case Not Found</h1>
          <p className="text-slate-300 mb-6">The selected case could not be loaded.</p>
          <Link href="/case-selection">
            <Button className="bg-blue-600 hover:bg-blue-700">Back to Case Selection</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (caseComplete) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6 bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-white">Case Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">{score}%</div>
                <div className="text-lg text-slate-300">Final Score</div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-white">Feedback:</h3>
                {feedback.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-300">
                    <Info className="w-4 h-4 text-blue-400" />
                    {item}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4 justify-center">
                <Link href="/case-selection">
                  <Button className="bg-blue-600 hover:bg-blue-700">Try Another Case</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentStageData = currentCase.stages.find(s => s.stage === currentStage);
  const stageProgress = currentStageData?.timeLimit 
    ? Math.min(100, (stageTime / currentStageData.timeLimit) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/case-selection">
            <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
              Back to Cases
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{currentCase.name}</h1>
            <p className="text-slate-300">Stage {currentStage} of {currentCase.stages.length}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-slate-400">Total Time</div>
              <div className="text-lg font-mono text-white">{formatTime(timeElapsed)}</div>
            </div>
            <Button
              onClick={() => setIsRunning(!isRunning)}
              variant={isRunning ? "destructive" : "default"}
              className={isRunning ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {isRunning ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
          </div>
        </div>

        {/* Emergency Events Alert */}
        {emergencyEvents.length > 0 && (
          <div className="mb-6">
            <Card className="bg-red-900/30 border-red-700/50 animate-pulse">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  🚨 EMERGENCY ALERTS - IMMEDIATE ACTION REQUIRED!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {emergencyEvents.map((event, idx) => (
                    <div key={idx} className="text-red-300 text-sm font-semibold">
                      {event}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Patient Deterioration Warning */}
        {patientDeterioration && (
          <div className="mb-6">
            <Card className="bg-orange-900/30 border-orange-700/50 animate-pulse">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  ⚠️ PATIENT DETERIORATING - INTERVENTION NEEDED!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-300 text-sm">
                  Patient condition is worsening. Apply appropriate interventions immediately to prevent further deterioration.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Complications Display */}
        {complications.length > 0 && (
          <div className="mb-6">
            <Card className="bg-yellow-900/30 border-yellow-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  ⚠️ COMPLICATIONS & SIDE EFFECTS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {complications.map((complication, idx) => (
                    <div key={idx} className="text-yellow-300 text-sm font-semibold">
                      {complication}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Critical Time Pressure Indicator */}
        {currentCase && currentCase.stages.find(s => s.stage === currentStage)?.timeLimit && 
         (currentCase.stages.find(s => s.stage === currentStage)?.timeLimit || 0) - stageTime <= 60 && (
          <div className="mb-6">
            <Card className="bg-purple-900/30 border-purple-700/50 animate-pulse">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-400 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  ⏰ CRITICAL TIME PRESSURE - PATIENT OUTCOME AT STAKE!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    {Math.max(0, (currentCase.stages.find(s => s.stage === currentStage)?.timeLimit || 0) - stageTime)}s
                  </div>
                  <p className="text-purple-300 text-sm">
                    Time remaining to prevent patient deterioration. Every second counts!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Vitals, Stage Info, and Case Info */}
          <div className="space-y-6">
            {/* Vitals Monitor */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Vital Signs Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!vitals.heartRate && !vitals.temperature && !vitals.respRate ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading vital signs...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{vitals.heartRate || '--'}</div>
                        <div className="text-sm text-slate-400">Heart Rate</div>
                        <div className={`text-xs mt-1 ${getVitalStatus('heartRate', vitals.heartRate || 0).color}`}>
                          {getVitalStatus('heartRate', vitals.heartRate || 0).description.normal || getVitalStatus('heartRate', vitals.heartRate || 0).description.critical}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{vitals.respRate || '--'}</div>
                        <div className="text-sm text-slate-400">Resp Rate</div>
                        <div className={`text-xs mt-1 ${getVitalStatus('respRate', vitals.respRate || 0).color}`}>
                          {getVitalStatus('respRate', vitals.respRate || 0).description.normal || getVitalStatus('respRate', vitals.respRate || 0).description.critical}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{vitals.oxygenSat ? `${vitals.oxygenSat}%` : '--'}</div>
                        <div className="text-sm text-slate-400">O2 Sat</div>
                        <div className={`text-xs mt-1 ${getVitalStatus('oxygenSat', vitals.oxygenSat || 0).color}`}>
                          {getVitalStatus('oxygenSat', vitals.oxygenSat || 0).description.normal || getVitalStatus('oxygenSat', vitals.oxygenSat || 0).description.critical}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{vitals.temperature ? `${vitals.temperature}°F` : '--'}</div>
                        <div className="text-sm text-slate-400">Temp</div>
                        <div className={`text-xs mt-1 ${getVitalStatus('temperature', vitals.temperature || 0).color}`}>
                          {getVitalStatus('temperature', vitals.temperature || 0).description.normal || getVitalStatus('temperature', vitals.temperature || 0).description.critical}
                        </div>
                      </div>
                    </div>
                    
                    {vitals.bloodPressure && (
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{vitals.bloodPressure}</div>
                        <div className="text-sm text-slate-400">Blood Pressure</div>
                        <div className={`text-xs mt-1 ${getVitalStatus('bloodPressure', vitals.bloodPressure).color}`}>
                          {getVitalStatus('bloodPressure', vitals.bloodPressure).description.normal || getVitalStatus('bloodPressure', vitals.bloodPressure).description.critical}
                        </div>
                      </div>
                    )}
                    
                    {vitals.consciousness && (
                      <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-bold text-white capitalize">{vitals.consciousness}</div>
                        <div className="text-sm text-slate-400">Consciousness</div>
                        <div className={`text-xs mt-1 ${getVitalStatus('consciousness', vitals.consciousness).color}`}>
                          {getVitalStatus('consciousness', vitals.consciousness).description.normal || getVitalStatus('consciousness', vitals.consciousness).description.critical}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stage Progress */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Stage Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">Stage {currentStage}</div>
                  <div className="text-sm text-slate-400 mb-3">{currentStageData?.description || 'Current stage description'}</div>
                  
                  {currentStageData?.timeLimit && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Time Remaining</span>
                        <span>{Math.max(0, (currentStageData.timeLimit - stageTime))}s</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stageProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Case Information */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Case Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Clinical History</h4>
                  <p className="text-sm text-slate-300">{currentCase.clinicalHistory}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">Presenting Symptoms</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentCase.presentingSymptoms.map((symptom, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-slate-700 text-slate-200 border-slate-600">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Interventions and AI Guidance */}
          <div className="space-y-6">
            {/* Available Interventions */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Available Interventions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableInterventions.map((intervention) => {
                  const interventionDef = interventions[intervention.id];
                  if (!interventionDef) return null;
                  
                  const isOnCooldown = intervention.cooldownEnd && Date.now() < intervention.cooldownEnd;
                  const canApply = !intervention.applied && !isOnCooldown;
                  
                  return (
                    <div key={intervention.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{interventionDef.name}</h4>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400">{interventionDef.timeRequired}s</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-300 mb-3">{interventionDef.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                          Success Rate: {Math.round(interventionDef.successRate * 100)}%
                        </div>
                        
                        {intervention.applied ? (
                          <div className="flex items-center gap-2">
                            {intervention.success ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                            <span className={`text-sm ${intervention.success ? 'text-green-400' : 'text-red-400'}`}>
                              {intervention.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => applyIntervention(intervention.id)}
                            disabled={!canApply}
                            className={`w-full ${
                              canApply 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {isOnCooldown ? 'On Cooldown' : 'Apply Intervention'}
                          </Button>
                        )}
                      </div>
                      
                      {isOnCooldown && (
                        <div className="mt-2 text-xs text-slate-400">
                          Cooldown: {Math.ceil((intervention.cooldownEnd! - Date.now()) / 1000)}s remaining
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* AI Clinical Guidance */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-400" />
                  AI Clinical Guidance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiExplanation ? (
                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-sm text-slate-300"
                      dangerouslySetInnerHTML={{ __html: aiExplanation }}
                    />
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">
                    Apply an intervention to receive AI-powered clinical guidance and feedback.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
