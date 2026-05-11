'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookText } from 'lucide-react';

export interface TextPhrase {
    spanish: string;
    answers: string[];
}

interface LargeTextTranslationProps {
    title: string;
    phrases: TextPhrase[];
    onComplete: () => void;
    vocabulary?: Record<string, string>;
}

export const LargeTextTranslation = ({ title, phrases, onComplete, vocabulary }: LargeTextTranslationProps) => {
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
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>Traduce cada frase del texto al inglés.</CardDescription>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="space-y-2">
                                    <h4 className="font-bold border-b pb-1">Vocabulario útil</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        {Object.entries(vocabulary).map(([es, en]) => (
                                            <React.Fragment key={es}>
                                                <span className="text-muted-foreground capitalize">{es}:</span>
                                                <span className="font-semibold text-right">{en}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
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
