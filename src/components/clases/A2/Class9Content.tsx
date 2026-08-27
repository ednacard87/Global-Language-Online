'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
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
    Activity,
    Star,
    Check,
    X,
    User,
    Clock,
    Info,
    ArrowLeft
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from 'next/link';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u2_c9_v31_final_stable';
const mainProgressKey = 'progress_a2_eng_unit_2_class_9';

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
    { es: "DIVERTIDO", en: "AMUSING" }, { es: "VALIENTE", en: "BRAVE" },
    { es: "DE MENTE ABIERTA", en: "OPEN MINDED" }, { es: "PRUDENTE", en: "PRUDENT" },
    { es: "ALEGRE", en: "CHEERFUL" }, { es: "DECIDIDO", en: "DETERMINED" },
    { es: "CREATIVO", en: "CREATIVE" }, { es: "FIEL", en: "FAITHFUL" },
    { es: "AMIGABLE", en: "FRIENDLY" }, { es: "AGRADECIDO", en: "GRATEFUL" },
    { es: "TOLERANTE", en: "TOLERANT" }, { es: "TRABAJADOR", en: "HARD WORKING" },
    { es: "HUMILDE", en: "HUMBLE" }, { es: "HONESTO", en: "HONEST" },
    { es: "AMABLE", en: "KIND" }, { es: "LEAL", en: "LOYAL" },
    { es: "EDUCADO", en: "POLITE" }, { es: "OBEDIENTE", en: "OBEDIENT" },
    { es: "CONFIABLE", en: "RELIABLE" }, { es: "HABLADOR", en: "TALKATIVE" },
    { es: "SABIO", en: "WISE" },
];

const ex1Prompts = [
    { 
        spanish: "JUGUE FUTBOL EL DOMINGO.", 
        answers: {
            pos: ["i played soccer on sunday", "i played football on sunday"],
            neg: ["i did not play soccer on sunday", "i didn't play soccer on sunday"],
            int: ["did i play soccer on sunday?", "did you play soccer on sunday?"]
        }
    },
    { 
        spanish: "ELLA APRENDIO INGLES EN 2 AÑOS.", 
        answers: {
            pos: ["she learned english in 2 years", "she learned english in two years"],
            neg: ["she did not learn english in 2 years", "she didn't learn english in 2 years"],
            int: ["did she learn english in 2 years?"]
        }
    },
    { 
        spanish: "EL NO COMPRO LOS TIQUETES AYER.", 
        answers: {
            pos: ["he bought the tickets yesterday"],
            neg: ["he did not buy the tickets yesterday", "he didn't buy the tickets yesterday"],
            int: ["did he buy the tickets yesterday?"]
        }
    }
];

const ex2Prompts = [
    { spanish: "ELLOS NO TRABAJAN HOY", answer: ["they do not work today", "they don't work today"] },
    { spanish: "ELLOS NO TRABAJARON AYER", answer: ["they did not work yesterday", "they didn't work yesterday"] },
    { spanish: "¿ELLA DUERME TODO EL DIA?", answer: ["does she sleep all day?"] },
    { spanish: "¿ELLA DURMIO TODO EL FINDE?", answer: ["did she sleep all weekend?"] },
];

const ex3Prompts = [
    { question: "DID SHE GO TO THE CONCERT?", answers: { pos: ["yes, she did"], neg: ["no, she did not", "no, she didn't"] } },
    { question: "DID THEY STUDY WITH YOU?", answers: { pos: ["yes, they did"], neg: ["no, they did not", "no, they didn't"] } },
];

const ex4Prompts = [
    { spanish: "ELLOS NO ESTUDIARON PARA HOY", answer: ["they did not study for today", "they didn't study for today"] },
    { spanish: "¿ELLA HIZO ESO?", answer: ["did she do that?"] },
    { spanish: "ELLOS NO SABIAN QUE HACER (QUE HACER: WHAT TO DO)", answer: ["they did not know what to do", "they didn't know what to do"] },
];

const ex5Prompts = [
    { spanish: "MY SISTER ____________________(NOT CLEAN) HER ROOM ON SATURDAY.", answer: ["did not clean", "didn't clean"] },
    { spanish: "LAST WEEK MY FAMILY __________________(BUY) A NEW TABLE FOR THE DINING ROOM.", answer: ["bought"] },
    { spanish: "YESTERDAY, I ______________________(LOSE) MY MATH’S BOOK.", answer: ["lost"] },
];

const ex6Prompts = [
    { question: "DID THEY ARRIVE WITH YOU?", answers: { pos: ["yes, they did"], neg: ["no, they did not", "no, they didn't"] } },
    { question: "DID YOU WATCH THE MOVIE?", answers: { pos: ["yes, i did"], neg: ["no, i did not", "no, i didn't"] } },
];

