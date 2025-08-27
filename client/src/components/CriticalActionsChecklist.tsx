import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';

export interface CriticalAction {
  id: string;
  stage: number;
  label: string;
  synonyms?: string[];
  required: boolean;
  order: number;
  timeWindow?: number; // seconds
}

interface CriticalActionsChecklistProps {
  criticalActions: CriticalAction[];
  objectiveHits: string[];
  currentStage: number;
  timeElapsed: number;
  className?: string;
}

export function CriticalActionsChecklist({ 
  criticalActions, 
  objectiveHits, 
  currentStage, 
  timeElapsed,
  className = '' 
}: CriticalActionsChecklistProps) {
  if (!criticalActions || criticalActions.length === 0) {
    return null;
  }

  // Filter actions for current stage
  const stageActions = criticalActions.filter(action => action.stage === currentStage);
  
  // Sort by order
  const sortedActions = stageActions.sort((a, b) => a.order - b.order);

  const isActionCompleted = (action: CriticalAction): boolean => {
    // Check if any of the action's text or synonyms match objective hits
    const actionText = action.label.toLowerCase();
    const synonyms = action.synonyms?.map(s => s.toLowerCase()) || [];
    
    return objectiveHits.some(hit => {
      const hitLower = hit.toLowerCase();
      return actionText.includes(hitLower) || 
             hitLower.includes(actionText) ||
             synonyms.some(synonym => 
               synonym.includes(hitLower) || hitLower.includes(synonym)
             );
    });
  };

  const isActionOverdue = (action: CriticalAction): boolean => {
    if (!action.timeWindow || !action.required) return false;
    return timeElapsed > action.timeWindow;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5" />
          Critical Actions Checklist
          <Badge variant="outline" className="ml-auto">
            Stage {currentStage}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedActions.map((action) => {
          const completed = isActionCompleted(action);
          const overdue = isActionOverdue(action);
          
          return (
            <div 
              key={action.id} 
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                completed 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                  : overdue 
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                    : 'bg-background border-border'
              }`}
            >
              <Checkbox 
                checked={completed}
                disabled
                className="mt-1"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${
                    completed ? 'text-green-700 dark:text-green-300' : 
                    overdue ? 'text-red-700 dark:text-red-300' : 
                    'text-foreground'
                  }`}>
                    {action.label}
                  </span>
                  
                  {action.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                  
                  {action.timeWindow && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.round(action.timeWindow / 60)}m
                    </Badge>
                  )}
                </div>
                
                {overdue && (
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue by {Math.round((timeElapsed - action.timeWindow!) / 60)} minutes
                  </div>
                )}
                
                {completed && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {sortedActions.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No critical actions for this stage
          </div>
        )}
      </CardContent>
    </Card>
  );
}
