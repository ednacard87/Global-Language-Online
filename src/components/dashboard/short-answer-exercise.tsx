'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import { Label } from '@/components/ui/label';

const exercisePrompts = [
    { question: 'IS HE YOUNG?', spanishHint: '(¿EL ES JOVEN?)', answers: { shortAffirmative: ["he is"], shortNegative: ["he is not", "he isn't"] } },
    { question: 'IS SHE YOUR MOTHER?', spanishHint: '', answers: { shortAffirmative: ["she is"], shortNegative: ["she is not", "she isn't"] } },
    { question: 'IS HE YOUR HUSBAND?', spanishHint: '', answers: { shortAffirmative: ["he is"], shortNegative: ["he is not", "he isn't"] } },
    { question: 'ARE THEY HERE?', spanishHint: '', answers: { shortAffirmative: ["they are"], shortNegative: ["they are not", "they aren't"] } },
    { question: 'ARE YOU WORRIED?', spanishHint: '(PREOCUPADO)', answers: { shortAffirmative: ["i am"], shortNegative: ["i am not", "i'm not"] } },
    { question: 'IS SHE TALL?', spanishHint: '(ALTO)', answers: { shortAffirmative: ["she is"], shortNegative: ["she is not", "she isn't"] } },
    { question: 'ARE YOU SICK?', spanishHint: '(ENFERMO)', answers: { shortAffirmative: ["i am"], shortNegative: ["i am not", "i'm not"] } },
    { question: 'ARE THEY TIRED?', spanishHint: '(CANSADO)', answers: { shortAffirmative: ["they are"], shortNegative: ["they are not", "they aren't"] } },
    { question: 'IS HE AT HOME?', spanishHint: '', answers: { shortAffirmative: ["he is"], shortNegative: ["he is not", "he isn't"] } },
    { question: 'ARE YOU IN MEDELLIN?', spanishHint: '', answers: { shortAffirmative: ["i am"], shortNegative: ["i am not", "i'm not"] } },
];

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';
type AnswerFields = 'shortAffirmative' | 'shortNegative';

export function ShortAnswerExercise({ onComplete }: { onComplete?: () => void }) {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({ shortAffirmative: '', shortNegative: '' });
    const [validation, setValidation] = useState<Record<AnswerFields, ValidationStatus>>({ shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
    const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const totalPrompts = exercisePrompts.length;
    const currentPrompt = exercisePrompts[currentIndex];

    useEffect(() => {
        setAnswers({ shortAffirmative: '', shortNegative: '' });
        setValidation({ shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
        setIsCurrentCorrect(false);
    }, [currentIndex]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
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
                <CardTitle>Ejercicio 5: Respuestas Cortas</CardTitle>
                <CardDescription>Completa las respuestas cortas para cada pregunta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Pregunta ({currentIndex + 1}/{totalPrompts})</p>
                    <p className="text-xl font-bold p-3 bg-muted rounded-md">{currentPrompt.question} <span className="text-base font-normal text-muted-foreground">{currentPrompt.spanishHint}</span></p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Label htmlFor="shortAffirmative" className="w-20 font-semibold">Yes,</Label>
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
                        <Label htmlFor="shortNegative" className="w-20 font-semibold">No,</Label>
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