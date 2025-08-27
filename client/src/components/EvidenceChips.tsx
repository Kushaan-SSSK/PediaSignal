import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BookOpen, ExternalLink, Info } from 'lucide-react';

export interface EvidenceRef {
  caseId: string;
  section: string;
  passageId: number;
  sourceCitation: string;
  license: string;
}

interface EvidenceChipsProps {
  evidenceSources: EvidenceRef[];
  className?: string;
}

export function EvidenceChips({ evidenceSources, className = '' }: EvidenceChipsProps) {
  if (!evidenceSources || evidenceSources.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 w-full">
          <BookOpen className="h-4 w-4" />
          <span>Evidence Sources ({evidenceSources.length})</span>
        </div>
        
        {evidenceSources.map((evidence, index) => (
          <Tooltip key={`${evidence.caseId}-${evidence.passageId}-${index}`}>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="cursor-help hover:bg-secondary/80 transition-colors"
              >
                <Info className="h-3 w-3 mr-1" />
                {evidence.caseId} › {evidence.section}
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm p-3">
              <div className="space-y-2">
                <div className="font-medium text-sm">
                  {evidence.sourceCitation}
                </div>
                <div className="text-xs text-muted-foreground">
                  <strong>Case:</strong> {evidence.caseId}
                  <br />
                  <strong>Section:</strong> {evidence.section}
                  <br />
                  <strong>Passage ID:</strong> {evidence.passageId}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {evidence.license}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
