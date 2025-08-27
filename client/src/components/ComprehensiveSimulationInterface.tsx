import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Heart, 
  Brain, 
  Clock,
  Target,
  AlertTriangle,
  BookOpen,
  Users,
  MessageSquare,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Settings
} from 'lucide-react';
import { InterventionsPanel } from './InterventionsPanel';
import { EnhancedVitalsMonitor } from './EnhancedVitalsMonitor';
import { CriticalActionsChecklist } from './CriticalActionsChecklist';
import { GuardrailBanner } from './GuardrailBanner';
import { ICSCoachLane } from './ICSCoachLane';
import { EvidenceChips } from './EvidenceChips';
import { LicenseBanner } from './LicenseBanner';

interface SimulationState {
  isRunning: boolean;
  currentStage: number;
  timeElapsed: number;
  selectedInterventions: string[];
  completedActions: string[];
  riskFlags: string[];
  evidenceSources: Array<{
    caseId: string;
    section: string;
    passageId: number;
    sourceCitation: string;
    license: string;
  }>;
  ragInsights: string[];
  simulationStartTime: number; // Add simulation start time
}

interface ComprehensiveSimulationInterfaceProps {
  caseId: string;
  caseName: string;
  className?: string;
  onSimulationComplete?: (results: any) => void;
  isPaused?: boolean; // Add pause prop for vitals
}

