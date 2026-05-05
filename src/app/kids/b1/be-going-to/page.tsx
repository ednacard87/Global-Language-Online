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
  ArrowRight,
  Lightbulb,
  ChevronDown,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// --- Data ---

const progressStorageKey = 'progress_kids_b1_be_going_to_v2';
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

const exercise1PositiveData = [
    { spanish: "Yo voy a aprender a cocinar.", answer: ["I am going to learn to cook", "I'm going to learn to cook"] },
    { spanish: "Tú vas a ver una película.", answer: ["You are going to watch a movie", "You're going to watch a movie"] },
    { spanish: "Él va a hacer ejercicio.", answer: ["He is going to do exercise", "He's going to do exercise"] },
    { spanish: "Nosotros vamos a limpiar la habitación.", answer: ["We are going to clean the room", "We're going to clean the room", "We are going to clean the bedroom", "We're going to clean the bedroom"] },
];

const exercise1NegativeData = [
    { spanish: "Yo no voy a aprender a cocinar.", answer: ["I am not going to learn to cook", "I'm not going to learn to cook"] },
    { spanish: "Tú no vas a ver una película.", answer: ["You are not going to watch a movie", "You're not going to watch a movie", "You aren't going to watch a movie"] },
    { spanish: "Él no va a hacer ejercicio.", answer: ["He is not going to do exercise", "He's going to do exercise", "He isn't going to do exercise"] },
    { spanish: "Nosotros no vamos a limpiar la habitación.", answer: ["We are not going to clean the room", "We're going to clean the room", "We aren't going to clean the room"] },
];

const exercise1InterrogativeData = [
    { spanish: "¿Voy yo a aprender a cocinar?", answer: ["Am I going to learn to cook?"] },
    { spanish: "¿Vas tú a ver una película?", answer: ["Are you going to watch a movie?"] },
    { spanish: "¿Va él a hacer ejercicio?", answer: ["Is he going to do exercise?"] },
    { spanish: "¿Vamos nosotros a limpiar la habitación?", answer: ["Are we going to clean the room?"] },
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
            shortAffirmative: ["Yes, you are", "Yes, I am"],
            shortNegative: ["No, you are not", "No, you aren't", "No, I am not", "No, I'm not"]
        }
    },
    {
        spanish: "ella va a visitar a sus abuelos",
        answers: {
            affirmative: ["She is going to visit her grandparents", "She's going to visit her grandparents"],
            negative: ["She is not going to visit her grandparents", "She isn't going to visit her grandparents", "She's not going to visit her grandparents"],
            interrogative: ["Is she going to visit her grandparents?"],
            shortAffirmative: ["Yes, she is"],
            shortNegative: ["No, she is not", "No, she isn't", "No, she's not"]
        }
    },
    {
        spanish: "nosotros vamos a viajar a europa",
        answers: {
            affirmative: ["We are going to travel to Europe", "We're going to travel to Europe"],
            negative: ["We are not going to travel to Europe", "We aren't going to travel to Europe", "We're not going to travel to Europe"],
            interrogative: ["Are we going to travel to Europe?"],
            shortAffirmative: ["Yes, we are"],
            shortNegative: ["No, we are not", "No, we aren't", "No, we're not"]
        }
    },
    {
        spanish: "ellos van a estudiar para el examen",
        answers: {
            affirmative: ["They are going to study for the exam", "They're going to study for the exam"],
            negative: ["They are not going to study for the exam", "They aren't going to study for the exam", "They're not going to study for the exam"],
            interrogative: ["Are they going to study for the exam?"],
            shortAffirmative: ["Yes, they are"],
            shortNegative: ["No, they are not", "No, they aren't", "No, they're not"]
        }
    },
    {
        spanish: "él va a comprar una casa nueva",
        answers: {
            affirmative: ["He is going to buy a new house", "He's going to buy a new house"],
            negative: ["He is not going to buy a new house", "He isn't going to buy a new house", "He's not going to buy a new house"],
            interrogative: ["Is he going to buy a new house?"],
            shortAffirmative: ["Yes, he is"],
            shortNegative: ["No, he is not", "No, he isn't", "No, he's not"]
        }
    }
];

