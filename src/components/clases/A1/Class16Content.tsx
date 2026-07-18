'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
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
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    Pencil,
    BookText,
    Star,
    MapPin,
    Check,
    X,
    Clock,
    Info,
    HelpCircle,
    ListChecks,
    ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a1_eng_u3_c16_v4_final_stable';
const mainProgressKey = 'progress_a1_eng_unit_3_class_16';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const prepositionsVocab = [
    { es: "SOBRE", en: "ON" },
    { es: "EN, ADENTRO DE", en: "IN" },
    { es: "EN", en: "AT" },
    { es: "AFUERA", en: "OUTSIDE" },
    { es: "ENCIMA DE", en: "ABOVE" },
    { es: "DEBAJO DE", en: "BELOW / UNDER" },
    { es: "AL LADO DE", en: "NEXT TO" },
    { es: "A LA IZQUIERDA", en: "ON THE LEFT" },
    { es: "A LA DERECHA", en: "ON THE RIGHT" },
    { es: "CERCA", en: "NEAR" },
    { es: "LEJOS", en: "FAR" },
    { es: "ENTRE ( 2 ELEMENTOS)", en: "BETWEEN" },
    { es: "ENTRE (MAS DE 2 ELEMENTOS)", en: "AMONG" },
    { es: "A LO LARGO DE", en: "ALONG" },
    { es: "EN FRENTE DE", en: "IN FRONT OF" },
    { es: "DETRÁS DE", en: "BEHIND" },
    { es: "EN CONTRA DE", en: "AGAINST" },
    { es: "ALREDEDOR DE", en: "AROUND" },
];

const ex1Questions = [
    "CUANTOS AÑOS TIENES?",
    "Respuesta",
    "CUANTOS AÑOS TIENE ÉL?",
    "Respuesta",
    "¿QUE TAN SEGUIDO VAS AL GIMNASIO?:",
    "Respuesta",
    "¿QUE TAN FRIA ES ALASKA?",
    "Respuesta",
    "¿QUE TAN DULCE ESTÁ EL POSTRE?",
    "Respuesta",
    "¿QUE TAN ALT@ ERES?",
    "Respuesta",
    "¿QUE TAN GRANDE ES TU FAMILIA?",
    "Respuesta",
];

const writingPrompts = [
    "SUSAN = ¿QUE HACE ELLA?",
    "NOAH = ELLA ES ESTUDIANTE,",
    "SUSAN = ¿QUE ESTÁ ESTUDIANDO ELLA? -",
    "NOAH = ELLA ESTA ESTUDIANDO ____",
    "SUSAN = ¿PRACTICA ALGUN DEPORTE?",
    "NOAH = CLARO ELLA VA AL GIMNASIO.",
    "SUSAN = ¿QUE TAN SEGUIDO ELLA VA AL GIMNASIO?",
    "NOAH = ELLA VA AL GIMNACIO LOS LUNES Y MIERCOLES,",
    "SUSAN = ¿ENTONCES, QUE TAN OCUPADA ESTA ELLA?",
    "NOAH = ELLA ESTA MUY OCUPADA DURANTE LA SEMANA, ELLA TRABAJA DE LUNES A VIERNES EN LA OFICINA Y DESPUES ELLA VA A LA UNIVERSIDAD.",
    "SUSAN = ¿QUE TAN FRECUENTE VISITA A SU FAMILIA? –",
    "NOAH = ELLA VISITA A SU FAMILIA DE VEZ EN CUANDO, PORQUE ELLA NO TIENE TIEMPO, AUNQUE ELLA LLAMA A SU MAMÁ TODOS LOS DIAS."
];

const readingContent = {
    title: "A Busy Day at the Park",
    text: "Every Saturday, my family is at the park. In the morning, we sit on a blanket under a big tree. My brother plays with his dog near the lake, while my parents walk along the path. At noon, we eat sandwiches in the picnic area. My sister is frequently reading a book next to me. I believe that being outside in nature is the best way to relax!",
    questions: [
        { id: 'q1', question: "Where is the family on Saturdays?", answer: ["at the park", "the park"] },
        { id: 'q2', question: "Where do they sit in the morning?", answer: ["on a blanket", "under a big tree"] },
        { id: 'q3', question: "What does the brother do near the lake?", answer: ["he plays with his dog", "the brother play with his dog"] }
    ]
};

