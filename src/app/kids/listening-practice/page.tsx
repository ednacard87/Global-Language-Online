'use client';

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';

const exercisesData = {
    part1: {
        title: 'Listening Intro (Kids)',
        audioSrc: '/Audio/Listening0/Intro - Countries and Nationalities -.mp3',
        answers: [
            ["where are you from laura?"],
            [
                "well my whole family is in the united states now but we are from costa rica originally", 
                "well my whole family is in the united states now but we're from costa rica originally"
            ],
            [
                "oh so you are from south america",
                "oh so you're from south america"
            ],
            [
                "actually costa rica is not in south america it is in central america",
                "actually costa rica isn't in south america it is in central america",
                "actually costa rica is not in south america it's in central america",
                "actually costa rica isn't in south america it's in central america"
            ],
            [
                "all right my geography is not very good",
                "all right my geography isn't very good"
            ]
        ]
    }
};

export default function KidsListeningPracticePage() {
    const { toast } = useToast();
    const router = useRouter();
    const exercise = exercisesData.part1;
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(exercise.answers.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(exercise.answers.length).fill('unchecked'));
    const [isCompleted, setIsCompleted] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );

    const placeholders = ["Mark:", "Laura:", "Mark:", "Laura:", "Mark:"];

    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);

        if (validationStatus[index] !== 'unchecked') {
            const newValidation = [...validationStatus];
            newValidation[index] = 'unchecked';
            setValidationStatus(newValidation);
        }
    };
    
    const handleCheckAnswers = () => {
        const newValidationStatus = userAnswers.map((answer, index) => {
            const correctAnswers = exercise.answers[index];
            const userAnswer = answer.trim().toLowerCase().replace(/[.,?]/g, '');
            const isCorrect = correctAnswers.some(correctAnswer => 
                correctAnswer.toLowerCase().replace(/[.,?]/g, '') === userAnswer
            );
            return isCorrect ? 'correct' : 'incorrect';
        });

        setValidationStatus(newValidationStatus);
        const allCorrect = newValidationStatus.every(status => status === 'correct');

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Todas tus respuestas son correctas." });
            setIsCompleted(true);
            if(studentDocRef) {
                updateDocumentNonBlocking(studentDocRef, { 'progress.kidsListeningProgress': 100 });
            }
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        } else {
            toast({ variant: "destructive", title: "Algunas respuestas son incorrectas" });
        }
    };
    
    const getInputClass = (status: 'correct' | 'incorrect' | 'unchecked') => {
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    if (isCompleted) {
        return (
            <div className="flex w-full flex-col min-h-screen kids-page-container">
                <DashboardHeader />
                <main className="flex-1 p-4 flex items-center justify-center">
                    <Card className="w-full max-w-md text-center shadow-soft rounded-lg border-2 border-brand-purple bg-card/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>¡Misión de Escucha Completada!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">¡Excelente trabajo! Has ganado tus puntos de misión.</p>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button onClick={() => router.push('/kids')}>Volver al Centro de Misiones</Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen kids-page-container">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-left">
                        <Button variant="ghost" onClick={() => router.back()} size="sm" className="text-white hover:bg-white/20 mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                        </Button>
                        <h1 className="text-4xl font-bold text-white mb-2">Misión de Escucha</h1>
                    </div>

                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{exercise.title}</CardTitle>
                            <CardDescription>Escucha el audio y completa el diálogo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <audio controls src={exercise.audioSrc} className="w-full" />
                            <div className="space-y-3 pt-2">
                                {userAnswers.map((_, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <Label htmlFor={`answer-${index}`} className="w-16 text-right shrink-0 font-bold">{placeholders[index]}</Label>
                                        <Input
                                            id={`answer-${index}`}
                                            placeholder="Escribe lo que escuchas..."
                                            value={userAnswers[index]}
                                            onChange={(e) => handleInputChange(index, e.target.value)}
                                            className={cn(getInputClass(validationStatus[index]))}
                                            autoComplete="off"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleCheckAnswers}>Verificar Misión</Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}