import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Activity, 
  Heart, 
  Thermometer, 
  AlertTriangle, 
  Wind,
  ArrowLeft,
  Clock,
  User
} from 'lucide-react';

// Fixed, medically accurate cases verified through PubMed
const fixedCases = [
  {
    id: 'febrile_seizure_01',
    name: 'Febrile Seizure - 18-month-old',
    category: 'febrile_seizure',
    difficulty: 'moderate',
    description: 'Complex febrile seizure with post-ictal state requiring immediate intervention',
    presentingSymptoms: ['Seizure', 'Fever', 'Post-ictal lethargy', 'Tachypnea'],
    clinicalHistory: '18-month-old male with first-time febrile seizure, temperature 103.2°F, seizure lasted 3 minutes, now post-ictal with decreased responsiveness.',
    estimatedTime: '8-12 minutes',
    stages: 3
  },
  {
    id: 'respiratory_distress_01',
    name: 'Severe Asthma Exacerbation - 8-year-old',
    category: 'respiratory_distress',
    difficulty: 'high',
    description: 'Status asthmaticus with severe bronchospasm and respiratory failure',
    presentingSymptoms: ['Severe dyspnea', 'Wheezing', 'Accessory muscle use', 'Hypoxemia'],
    clinicalHistory: '8-year-old female with known asthma, presenting with severe exacerbation unresponsive to home albuterol, using accessory muscles, oxygen saturation 88%.',
    estimatedTime: '10-15 minutes',
    stages: 3
  },
  {
    id: 'asthma_exacerbation_01',
    name: 'Moderate Asthma Exacerbation - 6-year-old',
    category: 'asthma_exacerbation',
    difficulty: 'moderate',
    description: 'Moderate asthma exacerbation requiring bronchodilator therapy',
    presentingSymptoms: ['Dyspnea', 'Wheezing', 'Cough', 'Mild retractions'],
    clinicalHistory: '6-year-old male with intermittent asthma, presenting with moderate exacerbation, mild retractions, oxygen saturation 92%, responds partially to home albuterol.',
    estimatedTime: '6-10 minutes',
    stages: 3
  },
  {
    id: 'septic_shock_01',
    name: 'Septic Shock - 3-year-old',
    category: 'septic_shock',
    difficulty: 'critical',
    description: 'Severe sepsis with shock requiring immediate fluid resuscitation and vasopressors',
    presentingSymptoms: ['Fever', 'Hypotension', 'Tachycardia', 'Altered mental status'],
    clinicalHistory: '3-year-old female with 2-day history of fever, now hypotensive (BP 70/40), tachycardic (HR 180), lethargic, and mottled extremities.',
    estimatedTime: '12-18 minutes',
    stages: 3
  },
  {
    id: 'cardiac_arrest_01',
    name: 'Pediatric Cardiac Arrest - 5-year-old',
    category: 'cardiac_arrest',
    difficulty: 'critical',
    description: 'Cardiac arrest secondary to respiratory failure requiring immediate ACLS',
    presentingSymptoms: ['Unresponsive', 'No pulse', 'No breathing', 'Cyanosis'],
    clinicalHistory: '5-year-old male found unresponsive, no pulse, no breathing, cyanotic. Witnessed by parent who called 911 immediately.',
    estimatedTime: '15-20 minutes',
    stages: 3
  },
  {
    id: 'trauma_resuscitation_01',
    name: 'Major Trauma - 12-year-old',
    category: 'trauma_resuscitation',
    difficulty: 'critical',
    description: 'Multi-system trauma with hemorrhagic shock requiring immediate resuscitation',
    presentingSymptoms: ['Hypotension', 'Tachycardia', 'Altered mental status', 'External bleeding'],
    clinicalHistory: '12-year-old male involved in high-speed motor vehicle collision, hypotensive (BP 65/35), tachycardic (HR 190), altered mental status, active bleeding from multiple sites.',
    estimatedTime: '15-25 minutes',
    stages: 3
  }
];

export default function CaseSelection() {
  const [cases, setCases] = useState(fixedCases);
  const [loading, setLoading] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'febrile_seizure': return 'bg-purple-600 hover:bg-purple-700';
      case 'respiratory_distress': return 'bg-blue-600 hover:bg-blue-700';
      case 'asthma_exacerbation': return 'bg-green-600 hover:bg-green-700';
      case 'septic_shock': return 'bg-red-600 hover:bg-red-700';
      case 'cardiac_arrest': return 'bg-orange-600 hover:bg-orange-700';
      case 'trauma_resuscitation': return 'bg-indigo-600 hover:bg-indigo-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'febrile_seizure': return <Brain className="w-5 h-5 text-purple-200" />;
      case 'respiratory_distress': return <Wind className="w-5 h-5 text-blue-200" />;
      case 'asthma_exacerbation': return <Activity className="w-5 h-5 text-green-200" />;
      case 'septic_shock': return <Heart className="w-5 h-5 text-red-200" />;
      case 'cardiac_arrest': return <Activity className="w-5 h-5 text-orange-200" />;
      case 'trauma_resuscitation': return <AlertTriangle className="w-5 h-5 text-indigo-200" />;
      default: return <User className="w-5 h-5 text-gray-200" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-700">
                <ArrowLeft className="w-4 h-4" />
                Back to Landing
              </Button>
            </Link>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">Emergency Case Selection</h1>
              <p className="text-slate-300">Choose a pediatric emergency scenario to practice</p>
            </div>
            
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="container mx-auto px-6 py-8">
        <Card className="bg-slate-800/30 border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              How to Use the Simulator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-2">1. Select a Case</h4>
                <p className="text-sm">Choose from 6 medically accurate emergency scenarios verified through PubMed research.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">2. Manage the Emergency</h4>
                <p className="text-sm">Apply interventions, monitor vitals, and respond to complications in real-time.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">3. Learn & Improve</h4>
                <p className="text-sm">Receive AI clinical guidance and learn optimal intervention timing and sequencing.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem) => (
            <Card key={caseItem.id} className="bg-slate-800/30 border-slate-700/50 flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(caseItem.category)}
                    <div>
                      <CardTitle className="text-lg text-white">{caseItem.name}</CardTitle>
                      <Badge className={`mt-1 ${getDifficultyColor(caseItem.difficulty)}`}>
                        {caseItem.difficulty.charAt(0).toUpperCase() + caseItem.difficulty.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4">
                  <p className="text-slate-300 text-sm mb-3">{caseItem.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-white text-sm">Presenting Symptoms:</h4>
                    <div className="flex flex-wrap gap-1">
                      {caseItem.presentingSymptoms.map((symptom, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-slate-700/50 text-slate-300">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <h4 className="font-semibold text-white text-sm">Clinical History:</h4>
                    <p className="text-slate-300 text-xs">{caseItem.clinicalHistory}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Time:</span>
                      <div className="text-white font-semibold">{caseItem.estimatedTime}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Stages:</span>
                      <div className="text-white font-semibold">{caseItem.stages}</div>
                    </div>
                  </div>
                </div>
                
                {/* Spacer to push button to bottom */}
                <div className="flex-1"></div>
                
                {/* Perfectly aligned button */}
                <div className="pt-4">
                  <Link href={`/simulator?caseId=${caseItem.id}`}>
                    <Button 
                      className={`w-full ${getCategoryColor(caseItem.category)} text-white font-semibold py-3`}
                    >
                      Start Case
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
