'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, GraduationCap, CheckCircle, BrainCircuit, PenSquare, Lock, Loader2, ArrowRight, BookText } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { VerbMemoryGame } from '@/components/kids/exercises/verb-memory-game';
import { FillInTheBlanksExercise } from '@/components/kids/exercises/fill-in-the-blanks';
import { SingleFormExercise } from '@/components/kids/exercises/single-form';
import { PresentSimpleExercise, type ExercisePrompt } from '@/components/kids/exercises/present-simple';
import { ReadingComprehensionExercise } from '@/components/kids/exercises/reading-comprehension';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- DATA ---

const vocabularyVerbs = [
    { spanish: 'JUGAR', english: 'play' },
    { spanish: 'CAMINAR', english: 'walk' },
    { spanish: 'IR', english: 'go' },
    { spanish: 'TRABAJAR', english: 'work' },
    { spanish: 'DORMIR', english: 'sleep' },
    { spanish: 'COMER', english: 'eat' },
    { spanish: 'BEBER', english: 'drink' },
    { spanish: 'VER', english: 'see' },
    { spanish: 'MIRAR', english: 'look' },
    { spanish: 'SALIR', english: 'go out' },
    { spanish: 'CORRER', english: 'run' },
    { spanish: 'CANTAR', english: 'sing' },
    { spanish: 'HABLAR', english: 'speak' },
    { spanish: 'PENSAR', english: 'think' },
    { spanish: 'HABER/TENER', english: 'have' },
    { spanish: 'HACER', english: 'do' },
    { spanish: 'ESTUDIAR', english: 'study' },
    { spanish: 'ESCRIBIR', english: 'write' },
    { spanish: 'LEER', english: 'read' },
    { spanish: 'APRENDER', english: 'learn' },
    { spanish: 'ENSEÑAR', english: 'teach' },
];

const vocabularyWords = [
    { spanish: 'AYER', english: 'yesterday' },
    { spanish: 'HOY', english: 'today' },
    { spanish: 'MAÑANA', english: 'tomorrow' },
    { spanish: 'AÑO', english: 'year' },
    { spanish: 'DÍA', english: 'day' },
    { spanish: 'SEMANA', english: 'week' },
    { spanish: 'MES', english: 'month' },
    { spanish: 'CON', english: 'with' },
    { spanish: 'DESAYUNO', english: 'breakfast' },
    { spanish: 'ALMUERZO', english: 'lunch' },
    { spanish: 'CENA', english: 'dinner' },
    { spanish: 'SIN', english: 'without' },
];

const positiveExercises = [
    { spanish: 'yo bebo agua', answer: ["I drink water"] },
    { spanish: 'nosotros jugamos futbol', answer: ["we play soccer", "we play football"] },
    { spanish: 'ellos escuchan musica', answer: ["they listen to music"] },
    { spanish: 'yo hablo ingles', answer: ["I speak English"] },
    { spanish: 'tu abres la puerta', answer: ["you open the door"] },
];

const negativeExercises = [
    { spanish: 'yo no bebo agua', answer: ["I do not drink water", "I don't drink water"] },
    { spanish: 'nosotros no jugamos futbol', answer: ["we do not play soccer", "we don't play soccer", "we do not play football", "we don't play football"] },
    { spanish: 'ellos no escuchan música', answer: ["they do not listen to music", "they don't listen to music"] },
    { spanish: 'yo no hablo ingles', answer: ["I do not speak English", "I don't speak English"] },
    { spanish: 'tu no abres la puerta', answer: ["you do not open the door", "you don't open the door"] },
];

const interrogativeExercises = [
    { spanish: '¿yo bebo agua?', answer: ["do I drink water?"] },
    { spanish: '¿nosotros jugamos futbol?', answer: ["do we play soccer?", "do we play football?"] },
    { spanish: '¿ellos escuchan música?', answer: ["do they listen to music?"] },
    { spanish: '¿yo hablo ingles?', answer: ["do I speak English?"] },
    { spanish: '¿tu abres la puerta?', answer: ["do you open the door?"] },
];

