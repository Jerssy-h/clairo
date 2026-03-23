import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLanguage, Language, setLanguage, translations } from './i18n';

type LanguageContextType = {
  language: Language;
  t: typeof translations.en;
  toggleLanguage: () => void;
  changeLanguage: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: translations.en,
  toggleLanguage: () => {},
  changeLanguage: () => {},
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

  const changeLanguage = async (lang: Language) => {
    setLang(lang);
    await setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      t: translations[language],
      toggleLanguage,
      changeLanguage,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);