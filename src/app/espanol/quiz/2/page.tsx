'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Award, ArrowRight } from 'lucide-react';
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
        question: "¿Cómo se dice 'Good afternoon' en español?",
        options: ["Buenos días", "Buenas tardes", "Buenas noches"],
        correctAnswer: "Buenas tardes"
    },
    {
        question: "¿Qué número representa 'Once' en español?",
        options: ["1", "11", "12"],
        correctAnswer: "11"
    },
    {
        question: "Si son las '2:30', en español decimos...",
        options: ["Son las dos y cuarto", "Son las dos en punto", "Son las dos y media"],
        correctAnswer: "Son las dos y media"
    },
    {
        question: "En el contexto de la hora, 'quarter to' significa...",
        options: ["Y cuarto", "Menos cuarto", "Y media"],
        correctAnswer: "Menos cuarto"
    },
    {
        question: "¿Cómo se traduce 'The United States' al español?",
        options: ["Inglaterra", "Estados Unidos", "Canadá"],
        correctAnswer: "Estados Unidos"
    },
    {
        question: "Si una persona es de 'Germany', su nacionalidad en español es...",
        options: ["Germano", "Alemán", "Alemania"],
        correctAnswer: "Alemán"
    },
    {
        question: "¿Cómo se dice 'Nice to meet you' en español?",
        options: ["Mucho gusto", "Hola", "Adiós"],
        correctAnswer: "Mucho gusto"
    },
    {
        question: "¿Cómo se escribe el número '900' en letras?",
        options: ["Novecientos", "Setecientos", "Doscientos"],
        correctAnswer: "Novecientos"
    },
    {
        question: "¿Cuál es el idioma que se habla en 'Brazil'?",
        options: ["Español", "Brasileño", "Portugués"],
        correctAnswer: "Portugués"
    },
    {
        question: "Traduce al español: 'It's half past ten'",
        options: ["Son las diez y cuarto", "Son las diez y media", "Son las diez en punto"],
        correctAnswer: "Son las diez y media"
    },
    // Nuevas preguntas para Intro 2E
    {
        question: "¿Cómo se dice 'Good morning' en español?",
        options: ["Buenas tardes", "Hola", "Buenos días"],
        correctAnswer: "Buenos días"
    },
    {
        question: "¿Cómo se escribe el número '500' en letras?",
        options: ["Cinco cien", "Quiniéntos", "Quinientos"],
        correctAnswer: "Quinientos"
    },
    {
        question: "Si alguien es de 'France', su nacionalidad en español es...",
        options: ["Francia", "Francés", "Franchute"],
        correctAnswer: "Francés"
    },
    {
        question: "Si son las '5:15', en español decimos...",
        options: ["Son las cinco y cuarto", "Son las cinco y media", "Son las seis menos cuarto"],
        correctAnswer: "Son las cinco y cuarto"
    },
    {
        question: "¿Cómo se dice 'See you soon' en español?",
        options: ["Hasta luego", "Hasta pronto", "Adiós"],
        correctAnswer: "Hasta pronto"
    },
    {
        question: "¿Cuál es el idioma que se habla en 'China'?",
        options: ["Coreano", "Japonés", "Chino"],
        correctAnswer: "Chino"
    },
    {
        question: "¿Cómo se dice el número '1.000' en español?",
        options: ["Mil", "Millón", "Diez cien"],
        correctAnswer: "Mil"
    },
    {
        question: "La nacionalidad de alguien de 'Canada' en español es...",
        options: ["Canadiense", "Canadá", "Canadién"],
        correctAnswer: "Canadiense"
    },
    {
        question: "Para decir las '12:00 PM', en español usamos...",
        options: ["Es medianoche", "Es mediodía", "Son las doce en punto"],
        correctAnswer: "Es mediodía"
    },
    {
        question: "'Good night' se traduce al español como...",
        options: ["Buenas tardes", "Hola", "Buenas noches"],
        correctAnswer: "Buenas noches"
    },
];

export default function EspanolQuiz2Page() {
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
                'progress.progress_es_quiz_2': Math.round(finalScore)
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
        const isPassed = finalScore >= 70;

        return (
             <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
                <DashboardHeader />
                <main className="flex-1 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md text-center shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle className="text-3xl">{isPassed ? "¡Felicidades!" : "¡Buen intento!"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <Award className={cn("h-20 w-20 mx-auto", isPassed ? "text-yellow-400" : "text-muted-foreground")} />
                            <p className="text-lg text-muted-foreground">Tu puntuación es:</p>
                            <p className="text-6xl font-bold">{Math.round(finalScore)}%</p>
                            <p className="text-sm">
                                {isPassed 
                                    ? "Has superado el Quiz 2E. ¡Has completado la Intro 2 de Español!" 
                                    : "Necesitas un 70% para aprobar. ¡Inténtalo de nuevo!"}
                            </p>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            {!isPassed && <Button onClick={handleRestart} className="w-full">Intentar de Nuevo</Button>}
                            <Button variant={isPassed ? "default" : "ghost"} onClick={() => router.push('/espanol/intro')} className="w-full">
                                Volver a la Ruta de Aprendizaje
                            </Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-xl shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>Quiz 2E: Repaso de Intro 2E</CardTitle>
                        <CardDescription>Demuestra lo que has aprendido sobre números, hora y países.</CardDescription>
                        <div className="pt-4">
                            <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} className="h-2" />
                            <p className="text-center text-sm text-muted-foreground mt-2">
                                Pregunta {currentQuestionIndex + 1} de {quizQuestions.length}
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
                            {currentQuestionIndex < quizQuestions.length - 1 ? "Siguiente Pregunta" : "Finalizar Quiz"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