const exercise1Data: ExercisePrompt[] = [
    { spanish: "TU JUEGAS TENIS EL LUNES", answers: { affirmative: ["you play tennis on monday"], negative: ["you do not play tennis on monday", "you don't play tennis on monday"], interrogative: ["do you play tennis on monday?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "NOSOTROS CAMINAMOS EN EL PARQUE", answers: { affirmative: ["we walk in the park"], negative: ["we do not walk in the park", "we don't walk in the park"], interrogative: ["do we walk in the park?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, we do not", "no, we don't"] } },
];

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
    subItems?: { key: string; name: string; icon: React.ElementType; status: 'locked' | 'active' | 'completed' }[];
}

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

// --- COMPONENT ---

export default function Class2Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const progressStorageKey = 'progress_a1_eng_u1_c2_v150_blindado';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_2';

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('vocabulary');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [verbsAnswers, setVerbsAnswers] = useState<string[]>(Array(vocabularyVerbs.length).fill(''));
    const [wordsAnswers, setWordsAnswers] = useState<string[]>(Array(vocabularyWords.length).fill(''));
    const [verbsValidation, setVerbsValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyVerbs.length).fill('unchecked'));
    const [wordsValidation, setWordsValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyWords.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary 2', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar: Present Simple', icon: GraduationCap, status: 'locked' },
        {
            key: 'exercises',
            name: 'Exercises',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-pos', name: 'Positive', icon: PenSquare, status: 'locked' },
                { key: 'ex-neg', name: 'Negative', icon: PenSquare, status: 'locked' },
                { key: 'ex-int', name: 'Interrogative', icon: PenSquare, status: 'locked' },
            ]
        },
        { key: 'memory-verbs', name: 'Memory: Verbs', icon: BrainCircuit, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: 'Reading', icon: BookOpen, status: 'locked' },
        { key: 'vocab-verbs', name: 'Exercise: Fill gaps', icon: PenSquare, status: 'locked' }
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({...t, subItems: t.subItems ? t.subItems.map(s => ({...s})) : undefined}));
        let savedST = '';
        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; if (item.subItems) item.subItems.forEach(s => s.status = 'completed'); });
        } else if(studentProfile?.lessonProgress?.[progressStorageKey]) {
            const d = studentProfile.lessonProgress[progressStorageKey];
            path.forEach(item => {
                if (d[item.key]) item.status = d[item.key];
                if (item.subItems && d.subItems?.[item.key]) {
                    item.subItems.forEach(s => { if (d.subItems[item.key][s.key]) s.status = d.subItems[item.key][s.key]; });
                }
            });
            savedST = d.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') {
                path[i].status = 'active';
                if (path[i].subItems) path[i].subItems[0].status = 'active';
            }
            lastDone = path[i].status === 'completed';
            if (path[i].subItems) {
                let allDone = true; let lastSubDone = true;
                for(let j=0; j < path[i].subItems.length; j++) {
                    if (lastSubDone && path[i].subItems[j].status === 'locked') path[i].subItems[j].status = 'active';
                    lastSubDone = path[i].subItems[j].status === 'completed';
                    if (!lastSubDone) allDone = false;
                }
                lastDone = allDone;
            }
        }
        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active')?.key || 'vocabulary');
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        let total = 0; let done = 0;
        learningPath.forEach(t => {
            if(t.subItems) { total += t.subItems.length; done += t.subItems.filter(st => st.status === 'completed').length; }
            else { total++; if (t.status === 'completed') done++; }
        });
        return total > 0 ? Math.round((done / total) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const data: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => {
            data[item.key] = item.status;
            if (item.subItems) {
                if (!data.subItems) data.subItems = {};
                data.subItems[item.key] = {};
                item.subItems.forEach(sub => { data.subItems[item.key][sub.key] = sub.status; });
            }
        });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageKey}`]: data, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading]);

    const handleTopicComplete = useCallback((completedKey: string) => setTopicToComplete(completedKey), []);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let win = false; let nextToSel: string | null = null;
            const newP = currentPath.map(t => ({ ...t, subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined }));
            let found = false;
            for (let i = 0; i < newP.length && !found; i++) {
                const curT = newP[i];
                if (curT.key === topicToComplete) {
                    if (curT.status !== 'completed') curT.status = 'completed';
                    if (i + 1 < newP.length && newP[i + 1].status === 'locked') {
                        const n = newP[i + 1]; n.status = 'active'; win = true; nextToSel = n.subItems?.[0]?.key || n.key;
                        if (n.subItems?.[0]) n.subItems[0].status = 'active';
                    }
                    found = true;
                } else if (curT.subItems) {
                    const subIdx = curT.subItems.findIndex((sub: any) => sub.key === topicToComplete);
                    if (subIdx !== -1) {
                        if (curT.subItems[subIdx].status !== 'completed') curT.subItems[subIdx].status = 'completed';
                        const nextSubIdx = subIdx + 1;
                        if (nextSubIdx < newP[i].subItems!.length && newP[i].subItems![nextSubIdx].status === 'locked') {
                            newP[i].subItems![nextSubIdx].status = 'active'; nextToSel = newP[i].subItems![nextSubIdx].key; win = true;
                        } else if (newP[i].subItems!.every((sub: any) => sub.status === 'completed')) {
                            if (curT.status !== 'completed') curT.status = 'completed';
                            if (i + 1 < newP.length && newP[i + 1].status === 'locked') {
                                const n = newP[i + 1]; n.status = 'active'; win = true; nextToSel = n.subItems?.[0]?.key || n.key;
                                if (n.subItems?.[0]) n.subItems[0].status = 'active';
                            }
                        }
                        found = true;
                    }
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSel) { const n = nextToSel; setTimeout(() => setSelectedTopic(n), 0); }
            return newP;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const mainT = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subT = mainT?.subItems?.find(st => st.key === topicKey);
        if (!isAdmin && ((subT && subT.status === 'locked') || (!subT && mainT?.status === 'locked'))) { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
    };

    const handleVocabCheck = () => {
        let oneCorrect = false;
        
        const nextVerbsVal = vocabularyVerbs.map((v, i) => {
            const userVal = (verbsAnswers[i] || '').trim().toLowerCase();
            const correctVal = v.english.toLowerCase();
            const res = userVal === correctVal || userVal === `to ${correctVal}`;
            if (res) oneCorrect = true;
            return res ? 'correct' : 'incorrect';
        });

        const nextWordsVal = vocabularyWords.map((v, i) => {
            const userVal = (wordsAnswers[i] || '').trim().toLowerCase();
            const correctVal = v.english.toLowerCase();
            const res = userVal === correctVal;
            if (res) oneCorrect = true;
            return res ? 'correct' : 'incorrect';
        });

        setVerbsValidation(nextVerbsVal as any);
        setWordsValidation(nextWordsVal as any);

        if (oneCorrect) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una traducción. Ya puedes avanzar." });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: 'Sigue intentando' });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader>
                            <CardTitle className='text-black dark:text-primary'>Vocabulary 2</CardTitle>
                            <CardDescription>Traduce los términos al inglés. Para los verbos, puedes incluir "To" al inicio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Section 1: Verbs */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase tracking-tight border-b pb-2">1. Basic Verbs</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                    <div className="font-bold p-3 bg-muted rounded-lg text-foreground uppercase tracking-widest text-xs">Español</div>
                                    <div className="font-bold p-3 bg-muted rounded-lg text-foreground uppercase tracking-widest text-xs">Inglés</div>
                                    {vocabularyVerbs.map((v, i) => (
                                        <React.Fragment key={`verb-${i}`}>
                                            <div className="p-3 border rounded bg-white/5 text-foreground font-medium flex items-center">{v.spanish}</div>
                                            <Input 
                                                value={verbsAnswers[i] || ''} 
                                                onChange={e => {
                                                    const n = [...verbsAnswers]; n[i] = e.target.value; setVerbsAnswers(n);
                                                    const nv = [...verbsValidation]; nv[i] = 'unchecked'; setVerbsValidation(nv as any);
                                                    setCanAdvanceVocab(false);
                                                }} 
                                                className={cn("h-12", verbsValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5' : verbsValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} 
                                                autoComplete="off"
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Section 2: Words */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase tracking-tight border-b pb-2">2. Basic Words</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                    <div className="font-bold p-3 bg-muted rounded-lg text-foreground uppercase tracking-widest text-xs">Español</div>
                                    <div className="font-bold p-3 bg-muted rounded-lg text-foreground uppercase tracking-widest text-xs">Inglés</div>
                                    {vocabularyWords.map((v, i) => (
                                        <React.Fragment key={`word-${i}`}>
                                            <div className="p-3 border rounded bg-white/5 text-foreground font-medium flex items-center">{v.spanish}</div>
                                            <Input 
                                                value={wordsAnswers[i] || ''} 
                                                onChange={e => {
                                                    const n = [...wordsAnswers]; n[i] = e.target.value; setWordsAnswers(n);
                                                    const nv = [...wordsValidation]; nv[i] = 'unchecked'; setWordsValidation(nv as any);
                                                    setCanAdvanceVocab(false);
                                                }} 
                                                className={cn("h-12", wordsValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5' : wordsValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} 
                                                autoComplete="off"
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 text-black dark:text-white">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">“DO - DOES”</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-6 bg-white/10 dark:bg-background/20 rounded-2xl border text-black dark:text-white">
                                    <p className="text-lg font-bold">“DO-DOES” EN INGLES PUEDE SERVIR COMO:</p>
                                    <p className="text-lg mt-2">1 - VERBO (HACER) // 2- AUXILIAR: DO / DOES</p>
                                    <p className="font-mono text-xl font-black text-primary mt-4 uppercase">I DO - YOU DO - WE DO - THEY DO // HE/SHE/IT DOES</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold h-14 text-xl text-white">
                                    Entendido <ArrowRight className="ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'ex-pos': return <SingleFormExercise onComplete={() => handleTopicComplete('ex-pos')} exerciseData={positiveExercises} title="Positive Form" formType="affirmative" description="Traduce las frases a su forma afirmativa." />;
            case 'ex-neg': return <SingleFormExercise onComplete={() => handleTopicComplete('ex-neg')} exerciseData={negativeExercises} title="Negative Form" formType="negative" description="Traduce las frases a su forma negativa." />;
            case 'ex-int': return <SingleFormExercise onComplete={() => handleTopicComplete('ex-int')} exerciseData={interrogativeExercises} title="Interrogative Form" formType="interrogative" description="Traduce las frases a su forma interrogativa." />;
            case 'memory-verbs': return <VerbMemoryGame onComplete={() => handleTopicComplete('memory-verbs')} />;
            case 'ex1': return <PresentSimpleExercise exerciseData={exercise1Data} onComplete={() => handleTopicComplete('ex1')} title="Exercise 1" showShortAnswers={true} />;
            case 'reading': return <ReadingComprehensionExercise onComplete={() => handleTopicComplete('reading')} />;
            case 'vocab-verbs': return <FillInTheBlanksExercise onComplete={() => handleTopicComplete('vocab-verbs')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle>Ruta Clase 2</CardTitle></CardHeader>
                    <CardContent>
                        <nav><ul className="space-y-1">
                            {learningPath.map(item => (
                                <li key={item.key}>
                                    {!item.subItems ? (
                                        <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                            <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div className="px-3 py-2 text-sm font-bold text-primary uppercase tracking-wider">{item.name}</div>
                                            <ul className="pl-4 space-y-1">{item.subItems.map(sub => {
                                                const subL = sub.status === 'locked' && !isAdmin;
                                                return (
                                                    <li key={sub.key} onClick={() => handleTopicSelect(sub.key)} className={cn('flex items-center gap-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-foreground', subL ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === sub.key && 'bg-muted text-primary font-bold')}>
                                                        <sub.icon className={cn("h-4 w-4", sub.status === 'completed' && 'text-green-500')} /><span>{sub.name}</span>
                                                    </li>
                                                )
                                            })}</ul>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 text-muted-foreground"><span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

