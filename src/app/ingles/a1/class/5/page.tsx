
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, Info, CheckCircle, Loader2, ArrowRight, Mic, Check, X, Pencil, BookText } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ErrorCorrectionExercise, type ErrorCorrectionPrompt } from '@/components/kids/exercises/error-correction-exercise';
import { PresentSimpleExercise, type ExercisePrompt } from '@/components/kids/exercises/present-simple';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Class5VocabExercise } from '@/components/kids/exercises/class5-vocab-exercise';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_unit_1_class_5_v16_stable';
const mainProgressKey = 'progress_a1_eng_unit_1_class_5';

const vocabularyData = {
    verbos: [
        { spanish: 'SALTAR', english: 'JUMP' },
        { spanish: 'QUERER', english: 'WANT' },
        { spanish: 'PODER', english: 'CAN' },
        { spanish: 'DEBER', english: 'SHOULD' },
        { spanish: 'VIAJAR', english: 'TRAVEL' },
        { spanish: 'LLAMAR', english: 'CALL' },
        { spanish: 'MANEJAR', english: 'DRIVE' },
        { spanish: 'COCINAR', english: 'COOK' },
        { spanish: 'LEVANTARSE', english: 'GET UP' },
        { spanish: 'ESTAR DE PIE', english: 'STAND UP' },
        { spanish: 'DESPERTARSE', english: 'WAKE UP' },
        { spanish: 'RECIBIR', english: 'RECEIVE' },
        { spanish: 'ENVIAR', english: 'SEND' },
        { spanish: 'VIVIR', english: 'LIVE' },
        { spanish: 'TOMAR- AGARRAR', english: 'TAKE' },
        { spanish: 'ABRIR', english: 'OPEN' },
        { spanish: 'CERRAR', english: 'CLOSE' },
        { spanish: 'VENIR', english: 'COME' },
        { spanish: 'LLEGAR', english: 'ARRIVE' },
    ],
    adjetivos: [
        { spanish: 'ABURRIDO', english: 'BORED' },
        { spanish: 'CANSADO', english: 'TIRED' },
        { spanish: 'HAMBRIENTO', english: 'HUNGRY' },
        { spanish: 'ENOJADO', english: 'ANGRY' },
        { spanish: 'PREOCUPADO', english: 'WORRIED' },
        { spanish: 'SEDIENTO-CON SED', english: 'THIRSTY' },
        { spanish: 'PESADO', english: 'HEAVY' },
        { spanish: 'LIVIANO', english: 'LIGHT' },
        { spanish: 'TRISTE', english: 'SAD' },
        { spanish: 'OCUPADO', english: 'BUSY' },
    ]
};

