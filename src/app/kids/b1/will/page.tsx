'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Gamepad2, 
    Trophy, 
    Loader2, 
    ArrowRight, 
    ArrowLeft,
    BookText,
    Star,
    Plus,
    Minus,
    HelpCircle,
    ChevronDown,
    Check,
    X
} from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/header";
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageKey = 'progress_kids_b1_will_full_v15_stable';
const mainProgressKey = 'progress_kids_b1_will';

// --- DATA ---

const environmentVocab = [
    { spanish: 'Calentamiento global', english: ['Global warming'] },
    { spanish: 'Contaminación', english: ['Pollution'] },
    { spanish: 'Residuos / Desperdicios', english: ['Waste'] },
    { spanish: 'Mejorar', english: ['To improve', 'Improve'] },
    { spanish: 'Derretirse', english: ['To melt', 'Melt'] },
    { spanish: 'Energía renovable', english: ['Renewable energy'] },
    { spanish: 'Especies en peligro', english: ['Endangered species'] },
    { spanish: 'Reciclaje', english: ['Recycling'] },
    { spanish: 'Medio ambiente', english: ['Environment'] },
    { spanish: 'Capa de ozono', english: ['Ozone layer'] },
    { spanish: 'Combustibles fósiles', english: ['Fossil fuels'] },
    { spanish: 'Naturaleza', english: ['Nature'] },
    { spanish: 'Reciclar', english: ['Recycle'] },
    { spanish: 'Plástico', english: ['Plastic'] },
];

const ex1PositiveData = [
    { spanish: "YO RECICLARÉ PLÁSTICO", answer: ["i will recycle plastic"] },
    { spanish: "NOSOTROS USAREMOS ENERGÍA RENOVABLE", answer: ["we will use renewable energy"] },
    { spanish: "ELLA PROTEGERÁ LAS ESPECIES EN PELIGRO", answer: ["she will protect endangered species"] },
    { spanish: "ELLOS MEJORARÁN EL MEDIO AMBIENTE", answer: ["they will improve the environment"] },
    { spanish: "EL SOL DERRETIRÁ EL HIELO", answer: ["the sun will melt the ice"] },
];

const ex1NegativeData = [
    { spanish: "YO NO USARÉ COMBUSTIBLES FÓSILES", answer: ["i will not use fossil fuels", "i won't use fossil fuels"] },
    { spanish: "NOSOTROS NO CONTAMINAREMOS EL AGUA", answer: ["we will not pollute the water", "we won't pollute the water"] },
    { spanish: "ÉL NO DESPERDICIARÁ RESIDUOS", answer: ["he will not waste", "he won't waste waste"] },
    { spanish: "ELLA NO TIRARÁ BASURA", answer: ["she will not throw trash", "she won't throw trash"] },
    { spanish: "ELLOS NO DAÑARÁN LA NATURALEZA", answer: ["they will not damage nature", "they won't damage nature"] },
];

const ex1InterrogativeData = [
    { spanish: "¿TÚ  RECICLARÁS PAPEL?", answer: ["will you recycle paper?"] },
    { spanish: "¿NOSOTROS AHORRAREMOS  ENERGÍA?", answer: ["will we save energy?"] },
    { spanish: "¿EL MEJORARÁ CALENTAMIENTO GLOBAL?", answer: ["will global warming improve?"] },
    { spanish: "¿ELLOS AYUDARÁN AL PLANETA?", answer: ["will they help the planet?"] },
    { spanish: "¿ELLA PLANTARÁ ÁRBOLES?", answer: ["will she plant trees?"] },
];

const ex2Data = [
    {
        spanish: "¿TÚ RECICLARÁS PLÁSTICO?",
        answers: {
            interrogative: ["will you recycle plastic?"],
            shortAffirmative: ["yes, i will"],
            shortNegative: ["no, i will not", "no, i won't"]
        }
    },
    {
        spanish: "¿ELLA USARÁ ENERGÍA RENOVABLE?",
        answers: {
            interrogative: ["will she use renewable energy?"],
            shortAffirmative: ["yes, she will"],
            shortNegative: ["no, she will not", "no, she won't"]
        }
    },
    {
        spanish: "¿ELLOS AYUDARÁN A LOS ANIMALES?",
        answers: {
            interrogative: ["will they help the animals?"],
            shortAffirmative: ["yes, they will"],
            shortNegative: ["no, they will not", "no, they won't"]
        }
    },
    {
        spanish: "¿TU LIMPIARÁS TU HABITACIÓN?",
        answers: {
            interrogative: ["will you clean your room?"],
            shortAffirmative: ["yes, i will"],
            shortNegative: ["no, i will not", "no, i won't"]
        }
    },
    {
        spanish: "¿LLAMARÁS A TU MAMÁ?",
        answers: {
            interrogative: ["will you call your mom?", "will you call your mother?"],
            shortAffirmative: ["yes, i will"],
            shortNegative: ["no, i will not", "no, i won't"]
        }
    }
];

