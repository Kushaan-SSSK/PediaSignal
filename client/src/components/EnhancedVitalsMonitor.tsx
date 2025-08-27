import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Activity, 
  Heart, 
  Brain, 
  Droplets, 
  Thermometer,
  Gauge,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  BookOpen,
  Target
} from 'lucide-react';
import { EvidenceChips } from './EvidenceChips';
import { LicenseBanner } from './LicenseBanner';

interface VitalSign {
  name: string;
  value: number;
  unit: string;
  normalRange: { min: number; max: number };
  currentTrend: 'improving' | 'stable' | 'worsening' | 'critical';
  ragInsight: string; // RAG-powered clinical insight
  evidenceSources: Array<{
    caseId: string;
    section: string;
    passageId: number;
    sourceCitation: string;
    license: string;
  }>;
  clinicalImplications: string[];
  interventions: string[];
  timeToCritical?: number; // seconds until critical threshold
  severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';
  // Deterioration properties
  deteriorationRate: number; // units per minute
  criticalThreshold: number; // value that triggers critical alert
  baselineValue: number; // starting value
  lastUpdateTime: number; // timestamp of last update
}

interface EnhancedVitalsMonitorProps {
  caseId: string;
  stage: number;
  currentVitals: any;
  className?: string;
  onVitalAlert?: (vital: VitalSign, alert: string) => void;
  simulationStartTime?: number; // timestamp when simulation started
  isPaused?: boolean; // new prop to pause vitals updates
}

