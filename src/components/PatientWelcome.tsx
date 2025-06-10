import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Users, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PatientWelcomeProps {
  onGetStarted: () => void;
}

const PatientWelcome: React.FC<PatientWelcomeProps> = ({ onGetStarted }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Heart className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            {t('appName')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {t('tagline')}
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            {t('getStarted')}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Find Nearby Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Discover healthcare providers in your local area with real-time availability.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Anonymous Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get matched with providers based on your needs without sharing personal information.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle>Easy Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Book appointments seamlessly with integrated scheduling and reminders.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientWelcome;
