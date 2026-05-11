'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Mic, CheckCircle, ArrowLeft, BookOpen, ArrowRight, Loader2, HelpCircle, MessageCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const personalPresentationData = [
    { 
        id: 1, 
        question: "WHAT’S YOUR NAME?", 
        answer: "MY NAME IS...", 
        extra: "NICE TO MEET YOU / NICE TO MEET YOU TOO" 
    },
    { id: 2, question: "WHERE ARE YOU FROM?", answer: "I’M FROM _____________" },
    { id: 3, question: "WHERE DO YOU LIVE?", answer: "I LIVE IN ______________" },
    { id: 4, question: "WHAT’S YOUR OCCUPATION?", answer: "I’M A/AN ______________" },
    { id: 5, question: "WHAT DO YOU STUDY?", answer: "I STUDY ________________" },
    { id: 6, question: "WHERE DO YOU STUDY?", answer: "I STUDY IN ______________" },
    { id: 7, question: "WHERE DO YOU WORK?", answer: "I WORK IN: ______________" },
    { id: 8, question: "DO YOU SPEAK SPANISH?", answer: "YES, I DO // NO, I DON’T" },
    { id: 9, question: "DO YOU SPEAK ENGLISH?", answer: "MORE OR LESS - AT THIS MOMENT, I’M STUDYING ENGLISH." },
    { id: 10, question: "HOW DO YOU SPELL YOUR NAME?", answer: "MY NAME IS: (Spelling...)" },
    { id: 11, question: "WHAT IS YOUR EMAIL?", answer: "MY EMAIL IS: _________________", extra: "HOW DO YOU SPELL YOUR EMAIL? -> MY EMAIL IS: (Spelling...)" },
    { id: 12, question: "DO YOU HAVE ANY BROTHER OR SISTER?", answer: "YES, I HAVE: _______" },
    { id: 13, question: "HOW OLD ARE YOU?", answer: "I AM ____ YEARS OLD" },
    { id: 14, question: "WHEN IS YOUR BIRTHDAY?", answer: "MY BIRTHDAY IS ON: Month + Day" },
    { id: 15, question: "WHAT’S YOUR TELEPHONE NUMBER?", answer: "MY TELEPHONE NUMBER IS: _________________" },
    { id: 16, question: "WHAT DO YOU LIKE TO DO?", answer: "I LIKE TO ______________" },
    { id: 17, question: "WHAT’S YOUR FAVORITE MUSIC?", answer: "MY FAVORITE MUSIC IS __________" },
];

const vocabularyAide = [
    { label: "Música", value: "Music" },
    { label: "Cantante", value: "Singer" },
    { label: "Deporte", value: "Sport" },
    { label: "Color", value: "Color" },
    { label: "Libro", value: "Book" },
    { label: "Película", value: "Movie" },
    { label: "Series", value: "Series" },
    { label: "Comida", value: "Food" },
    { label: "Helado", value: "Ice cream" },
    { label: "No me gusta", value: "I don't like" },
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

export default function Speaking1Page() {
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isCompleting, setIsCompleting] = useState(false);

    const studentDocRef = useMemoFirebase(
      () => (user ? doc(firestore, 'students', user.uid) : null),
      [firestore, user]
    );

    const handleComplete = async () => {
        if (!studentDocRef) return;
        setIsCompleting(true);
        
        updateDocumentNonBlocking(studentDocRef, {
            'progress.speaking1Progress': 100
        });
        
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        
        toast({
            title: "¡Práctica Completada!",
            description: "Has desbloqueado Intro 2. ¡Sigue así!",
        });

        setTimeout(() => {
            router.push('/intro');
        }, 500);
    };

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
                        {/* Sidebar: Helpful Questions */}
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

                        {/* Main Content: Personal Presentation */}
                        <div className="md:col-span-8 lg:col-span-9">
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple overflow-hidden bg-card/95 backdrop-blur-sm">
                                <CardHeader className="bg-muted/50 border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                            <Mic className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl">SPEAKING 1</CardTitle>
                                            <CardDescription>PRESENTACIÓN PERSONAL</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        {personalPresentationData.map((item) => (
                                            <div key={item.id} className="space-y-2 group">
                                                <div className="flex items-start gap-3">
                                                    <span className="font-bold text-primary min-w-[24px]">{item.id}-</span>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-lg tracking-tight uppercase group-hover:text-primary transition-colors">
                                                            {item.question}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-muted-foreground font-mono mt-1">
                                                            <ArrowRight className="h-4 w-4 shrink-0 text-brand-blue" />
                                                            <span className="text-foreground font-medium">{item.answer}</span>
                                                        </div>
                                                        {item.extra && (
                                                            <p className="text-sm text-muted-foreground italic mt-1 border-l-2 border-brand-purple/30 pl-3 py-1">
                                                                {item.extra}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {item.id < personalPresentationData.length && <Separator className="mt-4 opacity-50" />}
                                            </div>
                                        ))}

                                        <div className="mt-12 p-6 bg-brand-lilac/50 dark:bg-muted/50 rounded-2xl border-2 border-dashed border-brand-purple">
                                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                                                <BookOpen className="h-5 w-5 text-brand-purple" />
                                                Vocabulario de Apoyo
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                                {vocabularyAide.map((v, i) => (
                                                    <div key={i} className="flex flex-col p-2 bg-card border rounded-lg shadow-sm">
                                                        <span className="text-xs text-muted-foreground capitalize">{v.label}</span>
                                                        <span className="font-bold text-sm text-primary">{v.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                                        Practica estas preguntas en voz alta hasta que te sientas cómodo/a presentándote.
                                    </p>
                                    <Button onClick={handleComplete} disabled={isCompleting} className="w-full sm:w-auto min-w-[200px] h-12 text-lg font-bold">
                                        {isCompleting ? <Loader2 className="animate-spin" /> : "He terminado de practicar"}
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