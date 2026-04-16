'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Award } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

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

    if (quizFinished) {
        const finalScore = (score / quizQuestions.length) * 100;
        return (
             <div className="flex w-full flex-col min-h-screen">
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
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-xl shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('kidsQuiz1.title')}</CardTitle>
                        <CardDescription>{t('kidsQuiz1.description')}</CardDescription>
                        <div className="pt-4">
                            <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} className="h-2" />
                            <p className="text-center text-sm text-muted-foreground mt-2">
                                {t('kidsQuiz1.question')} {currentQuestionIndex + 1} {t('kidsQuiz1.of')} {quizQuestions.length}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 min-h-[250px]">
                        <p className="text-center text-2xl font-semibold h-16">{currentQuestion.question}</p>
                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.options.map(option => {
                                const isSelected = selectedAnswer === option;
                                const isCorrect = currentQuestion.correctAnswer === option;
                                
                                return (
                                    <Button
                                        key={option}
                                        onClick={() => handleAnswerSelect(option)}
                                        disabled={isAnswered}
                                        variant="outline"
                                        className={cn(
                                            "h-14 text-lg justify-start p-4",
                                            isAnswered && isCorrect && "bg-green-500/20 border-green-500 text-foreground",
                                            isAnswered && isSelected && !isCorrect && "bg-destructive/20 border-destructive text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span>{option}</span>
                                            {isAnswered && isSelected && !isCorrect && <X className="h-6 w-6 text-destructive" />}
                                            {isAnswered && isCorrect && <Check className="h-6 w-6 text-green-500" />}
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleNext} disabled={!isAnswered} className="w-full">
                            {currentQuestionIndex < quizQuestions.length - 1 ? t('kidsQuiz1.next') : t('kidsQuiz1.finish')}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
