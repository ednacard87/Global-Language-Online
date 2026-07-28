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
    { question: "¿Cómo se dice 'Hello' en español?", options: ["Adiós", "Hola", "Gracias"], correctAnswer: "Hola" },
    { question: "En español, la letra 'H' es...", options: ["Fuerte", "Muda", "Suave"], correctAnswer: "Muda" },
    { question: "¿Cómo se dice 'Good morning'?", options: ["Buenas tardes", "Buenos días", "Buenas noches"], correctAnswer: "Buenos días" },
    { question: "El sustantivo 'casa' es...", options: ["Masculino", "Femenino"], correctAnswer: "Femenino" },
    { question: "El plural de 'libro' es...", options: ["Libroes", "Libros", "Libres"], correctAnswer: "Libros" },
    { question: "Completa: 'Tú ____ estudiante'", options: ["eres", "es", "son"], correctAnswer: "eres" },
    { question: "Completa: 'Yo ____ en el café' (ubicación)", options: ["soy", "estoy", "es"], correctAnswer: "estoy" },
    { question: "¿Cómo se dice 'Goodbye'?", options: ["Hola", "Adiós", "Bienvenido"], correctAnswer: "Adiós" },
    { question: "Los adjetivos en español usualmente van...", options: ["Antes del sustantivo", "Después del sustantivo"], correctAnswer: "Después del sustantivo" },
    { question: "¿Cómo se dice 'Red'?", options: ["Azul", "Verde", "Rojo"], correctAnswer: "Rojo" },
    { question: "Completa: 'Ella ____ mi madre'", options: ["es", "está", "son"], correctAnswer: "es" },
    { question: "¿Qué número es 'Cincuenta'?", options: ["5", "50", "500"], correctAnswer: "50" },
    { question: "¿Cómo se dice '12:00 PM'?", options: ["Es medianoche", "Es mediodía", "Son las doce"], correctAnswer: "Es mediodía" },
    { question: "Nacionalidad de alguien de 'Francia':", options: ["Francia", "Francés", "Franchute"], correctAnswer: "Francés" },
    { question: "¿Cómo se dice 'Thank you'?", options: ["De nada", "Gracias", "Por favor"], correctAnswer: "Gracias" },
    { question: "¿Cuál es el infinitivo de 'Hablo'?", options: ["Hablas", "Hablando", "Hablar"], correctAnswer: "Hablar" },
    { question: "El sustantivo 'problema' es...", options: ["Masculino", "Femenino"], correctAnswer: "Masculino" },
    { question: "Completa: 'Nosotros ____ en Colombia'", options: ["somos", "estamos", "es"], correctAnswer: "estamos" },
    { question: "¿Cómo se dice '100'?", options: ["Cien", "Mil", "Diez"], correctAnswer: "Cien" },
    { question: "¿Cómo se dice 'See you later'?", options: ["Hasta pronto", "Hasta luego", "Hasta mañana"], correctAnswer: "Hasta luego" },
    { question: "Completa: 'Ustedes ____ amigos'", options: ["sois", "son", "es"], correctAnswer: "son" },
    { question: "¿Cómo se dice 'Yellow'?", options: ["Rojo", "Azul", "Amarillo"], correctAnswer: "Amarillo" },
    { question: "¿Qué hora es '2:30'?", options: ["Son las dos y cuarto", "Son las dos y media", "Son las tres menos cuarto"], correctAnswer: "Son las dos y media" },
    { question: "Nacionalidad de alguien de 'Canadá':", options: ["Canadá", "Canadiense", "Canadien"], correctAnswer: "Canadiense" },
    { question: "Completa: 'Ellos ____ cansados' (estado emocional)", options: ["son", "están", "es"], correctAnswer: "están" },
    { question: "¿Cómo se dice '15'?", options: ["Cinco", "Cincuenta", "Quince"], correctAnswer: "Quince" },
    { question: "El plural de 'flor' es...", options: ["Flors", "Flores", "Florez"], correctAnswer: "Flores" },
    { question: "¿Cómo se dice 'Welcome'?", options: ["Adiós", "Bienvenido", "Gracias"], correctAnswer: "Bienvenido" },
    { question: "Completa: 'Ella ____ inteligente' (rasgo)", options: ["es", "está", "son"], correctAnswer: "es" },
    { question: "¿Cuántos sonidos tiene cada vocal en español?", options: ["Uno", "Dos", "Varios"], correctAnswer: "Uno" },
];

export default function EspanolFinalQuizPage() {
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
                'progress.progress_espanol_quiz_final': Math.round(finalScore)
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
                            <CardTitle className="text-3xl">{isPassed ? "¡Misión Cumplida!" : "¡Sigue practicando!"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <Award className={cn("h-20 w-20 mx-auto", isPassed ? "text-yellow-400" : "text-muted-foreground")} />
                            <p className="text-lg text-muted-foreground">Tu puntuación final:</p>
                            <p className="text-6xl font-bold">{Math.round(finalScore)}%</p>
                            <p className="text-sm">
                                {isPassed 
                                    ? "¡Felicidades! Has completado el Curso Intro de Español. Estás listo para el nivel A1." 
                                    : "Has hecho un gran esfuerzo, pero necesitas un 70% para completar el curso. ¡Inténtalo de nuevo!"}
                            </p>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            {!isPassed && <Button onClick={handleRestart} className="w-full">Intentar de Nuevo</Button>}
                            <Button variant={isPassed ? "default" : "ghost"} onClick={() => router.push('/espanol/intro')} className="w-full">
                                Volver al Panel Intro
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
                <Card className="w-full max-w-xl shadow-soft rounded-lg border-2 border-brand-purple bg-card/90 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Prueba Final: Intro Español</CardTitle>
                        <CardDescription>30 preguntas para demostrar tu dominio de los fundamentos.</CardDescription>
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
                                            "h-14 text-lg justify-start p-4 transition-all",
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
                        <Button onClick={handleNext} disabled={!isAnswered} className="w-full h-12 text-lg font-bold">
                            {currentQuestionIndex < quizQuestions.length - 1 ? "Siguiente Pregunta" : "Finalizar Prueba"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}