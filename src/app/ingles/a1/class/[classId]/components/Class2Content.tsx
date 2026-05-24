'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { BookOpen, GraduationCap, CheckCircle, BrainCircuit, PenSquare, Lock, Loader2, ArrowRight, Info } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { VerbMemoryGame } from '@/components/kids/exercises/verb-memory-game';
import { FillInTheBlanksExercise } from '@/components/kids/exercises/fill-in-the-blanks';
import { SingleFormExercise } from '@/components/kids/exercises/single-form';
import { ReadingComprehensionExercise } from '@/components/kids/exercises/reading-comprehension';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Separator } from '@/components/ui/separator';

const vocabularyVerbs = [
    { spanish: 'JUGAR', english: 'Play' },
    { spanish: 'CAMINAR', english: 'Walk' },
    { spanish: 'IR', english: 'Go' },
    { spanish: 'TRABAJAR', english: 'Work' },
    { spanish: 'DORMIR', english: 'Sleep' },
    { spanish: 'COMER', english: 'Eat' },
    { spanish: 'BEBER', english: 'Drink' },
    { spanish: 'VER', english: 'See' },
    { spanish: 'MIRAR', english: 'Look' },
    { spanish: 'SALIR', english: 'Go out' },
    { spanish: 'CORRER', english: 'Run' },
    { spanish: 'CANTAR', english: 'Sing' },
    { spanish: 'HABLAR', english: 'Speak' },
    { spanish: 'PENSAR', english: 'Think' },
    { spanish: 'HABER/TENER', english: 'Have' },
    { spanish: 'HACER', english: 'Do' },
    { spanish: 'ESTUDIAR', english: 'Study' },
    { spanish: 'ESCRIBIR', english: 'Write' },
    { spanish: 'LEER', english: 'Read' },
    { spanish: 'APRENDER', english: 'Learn' },
    { spanish: 'ENSEÑAR', english: 'Teach' },
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
];

const interrogativeExercises = [
    { spanish: '¿yo bebo agua?', answer: ["do I drink water?"] },
    { spanish: '¿nosotros jugamos futbol?', answer: ["do we play soccer?", "do we play football?"] },
];

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
    subItems?: { key: string; name: string; icon: React.ElementType; status: 'locked' | 'active' | 'completed' }[];
}

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

