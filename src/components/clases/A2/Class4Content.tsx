'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
    Briefcase,
    Check,
    X,
    Star,
    ArrowLeft,
    Search,
    Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u1_c4_v108_fix_refs_final';
const mainProgressKey = 'progress_a2_eng_unit_1_class_4';

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

const professionsVocab = [
    { es: "PESCADOR", en: "FISHERMAN" }, { es: "PSICOLOGO", en: "PSYCHOLOGIST" },
    { es: "BAILARIN/NA", en: "DANCER" }, { es: "ALBAÑIL", en: "BRICKLAYER" },
    { es: "VENDEDOR", en: "SALESPERSON" }, { es: "AZAFATA", en: "FLIGHT ATTENDANT" },
    { es: "POLICIA", en: "POLICEMAN" }, { es: "MESERO/A", en: "WAITER / WAITRESS" },
    { es: "GUIA TURISTICA", en: "TOUR GUIDE" }, { es: "ABOGADO", en: "LAWYER / ATTORNEY" },
    { es: "INGENIERO", en: "ENGINEER" }, { es: "MEDICO", en: "DOCTOR" },
    { es: "FOTOGRAFO", en: "PHOTOGRAPHER" }, { es: "PERIODISTA", en: "JOURNALIST" },
    { es: "ADMINISTRADOR DE EMPRESAS", en: "BUSINESS ADMINISTRATOR" }, { es: "CHEF", en: "CHEF" },
    { es: "PROFESOR", en: "TEACHER" }, { es: "ACTOR / ACTRIZ", en: "ACTOR / ACTRESS" },
    { es: "AGRICULTOR", en: "FARMER" }, { es: "CARNICERO", en: "BUTCHER" },
    { es: "DENTISTA", en: "DENTIST" }, { es: "CIRUJANO", en: "SURGEON" },
    { es: "ELECTRICISTA", en: "ELECTRICIAN" }, { es: "ENFERMERA", en: "NURSE" },
    { es: "MARINERO", en: "SAILOR" }, { es: "PANADERO", en: "BAKER" },
    { es: "HOMBRE DE NEGOCIOS", en: "BUSINESSMAN" }, { es: "PELUQUERO", en: "HAIRDRESSER" },
    { es: "POLITICO", en: "POLITICIAN" }
];

const ex1Prompts = [
    { spanish: "ESTOY MUY CANSADO PORQUE TRABAJE AYER", answer: ["i am very tired because i worked yesterday", "i'm very tired because i worked yesterday"] },
    { spanish: "ELLA ESTÁ MUY FELIZ (SO)", answer: ["she is so happy", "she's so happy"] },
    { spanish: "ESTAS DEMASIADO OCUPADO (TOO)", answer: ["you are too busy", "you're too busy"] },
    { spanish: "ELLA ES MUY DIVERTIDA (SO)", answer: ["she is so funny", "she's so funny"] },
    { spanish: "EL ESTÁ MUY PREOCUPADO EN LA CASA DE SU HERMANA (SO)", answer: ["he is so worried in his sister's house", "he is so worried at his sister's house"] },
    { spanish: "ELLOS SON MUY ALTOS COMO SUS PADRES (VERY)", answer: ["they are very tall like their parents"] },
    { spanish: "ÉL ES MUY INTERESANTE, YO QUIERO CONOCERLO (VERY)", answer: ["he is very interesting, i want to meet him", "he's very interesting, i want to meet him"] },
    { spanish: "ELLOS ESTAN DE VERDAD PREOCUPADOS POR SU PADRE (REALLY)", answer: ["they are really worried about their father", "they're really worried about their father"] },
    { spanish: "¿ESTAS REALMENTE OCUPADO LOS SABADOS EN LA MAÑANA? (REALLY)", answer: ["are you really busy on saturday mornings?", "are you really busy on saturdays in the morning?"] },
    { spanish: "ESTO ES DEMASIADO CARO PARA MI, NO PUEDO COMPRARLO (TOO)", answer: ["this is too expensive for me, i cannot buy it", "this is too expensive for me, i can't buy it"] },
    { spanish: "ESE COMPUTADOR ES DEMASIADO BARATO, YO LO QUIERO (TOO)", answer: ["that computer is too cheap, i want it"] },
    { spanish: "EL ESTA BASTANTE NERVIOSO (PRETTY / QUITE)", answer: ["he is pretty nervous", "he is quite nervous", "he's pretty nervous", "he's quite nervous"] },
    { spanish: "ELLOS ESTÁN BASTANTE FELICES PORQUE GANARON LA LOTERIA (PRETTY / QUITE)", answer: ["they are pretty happy because they won the lottery", "they are quite happy because they won the lottery"] },
    { spanish: "EL TRANSPORTE DESDE EL AEROPUERTO HASTA EL APARTAMENTO ES LO JUSTO DE FÁCIL (FAIRLY)", answer: ["the transport from the airport to the apartment is fairly easy"] },
    { spanish: "EL ES EXTREMADAMENTE ESTRICTO (EXTREMELY)", answer: ["he is extremely strict", "he's extremely strict"] },
    { spanish: "NOSOTROS SOMOS EXTREMADAMENTE ORDENADOS (EXTREMELY)", answer: ["we are extremely tidy", "we're extremely tidy"] },
    { spanish: "ESTOY TOTALMENTE SATISFECHO (TOTALLY)", answer: ["i am totally satisfied", "i'm totally satisfied"] },
    { spanish: "ÉL ESTÁ TOTALMENTE LOCO (TOTALLY)", answer: ["he is totally crazy", "he's totally crazy"] },
    { spanish: "EL ESTA UN POQUITO PREOCUPADO PORQUE SU ESPOSA NO LLEGA A CASA A TIEMPO (A LITTLE)", answer: ["he is a little worried because his wife does not arrive home on time", "he's a little worried because his wife doesn't arrive home on time"] },
    { spanish: "ELLA ESTÁ UN POQUITO TRISTE PORQUE SU HIJO NO CONTESTA EL TELEFONO (A LITTLE)", answer: ["she is a little sad because her son does not answer the phone", "she is a little sad because her son doesn't answer the phone"] },
];

