import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import LogoutButton from './LogoutButton';
import { VERIFY_PROVIDER } from '@/lib/graphql';

interface ProviderVerificationProps {
  onVerificationComplete: (data: any) => void;
}

const ProviderVerification: React.FC<ProviderVerificationProps> = ({ onVerificationComplete }) => {
  const { t } = useTranslation();
  const { logout } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    specialty: '',
    experience: '',
    clinicName: '',
    location: '',
    pincode: '',
    contactNumber: ''
  });
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  
  // GraphQL mutation for provider verification
  const [verifyProvider, { loading: isSubmitting, error }] = useMutation(VERIFY_PROVIDER, {
    onCompleted: (data) => {
      if (data.verifyProvider.verified) {
        setVerificationStatus('verified');
        onVerificationComplete(data.verifyProvider.provider);
      } else {
        setVerificationStatus('rejected');
      }
    },
    onError: () => {
      setVerificationStatus('rejected');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use GraphQL mutation
      await verifyProvider({
        variables: {
          name: formData.name,
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber,
          location: `${formData.clinicName}, ${formData.location}`,
          pincode: formData.pincode
        }
      });
    } catch (err) {
      console.error('Verification failed', err);
      setVerificationStatus('rejected');
    }
  };

  const handleGoBack = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header with back button and logout */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToHome')}
          </Button>
          <LogoutButton variant="outline" size="sm" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-6 w-6 mr-2 text-blue-600" />
              {t('providerVerification')}
            </CardTitle>
            <p className="text-gray-600">{t('completeProfilePrompt')}</p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">{t('errorOccurred')}</p>
                  <p className="text-red-600 text-sm">{error.message}</p>
                </div>
              </div>
            )}
            
            {verificationStatus === 'verified' ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">{t('verificationComplete')}</h3>
                <p className="text-gray-600 mb-4">{t('canAcceptAppointments')}</p>
                <Badge className="bg-green-100 text-green-800">
                  {t('verifiedProvider')}
                </Badge>
              </div>
            ) : verificationStatus === 'rejected' ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{t('verificationFailed')}</p>
                <Button onClick={() => setVerificationStatus('pending')}>{t('backToForm')}</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('fullName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Dr. John Smith"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber">{t('medicalLicenseNumber')} *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      placeholder="MH12345678"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialty">{t('specialty')} *</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                      placeholder="General Practice"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="clinicName">{t('clinicName')} *</Label>
                  <Input
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clinicName: e.target.value }))}
                    placeholder="City Medical Center"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">{t('address')} *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="123 Healthcare Street, Medical District"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pincode">{t('pincode')} *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="400001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">{t('yearsOfExperience')}</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="5"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contactNumber">{t('contactNumber')} *</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGoBack}
                    className="flex-1"
                  >
                    {t('cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('verifying') : t('submitForVerification')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderVerification;