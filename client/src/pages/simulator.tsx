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
import { InterventionsPanel } from "@/components/InterventionsPanel";
import { EnhancedVitalsMonitor } from "@/components/EnhancedVitalsMonitor";
import { ComprehensiveSimulationInterface } from "@/components/ComprehensiveSimulationInterface";
import EnhancedInterventionPopup from '@/components/EnhancedInterventionPopup';
import CaseCompletionDebrief from '@/components/CaseCompletionDebrief';
import { SimpleFeedbackModal } from '@/components/SimpleFeedbackModal';

// Import the new scoring system
import { 
  ScoringCalculator, 
  createCaseScoringCalculator,
  InteractionRecord,
  StageDefinition,
  ScoringResult
} from '@/lib/scoringCalculator';

// Import the simple feedback system
import { 
  generateSimpleFeedback,
  SimpleFeedbackResult,
  SimpleInteractionRecord,
  SimpleStageDefinition
} from '@/lib/simpleFeedback';

// Import the stage progression engine
import { StageProgressionEngine } from '@/lib/stageProgressionEngine';
import type { CaseDefinition, Intervention, VitalSigns } from '../../../shared/types';
import { useCaseTick } from '@/hooks/useCaseTick';

// Interventions will be fetched from API
let interventions: Record<string, Intervention> = {};

interface AppliedIntervention {
  id: string;
  name: string;
  applied: boolean;
  timeApplied?: number;
  cooldownEnd?: number;
  success: boolean;
  description: string;
  category: string;
  vitalEffects?: {
    heartRate?: { immediate: number; delayed: number };
    spo2?: { immediate: number; delayed: number };
    respRate?: { immediate: number; delayed: number };
    bloodPressureSys?: { immediate: number; delayed: number };
    bloodPressureDia?: { immediate: number; delayed: number };
    bloodGlucose?: { immediate: number; delayed: number };
    temperature?: { immediate: number; delayed: number };
    consciousness?: { immediate: string; delayed: string };
    capillaryRefill?: { immediate: number; delayed: number };
  };
  classification?: string;
  successRate?: number;
  timeRequired?: number;
}

