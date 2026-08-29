'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
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
    Star,
    User,
    Clock,
    Check,
    X,
    Info,
    HelpCircle,
    Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u2_c10_v10_bulk_verify';
const mainProgressKey = 'progress_a2_eng_unit_2_class_10';

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

const personalityVocab = [
    { es: "DISTRAIDO", en: "ABSENT-MINDED" }, { es: "MOLESTO", en: "ANNOYING" },
    { es: "ABURRIDOR", en: "BORING" }, { es: "MALHUMORADO", en: "BAD-TEMPERED" },
    { es: "TORPE", en: "CLUMSY" }, { es: "DESHONESTO", en: "DISHONEST" },
    { es: "ENVIDIOSO", en: "ENVIOUS" }, { es: "OLVIDADIZO", en: "FORGETFUL" },
    { es: "QUISQUILLOSO", en: "FUSSY" }, { es: "INSENSIBLE", en: "INSENSITIVE" },
    { es: "CELOSO", en: "JEALOUS" }, { es: "PEREZOSO", en: "LAZY" },
    { es: "SOLITARIO", en: "LONELY" }, { es: "ARROGANTE", en: "ARROGANT" },
    { es: "INGENUO", en: "NAIVE" }, { es: "ORGULLOSO", en: "PROUD" },
    { es: "RENCOROSO", en: "SPITEFUL" }, { es: "EGOISTA", en: "SELFISH" },
    { es: "DESCONFIADO", en: "DISTRUSTFUL" }, { es: "PRESUMIDO", en: "CONCEITED" }
];

const irregularVerbsData = [
    { pres: "BE", past: "WAS / WERE", part: "BEEN", es: "SER / ESTAR", fixed: "part" },
    { pres: "SPEAK", past: "SPOKE", part: "SPOKEN", es: "HABLAR", fixed: "past" },
    { pres: "BRING", past: "BROUGHT", part: "BROUGHT", es: "TRAER", fixed: "pres" },
    { pres: "BUY", past: "BOUGHT", part: "BOUGHT", es: "COMPRAR", fixed: "pres" },
    { pres: "SPEND", past: "SPENT", part: "SPENT", es: "GASTAR", fixed: "part" },
    { pres: "COME", past: "CAME", part: "COME", es: "VENIR", fixed: "part" },
    { pres: "DRINK", past: "DRANK", part: "DRUNK", es: "BEBER", fixed: "past" },
    { pres: "DO", past: "DID", part: "DONE", es: "HACER", fixed: "pres" },
    { pres: "SWIM", past: "SWAM", part: "SWUM", es: "NADAR", fixed: "pres" },
    { pres: "TELL", past: "TOLD", part: "TOLD", es: "DECIR/CONTAR", fixed: "past" },
    { pres: "EAT", past: "ATE", part: "EATEN", es: "COMER", fixed: "pres" },
    { pres: "FORGET", past: "FORGOT", part: "FORGOTTEN", es: "OLVIDAR", fixed: "pres" },
    { pres: "FORGIVE", past: "FORGAVE", part: "FORGIVEN", es: "PERDONAR", fixed: "part" },
    { pres: "SELL", past: "SOLD", part: "SOLD", es: "VENDER", fixed: "past" },
    { pres: "GET", past: "GOT", part: "GOT", es: "OBTENER", fixed: "pres" },
    { pres: "GIVE", past: "GAVE", part: "GIVEN", es: "DAR", fixed: "pres" },
    { pres: "SEE", past: "SAW", part: "SEEN", es: "VER", fixed: "past" },
    { pres: "WIN", past: "WON", part: "WON", es: "GANAR", fixed: "part" },
    { pres: "GO", past: "WENT", part: "GONE", es: "IR", fixed: "past" },
    { pres: "TAKE", past: "TOOK", part: "TAKEN", es: "TOMAR", fixed: "pres" },
    { pres: "FEEL", past: "FELT", part: "FELT", es: "SENTIR", fixed: "past" },
    { pres: "THINK", past: "THOUGHT", part: "THOUGHT", es: "PENSAR", fixed: "part" },
    { pres: "BECOME", past: "BECAME", part: "BECOME", es: "CONVERTIRSE", fixed: "past" },
    { pres: "FALL", past: "FELL", part: "FALLEN", es: "CAER", fixed: "part" },
    { pres: "LEAVE", past: "LEFT", part: "LEFT", es: "SALIR", fixed: "pres" },
];

