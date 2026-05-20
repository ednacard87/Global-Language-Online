'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Loader2, ArrowRight, Pencil, Clock, ArrowLeft, Trophy, Activity, BookText, Sparkles } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { ShortAnswerPresentSimpleExercise, type ShortAnswerPresentSimplePrompt } from '@/components/kids/exercises/short-answer-present-simple';

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

const progressStorageVersion = 'progress_a1_eng_u3_c12_v26_stable';
const mainProgressKey = 'progress_a1_eng_unit_3_class_12';

const timeExpressionsData = [
    { spanish: 'ANOCHE', english: ['LAST NIGHT'] },
    { spanish: 'ESTA NOCHE', english: ['TONIGHT'] },
];

const class12Exercise3Data: ShortAnswerPresentSimplePrompt[] = [
    { question: "ARE YOU CALLING YOUR MOTHER?", answers: { shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] } },
];

export default function EngA1Class12Page() {
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

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(timeExpressionsData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(timeExpressionsData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Time Expressions)', icon: Clock, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
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
        if (['grammar', 'grammar2'].includes(topicKey)) setTopicToComplete(topicKey);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        const topic = learningPath.find(t => t.key === selectedTopic);
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple">
                        <CardHeader><CardTitle>Time Expressions</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-2">{timeExpressionsData.map((v, i) => (<React.Fragment key={i}><div className="p-2 border rounded bg-muted/10">{v.spanish}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} className={cn(vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}</div></CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={() => { let ok = false; const nv = timeExpressionsData.map((v, i) => { const cor = v.english.some(e => e.toUpperCase() === vocabAnswers[i].trim().toUpperCase()); if (cor) ok = true; return cor ? 'correct' : 'incorrect'; }); setVocabValidation(nv); setCanAdvanceVocab(ok); if (ok) toast({ title: "¡Bien hecho!" }); }}>Verificar</Button><Button onClick={() => setTopicToComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar': return <Card className="p-6"><CardTitle>PRESENT CONTINUOUS</CardTitle><CardContent className="pt-4"><p>Acciones ocurriendo AHORA (-ING).</p></CardContent></Card>;
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c12_ex1" course="a1" onComplete={() => setTopicToComplete('ex1')} />;
            case 'grammar2': return <Card className="p-6"><CardTitle>ING Rules</CardTitle><CardContent className="pt-4"><p>Take -> Taking | Stop -> Stopping.</p></CardContent></Card>;
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c12_ex2" course="a1" onComplete={() => setTopicToComplete('ex2')} />;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white"><Link href="/ingles/a1" className="hover:underline text-sm">Volver al curso A1</Link><h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 12</h1></div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
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
                    </div>
                </div>
            </main>
        </div>
    );
}
