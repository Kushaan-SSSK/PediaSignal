import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RefreshCw, FileText } from "lucide-react";
import Header from "@/components/Header";
import SimulationInterface from "@/components/SimulationInterface";

// Mock user - in real app this would come from auth
const mockUser = {
  id: 1,
  name: "Dr. Sarah Johnson", 
  role: "pediatrician",
};

interface CaseTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  initialVitals: {
    heartRate: number;
    temperature: number;
    respRate: number;
    oxygenSat?: number;
  };
}

const caseTemplates: CaseTemplate[] = [
  {
    id: "febrile_seizure",
    name: "Febrile Seizure",
    description: "3-year-old with high fever and generalized tonic-clonic seizure activity",
    difficulty: "Intermediate",
    estimatedTime: "15-20 minutes",
    initialVitals: {
      heartRate: 145,
      temperature: 103.2,
      respRate: 32,
      oxygenSat: 96
    }
  },
  {
    id: "respiratory_distress",
    name: "Respiratory Distress",
    description: "18-month-old with difficulty breathing and accessory muscle use",
    difficulty: "Advanced",
    estimatedTime: "20-25 minutes", 
    initialVitals: {
      heartRate: 160,
      temperature: 99.8,
      respRate: 45,
      oxygenSat: 88
    }
  },
  {
    id: "anaphylaxis",
    name: "Anaphylaxis",
    description: "5-year-old with severe allergic reaction and systemic symptoms",
    difficulty: "Expert",
    estimatedTime: "10-15 minutes",
    initialVitals: {
      heartRate: 170,
      temperature: 98.6,
      respRate: 38,
      oxygenSat: 90
    }
  },
  {
    id: "sepsis",
    name: "Pediatric Sepsis",
    description: "2-year-old with fever, altered mental status, and signs of shock",
    difficulty: "Expert",
    estimatedTime: "25-30 minutes",
    initialVitals: {
      heartRate: 180,
      temperature: 104.1,
      respRate: 40,
      oxygenSat: 94
    }
  }
];

export default function Simulator() {
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [activeSimulation, setActiveSimulation] = useState<any>(null);

  const { data: userSimulations } = useQuery({
    queryKey: ['/api/simulations', mockUser.id],
    enabled: !!mockUser.id,
  });

  const startSimulation = () => {
    const caseTemplate = caseTemplates.find(c => c.id === selectedCase);
    if (!caseTemplate) return;

    const newSimulation = {
      caseType: caseTemplate.id,
      stage: 1,
      vitals: caseTemplate.initialVitals,
      status: 'active' as const,
      interventions: [],
      aiExplanations: []
    };

    setActiveSimulation(newSimulation);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-600/20 text-green-400';
      case 'intermediate':
        return 'bg-yellow-600/20 text-yellow-400';
      case 'advanced':
        return 'bg-orange-600/20 text-orange-400';
      case 'expert':
        return 'bg-red-600/20 text-red-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen medical-gradient">
      <Header user={mockUser} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pediatric Emergency Simulator</h1>
          <p className="text-gray-300">Interactive training scenarios with real-time AI feedback</p>
        </div>

        {!activeSimulation ? (
          <>
            {/* Case Selection */}
            <Card className="medical-card p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Select a Case Scenario</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {caseTemplates.map((caseTemplate) => (
                  <Card
                    key={caseTemplate.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedCase === caseTemplate.id
                        ? 'border-indigo-500 bg-indigo-600/10'
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedCase(caseTemplate.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-white">{caseTemplate.name}</h3>
                        <Badge className={getDifficultyColor(caseTemplate.difficulty)}>
                          {caseTemplate.difficulty}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mb-4">{caseTemplate.description}</p>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">
                          Duration: {caseTemplate.estimatedTime}
                        </span>
                        <div className="flex space-x-3 text-gray-400">
                          <span>HR: {caseTemplate.initialVitals.heartRate}</span>
                          <span>T: {caseTemplate.initialVitals.temperature}°F</span>
                          <span>RR: {caseTemplate.initialVitals.respRate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <Select value={selectedCase} onValueChange={setSelectedCase}>
                    <SelectTrigger className="w-64 bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select a case scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={startSimulation}
                  disabled={!selectedCase}
                  className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 glow-effect"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Simulation
                </Button>
              </div>
            </Card>

            {/* Previous Simulations */}
            {userSimulations && Array.isArray(userSimulations) && userSimulations.length > 0 && (
              <Card className="medical-card p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Recent Simulations</h2>
                  <Button variant="outline" className="border-gray-600 text-gray-300">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {(userSimulations as any[]).slice(0, 5).map((sim: any) => (
                    <div
                      key={sim.id}
                      className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center space-x-4">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="font-medium text-white">
                            {sim.caseType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-400">
                            Stage {sim.stage} • {sim.interventions.length} interventions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getDifficultyColor(sim.status === 'completed' ? 'completed' : 'active')}>
                          {sim.status}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {new Date(sim.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          <SimulationInterface
            simulation={activeSimulation}
            userId={mockUser.id}
            onSimulationUpdate={setActiveSimulation}
          />
        )}
      </main>
    </div>
  );
}
