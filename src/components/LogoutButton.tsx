import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LogOut } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  variant = 'ghost', 
  size = 'default',
  showIcon = true,
  className = ''
}) => {
  const { logout, userRole } = useAppContext();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    // Force a page refresh to ensure clean state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  const getRoleText = () => {
    return userRole === 'provider' ? 'Provider' : 'Patient';
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`flex items-center gap-2 ${className}`}
        >
          {showIcon && <LogOut className="h-4 w-4" />}
          Logout
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout from your {getRoleText()} session? 
            You will need to start over and re-enter your information.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Logout
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutButton;