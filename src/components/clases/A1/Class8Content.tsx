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
    Info, 
    Mic, 
    Loader2, 
    Gamepad2, 
    Pencil, 
    ArrowRight, 
    Check, 
    X, 
    BookText, 
    Star, 
    ArrowLeft,
    Activity,
    Clock,
    HelpCircle,
    Trophy
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a1_eng_u2_c8_v40_final_stable';
const mainProgressKey = 'progress_a1_eng_unit_2_class_8';

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

const vocabularyData = [
    { spanish: 'ESTE/A', english: 'THIS' },
    { spanish: 'ESTOS/AS', english: 'THESE' },
    { spanish: 'ESE/A', english: 'THAT' },
    { spanish: 'ESOS/AS', english: 'THOSE' },
    { spanish: 'PERO', english: 'BUT' },
    { spanish: 'MIENTRAS', english: 'WHILE' },
    { spanish: 'ENTONCES', english: 'SO' },
    { spanish: 'LUEGO', english: 'THEN' },
    { spanish: 'ALREDEDOR', english: 'AROUND' },
    { spanish: 'MEDIA NOCHE', english: 'MIDNIGHT' },
    { spanish: 'MEDIO DIA', english: 'NOON' },
    { spanish: 'DESDE', english: 'FROM' },
    { spanish: 'TAMBIÉN', english: 'ALSO' },
    { spanish: 'ACERCA DE', english: 'ABOUT' },
    { spanish: 'CADA', english: 'EVERY' },
    { spanish: 'CASI', english: 'ALMOST' },
];

const ex1Prompts = [
    { spanish: "¿ELLOS VAN A LA ESCUELA?", answer: ["do they go to school?"] },
    { spanish: "¿ESTAS ENOJADO (ANGRY)?", answer: ["are you angry?"] },
    { spanish: "ELLA NO ESTUDIA ALEMAN (GERMAN)- POR EL CONTRARIO, ELLA ESTUDIA INGLES", answer: ["she does not study german - on the contrary, she studies english", "she doesn't study german - on the contrary, she studies english"] },
    { spanish: "A ELLA LE GUSTA LA CARNE (MEAT)- POR OTRO LADO, SU ESPOSO ES VEGETARIANO", answer: ["she likes meat - on the other hand, her husband is a vegetarian", "she likes meat - on the other hand, her husband is vegetarian"] },
    { spanish: "¿ELLA ES TU HERMANA?", answer: ["is she your sister?"] },
    { spanish: "¿A DONDE VA TU HERMANO?", answer: ["where does your brother go?"] },
    { spanish: "ESTAS (THESE) NO SON MIS GAFAS", answer: ["these are not my glasses", "these aren't my glasses"] },
    { spanish: "¿DONDE ESTAN TUS PADRES? ESTAN EN CASA", answer: ["where are your parents? they are at home", "where are your parents? they're at home"] },
    { spanish: "¿QUE HACE TU HERMANO? EL JUEGA TENIS", answer: ["what does your brother do? he plays tennis"] },
    { spanish: "¿CUÁNDO VA SUSAN AL CINE? ELLA VA AL CINE LOS MIERCOLES", answer: ["when does susan go to the cinema? she goes to the cinema on wednesdays"] },
];

const exercise5Data: CompletionPrompt[] = [
    { parts: ["WHERE IS ", " WALLET?"], answers: ["THE"] },
    { parts: ["THEY LOVE ", " LANGUAGES"], answers: [""] },
    { parts: ["THIS IS ", " SARA'S PRESENT."], answers: [""] },
    { parts: ["THIS IS ", " JOHN'S HOUSE."], answers: [""] },
    { parts: ["THESE ARE ", " KEYS HE GAVE ME."], answers: ["THE"] },
    { parts: ["", " STRAWBERRIES ARE DELICIOUS."], answers: [""] },
    { parts: ["HE LIKES ", " SUN GLASSES."], answers: [""] },
    { parts: ["WHERE ARE ", " SHOES?"], answers: ["THE"] },
    { parts: ["I DO NOT LIKE ", " SUNNY DAYS."], answers: [""] },
    { parts: ["HE ISN'T ", " ANTHONY'S HOUSE."], answers: [""] },
    { parts: ["", " DOOR OF MY HOUSE."], answers: ["THE"] },
    { parts: ["SHE WORKS WITH ", " ENGINEER."], answers: [""] },
];

