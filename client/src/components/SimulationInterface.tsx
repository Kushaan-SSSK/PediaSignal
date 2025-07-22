import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Syringe, Heart, Thermometer, Droplets, Play, Pause, OctagonMinus, SkipForward } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import VitalMonitor from "./VitalMonitor";

interface SimulationData {
  id?: number;
  caseType: string;
  stage: number;
  vitals: {
    heartRate: number;
    temperature: number;
    respRate: number;
    oxygenSat?: number;
  };
  status: string;
  interventions: string[];
  aiExplanations: string[];
}

interface SimulationInterfaceProps {
  simulation: SimulationData;
  userId: number;
  onSimulationUpdate?: (simulation: SimulationData) => void;
}

export default function SimulationInterface({ 
  simulation: initialSimulation, 
  userId,
  onSimulationUpdate 
}: SimulationInterfaceProps) {
  const [simulation, setSimulation] = useState(initialSimulation);
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null);
  const { toast } = useToast();

  const interventionMutation = useMutation({
    mutationFn: async (intervention: string) => {
      const response = await apiRequest('POST', '/api/simulate-case', {
        caseType: simulation.caseType,
        intervention,
        userId,
        vitals: simulation.vitals,
        stage: simulation.stage
      });
      return response.json();
    },
    onSuccess: (data) => {
      const updatedSimulation = {
        ...simulation,
        id: data.simulationId,
        stage: data.stage,
        vitals: data.updatedVitals,
        interventions: [...simulation.interventions, selectedIntervention!],
        aiExplanations: [...simulation.aiExplanations, data.clinicalExplanation]
      };
      
      setSimulation(updatedSimulation);
      onSimulationUpdate?.(updatedSimulation);
      
      toast({
        title: "Intervention Applied",
        description: "AI clinical explanation updated",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/simulations', userId] });
    },
    onError: (error) => {
      toast({
        title: "Intervention Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleIntervention = (intervention: string) => {
    setSelectedIntervention(intervention);
    interventionMutation.mutate(intervention);
  };

  const interventions = [
    { id: 'diazepam', name: 'Administer Diazepam', icon: Syringe, style: 'intervention-red' },
    { id: 'oxygen', name: 'Provide Oxygen Support', icon: Heart, style: 'intervention-blue' },
    { id: 'cooling', name: 'Cooling Measures', icon: Thermometer, style: 'intervention-green' },
    { id: 'iv_access', name: 'Establish IV Access', icon: Droplets, style: 'intervention-amber' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600/20 text-green-400';
      case 'paused':
        return 'bg-yellow-600/20 text-yellow-400';
      case 'completed':
        return 'bg-blue-600/20 text-blue-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  const latestExplanation = simulation.aiExplanations[simulation.aiExplanations.length - 1] || 
    "Starting pediatric emergency simulation. Monitor patient vitals and apply appropriate interventions based on clinical presentation.";

  return (
    <Card className="medical-card p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">
          Active Simulation: {simulation.caseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h3>
        <div className="flex space-x-3">
          <Badge className={getStatusColor(simulation.status)}>
            {simulation.status.charAt(0).toUpperCase() + simulation.status.slice(1)}
          </Badge>
          <Badge className="bg-blue-600/20 text-blue-400">
            Stage {simulation.stage}/4
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Patient Vitals */}
        <div className="lg:col-span-1">
          <VitalMonitor 
            vitals={simulation.vitals} 
            isActive={simulation.status === 'active'} 
          />
        </div>

        {/* Intervention Panel */}
        <div className="lg:col-span-1">
          <h4 className="text-lg font-semibold mb-4 text-white">Available Interventions</h4>
          <div className="space-y-3">
            {interventions.map((intervention) => {
              const Icon = intervention.icon;
              return (
                <Button
                  key={intervention.id}
                  onClick={() => handleIntervention(intervention.id)}
                  disabled={interventionMutation.isPending}
                  className={`intervention-button ${intervention.style}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {intervention.name}
                </Button>
              );
            })}
          </div>
          
          {interventionMutation.isPending && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                Applying intervention...
              </div>
            </div>
          )}
        </div>

        {/* AI Clinical Explanation */}
        <div className="lg:col-span-1">
          <h4 className="text-lg font-semibold mb-4 text-white">AI Clinical Guidance</h4>
          <Card className="bg-gray-900/50 border-gray-700 h-64 overflow-y-auto">
            <CardContent className="p-4">
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">AI</span>
                  </div>
                  <p className="text-gray-300">
                    {latestExplanation}
                  </p>
                </div>
                
                {simulation.interventions.length > 0 && (
                  <div className="pt-3 border-t border-gray-700">
                    <h5 className="text-xs font-medium text-gray-400 mb-2">Applied Interventions:</h5>
                    {simulation.interventions.map((intervention, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-1">
                        {intervention.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <div className="flex space-x-4">
          <Button variant="secondary" className="bg-gray-600 hover:bg-gray-700">
            <Pause className="w-4 h-4 mr-2" />
            Pause Simulation
          </Button>
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
            <OctagonMinus className="w-4 h-4 mr-2" />
            End Session
          </Button>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 glow-effect">
          <SkipForward className="w-4 h-4 mr-2" />
          Next Stage
        </Button>
      </div>
    </Card>
  );
}
