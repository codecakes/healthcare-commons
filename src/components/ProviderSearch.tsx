import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Star, Calendar } from 'lucide-react';
import AppointmentBooking from './AppointmentBooking';
import AppointmentList from './AppointmentList';
import { diagnosisService } from '@/services/diagnosis';

interface Provider {
  id: string;
  name: string;
  specialty: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState(demographicData?.pincode || '');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBooking, setShowBooking] = useState<Provider | null>(null);
  const [showAppointments, setShowAppointments] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const mockProviders: Provider[] = [
    {
      id: '1',
      name: 'Dr. Priya Sharma',
      specialty: 'General Physician',
      distance: '1.2 km',
      rating: 4.8,
      availableSlots: 5,
      nextAvailable: 'Today 2:30 PM',
      languages: ['English', 'Hindi']
    },
    {
      id: '2',
      name: 'City Medical Center',
      specialty: 'Multi-specialty Clinic',
      distance: '2.1 km',
      rating: 4.6,
      availableSlots: 12,
      nextAvailable: 'Tomorrow 9:00 AM',
      languages: ['English', 'Hindi', 'Bengali']
    },
    {
      id: '3',
      name: 'Dr. Rajesh Kumar',
      specialty: 'Pediatrician',
      distance: '3.5 km',
      rating: 4.9,
      availableSlots: 3,
      nextAvailable: 'Today 4:00 PM',
      languages: ['English', 'Hindi', 'Tamil']
    }
  ];

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const specialties = await diagnosisService.suggestSpecialties(searchQuery);
    setTimeout(() => {
      let filteredProviders = mockProviders;

      if (specialties.length > 0) {
        filteredProviders = filteredProviders.filter(
          (provider) =>
            specialties.includes(provider.specialty) ||
            provider.specialty === 'Multi-specialty Clinic'
        );
      } else if (searchQuery) {
        filteredProviders = filteredProviders.filter((provider) =>
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.specialty.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setProviders(filteredProviders);
      setLoading(false);
    }, 1000);
  };

  const handleBookAppointment = (provider: Provider) => {
    setShowBooking(provider);
  };

  const handleBookingComplete = (bookingData: any) => {
    setShowBooking(null);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 3000);
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
              ← Back to Search
            </Button>
          </div>
          <AppointmentList />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {bookingSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Appointment booked successfully!
          </div>
        )}
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Find Healthcare Providers</h1>
            <Button 
              variant="outline" 
              onClick={() => setShowAppointments(true)}
              className="flex items-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              My Appointments
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="symptoms">Symptoms or Condition</Label>
                  <Input
                    id="symptoms"
                    placeholder="e.g., fever, cough, checkup"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Pincode or area"
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
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
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
                      {provider.languages.map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={() => handleBookAppointment(provider)}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Book Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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