const exercise1Data: ErrorCorrectionPrompt[] = [
    { incorrect: "SHE DONT ANSWER MY QUESTION", translationHint: "(ELLA NO CONTESTA MIS PREGUNTAS)", correctAnswers: ["she does not answer my questions", "she doesn't answer my questions"] },
    { incorrect: "WE DONT GOES TO SCHOL THE SONDAYS.", translationHint: "", correctAnswers: ["we do not go to school on sundays", "we don't go to school on sundays"] },
    { incorrect: "DOIS JOSEPH LIKES MUVIS?", translationHint: "(¿A JOSEPH LE GUSTAN LAS PELÍCULAS?)", correctAnswers: ["does joseph like movies?"] },
    { incorrect: "I DONT WORKS THERE", translationHint: "( YO NO TRABAJO ALLA)", correctAnswers: ["i do not work there", "i don't work there"] },
    { incorrect: "SHI ARE NO ROSE", translationHint: "( ELLA NO ES LUISA)", correctAnswers: ["she is not rose", "she isn't rose"] },
    { incorrect: "DOES SHE ARE YUR MOTHER?", translationHint: "(ELLA ES TU MAMA?)", correctAnswers: ["is she your mother?"] },
    { incorrect: "DO YOU TRAVELS EVERY WINTAR OR SOMER?", translationHint: "(¿VIAJAS CADA VERANO?)", correctAnswers: ["do you travel every winter or summer?"] },
    { incorrect: "DOES MARCO AND MARIA GOES THERE?", translationHint: "(¿MARCO Y MARIA VAN ALLA?)", correctAnswers: ["do marco and maria go there?"] },
    { incorrect: "MARY’S PLEY EVERY DEY", translationHint: "", correctAnswers: ["mary plays every day"] },
    { incorrect: "WHAT DO SHE DOES?", translationHint: "(QUE HACE ELLA?)", correctAnswers: ["what does she do?"] },
    { incorrect: "WHERE DOES HE GOUS?", translationHint: "(¿DONDE VA EL?)", correctAnswers: ["where does he go?"] },
    { incorrect: "WHY DOES YOU WORKS IN THE NIGTH?", translationHint: "", correctAnswers: ["why do you work at night?"] },
    { incorrect: "SHE STUDYS ITALIANO END ESPANISH.", translationHint: "(ELLA ESTUDIA ITALIANO Y ESPAÑOL)", correctAnswers: ["she studies italian and spanish"] },
    { incorrect: "THEY DON’T ARE OUR TEACHERS", translationHint: "(ELLOS NO SON NUESTROS PROFESORES)", correctAnswers: ["they are not our teachers", "they aren't our teachers"] },
    { incorrect: "DO YOU WORK ARE IN JON COMPANY?", translationHint: "(¿TRABAJAS EN LA EMPRESA DE JON?)", correctAnswers: ["do you work in jon's company?"] }
];

const class5Exercise2Data: ExercisePrompt[] = [
    { spanish: "EL BEBE LECHE", answers: { affirmative: ["he drinks milk"], negative: ["he does not drink milk", "he doesn't drink milk"], interrogative: ["does he drink milk?"] } },
    { spanish: "EL JUEGA FUTBOL CON SU HERMANO", answers: { affirmative: ["he plays soccer with his brother", "he plays football with his brother"], negative: ["he does not play soccer with his brother", "he doesn't play soccer with his brother"], interrogative: ["does he play soccer with his brother?", "does he play football with his brother?"] } },
    { spanish: "YO NADO LOS DOMINGOS", answers: { affirmative: ["i swim on sundays"], negative: ["i do not swim on sundays", "i don't swim on sundays"], interrogative: ["do i swim on sundays?"] } },
    { spanish: "TU TRABAJAS LOS SABADOS", answers: { affirmative: ["you work on saturdays"], negative: ["you do not work on saturdays", "you don't work on saturdays"], interrogative: ["do you work on saturdays?"] } },
    { spanish: "ELLA VE PELICULAS CON SU FAMILIA", answers: { affirmative: ["she watches movies with her family"], negative: ["she does not watch movies with her family", "she doesn't watch movies with her family"], interrogative: ["does she watch movies with her family?"] } },
    { spanish: "EL COME PIZZA CON SU NOVIA", answers: { affirmative: ["he eats pizza with his girlfriend"], negative: ["he does not eat pizza with his girlfriend", "he doesn't eat pizza with his girlfriend"], interrogative: ["does he eat pizza with his girlfriend?"] } },
    { spanish: "YO ESTUDIO INGLES DURANTE LA SEMANA", answers: { affirmative: ["i study english during the week"], negative: ["i do not study english during the week", "i don't study english during the week"], interrogative: ["do i study english during the week?"] } },
    { spanish: "A ELLA LE GUSTA VIAJAR", answers: { affirmative: ["she likes to travel", "she likes traveling"], negative: ["she does not like to travel", "she doesn't like to travel"], interrogative: ["does she like to travel?"] } },
    { spanish: "NOSOTROS COMPRAMOS UNA CASA", answers: { affirmative: ["we buy a house"], negative: ["we do not buy a house", "we don't buy a house"], interrogative: ["do we buy a house?"] } },
    { spanish: "ELLA COCINA PASTA", answers: { affirmative: ["she cooks pasta"], negative: ["she does not cook pasta", "she doesn't cook pasta"], interrogative: ["does she cook pasta?"] } },
    { spanish: "ELLOS SON TUS PRIMOS", answers: { affirmative: ["they are your cousins"], negative: ["they are not your cousins", "they aren't your cousins"], interrogative: ["are they your cousins?"] } },
    { spanish: "NOSOTROS VAMOS A LA ESCUELA", answers: { affirmative: ["we go to school"], negative: ["we do not go to school", "we don't go to school"], interrogative: ["do we go to school?"] } },
    { spanish: "ELLA ES SU ESPOSA (de él)", answers: { affirmative: ["she is his wife"], negative: ["she is not his wife", "she isn't his wife"], interrogative: ["is she his wife?"] } },
    { spanish: "ELLOS TRABAJAN EN LA MAÑANA", answers: { affirmative: ["they work in the morning"], negative: ["they do not work in the morning", "they don't work in the morning"], interrogative: ["do they work in the morning?"] } },
];