export function ComprehensiveSimulationInterface({
  caseId,
  caseName,
  className = '',
  onSimulationComplete,
  isPaused = false
}: ComprehensiveSimulationInterfaceProps) {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isRunning: false,
    currentStage: 1,
    timeElapsed: 0,
    selectedInterventions: [],
    completedActions: [],
    riskFlags: ['Patient weight below recommended range for medication', 'History of adverse reactions to benzodiazepines'],
    evidenceSources: [
      {
        caseId: 'aliem-case-01',
        section: 'critical_actions',
        passageId: 123,
        sourceCitation: 'ALiEM EM ReSCu Peds - Status Epilepticus Case',
        license: 'CC BY-NC-SA 4.0'
      }
    ],
    ragInsights: [
      'Status epilepticus requires immediate intervention within 5 minutes',
      'Benzodiazepines are first-line therapy with specific dosing protocols',
      'Airway management is critical due to risk of respiratory depression'
    ],
    simulationStartTime: Date.now() // Initialize with current time
  });

  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [showRAGInsights, setShowRAGInsights] = useState<boolean>(true);

  // Mock current vitals - in real implementation, this would come from the simulation engine
  const currentVitals = {
    heartRate: 140,
    respiratoryRate: 28,
    bloodPressure: 95,
    oxygenSaturation: 94,
    temperature: 38.2,
    capillaryRefill: 3
  };

  // Mock critical actions - in real implementation, this would come from RAG
  const criticalActions = [
    {
      id: 'action-1',
      stage: 1,
      label: 'Assess airway and breathing',
      required: true,
      order: 1,
      timeWindow: 60
    },
    {
      id: 'action-2',
      stage: 1,
      label: 'Establish IV access',
      required: true,
      order: 2,
      timeWindow: 120
    },
    {
      id: 'action-3',
      stage: 1,
      label: 'Administer benzodiazepine',
      required: true,
      order: 3,
      timeWindow: 300
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (simulationState.isRunning) {
      interval = setInterval(() => {
        setSimulationState(prev => ({
          ...prev,
          timeElapsed: prev.timeElapsed + 1
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simulationState.isRunning]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartSimulation = () => {
    setSimulationState(prev => ({
      ...prev,
      isRunning: true,
      timeElapsed: 0,
      simulationStartTime: Date.now() // Reset start time when starting
    }));
  };

  const handlePauseSimulation = () => {
    setSimulationState(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const handleResetSimulation = () => {
    setSimulationState(prev => ({
      ...prev,
      isRunning: false,
      timeElapsed: 0,
      currentStage: 1,
      selectedInterventions: [],
      completedActions: [],
      simulationStartTime: Date.now() // Reset start time when resetting
    }));
  };

  const handleInterventionSelect = (intervention: any) => {
    setSimulationState(prev => ({
      ...prev,
      selectedInterventions: [...prev.selectedInterventions, intervention.name]
    }));
  };

  const handleActionComplete = (actionId: string) => {
    setSimulationState(prev => ({
      ...prev,
      completedActions: [...prev.completedActions, actionId]
    }));
  };

  const handleVitalAlert = (vital: any, alert: string) => {
    console.log(`Vital Alert: ${vital.name} - ${alert}`);
    // In real implementation, this would trigger notifications or updates
  };

  const handleDismissRisk = (riskIndex: number) => {
    setSimulationState(prev => ({
      ...prev,
      riskFlags: prev.riskFlags.filter((_, index) => index !== riskIndex)
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                {caseName} - Comprehensive Simulation
                <Badge variant="outline" className="ml-auto">
                  Stage {simulationState.currentStage}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Evidence-based simulation with RAG-powered insights from ALiEM and PALS guidelines
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime(simulationState.timeElapsed)}
                </div>
                <div className="text-xs text-muted-foreground">Time Elapsed</div>
              </div>
              
              <div className="flex gap-2">
                {!simulationState.isRunning ? (
                  <Button onClick={handleStartSimulation} size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={handlePauseSimulation} variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleResetSimulation} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Risk Flags Banner */}
      {simulationState.riskFlags.length > 0 && (
        <GuardrailBanner
          riskFlags={simulationState.riskFlags}
          evidenceSources={simulationState.evidenceSources}
          onDismiss={() => handleDismissRisk(0)}
        />
      )}

      {/* RAG Insights Panel - SUPER PROMINENT */}
      {showRAGInsights && (
        <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-red-100 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-red-950/40 border-4 border-purple-300 dark:border-purple-600 rounded-xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-purple-600 p-4 rounded-full">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-3xl text-purple-900 dark:text-purple-100">🚀 RAG-POWERED SIMULATION</h2>
              <p className="text-purple-700 dark:text-purple-300 text-lg">AI-driven clinical reasoning from ALiEM & PALS Guidelines</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-purple-200 text-purple-900 border-purple-400 text-xl px-6 py-3">
              🤖 RAG ACTIVE
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/80 dark:bg-white/20 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
              <h3 className="font-bold text-xl text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                <Target className="h-6 w-6" />
                Key Clinical Insights
              </h3>
              <div className="space-y-3">
                {simulationState.ragInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-700 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-white/20 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
              <h3 className="font-bold text-xl text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                Risk Assessment
              </h3>
              <div className="space-y-3">
                {simulationState.riskFlags.map((risk, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-red-600 mt-2 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/80 dark:bg-white/20 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-700 shadow-lg">
              <h3 className="font-bold text-xl text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Evidence Sources
              </h3>
              <div className="space-y-3">
                {simulationState.evidenceSources.map((source, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {source.caseId} › {source.section}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      {source.sourceCitation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-700">
            <p className="text-center text-purple-800 dark:text-purple-200">
              💡 <strong>RAG System Active:</strong> This entire simulation is powered by AI analysis of medical guidelines, providing real-time clinical reasoning and evidence-based recommendations
            </p>
          </div>
        </div>
      )}

      {/* Main Simulation Interface */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Vitals Monitor */}
            <EnhancedVitalsMonitor
              caseId={caseId}
              stage={simulationState.currentStage}
              currentVitals={currentVitals}
              onVitalAlert={handleVitalAlert}
              simulationStartTime={simulationState.simulationStartTime}
              isPaused={isPaused}
            />

            {/* Critical Actions Checklist */}
            <CriticalActionsChecklist
              criticalActions={criticalActions}
              objectiveHits={simulationState.completedActions}
              currentStage={simulationState.currentStage}
              timeElapsed={simulationState.timeElapsed}
            />
          </div>

          {/* ICS Coach Lane */}
          <ICSCoachLane
            caseId={caseId}
            stage={simulationState.currentStage}
            currentVitals={currentVitals}
          />

          {/* Selected Interventions */}
          {simulationState.selectedInterventions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Selected Interventions
                  <Badge variant="outline" className="ml-auto">
                    {simulationState.selectedInterventions.length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {simulationState.selectedInterventions.map((intervention, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{intervention}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions" className="space-y-6">
          <InterventionsPanel
            caseId={caseId}
            stage={simulationState.currentStage}
            currentVitals={currentVitals}
            onInterventionSelect={handleInterventionSelect}
          />
        </TabsContent>

        {/* Vitals Tab */}
        <TabsContent value="vitals" className="space-y-6">
          <EnhancedVitalsMonitor
            caseId={caseId}
            stage={simulationState.currentStage}
            currentVitals={currentVitals}
            onVitalAlert={handleVitalAlert}
            className="w-full"
            simulationStartTime={simulationState.simulationStartTime}
            isPaused={isPaused}
          />
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CriticalActionsChecklist
              criticalActions={criticalActions}
              objectiveHits={simulationState.completedActions}
              currentStage={simulationState.currentStage}
              timeElapsed={simulationState.timeElapsed}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Simulation Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stage Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {simulationState.currentStage}/3
                    </span>
                  </div>
                  <Progress value={(simulationState.currentStage / 3) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Actions Completed</span>
                    <span className="text-sm text-muted-foreground">
                      {simulationState.completedActions.length}/{criticalActions.length}
                    </span>
                  </div>
                  <Progress value={(simulationState.completedActions.length / criticalActions.length) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Interventions Applied</span>
                    <span className="text-sm text-muted-foreground">
                      {simulationState.selectedInterventions.length}
                    </span>
                  </div>
                  <Progress value={Math.min((simulationState.selectedInterventions.length / 4) * 100, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer with License */}
      <LicenseBanner
        license="CC BY-NC-SA 4.0"
        sourceVersion="aliem-rescu-peds-2021-03-29"
        attribution="ALiEM EM ReSCu Peds + PALS Guidelines"
        variant="footer"
      />
    </div>
  );
}
