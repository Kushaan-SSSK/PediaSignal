import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { VitalSigns } from '../../../shared/types';

export interface CaseTickParams {
  caseType: string;
  stage: number;
  severity: 'mild' | 'moderate' | 'severe';
  ageBand: string;
  currentVitals: VitalSigns;
  userId: string;
  sessionId: string;
  onVitalsUpdate: (vitals: VitalSigns, alerts: string[]) => void;
  isActive: boolean;
  isPaused: boolean;
  hasModalOpen: boolean;
}

interface CaseTickResponse {
  updatedVitals: VitalSigns;
  alerts: string[];
  stage: number;
  simulationId?: string;
}

// Default cadence based on severity (in milliseconds)
// Updated to every second for real-time monitoring as per medical guidelines
const TICK_CADENCE = {
  mild: 1000,      // 1 second
  moderate: 1000,  // 1 second  
  severe: 1000     // 1 second
};

export function useCaseTick(params: CaseTickParams) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  
  // Mutation for case tick API call
  const tickMutation = useMutation({
    mutationFn: async (tickData: {
      caseType: string;
      stage: number;
      severity: string;
      ageBand: string;
      currentVitals: VitalSigns;
      timeElapsed: number;
      userId: string;
      sessionId: string;
    }) => {
      return apiRequest('/api/case-tick', 'POST', tickData);
    },
    onSuccess: async (response) => {
      // Parse the response JSON
      const data = await response.json() as CaseTickResponse;
      
      // Update vitals in the simulation state
      params.onVitalsUpdate(data.updatedVitals, data.alerts);
      
      // Update last tick time
      lastTickTimeRef.current = Date.now();
    },
    onError: (error) => {
      console.error('Case tick failed:', error);
      // Continue ticking despite errors to maintain vitals updates
    },
  });

  // Calculate elapsed time since last tick
  const calculateElapsedTime = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - lastTickTimeRef.current) / 1000); // Convert to seconds
    return Math.max(1, Math.min(elapsed, 10)); // Clamp between 1-10 seconds
  }, []);

  // Perform a tick
  const performTick = useCallback(() => {
    console.log('🎯 performTick called with conditions:', {
      isActive: params.isActive,
      isPaused: params.isPaused,
      hasModalOpen: params.hasModalOpen,
      isPending: tickMutation.isPending,
      caseType: params.caseType,
      sessionId: params.sessionId
    });

    if (!params.isActive || params.isPaused || params.hasModalOpen || tickMutation.isPending) {
      console.log('⏸️ Tick skipped due to conditions');
      return;
    }

    const timeElapsed = calculateElapsedTime();
    console.log(`🚀 Executing case tick with ${timeElapsed}s elapsed`);
    
    tickMutation.mutate({
      caseType: params.caseType,
      stage: params.stage,
      severity: params.severity,
      ageBand: params.ageBand,
      currentVitals: params.currentVitals,
      timeElapsed,
      userId: params.userId,
      sessionId: params.sessionId,
    });
  }, [
    params.isActive,
    params.isPaused, 
    params.hasModalOpen,
    params.caseType,
    params.stage,
    params.severity,
    params.ageBand,
    params.currentVitals,
    params.userId,
    params.sessionId,
    tickMutation,
    calculateElapsedTime,
  ]);

  // Start/stop the ticker based on conditions
  useEffect(() => {
    console.log('🔄 useCaseTick useEffect - Conditions check:', {
      isActive: params.isActive,
      isPaused: params.isPaused,
      hasModalOpen: params.hasModalOpen,
      severity: params.severity,
      caseType: params.caseType,
      sessionId: params.sessionId,
      userId: params.userId
    });

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval if conditions are met
    if (params.isActive && !params.isPaused && !params.hasModalOpen) {
      const cadence = TICK_CADENCE[params.severity];
      console.log(`✅ Starting case tick with ${cadence}ms cadence (${params.severity})`);
      
      // Reset last tick time when starting
      lastTickTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(performTick, cadence);
    } else {
      console.log('❌ Case tick not started due to conditions');
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    params.isActive,
    params.isPaused,
    params.hasModalOpen,
    params.severity,
    performTick,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isTickingActive: !!(intervalRef.current && params.isActive && !params.isPaused && !params.hasModalOpen),
    lastTickTime: lastTickTimeRef.current,
    isPending: tickMutation.isPending,
    error: tickMutation.error,
  };
}