const ex1Prompts = [
    { spanish: "HAY UN CARRO NEGRO AL FRENTE DE MI CASA.", answer: ["there is a black car in front of my house", "there is a black car in front of my home"] },
    { spanish: "HABIA UNA PERSONA GRITANDO A LA MEDIA NOCHE EN MI BARRIO", answer: ["there was a person shouting at midnight in my neighborhood", "there was a person screaming at midnight in my neighborhood"] },
];

const ex2Prompts = [
    { 
        spanish: "HAY UN PERRO SOBRE LA SILLA", 
        answers: { 
            pos: ["there is a dog on the chair"], 
            neg: ["there is not a dog on the chair", "there isn't a dog on the chair"], 
            int: ["is there a dog on the chair?"] 
        } 
    },
    { 
        spanish: "HABIA UNA CAJA DEBAJO DE LA MESA Y YO LA PERDÍ", 
        answers: { 
            pos: ["there was a box under the table and i lost it"], 
            neg: ["there was not a box under the table and i lost it", "there wasn't a box under the table and i lost it"], 
            int: ["was there a box under the table?"] 
        } 
    },
];

const ex3Prompts = [
    { 
        spanish: "YO CAMINABA A LA ESCUELA, CUANDO YO ERA UNA NIÑA", 
        answers: { 
            pos: ["i used to walk to school when i was a girl"], 
            neg: ["i did not use to walk to school when i was a girl", "i didn't use to walk to school when i was a girl"], 
            int: ["did you use to walk to school when you were a girl?"] 
        } 
    },
    { 
        spanish: "ELLA SOLIA JUGAR CONMIGO, CUANDO TENIA 10 AÑOS", 
        answers: { 
            pos: ["she used to play with me when she was 10 years old", "she used to play with me when she was ten"], 
            neg: ["she did not use to play with me when she was 10 years old", "she didn't use to play with me when she was 10"], 
            int: ["did she use to play with you when she was 10 years old?"] 
        } 
    },
];

const ex4Prompts = [
    { spanish: "¿SOLIAS BAILAR LOS FINES DE SEMANA?", answer: ["did you use to dance on weekends?", "did you use to dance on the weekends?"] },
    { spanish: "ELLA NO SOLIA VIAJAR AL EXTERIOR (ABROAD)- AHORA ELLA CONOCE MUCHOS PAISES", answer: ["she did not use to travel abroad - now she knows many countries", "she didn't use to travel abroad - now she knows many countries"] },
];

const ex5Prompts = [
    { spanish: "ELLA NO TRABAJÓ LOS SABADOS EL AÑO PASADO", answer: ["she did not work on saturdays last year", "she didn't work on saturdays last year"] },
    { spanish: "¿ESTABAS EN CASA EL DOMINGO EN LA NOCHE?", answer: ["were you at home on sunday night?", "were you at home on sunday at night?"] },
];

const ex6Prompts = [
    { spanish: "ELLOS NO SOLIAN JUGAR CON NOSOTROS CUANDO ERAMOS NIÑOS", answer: ["they did not use to play with us when we were children", "they didn't use to play with us when we were kids"] },
    { spanish: "YO SOLIA ESTUDIAR MUCHO CUANDO ESTABA EN EL COLEGIO", answer: ["i used to study a lot when i was at school"] },
];

const readingContent = {
    title: "Memories of my Childhood",
    text: `When I was a child, I used to live in a very small town. There was a big park near my house. My friends and I used to play soccer every afternoon. There were many trees and flowers. 

Now, I live in a big city. There is a lot of traffic and noise. 

Last week, I visited my old town. It was very different but still beautiful. I saw my old school and my old friends. We were so happy to be together again.`,
    questions: [
        { id: 'q1', q: "Where did the narrator use to live?", a: ["in a very small town", "small town"] },
        { id: 'q2', q: "What did they use to do every afternoon?", a: ["play soccer", "played soccer"] },
        { id: 'q3', q: "What is the city like now?", a: ["big city with traffic and noise", "a lot of traffic and noise", "it is a big city", "traffic and noise", "there is a lot of traffic and noise" , "different and beautiful"] },
        { id: 'q4', q: "When did they visit the old town?", a: ["last week"] }
    ]
};

