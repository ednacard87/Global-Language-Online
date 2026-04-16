'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import es from '@/locales/es.json';
import en from '@/locales/en.json';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, values?: { [key: string]: string | number }) => string;
}

const translations: Record<string, any> = { es, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es'); // Default to Spanish

  const value = useMemo(() => {
    const t = (key: string, values?: { [key: string]: string | number }): string => {
        if (!key) {
            console.warn('Translation key is empty or undefined.');
            return '';
        }
        const keys = key.split('.');
        let result: any = translations[language];
        let fallbackResult: any = translations['en'];

        for (const k of keys) {
            result = result?.[k];
            fallbackResult = fallbackResult?.[k];
        }
        
        let str = result !== undefined ? String(result) : (fallbackResult !== undefined ? String(fallbackResult) : key);

        if (values) {
            Object.entries(values).forEach(([k, v]) => {
                str = str.replace(`{{${k}}}`, String(v));
            });
        }

        return str;
    };

    return {
      language,
      setLanguage,
      t,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
