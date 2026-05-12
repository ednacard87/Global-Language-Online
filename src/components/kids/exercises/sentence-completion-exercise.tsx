'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Trophy, Info } from 'lucide-react';

export type CompletionPrompt = {
    parts: string[]; // Segmentos de la frase que rodean a los espacios
    answers: string[]; // Respuestas correctas para cada espacio
};

interface SentenceCompletionExerciseProps {
    data: CompletionPrompt[];
    onComplete: () => void;
    title: string;
    description: string;
}

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export function SentenceCompletionExercise({ data, onComplete, title, description }: SentenceCompletionExerciseProps) {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    // userAnswers es un array de arrays (una entrada por cada blanco de cada frase)
    const [userAnswers, setUserAnswers] = useState<string[][]>(data.map(prompt => Array(prompt.answers.length).fill('')));
    const [validationStates, setValidationStates] = useState<ValidationStatus[]>(Array(data.length).fill('unchecked'));
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const handleInputChange = (blankIndex: number, value: string) => {
        const newAllAnswers = [...userAnswers];
        newAllAnswers[currentIndex][blankIndex] = value;
        setUserAnswers(newAllAnswers);

        if (validationStates[currentIndex] !== 'unchecked') {
            const newValidationStates = [...validationStates];
            newValidationStates[currentIndex] = 'unchecked';
            setValidationStates(newValidationStates);
        }
    };
    
    const handleFinalCheck = () => {
        let allSentencesCorrect = true;
        const newValidationStates = data.map((prompt, sIndex) => {
            const currentAnswers = userAnswers[sIndex];
            const isSentenceCorrect = prompt.answers.every((correctAnswer, bIndex) => {
                const userVal = (currentAnswers[bIndex] || '').trim().toLowerCase();
                const correctVal = correctAnswer.toLowerCase();
                // Si la respuesta correcta es vacía, el usuario puede dejarlo vacío o poner una 'x'
                if (correctVal === '') {
                    return userVal === '' || userVal === 'x' || userVal === '-';
                }
                return userVal === correctVal;
            });

            if (!isSentenceCorrect) {
                allSentencesCorrect = false;
            }
            return isSentenceCorrect ? 'correct' : 'incorrect';
        });

        setValidationStates(newValidationStates as ValidationStatus[]);

        if (allSentencesCorrect) {
            toast({ title: "¡Excelente!", description: "Has completado todas las frases correctamente." });
            setShowCompletionMessage(true);
            onComplete();
        } else {
            toast({ 
                variant: 'destructive', 
                title: "Algunas respuestas son incorrectas", 
                description: "Revisa las bolitas rojas y completa los espacios faltantes correctamente." 
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentIndex < data.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                handleFinalCheck();
            }
        }
    };
    
    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <p className="text-muted-foreground mt-2">Has dominado el uso del artículo determinado.</p>
                </CardContent>
            </Card>
        );
    }
    
    const currentPrompt = data[currentIndex];

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {data.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStates[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStates[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                            aria-label={`Ir a la frase ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="bg-primary/5 p-4 rounded-lg flex items-start gap-3 text-sm text-primary border border-primary/20">
                    <Info className="h-5 w-5 shrink-0" />
                    <p>Instrucciones: Escribe <strong>"THE"</strong> donde sea necesario. Si no se requiere artículo (generalización), deja el espacio en blanco o escribe una <strong>"x"</strong>.</p>
                </div>

                <div className="bg-muted p-8 rounded-xl border flex flex-wrap items-center gap-x-2 gap-y-4 text-xl font-medium leading-loose">
                    {currentPrompt.parts.map((text, idx) => (
                        <React.Fragment key={idx}>
                            <span>{text}</span>
                            {idx < currentPrompt.answers.length && (
                                <Input 
                                    value={userAnswers[currentIndex][idx]}
                                    onChange={(e) => handleInputChange(idx, e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className={cn(
                                        'inline-block w-24 h-10 text-center font-bold uppercase transition-all',
                                        validationStates[currentIndex] === 'correct' ? 'border-green-500 bg-green-50' : 
                                        validationStates[currentIndex] === 'incorrect' ? 'border-destructive bg-destructive/5' : 'border-primary/40 focus:border-primary'
                                    )}
                                    placeholder="___"
                                    autoComplete="off"
                                    autoCapitalize="none"
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Anterior
                 </Button>

                {currentIndex === data.length - 1 ? (
                     <Button onClick={handleFinalCheck}>
                         Verificar Todo
                     </Button>
                ) : (
                     <Button onClick={() => setCurrentIndex(p => Math.min(data.length - 1, p + 1))}>
                         Siguiente
                         <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                )}
            </CardFooter>
        </Card>
    );
}
