import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  ExternalLink, 
  Info, 
  AlertTriangle, 
  CheckCircle,
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Shield,
  Target
} from 'lucide-react';
import { Link } from 'wouter';
import { LicenseBanner } from '@/components/LicenseBanner';

interface SourceCase {
  id: string;
  name: string;
  category: string;
  version: string;
  lastUpdated: string;
  source: string;
  license: string;
  description: string;
  learningObjectives: string[];
  references: string[];
}

const sourceCases: SourceCase[] = [
  {
    id: 'aliem-case-01',
    name: 'Status Epilepticus',
    category: 'Neurology',
    version: 'aliem-rescu-peds-2021-03-29',
    lastUpdated: '2021-03-29',
    source: 'ALiEM EM ReSCu Peds',
    license: 'CC BY-NC-SA 4.0',
    description: 'Pediatric status epilepticus case focusing on rapid assessment, benzodiazepine administration, and airway management.',
    learningObjectives: [
      'Recognize status epilepticus in pediatric patients',
      'Administer appropriate benzodiazepine dosing',
      'Manage airway and respiratory complications',
      'Coordinate team response for critical care'
    ],
    references: [
      'PALS Guidelines 2020',
      'AAP Status Epilepticus Protocol',
      'Pediatric Emergency Medicine Evidence-Based Guidelines'
    ]
  },
  {
    id: 'aliem-case-02',
    name: 'Pediatric Respiratory Distress',
    category: 'Respiratory',
    version: 'aliem-rescu-peds-2021-03-29',
    lastUpdated: '2021-03-29',
    source: 'ALiEM EM ReSCu Peds',
    license: 'CC BY-NC-SA 4.0',
    description: 'Case focusing on assessment and management of pediatric respiratory distress, including asthma exacerbation and croup.',
    learningObjectives: [
      'Assess respiratory distress severity',
      'Administer appropriate bronchodilators',
      'Recognize signs of respiratory failure',
      'Implement escalation protocols'
    ],
    references: [
      'PALS Respiratory Guidelines',
      'GINA Asthma Guidelines',
      'Pediatric Respiratory Assessment Tools'
    ]
  }
];

export default function AboutSources() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">About Sources & Licensing</h1>
              <p className="text-muted-foreground">
                Information about the medical content used in PediaSignal simulations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* License Banner */}
          <LicenseBanner
            license="CC BY-NC-SA 4.0"
            sourceVersion="aliem-rescu-peds-2021-03-29"
            attribution="ALiEM EM ReSCu Peds - Pediatric Emergency Medicine Cases"
            variant="default"
          />

          {/* Content Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Content Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sourceCases.map((sourceCase, index) => (
                <div key={sourceCase.id}>
                  {index > 0 && <Separator className="my-6" />}
                  
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{sourceCase.name}</h3>
                        <p className="text-muted-foreground mb-3">{sourceCase.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {sourceCase.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {sourceCase.lastUpdated}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {sourceCase.source}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline">{sourceCase.license}</Badge>
                          <Badge variant="secondary">{sourceCase.version}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Learning Objectives
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {sourceCase.learningObjectives.map((objective, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          References
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {sourceCase.references.map((reference, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                              <span>{reference}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* License Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                License Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">📖</div>
                  <h4 className="font-medium mb-2">Attribution (BY)</h4>
                  <p className="text-sm text-muted-foreground">
                    You must give appropriate credit to ALiEM EM ReSCu Peds
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">🚫</div>
                  <h4 className="font-medium mb-2">Non-Commercial (NC)</h4>
                  <p className="text-sm text-muted-foreground">
                    You may not use this content for commercial purposes
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">🔄</div>
                  <h4 className="font-medium mb-2">Share-Alike (SA)</h4>
                  <p className="text-sm text-muted-foreground">
                    Any adaptations must be shared under the same license
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Important Notice
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      This content is licensed for educational purposes only. Commercial use, including 
                      paid courses, training programs, or any revenue-generating activities, is not 
                      permitted under the CC BY-NC-SA 4.0 license. If you need commercial licensing, 
                      please contact ALiEM directly.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Contact & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                For questions about content licensing, corrections, or to report issues, please contact:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">ALiEM EM ReSCu Peds</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Original content creators and copyright holders
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Visit ALiEM
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">PediaSignal Support</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Technical support and platform questions
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
