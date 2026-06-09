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
    Loader2, 
    Clock, 
    ArrowRight, 
    ArrowLeft, 
    Plus, 
    Minus, 
    HelpCircle, 
    Pencil, 
    Check, 
    X, 
    BookText,
    Info,
    Gamepad2,
    Trophy
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';

// --- DATA ---

const progressStorageVersion = 'progress_a1_eng_u3_c12_v205_stable';
const mainProgressKey = 'progress_a1_eng_unit_3_class_12';

const timeExpressionsData = [
    { spanish: 'ANOCHE', english: ['LAST NIGHT'] },
    { spanish: 'ESTA NOCHE', english: ['TONIGHT'] },
    { spanish: 'LA SEMANA PASADA', english: ['LAST WEEK'] },
    { spanish: 'EL AÑO PASADO', english: ['LAST YEAR'] },
    { spanish: 'EN LA MAÑANA', english: ['IN THE MORNING'] },
    { spanish: 'EN LA TARDE', english: ['IN THE AFTERNOON'] },
    { spanish: 'EN LA NOCHE', english: ['IN THE EVENING', 'AT NIGHT'] },
    { spanish: 'RECIENTEMENTE', english: ['RECENTLY'] },
    { spanish: 'ESTA SEMANA', english: ['THIS WEEK'] },
    { spanish: 'LA PROX. SEMANA', english: ['NEXT WEEK'] },
    { spanish: 'ESTA MAÑANA', english: ['THIS MORNING'] },
    { spanish: 'HACE UNA HORA', english: ['AN HOUR AGO'] },
    { spanish: 'HACE 5 MINUTOS', english: ['5 MINUTES AGO', 'FIVE MINUTES AGO'] },
    { spanish: 'EN EL PASADO', english: ['IN THE PAST'] },
    { spanish: 'EN EL FUTURO', english: ['IN THE FUTURE'] },
    { spanish: 'AHORA- YA', english: ['NOW', 'ALREADY'] },
];

const ex1Prompts = [
    { spanish: "¿QUE ESTAN HACIENDO ELLOS?", english: ["what are they doing?"] },
    { spanish: "ELLA NO ESTA DURMIENDO, ELLA ESTA COCINANDO", english: ["she is not sleeping, she is cooking", "she isn't sleeping, she is cooking"] },
    { spanish: "NOSOTROS ESTAMOS ESTUDIANDO PROGRAMACION", english: ["we are studying programming"] },
    { spanish: "¿A DONDE ESTA YENDO MARY?", english: ["where is mary going?"] },
    { spanish: "¿ESTAS ESCUCHANDO MUSICA? - NO", english: ["are you listening to music? - no, i am not", "are you listening to music? - no, i'm not"] },
    { spanish: "EL NO LLEGA A LAS 10, EL ESTA LLEGANDO A LAS 8", english: ["he does not arrive at 10, he is arriving at 8", "he doesn't arrive at 10, he's arriving at 8"] },
    { spanish: "¿TU ABUELA ESTA LEYENDO UN LIBRO? – SI", english: ["is your grandmother reading a book? - yes, she is", "is your grandma reading a book? - yes, she is"] },
];

