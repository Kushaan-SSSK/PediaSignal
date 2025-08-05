import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Thermometer, Activity, Clock, ArrowLeft, PlayCircle, PauseCircle } from "lucide-react";
import { Link } from "wouter";

interface VitalSigns {
  heartRate: number;
  temperature: number;
  respRate: number;
  oxygenSat: number;
  bloodPressure: string;
}

interface Intervention {
  id: string;
  name: string;
  applied: boolean;
  timeApplied?: string;
}

export default function DemoSimulation() {
  const [currentStage, setCurrentStage] = useState(1);
  const [vitals, setVitals] = useState<VitalSigns>({
    heartRate: 145,
    temperature: 103.2,
    respRate: 32,
    oxygenSat: 95,
    bloodPressure: "90/60"
  });
  const [interventions, setInterventions] = useState<Intervention[]>([
    { id: "oxygen", name: "Supplemental Oxygen", applied: false },
    { id: "iv", name: "IV Access", applied: false },
    { id: "acetaminophen", name: "Acetaminophen", applied: false },
    { id: "diazepam", name: "Rectal Diazepam", applied: false },
    { id: "position", name: "Recovery Position", applied: false }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [aiExplanation, setAiExplanation] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
        // Simulate vital changes based on interventions
        updateVitals();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, interventions]);

  const updateVitals = () => {
    setVitals(prev => {
      const hasOxygen = interventions.find(i => i.id === "oxygen")?.applied;
      const hasAcetaminophen = interventions.find(i => i.id === "acetaminophen")?.applied;
      
      return {
        ...prev,
        heartRate: hasOxygen ? Math.max(120, prev.heartRate - 2) : prev.heartRate + 1,
        temperature: hasAcetaminophen ? Math.max(99.5, prev.temperature - 0.1) : prev.temperature,
        oxygenSat: hasOxygen ? Math.min(99, prev.oxygenSat + 1) : prev.oxygenSat
      };
    });
  };

  const applyIntervention = (interventionId: string) => {
    setInterventions(prev => prev.map(intervention => 
      intervention.id === interventionId 
        ? { ...intervention, applied: true, timeApplied: formatTime(timeElapsed) }
        : intervention
    ));

    // Generate AI explanation based on intervention
    const explanations = {
      "oxygen": "Supplemental oxygen administration is appropriate for this febrile seizure case. The child's oxygen saturation of 95% indicates mild hypoxemia, which is common during seizure activity. Providing high-flow oxygen helps maintain adequate tissue oxygenation.",
      "iv": "Establishing IV access is prudent but not immediately critical in a brief febrile seizure. This provides a route for emergency medications if the seizure becomes prolonged (>5 minutes) or if additional interventions are needed.",
      "acetaminophen": "Acetaminophen administration addresses the underlying fever (103.2°F). While fever reduction won't stop the current seizure, it helps prevent future febrile seizures and provides comfort. Dosing should be weight-based (10-15 mg/kg).",
      "diazepam": "Rectal diazepam is indicated for seizures lasting >5 minutes or for recurrent seizures. This benzodiazepine acts quickly to terminate seizure activity by enhancing GABA-mediated neuronal inhibition.",
      "position": "Positioning the child in the recovery position (side-lying) helps maintain airway patency and prevents aspiration of secretions or vomit. This is a critical safety measure during and after seizure activity."
    };

    setAiExplanation(explanations[interventionId as keyof typeof explanations] || "");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVitalStatus = (vital: string, value: number | string) => {
    const ranges = {
      heartRate: { normal: [80, 120], concern: [120, 150], critical: [150, 200] },
      temperature: { normal: [98.6, 100.4], concern: [100.4, 102], critical: [102, 105] },
      respRate: { normal: [12, 20], concern: [20, 30], critical: [30, 40] },
      oxygenSat: { normal: [95, 100], concern: [90, 95], critical: [0, 90] }
    };

    if (typeof value === 'string') return 'normal';
    
    const range = ranges[vital as keyof typeof ranges];
    if (!range) return 'normal';

    if (value >= range.critical[0] && value <= range.critical[1]) return 'critical';
    if (value >= range.concern[0] && value <= range.concern[1]) return 'concern';
    return 'normal';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-slate-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-light">Emergency Simulation Demo</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setIsRunning(!isRunning)}
              className={isRunning ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isRunning ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              {isRunning ? "Pause" : "Start"} Simulation
            </Button>
            <div className="text-xl font-mono">
              <Clock className="h-5 w-5 inline mr-2" />
              {formatTime(timeElapsed)}
            </div>
          </div>
        </div>

        {/* Case Overview */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-light">
              <Brain className="h-6 w-6 mr-3 text-blue-400" />
              Case: 18-month-old with Febrile Seizure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Patient Information</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Age: 18 months</li>
                  <li>• Weight: 12 kg</li>
                  <li>• Presentation: Generalized tonic-clonic seizure</li>
                  <li>• Duration: 3 minutes (ongoing)</li>
                  <li>• History: Upper respiratory infection x 2 days</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Learning Objectives</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Recognize febrile seizure presentation</li>
                  <li>• Apply appropriate initial interventions</li>
                  <li>• Monitor vital signs during seizure</li>
                  <li>• Understand medication timing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Vital Signs Monitor */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-light">
                <Activity className="h-5 w-5 mr-2 text-green-400" />
                Vital Signs Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Heart Rate
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lg">{vitals.heartRate}</span>
                  <Badge variant={getVitalStatus('heartRate', vitals.heartRate) === 'critical' ? 'destructive' : 'secondary'}>
                    {getVitalStatus('heartRate', vitals.heartRate)}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Thermometer className="h-4 w-4 mr-2" />
                  Temperature
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lg">{vitals.temperature}°F</span>
                  <Badge variant={getVitalStatus('temperature', vitals.temperature) === 'critical' ? 'destructive' : 'secondary'}>
                    {getVitalStatus('temperature', vitals.temperature)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Respiratory Rate</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lg">{vitals.respRate}</span>
                  <Badge variant={getVitalStatus('respRate', vitals.respRate) === 'critical' ? 'destructive' : 'secondary'}>
                    {getVitalStatus('respRate', vitals.respRate)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>O₂ Saturation</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lg">{vitals.oxygenSat}%</span>
                  <Badge variant={getVitalStatus('oxygenSat', vitals.oxygenSat) === 'critical' ? 'destructive' : 'secondary'}>
                    {getVitalStatus('oxygenSat', vitals.oxygenSat)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Blood Pressure</span>
                <span className="font-mono text-lg">{vitals.bloodPressure}</span>
              </div>
            </CardContent>
          </Card>

          {/* Interventions */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-light">Available Interventions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {interventions.map((intervention) => (
                <div key={intervention.id} className="flex items-center justify-between">
                  <span className={intervention.applied ? "text-green-400" : "text-slate-300"}>
                    {intervention.name}
                    {intervention.timeApplied && (
                      <span className="text-xs text-slate-500 block">
                        Applied at {intervention.timeApplied}
                      </span>
                    )}
                  </span>
                  <Button
                    size="sm"
                    disabled={intervention.applied || !isRunning}
                    onClick={() => applyIntervention(intervention.id)}
                    className={intervention.applied ? "bg-green-600" : ""}
                  >
                    {intervention.applied ? "Applied" : "Apply"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Clinical Explanation */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-light">AI Clinical Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {aiExplanation ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {aiExplanation}
                  </p>
                  <div className="text-xs text-slate-500 italic">
                    Generated by OpenAI GPT-4 Clinical Model
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  Apply an intervention to receive AI-powered clinical insights and rationale.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stage Progression */}
        <Card className="bg-slate-800/50 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-light">Case Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Badge variant={currentStage >= 1 ? "default" : "secondary"}>
                Stage 1: Initial Assessment
              </Badge>
              <Badge variant={currentStage >= 2 ? "default" : "secondary"}>
                Stage 2: Intervention Phase
              </Badge>
              <Badge variant={currentStage >= 3 ? "default" : "secondary"}>
                Stage 3: Post-Seizure Care
              </Badge>
              <Badge variant={currentStage >= 4 ? "default" : "secondary"}>
                Stage 4: Disposition
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              Progress through stages by applying appropriate interventions and monitoring patient response.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}