// --- HELPERS ---

const BallsExercise = ({ title, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const dummyPrompts = Array(5).fill({ spanish: 'Frase interactiva en desarrollo...' });

    const handleCheck = () => {
        toast({ title: "¡Correcto!", description: "Ejercicio validado." });
        setStatus(prev => ({ ...prev, [currentIndex]: 'correct' }));
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {dummyPrompts.map((_, i) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocab.</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 py-10">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase text-foreground">{dummyPrompts[currentIndex].spanish}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} className="h-12 text-lg" placeholder="Escribe tu respuesta..." />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < dummyPrompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ManualGradingExercise = ({ title, description, prompts, onComplete, studentDocRef, isAdmin, storageKeyLines, storageKeyGrades, initialLines, initialGrades }: any) => {
    const [lines, setLines] = useState<string[]>(Array(prompts.length).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});

    useEffect(() => {
        if (initialLines && Array.isArray(initialLines)) {
            const newLines = [...Array(prompts.length).fill('')];
            initialLines.forEach((val: string, i: number) => { if (i < prompts.length) newLines[i] = val || ''; });
            setLines(newLines);
        }
    }, [initialLines, prompts.length]);

    useEffect(() => { if (initialGrades) setGrades(initialGrades); }, [initialGrades]);

    const handleLineChange = (idx: number, val: string) => {
        if (isAdmin) return;
        const nl = [...lines]; nl[idx] = val; setLines(nl);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyLines}`]: nl });
    };

    const handleToggleGrade = (idx: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;
        const ng = { ...grades }; ng[idx] = ng[idx] === type ? null : type; setGrades(ng);
        if (studentDocRef) updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}.${storageKeyGrades}`]: ng });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader className='bg-primary/5 border-b'><CardTitle className="uppercase tracking-tighter">{title}</CardTitle><CardDescription className='font-bold text-foreground'>{description}</CardDescription></CardHeader>
            <CardContent className="p-6">
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                        {prompts.map((pText: string, i: number) => (
                            <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border border-border/50">
                                <p className="text-xs font-black text-primary uppercase">{i + 1}. {pText}</p>
                                <div className="flex items-center gap-3">
                                    <Input value={lines[i] || ''} onChange={e => handleLineChange(i, e.target.value)} className={cn("flex-1 h-10 transition-all font-medium", grades[i] === 'correct' ? 'border-green-500 bg-green-500/10' : grades[i] === 'incorrect' ? 'border-red-500 bg-red-500/10' : '')} readOnly={isAdmin} placeholder="Tu respuesta..." />
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'correct')} className={cn("h-8 w-8 rounded-full", grades[i] === 'correct' ? "bg-green-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><Check className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleToggleGrade(i, 'incorrect')} className={cn("h-8 w-8 rounded-full", grades[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-muted opacity-50")} disabled={!isAdmin}><X className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 uppercase">Continuar Misión</Button></CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class16Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(prepositionsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(prepositionsVocab.length).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

    const handleTopicComplete = useCallback((completedKey: string) => { setTopicToComplete(completedKey); }, []);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary_prepositions', name: '1. Vocabulary (Prepositions of place)', icon: MapPin, status: 'active' },
        { key: 'grammar_how_often', name: '2. Grammar 1 (How Often)', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '3. Exercise 1', icon: Pencil, status: 'locked' },
        { key: 'ex2', name: '4. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'grammar_at_on_in', name: '5. Grammar 2 (AT-ON-IN)', icon: Clock, status: 'locked' },
        { key: 'ex3', name: '6. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: '7. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '8. Vocabulary (game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: '9. Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: '10. Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: '11. Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: '12. Exercise 8', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '13. Reading', icon: BookText, status: 'locked' },
        { key: 'ex9', name: '14. Exercise 9', icon: PenSquare, status: 'locked' },
        { key: 'writing', name: '15. Writing', icon: Pencil, status: 'locked' },
        { key: 'last_ex', name: '16. Last exercise', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        let p = initialLearningPath.map(t => ({ ...t }));
        p.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
        if (isAdmin && !overrideStudentId) p.forEach(t => (t as any).status = 'completed');
        let last = true;
        for(let i=0; i < p.length; i++) { if (last && (p[i] as any).status === 'locked') (p[i] as any).status = 'active'; last = (p[i] as any).status === 'completed'; }
        
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.vocabValidation) setVocabValidation(d.vocabValidation);
        if (d.readAns) setReadAns(d.readAns);
        if (d.readVal) setReadVal(d.readVal);
        
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
        if (!initialLoadComplete || isInitialLoading || !studentDocRef || learningPath.length === 0 || overrideStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, vocabValidation, readAns, readVal };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, overrideStudentId, vocabAnswers, vocabValidation, readAns, readVal]);

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
        if (topicKey.startsWith('grammar')) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = prepositionsVocab.map((v, i) => {
            const ok = (vocabAnswers[i] || '').trim().toUpperCase() === v.en.toUpperCase();
            if (!ok) allOk = false;
            return ok ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (allOk) { toast({ title: "¡Vocabulario Dominado!" }); handleTopicComplete('vocabulary_prepositions'); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleCheckReading = () => {
        let allOk = true;
        const nv: any = {};
        readingContent.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const ok = q.answer.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = ok ? 'correct' : 'incorrect';
            if (!ok) allOk = false;
        });
        setReadVal(nv);
        if (allOk) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary_prepositions':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulary: Prepositions of place</CardTitle><CardDescription>Traduce las preposiciones al inglés.</CardDescription></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div>
                                    {prepositionsVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.es}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => { if (overrideStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} className={cn("h-12 uppercase font-mono", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!overrideStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary_prepositions')} disabled={!vocabValidation.every(v => v === 'correct') && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar_how_often':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                        <CardHeader><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR 1: HOW OFTEN</CardTitle></CardHeader>
                        <CardContent className="space-y-8">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 font-bold">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">¿Cómo usar HOW?</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted rounded-xl border-l-4 border-primary">
                                        <p className="text-primary font-black uppercase text-xs mb-1">Estructura 1:</p>
                                        <p>HOW + ADJETIVO : <span className="text-blue-500">CUAN / QUE TANTO</span> + ADJETIVO.</p>
                                    </div>
                                    <div className="p-4 bg-muted rounded-xl border-l-4 border-brand-purple">
                                        <p className="text-brand-purple font-black uppercase text-xs mb-1">Estructura 2:</p>
                                        <p>HOW + OFTEN : <span className="text-purple-500">QUE TAN SEGUIDO…</span></p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar_how_often')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1':
                return <ManualGradingExercise title="EXERCISE 1: TRANSLATION & RESPONSE" description="HACER LA TRADUCCION – Y FORMULAR LA RESPUESTA EN INGLÉS" prompts={ex1Questions} onComplete={() => handleTopicComplete('ex1')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="ex1Lines" storageKeyGrades="ex1Grades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.ex1Lines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.ex1Grades} />;
            case 'ex2': return <BallsExercise title="Exercise 2" onComplete={() => handleTopicComplete('ex2')} />;
            case 'grammar_at_on_in':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <div className="mb-4">
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Gramática: AT - ON - IN</h2>
                            <p className="text-white font-bold text-lg">Preposiciones de tiempo y lugar esenciales.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                {
                                    title: "Ficha 1: El Concepto",
                                    content: "PREPOSICIONES DE TIEMPO: la relación que hay entre dos palabras." <br/> "Se utilizan para indicar cuándo sucedió algo. Las tres preposiciones más comunes (AT, ON, IN), pueden ser utilizadas como preposiciones de tiempo Y preposiciones de lugar."
                                },
                                {
                                    title: "Ficha 2: ''AT''",
                                    content: "AT + HORA DEL DIA: meetings, classes, appointments (Ex: At 6:30). AT + FESTIVIDADES: At Christmas, At Easter, At Holidays. EXPRESIONES: At dawn, At noon, At night, At midnight, At the moment."
                                },
                                {
                                    title: "Ficha 3: ''ON''",
                                    content: "ON + DAYS: On Monday, On Wednesday, On the weekend (American). ON + DAYS + PARTS: On Friday morning, On Sunday evening. ON + DATES: On Christmas Day, On Mother's Day, On vacation, On July 4th."
                                },
                                {
                                    title: "Ficha 4: ''IN''",
                                    content: "IN + PARTS OF DAY: In the morning, In the evening. IN + MONTHS/YEARS: In January, In 1966, In the 1960s. IN + SEASONS: In summer, In winter. IN + LONG PERIODS: In the 19th century, In the past, In the future."
                                }
                            ].map((ficha, idx) => (
                                <div key={idx} className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 font-bold">
                                    <h3 className="text-xl font-black text-primary uppercase">{ficha.title}</h3>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{ficha.content}</p>
                                </div>
                            ))}
                        </div>
                        
                        <CardFooter className="justify-center pt-10"><Button onClick={() => handleTopicComplete('grammar_at_on_in')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">¡Listo!</Button></CardFooter>
                    </div>
                );
            case 'ex3': return <BallsExercise title="Exercise 3" onComplete={() => handleTopicComplete('ex3')} />;
            case 'ex4': return <BallsExercise title="Exercise 4" onComplete={() => handleTopicComplete('ex4')} />;
            case 'vocab_game': 
                return <VocabularyMatchingGame data={prepositionsVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory: Prepositions" />;
            case 'ex5': return <BallsExercise title="Exercise 5" onComplete={() => handleTopicComplete('ex5')} />;
            case 'ex6': return <BallsExercise title="Exercise 6" onComplete={() => handleTopicComplete('ex6')} />;
            case 'ex7': return <BallsExercise title="Exercise 7: HOW+ADJETIVO" onComplete={() => handleTopicComplete('ex7')} />;
            case 'ex8': return <BallsExercise title="Exercise 8" onComplete={() => handleTopicComplete('ex8')} />;
            case 'reading': 
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <CardTitle className="uppercase tracking-tighter">{readingContent.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">
                                {readingContent.text}
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="font-black text-primary uppercase text-sm">Comprehension Questions:</h4>
                                {readingContent.questions.map(q => (
                                    <div key={q.id} className="space-y-2">
                                        <Label className="font-bold">{q.question}</Label>
                                        <Input value={readAns[q.id] || ''} onChange={e => setReadAns({...readAns, [q.id]: e.target.value})} className={cn(readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-16 font-bold">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'ex9': return <BallsExercise title="Exercise 9: HOW+ADJETIVO" onComplete={() => handleTopicComplete('ex9')} />;
            case 'writing': 
                return <ManualGradingExercise title="QUIERO SABER SOBRE SU VIDA (DE ELLA)" description="Susan y Noah hablan sobre la vida de ella. Traduce y completa." prompts={writingPrompts} onComplete={() => handleTopicComplete('writing')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="writingLines" storageKeyGrades="writingGrades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingLines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingGrades} />;
            case 'last_ex': return <BallsExercise title="MIX: FINAL CHALLENGE" onComplete={() => handleTopicComplete('last_ex')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            {currentUID && isAdmin && overrideStudentId && (
                <div className="col-span-12 mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                        <Star className="h-6 w-6 fill-current animate-pulse" />
                        <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || currentUID}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10">
                        <Link href="/admin">Cerrar</Link>
                    </Button>
                </div>
            )}
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Misión 16
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[60vh] overflow-y-auto px-6 py-6 text-foreground text-left">
                            <nav><ul className="space-y-1">
                                {learningPath.map(item => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                    return (
                                        <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                            <div className="flex items-center gap-3">
                                                {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", item.status === 'locked' ? "text-yellow-500" : "text-primary")} />}
                                                <span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span>
                                            </div>
                                            {isLocked && <Lock className="h-4 w-4 text-yellow-500/50" />}
                                        </li>
                                    );
                                })}
                            </ul></nav>
                        </div>
                        <div className="p-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