const ex3MixedData = [
    { spanish: "YO COMPRARÉ UN CARRO ELÉCTRICO", answer: ["i will buy an electric car"] },
    { spanish: "NOSOTROS NO COMEREMOS CARNE HOY", answer: ["we will not eat meat today", "we won't eat meat today"] },
    { spanish: "¿VIAJARÁS A EUROPA EL PRÓXIMO MES?", answer: ["will you travel to europe next month?"] },
    { spanish: "ELLA ESTUDIARÁ PARA EL EXAMEN DE CIENCIAS", answer: ["she will study for the science exam"] },
    { spanish: "ELLOS NO LLEGARÁN TARDE A LA ESCUELA", answer: ["they will not arrive late to school", "they won't arrive late to school"] },
];

const readingData = {
    title: "A Future with Nature",
    content: "In the future, I believe the world will change. People will use more renewable energy to protect the nature. We will not use fossil fuels because they cause pollution. If we all recycle plastic and waste, the global warming will improve. Many endangered species will survive and the ice will not melt so fast. We will work together for our environment!",
    questions: [
        { id: 'q1', question: "What will people use to protect nature?", answers: ["renewable energy", "more renewable energy"] },
        { id: 'q2', question: "Why will we not use fossil fuels?", answers: ["because they cause pollution", "they cause pollution"] },
        { id: 'q3', question: "What happens if we recycle plastic?", answers: ["global warming will improve", "the global warming will improve"] },
    ]
};

const ICONS_MAP = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, type = 'translate' }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setCurrentIndex(0);
        setAnswer('');
        setStatus({});
    }, [prompts]);

    useEffect(() => {
        setAnswer('');
    }, [currentIndex]);

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
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
                        <CardTitle className='text-foreground'>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>
                            {type === 'translate' ? 'Traduce la frase correctamente.' : 'Transforma la frase según las instrucciones.'}
                        </CardDescription>
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

const TripleLineTranslationExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ interrogative: '', shortAff: '', shortNeg: '' });
    const [val, setVal] = useState<any>({ interrogative: 'unchecked', shortAff: 'unchecked', shortNeg: 'unchecked' });
    const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setAns({ interrogative: '', shortAff: '', shortNeg: '' });
        setVal({ interrogative: 'unchecked', shortAff: 'unchecked', shortNeg: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const fields: (keyof typeof ans)[] = ['interrogative', 'shortAff', 'shortNeg'];
        const keysInPrompt = ['interrogative', 'shortAffirmative', 'shortNegative'];
        const newVal = { ...val };
        let allOk = true;

        fields.forEach((field, i) => {
            const userVal = ans[field].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = prompts[currentIndex].answers[keysInPrompt[i]].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (field === 'interrogative' && !ans[field].trim().endsWith('?')) { allOk = false; newVal[field] = 'incorrect'; }
            else if (corrects.includes(userVal)) newVal[field] = 'correct';
            else { allOk = false; newVal[field] = 'incorrect'; }
        });

        setVal(newVal);
        if (allOk) { toast({ title: "¡Perfecto!" }); setCompletedMap(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completedMap[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}</div></PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl uppercase">{prompts[currentIndex].spanish}</div>
                <div className="space-y-4 font-mono">
                    <div className="flex items-center gap-4"><Label className="w-10 font-bold text-blue-500 text-center">(?)</Label><Input value={ans.interrogative} onChange={e => setAns(p => ({...p, interrogative: e.target.value}))} className={cn(val.interrogative === 'correct' ? 'border-green-500' : val.interrogative === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-10 font-bold text-green-500 text-center">(+A)</Label><Input value={ans.shortAff} onChange={e => setAns(p => ({...p, shortAff: e.target.value}))} className={cn(val.shortAff === 'correct' ? 'border-green-500' : val.shortAff === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-10 font-bold text-red-500 text-center">(-A)</Label><Input value={ans.shortNeg} onChange={e => setAns(p => ({...p, shortNeg: e.target.value}))} className={cn(val.shortNeg === 'correct' ? 'border-green-500' : val.shortNeg === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!completedMap[currentIndex]} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE COMPONENT ---

export default function WillKidsClassPage() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Final Vocab State
    const [finalVocabAnswers, setFinalVocabAnswers] = useState<Record<number, string>>({});
    const [finalVocabValidation, setFinalVocabValidation] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulary', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Grammar', icon: GraduationCap, status: 'locked' },
        { 
            key: 'exercise1', 
            name: '3. Exercise 1', 
            icon: PenSquare, 
            status: 'locked',
            subItems: [
                { key: 'ex1-pos', name: 'Positiva', icon: PenSquare, status: 'locked' },
                { key: 'ex1-neg', name: 'Negativa', icon: PenSquare, status: 'locked' },
                { key: 'ex1-int', name: 'Interrogativa', icon: PenSquare, status: 'locked' },
            ]
        },
        { key: 'exercise2', name: '4. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise3', name: '5. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookOpen, status: 'locked' },
        { key: 'final_ex', name: '8. Final Exercise', icon: Trophy, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialPath.map(topic => ({ 
            ...topic,
            subItems: topic.subItems ? topic.subItems.map(s => ({ ...s })) : undefined
        }));
        let savedSelectedTopic = '';

        if (isAdmin) {
            path.forEach(item => { 
                item.status = 'completed'; 
                if (item.subItems) item.subItems.forEach(s => s.status = 'completed');
            });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
                if (item.subItems && savedData.subItems?.[item.key]) {
                    item.subItems.forEach(sub => {
                        if (savedData.subItems[item.key][sub.key]) sub.status = savedData.subItems[item.key][sub.key];
                    });
                }
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }

        // Sequential locking logic
        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') {
                path[i].status = 'active';
                if (path[i].subItems) path[i].subItems[0].status = 'active';
            }
            const parentReady = (path[i].status === 'completed');
            if (path[i].subItems) {
                let allSubsDone = true;
                let subStepReady = lastDone;
                for (let j = 0; j < path[i].subItems!.length; j++) {
                    if (subStepReady && path[i].subItems![j].status === 'locked') path[i].subItems![j].status = 'active';
                    const isSubDone = path[i].subItems![j].status === 'completed';
                    subStepReady = isSubDone;
                    if (!isSubDone) allSubsDone = false;
                }
                lastDone = allSubsDone;
            } else {
                lastDone = parentReady;
            }
        }

        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active') || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
        setSelectedTopic(savedSelectedTopic || firstActive?.key || 'vocabulary');
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 600);
    }, [isAdmin, initialPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        let total = 0; let done = 0;
        learningPath.forEach(t => {
            if (t.subItems) {
                total += t.subItems.length;
                done += t.subItems.filter(s => s.status === 'completed').length;
            } else {
                total++; if (t.status === 'completed') done++;
            }
        });
        return total > 0 ? Math.round((done / total) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => {
            statusesToSave[item.key] = item.status;
            if (item.subItems) {
                if (!statusesToSave.subItems) statusesToSave.subItems = {};
                statusesToSave.subItems[item.key] = {};
                item.subItems.forEach(sub => { statusesToSave.subItems[item.key][sub.key] = sub.status; });
            }
        });

        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: progressValue
        });

        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, studentProfile, isInitialLoading]);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(currentPath => {
            let wasUnlocked = false;
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t, subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined }));
          
            let topicFound = false;
            for (let i = 0; i < newPath.length && !topicFound; i++) {
                if (newPath[i].key === topicToComplete) {
                    if (newPath[i].status !== 'completed') newPath[i].status = 'completed';
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        const n = newPath[i + 1]; n.status = 'active'; wasUnlocked = true;
                        nextToSelect = n.subItems?.[0]?.key || n.key;
                        if (n.subItems?.[0]) n.subItems[0].status = 'active';
                    }
                    topicFound = true;
                } else if (newPath[i].subItems) {
                    const subIdx = newPath[i].subItems!.findIndex(s => s.key === topicToComplete);
                    if (subIdx !== -1) {
                        if (newPath[i].subItems![subIdx].status !== 'completed') newPath[i].subItems![subIdx].status = 'completed';
                        const nextSubIdx = subIdx + 1;
                        if (nextSubIdx < newPath[i].subItems!.length && newPath[i].subItems![nextSubIdx].status === 'locked') {
                            newPath[i].subItems![nextSubIdx].status = 'active'; nextToSelect = newPath[i].subItems![nextSubIdx].key; wasUnlocked = true;
                        } else if (newPath[i].subItems!.every(s => s.status === 'completed')) {
                            if (newPath[i].status !== 'completed') newPath[i].status = 'completed';
                            if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                                const n = newPath[i + 1]; n.status = 'active'; wasUnlocked = true;
                                nextToSelect = n.subItems?.[0]?.key || n.key;
                                if (n.subItems?.[0]) n.subItems[0].status = 'active';
                            }
                        }
                        topicFound = true;
                    }
                }
            }
            
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Siguiente misión desbloqueada!" }), 0);
            if (nextToSelect) { const finalNext = nextToSelect; setTimeout(() => setSelectedTopic(finalNext), 0); }
            return newPath;
        });

        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const parent = learningPath.find(t => t.key === topicKey || t.subItems?.some(s => s.key === topicKey));
        const sub = parent?.subItems?.find(s => s.key === topicKey);
        const status = sub ? sub.status : parent?.status;

        if (!isAdmin && status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);
        if (['vocabulary', 'grammar'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleFinalVocabInputChange = (index: number, value: string) => {
        setFinalVocabAnswers(prev => ({ ...prev, [index]: value }));
        setFinalVocabValidation(prev => ({ ...prev, [index]: 'unchecked' }));
    };

    const handleCheckFinalVocab = () => {
        let allCorrect = true;
        const newValidation: any = {};
        environmentVocab.forEach((item, index) => {
            const userAnswer = (finalVocabAnswers[index] || '').trim().toLowerCase();
            const isCorrect = item.english.some(e => e.toLowerCase() === userAnswer);
            newValidation[index] = isCorrect ? 'correct' : 'incorrect';
            if (!isCorrect) allCorrect = false;
        });
        setFinalVocabValidation(newValidation);
        if (allCorrect) { toast({ title: "¡Misión Cumplida!" }); handleTopicComplete('final_ex'); }
        else toast({ variant: 'destructive', title: "Revisa el vocabulario" });
    };

    const renderContent = () => {
        if (isInitialLoading) return (
            <Card className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-white font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión...</p>
            </Card>
        );

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">Environment Vocabulary</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {environmentVocab.map((v, i) => (
                                <div key={i} className="p-3 bg-muted rounded-xl border flex flex-col items-center">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{v.spanish}</span>
                                    <span className="font-black text-primary">{v.english[0]}</span>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('vocabulary')} size="lg" className="px-16 font-bold">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle className="text-3xl font-black text-primary uppercase">FUTURE: WILL</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary space-y-4">
                                <p className="text-lg font-bold">Se usa para decisiones espontáneas, promesas o predicciones.</p>
                                <div className="grid gap-3 font-mono text-base">
                                    <p><span className="text-green-500 font-bold">(+)</span> Pronoun  + WILL + Verb + Complement</p>
                                    <p><span className="text-red-500 font-bold">(-)</span> Pronoun + WILL NOT (WON'T) + Verb + Complement</p>
                                    <p><span className="text-blue-500 font-bold">(?)</span> WILL + Pronoun + Verb + Complement?</p>
                                    <Separator />
                                    <p><span className="text-green-600 font-bold">(+A)</span> Yes, Pronoun + will</p>
                                    <p><span className="text-red-600 font-bold">(-A)</span> No, Pronoun + won't</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1-pos': return <BallsExercise title="Positiva (+)" prompts={ex1PositiveData} onComplete={() => handleTopicComplete('ex1-pos')} vocabulary={{"reciclar": "recycle", "energía renovable": "renewable energy", "especies": "species", "ambiente": "environment", "derretir": "melt", "hielo": "ice"}} />;
            case 'ex1-neg': return <BallsExercise title="Negativa (-)" prompts={ex1NegativeData} onComplete={() => handleTopicComplete('ex1-neg')} vocabulary={{"fósiles": "fossil", "combustibles": "fuels", "contaminar": "pollute", "desperdiciar": "waste", "basura": "trash / garbage", "dañar": "damage"}} />;
            case 'ex1-int': return <BallsExercise title="Interrogativa (?)" prompts={ex1InterrogativeData} onComplete={() => handleTopicComplete('ex1-int')} vocabulary={{"papel": "paper", "ahorrar": "save", "planeta": "planet", "plantar": "plant", "árboles": "trees"}} />;
            case 'exercise2': return <TripleLineTranslationExercise title="Exercise 2: Q&A" prompts={ex2Data} onComplete={() => handleTopicComplete('exercise2')} vocabulary={{"plástico": "plastic", "limpiar": "clean", "habitación": "room", "llamar": "call"}} />;
            case 'exercise3': return <BallsExercise title="Exercise 3: Mixed Challenge" prompts={ex3MixedData} onComplete={() => handleTopicComplete('exercise3')} vocabulary={{"carro": "car", "eléctrico": "electric", "carne": "meat", "ciencias": "science", "llegar tarde": "arrive late"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={environmentVocab} onComplete={() => handleTopicComplete('vocab_game')} title="Environment Memory" />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div><CardTitle>{readingData.title}</CardTitle></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                                    <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({ "creer" : "believe", "causar" : "cause", "sobrevivir" : "survive", "juntos" : "together"}).map(([en, es]) => (<React.Fragment key={en}><span className="text-muted-foreground">{en}:</span><span className="font-bold text-right">{es}</span></React.Fragment>))}</div></PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingData.questions.map(q => (
                                    <div key={q.id} className="space-y-2">
                                        <Label className="font-bold">{q.question}</Label>
                                        <Input placeholder="Tu respuesta..." autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('reading')} size="lg" className="px-12 font-bold">Verificar Misión</Button></CardFooter>
                    </Card>
                );
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b">
                            <CardTitle className="text-2xl font-black text-primary uppercase">Final Challenge</CardTitle>
                            <CardDescription className="font-bold">Traduce los términos de medio ambiente para finalizar.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 grid grid-cols-2 gap-x-12 gap-y-4">
                            {environmentVocab.map((v, i) => (
                                <React.Fragment key={i}>
                                    <div className="flex items-center font-bold text-base capitalize">{v.spanish}</div>
                                    <Input 
                                        value={finalVocabAnswers[i] || ''} 
                                        onChange={e => handleFinalVocabInputChange(i, e.target.value)}
                                        className={cn("h-10 text-lg", finalVocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5' : finalVocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')}
                                        autoComplete="off"
                                    />
                                </React.Fragment>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6"><Button onClick={handleCheckFinalVocab} size="lg" className="px-20 font-black h-14 text-xl">Finalizar Clase</Button></CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen will-lesson-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/kids/b1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso B1
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)] uppercase tracking-tight">Future: WILL 🚀</h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left text-foreground">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Star className="h-5 w-5 fill-primary" /> Tu Misión</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key || item.subItems?.some(s => s.key === selectedTopic);
                                            const Icon = ICONS_MAP[item.status as keyof typeof ICONS_MAP] || BookOpen;
                                            return (
                                                <li key={item.key}>
                                                    {!item.subItems ? (
                                                        <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary')}>
                                                            <div className="flex items-center gap-3">
                                                                {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500" : "text-primary")} />}
                                                                <span className="truncate">{item.name}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Collapsible defaultOpen={isSelected}>
                                                            <CollapsibleTrigger className="w-full">
                                                                <div className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black')}>
                                                                    <div className="flex items-center gap-3">
                                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500" : "text-primary")} />}
                                                                        <span className="truncate">{item.name}</span>
                                                                    </div>
                                                                    {isLocked ? <Lock className="h-4 w-4 text-yellow-500/50" /> : <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />}
                                                                </div>
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent><ul className="pl-6 pt-1 space-y-1">{item.subItems.map(s => (
                                                                <li key={s.key} onClick={() => handleTopicSelect(s.key)} className={cn('flex items-center justify-between gap-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer', s.status === 'locked' && !isAdmin ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === s.key && 'bg-muted text-primary font-bold')}>
                                                                    <div className="flex items-center gap-2">
                                                                        {s.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <s.icon className={cn("h-4 w-4", s.status === 'locked' ? 'text-yellow-500' : 'text-primary')} />}
                                                                        <span>{s.name}</span>
                                                                    </div>
                                                                </li>
                                                            ))}</ul></CollapsibleContent>
                                                        </Collapsible>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-bold uppercase text-muted-foreground"><span>Avance</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