const ex3Prompts = [
    { question: "TU ESTAS LLAMANDO A TU MAMÁ?", english: "ARE YOU CALLING YOUR MOTHER?", answers: { translation: ["are you calling your mother?"], pos: ["yes, i am"], neg: ["no, i am not", "no, i'm not"] } },
    { question: "TU ESTÁS CANSADO?", english: "ARE YOU TIRED?", answers: { translation: ["are you tired?"], pos: ["yes, i am"], neg: ["no, i am not", "no, i'm not"] } },
    { question: "ELLA ESTÁ DURMIENDO?", english: "IS SHE SLEEPING?", answers: { translation: ["is she sleeping?"], pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] } },
    { question: "ELLA ES JULIA?", english: "IS SHE JULIA?", answers: { translation: ["is she julia?"], pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] } },
    { question: "ELLOS ESTÁN LLEGANDO EL DOMINGO?", english: "ARE THEY ARRIVING ON SUNDAY?", answers: { translation: ["are they arriving on sunday?"], pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] } },
    { question: "ELLOS SON ESTUDIANTES?", english: "ARE THEY STUDENTS?", answers: { translation: ["are they students?"], pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] } },
    { question: "EL ESTA BEBIENDO VINO?", english: "IS HE DRINKING RED WINE?", answers: { translation: ["is he drinking red wine?"], pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] } },
    { question: "ELLOS SON JUGADORES DE FUTBOL?", english: "ARE THEY FOOTBALL PLAYERS?", answers: { translation: ["are they football players?", "are they soccer players?"], pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] } },
    { question: "ELLOS ESTÁN COMINDO HAMBURGUESAS?", english: "ARE THEY EATING HAMBURGERS?", answers: { translation: ["are they eating hamburgers?"], pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] } },
    { question: "EL ESTA MANEJANDO UN CAMION?", english: "IS HE DRIVING A TRUCK?", answers: { translation: ["is he driving a truck?"], pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] } },
    { question: "MARIO ESTÁ CANTANDO EN EL BAÑO?", english: "IS MARIO SINGING IN THE BATHROOM?", answers: { translation: ["is mario singing in the bathroom?"], pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] } },
    { question: "ELLA ESTA BUSCANDO UN EMPLEO?", english: "IS SHE LOOKING FOR A JOB?", answers: { translation: ["is she looking for a job?"], pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] } },
];

const ex4Prompts = [
    { spanish: "yo voy al supermercado", answers: { simple: ["i go to the supermarket"], continuous: ["i am going to the supermarket", "i'm going to the supermarket"] } },
    { spanish: "ella escribe un libro", answers: { simple: ["she writes a book"], continuous: ["she is writing a book", "she's writing a book"] } },
    { spanish: "ella no trabaja el domingo", answers: { simple: ["she does not work on sunday", "she doesn't work on sunday"], continuous: ["she is not working on sunday", "she isn't working on sunday"] } },
    { spanish: "¿él canta en el baño?", answers: { simple: ["does he sing in the bathroom?"], continuous: ["is he singing in the bathroom?"] } },
    { spanish: "¿tu estudias ingles?", answers: { simple: ["do you study english?"], continuous: ["are you studying english?"] } },
];

//--- Vocabulario de los Ejercicios ----
const ex1Vocab = { "haciendo": "doing", "durmiendo": "sleeping", "estudiando": "studying", "programación": "programming", "yendo": "going", "escuchando": "listening", "llega": "arrives", "llegando": "arriving", "abuela": "grandmother", "leyendo": "reading" };
const ex3Vocab = { "llamando": "calling", "cansado": "tired", "durmiendo": "sleeping", "llegando": "arriving", "domingo": "sunday", "estudiantes": "students", "bebiendo": "drinking", "vino tinto": "red wine", "jugadores": "players", "fútbol": "football / soccer", "comiendo": "eating", "hamburguesas": "hamburgers", "conduciendo": "driving", "camión": "truck", "cantando": "singing", "baño": "bathroom", "buscando": "looking for", "trabajo": "job" };
const ex4Vocab = { "supermercado": "supermarket", "escribe": "writes", "libro": "book", "trabaja": "works", "domingo": "sunday", "canta": "sings", "baño": "bathroom", "estudias": "study" };

// --- SUB-COMPONENTS ---

const ManualGradingExercise = ({ 
    title,
    description,
    onComplete, 
    studentDocRef, 
    initialData, 
    initialGrades,
    savePath, 
    savePathGrades,
    isAdmin,
    lineCount = 6,
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
                        <Pencil className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
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
                                    placeholder="Escribe aquí..."
                                    autoComplete="off" 
                                />
                                <div className="flex gap-1 shrink-0">
                                    <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'correct')} className={cn("h-8 w-8 rounded-full", status === 'correct' ? "bg-green-500 text-white" : "bg-muted")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(idx, 'incorrect')} className={cn("h-8 w-8 rounded-full", status === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="pt-6 border-t flex justify-center">
                <Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 text-xl">
                    Avanzar <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
            </CardFooter>
        </Card>
    );
};

