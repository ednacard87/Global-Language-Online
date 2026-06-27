'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
    Mic, 
    Pencil, 
    Gamepad2, 
    BookText, 
    Trophy,
    ArrowLeft,
    Star,
    Check,
    X,
    MessageSquare,
    Info,
    RefreshCw
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Separator } from '@/components/ui/separator';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a1_eng_u3_c14_v255_stable';
const mainProgressKey = 'progress_a1_eng_unit_3_class_14';

// --- DATA ---

const materialsVocab = [
    { es: "TEJIDO", en: "FABRIC" }, { es: "PIEDRA", en: "STONE" }, { es: "MADERA", en: "WOOD" },
    { es: "LANA", en: "WOOL" }, { es: "BRONCE", en: "BRONZE" }, { es: "METAL", en: "METAL" },
    { es: "ALGODÓN", en: "COTTON" }, { es: "ACERO", en: "STEEL" }, { es: "PLATA", en: "SILVER" },
    { es: "SEDA", en: "SILK" }, { es: "HIERRO", en: "IRON" }, { es: "ORO", en: "GOLD" },
    { es: "CUERO", en: "LEATHER" }, { es: "VIDRIO", en: "GLASS" }, { es: "PLASTICO", en: "PLASTIC" },
];

const ex1Prompts = [
    { text: "IS COLOMBIA __________________ COUNTRY OF SOUTH AMERICA?", options: ["NICE", "NICER", "THE NICEST", "THE MOST NICE"], answer: "THE NICEST" },
    { text: "ARE THEY _____ THAN THEM?", options: ["THE MOST FAMOUS", "MORE FAMOUS", "FAMOUSER", "FAMOUS"], answer: "MORE FAMOUS" },
    { text: "I’M ________ OF MY FAMILY", options: ["THE MOST TALL", "TALLER", "THE TALLEST", "THE MORE TALL"], answer: "THE TALLEST" },
    { text: "ARE THEY______________THAN US?  ", options: ["YOUNG", "MORE YOUNG", "YOUNGER", "THE YOUNGESTS"], answer: "YOUNGER" },
];

const ex2Prompts = [
    { es: "¿DONDE ESTA EL ARBOL MAS ALTO? (HIGH)", answers: ["where is the highest tree?"] },
    { es: "EL PUEDE AYUDARNOS", answers: ["he can help us"] },
    { es: "NOSOTROS NO ESTAMOS MANEJANDO UN CAMION", answers: ["we are not driving a truck", "we're not driving a truck", "we aren't driving a truck"] },
    { es: "¿ELLA JUEGA CON EL?", answers: ["does she play with him?"] },
    { es: "¿BARRANQUILLA ES MAS CALIENTE QUE CARTAGENA?", answers: ["is barranquilla hotter than cartagena?"] },
    { es: "ELLOS NO DESAYUNAN A LAS 9", answers: ["they do not have breakfast at 9", "they don't have breakfast at 9"] },
    { es: "ELLA ESTA JUGANDO CON SU HIJO", answers: ["she is playing with her son"] },
    { es: "¿COLOMBIA ES MAS GRANDE QUE PANAMA?", answers: ["is colombia bigger than panama?"] },
    { es: "ELLA NO LOS ESTA LLAMANDO", answers: ["she is not calling them", "she's not calling them"] },
    { es: "¿QUE LE ENSEÑAS A ELLOS?", answers: ["what do you teach them?"] },
];

const ex2Vocab = { "árbol": "tree", "ayudarnos": "help us", "manejando": "driving", "camión": "truck", "desayunan": "have breakfast", "llamando": "calling", "enseñas": "teach" };

