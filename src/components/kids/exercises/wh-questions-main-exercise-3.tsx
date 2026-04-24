'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';

const exercisePrompts = [
    { spanish: "¿CUÁNDO VIAJAS A BARCELONA? – YO VIAJO EL PROXIMO MES", english: ["when do you travel to barcelona? i travel next month"] },
    { spanish: "¿QUIENES SON LOS GUNS AND ROSES? – ELLOS SON UNA BANDA DE ROCK", english: ["who are guns and roses? they are a rock band"] },
    { spanish: "¿POR QUÉ ESTAS CANSADO? – PORQUE YO TRABAJO Y ESTUDIO", english: ["why are you tired? because i work and study"] },
    { spanish: "¿DONDE TRABAJAN ELLOS? – ELLOS TRABAJAN EN INGLATERRA", english: ["where do they work? they work in england"] },
    { spanish: "¿QUIEN ES BRIAN ADAMS? – EL ES UN CANTANTE CANADIENSE", english: ["who is brian adams? he is a canadian singer"] },
    { spanish: "¿DONDE VIVE ELLA? – ELLA VIVE EN ITALIA", english: ["where does she live? she lives in italy"] },
    { spanish: "¿QUE HACEN ELLOS? – ELLOS TRABAJAN JUNTOS", english: ["what do they do? they work together"] },
    { spanish: "¿QUIERES UN HELADO? ¿CUAL HELADO TE GUSTA? (ENTRE ESTOS SABORES) YO QUIERO EL HELADO DE VAINILLA", english: ["do you want an ice cream? which ice cream do you like? i want the vanilla ice cream"] },
    { spanish: "¿QUIEN ES TU JEFE? – MI JEFE ES ESA MUJER, SU NOMBRE ES KATHERINE", english: ["who is your boss? my boss is that woman, her name is katherine"] },
    { spanish: "¿PORQUE ÉL VIAJA A MIAMI? – PORQUE EL TIENE UN FAMILIAR ALLÁ", english: ["why does he travel to miami? because he has a relative there"] },
    { spanish: "¿QUE TAN GRANDE ES CHARLY? - EL ES MUY PEQUEÑO", english: ["how big is charly? he is very small"]},
    { spanish: "¿CUÁNDO ESTAS EN LA CASA? – YO ESTOY EN CASA EL VIERNES", english: ["when are you at home? i am at home on friday"]},
    { spanish: "¿QUIEN ES TU HERMANO? – MI HERMANO ES CAMILO", english: ["who is your brother? my brother is camilo"]},
];


type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export function WhQuestionsMainExercise3({ onComplete }: { onComplete: () => void }) {
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
                    <p className="text-muted-foreground mt-2">Has dominado los ejercicios de WH Questions.</p>
                </CardContent>
            </Card>
        );
    }
    
    const currentPrompt = exercisePrompts[currentIndex];

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicio 3 Wh</CardTitle>
                 <CardDescription>Traduce las frases.</CardDescription>
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
