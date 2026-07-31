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
    Mic,
    HelpCircle,
    Pencil,
    Activity,
    Star,
    ArrowLeft,
    Check,
    X,
    Info,
    ListChecks,
    Zap,
    Users
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
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u2_c6_v107_fix_ref';
const mainProgressKey = 'progress_a2_eng_unit_2_class_6';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const irregularVerbsData = [
    { es: "ESTAR/SER", present: "BE", past: "WAS-WERE", participle: "BEEN" },
    { es: "COMENZAR", present: "BEGIN", past: "BEGAN", participle: "BEGUN" },
    { es: "LLEVAR-TRAER", present: "BRING", past: "BROUGHT", participle: "BROUGHT" },
    { es: "COMPRAR", present: "BUY", past: "BOUGHT", participle: "BOUGHT" },
    { es: "VENIR", present: "COME", past: "CAME", participle: "COME" },
    { es: "ESCRIBIR", present: "WRITE", past: "WROTE", participle: "WRITTEN" },
    { es: "HACER", present: "DO", past: "DID", participle: "DONE" },
    { es: "DIBUJAR", present: "DRAW", past: "DREW", participle: "DRAWN" },
    { es: "BEBER", present: "DRINK", past: "DRANK", participle: "DRUNK" },
    { es: "MANEJAR", present: "DRIVE", past: "DROVE", participle: "DRIVEN" },
    { es: "COMER", present: "EAT", past: "ATE", participle: "EATEN" },
    { es: "ENCONTRAR", present: "FIND", past: "FOUND", participle: "FOUND" },
    { es: "VOLAR", present: "FLY", past: "FLEW", participle: "FLOWN" },
    { es: "OLVIDAR", present: "FORGET", past: "FORGOT", participle: "FORGOTTEN" },
    { es: "PERDONAR", present: "FORGIVE", past: "FORGAVE", participle: "FORGIVEN" },
    { es: "CONSEGUIR", present: "GET", past: "GOT", participle: "GOTTEN" },
    { es: "DAR", present: "GIVE", past: "GAVE", participle: "GIVEN" },
    { es: "IR", present: "GO", past: "WENT", participle: "GONE" },
    { es: "HABER-TENER", present: "HAVE", past: "HAD", participle: "HAD" },
    { es: "OIR", present: "HEAR", past: "HEARD", participle: "HEARD" },
    { es: "SABER-CONOCER", present: "KNOW", past: "KNEW", participle: "KNOWN" },
    { es: "APRENDER", present: "LEARN", past: "LEARNED", participle: "LEARNED" },
    { es: "PONER", present: "PUT", past: "PUT", participle: "PUT" },
    { es: "LEER", present: "READ", past: "READ", participle: "READ" },
    { es: "CORRER", present: "RUN", past: "RAN", participle: "RUN" },
    { es: "DECIR", present: "SAY", past: "SAID", participle: "SAID" },
    { es: "VER", present: "SEE", past: "SAW", participle: "SEEN" },
    { es: "ENVIAR", present: "SEND", past: "SENT", participle: "SENT" },
    { es: "CANTAR", present: "SING", past: "SANG", participle: "SUNG" },
    { id: 30, es: "DORMIR", present: "SLEEP", past: "SLEPT", participle: "SLEPT" },
    { es: "TOMAR-AGARRAR", present: "TAKE", past: "TOOK", participle: "TAKEN" },
    { es: "PENSAR", present: "THINK", past: "THOUGHT", participle: "THOUGHT" },
    { es: "ENSEÑAR", present: "TEACH", past: "TAUGHT", participle: "TAUGHT" },
    { es: "HABLAR", present: "SPEAK", past: "SPOKE", participle: "SPOKEN" },
    { es: "VENDER", present: "SELL", past: "SOLD", participle: "SOLD" },
    { es: "SENTIR", present: "FEEL", past: "FELT", participle: "FELT" },
    { es: "PAGAR", present: "PAY", past: "PAID", participle: "PAID" },
    { es: "PERDER", present: "LOSE", past: "LOST", participle: "LOST" },
    { es: "CONOCER (ALGUIEN)", present: "MEET", past: "MET", participle: "MET" },
];