const ex2Prompts = [
    { spanish: "BOGOTA ES DEMASIADO GRANDE (TOO)", answer: ["bogota is too big"] },
    { spanish: "NOSOTROS ESTAMOS UN POQUITO CANSADOS (A LITTLE) DESPUES DEL VIAJE", answer: ["we are a little tired after the trip", "we're a little tired after the trip"] },
    { spanish: "TU ERES EXTREMADAMENTE RARO-EXTRAÑO", answer: ["you are extremely strange", "you are extremely weird", "you're extremely strange", "you're extremely weird"] },
];

const ex3Prompts = [
    { spanish: "ESTA CASA ES DEMASIADO GRANDE PARA ELLOS, ELLOS NECESITAN UNA CASA PEQUEÑA", answer: ["this house is too big for them, they need a small house"] },
    { spanish: "¿COLOMBIA ES BASTANTE CALIENTE? – NO, DEPENDE DE LA CIUDAD", answer: ["is colombia pretty hot? - no, it depends on the city", "is colombia quite hot? - no, it depends on the city"] },
    { spanish: "ELLA ESTA EXTREMADAMENTE CANSADA PORQUE ELLA NO TIENE VACACIONES DESDE OCTUBRE", answer: ["she is extremely tired because she does not have vacations since october", "she's extremely tired because she doesn't have vacations since october"] },
];

const readingContent = {
    title: "The Professional Couple",
    text: `Mr. Miller is a very famous surgeon. He works in a big hospital in Chicago. He is usually extremely busy because he has many surgeries every day. 

His wife, Mrs. Miller, is a fairly successful lawyer. They are a very professional couple. 

Tomorrow, they will travel to Europe for a medical conference. Mr. Miller is so excited about the trip, but he is a little worried about the long flight. He usually feels pretty tired after flying.`,
    questions: [
        { id: 'q1', question: "What is Mr. Miller's profession?", answers: ["surgeon", "he is a surgeon"] },
        { id: 'q2', question: "How busy is he?", answers: ["extremely busy", "he is extremely busy"] },
        { id: 'q3', question: "What does Mrs. Miller do?", answers: ["lawyer", "she is a lawyer", "she's a lawyer"] },
        { id: 'q4', question: "How does Mr. Miller feel about the trip?", answers: ["so excited", "he is so excited", "he is a little worried"] }
    ]
};

