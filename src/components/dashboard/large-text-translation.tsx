'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface TextPhrase {
    spanish: string;
    answers: string[];
}

interface LargeTextTranslationProps {
    title: string;
    phrases: TextPhrase[];
    onComplete: () => void;
}

export const LargeTextTranslation = ({ title, phrases, onComplete }: LargeTextTranslationProps) => {
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(phrases.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(phrases.length).fill('unchecked'));

    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);

        const newValidation = [...validationStatus];
        if(newValidation[index] !== 'unchecked') {
            newValidation[index] = 'unchecked';
            setValidationStatus(newValidation);
        }
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus = phrases.map((item, index) => {
            const userAnswer = userAnswers[index].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const correctAnswers = item.answers.map(ans => ans.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isCorrect = correctAnswers.some(ans => ans === userAnswer);
            if (!isCorrect) {
                allCorrect = false;
            }
            return isCorrect ? 'correct' : 'incorrect';
        });
        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({
                title: "¡Excelente!",
                description: "Has traducido el texto correctamente.",
            });
            onComplete();
        } else {
            toast({
                variant: "destructive",
                title: "Algunas respuestas son incorrectas",
                description: "Por favor, revisa los campos marcados en rojo.",
            });
        }
    };

    const getInputClass = (status: 'correct' | 'incorrect' | 'unchecked') => {
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Traduce cada frase del texto al inglés.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {phrases.map((item, index) => (
                    <div key={index} className="grid gap-2">
                        <Label htmlFor={`phrase-${index}`} className="text-muted-foreground italic text-base">
                            {item.spanish}
                        </Label>
                        <Input
                            id={`phrase-${index}`}
                            value={userAnswers[index]}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            className={cn("text-lg", getInputClass(validationStatus[index]))}
                            placeholder=""
                            autoComplete="off"
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers} className="w-full sm:w-auto">Verificar</Button>
            </CardFooter>
        </Card>
    );
};
