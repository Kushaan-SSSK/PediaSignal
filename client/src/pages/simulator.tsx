import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RefreshCw, FileText, Clock, Target, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import SimulationInterface from "@/components/SimulationInterface";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeSimulation, setActiveSimulation] = useState<any>(null);
  const { toast } = useToast();

  // Fetch available categories
  const { data: categories } = useQuery({
    queryKey: ['/api/simulation-categories'],
  });

  // Fetch cases for selected category
  const { data: cases } = useQuery({
    queryKey: ['/api/simulation-cases', selectedCategory],
    enabled: !!selectedCategory,
  });

  const categoriesData = categories as string[] || [];
  const casesData = cases as any[] || [];

  const { data: userSimulations } = useQuery({
    queryKey: ['/api/simulations', mockUser.id],
    enabled: !!mockUser.id,
  });

  // Start simulation mutation
  const startSimulationMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await apiRequest('POST', '/api/start-simulation', {
        category,
        userId: mockUser.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      setActiveSimulation({
        ...data,
        sessionId: data.sessionId,
        caseDefinition: data.caseDefinition
      });
      
      toast({
        title: "Simulation Started",
        description: `Beginning ${data.caseDefinition.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Simulation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startSimulation = () => {
    if (!selectedCategory) {
      toast({
        title: "Select Category",
        description: "Please select a simulation category first",
        variant: "destructive",
      });
      return;
    }

    startSimulationMutation.mutate(selectedCategory);
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
            {/* Enhanced Case Selection */}
            <Card className="medical-card p-8 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Select a Simulation Category</h2>
              
              {/* Category Selection */}
              <div className="mb-6">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select a simulation category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Case Preview */}
              {casesData.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {casesData.slice(0, 4).map((caseItem: any) => (
                    <Card
                      key={caseItem.id}
                      className="border-gray-700 bg-gray-800/30 hover:border-gray-600 cursor-pointer"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-white">{caseItem.name}</h3>
                          <Badge className={getDifficultyColor(caseItem.difficulty)}>
                            {caseItem.difficulty}
                          </Badge>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">{caseItem.clinicalHistory.substring(0, 150)}...</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {caseItem.estimatedTime} min
                          </span>
                          <span className="flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {caseItem.stages.length} stages
                          </span>
                          <span className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1" />
                            {caseItem.learningObjectives.length} objectives
                          </span>
                        </div>
                        
                        <div className="flex space-x-3 text-xs text-gray-400">
                          <span>HR: {caseItem.initialVitals.heartRate}</span>
                          <span>T: {caseItem.initialVitals.temperature}°F</span>
                          <span>RR: {caseItem.initialVitals.respRate}</span>
                          {caseItem.initialVitals.oxygenSat && (
                            <span>O₂: {caseItem.initialVitals.oxygenSat}%</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {selectedCategory ? (
                    <span>
                      Random case will be selected from {selectedCategory.replace('_', ' ')} category
                    </span>
                  ) : (
                    <span>Please select a category to begin</span>
                  )}
                </div>
                
                <Button
                  onClick={startSimulation}
                  disabled={!selectedCategory || startSimulationMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 glow-effect"
                >
                  {startSimulationMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Random Simulation
                    </>
                  )}
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
