'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowRight, Trophy, BookText } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type ExercisePrompt = {
    spanish: string;
    answers: {
        affirmative: string[];
        negative: string[];
        interrogative: string[];
        shortAffirmative?: string[];
        shortNegative?: string[];
    }
};

type TranslationForms = {
    affirmative: string;
    negative: string;
    interrogative: string;
    shortAffirmative: string;
    shortNegative: string;
};

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

const nemoImage = PlaceHolderImages.find(p => p.id === 'nemo-icon');
const clownFishImage = PlaceHolderImages.find(p => p.id === 'clown-fish-guide');

export const PresentSimpleExercise = ({
    onComplete,
    exerciseData,
    title,
    showShortAnswers = true,
    vocabulary
}: {
    onComplete: () => void,
    exerciseData: ExercisePrompt[],
    title?: string,
    showShortAnswers?: boolean,
    vocabulary?: Record<string, string>
}) => {
    const { toast } = useToast();
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [translations, setTranslations] = useState<TranslationForms>({ affirmative: '', negative: '', interrogative: '', shortAffirmative: '', shortNegative: '' });
    const [validationStatus, setValidationStatus] = useState<Record<keyof TranslationForms, ValidationStatus>>({ affirmative: 'unchecked', negative: 'unchecked', interrogative: 'unchecked', shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
    const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
    const [completedPrompts, setCompletedPrompts] = useState<boolean[]>([]);

    useEffect(() => {
        if (exerciseData) {
            setCompletedPrompts(Array(exerciseData.length).fill(false))
        }
    }, [exerciseData]);

    const currentExercise = exerciseData?.[currentIndex];

    useEffect(() => {
        setTranslations({ affirmative: '', negative: '', interrogative: '', shortAffirmative: '', shortNegative: '' });
        setValidationStatus({ affirmative: 'unchecked', negative: 'unchecked', interrogative: 'unchecked', shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
        setIsCurrentCorrect(false);
    }, [currentIndex]);
    
    if (!currentExercise) return null;
    
    const shouldShowShortAnswers = showShortAnswers && currentExercise.answers.shortAffirmative !== undefined && currentExercise.answers.shortNegative !== undefined;
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTranslations(prev => ({ ...prev, [name]: value }));
        setIsCurrentCorrect(false);
    };

    const handleCheck = () => {
        const newStatus: Record<keyof TranslationForms, ValidationStatus> = { ...validationStatus };
        let allAnswersCorrect = true;

        const fieldsToCheck: (keyof TranslationForms)[] = ['affirmative', 'negative', 'interrogative'];
        if (shouldShowShortAnswers) fieldsToCheck.push('shortAffirmative', 'shortNegative');

        fieldsToCheck.forEach(key => {
            const typedKey = key as keyof TranslationForms;
            let userAnswer = translations[typedKey].trim().toLowerCase().replace(/[.?]$/, '');
            const possibleAnswers = currentExercise.answers[typedKey]?.map(ans => ans.toLowerCase().replace(/[.?]$/, '')) || [];
            
            if (typedKey === 'interrogative' && !translations[typedKey].trim().endsWith('?')) {
                 newStatus[typedKey] = 'incorrect';
                 allAnswersCorrect = false;
                 return;
            }

            if (possibleAnswers.includes(userAnswer)) {
                newStatus[typedKey] = 'correct';
            } else {
                newStatus[typedKey] = 'incorrect';
                allAnswersCorrect = false;
            }
        });

        setValidationStatus(newStatus);
        setIsCurrentCorrect(allAnswersCorrect);

        if (allAnswersCorrect) {
            toast({ title: "¡Correcto!" });
            const newCompleted = [...completedPrompts];
            newCompleted[currentIndex] = true;
            setCompletedPrompts(newCompleted);
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Revisa las respuestas en rojo." });
        }
    };

    const handleNext = () => {
        if (currentIndex < exerciseData.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const progress = (completedPrompts.filter(c => c).length / exerciseData.length) * 100;
    
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title || 'Ejercicios'}</CardTitle>
                        <CardDescription>Traduce la frase a todas sus formas.</CardDescription>
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
                                    <h4 className="font-bold border-b pb-1 text-primary">Apoyo</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
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
                <div className="flex items-center justify-start flex-wrap gap-2 mt-4">
                    {exerciseData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                completedPrompts[index] && 'bg-green-500/20 border-green-500 text-green-700',
                                !completedPrompts[index] && validationStatus.affirmative === 'incorrect' && 'border-destructive text-destructive'
                            )}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center">
                    <p className="text-xl font-bold">{currentExercise.spanish}</p>
                </div>
                 <div className="space-y-3 font-mono text-base">
                    <div className="flex items-center gap-3">
                        <Label className="w-12 font-bold text-lg text-green-500 text-center">(+)</Label>
                        <Input name="affirmative" value={translations.affirmative} onChange={handleInputChange} className={cn(validationStatus.affirmative === 'correct' ? 'border-green-500 bg-green-50/5' : validationStatus.affirmative === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Label className="w-12 font-bold text-lg text-red-500 text-center">(-)</Label>
                        <Input name="negative" value={translations.negative} onChange={handleInputChange} className={cn(validationStatus.negative === 'correct' ? 'border-green-500 bg-green-50/5' : validationStatus.negative === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Label className="w-12 font-bold text-lg text-blue-500 text-center">(?)</Label>
                        <Input name="interrogative" value={translations.interrogative} onChange={handleInputChange} className={cn(validationStatus.interrogative === 'correct' ? 'border-green-500 bg-green-50/5' : validationStatus.interrogative === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" />
                    </div>
                    {shouldShowShortAnswers && (
                        <>
                            <div className="border-t my-2" />
                            <div className="flex items-center gap-3">
                                <Label className="w-12 font-bold text-lg text-green-600 text-center">(+A)</Label>
                                <Input name="shortAffirmative" value={translations.shortAffirmative} onChange={handleInputChange} className={cn(validationStatus.shortAffirmative === 'correct' ? 'border-green-500 bg-green-50/5' : validationStatus.shortAffirmative === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Label className="w-12 font-bold text-lg text-red-600 text-center">(-A)</Label>
                                <Input name="shortNegative" value={translations.shortNegative} onChange={handleInputChange} className={cn(validationStatus.shortNegative === 'correct' ? 'border-green-500 bg-green-50/5' : validationStatus.shortNegative === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" />
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button onClick={handleCheck}>Verificar</Button>
                <Button onClick={handleNext} disabled={!isCurrentCorrect}>
                    {currentIndex < exerciseData.length - 1 ? 'Siguiente' : 'Finalizar'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
};
