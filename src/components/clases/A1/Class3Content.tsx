'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    ChevronDown, 
    Loader2, 
    ArrowRight, 
    BookText, 
    Check, 
    X, 
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { PresentSimpleExercise, type ExercisePrompt } from '@/components/kids/exercises/present-simple';
import { QAShortAnswerExercise, type QAShortAnswerPrompt } from '@/components/kids/exercises/q-a-short-answer-exercise';
import { ShortAnswerPresentSimpleExercise, type ShortAnswerPresentSimplePrompt } from '@/components/kids/exercises/short-answer-present-simple';
import { LargeTextTranslationExercise, type DialogueLine } from '@/components/kids/exercises/large-text-translation-exercise';

// --- CONSTANTS & DATA ---

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageKey = 'progress_a1_eng_u1_c3_v105_blindado';
const mainProgressKey = 'progress_a1_eng_unit_1_class_3';

const vocab2Data = [
    { es: "AYER", en: "yesterday" },
    { es: "HOY", en: "today" },
    { es: "MAÑANA", en: "tomorrow" },
    { es: "DESAYUNO", en: "breakfast" },
    { es: "ALMUERZO", en: "lunch" },
    { es: "CENA", en: "dinner" },
    { es: "DÍA", en: "day" },
    { es: "SEMANA", en: "week" },
    { es: "MES", en: "month" },
    { es: "AÑO", en: "year" },
    { es: "CON", en: "with" },
    { es: "SIN", en: "without" },
];

const mixedExercise1Data: ExercisePrompt[] = [
    { spanish: "EL BEBE VINO TINTO", answers: { affirmative: ["he drinks red wine"], negative: ["he does not drink red wine", "he doesn't drink red wine"], interrogative: ["does he drink red wine?"] } },
    { spanish: "ELLA JUEGA TENNIS CON SU HERMANO", answers: { affirmative: ["she plays tennis with her brother"], negative: ["she does not play tennis with her brother", "she doesn't play tennis with her brother"], interrogative: ["does she play tennis with her brother?"] } },
    { spanish: "YO MONTO BICICLETA LOS DOMINGOS", answers: { affirmative: ["i ride a bike on sundays", "i ride a bicycle on sundays"], negative: ["i do not ride a bike on sundays", "i don't ride a bike on sundays"], interrogative: ["do i ride a bike on sundays?"] } },
    { spanish: "TÚ TRABAJAS LOS SABADOS", answers: { affirmative: ["you work on saturdays"], negative: ["you do not work on saturdays", "you don't work on saturdays"], interrogative: ["do you work on saturdays?"] } },
    { spanish: "ELLA VE PELICULAS CON SU NOVIO", answers: { affirmative: ["she watches movies with her boyfriend"], negative: ["she does not watch movies with her boyfriend", "she doesn't watch movies with her boyfriend"], interrogative: ["does she watch movies with her boyfriend?"] } },
];

