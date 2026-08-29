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
    CheckCircle, 
    Mic, 
    Loader2, 
    ArrowRight, 
    Check, 
    X, 
    BookText, 
    Star, 
    ArrowLeft,
    Trophy,
    Pencil,
    Gamepad2,
    Clock,
    Book,
    Square,
    Info
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
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
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a1_eng_u2_c8_v315_final_icon_fix';
const mainProgressKey = 'progress_a1_eng_unit_2_class_8';

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
    { spanish: "¿ELLOS VAN A LA ESCUELA?", answer: ["do they go to school?" , "do they go to the school?"] },
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
    { parts: ["SHE WORKS WITH ", " ENGINEER."], answers: ["THE"] },
];

const ex1VocabHelp = { "tarde": "late", "llegar": "arrive", "escuela": "school", "supermercado": "supermarket", "clima": "weather", "verano": "summer", "regar": "water", "jardín": "garden", "seco": "dry", "funciona": "works", "beber": "drink", "excursión": "hiking", "platos": "dishes", "esposo": "husband" , "por el contrario": "on the contrary", "vegetariano": "vegetarian" };
const genericVocabHelp = { "siempre": "always", "nunca": "never", "a veces": "sometimes", "a menudo": "often", "usualmente": "usually", "cansado": "tired", "trabaja": "works", "oficina": "office", "triste": "sad", "preocupada": "worried", "hospital": "hospital", "cirugía": "surgery" };

// --- HELPERS ---

