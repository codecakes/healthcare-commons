import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Star, Calendar, AlertCircle, Stethoscope } from 'lucide-react';
import AppointmentBooking from './AppointmentBooking';
import AppointmentList from './AppointmentList';
import { SEARCH_PROVIDERS } from '@/lib/graphql';
import { useDiagnosis, commonSymptoms, getSpecialtyForSymptom } from '@/lib/diagnosisService';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  location: string;
  pincode: string;
  distance: string;
  rating: number;
  availableSlots: number;
  nextAvailable: string;
  languages: string[];
}

interface ProviderSearchProps {
  userLocation?: { latitude: number; longitude: number };
  demographicData: any;
}

const ProviderSearch: React.FC<ProviderSearchProps> = ({ userLocation, demographicData }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState(demographicData?.pincode || '');
  const [showBooking, setShowBooking] = useState<Provider | null>(null);
  const [showAppointments, setShowAppointments] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showDiagnosisPanel, setShowDiagnosisPanel] = useState(false);

  // GraphQL query for providers search
  const { loading, error, data, refetch } = useQuery(SEARCH_PROVIDERS, {
    variables: { 
      name: searchQuery || undefined,
      pincode: locationQuery || undefined,
      // If we have symptoms and specialties, use them to filter
      specialty: selectedSymptoms.length > 0 ? 
        getSpecialtyForSymptom(selectedSymptoms[0])[0] : undefined
    },
    fetchPolicy: 'network-only',
  });

  // Get diagnosis recommendations based on selected symptoms
  const { diagnosis, loading: diagnosisLoading } = useDiagnosis(selectedSymptoms);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = () => {
    refetch({ 
      name: searchQuery || undefined,
      pincode: locationQuery || undefined,
      specialty: selectedSymptoms.length > 0 ? 
        getSpecialtyForSymptom(selectedSymptoms[0])[0] : undefined
    });
  };

  const handleBookAppointment = (provider: Provider) => {
    setShowBooking(provider);
  };

  const handleBookingComplete = (bookingData: any) => {
    setShowBooking(null);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  if (showAppointments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowAppointments(false)}
              className="mb-4"
            >
              ← {t('backToSearch')}
            </Button>
          </div>
          <AppointmentList />
        </div>
      </div>
    );
  }

  const providers = data?.searchProviders || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {bookingSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {t('appointmentBooked')}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {t('errorOccurred')}: {error.message}
          </div>
        )}
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{t('findProviders')}</h1>
            <Button 
              variant="outline" 
              onClick={() => setShowAppointments(true)}
              className="flex items-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t('myAppointments')}
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="symptoms">{t('symptomsPlaceholder')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="symptoms"
                      placeholder={t('symptomsPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button 
                      variant="outline"
                      onClick={() => setShowDiagnosisPanel(!showDiagnosisPanel)}
                      className="whitespace-nowrap"
                    >
                      <Stethoscope className="h-4 w-4 mr-2" />
                      {t('symptomCheck')}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">{t('locationPlaceholder')}</Label>
                  <Input
                    id="location"
                    placeholder={t('locationPlaceholder')}
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleSearch}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? t('searching') : t('search')}
                  </Button>
                </div>
              </div>
              
              {/* Symptom Diagnosis Panel */}
              {showDiagnosisPanel && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium mb-3">{t('selectSymptoms')}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {commonSymptoms.map(symptom => (
                      <Badge 
                        key={symptom}
                        variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
                        className="cursor-pointer text-sm py-1 px-3"
                        onClick={() => toggleSymptom(symptom)}
                      >
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                  
                  {selectedSymptoms.length > 0 && diagnosis && (
                    <div className="mt-3">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">{t('recommendedSpecialties')}:</h4>
                      <div className="flex flex-wrap gap-1">
                        {diagnosis.recommendedSpecialties.map(specialty => (
                          <Badge key={specialty} className="bg-green-100 text-green-800 border-green-200">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Button 
                      onClick={() => {
                        handleSearch();
                        setShowDiagnosisPanel(false);
                      }}
                      disabled={selectedSymptoms.length === 0 || diagnosisLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {t('findSpecialists')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500">{t('noProvidersFound')}</p>
                <p className="text-sm text-gray-400 mt-2">{t('tryDifferentSearch')}</p>
              </div>
            ) : (
              providers.map((provider: Provider) => (
                <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <p className="text-gray-600">{provider.specialty}</p>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{provider.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {provider.location}
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {provider.distance} away
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Next available: {provider.nextAvailable}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {provider.availableSlots} slots available
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {provider.languages?.map((lang) => (
                          <Badge key={lang} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => handleBookAppointment(provider)}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        {t('bookAppointment')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      
      {showBooking && (
        <AppointmentBooking
          provider={showBooking}
          onBookingComplete={handleBookingComplete}
          onCancel={() => setShowBooking(null)}
        />
      )}
    </div>
  );
};

export default ProviderSearch;