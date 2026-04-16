'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


export const verbVocabularyData = [
    { spanish: 'comer', english: 'eat' },
    { spanish: 'beber', english: 'drink' },
    { spanish: 'dormir', english: 'sleep' },
    { spanish: 'correr', english: 'run' },
    { spanish: 'caminar', english: 'walk' },
    { spanish: 'jugar', english: 'play' },
    { spanish: 'leer', english: 'read' },
    { spanish: 'escribir', english: 'write' },
    { spanish: 'escuchar', english: 'listen' },
    { spanish: 'estudiar', english: 'study' },
    { spanish: 'abrir', english: 'open' },
    { spanish: 'cerrar', english: 'close' },
    { spanish: 'sentarse', english: 'sit' },
    { spanish: 'estar de pie', english: 'stand' },
];

export const VerbVocabularyExercise = ({ onComplete, data }: { onComplete: () => void, data?: {spanish: string, english: string}[] }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const exerciseData = data || verbVocabularyData;

    const handleInputChange = (index: number, value: string) => {
        setUserAnswers(prev => ({
            ...prev,
            [index]: value
        }));
        setValidationStatus(prev => {
            const newStatus = { ...prev };
            if (newStatus[index] && newStatus[index] !== 'unchecked') {
                newStatus[index] = 'unchecked';
            }
            return newStatus;
        });
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: Record<number, 'correct' | 'incorrect' | 'unchecked'> = {};

        exerciseData.forEach((verb, index) => {
            const userAnswer = (userAnswers[index] || '').trim().toLowerCase();
            if (userAnswer === verb.english.toLowerCase()) {
                newValidationStatus[index] = 'correct';
            } else {
                newValidationStatus[index] = 'incorrect';
                allCorrect = false;
            }
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: t('countries.allCorrect') }); // Using existing translation
            onComplete();
        } else {
            toast({ variant: 'destructive', title: t('countries.someIncorrect') }); // Using existing translation
        }
    };

    const getInputClass = (index: number) => {
        const status = validationStatus[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t('kidsA1Class2.finalVocab')}</CardTitle>
                <CardDescription>{t('kidsA1Class2.vocabVerbsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-w-md mx-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left">{t('common.spanish')}</th>
                                <th className="p-2 text-left">{t('common.english')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exerciseData.map((verb, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2 font-medium">{verb.spanish}</td>
                                    <td className="p-2">
                                        <Input
                                            value={userAnswers[index] || ''}
                                            onChange={(e) => handleInputChange(index, e.target.value)}
                                            className={cn(getInputClass(index))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>{t('vocabulary.check')}</Button>
            </CardFooter>
        </Card>
    );
};
