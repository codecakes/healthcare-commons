import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFingerprint } from '@/hooks/useFingerprint';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAppContext } from '@/contexts/AppContext';
import AppHeader from './AppHeader';
import PatientWelcome from './PatientWelcome';
import DemographicsForm from './DemographicsForm';
import ProviderSearch from './ProviderSearch';
import ProviderVerification from './ProviderVerification';
import ProviderDashboard from './ProviderDashboard';

const MainApp: React.FC = () => {
  const {
    userRole, 
    appState, 
    currentLanguage, 
    isLoggedIn,
    setUserRole,
    setAppState,
    setCurrentLanguage,
    login
  } = useAppContext();
  const { t } = useTranslation();
  
  const { sessionData, loading, storeDemographicData, getDemographicData } = useFingerprint();
  const { location, getCurrentLocation } = useGeolocation();

  useEffect(() => {
    if (!loading && sessionData && !isLoggedIn) {
      setCurrentLanguage(sessionData.language);
      
      // Check if user has completed demographics (patient flow)
      if (sessionData.demographicsCompleted && !userRole) {
        login('patient');
        setAppState('search');
      }
    }
  }, [loading, sessionData, isLoggedIn, userRole]);

  const handleGetStarted = (type: 'patient' | 'provider') => {
    login(type);
    setUserRole(type);
    
    if (type === 'provider') {
      setAppState('provider-verification');
    } else {
      setAppState('demographics');
      getCurrentLocation();
    }
  };

  const handleDemographicsComplete = (data: any) => {
    storeDemographicData(data);
    setAppState('search');
  };

  const handleProviderVerificationComplete = (data: any) => {
    localStorage.setItem('providerData', JSON.stringify(data));
    setAppState('provider-dashboard');
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('initializing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
      
      {appState === 'welcome' && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
                {t('appName')}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                {t('tagline')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => handleGetStarted('patient')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-lg font-medium transition-colors"
                >
                  {t('patientButton')}
                </button>
                <button 
                  onClick={() => handleGetStarted('provider')}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg rounded-lg font-medium transition-colors"
                >
                  {t('providerButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {appState === 'demographics' && (
        <DemographicsForm onComplete={handleDemographicsComplete} />
      )}
      
      {appState === 'provider-verification' && (
        <ProviderVerification onVerificationComplete={handleProviderVerificationComplete} />
      )}
      
      {appState === 'search' && userRole === 'patient' && (
        <ProviderSearch 
          userLocation={location}
          demographicData={getDemographicData()}
        />
      )}
      
      {appState === 'provider-dashboard' && userRole === 'provider' && (
        <ProviderDashboard />
      )}
    </div>
  );
};

export default MainApp;
