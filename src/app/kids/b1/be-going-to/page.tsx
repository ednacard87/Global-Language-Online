'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  PenSquare,
  Lock,
  GraduationCap,
  Gamepad2,
  CheckCircle,
  Trophy,
  Loader2,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SingleFormExercise } from '@/components/kids/exercises/single-form';
import { PresentSimpleExercise } from '@/components/kids/exercises/present-simple';

// --- Data ---

const progressStorageKey = 'progress_kids_b1_be_going_to_v1';
const mainProgressKey = 'progress_kids_b1_be_going_to';

const plansVocab = [
    { spanish: "Visitar a mis abuelos.", english: "Visit my grandparents" },
    { spanish: "Comprar una casa nueva.", english: "Buy a new house" },
    { spanish: "Viajar a Europa.", english: "Travel to Europe" },
    { spanish: "Estudiar para el examen.", english: "Study for the exam" },
    { spanish: "Aprender a cocinar.", english: "Learn to cook" },
    { spanish: "Ir al cine.", english: "Go to the cinema" },
    { spanish: "Ver una película.", english: "Watch a movie" },
    { spanish: "Hacer ejercicio.", english: "Do exercise" },
    { spanish: "Limpiar mi habitación.", english: "Clean my room" },
    { spanish: "Llamar a mi amigo.", english: "Call my friend" },
];

const exercise1Data = [
    { spanish: "Yo voy a viajar mañana.", answer: ["I am going to travel tomorrow", "I'm going to travel tomorrow"] },
    { spanish: "Ella va a comprar un carro.", answer: ["She is going to buy a car", "She's going to buy a car"] },
    { spanish: "Nosotros vamos a estudiar juntos.", answer: ["We are going to study together", "We're going to study together"] },
    { spanish: "Ellos van a visitar el museo.", answer: ["They are going to visit the museum", "They're going to visit the museum"] },
];

const mixedExercisesData = [
    {
        spanish: "yo voy a aprender ingles",
        answers: {
            affirmative: ["I am going to learn English", "I'm going to learn English"],
            negative: ["I am not going to learn English", "I'm not going to learn English"],
            interrogative: ["Am I going to learn English?"],
            shortAffirmative: ["Yes, I am"],
            shortNegative: ["No, I am not", "No, I'm not"]
        }
    },
    {
        spanish: "tu vas a comer pizza",
        answers: {
            affirmative: ["You are going to eat pizza", "You're going to eat pizza"],
            negative: ["You are not going to eat pizza", "You aren't going to eat pizza"],
            interrogative: ["Are you going to eat pizza?"],
            shortAffirmative: ["Yes, I am"],
            shortNegative: ["No, I am not", "No, I'm not"]
        }
    }
];

const readingData = {
    title: "Weekend Plans",
    content: "Next Saturday, my family and I are going to have a picnic in the park. My mom is going to cook some sandwiches, and my dad is going to buy some juice. My sister is going to bring her football, so we are going to play after lunch. We are going to have a lot of fun together!",
    questions: [
        { id: 'q1', question: "What is the family going to do next Saturday?", answers: ["have a picnic", "a picnic", "have a picnic in the park"] },
        { id: 'q2', question: "Who is going to cook sandwiches?", answers: ["my mom", "mom"] },
        { id: 'q3', question: "What is the dad going to buy?", answers: ["juice", "some juice"] },
        { id: 'q4', question: "What are they going to do after lunch?", answers: ["play football", "play", "play with a football"] },
    ]
};

// --- Page Component ---

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

