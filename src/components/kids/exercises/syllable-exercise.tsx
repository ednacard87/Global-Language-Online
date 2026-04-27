'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

export type SyllableExerciseData = {
    spanish: string;
    answers: {
        adjective: string;
        comparative: string;
        superlative: string;
    };
}[];

interface SyllableExerciseProps {
    data: SyllableExerciseData;
    title: string;
    description: string;
    onComplete: () => void;
}

type UserAnswers = {
    adjective: string;
    comparative: string;
    superlative: string;
};

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

type ValidationState = Record<keyof UserAnswers, ValidationStatus>;

export function SyllableExercise({ data, title, description, onComplete }: SyllableExerciseProps) {
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<UserAnswers[]>(Array(data.length).fill({ adjective: '', comparative: '', superlative: '' }));
    const [validationStatus, setValidationStatus] = useState<ValidationState[]>(Array(data.length).fill({ adjective: 'unchecked', comparative: 'unchecked', superlative: 'unchecked' }));
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const handleInputChange = (index: number, field: keyof UserAnswers, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = { ...newAnswers[index], [field]: value };
        setUserAnswers(newAnswers);

        const newValidation = [...validationStatus];
        if (newValidation[index][field] !== 'unchecked') {
            newValidation[index] = { ...newValidation[index], [field]: 'unchecked' };
            setValidationStatus(newValidation);
        }
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: ValidationState[] = userAnswers.map((answer, index) => {
            const correctData = data[index].answers;
            const newRowStatus: ValidationState = { adjective: 'unchecked', comparative: 'unchecked', superlative: 'unchecked' };
            let rowCorrect = true;

            (Object.keys(correctData) as (keyof UserAnswers)[]).forEach(field => {
                if (answer[field].trim().toLowerCase() === correctData[field].toLowerCase()) {
                    newRowStatus[field] = 'correct';
                } else {
                    newRowStatus[field] = 'incorrect';
                    rowCorrect = false;
                }
            });

            if (!rowCorrect) {
                allCorrect = false;
            }
            return newRowStatus;
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Has completado el ejercicio." });
            setShowCompletionMessage(true);
            onComplete();
        } else {
            toast({
                variant: 'destructive',
                title: "Algunas respuestas son incorrectas",
                description: "Revisa los campos marcados en rojo.",
            });
        }
    };

    const getInputClass = (status: ValidationStatus) => {
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <p className="text-muted-foreground mt-2">Has dominado los adjetivos monosilábicos.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left font-semibold text-muted-foreground">ADJETIVO (Español)</th>
                                <th className="p-2 text-left font-semibold text-muted-foreground">MONOSILABOS (ADJETIVO)</th>
                                <th className="p-2 text-left font-semibold text-muted-foreground">COMPARATIVO (ADJETIVO + ER)</th>
                                <th className="p-2 text-left font-semibold text-muted-foreground">SUPERLATIVO (ADJETIVO + EST)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2 font-medium">{item.spanish}</td>
                                    <td className="p-2">
                                        <Input
                                            value={userAnswers[index].adjective}
                                            onChange={(e) => handleInputChange(index, 'adjective', e.target.value)}
                                            className={cn(getInputClass(validationStatus[index].adjective))}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={userAnswers[index].comparative}
                                            onChange={(e) => handleInputChange(index, 'comparative', e.target.value)}
                                            className={cn(getInputClass(validationStatus[index].comparative))}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={userAnswers[index].superlative}
                                            onChange={(e) => handleInputChange(index, 'superlative', e.target.value)}
                                            className={cn(getInputClass(validationStatus[index].superlative))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>Verificar Respuestas</Button>
            </CardFooter>
        </Card>
    );
}
