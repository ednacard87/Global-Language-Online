'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
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
    Pencil,
    Mic,
    HelpCircle,
    Shirt,
    Check,
    X,
    Star,
    Book,
    Clock
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
const progressStorageVersion = 'progress_a2_eng_u1_c3_v1000_final_validation';
const mainProgressKey = 'progress_a2_eng_unit_1_class_3';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const ropaVocab = [
    { es: "GORRA", en: "CAP" }, { es: "CORREA", en: "BELT" }, { es: "BOTAS", en: "BOOTS" },
    { es: "ZAPATOS", en: "SHOES" }, { es: "CORBATA", en: "TIE" }, { es: "VESTIDO", en: "DRESS" },
    { es: "CHAQUETA", en: "JACKET" }, { es: "SOMBRERO", en: "HAT" }, { es: "FALDA", en: "SKIRT" },
    { es: "CAMISA", en: "SHIRT" }, { es: "CAMISETA", en: "T-SHIRT" }, { es: "PANTALONES CORTOS", en: "SHORTS" },
    { es: "MEDIAS", en: "TIGHTS" }, { es: "TACONES", en: "HIGH HEELS" }, { es: "BRAZALETE", en: "BRACELET" },
    { es: "ANILLO", en: "RING" }, { es: "ARETAS", en: "EARRINGS" }, { es: "COLLAR", en: "NECKLACE" },
    { es: "GAFAS", en: "GLASSES" }, { es: "ESPEJO", en: "MIRROR" }, { es: "GAFAS DE SOL", en: "SUNGLASSES" },
    { es: "BOLSILLO", en: "POCKET" }, { es: "CHALECO", en: "VEST" }, { es: "PANTALONES", en: "TROUSERS" },
    { es: "BUFANDA", en: "SCARF" }, { es: "GUANTES", en: "GLOVES" }, { es: "TENIS DEPORTIVOS", en: "TENNIS SNEAKERS" },
    { es: "SANDALIAS", en: "SANDALS" },
];

const capeTownStory = {
    words: "ACTIVITIES/ CULTURES/ COUNTRIES/ PUBS/ TIME/ AWARENESS/ TOURISTS/ FUN/ SYSTEMS/ POLICEMEN / RESTAURANTS/ ATTENTION/ PEACE/ THINGS/ BEACHES/ PEOPLE/ CRIME/ RESOURCES/ CAMERAS/ FOCUS",
    parts: [
        { text: "CAPE TOWN IS HOME TOO MANY DIFFERENT - ", answer: "PEOPLE" },
        { text: " A FEW LOCAL CULTURES AND A LOT OF FOREIGN NATIONAL CULTURES. IMMIGRANTS FROM SEVERAL AFRICAN AND EUROPEAN - ", answer: "COUNTRIES" },
        { text: " THEY USED TO LIVE AT THE SOUTH OF AFRICA: SOME - ", answer: "TOURISTS" },
        { text: " FOR BUSINESS REASONS AND OTHERS SIMPLY FOR THE BEAUTY, DIVERSITY AND PEACEFUL LIFESTYLE, THIS CITY HAS TO OFFER LOTS OF - ", answer: "ACTIVITIES" },
        { text: " TO VISIT THE MODERN CITY EVERY YEAR. A VISIT TO CAPE TOWN IS GUARANTEED TO INCLUDE MUCH - ", answer: "FUN" },
        { text: " THERE ARE MANY FASCINATING - ", answer: "PUBS" },
        { text: " AND - ", answer: "RESTAURANTS" },
        { text: " THAT SERVE A VARIETY OF INTERESTING CUISINES. THERE ARE PLENTY OF - ", answer: "PUBS" },
        { text: " AND NIGHT CLUBS BUT FOR THOSE WHO WANT A BIT OF - ", answer: "PEACE" },
        { text: " THERE IS AN ORANGE OF OUTDOOR ACTIVITIES: MOUNTAIN HIKES, PICNICS IN THE BOTANICAL GARDEN OR ON THE MANY - ", answer: "BEACHES" },
        { text: ". FOR THE BRAVE THERE ARE A COUPLE OF - ", answer: "THINGS" },
        { text: ", EXTREME - ", answer: "ACTIVITIES" },
        { text: " SUCH AS DIVING WITH SHARKS, SKYDIVING AND BUNGEE JUMPING. IT IS A FACT THAT THERE IS A LOT OF - ", answer: "CRIME" },
        { text: " EVERYWHERE IN SOUTH AFRICA BUT THE POLICE HAVE BEEN WORKING HARD TO FIGHT CRIME. IN CAPE TOWN PLENTY OF TIME AND - ", answer: "RESOURCES" },
        { text: " HAVE BEEN DEDICATED TO BRING SEVERAL - ", answer: "SYSTEMS" },
        { text: " IN PLACE. THE TRAINING OF AND EMPLOYMENT OF LOTS OF ADDITIONAL - ", answer: "POLICEMEN" },
        { text: " AND SECURITY GUARDS WHO CONTROL THE STREETS AT NIGHT, THE INSTALLATION OF A FEW SECURITY - ", answer: "CAMERAS" },
        { text: " IN THE CITY CENTER AND MUCH - ", answer: "AWARENESS" },
        { text: " IS CREATED THROUGH ADVERTISEMENTS. SOMETIMES THERE IS TOO MUCH - ", answer: "FOCUS" },
        { text: " ON THE CRIME AND THE MEDIA DOESN’T ALWAYS PAY ENOUGH - ", answer: "ATTENTION" },
        { text: " TO THE MANY GOOD - ", answer: "THINGS" },
        { text: " BEING DONE TO OVERCOME THE PROBLEMS. ANYONE WHO SPENDS EVEN JUST A LITTLE - ", answer: "TIME" },
        { text: " IN CAPE TOWN WANTS TO RETURN. IT IS A VIBRANT AND COLOURFUL CITY AND WELL WORTH VISIT IT.", answer: null }
    ]
};