const genericVocab = { "cansado": "tired", "ayer": "worked yesterday", "feliz": "happy", "ocupado": "busy", "divertida": "funny", "preocupado": "worried", "altos": "tall", "padres": "parents", "interesante": "interesting", "conocerlo": "meet him", "caro": "expensive", "barato": "cheap", "lotería": "lottery", "lo justo": "fairly", "estricto": "strict", "ordenados": "tidy", "satisfecho": "satisfied", "viaje": "trip" };
const ex2VocabHelp = { "demasiado": "too", "grande": "big", "un poquito": "a little", "cansados": "tired", "después": "after", "viaje": "trip", "extremadamente": "extremely", "raro / extraño": "strange / weird" };

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, type = 'translate' }: any) => {
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
                                                <Fragment key={es}>
                                                    <span className="text-muted-foreground capitalize">{es}:</span>
                                                    <span className="font-semibold text-right">{en}</span>
                                                </Fragment>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {currentPrompt.spanish}
                </div>
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

const ManualGradingExercise = ({ title, description, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades, lineCount = 30, isSupervisionMode = false }: any) => {
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});

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

    const handleToggleGrade = (idx: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const newGrades = { ...grades }; newGrades[idx] = newGrades[idx] === type ? null : type; setGrades(newGrades);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: newGrades });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className='bg-primary/5 border-b text-left'><CardTitle className='uppercase tracking-tighter'>{title}</CardTitle><CardDescription className='font-bold text-foreground'>{description}</CardDescription></CardHeader>
            <CardContent className="p-6 text-left">
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                        {lines.map((line, i) => {
                            const isTitle = i === 0;
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="font-bold w-12 text-right text-muted-foreground">{isTitle ? 'TITLE' : i}.</span>
                                    <Input value={line} onChange={e => handleLineChange(i, e.target.value)} className={cn("flex-1 h-10 transition-all font-medium", grades[i] === 'correct' ? 'border-green-500 bg-green-500/10' : grades[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={isSupervisionMode} />
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-8 w-8 rounded-full", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-8 w-8 rounded-full", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 uppercase">Avanzar <ArrowRight className="ml-2 h-6 w-6" /></Button></CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class4Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = overrideStudentId || searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const hasInitialized = useRef(false);

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(professionsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(professionsVocab.length).fill('unchecked'));
    const [qDictAns, setQDictAns] = useState<string[]>(Array(3).fill(''));
    const [create1Text, setCreate1Text] = useState('');
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary_professions', name: '1. Vocabulary (Professions)', icon: Briefcase, status: 'active' },
        { key: 'grammar_adverbs', name: '2. Grammar (Adverbs)', icon: GraduationCap, status: 'locked' },
        { key: 'exercise_1', name: '3. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '4. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'dictation_1', name: '5. Dictation 1', icon: Mic, status: 'locked' },
        { key: 'questions_dict1', name: '6. Questions about Dict1', icon: HelpCircle, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '8. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'create_1', name: '9. Create 1', icon: Pencil, status: 'locked' },
        { key: 'reading', name: '10. Reading', icon: BookText, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => { setTopicToComplete(completedKey); }, []);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar_adverbs') handleTopicComplete(topicKey);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        let p = initialLearningPath.map(t => ({ ...t }));
        p.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
        if (isAdmin && !overrideStudentId) p.forEach(t => (t as any).status = 'completed');
        let last = true;
        for(let i=0; i < p.length; i++) { if (last && (p[i] as any).status === 'locked') (p[i] as any).status = 'active'; last = (p[i] as any).status === 'completed'; }
        
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.qDictAns) setQDictAns(d.qDictAns);
        if (d.create1Text) setCreate1Text(d.create1Text);
        if (d.readAns) setReadAns(d.readAns);
        
        setLearningPath(p as Topic[]); 
        setSelectedTopic(d.lastSelectedTopic || p.find(it => it.status === 'active')?.key || p[0].key);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, overrideStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || overrideStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, qDictAns, create1Text, readAns };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, vocabAnswers, qDictAns, create1Text, readAns, overrideStudentId]);

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

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = professionsVocab.map((v, i) => {
            const res = v.en === (vocabAnswers[i] || '').trim().toUpperCase();
            if (res) okCount++;
            return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (okCount === professionsVocab.length) {
            toast({ title: "¡Perfecto!", description: "Has dominado todo el vocabulario." });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: `Te faltan ${professionsVocab.length - okCount} profesiones.` });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary_professions':
                const allCorrect = vocabValidation.length > 0 && vocabValidation.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>LEXICO: PROFESIONES</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-4">
                            {professionsVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-2 border rounded font-bold text-sm bg-white/5">{v.es}</div>
                                    <Input 
                                        value={vocabAnswers[i] || ''} 
                                        onChange={e => { if (overrideStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} 
                                        className={cn("uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                        readOnly={!!overrideStudentId} 
                                        autoComplete="off"
                                    />
                                </Fragment>
                            ))}
                        </div></CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleVocabCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary_professions')} disabled={!allCorrect && !isAdmin} className='text-white font-bold'>Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar_adverbs':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR: ADVERBS BEFORE ADJECTIVES</CardTitle></CardHeader>
                            <CardContent className="space-y-8 font-bold">
                                <div className="p-6 bg-white/50 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4">¿Qué son los Adjetivos?</h3>
                                    <p className="text-lg mb-4">Los adjetivos se usan para describir sustantivos (color, apariencia física, calidad, personalidad).</p>
                                    <div className="p-4 bg-primary/10 rounded-xl border-2 border-primary text-center font-mono text-2xl uppercase">ADVERB + ADJECTIVE</div>
                                </div>
                                <div className="p-6 bg-white/50 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                    <h3 className="text-xl font-black text-primary uppercase mb-4">La Intensidad de la Acción</h3>
                                    <p className="mb-4">Los adverbios pueden expresar fuerza o debilidad. Los usamos ANTES de un adjetivo para modificar su intensidad.</p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 border rounded bg-green-500/10"><p className="text-green-600">STRENGTH (FUERZA):</p> VERY, EXTREMELY, TOTALLY, TOO.</div>
                                        <div className="p-3 border rounded bg-yellow-500/10"><p className="text-yellow-600">WEAKNESS (DEBILIDAD):</p> A LITTLE, FAIRLY.</div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_adverbs')} size="lg" className="px-16 font-bold h-12 uppercase">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'exercise_1': return <BallsExercise title="Exercise 1: Adverbs Mixed" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={genericVocab} />;
            case 'exercise_2': return <BallsExercise title="Exercise 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={ex2VocabHelp} />;
            case 'dictation_1': return <ManualGradingExercise title="DICTATION 1" description="Escucha a tu profesor y escribe los 30 renglones. El primer renglón es para el Título." onComplete={() => handleTopicComplete('dictation_1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dict1Lines" storageKeyGrades="dict1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Grades} isSupervisionMode={!!overrideStudentId} />;
            case 'questions_dict1':
                const qds = ["DO YOU LIKE THE CULTURE MIXING? WHY?", "WOULD YOU LIKE TO LIVE IN ASTORIA? WHY?", "DO YOU KNOW A NEIGHBORHOOD THAT IS SIMILAR TO ASTORIA? DESCRIBE IT"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Questions about Dictation</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {qds.map((q, i) => (
                                <div key={i} className="space-y-2">
                                    <Label className="font-bold text-primary">{i + 1}. {q}</Label>
                                    <Input value={qDictAns[i] || ''} onChange={e => { if (overrideStudentId) return; const na = [...qDictAns]; na[i] = e.target.value; setQDictAns(na); }} readOnly={!!overrideStudentId} autoComplete="off" />
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('questions_dict1')} size="lg" className="px-16 font-bold h-14">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'vocab_game': return <VocabularyMatchingGame data={professionsVocab.slice(0, 12).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Professions Memory" />;
            case 'exercise_3': return <BallsExercise title="Exercise 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={{"más pequeña": "smaller", "caliente": "hot", "vacaciones": "vacations", "desde": "since"}} />;
            case 'create_1':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Create 1: Daily Routine</CardTitle><CardDescription className="text-lg font-bold text-foreground">WHAT DO YOU IN A NORMAL DAY DURING THE WEEK? WHAT TIME DO YOU GET UP? WHAT DO YOU DO AFTER HAVING BREAKFAST? WHAT DO YOU NORMALLY DO IN THE AFTERNOON? WHAT DO YOU DO AFTER YOU FINISH YOUR JOB? – WHAT DO YOU DO AT NIGHT?</CardDescription></CardHeader>
                        <CardContent><textarea value={create1Text} onChange={(e) => { if (!overrideStudentId) setCreate1Text(e.target.value); }} readOnly={!!overrideStudentId} className="w-full min-h-[250px] p-4 rounded-xl border bg-background text-lg" placeholder="Escribe tu rutina aquí..."/></CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('create_1')} size="lg" className="px-20 font-bold h-14">Terminar Escritura</Button></CardFooter>
                    </Card>
                );
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingContent.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner whitespace-pre-wrap">{readingContent.text}</div>
                            <Separator /><div className="space-y-4">{readingContent.questions.map(q => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold'>{q.question}</Label>
                                <Input value={readAns[q.id] || ''} onChange={e => { if (overrideStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} readOnly={!!overrideStudentId} className={cn('mt-1 text-lg h-12', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6"><Button onClick={() => {
                            let ok = true; const nv: any = {};
                            readingContent.questions.forEach(q => {
                                const ans = (readAns[q.id] || '').trim().toLowerCase();
                                const isOk = q.answers.some(a => ans.includes(a.toLowerCase()));
                                nv[q.id] = isOk ? 'correct' : 'incorrect'; if (!isOk) ok = false;
                            });
                            setReadVal(nv); if (ok) handleTopicComplete('reading');
                            else toast({ variant: 'destructive', title: "Revisa las respuestas de lectura" });
                        }} size="lg" className="px-12 font-bold" disabled={!!overrideStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            {isAdmin && overrideStudentId && (
                <div className="col-span-12 mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p></div>
                    <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10"><Link href="/admin">Cerrar</Link></Button>
                </div>
            )}
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 4A</CardTitle>
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
