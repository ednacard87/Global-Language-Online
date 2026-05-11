'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Mic, CheckCircle, ArrowLeft, BookOpen, ArrowRight, Loader2, HelpCircle, Trophy } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const allAboutYouQuestions = [
    "What is your name?",
    "How are you today?",
    "How old are you?",
    "Are you happy or tired?",
    "Are you a student?",
    "Are you a teacher?",
    "Are you from Colombia?",
    "Are you from Mexico?",
    "Is your name Juan?",
    "Is today Monday?",
    "Are you at home?",
    "Are you in yoga class?",
    "What kind of cellphone do you have?",
    "Are your Friends old or young?",
    "How many books do you have?",
    "Is English easy?",
    "Is your family big?",
    "How many people are in your family?"
];

const helpfulQuestions = [
    "Can you repeat slowly, please?",
    "can you repeat again, please?",
    "can you speak slowly, please?",
    "how do you say in Spanish: _____?",
    "how do you say in English: ______?",
    "how do you spell: _________?",
    "is it correct?"
];

export default function SpeakingFinalPage() {
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCompleting, setIsCompleting] = useState(false);
    const [showCongratulations, setShowCongratulations] = useState(false);

    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );

    const handleComplete = async () => {
        if (!studentDocRef) return;
        setIsCompleting(true);
        
        updateDocumentNonBlocking(studentDocRef, {
            'progress.speakingProgress': 100
        });
        
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        setShowCongratulations(true);
        setIsCompleting(false);
    };

    if (showCongratulations) {
        return (
            <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
                <DashboardHeader />
                <main className="flex-1 p-4 flex items-center justify-center">
                    <Card className="w-full max-w-md text-center shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">¡FELICITACIONES!</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Trophy className="h-24 w-24 text-yellow-400 mx-auto animate-bounce" />
                            <p className="text-lg">Has completado todas las actividades del Curso Intro.</p>
                            <p className="text-muted-foreground">¡Estás listo para continuar con el Curso A1!</p>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button asChild size="lg" className="w-full font-bold">
                                <Link href="/intro">Volver al Laberinto</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-7xl space-y-6">
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" asChild size="sm" className="text-white hover:bg-white/20">
                            <Link href="/intro">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al laberinto
                            </Link>
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-12">
                        {/* Sidebar: QUESTIONS */}
                        <div className="md:col-span-4 lg:col-span-3">
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm sticky top-24">
                                <CardHeader className="bg-primary/10 border-b">
                                    <div className="flex items-center gap-2">
                                        <HelpCircle className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">QUESTIONS</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <ul className="space-y-4">
                                        {helpfulQuestions.map((q, index) => (
                                            <li key={index} className="flex gap-3 text-sm font-medium leading-relaxed group">
                                                <span className="text-primary font-bold">{index + 1}-</span>
                                                <span className="group-hover:text-primary transition-colors">{q}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Separator className="my-6" />
                                    <div className="p-3 bg-brand-lilac/30 rounded-lg border border-brand-purple/20">
                                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Expression</h4>
                                        <p className="text-xs text-muted-foreground italic mb-1">esperame / esperate / dame un momento =</p>
                                        <p className="text-lg font-bold text-primary tracking-tighter">HOLD ON</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="md:col-span-8 lg:col-span-9">
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple overflow-hidden bg-card/95 backdrop-blur-sm">
                                <CardHeader className="bg-muted/50 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <Mic className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl uppercase">Tema: "All About You" – Todo sobre ti</CardTitle>
                                            <CardDescription>Práctica final usando principalmente el verbo "to be"</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-8">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {allAboutYouQuestions.map((question, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border group hover:border-primary transition-colors">
                                                <span className="font-bold text-primary min-w-[24px]">{index + 1}-</span>
                                                <p className="font-medium text-lg tracking-tight group-hover:text-primary transition-colors">
                                                    {question}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-6 bg-brand-blue/10 rounded-2xl border-2 border-dashed border-brand-blue">
                                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-brand-blue" />
                                            Instrucciones
                                        </h3>
                                        <p className="text-muted-foreground">
                                            Responde a estas preguntas en voz alta. Si estás con un profesor, él te hará estas preguntas al azar. Usa el cuadro de la izquierda si necesitas ayuda para comunicarte.
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                                        Haz clic en el botón una vez que hayas finalizado tu sesión de práctica.
                                    </p>
                                    <Button onClick={handleComplete} disabled={isCompleting} className="w-full sm:w-auto min-w-[200px] h-12 text-lg font-bold">
                                        {isCompleting ? <Loader2 className="animate-spin" /> : "Terminar Práctica"}
                                        <CheckCircle className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}