const class5Exercise2Vocab = {
    "leche": "milk",
    "pollo": "chicken",
    "familia": "family",
    "novia": "girlfriend",
    "durante": "during",
    "comprar": "buy",
    "pasta": "pasta",
    "esposa": "wife"
};

// --- Dictation Component ---
const DictationExercise = ({ 
    title,
    description,
    onComplete, 
    studentDocRef, 
    initialData, 
    initialGrades,
    savePath, 
    savePathGrades,
    isAdmin,
    lineCount = 21,
    customInstructions
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
                        {title.includes('DICTATION') ? <Mic className="h-6 w-6" /> : <Pencil className="h-6 w-6" />}
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {customInstructions && (
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-sm font-bold text-primary mb-4 uppercase text-center">
                        {customInstructions}
                    </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                    {lines.map((line, idx) => {
                        const status = grades[idx];
                        const isTitleLine = idx === 0 && title.includes('DICTATION');
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <span className={cn("font-bold w-8 text-right", isTitleLine ? "text-primary" : "text-muted-foreground")}>
                                    {idx + 1}.
                                </span>
                                <Input 
                                    value={line} 
                                    onChange={e => handleLineChange(idx, e.target.value)} 
                                    className={cn(
                                        "flex-1 text-lg h-10 transition-all",
                                        isTitleLine && "font-bold border-primary/50",
                                        status === 'correct' ? 'border-green-500 bg-green-50/5' : 
                                        status === 'incorrect' ? 'border-red-500 bg-red-50/5' : ''
                                    )} 
                                    placeholder={isTitleLine ? "Escribe el título aquí..." : "Escribe aquí..."}
                                    autoComplete="off" 
                                />
                                <div className="flex gap-1 shrink-0">
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => handleToggleGrade(idx, 'correct')} 
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-colors", 
                                            status === 'correct' ? "bg-green-500 text-white hover:bg-green-600" : "bg-muted text-muted-foreground opacity-50"
                                        )} 
                                        disabled={!isAdmin}
                                    >
                                        <Check className="h-4 w-4"/>
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => handleToggleGrade(idx, 'incorrect')} 
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-colors", 
                                            status === 'incorrect' ? "bg-red-500 text-white hover:bg-red-600" : "bg-muted text-muted-foreground opacity-50"
                                        )} 
                                        disabled={!isAdmin}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
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

export default function EngA1Class5Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);
    
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // State for vocabulary exercise
    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'nota-importante', name: 'Nota Importante', icon: Info, status: 'locked' },
        { key: 'ejercicio-1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'dictado-1', name: 'Dictado 1', icon: Mic, status: 'locked' },
        { key: 'crear-frases', name: 'Crear Frases', icon: Pencil, status: 'locked' },
        { key: 'ejercicio-2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-vocabulario', name: 'Ejercicio Vocabulario', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({ ...topic }));
        let savedSelectedTopic = '';

        if (isAdmin) {
          path.forEach(item => { item.status = 'completed'; });
        } else if(studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopic(savedSelectedTopic || firstActive?.key || path[0].key);

        const initAnswers: any = {};
        const initVal: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            initAnswers[cat] = Array((vocabularyData as any)[cat].length).fill('');
            initVal[cat] = Array((vocabularyData as any)[cat].length).fill('unchecked');
        });
        setVocabAnswers(initAnswers);
        setVocabValidation(initVal);

        setInitialLoadComplete(true);
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, t]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        const savedData = studentProfile?.lessonProgress?.[progressStorageVersion];
        if (JSON.stringify(statusesToSave) !== JSON.stringify(savedData)) {
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: Math.round(progressValue)
            });
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
          
            let topicFound = false;
            for (let i = 0; i < newPath.length && !topicFound; i++) {
                if (newPath[i].key === topicToComplete) {
                    if (newPath[i].status !== 'completed') newPath[i].status = 'completed';
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        newPath[i + 1].status = 'active';
                        wasUnlocked = true;
                        nextToSelect = newPath[i + 1].key;
                    }
                    topicFound = true;
                }
            }
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSelect) {
                const finalNext = nextToSelect;
                setTimeout(() => setSelectedTopic(finalNext), 0);
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast, isAdmin]);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);

        const autoViewTopics = ['nota-importante'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabChange = (cat: string, idx: number, val: string) => {
        const newAns = { ...vocabAnswers };
        newAns[cat][idx] = val;
        setVocabAnswers(newAns);
        const newVal = { ...vocabValidation };
        newVal[cat][idx] = 'unchecked';
        setVocabValidation(newVal);
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let oneCorrect = false;
        const newVal: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            newVal[cat] = (vocabularyData as any)[cat].map((item: any, idx: number) => {
                const userVal = (vocabAnswers[cat][idx] || '').trim().toUpperCase();
                const correctVal = item.english.toUpperCase();
                
                // Verificamos si es correcto el término base o con "TO " en la categoría de verbos
                let isCorrect = userVal === correctVal;
                if (cat === 'verbos' && !isCorrect) {
                    isCorrect = userVal === `TO ${correctVal}`;
                }
                
                if (isCorrect) oneCorrect = true;
                return isCorrect ? 'correct' : 'incorrect';
            });
        });
        setVocabValidation(newVal);
        if (oneCorrect) {
            toast({ title: '¡Bien hecho!' });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: 'Sigue intentando' });
        }
    };

    const getVocabClass = (cat: string, idx: number) => {
        const status = vocabValidation[cat]?.[idx];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader><CardTitle>Vocabulario</CardTitle></CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['verbos', 'adjetivos']} className="w-full">
                                {Object.keys(vocabularyData).map(cat => (
                                    <AccordionItem key={cat} value={cat}>
                                        <AccordionTrigger className="text-lg font-semibold capitalize">{cat}</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                                {(vocabularyData as any)[cat].map((word: any, index: number) => (
                                                    <React.Fragment key={`${cat}-${index}`}>
                                                        <div className="p-3 bg-card border rounded-lg flex items-center font-medium">{word.spanish}</div>
                                                        <div className="p-3 bg-card border rounded-lg flex items-center">
                                                             <Input value={vocabAnswers[cat]?.[index] || ''} onChange={e => handleVocabChange(cat, index, e.target.value)} className={cn(getVocabClass(cat, index))} autoComplete="off" />
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button onClick={handleCheckVocab}>Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'nota-importante':
                return (
                    <div className="space-y-6 text-left">
                        <h2 className="text-3xl font-black text-center text-primary uppercase tracking-tighter">Noticias Importantes 🚀</h2>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardContent className="p-6">
                                    <p className="text-lg font-bold">1- CUANDO TENEMOS DOS VERBOS JUNTOS, EN LA MITAD SE AGREGA = <span className="text-primary font-black">"TO"</span></p>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardContent className="p-6 space-y-2">
                                    <p className="text-lg font-bold uppercase tracking-tight">2- EL VERBO <span className="text-primary">"GO"</span> =</p>
                                    <ul className="list-disc pl-5 space-y-1 font-medium">
                                        <li>go to the + lugar especifico</li>
                                        <li>go + cuando no tenemos un lugar</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm border-2 border-dashed border-destructive/20">
                                <CardContent className="p-6">
                                    <p className="text-lg font-black text-destructive uppercase">3- NUNCA PERO NUNCA UNA FRASE TIENE VERBO TO BE Y DO/DOES AL MISMO TIEMPO</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardContent className="p-6 space-y-4">
                                    <p className="text-lg font-bold uppercase">4- EL GENITIVO SAJÓN NUNCA TIENE EL ARTÍCULO = <span className="text-destructive">"THE"</span> ADELANTE DE ÉL.</p>
                                    <div className="bg-background/50 p-4 rounded-xl border space-y-1 font-mono">
                                        <p className="text-sm text-muted-foreground italic">la casa de maria</p>
                                        <p className="flex items-center gap-2 text-green-600 font-bold"><Check className="h-4 w-4" /> Maria's house</p>
                                        <p className="flex items-center gap-2 text-red-500 font-bold"><X className="h-4 w-4" /> the Maria's house</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader className="pb-2"><CardTitle className="text-primary uppercase tracking-widest text-lg font-black">5- COMMON PREPOSITIONS</CardTitle></CardHeader>
                                <CardContent className="grid sm:grid-cols-3 gap-4">
                                    <div className="space-y-1 p-3 bg-background/40 rounded-xl">
                                        <p className="font-black text-primary border-b border-primary/20 pb-1">IN</p>
                                        <p className="text-sm font-medium">in the morning</p>
                                        <p className="text-sm font-medium">in the afternoon</p>
                                        <p className="text-sm font-medium">in + months</p>
                                    </div>
                                    <div className="space-y-1 p-3 bg-background/40 rounded-xl">
                                        <p className="font-black text-brand-purple border-b border-brand-purple/20 pb-1">AT</p>
                                        <p className="text-sm font-medium">at night / at work</p>
                                        <p className="text-sm font-medium">at school / home</p>
                                        <p className="text-sm font-medium">at university</p>
                                    </div>
                                    <div className="space-y-1 p-3 bg-background/40 rounded-xl">
                                        <p className="font-black text-brand-blue border-b border-brand-blue/20 pb-1">ON</p>
                                        <p className="text-sm font-medium">on + weekdays</p>
                                        <p className="text-sm font-medium">on weekend</p>
                                        <p className="text-sm font-medium">on + month + day</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader className="pb-2"><CardTitle className="text-primary uppercase tracking-widest text-lg font-black">6- DIFERENCIAS ENTRE TÚ Y TU</CardTitle></CardHeader>
                                <CardContent className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="font-bold underline decoration-primary decoration-2 underline-offset-4">TÚ = PRONOUN</p>
                                        <p className="text-sm italic">PRONOUN = TÚ + VERB</p>
                                        <p className="font-mono text-sm">tú eres = you are<br/>tú vives = you live</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-bold underline decoration-brand-purple decoration-2 underline-offset-4">TU = POSSESSIVE</p>
                                        <p className="text-sm italic">POSSESSIVE = TU + NOUN</p>
                                        <p className="font-mono text-sm">tu casa = your house<br/>tu perro = your dog</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader className="pb-2"><CardTitle className="text-primary uppercase tracking-widest text-lg font-black">7- EXPLANATION: DESDE</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="font-bold">Desde: Since {"=>"} Años / Tiempo Específico</p>
                                        <p className="text-sm italic mt-1 font-mono">i work in that company since 2022</p>
                                    </div>
                                    <Separator className="opacity-30" />
                                    <div>
                                        <p className="font-bold">Desde: From .... To / Until {"=>"} Rango</p>
                                        <p className="text-sm italic mt-1 font-mono">i work from 8 a.m until 7 p.m</p>
                                        <p className="text-sm italic font-mono">i work from 8 a.m to 7 p.m</p>
                                    </div>
                                    <Separator className="opacity-30" />
                                    <div>
                                        <p className="font-bold">de: from {"=>"} Origen</p>
                                        <p className="text-sm italic mt-1 font-mono">i am from Colombia</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader className="pb-2"><CardTitle className="text-primary uppercase tracking-widest text-lg font-black">8- ADJECTIVES (-ED vs -ING)</CardTitle></CardHeader>
                                <CardContent className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="font-bold text-brand-blue">ED = Bored (Sentimientos)</p>
                                        <p className="text-sm text-muted-foreground">La persona lo siente desde adentro.</p>
                                        <p className="font-mono text-sm bg-background/50 p-2 rounded">i'm bored / he's bored</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-bold text-brand-purple">ING = Boring (Características)</p>
                                        <p className="text-sm text-muted-foreground">Características de un sustantivo u objeto.</p>
                                        <p className="font-mono text-sm bg-background/50 p-2 rounded">he's boring / that movie is boring</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 dark:bg-slate-900/50 border-border/50 rounded-[2rem] shadow-sm">
                                <CardHeader className="pb-2"><CardTitle className="text-primary uppercase tracking-widest text-lg font-black">9- FUTURO EN INGLÉS: WILL</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="font-bold">WILL = Voluntad / Predicción</p>
                                    <div className="grid sm:grid-cols-2 gap-2 font-mono text-sm">
                                        <p className="p-2 bg-background/50 rounded">i will call you (yo llamaré)</p>
                                        <p className="p-2 bg-background/50 rounded">i will work on weekend</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-center pt-8">
                            <Button onClick={() => handleTopicComplete('nota-importante')} size="lg" className="px-16 font-bold h-14 text-xl">
                                He leído todo <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                );
            case 'ejercicio-1': return <ErrorCorrectionExercise exerciseData={exercise1Data} onComplete={() => handleTopicComplete('ejercicio-1')} title="Ejercicio 1" />;
            case 'dictado-1':
                return (
                    <DictationExercise 
                        key="dictado-1"
                        title="DICTATION 1"
                        description="Escucha y escribe las frases dictadas por tu profesor."
                        onComplete={() => handleTopicComplete('dictado-1')} 
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Grades}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation1`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.dictation1Grades`}
                        isAdmin={isAdmin}
                        lineCount={21}
                    />
                );
            case 'crear-frases':
                return (
                    <DictationExercise 
                        key="crear-frases"
                        title="Crear Frases"
                        description="Ejercicio de creación de frases."
                        customInstructions="INVENTA TRES FRASES NEGATIVAS CON TO BE- DO Y DOES."
                        onComplete={() => handleTopicComplete('crear-frases')} 
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.crear1}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.crear1Grades}
                        savePath={`lessonProgress.${progressStorageVersion}.crear1`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.crear1Grades`}
                        isAdmin={isAdmin}
                        lineCount={9}
                    />
                );
            case 'ejercicio-2': return (
                <div className="space-y-4">
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Ejercicio 2</CardTitle>
                                <CardDescription>Traduce las frases a sus tres formas.</CardDescription>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                        <BookText className="mr-2 h-4 w-4" />
                                        Vocabulario
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {Object.entries(class5Exercise2Vocab).map(([es, en]) => (
                                            <React.Fragment key={es}>
                                                <span className="text-muted-foreground capitalize">{es}:</span>
                                                <span className="font-bold text-right">{en}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </CardHeader>
                    </Card>
                    <PresentSimpleExercise exerciseData={class5Exercise2Data} onComplete={() => handleTopicComplete('ejercicio-2')} title="" showShortAnswers={false} />
                </div>
            );
            case 'ejercicio-3': return <SimpleTranslationExercise course="a1" exerciseKey="c5_mixed3_updated" onComplete={() => handleTopicComplete('ejercicio-3')} title="Ejercicio 3" vocabulary={{"parientes": "relatives", "abuelos": "grandparents", "hijo": "son", "esposa": "wife", "compañeros": "coworkers"}} />;
            case 'ejercicio-vocabulario': return <Class5VocabExercise onComplete={() => handleTopicComplete('ejercicio-vocabulario')} />;
            default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm">Volver a la unidad 1</Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 5 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-3 md:order-2 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const Icon = item.status === 'completed' ? CheckCircle : (item.status === 'active' ? item.icon : Lock);
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                            <span>{item.name}</span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span></div>
                                        <Progress value={progressValue} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-9 md:order-1">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