// ---- Exercise 3 ---
const TripleLineTranslationExercise = ({ title, prompts, vocabulary, onComplete }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({ translation: '', pos: '', neg: '' });
    const [validation, setValidation] = useState<any>({ translation: 'unchecked', pos: 'unchecked', neg: 'unchecked' });
    const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

    const currentPrompt = prompts[currentIndex];

    useEffect(() => {
        setAnswers({ translation: '', pos: '', neg: '' });
        setValidation({ translation: 'unchecked', pos: 'unchecked', neg: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const newVal = { ...validation };
        let allOk = true;

        ['translation', 'pos', 'neg'].forEach(f => {
            const user = answers[f as keyof typeof answers].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = currentPrompt.answers[f as keyof typeof currentPrompt.answers].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (f === 'translation' && !answers.translation.trim().endsWith('?')) { allOk = false; newVal.translation = 'incorrect'; }
            else if (corrects.includes(user)) newVal[f] = 'correct';
            else { allOk = false; newVal[f] = 'incorrect'; }
        });

        setValidation(newVal);
        if (allOk) { toast({ title: "¡Correcto!" }); setCompletedMap(prev => ({ ...prev, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>{title}</CardTitle><CardDescription>Traduce la pregunta y da las dos respuestas cortas.</CardDescription></div>
                {vocabulary && (
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-brand-blue border-2'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                        <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}</div></PopoverContent>
                    </Popover>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2 justify-center flex-wrap">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completedMap[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>{i + 1}</div>
                    ))}
                </div>
                
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl uppercase">{currentPrompt.question}</div>
                <div className="space-y-3 font-mono">
                    <div className="flex items-center gap-3"><Label className="w-12 font-bold text-blue-500">(?)</Label><Input value={answers.translation} onChange={e => setAnswers(p => ({...p, translation: e.target.value}))} className={cn(validation.translation === 'correct' ? 'border-green-500' : validation.translation === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-3"><Label className="w-12 font-bold text-green-500">(+A)</Label><Input value={answers.pos} onChange={e => setAnswers(p => ({...p, pos: e.target.value}))} className={cn(validation.pos === 'correct' ? 'border-green-500' : validation.pos === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-3"><Label className="w-12 font-bold text-red-500">(-A)</Label><Input value={answers.neg} onChange={e => setAnswers(p => ({...p, neg: e.target.value}))} className={cn(validation.neg === 'correct' ? 'border-green-500' : validation.neg === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                </div> 
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!completedMap[currentIndex]} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const SimpleVsContinuousExercise = ({ prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({ simple: '', continuous: '' });
    const [validation, setValidation] = useState<any>({ simple: 'unchecked', continuous: 'unchecked' });
    const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setAnswers({ simple: '', continuous: '' });
        setValidation({ simple: 'unchecked', continuous: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const newVal = { ...validation };
        let allOk = true;
        ['simple', 'continuous'].forEach(f => {
            const user = answers[f as keyof typeof answers].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = prompts[currentIndex].answers[f].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (corrects.includes(user)) newVal[f] = 'correct'; else { allOk = false; newVal[f] = 'incorrect'; }
        });
        setValidation(newVal);
        if (allOk) { toast({ title: "¡Excelente!" }); setCompletedMap(prev => ({ ...prev, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus frases" });
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Exercise 4: Simple vs Continuous</CardTitle></div>
                {vocabulary && (
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-brand-blue border-2'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                        <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}</div></PopoverContent>
                    </Popover>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2 justify-center flex-wrap">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completedMap[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>{i + 1}</div>
                    ))}
                </div>
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl uppercase">{prompts[currentIndex].spanish}</div>
                <div className="space-y-4 text-foreground">
                    <div className="space-y-2"><Label className="text-sm font-bold text-primary">Present Simple:</Label><Input value={answers.simple} onChange={e => setAnswers(p => ({...p, simple: e.target.value}))} className={cn(validation.simple === 'correct' ? 'border-green-500' : validation.simple === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="space-y-2"><Label className="text-sm font-bold text-brand-purple">Present Continuous:</Label><Input value={answers.continuous} onChange={e => setAnswers(p => ({...p, continuous: e.target.value}))} className={cn(validation.continuous === 'correct' ? 'border-green-500' : validation.continuous === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!completedMap[currentIndex]} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class12Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(timeExpressionsData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(timeExpressionsData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Time Expressions)', icon: Clock, status: 'active' },
        { key: 'grammar', name: 'Grammar 1 (Present Continuous)', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar_rules', name: 'Grammar 2 (Rules)', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar 3', icon: GraduationCap, status: 'locked' },
        { key: 'ex7', name: 'Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: 'Exercise 8', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex9', name: 'Exercise 9', icon: PenSquare, status: 'locked' },
        { key: 'final_ex', name: 'Final Exercise', icon: CheckCircle, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar', 'grammar_rules', 'grammar3'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(t => ({ ...t }));
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
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const s = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => (s as any)[t.key] = t.status);
        if (JSON.stringify(s) !== JSON.stringify(studentProfile?.lessonProgress?.[progressStorageVersion])) {
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let win = false; let next: string | null = null;
            const np = curr.map(t => ({ ...t }));
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { np[i + 1].status = 'active'; win = true; next = np[i + 1].key; }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Time Expressions</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-2">{timeExpressionsData.map((v, i) => (<React.Fragment key={i}><div className="p-2 border rounded bg-muted/10">{v.spanish}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} className={cn(vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} /></React.Fragment>))}</div></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4"><Button onClick={() => { let ok = false; const nv = timeExpressionsData.map((v, i) => { const cor = v.english.some(e => e.toUpperCase() === vocabAnswers[i].trim().toUpperCase()); if (cor) ok = true; return cor ? 'correct' : 'incorrect'; }); setVocabValidation(nv); setCanAdvanceVocab(ok); if (ok) toast({ title: "¡Bien hecho!" }); }}>Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">PRESENT CONTINUOUS</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-black dark:text-white font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-4 uppercase tracking-tighter">¿Qué es?</p>
                                <p className="mb-4">Se usa para hablar de acciones que están ocurriendo en este preciso momento. </p>
                                <p>  <span className="text-green-500 underline">obligatorio = </span> utilizar el verbo <span className="font-black">To be</span> (am, is, are).</p>
                                <br/>
                                <div className="bg-muted/50 p-4 rounded-xl border font-mono">
                                    <p className="text-primary font-black uppercase text-sm mb-2">Estructura Básica:</p>
                                    <p>(+) Pronoun + To be + Verb-ING</p>
                                    <p>(-) Pronoun + To be + NOT + Verb-ING</p>
                                    <p>(?) To be + Pronoun + Verb-ING ?</p>
                                    <p>(+A) Yes, Pronoun + To be</p>
                                    <p>(-A) No, Pronoun + To be + NOT</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <SimpleTranslationExercise exerciseKey="c12_ex1_updated" prompts={ex1Prompts} course="a1" onComplete={() => handleTopicComplete('ex1')} vocabulary={ex1Vocab} highlightVocabulary={true} />;
            case 'grammar_rules':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">REGLAS DE ORTOGRAFÍA "ING"</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-black dark:text-white">
                            <Accordion type="multiple" className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger className="font-bold">1. Verbos terminados en "E"</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Remover la "e" y agregar <span className="font-bold">ING</span>.</p>
                                        <p className="font-mono bg-muted p-2 rounded">Take &rarr; Taking</p>
                                        <div className="text-green-500 font-bold text-sm">Excepciones: See &rarr; Seeing / Make &rarr; Making</div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger className="font-bold">2. Verbos Monosilábicos (Cortos)</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Si termina en CVC (Consonante-Vocal-Consonante), se dobla la última letra.</p>
                                        <p className="font-mono bg-muted p-2 rounded">Stop &rarr; Stopping / Sit &rarr; Sitting / Win &rarr; Winning</p>
                                        <div className="text-green-500 font-bold text-sm">Excepción X - W - Z: Fix &rarr; Fixing / Draw &rarr; Drawing</div>
                                        <div className="text-blue-500 font-bold text-sm">Nota: Si tiene 2 vocales NO dobla: Read &rarr; Reading / Open &rarr; Opening</div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger className="font-bold">3. Verbos Bisílabos</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Acento en la 2da sílaba: Dobla consonante (Begin &rarr; Beginning / Prefer &rarr; Preferring).</p>
                                        <p>Acento en la 1ra sílaba: NO dobla (Visit &rarr; Visiting).</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger className="font-bold">4. Verbos terminados en "Y"</AccordionTrigger>
                                    <AccordionContent>No hay cambios: Play &rarr; Playing / Study &rarr; Studying.</AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-5">
                                    <AccordionTrigger className="font-bold">5. Verbos terminados en "IE"</AccordionTrigger>
                                    <AccordionContent>Cambiamos por Y + ING: Die &rarr; Dying.</AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-6">
                                    <AccordionTrigger className="font-bold">6. British vs American</AccordionTrigger>
                                    <AccordionContent>British: Travelling / American: Traveling.</AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_rules')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c12_ex2" course="a1" onComplete={() => handleTopicComplete('ex2')} />;
            case 'create1': 
                return <ManualGradingExercise 
                    title="INVENTA 2 FRASES AFIRMATIVAS - 2 NEGATIVAS Y 2 INTERROGATIVAS" 
                    description="Crea tus propias frases usando Presente Continuo." 
                    onComplete={() => handleTopicComplete('create1')} 
                    studentDocRef={studentDocRef} 
                    isAdmin={isAdmin} 
                    initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1} 
                    initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Grades} 
                    savePath={`lessonProgress.${progressStorageVersion}.create1`} 
                    savePathGrades={`lessonProgress.${progressStorageVersion}.create1Grades`} 
                />;

           
            case 'ex3': return <TripleLineTranslationExercise title="Exercise 3: Short Answers" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={ex3Vocab} />;
            case 'ex4': return <SimpleVsContinuousExercise prompts={ex4Prompts} onComplete={() => handleTopicComplete('ex4')} vocabulary={ex4Vocab} />;
            case 'ex5': return <SimpleTranslationExercise exerciseKey="c12_ex5" course="a1" onComplete={() => handleTopicComplete('ex5')} title="Exercise 5" />;
            case 'ex6': return <SimpleTranslationExercise exerciseKey="c12_ex6" course="a1" onComplete={() => handleTopicComplete('ex6')} title="Exercise 6" />;
            case 'grammar3': return <Card className="p-6"><CardTitle>GRAMMAR 3</CardTitle><CardContent className='pt-4'><p>Contenido gramatical próximamente.</p></CardContent><CardFooter><Button onClick={() => handleTopicComplete('grammar3')}>Avanzar</Button></CardFooter></Card>;
            case 'ex7': return <SimpleTranslationExercise exerciseKey="c12_ex7" course="a1" onComplete={() => handleTopicComplete('ex7')} title="Exercise 7" />;
            case 'ex8': return <SimpleTranslationExercise exerciseKey="c12_ex8" course="a1" onComplete={() => handleTopicComplete('ex8')} title="Exercise 8" />;
            case 'vocab_game': return <VocabularyMatchingGame data={timeExpressionsData.map(v => ({ spanish: v.spanish, english: v.english }))} onComplete={() => handleTopicComplete('vocab_game')} title="Vocab Game" />;
            case 'ex9': return <SimpleTranslationExercise exerciseKey="c12_ex9" course="a1" onComplete={() => handleTopicComplete('ex9')} title="Exercise 9" />;
            case 'final_ex': return <Card className="p-12 text-center"><Trophy className="h-20 w-20 mx-auto text-yellow-400" /><h2 className="text-3xl font-bold mt-4">Congratulations!</h2><p className="text-muted-foreground mt-2">Has completado la Clase 12.</p><Button onClick={() => handleTopicComplete('final_ex')} className="mt-8">Finalizar</Button></Card>;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/3" className="hover:underline text-sm font-bold text-primary">Volver a la Unidad 3</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 12 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle className='text-foreground'>Ruta</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => (
                                            <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
                                                <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <ICONS_MAP.active className="h-5 w-5" />}<span>{item.name}</span></div>
                                            </li>
                                        ))}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 text-foreground"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-2" /></div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
