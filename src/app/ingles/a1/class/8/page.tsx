'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Mic, Loader2, RefreshCw, Flame, Trophy, Gamepad2, ChevronDown, Pencil, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';

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

const progressStorageVersion = 'progress_a1_eng_u1_c8_v6_stable';
const mainProgressKey = 'progress_a1_eng_unit_1_class_8';

const vocabularyData = [
    { spanish: 'ESTE/A', english: ['THIS'] },
    { spanish: 'ESTOS/AS', english: ['THESE'] },
    { spanish: 'ESE/A', english: ['THAT'] },
    { spanish: 'ESOS/AS', english: ['THOSE'] },
    { spanish: 'PERO', english: ['BUT'] },
    { spanish: 'MIENTRAS', english: ['WHILE'] },
    { spanish: 'ENTONCES', english: ['SO'] },
    { spanish: 'LUEGO', english: ['THEN'] },
    { spanish: 'ALREDEDOR', english: ['AROUND'] },
    { spanish: 'MEDIA NOCHE', english: ['MIDNIGHT'] },
    { spanish: 'MEDIO DIA', english: ['MIDDAY', 'NOON'] },
    { spanish: 'DESDE', english: ['FROM'] },
    { spanish: 'TAMBIÉN', english: ['ALSO', 'TOO'] },
    { spanish: 'ACERCA DE', english: ['ABOUT'] },
    { spanish: 'CADA', english: ['EVERY', 'EACH'] },
    { spanish: 'CASI', english: ['ALMOST'] },
];

const exercise5Data: CompletionPrompt[] = [
    { parts: ["WHERE IS ", " WALLET?"], answers: ["THE"] },
    { parts: ["THEY LOVE ", " LANGUAGES"], answers: [""] },
    { parts: ["THIS IS ", " SARA'S PRESENT."], answers: [""] },
    { parts: ["THIS IS ", " JOHN'S HOUSE."], answers: [""] },
    { parts: ["THESE ARE ", " KEYS HE GAVE ME."], answers: ["THE"] },
    { parts: ["", " STRAWBERRIES ARE DELICIOUS."], answers: [""] },
    { parts: ["HE LIKES ", " SUN GLASSES."], answers: [""] },
    { parts: ["WHERE ARE ", " SHOES?"], answers: ["THE"] },
    { parts: ["I DO NOT LIKE ", " SUNNY DAYS."], answers: [""] },
    { parts: ["HE ISN'T ", " ANTHONY'S HOUSE."], answers: [""] },
    { parts: ["", " DOOR OF MY HOUSE."], answers: ["THE"] },
    { parts: ["SHE WORKS WITH ", " ENGINEER."], answers: [""] },
];

const LinesWritingExercise = ({ title, description, lineCount = 12, onComplete, studentDocRef, initialData, savePath }: any) => {
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));
    useEffect(() => { if (initialData && Array.isArray(initialData)) setLines(initialData); }, [initialData]);
    const handleLineChange = (idx: number, val: string) => {
        const n = [...lines]; n[idx] = val; setLines(n);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePath]: n });
    };
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader><CardTitle>{title}</CardTitle><CardDescription className="text-primary">{description}</CardDescription></CardHeader>
            <CardContent className="space-y-2">{lines.map((l, i) => (<div key={i} className="flex gap-2"><span className="font-bold w-6">{i + 1}.</span><Input value={l} onChange={e => handleLineChange(i, e.target.value)} className="bg-muted/30" /></div>))}</CardContent>
            <CardFooter className="pt-4 border-t"><Button onClick={onComplete}>Avanzar</Button></CardFooter>
        </Card>
    );
};

export default function EngA1Class8Page() {
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
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Words)', icon: BookOpen, status: 'active' },
        { key: 'dictation1', name: 'Dictation 1', icon: Mic, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'dictation2', name: 'Dictation 2', icon: Mic, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'writing1', name: 'Writing 1', icon: Pencil, status: 'locked' },
        { key: 'writing2', name: 'Writing 2', icon: Pencil, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const data = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (data[t.key]) t.status = data[t.key]; });
            savedST = data.lastSelectedTopic || '';
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
        const save = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => (save as any)[t.key] = t.status);
        if (JSON.stringify(save) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: save, [`progress.${mainProgressKey}`]: progressValue });
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
        if (!isAdmin && t?.status === 'locked') { 
            toast({ variant: "destructive", title: "Contenido Bloqueado" }); 
            return; 
        }
        setSelectedTopic(topicKey);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
        const topic = learningPath.find(t => t.key === selectedTopic);
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulary</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-2">{vocabularyData.map((v, i) => (<React.Fragment key={i}><div className="p-3 border rounded-lg bg-muted/20">{v.spanish}</div><Input value={vocabAnswers[i]} onChange={e => { const n = [...vocabAnswers]; n[i] = e.target.value; setVocabAnswers(n); setVocabValidation(vv => { const nv = [...vv]; nv[i] = 'unchecked'; return nv; }); }} className={cn(vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}</div></CardContent>
                        <CardFooter className="flex justify-between"><Button onClick={() => { let all = true; const nv = vocabularyData.map((v, i) => { const c = v.english.some(e => e.toLowerCase() === vocabAnswers[i].trim().toLowerCase()); if (!c) all = false; return c ? 'correct' : 'incorrect'; }); setVocabValidation(nv); if (all) toast({ title: "¡Perfecto!" }); }}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!vocabValidation.every(v => v === 'correct') && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'dictation1': return <LinesWritingExercise title="Dictation 1" description="Escribe las frases dictadas." onComplete={() => handleTopicComplete('dictation1')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1} savePath={`lessonProgress.${progressStorageVersion}.dictation1`} />;
            case 'dictation2': return <LinesWritingExercise title="Dictation 2" description="Escribe las frases dictadas." onComplete={() => handleTopicComplete('dictation2')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2} savePath={`lessonProgress.${progressStorageVersion}.dictation2`} />;
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c8_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c8_ex2" course="a1" onComplete={() => handleTopicComplete('ex2')} />;
            case 'ex3': return <SimpleTranslationExercise exerciseKey="c8_ex3" course="a1" onComplete={() => handleTopicComplete('ex3')} />;
            case 'ex4': return <SimpleTranslationExercise exerciseKey="c8_ex4" course="a1" onComplete={() => handleTopicComplete('ex4')} />;
            case 'ex5': return <SentenceCompletionExercise title="Exercise 5" description="Completa con THE." data={exercise5Data} onComplete={() => handleTopicComplete('ex5')} />;
            case 'vocab_game': return <VocabularyMatchingGame data={vocabularyData} onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'writing1': return <CreativeWritingExercise title="Writing 1" description="About your school." prompts={[{ id: 'w1', question: '' }]} onComplete={() => handleTopicComplete('writing1')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing1} savePath={`lessonProgress.${progressStorageVersion}.writing1`} />;
            case 'writing2': return <LinesWritingExercise title="Writing 2" description="Escribe frases posesivas." onComplete={() => handleTopicComplete('writing2')} studentDocRef={studentDocRef} lineCount={6} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing2} savePath={`lessonProgress.${progressStorageVersion}.writing2`} />;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white"><Link href="/ingles/a1" className="hover:underline text-sm">Volver al curso A1</Link><h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 8</h1></div>
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