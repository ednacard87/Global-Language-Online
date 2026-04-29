'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Award, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

const quizQuestions = [
    {
        question: "¿Qué viene después de 'em'?",
        options: ["en", "el", "ou"],
        correctAnswer: "en"
    },
    {
        question: "How do you write the number 'three'?",
        options: ["3", "2", "4"],
        correctAnswer: "3"
    },
    {
        question: "Completa la frase: 'She ___ my sister.'",
        options: ["is", "are", "am"],
        correctAnswer: "is"
    },
    {
        question: "El posesivo para 'de él' es...",
        options: ["her", "his", "their"],
        correctAnswer: "his"
    },
    {
        question: "Completa la frase: 'They ___ doctors.'",
        options: ["is", "are", "am"],
        correctAnswer: "are"
    },
    {
        question: "¿Cuál es la pronunciación de la letra 'A'?",
        options: ["ei", "ai", "i"],
        correctAnswer: "ei"
    },
    {
        question: "¿Cómo se escribe 'twenty' en números?",
        options: ["20", "12", "2"],
        correctAnswer: "20"
    },
    {
        question: "Completa la frase: 'I ___ a student.'",
        options: ["am", "is", "are"],
        correctAnswer: "am"
    },
    {
        question: "El posesivo para 'de ella' es...",
        options: ["his", "her", "their"],
        correctAnswer: "her"
    },
    {
        question: "Completa la frase: 'We ___ friends.'",
        options: ["is", "are", "am"],
        correctAnswer: "are"
    },
];

export default function KidsQuiz1Page() {
    const { t } = useTranslation();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const currentQuestion = quizQuestions[currentQuestionIndex];

    const handleAnswerSelect = (answer: string) => {
        if (isAnswered) return;

        setSelectedAnswer(answer);
        setIsAnswered(true);

        if (answer === currentQuestion.correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setIsAnswered(false);
            setSelectedAnswer(null);
        } else {
            handleFinishQuiz();
        }
    };
    
    const handleFinishQuiz = () => {
        const finalScore = (score / quizQuestions.length) * 100;
        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                'progress.kidsQuiz1Progress': Math.round(finalScore)
            });
        }
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        setQuizFinished(true);
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setQuizFinished(false);
    };

    const handleUnlockNext = async () => {
        if (!studentDocRef) return;
        setIsLoading(true);
        const progressKey = `quiz1Progress`;
        await updateDocumentNonBlocking(studentDocRef, { [`progress.${progressKey}`]: 100 });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        router.push('/intro/2');
        setIsLoading(false);
    };

    if (quizFinished) {
        const finalScore = (score / quizQuestions.length) * 100;
        return (
             <div className="flex w-full flex-col min-h-screen kids-page-container">
                <DashboardHeader />
                <main className="flex-1 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md text-center shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle className="text-3xl">{t('kidsQuiz1.congratulations')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <Award className="h-20 w-20 mx-auto text-yellow-400" />
                            <p className="text-lg text-muted-foreground">{t('kidsQuiz1.yourScore')}:</p>
                            <p className="text-6xl font-bold">{Math.round(finalScore)}%</p>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button onClick={handleRestart} className="w-full">{t('kidsQuiz1.tryAgain')}</Button>
                            <Button variant="ghost" onClick={() => router.push('/intro')}>{t('kidsPage.backToKidsCourse')}</Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
                <Card className="w-full max-w-lg shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold">Wayground</CardTitle>
                        <CardDescription className='pt-2'>Preparado para tu quiz</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                        <p>Haz clic en el enlace para realizar tu quiz.</p>
                        <Button asChild>
                            <Link href="https://wayground.com/admin" target="_blank" rel="noopener noreferrer">
                                Ir a Wayground
                            </Link>
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col items-center justify-center gap-4 pt-6 border-t">
                        <Button onClick={handleUnlockNext} disabled={isLoading} className="w-full max-w-sm mx-auto">
                            {isLoading ? <Loader2 className="animate-spin" /> : "Desbloquear Intro 2"}
                        </Button>
                        <Button variant="ghost" onClick={() => router.push('/intro')}>Volver al Laberinto</Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
