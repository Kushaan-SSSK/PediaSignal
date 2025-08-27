import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface Objective {
  id: string;
  text: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ObjectivesPickerProps {
  availableObjectives: Objective[];
  selectedObjectives: string[];
  onObjectivesChange: (objectives: string[]) => void;
  onStartSimulation: () => void;
  className?: string;
  disabled?: boolean;
}

export function ObjectivesPicker({
  availableObjectives,
  selectedObjectives,
  onObjectivesChange,
  onStartSimulation,
  className = '',
  disabled = false
}: ObjectivesPickerProps) {
  const [localSelected, setLocalSelected] = useState<string[]>(selectedObjectives);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setLocalSelected(selectedObjectives);
  }, [selectedObjectives]);

  const handleObjectiveToggle = (objectiveId: string) => {
    setLocalSelected(prev => {
      if (prev.includes(objectiveId)) {
        return prev.filter(id => id !== objectiveId);
      } else {
        if (prev.length >= 4) {
          setShowError(true);
          setTimeout(() => setShowError(false), 3000);
          return prev;
        }
        return [...prev, objectiveId];
      }
    });
  };

  const handleStartSimulation = () => {
    if (localSelected.length === 0) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    
    onObjectivesChange(localSelected);
    onStartSimulation();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Learning Objectives
          <Badge variant="outline" className="ml-auto">
            {localSelected.length}/4 selected
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {localSelected.length === 0 
                ? "Please select at least one learning objective before starting."
                : "You can select a maximum of 4 objectives."
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {availableObjectives.map((objective) => (
            <div
              key={objective.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                localSelected.includes(objective.id)
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                  : 'bg-background border-border'
              }`}
              onClick={() => handleObjectiveToggle(objective.id)}
            >
              <Checkbox
                checked={localSelected.includes(objective.id)}
                onChange={() => handleObjectiveToggle(objective.id)}
                className="mt-1"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{objective.text}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getDifficultyColor(objective.difficulty)}`}
                  >
                    {getDifficultyIcon(objective.difficulty)} {objective.difficulty}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Category: {objective.category}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {localSelected.length === 0 ? (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Select at least one objective
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                Ready to start simulation
              </span>
            )}
          </div>
          
          <Button
            onClick={handleStartSimulation}
            disabled={disabled || localSelected.length === 0}
            className="min-w-[120px]"
          >
            Start Simulation
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <p>Select 1-4 learning objectives to focus on during this simulation</p>
          <p>Objectives will be tracked throughout the case and reviewed in debrief</p>
        </div>
      </CardContent>
    </Card>
  );
}
