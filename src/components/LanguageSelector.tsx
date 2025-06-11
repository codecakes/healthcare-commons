import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, changeLanguage } from '@/lib/i18n';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange
}) => {
  const { t } = useTranslation();

  // Get the name of the current language
  const getCurrentLanguageName = () => {
    const lang = supportedLanguages.find(l => l.code === currentLanguage);
    return lang ? lang.name : 'English';
  };

  // Handle language change
  const handleLanguageChange = (languageCode: string) => {
    // Call the i18n changeLanguage function to load translations if needed
    changeLanguage(languageCode).then(() => {
      // Then call the component's onLanguageChange prop
      onLanguageChange(languageCode);
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-gray-600" />
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-32">
          <SelectValue>{getCurrentLanguageName()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex flex-col">
                <span className="font-medium">{language.name}</span>
                <span className="text-xs text-gray-500">{t(`language.${language.code}`, language.name)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;