const mixedExercise2Sub2Data: QAShortAnswerPrompt[] = [
    { spanish: '¿TU HABLAS INGLES?', answers: { interrogative: ["do you speak english?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: '¿ELLA COME HAMBURGUESA?', answers: { interrogative: ["does she eat a hamburger?", "does she eat hamburgers?"], shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
    { spanish: '¿QUIERES UN HELADO?', answers: { interrogative: ["do you want an ice cream?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
];

const shortAnswerEx3Data: ShortAnswerPresentSimplePrompt[] = [
    { question: "DO THEY LIKE CHOCOLATE?", answers: { shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
    { question: "DOES SHE SPEAK ITALIAN?", answers: { shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
    { question: "DO YOU EAT SALAD EVERY DAY?", answers: { shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
];

const class3LargeTextEx4Dialogue: DialogueLine[] = [
    { speaker: "MARY", line: "¿VIVES EN BARCELONA?", answer: ["do you live in barcelona?"] },
    { speaker: "JON", line: "NO, NO VIVO EN BARCELONA. VIVO EN MADRID, PERO MI HERMANA VIVE ALLÍ.", answer: ["no, i do not live in barcelona. i live in madrid, but my sister lives there", "no, i don't live in barcelona. i live in madrid, but my sister lives there"] },
];

const can1Prompts = [
    "ELLA PUEDE CERRAR LAS VENTANAS EN LA NOCHE",
    "YO NO PUEDO COMER AZÚCAR",
    "ÉL NO PUEDE TOMAR LICOR PORQUE ÉL ESTÁ ENFERMO",
    "NOSOTRAS PODEMOS TRABAJAR LOS SABADOS EN LA MAÑANA",
    "ELLOS PUEDEN HACER EJERCICIO EN LA TARDE",
    "TU PUEDES VIAJAR EL JUEVES EN LA NOCHE",
];

const can2Prompts = [
    "ELLOS PUEDEN IR A LA FINCA PORQUE ELLOS ESTAN EN VACACIONES",
    "EL PUEDE VIVIR EN ESA CIUDAD PORQUE EL TRABAJA VIRTUAL.",
];

// --- AUXILIARY COMPONENTS ---

const LinesWritingExercise = ({ 
    title, 
    description, 
    prompts,
    onComplete, 
    studentDocRef, 
    initialData,
    initialGrades,
    savePath,
    savePathGrades,
    isAdmin = false,
    vocabulary
}: any) => {
    const [lines, setLines] = useState<string[]>(Array(prompts.length).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current && initialData && Array.isArray(initialData)) {
            const newLines = [...Array(prompts.length).fill('')];
            initialData.forEach((val, i) => { if (i < prompts.length) newLines[i] = val || ''; });
            setLines(newLines);
            if (initialData.length > 0) initializedRef.current = true;
        }
    }, [initialData, prompts.length]);

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
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className="font-semibold text-primary">{description}</CardDescription>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {Object.entries(vocabulary).map(([es, en]) => (
                                        <React.Fragment key={es}>
                                            <span className="text-muted-foreground capitalize">{es}:</span>
                                            <span className="font-bold text-right">{en as string}</span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    {prompts.map((prompt: string, idx: number) => {
                        const status = grades[idx];
                        return (
                            <div key={idx} className="space-y-2 group">
                                <div className="flex items-center justify-between gap-4">
                                    <Label className="text-sm font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-2 text-left">
                                        <span className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">{idx + 1}</span>
                                        {prompt}
                                    </Label>
                                    {isAdmin && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'correct')} className={cn("h-8 w-8 rounded-full", status === 'correct' ? "bg-green-500 text-white" : "bg-muted")}><Check className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'incorrect')} className={cn("h-8 w-8 rounded-full", status === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")}><X className="h-4 w-4"/></Button>
                                        </div>
                                    )}
                                </div>
                                <Input value={lines[idx]} onChange={(e) => handleLineChange(idx, e.target.value)} className={cn("h-12 text-lg", status === 'correct' ? 'border-green-500 bg-green-50/5' : status === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="..." autoComplete="off" />
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

const Can2ManualGradingExercise = ({ 
    prompts, 
    onComplete, 
    vocabulary, 
    studentDocRef, 
    initialData, 
    initialGrades,
    savePath, 
    savePathGrades,
    isAdmin 
}: any) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, Record<string, string>>>(initialData || {});
    const [grades, setGrades] = useState<Record<number, Record<string, 'correct' | 'incorrect' | null>>>(initialGrades || {});

    const fields = ['affirmative', 'negative', 'interrogative', 'shortAffirmative', 'shortNegative'];
    const fieldLabels = { affirmative: '(+)', negative: '(-)', interrogative: '(?)', shortAffirmative: '(+A)', shortNegative: '(-A)' };
    const fieldColors = { affirmative: 'text-green-500', negative: 'text-red-500', interrogative: 'text-blue-500', shortAffirmative: 'text-green-600', shortNegative: 'text-red-600' };

    const handleAnswerChange = (field: string, value: string) => {
        const newData = { ...userAnswers, [currentIndex]: { ...(userAnswers[currentIndex] || {}), [field]: value } };
        setUserAnswers(newData);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePath]: newData });
    };

    const handleToggleGrade = (field: string, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const currentPhraseGrades = grades[currentIndex] || {};
        const newPhraseGrades = { ...currentPhraseGrades, [field]: currentPhraseGrades[field] === type ? null : type };
        const newGrades = { ...grades, [currentIndex]: newPhraseGrades };
        setGrades(newGrades);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [savePathGrades]: newGrades });
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>CAN 2</CardTitle>
                        <CardDescription>Traduce la frase a todas sus formas (+, -, ?, +A, -A).</CardDescription>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {Object.entries(vocabulary).map(([es, en]) => (<React.Fragment key={es}><span className="text-muted-foreground">{es}:</span><span className="font-bold text-right">{en as string}</span></React.Fragment>))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {prompts.map((_: any, idx: number) => (
                        <button key={idx} onClick={() => setCurrentIndex(idx)} className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all", currentIndex === idx ? "border-primary ring-2 ring-primary" : "border-muted-foreground/30")}>{idx + 1}</button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center"><p className="text-xl font-bold">{prompts[currentIndex]}</p></div>
                <div className="space-y-3 font-mono">
                    {fields.map(field => {
                        const status = grades[currentIndex]?.[field];
                        return (
                            <div key={field} className="flex items-center gap-3">
                                <Label className={cn("w-12 font-bold text-lg text-center", (fieldColors as any)[field])}>{(fieldLabels as any)[field]}</Label>
                                <Input value={userAnswers[currentIndex]?.[field] || ''} onChange={e => handleAnswerChange(field, e.target.value)} className={cn("flex-1 h-10 text-lg", status === 'correct' ? 'border-green-500 bg-green-50/5' : status === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                                {isAdmin && (
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(field, 'correct')} className={cn("h-8 w-8 rounded-full", status === 'correct' ? "bg-green-500 text-white" : "bg-muted")}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(field, 'incorrect')} className={cn("h-8 w-8 rounded-full", status === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")}><X className="h-4 w-4"/></Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                {currentIndex === prompts.length - 1 ? <Button onClick={onComplete} className="bg-primary font-bold px-12 text-white">Terminar</Button> : <Button onClick={() => setCurrentIndex(p => Math.min(prompts.length - 1, p + 1))}>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>}
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class3Content() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('grammar2');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [vocab2Answers, setVocab2Answers] = useState<string[]>(Array(vocab2Data.length).fill(''));
    const [vocab2Validation, setVocab2Validation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocab2Data.length).fill('unchecked'));
    const [canAdvanceVocab2, setCanAdvanceVocab2] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'grammar2', name: 'Gramática 2', icon: GraduationCap, status: 'active' },
        { key: 'mixedExercises1', name: 'Ejercicios Mixtos 1', icon: PenSquare, status: 'locked' },
        { key: 'presentSimpleUses', name: 'Usos del Presente Simple', icon: BookOpen, status: 'locked' },
        { key: 'ex2_1', name: 'Mixed Exercises 2 (1)', icon: PenSquare, status: 'locked' },
        { key: 'ex2_2', name: 'Mixed Exercises 2 (2)', icon: PenSquare, status: 'locked' },
        { key: 'vocabulary2', name: 'Vocabulario 2', icon: BookOpen, status: 'locked' },
        { key: 'ex3_3', name: 'Mixed Exercises 3 (3)', icon: PenSquare, status: 'locked' },
        { key: 'ex3_4', name: 'Mixed Exercises 3 (4)', icon: PenSquare, status: 'locked' },
        { key: 'can', name: 'Verbo Modal: CAN', icon: GraduationCap, status: 'locked' },
        { key: 'can1', name: 'Ejercicio CAN 1', icon: PenSquare, status: 'locked' },
        { key: 'can2', name: 'Ejercicio CAN 2', icon: PenSquare, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => setTopicToComplete(completedKey), []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({...t}));
        let savedST = '';
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const d = studentProfile.lessonProgress[progressStorageKey];
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || 'grammar2');
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
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageKey}`]: d, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading]);

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
                    setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
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
    };

    const handleVocab2Check = () => {
        let oneOk = false;
        const newVal = vocab2Data.map((v, i) => {
            const ok = v.en.toLowerCase() === (vocab2Answers[i] || '').trim().toLowerCase();
            if (ok) oneOk = true; return ok ? 'correct' : 'incorrect';
        });
        setVocab2Validation(newVal as any); setCanAdvanceVocab2(oneOk);
        if (oneOk) toast({ title: "¡Bien hecho!" }); else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'grammar2':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">3rd Person Singular (he, she, it)</CardTitle>
                                <CardDescription className="font-bold text-foreground">FORMACION DE LA TERCERA PERSONA SINGULAR AFIRMATIVA EN EL PRESENTE SIMPLE</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50">
                                    <h3 className="font-bold text-primary mb-3 text-black">1. Regla General</h3>
                                    <p className="font-mono text-base italic text-black">Normalmente los verbos en tercera persona agregan solo la <span className="text-primary font-bold">"s"</span></p>
                                    <p className="font-mono text-lg font-bold mt-2 text-black">she works, she eats</p>
                                </div>
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50">
                                    <h3 className="font-bold text-primary mb-3 text-black">2. Verbos terminados en o, sh, ch, ss, x, z</h3>
                                    <p className="font-mono text-base italic text-black">Se le agrega <span className="text-primary font-bold">"ES"</span></p>
                                    <p className="font-mono text-lg font-bold mt-2 text-black">i go = she goes // i wish = she wishes // i kiss = she kisses</p>
                                </div>
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50">
                                    <h3 className="font-bold text-primary mb-3 text-black">3. Verbos terminados en "y" (consonante + y)</h3>
                                    <p className="font-mono text-base italic text-black">Se cancela la "y" y se agrega <span className="text-primary font-bold">"ies"</span></p>
                                    <p className="font-mono text-lg font-bold mt-2 text-black">i study = she studies</p>
                                </div>
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50">
                                    <h3 className="font-bold text-primary mb-3 text-black">4. Verbos terminados en "y" (vocal + y)</h3>
                                    <p className="font-mono text-base italic text-black">Se le agrega solo la <span className="text-primary font-bold">"s"</span></p>
                                    <p className="font-mono text-lg font-bold mt-2 text-black">i buy = she buys // i stay = she stays</p>
                                </div>
                                <div className="p-6 bg-destructive/5 rounded-[2rem] border-2 border-dashed border-destructive/20 text-center">
                                    <p className="font-bold text-destructive text-lg">NOTA: Esto solo se utiliza en oraciones afirmativas (+). <br/> En (-) e (?) no se usa.</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-12 font-bold">Entendido <ArrowRight className="ml-2" /></Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'mixedExercises1': return <PresentSimpleExercise exerciseData={mixedExercise1Data} onComplete={() => handleTopicComplete('mixedExercises1')} title="Mixed Exercises 1" showShortAnswers={false} vocabulary={{ "vino tinto": "red wine", "hermano": "brother", "bicicleta": "bike / bicycle", "novio": "boyfriend", "hospital": "hospital", "pastel": "cake", "piña": "pineapple" }} />;
            case 'presentSimpleUses':
                return (
                    <div className="space-y-6 text-left text-black">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">Usos del Presente Simple</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50"><p className="text-lg">a) Acciones o estados habituales que se repiten.</p></div>
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50"><p className="text-lg">b) Situaciones permanentes.</p></div>
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50"><p className="text-lg">c) Verdades absolutas (científicas).</p></div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('presentSimpleUses')} size="lg" className="px-12 font-bold">Continuar</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'ex2_1': return <SimpleTranslationExercise course="a1" exerciseKey="c2_mixed1" onComplete={() => handleTopicComplete('ex2_1')} title="Ejercicio 1" vocabulary={{ "bebe": "drinks", "cerveza": "beer", "escuela": "school", "tio": "uncle" }} highlightVocabulary={true} />;
            case 'ex2_2': return <QAShortAnswerExercise exerciseData={mixedExercise2Sub2Data} onComplete={() => handleTopicComplete('ex2_2')} title="Ejercicio 2" description="Traduce y responde." />;
            case 'vocabulary2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm p-6 text-left">
                        <CardHeader><CardTitle>Vocabulary 2</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="font-bold bg-muted p-2 rounded">Español</div><div className="font-bold bg-muted p-2 rounded">Inglés</div>
                                {vocab2Data.map((v, i) => (
                                    <React.Fragment key={i}>
                                        <div className="p-2 border rounded bg-card flex items-center font-medium">{v.es}</div>
                                        <Input value={vocab2Answers[i]} onChange={e => { const n = [...vocab2Answers]; n[i] = e.target.value; setVocab2Answers(n); }} className={cn(vocab2Validation[i] === 'correct' ? 'border-green-500 bg-green-50' : vocab2Validation[i] === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between mt-4"><Button onClick={handleVocab2Check}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary2')} disabled={!canAdvanceVocab2 && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'ex3_3': return <ShortAnswerPresentSimpleExercise exerciseData={shortAnswerEx3Data} onComplete={() => handleTopicComplete('ex3_3')} title="Ejercicio 3" description="Responde cortamente." />;
            case 'ex3_4': return <LargeTextTranslationExercise title="Ejercicio 4: Diálogo" dialogue={class3LargeTextEx4Dialogue} onComplete={() => handleTopicComplete('ex3_4')} />;
            case 'can':
                return (
                    <div className="space-y-6 text-left text-black">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">VERBO MODAL CAN</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50">
                                    <p className="text-xl font-bold text-primary mb-3">CAN = poder</p>
                                    <ul className="list-disc pl-5 space-y-2 text-lg">
                                        <li>No tiene modificación en presente (no lleva 's').</li>
                                        <li>Siempre después de <span className="font-bold">can</span> hay otro verbo.</li>
                                        <li>NUNCA tiene el "TO" entre can y el otro verbo.</li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] border border-border/50">
                                    <h3 className="text-xl font-bold text-primary mb-4 uppercase tracking-tight">ESTRUCTURA:</h3>
                                    <div className="space-y-3 font-mono text-base sm:text-lg">
                                        <p><span className="text-green-500 font-bold mr-2">(+)</span> pronoun + can + verb + comp.</p>
                                        <p><span className="text-red-500 font-bold mr-2">(-)</span> pronoun + can + NOT + verb + comp.</p>
                                        <p><span className="text-blue-500 font-bold mr-2">(?)</span> can + pronoun + verb + comp ?</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('can')} size="lg" className="px-16 font-bold h-14 text-xl">Entendido <ArrowRight className="ml-2 h-6 w-6" /></Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'can1': return <LinesWritingExercise title="CAN 1" description="Traduce las frases de forma libre." prompts={can1Prompts} onComplete={() => handleTopicComplete('can1')} studentDocRef={studentDocRef} isAdmin={isAdmin} savePath={`lessonProgress.${progressStorageKey}.canData`} savePathGrades={`lessonProgress.${progressStorageKey}.canGrades`} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.canData} initialGrades={studentProfile?.lessonProgress?.[progressStorageKey]?.canGrades} />;
            case 'can2': return <Can2ManualGradingExercise prompts={can2Prompts} onComplete={() => handleTopicComplete('can2')} studentDocRef={studentDocRef} isAdmin={isAdmin} savePath={`lessonProgress.${progressStorageKey}.can2Data`} savePathGrades={`lessonProgress.${progressStorageKey}.can2Grades`} initialData={studentProfile?.lessonProgress?.[progressStorageKey]?.can2Data} initialGrades={studentProfile?.lessonProgress?.[progressStorageKey]?.can2Grades} />;
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
