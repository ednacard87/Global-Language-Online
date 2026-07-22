'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Award, ArrowRight, RefreshCw } from 'lucide-react';
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
        question: "How do you say 'Hello' in Spanish?",
        options: ["Adiós", "Hola", "Gracias"],
        correctAnswer: "Hola"
    },
    {
        question: "What is the most common ending for feminine nouns?",
        options: ["-o", "-e", "-a"],
        correctAnswer: "-a"
    },
    {
        question: "How do you say 'Good morning' in Spanish?",
        options: ["Buenas tardes", "Buenos días", "Buenas noches"],
        correctAnswer: "Buenos días"
    },
    {
        question: "The noun 'Libro' (book) is...",
        options: ["Masculine", "Feminine"],
        correctAnswer: "Masculine"
    },
    {
        question: "What is the infinitive form of 'to speak'?",
        options: ["Hablo", "Hablas", "Hablar"],
        correctAnswer: "Hablar"
    },
    {
        question: "How do you say 'See you later'?",
        options: ["Hasta luego", "Hola", "Bienvenido"],
        correctAnswer: "Hasta luego"
    },
    {
        question: "Adjectives in Spanish usually come...",
        options: ["Before the noun", "After the noun"],
        correctAnswer: "After the noun"
    },
    {
        question: "Which of these is the plural of 'Libro'?",
        options: ["Libroes", "Libros", "Libres"],
        correctAnswer: "Libros"
    },
    {
        question: "Which verbs mean 'to be' in Spanish?",
        options: ["Tener y Haber", "Hacer y Poder", "Ser y Estar"],
        correctAnswer: "Ser y Estar"
    },
    {
        question: "How do you say 'Red' in Spanish?",
        options: ["Azul", "Verde", "Rojo"],
        correctAnswer: "Rojo"
    },
    // New questions for Intro 1E
    {
        question: "How many sounds does each vowel have in Spanish?",
        options: ["One", "Two", "Varies"],
        correctAnswer: "One"
    },
    {
        question: "In Spanish, the letter 'H' is always...",
        options: ["Strong", "Silent", "Soft"],
        correctAnswer: "Silent"
    },
    {
        question: "Which of these is a typical Colombian dish?",
        options: ["Tacos", "Bandeja Paisa", "Paella"],
        correctAnswer: "Bandeja Paisa"
    },
    {
        question: "In Latin America, 'LL' and 'Y' sound similar to which English letter?",
        options: ["Z", "Y", "R"],
        correctAnswer: "Y"
    },
    {
        question: "The 'Paisa' accent is typical of which Colombian city?",
        options: ["Bogotá", "Cartagena", "Medellín"],
        correctAnswer: "Medellín"
    },
    {
        question: "Which ending is typical for masculine nouns?",
        options: ["-a", "-o", "-ción"],
        correctAnswer: "-o"
    },
    {
        question: "How do you say 'Blue car' in Spanish?",
        options: ["Azul carro", "Carro azul", "Carro de azul"],
        correctAnswer: "Carro azul"
    },
    {
        question: "What is the infinitive ending of the verb 'Comer'?",
        options: ["-ar", "-er", "-ir"],
        correctAnswer: "-er"
    },
    {
        question: "Which verb is used for permanent traits like identity?",
        options: ["Ser", "Estar", "Tener"],
        correctAnswer: "Ser"
    },
    {
        question: "Which verb is used for temporary states like location or feelings?",
        options: ["Ser", "Estar", "Hacer"],
        correctAnswer: "Estar"
    },
];

export default function EspanolQuiz1Page() {
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
                'progress.progress_es_quiz_1': Math.round(finalScore)
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
                                    ? "Has superado el Quiz 1E. ¡Ahora puedes continuar con Intro 2E!" 
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
                        <CardTitle>Quiz 1E: Fundamentos de Español</CardTitle>
                        <CardDescription>Prueba lo que has aprendido en Intro 1E.</CardDescription>
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
