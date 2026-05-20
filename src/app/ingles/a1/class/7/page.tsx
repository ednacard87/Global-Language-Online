'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Loader2, Plus, Minus, Star, ChevronDown, Pencil, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_u2_c7_v11_stable';
const mainProgressKey = 'progress_a1_eng_unit_2_class_7';

const vocabularyData = [
    { spanish: 'VOLVERSE, LLEGAR A SER', english: 'TO BECOME' },
    { spanish: 'COMENZAR', english: 'TO BEGIN' },
    { spanish: 'ROMPER', english: 'TO BREAK' },
    { spanish: 'TRAER, LLEVAR', english: 'TO BRING' },
    { spanish: 'CONSTRUIR', english: 'TO BUILD' },
    { spanish: 'COMPRAR', english: 'TO BUY' },
    { spanish: 'VENIR', english: 'TO COME' },
    { spanish: 'COSTAR', english: 'TO COST' },
    { spanish: 'CORTAR', english: 'TO CUT' },
    { spanish: 'HACER', english: 'TO DO' },
    { spanish: 'DIBUJAR', english: 'TO DRAW' },
    { spanish: 'BEBER', english: 'TO DRINK' },
    { spanish: 'MANEJAR', english: 'TO DRIVE' },
    { spanish: 'COMER', english: 'TO EAT' },
];

const exercise6Data: CompletionPrompt[] = [
    { parts: ["", " CAR THAT I BOUGHT IS FAST."], answers: ["THE"] },
    { parts: ["", " ENGLISH IS SPOKEN IN MANY COUNTRIES."], answers: [""] },
    { parts: ["", " HOUSES ARE BIG ON THAT FARM."], answers: ["THE"] },
    { parts: ["", " BLUE CAR IS BETTER THAN THE RED ONE."], answers: ["THE"] },
    { parts: ["DOGS ARE ", " BEST PETS."], answers: ["THE"] },
    { parts: ["", " SPORTS ARE IMPORTANT IN MY LIFE."], answers: [""] },
    { parts: ["", " LIONS ARE THE MOST BEAUTIFUL ANIMALS."], answers: [""] },
    { parts: ["I HATE ", " BASKETBALL."], answers: [""] },
    { parts: ["I LIKE ", " WEATHER IN THAT CITY."], answers: ["THE"] },
    { parts: ["", " HORSES ARE PRETTY."], answers: [""] },
    { parts: ["I LIKE ", " WHITE SHIRTS."], answers: [""] },
    { parts: ["WHERE IS ", " DOG? ", " DOG IS UNDER THE BED."], answers: ["THE", "THE"] },
    { parts: ["", " SUN IS SHINING."], answers: ["THE"] },
];