const readingData = {
    title: "Weekend Plans",
    content: "Next Saturday, my family and I are going to have a picnic in the park. My mom is going to cook some sandwiches, and my dad is going to buy some juice. My sister is going to bring her ball, so we are going to play after lunch. We are going to have a lot of fun together!",
    questions: [
        { id: 'q1', question: "What is the family going to do next Saturday?", answers: ["have a picnic", "a picnic", "have a picnic in the park"] },
        { id: 'q2', question: "Who is going to cook sandwiches?", answers: ["my mom", "mom"] },
        { id: 'q3', question: "What is the dad going to buy?", answers: ["juice", "some juice"] },
        { id: 'q4', question: "What are they going to do after lunch?", answers: ["play ball", "play", "play with a ball"] },
    ]
};

// --- Page Component ---

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
  subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed'; icon: React.ElementType }[];
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

    // Final Vocabulary Exercise State
    const [finalVocabAnswers, setFinalVocabAnswers] = useState<Record<number, string>>({});
    const [finalVocabValidation, setFinalVocabValidation] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Gramatica', icon: GraduationCap, status: 'locked' },
        {
            key: 'exercise1',
            name: 'Ejercicio 1',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'positive-ex1', name: 'Positiva', icon: PenSquare, status: 'locked' },
                { key: 'negative-ex1', name: 'Negativa', icon: PenSquare, status: 'locked' },
                { key: 'interrogative-ex1', name: 'Interrogativa', icon: PenSquare, status: 'locked' },
            ]
        },
        { key: 'mixed', name: 'Ejercicios Mixtos', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: 'Lectura', icon: BookOpen, status: 'locked' },
        { key: 'final_vocab', name: 'Vocabulario Final', icon: BookOpen, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isUserLoading || isProfileLoading || !initialLearningPath.length) return;

        let newPath = initialLearningPath.map(item => ({
            ...item,
            subItems: item.subItems ? item.subItems.map(sub => ({ ...sub })) : undefined
        }));
        let savedSelectedTopic = '';

        if (isAdmin) {
            newPath.forEach(item => {
                item.status = 'completed';
                if (item.subItems) {
                    item.subItems.forEach(sub => sub.status = 'completed');
                }
            });
        } else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedData = studentProfile.lessonProgress[progressStorageKey];
            newPath.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
                if (item.subItems && savedData.subItems?.[item.key]) {
                    item.subItems.forEach(subItem => {
                        if (savedData.subItems[item.key][subItem.key]) {
                            subItem.status = savedData.subItems[item.key][subItem.key];
                        }
                    });
                }
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }
        
        setLearningPath(newPath);
        if (!initialLoadComplete) {
            const firstActive = newPath.find(p => p.status === 'active') || newPath.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
            setSelectedTopic(savedSelectedTopic || firstActive?.key || 'vocabulary');
            setInitialLoadComplete(true);
        }
    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading, initialLoadComplete]);

    const progressPercent = useMemo(() => {
        let totalTopics = 0;
        let completedTopics = 0;
        learningPath.forEach(t => {
            if (t.subItems) {
                totalTopics += t.subItems.length;
                completedTopics += t.subItems.filter(st => st.status === 'completed').length;
            } else {
                totalTopics++;
                if (t.status === 'completed') completedTopics++;
            }
        });
        return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isUserLoading || isProfileLoading || learningPath.length === 0 || isAdmin || !studentDocRef) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => {
            statusesToSave[item.key] = item.status;
            if (item.subItems) {
                if (!statusesToSave.subItems) statusesToSave.subItems = {};
                statusesToSave.subItems[item.key] = {};
                item.subItems.forEach(sub => {
                    statusesToSave.subItems[item.key][sub.key] = sub.status;
                });
            }
        });

        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageKey}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: progressPercent
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressPercent, selectedTopic, isAdmin, studentDocRef, isUserLoading, isProfileLoading, initialLoadComplete]);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(currentPath => {
            const newPath = currentPath.map(t => ({
                ...t,
                subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined,
            }));
          
            let nextSelectedTopic: string | null = null;
            let topicFound = false;
            let wasTopicUnlocked = false;

            for (let i = 0; i < newPath.length && !topicFound; i++) {
                const currentTopic = newPath[i];

                if (currentTopic.key === topicToComplete) {
                    if (currentTopic.status !== 'completed') {
                        currentTopic.status = 'completed';
                    }
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        const next = newPath[i + 1];
                        next.status = 'active';
                        if (next.subItems?.[0]) {
                            next.subItems[0].status = 'active';
                            nextSelectedTopic = next.subItems[0].key;
                        } else {
                            nextSelectedTopic = next.key;
                        }
                        wasTopicUnlocked = true;
                    }
                    topicFound = true;
                } else if (currentTopic.subItems) {
                    const subIndex = currentTopic.subItems.findIndex(s => s.key === topicToComplete);
                    if (subIndex !== -1) {
                        if (currentTopic.subItems[subIndex].status !== 'completed') {
                            currentTopic.subItems[subIndex].status = 'completed';
                        }
                        const nextSubIndex = subIndex + 1;
                        if (nextSubIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubIndex].status === 'locked') {
                            currentTopic.subItems[nextSubIndex].status = 'active';
                            nextSelectedTopic = currentTopic.subItems[nextSubIndex].key;
                            wasTopicUnlocked = true;
                        } else if (currentTopic.subItems.every(s => s.status === 'completed')) {
                            if (currentTopic.status !== 'completed') {
                                currentTopic.status = 'completed';
                            }
                            if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                                const next = newPath[i + 1];
                                next.status = 'active';
                                if (next.subItems?.[0]) {
                                    next.subItems[0].status = 'active';
                                    nextSelectedTopic = next.subItems[0].key;
                                } else {
                                    nextSelectedTopic = next.key;
                                }
                                wasTopicUnlocked = true;
                            }
                        }
                        topicFound = true;
                    }
                }
            }
            if (nextSelectedTopic) {
                setSelectedTopic(nextSelectedTopic);
            }
            if (wasTopicUnlocked) {
                toast({ title: "¡Siguiente tema desbloqueado!", description: "Puedes continuar con la aventura." });
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);

        if (!isAdmin && ((subTopic && subTopic.status === 'locked') || (!subTopic && mainTopic?.status === 'locked'))) {
            toast({ variant: 'destructive', title: 'Contenido Bloqueado' });
            return;
        }

        if (topicKey === 'exercise1') {
            const firstSub = mainTopic?.subItems?.[0];
            if (firstSub && firstSub.status === 'locked' && !isAdmin) {
                 toast({ variant: 'destructive', title: 'Contenido Bloqueado' });
                 return;
            }
            if (firstSub) {
                setSelectedTopic(firstSub.key);
            }
            return;
        }

        setSelectedTopic(topicKey);

        const autoViewTopics = ['vocabulary', 'grammar'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    // Final Vocab Logic
    const handleFinalVocabInputChange = (index: number, value: string) => {
        setFinalVocabAnswers(prev => ({ ...prev, [index]: value }));
        if (finalVocabValidation[index] !== 'unchecked') {
            setFinalVocabValidation(prev => ({ ...prev, [index]: 'unchecked' }));
        }
    };

    const handleCheckFinalVocab = () => {
        let allCorrect = true;
        const newValidation: Record<number, 'correct' | 'incorrect' | 'unchecked'> = {};
        
        plansVocab.forEach((item, index) => {
            const userAnswer = (finalVocabAnswers[index] || '').trim().toLowerCase().replace(/[.]/g, '');
            const correctAnswer = item.english.toLowerCase().replace(/[.]/g, '');
            const isCorrect = userAnswer === correctAnswer;
            if (!isCorrect) allCorrect = false;
            newValidation[index] = isCorrect ? 'correct' : 'incorrect';
        });

        setFinalVocabValidation(newValidation);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Has traducido todo correctamente." });
            handleTopicComplete('final_vocab');
        } else {
            toast({
                variant: "destructive",
                title: "Algunas respuestas son incorrectas",
                description: "Revisa los campos en rojo."
            });
        }
    };

    const getFinalVocabInputClass = (index: number) => {
        const status = finalVocabValidation[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
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
                        </div>
                );
            case 'positive-ex1':
                return <SingleFormExercise key="ex1-pos" onComplete={() => handleTopicComplete('positive-ex1')} exerciseData={exercise1PositiveData} title="Ejercicio 1: Forma Positiva" description="Traduce las frases a su forma afirmativa usando 'be going to'." formType="affirmative" />;
            case 'negative-ex1':
                return <SingleFormExercise key="ex1-neg" onComplete={() => handleTopicComplete('negative-ex1')} exerciseData={exercise1NegativeData} title="Ejercicio 1: Forma Negativa" description="Traduce las frases a su forma negativa usando 'be going to'." formType="negative" />;
            case 'interrogative-ex1':
                return <SingleFormExercise key="ex1-int" onComplete={() => handleTopicComplete('interrogative-ex1')} exerciseData={exercise1InterrogativeData} title="Ejercicio 1: Forma Interrogativa" description="Traduce las frases a su forma interrogativa usando 'be going to'." formType="interrogative" />;
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
                        <CardHeader>
                            <CardTitle>Vocabulario Final</CardTitle>
                            <CardDescription>Traduce los planes al inglés.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                {plansVocab.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">
                                            <Input
                                                value={finalVocabAnswers[index] || ''}
                                                onChange={(e) => handleFinalVocabInputChange(index, e.target.value)}
                                                className={cn(getFinalVocabInputClass(index))}
                                                placeholder="Escribe la traducción..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button onClick={handleCheckFinalVocab}>Verificar Vocabulario</Button>
                        </CardFooter>
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
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const Icon = item.icon;
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isSelected = selectedTopic === item.key || item.subItems?.some(si => si.key === selectedTopic);

                                                return (
                                                    <li key={item.key}>
                                                        {!item.subItems ? (
                                                            <div onClick={() => handleTopicSelect(item.key)}
                                                                className={cn(
                                                                    'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                                                    isLocked ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                                                    selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                                                )}>
                                                                <div className="flex items-center gap-3">
                                                                    <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                                    <span>{item.name}</span>
                                                                </div>
                                                                {isLocked && <Lock className="h-4 w-4 text-yellow-500" />}
                                                            </div>
                                                        ) : (
                                                            <Collapsible defaultOpen={isSelected || item.subItems.some(si => si.status !== 'locked')} disabled={isLocked}>
                                                                <CollapsibleTrigger className="w-full">
                                                                    <div className={cn(
                                                                        'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full',
                                                                        isLocked ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                                                        isSelected && 'bg-muted text-primary font-semibold'
                                                                    )}>
                                                                        <div className="flex items-center gap-3">
                                                                            <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                                            <span>{item.name}</span>
                                                                        </div>
                                                                        {isLocked ? <Lock className="h-4 w-4 text-yellow-500" /> : <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />}
                                                                    </div>
                                                                </CollapsibleTrigger>
                                                                <CollapsibleContent>
                                                                    <ul className="pl-8 pt-1 space-y-1">
                                                                        {item.subItems.map((subItem) => {
                                                                            const SubIcon = subItem.status === 'completed' ? CheckCircle : subItem.icon;
                                                                            const isSubLocked = subItem.status === 'locked' && !isAdmin;
                                                                            return (
                                                                                <li key={subItem.key} onClick={() => handleTopicSelect(subItem.key)}
                                                                                    className={cn(
                                                                                        'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                                                                        isSubLocked ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                                                                        selectedTopic === subItem.key && 'bg-muted text-primary font-semibold'
                                                                                    )}>
                                                                                    <div className='flex items-center gap-3'>
                                                                                        <SubIcon className={cn("h-5 w-5", subItem.status === 'completed' ? 'text-green-500' : '')} />
                                                                                        <span>{subItem.name}</span>
                                                                                    </div>
                                                                                    {isSubLocked && <Lock className="h-4 w-4 text-yellow-500" />}
                                                                                </li>
                                                                            )
                                                                        })}
                                                                    </ul>
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        )}
                                                    </li>
                                                );
                                            })}
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