export default function BeGoingToPage() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Gramatica', icon: GraduationCap, status: 'locked' },
        { key: 'exercise1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'wordsearch', name: 'Sopa de Letras', icon: Gamepad2, status: 'locked' },
        { key: 'mixed', name: 'Ejercicios Mixtos', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: 'Lectura', icon: BookOpen, status: 'locked' },
        { key: 'final_vocab', name: 'Vocabulario Final', icon: BookOpen, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isUserLoading || isProfileLoading || !initialLearningPath.length) return;

        let newPath = initialLearningPath.map(item => ({...item}));
        let savedSelectedTopic = '';

        if (isAdmin) {
            newPath.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedData = studentProfile.lessonProgress[progressStorageKey];
            newPath.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }
        
        setLearningPath(newPath);
        if (!initialLoadComplete) {
            setSelectedTopic(savedSelectedTopic || newPath.find(p => p.status === 'active')?.key || 'vocabulary');
            setInitialLoadComplete(true);
        }
    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading, initialLoadComplete]);

    const progressPercent = useMemo(() => {
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((completedCount / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isUserLoading || isProfileLoading || learningPath.length === 0 || isAdmin || !studentDocRef) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageKey}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: progressPercent
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressPercent, selectedTopic, isAdmin, studentDocRef, isUserLoading, isProfileLoading, initialLoadComplete]);

    const handleTopicComplete = (key: string) => {
        setTopicToComplete(key);
    };

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            const newPath = currentPath.map(item => ({...item}));
            const currentIndex = newPath.findIndex(item => item.key === topicToComplete);
            
            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';
                const nextIndex = currentIndex + 1;
                if (nextIndex < newPath.length && newPath[nextIndex].status === 'locked') {
                    newPath[nextIndex].status = 'active';
                    setSelectedTopic(newPath[nextIndex].key);
                    toast({ title: "¡Tema desbloqueado!", description: `Ahora puedes continuar con ${newPath[nextIndex].name}` });
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const topic = learningPath.find(t => t.key === key);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: 'Tema Bloqueado' });
            return;
        }
        setSelectedTopic(key);
        if (['vocabulary', 'grammar'].includes(key)) {
            handleTopicComplete(key);
        }
    };

    const renderContent = () => {
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulario: Planes y Actividades</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                {plansVocab.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.english}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter><Button onClick={() => handleTopicComplete('vocabulary')}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader><CardTitle>Estructura: Be Going To</CardTitle></CardHeader>
                            <CardContent className="space-y-4 text-lg">
                                <p>Usamos <span className="font-bold text-primary">BE GOING TO</span> para hablar de planes futuros que ya hemos decidido.</p>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                    <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> Pronoun + am/is/are + going to + verb + complement</p>
                                    <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> Pronoun + am/is/are + NOT + going to + verb + complement</p>
                                    <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> Am/Is/Are + pronoun + going to + verb + complement?</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader><CardTitle>Recordatorio: Verbo To Be</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-3 bg-muted rounded-lg">I <strong>am</strong></div>
                                <div className="p-3 bg-muted rounded-lg">You/We/They <strong>are</strong></div>
                                <div className="p-3 bg-muted rounded-lg">He/She/It <strong>is</strong></div>
                            </CardContent>
                            <CardFooter><Button onClick={() => handleTopicComplete('grammar')}>Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'exercise1':
                return <SingleFormExercise key="ex1" onComplete={() => handleTopicComplete('exercise1')} exerciseData={exercise1Data} title="Ejercicio 1" description="Traduce las frases usando 'be going to'." formType="affirmative" />;
            case 'mixed':
                return <PresentSimpleExercise key="mixed" onComplete={() => handleTopicComplete('mixed')} exerciseData={mixedExercisesData} title="Ejercicios Mixtos" />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>Lectura: {readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="p-4 bg-muted rounded-lg border italic">{readingData.content}</p>
                            <div className="space-y-4">
                                {readingData.questions.map((q, idx) => (
                                    <div key={q.id} className="grid gap-2">
                                        <Label>{q.question}</Label>
                                        <Input placeholder="Tu respuesta..." />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter><Button onClick={() => handleTopicComplete('reading')}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_vocab':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulario Final</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-center text-xl font-bold py-12">¡Has completado el repaso de vocabulario!</p>
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('final_vocab')}>Finalizar Lección</Button></CardFooter>
                    </Card>
                );
            default:
                return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen will-lesson-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/kids/b1" className="hover:underline text-sm text-muted-foreground">Volver al curso B1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary">Be Going To</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-8">{renderContent()}</div>
                        <div className="md:col-span-4">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map(item => (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                    className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                        item.status === 'locked' && !isAdmin ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                        selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                                    )}>
                                                    {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <item.icon className="h-5 w-5" />}
                                                    <span>{item.name}</span>
                                                    {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500 ml-auto" />}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                     <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                            <span>Progreso</span><span className="font-bold text-foreground">{progressPercent}%</span>
                                        </div>
                                        <Progress value={progressPercent} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