export default function EngA1Class7Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Verbs)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar 3', icon: GraduationCap, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: Pencil, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: 'Exercise 8', icon: Pencil, status: 'locked' },
        { key: 'ex9', name: 'Exercise 9', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedSelectedTopic = '';

        if (isAdmin) {
          path.forEach(item => { item.status = 'completed'; });
        } else if(studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (savedData[item.key]) item.status = savedData[item.key]; });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopic(savedSelectedTopic || firstActive?.key || path[0].key);
        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, t]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });
        if (JSON.stringify(statusesToSave) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: statusesToSave, [`progress.${mainProgressKey}`]: progressValue });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active';
                    wasUnlocked = true;
                    nextToSelect = newPath[idx + 1].key;
                }
            }
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSelect) { const n = nextToSelect; setTimeout(() => setSelectedTopic(n), 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'grammar2', 'grammar3'].includes(topicKey)) setTopicToComplete(topicKey);
    };

    const handleVocabCheck = () => {
        let ok = false;
        const newVal = vocabularyData.map((item, idx) => {
            const isCorrect = item.english.toUpperCase() === vocabAnswers[idx].trim().toUpperCase();
            if (isCorrect) ok = true;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(newVal as any);
        if (ok) { toast({ title: "¡Bien hecho!" }); setCanAdvanceVocab(true); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulary (Verbs)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg">Español</div><div className="font-bold p-3 bg-muted rounded-lg">Inglés</div>
                                {vocabularyData.map((item, idx) => (
                                    <React.Fragment key={idx}><div className="p-3 border rounded-lg">{item.spanish}</div>
                                    <Input value={vocabAnswers[idx]} onChange={e => { const n = [...vocabAnswers]; n[idx] = e.target.value; setVocabAnswers(n); setVocabValidation(v => { const nv = [...v]; nv[idx] = 'unchecked'; return nv as any; }); setCanAdvanceVocab(false); }} className={cn(vocabValidation[idx] === 'correct' ? 'border-green-500' : vocabValidation[idx] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={handleVocabCheck}>Verificar</Button><Button onClick={() => setTopicToComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar': return <Card className="shadow-soft rounded-lg border-2 border-brand-purple p-6"><CardTitle>ARTÍCULO "THE"</CardTitle><CardContent className="pt-4 text-base space-y-4"><p>THE = EL, LA, LOS, LAS.</p><p>Se usa para hablar de algo específico. NO se usa para generalizar.</p></CardContent></Card>;
            case 'grammar2': return <Card className="shadow-soft rounded-lg border-2 border-brand-purple p-6"><CardTitle>ARTÍCULOS "A / AN"</CardTitle><CardContent className="pt-4 text-base space-y-4"><p>A/AN = un / una.</p><p>A + consonante | AN + vocal.</p></CardContent></Card>;
            case 'grammar3': return <Card className="shadow-soft rounded-lg border-2 border-brand-purple p-6"><CardTitle>LIKES & DISLIKES</CardTitle><CardContent className="pt-4 text-base space-y-4"><p>Love, Like, Enjoy, Prefer, Dislike, Hate.</p></CardContent></Card>;
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c7_ex1" course="a1" onComplete={() => setTopicToComplete('ex1')} title="Exercise 1" />;
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c7_ex2" course="a1" onComplete={() => setTopicToComplete('ex2')} title="Exercise 2" />;
            case 'ex3': return <SimpleTranslationExercise exerciseKey="c7_ex3" course="a1" onComplete={() => setTopicToComplete('ex3')} title="Exercise 3" />;
            case 'ex4': return <SimpleTranslationExercise exerciseKey="c7_ex4" course="a1" onComplete={() => setTopicToComplete('ex4')} title="Exercise 4" />;
            case 'ex5': return <CreativeWritingExercise title="Exercise 5" prompts={[{ id: 'p1', question: '1- WHAT DO YOU LIKE AND WHAT DO YOU DISLIKE?' }, { id: 'p2', question: '2- PIENSA EN ALGUIEN Y ESCRIBE SUS GUSTOS.' }]} onComplete={() => setTopicToComplete('ex5')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingEx5} savePath={`lessonProgress.${progressStorageVersion}.writingEx5`} />;
            case 'ex6': return <SentenceCompletionExercise title="Exercise 6" description="Usa THE si es necesario." data={exercise6Data} onComplete={() => setTopicToComplete('ex6')} />;
            case 'ex7': return <SimpleTranslationExercise exerciseKey="c7_ex7" course="a1" onComplete={() => setTopicToComplete('ex7')} title="Exercise 7: A vs AN" />;
            case 'ex8': return <CreativeWritingExercise title="Exercise 8" prompts={[{ id: 'p1', question: 'DESCRIBE TU CIUDAD (GUSTOS).' }]} onComplete={() => setTopicToComplete('ex8')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingEx8} savePath={`lessonProgress.${progressStorageVersion}.writingEx8`} />;
            case 'ex9': return <SimpleTranslationExercise exerciseKey="c7_ex9" course="a1" onComplete={() => setTopicToComplete('ex9')} title="Exercise 9" />;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white"><Link href="/ingles/a1" className="hover:underline text-sm">Volver al curso A1</Link><h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 7 (A1)</h1></div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle>Aventura</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => (
                                            <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
                                                <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                            </li>
                                        ))}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-sm mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-2" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
