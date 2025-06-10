import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Upload, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import LogoutButton from './LogoutButton';

interface ProviderVerificationProps {
  onVerificationComplete: (data: any) => void;
}

const ProviderVerification: React.FC<ProviderVerificationProps> = ({ onVerificationComplete }) => {
  const { logout } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    specialty: '',
    experience: '',
    clinicName: '',
    address: '',
    contactNumber: ''
  });
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mock verification process
    setTimeout(() => {
      setVerificationStatus('verified');
      setIsSubmitting(false);
      
      // Complete verification after a short delay
      setTimeout(() => {
        onVerificationComplete({ 
          ...formData, 
          status: 'verified', 
          verifiedAt: new Date().toISOString() 
        });
      }, 1500);
    }, 2000);
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
            Back to Home
          </Button>
          <LogoutButton variant="outline" size="sm" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-6 w-6 mr-2 text-blue-600" />
              Provider Verification
            </CardTitle>
            <p className="text-gray-600">Complete your profile to start accepting patients</p>
          </CardHeader>
          <CardContent>
            {verificationStatus === 'verified' ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">Verification Complete!</h3>
                <p className="text-gray-600 mb-4">You can now start accepting patient appointments.</p>
                <Badge className="bg-green-100 text-green-800">
                  Verified Healthcare Provider
                </Badge>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
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
                    <Label htmlFor="licenseNumber">Medical License Number *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      placeholder="MH12345678"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialty">Specialty *</Label>
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
                  <Label htmlFor="clinicName">Clinic/Hospital Name *</Label>
                  <Input
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clinicName: e.target.value }))}
                    placeholder="City Medical Center"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Healthcare Street, Medical District"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactNumber">Contact Number *</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGoBack}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Verifying...' : 'Submit for Verification'}
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