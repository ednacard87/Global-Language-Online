'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';

const exercisePrompts = [
    { spanish: "MI CASA ES LA MAS GRANDE DE MI BARRIO", english: ["my house is the biggest in my neighborhood"] },
    { spanish: "ESTA CASA ES LA MAS PEQUEÑA DE SU BARRIO (DE ELLA)", english: ["this house is the smallest in her neighborhood"] },
    { spanish: "SOY EL MAS ALTO DEL SALON DE CLASE", english: ["i am the tallest in the classroom"] },
    { spanish: "PETER ES EL MAS VIEJO DE LA PELICULA", english: ["peter is the oldest in the movie"] },
];

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export function SuperlativeExercise({ onComplete }: { onComplete: () => void }) {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(exercisePrompts.length).fill(''));
    const [validationStates, setValidationStates] = useState<ValidationStatus[]>(Array(exercisePrompts.length).fill('unchecked'));
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const handleAnswerChange = (value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentIndex] = value;
        setUserAnswers(newAnswers);

        if (validationStates[currentIndex] !== 'unchecked') {
            const newValidationStates = [...validationStates];
            newValidationStates[currentIndex] = 'unchecked';
            setValidationStates(newValidationStates);
        }
    };
    
    const handleFinalCheck = () => {
        let allCorrect = true;
        const newValidationStates = exercisePrompts.map((prompt, index) => {
            const userAnswer = userAnswers[index]?.trim().toLowerCase().replace(/[.?,]/g, '') || '';
            const correctAnswers = prompt.english.map(a => a.toLowerCase().replace(/[.?]/g, ''));
            const isCorrect = correctAnswers.includes(userAnswer);
            if (!isCorrect) {
                allCorrect = false;
            }
            return isCorrect ? 'correct' : 'incorrect';
        });
        setValidationStates(newValidationStates);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Todas tus respuestas son correctas." });
            setShowCompletionMessage(true);
            onComplete();
        } else {
            toast({ 
                variant: 'destructive', 
                title: "Algunas respuestas son incorrectas", 
                description: "Revisa las bolitas rojas y corrige tus respuestas." 
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentIndex < exercisePrompts.length - 1) {
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
                    <p className="text-muted-foreground mt-2">Has dominado los ejercicios de superlativos.</p>
                </CardContent>
            </Card>
        );
    }
    
    const currentPrompt = exercisePrompts[currentIndex];

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicio Superlativo</CardTitle>
                 <CardDescription>Traduce las frases usando adjetivos superlativos.</CardDescription>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {exercisePrompts.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStates[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStates[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                            aria-label={`Ir al ejercicio ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Frase a traducir:</h3>
                     <div className="bg-muted p-4 rounded-lg border">
                        <p className="text-lg font-medium">{currentPrompt?.spanish}</p>
                     </div>
                </div>
                <div>
                    <Input 
                        value={userAnswers[currentIndex] || ''}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            'text-lg',
                            validationStates[currentIndex] === 'correct' ? 'border-green-500' : 
                            validationStates[currentIndex] === 'incorrect' ? 'border-destructive' : ''
                        )}
                        placeholder="Escribe la traducción aquí..."
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                 <Button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Anterior
                 </Button>

                {currentIndex === exercisePrompts.length - 1 ? (
                     <Button onClick={handleFinalCheck}>
                         Verificar Todo
                     </Button>
                ) : (
                     <Button onClick={() => setCurrentIndex(p => Math.min(exercisePrompts.length - 1, p + 1))}>
                         Siguiente
                         <ArrowRight className="ml-2 h-4 w-4" />
                     </Button>
                )}
            </CardFooter>
        </Card>
    );
}
