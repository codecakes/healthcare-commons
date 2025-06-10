import { render, screen } from '@testing-library/react';
import AppointmentList from '@/components/AppointmentList';

describe('AppointmentList', () => {
  it('shows empty message when there are no appointments', () => {
    localStorage.removeItem('appointments');
    render(<AppointmentList />);
    expect(
      screen.getByText(/No appointments booked yet/i)
    ).toBeInTheDocument();
  });
});
