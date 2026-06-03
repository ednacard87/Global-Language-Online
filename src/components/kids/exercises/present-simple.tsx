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
import { ArrowRight, Trophy, BookText, Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

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

// --- DATA EXPORTS ---

export const presentSimpleExercises: ExercisePrompt[] = [
    {
        spanish: "yo juego en el parque",
        answers: {
            affirmative: ["i play in the park"],
            negative: ["i do not play in the park", "i don't play in the park"],
            interrogative: ["do i play in the park?"],
            shortAffirmative: ["yes, i do"],
            shortNegative: ["no, i do not", "no, i don't"]
        }
    },
    {
        spanish: "ella come una manzana",
        answers: {
            affirmative: ["she eats an apple"],
            negative: ["she does not eat an apple", "she doesn't eat an apple"],
            interrogative: ["does she eat an apple?"],
            shortAffirmative: ["yes, she does"],
            shortNegative: ["no, she does not", "no, she doesn't"]
        }
    },
    {
        spanish: "nosotros vivimos en una casa grande",
        answers: {
            affirmative: ["we live in a big house"],
            negative: ["we do not live in a big house", "we don't live in a big house"],
            interrogative: ["do we live in a big house?"],
            shortAffirmative: ["yes, we do"],
            shortNegative: ["no, we do not", "no, we don't"]
        }
    }
];

export const presentSimpleExercises2: ExercisePrompt[] = [
    {
        spanish: "ellos hablan inglés",
        answers: {
            affirmative: ["they speak english"],
            negative: ["they do not speak english", "they don't speak english"],
            interrogative: ["do they speak english?"],
            shortAffirmative: ["yes, they do"],
            shortNegative: ["no, they do not", "no, they don't"]
        }
    },
    {
        spanish: "él trabaja cada día",
        answers: {
            affirmative: ["he works every day"],
            negative: ["he does not work every day", "he doesn't work every day"],
            interrogative: ["does he work every day?"],
            shortAffirmative: ["yes, he does"],
            shortNegative: ["no, he does not", "no, he doesn't"]
        }
    }
];

// --- COMPONENT ---

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
    
    if (!currentExercise) return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>;
    
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
                                    <ScrollArea className="max-h-[300px] pr-4">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {Object.entries(vocabulary).map(([es, en]) => (
                                                <React.Fragment key={es}>
                                                    <span className="text-muted-foreground capitalize">{es}:</span>
                                                    <span className="font-semibold text-right">{en}</span>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </ScrollArea>
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
                                completedPrompts[index] ? 'bg-green-500 border-green-500 text-white' : ''
                            )}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl uppercase tracking-tighter">
                    {currentExercise.spanish}
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
                            <div className="border-t my-2 border-border/50" />
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
            <CardFooter className="flex justify-between border-t pt-6 mt-4">
                <Button onClick={handleCheck}>Verificar</Button>
                <Button onClick={handleNext} disabled={!isCurrentCorrect} className='text-white font-bold'>
                    {currentIndex < exerciseData.length - 1 ? 'Siguiente' : 'Finalizar'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
};
