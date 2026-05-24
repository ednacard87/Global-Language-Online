'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, Info, CheckCircle, Loader2, ArrowRight, Mic, Check, X, Pencil, BookText } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ErrorCorrectionExercise, type ErrorCorrectionPrompt } from '@/components/kids/exercises/error-correction-exercise';
import { PresentSimpleExercise, type ExercisePrompt } from '@/components/kids/exercises/present-simple';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Class5VocabExercise } from '@/components/kids/exercises/class5-vocab-exercise';

// --- DATA ---

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_u1_c5_v110_blindado';
const mainProgressKey = 'progress_a1_eng_unit_1_class_5';

const vocabularyData = {
    verbos: [
        { spanish: 'SALTAR', english: 'JUMP' },
        { spanish: 'QUERER', english: 'WANT' },
        { spanish: 'PODER', english: 'CAN' },
        { spanish: 'DEBER', english: 'SHOULD' },
        { spanish: 'VIAJAR', english: 'TRAVEL' },
        { spanish: 'LLAMAR', english: 'CALL' },
        { spanish: 'MANEJAR', english: 'DRIVE' },
        { spanish: 'COCINAR', english: 'COOK' },
        { spanish: 'LEVANTARSE', english: 'GET UP' },
        { spanish: 'VENIR', english: 'COME' },
        { spanish: 'LLEGAR', english: 'ARRIVE' },
    ],
    adjetivos: [
        { spanish: 'ABURRIDO', english: 'BORED' },
        { spanish: 'CANSADO', english: 'TIRED' },
        { spanish: 'HAMBRIENTO', english: 'HUNGRY' },
        { spanish: 'ENOJADO', english: 'ANGRY' },
        { spanish: 'PREOCUPADO', english: 'WORRIED' },
        { spanish: 'OCUPADO', english: 'BUSY' },
    ]
};

const exercise1Data: ErrorCorrectionPrompt[] = [
    { incorrect: "SHE DONT ANSWER MY QUESTION", translationHint: "(ELLA NO CONTESTA MIS PREGUNTAS)", correctAnswers: ["she does not answer my questions", "she doesn't answer my questions"] },
    { incorrect: "WE DONT GOES TO SCHOL THE SONDAYS.", translationHint: "", correctAnswers: ["we do not go to school on sundays", "we don't go to school on sundays"] },
    { incorrect: "DOIS JOSEPH LIKES MUVIS?", translationHint: "(¿A JOSEPH LE GUSTAN LAS PELÍCULAS?)", correctAnswers: ["does joseph like movies?"] },
    { incorrect: "I DONT WORKS THERE", translationHint: "( YO NO TRABAJO ALLA)", correctAnswers: ["i do not work there", "i don't work there"] },
];

const class5Exercise2Data: ExercisePrompt[] = [
    { spanish: "EL BEBE LECHE", answers: { affirmative: ["he drinks milk"], negative: ["he does not drink milk", "he doesn't drink milk"], interrogative: ["does he drink milk?"] } },
    { spanish: "YO NADO LOS DOMINGOS", answers: { affirmative: ["i swim on sundays"], negative: ["i do not swim on sundays", "i don't swim on sundays"], interrogative: ["do i swim on sundays?"] } },
];

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

// --- AUXILIARY COMPONENTS ---

