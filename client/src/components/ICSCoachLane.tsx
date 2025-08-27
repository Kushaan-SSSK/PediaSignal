import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageSquare, Users, Copy, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ICSCoachLaneProps {
  caseId: string;
  stage: number;
  currentVitals: any;
  className?: string;
  isEnabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

interface ICSPhrase {
  id: string;
  text: string;
  context: string;
  sourceCitation: string;
  license: string;
}

export function ICSCoachLane({ 
  caseId, 
  stage, 
  currentVitals, 
  className = '',
  isEnabled = true,
  onToggle 
}: ICSCoachLaneProps) {
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

  // Mock ICS phrases - in real implementation, these would come from RAG
  const icsPhrases: ICSPhrase[] = [
    {
      id: '1',
      text: "Team, we have a pediatric patient with status epilepticus. I need airway assessment and IV access immediately.",
      context: "Initial team briefing for status epilepticus",
      sourceCitation: "ALiEM EM ReSCu Peds - Status Epilepticus Case",
      license: "CC BY-NC-SA 4.0"
    },
    {
      id: '2',
      text: "Respiratory status is deteriorating. Prepare for intubation if this continues.",
      context: "Escalation communication",
      sourceCitation: "ALiEM EM ReSCu Peds - Airway Management",
      license: "CC BY-NC-SA 4.0"
    },
    {
      id: '3',
      text: "Administering benzodiazepine per protocol. Monitor for respiratory depression.",
      context: "Medication administration",
      sourceCitation: "ALiEM EM ReSCu Peds - Seizure Management",
      license: "CC BY-NC-SA 4.0"
    }
  ];

  const handleCopyPhrase = async (phrase: string) => {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopiedPhrase(phrase);
      
      toast({
        title: "Phrase copied!",
        description: "Communication phrase copied to clipboard",
        duration: 2000,
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedPhrase(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy phrase to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleToggle = (enabled: boolean) => {
    onToggle?.(enabled);
  };

  if (!isEnabled) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            ICS Communication Coach
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              className="ml-auto"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            ICS Communication Coach is disabled. Enable to see communication suggestions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          ICS Communication Coach
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            className="ml-auto"
          />
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Team communication suggestions for Stage {stage}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {icsPhrases.map((phrase) => (
          <div key={phrase.id} className="p-3 border rounded-lg bg-muted/30">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">{phrase.text}</p>
                <p className="text-xs text-muted-foreground">{phrase.context}</p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyPhrase(phrase.text)}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                {copiedPhrase === phrase.text ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Source: {phrase.sourceCitation}
              </span>
              <Badge variant="outline" className="text-xs">
                {phrase.license}
              </Badge>
            </div>
          </div>
        ))}
        
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <p>These phrases are based on ALiEM EM ReSCu Peds guidelines</p>
          <p>Use as communication templates during simulation</p>
        </div>
      </CardContent>
    </Card>
  );
}
