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
import { ArrowLeft, CheckCircle, RefreshCw, Trophy } from 'lucide-react';
import Image from 'next/image';

// Data for different listening exercises
const exercisesData = {
    part1: {
        title: 'Listening Intro',
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

type ExerciseKey = keyof typeof exercisesData;

function ListeningExercise({ exerciseKey }: { exerciseKey: ExerciseKey }) {
    const { toast } = useToast();
    const router = useRouter();
    const exercise = exercisesData[exerciseKey];
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(exercise.answers.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(exercise.answers.length).fill('unchecked'));
    const [isCompleted, setIsCompleted] = useState(false);
    const [allCorrect, setAllCorrect] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );

    const placeholders = ["Mark:", "Laura:", "Mark:", "Laura:", "Mark:"];

    useEffect(() => {
        handleReset();
    }, [exerciseKey]);

    const handleReset = () => {
        setUserAnswers(Array(exercise.answers.length).fill(''));
        setValidationStatus(Array(exercise.answers.length).fill('unchecked'));
        setIsCompleted(false);
        setAllCorrect(false);
    };

    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);

        if (validationStatus[index] !== 'unchecked') {
            const newValidation = [...validationStatus];
            newValidation[index] = 'unchecked';
            setValidationStatus(newValidation);
            setAllCorrect(false);
        }
    };
    
    const handleCheckAnswers = () => {
        const newValidationStatus = userAnswers.map((answer, index) => {
            const correctAnswers = exercise.answers[index];
            if (!correctAnswers || correctAnswers.length === 0 || correctAnswers[0] === '') return 'correct';
            
            const userAnswer = answer.trim().toLowerCase().replace(/[.,?]/g, '');

            const isCorrect = correctAnswers.some(correctAnswer => 
                correctAnswer.toLowerCase().replace(/[.,?]/g, '') === userAnswer
            );

            return isCorrect ? 'correct' : 'incorrect';
        });

        setValidationStatus(newValidationStatus);

        const areAllCorrect = newValidationStatus.every(status => status === 'correct');
        setAllCorrect(areAllCorrect);

        if (areAllCorrect) {
            toast({
                title: "¡Muy bien!",
                description: "Todas las frases están correctas. Ya puedes terminar.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Algunas respuestas son incorrectas",
                description: "Revisa los campos marcados en rojo.",
            });
        }
    };

    const handleFinish = () => {
        if (!allCorrect) return;

        setIsCompleted(true);
        if(studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, { 'progress.listeningProgress': 100 });
        }
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    };
    
    const getInputClass = (status: 'correct' | 'incorrect' | 'unchecked') => {
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };
    
    const handleAudioError = () => {
        toast({
            variant: 'destructive',
            title: 'Error de Audio',
            description: 'No se pudo cargar o reproducir el archivo de audio.',
        });
    }

    if (isCompleted) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">¡Felicitaciones!</CardTitle>
                    <CardDescription>Has completado el ejercicio de escucha con éxito.</CardDescription>
                </CardHeader>
                <CardContent className="text-center flex flex-col items-center gap-6">
                    <div className="relative h-48 w-48">
                        <Trophy className="h-full w-full text-yellow-400 animate-bounce" />
                    </div>
                    <p className="text-xl font-medium">¡Excelente trabajo! El progreso ha sido guardado.</p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reiniciar Práctica
                    </Button>
                    <Button onClick={() => router.push('/intro')} className="w-full sm:w-auto">
                        Volver al Laberinto
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{exercise.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <p className="text-muted-foreground">Escucha el audio y completa las oraciones.</p>
                    {exercise.audioSrc ? (
                        <audio controls src={exercise.audioSrc} onError={handleAudioError} className="w-full" />
                    ) : (
                        <div className="w-full h-10 flex items-center justify-center bg-muted rounded-md text-muted-foreground">
                            Audio no disponible para esta parte.
                        </div>
                    )}
                </div>
                <div className="space-y-3 pt-2">
                    {userAnswers.map((_, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <Label htmlFor={`answer-${index}`} className="w-16 text-right shrink-0 font-medium">{placeholders[index]}</Label>
                            <span className="font-bold">=</span>
                            <Input
                                id={`answer-${index}`}
                                placeholder="Escribe lo que escuchas..."
                                value={userAnswers[index]}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                className={cn("text-lg", getInputClass(validationStatus[index]))}
                                autoComplete="off"
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-6">
                <Button onClick={handleCheckAnswers} variant="secondary">Verificar</Button>
                {allCorrect && (
                    <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 animate-in slide-in-from-right-4 duration-300">
                        Terminar
                        <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function ListeningPracticePage() {
    const router = useRouter();

    return (
        <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                         <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/20">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <h1 className="text-4xl font-bold text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Práctica de Escucha y Escritura</h1>
                    </div>
                    
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-4">
                            <div className="sticky top-24 space-y-4">
                                <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/90 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle>Helpful Questions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                       <ul className="space-y-3 text-sm">
                                            <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Can you repeat slowly, please?</li>
                                            <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Can you repeat again, please?</li>
                                            <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Can you speak slowly, please?</li>
                                            <li className="flex gap-2"><span className="font-bold text-primary">4.</span> How do you say in Spanish: _____?</li>
                                            <li className="flex gap-2"><span className="font-bold text-primary">5.</span> How do you say in English: ______?</li>
                                            <li className="flex gap-2"><span className="font-bold text-primary">6.</span> How do you spell: _________?</li>
                                            <li className="flex gap-2"><span className="font-bold text-primary">7.</span> Is it correct?</li>
                                        </ul>
                                    </CardContent>
                                     <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                                        <h4 className="font-bold text-primary uppercase text-xs tracking-wider">Expression</h4>
                                        <p className="text-sm font-medium">
                                            Espérame / Dame un momento = <span className="text-primary font-bold">HOLD ON</span>
                                        </p>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>

                        <div className="md:col-span-8">
                           <ListeningExercise exerciseKey={'part1'} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