const ex1Prompts = [
    { spanish: "YO TRABAJE EN ESA EMPRESA EN 2008", answers: { pos: ["i worked in that company in 2008"], neg: ["i did not work in that company in 2008", "i didn't work in that company in 2008"], int: ["did i work in that company in 2008?", "did you work in that company in 2008?"] } },
    { spanish: "USTEDES JUGARON FUTBOL EN EL ESTADIO ANOCHE", answers: { pos: ["you played soccer at the stadium last night" , "you played football in the stadium last night"], neg: ["you did not play soccer at the stadium last night", "you didn't play soccer at the stadium last night"], int: ["did you play soccer at the stadium last night?", "did you play football at the stadium last night?"] } },
];

const posExercises = [
    { spanish: "YO FUI A PARIS EL AÑO PASADO.", answer: ["i went to paris last year"] },
    { spanish: "ELLA ENSEÑO MATEMATICAS EN EL COLEGIO.", answer: ["she taught math at the school", "she taught mathematics at the school", "she taught math in the school"] },
];

const negExercises = [
    { spanish: "YO NO LEI EL LIBRO EN CLASE.", answer: ["i did not read the book in class", "i didn't read the book in class"] },
    { spanish: "ELLA NO APRENDIO AT-ON- IN A TIEMPO AHORA ELLA TIENE PROBLEMAS DE GRAMATICA.", answer: ["she did not learn at-on-in on time now she has grammar problems", "she didn't learn at-on-in on time now she has grammar problems"] },
];

const intExercises = [
    { spanish: "¿FUISTE A INGLATERRA HACE 2 MESES?", answer: ["did you go to england 2 months ago?", "did you go to england two months ago?"] },
    { spanish: "¿ELLA TRAJO EL PAN Y LOS HUEVOS PARA EL DESAYUNO?", answer: ["did she bring the bread and the eggs for breakfast?"] },
];

const fillGapsPrompts = [
    { sentence: "SAM _______________ (STOP) THE CAR TO TAKE A PICTURE.", answer: "STOPPED" },
    { sentence: "I ________________ (STUDY) FOR THE EXAM FOR THREE HOURS.", answer: "STUDIED" },
];

const ex2TriplePrompts = [
    { spanish: "ELLA COME PIZZA - ELLA COMIÓ PIZZA", answers: { present: ["she eats pizza"], pos: ["she ate pizza"], neg: ["she did not eat pizza", "she didn't eat pizza"], int: ["did she eat pizza?"] } },
    { spanish: "YO ESTUDIO INGLES - YO ESTUDIE INGLES", answers: { present: ["i study english"], pos: ["i studied english"], neg: ["i did not study english", "i didn't study english"], int: ["did you study english?", "did i study english?"] } },
];

const readingData = {
    title: "A Trip to the Past",
    text: "Last summer, I went to a beautiful island with my family. We stayed in a small house near the sea. Every morning, we walked along the beach and saw many colorful birds. My father bought fresh fish for lunch, and my mother cooked it with vegetables. One day, we found an old bottle in the sand. Inside, there was a message from many years ago. It was a very exciting adventure!",
    questions: [
        { id: 'q1', question: "Where did the family stay?", answers: ["in a small house", "near the sea", "a small house"] },
        { id: 'q2', question: "What did the father buy for lunch?", answers: ["fresh fish", "fish"] },
        { id: 'q3', question: "What did they find in the sand?", answers: ["an old bottle", "a bottle"] },
    ]
};

const genericVocab = { 
    "trabajé": "worked", "empresa": "company", "estadio": "stadium", "anoche": "last night", 
    "fui": "went", "enseñó": "taught", "matemáticas": "math", "colegio": "school", 
    "leí": "read", "aprendió": "learned", "tiempo": "time", "problemas": "problems", 
    "hace 2 meses": "2 months ago", "trajo": "brought", "hambre": "hungry", "desayuno": "breakfast" 
};

// --- HELPER COMPONENTS ---

