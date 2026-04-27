'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

const exerciseData = [
    { adjective: 'GOOD', comparative: 'better', superlative: 'the best', missing: 'comparative' },
    { adjective: 'OLD', comparative: 'older', superlative: 'the oldest', missing: 'comparative' },
    { adjective: 'BEAUTIFUL', comparative: 'more beautiful', superlative: 'the most beautiful', missing: 'comparative' },
    { adjective: 'HAPPY', comparative: 'happier', superlative: 'the happiest', missing: 'superlative' },
    { adjective: 'SAD', comparative: 'sadder', superlative: 'the saddest', missing: 'comparative' },
    { adjective: 'INTERESTING', comparative: 'more interesting', superlative: 'the most interesting', missing: 'superlative' },
    { adjective: 'FAT', comparative: 'fatter', superlative: 'the fattest', missing: 'superlative' },
    { adjective: 'NICE', comparative: 'nicer', superlative: 'the nicest', missing: 'comparative' },
    { adjective: 'INTELLIGENT', comparative: 'more intelligent', superlative: 'the most intelligent', missing: 'comparative' },
    { adjective: 'SILLY', comparative: 'sillier', superlative: 'the silliest', missing: 'superlative' },
    { adjective: 'EASY', comparative: 'easier', superlative: 'the easiest', missing: 'comparative' },
    { adjective: 'BAD', comparative: 'worse', superlative: 'the worst', missing: 'superlative' },
    { adjective: 'LAZY', comparative: 'lazier', superlative: 'the laziest', missing: 'comparative' },
    { adjective: 'EXPENSIVE', comparative: 'more expensive', superlative: 'the most expensive', missing: 'comparative' },
];

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export function MixedComparativeSuperlativeExercise({ onComplete }: { onComplete: () => void }) {
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(exerciseData.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<ValidationStatus[]>(Array(exerciseData.length).fill('unchecked'));
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);

        const newValidation = [...validationStatus];
        if (newValidation[index] !== 'unchecked') {
            newValidation[index] = 'unchecked';
            setValidationStatus(newValidation);
        }
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus = exerciseData.map((item, index) => {
            const userAnswer = userAnswers[index].trim().toLowerCase();
            const correctAnswer = item[item.missing as keyof typeof item].toLowerCase();
            const isCorrect = userAnswer === correctAnswer;
            if (!isCorrect) {
                allCorrect = false;
            }
            return isCorrect ? 'correct' : 'incorrect';
        });
        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Todas tus respuestas son correctas." });
            setShowCompletionMessage(true);
            onComplete();
        } else {
            toast({
                variant: 'destructive',
                title: "Algunas respuestas son incorrectas",
                description: "Por favor, revisa los campos marcados en rojo.",
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
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicio Mixtos</CardTitle>
                <CardDescription>Pon el comparativo o el superlativo que falte.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left font-semibold text-muted-foreground">ADJETIVO</th>
                                <th className="p-2 text-left font-semibold text-muted-foreground">COMPARATIVO</th>
                                <th className="p-2 text-left font-semibold text-muted-foreground">SUPERLATIVO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exerciseData.map((item, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2 font-medium">{item.adjective}</td>
                                    <td className="p-2">
                                        {item.missing === 'comparative' ? (
                                            <Input
                                                value={userAnswers[index]}
                                                onChange={(e) => handleInputChange(index, e.target.value)}
                                                className={cn(getInputClass(validationStatus[index]))}
                                            />
                                        ) : (
                                            item.comparative
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {item.missing === 'superlative' ? (
                                            <Input
                                                value={userAnswers[index]}
                                                onChange={(e) => handleInputChange(index, e.target.value)}
                                                className={cn(getInputClass(validationStatus[index]))}
                                            />
                                        ) : (
                                            item.superlative
                                        )}
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
