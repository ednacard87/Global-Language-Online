'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

export type SyllableExerciseData = {
    spanish: string;
    answers: {
        adjective: string | string[];
        comparative: string | string[];
        superlative: string | string[];
    };
}[];

interface SyllableExerciseProps {
    data: SyllableExerciseData;
    title: string;
    description: string;
    onComplete: () => void;
    columnHeaders: {
        adjective: string;
        comparative: string;
        superlative: string;
    };
}

type UserAnswers = {
    adjective: string;
    comparative: string;
    superlative: string;
};

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

type ValidationState = Record<keyof UserAnswers, ValidationStatus>;

export function SyllableExercise({ data, title, description, onComplete, columnHeaders }: SyllableExerciseProps) {
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<UserAnswers[]>([]);
    const [validationStatus, setValidationStatus] = useState<ValidationState[]>([]);
    const [canAdvance, setCanAdvance] = useState(false);

    useEffect(() => {
        setUserAnswers(Array(data.length).fill({ adjective: '', comparative: '', superlative: '' }));
        setValidationStatus(Array(data.length).fill({ adjective: 'unchecked', comparative: 'unchecked', superlative: 'unchecked' }));
        setCanAdvance(false);
    }, [data]);

    const handleInputChange = (index: number, field: keyof UserAnswers, value: string) => {
        const newAnswers = [...userAnswers];
        if (!newAnswers[index]) {
            newAnswers[index] = { adjective: '', comparative: '', superlative: '' };
        }
        newAnswers[index] = { ...newAnswers[index], [field]: value };
        setUserAnswers(newAnswers);

        const newValidation = [...validationStatus];
        if (newValidation[index]?.[field] !== 'unchecked') {
            newValidation[index] = { ...newValidation[index], [field]: 'unchecked' };
            setValidationStatus(newValidation);
        }
        setCanAdvance(false);
    };

    const handleCheckAnswers = () => {
        let atLeastOneCorrect = false;
        const newValidationStatus: ValidationState[] = userAnswers.map((answer, index) => {
            const correctData = data[index].answers;
            const newRowStatus: ValidationState = { adjective: 'unchecked', comparative: 'unchecked', superlative: 'unchecked' };

            (Object.keys(correctData) as (keyof UserAnswers)[]).forEach(field => {
                const userAnswer = (answer ? answer[field] : '').trim().toLowerCase();
                const correctValue = correctData[field];
                let isCorrect = false;
                if (Array.isArray(correctValue)) {
                    isCorrect = correctValue.map(v => v.toLowerCase()).includes(userAnswer);
                } else {
                    isCorrect = userAnswer === correctValue.toLowerCase();
                }

                if (isCorrect) {
                    newRowStatus[field] = 'correct';
                    atLeastOneCorrect = true;
                } else {
                    newRowStatus[field] = 'incorrect';
                }
            });
            return newRowStatus;
        });

        setValidationStatus(newValidationStatus);

        if (atLeastOneCorrect) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvance(true);
        } else {
            toast({
                variant: 'destructive',
                title: "Sigue intentando",
                description: "Revisa tus respuestas. ¡Necesitas al menos una correcta para avanzar!",
            });
            setCanAdvance(false);
        }
    };

    const getInputClass = (status?: ValidationStatus) => {
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

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
                                <th className="p-2 text-left font-semibold text-muted-foreground">{columnHeaders.adjective}</th>
                                <th className="p-2 text-left font-semibold text-muted-foreground">{columnHeaders.comparative}</th>
                                <th className="p-2 text-left font-semibold text-muted-foreground">{columnHeaders.superlative}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2 font-medium">{item.spanish}</td>
                                    <td className="p-2">
                                        <Input
                                            value={userAnswers[index]?.adjective || ''}
                                            onChange={(e) => handleInputChange(index, 'adjective', e.target.value)}
                                            className={cn(getInputClass(validationStatus[index]?.adjective))}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={userAnswers[index]?.comparative || ''}
                                            onChange={(e) => handleInputChange(index, 'comparative', e.target.value)}
                                            className={cn(getInputClass(validationStatus[index]?.comparative))}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={userAnswers[index]?.superlative || ''}
                                            onChange={(e) => handleInputChange(index, 'superlative', e.target.value)}
                                            className={cn(getInputClass(validationStatus[index]?.superlative))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button onClick={handleCheckAnswers}>Verificar Respuestas</Button>
                <Button onClick={onComplete} disabled={!canAdvance}>Avanzar</Button>
            </CardFooter>
        </Card>
    );
}
