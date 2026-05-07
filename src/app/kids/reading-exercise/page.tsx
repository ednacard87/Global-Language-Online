'use client';

import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const texts = {
    step1: {
        title: "Sophie",
        content: "I moved to Canada last year with my family. My friends told me English is difficult to learn, but it’s easy for me. I take classes at a school to learn more. I also watch movies with English subtitles. People in Canada are very friendly. They say “thank you” and “sorry” a lot. I love going to the park and playing football in my free time.",
        questions: [
            { id: 'q1', question: "Where did Sophie move to?", answers: ["canada", "she moved to canada"] },
            { id: 'q2', question: "Is learning English difficult for her?", answers: ["no", "no, it isn't", "no, it is not"] },
            { id: 'q3', question: "What does she do in her free time?", answers: ["going to the park and playing football", "playing football and going to the park", "playing football", "going to the park"] }
        ]
    }
};

export default function KidsReadingExercisePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [isComplete, setIsComplete] = useState(false);

    const { user } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );

    const currentTextData = texts.step1;

    const handleInputChange = (questionId: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: value }));
        setValidationStatus(prev => ({ ...prev, [questionId]: 'unchecked' }));
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: Record<string, 'correct' | 'incorrect' | 'unchecked'> = {};

        currentTextData.questions.forEach(q => {
            const userAnswer = userAnswers[q.id]?.trim().toLowerCase().replace(/[.?]/g, '') || '';
            const correctAnswers = q.answers.map(a => a.toLowerCase());
            
            if (correctAnswers.includes(userAnswer)) {
                newValidationStatus[q.id] = 'correct';
            } else {
                newValidationStatus[q.id] = 'incorrect';
                allCorrect = false;
            }
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Correcto!", description: "Misión de lectura completada." });
            setIsComplete(true);
            if(studentDocRef) {
                updateDocumentNonBlocking(studentDocRef, { 'progress.kidsReadingProgress': 100 });
            }
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Revisa tus respuestas." });
        }
    };
    
    const getInputClass = (questionId: string) => {
        const status = validationStatus[questionId];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    return (
        <div className="flex w-full flex-col min-h-screen kids-page-container">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-6">
                    <div className="text-left">
                        <Button variant="ghost" onClick={() => router.back()} size="sm" className="text-white hover:bg-white/20 mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                        </Button>
                        <h1 className="text-4xl font-bold text-white">Misión de Lectura</h1>
                    </div>

                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/90 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{currentTextData.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg leading-relaxed">{currentTextData.content}</p>
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-bold text-xl">Preguntas</h3>
                                {currentTextData.questions.map(q => (
                                    <div key={q.id} className="grid gap-2">
                                        <Label htmlFor={q.id}>{q.question}</Label>
                                        <Input
                                            id={q.id}
                                            value={userAnswers[q.id] || ''}
                                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                                            className={cn(getInputClass(q.id))}
                                            autoComplete="off"
                                            disabled={isComplete}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        {!isComplete ? (
                            <CardFooter>
                                <Button onClick={handleCheckAnswers}>Verificar Misión</Button>
                            </CardFooter>
                        ) : (
                            <CardFooter className="flex flex-col items-center gap-4 border-t pt-6">
                                <div className="flex items-center gap-2 text-green-600 font-bold text-xl">
                                    <CheckCircle className="h-8 w-8" />
                                    <span>¡MISIÓN COMPLETADA!</span>
                                </div>
                                <Button onClick={() => router.push('/kids')} className="w-full">Volver al Centro de Misiones</Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}