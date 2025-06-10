import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, MapPin } from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  contactNumber: string;
  symptoms: string;
  providerId: string;
  providerName: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

interface AppointmentListProps {
  onViewDetails?: (appointment: Appointment) => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ onViewDetails }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = () => {
    const stored = localStorage.getItem('appointments');
    if (stored) {
      const appointmentData = JSON.parse(stored);
      // Sort by date and time
      appointmentData.sort((a: Appointment, b: Appointment) => {
        return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
      });
      setAppointments(appointmentData);
    }
  };

  const cancelAppointment = (appointmentId: string) => {
    const updated = appointments.map(apt => 
      apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
    );
    setAppointments(updated);
    localStorage.setItem('appointments', JSON.stringify(updated));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isUpcoming = (date: string, time: string) => {
    const appointmentDateTime = new Date(date + ' ' + time);
    return appointmentDateTime > new Date();
  };

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No appointments booked yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Appointments</h2>
      
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{appointment.providerName}</CardTitle>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(appointment.date)}
                  <Clock className="h-4 w-4 ml-3 mr-1" />
                  {appointment.time}
                </div>
              </div>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {appointment.patientName}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                {appointment.contactNumber}
              </div>
              {appointment.symptoms && (
                <div className="text-sm text-gray-600">
                  <strong>Symptoms:</strong> {appointment.symptoms}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 mt-4">
              {onViewDetails && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails(appointment)}
                >
                  View Details
                </Button>
              )}
              
              {appointment.status === 'confirmed' && isUpcoming(appointment.date, appointment.time) && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => cancelAppointment(appointment.id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AppointmentList;