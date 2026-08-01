'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    BookText,
    Pencil,
    Mic,
    HelpCircle,
    Home,
    ArrowLeft,
    Check,
    X,
    Clock,
    Info,
    ListChecks,
    Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u2_c7_v15_validation_fix';
const mainProgressKey = 'progress_a2_eng_unit_2_class_7';

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const houseVocab = [
    { es: "HABITACION", en: "ROOM" }, { es: "COMEDOR", en: "DININGROOM" }, { es: "SALA", en: "LIVINGROOM" },
    { es: "BAÑO", en: "BATHROOM" }, { es: "COCINA", en: "KITCHEN" }, { es: "GARAJE", en: "GARAGE" },
    { es: "BALCON", en: "BALCONY" }, { es: "TECHO", en: "ROOF" }, { es: "CIELORRASO", en: "CEILING" },
    { es: "APARTAMENTO (U.K.)", en: "FLAT" }, { es: "APARTAMENTO (U.S.)", en: "APARTMENT" },
    { es: "SOTANO", en: "BASEMENT" }, { es: "TIMBRE", en: "DOORBELL" }, { es: "DESPENSA", en: "PANTRY" },
];

const ex1Prompts = [
    { 
        spanish: "ESTABA EN CASA EL SABADO CUANDO EL ME LLAMO.", 
        answers: {
            pos: ["i was at home on saturday when he called me"],
            neg: ["i was not at home on saturday when he called me", "i wasn't at home on saturday when he called me"],
            int: ["was i at home on saturday when he called me?", "were you at home on saturday when he called you?"],
            saPos: ["yes, i was", "yes, you were"],
            saNeg: ["no, i was not", "no, i wasn't", "no, you were not", "no, you weren't"]
        }
    },
    { 
        spanish: "TU ESTUVISTE CANSADO AYER.", 
        answers: {
            pos: ["you were tired yesterday"],
            neg: ["you were not tired yesterday", "you weren't tired yesterday"],
            int: ["were you tired yesterday?"],
            saPos: ["yes, i was", "yes, you were"],
            saNeg: ["no, i was not", "no, i'm not", "no, you were not", "no, you weren't"]
        }
    }
];

const ex1Vocab = { "estaba": "was", "en casa": "at home", "llamar": "call", "cansado": "tired", "ayer": "yesterday" };

const ex2Prompts = [
    { question: "WERE YOU WITH YOUR BROTHER YESTERDAY?", answers: { pos: ["yes, i was"], neg: ["no, i am not", "no, i'm not"] } },
    { question: "WAS SHE ANGRY WITH YOU LAST NIGHT?", answers: { pos: ["yes, she was"], neg: ["no, she is not", "no, she isn't"] } },
];

const ex3Prompts = [
    { spanish: "ELLOS SON JOVENES", answer: ["they are young"] },
    { spanish: "ELLOS ERAN JOVENES CUANDO SE CASARON", answer: ["they were young when they got married", "they were young when they married"] },
];

const ex3Vocab = { "jóvenes": "young", "casarse": "get married" };

const ex4Prompts = [
    { question: "WERE YOU WITH LUCAS YESTERDAY?", answers: { pos: ["yes, i was"], neg: ["no, i am not", "no, i'm not"] } },
    { question: "WERE THEY HAPPY WHEN YOU CALLED THEM?", answers: { pos: ["yes, they were"], neg: ["no, they were not", "no, they weren't"] } },
];

const fillGapsPrompts = [
    { text: "YESTERDAY I ___________________BASKETBALL FOR THREE HOURS (PLAY)", answer: "PLAYED" },
    { text: "I _________________ IN CHICAGO FOR FIVE YEARS (LIVE)", answer: "LIVED" },
];

