import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LanguageSelector from './LanguageSelector';
import LogoutButton from './LogoutButton';
import { useAppContext } from '@/contexts/AppContext';
import { Heart, Stethoscope, User } from 'lucide-react';

interface AppHeaderProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ currentLanguage, onLanguageChange }) => {
  const { userRole, isLoggedIn } = useAppContext();
  const { t } = useTranslation();

  const getRoleIcon = () => {
    if (userRole === 'provider') {
      return <Stethoscope className="h-4 w-4" />;
    } else if (userRole === 'patient') {
      return <User className="h-4 w-4" />;
    }
    return <Heart className="h-4 w-4" />;
  };

  const getRoleText = () => {
    if (userRole === 'provider') return t('providerButton');
    if (userRole === 'patient') return t('patientButton');
    return t('appName');
  };

  const getRoleBadgeColor = () => {
    if (userRole === 'provider') return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (userRole === 'patient') return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="rounded-none border-0 border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Role */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getRoleIcon()}
              <h1 className="text-xl font-bold text-gray-900">
                {t('appName')}
              </h1>
            </div>
            
            {isLoggedIn && userRole && (
              <Badge className={getRoleBadgeColor()}>
                {getRoleText()}
              </Badge>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <LanguageSelector 
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
            
            {isLoggedIn && (
              <LogoutButton 
                variant="ghost" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AppHeader;