const readingData = {
    title: "Charly's Productive Day",
    content: "Yesterday was a very productive day for Charly. He woke up early and exercised for one hour. Then, he worked at his home office because he is a hard working man. At noon, he cooked a delicious lunch for his wife. She was very grateful. In the evening, they watched a movie together and played a board game. Charly didn't feel tired because he is a very cheerful person. It was a perfect day!",
    questions: [
        { id: 'q1', q: "Did Charly wake up late yesterday?", a: ["no, he did not", "no, he didn't", "no"] },
        { id: 'q2', q: "Why did he work at his home office?", a: ["because he is a hard working man", "hard working man"] },
        { id: 'q3', q: "What did he do at noon?", a: ["he cooked a delicious lunch", "cooked lunch"] },
        { id: 'q4', q: "How did his wife feel?", a: ["she was very grateful", "grateful"] },
        { id: 'q5', q: "Did Charly feel tired in the evening?", a: ["no, he did not", "no, he didn't", "no"] }
    ]
};

const finalWritingSpanish = "EL AÑO PASADO, MIS AMIGOS Y YO DECIDIMOS EXPLORAR UNA VIEJA CASA ABANDONADA. LLEGAMOS ALLÍ A LA MEDIANOCHE. YO ABRÍ LA PUERTA PESADA Y ENTRÁMOS SILENCIOSAMENTE. NOS SENTIMOS UN POCO ASUSTADOS, PERO TENÍAMOS CURIOSIDAD. DE REPENTE, ESCUCHAMOS UN RUIDO EXTRAÑO EN LA COCINA. ¡MI AMIGO PETER VIO UN GATO BLANCO! NOS REÍMOS Y LUEGO SALIMOS DE LA CASA. FUE UNA NOCHE INOLVIDABLE.";

const genericVocab = { "divertido": "amusing", "valiente": "brave", "alegre": "cheerful", "decidido": "determined", "fiel": "faithful", "humilde": "humble", "educado": "polite", "confiable": "reliable", "sabio": "wise", "enojado": "angry", "limpiar": "clean", "perder": "lose" };

