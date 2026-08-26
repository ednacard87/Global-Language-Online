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
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    BookText,
    Mic,
    HelpCircle,
    Pencil,
    Activity,
    Star,
    Check,
    X,
    Clock,
    Info,
    ListChecks,
    Eye,
    MessageSquare,
    ChevronDown,
    ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u2_c8_v601_fix_ref';
const mainProgressKey = 'progress_a2_eng_unit_2_class_8';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const irregularVerbsFull = [
    { es: "DESPERTAR", present: "WAKE UP", past: "WOKE UP", participle: "WOKEN UP" },
    { es: "VOLVERSE", present: "BECOME", past: "BECAME", participle: "BECOME" },
    { es: "ROMPER", present: "BREAK", past: "BROKE", participle: "BROKEN" },
    { es: "CONSTRUIR", present: "BUILD", past: "BUILT", participle: "BUILT" },
    { es: "CORTAR", present: "CUT", past: "CUT", participle: "CUT" },
    { es: "CAER", present: "FALL", past: "FELL", participle: "FALLEN" },
    { es: "SENTIR", present: "FEEL", past: "FELT", participle: "FELT" },
    { es: "LUCHAR", present: "FIGHT", past: "FOUGHT", participle: "FOUGHT" },
    { es: "PARTIR-IRSE", present: "LEAVE", past: "LEFT", participle: "LEFT" },
    { es: "PERDER", present: "LOSE", past: "LOST", participle: "LOST" },
    { es: "HACER", present: "MAKE", past: "MADE", participle: "MADE" },
    { es: "ENCONTRAR", present: "MEET", past: "MET", participle: "MET" },
    { es: "MONTAR", present: "RIDE", past: "RODE", participle: "RIDDEN" },
    { es: "VENDER", present: "SELL", past: "SOLD", participle: "SOLD" },
    { es: "HABLAR", present: "SPEAK", past: "SPOKE", participle: "SPOKEN" },
    { es: "DELETREAR", present: "SPELL", past: "SPELT", participle: "SPELT" },
    { es: "GASTAR", present: "SPEND", past: "SPENT", participle: "SPENT" },
    { es: "NADAR", present: "SWIM", past: "SWAM", participle: "SWUM" },
    { es: "DECIR", present: "TELL", past: "TOLD", participle: "TOLD" },
    { es: "LANZAR", present: "THROW", past: "THREW", participle: "THROWN" },
    { es: "ENTENDER", present: "UNDERSTAND", past: "UNDERSTOOD", participle: "UNDERSTOOD" },
    { es: "VESTIR", present: "WEAR", past: "WORE", participle: "WORN" },
    { es: "GANAR", present: "WIN", past: "WON", participle: "WON" },
    { es: "ESCRIBIR", present: "WRITE", past: "WROTE", participle: "WRITTEN" },
];

const compVerbsGridData = [
    { present: "BECOME", past: "BECAME", participle: "BECOME", spanish: "VOLVERSE / LLEGAR A SER", fixed: [true, false, false, false] },
    { present: "BREAK", past: "BROKE", participle: "BROKEN", spanish: "ROMPER", fixed: [false, true, false, false] },
    { present: "BUILD", past: "BUILT", participle: "BUILT", spanish: "CONSTRUIR", fixed: [false, true, false, false] },
    { present: "FALL", past: "FELL", participle: "FALLEN", spanish: "CAER", fixed: [false, false, true, false] },
    { present: "FEEL", past: "FELT", participle: "FELT", spanish: "SENTIR", fixed: [true, false, false, false] },
    { present: "LEAVE", past: "LEFT", participle: "LEFT", spanish: "PARTIR / IRSE", fixed: [false, true, false, false] },
    { present: "LOSE", past: "LOST", participle: "LOST", spanish: "PERDER", fixed: [false, false, true, false] },
    { present: "MAKE", past: "MADE", participle: "MADE", spanish: "HACER", fixed: [false, false, true, false] },
    { present: "MEET", past: "MET", participle: "MET", spanish: "ENCONTRAR / CONOCER", fixed: [true, false, false, false] },
    { present: "RIDE", past: "RODE", participle: "RIDDEN", spanish: "MONTAR", fixed: [false, true, false, false] },
    { present: "SELL", past: "SOLD", participle: "SOLD", spanish: "VENDER", fixed: [true, false, false, false] },
    { present: "SPEAK", past: "SPOKE", participle: "SPOKEN", spanish: "HABLAR", fixed: [false, false, true, false] },
    { present: "SPEND", past: "SPENT", participle: "SPENT", spanish: "GASTAR", fixed: [true, false, false, false] },
    { present: "SWIM", past: "SWAM", participle: "SWUM", spanish: "NADAR", fixed: [false, true, false, false] },
    { present: "TELL", past: "TOLD", participle: "TOLD", spanish: "DECIR / CONTAR", fixed: [false, false, true, false] },
    { present: "WIN", past: "WON", participle: "WON", spanish: "GANAR", fixed: [false, true, false, false] },
    { present: "WRITE", past: "WROTE", participle: "WRITTEN", spanish: "ESCRIBIR", fixed: [false, false, true, false] },
];

