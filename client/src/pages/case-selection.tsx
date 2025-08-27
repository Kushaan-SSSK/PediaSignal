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

// ALiEM cases - fetched from server API
// Source: ALiEM EM ReSCu Peds Simulation eBook 03-29-21 (CC BY-NC-SA 4.0)

interface ALiEMCase {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  description: string;
  presentingSymptoms: string[];
  clinicalHistory: string;
  estimatedTime: string;
  stages: number;
  sourceVersion: string;
  license: string;
}

export default function CaseSelection() {
  const [cases, setCases] = useState<ALiEMCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        console.log('Fetching cases...');
        
        // First get all categories
        console.log('Making request to /api/simulation-categories...');
        const categoriesResponse = await fetch('/api/simulation-categories');
        console.log('Categories response status:', categoriesResponse.status);
        console.log('Categories response ok:', categoriesResponse.ok);
        
        if (!categoriesResponse.ok) {
          throw new Error(`Failed to fetch categories: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
        }
        
        const categories = await categoriesResponse.json();
        console.log('Categories received:', categories);
        console.log('Categories count:', categories.length);
        
        if (!categories || categories.length === 0) {
          console.warn('No categories received from API');
          setCases([]);
          return;
        }
        
        // Then get cases for each category
        const allCases = [];
        for (const category of categories) {
          console.log('Fetching cases for category:', category);
          const casesResponse = await fetch(`/api/simulation-cases/${category}`);
          console.log(`Cases response for ${category}:`, casesResponse.status, casesResponse.ok);
          
          if (casesResponse.ok) {
            const categoryCases = await casesResponse.json();
            console.log(`Cases for ${category}:`, categoryCases);
            console.log(`Cases count for ${category}:`, categoryCases.length);
            allCases.push(...categoryCases);
          } else {
            console.error(`Failed to fetch cases for ${category}:`, casesResponse.status, casesResponse.statusText);
          }
        }
        
        console.log('Total cases collected:', allCases.length);
        console.log('All cases:', allCases);
        setCases(allCases);
      } catch (error) {
        console.error('Error fetching cases:', error);
        console.error('Error details:', {
          message: (error as Error).message,
          stack: (error as Error).stack,
          name: (error as Error).name
        });
        // Fallback to empty array if API fails
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    console.log('useEffect running, calling fetchCases...');
    fetchCases();
  }, []);

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

  const mapDifficulty = (difficulty: string, caseId: string) => {
    // Specific case assignments for balanced distribution
    const advancedCases = ['aliem_case_01_anaphylaxis', 'aliem_case_05_dka', 'aliem_case_08_myocarditis', 'aliem_case_11_pea_vf'];
    const intermediateCases = ['aliem_case_02_cardiac_tamponade', 'aliem_case_03_cah_adrenal_insufficiency', 'aliem_case_04_congenital_heart_lesion', 'aliem_case_06_foreign_body_aspiration', 'aliem_case_07_multisystem_trauma', 'aliem_case_09_neonatal_delivery', 'aliem_case_10_non_accidental_trauma'];
    const beginnerCases = ['aliem_case_12_penetrating_trauma', 'aliem_case_13_pneumonia_septic_shock', 'aliem_case_14_status_asthmaticus', 'aliem_case_15_status_epilepticus', 'aliem_case_16_svt'];
    
    if (advancedCases.includes(caseId)) {
      return 'advanced';
    } else if (intermediateCases.includes(caseId)) {
      return 'intermediate';
    } else if (beginnerCases.includes(caseId)) {
      return 'beginner';
    }
    
    // Fallback to original difficulty mapping if caseId not found
    switch (difficulty?.toLowerCase()) {
      case 'low':
      case 'beginner':
        return 'beginner';
      case 'moderate':
      case 'intermediate':
        return 'intermediate';
      case 'severe':
      case 'critical':
      case 'advanced':
        return 'advanced';
      default:
        return 'intermediate';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'border-green-500 text-green-500';
      case 'intermediate': return 'border-yellow-500 text-yellow-500';
      case 'advanced': return 'border-red-500 text-red-500';
      default: return 'border-gray-500 text-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Anaphylaxis': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'Cardiac Tamponade': return <Heart className="w-5 h-5 text-purple-400" />;
      case 'CAH/Adrenal Insufficiency': return <Droplets className="w-5 h-5 text-orange-400" />;
      case 'Congenital Heart Lesion': return <Heart className="w-5 h-5 text-pink-400" />;
      case 'DKA': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Foreign Body Aspiration': return <Wind className="w-5 h-5 text-blue-400" />;
      case 'Multisystem Trauma': return <Car className="w-5 h-5 text-indigo-400" />;
      case 'Myocarditis': return <Heart className="w-5 h-5 text-red-400" />;
      case 'Neonatal Delivery': return <Baby className="w-5 h-5 text-green-400" />;
      case 'Non-Accidental Trauma': return <Shield className="w-5 h-5 text-slate-400" />;
      case 'PEA/VF': return <Activity className="w-5 h-5 text-red-400" />;
      case 'Penetrating Trauma': return <Sword className="w-5 h-5 text-indigo-400" />;
      case 'Pneumonia & Septic Shock': return <Activity className="w-5 h-5 text-blue-400" />;
      case 'Status Asthmaticus': return <Wind className="w-5 h-5 text-green-400" />;
      case 'Status Epilepticus': return <Brain className="w-5 h-5 text-purple-400" />;
      case 'SVT': return <Activity className="w-5 h-5 text-pink-400" />;
      default: return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleCaseSelect = (caseId: string) => {
    // Navigate to simulator with selected case
    window.location.href = `/simulator?caseId=${caseId}`;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-slate-300 hover:text-slate-100 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Case Selection</h1>
          <p className="text-lg text-slate-300">
            Choose from {cases.length} medically accurate pediatric emergency simulation cases
          </p>
          <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <p className="text-sm text-slate-300">
              <strong>Source:</strong> ALiEM EM ReSCu Peds Simulation eBook 03-29-21 (CC BY-NC-SA 4.0)
            </p>
          </div>
        </div>



        {/* Case Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading ALiEM cases...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((case_) => (
            <Card key={case_.id} className="bg-slate-800/50 border-slate-700 hover:shadow-xl hover:shadow-slate-900/50 transition-all duration-200 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(case_.category)}
                    <CardTitle className="text-lg text-white">{case_.name || 'Unknown Case'}</CardTitle>
                  </div>
                  <Badge className={`${getDifficultyColor(mapDifficulty(case_.difficulty, case_.id))} border-2 bg-transparent min-w-[100px] text-center`}>
                    {mapDifficulty(case_.difficulty, case_.id)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {case_.estimatedTime || 'Unknown duration'}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {case_.stages || 0} stage{(case_.stages || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="flex-1">
                  <p className="text-slate-300 mb-4">{case_.description || 'No description available'}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-slate-200 mb-2">Presenting Symptoms:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(case_.presentingSymptoms || []).map((symptom, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-slate-700 text-slate-300 border-slate-600">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleCaseSelect(case_.id)}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white border-slate-500 mt-auto"
                >
                  Start Simulation
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