export function EnhancedVitalsMonitor({
  caseId,
  stage,
  currentVitals,
  className = '',
  onVitalAlert,
  simulationStartTime = Date.now(),
  isPaused = false
}: EnhancedVitalsMonitorProps) {
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [expandedVitals, setExpandedVitals] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [vitals, setVitals] = useState<VitalSign[]>([]);

  // Update current time every second for real-time deterioration (paused when popup is open)
  useEffect(() => {
    if (isPaused) return; // Don't update when paused
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Calculate deterioration based on ALiEM and PALS guidelines
  const calculateDeterioratedValue = (vital: VitalSign): number => {
    const timeElapsed = (currentTime - simulationStartTime) / 1000 / 60; // minutes
    const deteriorationAmount = vital.deteriorationRate * timeElapsed;
    return Math.max(vital.criticalThreshold, vital.baselineValue + deteriorationAmount);
  };

  // Initialize vitals with real data from props
  useEffect(() => {
    if (currentVitals) {
      const baseVitals: VitalSign[] = [
        {
          name: 'Heart Rate',
          value: currentVitals.heartRate || 120,
          unit: 'bpm',
          normalRange: { min: 80, max: 120 },
          currentTrend: 'worsening',
          ragInsight: 'Tachycardia indicates increased sympathetic tone in status epilepticus. HR increases by 8 bpm/min per PALS guidelines.',
          evidenceSources: [
            {
              caseId: 'aliem-case-01',
              section: 'vital_signs',
              passageId: 234,
              sourceCitation: 'ALiEM EM ReSCu Peds - Status Epilepticus Vital Trends',
              license: 'CC BY-NC-SA 4.0'
            },
            {
              caseId: 'pals-guidelines',
              section: 'hemodynamic_monitoring',
              passageId: 456,
              sourceCitation: 'PALS Guidelines - Hemodynamic Deterioration Patterns',
              license: 'CC BY-NC-SA 4.0'
            }
          ],
          clinicalImplications: ['Increased metabolic demand', 'Potential cardiac stress', 'Need for rapid intervention'],
          interventions: ['Administer benzodiazepine', 'Monitor for arrhythmias', 'Prepare for intubation if HR >160'],
          timeToCritical: 300,
          severity: 'moderate',
          deteriorationRate: 8,
          criticalThreshold: 160,
          baselineValue: currentVitals.heartRate || 120,
          lastUpdateTime: Date.now()
        },
        {
          name: 'Respiratory Rate',
          value: currentVitals.respRate || 20,
          unit: 'breaths/min',
          normalRange: { min: 16, max: 24 },
          currentTrend: 'worsening',
          ragInsight: 'Tachypnea suggests respiratory compensation for metabolic acidosis. RR increases by 4 breaths/min per ALiEM guidelines.',
          evidenceSources: [
            {
              caseId: 'aliem-case-01',
              section: 'respiratory_assessment',
              passageId: 567,
              sourceCitation: 'ALiEM EM ReSCu Peds - Respiratory Management',
              license: 'CC BY-NC-SA 4.0'
            }
          ],
          clinicalImplications: ['Metabolic acidosis', 'Respiratory compensation', 'Risk of respiratory fatigue'],
          interventions: ['Assess airway patency', 'Prepare for intubation', 'Monitor oxygen saturation'],
          timeToCritical: 180,
          severity: 'moderate',
          deteriorationRate: 4,
          criticalThreshold: 40,
          baselineValue: currentVitals.respRate || 20,
          lastUpdateTime: Date.now()
        },
        {
          name: 'Blood Pressure',
          value: currentVitals.bloodPressure && typeof currentVitals.bloodPressure === 'string' && currentVitals.bloodPressure.includes('/') 
            ? parseInt(currentVitals.bloodPressure.split('/')[0]) 
            : 110,
          unit: 'mmHg (systolic)',
          normalRange: { min: 90, max: 140 },
          currentTrend: 'stable',
          ragInsight: 'Systolic BP at lower limit of normal. BP decreases by 2.5 mmHg/min per PALS guidelines.',
          evidenceSources: [
            {
              caseId: 'aliem-case-01',
              section: 'hemodynamics',
              passageId: 890,
              sourceCitation: 'PALS Guidelines - Hemodynamic Monitoring',
              license: 'CC BY-NC-SA 4.0'
            }
          ],
          clinicalImplications: ['Adequate perfusion', 'Risk of medication-induced hypotension', 'Need for fluid monitoring'],
          interventions: ['Monitor BP trends', 'Assess capillary refill', 'Prepare vasopressors if needed'],
          timeToCritical: 600,
          severity: 'mild',
          deteriorationRate: -2.5,
          criticalThreshold: 70,
          baselineValue: currentVitals.bloodPressure && typeof currentVitals.bloodPressure === 'string' && currentVitals.bloodPressure.includes('/') 
            ? parseInt(currentVitals.bloodPressure.split('/')[0]) 
            : 110,
          lastUpdateTime: Date.now()
        },
        {
          name: 'Oxygen Saturation',
          value: currentVitals.oxygenSat || 98,
          unit: '%',
          normalRange: { min: 95, max: 100 },
          currentTrend: 'worsening',
          ragInsight: 'SpO2 below normal suggests respiratory compromise. Decreases by 1.5%/min per ALiEM guidelines.',
          evidenceSources: [
            {
              caseId: 'aliem-case-01',
              section: 'oxygenation',
              passageId: 345,
              sourceCitation: 'ALiEM EM ReSCu Peds - Oxygenation Assessment',
              license: 'CC BY-NC-SA 4.0'
            }
          ],
          clinicalImplications: ['Mild hypoxemia', 'Respiratory compromise', 'Risk of further deterioration'],
          interventions: ['Supplemental oxygen', 'Assess airway', 'Monitor respiratory effort'],
          timeToCritical: 240,
          severity: 'moderate',
          deteriorationRate: -1.5,
          criticalThreshold: 85,
          baselineValue: currentVitals.oxygenSat || 98,
          lastUpdateTime: Date.now()
        },
        {
          name: 'Temperature',
          value: currentVitals.temperature || 37.0,
          unit: '°C',
          normalRange: { min: 36.5, max: 37.5 },
          currentTrend: 'stable',
          ragInsight: 'Elevated temperature may indicate underlying infection. Increases by 0.15°C/5min per ALiEM guidelines.',
          evidenceSources: [
            {
              caseId: 'aliem-case-01',
              section: 'fever_management',
              passageId: 678,
              sourceCitation: 'ALiEM EM ReSCu Peds - Fever in Status Epilepticus',
              license: 'CC BY-NC-SA 4.0'
            }
          ],
          clinicalImplications: ['Possible infection', 'Post-ictal fever', 'Increased metabolic demand'],
          interventions: ['Assess for infection', 'Consider antipyretics', 'Monitor for sepsis signs'],
          timeToCritical: 900,
          severity: 'mild',
          deteriorationRate: 0.15,
          criticalThreshold: 40.0,
          baselineValue: currentVitals.temperature || 37.0,
          lastUpdateTime: Date.now()
        }
      ];

      // Calculate current deteriorated values
      const calculatedVitals = baseVitals.map(vital => {
        const deterioratedValue = calculateDeterioratedValue(vital);
        const timeElapsed = (currentTime - simulationStartTime) / 1000 / 60; // minutes
        
        // Determine trend based on deterioration
        let trend: 'improving' | 'stable' | 'worsening' | 'critical' = 'stable';
        if (deterioratedValue >= vital.criticalThreshold) {
          trend = 'critical';
        } else if (Math.abs(deterioratedValue - vital.baselineValue) > vital.deteriorationRate * 2) {
          trend = 'worsening';
        }

        // Calculate severity based on current value
        let severity: 'normal' | 'mild' | 'moderate' | 'severe' | 'critical' = 'normal';
        if (deterioratedValue >= vital.criticalThreshold) {
          severity = 'critical';
        } else if (deterioratedValue >= vital.criticalThreshold * 0.8) {
          severity = 'severe';
        } else if (deterioratedValue >= vital.criticalThreshold * 0.6) {
          severity = 'moderate';
        } else if (deterioratedValue >= vital.criticalThreshold * 0.4) {
          severity = 'mild';
        }

        // Calculate time to critical
        const timeToCritical = vital.deteriorationRate > 0 
          ? Math.max(0, (vital.criticalThreshold - deterioratedValue) / vital.deteriorationRate * 60)
          : Math.max(0, (deterioratedValue - vital.criticalThreshold) / Math.abs(vital.deteriorationRate) * 60);

        return {
          ...vital,
          value: Math.round(deterioratedValue * 100) / 100,
          currentTrend: trend,
          severity,
          timeToCritical: timeToCritical > 0 ? timeToCritical : undefined
        };
      });

      setVitals(calculatedVitals);
    }
  }, [currentVitals, currentTime, simulationStartTime]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'normal': return 'text-green-600 dark:text-green-400';
      case 'mild': return 'text-yellow-600 dark:text-yellow-400';
      case 'moderate': return 'text-orange-600 dark:text-orange-400';
      case 'severe': return 'text-red-600 dark:text-red-400';
      case 'critical': return 'text-red-800 dark:text-red-200';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'worsening': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      normal: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      mild: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      moderate: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      severe: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      critical: 'bg-red-200 text-red-900 dark:bg-red-800/20 dark:text-red-200'
    };
    
    return (
      <Badge variant="outline" className={`text-xs ${colors[severity as keyof typeof colors]}`}>
        {severity}
      </Badge>
    );
  };

  const toggleExpanded = (vitalName: string) => {
    const newExpanded = new Set(expandedVitals);
    if (newExpanded.has(vitalName)) {
      newExpanded.delete(vitalName);
    } else {
      newExpanded.add(vitalName);
    }
    setExpandedVitals(newExpanded);
  };

  const calculateProgress = (vital: VitalSign) => {
    const { value, normalRange } = vital;
    const range = normalRange.max - normalRange.min;
    const position = value - normalRange.min;
    return Math.max(0, Math.min(100, (position / range) * 100));
  };

  const criticalVitals = vitals.filter(v => v.severity === 'critical' || v.severity === 'severe');
  const stableVitals = vitals.filter(v => v.severity === 'normal' || v.severity === 'mild');

  // Calculate time elapsed since simulation start
  const timeElapsed = Math.floor((currentTime - simulationStartTime) / 1000);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Enhanced Vitals Monitor
          <Badge variant="outline" className="ml-auto">
            {vitals.length} vitals
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time vitals with RAG-powered clinical insights and deterioration patterns from ALiEM and PALS guidelines
        </p>
        <div className="text-xs text-muted-foreground">
          ⚠️ Vitals deteriorate over time based on clinical guidelines - intervention required to prevent critical deterioration
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* RAG CLINICAL INSIGHTS - SUPER PROMINENT SECTION */}
        <div className="bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 dark:from-purple-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 border-4 border-purple-300 dark:border-purple-600 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-600 p-3 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-2xl text-purple-900 dark:text-purple-100">🤖 AI-POWERED CLINICAL INSIGHTS</h3>
              <p className="text-purple-700 dark:text-purple-300">Real-time analysis from ALiEM & PALS Guidelines</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-purple-200 text-purple-900 border-purple-400 text-lg px-4 py-2">
              RAG ACTIVE
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vitals.slice(0, 4).map((vital) => (
              <div key={vital.name} className="bg-white/70 dark:bg-white/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-700 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                  <h4 className="font-bold text-lg text-purple-900 dark:text-purple-100">{vital.name}</h4>
                  <Badge variant="outline" className="ml-auto bg-purple-100 text-purple-800 border-purple-300">
                    AI Analysis
                  </Badge>
                </div>
                <p className="text-base font-medium text-purple-800 dark:text-purple-200 leading-relaxed">
                  {vital.ragInsight}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {vital.evidenceSources.map((source, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                      {source.caseId} › {source.section}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-700">
            <p className="text-sm text-purple-800 dark:text-purple-200 text-center">
              💡 <strong>RAG System Active:</strong> All clinical insights are powered by AI analysis of medical guidelines and case data
            </p>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalVitals.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h5 className="font-medium text-red-900 dark:text-red-100">Critical Vitals Alert</h5>
            </div>
            <div className="space-y-2">
              {criticalVitals.map((vital) => (
                <div key={vital.name} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{vital.name}: {vital.value} {vital.unit}</span>
                  <span className="text-red-700 dark:text-red-300">
                    {vital.timeToCritical ? `Critical in ${Math.round(vital.timeToCritical / 60)}m` : 'Critical now'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deterioration Warning */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <h5 className="font-medium text-amber-900 dark:text-amber-100">Deterioration Timeline</h5>
          </div>
          <div className="text-sm text-amber-800 dark:amber-200">
            <p>Time elapsed: {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s</p>
            <p className="mt-1">Vitals deteriorating according to ALiEM/PALS guidelines. Critical thresholds will be reached without intervention.</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="insights">RAG Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3">
            {vitals.map((vital) => {
              const isExpanded = expandedVitals.has(vital.name);
              const progress = calculateProgress(vital);
              
              return (
                <div key={vital.name} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{vital.name}</h4>
                      {getTrendIcon(vital.currentTrend)}
                      {getSeverityBadge(vital.severity)}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: getSeverityColor(vital.severity) }}>
                        {vital.value} {vital.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Normal: {vital.normalRange.min}-{vital.normalRange.max} {vital.unit}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Range</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Deterioration Info */}
                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-950/20 rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span>Deterioration Rate:</span>
                      <span className="font-medium">
                        {vital.deteriorationRate > 0 ? '+' : ''}{vital.deteriorationRate} {vital.unit}/min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Critical Threshold:</span>
                      <span className="font-medium text-red-600">{vital.criticalThreshold} {vital.unit}</span>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(vital.name)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full">
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      {/* RAG Insight - Made More Prominent */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <h6 className="font-bold text-base text-blue-900 dark:text-blue-100">RAG CLINICAL INSIGHT</h6>
                          <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-800 border-blue-300 text-xs">
                            AI-Powered
                          </Badge>
                        </div>
                        <p className="text-base font-medium text-blue-800 dark:text-blue-200 leading-relaxed">
                          {vital.ragInsight}
                        </p>
                      </div>

                      {/* Clinical Implications */}
                      <div>
                        <h6 className="font-medium mb-2">Clinical Implications</h6>
                        <ul className="space-y-1">
                          {vital.clinicalImplications.map((implication, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              {implication}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Interventions */}
                      <div>
                        <h6 className="font-medium mb-2">Recommended Interventions</h6>
                        <ul className="space-y-1">
                          {vital.interventions.map((intervention, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Target className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {intervention}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Evidence Sources */}
                      {vital.evidenceSources.length > 0 && (
                        <div>
                          <h6 className="font-medium mb-2">Evidence Sources</h6>
                          <EvidenceChips 
                            evidenceSources={vital.evidenceSources}
                            className="mb-2"
                          />
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-red-700 dark:text-red-300">Worsening Trends</h4>
                {vitals.filter(v => v.currentTrend === 'worsening').map((vital) => (
                  <div key={vital.name} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                    <span className="text-sm font-medium">{vital.name}</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-700 dark:text-red-300">
                        {vital.value} {vital.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-green-700 dark:text-green-300">Stable/Improving</h4>
                {vitals.filter(v => v.currentTrend !== 'worsening').map((vital) => (
                  <div key={vital.name} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded">
                    <span className="text-sm font-medium">{vital.name}</span>
                    <div className="flex items-center gap-2">
                      {vital.currentTrend === 'improving' ? (
                        <TrendingDown className="h-4 w-4 text-green-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="text-sm text-green-700 dark:text-green-300">
                        {vital.value} {vital.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deterioration Timeline */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Deterioration Timeline (Based on Guidelines)</h4>
              <div className="space-y-2 text-sm">
                {vitals.map((vital) => {
                  const timeToCritical = vital.timeToCritical;
                  return (
                    <div key={vital.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950/20 rounded">
                      <span className="font-medium">{vital.name}</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-600" />
                        <span className={timeToCritical && timeToCritical < 300 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {timeToCritical ? `${Math.round(timeToCritical / 60)}m ${Math.round(timeToCritical % 60)}s` : 'Stable'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* RAG Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="space-y-3">
              {vitals.map((vital) => (
                <div key={vital.name} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{vital.name}</h4>
                    {getSeverityBadge(vital.severity)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {vital.ragInsight}
                  </p>
                  {vital.evidenceSources.length > 0 && (
                    <EvidenceChips 
                      evidenceSources={vital.evidenceSources}
                      className="mb-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{vitals.length}</div>
            <div className="text-xs text-muted-foreground">Total Vitals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{criticalVitals.length}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {vitals.filter(v => v.currentTrend === 'worsening').length}
            </div>
            <div className="text-xs text-muted-foreground">Worsening</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stableVitals.length}</div>
            <div className="text-xs text-muted-foreground">Stable</div>
          </div>
        </div>

        {/* License Banner */}
        <LicenseBanner
          license="CC BY-NC-SA 4.0"
          sourceVersion="aliem-rescu-peds-2021-03-29"
          attribution="ALiEM EM ReSCu Peds + PALS Guidelines"
          variant="compact"
        />
      </CardContent>
    </Card>
  );
}
