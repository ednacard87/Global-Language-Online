'use client';

import React from 'react';
import { SiteLogo } from '@/components/icons';
import Link from 'next/link';
import { useTranslation } from '@/context/language-context';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t bg-brand-lilac">
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SiteLogo className="h-6 w-6 text-muted-foreground" />
            <div className='flex flex-col'>
                <span className="font-semibold">Global English Online</span>
                <span className="text-xs text-muted-foreground">ednacard87@gmail.com - Colombia</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-center md:text-right">
            <p>{t('footer.createdBy')}</p>
            <p>&copy; 2026</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
