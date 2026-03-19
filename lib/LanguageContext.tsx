import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLanguage, Language, setLanguage, translations } from './i18n';

type LanguageContextType = {
  language: Language;
  t: typeof translations.en;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: translations.en,
  toggleLanguage: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLang] = useState<Language>('en');

  useEffect(() => {
    getLanguage().then(setLang);
  }, []);

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'ru' : 'en';
    setLang(newLang);
    await setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      t: translations[language],
      toggleLanguage,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);