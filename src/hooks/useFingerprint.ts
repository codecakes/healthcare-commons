import { useState, useEffect } from 'react';

interface SessionData {
  visitorId: string;
  firstVisit: string;
  visitCount: number;
  demographicsCompleted: boolean;
  language: string;
  lastLocation?: { latitude: number; longitude: number };
}

export const useFingerprint = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // Generate a simple fingerprint-like ID using browser characteristics
      const visitorId = await generateVisitorId();
      
      // Get existing session data or create new
      const existingData = localStorage.getItem('healthcareSession');
      let data: SessionData;
      
      if (existingData) {
        data = JSON.parse(existingData);
        data.visitCount++;
      } else {
        data = {
          visitorId,
          firstVisit: new Date().toISOString(),
          visitCount: 1,
          demographicsCompleted: false,
          language: 'en'
        };
      }
      
      localStorage.setItem('healthcareSession', JSON.stringify(data));
      setSessionData(data);
    } catch (error) {
      console.error('Error initializing session:', error);
      // Fallback session
      const fallbackData: SessionData = {
        visitorId: 'anon-' + Math.random().toString(36).substring(2, 15),
        firstVisit: new Date().toISOString(),
        visitCount: 1,
        demographicsCompleted: false,
        language: 'en'
      };
      setSessionData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const generateVisitorId = async (): Promise<string> => {
    // Simple browser fingerprinting without external libraries
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('Healthcare Commons', 10, 10);
    const canvasFingerprint = canvas.toDataURL();
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvasFingerprint.slice(-50) // Last 50 chars of canvas fingerprint
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return 'hc-' + Math.abs(hash).toString(36);
  };

  const updateSessionData = (updates: Partial<SessionData>) => {
    if (!sessionData) return;
    
    const updatedData = { ...sessionData, ...updates };
    localStorage.setItem('healthcareSession', JSON.stringify(updatedData));
    setSessionData(updatedData);
  };

  const storeDemographicData = (data: any) => {
    // Store only non-PHI demographic data
    const safeData = {
      ageRange: data.ageRange,
      gender: data.gender,
      pincode: data.pincode,
      preferredLanguages: data.preferredLanguages,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('demographicData', JSON.stringify(safeData));
    updateSessionData({ demographicsCompleted: true });
  };

  const getDemographicData = () => {
    const data = localStorage.getItem('demographicData');
    return data ? JSON.parse(data) : null;
  };

  return {
    sessionData,
    loading,
    updateSessionData,
    storeDemographicData,
    getDemographicData
  };
};