const ex1TableData = [
    { presCont: "SHE IS WORKING AT THE HOSPITAL", presSimple: "SHE WORKS IN THAT COMPANY", pastSimple: "SHE WORKED IN THAT SCHOOL", fixed: [true, true, true] },
    { presCont: "THEY ARE NOT DOING THE HOMEWORK", presSimple: "THEY DON'T DO THE HOMEWORK", pastSimple: "THEY DID NOT DO THE HOMEWORK", fixed: [false, true, false] },
    { presCont: "WE ARE STUDYING ENGLISH", presSimple: "WE STUDY ENGLISH", pastSimple: "WE STUDIED ENGLISH", fixed: [true, false, false] },
    { presCont: "HE IS NOT GOING TO THE CHURCH", presSimple: "HE DOES NOT GO TO THE CHURCH", pastSimple: "HE DIDN'T GO TO THE CHURCH", fixed: [false, false, true] },
    { presCont: "SHE IS NOT TEACHING GERMAN", presSimple: "SHE DOESN'T TEACH GERMAN", pastSimple: "SHE DIDN'T TEACH GERMAN", fixed: [false, true, false] },
    { presCont: "ARE THEY SLEEPING?", presSimple: "DO THEY SLEEP?", pastSimple: "DID THEY SLEEP?", fixed: [true, false, false] },
    { presCont: "HE IS NOT WORKING ON WEEKEND", presSimple: "HE DOES NOT WORK ON WEEKEND", pastSimple: "HE DIDN'T WORK ON WEEKEND", fixed: [false, false, true] },
    { presCont: "IS SHE PLAYING TENNIS?", presSimple: "DOES SHE PLAY TENNIS?", pastSimple: "DID SHE PLAY TENNIS?", fixed: [false, true, false] },
    { presCont: "IS HE DRIVING A TRUCK?", presSimple: "DOES HE DRIVE A TRUCK?", pastSimple: "DID HE DRIVE A TRUCK?", fixed: [true, false, false] },
    { presCont: "THEY ARE NOT READING HIS BOOK", presSimple: "THEY DON'T READ HIS BOOK", pastSimple: "THEY DIDN'T READ HIS BOOK", fixed: [false, true, false] },
    { presCont: "WE ARE EATING ORANGES ON THE FARM", presSimple: "WE EAT ORANGES ON THE FARM", pastSimple: "WE ATE ORANGES ON THE FARM YESTERDAY", fixed: [false, false, true] },
    { presCont: "ARE YOU GOING TO LONDON?", presSimple: "DO YOU GO TO LONDON?", pastSimple: "DID YOU GO TO LONDON?", fixed: [true, false, false] },
    { presCont: "SHE IS NOT DOING THAT PROJECT", presSimple: "SHE DOESN'T DO THAT PROJECT", pastSimple: "SHE DIDN'T DO THAT PROJECT", fixed: [false, true, false] },
];

const ex2Prompts = [
    { spanish: "¿ESTUDIAS INGLES?", answer: ["did you study english?"] },
    { spanish: "¿ESTUDIASTE INGLES EN ESE INSTITUTO?", answer: ["did you study english in that institute?"] },
    { spanish: "ELLOS NO VIAJAN A INGLATERRA", answer: ["they do not travel to england", "they don't travel to england"] },
    { spanish: "ELLOS NO VIAJARON ALEMANIA", answer: ["they did not travel to germany", "they didn't travel to germany"] },
];

const questionsDict2Data = [
    { id: 'q1', q: "WAS BILLY HUNGRY?", answers: ["yes, he was"] },
    { id: 'q2', q: "WHAT DID HE WANT TO EAT?", answers: ["he wanted to eat a pizza", "he wanted to eat pizza"] },
    { id: 'q3', q: "WHAT KIND OF TOPPINGS DID HE WANT?", answers: ["he wanted three toppings", "three toppings"] },
    { id: 'q4', q: "HOW MUCH WAS THE PIZZA?", answers: ["it was $ 16", "sixteen dollars"] },
    { id: 'q5', q: "WHAT WERE THEY DOING WHILE THEY WERE EATING PIZZA?", answers: ["they were watching the yankees", "watching a baseball game"] },
    { id: 'q6', q: "WERE THEY YANKEES FANS?", answers: ["yes, they were"] },
];

const trueFalseDict2Data = [
    { id: 0, text: "BILLY WANTED TO ORDER A PIZZA.", answer: "T" },
    { id: 1, text: "HIS DAD DIDN’T WANT TO EAT PIZZA.", answer: "F" },
    { id: 2, text: "BILLY WANTED A LARGE PIZZA WITH THREE TOPPINGS.", answer: "T" },
    { id: 3, text: "THE PIZZA MAN ARRIVED 30 MINUTES LATER.", answer: "T" },
    { id: 4, text: "DAD GAVE THE MAN $ 16 AND A TIP.", answer: "T" },
    { id: 5, text: "BILLY AND HIS FATHER ATE THE PIZZA IN THE KITCHEN.", answer: "F" }
];

const matchingDict2Data = [
    { id: 1, left: "1. BILLY WAS HUNGRY AND….", right: "B- WANTED TO EAT PIZZA.", key: "B" },
    { id: 2, left: "2. HIS DAD ORDERED….", right: "D- PIZZA WITH FOUR TOPPINGS.", key: "D" },
    { id: 3, left: "3. THE PIZZA COSTS….", right: "A- $16 AND DAD ALSO GAVE THE MAN A TIP.", key: "A" },
    { id: 4, left: "4. THEY TOOK THE PIZZA…", right: "E- TO THE LIVING ROOM.", key: "E" },
    { id: 5, left: "5. THEY WATCHED….", right: "F- A BASEBALL GAME ON TV.", key: "F" },
    { id: 6, left: "6. THEY WANTED THE YANKEES…", right: "C- TO LOSE THE GAME.", key: "C" },
];