export default function Class2Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const progressStorageKey = 'progress_a1_eng_u1_c2_v110_blindado';
    const mainProgressKey = 'progress_a1_eng_unit_1_class_2';

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('vocabulary');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Vocabulary State
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyVerbs.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyVerbs.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Verbs)', icon: BookOpen, status: 'active' },
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
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: 'Reading', icon: BookOpen, status: 'locked' },
        { key: 'vocab-verbs', name: 'Exercise: Fill gaps', icon: PenSquare, status: 'locked' }
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({
            ...t, 
            subItems: t.subItems ? t.subItems.map(s => ({...s})) : undefined
        }));
        let savedST = '';

        if (isAdmin) {
            path.forEach(item => { 
                item.status = 'completed'; 
                if (item.subItems) item.subItems.forEach(s => s.status = 'completed'); 
            });
        } else if(studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedData = studentProfile.lessonProgress[progressStorageKey];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
                if (item.subItems && savedData.subItems?.[item.key]) {
                    item.subItems.forEach(s => { 
                        if (savedData.subItems[item.key][s.key]) s.status = savedData.subItems[item.key][s.key]; 
                    });
                }
            });
            savedST = savedData.lastSelectedTopic || '';
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
        const firstA = path.find(p => p.status === 'active') || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
        setSelectedTopic(savedST || firstA?.key || 'vocabulary');
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
        if (!isAdmin && ((subT && subT.status === 'locked') || (!subT && mainT?.status === 'locked'))) { 
            toast({ variant: "destructive", title: "Contenido Bloqueado" }); 
            return; 
        }
        setSelectedTopic(topicKey);
        const autoView = ['grammar'];
        if (autoView.includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const newAns = [...vocabAnswers];
        newAns[index] = value;
        setVocabAnswers(newAns);
        const newVal = [...vocabValidation];
        newVal[index] = 'unchecked';
        setVocabValidation(newVal as any);
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let oneCorrect = false;
        const newVal = vocabularyVerbs.map((item, idx) => {
            const isCorrect = (vocabAnswers[idx] || '').trim().toLowerCase() === item.english.toLowerCase();
            if (isCorrect) oneCorrect = true;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(newVal as any);
        if (oneCorrect) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader>
                            <CardTitle>Vocabulary (Verbs)</CardTitle>
                            <CardDescription>Escribe la traducción en inglés para cada verbo.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg">Español</div>
                                <div className="font-bold p-3 bg-muted rounded-lg">Inglés</div>
                                {vocabularyVerbs.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="p-3 border rounded bg-muted/10">{item.spanish}</div>
                                        <Input 
                                            value={vocabAnswers[idx] || ''} 
                                            onChange={(e) => handleVocabInputChange(idx, e.target.value)} 
                                            className={cn(vocabValidation[idx] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabValidation[idx] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} 
                                            autoComplete="off" 
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6">
                            <Button onClick={handleCheckVocab}>Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className="px-12 font-bold">Avanzar <ArrowRight className="ml-2" /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-black">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">“DO - DOES”</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-6 bg-slate-100 rounded-[2rem] border">
                                    <p className="text-lg font-bold">“DO-DOES” EN INGLES PUEDE SERVIR COMO:</p>
                                    <p className="text-lg mt-2">1 - VERBO (HACER) // 2- AUXILIAR: DO / DOES</p>
                                    <p className="font-mono text-xl font-black text-primary mt-4">I DO - YOU DO - WE DO - THEY DO // HE/SHE/IT DOES</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-black">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">“DO - DOES” COMO AUXILIAR</CardTitle></CardHeader>
                            <CardContent className="p-6 bg-slate-100 rounded-[2rem] border">
                                <p className="font-mono text-xl font-black text-primary">DO - DOES = I DO - YOU DO - WE DO - THEY DO // HE/SHE/IT DOES</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-black">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">ESTRUCTURA CON LOS AUXILIARES: (DO - DOES)</CardTitle></CardHeader>
                            <CardContent className="p-6 bg-slate-100 rounded-[2rem] border space-y-3 font-mono text-lg font-bold">
                                <p><span className="text-green-600">(+)</span> = pronombre + verbo + complemento</p>
                                <p><span className="text-red-600">(-)</span> = pronombre + do/ does + not + verbo + complemento</p>
                                <p><span className="text-blue-600">(?)</span> = do/ does + pronombre + verbo + complemento?</p>
                                <div className="border-t my-4 pt-4">
                                    <p className="font-sans uppercase text-sm text-muted-foreground mb-2">Short Answers:</p>
                                    <p><span className="text-green-600">(+A)</span> = yes. pronombre + do/ does</p>
                                    <p><span className="text-red-600">(-A)</span> = no, pronombre + do/ does + not</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-black">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">NEGATIVE CONTRACCIONES</CardTitle></CardHeader>
                            <CardContent className="p-6 bg-slate-100 rounded-[2rem] border text-center">
                                <div className="grid grid-cols-2 gap-4 text-xl font-black font-mono">
                                    <div className="p-4 bg-white rounded-xl border-2 border-dashed border-primary/30">DO NOT = DON’T</div>
                                    <div className="p-4 bg-white rounded-xl border-2 border-dashed border-primary/30">DOES NOT = DOESN’T</div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold h-14 text-xl">Entendido <ArrowRight className="ml-2" /></Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'ex-pos': return <SingleFormExercise onComplete={() => handleTopicComplete('ex-pos')} exerciseData={positiveExercises} title="Positive Form" formType="affirmative" description="Traduce las frases en su forma afirmativa." />;
            case 'ex-neg': return <SingleFormExercise onComplete={() => handleTopicComplete('ex-neg')} exerciseData={negativeExercises} title="Negative Form" formType="negative" description="Traduce las frases en su forma negativa." />;
            case 'ex-int': return <SingleFormExercise onComplete={() => handleTopicComplete('ex-int')} exerciseData={interrogativeExercises} title="Interrogative Form" formType="interrogative" description="Traduce las frases en su forma interrogativa." />;
            case 'memory-verbs': return <VerbMemoryGame onComplete={() => handleTopicComplete('memory-verbs')} />;
            case 'ex1': return <SimpleTranslationExercise course="a1" exerciseKey="c2_mixed1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1" />;
            case 'ex2': return <SimpleTranslationExercise course="a1" exerciseKey="c2_mixed1" onComplete={() => handleTopicComplete('ex2')} title="Exercise 2" />; // Placeholder for actual ex2 data
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
                    <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                    <CardContent>
                        <nav><ul className="space-y-1">
                            {learningPath.map((item) => {
                                const isL = item.status === 'locked' && !isAdmin;
                                const isS = selectedTopic === item.key || item.subItems?.some(si => si.key === selectedTopic);
                                const Icon = ICONS[item.status] || BookOpen;
                                return (
                                    <li key={item.key}>
                                        {!item.subItems ? (
                                            <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isL ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', isS && 'bg-muted text-primary font-bold')}>
                                                <div className="flex items-center gap-3"><Icon className={cn("h-5 w-5", item.status === 'completed' && 'text-green-500')} /><span>{item.name}</span></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div className="px-3 py-2 text-sm font-bold text-primary uppercase tracking-wider">{item.name}</div>
                                                <ul className="pl-4 space-y-1">{item.subItems.map(sub => {
                                                    const subL = sub.status === 'locked' && !isAdmin;
                                                    const SubI = ICONS[sub.status] || PenSquare;
                                                    return (
                                                        <li key={sub.key} onClick={() => handleTopicSelect(sub.key)} className={cn('flex items-center gap-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-foreground', subL ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === sub.key && 'bg-muted text-primary font-bold')}>
                                                            <SubI className={cn("h-4 w-4", sub.status === 'completed' && 'text-green-500')} /><span>{sub.name}</span>
                                                        </li>
                                                    )
                                                })}</ul>
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