const RealTimeGradingExercise = ({ title, description, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades, sections, isSupervisionMode, lineCount = 30, customHeight = "h-[600px]" }: any) => {
    const { toast } = useToast();
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | 'blue' | 'darkgreen' | null>>(initialGrades || {});
    const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

    useEffect(() => {
        if (!hasLoadedInitial && initialLines && Array.isArray(initialLines)) {
            const newLines = [...Array(lineCount).fill('')];
            initialLines.forEach((val: string, i: number) => { if (i < lineCount) newLines[i] = val || ''; });
            setLines(newLines);
            setHasLoadedInitial(true);
        } else if (!hasLoadedInitial && !isSupervisionMode) {
            setHasLoadedInitial(true);
        }
    }, [initialLines, lineCount, hasLoadedInitial, isSupervisionMode]);

    useEffect(() => {
        if (isSupervisionMode && initialLines && Array.isArray(initialLines)) {
            const remoteLines = [...Array(lineCount).fill('')];
            initialLines.forEach((val: string, i: number) => { if (i < lineCount) remoteLines[i] = val || ''; });
            setLines(remoteLines);
        }
    }, [initialLines, isSupervisionMode, lineCount]);

    useEffect(() => {
        if (initialGrades) setGrades(initialGrades);
    }, [initialGrades]);

    const handleLineChange = (idx: number, val: string) => {
        if (isSupervisionMode) return;
        const nl = [...lines]; nl[idx] = val; setLines(nl);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: nl });
    };

    const handleToggleGrade = (idx: number, type: 'correct' | 'incorrect' | 'blue' | 'darkgreen') => {
        if (!isAdmin) return;
        const newGrades = { ...grades }; 
        newGrades[idx] = newGrades[idx] === type ? null : type; 
        setGrades(newGrades);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: newGrades });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className='bg-primary/5 border-b'>
                <div className='flex items-center gap-3 text-left text-foreground'>
                    <div className='p-2 bg-primary/20 rounded-lg text-primary'>
                        {title.includes('DICTATION') ? <Mic className='h-6 w-6'/> : <Pencil className='h-6 w-6'/>}
                    </div>
                    <div>
                        <CardTitle className="text-foreground">{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 text-left">
                <ScrollArea className={cn(customHeight, "pr-4")}>
                    <div className="space-y-4">
                        {lines.map((line, i) => (
                            <Fragment key={i}>
                                {sections && sections[i] && (
                                    <div className="py-4 bg-muted/50 rounded-lg text-center font-black text-primary uppercase border-y my-4">{sections[i]}</div>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className="font-bold w-10 text-right text-muted-foreground">{i === 0 && title.includes('DICTATION') ? 'TITLE' : i}.</span>
                                    <Input 
                                        value={line || ''} 
                                        onChange={e => handleLineChange(i, e.target.value)} 
                                        className={cn(
                                            "flex-1 h-10 transition-all font-medium text-foreground",
                                            grades[i] === 'correct' ? 'border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 
                                            grades[i] === 'incorrect' ? 'border-red-500 bg-red-50/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 
                                            grades[i] === 'blue' ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
                                            grades[i] === 'darkgreen' ? 'border-green-800 bg-green-800/10 shadow-[0_0_10px_rgba(22,101,52,0.2)]' : ''
                                        )} 
                                        readOnly={isSupervisionMode} 
                                        autoComplete="off"
                                    />
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-7 w-7 rounded-full transition-colors", grades[i] === 'correct' ? "bg-green-500 text-white hover:bg-green-600" : "bg-muted text-muted-foreground opacity-50")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-7 w-7 rounded-full transition-colors", grades[i] === 'incorrect' ? "bg-red-500 text-white hover:bg-red-600" : "bg-muted text-muted-foreground opacity-50")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                                        {/* Azul con icono Info */}
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'blue')} title="Observación" className={cn("h-7 w-7 rounded-full transition-colors", grades[i] === 'blue' ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-muted text-muted-foreground opacity-50")} disabled={!isAdmin}><Info className="h-4 w-4"/></Button>
                                        {/* Verde Oscuro con icono Trophy */}
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'darkgreen')} title="Excelente" className={cn("h-7 w-7 rounded-full transition-colors", grades[i] === 'darkgreen' ? "bg-green-900 text-white hover:bg-green-950" : "bg-muted text-muted-foreground opacity-50")} disabled={!isAdmin}><Trophy className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            </Fragment>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="pt-6 border-t flex justify-center">
                <Button onClick={onComplete} size="lg" className="px-16 font-black h-14 uppercase">
                    {title.includes('2') || title.includes('DICTATION 2') ? 'Finish' : 'Continue'} <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
            </CardFooter>
        </Card>
    );
};

const BallsExerciseInternal = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleInputChange = (val: string) => {
        setUserAnswers(prev => ({ ...prev, [currentIndex]: val }));
        if (status[currentIndex] !== 'unchecked') {
            setStatus(prev => ({ ...prev, [currentIndex]: 'unchecked' }));
        }
    };

    const handleCheck = () => {
        const newStatus: Record<number, 'correct' | 'incorrect' | 'unchecked'> = {};
        let allOk = true;

        prompts.forEach((prompt: any, i: number) => {
            const userVal = (userAnswers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const isOk = prompt.answer.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
            newStatus[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });

        setStatus(newStatus);
        if (allOk) {
            toast({ title: "¡Perfecto!", description: "Has completado todas las frases correctamente." });
            onComplete();
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Algunas frases tienen errores." });
        }
    };

    const isLast = currentIndex === prompts.length - 1;

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
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
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
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
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex].spanish}
                </div>
                <Input value={userAnswers[currentIndex] || ''} onChange={e => handleInputChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && !isLast && setCurrentIndex(i => i + 1)} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu traducción..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {isLast ? (
                        <Button onClick={handleCheck} variant="secondary" className='font-bold px-8'>Verificar</Button>
                    ) : (
                        <Button onClick={() => setCurrentIndex(i => i + 1)} className="text-white font-bold">Siguiente</Button>
                    )}
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
    const [isClassFinished, setIsClassFinished] = useState(false);
    const hasInitialized = useRef(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo(() => [
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

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;
        
        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile?.lessonProgress?.[progressStorageVersion] || {};
        
        if (isAdmin && !targetStudentId) {
            path.forEach(t => t.status = 'completed');
        } else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        }

        setLearningPath(path as Topic[]); 
        setSelectedTopic(d.lastSelectedTopic || path.find(it => it.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.vocabValidation) setVocabValidation(d.vocabValidation);
        
        setInitialLoadComplete(true);
        hasInitialized.current = true;
        setIsInitialLoading(false);
    }, [isProfileLoading, isUserLoading, studentProfile, isAdmin, initialPathData, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId || !user) return;
        
        const saveTimer = setTimeout(() => {
            const updates: any = {};
            updates[`lessonProgress.${progressStorageVersion}.lastSelectedTopic`] = selectedTopic;
            updates[`lessonProgress.${progressStorageVersion}.vocabAnswers`] = vocabAnswers;
            updates[`lessonProgress.${progressStorageVersion}.vocabValidation`] = vocabValidation;
            
            learningPath.forEach(t => {
                updates[`lessonProgress.${progressStorageVersion}.${t.key}`] = t.status;
            });
            
            updates[`progress.${mainProgressKey}`] = progressValue;

            updateDocumentNonBlocking(studentDocRef, updates);
            if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
        }, 2000);

        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, initialLoadComplete, vocabAnswers, vocabValidation, user]);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
          
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active';
                    wasUnlocked = true;
                    nextToSelect = newPath[idx + 1].key;
                }
            }
            
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
            if (nextToSelect) {
                const finalNext = nextToSelect;
                setTimeout(() => setSelectedTopic(finalNext), 0);
            }
            return newPath as Topic[];
        });

        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = vocabularyData.map((v, i) => {
            const res = (vocabAnswers[i] || '').trim().toUpperCase() === v.english.toUpperCase();
            if (!res) allOk = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (allOk) { 
            toast({ title: "¡Vocabulario Completo!" }); 
            setCanAdvanceVocab(true);
        }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleFinishClass = () => {
        setIsClassFinished(true);
        handleTopicCompleteInternal('writing2');
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        
        if (isClassFinished) {
            return (
                <Card className="shadow-soft border-2 border-green-500 bg-green-50/10 p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500 text-foreground">
                    <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                    <h2 className="text-4xl font-black uppercase text-green-600 tracking-tighter">Congratulations!</h2>
                    <p className="text-2xl mt-4 font-bold">You finished this Class</p>
                    <p className='text-muted-foreground mt-2 text-lg'>Misión cumplida al 100%.</p>
                    <Button asChild className="mt-8 px-12 h-12 font-bold" variant="outline">
                        <Link href="/ingles/a1">Back to Course A1</Link>
                    </Button>
                </Card>
            );
        }

        switch (selectedTopic) {
            case 'vocabulary':
                const allVocabOk = vocabValidation.length > 0 && vocabValidation.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulary: Basic Words (16)</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div>
                                    {vocabularyData.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.spanish}</div>
                                            <Input 
                                                value={vocabAnswers[i] || ''} 
                                                onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} 
                                                className={cn("uppercase font-mono", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                                autoComplete="off" 
                                                readOnly={isAdmin && !!targetStudentId} 
                                            />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!allVocabOk && !isAdmin} className='text-white font-bold'>Continue</Button>
                        </CardFooter>
                    </Card>
                );
            case 'dictation1': 
                return <RealTimeGradingExercise title="DICTATION 1" description="Escucha y escribe las líneas de dictado." onComplete={() => handleTopicCompleteInternal('dictation1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dict1Lines" storageKeyGrades="dict1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Grades} isSupervisionMode={!!targetStudentId} />;
            case 'ex1': 
                return <BallsExerciseInternal title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('ex1')} vocabulary={ex1VocabHelp} />;
            case 'dictation2': 
                return <RealTimeGradingExercise title="DICTATION 2" description="Escucha y escribe las líneas de dictado." onComplete={() => handleTopicCompleteInternal('dictation2')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dict2Lines" storageKeyGrades="dict2Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict2Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict2Grades} isSupervisionMode={!!targetStudentId} />;
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c8_ex2" course="a1" onComplete={() => handleTopicCompleteInternal('ex2')} vocabulary={{ "mío": "mine", "tuyo": "yours", "suyo/a": "his/hers", "nuestro": "ours" , "celular" : "cellphone" , "cuadros" : "painting" }} highlightVocabulary={true} />;
            case 'ex3': return <SimpleTranslationExercise exerciseKey="c8_ex3" course="a1" onComplete={() => handleTopicCompleteInternal('ex3')} vocabulary={{ "nadar": "swim", "veloz": "fast", "comportamiento": "behavior" , "viaje" : "trip" , "baloncesto" : "basketball" , "correr" : "to run" , "iglesia" : "church" }} highlightVocabulary={true} />;
            case 'vocab_game': return <VocabularyMatchingGame data={vocabularyData.map(v => ({ spanish: v.spanish, english: [v.english] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Memory Game: Basic Words" />;
            case 'ex4': return <SimpleTranslationExercise exerciseKey="c8_ex4" course="a1" onComplete={() => handleTopicCompleteInternal('ex4')} vocabulary={{ "vaso": "glass", "chaqueta": "jacket", "cumpleaños": "birthday" }} highlightVocabulary={true} />;
            case 'ex5': return <SentenceCompletionExercise title="Exercise 5" description="Completa con THE o deja vacío si no es necesario." data={exercise5Data} onComplete={() => handleTopicCompleteInternal('ex5')} />;
            case 'writing1': 
                return (
                    <RealTimeGradingExercise 
                        title="WRITING 1" 
                        description="Describe your school experience using possessives and adjectives." 
                        onComplete={() => handleTopicCompleteInternal('writing1')} 
                        studentDocRef={studentDocRef} 
                        isAdmin={isAdmin} 
                        storageKeyLines="write1Lines" 
                        storageKeyGrades="write1Grades" 
                        initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.write1Lines} 
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.write1Grades} 
                        isSupervisionMode={!!targetStudentId} 
                        lineCount={6}
                        customHeight="h-[300px]"
                    />
                );
            case 'writing2': 
                return <RealTimeGradingExercise 
                    title="WRITING 2" 
                    description="Crea 6 frases usando Posesivos." 
                    onComplete={handleFinishClass} 
                    studentDocRef={studentDocRef} 
                    isAdmin={isAdmin} 
                    storageKeyLines="writing2Lines" 
                    storageKeyGrades="writing2Grades" 
                    initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing2Lines} 
                    initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing2Grades} 
                    isSupervisionMode={!!targetStudentId} 
                    lineCount={6}
                    customHeight="h-[300px]"
                />;
            default: return null;
        }
    };

    const handleTopicCompleteInternal = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar Supervisión</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver a la Unidad 2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Clock className='h-10 w-10 text-primary' /> Class 8 (A1) 🇬🇧</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 8</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
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
                                        </ul>
                                    </nav>
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
