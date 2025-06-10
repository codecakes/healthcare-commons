import React, { useState } from 'react';
import supabase from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Phone } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  specialty: string;
}

interface AppointmentBookingProps {
  provider: Provider;
  onBookingComplete: (bookingData: any) => void;
  onCancel: () => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  provider,
  onBookingComplete,
  onCancel
}) => {
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    patientName: '',
    contactNumber: '',
    symptoms: '',
    appointmentType: 'consultation'
  });

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const appointmentId = 'apt-' + Date.now();
    const appointment = {
      ...bookingData,
      id: appointmentId,
      providerId: provider.id,
      providerName: provider.name,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase.from('appointments').insert(appointment);
    if (error) {
      console.error('Failed to book appointment', error);
      return;
    }

    onBookingComplete(appointment);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Book Appointment
          </CardTitle>
          <p className="text-sm text-gray-600">
            {provider.name} - {provider.specialty}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Time *</Label>
                <Select value={bookingData.time} onValueChange={(value) => setBookingData(prev => ({ ...prev, time: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={bookingData.patientName}
                onChange={(e) => setBookingData(prev => ({ ...prev, patientName: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                type="tel"
                value={bookingData.contactNumber}
                onChange={(e) => setBookingData(prev => ({ ...prev, contactNumber: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="symptoms">Symptoms/Reason for Visit</Label>
              <Textarea
                id="symptoms"
                value={bookingData.symptoms}
                onChange={(e) => setBookingData(prev => ({ ...prev, symptoms: e.target.value }))}
                placeholder="Describe your symptoms or reason for visit"
                rows={3}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Book Appointment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentBooking;