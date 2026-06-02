'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Loader2, Plus, Minus, Star, ChevronDown, Pencil, ArrowRight, Lightbulb, BookText, XCircle } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    { spanish: 'COSTAR (PASADO)', english: 'COST' },
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

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Verbs)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar 3', icon: GraduationCap, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'create2', name: 'Create 2', icon: Pencil, status: 'locked' },
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
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);
    
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
        if (['grammar', 'grammar2', 'grammar3'].includes(topicKey)) handleTopicComplete(topicKey);
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
                        <CardFooter className="flex justify-between"><Button onClick={handleVocabCheck}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar': 
                return (
                    <div className="space-y-6 text-left">
                        <h2 className="text-3xl font-black text-center text-primary uppercase tracking-tighter">THE DEFINITE ARTICLE “THE” 🚀</h2>
                        <p className="text-center text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-sm">EL ARTICULO DETERMINADO "THE"</p>

                        <div className="grid grid-cols-1 gap-6">
                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader><CardTitle className="text-primary text-xl font-black uppercase">1 - SIGNIFICADO</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-lg text-slate-900 dark:text-slate-100">THE corresponde a: <strong>“EL”, “LA”, “LOS”, “LAS”</strong>.</p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-background/50 rounded-xl border space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Masculino/Singular</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">THE BOY ( EL NIÑO)</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">THE BOOK ( EL LIBRO)</p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-xl border space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Femenino/Singular</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">THE GIRL ( LA NIÑA)</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">THE TABLE ( LA MESA)</p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-xl border space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Masculino/Plural</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">THE BOYS (LOS NIÑOS)</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">THE BOOKS (LOS LIBROS)</p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-xl border space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Femenino/Plural</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">THE GIRLS (LAS NIÑAS)</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">THE TABLES (LAS MESAS)</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader><CardTitle className="text-primary text-xl font-black uppercase">2 - PRONUNCIACIÓN</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-3 p-4 bg-background/50 rounded-xl border">
                                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">a</div>
                                        <p className="text-lg text-slate-900 dark:text-slate-100">Precedida de <strong>consonante</strong> se pronuncia <strong>“DE”</strong>: THE LAMP (DE LAMP)</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-background/50 rounded-xl border">
                                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">b</div>
                                        <p className="text-lg text-slate-900 dark:text-slate-100">Precedida de <strong>vocal</strong> se pronuncia <strong>“DI”</strong>: THE ENEMY (DI ENEMI)</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader><CardTitle className="text-primary text-xl font-black uppercase">3 - USO ESPECÍFICO</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-lg text-slate-900 dark:text-slate-100">Se usa cuando se habla de <strong>"algo en particular o específico"</strong>:</p>
                                    <ul className="space-y-2 font-mono italic text-muted-foreground pl-4">
                                        <li>1. WHAT IS THE NAME OF THE RESTAURANT?</li>
                                        <li>2. DO YOU REMEMBER THE DAY WHEN WE WENT TO WASHINGTON?</li>
                                        <li>3. THE DOCTOR IS VERY GOOD</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm border-2 border-dashed border-destructive/20">
                                <CardHeader><CardTitle className="text-destructive text-xl font-black uppercase">4 - NO SE USA</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">NO se pone cuando se habla en general o se generaliza:</p>
                                    <ul className="space-y-2 font-mono italic text-muted-foreground pl-4">
                                        <li className="flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /> I LIKE FOOTBALL (No: I like the football)</li>
                                        <li className="flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /> SHE LOVES MUSIC (No: she loves the music)</li>
                                        <li className="flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /> PEOPLE ARE STRANGE (No: the people are strange)</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );
            case 'grammar2': 
                return (
                    <div className="space-y-6 text-left">
                        <h2 className="text-3xl font-black text-center text-primary uppercase tracking-tighter">INDEFINITIVE ARTICLES 🚀</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardContent className="p-8 space-y-6">
                                    <div className="text-center">
                                        <p className="text-5xl font-black text-primary">A - AN</p>
                                        <p className="text-xl font-bold mt-2 text-muted-foreground">Significado: un / una</p>
                                    </div>
                                    <Separator />
                                    <div className="grid sm:grid-cols-2 gap-4 text-center">
                                        <div className="p-6 bg-background rounded-2xl border-2 border-dashed">
                                            <p className="text-lg font-black text-primary">A + Consonant</p>
                                            <p className="mt-1 italic text-slate-900 dark:text-slate-100">A car</p>
                                        </div>
                                        <div className="p-6 bg-background rounded-2xl border-2 border-dashed">
                                            <p className="text-lg font-black text-primary">An + Vowel</p>
                                            <p className="mt-1 italic text-slate-900 dark:text-slate-100">An elevator</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-center">
                                        <p className="font-bold text-slate-900 dark:text-slate-100">USO: Son utilizados para referirnos a algo o alguien en <span className="underline uppercase">Singular</span>.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );
            case 'grammar3': 
                return (
                    <div className="space-y-6 text-left">
                        <h2 className="text-3xl font-black text-center text-primary uppercase tracking-tighter">LIKES AND DISLIKES 🚀</h2>
                        <p className="text-center text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-sm">(VERBOS DE PREFERENCIA)</p>

                        <div className="grid grid-cols-1 gap-6">
                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardContent className="p-6 grid sm:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-green-500 font-black"><Plus className="h-6 w-6" /> POSITIVE</div>
                                        <ul className="space-y-1 text-lg font-medium pl-8 text-slate-900 dark:text-slate-100">
                                            <li>Love : Encantar</li>
                                            <li>Like : Gustar</li>
                                            <li>Enjoy : Disfrutar</li>
                                            <li>Prefer : Preferir</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-red-500 font-black"><Minus className="h-6 w-6" /> NEGATIVE</div>
                                        <ul className="space-y-1 text-lg font-medium pl-8 text-slate-900 dark:text-slate-100">
                                            <li>Dislike : No gustar</li>
                                            <li>Hate : Odiar</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm border-2 border-brand-blue/30">
                                <CardHeader><CardTitle className="text-brand-blue text-xl font-black uppercase">NOTICA: REALLY</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-lg text-slate-900 dark:text-slate-100">Para decir "de verdad", "realmente" o "muchísimo":</p>
                                    <p className="text-2xl font-black text-center py-4 bg-background/50 rounded-xl border border-brand-blue/20 text-slate-900 dark:text-slate-100">I REALLY LIKE WATER (+)</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader><CardTitle className="text-primary text-xl font-black uppercase">1 - CON SUSTANTIVOS</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid gap-3 font-mono italic text-muted-foreground p-4 bg-background/50 rounded-xl border">
                                        <p>ME GUSTAN LAS PELICULAS</p>
                                        <p>NO ME GUSTAN LAS HAMBURGUESAS</p>
                                        <p>A ELLA NO LE GUSTA EL AJO</p>
                                        <p>ÉL ODIA LAS SERIES</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader><CardTitle className="text-primary text-xl font-black uppercase">2 - CON VERBOS (DOS OPCIONES)</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-lg text-slate-900 dark:text-slate-100">Cuando van acompañados de otros verbos, puedes usar cualquiera de estas dos opciones sin variar el sentido:</p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-6 bg-background rounded-2xl border-2 border-dashed">
                                            <p className="text-lg font-black text-primary">a) TO (Infinitive)</p>
                                            <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">LIKE + TO + VERB</p>
                                            <p className="mt-2 text-sm italic text-slate-700 dark:text-slate-300">I LIKE TO COOK PASTA</p>
                                        </div>
                                        <div className="p-6 bg-background rounded-2xl border-2 border-dashed">
                                            <p className="text-lg font-black text-primary">b) ING (Gerund)</p>
                                            <p className="mt-1 font-bold text-slate-900 dark:text-slate-100">LIKE + VERB-ING</p>
                                            <p className="mt-2 text-sm italic text-slate-700 dark:text-slate-300">I LIKE COOKING PASTA</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm border-2 border-brand-purple/30">
                                <CardHeader><CardTitle className="text-brand-purple text-xl font-black uppercase">USO DE "PREFER"</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-foreground underline">CON SUSTANTIVOS (NOUNS)</h4>
                                        <div className="p-4 bg-background/50 rounded-xl border font-mono">
                                            <p className="text-primary font-bold">Pronombre + prefer + sustantivo + TO + sustantivo</p>
                                            <p className="mt-2 text-sm italic text-slate-700 dark:text-slate-300">yo prefiero la pizza a la hamburguesa</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">I prefer pizza TO hamburger</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-foreground underline">CON VERBOS</h4>
                                        <div className="p-4 bg-background/50 rounded-xl border font-mono">
                                            <p className="text-primary font-bold">Pronombre + prefer + verbo-ING + TO + verbo-ING</p>
                                            <p className="mt-2 text-sm italic text-slate-700 dark:text-slate-300">yo prefiero ir a la playa que quedarme en la piscina</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">I prefer GOING to the beach TO STAYING at the pool</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

                // ----- Vocabulario de los ejercicios -----
             case 'ex1': return <SimpleTranslationExercise exerciseKey="c7_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1" vocabulary={{"parques": "parks", "tranquilos": "quiet", "noche": "night", "hermana" : "sister", "joven": "young", "jugos": "juices", "saludables": "healthy", "película": "movie", "Interesante" : "interesting" , "ciudad" : "city" , "la mas grande" : "the biggest" , "especialmente" : "especially" , "arañas": "spiders", "frutas" : "fruits" , "alto" : "tall" , "mariposas": "butterflies", "audifonos": "headphones" , "molestar" : "to bother" }} highlightVocabulary={true} />;
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c7_ex2" course="a1" onComplete={() => handleTopicComplete('ex2')} title="Exercise 2" vocabulary={{"encontró": "found", "perdió": "lost", "celular" : "cellphone" , "verduras": "vegetables", "supermercado" : "supermarket" , "vió" : "saw" , "accidente": "accident", "calle": "street", "concierto": "concert", "ingeniero": "engineer", "esposa": "wife"}} highlightVocabulary={true} />;
            case 'ex3': return <SimpleTranslationExercise exerciseKey="c7_ex3" course="a1" onComplete={() => handleTopicComplete('ex3')} title="Exercise 3" vocabulary={{"manzana": "apple", "sandia": "watermelon", "primo": "cousin", "gris" : "gray" , "gafas": "glasses", "hermano": "brother"}} highlightVocabulary={true} />;
            case 'ex4': return <SimpleTranslationExercise exerciseKey="c7_ex4" course="a1" onComplete={() => handleTopicComplete('ex4')} title="Exercise 4" vocabulary={{"preferir": "prefer", "calor": "heat", "frio": "cold", "terror": "horror", "ajo": "garlic", "futbol" : "soccer" , "verduras" : "vegetables" , "metal": "metal", "novelas": "soap operas", "fresas": "strawberries", "Caminar" : "to walk" , "Barrio" : "neighborhood" , "Peligroso" : "dangerous" , "pintar": "paint", "mentiras": "lies", "carpintería": "carpentry", "espinaca": "spinach", "remolacha": "beet", "Apartamento" : "apartment" , "Romantica" : "romantic" , "Rompecabezas" : "puzzle" , "Redes sociales" : "social Media" , "pueblo": "town", "ciudad": "city" , "Carne" : "meat"}} highlightVocabulary={true} />;
            case 'create1': return <CreativeWritingExercise title="Create 1" prompts={[{ id: 'p1', question: '1- WHAT DO YOU LIKE AND WHAT DO YOU DISLIKE?' }, { id: 'p2', question: '2- PIENSA EN ALGUIEN Y ESCRIBE SUS GUSTOS.' }]} onComplete={() => handleTopicComplete('create1')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingEx5} savePath={`lessonProgress.${progressStorageVersion}.writingEx5`} />;
            case 'ex6': return <SentenceCompletionExercise title="Exercise 6" description='Instrucciones : Inserta el "THE" donde sea necesario.' data={exercise6Data} onComplete={() => handleTopicComplete('ex6')} />;
            case 'ex7': return <SimpleTranslationExercise exerciseKey="c7_ex7" course="a1" onComplete={() => handleTopicComplete('ex7')} title="Exercise 7" vocabulary={{"Carne": "meat", "Restaurante": "restaurant", "Futbol": "soccer", "Lleno": "full", "arte": "Art", "Hermana": "sister", "Ingeniero": "engineer", "Ajo": "garlic" , "Excepto" : "except"}} highlightVocabulary={true} />;
            case 'create2': return <CreativeWritingExercise title="Create 2" description="WHAT DO YOU LIKE AND WHAT DO YOU DISLIKE OF MEDELLIN? (5 SENTENCES)" prompts={[{ id: 'p1', question: 'DESCRIBE TU CIUDAD (GUSTOS).' }]} onComplete={() => handleTopicComplete('create2')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingEx8} savePath={`lessonProgress.${progressStorageVersion}.writingEx8`} />;
            case 'ex9': return <SimpleTranslationExercise exerciseKey="c7_ex9" course="a1" onComplete={() => handleTopicComplete('ex9')} title="Exercise 9" vocabulary={{"Tenis": "tennis", "Banano": "banana", "leche": "milk", "futbol": "soccer", "universidad": "university", "adolescente": "teenager", "Sombrilla": "umbrella" , "llover" : "to rain" , "Honesta" : "honest" , "trabajo" : "job" , "interesante" : "interesting" , "3 veces" : "three times" , "actriz" : "actress" , "sillon" : "armchair" , "naranja" : "orange" , "Policia" : "policeman" , "Fracturó" : "broke", "Hombre de Negocios" : "businessman"}} highlightVocabulary={true} />;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm font-bold text-primary">Volver a la Unidad 2</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 7 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 text-left">
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
                        <div className="md:col-span-9 md:order-1">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
