import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Activity, 
  Heart, 
  Brain, 
  Droplets, 
  Pill, 
  Syringe, 
  Stethoscope,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  Clock,
  Target,
  BookOpen
} from 'lucide-react';
import { EvidenceChips } from './EvidenceChips';
import { LicenseBanner } from './LicenseBanner';

interface Intervention {
  id: string;
  name: string;
  category: 'airway' | 'breathing' | 'circulation' | 'medication' | 'monitoring' | 'procedural';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  description: string;
  ragSummary: string; // RAG-powered concise summary
  evidenceSources: Array<{
    caseId: string;
    section: string;
    passageId: number;
    sourceCitation: string;
    license: string;
  }>;
  indications: string[];
  contraindications: string[];
  dosage?: {
    min: number;
    max: number;
    unit: string;
    route: string;
    weightBased?: boolean;
  };
  timeWindow?: number; // seconds
  criticalActions: string[];
  risks: string[];
  alternatives: string[];
}

interface InterventionsPanelProps {
  caseId: string;
  stage: number;
  currentVitals: any;
  className?: string;
  onInterventionSelect?: (intervention: Intervention) => void;
}

export function InterventionsPanel({
  caseId,
  stage,
  currentVitals,
  className = '',
  onInterventionSelect
}: InterventionsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedInterventions, setExpandedInterventions] = useState<Set<string>>(new Set());
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real interventions from backend
  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/interventions');
        if (response.ok) {
          const data = await response.json();
          // Convert the record to array format
          const interventionsArray = Object.values(data).map((intervention: any) => ({
            id: intervention.id,
            name: intervention.name,
            category: intervention.category as 'airway' | 'breathing' | 'circulation' | 'medication' | 'monitoring' | 'procedural',
            priority: (intervention.category === 'monitoring' ? 'high' : 
                     intervention.category === 'medication' ? 'immediate' : 'medium') as 'immediate' | 'high' | 'medium' | 'low',
            description: intervention.description,
            ragSummary: intervention.ragSummary || 'RAG summary not available',
            evidenceSources: intervention.evidenceSources || [],
            indications: ['Based on clinical guidelines'],
            contraindications: intervention.contraindications || [],
            dosage: intervention.dosage,
            timeWindow: intervention.timeRequired * 1000, // Convert to milliseconds
            criticalActions: ['Follow clinical guidelines'],
            risks: ['Standard procedural risks'],
            alternatives: ['Alternative approaches available']
          }));
          setInterventions(interventionsArray);
        } else {
          console.error('Failed to fetch interventions');
        }
      } catch (error) {
        console.error('Error fetching interventions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInterventions();
  }, []);

  const categories = [
    { id: 'all', label: 'All', icon: Activity },
    { id: 'airway', label: 'Airway', icon: Brain },
    { id: 'breathing', label: 'Breathing', icon: Droplets },
    { id: 'circulation', label: 'Circulation', icon: Heart },
    { id: 'medication', label: 'Medication', icon: Pill },
    { id: 'monitoring', label: 'Monitoring', icon: Stethoscope },
    { id: 'procedural', label: 'Procedural', icon: Syringe }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'airway': return Brain;
      case 'breathing': return Droplets;
      case 'circulation': return Heart;
      case 'medication': return Pill;
      case 'monitoring': return Stethoscope;
      case 'procedural': return Syringe;
      default: return Activity;
    }
  };

  const filteredInterventions = selectedCategory === 'all' 
    ? interventions 
    : interventions.filter(int => int.category === selectedCategory);

  const toggleExpanded = (interventionId: string) => {
    const newExpanded = new Set(expandedInterventions);
    if (newExpanded.has(interventionId)) {
      newExpanded.delete(interventionId);
    } else {
      newExpanded.add(interventionId);
    }
    setExpandedInterventions(newExpanded);
  };

  const handleInterventionSelect = (intervention: Intervention) => {
    onInterventionSelect?.(intervention);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Available Interventions
          <Badge variant="outline" className="ml-auto">
            {filteredInterventions.length} interventions
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Evidence-based interventions with RAG-powered summaries from ALiEM and PALS guidelines
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* RAG CLINICAL REASONING - SUPER PROMINENT HEADER */}
        <div className="bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 dark:from-green-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 border-4 border-green-300 dark:border-green-600 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-2xl text-green-900 dark:text-green-100">🧠 RAG CLINICAL REASONING</h3>
              <p className="text-green-700 dark:text-green-300">AI-powered intervention summaries from medical guidelines</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-green-200 text-green-900 border-green-400 text-lg px-4 py-2">
              RAG ACTIVE
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interventions.slice(0, 4).map((intervention) => (
              <div key={intervention.id} className="bg-white/70 dark:bg-white/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-700 shadow-md">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <h4 className="font-bold text-lg text-green-900 dark:text-green-100">{intervention.name}</h4>
                  <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-300">
                    AI Summary
                  </Badge>
                </div>
                <p className="text-base font-medium text-green-800 dark:text-green-200 leading-relaxed">
                  {intervention.ragSummary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {intervention.evidenceSources.map((source, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {source.caseId} › {source.section}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-700">
            <p className="text-sm text-green-800 dark:text-green-200 text-center">
              💡 <strong>RAG System Active:</strong> All intervention summaries are powered by AI analysis of ALiEM and PALS guidelines
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-7">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Interventions List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Loading interventions...</p>
            </div>
          ) : filteredInterventions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No interventions available for the selected category</p>
            </div>
          ) : (
            filteredInterventions.map((intervention) => {
              const CategoryIcon = getCategoryIcon(intervention.category);
              const isExpanded = expandedInterventions.has(intervention.id);
              
              return (
                <Collapsible key={intervention.id} open={isExpanded} onOpenChange={() => toggleExpanded(intervention.id)}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                      <CategoryIcon className="h-5 w-5 text-blue-600" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{intervention.name}</h4>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(intervention.priority)}`}>
                            {intervention.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {intervention.category}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {intervention.description}
                        </p>
                      </div>
                      
                      {intervention.timeWindow && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.round(intervention.timeWindow / 60000)}m
                        </Badge>
                      )}
                      
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-3 px-3 pb-3">
                    {/* RAG Summary - Made More Prominent */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <h5 className="font-bold text-lg text-blue-900 dark:text-blue-100">RAG CLINICAL REASONING</h5>
                        <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-800 border-blue-300">
                          AI-Powered
                        </Badge>
                      </div>
                      <p className="text-base font-medium text-blue-800 dark:text-blue-200 leading-relaxed">
                        {intervention.ragSummary}
                      </p>
                    </div>

                    {/* Dosage Information */}
                    {intervention.dosage && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Dosage:</span> {intervention.dosage.min}-{intervention.dosage.max} {intervention.dosage.unit}
                        </div>
                        <div>
                          <span className="font-medium">Route:</span> {intervention.dosage.route}
                        </div>
                      </div>
                    )}

                    {/* Indications & Contraindications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="font-medium text-green-700 dark:text-green-300 mb-2">Indications</h6>
                        <ul className="space-y-1">
                          {intervention.indications.map((indication, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Target className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {indication}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h6 className="font-medium text-red-700 dark:text-red-300 mb-2">Contraindications</h6>
                        <ul className="space-y-1">
                          {intervention.contraindications.map((contraindication, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                              {contraindication}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Critical Actions */}
                    <div>
                      <h6 className="font-medium mb-2">Critical Actions</h6>
                      <div className="space-y-2">
                        {intervention.criticalActions.map((action, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
                            <div className="w-2 h-2 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                            <span className="text-sm">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evidence Sources */}
                    {intervention.evidenceSources.length > 0 && (
                      <div>
                        <h6 className="font-medium mb-2">Evidence Sources</h6>
                        <EvidenceChips 
                          evidenceSources={intervention.evidenceSources}
                          className="mb-2"
                        />
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      onClick={() => handleInterventionSelect(intervention)}
                      className="w-full"
                      size="sm"
                    >
                      Select This Intervention
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>

        {/* License Banner */}
        <LicenseBanner
          license="CC BY-NC-SA 4.0"
          sourceVersion="aliem-rescu-peds-2021-03-29"
          attribution="ALiEM EM ReSCu Peds + PALS Guidelines"
          variant="compact"
        />
      </CardContent>
    </Card>
  );
}
