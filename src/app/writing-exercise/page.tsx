'use client';

import React, { useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const wordBank = ["a", "dad's", "going", "His", "in", "loves", "reading", "'s got", "taller", "than", "twice"];
const correctAnswers = ["'s got", "taller", "than", "His", "reading", "loves", "twice", "a", "in", "dad's", "going"];

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

export default function WritingExercisePage() {
    const { toast } = useToast();

    const [userAnswers, setUserAnswers] = useState<string[]>(Array(correctAnswers.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<ValidationStatus[]>(Array(correctAnswers.length).fill('unchecked'));

    const usedWords = useMemo(() => {
        const answers = userAnswers.map(answer => answer.trim().toLowerCase());
        return new Set(answers);
    }, [userAnswers]);

    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);

        // Auto-check logic
        const newValidationStatus = [...validationStatus];
        if (value.trim().toLowerCase() === correctAnswers[index].toLowerCase()) {
            newValidationStatus[index] = 'correct';
        } else {
            newValidationStatus[index] = 'incorrect';
        }
        setValidationStatus(newValidationStatus);
    };
    
    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus = userAnswers.map((answer, index) => {
            if (answer.trim().toLowerCase() === correctAnswers[index].toLowerCase()) {
                return 'correct';
            } else {
                allCorrect = false;
                return 'incorrect';
            }
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({
                title: "Excellent!",
                description: "All your answers are correct.",
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Review your answers",
                description: "Some answers are incorrect. Please check the red fields.",
            });
        }
    };
    
    const getInputClass = (status: ValidationStatus) => {
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    return (
        <div className="flex w-full flex-col min-h-screen">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
                <Card className="w-full max-w-3xl shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Writing about my family</CardTitle>
                        <CardDescription>Exercise 1</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-muted rounded-lg border">
                            <p className="text-sm text-muted-foreground">Complete the text below with the words in the box.</p>
                        </div>
                        <div className="p-4 border border-dashed rounded-lg flex flex-wrap gap-x-4 gap-y-2 justify-center">
                            {wordBank.map((word, index) => (
                                <span key={index} className={cn(
                                    "font-mono text-sm font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded transition-all",
                                    usedWords.has(word.toLowerCase()) && "line-through opacity-50"
                                )}>
                                    {word}
                                </span>
                            ))}
                        </div>
                        <div className="text-lg leading-relaxed space-y-2">
                           <p>
                                My brother is called John. He is 14 and he is a student. He
                                <Input value={userAnswers[0]} onChange={(e) => handleInputChange(0, e.target.value)} className={cn('inline-block w-24 mx-1 px-1 text-center', getInputClass(validationStatus[0]))} />
                                brown hair and green eyes. He is
                                <Input value={userAnswers[1]} onChange={(e) => handleInputChange(1, e.target.value)} className={cn('inline-block w-20 mx-1 px-1 text-center', getInputClass(validationStatus[1]))} />
                                <Input value={userAnswers[2]} onChange={(e) => handleInputChange(2, e.target.value)} className={cn('inline-block w-16 mx-1 px-1 text-center', getInputClass(validationStatus[2]))} />
                                me.
                                <Input value={userAnswers[3]} onChange={(e) => handleInputChange(3, e.target.value)} className={cn('inline-block w-16 mx-1 px-1 text-center', getInputClass(validationStatus[3]))} />
                                favourite hobby is
                                <Input value={userAnswers[4]} onChange={(e) => handleInputChange(4, e.target.value)} className={cn('inline-block w-24 mx-1 px-1 text-center', getInputClass(validationStatus[4]))} />
                                . He
                                <Input value={userAnswers[5]} onChange={(e) => handleInputChange(5, e.target.value)} className={cn('inline-block w-20 mx-1 px-1 text-center', getInputClass(validationStatus[5]))} />
                                fantasy books. He goes to the library
                                <Input value={userAnswers[6]} onChange={(e) => handleInputChange(6, e.target.value)} className={cn('inline-block w-16 mx-1 px-1 text-center', getInputClass(validationStatus[6]))} />
                                <Input value={userAnswers[7]} onChange={(e) => handleInputChange(7, e.target.value)} className={cn('inline-block w-12 mx-1 px-1 text-center', getInputClass(validationStatus[7]))} />
                                week. He's also
                                <Input value={userAnswers[8]} onChange={(e) => handleInputChange(8, e.target.value)} className={cn('inline-block w-12 mx-1 px-1 text-center', getInputClass(validationStatus[8]))} />
                                my
                                <Input value={userAnswers[9]} onChange={(e) => handleInputChange(9, e.target.value)} className={cn('inline-block w-20 mx-1 px-1 text-center', getInputClass(validationStatus[9]))} />
                                football team. He is
                                <Input value={userAnswers[10]} onChange={(e) => handleInputChange(10, e.target.value)} className={cn('inline-block w-20 mx-1 px-1 text-center', getInputClass(validationStatus[10]))} />
                                to be a great player.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleCheckAnswers}>Check Answers</Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
