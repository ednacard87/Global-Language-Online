'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Check,
    X,
    Gamepad2,
    Trophy,
    Pencil,
    Info,
    ListChecks,
    HelpCircle,
    Clock,
    BookText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- DATA ---
const adverbsVocab = [
    { es: "SIEMPRE", en: "ALWAYS" },
    { es: "CASI SIEMPRE", en: "ALMOST ALWAYS" },
    { es: "USUALMENTE", en: "USUALLY" },
    { es: "A MENUDO", en: "OFTEN" },
    { es: "A VECES", en: "SOMETIMES" },
    { es: "RARAMENTE", en: "RARELY" },
    { es: "CASI NUNCA", en: "HARDLY EVER" },
    { es: "NUNCA", en: "NEVER" },
    { es: "BIEN", en: "WELL" },
    { es: "MAL", en: "BADLY" },
    { es: "RÁPIDAMENTE", en: "QUICKLY" },
    { es: "LENTAMENTE", en: "SLOWLY" },
];

const ex1Prompts = [
    { spanish: "YO SIEMPRE ESTUDIO EN LA NOCHE", answer: ["i always study at night"] },
    { spanish: "ELLA NUNCA COME CARNE", answer: ["she never eats meat"] },
    { spanish: "NOSOTROS A VECES VAMOS AL CINE", answer: ["we sometimes go to the cinema", "we sometimes go to the movies"] },
    { spanish: "¿TU SIEMPRE TRABAJAS LOS SABADOS?", answer: ["do you always work on saturdays?"] },
    { spanish: "EL CASI NUNCA BEBE VINO", answer: ["he hardly ever drinks wine"] },
];

const ex2Prompts = [
    { spanish: "MI PADRE USUALMENTE LLEGA TARDE", answer: ["my father usually arrives late", "my dad usually arrives late"] },
    { spanish: "ELLOS A MENUDO JUEGAN FUTBOL", answer: ["they often play soccer", "they often play football"] },
    { spanish: "YO RÁPIDAMENTE APRENDO INGLES", answer: ["i quickly learn english"] },
    { spanish: "ELLA HABLA MUY BIEN", answer: ["she speaks very well"] },
    { spanish: "MI HERMANO CAMINA LENTAMENTE", answer: ["my brother walks slowly"] },
];

const ex3Prompts = [
    { spanish: "YO NUNCA TRABAJO LOS DOMINGOS", answer: ["i never work on sundays"] },
    { spanish: "ELLOS USUALMENTE COMEN PIZZA", answer: ["they usually eat pizza"] },
    { spanish: "A VECES NOSOTROS VIAJAMOS", answer: ["sometimes we travel", "we sometimes travel"] },
    { spanish: "EL HABLA RAPIDAMENTE", answer: ["he speaks quickly"] },
    { spanish: "ELLA BAILA MUY MAL", answer: ["she dances very badly"] },
];

const ex4Prompts = [
    { spanish: "YO SIEMPRE LLEGO TEMPRANO", answer: ["i always arrive early"] },
    { spanish: "ELLOS RARAMENTE ESCUCHAN MUSICA", answer: ["they rarely listen to music"] },
    { spanish: "NOSOTROS CASI NUNCA SALIMOS", answer: ["we hardly ever go out"] },
    { spanish: "ELLA TRABAJA BIEN", answer: ["she works well"] },
    { spanish: "EL CORRE RAPIDAMENTE", answer: ["he runs quickly"] },
];

const ex5Prompts = [
    { spanish: "YO NUNCA BEBO ALCOHOL PORQUE ES MALO", answer: ["i never drink alcohol because it is bad"] },
    { spanish: "A VECES ELLA ESTUDIA CONMIGO", answer: ["sometimes she studies with me", "she sometimes studies with me"] },
    { spanish: "ELLOS SIEMPRE HABLAN INGLES EN LA CLASE", answer: ["they always speak english in class"] },
    { spanish: "¿TU USUALMENTE TRABAJAS EN LA MAÑANA?", answer: ["do you usually work in the morning?"] },
    { spanish: "EL CASI SIEMPRE ESTA FELIZ", answer: ["he is almost always happy", "he's almost always happy"] },
];

const ex6Prompts = [
    { spanish: "¿QUE TAN SEGUIDO HABLAS CON EL?", answer: ["how often do you talk to him?", "how often do you talk with him?"] },
    { spanish: "YO CASI NUNCA COMO COMIDA CHATARRA", answer: ["i hardly ever eat junk food"] },
    { spanish: "ELLA SIEMPRE ME LLAMA EN LA TARDE", answer: ["she always calls me in the afternoon"] },
    { spanish: "¿ELLOS A MENUDO VAN AL PARQUE?", answer: ["do they often go to the park?"] },
    { spanish: "NOSOTROS RARAMENTE VEMOS TELEVISION", answer: ["we rarely watch tv"] },
];

