
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Loader2, ArrowRight, Sparkles, BookText, HelpCircle, Lightbulb, MessageSquare, Gamepad2, Globe, XCircle } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { LargeTextTranslation } from '@/components/dashboard/large-text-translation';
import { DialogueCompletionExercise } from '@/components/kids/exercises/dialogue-completion-exercise';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';
import { FillInTheBlanksExercise } from '@/components/kids/exercises/fill-in-the-blanks';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
};

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_u2_c10_v22_stable';
const mainProgressKey = 'progress_a1_eng_unit_2_class_10';

const vocabularyData = {
    verbos: [
        { spanish: 'CAER', english: 'TO FALL' },
        { spanish: 'SENTIR', english: 'TO FEEL' },
        { spanish: 'LUCHAR', english: 'TO FIGHT' },
        { spanish: 'ENCONTRAR', english: 'TO FIND' },
        { spanish: 'DAR', english: 'TO GIVE' },
        { spanish: 'VOLAR', english: 'TO FLY' },
        { spanish: 'OLVIDAR', english: 'TO FORGET' },
        { spanish: 'PERDONAR', english: 'TO FORGIVE' },
    ],
    palabras: [
        { spanish: 'CALIENTE', english: 'HOT' },
        { spanish: 'CALIDO', english: 'WARM' },
        { spanish: 'ESTACION (TIEMPO)', english: 'SEASON' },
        { spanish: 'CUCHILLO', english: 'KNIFE' },
        { spanish: 'OLLA', english: 'POT' },
        { spanish: 'TENEDOR', english: 'FORK' },
        { spanish: 'CUCHARA', english: 'SPOON' },
        { spanish: 'PLATO', english: 'DISH' },
        { spanish: 'VASO', english: 'GLASS' },
        { spanish: 'CUBIERTOS', english: 'SILVERWARE' },
    ]
};

const dialogue1Phrases = [
    { spanish: "MARY: ¿CUANTO VALE ESTA BUFANDA?", answers: ["how much is this scarf?"] },
    { spanish: "JON: ESTA CUESTA 20 DOLARES", answers: ["this costs 20 dollars", "this is 20 dollars"] },
];

const dialogue2Data = [
    { speaker: "MARY", parts: ["EXCUSE ME. HOW MUCH ARE ", " T-SHIRTS?"], answers: [["THOSE"]] },
    { speaker: "JON", parts: ["WHICH ", "? DO YOU MEAN ", "?"], answers: [["ONES"], ["THESE", "THOSE"]] },
];

const exerciseThe2Data: CompletionPrompt[] = [
    { parts: ["I WENT TO ", " SICILY ISLAND IN ITALY LAST YEAR."], answers: [""] },
    { parts: ["DO YOU LIKE ", " PARIS ARCHITECTURE?"], answers: ["THE"] },
];

export default function EngA1Class10Page() {
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

    const [vocabAnswers, setVocabAnswers] = useState<any>({});
    const [vocabValidation, setVocabValidation] = useState<any>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Words)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'dialogue1', name: 'Dialogue 1', icon: MessageSquare, status: 'locked' },
        { key: 'exercise2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'dialogue2', name: 'Dialogue 2', icon: MessageSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex_the1', name: 'Exercise with "The" 1', icon: PenSquare, status: 'locked' },
        { key: 'ex_the2', name: 'Exercise with "The" 2', icon: PenSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        
        const initA: any = {}; const initV: any = {};
        Object.keys(vocabularyData).forEach(c => {
            initA[c] = Array((vocabularyData as any)[c].length).fill('');
            initV[c] = Array((vocabularyData as any)[c].length).fill('unchecked');
        });
        setVocabAnswers(initA); setVocabValidation(initV);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const s = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => (s as any)[t.key] = t.status);
        if (JSON.stringify(s) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let win = false; let next: string | null = null;
            const np = curr.map(t => ({ ...t }));
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { np[i + 1].status = 'active'; win = true; next = np[i + 1].key; }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'grammar2'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleVocabCheck = () => {
        let ok = false; const nv: any = {};
        Object.keys(vocabularyData).forEach(c => {
            nv[c] = (vocabularyData as any)[c].map((v: any, i: number) => {
                const res = v.english.toUpperCase() === vocabAnswers[c][i].trim().toUpperCase();
                if (res) ok = true; return res ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(nv); setCanAdvanceVocab(ok);
        if (ok) toast({ title: "¡Bien hecho!" }); else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        const topic = learningPath.find(t => t.key === selectedTopic);
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulary</CardTitle></CardHeader>
                        <CardContent><Accordion type="multiple" defaultValue={['verbos', 'palabras']}>{Object.keys(vocabularyData).map(c => (<AccordionItem key={c} value={c}><AccordionTrigger className="capitalize font-bold">{c}</AccordionTrigger><AccordionContent><div className="grid grid-cols-2 gap-2">{(vocabularyData as any)[c].map((v: any, i: number) => (<React.Fragment key={i}><div className="p-2 border rounded bg-muted/10">{v.spanish}</div><Input value={vocabAnswers[c][i]} onChange={e => { const na = {...vocabAnswers}; na[c][i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} className={cn(vocabValidation[c]?.[i] === 'correct' ? 'border-green-500' : vocabValidation[c]?.[i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}</div></AccordionContent></AccordionItem>))}</Accordion></CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={handleVocabCheck}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar': return <Card className="p-6"><CardTitle>WHAT vs WHICH</CardTitle><CardContent className="pt-4"><p>WHAT: General | WHICH: Opciones limitadas.</p></CardContent></Card>;
            case 'grammar2': return <Card className="p-6"><CardTitle>EL ARTÍCULO "THE"</CardTitle><CardContent className="pt-4"><p>THE = EL, LA, LOS, LAS.</p></CardContent></Card>;
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c10_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1: ONE / ONES" />;
            case 'dialogue1': return <LargeTextTranslation title="Dialogue 1" phrases={dialogue1Phrases} onComplete={() => handleTopicComplete('dialogue1')} />;
            case 'exercise2': return <SimpleTranslationExercise exerciseKey="c10_ex2" course="a1" onComplete={() => handleTopicComplete('exercise2')} title="Exercise 2" />;
            case 'dialogue2': return <DialogueCompletionExercise title="Dialogue 2" description="Completa con demostrativos." dialogue={dialogue2Data} onComplete={() => handleTopicComplete('dialogue2')} />;
            case 'ex_the1': return <SimpleTranslationExercise exerciseKey="c10_the1" course="a1" onComplete={() => handleTopicComplete('ex_the1')} title="Exercise with 'The' 1" />;
            case 'ex_the2': return <SentenceCompletionExercise title="Exercise with 'The' 2" description="Usa THE si es necesario." data={exerciseThe2Data} onComplete={() => handleTopicComplete('ex_the2')} />;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>;
        }
    };

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm">Volver a la Unidad 2</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 10</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle>Ruta</CardTitle></CardHeader>
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
                        <div className="md:col-span-9 md:order-1">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