const DictationExercise = ({ 
    title,
    description,
    onComplete, 
    studentDocRef, 
    initialData, 
    initialGrades,
    savePath, 
    savePathGrades,
    isAdmin,
    lineCount = 10,
    customInstructions
}: any) => {
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current && initialData && Array.isArray(initialData)) {
            const newLines = [...Array(lineCount).fill('')];
            initialData.forEach((val, i) => { if (i < lineCount) newLines[i] = val || ''; });
            setLines(newLines);
            if (initialData.length > 0) initializedRef.current = true;
        }
    }, [initialData, lineCount]);

    const handleLineChange = (index: number, value: string) => {
        const newLines = [...lines];
        newLines[index] = value;
        setLines(newLines);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePath]: newLines });
    };

    const handleToggleGrade = (index: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const newGrades = { ...grades };
        newGrades[index] = newGrades[index] === type ? null : type;
        setGrades(newGrades);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePathGrades]: newGrades });
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        {title.includes('DICTATION') ? <Mic className="h-6 w-6" /> : <Pencil className="h-6 w-6" />}
                    </div>
                    <div>
                        <CardTitle className="text-black dark:text-primary">{title}</CardTitle>
                        <CardDescription className="text-black/70 dark:text-muted-foreground">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {customInstructions && (
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-sm font-bold text-primary mb-4 uppercase text-center">
                        {customInstructions}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                    {lines.map((line, idx) => {
                        const status = grades[idx];
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="font-bold w-8 text-right text-muted-foreground">{idx + 1}.</span>
                                <Input 
                                    value={line} 
                                    onChange={e => handleLineChange(idx, e.target.value)} 
                                    className={cn(
                                        "flex-1 text-lg h-10 transition-all",
                                        status === 'correct' ? 'border-green-500 bg-green-50/5' : 
                                        status === 'incorrect' ? 'border-red-500 bg-red-50/5' : ''
                                    )} 
                                    autoComplete="off" 
                                />
                                {isAdmin && (
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'correct')} className={cn("h-8 w-8 rounded-full", status === 'correct' ? "bg-green-500 text-white" : "bg-muted")}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'incorrect')} className={cn("h-8 w-8 rounded-full", status === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")}><X className="h-4 w-4"/></Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="pt-6 border-t flex justify-center">
                <Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 text-xl">Avanzar <ArrowRight className="ml-2 h-6 w-6" /></Button>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class5Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'nota-importante', name: 'Nota Importante', icon: Info, status: 'locked' },
        { key: 'ejercicio-1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'dictado-1', name: 'Dictado 1', icon: Mic, status: 'locked' },
        { key: 'crear-frases', name: 'Crear Frases', icon: Pencil, status: 'locked' },
        { key: 'ejercicio-2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-vocabulario', name: 'Ejercicio Vocabulario', icon: PenSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({...t}));
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
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || 'vocabulary');

        const initA: any = {}; const initV: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            initA[cat] = Array((vocabularyData as any)[cat].length).fill('');
            initV[cat] = Array((vocabularyData as any)[cat].length).fill('unchecked');
        });
        setVocabAnswers(initA); setVocabValidation(initV);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        const done = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((done / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const d: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => d[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: d, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading]);

    const handleTopicComplete = useCallback((completedKey: string) => setTopicToComplete(completedKey), []);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active';
                    setSelectedTopic(np[idx + 1].key);
                    toast({ title: "¡Siguiente tema desbloqueado!" });
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') return;
        setSelectedTopic(key);
        if (key === 'nota-importante') handleTopicComplete(key);
    };

    const handleVocabCheck = () => {
        let ok = false; const nv: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            nv[cat] = (vocabularyData as any)[cat].map((item: any, idx: number) => {
                const uv = (vocabAnswers[cat][idx] || '').trim().toUpperCase();
                const cv = item.english.toUpperCase();
                let res = uv === cv || uv === `TO ${cv}`;
                if (res) ok = true; return res ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(nv); if (ok) setCanAdvanceVocab(true);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Vocabulario Clase 5</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['verbos', 'adjetivos']}>
                                {Object.entries(vocabularyData).map(([cat, items]) => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="text-lg font-bold capitalize">{cat}</AccordionTrigger>
                                        <AccordionContent className="grid grid-cols-2 gap-2">
                                            {items.map((item, i) => (<React.Fragment key={i}><div className="p-3 border rounded bg-muted/10">{item.spanish}</div><Input value={vocabAnswers[cat][i]} onChange={e => { const na = {...vocabAnswers}; na[cat][i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} className={cn(vocabValidation[cat][i] === 'correct' ? 'border-green-500' : vocabValidation[cat][i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6"><Button onClick={handleVocabCheck}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'nota-importante':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 text-black">
                            <CardHeader><CardTitle className="text-primary font-black uppercase">NOTICIAS IMPORTANTES 🚀</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-4 bg-white/20 rounded-xl border border-black/10"><p className="font-bold">1- DOS VERBOS JUNTOS &rarr; USAR "TO" EN MEDIO.</p></div>
                                <div className="p-4 bg-white/20 rounded-xl border border-black/10"><p className="font-bold">2- EL VERBO "GO":</p><p className="italic ml-4">go to the + lugar / go (sin lugar)</p></div>
                                <div className="p-4 bg-destructive/10 rounded-xl border-2 border-dashed border-destructive/20 text-center"><p className="font-black text-destructive uppercase">3- NUNCA USAR TO BE Y DO/DOES AL MISMO TIEMPO.</p></div>
                            </CardContent>
                            <CardFooter className="justify-center pt-2 pb-6"><Button onClick={() => handleTopicComplete('nota-importante')} size="lg">He leído todo</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'ejercicio-1': return <ErrorCorrectionExercise exerciseData={exercise1Data} onComplete={() => handleTopicComplete('ejercicio-1')} title="Ejercicio 1" />;
            case 'dictado-1': return <DictationExercise title="DICTATION 1" description="Escribe las frases dictadas por tu profesor." onComplete={() => handleTopicComplete('dictado-1')} studentDocRef={studentDocRef} isAdmin={isAdmin} savePath={`lessonProgress.${progressStorageKey}.dict1`} savePathGrades={`lessonProgress.${progressStorageKey}.dict1Grades`} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.dict1} initialGrades={studentProfile?.lessonProgress?.[progressStorageKey]?.dict1Grades} lineCount={10} />;
            case 'crear-frases': return <DictationExercise title="Crear Frases" description="Inventa 3 frases negativas con TO BE, DO y DOES." onComplete={() => handleTopicComplete('crear-frases')} studentDocRef={studentDocRef} isAdmin={isAdmin} savePath={`lessonProgress.${progressStorageKey}.create1`} savePathGrades={`lessonProgress.${progressStorageKey}.create1Grades`} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.create1} initialGrades={studentProfile?.lessonProgress?.[progressStorageKey]?.create1Grades} lineCount={9} customInstructions="3 FRASES NEGATIVAS POR CADA AUXILIAR" />;
            case 'ejercicio-2': return <PresentSimpleExercise exerciseData={class5Exercise2Data} onComplete={() => handleTopicComplete('ejercicio-2')} title="Ejercicio 2" showShortAnswers={false} />;
            case 'ejercicio-vocabulario': return <Class5VocabExercise onComplete={() => handleTopicComplete('ejercicio-vocabulario')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle>Aventura Clase 5</CardTitle></CardHeader>
                    <CardContent>
                        <nav><ul className="space-y-1">
                            {learningPath.map(item => (
                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                    <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                </li>
                            ))}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