const ex3Prompts = [
    { text: "THIS IS THE ____________________VIDEO I’VE EVER SEEN!", options: ["FUNNIER", "THE MOST FUNNY", "THE FUNNIEST", "FUNNY"], answer: "THE FUNNIEST" },
    { text: "THIS BOX IS _________________________THAN THE OTHER", options: ["THE LIGHTER", "LIGHTER", "THE LIGHTEST", "LIGHT"], answer: "LIGHTER" },
    { text: "JANE IS__________________________THAN MARY", options: ["INTERESTINGER", "MORE INTERESTING", "INTERESTING", "THE INTERESTINGEST"], answer: "MORE INTERESTING" },
    { text: "HE IS ________________________ PILOT IN THE RACE", options: ["BAD", "THE WORST", "WORSE", "THE BADDEST"], answer: "THE WORST" },
    { text: "THAT MOVIE IS _______________________", options: ["BORINGER", "THE MOST BORING", "MORE BORING", "BORING"], answer: "BORING" },
    { text: "THESE JEANS ARE________________________ THAN THOSE ONES", options: ["DIRTIEST", "DIRTIER", "THE MOST DIRTY", "DIRTY"], answer: "DIRTIER" },
    { text: "THIS PLACE IS __________________________ OF THIS COUNTRY", options: ["MORE SAFE", "THE SAFEST", "THE MOST SAFE", "SAFER"], answer: "THE SAFEST" },
];

const readingData = {
    title: "My Daily Routine in Canada",
    content: "I live in a small town in Canada. In winter, it is very cold and there is a lot of snow. I usually get up at 7:00 a.m. I drink some coffee and eat my breakfast. Then, I go to work. I work in a fabric factory. We make clothes with cotton and wool. After work, I usually go to the park or read a book at home. I like my life here!",
    questions: [
        { id: 'q1', question: "Where does the person live?", answers: ["canada", "in a small town in canada"] },
        { id: 'q2', question: "What materials do they use in the factory?", answers: ["cotton and wool", "wool and cotton"] },
        { id: 'q3', question: "What time does he get up?", answers: ["7:00 am", "at 7:00 am", "7 am"] }
    ]
};

const finalExPrompts = [
    { question: "¿TÚ TIO ESTA DURMIENDO?", trans: ["is your uncle sleeping?"], pos: ["yes, he is"], neg: ["no, i am not", "no, i'm not"] },
    { question: "¿ESTÁS MANEJANDO UN CARRO O UNA MOTO?", trans: ["are you driving a car or a motorcycle?", "are you driving a car or a bike?"], pos: ["yes, i am"], neg: ["no, i am not", "no, i'm not"] },
    { question: "¿NOSOTROS ESTAMOS ESTUDIANDO INGLES UNA VEZ A LA SEMANA?", trans: ["are we studying english once a week?"], pos: ["yes, we are"], neg: ["no, we are not", "no, we aren't"] },
    { question: "¿ÉL ESTA DIBUJANDO?", trans: ["is he drawing?"], pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] },
    { question: "¿ELLOS ESTAN CANTANDO EN LA FIESTA?", trans: ["are they singing at the party?"], pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] },
    { question: "¿ESTÁS LLAMANDO A TU MAMÁ TODOS LOS DIAS?", trans: ["are you calling your mom every day?", "are you calling your mother every day?"], pos: ["yes, i am"], neg: ["no, i am not", "no, i'm not"] },
    { question: "¿ELLA ESTÁ LEYENDO UN LIBRO?", trans: ["is she reading a book?"], pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] },
    { question: "¿ELLOS ESTÁN VIAJANDO?", trans: ["are they traveling?"], pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] },
    { question: "¿ÉL ESTA VIENDO TELEVISION?", trans: ["is he watching tv?", "is he watching television?"], pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] },
    { question: "¿MARK ESTA YENDO A LONDRES O ROMA?", trans: ["is mark going to london or rome?"], pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] },
];

const ICONS_MAP = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- HELPER COMPONENTS ---

/**
 * Componente de ejercicio de opción múltiple con "Sigue Intentando"
 */
