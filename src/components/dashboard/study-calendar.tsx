'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useTranslation } from '@/context/language-context';

export function StudyCalendar() {
  const { t } = useTranslation();
  return (
    <Card className="shadow-soft rounded-lg border-2 border-brand-purple flex flex-col">
      <CardHeader className="items-center">
        <CardTitle>{t('dashboard.studyCalendar')}</CardTitle>
        <CardDescription>{t('dashboard.studyCalendarDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-start p-6 pt-0">
        <Button asChild className="w-full max-w-xs mt-8">
            <Link href="https://calendly.com/ednacard87/clases-disponibles" target="_blank" rel="noopener noreferrer">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {t('dashboard.bookClass')}
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
