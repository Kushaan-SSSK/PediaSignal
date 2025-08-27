import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, AlertTriangle, X, Info } from 'lucide-react';

interface GuardrailBannerProps {
  riskFlags: string[];
  evidenceSources?: Array<{
    caseId: string;
    section: string;
    passageId: number;
    sourceCitation: string;
    license: string;
  }>;
  className?: string;
  onDismiss?: () => void;
}

export function GuardrailBanner({ 
  riskFlags, 
  evidenceSources = [], 
  className = '',
  onDismiss 
}: GuardrailBannerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!riskFlags || riskFlags.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss?.();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Safety Alert - Risk Factors Identified</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {riskFlags.length} risk{riskFlags.length > 1 ? 's' : ''}
          </Badge>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertTitle>
      
      <AlertDescription className="mt-2 space-y-3">
        <div className="space-y-2">
          {riskFlags.map((risk, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
              <span className="text-sm">{risk}</span>
            </div>
          ))}
        </div>

        {evidenceSources.length > 0 && (
          <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Info className="h-3 w-3 mr-1" />
                View Evidence Sources
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <div className="text-xs text-muted-foreground">
                <strong>Evidence Sources:</strong>
              </div>
              {evidenceSources.map((source, index) => (
                <div key={index} className="text-xs bg-destructive/10 p-2 rounded border border-destructive/20">
                  <div className="font-medium">{source.sourceCitation}</div>
                  <div className="text-muted-foreground">
                    {source.caseId} › {source.section} (Passage {source.passageId})
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 mt-1">
                    {source.license}
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </AlertDescription>
    </Alert>
  );
}