export default function Simulator() {
  const [location] = useLocation();
  const [currentCase, setCurrentCase] = useState<CaseDefinition | null>(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [vitals, setVitals] = useState<VitalSigns>({} as VitalSigns);
  
  // Debug logging for vitals changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Vitals state changed:', vitals);
    }
  }, [vitals]);
  const [availableInterventions, setAvailableInterventions] = useState<AppliedIntervention[]>([]);
  const [interventionsLoaded, setInterventionsLoaded] = useState(false);
  const [allAppliedInterventions, setAllAppliedInterventions] = useState<AppliedIntervention[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [vitalsActive, setVitalsActive] = useState(true); // Separate state for vitals deterioration
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [stageTime, setStageTime] = useState(0);
  
  // Session data for case ticking
  const [sessionId, setSessionId] = useState<string>('');
  const [simulationId, setSimulationId] = useState<string>('');
  const [userId, setUserId] = useState<string>('1'); // Default user ID
  
  // Intervention popup state
  const [interventionPopup, setInterventionPopup] = useState<{
    isOpen: boolean;
    intervention: any;
    classification: {
      type: 'required' | 'helpful' | 'harmful' | 'neutral';
      severity: 'low' | 'moderate' | 'severe';
    };
    vitalsBefore: any;
    vitalsAfter: any;
    ragInsights: string[];
    evidenceSources: any[];
    clinicalGuidance?: string;
    suggestedNextSteps?: string[];
  }>({
    isOpen: false,
    intervention: null,
    classification: { type: 'neutral', severity: 'moderate' },
    vitalsBefore: {},
    vitalsAfter: {},
    ragInsights: [],
    evidenceSources: [],
    clinicalGuidance: '',
    suggestedNextSteps: []
  });

  // Popup queue for multiple rapid interventions
  const [popupQueue, setPopupQueue] = useState<Array<{
    intervention: any;
    classification: {
      type: 'required' | 'helpful' | 'harmful' | 'neutral';
      severity: 'low' | 'moderate' | 'severe';
    };
    vitalsBefore: any;
    vitalsAfter: any;
    ragInsights: string[];
    evidenceSources: any[];
    clinicalGuidance?: string;
    suggestedNextSteps?: string[];
  }>>([]);

  // Vitals pause state
  const [isVitalsPaused, setIsVitalsPaused] = useState(false);

  // Simple feedback modal state
  const [simpleFeedbackModal, setSimpleFeedbackModal] = useState<{
    isOpen: boolean;
    feedbackResult: SimpleFeedbackResult | null;
  }>({
    isOpen: false,
    feedbackResult: null
  });

  // Track simple interactions for feedback
  const [simpleInteractions, setSimpleInteractions] = useState<SimpleInteractionRecord[]>([]);

  // Case completion debrief state
  const [caseCompletionDebrief, setCaseCompletionDebrief] = useState<{
    isOpen: boolean;
    caseData: any;
    performance: any;
    feedback: any;
    evidenceSources: any[];
    failureReason?: string;
    scoringResult?: ScoringResult | null;
  }>({
    isOpen: false,
    caseData: {},
    performance: {},
    feedback: {},
    evidenceSources: []
  });

  // New scoring system state
  const [scoringCalculator, setScoringCalculator] = useState<ScoringCalculator | null>(null);
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [stageStartTimes, setStageStartTimes] = useState<Map<number, number>>(new Map());

  // Stage progression engine
  const [stageProgressionEngine, setStageProgressionEngine] = useState<StageProgressionEngine | null>(null);
  
  // 10-second tick timer
  const [tickTimer, setTickTimer] = useState(0);
  const [lastTickTime, setLastTickTime] = useState(0);

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
  const [lastIntervention, setLastIntervention] = useState<any>(null);

  // Computed current stage data
  const currentStageData = currentCase?.stages?.find((s: any) => s.stage === currentStage);
  
  // Determine if any modal is open (affects case ticking)
  const hasModalOpen = interventionPopup.isOpen || caseCompletionDebrief.isOpen;
  
  // Determine case severity and age band for deterioration
  const caseSeverity = currentStageData?.severity || 'moderate';
  const ageBand = currentStageData?.ageBand || 'child';

  // Case tick hook for vital sign deterioration
  const handleVitalsUpdate = useCallback((updatedVitals: VitalSigns, alerts: string[]) => {
    setVitals(updatedVitals);
    
    // Show alerts if any
    if (alerts.length > 0) {
      console.log('Deterioration alerts:', alerts);
      // Could show toast notifications here if desired
    }
  }, []);

  // Debug logging for case tick conditions
  console.log('🎯 Case Tick Status:', {
    currentCase: !!currentCase,
    sessionId: !!sessionId,
    isRunning,
    hasModalOpen,
    isActive: !!(currentCase && sessionId && isRunning),
    isPaused: !isRunning
  });

  useCaseTick({
    caseType: currentCase?.id || '',
    stage: currentStage,
    severity: caseSeverity as 'mild' | 'moderate' | 'severe',
    ageBand: ageBand,
    currentVitals: vitals,
    userId: userId,
    sessionId: sessionId,
    onVitalsUpdate: handleVitalsUpdate,
    isActive: !!(currentCase && sessionId && vitalsActive),
    isPaused: !vitalsActive,
    hasModalOpen: hasModalOpen,
  });

  // Immediate debugging
  console.log('Simulator component rendered');
  console.log('Current URL:', window.location.href);
  console.log('Loading state:', loading);
  console.log('Error state:', error);
  console.log('Component state initialized');
  console.log('Current stage data:', currentStageData);

  // Fetch interventions and case data when component mounts
  useEffect(() => {
    console.log('useEffect triggered - starting initialization');
    console.log('useEffect callback executing...');
    
    const initializeSimulator = async () => {
      try {
        console.log('Initializing simulator...');
        setLoading(true);
        setError(null);
        
        // Fetch case data first to get the case ID
        const urlParams = new URLSearchParams(window.location.search);
        const caseId = urlParams.get('caseId');
        console.log('Case ID from URL:', caseId);
        
        if (!caseId) {
          setError('No case ID provided');
          setLoading(false);
          return;
        }
        
        // Extract category from caseId (e.g., "aliem_case_01_anaphylaxis" -> "Anaphylaxis")
        const categoryMatch = caseId.match(/aliem_case_\d+_(.+)/);
        if (!categoryMatch) {
          setError('Invalid case ID format');
          setLoading(false);
          return;
        }
        
        const category = categoryMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        console.log('Extracted category:', category);
        
        console.log('Starting simulation for category:', category);
        const simulationResponse = await fetch('/api/start-simulation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: category,
            userId: 1 // Default user ID for now
          })
        });
        
        console.log('Simulation response status:', simulationResponse.status);
        
        if (simulationResponse.ok) {
          const simulationData = await simulationResponse.json();
          console.log('Simulation data received:', simulationData);
          
          // Store session information for case ticking
          if (simulationData.sessionId) {
            setSessionId(simulationData.sessionId);
          }
          if (simulationData.simulationId) {
            setSimulationId(simulationData.simulationId);
          }
          
          setCurrentCase(simulationData.caseDefinition);
          console.log('Setting vitals from simulation data (1):', simulationData.vitals);
          setVitals(simulationData.vitals);
          
          // Initialize scoring system for the case
          initializeScoringSystem(simulationData.caseDefinition);
          
          // Initialize stage progression engine
          const engine = new StageProgressionEngine(simulationData.caseDefinition, 'child'); // Default age band
          setStageProgressionEngine(engine);
          
          // Fetch stage-specific interventions for the first stage
          console.log('Fetching stage 1 interventions...');
          const interventionsResponse = await fetch(`/api/interventions?stage=1&caseId=${caseId}`);
          console.log('Interventions response status:', interventionsResponse.status);
          
          if (interventionsResponse.ok) {
            const interventionsData = await interventionsResponse.json();
            interventions = interventionsData; // Assign to global variable
            setInterventionsLoaded(true); // Set state to trigger re-render
            console.log('Stage 1 interventions loaded:', Object.keys(interventionsData).length);
            console.log('First few intervention keys:', Object.keys(interventionsData).slice(0, 10));
            
            // Initialize interventions for the first stage
            if (interventions && Object.keys(interventions).length > 0) {
              initializeInterventions(simulationData.caseDefinition.stages[0]);
            }
          } else {
            console.error('Failed to fetch stage 1 interventions');
          }
        } else {
          setError('Failed to start simulation');
          console.error('Failed to start simulation');
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

  // Function to fetch interventions for a specific stage
  const fetchStageInterventions = async (stage: number, caseId: string) => {
    try {
      console.log(`🔄 Fetching stage ${stage} interventions for case ${caseId}...`);
      const response = await fetch(`/api/interventions?stage=${stage}&caseId=${caseId}`);
      
      if (response.ok) {
        const interventionsData = await response.json();
        console.log(`✅ Stage ${stage} API response:`, Object.keys(interventionsData));
        console.log(`📦 First intervention:`, Object.values(interventionsData)[0]);
        
        interventions = interventionsData; // Update global variable
        setInterventionsLoaded(true);
        console.log(`📊 Stage ${stage} interventions loaded: ${Object.keys(interventionsData).length} interventions`);
        
        // Find the stage data for the new stage
        const newStageData = currentCase?.stages.find(s => s.stage === stage);
        if (newStageData) {
          console.log(`🎯 Initializing interventions for stage ${stage}...`);
          initializeInterventions(newStageData);
        } else {
          console.error(`❌ Stage ${stage} data not found in case`);
        }
      } else {
        console.error(`❌ Failed to fetch stage ${stage} interventions: ${response.status}`);
      }
    } catch (error) {
      console.error(`💥 Error fetching stage ${stage} interventions:`, error);
    }
  };

  // Analytics logging for popup lifecycle
  const logPopupEvent = (event: string, interventionName: string, hasGuidance: boolean, isAutoClose: boolean = false) => {
    console.log(`📊 Popup Analytics: ${event}`, {
      intervention: interventionName,
      hasGuidance,
      isAutoClose,
      timestamp: new Date().toISOString(),
      stage: currentStage,
      caseId: currentCase?.id
    });
    
    // In a real implementation, this would send to analytics service
    // analytics.track('popup_lifecycle', {
    //   event,
    //   intervention: interventionName,
    //   hasGuidance,
    //   isAutoClose,
    //   timestamp: new Date().toISOString(),
    //   stage: currentStage,
    //   caseId: currentCase?.id
    // });
  };

  // Popup queue management functions
  const addToPopupQueue = (popupData: any) => {
    setPopupQueue(prev => [...prev, popupData]);
  };

  const showNextPopup = () => {
    if (popupQueue.length > 0) {
      const nextPopup = popupQueue[0];
      setPopupQueue(prev => prev.slice(1));
      setInterventionPopup({
        ...nextPopup,
        isOpen: true
      });
      setIsVitalsPaused(true);
      
      // Log popup open
      logPopupEvent('opened', nextPopup.intervention.name, !!nextPopup.clinicalGuidance);
    } else {
      setIsVitalsPaused(false);
    }
  };

  const closeCurrentPopup = () => {
    const currentIntervention = interventionPopup.intervention;
    const hasGuidance = !!interventionPopup.clinicalGuidance;
    
    setInterventionPopup(prev => ({ ...prev, isOpen: false }));
    
    // Log popup close
    if (currentIntervention) {
      logPopupEvent('closed', currentIntervention.name, hasGuidance, false);
    }
    
    // Show next popup if available
    setTimeout(() => {
      showNextPopup();
    }, 100);
  };

  // Initialize interventions when case or stage changes
  useEffect(() => {
    console.log('useEffect triggered for interventions:', { 
      hasCase: !!currentCase, 
      hasInterventions: !!interventions, 
      interventionsLoaded,
      interventionsCount: interventions ? Object.keys(interventions).length : 0,
      currentStage 
    });
    
    if (currentCase && interventionsLoaded && interventions && Object.keys(interventions).length > 0) {
      console.log('Both case and interventions loaded, initializing interventions...');
      // Initialize interventions for the current stage, not just the first stage
      if (currentStageData) {
        console.log('Found current stage data:', currentStageData);
        initializeInterventions(currentStageData);
      } else {
        console.warn('Current stage not found in case stages:', currentStage);
        console.log('Available stages:', currentCase.stages.map(s => s.stage));
      }
    } else {
      console.log('Missing data for intervention initialization:', {
        hasCase: !!currentCase,
        hasInterventions: !!interventions,
        interventionsLoaded,
        interventionsCount: interventions ? Object.keys(interventions).length : 0
      });
    }
  }, [currentCase, interventionsLoaded, currentStage]); // Use interventionsLoaded instead of interventions

  // Define initializeInterventions function before useEffect hooks
  const initializeInterventions = (stage: any) => {
    console.log('🚀 === initializeInterventions called ===');
    console.log('📋 Stage data:', stage);
    console.log('🔢 Interventions available:', interventions ? Object.keys(interventions).length : 0);
    console.log('🔑 Sample intervention keys:', interventions ? Object.keys(interventions).slice(0, 5) : []);
    console.log('🎯 Required interventions for this stage:', stage.requiredInterventions);
    console.log('🎯 Helpful interventions for this stage:', stage.helpful);
    console.log('🎯 Harmful interventions for this stage:', stage.harmful);
    console.log('🎯 Neutral interventions for this stage:', stage.neutral);
    
    if (!stage || !interventions) {
      console.log('❌ Cannot initialize interventions - missing data:', { 
        hasStage: !!stage, 
        interventionsLoaded: !!interventions,
        interventionsKeys: interventions ? Object.keys(interventions).slice(0, 10) : []
      });
      return;
    }
    
    // For ALiEM cases, use the stage-specific interventions that were fetched from the API
    const stageInterventions: any[] = [];
    
    // Get all available interventions for this stage from the API response
    const availableInterventionIds = Object.keys(interventions);
    console.log('🎯 Available intervention IDs for this stage:', availableInterventionIds);
    
    // Map each available intervention to the proper format
    availableInterventionIds.forEach((interventionId: string) => {
      const intervention = interventions[interventionId];
      if (intervention) {
        // Determine the correct classification based on stage data
        let classification: 'required' | 'helpful' | 'neutral' | 'harmful' = 'neutral';
        
        // Check if this intervention matches any required interventions by name or ID
        const isRequired = stage.requiredInterventions && stage.requiredInterventions.some((required: any) => {
          const matches = required === interventionId || 
                         required === intervention.name ||
                         required === intervention.id;
          if (matches) {
            console.log(`🎯 MATCH FOUND: "${required}" matches "${interventionId}" or "${intervention.name}"`);
          }
          return matches;
        });
        
        const isHelpful = stage.helpful && stage.helpful.some((helpful: any) => 
          helpful === interventionId || 
          helpful === intervention.name ||
          helpful === intervention.id
        );
        
        const isHarmful = stage.harmful && stage.harmful.some((harmful: any) => 
          harmful === interventionId || 
          harmful === intervention.name ||
          harmful === intervention.id
        );
        
        const isNeutral = stage.neutral && stage.neutral.some((neutral: any) => 
          neutral === interventionId || 
          neutral === intervention.name ||
          neutral === intervention.id
        );
        
        if (isRequired) {
          classification = 'required';
          console.log(`🏆 REQUIRED INTERVENTION: ${interventionId} (${intervention.name})`);
        } else if (isHelpful) {
          classification = 'helpful';
        } else if (isHarmful) {
          classification = 'harmful';
        } else if (isNeutral) {
          classification = 'neutral';
        }
        
        stageInterventions.push({ 
          ...intervention, 
          classification: classification,
          applied: false,
          timeApplied: undefined,
          cooldownEnd: undefined,
          success: false,
          successRate: intervention.successRate || 0.9
        });
        console.log(`✅ Added ${classification} intervention: ${interventionId} (${intervention.name})`);
      } else {
        console.warn(`⚠️ Intervention not found: ${interventionId}`);
      }
    });

    console.log(`🎉 Initialized ${stageInterventions.length} interventions for stage ${stage.stage}`);
    console.log('🏷️ Intervention IDs:', stageInterventions.map(i => i.id));
    console.log('📝 Setting available interventions...');
    setAvailableInterventions(stageInterventions);
    console.log('✅ Available interventions set!');
  };

  // Check URL changes and reload if needed - only if the caseId actually changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId');
    
    // Only reload if we have a caseId and it's different from the current case
    if (caseId && currentCase && currentCase.id !== caseId) {
      console.log('Case ID changed, reloading case:', caseId);
      setLoading(true);
      setError(null);
      
      // Reload the case using the new API
      const reloadCase = async () => {
        try {
          // Extract category from caseId (e.g., "aliem_case_01_anaphylaxis" -> "Anaphylaxis")
          const categoryMatch = caseId.match(/aliem_case_\d+_(.+)/);
          if (!categoryMatch) {
            setError('Invalid case ID format');
            setLoading(false);
            return;
          }
          
          const category = categoryMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          console.log('Reloading simulation for category:', category);
          
          const simulationResponse = await fetch('/api/start-simulation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              category: category,
              userId: 1 // Default user ID for now
            })
          });
          
          if (simulationResponse.ok) {
            const simulationData = await simulationResponse.json();
            setCurrentCase(simulationData.caseDefinition);
            console.log('Setting vitals from simulation data (2):', simulationData.vitals);
            setVitals(simulationData.vitals);
            if (interventions && Object.keys(interventions).length > 0) {
              initializeInterventions(simulationData.caseDefinition.stages[0]);
            }
          } else {
            setError('Failed to reload simulation');
          }
        } catch (error) {
          setError('Failed to reload case');
        } finally {
          setLoading(false);
        }
      };
      
      reloadCase();
    }
  }, [currentCase?.id]); // Only depend on the case ID, not the entire currentCase object

  // Timer effect - 10-second ticks for stage progression
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && currentCase && stageProgressionEngine && !isVitalsPaused) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
        setStageTime(prev => prev + 1);
        
        // Check if it's time for a 10-second tick
        const currentTime = Date.now();
        if (currentTime - lastTickTime >= 10000) { // 10 seconds
          setLastTickTime(currentTime);
          setTickTimer(prev => prev + 1);
          
          // Process stage progression tick
          console.log('Processing tick with vitals:', vitals);
          console.log('Vitals type check:', {
            hasHeartRate: typeof vitals.heartRate === 'number',
            hasRespRate: typeof vitals.respRate === 'number',
            hasBloodPressureSys: typeof vitals.bloodPressureSys === 'number',
            hasBloodPressureDia: typeof vitals.bloodPressureDia === 'number',
            hasSpo2: typeof (vitals.spo2 || vitals.oxygenSat) === 'number',
            hasTemperature: typeof vitals.temperature === 'number',
            hasConsciousness: typeof vitals.consciousness === 'string',
            hasCapillaryRefill: typeof vitals.capillaryRefill === 'number'
          });
          
          const progressionResult = stageProgressionEngine.processTick(vitals, timeElapsed);
          console.log('Progression result:', progressionResult);
          console.log('Vitals before tick:', vitals);
          console.log('Vitals after tick:', progressionResult.vitalsUpdated);
          
          // Update vitals based on progression result
          if (progressionResult.vitalsUpdated) {
            console.log('Updating vitals from stage progression (1):', progressionResult.vitalsUpdated);
            setVitals(progressionResult.vitalsUpdated);
          }
            
          // Check for physiologic failure
          if (progressionResult.physiologicFailure) {
            handleSimulationFailure(progressionResult.failureReason || 'Physiologic instability');
            return;
          }
          
          // Check for stage advancement
          if (progressionResult.shouldAdvance && progressionResult.newStage) {
            handleStageAdvancement(progressionResult.newStage);
          }
          
          // Check for severity escalation
          if (progressionResult.severityEscalated) {
            // Update UI to show severity escalation
            console.log('Stage severity escalated');
          }

          // Log deterioration if applied
          if (progressionResult.deteriorationApplied) {
            console.log('Vital deterioration applied due to unsolved stage');
          }
        }
      }, 1000); // Check every second for UI updates, but process 10-second ticks when they occur
    }
    return () => clearInterval(interval);
  }, [isRunning, currentCase, stageProgressionEngine, vitals, timeElapsed, lastTickTime, isVitalsPaused]);

  // Separate interval for real-time vital deterioration (every 10 seconds)
  useEffect(() => {
    if (!isRunning || !currentCase || !stageProgressionEngine || isVitalsPaused) return;

    const deteriorationInterval = setInterval(() => {
      if (isRunning && currentCase && stageProgressionEngine && !isVitalsPaused) {
        // Apply deterioration every 10 seconds if stage is not solved
        const progressionResult = stageProgressionEngine.processTick(vitals, timeElapsed);
        
        if (progressionResult.deteriorationApplied) {
          console.log('Real-time deterioration applied');
          if (progressionResult.vitalsUpdated) {
            console.log('Updating vitals from stage progression (2):', progressionResult.vitalsUpdated);
            setVitals(progressionResult.vitalsUpdated);
          }
        }
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(deteriorationInterval);
  }, [isRunning, currentCase, stageProgressionEngine, vitals, timeElapsed, isVitalsPaused]);

  // Old stage progression function removed - replaced by stage progression engine

  // Old branching function removed - replaced by stage progression engine

  // Old advance stage function removed - replaced by stage progression engine

    // Old updateVitals function removed - replaced by stage progression engine

  const applyIntervention = (interventionId: string) => {
    console.log('applyIntervention called with:', interventionId);
    console.log('Current state:', { currentCase, stageProgressionEngine, vitals });
    
    if (!currentCase || !stageProgressionEngine) {
      console.log('Missing required data:', { hasCase: !!currentCase, hasEngine: !!stageProgressionEngine });
      return;
    }

    const intervention = availableInterventions.find(i => i.id === interventionId);
    if (!intervention) {
      console.log('Intervention not found in availableInterventions:', interventionId);
      console.log('Available interventions:', availableInterventions.map(i => i.id));
      return;
    }

    console.log('Found intervention:', intervention);

    // Store vitals before intervention
    const vitalsBefore = { ...vitals };

    // Process intervention through stage progression engine
    console.log('Calling stageProgressionEngine.processIntervention...');
    console.log('Vitals before intervention:', vitals);
    const result = stageProgressionEngine.processIntervention(interventionId, vitals);
    console.log('processIntervention result:', result);
    console.log('Vitals after intervention:', result.vitalsUpdated);
    
    // Check for three-strike failure
    if (result.threeStrikeFailure) {
      console.log('Three-strike failure detected');
      handleSimulationFailure(result.failureReason || 'Three harmful actions in this stage');
      return;
    }

    // Check for physiologic failure
    if (result.physiologicFailure) {
      console.log('Physiologic failure detected');
      handleSimulationFailure(result.failureReason || 'Physiologic instability');
      return;
    }

    // Update vitals
    console.log('Updating vitals from:', vitals, 'to:', result.vitalsUpdated);
    console.log('Vitals update details:', { 
      before: vitals, 
      after: result.vitalsUpdated, 
      spo2Before: vitals.spo2 || vitals.oxygenSat, 
      spo2After: result.vitalsUpdated.spo2 
    });
    setVitals(result.vitalsUpdated);
    
    // Check for stage advancement
    if (result.shouldAdvance) {
      console.log('Stage advancement triggered by intervention');
      // Force a tick to process the advancement
      const tickResult = stageProgressionEngine.processTick(result.vitalsUpdated, timeElapsed);
      if (tickResult.shouldAdvance && tickResult.newStage) {
        handleStageAdvancement(tickResult.newStage);
      }
    }

    // Update intervention status
    console.log('🎯 Applying intervention:', interventionId);
    console.log('  Classification type:', result.classification.type);
    console.log('  Classification severity:', result.classification.severity);
    console.log('  Will mark as success:', result.classification.type !== 'harmful');
    console.log('  Full result:', result);
    
    const isSuccessful = result.classification.type !== 'harmful';
    
    setAvailableInterventions(prev => 
      prev.map(i => 
        i.id === interventionId 
          ? { ...i, applied: true, success: isSuccessful }
          : i
      )
    );
    
    // Add to global intervention history if successful
    if (isSuccessful) {
      const appliedIntervention = availableInterventions.find(i => i.id === interventionId);
      if (appliedIntervention) {
        setAllAppliedInterventions(prev => [
          ...prev.filter(i => i.id !== interventionId), // Remove any duplicates
          { ...appliedIntervention, applied: true, success: true, timeApplied: Date.now() }
        ]);
        console.log('✅ Added to global intervention history:', interventionId);
      }
    }

    // Check for stage advancement
    if (result.shouldAdvance && result.stageChange) {
      console.log('Stage advancement detected:', result.stageChange);
      handleStageAdvancement(result.stageChange);
    }

    // Generate RAG insights
    const ragInsights = generateRAGInsights(interventionId, result.classification.type !== 'harmful', result.vitalsUpdated);
    const evidenceSources = generateEvidenceSources(interventionId);

    // Fetch clinical guidance for this intervention
    const fetchClinicalGuidance = async () => {
      try {
        const response = await fetch('/api/rag/clinical-guidance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            caseId: currentCase.id,
            stage: currentStage,
            intervention: intervention.name,
            interventionCategory: intervention.category,
            query: `Clinical guidance for ${intervention.name} in stage ${currentStage} of case ${currentCase.id}`
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            clinicalGuidance: data.explanation || `No specific guidance available for ${intervention.name}`,
            suggestedNextSteps: data.nextSteps || []
          };
        }
      } catch (error) {
        console.error('Error fetching clinical guidance:', error);
      }
      
      return {
        clinicalGuidance: `Standard clinical guidance for ${intervention.name}`,
        suggestedNextSteps: []
      };
    };

    // Prepare popup data
    const popupData = {
      intervention,
      classification: result.classification,
      vitalsBefore,
      vitalsAfter: result.vitalsUpdated,
      ragInsights,
      evidenceSources,
      clinicalGuidance: '',
      suggestedNextSteps: []
    };

    // Fetch clinical guidance and then show popup
    fetchClinicalGuidance().then(({ clinicalGuidance, suggestedNextSteps }) => {
      const completePopupData = {
        ...popupData,
        clinicalGuidance,
        suggestedNextSteps
      };

      // Check if popup is already open
      if (interventionPopup.isOpen) {
        // Add to queue
        addToPopupQueue(completePopupData);
        logPopupEvent('queued', intervention.name, !!clinicalGuidance);
      } else {
        // Show immediately
        setInterventionPopup({
          ...completePopupData,
          isOpen: true
        });
        setIsVitalsPaused(true);
        logPopupEvent('opened', intervention.name, !!clinicalGuidance);
      }
    });

    // Update last intervention for AI clinical guidance
    setLastIntervention({
      id: intervention.id,
      name: intervention.name,
      description: intervention.description,
      category: intervention.category,
      vitalEffects: intervention.vitalEffects
    });

    // Record intervention for scoring
    const interventionCategory = intervention.classification || intervention.category;
    const isSuccess = result.classification.type !== 'harmful';
    
    // Map intervention category to scoring category
    let scoringCategory: 'required' | 'helpful' | 'neutral' | 'harmful';
    if (interventionCategory === 'harmful') {
      scoringCategory = 'harmful';
    } else if (interventionCategory === 'required') {
      scoringCategory = 'required';
    } else if (interventionCategory === 'helpful') {
      scoringCategory = 'helpful';
    } else {
      scoringCategory = 'neutral';
    }
    
    recordInterventionForScoring(intervention.name, scoringCategory, isSuccess);
    
    // Check if we're on the final stage and should complete the case
    if (currentStage === (currentCase?.stages?.length || 0)) {
      const finalStageData = currentCase?.stages?.find((s: any) => s.stage === currentStage);
      if (finalStageData) {
        const requiredInterventions = finalStageData.requiredInterventions || [];
        
        // Check which required interventions have been applied successfully
        const completedRequiredInterventions = requiredInterventions.filter(requiredName => {
          const matchingIntervention = availableInterventions.find(available => 
            available.name === requiredName || available.id === requiredName
          );
          return matchingIntervention && matchingIntervention.applied && matchingIntervention.success;
        });
        
        console.log(`🎯 Final stage completion check:`, {
          currentStage,
          totalStages: currentCase?.stages?.length,
          requiredInterventions,
          availableInterventions: availableInterventions.map(i => ({ name: i.name, id: i.id, applied: i.applied, success: i.success })),
          completedRequiredInterventions,
          completedCount: completedRequiredInterventions.length,
          requiredCount: requiredInterventions.length
        });
        
        // If all required interventions are completed, finish the case
        if (completedRequiredInterventions.length >= requiredInterventions.length && requiredInterventions.length > 0) {
          console.log(`🏁 All required interventions completed for final stage, completing case...`);
          handleCaseCompletion();
        }
      }
    }
    
    console.log('Intervention applied successfully');
  };

  // Reset simulation function - refreshes to Stage 1
  const resetSimulation = () => {
    if (!currentCase) return;
    
    // Reset all state variables
    setCurrentStage(1);
    const initialVitals = currentCase.initialVitals || {
      heartRate: 120,
      temperature: 98.6,
      respRate: 20,
      spo2: 98,
      oxygenSat: 98, // Backward compatibility
      bloodGlucose: undefined,
      consciousness: 'alert',
      bloodPressureSys: 90,
      bloodPressureDia: 60
    };
    console.log('Setting initial vitals:', initialVitals);
    setVitals(initialVitals);
    setAvailableInterventions([]);
    setAllAppliedInterventions([]); // Clear global intervention history
    setIsRunning(false);
    setTimeElapsed(0);
    setStageTime(0);
    setTickTimer(0);
    setLastTickTime(0);
    setInterventionPopup({
      isOpen: false,
      intervention: null,
      classification: { type: 'neutral', severity: 'moderate' },
      vitalsBefore: {},
      vitalsAfter: {},
      ragInsights: [],
      evidenceSources: []
    });
    setCaseCompletionDebrief({
      isOpen: false,
      caseData: {},
      performance: {},
      feedback: {},
      evidenceSources: []
    });
    setAiExplanation("");
    setCaseComplete(false);
    setScore(0);
    setFeedback([]);
    setEmergencyEvents([]);
    setPatientDeterioration(false);
    setComplications([]);
    setLastInterventionTime(0);
    setLastIntervention(null);
    
    // Reinitialize stage progression engine
    if (currentCase) {
      const engine = new StageProgressionEngine(currentCase, 'child'); // Default age band
      setStageProgressionEngine(engine);
    }
    
    // Reinitialize interventions for first stage
    if (interventions && Object.keys(interventions).length > 0) {
      initializeInterventions(currentCase.stages[0]);
    }
  };

  // Helper function to calculate physiological guardrails
  const calculatePhysiologicalGuardrails = (previousVitals: any, currentVitals: any) => {
    const guardrails = {
      vitalChanges: [] as Array<{
        vital: string;
        before: string | number;
        after: string | number;
        status: 'improved' | 'worsened' | 'stable';
      }>,
      safetyChecks: [] as string[],
      contraindications: [] as string[]
    };

    // Compare vital changes
    if (previousVitals.heartRate !== currentVitals.heartRate) {
      const change = currentVitals.heartRate - previousVitals.heartRate;
      guardrails.vitalChanges.push({
        vital: 'Heart Rate',
        before: `${previousVitals.heartRate} bpm`,
        after: `${currentVitals.heartRate} bpm`,
        status: change < 0 ? 'improved' : change > 0 ? 'worsened' : 'stable'
      });
    }

    if (previousVitals.spo2 !== currentVitals.spo2) {
      const change = currentVitals.spo2 - previousVitals.spo2;
      guardrails.vitalChanges.push({
        vital: 'Oxygen Saturation',
        before: `${previousVitals.spo2}%`,
        after: `${currentVitals.spo2}%`,
        status: change > 0 ? 'improved' : change < 0 ? 'worsened' : 'stable'
      });
    }

    if (previousVitals.temperature !== currentVitals.temperature) {
      const change = currentVitals.temperature - previousVitals.temperature;
      guardrails.vitalChanges.push({
        vital: 'Temperature',
        before: `${previousVitals.temperature}°F`,
        after: `${currentVitals.temperature}°F`,
        status: change < 0 ? 'improved' : change > 0 ? 'worsened' : 'stable'
      });
    }

    if (previousVitals.respRate !== currentVitals.respRate) {
      const change = currentVitals.respRate - previousVitals.respRate;
      guardrails.vitalChanges.push({
        vital: 'Respiratory Rate',
        before: `${previousVitals.respRate} bpm`,
        after: `${currentVitals.respRate} bpm`,
        status: change < 0 ? 'improved' : change > 0 ? 'worsened' : 'stable'
      });
    }

    // Safety checks based on current vitals
    if (currentVitals.heartRate > 160) {
      guardrails.safetyChecks.push('Heart rate elevated - monitor for arrhythmias');
    }
    if (currentVitals.spo2 < 90) {
      guardrails.safetyChecks.push('Oxygen saturation low - consider airway intervention');
    }
    if (currentVitals.temperature > 103) {
      guardrails.safetyChecks.push('High fever - monitor for seizures and consider cooling');
    }

    // Contraindications
    if (currentVitals.heartRate < 60) {
      guardrails.contraindications.push('Bradycardia - avoid interventions that may lower heart rate further');
    }
    if (currentVitals.spo2 < 85) {
      guardrails.contraindications.push('Severe hypoxemia - immediate airway intervention required');
    }

    return guardrails;
  };

  // Helper function to generate RAG insights
  const generateRAGInsights = (interventionId: string, success: boolean, currentVitals: any): string[] => {
    const insights = [];
    
    if (success) {
      insights.push('Intervention successfully applied according to PALS guidelines');
      insights.push('Patient response indicates appropriate clinical decision-making');
      insights.push('Vital signs showing expected improvement trajectory');
    } else {
      insights.push('Intervention did not achieve desired outcome - consider alternative approaches');
      insights.push('Patient may require escalation of care or different intervention strategy');
      insights.push('Review contraindications and patient-specific factors');
    }

    // Add context-specific insights
    if (interventionId === 'assess_airway') {
      insights.push('Airway assessment is critical first step in any pediatric emergency');
    } else if (interventionId === 'oxygen_support') {
      insights.push('Oxygen therapy should be titrated to maintain SpO2 >94%');
    } else if (interventionId === 'benzodiazepine') {
      insights.push('Benzodiazepines are first-line therapy for status epilepticus per PALS guidelines');
    }

    return insights;
  };

  // Helper function to generate evidence sources
  const generateEvidenceSources = (interventionId: string) => {
    return [
      {
        caseId: 'febrile_seizure_01',
        section: 'intervention_guidelines',
        passageId: 12,
        sourceCitation: 'ALiEM EM ReSCu Peds - Status Epilepticus Case',
        license: 'CC BY-NC-SA 4.0'
      },
      {
        caseId: 'febrile_seizure_01',
        section: 'pals_protocols',
        passageId: 8,
        sourceCitation: 'PALS Guidelines 2020 - Pediatric Advanced Life Support',
        license: 'CC BY-NC-SA 4.0'
      }
    ];
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
        if (effect && typeof effect === 'object' && 'immediate' in effect && 'delayed' in effect) {
          const vitalName = vital.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const typedEffect = effect as { immediate: number; delayed: number };
          if (typedEffect.immediate !== 0) {
            explanation += `• ${vitalName}: You'll see a change of ${typedEffect.immediate > 0 ? '+' : ''}${typedEffect.immediate} right away\n`;
          }
          if (typedEffect.delayed !== 0) {
            explanation += `• ${vitalName}: Over time, expect a change of ${typedEffect.delayed > 0 ? '+' : ''}${typedEffect.delayed}\n`;
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
      if (action && appliedActions.includes(action)) {
        score += 14; // 70% / 5 critical actions = 14 points each
      } else if (action) {
        missedActions.push(action);
      }
    });
    
    // Evaluate time efficiency (20% of score)
    const expectedTime = typeof currentCase?.estimatedTime === 'number' ? currentCase.estimatedTime : 15;
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
    if (currentCase?.category === 'status_epilepticus') {
      feedbackItems.push("📚 **Learning Focus:** Review AAP status epilepticus guidelines and PALS seizure management");
    } else if (currentCase?.category === 'status_asthmaticus') {
      feedbackItems.push("📚 **Learning Focus:** Review PALS respiratory assessment and AAP asthma protocols");
    }
    
    setFeedback(feedbackItems);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize scoring system for the current case
  const initializeScoringSystem = useCallback((caseData: CaseDefinition) => {
    if (!caseData || !caseData.stages) {
      console.log('❌ Cannot initialize scoring system - missing case data or stages');
      return;
    }

    console.log('🚀 Initializing scoring system for case:', caseData.id);
    console.log('📋 Case stages:', caseData.stages.length);

    // Create stage definitions for scoring
    const stageDefinitions: StageDefinition[] = caseData.stages.map((stage: any, index: number) => {
      const stageDef = {
        stageNumber: stage.stage || index + 1,
        requiredLabels: stage.requiredInterventions || [],
        timeLimitSec: stage.timeLimit,
        criticalEarlyWindowSec: stage.criticalEarlyWindow,
        criticalEarlyLabels: stage.criticalEarlyInterventions || []
      };
      console.log(`🎯 Stage ${stageDef.stageNumber} definition:`, stageDef);
      return stageDef;
    });

    console.log('📊 Stage definitions created:', stageDefinitions);

    // Create scoring calculator
    const calculator = createCaseScoringCalculator(
      caseData.id || 'unknown_case',
      stageDefinitions
    );

    setScoringCalculator(calculator);
    
    // Initialize first stage timing
    const now = Date.now();
    setStageStartTimes(new Map([[1, now]]));
    calculator.setStageTiming(1, now);
    
    console.log('✅ Scoring system initialized for case:', caseData.id);
    console.log('🎯 Scoring calculator created:', !!calculator);
  }, []);

  // Record intervention for scoring
  const recordInterventionForScoring = useCallback((
    interventionName: string,
    category: 'required' | 'helpful' | 'neutral' | 'harmful',
    success: boolean = true
  ) => {
    if (!scoringCalculator) {
      console.log(`❌ No scoring calculator available for: ${interventionName}`);
      return;
    }

    // Normalize intervention name (remove classification suffixes)
    const normalizedName = interventionName
      .replace(/\s*\(Harmful\)\s*$/i, '')
      .replace(/\s*\(Anaphylaxis\)\s*$/i, '')
      .replace(/\s*\(Neutral\)\s*$/i, '')
      .trim();

    // Determine final category
    const finalCategory = category === 'harmful' ? 'harmful' : 
                         success ? category : 'harmful';

    const interaction: InteractionRecord = {
      stageNumber: currentStage,
      label: normalizedName,
      category: finalCategory,
      timestamp: new Date().toISOString()
    };

    // Also record for simple feedback system
    const simpleInteraction: SimpleInteractionRecord = {
      stageNumber: currentStage,
      label: normalizedName,
      category: finalCategory,
      timestamp: new Date().toISOString()
    };

    setSimpleInteractions(prev => [...prev, simpleInteraction]);

    console.log(`📊 Recording intervention for scoring:`, {
      originalName: interventionName,
      normalizedName,
      category,
      finalCategory,
      stageNumber: currentStage,
      success
    });

    // Add to scoring calculator
    const result = scoringCalculator.addInteraction(interaction);
    setScoringResult(result);
    
    console.log(`📊 Scoring: ${normalizedName} (${finalCategory}) - Stage ${currentStage}`);
    console.log(`🔄 Current Score: ${result.finalScore}/100`);
    console.log(`📈 Scoring Result:`, result);
  }, [scoringCalculator, currentStage]);

  // Handle stage progression in scoring system
  const handleScoringStageProgression = useCallback((newStage: number) => {
    if (!scoringCalculator) return;

    // End current stage timing
    const currentStageStartTime = stageStartTimes.get(currentStage);
    if (currentStageStartTime) {
      scoringCalculator.setStageTiming(currentStage, currentStageStartTime, Date.now());
    }

    // Start new stage timing
    const now = Date.now();
    setStageStartTimes(prev => new Map(prev).set(newStage, now));
    scoringCalculator.setStageTiming(newStage, now);

    console.log(`📈 Scoring: Stage ${currentStage} ended, Stage ${newStage} started`);
  }, [scoringCalculator, currentStage, stageStartTimes]);

  const getVitalStatus = (vital: keyof VitalSigns, value: number | string | undefined) => {
    const status = {
      color: 'text-gray-600',
      icon: null as React.ReactElement | null,
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
      case 'spo2':
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
      case 'bloodPressureSys':
        const systolic = Number(value);
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
        break;
      case 'bloodPressureDia':
        const diastolic = Number(value);
        if (diastolic < 40 || diastolic > 80) { // Example for a child
          status.color = 'text-red-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.critical = "Critical - Assess perfusion, consider fluid bolus";
        } else if (diastolic < 50 || diastolic > 70) {
          status.color = 'text-orange-500';
          status.icon = <AlertTriangle className="w-4 h-4" />;
          status.description.normal = "Abnormal - Monitor closely";
        } else {
          status.color = 'text-green-500';
          status.icon = <CheckCircle className="w-4 h-4" />;
          status.description.normal = "Normal";
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
    
    if (!currentStageData) return;
    
    const events: string[] = [];
    const now = Date.now();
    
    // Only trigger events if no intervention in last 30 seconds (patient deteriorating)
    if (now - lastInterventionTime > 30000) {
      // Random emergency events based on case type and current vitals
      if (currentCase.category === 'status_epilepticus') {
        if (vitals.temperature > 102 && Math.random() < 0.3) {
          events.push("🚨 RECURRENT SEIZURE! Patient is seizing again - immediate intervention required!");
          setVitals(prev => {
            const newVitals = {
              ...prev,
              consciousness: 'seizing',
              heartRate: Math.min(200, (prev.heartRate || 120) + 30),
              respRate: Math.min(80, (prev.respRate || 20) + 15),
              spo2: prev.spo2 || prev.oxygenSat || 95,
              oxygenSat: prev.oxygenSat || prev.spo2 || 95, // Backward compatibility
              temperature: prev.temperature || 98.6,
              bloodPressureSys: prev.bloodPressureSys || 90,
              bloodPressureDia: prev.bloodPressureDia || 60,
              bloodGlucose: prev.bloodGlucose,
              capillaryRefill: prev.capillaryRefill
            };
            console.log('Random deterioration event - updating vitals:', { before: prev, after: newVitals, spo2Before: prev.spo2, spo2After: newVitals.spo2 });
            return newVitals;
          });
        }
        if ((vitals.spo2 || vitals.oxygenSat) < 90 && Math.random() < 0.4) {
          events.push("🚨 RESPIRATORY DISTRESS! Oxygen saturation dropping rapidly!");
          setVitals(prev => ({
            ...prev,
            spo2: Math.max(70, (prev.spo2 || prev.oxygenSat || 95) - 5),
            oxygenSat: Math.max(70, (prev.oxygenSat || prev.spo2 || 95) - 5), // Backward compatibility
            respRate: Math.min(80, (prev.respRate || 20) + 8),
            heartRate: prev.heartRate || 120,
            temperature: prev.temperature || 98.6,
            bloodPressureSys: prev.bloodPressureSys || 90,
            bloodPressureDia: prev.bloodPressureDia || 60,
            consciousness: prev.consciousness || 'alert',
            bloodGlucose: prev.bloodGlucose,
            capillaryRefill: prev.capillaryRefill
          }));
        }
      }
      
      if (currentCase.category === 'status_asthmaticus') {
        if ((vitals.spo2 || vitals.oxygenSat) < 85 && Math.random() < 0.5) {
          events.push("🚨 RESPIRATORY FAILURE! Patient developing respiratory fatigue!");
          setVitals(prev => ({
            ...prev,
            consciousness: 'lethargic',
            spo2: Math.max(70, (prev.spo2 || prev.oxygenSat || 95) - 8),
            oxygenSat: Math.max(70, (prev.oxygenSat || prev.spo2 || 95) - 8), // Backward compatibility
            respRate: Math.min(80, (prev.respRate || 20) + 12),
            heartRate: prev.heartRate || 120,
            temperature: prev.temperature || 98.6,
            bloodPressureSys: prev.bloodPressureSys || 90,
            bloodPressureDia: prev.bloodPressureDia || 60,
            bloodGlucose: prev.bloodGlucose,
            capillaryRefill: prev.capillaryRefill
          }));
        }
        if (vitals.heartRate > 180 && Math.random() < 0.3) {
          events.push("🚨 CARDIOVASCULAR COMPROMISE! Tachycardia worsening!");
          setVitals(prev => ({
            ...prev,
            heartRate: Math.min(200, (prev.heartRate || 120) + 15),
            bloodPressureSys: Math.max(50, (prev.bloodPressureSys || 100) - 8),
            bloodPressureDia: Math.max(30, (prev.bloodPressureDia || 60) - 5),
            spo2: prev.spo2 || prev.oxygenSat || 95,
            oxygenSat: prev.oxygenSat || prev.spo2 || 95, // Backward compatibility
            temperature: prev.temperature || 98.6,
            respRate: prev.respRate || 20,
            consciousness: prev.consciousness || 'alert',
            bloodGlucose: prev.bloodGlucose,
            capillaryRefill: prev.capillaryRefill
          }));
        }
      }
      
      if (currentCase.category === 'pneumonia_septic_shock') {
        if (vitals.respRate > 45 && Math.random() < 0.4) {
          events.push("🚨 SEVERE RESPIRATORY DISTRESS! Respiratory rate critically elevated!");
          setVitals(prev => ({
            ...prev,
            spo2: Math.max(70, (prev.spo2 || prev.oxygenSat || 95) - 6),
            oxygenSat: Math.max(70, (prev.oxygenSat || prev.spo2 || 95) - 6), // Backward compatibility
            consciousness: 'anxious',
            heartRate: prev.heartRate || 120,
            temperature: prev.temperature || 98.6,
            respRate: prev.respRate || 20,
            bloodPressureSys: prev.bloodPressureSys || 90,
            bloodPressureDia: prev.bloodPressureDia || 60,
            bloodGlucose: prev.bloodGlucose,
            capillaryRefill: prev.capillaryRefill
          }));
        }
        if (vitals.consciousness === 'anxious' && Math.random() < 0.3) {
          events.push("🚨 PATIENT AGITATION! Consciousness level deteriorating!");
          setVitals(prev => ({
            ...prev,
            consciousness: 'lethargic',
            heartRate: Math.min(200, (prev.heartRate || 120) + 20),
            spo2: prev.spo2 || prev.oxygenSat || 95,
            oxygenSat: prev.oxygenSat || prev.spo2 || 95, // Backward compatibility
            temperature: prev.temperature || 98.6,
            respRate: prev.respRate || 20,
            bloodPressureSys: prev.bloodPressureSys || 90,
            bloodPressureDia: prev.bloodPressureDia || 60,
            bloodGlucose: prev.bloodGlucose,
            capillaryRefill: prev.capillaryRefill
          }));
        }
      }
      
      // Universal emergency events
      if ((vitals.spo2 || vitals.oxygenSat) && (vitals.spo2 || vitals.oxygenSat) < 80 && Math.random() < 0.6) {
        events.push("🚨 CRITICAL HYPOXEMIA! Oxygen saturation critically low - immediate airway intervention needed!");
        setVitals(prev => ({
          ...prev,
          consciousness: 'unresponsive',
          heartRate: Math.min(200, (prev.heartRate || 120) + 25),
          spo2: prev.spo2 || prev.oxygenSat || 95,
          oxygenSat: prev.oxygenSat || prev.spo2 || 95, // Backward compatibility
          temperature: prev.temperature || 98.6,
          respRate: prev.respRate || 20,
          bloodPressureSys: prev.bloodPressureSys || 90,
          bloodPressureDia: prev.bloodPressureDia || 60,
          bloodGlucose: prev.bloodGlucose,
          capillaryRefill: prev.capillaryRefill
        }));
      }
      
      if (vitals.heartRate && vitals.heartRate > 190 && Math.random() < 0.4) {
        events.push("🚨 CRITICAL TACHYCARDIA! Heart rate critically elevated - risk of cardiovascular collapse!");
        setVitals(prev => ({
          ...prev,
          bloodPressureSys: Math.max(40, (prev.bloodPressureSys || 100) - 15),
          bloodPressureDia: Math.max(25, (prev.bloodPressureDia || 60) - 10),
          spo2: prev.spo2 || prev.oxygenSat || 95,
          oxygenSat: prev.oxygenSat || prev.spo2 || 95, // Backward compatibility
          temperature: prev.temperature || 98.6,
          respRate: prev.respRate || 20,
          heartRate: prev.heartRate || 120,
          consciousness: prev.consciousness || 'alert',
          bloodGlucose: prev.bloodGlucose,
          capillaryRefill: prev.capillaryRefill
        }));
      }
      
      if (vitals.consciousness === 'unresponsive' && Math.random() < 0.7) {
        events.push("🚨 PATIENT UNRESPONSIVE! Airway protection critical - consider intubation!");
        setVitals(prev => ({
          ...prev,
          respRate: Math.max(5, (prev.respRate || 20) - 10),
          spo2: Math.max(60, (prev.spo2 || prev.oxygenSat || 95) - 15),
          oxygenSat: Math.max(60, (prev.oxygenSat || prev.spo2 || 95) - 15), // Backward compatibility
          heartRate: prev.heartRate || 120,
          temperature: prev.temperature || 98.6,
          bloodPressureSys: prev.bloodPressureSys || 90,
          bloodPressureDia: prev.bloodPressureDia || 60,
          consciousness: prev.consciousness || 'alert',
          bloodGlucose: prev.bloodGlucose,
          capillaryRefill: prev.capillaryRefill
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
            spo2: (prev.spo2 || prev.oxygenSat) ? Math.max(60, (prev.spo2 || prev.oxygenSat) - 3) : (prev.spo2 || prev.oxygenSat),
            oxygenSat: (prev.oxygenSat || prev.spo2) ? Math.max(60, (prev.oxygenSat || prev.spo2) - 3) : (prev.oxygenSat || prev.spo2), // Backward compatibility
            heartRate: prev.heartRate ? Math.min(200, prev.heartRate + 8) : prev.heartRate,
            consciousness: prev.consciousness === 'alert' ? 'lethargic' : prev.consciousness,
            temperature: prev.temperature || 98.6,
            respRate: prev.respRate || 20,
            bloodPressureSys: prev.bloodPressureSys || 90,
            bloodPressureDia: prev.bloodPressureDia || 60,
            bloodGlucose: prev.bloodGlucose,
            capillaryRefill: prev.capillaryRefill
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
          spo2: (prev.spo2 || prev.oxygenSat) ? Math.max(50, (prev.spo2 || prev.oxygenSat) - 15) : (prev.spo2 || prev.oxygenSat),
          oxygenSat: (prev.oxygenSat || prev.spo2) ? Math.max(50, (prev.oxygenSat || prev.spo2) - 15) : (prev.oxygenSat || prev.spo2), // Backward compatibility
          heartRate: prev.heartRate ? Math.min(200, prev.heartRate + 20) : prev.heartRate,
          consciousness: 'unresponsive',
          respRate: prev.respRate ? Math.max(5, prev.respRate - 8) : prev.respRate,
          temperature: prev.temperature || 98.6,
          bloodPressureSys: prev.bloodPressureSys || 90,
          bloodPressureDia: prev.bloodPressureDia || 60,
          bloodGlucose: prev.bloodGlucose,
          capillaryRefill: prev.capillaryRefill
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
    
    if (!currentStageData) return;
    
    const rapidInterventions: any[] = [];
    
    // Check each vital and provide rapid response options
    if ((vitals.spo2 || vitals.oxygenSat) && (vitals.spo2 || vitals.oxygenSat) < 85) {
      rapidInterventions.push({
        id: 'rapid_oxygen_boost',
        name: '🚨 RAPID OXYGEN BOOST',
        description: 'Immediate high-flow oxygen to prevent respiratory failure',
        category: 'critical',
        timeRequired: 5, // 5 seconds
        successRate: 0.95,
        vitalEffects: {
          spo2: { immediate: 15, delayed: 0, duration: 0 },
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
          spo2: { immediate: 20, delayed: 0, duration: 0 },
          respRate: { immediate: -8, delayed: 0, duration: 0 }
        }
      });
    }
    
    if (vitals.bloodPressureSys && vitals.bloodPressureSys < 70) {
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
          spo2: { immediate: 8, delayed: 0, duration: 0 },
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

  // Get current stage data and interventions
  const stageProgress = currentStageData?.timeLimit 
    ? Math.min(100, (stageTime / currentStageData.timeLimit) * 100)
    : 0;

  // Get available interventions for current stage
  const stageInterventions = currentStageData?.availableInterventions || [];
  const availableInterventionsForStage = stageInterventions.map(interventionId => {
    const interventionDef = interventions[interventionId];
    if (!interventionDef) return null;
    
    return {
      id: interventionId,
      name: interventionDef.name,
      description: interventionDef.description,
      category: interventionDef.category,
      timeRequired: interventionDef.timeRequired,
      successRate: interventionDef.successRate,
      contraindications: interventionDef.contraindications,
      vitalEffects: interventionDef.vitalEffects,
      ragSummary: interventionDef.ragSummary,
      evidenceSources: interventionDef.evidenceSources,
      applied: false,
      timeApplied: 0,
      cooldownEnd: 0,
      success: null
    };
  }).filter(Boolean);

  // Get ideal intervention progression for current stage
  const idealInterventions = currentCase.idealInterventionProgression?.filter(i => i.stage === currentStage) || [];
  const goldStandardActions = currentCase.goldStandardActions?.find(g => g.stage === currentStage)?.actions || [];

  // Handle simulation failure
  const handleSimulationFailure = (failureReason: string) => {
    setIsRunning(false);
    setCaseComplete(true);
    
    // Calculate performance metrics
    const performance = calculatePerformanceMetrics();
    const feedback = generateFailureFeedback(failureReason);
    
    // Show case completion debrief
    setCaseCompletionDebrief({
      isOpen: true,
      caseData: {
        name: currentCase?.name || 'Unknown Case',
        category: currentCase?.category || 'Unknown',
        difficulty: currentCase?.difficulty || 'Unknown'
      },
      performance,
      feedback,
      evidenceSources: [], // Will be populated from RAG
      failureReason
    });
  };

  // Handle stage advancement
  const handleStageAdvancement = (newStage: number) => {
    console.log(`🔄 === STAGE ADVANCEMENT ===`);
    console.log(`🎯 Advancing from stage ${currentStage} to stage ${newStage}`);
    
    // Handle scoring stage progression
    handleScoringStageProgression(newStage);
    
    setCurrentStage(newStage);
    setStageTime(0);
    
    // Clear previous stage's interventions immediately
    console.log(`🧹 Clearing previous stage's interventions...`);
    setAvailableInterventions([]);
    
    // Get case ID from URL for fetching stage-specific interventions
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId');
    console.log(`🆔 Case ID: ${caseId}`);
    
    if (caseId) {
      // Fetch stage-specific interventions for the new stage
      console.log(`📡 Fetching stage-specific interventions for stage ${newStage}...`);
      fetchStageInterventions(newStage, caseId);
    } else {
      // Fallback to using existing interventions if case ID not available
      console.log(`⚠️ No case ID found, using fallback logic`);
      if (currentCase && interventions && Object.keys(interventions).length > 0) {
        const newStageData = currentCase.stages.find((s: any) => s.stage === newStage);
        if (newStageData) {
          console.log(`✅ New stage: ${newStageData.stage}`);
          console.log(`🔄 Clearing previous interventions and initializing ${newStageData.stage} interventions`);
          initializeInterventions(newStageData);
        } else {
          console.warn(`❌ Stage ${newStage} not found in case`);
        }
      } else {
        console.warn(`❌ Missing case or interventions data for fallback`);
      }
    }
    
    // Check if this is the final stage
    if (newStage > (currentCase?.stages.length || 0)) {
      console.log(`🏁 Final stage reached, completing case...`);
      handleCaseCompletion();
    } else if (newStage === (currentCase?.stages.length || 0)) {
      // We're on the final stage, check if we should complete the case
      console.log(`🎯 On final stage ${newStage}, checking completion conditions...`);
      
      // Get the final stage data
      const finalStageData = currentCase?.stages?.find((s: any) => s.stage === newStage);
      if (finalStageData) {
        const requiredInterventions = finalStageData.requiredInterventions || [];
        
        // Check which required interventions have been applied successfully
        const completedRequiredInterventions = requiredInterventions.filter(requiredName => {
          const matchingIntervention = availableInterventions.find(available => 
            available.name === requiredName || available.id === requiredName
          );
          return matchingIntervention && matchingIntervention.applied && matchingIntervention.success;
        });
        
        console.log(`🎯 Stage advancement final stage check:`, {
          newStage,
          totalStages: currentCase?.stages?.length,
          requiredInterventions,
          availableInterventions: availableInterventions.map(i => ({ name: i.name, id: i.id, applied: i.applied, success: i.success })),
          completedRequiredInterventions,
          completedCount: completedRequiredInterventions.length,
          requiredCount: requiredInterventions.length
        });
        
        // If all required interventions are completed, finish the case
        if (completedRequiredInterventions.length >= requiredInterventions.length && requiredInterventions.length > 0) {
          console.log(`🏁 All required interventions completed for final stage, completing case...`);
          handleCaseCompletion();
        }
      }
    }
  };

  // Handle case completion
  const handleCaseCompletion = () => {
    console.log('🎯 handleCaseCompletion called with:', {
      currentCase: !!currentCase,
      currentStage,
      totalStages: currentCase?.stages?.length || 0,
      availableInterventions: availableInterventions.length,
      appliedInterventions: availableInterventions.filter(i => i.applied && i.success).length
    });
    
    // Only complete if we have a valid case and are on the final stage
    if (!currentCase || currentStage !== (currentCase?.stages?.length || 0)) {
      console.log('Case completion called but conditions not met:', {
        currentCase: !!currentCase,
        currentStage,
        totalStages: currentCase?.stages?.length || 0,
        reason: 'Not on final stage'
      });
      return;
    }
    
    console.log('🏁 Case completion confirmed - all stages completed');
    setIsRunning(false);
    setCaseComplete(true);
    
    // Create simple stage definitions from case data
    const simpleStageDefinitions: SimpleStageDefinition[] = currentCase?.stages?.map((stage: any) => ({
      stageNumber: stage.stage,
      requiredLabels: stage.requiredInterventions || [],
      harmfulLabels: stage.harmfulInterventions || [],
      neutralLabels: stage.neutralInterventions || []
    })) || [];
    
    // Generate simple feedback
    const feedbackResult = generateSimpleFeedback(simpleInteractions, simpleStageDefinitions);
    
    console.log('🎯 Simple feedback result:', feedbackResult);
    console.log('🎯 Simple interactions used:', simpleInteractions);
    console.log('🎯 Stage definitions used:', simpleStageDefinitions);
    
    // Show simple feedback modal
    setSimpleFeedbackModal({
      isOpen: true,
      feedbackResult
    });
  };

  // Calculate performance metrics
  const calculatePerformanceMetrics = () => {
    console.log('🔍 calculatePerformanceMetrics - Debug Info:');
    console.log('  currentCase exists:', !!currentCase);
    console.log('  stageProgressionEngine exists:', !!stageProgressionEngine);
    console.log('  availableInterventions count:', availableInterventions.length);
    
    if (!currentCase || !stageProgressionEngine) {
      console.log('❌ Early return - missing requirements');
      return {
        accuracy: 0,
        timeScore: 0,
        compositeScore: 0,
        totalTime: timeElapsed,
        expectedTime: 0,
        interventionsApplied: 0,
        requiredInterventions: 0,
        harmfulActions: 0
      };
    }

    // When case is complete, we need to consider ALL stages, not just current stage
    let totalRequiredInterventions = [];
    
    if (currentCase && currentCase.stages) {
      console.log('  Case stages:', currentCase.stages.length);
      // Collect required interventions from ALL stages
      for (const stage of currentCase.stages) {
        console.log(`  Stage ${stage.stage} required interventions:`, stage.requiredInterventions);
        if (stage.requiredInterventions) {
          totalRequiredInterventions = totalRequiredInterventions.concat(stage.requiredInterventions);
        }
      }
    }
    
    console.log('  Total required interventions across all stages:', totalRequiredInterventions);
    
    // Count applied interventions from global intervention history (instead of current stage only)
    console.log('  All applied interventions history:', allAppliedInterventions.map(i => ({id: i.id, name: i.name, success: i.success})));
    
    const appliedInterventionsData = allAppliedInterventions.filter(i => i.success);
    const appliedInterventions = appliedInterventionsData.length;
    
    console.log('  Successfully applied interventions:', appliedInterventionsData.map(i => ({id: i.id, name: i.name})));
    console.log('  Applied interventions count:', appliedInterventions);
    
    // Calculate accuracy based on required interventions completed across all stages
    const accuracy = totalRequiredInterventions.length > 0 ? 
      Math.min(100, (appliedInterventions / totalRequiredInterventions.length) * 100) : 100;
      
    console.log('  Calculated accuracy:', accuracy, `(${appliedInterventions}/${totalRequiredInterventions.length})`);
    
    // Calculate time score based on expected time vs actual time
    const expectedTime = currentCase.estimatedTime ? 
      (typeof currentCase.estimatedTime === 'number' ? currentCase.estimatedTime : 15) * 60 : 900; // 15 minutes default
    const timeRatio = timeElapsed / expectedTime;
    
    // Time score: 100% if completed within expected time, decreases linearly
    const timeScore = timeRatio <= 1 ? 100 : Math.max(0, 100 - (timeRatio - 1) * 50);
    
    // Composite score: 70% accuracy + 30% time (as specified in requirements)
    const compositeScore = Math.round(accuracy * 0.7 + timeScore * 0.3);
    
    // Count harmful actions from stage progression engine
    const currentStageState = stageProgressionEngine.getCurrentStageState();
    const harmfulActions = currentStageState?.incorrectCount || 0;
    
    return {
      accuracy: Math.round(accuracy),
      timeScore: Math.round(timeScore),
      compositeScore,
      totalTime: timeElapsed,
      expectedTime,
      interventionsApplied: appliedInterventions,
      requiredInterventions: totalRequiredInterventions.length,
      harmfulActions
    };
  };

  // Generate success feedback with grounded recommendations
  const generateSuccessFeedback = () => {
    const performance = calculatePerformanceMetrics();
    
    const strengths = [];
    const areasForImprovement = [];
    const learningRecommendations = [];
    
    // Strengths based on performance
    if (performance.accuracy >= 90) {
      strengths.push("Excellent clinical decision-making and intervention application");
      strengths.push("Strong adherence to evidence-based guidelines");
    } else if (performance.accuracy >= 80) {
      strengths.push("Good clinical judgment and appropriate intervention selection");
      strengths.push("Effective patient management approach");
    } else {
      strengths.push("Basic clinical assessment skills demonstrated");
      strengths.push("Patient safety maintained throughout the case");
    }
    
    if (performance.timeScore >= 90) {
      strengths.push("Outstanding time management and efficiency");
    } else if (performance.timeScore >= 80) {
      strengths.push("Good time management within acceptable limits");
    } else {
      areasForImprovement.push("Time management could be improved");
      areasForImprovement.push("Consider optimizing intervention timing");
    }
    
    // Areas for improvement
    if (performance.accuracy < 100) {
      areasForImprovement.push("Some required interventions were missed");
      areasForImprovement.push("Review the complete intervention sequence for this condition");
    }
    
    if (performance.harmfulActions > 0) {
      areasForImprovement.push(`${performance.harmfulActions} potentially harmful actions were taken`);
      areasForImprovement.push("Review contraindications and alternative approaches");
    }
    
    // Learning recommendations based on case type
    if (currentCase?.category === 'anaphylaxis') {
      learningRecommendations.push("Review PALS anaphylaxis guidelines and epinephrine administration protocols");
      learningRecommendations.push("Practice rapid assessment and intervention sequencing for allergic reactions");
    } else if (currentCase?.category === 'status_epilepticus') {
      learningRecommendations.push("Review AAP status epilepticus guidelines and benzodiazepine protocols");
      learningRecommendations.push("Practice seizure management and airway protection techniques");
    } else if (currentCase?.category === 'status_asthmaticus') {
      learningRecommendations.push("Review PALS respiratory assessment and asthma management protocols");
      learningRecommendations.push("Practice bronchodilator administration and respiratory monitoring");
    } else {
      learningRecommendations.push("Review current clinical guidelines for this condition");
      learningRecommendations.push("Practice systematic assessment and intervention approaches");
    }
    
    // Add general learning recommendations
    learningRecommendations.push("Focus on evidence-based practice and guideline adherence");
    learningRecommendations.push("Consider simulation-based learning for skill development");
    
    return {
      strengths,
      areasForImprovement,
      learningRecommendations
    };
  };

  // Generate evidence sources for debrief
  const generateEvidenceSourcesForDebrief = () => {
    const sources = [];
    
    // Add ALiEM source if available
    if (currentCase?.sourceVersion) {
      sources.push({
        caseId: currentCase.id,
        section: 'case_guidelines',
        passageId: 1,
        sourceCitation: `ALiEM EM ReSCu Peds - ${currentCase.name}`,
        license: currentCase.license || 'CC BY-NC-SA 4.0'
      });
    }
    
    // Add PALS guidelines
    sources.push({
      caseId: 'pals_guidelines',
      section: 'pediatric_advanced_life_support',
      passageId: 1,
      sourceCitation: 'PALS Guidelines 2020 - Pediatric Advanced Life Support',
      license: 'AHA Guidelines'
    });
    
    // Add AAP guidelines for pediatric conditions
    if (currentCase?.category === 'status_epilepticus') {
      sources.push({
        caseId: 'aap_guidelines',
        section: 'status_epilepticus',
        passageId: 1,
        sourceCitation: 'AAP Guidelines - Status Epilepticus Management',
        license: 'AAP Guidelines'
      });
    }
    
    // Add evidence-based medicine sources
    sources.push({
      caseId: 'evidence_based',
      section: 'clinical_decision_making',
      passageId: 1,
      sourceCitation: 'Evidence-Based Medicine in Pediatric Emergency Care',
      license: 'Peer-reviewed literature'
    });
    
    return sources;
  };

  // Generate failure feedback
  const generateFailureFeedback = (failureReason: string) => {
    return {
      strengths: [
        "You demonstrated knowledge of basic assessment principles",
        "You maintained focus on patient safety throughout the case"
      ],
      areasForImprovement: [
        failureReason,
        "Review the specific clinical guidelines for this condition",
        "Practice time management in high-acuity situations"
      ],
      clinicalHighlights: [
        "Understanding failure points helps identify learning opportunities",
        "Each simulation builds clinical decision-making skills"
      ],
      nextSteps: [
        "Review the case with your instructor",
        "Practice the specific interventions that were needed",
        "Consider alternative approaches for similar scenarios"
      ]
    };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Simple Header */}
        <div className="flex items-center mb-6">
          <Link href="/case-selection">
            <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
              Back to Cases
            </Button>
          </Link>
          
          <div className="flex-1 text-center ml-32">
            <h1 className="text-2xl font-bold text-white">{currentCase.name}</h1>
            <p className="text-slate-300">Stage {currentStage} of {currentCase.stages.length}</p>
            <p className="text-xs text-slate-400">{currentCase.category.replace('_', ' ').toUpperCase()} • {currentCase.difficulty.toUpperCase()}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer Display */}
            <div className="text-center">
              <div className="text-sm text-slate-400">Total Time</div>
              <div className="text-lg font-bold text-white">
                {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
              </div>
            </div>
            

            
            <Button
              onClick={() => {
                if (!isRunning) {
                  // Starting simulation - initialize scoring for stage 1
                  if (scoringCalculator) {
                    const now = Date.now();
                    setStageStartTimes(new Map([[1, now]]));
                    scoringCalculator.setStageTiming(1, now);
                    console.log('🎯 Scoring: Stage 1 started at', new Date(now).toISOString());
                  }
                }
                setIsRunning(!isRunning);
              }}
              variant={isRunning ? "destructive" : "default"}
              className={isRunning ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {isRunning ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              {isRunning ? "Pause" : "Start"}
            </Button>
            
            <Button
              onClick={resetSimulation}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Stage Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Case Progress</span>
            <span className="text-sm text-slate-400">Stage {currentStage} of {currentCase.stages.length}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-in-out"
              style={{ 
                width: isRunning 
                  ? `${(currentStage / currentCase.stages.length) * 100}%` 
                  : '0%' 
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {currentCase.stages.map((stage, index) => (
              <div key={stage.stage} className="flex flex-col items-center">
                <div 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    !isRunning 
                      ? 'bg-slate-600 border-slate-500' 
                      : stage.stage < currentStage 
                        ? 'bg-green-500 border-green-400' 
                        : stage.stage === currentStage 
                          ? 'bg-blue-500 border-blue-400 animate-pulse' 
                          : 'bg-slate-600 border-slate-500'
                  }`}
                />
                <span className={`text-xs mt-1 ${
                  !isRunning 
                    ? 'text-slate-500' 
                    : stage.stage < currentStage 
                      ? 'text-green-400' 
                      : stage.stage === currentStage 
                        ? 'text-blue-400 font-medium' 
                        : 'text-slate-500'
                }`}>
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Left Column - Vital Signs Monitor */}
          <div>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-1">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Vital Signs
                  {isVitalsPaused && (
                    <Badge variant="outline" className="text-xs bg-amber-900/30 text-amber-300 border-amber-600/50">
                      ⏸️ Paused
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!vitals.heartRate && !vitals.temperature && !vitals.respRate ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mx-auto mb-2"></div>
                    <p className="text-slate-400 text-xs">Loading...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-slate-700/50 rounded">
                      <div className="text-lg font-bold text-white">{vitals.heartRate || '--'}</div>
                      <div className="text-xs text-slate-400">HR</div>
                      <div className="text-xs text-slate-500">80-160</div>
                    </div>
                    
                    <div className="text-center p-2 bg-slate-700/50 rounded">
                      <div className="text-lg font-bold text-white">{vitals.respRate || '--'}</div>
                      <div className="text-xs text-slate-400">RR</div>
                      <div className="text-xs text-slate-500">20-40</div>
                    </div>
                    
                    <div className="text-center p-2 bg-slate-700/50 rounded">
                      <div className="text-lg font-bold text-white">
                        {(vitals.spo2 !== undefined && vitals.spo2 !== null) || (vitals.oxygenSat !== undefined && vitals.oxygenSat !== null) 
                          ? `${vitals.spo2 || vitals.oxygenSat}%` 
                          : '--'}
                      </div>
                      <div className="text-xs text-slate-400">O2</div>
                      <div className="text-xs text-slate-500">&gt;94%</div>
                    </div>
                    
                    <div className="text-center p-2 bg-slate-700/50 rounded">
                      <div className="text-lg font-bold text-white">{vitals.temperature ? `${vitals.temperature}°F` : '--'}</div>
                      <div className="text-xs text-slate-400">Temp</div>
                      <div className="text-xs text-slate-500">97-100°F</div>
                    </div>
                    
                    {vitals.bloodPressureSys && vitals.bloodPressureDia && (
                      <div className="text-center p-2 bg-slate-700/50 rounded col-span-2">
                        <div className="text-lg font-bold text-white">{vitals.bloodPressureSys}/{vitals.bloodPressureDia}</div>
                        <div className="text-xs text-slate-400">BP (mmHg)</div>
                        <div className="text-xs text-slate-500">90/60-120/80</div>
                      </div>
                    )}
                    
                    {vitals.consciousness && (
                      <div className="text-center p-2 bg-slate-700/50 rounded col-span-2">
                        <div className="text-sm font-bold text-white capitalize">{vitals.consciousness}</div>
                        <div className="text-xs text-slate-400">Consciousness</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Case Information */}
          <div className="space-y-4">
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Case Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-white mb-1 text-sm">Clinical History</h4>
                  <p className="text-xs text-slate-300">{currentCase.clinicalHistory}</p>
                </div>
                



              </CardContent>
            </Card>

            {/* Stage Progress */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Stage Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-white mb-1">Stage {currentStage}</div>
                  <div className="text-xs text-slate-400 mb-2">{currentStageData?.name || 'Current stage description'}</div>
                  
                  {/* Stage Severity and Tick Information */}
                  {stageProgressionEngine && (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-slate-400">Severity</div>
                          <div className={`text-sm font-bold px-2 py-1 rounded ${
                            stageProgressionEngine.getCurrentStageState()?.severity === 'low' ? 'bg-blue-500/20 text-blue-400' :
                            stageProgressionEngine.getCurrentStageState()?.severity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {stageProgressionEngine.getCurrentStageState()?.severity?.toUpperCase() || 'MODERATE'}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-400">Tick</div>
                          <div className="text-sm font-bold text-white">{tickTimer}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-slate-400">Stabilized</div>
                          <div className={`text-sm font-bold px-2 py-1 rounded ${
                            stageProgressionEngine.getCurrentStageState()?.isStabilized ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {stageProgressionEngine.getCurrentStageState()?.isStabilized ? 'YES' : 'NO'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(currentStageData?.timeLimit || currentStageData?.TTIsec) && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Time Remaining</span>
                        <span>{Math.max(0, ((currentStageData.timeLimit || currentStageData.TTIsec) - stageTime))}s</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${stageProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500">
                        PALS Guideline: {Math.floor((currentStageData.timeLimit || currentStageData.TTIsec) / 60)}m {(currentStageData.timeLimit || currentStageData.TTIsec) % 60}s
                      </div>
                    </div>
                  )}


                </div>
              </CardContent>
            </Card>

            {/* Case Progression */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-yellow-400" />
                  Case Progression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  {currentCase.stages.map((stage, idx) => (
                    <div key={idx} className={`flex items-center gap-2 p-1.5 rounded-lg ${
                      idx + 1 === currentStage ? 'bg-blue-600/20 border border-blue-500/30' : 
                      idx + 1 < currentStage ? 'bg-green-600/20 border border-green-500/30' : 
                      'bg-slate-700/30 border border-slate-600/30'
                    }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx + 1 === currentStage ? 'bg-blue-500 text-white' : 
                        idx + 1 < currentStage ? 'bg-green-500 text-white' : 
                        'bg-slate-600 text-slate-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white">{stage.name}</div>
                        <div className="text-xs text-slate-400">
                          {(stage.timeLimit || stage.TTIsec) ? `${Math.floor((stage.timeLimit || stage.TTIsec) / 60)}m ${(stage.timeLimit || stage.TTIsec) % 60}s` : 'No time limit'}
                        </div>
                        {stage.criticalActions && stage.criticalActions.length > 0 && (
                          <div className="text-xs text-slate-500">
                            {stage.criticalActions.length} critical action{stage.criticalActions.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      {idx + 1 === currentStage && (
                        <div className="text-xs text-blue-400 font-medium">Current</div>
                      )}
                      {idx + 1 < currentStage && (
                        <div className="text-xs text-green-400 font-medium">Complete</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Physiological Guardrails */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Physiological Guardrails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2">
                  {/* Heart Rate Guardrails */}
                  <div className="p-2 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">Heart Rate</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        vitals.heartRate && (vitals.heartRate < 60 || vitals.heartRate > 180) ? 'bg-red-500/20 text-red-400' :
                        vitals.heartRate && (vitals.heartRate < 80 || vitals.heartRate > 160) ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {vitals.heartRate && (vitals.heartRate < 60 || vitals.heartRate > 180) ? 'Critical' :
                         vitals.heartRate && (vitals.heartRate < 80 || vitals.heartRate > 160) ? 'Warning' : 'Normal'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {vitals.heartRate && vitals.heartRate < 60 ? 'Bradycardia - avoid interventions that lower HR (PALS)' :
                       vitals.heartRate && vitals.heartRate > 180 ? 'Tachycardia - monitor for arrhythmias (PALS)' :
                       'Within normal range'}
                    </div>
                  </div>

                  {/* Oxygen Saturation Guardrails */}
                  <div className="p-2 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">Oxygen Saturation</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                                                (vitals.spo2 || vitals.oxygenSat) && (vitals.spo2 || vitals.oxygenSat) < 90 ? 'bg-red-500/20 text-red-400' : 
                        (vitals.spo2 || vitals.oxygenSat) && (vitals.spo2 || vitals.oxygenSat) < 94 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {(vitals.spo2 || vitals.oxygenSat) && (vitals.spo2 || vitals.oxygenSat) < 90 ? 'Critical' :
                         (vitals.spo2 || vitals.oxygenSat) && (vitals.spo2 || vitals.oxygenSat) < 94 ? 'Warning' : 'Normal'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {(vitals.spo2 || vitals.oxygenSat) && (vitals.spo2 || vitals.oxygenSat) < 90 ? 'Hypoxemia - immediate airway intervention needed (PALS)' :
                       (vitals.spo2 || vitals.oxygenSat) && (vitals.spo2 || vitals.oxygenSat) < 94 ? 'Low O2 - consider oxygen support (PALS)' :
                       'Adequate oxygenation'}
                    </div>
                  </div>

                  {/* Temperature Guardrails */}
                  <div className="p-2 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">Temperature</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        vitals.temperature && (vitals.temperature > 102.2 || vitals.temperature < 96.8) ? 'bg-red-500/20 text-red-400' :
                        vitals.temperature && vitals.temperature > 100.4 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {vitals.temperature && (vitals.temperature > 102.2 || vitals.temperature < 96.8) ? 'Critical' :
                         vitals.temperature && vitals.temperature > 100.4 ? 'Warning' : 'Normal'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {vitals.temperature && vitals.temperature > 102.2 ? 'High fever - monitor for seizures, consider cooling (PEM)' :
                       vitals.temperature && vitals.temperature < 96.8 ? 'Hypothermia - warming measures needed (PALS)' :
                       'Temperature stable'}
                    </div>
                  </div>

                  {/* Respiratory Rate Guardrails */}
                  <div className="p-2 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">Respiratory Rate</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        vitals.respRate && (vitals.respRate < 10 || vitals.respRate > 60) ? 'bg-red-500/20 text-red-400' :
                        vitals.respRate && (vitals.respRate < 15 || vitals.respRate > 40) ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {vitals.respRate && (vitals.respRate < 10 || vitals.respRate > 60) ? 'Critical' :
                         vitals.respRate && (vitals.respRate < 15 || vitals.respRate > 40) ? 'Warning' : 'Normal'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {vitals.respRate && vitals.respRate < 10 ? 'Bradypnea - assess respiratory effort (PALS)' :
                       vitals.respRate && vitals.respRate > 60 ? 'Tachypnea - sign of respiratory distress (PALS)' :
                       'Respiratory rate normal'}
                    </div>
                  </div>

                  {/* Blood Pressure Guardrails */}
                  {vitals.bloodPressureSys && vitals.bloodPressureDia && (
                    <div className="p-2 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">Blood Pressure</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          vitals.bloodPressureSys < 70 || vitals.bloodPressureDia < 40 ? 'bg-red-500/20 text-red-400' :
                          vitals.bloodPressureSys < 90 || vitals.bloodPressureDia < 60 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {vitals.bloodPressureSys < 70 || vitals.bloodPressureDia < 40 ? 'Critical' :
                           vitals.bloodPressureSys < 90 || vitals.bloodPressureDia < 60 ? 'Warning' : 'Normal'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {vitals.bloodPressureSys < 70 || vitals.bloodPressureDia < 40 ? 'Severe hypotension - immediate IV fluids needed (PALS)' :
                         vitals.bloodPressureSys < 90 || vitals.bloodPressureDia < 60 ? 'Hypotension - consider IV fluids and monitoring (PALS)' :
                         'Blood pressure adequate'}
                      </div>
                    </div>
                  )}

                  {/* Consciousness Level Guardrails */}
                  {vitals.consciousness && (
                    <div className="p-2 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">Level of Consciousness</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          vitals.consciousness === 'unresponsive' || vitals.consciousness === 'seizing' ? 'bg-red-500/20 text-red-400' :
                          vitals.consciousness === 'lethargic' || vitals.consciousness === 'post-ictal' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {vitals.consciousness === 'unresponsive' || vitals.consciousness === 'seizing' ? 'Critical' :
                           vitals.consciousness === 'lethargic' || vitals.consciousness === 'post-ictal' ? 'Warning' : 'Normal'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {vitals.consciousness === 'unresponsive' ? 'Unresponsive - immediate airway intervention (PALS)' :
                         vitals.consciousness === 'seizing' ? 'Seizing - administer benzodiazepine (PEM)' :
                         vitals.consciousness === 'lethargic' ? 'Lethargic - monitor closely, consider etiology (PEM)' :
                         vitals.consciousness === 'post-ictal' ? 'Post-ictal - normal recovery, monitor for complications (PEM)' :
                         'Alert and responsive'}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Right Column - Available Interventions */}
          <div>
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Available Interventions - Stage {currentStage}
                </CardTitle>
                <div className="text-xs text-slate-400">
                  {currentStageData?.name || 'Current stage'}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Pause Banner */}
                {isVitalsPaused && (
                  <div className="mb-3 p-2 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-300">
                      <span className="text-sm">⏸️</span>
                      <span className="text-xs font-medium">Clinical Guidance Active</span>
                    </div>
                    <p className="text-xs text-amber-400 mt-1">
                      Interventions are paused while reviewing clinical guidance. Close the popup to resume.
                    </p>
                  </div>
                )}

                {/* Ideal Intervention Progression */}
                {idealInterventions.length > 0 && (
                  <div className="mb-3 p-2 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                    <h4 className="font-semibold text-blue-400 text-xs mb-1">Ideal Progression (Evidence-Based)</h4>
                    <div className="space-y-1">
                      {idealInterventions
                        .sort((a, b) => a.priority - b.priority)
                        .map((ideal, idx) => (
                          <div key={idx} className="text-xs text-slate-300">
                            <span className="text-blue-400 font-medium">{ideal.priority}.</span> {ideal.reasoning}
                          </div>
                        ))}
                    </div>
                  </div>
                )}





                <div className="space-y-2">
                  {availableInterventions.map((intervention) => {
                    if (!intervention) return null;
                    
                    const isOnCooldown = intervention.cooldownEnd && Date.now() < intervention.cooldownEnd;
                    const canApply = !intervention.applied && !isOnCooldown;
                    
                    return (
                      <div key={intervention.id} className="p-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white text-xs">{intervention.name}</h4>
                        </div>
                        
                        <p className="text-xs text-slate-300 mb-2">{intervention.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-400">
                            Success: {intervention.successRate ? Math.round(intervention.successRate * 100) : 90}%
                          </div>
                          
                          {intervention.applied ? (
                            <div className="flex items-center gap-1">
                              {intervention.success ? (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-400" />
                              )}
                              <span className={`text-xs ${intervention.success ? 'text-green-400' : 'text-red-400'}`}>
                                {intervention.success ? 'Success' : 'Failed'}
                              </span>
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                              console.log('=== INTERVENTION BUTTON CLICKED ===');
                              console.log('Button clicked for intervention:', intervention.id);
                              console.log('Intervention data:', intervention);
                              console.log('Is running:', isRunning);
                              console.log('Current case:', currentCase?.id);
                              console.log('Stage progression engine:', !!stageProgressionEngine);
                              console.log('Available interventions count:', availableInterventions.length);
                              applyIntervention(intervention.id);
                              console.log('=== applyIntervention called ===');
                            }}
                              disabled={!canApply || isVitalsPaused}
                              size="sm"
                              className={`text-xs ${
                                !canApply || isVitalsPaused
                                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {isOnCooldown ? 'Cooldown' : isVitalsPaused ? 'Paused' : 'Apply'}
                            </Button>
                          )}
                        </div>
                        
                        {isOnCooldown && (
                          <div className="mt-1 text-xs text-slate-400">
                            Cooldown: {Math.ceil((intervention.cooldownEnd! - Date.now()) / 1000)}s
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Intervention Popup */}
        <EnhancedInterventionPopup
          isOpen={interventionPopup.isOpen}
          onClose={(isAutoClose = false) => {
            if (isAutoClose) {
              // Log auto-close event
              const currentIntervention = interventionPopup.intervention;
              const hasGuidance = !!interventionPopup.clinicalGuidance;
              if (currentIntervention) {
                logPopupEvent('auto_closed', currentIntervention.name, hasGuidance, true);
              }
            }
            closeCurrentPopup();
          }}
          intervention={interventionPopup.intervention}
          classification={interventionPopup.classification}
          vitalsBefore={interventionPopup.vitalsBefore}
          vitalsAfter={interventionPopup.vitalsAfter}
          ragInsights={interventionPopup.ragInsights}
          evidenceSources={interventionPopup.evidenceSources}
          clinicalGuidance={interventionPopup.clinicalGuidance}
          suggestedNextSteps={interventionPopup.suggestedNextSteps}
          autoCloseDelay={12000} // 12 seconds
        />

        {/* Case Completion Debrief - Only show when case is actually finished */}
        {(() => {
          const shouldShow = caseComplete && 
                           caseCompletionDebrief.isOpen && 
                           currentCase && 
                           currentStage >= (currentCase.stages?.length || 0);
          
          console.log('🎯 DEBRIEF RENDER CHECK:');
          console.log('  caseComplete:', caseComplete);
          console.log('  caseCompletionDebrief.isOpen:', caseCompletionDebrief.isOpen);
          console.log('  currentCase exists:', !!currentCase);
          console.log('  currentStage:', currentStage);
          console.log('  currentCase.stages?.length:', currentCase?.stages?.length);
          console.log('  currentStage >= stages.length:', currentStage >= (currentCase?.stages?.length || 0));
          console.log('  shouldShow:', shouldShow);
          
          return shouldShow;
        })() && (
          <CaseCompletionDebrief
            isOpen={caseCompletionDebrief.isOpen}
            onClose={() => {
              console.log('Closing case completion debrief');
              setCaseCompletionDebrief(prev => ({ ...prev, isOpen: false }));
            }}
            caseData={caseCompletionDebrief.caseData}
            performance={caseCompletionDebrief.performance}
            feedback={caseCompletionDebrief.feedback}
            evidenceSources={caseCompletionDebrief.evidenceSources}
            scoringResult={caseCompletionDebrief.scoringResult}
          />
        )}
        
        {/* Debug info for case completion state */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 text-xs rounded">
            Case Complete: {caseComplete ? 'Yes' : 'No'}<br/>
            Debrief Open: {caseCompletionDebrief.isOpen ? 'Yes' : 'No'}<br/>
            Current Stage: {currentStage}<br/>
            Total Stages: {currentCase?.stages?.length || 0}
          </div>
        )}
      </div>
    </div>
  );
}

