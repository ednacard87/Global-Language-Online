'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface DialogueLine {
    speaker: string;
    parts: string[];
    answers: string[][]; // Each blank can have multiple correct answers
}

interface DialogueCompletionExerciseProps {
    title: string;
    description: string;
    dialogue: DialogueLine[];
    onComplete: () => void;
}

export function DialogueCompletionExercise({ title, description, dialogue, onComplete }: DialogueCompletionExerciseProps) {
    const { toast } = useToast();
    
    // Flatten all blanks into a single array for easier management
    const allBlanks = useMemo(() => {
        const blanks: { lineIndex: number; blankIndex: number; correctAnswers: string[] }[] = [];
        dialogue.forEach((line, lIdx) => {
            line.answers.forEach((ans, bIdx) => {
                blanks.push({ lineIndex: lIdx, blankIndex: bIdx, correctAnswers: ans });
            });
        });
        return blanks;
    }, [dialogue]);

    const [userAnswers, setUserAnswers] = useState<string[]>(Array(allBlanks.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(allBlanks.length).fill('unchecked'));
    const [isComplete, setIsComplete] = useState(false);

    const handleInputChange = (globalIndex: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[globalIndex] = value;
        setUserAnswers(newAnswers);

        const newValidation = [...validationStatus];
        newValidation[globalIndex] = 'unchecked';
        setValidationStatus(newValidation);
    };

    const handleCheck = () => {
        let allCorrect = true;
        const newValidation = allBlanks.map((blank, index) => {
            const userVal = userAnswers[index].trim().toLowerCase();
            const isCorrect = blank.correctAnswers.some(ans => ans.toLowerCase() === userVal);
            if (!isCorrect) allCorrect = false;
            return isCorrect ? 'correct' : 'incorrect';
        });

        setValidationStatus(newValidation as any);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Has completado el diálogo correctamente." });
            setIsComplete(true);
        } else {
            toast({ variant: 'destructive', title: "Algunas respuestas son incorrectas", description: "Revisa los campos marcados en rojo." });
        }
    };

    const getGlobalIndex = (lineIdx: number, blankIdx: number) => {
        let count = 0;
        for (let i = 0; i < lineIdx; i++) {
            count += dialogue[i].answers.length;
        }
        return count + blankIdx;
    };

    if (isComplete) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <Trophy className="h-20 w-20 text-yellow-400 mb-6 animate-bounce" />
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text">¡Diálogo Completado!</h2>
                    <p className="text-muted-foreground mt-2 mb-8">Has dominado el uso de demostrativos y "one/ones" en contexto.</p>
                    <Button onClick={onComplete} size="lg" className="font-bold px-12">Continuar</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border">
                    {dialogue.map((line, lIdx) => (
                        <div key={lIdx} className="flex gap-2 items-baseline text-base sm:text-lg flex-wrap leading-relaxed">
                            <span className="font-black text-primary shrink-0 min-w-[70px]">{line.speaker}:</span>
                            {line.parts.map((part, pIdx) => (
                                <React.Fragment key={pIdx}>
                                    <span>{part}</span>
                                    {pIdx < line.answers.length && (
                                        <Input
                                            value={userAnswers[getGlobalIndex(lIdx, pIdx)]}
                                            onChange={(e) => handleInputChange(getGlobalIndex(lIdx, pIdx), e.target.value)}
                                            className={cn(
                                                "w-28 h-8 inline-block text-center font-bold uppercase transition-all",
                                                validationStatus[getGlobalIndex(lIdx, pIdx)] === 'correct' && "border-green-500 bg-green-50 focus-visible:ring-green-500",
                                                validationStatus[getGlobalIndex(lIdx, pIdx)] === 'incorrect' && "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                                            )}
                                            placeholder="..."
                                            autoComplete="off"
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheck} className="w-full h-12 text-lg font-bold">Verificar Diálogo</Button>
            </CardFooter>
        </Card>
    );
}