const ex3TableData = [
    { presCont: "THE CHILDREN ARE PLAYING OUTSIDE", presSimple: "THE CHILDREN PLAY OUTSIDE EVERY DAY", pastSimple: "THE CHILDREN PLAYED OUTSIDE YESTERDAY", fixed: [true, false, false] },
    { presCont: "I AM COOKING DINNER", presSimple: "I COOK DINNER ON SUNDAYS", pastSimple: "I COOKED DINNER LAST NIGHT", fixed: [false, true, false] },
    { presCont: "SHE IS WRITING A STORY", presSimple: "SHE WRITES STORIES EVERY WEEK", pastSimple: "SHE WROTE A STORY TWO DAYS AGO", fixed: [false, false, true] },
    { presCont: "WE ARE TRAVELING TO EUROPE", presSimple: "WE TRAVEL TO EUROPE EVERY YEAR", pastSimple: "WE TRAVELED TO EUROPE LAST SUMMER", fixed: [true, false, false] },
];

const readingText = {
    title: "A Lucky Decision",
    content: "Last week, Paul became very interested in a new job. He felt he needed a change in his life. He decided to leave his old company and meet some new people. Yesterday, while he was walking to an interview, it started to rain. He didn't have a jacket or an umbrella. He thought: 'I will be late and I will look messy'. However, he found a small shop and bought a cheap umbrella. He arrived on time and got the job. He was so happy!",
    questions: [
        { id: 'r1', q: "What did Paul become interested in?", a: ["a new job"] },
        { id: 'r2', q: "Why did he want to change?", a: ["he felt he needed a change"] },
        { id: 'r3', q: "What happened while he was walking to the interview?", a: ["it started to rain", "it rained"] },
        { id: 'r4', q: "Did he get the job?", a: ["yes, he did", "yes"] }
    ]
};

const paulStorySpanish = `PAUL QUERIA SALIR CON SUS AMIGOS Y COMER UN HELADO AYER, PERO SU MADRE LO LLAMÓ PORQUE ESTABA EN PROBLEMAS, DEBIDO A QUE NO PODIA ABRIR LA PUERTA DE SU CASA PORQUE DEJÓ LAS LLAVES ADENTRO. ENTONCES PAUL TUVO QUE REGRESAR A CASA. 
ÉL ESTABA MUY ENOJADO CON SU MAMÁ PORQUE PERDIÓ TODA LA TARDE Y NO PUDO VER SUS AMIGOS.
SIN EMBARGO PAUL Y SU MADRE ORDENARON PIZZA Y VIERON UNA PELICULA JUNTOS.
AL DIA SIGUIENTE SUS AMIGOS LO LLAMARON Y LE DIJERON QUE TUVIERON UN ACCIDENTE, EL LOS VISITO EN EL HOSPITAL Y SE DIO CUENTA QUE TUVO MUCHA SUERTE.
LUEGO REGRESO A CASA Y EL HABLO CON SU MAMA SOBRE LA SITUACION, ÉL LA BESO Y LA ABRAZO POR EVITAR ESE ACCIDENTE.
EL SIEMPRE RECUERDA ESTA SITUACION Y LE DICE A SUS AMIGOS CUANDO SU MADRE SALVÓ SU VIDA.`;

// --- HELPERS ---