const orderPrompts1 = [
    { scrambled: "SOMETIMES / I / COFFEE / DRINK", correct: "I SOMETIMES DRINK COFFEE" },
    { scrambled: "NEVER / SHE / LATE / IS", correct: "SHE IS NEVER LATE" },
    { scrambled: "ALWAYS / THEY / HAPPY / ARE", correct: "THEY ARE ALWAYS HAPPY" },
    { scrambled: "WORKS / HARD / HE / ALWAYS", correct: "HE ALWAYS WORKS HARD" },
];

const orderPrompts2 = [
    { scrambled: "USUALLY / WE / EARLY / ARRIVE", correct: "WE USUALLY ARRIVE EARLY" },
    { scrambled: "HARDLY EVER / DRINKS / HE / WINE", correct: "HE HARDLY EVER DRINKS WINE" },
    { scrambled: "OFTEN / SHE / PLAYS / TENNIS", correct: "SHE OFTEN PLAYS TENNIS" },
    { scrambled: "ALWAYS / YOU / SLEEP / LATE", correct: "YOU ALWAYS SLEEP LATE" },
];

const orderPrompts3 = [
    { scrambled: "QUICKLY / RUNS / HE / VERY", correct: "HE RUNS VERY QUICKLY" },
    { scrambled: "WELL / SPEAKS / SHE / ENGLISH", correct: "SHE SPEAKS ENGLISH WELL" },
    { scrambled: "SLOWLY / WALKS / THE CAT / VERY", correct: "THE CAT WALKS VERY SLOWLY" },
    { scrambled: "BADLY / THEY / THE SONG / SING", correct: "THE SING THE SONG BADLY" },
];

const howOftenPrompts = [
    { spanish: "¿QUE TAN SEGUIDO LAVAS TU CARRO?", answer: ["how often do you wash your car?"] },
    { spanish: "¿QUE TAN SEGUIDO ELLA VIAJA?", answer: ["how often does she travel?"] },
    { spanish: "¿QUE TAN SEGUIDO ELLOS HACEN EJERCICIO?", answer: ["how often do they exercise?", "how often do they do exercise?"] },
    { spanish: "YO LAVO MI CARRO UNA VEZ AL MES", answer: ["i wash my car once a month"] },
    { spanish: "ELLA VIAJA DOS VECES AL AÑO", answer: ["she travels twice a year"] },
];

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_u3_c15_v10_final_stable';
const mainProgressKey = 'progress_a1_eng_unit_3_class_15';

// --- SUB-COMPONENTS ---