const ChoiceExercise = ({ prompts, onComplete, title, description }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    // Rastreamos qué preguntas han sido resueltas correctamente
    const [solvedQuestions, setSolvedQuestions] = useState<Record<number, boolean>>({});
    // Rastreamos los clics incorrectos para la pregunta ACTUAL para mostrarlos en rojo
    const [wrongOptions, setWrongOptions] = useState<string[]>([]);

    useEffect(() => {
        // Limpiamos los resaltados rojos al cambiar de pregunta
        setWrongOptions([]);
    }, [currentIndex]);

    const handleSelect = (option: string) => {
        // Si ya está resuelta, no hacer nada
        if (solvedQuestions[currentIndex]) return;

        const isCorrect = option.toUpperCase() === prompts[currentIndex].answer.toUpperCase();
        
        if (isCorrect) {
            setSolvedQuestions(prev => ({ ...prev, [currentIndex]: true }));
            toast({ title: "¡Correcto!" });
        } else {
            // Añadimos a la lista de opciones incorrectas si no estaba ya
            if (!wrongOptions.includes(option.toUpperCase())) {
                setWrongOptions(prev => [...prev, option.toUpperCase()]);
            }
            toast({ variant: 'destructive', title: "Sigue intentando", description: "Esa no es la respuesta correcta." });
        }
    };

    const handleNext = () => {
        if (currentIndex < prompts.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>{description || "Elige la opción correcta."}</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn(
                                "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", 
                                currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", 
                                solvedQuestions[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground"
                            )}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-bold text-center leading-relaxed">
                    {prompts[currentIndex].text.split('__________________').map((part: string, i: number) => (
                        <React.Fragment key={i}>
                            {part}
                            {i < prompts[currentIndex].text.split('__________________').length - 1 && (
                                <span className={cn(
                                    "border-b-2 border-dashed px-4 mx-2",
                                    solvedQuestions[currentIndex] ? "text-primary border-primary" : "text-muted-foreground border-muted-foreground"
                                )}>
                                    {solvedQuestions[currentIndex] ? prompts[currentIndex].answer : '...'}
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-md mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button 
                            key={opt} 
                            onClick={() => handleSelect(opt)} 
                            variant="outline" 
                            className={cn(
                                "h-14 text-lg font-black uppercase transition-all",
                                solvedQuestions[currentIndex] && opt.toUpperCase() === prompts[currentIndex].answer.toUpperCase() ? "border-green-500 bg-green-50 text-green-700 shadow-md scale-105" :
                                wrongOptions.includes(opt.toUpperCase()) ? "border-red-500 bg-red-50 text-red-700 opacity-80" : ""
                            )}
                            disabled={solvedQuestions[currentIndex] && opt.toUpperCase() !== prompts[currentIndex].answer.toUpperCase()}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={handleNext} disabled={!solvedQuestions[currentIndex]} className="px-12 font-bold">
                    {currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}
                </Button>
            </CardFooter>
        </Card>
    );
};

const DictationGradingExercise = ({ title, description, prompts, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades }: any) => {
    const [lines, setLines] = useState<string[]>(initialLines || Array(prompts.length).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});

    const handleLineChange = (idx: number, val: string) => {
        const newLines = [...lines];
        newLines[idx] = val;
        setLines(newLines);
        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: newLines });
        }
    };

    const handleToggleGrade = (idx: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const newGrades = { ...grades };
        newGrades[idx] = newGrades[idx] === type ? null : type;
        setGrades(newGrades);
        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: newGrades });
        }
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
            <CardHeader className='bg-primary/5 border-b'>
                <CardTitle>{title}</CardTitle>
                <CardDescription className='font-bold text-foreground'>{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                        {prompts.map((_: any, idx: number) => {
                            const status = grades[idx];
                            const isTitleLine = idx === 0 && (title.includes('DICTATION') || title.includes('Writing 2'));
                            return (
                                <div key={idx} className="flex items-center gap-3 group">
                                    <span className={cn("font-bold w-10 text-right", isTitleLine ? "text-primary text-lg" : "text-muted-foreground")}>{idx + 1}.</span>
                                    <Input 
                                        value={lines[idx] || ''} 
                                        onChange={e => handleLineChange(idx, e.target.value)} 
                                        className={cn(
                                            "flex-1 h-10 transition-all",
                                            isTitleLine && "font-bold text-lg border-primary/50",
                                            status === 'correct' ? 'border-green-500 bg-green-50/10' : status === 'incorrect' ? 'border-red-500 bg-red-50/10' : ''
                                        )} 
                                        placeholder={isTitleLine ? "Escribe el título aquí..." : "Escribe aquí..."}
                                        autoComplete="off" 
                                    />
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'correct')} className={cn("h-8 w-8 rounded-full", status === 'correct' ? "bg-green-500 text-white" : "bg-muted text-muted-foreground")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'incorrect')} className={cn("h-8 w-8 rounded-full", status === 'incorrect' ? "bg-red-500 text-white" : "bg-muted text-muted-foreground")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                <Button onClick={onComplete} size="lg" className="px-16 font-black h-14 text-xl shadow-lg">Avanzar <ArrowRight className="ml-2 h-6 w-6" /></Button>
            </CardFooter>
        </Card>
    );
};

const SimpleTranslationExerciseInternal = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex].answers.map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
        const isCorrect = corrects.includes(userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
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
                                <BookText className="mr-2 h-4 w-4" />
                                Vocabulary
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                            <ScrollArea className="h-48">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase">{prompts[currentIndex].es}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu traducción..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'}>Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const TripleLineTranslationExercise = ({ prompts, onComplete, title, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ trans: '', pos: '', neg: '' });
    const [val, setVal] = useState<any>({ trans: 'unchecked', pos: 'unchecked', neg: 'unchecked' });
    const [completed, setCompleted] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setAns({ trans: '', pos: '', neg: '' });
        setVal({ trans: 'unchecked', pos: 'unchecked', neg: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const newVal = { ...val };
        let ok = true;
        ['trans', 'pos', 'neg'].forEach((f, i) => {
            const user = ans[f as keyof typeof ans].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const promptKeys = ['trans', 'pos', 'neg'];
            const cors = prompts[currentIndex][promptKeys[i]].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (f === 'trans' && !ans.trans.trim().endsWith('?')) { ok = false; newVal.trans = 'incorrect'; }
            else if (cors.includes(user)) newVal[f] = 'correct'; else { ok = false; newVal[f] = 'incorrect'; }
        });
        setVal(newVal);
        if (ok) { toast({ title: "¡Perfecto!" }); setCompleted(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="w-full">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>Traduce la pregunta y responde de forma corta</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completed[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
                {vocabulary && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                                <BookText className="mr-2 h-4 w-4" />
                                Vocabulary
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                            <div className="space-y-2 text-foreground text-left">
                                <h4 className="font-bold border-b pb-1 text-primary">Vocabulario Útil</h4>
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (
                                            <React.Fragment key={es}>
                                                <span className="text-muted-foreground capitalize">{es}:</span>
                                                <span className="font-semibold text-right">{en}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl uppercase">{prompts[currentIndex].question}</div>
                <div className="space-y-4 font-mono text-base max-w-lg mx-auto">
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-blue-500 text-center">(?)</Label><Input id={`q-${currentIndex}`} value={ans.trans} onChange={e => setAns(p => ({...p, trans: e.target.value}))} className={cn("flex-1", val.trans === 'correct' ? 'border-green-500' : val.trans === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-green-500 text-center">(+A)</Label><Input id={`pos-${currentIndex}`} value={ans.pos} onChange={e => setAns(p => ({...p, pos: e.target.value}))} className={cn("flex-1", val.pos === 'correct' ? 'border-green-500' : val.pos === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-red-500 text-center">(-A)</Label><Input id={`neg-${currentIndex}`} value={ans.neg} onChange={e => setAns(p => ({...p, neg: e.target.value}))} className={cn("flex-1", val.neg === 'correct' ? 'border-green-500' : val.neg === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!completed[currentIndex]} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function Class14Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(
        () => (currentUID ? doc(firestore, 'students', currentUID) : null),
        [firestore, currentUID]
    );
    const authUserRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, authUserProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // State for vocabulary exercise
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(materialsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(materialsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    // Create 1 State
    const [create1Text, setCreate1Text] = useState('');

    // Lectura State
    const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
    const [readingValidation, setReadingValidation] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulary', icon: BookOpen, status: 'active' },
        { key: 'dictation1', name: '2. Dictation 1', icon: Mic, status: 'locked' },
        { key: 'create1', name: '3. Create 1', icon: Pencil, status: 'locked' },
        { key: 'exercise1', name: '4. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise2', name: '5. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'dictation2', name: '6. Dictation 2', icon: Mic, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise3', name: '8. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'create2', name: '9. Create 2', icon: Pencil, status: 'locked' },
        { key: 'lectura', name: '10. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_exercise', name: '11. Final Exercise', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';

        if (isAdmin) {
            path.forEach(t => t.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const data = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (data[t.key]) t.status = data[t.key]; });
            savedST = data.lastSelectedTopic || '';
            if (data.create1Text) setCreate1Text(data.create1Text);
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const save = { 
            lastSelectedTopic: selectedTopic,
            create1Text: create1Text
        };
        learningPath.forEach(t => (save as any)[t.key] = t.status);

        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: save,
            [`progress.${mainProgressKey}`]: progressValue
        });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading, create1Text]);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(curr => {
            let win = false; let next: string | null = null;
            const np = curr.map(t => ({ ...t }));
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active';
                    win = true;
                    next = np[i + 1].key;
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Misión completada!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);
    };

    const handleVocabCheck = () => {
        let allOk = true;
        const nv = materialsVocab.map((item, idx) => {
            const isCorrect = item.en.toUpperCase() === (vocabAnswers[idx] || '').trim().toUpperCase();
            if (!isCorrect) allOk = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        setCanAdvanceVocab(allOk);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo el vocabulario es correcto." });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleCheckReading = () => {
        let allOk = true;
        const newV: any = {};
        readingData.questions.forEach(q => {
            const userAns = (readingAnswers[q.id] || '').trim().toLowerCase();
            const isCorrect = q.answers.some(a => a.toLowerCase() === userAns);
            newV[q.id] = isCorrect ? 'correct' : 'incorrect';
            if (!isCorrect) allOk = false;
        });
        setReadingValidation(newV);
        if (allOk) {
            toast({ title: "¡Muy bien!", description: "Comprensión de lectura superada." });
            handleTopicComplete('lectura');
        } else {
            toast({ variant: 'destructive', title: "Respuestas incorrectas" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return (
            <Card className="flex flex-col items-center justify-center min-h-[400px] border-2 border-brand-purple bg-card/90">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-foreground font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión...</p>
            </Card>
        );

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <CardTitle>MATERIALS AND FABRICS</CardTitle>
                            <CardDescription>Traduce el vocabulario de materiales y tejidos al inglés.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="font-bold border-b pb-2 text-primary uppercase text-xs">Español</div>
                                <div className="font-bold border-b pb-2 text-primary uppercase text-xs">Inglés</div>
                                {materialsVocab.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="flex items-center text-sm font-bold">{item.es}</div>
                                        <Input 
                                            value={vocabAnswers[idx] || ''} 
                                            onChange={e => {
                                                const n = [...vocabAnswers]; n[idx] = e.target.value; setVocabAnswers(n);
                                                const nv = [...vocabValidation]; nv[idx] = 'unchecked'; setVocabValidation(nv as any);
                                            }}
                                            className={cn(vocabValidation[idx] === 'correct' ? 'border-green-500' : vocabValidation[idx] === 'incorrect' ? 'border-red-500' : '')}
                                            placeholder="..."
                                            autoComplete="off"
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between mt-6 pt-6 border-t">
                            <Button onClick={handleVocabCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'dictation1':
                return (
                    <DictationGradingExercise 
                        title="DICTATION 1 = COMPARATIVES AND SUPERLATIVE ADJECTIVES"
                        description="Escucha y escribe. El administrador calificará tu progreso."
                        prompts={Array(30).fill('')}
                        onComplete={() => handleTopicComplete('dictation1')}
                        studentDocRef={studentDocRef}
                        isAdmin={isAdmin}
                        storageKeyLines="dictation1Lines"
                        storageKeyGrades="dictation1Grades"
                        initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Lines}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Grades}
                    />
                );
            case 'create1':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <CardTitle>Create 1</CardTitle>
                            <CardDescription className="text-lg font-bold">Responde libremente a las siguientes preguntas:</CardDescription>
                            <p className="p-4 bg-muted rounded-xl border font-mono">DID YOU GO TO THE CIRCUS? WHY? DID YOU LIKE IT OR NOT?</p>
                        </CardHeader>
                        <CardContent>
                            <textarea 
                                value={create1Text}
                                onChange={e => setCreate1Text(e.target.value)}
                                className="w-full min-h-[200px] p-4 rounded-xl border bg-background font-sans text-lg"
                                placeholder="Escribe tu respuesta aquí..."
                            />
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('create1')} size="lg" className="px-20">Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'exercise1':
                return <ChoiceExercise prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise1')} title="EXERCISE: COMPARATIVOS Y SUPERLATIVOS" />;
            case 'exercise2':
                return <SimpleTranslationExerciseInternal prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise2')} title="TRANSLATE THE FOLLOWING SENTENCES" vocabulary={ex2Vocab} />;
            case 'dictation2':
                return (
                    <DictationGradingExercise 
                        title="DICTATION 2 = AT WORK"
                        description="Escucha y escribe. Segundo dictado independiente."
                        prompts={Array(31).fill('')}
                        onComplete={() => handleTopicComplete('dictation2')}
                        studentDocRef={studentDocRef}
                        isAdmin={isAdmin}
                        storageKeyLines="dictation2Lines"
                        storageKeyGrades="dictation2Grades"
                        initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2Lines}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2Grades}
                    />
                );
            case 'vocab_game':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
                        <CardHeader><CardTitle>Vocabulary (Game)</CardTitle></CardHeader>
                        <CardContent>
                            <VocabularyMatchingGame data={materialsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Materials & Fabrics Memory" />
                        </CardContent>
                    </Card>
                );
            case 'exercise3':
                return <ChoiceExercise prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise3')} title="EXERCISE 3: COMPARATIVES & SUPERLATIVES" />;
            case 'create2':
                return (
                    <DictationGradingExercise 
                        title="CREATE 2"
                        description="INVENTA 2 FRASES AFIRMATIVA, Y 2 FRASES NEGATIVAS Y 2 FRASES INTERROGATIVAS CON LOS PRONOMBRES OBJETO EN PARENTESIS: (ME- YOU- HIM- HER- IT – US- THEM)"
                        prompts={Array(6).fill('')}
                        onComplete={() => handleTopicComplete('create2')}
                        studentDocRef={studentDocRef}
                        isAdmin={isAdmin}
                        storageKeyLines="create2Lines"
                        storageKeyGrades="create2Grades"
                        initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.create2Lines}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create2Grades}
                    />
                );
            case 'lectura':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <CardTitle>{readingData.title}</CardTitle>
                            <CardDescription>Lee el texto y responde las preguntas de comprensión.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingData.questions.map(q => (
                                    <div key={q.id} className="grid gap-2">
                                        <Label htmlFor={q.id}>{q.question}</Label>
                                        <Input 
                                            id={q.id}
                                            value={readingAnswers[q.id] || ''}
                                            onChange={e => {
                                                const nr = { ...readingAnswers, [q.id]: e.target.value }; setReadingAnswers(nr);
                                                const nv = { ...readingValidation, [q.id]: 'unchecked' }; setReadingValidation(nv);
                                            }}
                                            className={cn(readingValidation[q.id] === 'correct' ? 'border-green-500' : readingValidation[q.id] === 'incorrect' ? 'border-red-500' : '')}
                                            autoComplete="off"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={handleCheckReading} size="lg">Verificar Lectura</Button>
                        </CardFooter>
                    </Card>
                );
            case 'final_exercise':
                return <TripleLineTranslationExercise prompts={finalExPrompts} onComplete={() => handleTopicComplete('final_exercise')} title="EXERCISE: SHORT ANSWERS CON EL PRESENTE CONTINUO" />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/3" className="hover:underline text-sm font-bold text-primary flex items-center gap-2">
                            <ArrowLeft className='h-4 w-4'/> Volver a la Unidad 3
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)] uppercase tracking-tight">Clase 14 (A1) ⚡</h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm overflow-hidden">
                                <CardHeader className="bg-primary/5 border-b pb-4">
                                    <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                                        <Star className="h-5 w-5 fill-primary" />
                                        Tu Aventura
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isCompleted = item.status === 'completed';
                                                
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn(
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {isCompleted ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <item.icon className={cn("h-5 w-5", isLocked ? "text-yellow-500" : "text-primary")} />
                                                            )}
                                                            <span className="truncate max-w-[150px]">{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-4 w-4 text-yellow-500/50" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground">
                                            <span>Avance Clase</span>
                                            <span className="text-primary">{progressValue}%</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </main>
            
        </div>
    );
}


