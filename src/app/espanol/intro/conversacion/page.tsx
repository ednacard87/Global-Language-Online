'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Mic, CheckCircle, ArrowLeft, BookOpen, ArrowRight, Loader2, HelpCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const personalPresentationData = [
    { 
        id: 1, 
        question: "¿CUÁL ES TU NOMBRE?", 
        answer: "MI NOMBRE ES...", 
        extra: "MUCHO GUSTO / EL GUSTO ES MÍO" 
    },
    { id: 2, question: "¿DE DÓNDE ERES?", answer: "SOY DE _____________" },
    { id: 3, question: "¿DÓNDE VIVES?", answer: "VIVO EN ______________" },
    { id: 4, question: "¿CUÁL ES TU PROFESIÓN?", answer: "SOY ______________" },
    { id: 5, question: "¿QUÉ ESTUDIAS?", answer: "ESTUDIO ________________" },
    { id: 6, question: "¿DÓNDE ESTUDIAS?", answer: "ESTUDIO EN ______________" },
    { id: 7, question: "¿DÓNDE TRABAJAS?", answer: "TRABAJO EN: ______________" },
    { id: 8, question: "¿HABLAS INGLES?", answer: "SÍ, HABLO INGLES" },
    { id: 9, question: "¿HABLAS ESPAÑOL?", answer: "MAS O MENOS, EN ESTE MOMENTO ESTOY ESTUDIANDO ESPAÑOL." },
    { id: 10, question: "¿CÓMO SE DELETREA TU NOMBRE?", answer: "MI NOMBRE ES: (Deletreo...)" },
    { id: 11, question: "¿CUÁL ES TU CORREO ELECTRÓNICO?", answer: "MI CORREO ES: _________________", extra: "@ arroba / . punto" },
    { id: 12, question: "¿TIENES HERMANOS O HERMANAS?", answer: "SÍ, YO TENGO: _______" },
    { id: 13, question: "¿CUÁNTOS AÑOS TIENES?", answer: "YO TENGO ____ AÑOS" },
    { id: 14, question: "¿CUÁNDO ES TU CUMPLEAÑOS?", answer: "MI CUMPLEAÑOS ES EL: Día de Mes" },
    { id: 15, question: "¿CUÁL ES TU NÚMERO DE TELÉFONO?", answer: "MI NÚMERO ES: _________________" },
    { id: 16, question: "¿QUÉ TE GUSTA HACER?", answer: "ME GUSTA = ESTUDIAR-COMER-DESCANSAR..." },
    { id: 17, question: "¿CUÁL ES TU MÚSICA FAVORITA?", answer: "MI MÚSICA FAVORITA ES __________" },
];

const vocabularyAide = [
    { label: "Music", value: "Música" },
    { label: "Singer", value: "Cantante" },
    { label: "Sport", value: "Deporte" },
    { label: "Color", value: "Color" },
    { label: "Book", value: "Libro" },
    { label: "Movie", value: "Película" },
    { label: "Series", value: "Serie" },
    { label: "Food", value: "Comida" },
    { label: "Ice Cream", value: "Helado" },
    { label: "I don't like", value: "No me gusta" },
];

const helpfulQuestions = [
    "¿Puedes repetir despacio, por favor?",
    "¿Puedes repetir otra vez, por favor?",
    "¿Puedes hablar más lento/despacio?",
    "¿Cómo se dice en inglés: _____?",
    "¿Cómo se dice en español: ______?",
    "¿Cómo se deletrea: _________?",
    "¿Es correcto?"
];

export default function ConversacionEspanolPage() {
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
            'progress.conversacionProgress': 100
        });
        
        window.dispatchEvent(new CustomEvent('progressUpdated'));
        
        toast({
            title: "¡Práctica Completada!",
            description: "Has avanzado en tu ruta de español.",
        });

        setTimeout(() => {
            router.push('/espanol/intro');
        }, 500);
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-7xl space-y-6">
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" asChild size="sm" className="text-white hover:bg-white/20">
                            <Link href="/espanol/intro">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al laberinto
                            </Link>
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-12">
                        {/* Sidebar: Preguntas de Apoyo */}
                        <div className="md:col-span-4 lg:col-span-3">
                            <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm sticky top-24">
                                <CardHeader className="bg-primary/10 border-b">
                                    <div className="flex items-center gap-2">
                                        <HelpCircle className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">PREGUNTAS</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <ul className="space-y-4">
                                        {helpfulQuestions.map((q, index) => (
                                            <li key={index} className="flex gap-3 text-sm font-medium leading-relaxed group">
                                                <span className="text-primary font-bold">{index + 1}-</span>
                                                <span className="group-hover:text-primary transition-colors text-foreground">{q}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Separator className="my-6" />
                                    <div className="p-3 bg-brand-lilac/30 rounded-lg border border-brand-purple/20">
                                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Expresión</h4>
                                        <p className="text-xs text-muted-foreground italic mb-1">Hold on / wait a minute =</p>
                                        <p className="text-lg font-bold text-primary tracking-tighter uppercase">DAME UN MOMENTO POR FAVOR</p>
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
                                            <CardTitle className="text-2xl">CONVERSACIÓN 1</CardTitle>
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
                                                        <p className="font-bold text-lg tracking-tight uppercase group-hover:text-primary transition-colors text-foreground">
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
                                            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground">
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
                                    </p> <br />
                                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                                        Practice these questions out loud until you feel comfortable introducing yourself.
                                    </p>
                                    <Button onClick={handleComplete} disabled={isCompleting} className="w-full sm:w-auto min-w-[200px] h-12 text-lg font-bold">
                                        {isCompleting ? <Loader2 className="animate-spin" /> : "TERMINAR"}
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