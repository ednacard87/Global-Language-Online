'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface DialogueLine {
    speaker: string;
    line: string;
    answer: string[];
}

interface LargeTextTranslationExerciseProps {
    title: string;
    dialogue: DialogueLine[];
    onComplete: () => void;
}

export const LargeTextTranslationExercise = ({ title, dialogue, onComplete }: LargeTextTranslationExerciseProps) => {
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(dialogue.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(dialogue.length).fill('unchecked'));

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
        const newValidationStatus = dialogue.map((item, index) => {
            const userAnswer = userAnswers[index].trim().toLowerCase().replace(/[.?,¿!¡]/g, '');
            const correctAnswers = item.answer.map(ans => ans.toLowerCase().replace(/[.?,¿!¡]/g, ''));
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
                description: "Has completado el ejercicio de traducción.",
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
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Traduce cada línea del diálogo al inglés.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {dialogue.map((item, index) => (
                    <div key={index} className="grid gap-2">
                        <Label htmlFor={`line-${index}`} className="text-muted-foreground">
                            <span className="font-bold text-foreground">{item.speaker}:</span> {item.line}
                        </Label>
                        <Input
                            id={`line-${index}`}
                            value={userAnswers[index]}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            className={cn(getInputClass(validationStatus[index]))}
                            placeholder="Escribe la traducción..."
                            autoComplete="off"
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>Verificar y Completar</Button>
            </CardFooter>
        </Card>
    );
};