const ex1Prompts = [
    { spanish: "PASAMOS LAS VACACIONES DE VERANO EN LA PLAYA.", answer: ["we spent the summer holiday on the beach"] },
    { spanish: "ELLOS TRABAJAN DURO EN LA FINCA.", answer: ["they work hard on the farm"] },
    { spanish: "ELLOS SIEMPRE ESCUCHAN MUSICA EN EL TREN.", answer: ["they always listen to music on the train"] },
];

const ex2Prompts = [
    { spanish: "MARIO ES MAS FELIZ QUE SARA", answer: ["mario is happier than sara"] },
    { spanish: "¿ELLA ES LA MAS FAMOSA?", answer: ["is she the most famous?"] },
    { spanish: "ESTE ES EL COMPUTADOR MAS CARO", answer: ["this is the most expensive computer", "this is the most expensive laptop"] },
];

const lastExData = [
    { text: "1. LONDON IS ", answer: "IN", after: " EUROPE." },
    { text: "2. SHE LIVES ", answer: "ON", after: " THE SECOND FLOOR " },
    { text: "   IN AN NEW BUILDING ", answer: "AT", after: " THE END OF THIS STREET." }, // This was tricky, I'll split it slightly differently for the UI
    { text: "3. HE WAITS FOR ME ", answer: "AT", after: " THE BUS STOP." },
];

// Simplified mapping for the complex sentence in Last Exercise
const lastExBlanks = [
    { phrase: "1. LONDON IS ", correct: "IN", after: " EUROPE." },
    { phrase: "2. SHE LIVES ", correct: "ON", after: " THE SECOND FLOOR " },
    { phrase: "   IN A NEW BUILDING ", correct: "AT", after: " THE END OF THIS STREET." },
    { phrase: "3. HE WAITS FOR ME ", correct: "AT", after: " THE BUS STOP." },
];

// --- HELPERS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex].answer;
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}</div></ScrollArea></PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].spanish}</div>
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

