'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionaries, Language } from '../i18n/dictionaries';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (section: keyof typeof dictionaries.en, key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('axis-lang') as Language;
    if (saved && (saved === 'en' || saved === 'es')) {
      setLanguage(saved);
    }
    setMounted(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('axis-lang', lang);
  };

  const t = (section: keyof typeof dictionaries.en, key: string): string => {
    try {
      // @ts-ignore
      return dictionaries[language][section][key] || key;
    } catch (e) {
      return key;
    }
  };

  if (!mounted) {
    // Prevent hydration mismatch
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