const OrderExercise = ({ prompts, onComplete, title }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAns(''); }, [currentIndex]);

    const handleCheck = () => {
        const isOk = ans.trim().toUpperCase() === prompts[currentIndex].correct.toUpperCase();
        setStatus(p => ({ ...p, [currentIndex]: isOk ? 'correct' : 'incorrect' }));
        if (isOk) toast({ title: "¡Orden correcto!" });
        else toast({ variant: 'destructive', title: "Intenta otro orden" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <div className="flex gap-2 justify-start flex-wrap pt-4">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 bg-muted rounded-xl border-2 border-dashed font-mono text-xl text-center uppercase tracking-widest">{prompts[currentIndex].scrambled}</div>
                <Input value={ans} onChange={e => setAns(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} placeholder="Escribe la oración en orden..." className={cn("h-12 text-lg uppercase", status[currentIndex] === 'correct' ? 'border-green-500' : status[currentIndex] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="font-bold">Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

const WritingGradingExercise = ({ title, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades }: any) => {
    const [lines, setLines] = useState<string[]>(Array(5).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});

    useEffect(() => { 
        if (initialLines) setLines(initialLines); 
        if (initialGrades) setGrades(initialGrades); 
    }, [initialLines, initialGrades]);

    const handleLineChange = (idx: number, val: string) => {
        if (isAdmin) return;
        const nl = [...lines]; nl[idx] = val; setLines(nl);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: nl });
    };

    const handleToggleGrade = (idx: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const ng = { ...grades }; ng[idx] = ng[idx] === type ? null : type; setGrades(ng);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: ng });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Escribe 5 frases usando adverbios de frecuencia.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
                {lines.map((l, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="font-bold text-muted-foreground w-6">{i+1}.</span>
                        <Input value={l} onChange={e => handleLineChange(i, e.target.value)} readOnly={isAdmin} className={cn(grades[i] === 'correct' ? 'border-green-500 bg-green-50/10' : grades[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} />
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-8 w-8", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-8 w-8", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={onComplete} size="lg" className="px-12 font-bold">Avanzar</Button></CardFooter>
        </Card>
    );
};

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setCurrentIndex(0); setAnswer(''); setStatus({});
    }, [prompts]);

    useEffect(() => {
        setAnswer('');
    }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = currentPrompt.answer || currentPrompt.english;
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></React.Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{currentPrompt.spanish}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu traducción..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class15Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAns, setVocabAns] = useState<string[]>(Array(adverbsVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(adverbsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulary (Adverbs)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Grammar (Adverbs)', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '3. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '4. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: '5. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex4', name: '7. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: '8. Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'order1', name: '9. Correct Order 1', icon: ListChecks, status: 'locked' },
        { key: 'how_often', name: '10. How Often', icon: HelpCircle, status: 'locked' },
        { key: 'create1', name: '11. Create 1', icon: Pencil, status: 'locked' },
        { key: 'order2', name: '12. Correct Order 2', icon: ListChecks, status: 'locked' },
        { key: 'ex6', name: '13. Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'order3', name: '14. Correct Order 3', icon: ListChecks, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        let p = initialLearningPath.map(t => ({ ...t }));
        p.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
        if (isAdmin && !overrideStudentId) p.forEach(t => (t as any).status = 'completed');
        let last = true;
        for(let i=0; i < p.length; i++) { if (last && (p[i] as any).status === 'locked') (p[i] as any).status = 'active'; last = (p[i] as any).status === 'completed'; }
        setLearningPath(p); setSelectedTopic(d.lastSelectedTopic || p.find(it => it.status === 'active')?.key || p[0].key);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, overrideStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || overrideStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, overrideStudentId]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = curr.map(t => ({ ...t }));
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active';
                    next = np[i + 1].key;
                }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión completada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleCheckVocab = () => {
        let ok = true;
        const nv = adverbsVocab.map((v, i) => {
            const res = v.en === (vocabAns[i] || '').trim().toUpperCase();
            if (!res) ok = false; return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv); if (ok) { toast({ title: "¡Vocabulario dominado!" }); setCanAdvanceVocab(true); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>ADVERBS VOCABULARY</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-3">
                            {adverbsVocab.map((v, i) => (<Fragment key={i}><div className="p-2 border rounded font-bold text-xs uppercase">{v.es}</div><Input value={vocabAns[i]} onChange={e => { const n = [...vocabAns]; n[i] = e.target.value; setVocabAns(n); }} className={cn("h-9 uppercase", vocabVal[i] === 'correct' ? 'border-green-500' : vocabVal[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></Fragment>))}
                        </div></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!isAdmin && !vocabVal.every(v => v === 'correct')} className="font-bold">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR: ADVERBS POSITION</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border border-primary/20">
                                <h4 className="font-black text-primary uppercase mb-2">1. Adverbios de Frecuencia</h4>
                                <p className="font-bold">Van ANTES del verbo principal, pero DESPUÉS del verbo "To Be".</p>
                                <div className="mt-3 p-3 bg-muted rounded-lg font-mono text-sm space-y-1">
                                    <p>I <span className="text-primary font-black">ALWAYS</span> study (Antes de study)</p>
                                    <p>I am <span className="text-primary font-black">ALWAYS</span> happy (Después de am)</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border border-primary/20">
                                <h4 className="font-black text-primary uppercase mb-2">2. Adverbios de Modo</h4>
                                <p className="font-bold">Indican CÓMO se hace una acción. Usualmente van al final de la frase.</p>
                                <div className="mt-3 p-3 bg-muted rounded-lg font-mono text-sm">
                                    <p>She walks <span className="text-primary font-black">SLOWLY</span> (Ella camina lentamente)</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2': return <BallsExercise title="Exercise 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} />;
            case 'ex3': return <BallsExercise title="Exercise 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} />;
            case 'vocab_game': return <VocabularyMatchingGame data={adverbsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Misión: Encuentra las parejas" />;
            case 'ex4': return <BallsExercise title="Exercise 4" prompts={ex4Prompts} onComplete={() => handleTopicComplete('ex4')} />;
            case 'ex5': return <BallsExercise title="Exercise 5" prompts={ex5Prompts} onComplete={() => handleTopicComplete('ex5')} />;
            case 'order1': return <OrderExercise title="Correct Order 1" prompts={orderPrompts1} onComplete={() => handleTopicComplete('order1')} />;
            case 'how_often': return <BallsExercise title="Misión: How Often?" prompts={howOftenPrompts} onComplete={() => handleTopicComplete('how_often')} />;
            case 'create1': return <WritingGradingExercise title="Create 1" onComplete={() => handleTopicComplete('create1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="create1Lines" storageKeyGrades="create1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Grades} />;
            case 'order2': return <OrderExercise title="Correct Order 2" prompts={orderPrompts2} onComplete={() => handleTopicComplete('order2')} />;
            case 'ex6': return <BallsExercise title="Exercise 6" prompts={ex6Prompts} onComplete={() => handleTopicComplete('ex6')} />;
            case 'order3': return <OrderExercise title="Correct Order 3" prompts={orderPrompts3} onComplete={() => handleTopicComplete('order3')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter">Ruta De Misión</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6 text-foreground">
                            <nav><ul className="space-y-1">
                                {learningPath.map(item => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                    return (
                                        <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                            <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", item.status === 'locked' ? "text-yellow-500" : "text-primary")} />}<span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span></div>
                                            {isLocked && <Lock className="h-4 w-4 text-yellow-500/50" />}
                                        </li>
                                    );
                                })}
                            </ul></nav>
                        </div>
                        <div className="p-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}