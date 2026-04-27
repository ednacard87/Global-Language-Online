'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

const correctAnswers = [
    "more convenient",
    "the worst",
    "more expensive",
    "the best",
    "better",
    "drier",
    "cheaper",
    "quieter",
    "the most beautiful",
    "better"
];

export function HolidayTextExercise({ onComplete }: { onComplete: () => void }) {
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(correctAnswers.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(correctAnswers.length).fill('unchecked'));
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
        const newValidationStatus = userAnswers.map((answer, index) => {
            const isCorrect = answer.trim().toLowerCase() === correctAnswers[index].toLowerCase();
            if (!isCorrect) allCorrect = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Has completado el texto correctamente." });
            setShowCompletionMessage(true);
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

    const textParts = [
        "JAMES: I’M GOING SKIING NEXT WEEK.\nTINA: I’D LOVE TO HAVE A HOLIDAY IN NOVEMBER, BUT MY CHILDREN ARE AT SCHOOL NOW, SO IT’S ",
        " (CONVENIENT) FOR THEM TO GO DURING THE SCHOOL HOLIDAYS. I KNOW IT’S PROBABLY ",
        " (BAD) TIME TO GO ON HOLIDAY, BECAUSE EVERYBODY ELSE IS GOING TOO AND THE HOTEL PRICES ARE ",
        " (EXPENSIVE) THAN NOW.\nJAMES: I KNOW, BUT THE CHRISTMAS HOLIDAY IS ALSO ",
        " (GOOD) TIME FOR THE SKIING RESORTS. IF YOU WANT TO MAKE A LOT OF FRIENDS, IT’S ",
        " (GOOD) TO GO IN DECEMBER THAN IN NOVEMBER.\nTINA: MY FAVORITE TIME FOR GOING ON HOLIDAY IS SEPTEMBER. THE WEATHER IS ",
        " (DRY) THAN IN OCTOBER AND EVERYTHING IS ",
        " (CHEAP) AND ",
        " (QUIET) THAN IN AUGUST, ESPECIALLY IF YOU WANT TO GO TO THE BEACH. I THINK SEPTEMBER IS ",
        " (BEAUTIFUL) MONTH OF THE YEAR.\nJAMES: I AGREE WITH YOU. IT’S DEFINITELY MUCH ",
        " (GOOD) TO GO IN SEPTEMBER THAN AT HOLIDAY, WHEN EVERYBODY ELSE IS WORKING!"
    ];

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Mixtos 2: Holidays</CardTitle>
                <CardDescription>Completa el texto con la forma comparativa o superlativa correcta del adjetivo entre paréntesis.</CardDescription>
            </CardHeader>
            <CardContent className="text-lg leading-relaxed space-y-2">
                 <p className='whitespace-pre-wrap'>
                    {textParts.map((part, index) => (
                        <React.Fragment key={index}>
                            {part}
                            {index < correctAnswers.length && (
                                <Input
                                    value={userAnswers[index]}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className={cn('inline-block w-40 mx-1 px-1 text-center', getInputClass(validationStatus[index]))}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </p>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>Verificar y Completar</Button>
            </CardFooter>
        </Card>
    );
}
