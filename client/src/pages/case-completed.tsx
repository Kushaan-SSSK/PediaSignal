import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import { CheckCircle, ArrowLeft, Trophy } from 'lucide-react';
import { LicenseBanner } from '@/components/LicenseBanner';

interface CaseCompletedProps {
  caseId?: string;
  caseName?: string;
  stage3Interventions?: string[];
}

export default function CaseCompleted({ 
  caseId = 'aliem_case_01_anaphylaxis', 
  caseName = 'Anaphylaxis - 6-year-old',
  stage3Interventions = []
}: CaseCompletedProps) {
  const [, setLocation] = useLocation();
  
  // Read from URL parameters if not provided as props
  const [actualCaseId, setActualCaseId] = useState(caseId);
  const [actualCaseName, setActualCaseName] = useState(caseName);
  const [actualStage3Interventions, setActualStage3Interventions] = useState(stage3Interventions);

  useEffect(() => {
    // Read URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlCaseId = urlParams.get('caseId');
    const urlCaseName = urlParams.get('caseName');
    const urlStage3Interventions = urlParams.get('stage3Interventions');
    
    if (urlCaseId) setActualCaseId(urlCaseId);
    if (urlCaseName) setActualCaseName(decodeURIComponent(urlCaseName));
    if (urlStage3Interventions) {
      try {
        const parsedInterventions = JSON.parse(decodeURIComponent(urlStage3Interventions));
        setActualStage3Interventions(parsedInterventions);
      } catch (error) {
        console.error('Error parsing stage 3 interventions from URL:', error);
      }
    }
  }, [caseId, caseName, stage3Interventions]);

  const handleRestartCase = () => {
    setLocation(`/simulator?caseId=${encodeURIComponent(actualCaseId)}`);
  };

  const handleBackToCases = () => {
    setLocation('/case-selection');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={handleBackToCases}
            className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cases
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Case Completed</h1>
            <p className="text-slate-300">All required interventions have been applied</p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Success Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-600 rounded-full p-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">Case Completed Successfully</CardTitle>
              <p className="text-slate-300 mt-2">
                You have successfully completed all required interventions
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-lg text-white mb-4">
                  <strong>{actualCaseName}</strong>
                </p>
                <p className="text-slate-300">
                  All critical interventions have been applied correctly, demonstrating 
                  proper clinical decision-making and patient care.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Learning Summary */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-xl text-white">Learning Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">Clinical Decision Making</h4>
                  <p className="text-slate-300">
                    You demonstrated excellent clinical judgment by completing all required 
                    interventions in the appropriate sequence and timing.
                  </p>
                </div>
                
                <Separator className="bg-slate-600" />
                
                <div>
                  <h4 className="text-white font-semibold mb-2">Evidence-Based Practice</h4>
                  <p className="text-slate-300">
                    Your interventions were consistent with current best practices and 
                    evidence-based guidelines for pediatric emergency care.
                  </p>
                </div>
                
                <Separator className="bg-slate-600" />
                
                <div>
                  <h4 className="text-white font-semibold mb-2">Next Steps</h4>
                  <p className="text-slate-300">
                    Continue practicing with other cases to further develop your clinical 
                    skills and decision-making abilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-6">
            <Button 
              onClick={handleRestartCase}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Restart Case
            </Button>
            
            <Button 
              onClick={handleBackToCases}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-3"
            >
              Try Another Case
            </Button>
          </div>
        </div>

                       {/* License Banner */}
               <div className="mt-12">
                 <LicenseBanner 
                   license="CC BY-NC-SA 4.0"
                   sourceVersion="v1.0"
                   attribution="ALIEM"
                   variant="footer"
                 />
               </div>
      </div>
    </div>
  );
}