const ManualGradingExercise = ({ title, description, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades, lineCount = 22, isSupervisionMode = false }: any) => {
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const lastStudentDataRef = useRef<string[]>([]);

    useEffect(() => {
        if (initialLines && Array.isArray(initialLines)) {
            const newLines = [...Array(lineCount).fill('')];
            initialLines.forEach((val: string, i: number) => { if (i < lineCount) newLines[i] = val || ''; });
            if (isAdmin) setLines(newLines);
            else {
                setLines(curr => {
                    const hasLocalChange = curr.some((l, idx) => l !== lastStudentDataRef.current[idx]);
                    return hasLocalChange ? curr : newLines;
                });
            }
            lastStudentDataRef.current = newLines;
        }
    }, [initialLines, lineCount, isAdmin]);

    useEffect(() => {
        if (initialGrades) setGrades(initialGrades);
    }, [initialGrades]);

    const handleLineChange = (idx: number, val: string) => {
        if (isSupervisionMode) return;
        const nl = [...lines]; nl[idx] = val; 
        setLines(nl); lastStudentDataRef.current = nl;
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: nl });
    };

    const handleToggleGrade = (idx: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const ng = { ...grades }; ng[idx] = ng[idx] === type ? null : type; 
        setGrades(ng);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: ng });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className='bg-primary/5 border-b'><CardTitle className='uppercase tracking-tighter'>{title}</CardTitle><CardDescription className='font-bold text-foreground'>{description}</CardDescription></CardHeader>
            <CardContent className="p-6 text-left">
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                        {lines.map((line, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="font-bold w-10 text-right text-muted-foreground">{i === 0 && title.includes('DICTATION') ? 'TITLE' : i + 1}.</span>
                                <Input 
                                    value={line} 
                                    onChange={e => handleLineChange(i, e.target.value)} 
                                    className={cn("flex-1 h-10 transition-all font-medium", grades[i] === 'correct' ? 'border-green-500 bg-green-500/10' : grades[i] === 'incorrect' ? 'border-red-500 bg-red-500/10' : '')} 
                                    readOnly={isSupervisionMode} 
                                />
                                <div className="flex gap-1 shrink-0">
                                    <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-8 w-8 rounded-full", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-8 w-8 rounded-full", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 uppercase">Avanzar <ArrowRight className="ml-2 h-6 w-6" /></Button></CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class3Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(ropaVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(ropaVocab.length).fill('unchecked'));
    const [questionsAns, setQuestionsAns] = useState<string[]>(Array(7).fill(''));
    const [storyAnswers, setStoryAnswers] = useState<Record<number, string>>({});
    const [storyVal, setStoryVal] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [create2Text, setCreate2Text] = useState('');

    // Last Exercise State
    const [lastExUserAnswers, setLastExUserAnswers] = useState<string[]>(Array(lastExBlanks.length).fill(''));
    const [lastExValStatus, setLastExValStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(lastExBlanks.length).fill('unchecked'));

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary_ropa', name: '1. Vocabulary (Ropa)', icon: Shirt, status: 'active' },
        { key: 'dictation_1', name: '2. Dictation 1', icon: Mic, status: 'locked' },
        { key: 'questions_dict', name: '3. Questions - Dict', icon: HelpCircle, status: 'locked' },
        { key: 'create_1', name: '4. Create 1', icon: Pencil, status: 'locked' },
        { key: 'read_complete', name: '5. Read and Complete', icon: BookText, status: 'locked' },
        { key: 'exercise_1', name: '6. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'create_2', name: '7. Create 2', icon: Pencil, status: 'locked' },
        { key: 'exercise_2', name: '8. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '9. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'last_exercise', name: '10. Last Exercise', icon: Trophy, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => { setTopicToComplete(completedKey); }, []);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
    };

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        let p = initialLearningPath.map(t => ({ ...t }));
        p.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
        if (isAdmin && !overrideStudentId) p.forEach(t => (t as any).status = 'completed');
        let last = true;
        for(let i=0; i < p.length; i++) { if (last && (p[i] as any).status === 'locked') (p[i] as any).status = 'active'; last = (p[i] as any).status === 'completed'; }
        
        if (d.questionsAns) setQuestionsAns(d.questionsAns);
        if (d.storyAnswers) setStoryAnswers(d.storyAnswers);
        if (d.create2Text) setCreate2Text(d.create2Text);
        if (d.lastExUserAnswers) setLastExUserAnswers(d.lastExUserAnswers);
        
        setLearningPath(p); 
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
        const s: any = { 
            lastSelectedTopic: selectedTopic, 
            questionsAns, 
            storyAnswers, 
            create2Text,
            lastExUserAnswers
        };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, questionsAns, storyAnswers, create2Text, lastExUserAnswers, overrideStudentId]);

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

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary_ropa':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>LEXICO: ROPA</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-4 text-lg">
                            {ropaVocab.map((v, i) => (<Fragment key={i}><div className="p-3 border rounded-lg font-bold bg-white/5">{v.es}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} className={cn("uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={isAdmin && !!overrideStudentId} /></Fragment>))}
                        </div></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4"><Button onClick={() => { let ok = true; const nv = ropaVocab.map((v, i) => { const res = v.en === vocabAnswers[i].trim().toUpperCase(); if (!res) ok = false; return ok ? 'correct' : 'incorrect'; }); setVocabValidation(nv); if (allOk(nv)) toast({ title: "¡Perfecto!" }); }} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary_ropa')} disabled={!vocabValidation.every(v => v === 'correct') && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'dictation_1':
                return <ManualGradingExercise title="DICTATION 1" description="Escucha y escribe las 22 frases de tu profesor." onComplete={() => handleTopicComplete('dictation_1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="dict1Lines" storageKeyGrades="dict1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dict1Grades} isSupervisionMode={!!overrideStudentId} />;
            case 'questions_dict':
                const qs = ["WHAT DOES MARY HAVE FOR BREAKFAST?", "WHAT IS MARY’S PROFESSION?", "WHAT DOES SHE HAVE FOR LUNCH?", "WHAT KIND OF EXERCISE DOES SHE PRACTICE?", "WHAT IS MARY’S BROTHER NAME?", "WHAT DOES TIM HAVE FOR DINNER?", "WHERE DOES TIM WORK?"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Questions - Dictation 1</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {qs.map((q, i) => (
                                <div key={i} className="space-y-2">
                                    <Label className="font-bold text-primary">{i + 1}. {q}</Label>
                                    <Input value={questionsAns[i] || ''} onChange={e => { if (overrideStudentId) return; const na = [...questionsAns]; na[i] = e.target.value; setQuestionsAns(na); }} readOnly={!!overrideStudentId} autoComplete="off" />
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('questions_dict')} size="lg" className="px-16 font-bold h-14">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'create_1':
                return <ManualGradingExercise title="HOW HEALTHY ARE YOU?" description="WRITE 5 SENTENCES ABOUT YOUR OWN EATING AND EXERCISE HABITS. DON’T FORGET TO USE QUANTIFIERS: TOO MUCH, TOO MANY, NOT ENOUGH, A LOT OF." onComplete={() => handleTopicComplete('create_1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="create1Lines" storageKeyGrades="create1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Grades} lineCount={5} isSupervisionMode={!!overrideStudentId} />;
            case 'read_complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle>READ AND COMPLETE: CAPE TOWN</CardTitle>
                            <CardDescription className='font-bold text-foreground mt-2'>Usa estas palabras: {capeTownStory.words}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 text-lg leading-relaxed font-medium">
                            <p className='whitespace-pre-wrap'>
                                {capeTownStory.parts.map((p, i) => (
                                    <Fragment key={i}>
                                        {p.text}
                                        {p.answer && (
                                            <Input 
                                                value={storyAnswers[i] || ''} 
                                                onChange={e => { if (overrideStudentId) return; setStoryAnswers({...storyAnswers, [i]: e.target.value}); setStoryVal({...storyVal, [i]: 'unchecked'}); }} 
                                                className={cn("inline-block w-32 h-8 text-center uppercase font-bold transition-all mx-1", storyVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : storyVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                                autoComplete="off"
                                                readOnly={!!overrideStudentId}
                                            />
                                        )}
                                    </Fragment>
                                ))}
                            </p>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => {
                                let ok = true; const nv: any = {};
                                capeTownStory.parts.forEach((p, i) => {
                                    if (p.answer) {
                                        const res = (storyAnswers[i] || '').trim().toUpperCase() === p.answer.toUpperCase();
                                        nv[i] = res ? 'correct' : 'incorrect'; if (!res) ok = false;
                                    }
                                });
                                setStoryVal(nv); if (ok) { toast({ title: "¡Historia Completa!" }); handleTopicComplete('read_complete'); }
                                else toast({ variant: 'destructive', title: "Hay errores en el texto" });
                            }} size="lg" className="px-12 font-bold" disabled={!!overrideStudentId}>Verificar Historia</Button>
                        </CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Exercise 1: Prepositions" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={{"vacaciones": "holiday", "granja": "farm", "tren": "train"}} />;
            case 'create_2':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Create 2</CardTitle><CardDescription className="text-lg font-bold text-foreground uppercase">WHAT’S YOUR FAVORITE SPORT? DO YOU DO IT YOURSELF OR DO YOU JUST WATCH IT ON TV? WHY DO YOU LIKE IT?</CardDescription></CardHeader>
                        <CardContent><textarea value={create2Text} onChange={(e) => { if (!overrideStudentId) setCreate2Text(e.target.value); }} readOnly={!!overrideStudentId} className="w-full min-h-[250px] p-4 rounded-xl border bg-background text-lg" placeholder="Escribe tu respuesta aquí..."/></CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('create_2')} size="lg" className="px-20 font-bold h-14">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'exercise_2': return <BallsExercise title="Exercise 2: Comparatives" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={{"feliz": "happier", "famosa": "most famous", "caro": "most expensive"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={ropaVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game: Ropa" />;
            case 'last_exercise':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase font-black'>Last Exercise: AT - IN - ON</CardTitle></CardHeader>
                        <CardContent className="space-y-8 py-6">
                            <div className='bg-primary/5 p-6 rounded-2xl border-2 border-dashed border-primary/20 space-y-6'>
                                {lastExBlanks.map((p, i) => (
                                    <div key={i} className="flex items-center gap-2 flex-wrap text-xl font-bold leading-relaxed">
                                        <span>{p.phrase}</span>
                                        <Input 
                                            value={lastExUserAnswers[i] || ''}
                                            onChange={e => {
                                                const na = [...lastExUserAnswers]; na[i] = e.target.value; setLastExUserAnswers(na);
                                                const nv = [...lastExValStatus]; nv[i] = 'unchecked'; setLastExValStatus(nv);
                                            }}
                                            className={cn(
                                                "w-20 h-9 text-center uppercase font-black transition-all",
                                                lastExValStatus[i] === 'correct' ? 'border-green-500 bg-green-500/10' : 
                                                lastExValStatus[i] === 'incorrect' ? 'border-red-500 bg-red-500/10' : 'border-primary'
                                            )} 
                                            placeholder="..." 
                                            autoComplete="off"
                                        />
                                        <span>{p.after}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t p-6 bg-muted/10">
                            <Button variant="secondary" onClick={() => {
                                let allOk = true;
                                const nv = lastExBlanks.map((p, i) => {
                                    const ok = (lastExUserAnswers[i] || '').trim().toUpperCase() === p.correct.toUpperCase();
                                    if (!ok) allOk = false;
                                    return ok ? 'correct' : 'incorrect';
                                });
                                setLastExValStatus(nv as any);
                                if (allOk) toast({ title: "¡Excelente!", description: "Has completado el reto final." });
                                else toast({ variant: "destructive", title: "Casi listo", description: "Revisa las preposiciones en rojo." });
                            }} className="font-bold">Verificar</Button>
                            
                            <Button 
                                onClick={() => handleTopicComplete('last_exercise')} 
                                disabled={!lastExValStatus.every(v => v === 'correct') && !isAdmin}
                                size="lg" 
                                className="px-12 font-black h-12 uppercase bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                            >
                                Finalizar Clase <CheckCircle className="ml-2 h-5 w-5" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    const allOk = (valArray: string[]) => valArray.every(v => v === 'correct');

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
             {isAdmin && overrideStudentId && (
                <div className="col-span-12 mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || currentUID}</p></div>
                    <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10"><Link href="/admin">Cerrar</Link></Button>
                </div>
            )}
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A2</CardTitle>
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