const ex1Vocab = { "tarde": "late", "llegar": "arrive", "escuela": "school", "supermercado": "supermarket", "clima": "weather", "verano": "summer", "regar": "water", "jardín": "garden", "seco": "dry", "funciona": "works", "beber": "drink", "excursión": "hiking", "platos": "dishes", "esposo": "husband" };
const genericVocab = { "siempre": "always", "nunca": "never", "a veces": "sometimes", "a menudo": "often", "usualmente": "usually", "cansado": "tired", "trabaja": "works", "oficina": "office", "triste": "sad", "preocupada": "worried", "hospital": "hospital", "cirugía": "surgery" };
const ex4Vocab = { "universidad": "university", "guitarra": "guitar", "abuela": "grandmother", "mes": "month", "centro": "downtown", "fin de semana": "weekend", "billar": "billiards", "cartas": "cards" };
const ex5Vocab = { "iglesia": "church", "regularmente": "regularly", "nadar": "swimming", "interrumpir": "interrupting", "normalmente": "normally", "cada mañana": "every morning" };

// --- HELPER COMPONENTS ---

const RealTimeGradingExercise = ({ title, description, prompts, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades, isSupervisionMode, scrollHeight = "h-[500px]" }: any) => {
    const [lines, setLines] = useState<string[]>(Array(prompts.length).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const lastStudentDataRef = useRef<string[]>([]);

    useEffect(() => {
        if (initialLines && Array.isArray(initialLines)) {
            const newLines = [...Array(prompts.length).fill('')];
            initialLines.forEach((val: string, i: number) => { if (i < prompts.length) newLines[i] = val || ''; });
            
            if (isAdmin) {
                setLines(newLines);
            } else {
                setLines(curr => {
                    const hasLocalChange = curr.some((l, idx) => l !== lastStudentDataRef.current[idx]);
                    return hasLocalChange ? curr : newLines;
                });
            }
            lastStudentDataRef.current = newLines;
        }
    }, [initialLines, prompts.length, isAdmin]);

    useEffect(() => {
        if (initialGrades) {
            setGrades(initialGrades);
        }
    }, [initialGrades]);

    const handleLineChange = (idx: number, val: string) => {
        if (isSupervisionMode) return;
        const nl = [...lines]; nl[idx] = val; 
        setLines(nl);
        lastStudentDataRef.current = nl;
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
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className='bg-primary/5 border-b'>
                <div className='flex items-center gap-3 text-left'>
                    <div className='p-2 bg-primary/20 rounded-lg text-primary'>
                        {title.includes('DICTATION') ? <Mic className='h-6 w-6'/> : <Pencil className='h-6 w-6'/>}
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <ScrollArea className={cn(scrollHeight, "pr-4")}>
                    <div className="space-y-4">
                        {prompts.map((_: any, i: number) => {
                            const isTitle = i === 0 && (title.includes('DICTATION') || title.includes('Writing 2'));
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <span className={cn("font-bold w-12 text-right", isTitle ? "text-primary" : "text-muted-foreground")}>
                                        {isTitle ? 'TITLE' : i}.
                                    </span>
                                    <Input 
                                        value={lines[i] || ''} 
                                        onChange={e => handleLineChange(i, e.target.value)} 
                                        className={cn(
                                            "flex-1 h-10 transition-all font-medium text-foreground",
                                            grades[i] === 'correct' ? 'border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 
                                            grades[i] === 'incorrect' ? 'border-red-500 bg-red-50/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''
                                        )} 
                                        readOnly={isSupervisionMode} 
                                    />
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-8 w-8 rounded-full transition-colors", grades[i] === 'correct' ? "bg-green-500 text-white hover:bg-green-600" : "bg-muted text-muted-foreground opacity-50")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-8 w-8 rounded-full transition-colors", grades[i] === 'incorrect' ? "bg-red-500 text-white hover:bg-red-600" : "bg-muted text-muted-foreground opacity-50")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="pt-6 border-t flex justify-center">
                <Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 uppercase">
                    Avanzar <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
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
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
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

export default function Class8Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    // Priorización del ID para supervisión
    const targetStudentId = overrideStudentId || searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Estados de Vocabulario
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulary (Basic Words)', icon: BookOpen, status: 'active' },
        { key: 'dictation1', name: '2. Dictation 1', icon: Mic, status: 'locked' },
        { key: 'ex1', name: '3. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'dictation2', name: '4. Dictation 2', icon: Mic, status: 'locked' },
        { key: 'ex2', name: '5. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: '6. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '7. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex4', name: '8. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: '9. Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'writing1', name: '10. Writing 1', icon: Pencil, status: 'locked' },
        { key: 'writing2', name: '11. Writing 2', icon: Pencil, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
    };

    // Notificar actividad al entrar
    useEffect(() => {
        if (!isUserLoading && !isProfileLoading && studentDocRef && !isAdmin && !targetStudentId) {
            updateDocumentNonBlocking(studentDocRef, { lastActiveClass: 'Class 8 (A1)' });
        }
    }, [isUserLoading, isProfileLoading, studentDocRef, isAdmin, targetStudentId]);

    // ASYNC FLOW 1: Inicialización
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(topic => ({ ...topic }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for(let i=0; i < path.length; i++) { if (last && path[i].status === 'locked') path[i].status = 'active'; last = path[i].status === 'completed'; }
        }

        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.vocabValidation) setVocabValidation(d.vocabValidation);

        setLearningPath(path);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    // ASYNC FLOW 2: Persistencia
    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId || !user) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, vocabValidation };
            learningPath.forEach(t => s[t.key] = t.status);
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
            if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId, user, vocabAnswers, vocabValidation]);

    // ASYNC FLOW 3: Desbloqueos
    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active'; next = np[i + 1].key;
                }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión completada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = vocabularyData.map((v, i) => {
            const ok = v.english.toUpperCase() === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!ok) allOk = false;
            return ok ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (allOk) {
            setCanAdvanceVocab(true);
            toast({ title: "¡Perfecto!", description: "Has dominado todo el vocabulario básico." });
        } else {
            setCanAdvanceVocab(false);
            toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Algunas palabras no son correctas." });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulary: Basic Words (16)</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div>
                                    {vocabularyData.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-2 border rounded bg-white/5 font-bold flex items-center text-sm">{v.spanish}</div>
                                            <Input 
                                                value={vocabAnswers[i] || ''} 
                                                onChange={e => {
                                                    if (targetStudentId) return;
                                                    const na = [...vocabAnswers]; na[i] = e.target.value.toUpperCase();
                                                    setVocabAnswers(na);
                                                    const nv = [...vocabValidation]; nv[i] = 'unchecked';
                                                    setVocabValidation(nv);
                                                    setCanAdvanceVocab(false);
                                                }}
                                                className={cn(
                                                    "uppercase transition-all text-foreground",
                                                    vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : 
                                                    vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : ''
                                                )}
                                                autoComplete="off"
                                                readOnly={!!targetStudentId}
                                            />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary" disabled={!!targetStudentId}>Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className="ml-2 h-4 w-4"/></Button>
                        </CardFooter>
                    </Card>
                );
            case 'dictation1': 
                return <RealTimeGradingExercise title="DICTATION 1" description="Escucha a tu profesor y escribe las 23 líneas de dictado." prompts={Array(23).fill('')} onComplete={() => handleTopicComplete('dictation1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dict1Lines" storageKeyGrades="dict1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Grades} isSupervisionMode={!!targetStudentId} />;
            case 'ex1': return <BallsExercise key="ex1" title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={ex1Vocab} />;
            case 'dictation2': 
                return <RealTimeGradingExercise title="DICTATION 2" description="Escucha a tu profesor y escribe las 22 líneas de dictado." prompts={Array(22).fill('')} onComplete={() => handleTopicComplete('dictation2')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dict2Lines" storageKeyGrades="dict2Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict2Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict2Grades} isSupervisionMode={!!targetStudentId} />;
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c8_ex2" course="a1" onComplete={() => handleTopicComplete('ex2')} vocabulary={{ "mío": "mine", "tuyo": "yours", "suyo/a": "his/hers", "nuestro": "ours" }} highlightVocabulary={true} />;
            case 'ex3': return <SimpleTranslationExercise exerciseKey="c8_ex3" course="a1" onComplete={() => handleTopicComplete('ex3')} vocabulary={{ "nadar": "swim", "veloz": "fast", "comportamiento": "behavior" }} highlightVocabulary={true} />;
            case 'vocab_game': return <VocabularyMatchingGame data={vocabularyData.map(v => ({ spanish: v.spanish, english: [v.english] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory: Basic Words" />;
            case 'ex4': return <SimpleTranslationExercise exerciseKey="c8_ex4" course="a1" onComplete={() => handleTopicComplete('ex4')} vocabulary={{ "vaso": "glass", "chaqueta": "jacket", "cumpleaños": "birthday" }} highlightVocabulary={true} />;
            case 'ex5': return <SentenceCompletionExercise title="Exercise 5" description="Completa con THE o deja vacío si no es necesario." data={exercise5Data} onComplete={() => handleTopicComplete('ex5')} />;
            case 'writing1': return <CreativeWritingExercise title="Writing 1" description="About your school." prompts={[{ id: 'w1', question: 'Describe your school experience using possessives and adjectives.' }]} onComplete={() => handleTopicComplete('writing1')} studentDocRef={studentDocRef} initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1 || {}} savePath={`lessonProgress.${progressStorageVersion}.create1`} />;
            case 'writing2': 
                return <RealTimeGradingExercise title="Writing 2" description="Crea 6 frases usando los temas aprendidos hoy." prompts={Array(6).fill('')} onComplete={() => handleTopicComplete('writing2')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="writing2Lines" storageKeyGrades="writing2Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing2Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing2Grades} isSupervisionMode={!!targetStudentId} scrollHeight="h-[320px]" />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar Supervisión</Link>
                            </Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver a la Unidad 2
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                            <Activity className='h-10 w-10 text-primary' /> Class 8 (A1) 🇬🇧
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30 text-left">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 8</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span>
                                                    </div>
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
                </div>
            </main>
        </div>
    );
}