const DictationPanel = ({ title, description, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades, isSupervisionMode }: any) => {
    const [lines, setLines] = useState<string[]>(Array(31).fill(''));
    const [grades, setGrades] = useState<Record<number, string>>(initialGrades || {});

    useEffect(() => {
        if (initialLines && Array.isArray(initialLines)) {
            const nl = [...Array(31).fill('')];
            initialLines.forEach((val, i) => { if (i < 31) nl[i] = val || ''; });
            setLines(nl);
        }
    }, [initialLines]);

    const handleLineChange = (idx: number, val: string) => {
        if (isSupervisionMode) return;
        const nl = [...lines]; nl[idx] = val; setLines(nl);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: nl });
    };

    const setLineColor = (idx: number, color: string) => {
        if (!isAdmin) return;
        const ng = { ...grades }; ng[idx] = color; setGrades(ng);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: ng });
    };

    return (
        <div className="space-y-6 text-left">
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2 border-primary/20 bg-card/50 text-foreground">
                    <CardHeader className="py-3 bg-primary/10 border-b"><CardTitle className="text-sm font-black uppercase">Punctuation Marks</CardTitle></CardHeader>
                    <CardContent className="p-4 text-xs font-mono grid grid-cols-2 gap-x-4 gap-y-1">
                        <p>. PERIOD</p><p>, COMMA</p>
                        <p>() PARENTHESES</p><p>- DASH</p>
                        <p>" " QUOTATION</p><p>: COLON</p>
                        <p>! EXCLAMATION</p><p>? QUESTION</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-brand-purple/20 bg-card/50 text-foreground">
                    <CardHeader className="py-3 bg-brand-purple/10 border-b"><CardTitle className="text-sm font-black uppercase">Questions</CardTitle></CardHeader>
                    <CardContent className="p-4 text-[10px] space-y-1 italic">
                        <p>1. Can you repeat slowly, please?</p>
                        <p>2. Can you repeat it again, please?</p>
                        <p>3. How do you say in Spanish/English...?</p>
                        <p className="font-bold text-brand-purple">Exp: Hold on (Espera un momento)</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                <CardHeader className='bg-primary/5 border-b'>
                    <div className='flex items-center gap-3'>
                        <Mic className='h-6 w-6 text-primary'/>
                        <CardTitle>{title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-4">
                            {lines.map((line, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="font-bold w-12 text-right text-muted-foreground">{i === 0 ? 'TITLE' : i}.</span>
                                    <Input 
                                        value={line || ''} 
                                        onChange={e => handleLineChange(i, e.target.value)} 
                                        className={cn(
                                            "flex-1 h-10 transition-all font-medium text-foreground",
                                            grades[i] === 'green' ? 'border-green-500 bg-green-50/10' : 
                                            grades[i] === 'blue' ? 'border-blue-500 bg-blue-50/10' : 
                                            grades[i] === 'red' ? 'border-red-500 bg-red-50/10' : ''
                                        )} 
                                        readOnly={isSupervisionMode}
                                        placeholder={i === 0 ? "Escribe el título aquí..." : "Escribe la frase..."}
                                    />
                                    {isAdmin && (
                                        <div className="flex gap-1 shrink-0">
                                            <button onClick={() => setLineColor(i, 'green')} className="w-6 h-6 rounded-full bg-green-500 hover:scale-110 transition-transform" />
                                            <button onClick={() => setLineColor(i, 'blue')} className="w-6 h-6 rounded-full bg-blue-500 hover:scale-110 transition-transform" />
                                            <button onClick={() => setLineColor(i, 'red')} className="w-6 h-6 rounded-full bg-red-500 hover:scale-110 transition-transform" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="justify-center border-t pt-6"><Button onClick={onComplete} size="lg" className="px-16 font-bold h-14">Avanzar <ArrowRight className="ml-2 h-6 w-6" /></Button></CardFooter>
            </Card>
        </div>
    );
};

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
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
                <Input value={answer || ''} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu traducción..." autoComplete="off" readOnly={isSupervisionMode} />
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

// --- MAIN CLASS COMPONENT ---

export default function Class8Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
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

    // States for controlled inputs
    const [vocabAnswers, setVocabAnswers] = useState<Record<number, any>>({});
    const [vocabVal, setVocabVal] = useState<Record<number, any>>({});
    const [ex1TableAns, setEx1TableAns] = useState<Record<number, any>>({});
    const [ex1Validation, setEx1Validation] = useState<Record<number, any>>({});
    const [compVerbsAns, setCompVerbsAns] = useState<Record<number, any>>({});
    const [compVerbsVal, setCompVerbsVal] = useState<Record<number, any>>({});
    const [ex3TableAns, setEx3TableAns] = useState<Record<number, any>>({});
    const [ex3Validation, setEx3Validation] = useState<Record<number, any>>({});
    const [qDict2Ans, setQDict2Ans] = useState<Record<string, string>>({});
    const [qDict2Val, setQDict2Val] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [tfDict2, setTfDict2] = useState<Record<number, string>>({});
    const [tfDict2Val, setTfDict2Val] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [matchDict2, setMatchDict2] = useState<Record<number, string>>({});
    const [matchDict2Val, setMatchDict2Val] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [writingTrans, setWritingTrans] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary_irregular', name: '1. Vocabulary (Irregular Verbs)', icon: BookOpen, status: 'active' },
        { key: 'dictation_1', name: '2. Dictation 1', icon: Mic, status: 'locked' },
        { key: 'exercise_1', name: '3. Exercise 1 (Table)', icon: ListChecks, status: 'locked' },
        { key: 'exercise_2', name: '4. Exercise 2 (Pres-Past)', icon: PenSquare, status: 'locked' },
        { key: 'dictation_2', name: '5. Dictation 2', icon: Mic, status: 'locked' },
        { key: 'questions_dict2', name: '6. Questions Dict2', icon: HelpCircle, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'complete_verbs', name: '8. Complete Verbs', icon: Pencil, status: 'locked' },
        { key: 'exercise_3', name: '9. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '10. Reading', icon: BookText, status: 'locked' },
        { key: 'writing', name: '11. Writing (Paul)', icon: Pencil, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;
        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile?.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) { if (lastDone && (path[i] as any).status === 'locked') (path[i] as any).status = 'active'; lastDone = (path[i] as any).status === 'completed'; }
        }
        setLearningPath(path as Topic[]); setSelectedTopic(d.lastSelectedTopic || path.find(it => it.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.ex1TableAns) setEx1TableAns(d.ex1TableAns);
        if (d.compVerbsAns) setCompVerbsAns(d.compVerbsAns);
        if (d.ex3TableAns) setEx3TableAns(d.ex3TableAns);
        if (d.qDict2Ans) setQDict2Ans(d.qDict2Ans);
        if (d.tfDict2) setTfDict2(d.tfDict2);
        if (d.matchDict2) setMatchDict2(d.matchDict2);
        if (d.readAns) setReadAns(d.readAns);
        if (d.writingTrans) setWritingTrans(d.writingTrans);
        
        setInitialLoadComplete(true); setIsInitialLoading(false);
        hasInitialized.current = true;
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId || !user) return;
        const saveTimer = setTimeout(() => {
            const s: any = { 
                lastSelectedTopic: selectedTopic, 
                vocabAnswers, ex1TableAns, compVerbsAns, ex3TableAns, qDict2Ans, tfDict2, matchDict2, readAns, writingTrans
            };
            learningPath.forEach(t => s[t.key] = t.status);
            if (JSON.stringify(s) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
                updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
            }
        }, 2000);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAnswers, ex1TableAns, compVerbsAns, ex3TableAns, qDict2Ans, tfDict2, matchDict2, readAns, writingTrans, user, studentProfile]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { np[i + 1].status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión completada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
    };

    const handleCheckVocab = () => {
        let allOk = true; const nv: any = {};
        irregularVerbsFull.forEach((v, i) => {
            const userAns = vocabAnswers[i] || { present: '', past: '', participle: '' };
            const pOk = userAns.present?.trim().toUpperCase() === v.present.toUpperCase();
            const paOk = userAns.past?.trim().toUpperCase() === v.past.toUpperCase();
            const prOk = userAns.participle?.trim().toUpperCase() === v.participle.toUpperCase();
            nv[i] = { present: pOk ? 'correct' : 'incorrect', past: paOk ? 'correct' : 'incorrect', participle: prOk ? 'correct' : 'incorrect' };
            if (!pOk || !paOk || !prOk) allOk = false;
        });
        setVocabVal(nv);
        if (allOk) toast({ title: "¡Vocabulario Completo!" });
        else toast({ variant: 'destructive', title: "Revisa las palabras en rojo" });
    };

    const handleCheckEx1 = () => {
        let allOk = true; const nv: any = {};
        ex1TableData.forEach((row, i) => {
            const userAns = ex1TableAns[i] || { cont: '', simple: '', past: '' };
            const cOk = row.fixed[0] || userAns.cont?.trim().toUpperCase() === row.presCont.toUpperCase();
            const sOk = row.fixed[1] || userAns.simple?.trim().toUpperCase() === row.presSimple.toUpperCase();
            const pOk = row.fixed[2] || userAns.past?.trim().toUpperCase() === row.pastSimple.toUpperCase();
            nv[i] = { cont: cOk ? 'correct' : 'incorrect', simple: sOk ? 'correct' : 'incorrect', past: pOk ? 'correct' : 'incorrect' };
            if (!cOk || !sOk || !pOk) allOk = false;
        });
        setEx1Validation(nv);
        if (allOk) toast({ title: "¡Tabla Correcta!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleCheckQDict2 = () => {
        let allOk = true; const nvQ: any = {}; const nvTF: any = {}; const nvM: any = {};
        questionsDict2Data.forEach(q => {
            const ok = q.answers.some(a => (qDict2Ans[q.id] || '').trim().toLowerCase().includes(a.toLowerCase()));
            nvQ[q.id] = ok ? 'correct' : 'incorrect'; if (!ok) allOk = false;
        });
        trueFalseDict2Data.forEach(tf => {
            const ok = tfDict2[tf.id] === tf.answer;
            nvTF[tf.id] = ok ? 'correct' : 'incorrect'; if (!ok) allOk = false;
        });
        matchingDict2Data.forEach(m => {
            const ok = (matchDict2[m.id] || '').trim().toUpperCase() === m.key;
            nvM[m.id] = ok ? 'correct' : 'incorrect'; if (!ok) allOk = false;
        });
        setQDict2Val(nvQ); setTfDict2Val(nvTF); setMatchDict2Val(nvM);
        if (allOk) toast({ title: "¡Excelente comprensión!" });
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingText.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const ok = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = ok ? 'correct' : 'incorrect'; if (!ok) allOk = false;
        });
        setReadVal(nv);
        if (allOk) toast({ title: "¡Lectura superada!" });
        else toast({ variant: 'destructive', title: "Revisa las respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary_irregular':
                const vocabAllOk = irregularVerbsFull.every((_, i) => vocabVal[i]?.present === 'correct' && vocabVal[i]?.past === 'correct' && vocabVal[i]?.participle === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>LEXICO: VERBOS IRREGULARES</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader className='bg-muted/50'><TableRow>
                                    <TableHead className='font-black'>SPANISH</TableHead><TableHead className='font-black'>PRESENT</TableHead><TableHead className='font-black'>PAST</TableHead><TableHead className='font-black'>PARTICIPLE</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>{irregularVerbsFull.map((v, i) => (<TableRow key={i}>
                                    <TableCell className="font-bold text-xs">{v.es}</TableCell>
                                    <TableCell><Input value={vocabAnswers[i]?.present || ''} onChange={e => !targetStudentId && setVocabAnswers({...vocabAnswers, [i]: {...(vocabAnswers[i]||{}), present: e.target.value}})} className={cn("h-8 uppercase", vocabVal[i]?.present === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i]?.present === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={!!targetStudentId} autoComplete="off"/></TableCell>
                                    <TableCell><Input value={vocabAnswers[i]?.past || ''} onChange={e => !targetStudentId && setVocabAnswers({...vocabAnswers, [i]: {...(vocabAnswers[i]||{}), past: e.target.value}})} className={cn("h-8 uppercase", vocabVal[i]?.past === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i]?.past === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={!!targetStudentId} autoComplete="off"/></TableCell>
                                    <TableCell><Input value={vocabAnswers[i]?.participle || ''} onChange={e => !targetStudentId && setVocabAnswers({...vocabAnswers, [i]: {...(vocabAnswers[i]||{}), participle: e.target.value}})} className={cn("h-8 uppercase", vocabVal[i]?.participle === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i]?.participle === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={!!targetStudentId} autoComplete="off"/></TableCell>
                                </TableRow>))}</TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary_irregular')} disabled={!vocabAllOk && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'dictation_1': return <DictationPanel title="DICTATION 1" description="Escucha a tu profesor y escribe las frases." onComplete={() => handleTopicComplete('dictation_1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dict1Lines" storageKeyGrades="dict1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Grades} isSupervisionMode={!!targetStudentId} />;
            case 'exercise_1':
                const ex1AllOk = ex1TableData.every((_, i) => ex1Validation[i]?.cont === 'correct' && ex1Validation[i]?.simple === 'correct' && ex1Validation[i]?.past === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>EXERCISE 1: TRANSFORMACIÓN DE TIEMPOS</CardTitle><CardDescription>Completa la tabla poniendo las frases en los diferentes tiempos como en el ejemplo.</CardDescription></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader className='bg-muted/50'><TableRow>
                                    <TableHead className='font-black'>PRESENT CONTINUOUS</TableHead><TableHead className='font-black'>PRESENT SIMPLE</TableHead><TableHead className='font-black'>PAST SIMPLE</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>{ex1TableData.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Input value={row.fixed[0] ? row.presCont : (ex1TableAns[i]?.cont || '')} onChange={e => !targetStudentId && setEx1TableAns({...ex1TableAns, [i]: {...(ex1TableAns[i]||{}), cont: e.target.value}})} className={cn("h-10 uppercase", row.fixed[0] ? "bg-muted" : (ex1Validation[i]?.cont === 'correct' ? "border-green-500 bg-green-50/10" : ex1Validation[i]?.cont === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[0] || !!targetStudentId} /></TableCell>
                                        <TableCell><Input value={row.fixed[1] ? row.presSimple : (ex1TableAns[i]?.simple || '')} onChange={e => !targetStudentId && setEx1TableAns({...ex1TableAns, [i]: {...(ex1TableAns[i]||{}), simple: e.target.value}})} className={cn("h-10 uppercase", row.fixed[1] ? "bg-muted" : (ex1Validation[i]?.simple === 'correct' ? "border-green-500 bg-green-50/10" : ex1Validation[i]?.simple === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[1] || !!targetStudentId} /></TableCell>
                                        <TableCell><Input value={row.fixed[2] ? row.pastSimple : (ex1TableAns[i]?.past || '')} onChange={e => !targetStudentId && setEx1TableAns({...ex1TableAns, [i]: {...(ex1TableAns[i]||{}), past: e.target.value}})} className={cn("h-10 uppercase", row.fixed[2] ? "bg-muted" : (ex1Validation[i]?.past === 'correct' ? "border-green-500 bg-green-50/10" : ex1Validation[i]?.past === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[2] || !!targetStudentId} /></TableCell>
                                    </TableRow>
                                ))}</TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckEx1} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('exercise_1')} disabled={!ex1AllOk && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'exercise_2': return <BallsExercise title="Exercise 2: Pres to Past" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={{"instituto": "institute", "Alemania": "Germany"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'dictation_2': return <DictationPanel title="DICTATION 2" description="Escucha el segundo dictado del profesor." onComplete={() => handleTopicComplete('dictation_2')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dict2Lines" storageKeyGrades="dict2Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict2Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict2Grades} isSupervisionMode={!!targetStudentId} />;
            case 'questions_dict2':
                const qDict2AllOk = questionsDict2Data.every(q => qDict2Val[q.id] === 'correct') && 
                                   trueFalseDict2Data.every(tf => tfDict2Val[tf.id] === 'correct') && 
                                   matchingDict2Data.every(m => matchDict2Val[m.id] === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className="uppercase tracking-tighter">Questions Dictation 2</CardTitle></CardHeader>
                        <CardContent className="space-y-8">
                            <div className='space-y-4'><h3 className='font-black text-primary border-b pb-1'>TRUE OR FALSE?</h3>
                                {trueFalseDict2Data.map((tf) => (<div key={tf.id} className='flex items-center gap-4'><div className='flex gap-2'><Button variant={tfDict2[tf.id] === 'T' ? 'default' : 'outline'} size="sm" onClick={() => !targetStudentId && setTfDict2({...tfDict2, [tf.id]: 'T'})} className={cn(tfDict2Val[tf.id] === 'correct' && tf.answer === 'T' ? "bg-green-500" : tfDict2Val[tf.id] === 'incorrect' && tfDict2[tf.id] === 'T' ? "bg-red-500" : "")}>T</Button><Button variant={tfDict2[tf.id] === 'F' ? 'destructive' : 'outline'} size="sm" onClick={() => !targetStudentId && setTfDict2({...tfDict2, [tf.id]: 'F'})} className={cn(tfDict2Val[tf.id] === 'correct' && tf.answer === 'F' ? "bg-green-500" : tfDict2Val[tf.id] === 'incorrect' && tfDict2[tf.id] === 'F' ? "bg-red-500" : "")}>F</Button></div><span className='text-sm font-medium'>{tf.id+1}. {tf.text}</span></div>))}
                            </div>
                            <Separator />
                            <div className='space-y-4'>
                                <h3 className='font-black text-primary border-b pb-1'>MATCH THE TWO PARTS OF THESE SENTENCES</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        {matchingDict2Data.map(m => (
                                            <div key={m.id} className="flex items-center gap-3 p-2 border rounded-lg bg-muted/20">
                                                <span className="text-sm font-bold flex-1">{m.left}</span>
                                                <Input 
                                                    value={matchDict2[m.id] || ''} 
                                                    onChange={e => !targetStudentId && setMatchDict2({...matchDict2, [m.id]: e.target.value.toUpperCase()})}
                                                    className={cn("w-10 h-8 text-center uppercase font-bold", matchDict2Val[m.id] === 'correct' ? "border-green-500 bg-green-50/10" : matchDict2Val[m.id] === 'incorrect' ? "border-red-500 bg-red-50/10" : "")}
                                                    maxLength={1}
                                                    readOnly={!!targetStudentId}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2 p-4 bg-muted/50 rounded-xl border border-dashed text-xs italic">
                                        {matchingDict2Data.map(m => <p key={m.id}>{m.right}</p>)}
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className='space-y-4'><h3 className='font-black text-primary border-b pb-1 uppercase'>Open Questions</h3>
                                {questionsDict2Data.map((q, i) => (<div key={q.id} className='space-y-1'><Label className='font-bold text-xs uppercase'>{i+1}. {q.q}</Label><Input value={qDict2Ans[q.id] || ''} onChange={e => !targetStudentId && setQDict2Ans({...qDict2Ans, [q.id]: e.target.value})} className={cn(qDict2Val[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : qDict2Val[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={!!targetStudentId} autoComplete="off" /></div>))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckQDict2} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('questions_dict2')} disabled={!qDict2AllOk && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'vocab_game': return <VocabularyMatchingGame data={irregularVerbsFull.slice(0, 10).map(v => ({ spanish: v.es, english: [v.present] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Verbs Memory Challenge" />;
            case 'complete_verbs':
                const cvAllOk = compVerbsGridData.every((row, i) => {
                    const ans = compVerbsAns[i] || { present: '', past: '', participle: '', spanish: '' };
                    const prOk = row.fixed[0] || ans.present?.trim().toUpperCase() === row.present.toUpperCase();
                    const paOk = row.fixed[1] || ans.past?.trim().toUpperCase() === row.past.toUpperCase();
                    const ppOk = row.fixed[2] || ans.participle?.trim().toUpperCase() === row.participle.toUpperCase();
                    const spOk = row.fixed[3] || ans.spanish?.trim().toUpperCase() === row.spanish.toUpperCase();
                    return prOk && paOk && ppOk && spOk;
                });
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>COMPLETE VERBS TABLE</CardTitle><CardDescription>Completa la tabla de estos verbos irregulares.</CardDescription></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader className='bg-muted/50'><TableRow>
                                    <TableHead className='font-black'>PRESENT SIMPLE</TableHead><TableHead className='font-black'>PAST SIMPLE</TableHead><TableHead className='font-black'>PAST PARTICIPLE</TableHead><TableHead className='font-black'>SPANISH</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>{compVerbsGridData.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Input value={row.fixed[0] ? row.present : (compVerbsAns[i]?.present || '')} onChange={e => !targetStudentId && setCompVerbsAns({...compVerbsAns, [i]: {...(compVerbsAns[i]||{}), present: e.target.value}})} className={cn("h-8 uppercase text-[10px]", row.fixed[0] ? "bg-muted font-black" : (compVerbsVal[i]?.present === 'correct' ? "border-green-500 bg-green-50/10" : compVerbsVal[i]?.present === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[0] || !!targetStudentId} /></TableCell>
                                        <TableCell><Input value={row.fixed[1] ? row.past : (compVerbsAns[i]?.past || '')} onChange={e => !targetStudentId && setCompVerbsAns({...compVerbsAns, [i]: {...(compVerbsAns[i]||{}), past: e.target.value}})} className={cn("h-8 uppercase text-[10px]", row.fixed[1] ? "bg-muted font-black" : (compVerbsVal[i]?.past === 'correct' ? "border-green-500 bg-green-50/10" : compVerbsVal[i]?.past === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[1] || !!targetStudentId} /></TableCell>
                                        <TableCell><Input value={row.fixed[2] ? row.participle : (compVerbsAns[i]?.participle || '')} onChange={e => !targetStudentId && setCompVerbsAns({...compVerbsAns, [i]: {...(compVerbsAns[i]||{}), participle: e.target.value}})} className={cn("h-8 uppercase text-[10px]", row.fixed[2] ? "bg-muted font-black" : (compVerbsVal[i]?.participle === 'correct' ? "border-green-500 bg-green-50/10" : compVerbsVal[i]?.participle === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[2] || !!targetStudentId} /></TableCell>
                                        <TableCell><Input value={row.fixed[3] ? row.spanish : (compVerbsAns[i]?.spanish || '')} onChange={e => !targetStudentId && setCompVerbsAns({...compVerbsAns, [i]: {...(compVerbsAns[i]||{}), spanish: e.target.value}})} className={cn("h-8 uppercase text-[10px]", row.fixed[3] ? "bg-muted font-black" : (compVerbsVal[i]?.spanish === 'correct' ? "border-green-500 bg-green-50/10" : compVerbsVal[i]?.spanish === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[3] || !!targetStudentId} /></TableCell>
                                    </TableRow>
                                ))}</TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={() => {
                                let ok = true; const nv: any = {};
                                compVerbsGridData.forEach((row, i) => {
                                    const userAns = compVerbsAns[i] || { present: '', past: '', participle: '', spanish: '' };
                                    const prOk = row.fixed[0] || userAns.present?.trim().toUpperCase() === row.present.toUpperCase();
                                    const paOk = row.fixed[1] || userAns.past?.trim().toUpperCase() === row.past.toUpperCase();
                                    const ppOk = row.fixed[2] || userAns.participle?.trim().toUpperCase() === row.participle.toUpperCase();
                                    const spOk = row.fixed[3] || userAns.spanish?.trim().toUpperCase() === row.spanish.toUpperCase();
                                    nv[i] = { present: prOk ? 'correct' : 'incorrect', past: paOk ? 'correct' : 'incorrect', participle: ppOk ? 'correct' : 'incorrect', spanish: spOk ? 'correct' : 'incorrect' };
                                    if (!prOk || !paOk || !ppOk || !spOk) ok = false;
                                });
                                setCompVerbsVal(nv);
                            }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('complete_verbs')} disabled={!cvAllOk && !isAdmin} className='text-white font-bold'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'exercise_3':
                const ex3AllOk = ex3TableData.every((_, i) => ex3Validation[i]?.cont === 'correct' && ex3Validation[i]?.simple === 'correct' && ex3Validation[i]?.past === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>EXERCISE 3: TRIPLE TENSE CHALLENGE</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader className='bg-muted/50'><TableRow>
                                    <TableHead className='font-black'>PRESENT CONTINUOUS</TableHead><TableHead className='font-black'>PRESENT SIMPLE</TableHead><TableHead className='font-black'>PAST SIMPLE</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>{ex3TableData.map((row, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Input value={row.fixed[0] ? row.presCont : (ex3TableAns[i]?.cont || '')} onChange={e => !targetStudentId && setEx3TableAns({...ex3TableAns, [i]: {...(ex3TableAns[i]||{}), cont: e.target.value}})} className={cn("h-10 uppercase", row.fixed[0] ? "bg-muted" : (ex3Validation[i]?.cont === 'correct' ? "border-green-500 bg-green-50/10" : ex3Validation[i]?.cont === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[0] || !!targetStudentId} /></TableCell>
                                        <TableCell><Input value={row.fixed[1] ? row.presSimple : (ex3TableAns[i]?.simple || '')} onChange={e => !targetStudentId && setEx3TableAns({...ex3TableAns, [i]: {...(ex3TableAns[i]||{}), simple: e.target.value}})} className={cn("h-10 uppercase", row.fixed[1] ? "bg-muted" : (ex3Validation[i]?.simple === 'correct' ? "border-green-500 bg-green-50/10" : ex3Validation[i]?.simple === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[1] || !!targetStudentId} /></TableCell>
                                        <TableCell><Input value={row.fixed[2] ? row.pastSimple : (ex3TableAns[i]?.past || '')} onChange={e => !targetStudentId && setEx3TableAns({...ex3TableAns, [i]: {...(ex3TableAns[i]||{}), past: e.target.value}})} className={cn("h-10 uppercase", row.fixed[2] ? "bg-muted" : (ex3Validation[i]?.past === 'correct' ? "border-green-500 bg-green-50/10" : ex3Validation[i]?.past === 'incorrect' ? "border-red-500 bg-red-50/10" : ""))} readOnly={row.fixed[2] || !!targetStudentId} /></TableCell>
                                    </TableRow>
                                ))}</TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={() => {
                                let ok = true; const nv: any = {};
                                ex3TableData.forEach((row, i) => {
                                    const userAns = ex3TableAns[i] || { cont: '', simple: '', past: '' };
                                    const cOk = row.fixed[0] || userAns.cont?.trim().toUpperCase() === row.presCont.toUpperCase();
                                    const sOk = row.fixed[1] || userAns.simple?.trim().toUpperCase() === row.presSimple.toUpperCase();
                                    const pOk = row.fixed[2] || userAns.past?.trim().toUpperCase() === row.pastSimple.toUpperCase();
                                    nv[i] = { cont: cOk ? 'correct' : 'incorrect', simple: sOk ? 'correct' : 'incorrect', past: pOk ? 'correct' : 'incorrect' };
                                    if (!cOk || !sOk || !pOk) ok = false;
                                });
                                setEx3Validation(nv);
                            }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('exercise_3')} disabled={!ex3AllOk && !isAdmin} className='text-white font-bold'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'reading':
                const readingAllOk = readingText.questions.every(q => readVal[q.id] === 'correct');
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>{readingText.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner whitespace-pre-wrap text-foreground">{readingText.content}</div>
                            <Separator />
                            <div className="space-y-4 text-foreground">
                                {readingText.questions.map((q, i) => (
                                    <div key={q.id} className="space-y-2 text-foreground">
                                        <Label className='font-bold text-primary uppercase text-xs'>{i+1}. {q.q}</Label>
                                        <Input value={readAns[q.id] || ''} onChange={e => !targetStudentId && setReadAns({...readAns, [q.id]: e.target.value})} className={cn(readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={!!targetStudentId} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckReading} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('reading')} disabled={!readingAllOk && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'writing':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase'>WRITING: TRADUCCION</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el texto sobre Paul al español.</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-sm leading-relaxed shadow-inner whitespace-pre-wrap text-foreground">{paulStorySpanish}</div>
                            <Separator /><Label className="font-bold text-primary uppercase text-sm">Tu Traducción al Inglés:</Label>
                            <textarea value={writingTrans} onChange={e => !targetStudentId && setWritingTrans(e.target.value)} readOnly={!!targetStudentId} className="w-full min-h-[300px] p-4 rounded-xl border bg-background text-lg font-medium text-foreground" placeholder="Start writing here..."/>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => { handleTopicComplete('writing'); toast({ title: "¡Clase Completada!", description: "Has finalizado la Clase 8 con éxito." }); }} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl uppercase animate-pulse">Terminar Misión <CheckCircle className='ml-2 h-8 w-8'/></Button></CardFooter>
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
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 8A</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav><ul className="space-y-1">
                            {learningPath.map((item) => {
                                const isLocked = item.status === 'locked' && !isAdmin;
                                const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                return (
                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                        <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-current">{item.name}</span></div>
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