// --- HELPERS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const newStatus: any = {};
        let allOk = true;

        prompts.forEach((p: any, i: number) => {
            const userVal = (userAnswers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const isCorrect = p.answer.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
            newStatus[i] = isCorrect ? 'correct' : 'incorrect';
            if (!isCorrect) allOk = false;
        });

        setStatus(newStatus);
        if (allOk) toast({ title: "¡Excelente!", description: "Has traducido todas las frases correctamente." });
        else toast({ variant: 'destructive', title: "Sigue intentando", description: "Revisa las frases marcadas en rojo." });
    };

    const isLast = currentIndex === prompts.length - 1;
    const allSolved = Object.keys(status).length === prompts.length && Object.values(status).every(s => s === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className="text-foreground">{title}</CardTitle>
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
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (
                                            <Fragment key={es}>
                                                <span className="text-muted-foreground capitalize">{es}:</span>
                                                <span className="font-semibold text-right">{en}</span>
                                            </Fragment>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].spanish}</div>
                <Input value={userAnswers[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; setUserAnswers({...userAnswers, [currentIndex]: e.target.value}); setStatus({...status, [currentIndex]: 'unchecked'}); }} onKeyDown={e => e.key === 'Enter' && isLast && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu traducción..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {isLast && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => isLast ? onComplete() : setCurrentIndex(i => i + 1)} disabled={isLast && !allSolved && !isAdmin} className="text-white font-bold">{isLast ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const TripleTranslationExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState<Record<number, { pos: string, neg: string, int: string }>>({});
    const [val, setVal] = useState<Record<number, { pos: any, neg: any, int: any }>>({});
    const [solvedMap, setSolvedMap] = useState<Record<number, boolean>>({});

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const newVal: any = {};
        const newSolved: any = {};
        let totalOk = true;

        prompts.forEach((p: any, i: number) => {
            const currentAns = ans[i] || { pos: '', neg: '', int: '' };
            const currentVal: any = {};
            let promptOk = true;

            ['pos', 'neg', 'int'].forEach(f => {
                const user = currentAns[f as keyof typeof currentAns].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
                const corrects = p.answers[f].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
                if (f === 'int' && !currentAns.int.trim().endsWith('?')) { promptOk = false; currentVal.int = 'incorrect'; }
                else if (corrects.includes(user)) currentVal[f] = 'correct'; 
                else { promptOk = false; currentVal[f] = 'incorrect'; }
            });

            newVal[i] = currentVal;
            newSolved[i] = promptOk;
            if (!promptOk) totalOk = false;
        });

        setVal(newVal);
        setSolvedMap(newSolved);
        if (totalOk) toast({ title: "¡Perfecto!", description: "Has completado el ejercicio correctamente." });
        else toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Algunas formas gramaticales son incorrectas." });
    };

    const isLast = currentIndex === prompts.length - 1;
    const currentAns = ans[currentIndex] || { pos: '', neg: '', int: '' };
    const currentVal = val[currentIndex] || { pos: 'unchecked', neg: 'unchecked', int: 'unchecked' };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className="uppercase tracking-tight text-foreground">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", solvedMap[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>{i + 1}</div>
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
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-lg uppercase">{prompts[currentIndex].spanish}</div>
                <div className="space-y-4 font-mono text-base max-w-lg mx-auto">
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-green-500">(+)</Label><Input value={currentAns.pos} onChange={e => { if (isSupervisionMode) return; setAns({...ans, [currentIndex]: {...currentAns, pos: e.target.value}}); setVal({...val, [currentIndex]: {...currentVal, pos: 'unchecked'}}); }} className={cn("flex-1 text-foreground", currentVal.pos === 'correct' ? 'border-green-500 bg-green-50/10' : currentVal.pos === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isSupervisionMode} /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-red-500">(-)</Label><Input value={currentAns.neg} onChange={e => { if (isSupervisionMode) return; setAns({...ans, [currentIndex]: {...currentAns, neg: e.target.value}}); setVal({...val, [currentIndex]: {...currentVal, neg: 'unchecked'}}); }} className={cn("flex-1 text-foreground", currentVal.neg === 'correct' ? 'border-green-500 bg-green-50/10' : currentVal.neg === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isSupervisionMode} /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-blue-500">(?)</Label><Input value={currentAns.int} onChange={e => { if (isSupervisionMode) return; setAns({...ans, [currentIndex]: {...currentAns, int: e.target.value}}); setVal({...val, [currentIndex]: {...currentVal, int: 'unchecked'}}); }} className={cn("flex-1 text-foreground", currentVal.int === 'correct' ? 'border-green-500 bg-green-50/10' : currentVal.int === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isSupervisionMode} /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {isLast && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => isLast ? onComplete() : setCurrentIndex(i => i + 1)} disabled={isLast && !solvedMap[currentIndex] && !isAdmin} className="text-white font-bold">{isLast ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ManualGradingExercise = ({ title, description, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades, lineCount = 6, isSupervisionMode = false }: any) => {
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'blue' | 'incorrect' | null>>(initialGrades || {});

    useEffect(() => {
        if (initialLines && Array.isArray(initialLines)) {
            const newLines = [...Array(lineCount).fill('')];
            initialLines.forEach((val: string, i: number) => { if (i < lineCount) newLines[i] = val || ''; });
            setLines(newLines);
        }
    }, [initialLines, lineCount]);

    useEffect(() => { if (initialGrades) setGrades(initialGrades); }, [initialGrades]);

    const handleLineChange = (idx: number, val: string) => {
        if (isSupervisionMode) return;
        const nl = [...lines]; nl[idx] = val; setLines(nl);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: nl });
    };

    const handleToggleGrade = (idx: number, type: 'correct' | 'blue' | 'incorrect') => {
        if (!isAdmin) return;
        const newGrades = { ...grades }; 
        newGrades[idx] = newGrades[idx] === type ? null : type; 
        setGrades(newGrades);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: newGrades });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className='bg-primary/5 border-b text-left'><CardTitle className='uppercase tracking-tighter text-foreground'>{title}</CardTitle><CardDescription className='font-bold text-foreground'>{description}</CardDescription></CardHeader>
            <CardContent className="p-6 text-left">
                <div className="space-y-4">
                    {lines.map((line, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="font-bold w-6 text-right text-muted-foreground">{i + 1}.</span>
                            <Input value={line} onChange={e => handleLineChange(i, e.target.value)} className={cn("flex-1 h-10 transition-all font-medium text-foreground", grades[i] === 'correct' ? 'border-green-500 bg-green-50/5' : grades[i] === 'blue' ? 'border-blue-500 bg-blue-50/5' : grades[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} readOnly={isSupervisionMode} />
                            <div className="flex gap-1 shrink-0">
                                <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-8 w-8 rounded-full", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'blue')} className={cn("h-8 w-8 rounded-full", grades[i] === 'blue' ? "bg-blue-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><Eye className="h-4 w-4"/></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-8 w-8 rounded-full", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 uppercase">Avanzar</Button></CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class10Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
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

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(personalityVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(personalityVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    
    const [verbAnswers, setVerbAnswers] = useState<Record<number, Record<string, string>>>({});
    const [verbValidation, setVerbValidation] = useState<Record<number, Record<string, 'correct' | 'incorrect' | 'unchecked'>>>({});

    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [isFinished, setIsFinished] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary_personality', name: '1. Vocabulary (Personality)', icon: User, status: 'active' },
        { key: 'complete_verbs', name: '2. Complete Verbs', icon: Pencil, status: 'locked' },
        { key: 'grammar_there_is_are', name: '3. Grammar (There is / are)', icon: GraduationCap, status: 'locked' },
        { key: 'exercise_1', name: '4. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'grammar_used_to', name: '6. Grammar (Used To)', icon: Clock, status: 'locked' },
        { key: 'exercise_3', name: '7. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'exercise_4', name: '8. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '9. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'create_1', name: '10. Create 1', icon: Pencil, status: 'locked' },
        { key: 'exercise_5', name: '11. Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'create_2', name: '12. Create 2', icon: Pencil, status: 'locked' },
        { key: 'exercise_6', name: '13. Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'create_3', name: '14. Create 3', icon: Pencil, status: 'locked' },
        { key: 'reading', name: '15. Reading', icon: BookText, status: 'locked' },
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
            let lastDone = true;
            for(let i=0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        }
        setLearningPath(path as Topic[]); setSelectedTopic(d.lastSelectedTopic || path.find(it => it.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.verbAnswers) setVerbAnswers(d.verbAnswers);
        if (d.readAns) setReadAns(d.readAns);
        setInitialLoadComplete(true);
        hasInitialized.current = true;
    }, [isInitialLoading, studentProfile, isAdmin, initialPathData, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || overrideStudentId || !hasInitialized.current || !user) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, verbAnswers, readAns };
            learningPath.forEach(t => s[t.key] = t.status);
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, overrideStudentId, vocabAnswers, verbAnswers, readAns, user, studentProfile, initialLoadComplete]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
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

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
        if (['grammar_there_is_are', 'grammar_used_to'].includes(key)) handleTopicComplete(key);
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = personalityVocab.map((v, i) => {
            const res = v.en === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) allOk = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (allOk) { toast({ title: "¡Perfecto!" }); setCanAdvanceVocab(true); }
        else toast({ variant: 'destructive', title: "Revisa las palabras" });
    };

    const handleCheckVerbs = () => {
        let allOk = true; const nv: any = {};
        irregularVerbsData.forEach((v, i) => {
            const row = verbAnswers[i] || {}; const rowVal: any = {};
            ['pres', 'past', 'part', 'es'].forEach(field => {
                const correctVal = (v as any)[field];
                if (!correctVal) { rowVal[field] = 'correct'; return; }
                if (v.fixed === field) { rowVal[field] = 'correct'; return; }
                const res = (row[field] || '').trim().toUpperCase() === correctVal.toUpperCase();
                rowVal[field] = res ? 'correct' : 'incorrect';
                if (!res) allOk = false;
            });
            nv[i] = rowVal;
        });
        setVerbValidation(nv);
        if (allOk) toast({ title: "¡Verbos Dominados!" });
        else toast({ variant: 'destructive', title: "Revisa la tabla de verbos" });
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingContent.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const ok = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = ok ? 'correct' : 'incorrect'; if (!ok) allOk = false;
        });
        setReadVal(nv); if (allOk) { setIsFinished(true); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary_personality':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-foreground uppercase'>Lexicon: Negative Personality Traits</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-4 text-foreground">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div>
                            {personalityVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm text-foreground">{v.es}</div>
                                    <Input value={vocabAnswers[i] || ''} onChange={e => { if (overrideStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} className={cn("uppercase transition-all text-foreground", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!overrideStudentId} />
                                </Fragment>
                            ))}
                        </div></CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary_personality')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'complete_verbs':
                const allVerbsOk = Object.keys(verbValidation).length === irregularVerbsData.length && Object.values(verbValidation).every(row => Object.values(row).every(v => v === 'correct'));
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-foreground uppercase'>Irregular Verbs Table Challenge</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className='bg-muted/50'>
                                        <TableHead className='font-bold text-foreground'>PRESENT</TableHead>
                                        <TableHead className='font-bold text-foreground'>PAST SIMPLE</TableHead>
                                        <TableHead className='font-bold text-foreground'>PAST PARTICIPLE</TableHead>
                                        <TableHead className='font-bold text-foreground'>SPANISH</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {irregularVerbsData.map((v, i) => (
                                        <TableRow key={i}>
                                            {['pres', 'past', 'part', 'es'].map(field => {
                                                const isFixed = v.fixed === field;
                                                return (
                                                    <TableCell key={field}>
                                                        {isFixed ? (
                                                            <div className="bg-muted/50 p-2 rounded text-xs font-black text-center text-primary uppercase">{(v as any)[field]}</div>
                                                        ) : (
                                                            <Input 
                                                                value={verbAnswers[i]?.[field] || ''} 
                                                                onChange={e => { if (overrideStudentId) return; setVerbAnswers({...verbAnswers, [i]: {...(verbAnswers[i] || {}), [field]: e.target.value}}); setVerbValidation({...verbValidation, [i]: {...(verbValidation[i] || {}), [field]: 'unchecked'}}); }} 
                                                                className={cn("h-8 text-[10px] uppercase font-mono text-foreground", verbValidation[i]?.[field] === 'correct' ? 'border-green-500 bg-green-50/10' : verbValidation[i]?.[field] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                                                readOnly={!!overrideStudentId} 
                                                                placeholder="..."
                                                            />
                                                        )}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleCheckVerbs} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('complete_verbs')} disabled={!allVerbsOk && !isAdmin} className='text-white font-bold'>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar_there_is_are':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase tracking-tight">GRAMMAR: THERE IS / THERE ARE</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm text-foreground">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4">Present (HAY)</h3>
                                    <p className="mb-2">THERE IS: <span className='text-primary'>SINGULAR</span> = HAY</p>
                                    <p className="mb-4">THERE ARE: <span className='text-primary'>PLURAL</span> = HAY</p>
                                    <div className='p-3 bg-muted rounded-lg font-mono text-sm'>Ex: There is a book / There are three apples.</div>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm text-foreground">
                                    <h3 className="text-xl font-black text-brand-purple uppercase mb-4">Past (HABIA / HUBO)</h3>
                                    <p className="mb-2">THERE WAS: <span className='text-brand-purple'>SINGULAR</span> = HABIA</p>
                                    <p className="mb-4">THERE WERE: <span className='text-brand-purple'>PLURAL</span> = HABIAN</p>
                                    <div className='p-3 bg-muted rounded-lg font-mono text-sm'>Ex: There was a mistake / There were many people.</div>
                                </div>
                            </div>
                            <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-[2rem] border-2 border-dashed border-yellow-500/50">
                                <h4 className="text-xl font-black text-yellow-700 dark:text-yellow-400 uppercase mb-2 flex items-center gap-2"><Info /> NOTA IMPORTANTE</h4>
                                <p className='text-foreground'>El <strong>THERE</strong> es la parte fija, mientras que conjugando el <strong>TO BE</strong> se obtendrán los diferentes tiempos gramaticales.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar_there_is_are')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={{"frente": "in front of", "gritando": "shouting", "barrio": "neighborhood"}} isSupervisionMode={!!overrideStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <TripleTranslationExercise title="Exercise 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={{"sobre": "on", "debajo": "under", "perdí": "lost"}} isSupervisionMode={!!overrideStudentId} isAdmin={isAdmin} />;
            case 'grammar_used_to':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase tracking-tight">GRAMMAR: USED TO (SOLÍA)</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold text-foreground">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">Concepto</h3>
                                <p className="text-lg leading-relaxed">Se usa para acciones habituales del pasado que ya NO se realizan más.</p>
                                <div className='p-4 bg-primary/10 rounded-xl border-l-4 border-primary mt-4'>AUXILIAR: <span className='text-2xl font-black text-primary'>DID</span></div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                <h4 className="text-primary font-black uppercase text-xs">Estructura:</h4>
                                <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-sm leading-relaxed">
                                    <p><span className="text-green-500 font-bold">(+)</span> Pronoun + USED TO + Verb + Complement</p>
                                    <p><span className="text-red-500 font-bold">(-)</span> Pronoun + DIDN'T + USE TO + Verb + Complement</p>
                                    <p><span className="text-blue-500 font-bold">(?)</span> DID + Pronoun + USE TO + Verb + Complement?</p>
                                    <Separator className='my-2'/>
                                    <p className='text-xs text-muted-foreground uppercase font-bold'>Short Answers:</p>
                                    <p>(+A) YES, PRONOUN + DID | (-A) NO, PRONOUN + DIDN'T</p>
                                </div>
                                <div className='mt-4 p-4 border rounded-xl bg-primary/5 italic'>
                                    <p>• I USED TO WALK TO UNIVERSITY</p>
                                    <p>• I DIDN’T USE TO WALK TO UNIVERSITY.</p>
                                    <p>• DID YOU USE TO WALK TO UNIVERSITY?</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar_used_to')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'exercise_3': return <TripleTranslationExercise title="Exercise 3: used to" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={{"caminaba": "used to walk", "era una niña": "was a girl"}} isSupervisionMode={!!overrideStudentId} isAdmin={isAdmin} />;
            case 'exercise_4': return <BallsExercise title="Exercise 4" prompts={ex4Prompts} onComplete={() => handleTopicComplete('exercise_4')} vocabulary={{"bailar": "dance", "exterior": "abroad", "conoce": "knows"}} isSupervisionMode={!!overrideStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={personalityVocab.slice(0, 12).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Personality Traits Memory" />;
            case 'create_1': return <ManualGradingExercise title="CREATE 1" description="WHAT DID YOU USE TO DO WHEN YOU WERE A CHILD? (6 SENTENCES)" onComplete={() => handleTopicComplete('create_1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="create1Lines" storageKeyGrades="create1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Grades} isSupervisionMode={!!overrideStudentId} />;
            case 'exercise_5': return <BallsExercise title="Exercise 5" prompts={ex5Prompts} onComplete={() => handleTopicComplete('exercise_5')} vocabulary={{"trabajó": "worked", "casa": "home", "noche": "night"}} isSupervisionMode={!!overrideStudentId} isAdmin={isAdmin} />;
            case 'create_2': return <ManualGradingExercise title="CREATE 2" description="WHAT DID YOU DO LAST WEEK? (6 SENTENCES)" onComplete={() => handleTopicComplete('create_2')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="create2Lines" storageKeyGrades="create2Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.create2Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create2Grades} isSupervisionMode={!!overrideStudentId} />;
            case 'exercise_6': return <BallsExercise title="Exercise 6" prompts={ex6Prompts} onComplete={() => handleTopicComplete('exercise_6')} vocabulary={{"solían": "used to", "colegio": "school"}} isSupervisionMode={!!overrideStudentId} isAdmin={isAdmin} />;
            case 'create_3': return <ManualGradingExercise title="CREATE 3" description="WHAT DID YOU USE TO DO WHEN YOU WERE AT HIGH SCHOOL?" onComplete={() => handleTopicComplete('create_3')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="create3Lines" storageKeyGrades="create3Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.create3Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create3Grades} isSupervisionMode={!!overrideStudentId} />;
            case 'reading':
                if (isFinished) return <Card className="shadow-soft border-2 border-green-500 bg-card/90 p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500 text-foreground"><Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" /><h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">Congratulations!</h2><p className="text-2xl mt-4 font-bold">Has terminado la Clase 10 (A2)</p><Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline"><Link href="/ingles/a2">Volver al Curso</Link></Button></Card>;
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-foreground'>{readingContent.title}</CardTitle></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner whitespace-pre-wrap text-foreground">{readingContent.text}</div>
                            <Separator /><div className="space-y-4">{readingContent.questions.map(q => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold text-primary'>{q.q}</Label>
                                <Input value={readAns[q.id] || ''} onChange={e => { if (overrideStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('mt-1 h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!overrideStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 gap-4">
                            {!overrideStudentId && <Button onClick={handleCheckReading} variant="secondary">Verificar</Button>}
                            <Button onClick={() => { setIsFinished(true); handleTopicComplete('reading'); }} disabled={!readingContent.questions.every(q => readVal[q.id] === 'correct') && !isAdmin} className="font-bold">Finish Class</Button>
                        </CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            <div className="md:col-span-9 md:order-1 order-2">
                {renderContent()}
            </div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Misión 10A
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav>
                            <ul className="space-y-1">
                                {learningPath.map((item) => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                    const isActive = item.status === 'active';
                                    return (
                                        <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                            className={cn(
                                                'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm',
                                                isActive && !isAdmin && "animate-pulse-glow"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.status === 'completed' ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />
                                                )}
                                                <span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span>
                                            </div>
                                            {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                        <div className="mt-6 pt-6 border-t text-foreground">
                            <div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground">
                                <span>Avance Clase</span>
                                <span className="text-primary font-bold">{progressValue}%</span>
                            </div>
                            <Progress value={progressValue} className="h-2 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
