'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowRight, Trophy } from 'lucide-react';
import { Label } from '@/components/ui/label';

export type ShortAnswerPresentSimplePrompt = {
    question: string;
    answers: {
        shortAffirmative: string[];
        shortNegative: string[];
    }
};

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';
type AnswerFields = 'shortAffirmative' | 'shortNegative';

export function ShortAnswerPresentSimpleExercise({ exerciseData, onComplete, title, description }: { exerciseData: ShortAnswerPresentSimplePrompt[], onComplete?: () => void, title: string, description: string }) {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({ shortAffirmative: '', shortNegative: '' });
    const [validation, setValidation] = useState<Record<AnswerFields, ValidationStatus>>({ shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
    const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);
    const [completedPrompts, setCompletedPrompts] = useState<boolean[]>([]);

    useEffect(() => {
        setCompletedPrompts(Array(exerciseData.length).fill(false));
    }, [exerciseData]);

    const totalPrompts = exerciseData.length;
    const currentPrompt = exerciseData[currentIndex];

    useEffect(() => {
        setAnswers({ shortAffirmative: '', shortNegative: '' });
        setValidation({ shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
        setIsCurrentCorrect(false);
    }, [currentIndex]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target as { name: AnswerFields, value: string };
        setAnswers(prev => ({ ...prev, [name]: value }));
        setIsCurrentCorrect(false);
    };

    const handleCheck = () => {
        const newValidation: Record<AnswerFields, ValidationStatus> = { shortAffirmative: 'unchecked', shortNegative: 'unchecked' };
        let allCorrect = true;

        (Object.keys(answers) as AnswerFields[]).forEach(key => {
            const userAnswer = answers[key].trim().toLowerCase().replace(/[.]/g, '');
            const correctAnswers = currentPrompt.answers[key].map(ans => ans.toLowerCase().replace(/[.]/g, ''));

            if (correctAnswers.includes(userAnswer)) {
                newValidation[key] = 'correct';
            } else {
                newValidation[key] = 'incorrect';
                allCorrect = false;
            }
        });

        setValidation(newValidation);
        setIsCurrentCorrect(allCorrect);

        if (allCorrect) {
            const newCompleted = [...completedPrompts];
            newCompleted[currentIndex] = true;
            setCompletedPrompts(newCompleted);
            toast({ title: "¡Correcto!", description: "Puedes pasar al siguiente." });
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Revisa tus respuestas." });
        }
    };
    
    const handleNext = () => {
        if (currentIndex < totalPrompts - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowCompletionMessage(true);
            onComplete?.();
        }
    };
    
    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {exerciseData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                completedPrompts[index] && 'bg-green-500/20 border-green-500 text-green-700',
                            )}
                            aria-label={`Ir a la pregunta ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Pregunta ({currentIndex + 1}/{totalPrompts})</p>
                    <p className="text-xl font-bold p-3 bg-muted rounded-md">{currentPrompt.question}</p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Label htmlFor="shortAffirmative" className="w-20 font-semibold text-center text-green-500">(+A)</Label>
                        <Input 
                            id="shortAffirmative" 
                            name="shortAffirmative" 
                            value={answers.shortAffirmative} 
                            onChange={handleInputChange} 
                            className={cn(validation.shortAffirmative === 'correct' ? 'border-green-500' : validation.shortAffirmative === 'incorrect' ? 'border-destructive' : '')} 
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Label htmlFor="shortNegative" className="w-20 font-semibold text-center text-red-500">(-A)</Label>
                        <Input 
                            id="shortNegative" 
                            name="shortNegative" 
                            value={answers.shortNegative} 
                            onChange={handleInputChange} 
                            className={cn(validation.shortNegative === 'correct' ? 'border-green-500' : validation.shortNegative === 'incorrect' ? 'border-destructive' : '')} 
                            autoComplete="off"
                        />
                    </div>
                </div>
            </CardContent>
             <CardFooter className="flex justify-between">
                 <Button onClick={handleCheck}>Verificar</Button>
                 <Button onClick={handleNext} disabled={!isCurrentCorrect}>
                     {currentIndex < totalPrompts - 1 ? 'Siguiente' : 'Finalizar'}
                     <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
            </CardFooter>
        </Card>
    );
}
