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
  User,
  Droplets,
  Zap,
  Car,
  Baby,
  Shield,
  Sword
} from 'lucide-react';

// ALiEM cases - medically accurate pediatric emergency simulation cases
// Source: ALiEM EM ReSCu Peds Simulation eBook 03-29-21 (CC BY-NC-SA 4.0)
const aliEmCases = [
  {
    id: 'aliem_case_01_anaphylaxis',
    name: 'Anaphylaxis - 6-year-old',
    category: 'Anaphylaxis',
    difficulty: 'severe',
    description: 'Severe anaphylactic reaction requiring immediate epinephrine administration',
    presentingSymptoms: ['Respiratory distress', 'Hypotension', 'Urticaria', 'Angioedema'],
    clinicalHistory: 'A 6-year-old boy brought in by car with a parent presents with difficulty breathing, vomiting, rash, and facial swelling after eating at a restaurant. He has no previous allergic reactions.',
    estimatedTime: '5-10 minutes',
    stages: 2,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_02_cardiac_tamponade',
    name: 'Cardiac Tamponade - 15-year-old',
    category: 'Cardiac Tamponade',
    difficulty: 'critical',
    description: 'Cardiac tamponade requiring immediate pericardiocentesis',
    presentingSymptoms: ['Hypotension', 'Tachycardia', 'Dyspnea', 'Muffled heart sounds'],
    clinicalHistory: '15-year-old male with recent chest trauma, presenting with signs of cardiac tamponade requiring immediate intervention.',
    estimatedTime: '3-5 minutes',
    stages: 2,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_03_cah_adrenal_insufficiency',
    name: 'CAH/Adrenal Insufficiency - 8-month-old',
    category: 'CAH/Adrenal Insufficiency',
    difficulty: 'critical',
    description: 'Congenital adrenal hyperplasia with adrenal crisis requiring immediate steroids',
    presentingSymptoms: ['Hypotension', 'Hypoglycemia', 'Vomiting', 'Lethargy'],
    clinicalHistory: '8-month-old infant with known CAH presenting in adrenal crisis, requiring immediate intervention.',
    estimatedTime: '3-5 minutes',
    stages: 2,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_04_congenital_heart_lesion',
    name: 'Congenital Heart Lesion - Neonate',
    category: 'Congenital Heart Lesion',
    difficulty: 'critical',
    description: 'Critical congenital heart disease requiring PGE1 infusion',
    presentingSymptoms: ['Cyanosis', 'Tachypnea', 'Poor feeding', 'Lethargy'],
    clinicalHistory: 'Newborn with critical congenital heart disease requiring immediate prostaglandin therapy.',
    estimatedTime: '2-3 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_05_dka',
    name: 'Diabetic Ketoacidosis - 14-year-old',
    category: 'DKA',
    difficulty: 'severe',
    description: 'Severe DKA requiring fluid resuscitation and insulin therapy',
    presentingSymptoms: ['Polyuria', 'Polydipsia', 'Kussmaul breathing', 'Altered mental status'],
    clinicalHistory: '14-year-old with new-onset diabetes presenting in severe DKA requiring immediate intervention.',
    estimatedTime: '10-15 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_06_foreign_body_aspiration',
    name: 'Foreign Body Aspiration - 2-year-old',
    category: 'Foreign Body Aspiration',
    difficulty: 'severe',
    description: 'Foreign body aspiration requiring immediate intervention',
    presentingSymptoms: ['Sudden onset cough', 'Respiratory distress', 'Cyanosis', 'Stridor'],
    clinicalHistory: '2-year-old toddler with sudden onset respiratory distress after playing with small toys.',
    estimatedTime: '2-3 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_07_multisystem_trauma',
    name: 'Multisystem Trauma - 10-year-old',
    category: 'Multisystem Trauma',
    difficulty: 'critical',
    description: 'Severe multisystem trauma requiring immediate resuscitation',
    presentingSymptoms: ['Hypotension', 'Tachycardia', 'Altered mental status', 'Multiple injuries'],
    clinicalHistory: '10-year-old involved in high-speed motor vehicle collision with multiple injuries requiring immediate intervention.',
    estimatedTime: '5-10 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_08_myocarditis',
    name: 'Myocarditis - 16-year-old',
    category: 'Myocarditis',
    difficulty: 'severe',
    description: 'Acute myocarditis requiring cardiac monitoring and cardiology consult',
    presentingSymptoms: ['Chest pain', 'Dyspnea', 'Fatigue', 'Palpitations'],
    clinicalHistory: '16-year-old with recent viral illness presenting with signs of myocarditis.',
    estimatedTime: '8-12 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_09_neonatal_delivery',
    name: 'Neonatal Delivery - Newborn',
    category: 'Neonatal Delivery',
    difficulty: 'moderate',
    description: 'Neonatal resuscitation requiring immediate intervention',
    presentingSymptoms: ['Poor respiratory effort', 'Bradycardia', 'Cyanosis', 'Poor tone'],
    clinicalHistory: 'Newborn requiring immediate resuscitation and stabilization.',
    estimatedTime: '3-5 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_10_non_accidental_trauma',
    name: 'Non-Accidental Trauma - 6-month-old',
    category: 'Non-Accidental Trauma',
    difficulty: 'severe',
    description: 'Suspected non-accidental trauma requiring protection and documentation',
    presentingSymptoms: ['Unexplained injuries', 'Delayed presentation', 'Inconsistent history', 'Multiple injuries'],
    clinicalHistory: '6-month-old infant with unexplained injuries requiring immediate protection and documentation.',
    estimatedTime: '10-15 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_11_pea_vf',
    name: 'PEA/VF - 8-year-old',
    category: 'PEA/VF',
    difficulty: 'critical',
    description: 'Cardiac arrest requiring immediate ACLS intervention',
    presentingSymptoms: ['Unresponsive', 'No pulse', 'No breathing', 'Cardiac arrest'],
    clinicalHistory: '8-year-old in cardiac arrest requiring immediate ACLS intervention.',
    estimatedTime: '2-3 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_12_penetrating_trauma',
    name: 'Penetrating Trauma - 15-year-old',
    category: 'Penetrating Trauma',
    difficulty: 'critical',
    description: 'Penetrating trauma requiring immediate surgical intervention',
    presentingSymptoms: ['Penetrating injury', 'Hypotension', 'Tachycardia', 'External bleeding'],
    clinicalHistory: '15-year-old with penetrating trauma requiring immediate surgical intervention.',
    estimatedTime: '3-5 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_13_pneumonia_septic_shock',
    name: 'Pneumonia & Septic Shock - 9-month-old',
    category: 'Pneumonia & Septic Shock',
    difficulty: 'critical',
    description: 'Severe pneumonia with septic shock requiring immediate antibiotics and resuscitation',
    presentingSymptoms: ['Fever', 'Respiratory distress', 'Hypotension', 'Lethargy'],
    clinicalHistory: '9-month-old infant with severe pneumonia and septic shock requiring immediate intervention.',
    estimatedTime: '3-5 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_14_status_asthmaticus',
    name: 'Status Asthmaticus - 7-year-old',
    category: 'Status Asthmaticus',
    difficulty: 'severe',
    description: 'Status asthmaticus requiring aggressive bronchodilator therapy',
    presentingSymptoms: ['Severe dyspnea', 'Wheezing', 'Accessory muscle use', 'Hypoxemia'],
    clinicalHistory: '7-year-old with status asthmaticus unresponsive to home therapy requiring immediate intervention.',
    estimatedTime: '8-12 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_15_status_epilepticus',
    name: 'Status Epilepticus - 3-year-old',
    category: 'Status Epilepticus',
    difficulty: 'severe',
    description: 'Status epilepticus requiring immediate anticonvulsant therapy',
    presentingSymptoms: ['Prolonged seizure', 'Post-ictal state', 'Fever', 'Altered mental status'],
    clinicalHistory: '3-year-old with status epilepticus requiring immediate anticonvulsant therapy.',
    estimatedTime: '5-8 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  },
  {
    id: 'aliem_case_16_svt',
    name: 'Supraventricular Tachycardia - 6-month-old',
    category: 'SVT',
    difficulty: 'severe',
    description: 'SVT requiring immediate cardioversion or adenosine',
    presentingSymptoms: ['Tachycardia', 'Irritability', 'Poor feeding', 'Respiratory distress'],
    clinicalHistory: '6-month-old infant with SVT requiring immediate cardioversion or adenosine.',
    estimatedTime: '3-5 minutes',
    stages: 1,
    sourceVersion: 'aliem-rescu-peds-03-29-21',
    license: 'CC BY-NC-SA 4.0'
  }
];

export default function CaseSelection() {
  const [cases, setCases] = useState(aliEmCases);
  const [loading, setLoading] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Anaphylaxis': return 'bg-red-600 hover:bg-red-700';
      case 'Cardiac Tamponade': return 'bg-purple-600 hover:bg-purple-700';
      case 'CAH/Adrenal Insufficiency': return 'bg-orange-600 hover:bg-orange-700';
      case 'Congenital Heart Lesion': return 'bg-pink-600 hover:bg-pink-700';
      case 'DKA': return 'bg-yellow-600 hover:bg-yellow-700';
      case 'Foreign Body Aspiration': return 'bg-blue-600 hover:bg-blue-700';
      case 'Multisystem Trauma': return 'bg-indigo-600 hover:bg-indigo-700';
      case 'Myocarditis': return 'bg-red-700 hover:bg-red-800';
      case 'Neonatal Delivery': return 'bg-green-600 hover:bg-green-700';
      case 'Non-Accidental Trauma': return 'bg-gray-600 hover:bg-gray-700';
      case 'PEA/VF': return 'bg-red-800 hover:bg-red-900';
      case 'Penetrating Trauma': return 'bg-indigo-700 hover:bg-indigo-800';
      case 'Pneumonia & Septic Shock': return 'bg-blue-700 hover:bg-blue-800';
      case 'Status Asthmaticus': return 'bg-green-700 hover:bg-green-800';
      case 'Status Epilepticus': return 'bg-purple-700 hover:bg-purple-800';
      case 'SVT': return 'bg-pink-700 hover:bg-pink-800';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'severe': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Anaphylaxis': return <AlertTriangle className="w-5 h-5 text-red-200" />;
      case 'Cardiac Tamponade': return <Heart className="w-5 h-5 text-purple-200" />;
      case 'CAH/Adrenal Insufficiency': return <Droplets className="w-5 h-5 text-orange-200" />;
      case 'Congenital Heart Lesion': return <Heart className="w-5 h-5 text-pink-200" />;
      case 'DKA': return <Zap className="w-5 h-5 text-yellow-200" />;
      case 'Foreign Body Aspiration': return <Wind className="w-5 h-5 text-blue-200" />;
      case 'Multisystem Trauma': return <Car className="w-5 h-5 text-indigo-200" />;
      case 'Myocarditis': return <Heart className="w-5 h-5 text-red-200" />;
      case 'Neonatal Delivery': return <Baby className="w-5 h-5 text-green-200" />;
      case 'Non-Accidental Trauma': return <Shield className="w-5 h-5 text-gray-200" />;
      case 'PEA/VF': return <Activity className="w-5 h-5 text-red-200" />;
      case 'Penetrating Trauma': return <Sword className="w-5 h-5 text-indigo-200" />;
              case 'Pneumonia & Septic Shock': return <Activity className="w-5 h-5 text-blue-200" />;
      case 'Status Asthmaticus': return <Wind className="w-5 h-5 text-green-200" />;
      case 'Status Epilepticus': return <Brain className="w-5 h-5 text-purple-200" />;
      case 'SVT': return <Activity className="w-5 h-5 text-pink-200" />;
      default: return <Activity className="w-5 h-5 text-gray-200" />;
    }
  };

  const handleCaseSelect = (caseId: string) => {
    // Navigate to simulator with selected case
    window.location.href = `/simulator?case=${caseId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Case Selection</h1>
          <p className="text-lg text-gray-600">
            Choose from {cases.length} medically accurate pediatric emergency simulation cases
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Source:</strong> ALiEM EM ReSCu Peds Simulation eBook 03-29-21 (CC BY-NC-SA 4.0)
            </p>
          </div>
        </div>

        {/* Case Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(case_.category)}
                    <CardTitle className="text-lg">{case_.name}</CardTitle>
                  </div>
                  <Badge className={getDifficultyColor(case_.difficulty)}>
                    {case_.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {case_.estimatedTime}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {case_.stages} stage{case_.stages !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4">{case_.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Presenting Symptoms:</h4>
                  <div className="flex flex-wrap gap-2">
                    {case_.presentingSymptoms.map((symptom, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Clinical History:</h4>
                  <p className="text-sm text-gray-600">{case_.clinicalHistory}</p>
                </div>

                <Button 
                  onClick={() => handleCaseSelect(case_.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Start Simulation
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