const readingData = {
    title: "The Old Victorian House",
    content: "My grandparents used to live in a very big house. It was built of stone and wood many years ago. I remember that the livingroom was huge and had a very high ceiling. There were four bedrooms on the second floor and a dark basement where we played sometimes. My favorite place was the kitchen because my grandmother was always cooking something delicious there. It was a happy place for our family.",
    questions: [
        { id: 'q1', q: "What was the house made of?", a: ["stone and wood", "wood and stone"] },
        { id: 'q2', q: "Where were the bedrooms?", a: ["on the second floor", "second floor"] },
        { id: 'q3', q: "Why was the kitchen the favorite place?", a: ["because my grandmother was always cooking", "grandmother was cooking"] }
    ]
};

// --- HELPERS ---

const ManualGradingExercise = ({ title, description, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades, sections, isSupervisionMode }: any) => {
    const [lines, setLines] = useState<string[]>(Array(30).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});

    useEffect(() => {
        if (initialLines && Array.isArray(initialLines)) {
            const newLines = [...Array(30).fill('')];
            initialLines.forEach((val: string, i: number) => { if (i < 30) newLines[i] = val || ''; });
            setLines(newLines);
        }
    }, [initialLines]);

    const handleLineChange = (idx: number, val: string) => {
        if (isSupervisionMode) return;
        const nl = [...lines]; nl[idx] = val; setLines(nl);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: nl });
    };

    const handleToggleGrade = (idx: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const newGrades = { ...grades };
        newGrades[idx] = newGrades[idx] === type ? null : type;
        setGrades(newGrades);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: newGrades });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader className='bg-primary/5 border-b'><CardTitle className="uppercase tracking-tighter">{title}</CardTitle><CardDescription className='font-bold text-foreground'>{description}</CardDescription></CardHeader>
            <CardContent className="p-6">
                <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                        {lines.map((line, i) => (
                            <Fragment key={i}>
                                {sections && sections[i] && (
                                    <div className="py-4 bg-muted/50 rounded-lg text-center font-black text-primary uppercase border-y my-4">{sections[i]}</div>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className="font-bold w-10 text-right text-muted-foreground">{i === 0 ? 'T' : i}.</span>
                                    <Input value={line} onChange={e => handleLineChange(i, e.target.value)} className={cn("flex-1 h-10 transition-all font-medium text-foreground", grades[i] === 'correct' ? 'border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : grades[i] === 'incorrect' ? 'border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : '')} readOnly={isSupervisionMode} />
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-8 w-8 rounded-full transition-colors", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-8 w-8 rounded-full transition-colors", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            </Fragment>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 uppercase">Avanzar <ArrowRight className="ml-2 h-6 w-6" /></Button></CardFooter>
        </Card>
    );
};

const TripleTranslationExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ pos: '', neg: '', int: '', saPos: '', saNeg: '' });
    const [val, setVal] = useState<any>({ pos: 'unchecked', neg: 'unchecked', int: 'unchecked', saPos: 'unchecked', saNeg: 'unchecked' });
    const [solved, setSolved] = useState<Record<number, boolean>>({});

    useEffect(() => { setAns({ pos: '', neg: '', int: '', saPos: '', saNeg: '' }); setVal({ pos: 'unchecked', neg: 'unchecked', int: 'unchecked', saPos: 'unchecked', saNeg: 'unchecked' }); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];

    const handleCheck = () => {
        const fields = ['pos', 'neg', 'int', 'saPos', 'saNeg'];
        const keys = ['pos', 'neg', 'int', 'saPos', 'saNeg'];
        const newVal = { ...val }; let allOk = true;
        fields.forEach((f, i) => {
            const user = ans[f as keyof typeof ans].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = currentPrompt.answers[keys[i]].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (f === 'int' && !ans.int.trim().endsWith('?')) { allOk = false; newVal.int = 'incorrect'; }
            else if (corrects.includes(user)) newVal[f] = 'correct'; else { allOk = false; newVal[f] = 'incorrect'; }
        });
        setVal(newVal);
        if (allOk) { toast({ title: "¡Perfecto!" }); setSolved(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
                        <CardTitle className="uppercase tracking-tight">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", solved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}</div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-lg uppercase">{currentPrompt.spanish}</div>
                <div className="space-y-4 font-mono text-base max-w-lg mx-auto">
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-green-500">(+)</Label><Input value={ans.pos} onChange={e => setAns(p => ({...p, pos: e.target.value}))} className={cn("flex-1 text-foreground", val.pos === 'correct' ? 'border-green-500 bg-green-50/10' : val.pos === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-red-500">(-)</Label><Input value={ans.neg} onChange={e => setAns(p => ({...p, neg: e.target.value}))} className={cn("flex-1 text-foreground", val.neg === 'correct' ? 'border-green-500 bg-green-50/10' : val.neg === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-blue-500">(?)</Label><Input value={ans.int} onChange={e => setAns(p => ({...p, int: e.target.value}))} className={cn("flex-1 text-foreground", val.int === 'correct' ? 'border-green-500 bg-green-50/10' : val.int === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></div>
                    <Separator />
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-green-600">(+A)</Label><Input value={ans.saPos} onChange={e => setAns(p => ({...p, saPos: e.target.value}))} className={cn("flex-1 text-foreground", val.saPos === 'correct' ? 'border-green-500 bg-green-50/10' : val.saPos === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-red-600">(-A)</Label><Input value={ans.saNeg} onChange={e => setAns(p => ({...p, saNeg: e.target.value}))} className={cn("flex-1 text-foreground", val.saNeg === 'correct' ? 'border-green-500 bg-green-50/10' : val.saNeg === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!solved[currentIndex]} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ShortAnswersExerciseInternal = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ pos: '', neg: '' });
    const [val, setVal] = useState<any>({ pos: 'unchecked', neg: 'unchecked' });
    const [solved, setSolved] = useState<Record<number, boolean>>({});

    useEffect(() => { setAns({ pos: '', neg: '' }); setVal({ pos: 'unchecked', neg: 'unchecked' }); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];

    const handleCheck = () => {
        const newVal = { ...val }; let allOk = true;
        ['pos', 'neg'].forEach(f => {
            const user = ans[f as keyof typeof ans].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = currentPrompt.answers[f].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (corrects.includes(user)) newVal[f] = 'correct'; else { allOk = false; newVal[f] = 'incorrect'; }
        });
        setVal(newVal);
        if (allOk) { toast({ title: "¡Perfecto!" }); setSolved(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
                        <CardTitle className="uppercase tracking-tight">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", solved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}</div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-lg uppercase">{currentPrompt.question}</div>
                <div className="space-y-4 font-mono text-base max-w-lg mx-auto">
                    <div className="flex items-center gap-4"><Label className="w-16 font-bold text-green-500 text-center">(+A)</Label><Input value={ans.pos} onChange={e => setAns(p => ({...p, pos: e.target.value}))} className={cn("flex-1 text-foreground", val.pos === 'correct' ? 'border-green-500 bg-green-50/10' : val.pos === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-16 font-bold text-red-500 text-center">(-A)</Label><Input value={ans.neg} onChange={e => setAns(p => ({...p, neg: e.target.value}))} className={cn("flex-1 text-foreground", val.neg === 'correct' ? 'border-green-500 bg-green-50/10' : val.neg === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!solved[currentIndex]} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

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
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
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
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (
                                            <Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>
                                        ))}
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

export default function Class7Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = overrideStudentId || searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const hasInitialized = useRef(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(houseVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(houseVocab.length).fill('unchecked'));
    const [gapsIdx, setGapsIdx] = useState(0);
    const [gapsAns, setGapsAns] = useState('');
    const [gapsVal, setGapsVal] = useState<'correct' | 'incorrect' | 'unchecked'>('unchecked');
    const [qDictAns, setQDictAns] = useState<string[]>(Array(7).fill(''));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [isReadingFinished, setIsReadingFinished] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary_house', name: '1. Vocabulary (House)', icon: Home, status: 'active' },
        { key: 'grammar_tobe_past', name: '2. Grammar (To be - past)', icon: GraduationCap, status: 'locked' },
        { key: 'exercise_1', name: '3. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '4. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise_3', name: '5. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'dictation_1', name: '7. Dictation 1', icon: Mic, status: 'locked' },
        { key: 'questions_dict1', name: '8. Questions Dict1', icon: HelpCircle, status: 'locked' },
        { key: 'exercise_4', name: '9. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'fill_the_gaps', name: '10. Fill the gaps', icon: Pencil, status: 'locked' },
        { key: 'borrow_lend', name: '11. Borrow and Lend', icon: Activity, status: 'locked' },
        { key: 'reading', name: '12. Reading', icon: BookText, status: 'locked' },
    ], []);

    useEffect(() => {
        if (!isUserLoading && !isProfileLoading) setIsInitialLoading(false);
    }, [isUserLoading, isProfileLoading]);

    useEffect(() => {
        if (isInitialLoading || hasInitialized.current) return;
        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile?.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < path.length; i++) { if (last && path[i].status === 'locked') path[i].status = 'active'; last = path[i].status === 'completed'; }
        }
        setLearningPath(path as any); setSelectedTopic(d.lastSelectedTopic || path.find(it => it.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.qDictAns) setQDictAns(d.qDictAns);
        setInitialLoadComplete(true);
        hasInitialized.current = true;
    }, [isInitialLoading, studentProfile, isAdmin, initialPathData, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId || !hasInitialized.current || !user) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, qDictAns, readAns };
            learningPath.forEach(t => s[t.key] = t.status);
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 2000);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, initialLoadComplete, vocabAnswers, qDictAns, readAns, user]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, [toast]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
        if (['grammar_tobe_past', 'borrow_lend'].includes(key)) handleTopicComplete(key);
    };

    const handleCheckVocab = () => {
        let all = true; 
        const nv = houseVocab.map((v, i) => { 
            const res = v.en === (vocabAnswers[i] || '').trim().toUpperCase(); 
            if (!res) all = false; 
            return res ? 'correct' : 'incorrect'; 
        });
        setVocabVal(nv); 
        if (all) {
            toast({ title: "¡Perfecto!", description: "Ahora puedes avanzar." });
        } else {
            toast({ variant: 'destructive', title: "Revisa los campos marcados." });
        }
    };

    const handleCheckGaps = () => {
        const cur = fillGapsPrompts[gapsIdx];
        if (gapsAns.trim().toUpperCase() === cur.answer.toUpperCase()) {
            setGapsVal('correct'); toast({ title: "¡Correcto!" });
            if (gapsIdx < fillGapsPrompts.length - 1) {
                setTimeout(() => { setGapsIdx(prev => prev + 1); setGapsAns(''); setGapsVal('unchecked'); }, 1000);
            }
        } else { setGapsVal('incorrect'); toast({ variant: 'destructive', title: "Revisa la conjugación" }); }
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingData.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const isOk = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) allOk = false;
        });
        setReadVal(nv); 
        if (allOk) {
            setIsReadingFinished(true);
            handleTopicComplete('reading');
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary_house':
                const vocabAllOk = vocabVal.length > 0 && vocabVal.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className="uppercase tracking-tight">VOCABULARY: THE HOUSE</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div>
                                {houseVocab.map((v, i) => (
                                    <Fragment key={i}>
                                        <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.es}</div>
                                        <Input 
                                            value={vocabAnswers[i] || ''} 
                                            onChange={e => { if (overrideStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); }} 
                                            className={cn(
                                                "h-12 uppercase font-mono text-foreground transition-all", 
                                                vocabVal[i] === 'correct' ? '!border-green-500 !bg-green-50/10' : 
                                                vocabVal[i] === 'incorrect' ? '!border-destructive !bg-destructive/10' : ''
                                            )} 
                                            autoComplete="off" 
                                            readOnly={isAdmin && !!targetStudentId} 
                                        />
                                    </Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary_house')} disabled={!vocabAllOk && !isAdmin} className='text-white font-bold'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar_tobe_past':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR: TO BE (PAST)</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">WAS // WERE</h3>
                                <p className="mb-4">El verbo "To be" en pasado significa "era/estaba" o "fui/estuve". No usa auxiliares como DID.</p>
                                <Table>
                                    <TableBody>
                                        <TableRow><TableCell className='font-black text-primary'>I - HE - SHE - IT</TableCell><TableCell className='font-bold text-lg'>WAS</TableCell><TableCell className='text-muted-foreground italic text-xs'>(Yo era/estaba...)</TableCell></TableRow>
                                        <TableRow><TableCell className='font-black text-primary'>YOU - WE - THEY</TableCell><TableCell className='font-bold text-lg'>WERE</TableCell><TableCell className='text-muted-foreground italic text-xs'>(Tu eras/estabas...)</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-brand-purple uppercase mb-4">CONTRACTIONS</h3>
                                <div className='grid grid-cols-2 gap-4 text-center'>
                                    <div className='p-4 bg-muted rounded-xl border'><p className='text-xs text-muted-foreground'>WAS + NOT</p><p className='text-xl font-black'>WASN'T</p></div>
                                    <div className='p-4 bg-muted rounded-xl border'><p className='text-xs text-muted-foreground'>WERE + NOT</p><p className='text-xl font-black'>WEREN'T</p></div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar_tobe_past')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">¡Entendido!</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <TripleTranslationExercise title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={ex1Vocab} />;
            case 'exercise_2': return <ShortAnswersExerciseInternal title="Exercise 2: Q&A Short" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} />;
            case 'exercise_3': return <BallsExercise title="Exercise 3: Son vs Eran" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={ex3Vocab} />;
            case 'vocab_game': return <VocabularyMatchingGame data={houseVocab.slice(0, 12).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="House Memory" />;
            case 'dictation_1':
                const sectionsDict = { 1: "1st Postcard", 11: "2nd Postcard", 21: "3rd Postcard" };
                return <ManualGradingExercise title="DICTATION 1: VACATION POSTCARDS" description="Escucha a tu profesor y escribe las 30 líneas de dictado." onComplete={() => handleTopicComplete('dictation_1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dict1Lines" storageKeyGrades="dict1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Grades} sections={sectionsDict} isSupervisionMode={!!overrideStudentId} />;
            case 'questions_dict1':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className="uppercase">Questions Dictation 1</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {["WHICH PERSON LEARNED A LOT ON VACATION?", "WHO HAD A VACATION THAT WAS FULL OF ADVENTURE?", "WHO HAD A VERY RELAXING VACATION?", "WHICH VACATION SOUNDS THE MOST INTERESTING TO YOU?"].map((q, i) => (
                                <div key={i} className="space-y-2"><Label className="font-bold text-primary">{i + 1}. {q}</Label><Input value={qDictAns[i] || ''} onChange={e => { if (overrideStudentId) return; const na = [...qDictAns]; na[i] = e.target.value; setQDictAns(na); }} readOnly={!!overrideStudentId} autoComplete="off" /></div>
                            ))}
                            <Separator />
                            <div className='p-4 bg-muted rounded-xl space-y-4'>
                                <p className='font-bold text-xs uppercase'>READ THE POSTCARDS. THEN WRITE THE NUMBER OF THE POSTCARD WHERE EACH SENTENCE COULD GO:</p>
                                {[ "I LOST FIVE POUNDS AND FEEL TERRIFIC!", "THIS WAS KIND OF DANGEROUS BUT WE GOT THERE SAFELY!", "IT’S A TINY ISLAND ABOUT 2300 MILES WEST OF SANTIAGO, CHILE." ].map((s, i) => (
                                    <div key={i} className='flex items-center gap-4'><Input className='w-12 h-8 text-center font-bold text-foreground' maxLength={1} placeholder='#'/><span className='text-sm italic'>{s}</span></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('questions_dict1')} size="lg" className="px-16 font-bold h-14 uppercase">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4': return <ShortAnswersExerciseInternal title="Exercise 4: Q&A Short" prompts={ex4Prompts} onComplete={() => handleTopicComplete('exercise_4')} />;
            case 'fill_the_gaps':
                const curGap = fillGapsPrompts[gapsIdx];
                const gapsFinished = gapsIdx === fillGapsPrompts.length - 1 && gapsVal === 'correct';
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Fill the Gaps: Past Simple</CardTitle><div className="flex gap-2 pt-2">{fillGapsPrompts.map((_, i) => (<div key={i} className={cn("h-2 flex-1 rounded-full", i < gapsIdx ? "bg-green-500" : i === gapsIdx ? "bg-primary" : "bg-muted")} />))}</div></CardHeader>
                        <CardContent className="space-y-6 pt-10">
                            <div className="bg-muted p-8 rounded-2xl border-2 border-dashed font-bold text-xl uppercase tracking-tighter text-center">"{curGap.text}"</div>
                            <Input value={gapsAns} onChange={e => { if (overrideStudentId) return; setGapsAns(e.target.value); setGapsVal('unchecked'); }} onKeyDown={e => e.key === 'Enter' && handleCheckGaps()} className={cn("h-14 text-2xl font-black uppercase text-center border-2 text-foreground", gapsVal === 'correct' ? 'border-green-500 bg-green-50/10' : gapsVal === 'incorrect' ? 'border-red-50/10' : 'border-primary')} placeholder="..." autoComplete="off" readOnly={!!overrideStudentId} />
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleCheckGaps} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('fill_the_gaps')} disabled={!gapsFinished && !isAdmin} className='text-white font-bold'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'borrow_lend':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">BORROW vs LEND</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <div><h4 className='text-xl text-primary uppercase'>BORROW</h4><p className='text-lg'>"BORROW" MEANS TO TAKE SOMETHING FROM ANOTHER PERSON, KNOWING YOU WILL GIVE IT BACK TO THEM.</p></div>
                                <Separator />
                                <div><h4 className='text-xl text-brand-purple uppercase'>LEND</h4><p className='text-lg'>"LEND" MEANS TO GIVE SOMETHING TO ANOTHER PERSON EXPECTING TO GET IT BACK.</p></div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('borrow_lend')} size="lg" className="px-24 font-black h-14 uppercase shadow-xl">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'reading':
                if (isReadingFinished) {
                    return (
                        <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
                            <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                            <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">CONGRATULATIONS!</h2>
                            <p className="text-2xl mt-4 font-bold text-foreground">Has terminado la Clase 7 (A2)</p>
                            <p className='text-muted-foreground mt-2 text-lg'>Misión completada al 100%.</p>
                            <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/ingles/a2">Volver al Curso</Link></Button>
                        </Card>
                    );
                }
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.text}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map(q => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold'>{q.q}</Label>
                                <Input value={readAns[q.id] || ''} onChange={e => { if (overrideStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} readOnly={!!overrideStudentId} className={cn('mt-1 text-lg h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={!!overrideStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    if (isInitialLoading) return <div className="flex flex-col items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-muted-foreground font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión A2...</p></div>;

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            {isAdmin && targetStudentId && (
                <div className="col-span-12 mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p></div>
                    <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                </div>
            )}
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 7A</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav><ul className="space-y-1">
                            {learningPath.map((item) => {
                                const isLocked = item.status === 'locked' && !isAdmin;
                                const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                return (
                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                        <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span></div>
                                        {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                    </li>
                                );
                            })}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
