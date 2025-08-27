import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Info, AlertTriangle } from 'lucide-react';

interface LicenseBannerProps {
  license: string;
  sourceVersion: string;
  attribution: string;
  variant?: 'default' | 'compact' | 'footer';
  className?: string;
}

export function LicenseBanner({ 
  license, 
  sourceVersion, 
  attribution, 
  variant = 'default',
  className = '' 
}: LicenseBannerProps) {
  const isNonCommercial = license.includes('NC');
  const isShareAlike = license.includes('SA');

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <Info className="h-3 w-3" />
        <span>{attribution}</span>
        <Badge variant="outline" className="text-xs">
          {license}
        </Badge>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`text-center py-4 border-t bg-muted/30 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
          <Info className="h-4 w-4" />
          <span>Portions © {attribution}</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {license}
          </Badge>
          <span>•</span>
          <span>Version: {sourceVersion}</span>
          <span>•</span>
          <span>Adapted by PediaSignal</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Content Attribution
            </h4>
            <Badge variant="secondary" className="text-xs">
              {license}
            </Badge>
          </div>
          
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            This simulation uses content from <strong>{attribution}</strong>
          </p>
          
          <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
            <span>Version: {sourceVersion}</span>
            <span>•</span>
            <span>Adapted by PediaSignal</span>
          </div>
          
          {isNonCommercial && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Non-Commercial Use Only:</strong> This content is licensed for educational purposes only.
                Commercial use is not permitted under the {license} license.
              </span>
            </div>
          )}
          
          {isShareAlike && (
            <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
              <strong>Share-Alike:</strong> Any adaptations must be shared under the same license terms.
            </div>
          )}
          
          <div className="mt-3">
            <a
              href="/about/sources"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View source details and licensing information
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
