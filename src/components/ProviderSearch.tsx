import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client';
import AppointmentBooking from './AppointmentBooking';
import AppointmentList from './AppointmentList';
import type { DemographicData } from './DemographicsForm';
import { SEARCH_PROVIDERS } from '@/lib/graphql';
import { useDiagnosis, getSpecialtyForSymptom } from '@/lib/diagnosisService';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, MapPin } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  location: string;
  pincode?: string;
}

interface ProviderSearchProps {
  userLocation?: { latitude: number; longitude: number };
  demographicData: DemographicData;
}

const ProviderSearch: React.FC<ProviderSearchProps> = ({ demographicData }) => {
  // Hooks at top
  const { t } = useTranslation();
  const { isLoggedIn, appState, userRole } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState(demographicData?.pincode || '');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showBooking, setShowBooking] = useState<Provider | null>(null);
  const [showAppointments, setShowAppointments] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { loading, error, data, refetch } = useQuery(
    SEARCH_PROVIDERS,
    {
      variables: {
        name: searchQuery || undefined,
        pincode: locationQuery || undefined,
        specialty:
          selectedSymptoms.length > 0
            ? getSpecialtyForSymptom(selectedSymptoms[0])[0]
            : undefined,
      },
      fetchPolicy: 'network-only',
    }
  );

  const { diagnosis } = useDiagnosis(selectedSymptoms);

  useEffect(() => {
    if (appState === 'search' && userRole === 'patient') {
      refetch();
    }
  }, [appState, userRole, refetch]);

  // Conditional render after hooks
  if (!isLoggedIn || appState !== 'search' || userRole !== 'patient') {
    return null;
  }

  const handleSearch = () => {
    refetch({
      name: searchQuery || undefined,
      pincode: locationQuery || undefined,
      specialty:
        selectedSymptoms.length > 0
          ? getSpecialtyForSymptom(selectedSymptoms[0])[0]
          : undefined,
    });
  };

  const handleBookingComplete = () => {
    setShowBooking(null);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 3000);
  };

  return (
    <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      {showAppointments ? (
        <>
          <Button onClick={() => setShowAppointments(false)}>
            ← {t('backToSearch')}
          </Button>
          <AppointmentList />
        </>
      ) : (
        <>
          {bookingSuccess && (
            <div className="bg-green-100 p-3 rounded mb-4">
              {t('appointmentBooked')}
            </div>
          )}
          {error && (
            <div className="bg-red-100 p-3 rounded mb-4 flex items-center">
              <AlertCircle className="mr-2" />
              {t('errorOccurred')}: {error.message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="search">{t('symptomsPlaceholder')}</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('symptomsPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="location">{t('locationPlaceholder')}</Label>
              <Input
                id="location"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder={t('locationPlaceholder')}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? t('searching') : t('search')}
              </Button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.searchProviders?.map((p: Provider) => (
              <Card key={p.id} className="hover:shadow-md">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{p.specialty}</p>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-1 h-4 w-4" />
                    {p.location}
                  </div>
                  <Button
                    className="mt-2 w-full"
                    onClick={() => setShowBooking(p)}
                  >
                    {t('bookAppointment')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      {showBooking && (
        <AppointmentBooking
          provider={showBooking}
          onBookingComplete={handleBookingComplete}
          onCancel={() => setShowBooking(null)}
        />
      )}
      {showAppointments && !showBooking && <AppointmentList />}
    </div>
  );
};

export default ProviderSearch;
