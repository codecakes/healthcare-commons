import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export interface DemographicData {
  ageRange: string;
  gender: string;
  pincode: string;
  preferredLanguages: string[];
}

interface DemographicsFormProps {
  onComplete: (data: DemographicData) => void;
}

const DemographicsForm: React.FC<DemographicsFormProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<DemographicData>({
    ageRange: '',
    gender: '',
    pincode: '',
    preferredLanguages: []
  });

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' }
  ];

  const handleLanguageChange = (langCode: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferredLanguages: checked 
        ? [...prev.preferredLanguages, langCode]
        : prev.preferredLanguages.filter(l => l !== langCode)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ageRange && formData.gender && formData.pincode) {
      onComplete(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Help Us Find the Right Care</CardTitle>
          <p className="text-gray-600 text-center">
            This information helps match you with appropriate providers. No personal data is stored.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="age-range">Age Range *</Label>
              <Select value={formData.ageRange} onValueChange={(value) => setFormData(prev => ({ ...prev, ageRange: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-17">0-17 years</SelectItem>
                  <SelectItem value="18-35">18-35 years</SelectItem>
                  <SelectItem value="36-50">36-50 years</SelectItem>
                  <SelectItem value="51-65">51-65 years</SelectItem>
                  <SelectItem value="65+">65+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                type="text"
                placeholder="Enter your pincode"
                value={formData.pincode}
                onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                maxLength={6}
              />
            </div>

            <div>
              <Label>Preferred Languages</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {languages.map((lang) => (
                  <div key={lang.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={lang.code}
                      checked={formData.preferredLanguages.includes(lang.code)}
                      onCheckedChange={(checked) => handleLanguageChange(lang.code, checked as boolean)}
                    />
                    <Label htmlFor={lang.code} className="text-sm">{lang.name}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={!formData.ageRange || !formData.gender || !formData.pincode}
            >
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemographicsForm;