const BallsExerciseTranslation = ({ title, prompts, onComplete, vocabulary, type = 'triple' }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState<any>({ pos: '', neg: '', int: '', present: '', simple: '' });
    const [val, setVal] = useState<any>({ pos: 'unchecked', neg: 'unchecked', int: 'unchecked', present: 'unchecked' });
    const [solved, setSolved] = useState<Record<number, boolean>>({});

    useEffect(() => { setAns({ pos: '', neg: '', int: '', present: '', simple: '' }); setVal({ pos: 'unchecked', neg: 'unchecked', int: 'unchecked', present: 'unchecked' }); }, [currentIndex]);

    const handleCheck = () => {
        const newVal = { ...val }; let allOk = true;
        const currentPrompt = prompts[currentIndex];
        const fields = type === 'triple' ? ['pos', 'neg', 'int'] : (type === 'quad' ? ['present', 'pos', 'neg', 'int'] : ['simple']);
        
        fields.forEach(f => {
            const user = ans[f].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = (type === 'simple' ? currentPrompt.answer : currentPrompt.answers[f]).map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (f === 'int' && !ans[f].trim().endsWith('?')) { allOk = false; newVal[f] = 'incorrect'; }
            else if (corrects.includes(user)) newVal[f] = 'correct'; 
            else { allOk = false; newVal[f] = 'incorrect'; }
        });

        setVal(newVal);
        if (allOk) { toast({ title: "¡Buen trabajo!" }); setSolved(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", solved[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}</div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-lg uppercase tracking-tight text-foreground">{prompts[currentIndex].spanish}</div>
                <div className="space-y-3 font-mono text-sm max-w-lg mx-auto">
                    {type === 'quad' && <div className="flex items-center gap-3"><Label className="w-16 font-bold text-orange-500">Present:</Label><Input value={ans.present} onChange={e => setAns({...ans, present: e.target.value})} className={cn(val.present === 'correct' ? 'border-green-500' : val.present === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>}
                    {(type === 'triple' || type === 'quad') && <div className="flex items-center gap-3"><Label className="w-16 font-bold text-green-500">(+)</Label><Input value={ans.pos} onChange={e => setAns({...ans, pos: e.target.value})} className={cn(val.pos === 'correct' ? 'border-green-500' : val.pos === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>}
                    {(type === 'triple' || type === 'quad') && <div className="flex items-center gap-3"><Label className="w-16 font-bold text-red-500">(-)</Label><Input value={ans.neg} onChange={e => setAns({...ans, neg: e.target.value})} className={cn(val.neg === 'correct' ? 'border-green-500' : val.neg === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>}
                    {(type === 'triple' || type === 'quad') && <div className="flex items-center gap-3"><Label className="w-16 font-bold text-blue-500">(?)</Label><Input value={ans.int} onChange={e => setAns({...ans, int: e.target.value})} className={cn(val.int === 'correct' ? 'border-green-500' : val.int === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>}
                    {type === 'simple' && <Input value={ans.simple} onChange={e => setAns({...ans, simple: e.target.value})} className={cn("text-lg h-12 uppercase", solved[currentIndex] ? 'border-green-500' : 'border-primary')} placeholder="Tu traducción..." autoComplete="off" />}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!solved[currentIndex]} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ManualGradingExercise = ({ title, description, prompts, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades, lineCount = 6, isLarge = false }: any) => {
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
        if (isAdmin) return;
        const nl = [...lines]; nl[idx] = val; setLines(nl);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: nl });
    };

    const handleToggleGrade = (idx: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const newGrades = { ...grades }; newGrades[idx] = newGrades[idx] === type ? null : type; setGrades(newGrades);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: newGrades });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader className='bg-primary/5 border-b'><CardTitle className="uppercase tracking-tighter">{title}</CardTitle><CardDescription className='font-bold text-foreground'>{description}</CardDescription></CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {prompts.map((pText: string, i: number) => (
                        <div key={i} className="space-y-2 text-foreground">
                            <div className="flex justify-between items-center text-foreground">
                                <Label className="text-xs font-black text-primary uppercase">{i + 1}. {pText}</Label>
                                {isAdmin && (
                                    <div className="flex gap-1 text-foreground">
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-6 w-6 rounded-full", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted")}><Check className="h-3 w-3"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-6 w-6 rounded-full", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted")}><X className="h-3 w-3"/></Button>
                                    </div>
                                )}
                            </div>
                            {isLarge ? (
                                <textarea value={lines[i]} onChange={e => handleLineChange(i, e.target.value)} className={cn("w-full min-h-[150px] p-3 rounded-lg border text-lg bg-background text-foreground", grades[i] === 'correct' ? 'border-green-500 bg-green-50/10' : grades[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={isAdmin} />
                            ) : (
                                <Input value={lines[i]} onChange={e => handleLineChange(i, e.target.value)} className={cn("h-10 text-lg bg-background text-foreground", grades[i] === 'correct' ? 'border-green-500 bg-green-50/10' : grades[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={isAdmin} />
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={onComplete} size="lg" className="px-16 font-bold h-12 uppercase">Avanzar</Button></CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class6Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
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
    
    const [vocabGridAnswers, setVocabGridAnswers] = useState<Record<number, any>>({});
    const [vocabGridValidation, setVocabGridValidation] = useState<Record<number, any>>({});
    const [completeVerbsAnswers, setCompleteVerbsAnswers] = useState<Record<number, any>>({});
    const [completeVerbsValidation, setCompleteVerbsValidation] = useState<Record<number, any>>({});
    const [gapsIdx, setGapsIdx] = useState(0);
    const [gapsAns, setGapsAns] = useState<string[]>(Array(fillGapsPrompts.length).fill(''));
    const [gapsVal, setGapsVal] = useState<any[]>(Array(fillGapsPrompts.length).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

    const hasInitialized = useRef(false);
    const lastSerializedRef = useRef<string>('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo((): Topic[] => [
        { key: 'vocabulary_irregular', name: '1. Vocabulary (Irregular Verbs)', icon: BookOpen, status: 'active' },
        { key: 'grammar_did', name: '2. Grammar DID', icon: GraduationCap, status: 'locked' },
        { key: 'past_simple_ed', name: '3. Past Simple = ED', icon: Activity, status: 'locked' },
        { key: 'exercise_1', name: '4. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_pos', name: '5. Exercise (+)', icon: PenSquare, status: 'locked' },
        { key: 'exercise_neg', name: '6. Exercise (-)', icon: PenSquare, status: 'locked' },
        { key: 'exercise_int', name: '7. Exercise (?)', icon: PenSquare, status: 'locked' },
        { key: 'create_1', name: '8. Create 1', icon: Pencil, status: 'locked' },
        { key: 'vocab_game', name: '9. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'create_2', name: '10. Create 2', icon: Pencil, status: 'locked' },
        { key: 'fill_the_gaps', name: '11. Fill the Gaps', icon: Pencil, status: 'locked' },
        { key: 'exercise_2', name: '12. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'complete_verbs', name: '13. Complete Verbs', icon: Pencil, status: 'locked' },
        { key: 'reading', name: '14. Reading', icon: BookText, status: 'locked' },
        { key: 'exercise_3', name: '15. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'final_exercise', name: '16. Final Exercise', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        if (isAdmin && !targetStudentId) path.forEach(item => { item.status = 'completed'; });
        else {
            path.forEach(item => { if (d[item.key]) item.status = d[item.key]; });
            let last = true;
            for (let i = 0; i < path.length; i++) { if (last && path[i].status === 'locked') path[i].status = 'active'; last = path[i].status === 'completed'; }
        }
        setLearningPath(path); setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        if (d.vocabGridAnswers) setVocabGridAnswers(d.vocabGridAnswers);
        if (d.completeVerbsAnswers) setCompleteVerbsAnswers(d.completeVerbsAnswers);
        if (d.gapsAns) setGapsAns(d.gapsAns);
        if (d.readAns) setReadAns(d.readAns);
        setInitialLoadComplete(true); hasInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, studentProfile, isProfileLoading, isUserLoading, targetStudentId, initialPathData]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || targetStudentId || !user) return;
        const s: any = { lastSelectedTopic: selectedTopic, vocabGridAnswers, completeVerbsAnswers, gapsAns, readAns };
        learningPath.forEach(item => { s[item.key] = item.status; });
        if (JSON.stringify(s) === lastSerializedRef.current) return;
        const saveTimer = setTimeout(() => {
            lastSerializedRef.current = JSON.stringify(s);
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
        }, 2000);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabGridAnswers, completeVerbsAnswers, gapsAns, readAns, user]);

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

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { 
            toast({ variant: "destructive", title: "Contenido Bloqueado" }); 
            return; 
        }
        setSelectedTopic(topicKey);
    };

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleVocabGridCheck = () => {
        let allOk = true;
        const nv: any = {};
        irregularVerbsData.forEach((v, i) => {
            const u = vocabGridAnswers[i] || {};
            const pOk = u.pres?.trim().toUpperCase() === v.present;
            const paOk = u.past?.trim().toUpperCase() === v.past;
            const prOk = u.part?.trim().toUpperCase() === v.participle;
            nv[i] = { pres: pOk ? 'correct' : 'incorrect', past: paOk ? 'correct' : 'incorrect', part: prOk ? 'correct' : 'incorrect' };
            if (!pOk || !paOk || !prOk) allOk = false;
        });
        setVocabGridValidation(nv);
        if (allOk) toast({ title: "¡Excelente!", description: "Has dominado el vocabulario." });
        else toast({ variant: 'destructive', title: "Revisa la tabla" });
    };

    const handleCompleteVerbsCheck = () => {
        let allOk = true;
        const nv: any = {};
        const slice = irregularVerbsData.slice(10, 20);
        slice.forEach((v, i) => {
            const u = completeVerbsAnswers[i] || {};
            const pOk = u.pres?.trim().toUpperCase() === v.present;
            const paOk = u.past?.trim().toUpperCase() === v.past;
            const prOk = u.part?.trim().toUpperCase() === v.participle;
            nv[i] = { pres: pOk ? 'correct' : 'incorrect', past: paOk ? 'correct' : 'incorrect', part: prOk ? 'correct' : 'incorrect' };
            if (!pOk || !paOk || !prOk) allOk = false;
        });
        setCompleteVerbsValidation(nv);
        if (allOk) { toast({ title: "¡Tabla completada!" }); handleTopicComplete('complete_verbs'); }
        else toast({ variant: 'destructive', title: "Aún hay errores en la tabla." });
    };

    const isVocabGridComplete = useMemo(() => {
        if (irregularVerbsData.length === 0) return false;
        return irregularVerbsData.every((_, i) => 
            vocabGridValidation[i]?.pres === 'correct' && 
            vocabGridValidation[i]?.past === 'correct' && 
            vocabGridValidation[i]?.part === 'correct'
        );
    }, [vocabGridValidation]);

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        switch (selectedTopic) {
            case 'vocabulary_irregular':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>LEXICO: VERBOS IRREGULARES</CardTitle><CardDescription>Completa la tabla con las formas correspondientes en inglés.</CardDescription></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Spanish</TableHead><TableHead>Present</TableHead><TableHead>Past</TableHead><TableHead>Participle</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {irregularVerbsData.map((v, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-bold text-xs">{v.es}</TableCell>
                                            <TableCell><Input value={vocabGridAnswers[i]?.pres || ''} onChange={e => { setVocabGridAnswers({...vocabGridAnswers, [i]: {...(vocabGridAnswers[i] || {}), pres: e.target.value}}); setVocabGridValidation({...vocabGridValidation, [i]: {...(vocabGridValidation[i] || {}), pres: 'unchecked'}}); }} className={cn("h-8 text-xs uppercase", vocabGridValidation[i]?.pres === 'correct' ? 'border-green-500 bg-green-50/10' : vocabGridValidation[i]?.pres === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={isAdmin && !!targetStudentId} /></TableCell>
                                            <TableCell><Input value={vocabGridAnswers[i]?.past || ''} onChange={e => { setVocabGridAnswers({...vocabGridAnswers, [i]: {...(vocabGridAnswers[i] || {}), past: e.target.value}}); setVocabGridValidation({...vocabGridValidation, [i]: {...(vocabGridValidation[i] || {}), past: 'unchecked'}}); }} className={cn("h-8 text-xs uppercase", vocabGridValidation[i]?.past === 'correct' ? 'border-green-500 bg-green-50/10' : vocabGridValidation[i]?.past === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={isAdmin && !!targetStudentId} /></TableCell>
                                            <TableCell><Input value={vocabGridAnswers[i]?.part || ''} onChange={e => { setVocabGridAnswers({...vocabGridAnswers, [i]: {...(vocabGridAnswers[i] || {}), part: e.target.value}}); setVocabGridValidation({...vocabGridValidation, [i]: {...(vocabGridValidation[i] || {}), part: 'unchecked'}}); }} className={cn("h-8 text-xs uppercase", vocabGridValidation[i]?.part === 'correct' ? 'border-green-500 bg-green-50/10' : vocabGridValidation[i]?.part === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={isAdmin && !!targetStudentId} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={handleVocabGridCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary_irregular')} disabled={!isVocabGridComplete && !isAdmin} className='text-white font-bold px-10'>Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar_did':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-sm p-6 text-left">
                        <CardHeader><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR: DID</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold text-foreground">
                            <div className="p-6 bg-white/40 dark:bg-black/20 rounded-2xl border-2 border-dashed border-primary/20">
                                <p className="mb-4">Usamos <span className="text-primary">DID</span> como auxiliar para hablar de acciones terminadas en el pasado. Es el pasado del auxiliar DO/DOES.</p>
                                <div className="grid gap-3 font-mono text-base bg-muted/50 p-4 rounded-xl">
                                    <p><span className="text-green-500">(+)</span> Pronoun + Verb(Past) + Complement</p>
                                    <p><span className="text-red-500">(-)</span> Pronoun + DID NOT (DIDN'T) + Verb(Present) + Complement</p>
                                    <p><span className="text-blue-500">(?)</span> DID + Pronoun + Verb(Present) + Complement?</p>
                                    <Separator className="my-2" />
                                    <p><span className="text-green-600">(+A)</span> Yes, Pronoun + DID</p>
                                    <p><span className="text-red-600">(-A)</span> No, Pronoun + DID NOT</p>
                                </div>
                                <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                    <p className="text-sm font-black uppercase text-primary">CONTRACTION:</p>
                                    <p className="text-2xl font-black">DID + NOT = DIDN'T</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('grammar_did')} size="lg" className="px-16 font-bold h-12 uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'past_simple_ed':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-sm p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">REGULAR vs IRREGULAR VERBS</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-foreground font-bold">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/40 rounded-2xl border-2 border-dashed border-primary/20">
                                    <h4 className="text-xl text-primary uppercase mb-3">Regular Verbs</h4>
                                    <p className="mb-4">Siguen una regla fija: simplemente añadimos <span className="underline">ED</span> al final.</p>
                                    <p className="font-mono text-sm bg-muted p-2 rounded">Walk &rarr; Walked<br/>Study &rarr; Studied<br/>Play &rarr; Played</p>
                                </div>
                                <div className="p-6 bg-white/40 rounded-2xl border-2 border-dashed border-brand-purple/20">
                                    <h4 className="text-xl text-brand-purple uppercase mb-3">Irregular Verbs</h4>
                                    <p className="mb-4">No tienen regla. Cambian completamente de forma o se quedan igual.</p>
                                    <p className="font-mono text-sm bg-muted p-2 rounded">Go &rarr; Went<br/>Eat &rarr; Ate<br/>Write &rarr; Wrote</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('past_simple_ed')} size="lg" className="px-12 font-bold uppercase">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExerciseTranslation title="Exercise 1: Triple Translation" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={genericVocab} type="triple" />;
            case 'exercise_pos': return <BallsExerciseTranslation title="Exercise (+): Affirmative" prompts={posExercises} onComplete={() => handleTopicComplete('exercise_pos')} vocabulary={genericVocab} type="simple" />;
            case 'exercise_neg': return <BallsExerciseTranslation title="Exercise (-): Negative" prompts={negExercises} onComplete={() => handleTopicComplete('exercise_neg')} vocabulary={genericVocab} type="simple" />;
            case 'exercise_int': return <BallsExerciseTranslation title="Exercise (?): Interrogative" prompts={intExercises} onComplete={() => handleTopicComplete('exercise_int')} vocabulary={genericVocab} type="simple" />;
            case 'create_1': return <ManualGradingExercise title="CREATE 1" description="INVENTA FRASES CON EL PAST SIMPLE 2 (+) 2 (-) 2(?)" prompts={["(+)", "(+)", "(-)", "(-)", "(?)", "(?)"]} onComplete={() => handleTopicComplete('create_1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="create1Lines" storageKeyGrades="create1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Grades} lineCount={6} />;
            case 'vocab_game': return <VocabularyMatchingGame data={irregularVerbsData.slice(0, 12).map(v => ({ spanish: v.es, english: [v.present, v.past] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Irregular Verbs Memory" />;
            case 'create_2': return <ManualGradingExercise title="CREATE 2" description="WHAT DID YOU DO WHEN YOU WERE A CHILD? (5 SENTENCES)" prompts={["Escribe tu respuesta aquí:"]} onComplete={() => handleTopicComplete('create_2')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="create2Lines" storageKeyGrades="create2Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.create2Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create2Grades} lineCount={1} isLarge={true} />;
            case 'fill_the_gaps':
                const curGap = fillGapsPrompts[gapsIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <CardTitle>FILL THE GAPS ({gapsIdx + 1}/{fillGapsPrompts.length})</CardTitle>
                            <CardDescription>Completa el espacio con el verbo en pasado simple.</CardDescription>
                            <div className="flex gap-2 pt-4">
                                {fillGapsPrompts.map((_, i) => (
                                    <div key={i} onClick={() => setGapsIdx(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold cursor-pointer", gapsIdx === i ? "border-primary ring-2 ring-primary" : "border-muted", gapsVal[i] === 'correct' ? "bg-green-500 text-white" : gapsVal[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-card")}>{i+1}</div>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 py-10">
                            <div className="p-8 bg-muted rounded-2xl border-2 border-dashed text-center font-bold text-2xl uppercase tracking-tight">
                                {curGap.sentence}
                            </div>
                            <Input 
                                value={gapsAns[gapsIdx] || ''} 
                                onChange={e => { if (isAdmin && !!targetStudentId) return; const na = [...gapsAns]; na[gapsIdx] = e.target.value; setGapsAns(na); const nv = [...gapsVal]; nv[gapsIdx] = 'unchecked'; setGapsVal(nv); }} 
                                onKeyDown={e => e.key === 'Enter' && (gapsVal[gapsIdx] === 'correct' ? (gapsIdx < fillGapsPrompts.length - 1 && setGapsIdx(gapsIdx + 1)) : null)}
                                className={cn("h-14 text-2xl text-center uppercase font-black", gapsVal[gapsIdx] === 'correct' ? 'border-green-500 bg-green-50/10' : gapsVal[gapsIdx] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                readOnly={isAdmin && !!targetStudentId} 
                                placeholder="Escribe el verbo aquí..."
                            />
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button variant="outline" onClick={() => setGapsIdx(prev => Math.max(0, prev - 1))} disabled={gapsIdx === 0}>Anterior</Button>
                            <div className="flex gap-2">
                                <Button onClick={() => {
                                    const isOk = gapsAns[gapsIdx].trim().toUpperCase() === curGap.answer;
                                    const nv = [...gapsVal]; nv[gapsIdx] = isOk ? 'correct' : 'incorrect'; setGapsVal(nv);
                                    if (isOk) toast({ title: "¡Correcto!" }); else toast({ variant: 'destructive', title: "Incorrecto" });
                                }} variant="secondary">Verificar</Button>
                                <Button onClick={() => gapsIdx < fillGapsPrompts.length - 1 ? setGapsIdx(gapsIdx + 1) : handleTopicComplete('fill_the_gaps')} disabled={gapsVal[gapsIdx] !== 'correct'} className="font-bold">Siguiente</Button>
                            </div>
                        </CardFooter>
                    </Card>
                );
            case 'exercise_2': return <BallsExerciseTranslation title="Exercise 2: 4 Forms" prompts={ex2TriplePrompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={genericVocab} type="quad" />;
            case 'complete_verbs': 
                const slice = irregularVerbsData.slice(10, 20);
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>COMPLETE VERBS TABLE</CardTitle><CardDescription>Completa el Presente, Pasado y Participio de estos 10 verbos.</CardDescription></CardHeader>
                        <CardContent><ScrollArea className="h-[400px]">
                            <Table>
                                <TableHeader className="bg-muted/50"><TableRow><TableHead>Spanish</TableHead><TableHead>Present</TableHead><TableHead>Past</TableHead><TableHead>Participle</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {slice.map((v, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-foreground font-bold">{v.es}</TableCell>
                                            <TableCell><Input value={completeVerbsAnswers[i]?.pres || ''} onChange={e => { setCompleteVerbsAnswers({...completeVerbsAnswers, [i]: {...(completeVerbsAnswers[i] || {}), pres: e.target.value}}); setCompleteVerbsValidation({...completeVerbsValidation, [i]: {...(completeVerbsValidation[i] || {}), pres: 'unchecked'}}); }} className={cn("h-8 text-xs uppercase", completeVerbsValidation[i]?.pres === 'correct' ? 'border-green-500 bg-green-50/10' : completeVerbsValidation[i]?.pres === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} /></TableCell>
                                            <TableCell><Input value={completeVerbsAnswers[i]?.past || ''} onChange={e => { setCompleteVerbsAnswers({...completeVerbsAnswers, [i]: {...(completeVerbsAnswers[i] || {}), past: e.target.value}}); setCompleteVerbsValidation({...completeVerbsValidation, [i]: {...(completeVerbsValidation[i] || {}), past: 'unchecked'}}); }} className={cn("h-8 text-xs uppercase", completeVerbsValidation[i]?.past === 'correct' ? 'border-green-500 bg-green-50/10' : completeVerbsValidation[i]?.past === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} /></TableCell>
                                            <TableCell><Input value={completeVerbsAnswers[i]?.part || ''} onChange={e => { setCompleteVerbsAnswers({...completeVerbsAnswers, [i]: {...(completeVerbsAnswers[i] || {}), part: e.target.value}}); setCompleteVerbsValidation({...completeVerbsValidation, [i]: {...(completeVerbsValidation[i] || {}), part: 'unchecked'}}); }} className={cn("h-8 text-xs uppercase", completeVerbsValidation[i]?.part === 'correct' ? 'border-green-500 bg-green-50/10' : completeVerbsValidation[i]?.part === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCompleteVerbsCheck} size="lg" className="px-16 font-bold">Verificar Tabla</Button></CardFooter>
                    </Card>
                );
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.text}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingData.questions.map(q => (
                                    <div key={q.id} className="space-y-2"><Label className='font-bold text-foreground'>{q.question}</Label>
                                    <Input value={readAns[q.id] || ''} onChange={e => { if (isAdmin && !!targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} readOnly={isAdmin && !!targetStudentId} className={cn(readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 text-foreground"><Button onClick={() => {
                            let ok = true; const nv: any = {};
                            readingData.questions.forEach(q => { const ans = (readAns[q.id] || '').trim().toLowerCase(); const res = q.answers.some(a => ans.includes(a.toLowerCase())); nv[q.id] = res ? 'correct' : 'incorrect'; if (!res) ok = false; });
                            setReadVal(nv); if (ok) handleTopicComplete('reading');
                        }} size="lg" className="px-12 font-bold" disabled={isAdmin && !!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_3': return <BallsExerciseTranslation title="Exercise 3" prompts={[{ spanish: "LA SEMANA PASADA YO ESTUVE MUY OCUPADA", answer: ["last week i was very busy"] }, { spanish: "ELLA FUE A NY EL MES PASADO", answer: ["she went to ny last month", "she went to new york last month"] }]} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={genericVocab} type="simple" />;
            case 'final_exercise': return <BallsExerciseTranslation title="Final Exercise" prompts={[{ spanish: "ELLOS ESTUDIARON EN LA BIBLIOTECA EL MES PASADO", answers: { pos: ["they studied in the library last month"], neg: ["they did not study in the library last month", "they didn't study in the library last month"], int: ["did they study in the library last month?"] } }]} onComplete={() => handleTopicComplete('final_exercise')} vocabulary={genericVocab} type="triple" />;
            default: return null;
        }
    };

    if (isInitialLoading) return <div className="flex flex-col items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-muted-foreground font-bold tracking-widest animate-pulse uppercase">Cargando Misión...</p></div>;

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            {isAdmin && targetStudentId && (
                <div className="col-span-12 mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p></div>
                    <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                </div>
            )}
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 6A</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav><ul className="space-y-1">
                            {learningPath.map((item) => {
                                const isLocked = item.status === 'locked' && !isAdmin;
                                const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                return (
                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                        <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-foreground">{item.name}</span></div>
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
