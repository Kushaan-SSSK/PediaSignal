import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ScoreCalculator() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to the new Case Completed page
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId') || 'aliem_case_01_anaphylaxis';
    const caseName = urlParams.get('caseName') || 'Anaphylaxis - 6-year-old';
    const score = urlParams.get('score');
    
    // If there's a score parameter, redirect to Case Completed page
    if (score) {
      setLocation(`/case-completed?caseId=${encodeURIComponent(caseId)}&caseName=${encodeURIComponent(caseName)}`);
    } else {
      // Fallback to case selection
      setLocation('/case-selection');
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
