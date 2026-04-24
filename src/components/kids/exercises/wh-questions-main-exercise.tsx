'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';

const exercisePrompts = [
    { spanish: "¿DÓNDE ESTÁN TUS PADRES? ELLOS ESTAN EN SU CASA", english: ["where are your parents? they are at home"] },
    { spanish: "¿QUÉ QUIERES COMER? QUIERO COMER UNA HAMBURGUESA CON PAPAS FRITAS", english: ["what do you want to eat? i want to eat a hamburger with fries"] },
    { spanish: "¿QUIÉNES SON ELLOS? ELLOS SON MIS VECINOS", english: ["who are they? they are my neighbors"] },
    { spanish: "¿CUÁNDO VA ELLA A ITALIA? ELLA TIENE SU VIAJE EL LUNES", english: ["when does she go to italy? she has her trip on monday"] },
    { spanish: "¿QUE TAN ALTO ES EL? EL ES MUY ALTO", english: ["how tall is he? he is very tall"] },
    { spanish: "¿QUÉ TIPO DE PELÍCULAS TE GUSTA? ME GUSTAN LAS PELICULAS DE CIENCIA FICCIÓN", english: ["what kind of movies do you like? i like science fiction movies"] },
    { spanish: "¿CUÁL CARRO TE GUSTA? (ENTRE ESTOS 4)- ME GUSTA EL GRIS", english: ["which car do you like? i like the gray one"] },
    { spanish: "¿CUANTOS AÑOS TIENES? YO TENGO 25 AÑOS", english: ["how old are you? i am 25 years old"] },
    { spanish: "¿DÓNDE TRABAJAS? TRABAJO EN LA CASA", english: ["where do you work? i work at home"] },
    { spanish: "¿QUIÉN ES TU CANTANTE FAVORITO? MI CANTANTE FAVORITO ES SHAKIRA", english: ["who is your favorite singer? my favorite singer is shakira"] },
    { spanish: "¿QUIÉN ES ESE HOMBRE? EL ES EL JEFE DE THOMAS", english: ["who is that man? he is thomas' boss", "who is that man? he is thomas's boss"] },
    { spanish: "¿QUÉ TIPO DE CAMISETA TE GUSTA? NO ME GUSTAN LAS CAMISETAS, ME GUSTAN LAS CAMISAS", english: ["what kind of t-shirt do you like? i don't like t-shirts, i like shirts", "what kind of t-shirt do you like? i do not like t-shirts, i like shirts"] },
    { spanish: "¿DE DONDE ERES? – YO SOY DE ITALIA", english: ["where are you from? i am from italy"] },
    { spanish: "¿POR QUÉ EL ESTA ENOJADO? PORQUE ÉL TRABAJA ESTE FINDE", english: ["why is he angry? because he works this weekend"] },
    { spanish: "¿QUÉ BEBES? BEBO AGUA PORQUE NO PUEDO TOMAR GASEOSA", english: ["what do you drink? i drink water because i can't drink soda", "what do you drink? i drink water because i cannot drink soda"] },
    { spanish: "¿CUANTOS AÑOS TIENE SU HIJA? – (De él) ELLA TIENE 6 AÑOS", english: ["how old is his daughter? she is 6 years old"] },
    { spanish: "¿CUÁNDO ESTUDIAS INGLES? YO ESTUDIO INGLES LOS LUNES, MIERCOLES Y VIERNES", english: ["when do you study english? i study english on mondays, wednesdays and fridays"] },
    { spanish: "¿QUE TAN GRANDE ES CHARLY? - EL ES MUY PEQUEÑO", english: ["how big is charly? he is very small"] },
    { spanish: "¿CUÁNDO ESTAS EN LA CASA? – YO ESTOY EN CASA EL VIERNES", english: ["when are you at home? i am at home on friday"] },
    { spanish: "¿QUIEN ES TU HERMANO? – MI HERMANO ES CAMILO", english: ["who is your brother? my brother is camilo"] },
];


type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export function WhQuestionsMainExercise({ onComplete }: { onComplete: () => void }) {
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
                <CardTitle>Ejercicios Wh Questions</CardTitle>
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