// --- HELPERS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, type = 'translate', isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = currentPrompt.answer;
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
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{currentPrompt.spanish}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu respuesta..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct' && !isAdmin} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const TripleTranslationExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ pos: '', neg: '', int: '' });
    const [val, setVal] = useState<any>({ pos: 'unchecked', neg: 'unchecked', int: 'unchecked' });
    const [solved, setSolved] = useState<Record<number, boolean>>({});

    useEffect(() => { setAns({ pos: '', neg: '', int: '' }); setVal({ pos: 'unchecked', neg: 'unchecked', int: 'unchecked' }); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const fields = ['pos', 'neg', 'int'];
        const newVal = { ...val }; let allOk = true;
        fields.forEach((f, i) => {
            const user = ans[f as keyof typeof ans].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = currentPrompt.answers[f].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (f === 'int' && !ans.int.trim().endsWith('?')) { allOk = false; newVal.int = 'incorrect'; }
            else if (corrects.includes(user)) newVal[f] = 'correct'; else { allOk = false; newVal[f] = 'incorrect'; }
        });
        setVal(newVal);
        if (allOk) { toast({ title: "¡Misión cumplida!" }); setSolved(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus frases" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <div className="flex flex-row items-center justify-between">
                    <div className="w-full">
                        <CardTitle className="uppercase tracking-tight text-foreground dark:text-primary">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", solved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0 text-foreground">
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-bold text-right">{en}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-lg uppercase text-foreground">{currentPrompt.spanish}</div>
                <div className="space-y-4 font-mono text-base max-w-lg mx-auto">
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-green-500 text-foreground">(+)</Label><Input value={ans.pos} onChange={e => setAns(p => ({...p, pos: e.target.value}))} className={cn("flex-1 text-foreground", val.pos === 'correct' ? 'border-green-500 bg-green-50/10' : val.pos === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isSupervisionMode} /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-red-500 text-foreground">(-)</Label><Input value={ans.neg} onChange={e => setAns(p => ({...p, neg: e.target.value}))} className={cn("flex-1 text-foreground", val.neg === 'correct' ? 'border-green-500 bg-green-50/10' : val.neg === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isSupervisionMode} /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold uppercase text-center text-blue-500 text-foreground">(?)</Label><Input value={ans.int} onChange={e => setAns(p => ({...p, int: e.target.value}))} className={cn("flex-1 text-foreground", val.int === 'correct' ? 'border-green-500 bg-green-50/10' : val.int === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isSupervisionMode} /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!solved[currentIndex] && !isAdmin} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ShortAnswersExerciseInternal = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ pos: '', neg: '' });
    const [val, setVal] = useState<any>({ pos: 'unchecked', neg: 'unchecked' });
    const [solved, setSolved] = useState<Record<number, boolean>>({});

    useEffect(() => { setAns({ pos: '', neg: '' }); setVal({ pos: 'unchecked', neg: 'unchecked' }); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];

    const handleCheck = () => {
        if (isSupervisionMode) return;
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
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full">
                        <CardTitle className="uppercase tracking-tight text-foreground dark:text-primary">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", solved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0 text-foreground">
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-bold text-right">{en}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-lg uppercase text-foreground">{currentPrompt.question}</div>
                <div className="space-y-4 font-mono text-base max-w-lg mx-auto">
                    <div className="flex items-center gap-4"><Label className="w-16 font-bold text-green-500 text-center text-foreground">(+A)</Label><Input value={ans.pos} onChange={e => setAns(p => ({...p, pos: e.target.value}))} className={cn("flex-1 text-foreground", val.pos === 'correct' ? 'border-green-500 bg-green-50/10' : val.pos === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isSupervisionMode} /></div>
                    <div className="flex items-center gap-4"><Label className="w-16 font-bold text-red-500 text-center text-foreground">(-A)</Label><Input value={ans.neg} onChange={e => setAns(p => ({...p, neg: e.target.value}))} className={cn("flex-1 text-foreground", val.neg === 'correct' ? 'border-green-500 bg-green-50/10' : val.neg === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isSupervisionMode} /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!solved[currentIndex] && !isAdmin} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class9Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
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
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [transText, setTransText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulary (Personality)', icon: User, status: 'active' },
        { key: 'grammar', name: '2. Grammar (Past Simple)', icon: GraduationCap, status: 'locked' },
        { key: 'past_simple_regular', name: '3. Spelling & Pronunciation', icon: Clock, status: 'locked' },
        { key: 'exercise_1', name: '4. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise_3', name: '6. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'exercise_4', name: '7. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '8. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_5', name: '9. Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'exercise_6', name: '10. Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '11. Reading', icon: BookText, status: 'locked' },
        { key: 'final_exercise', name: '12. Final writing', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;
        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) { if (lastDone && (path[i] as any).status === 'locked') (path[i] as any).status = 'active'; lastDone = (path[i] as any).status === 'completed'; }
        }
        setLearningPath(path as Topic[]);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.readAns) setReadAns(d.readAns);
        if (d.transText) setTransText(d.transText);
        setInitialLoadComplete(true); hasInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, readAns, transText };
            learningPath.forEach(t => s[t.key] = t.status);
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, vocabAnswers, readAns, transText, initialLoadComplete]);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { 
            toast({ variant: "destructive", title: "Contenido Bloqueado" }); 
            return; 
        }
        setSelectedTopic(topicKey);
        if (['grammar', 'past_simple_regular'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = personalityVocab.map((v, i) => {
            const res = v.en.toUpperCase() === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) allOk = false; return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (allOk) { setCanAdvanceVocab(true); toast({ title: "¡Vocabulario completado!" }); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingData.questions.forEach((q) => {
            const res = q.a.some(a => (readAns[q.id] || '').trim().toLowerCase().includes(a.toLowerCase()));
            nv[q.id] = res ? 'correct' : 'incorrect'; if (!res) allOk = false;
        });
        setReadVal(nv); if (allOk) handleTopicComplete('reading');
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-foreground dark:text-primary uppercase tracking-tighter'>1. LEXICO: PERSONALIDAD</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div>
                                    {personalityVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm text-foreground">{v.es}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); setCanAdvanceVocab(false); }} className={cn("uppercase transition-all text-foreground", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">2. GRAMMAR: PAST SIMPLE</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm text-foreground">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">¿Qué es?</h3>
                                <p className="text-lg leading-relaxed text-foreground dark:text-white">El pasado simple se usa para un <strong>“evento determinado en el pasado”</strong>; se refiere a hechos que sucedieron en un momento concreto del pasado.</p>
                                <p className="mt-4 text-muted-foreground italic font-medium">Hay verbos regulares a los cuales se les añade “-ED” (WORK - WORKED) y otros irregulares (GO - WENT).</p>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground dark:text-white">
                                <h3 className="text-xl font-black text-primary uppercase">DID = AUXILIAR</h3>
                                <div className="font-mono bg-muted p-4 rounded-xl border space-y-2 text-base text-foreground">
                                    <p><span className="text-green-500 font-black mr-2">(+)</span> = PRONOUN + VERB: PAST + COMPLEMENT</p>
                                    <p><span className="text-red-500 font-black mr-2">(-)</span> = PRONOUN + DIDN'T + VERB: PRESENT + COMPLEMENT</p>
                                    <p><span className="text-blue-500 font-black mr-2">(?)</span> = DID + PRONOUN + VERB: PRESENT + COMPLEMENTO?</p>
                                    <Separator className='my-4'/>
                                    <p className='text-xs uppercase text-muted-foreground mb-1'>Short Answers:</p>
                                    <p className='text-green-600'>(+A) = YES, PRONOUN + DID</p>
                                    <p className='text-red-600'>(-A) = NO, PRONOUN + DIDN'T</p>
                                </div>
                            </div>
                            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-md">
                                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">NOTA: Recuerda que el “TO BE” no usa DID como auxiliar (WERE YOU AT HOME?).</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'past_simple_regular':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">3. RULES: REGULAR VERBS</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm text-foreground dark:text-white">
                                    <h4 className="font-black text-primary uppercase mb-2">1. Terminación en "Y"</h4>
                                    <p className='text-sm mb-1'>CONSONANTE + Y &rarr; IED (Study &rarr; Studied)</p>
                                    <p className='text-sm'>VOCAL + Y &rarr; ED (Play &rarr; Played)</p>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm text-foreground dark:text-white">
                                    <h4 className="font-black text-primary uppercase mb-2">2. Monosilábicos</h4>
                                    <p className='text-sm'>Vocal + Consonante &rarr; Duplican Consonante (STOP-STOPPED / SHOP-SHOPPED). Excepto Y o W.</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm text-foreground dark:text-white">
                                <h4 className="text-xl font-black text-brand-purple uppercase mb-4">PRONUNCIACIÓN DE "-ED"</h4>
                                <div className='grid md:grid-cols-3 gap-4 text-xs text-foreground'>
                                    <div className='p-3 border rounded bg-card'><p className='font-black text-primary'>'T' (Sordo)</p><p>Watched, Washed, Worked</p></div>
                                    <div className='p-3 border rounded bg-card'><p className='font-black text-primary'>'D' (Sonoro)</p><p>Lived, Arrived, Opened</p></div>
                                    <div className='p-3 border rounded bg-card'><p className='font-black text-primary'>'ID' (T o D)</p><p>Started, Painted, Needed</p></div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('past_simple_regular')} size="lg" className="px-16 font-bold h-12 uppercase">Continuar</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <TripleTranslationExercise title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={genericVocab} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <BallsExercise title="Exercise 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={genericVocab} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_3': return <ShortAnswersExerciseInternal title="Exercise 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_4': return <BallsExercise title="Exercise 4" prompts={ex4Prompts} onComplete={() => handleTopicComplete('exercise_4')} vocabulary={genericVocab} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={personalityVocab.slice(0, 12).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Personality Memory" />;
            case 'exercise_5': return <BallsExercise title="Exercise 5: Fill in the Gaps" prompts={ex5Prompts} onComplete={() => handleTopicComplete('exercise_5')} vocabulary={genericVocab} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_6': return <ShortAnswersExerciseInternal title="Exercise 6" prompts={ex6Prompts} onComplete={() => handleTopicComplete('exercise_6')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map(q => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold text-foreground'>{q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_exercise':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase'>Final Writing: The Secret of the Old House</CardTitle><CardDescription className='font-bold text-foreground'>Traduce esta historia al inglés para completar la clase.</CardDescription></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-base leading-relaxed shadow-sm text-foreground">{finalWritingSpanish}</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Write the story in English here..." className="min-h-[250px] text-lg leading-relaxed text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('final_exercise')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Terminar Misión <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            {isAdmin && targetStudentId && (
                <div className="col-span-12 mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                        <Star className="h-6 w-6 fill-current animate-pulse" />
                        <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                        <Link href="/admin">Cerrar</Link>
                    </Button>
                </div>
            )}
            
            <div className="md:col-span-9 md:order-1 order-2">
                {renderContent()}
            </div>

            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Misión 9A
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav>
                            <ul className="space-y-1">
                                {learningPath.map((item) => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_CONFIG[item.status] || BookOpen;
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
                                                <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-current">{item.name}</span>
                                            </div>
                                            {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                        <div className="mt-6 pt-6 border-t">
                            <div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground">
                                <span>Avance Clase</span>
                                <span className="text-primary">{progressValue}%</span>
                            </div>
                            <Progress value={progressValue} className="h-2 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
