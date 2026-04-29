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
        question: "How do you say 'Buenas tardes' in English?",
        options: ["Good morning", "Good afternoon", "Good evening"],
        correctAnswer: "Good afternoon"
    },
    {
        question: "Complete: 'They are ___ friends.'",
        options: ["my", "me", "I"],
        correctAnswer: "my"
    },
    {
        question: "How do you say 'Hasta luego' in English?",
        options: ["Goodbye", "See you soon", "See you later"],
        correctAnswer: "See you later"
    },
    {
        question: "Complete: 'My mother ___ a nurse.'",
        options: ["is", "are", "am"],
        correctAnswer: "is"
    },
    {
        question: "What is the nationality for someone from 'France'?",
        options: ["France", "French", "Francais"],
        correctAnswer: "French"
    },
    {
        question: "Completa la frase: '___ they your friends?'",
        options: ["Is", "Am", "Are"],
        correctAnswer: "Are"
    },
    {
        question: "Which sentence is correct?",
        options: ["Her sister are a doctor", "Her sister is a doctor", "Her sister am a doctor"],
        correctAnswer: "Her sister is a doctor"
    },
    {
        question: "Someone from 'Japan' is...",
        options: ["Japanish", "Japanese", "Japon"],
        correctAnswer: "Japanese"
    },
    {
        question: "'Good night' se usa como...",
        options: ["Saludo", "Despedida", "Ambos"],
        correctAnswer: "Despedida"
    },
    {
        question: "Which sentence is correct?",
        options: ["His car is red", "His car are red", "His car am red"],
        correctAnswer: "His car is red"
    },
];

export default function KidsQuiz2Page() {
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
                'progress.kidsQuiz2Progress': Math.round(finalScore)
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
             <div className="flex w-full flex-col min-h-screen kids-page-container">
                <DashboardHeader />
                <main className="flex-1 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md text-center shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle className="text-3xl">{t('kidsQuiz2.congratulations')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <Award className="h-20 w-20 mx-auto text-yellow-400" />
                            <p className="text-lg text-muted-foreground">{t('kidsQuiz2.yourScore')}:</p>
                            <p className="text-6xl font-bold">{Math.round(finalScore)}%</p>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button onClick={handleRestart} className="w-full">{t('kidsQuiz2.tryAgain')}</Button>
                            <Button variant="ghost" onClick={() => router.push('/intro')}>{t('kidsPage.backToKidsCourse')}</Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen kids-page-container">
            <DashboardHeader />
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-xl shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('kidsQuiz2.title')}</CardTitle>
                        <CardDescription>{t('kidsQuiz2.description')}</CardDescription>
                        <div className="pt-4">
                            <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} className="h-2" />
                            <p className="text-center text-sm text-muted-foreground mt-2">
                                {t('kidsQuiz2.question')} {currentQuestionIndex + 1} {t('kidsQuiz2.of')} {quizQuestions.length}
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
                            {currentQuestionIndex < quizQuestions.length - 1 ? t('kidsQuiz2.next') : t('kidsQuiz2.finish')}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
