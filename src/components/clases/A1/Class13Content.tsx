'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Trophy,
    ArrowLeft,
    Info,
    BookText,
    Star,
    Zap,
    Scale,
    Mic,
    Check,
    X
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- DATA & CONFIG ---

const progressStorageVersion = 'progress_a1_eng_u3_c13_v300_with_vocab_buttons';
const mainProgressKey = 'progress_a1_eng_unit_3_class_13';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const vocabularyData = [
    { spanish: 'BONITO/A', english: ['pretty', 'beautiful'] },
    { spanish: 'ANCHO', english: ['wide'] },
    { spanish: 'DESPIERTO', english: ['awake'] },
    { spanish: 'DIFERENTE', english: ['different'] },
    { spanish: 'LARGO', english: ['long'] },
    { spanish: 'SECO', english: ['dry'] },
    { spanish: 'ENOJADO', english: ['angry'] },
    { spanish: 'CANSADO', english: ['tired'] },
    { spanish: 'BRILLANTE', english: ['bright'] },
    { spanish: 'SUCIO', english: ['dirty'] },
    { spanish: 'LIMPIO', english: ['clean'] },
    { spanish: 'MOJADO', english: ['wet'] },
];

const monoPrompts = [
    { spanish: "EL INVIERNO ES MAS LARGO QUE EL VERANO", answer: ["winter is longer than summer"] },
    { spanish: "SANTA MARTA ES MAS PEQUEÑA QUE BARRANQUILLA", answer: ["santa marta is smaller than barranquilla"] },
    { spanish: "ESTE ES EL PERRO MAS VIEJO DE ESE BARRIO", answer: ["this is the oldest dog in that neighborhood"] },
    { spanish: "¿JUAN ES MAS ALTO QUE SARA?", answer: ["is juan taller than sara?"] },
    { spanish: "MI CARRRO ES MAS RAPIDO QUE EL DE MICHAEL", answer: ["my car is faster than michael's"] },
    { spanish: "ESTA CASA ES LA MAS GRANDE DE ESTA CALLE", answer: ["this house is the biggest on this street"] },
];

const bisPrompts = [
    { spanish: "ESTE EJERCICIO ES MAS FACIL QUE EL OTRO", answer: ["this exercise is easier than the other one"] },
    { spanish: "PETER ES EL ESTUDIANTE MAS EDUCADO", answer: ["peter is the most polite student"] },
    { spanish: "ESTA CALLE ES LA MAS ANGOSTA", answer: ["this street is the narrowest", "this road is the narrowest"] },
    { spanish: "MARIO ES MAS HUMILDE QUE MARTIN", answer: ["mario is more humble than martin"] },
    { spanish: "ESA CAJA ES MAS PESADA QUE ESTA", answer: ["that box is heavier than this one"] },
];

const longPrompts = [
    { spanish: "EL TE ES MAS CARO QUE EL AGUA", answer: ["tea is more expensive than water"] },
    { spanish: "IRAK ES EL PAIS MAS PELIGROSO DEL MUNDO", answer: ["iraq is the most dangerous country in the world"] },
    { spanish: "EL ES MAS ELEGANTE QUE ELLA", answer: ["he is more elegant than her"] },
    { spanish: "UN TIGRE ES MAS PELIGROSO QUE UN GATO", answer: ["a tiger is more dangerous than a cat"] },
    { spanish: "DANI ES MAS INTELIGENTE QUE SU PRIMO", answer: ["dani is more intelligent than his cousin"] },
];

const irregularPrompts = [
    { spanish: "CRISTIANO RONALDO ES EL MEJOR JUGADOR DE FUTBOL", answer: ["cristiano ronaldo is the best soccer player", "cristiano ronaldo is the best football player"] },
    { spanish: "CHINA ES MAS LEJOS QUE JAPON", answer: ["china is farther than japan", "china is further than japan"] },
    { spanish: "ESE HOMBRE ES EL PEOR ACTOR DE LA PELICULA", answer: ["that man is the worst actor in the movie"] },
    { spanish: "ME SIENTO MEJOR QUE AYER", answer: ["i feel better than yesterday"] },
    { spanish: "EL SABADO ES EL MEJOR DIA DE LA SEMANA", answer: ["saturday is the best day of the week"] },
];

const equalityPrompts = [
    { spanish: "YO SOY TAN ALTO COMO MI HERMANO", answer: ["i am as tall as my brother"] },
    { spanish: "ESTE PORTATIL ES TAN CARO COMO ESE", answer: ["this laptop is as expensive as that one"] },
    { spanish: "ELLA ES TAN INTELIGENTE COMO SU HERMANA", answer: ["she is as intelligent as her sister"] },
];

const inferiorityPrompts = [
    { spanish: "ESTE CARRO ES MENOS CARO QUE EL AZUL", answer: ["this car is less expensive than the blue one"] },
    { spanish: "LA MATEMATICA ES MENOS INTERESANTE QUE LA HISTORIA", answer: ["math is less interesting than history", "maths is less interesting than history"] },
    { spanish: "ELLA ES MENOS TIMIDA QUE SU HERMANO", answer: ["she is less shy than her brother"] },
];

const mixed3Prompts = [
    { spanish: "SHAKIRA ES LA CANTANTE MAS FAMOSA DE COLOMBIA", answer: ["shakira is the most famous singer in colombia"] },
    { spanish: "ALASKA ES MAS FRIA QUE COLOMBIA", answer: ["alaska is colder than colombia"] },
    { spanish: "ELLOS SON MAS AMABLES QUE MIS PARIENTES", answer: ["they are kinder than my relatives"] },
    { spanish: "TU ERES MAS FLACO QUE LUCAS", answer: ["you are thinner than lucas"] },
];

// --- VOCABULARIES ---
const exCompVocab = { "invierno": "winter", "verano": "summer", "barrio": "neighborhood", "alto": "tall", "rápido": "fast", "calle": "street" };
const exSupVocab = { "fácil": "easy", "educado": "polite", "angosta": "narrow", "humilde": "humble", "pesada": "heavy" };
const exMonoVocab = { ...exCompVocab, "cálida": "warmer", "delgada": "thinner", "caliente": "hot", "frío": "cold" };
const exBisVocab = { ...exSupVocab, "chévere": "cool/nice", "tierno": "tender" };
const exLongVocab = { "caro": "expensive", "peligroso": "dangerous", "artículo": "article", "revista": "magazine", "elegante": "elegant", "famoso": "famous", "difícil": "difficult", "moderna": "modern" };
const exIrregVocab = { "mejor": "best/better", "lejos": "farther/further", "peor": "worst/worse", "delicioso": "delicious", "aburridor": "boring" };
const exEqualityVocab = { "tan ... como": "as ... as", "alto": "tall", "caro": "expensive", "inteligente": "intelligent" };
const exInferiorityVocab = { "menos ... que": "less ... than", "interesante": "interesting", "tímida": "shy" };
const exMixed3Vocab = { "cantante": "singer", "famosa": "famous", "fría": "colder", "amables": "kinder", "flaco": "thinner", "mejor": "best" };

// --- AUXILIARY COMPONENTS ---

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
    lineCount = 21,
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

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setCurrentIndex(0); setAnswer(''); setStatus({});
    }, [prompts]);

    useEffect(() => {
        setAnswer('');
    }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isCorrect = currentPrompt.answer.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
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
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></React.Fragment>))}
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

// --- MAIN COMPONENT ---

export default function Class13Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulario', name: 'Vocabulario (Adjetivos)', icon: BookOpen, status: 'active' },
        { key: 'grados', name: 'Grados de los Adjetivos', icon: Scale, status: 'locked' },
        { key: 'grammar_comp', name: 'Comparativos', icon: GraduationCap, status: 'locked' },
        { key: 'ex_comp', name: 'Ejer. Comparativos', icon: PenSquare, status: 'locked' },
        { key: 'grammar_sup', name: 'Superlativos', icon: GraduationCap, status: 'locked' },
        { key: 'ex_sup', name: 'Ejer. Superlativos', icon: PenSquare, status: 'locked' },
        { key: 'formacion', name: 'Formación', icon: Info, status: 'locked' },
        { key: 'monosilabos', name: 'Monosílabos', icon: Info, status: 'locked' },
        { key: 'ex_mono', name: 'Ejer. Monosílabos', icon: PenSquare, status: 'locked' },
        { key: 'bisilabos', name: 'Bisílabos', icon: Info, status: 'locked' },
        { key: 'ex_bis', name: 'Ejercicios Bisílabos', icon: PenSquare, status: 'locked' },
        { key: 'largos', name: 'Adjetivos Largos', icon: Info, status: 'locked' },
        { key: 'ex_largos', name: 'Ejercicios Largos', icon: PenSquare, status: 'locked' },
        { key: 'irregulares', name: 'Irregulares', icon: Zap, status: 'locked' },
        { key: 'ex_irreg', name: 'Ejercicios Irregulares', icon: PenSquare, status: 'locked' },
        { key: 'ex_mixto_1', name: 'Mixto 1', icon: PenSquare, status: 'locked' },
        { key: 'igualdad', name: 'Comparativo Igualdad', icon: Scale, status: 'locked' },
        { key: 'ex_igual', name: 'Ejercicio Igualdad', icon: PenSquare, status: 'locked' },
        { key: 'inferioridad', name: 'Comparativo Inferioridad', icon: Scale, status: 'locked' },
        { key: 'ex_inf', name: 'Ejercicio Inferioridad', icon: PenSquare, status: 'locked' },
        { key: 'ex_mixto_2', name: 'Mixto 2', icon: PenSquare, status: 'locked' },
        { key: 'ex_mixto_3', name: 'Mixto 3', icon: PenSquare, status: 'locked' },
        { key: 'dictation', name: 'Dictation', icon: Mic, status: 'locked' },
    ], []);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';
        if (isAdmin) path.forEach(t => (t as any).status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const d = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
            savedST = d.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && (path[i] as any).status === 'locked') (path[i] as any).status = 'active'; lastDone = (path[i] as any).status === 'completed'; }
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
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
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
            const idx = np.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active';
                    win = true;
                    next = np[idx + 1].key;
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (next) { const n = next; setTimeout(() => setSelectedTopic(n), 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        const auto = ['grados', 'grammar_comp', 'grammar_sup', 'formacion', 'monosilabos', 'bisilabos', 'largos', 'irregulares', 'igualdad', 'inferioridad'];
        if (auto.includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let count = 0;
        const nv = vocabularyData.map((v, i) => {
            const ok = v.english.some(e => e.toLowerCase() === vocabAnswers[i].trim().toLowerCase());
            if (ok) count++; return ok ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (count >= 1) { setCanAdvanceVocab(true); toast({ title: "¡Buen trabajo!" }); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulario':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle>Vocabulario (Adjetivos)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto text-foreground">
                                {vocabularyData.map((v, i) => (
                                    <React.Fragment key={i}>
                                        <div className="p-2 border rounded bg-white/5 font-medium">{v.spanish}</div>
                                        <Input value={vocabAnswers[i]} onChange={e => { const n = [...vocabAnswers]; n[i] = e.target.value; setVocabAnswers(n); setVocabValidation(vv => { const vvv = [...vv]; vvv[i] = 'unchecked'; return vvv; }); setCanAdvanceVocab(false); }} autoComplete="off" className={cn(vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} />
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className='flex justify-between border-t pt-6 mt-4'><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulario')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grados':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRADOS DE LOS ADJETIVOS</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-foreground font-bold">
                            <p>Existen tres grados de comparación para los adjetivos:</p>
                            <ul className="space-y-2 list-disc pl-5">
                                <li><span className="text-primary">GRADO POSITIVO:</span> El adjetivo en su forma base (Tall, Big). <br/>  ------------------- Susan es alta = Susan is tall.</li> <br/>   
                                <li><span className="text-primary">GRADO COMPARATIVO:</span> Se usa para comparar dos cosas (Taller, Bigger). <br/>  ------------------------- Susan es mas alta que Nick = Susan is taller tan Nick </li> <br/>                          
                                <li><span className="text-primary">GRADO SUPERLATIVO:</span> Indica el extremo superior (The tallest, The biggest). <br/>  ------------------------ Susan es la mas alta = Susan is the Tallest.</li> <br/>                        
                            </ul>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grados')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'grammar_comp':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">COMPARATIVOS (+ER)</CardTitle></CardHeader>
                            <CardContent className="space-y-6 text-foreground font-bold">
                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">USO:</h4>
                                    <p className="text-lg">SE USA EN INGLÉS PARA COMPARAR DIFERENCIAS ENTRE LOS DOS SUSTANTIVOS A LOS QUE MODIFICA.</p>
                                </div>

                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">MODIFICACIÓN DEL ADJETIVO (ADJECTIVE+ ER):</h4>
                                    <div className="font-mono text-xl space-y-1">
                                        <p>small &rarr; <span className="text-primary">SMALLER</span> (más pequeño que)</p>
                                        <p>high &rarr; <span className="text-primary">HIGHER</span> (más alto que)</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary text-center">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">ESTRUCTURA:</h4>
                                    <p className="font-mono text-lg uppercase">sustantivo + verbo + adjetivo comparativo + than + sustantivo</p>
                                </div>

                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-4">TOPICS:</h4>
                                    <ul className="space-y-3 text-base font-bold">
                                        <li className="flex gap-2"><span>1-</span> <p>Monosilabos = Adjetivos Cortos <span className="text-primary">(Adjective + ER)</span></p></li>
                                        <li className="flex gap-2"><span>2-</span> <p>Bisilabos = Adjetivos con 2 silabas <span className="text-primary">(Adjective + ER)</span></p></li>
                                        <li className="flex gap-2"><span>3-</span> <p>Adjetivos Largos = Tienen mas de 2 silabas <span className="text-primary">(more + adjetivo largo + than)</span></p></li>
                                        <li className="flex gap-2"><span>4-</span> <p>Adjetivos Irregulares = Cambian en todas sus formas</p></li>
                                    </ul>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_comp')} size="lg" className="px-12 font-bold">Continuar</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'ex_comp': return <BallsExercise title="Ejercicios Comparativos" prompts={monoPrompts} onComplete={() => handleTopicComplete('ex_comp')} vocabulary={exCompVocab} />;
            case 'grammar_sup':
                return (
                    <div className="space-y-6 text-left">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">SUPERLATIVOS (+EST)</CardTitle></CardHeader>
                            <CardContent className="space-y-6 font-bold">
                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">USO:</h4>
                                    <p className="text-lg">SE EMPLEA PARA DESCRIBIR UN SUSTANTIVO QUE SE ENCUENTRA EN EL EXTREMO SUPERIOR (EL MAS) Ó EL INFERIOR (EL MENOS).</p>
                                </div>

                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">MODIFICACIÓN DEL ADJETIVO (ADJECTIVE+ EST):</h4>
                                    <div className="font-mono text-xl space-y-1">
                                        <p>Tall &rarr; <span className="text-primary">The TALLEST</span> (el más alto)</p>
                                        <p>Fast &rarr; <span className="text-primary">The FASTEST</span> (el más rápido)</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary text-center">
                                    <h4 className="text-primary font-black uppercase text-sm mb-2">ESTRUCTURA:</h4>
                                    <p className="font-mono text-lg uppercase">sustantivo + verbo + THE + Adjetivo superlativo + Sustantivos ó complemento</p>
                                </div>

                                <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                    <h4 className="text-primary font-black uppercase text-sm mb-4">TOPICS:</h4>
                                    <ul className="space-y-3 text-base font-bold">
                                        <li className="flex gap-2"><span>1-</span> <p>Monosilabos = Adjetivos Cortos <span className="text-primary">(Adjective + EST)</span></p></li>
                                        <li className="flex gap-2"><span>2-</span> <p>Bisilabos = Adjetivos con 2 silabas <span className="text-primary">(Adjective + EST)</span></p></li>
                                        <li className="flex gap-2"><span>3-</span> <p>Adjetivos Largos = Tienen mas de 2 silabas <span className="text-primary">(The Most + adjetivos largos)</span></p></li>
                                        <li className="flex gap-2"><span>4-</span> <p>Adjetivos Irregulares = Cambian en todas sus formas</p></li>
                                    </ul>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_sup')} size="lg" className="px-12 font-bold">Continuar</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'ex_sup': return <BallsExercise title="Ejercicios Superlativos" prompts={bisPrompts.slice(0, 4)} onComplete={() => handleTopicComplete('ex_sup')} vocabulary={exSupVocab} />;
            case 'formacion':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">FORMACIÓN Y REGLAS</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-muted rounded-xl border-l-4 border-primary">
                                <h4 className="font-bold mb-2">1. Regla del doblado (CVC)</h4>
                                <p>Si un adjetivo corto termina en Consonante + Vocal + Consonante, se dobla la última letra.</p>
                                <p className="font-mono mt-2 italic">BIG &rarr; BIGGER / HOT &rarr; HOTTER</p>
                            </div>
                            <div className="p-4 bg-muted rounded-xl border-l-4 border-primary">
                                <h4 className="font-bold mb-2">2. Terminados en "Y"</h4>
                                <p>Cambiamos la "y" por "i" y agregamos ER o EST.</p>
                                <p className="font-mono mt-2 italic">HAPPY &rarr; HAPPIER / THE HAPPIEST</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('formacion')} size="lg">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'monosilabos':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">MONOSÍLABOS</CardTitle></CardHeader>
                        <CardContent><p className="text-lg">Adjetivos de una sola sílaba siguen las reglas básicas de (+ER) y (+EST).</p></CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('monosilabos')} size="lg">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'ex_mono': return <BallsExercise title="Ejercicios Monosílabos" prompts={monoPrompts} onComplete={() => handleTopicComplete('ex_mono')} vocabulary={exMonoVocab} />;
            case 'bisilabos':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">BISÍLABOS</CardTitle></CardHeader>
                        <CardContent><p className="text-lg">Adjetivos de dos sílabas que terminan en "y", "le", "er", "ow" suelen comportarse como cortos.</p></CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('bisilabos')} size="lg">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'ex_bis': return <BallsExercise title="Ejercicios Bisílabos" prompts={bisPrompts} onComplete={() => handleTopicComplete('ex_bis')} vocabulary={exBisVocab} />;
            case 'largos':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">ADJETIVOS LARGOS</CardTitle></CardHeader>
                        <CardContent className="space-y-4 font-bold">
                            <p>Adjetivos de 3 o más sílabas no usan sufijos.</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-muted rounded-xl text-foreground">
                                    <p className="text-primary font-black">COMPARATIVO</p>
                                    <p className="font-mono">MORE + ADJETIVO</p>
                                </div>
                                <div className="p-4 bg-muted rounded-xl text-foreground">
                                    <p className="text-primary font-black">SUPERLATIVO</p>
                                    <p className="font-mono">THE MOST + ADJETIVO</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('largos')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex_largos': return <BallsExercise title="Ejercicios Largos" prompts={longPrompts} onComplete={() => handleTopicComplete('ex_largos')} vocabulary={exLongVocab} />;
            case 'irregulares':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">ADJETIVOS IRREGULARES</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-muted"><TableRow><TableHead>Positive</TableHead><TableHead>Comparative</TableHead><TableHead>Superlative</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell className="font-bold">GOOD (Bueno)</TableCell><TableCell className="text-primary">Better</TableCell><TableCell className="text-primary">The best</TableCell></TableRow>
                                    <TableRow><TableCell className="font-bold">BAD (Malo)</TableCell><TableCell className="text-red-500">Worse</TableCell><TableCell className="text-red-500">The worst</TableCell></TableRow>
                                    <TableRow><TableCell className="font-bold">FAR (Lejos)</TableCell><TableCell className="text-blue-500">Farther / Further</TableCell><TableCell className="text-blue-500">The farthest / furthest</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                        <CardFooter className="justify-center"><Button onClick={() => handleTopicComplete('irregulares')} size="lg">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'ex_irreg': return <BallsExercise title="Ejercicios Irregulares" prompts={irregularPrompts} onComplete={() => handleTopicComplete('ex_irreg')} vocabulary={exIrregVocab} />;
            case 'ex_mixto_1': return <BallsExercise title="Ejercicio Mixto 1" prompts={[...monoPrompts.slice(0, 3), ...longPrompts.slice(0, 3)]} onComplete={() => handleTopicComplete('ex_mixto_1')} vocabulary={{...exMonoVocab, ...exLongVocab}} />;
            case 'igualdad':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">COMPARATIVO DE IGUALDAD</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg font-bold">Se usa para decir que dos cosas son iguales en una cualidad.</p>
                            <div className="p-4 bg-muted rounded-xl font-mono text-xl text-center border-2 border-dashed">AS + ADJETIVO + AS</div>
                            <p className="italic text-muted-foreground text-center">Ej: As tall as (Tan alto como)</p>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('igualdad')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex_igual': return <BallsExercise title="Ejercicio de Igualdad" prompts={equalityPrompts} onComplete={() => handleTopicComplete('ex_igual')} vocabulary={exEqualityVocab} />;
            case 'inferioridad':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">COMPARATIVO DE INFERIORIDAD</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg font-bold">Se usa para decir que algo es "menos" que otra cosa.</p>
                            <div className="p-4 bg-muted rounded-xl font-mono text-xl text-center border-2 border-dashed">LESS + ADJETIVO + THAN</div>
                            <p className="italic text-muted-foreground text-center">Ej: Less expensive than (Menos caro que)</p>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('inferioridad')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex_inf': return <BallsExercise title="Ejercicio de Inferioridad" prompts={inferiorityPrompts} onComplete={() => handleTopicComplete('ex_inf')} vocabulary={exInferiorityVocab} />;
            case 'ex_mixto_2': return <BallsExercise title="Ejercicio Mixto 2" prompts={[...irregularPrompts.slice(0, 3), ...equalityPrompts.slice(0, 2), ...inferiorityPrompts.slice(0, 2)]} onComplete={() => handleTopicComplete('ex_mixto_2')} vocabulary={{...exIrregVocab, ...exEqualityVocab, ...exInferiorityVocab}} />;
            case 'ex_mixto_3': return <BallsExercise title="Misión Final: Mixto 3" prompts={mixed3Prompts} onComplete={() => handleTopicComplete('ex_mixto_3')} vocabulary={exMixed3Vocab} />;
            case 'dictation':
                return (
                    <ManualGradingExercise 
                        title="DICTATION"
                        description="Escucha y escribe las frases dictadas por tu profesor."
                        onComplete={() => handleTopicComplete('dictation')} 
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictationData}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictationGrades}
                        savePath={`lessonProgress.${progressStorageVersion}.dictationData`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.dictationGrades`}
                        isAdmin={isAdmin}
                        lineCount={21}
                    />
                );
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
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 13 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle className='text-primary font-black uppercase text-sm'>Tu Aventura</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="max-h-[60vh] overflow-y-auto pr-2 text-foreground">
                                        <nav><ul className="space-y-1">
                                            {learningPath.map(item => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isActive = item.status === 'active';
                                                const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold', isActive && !isAdmin && "animate-pulse-glow")}>
                                                        <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className="h-5 w-5" />}<span className='truncate max-w-[150px]'>{item.name}</span></div>
                                                        {isLocked && <Lock className="h-4 w-4 text-yellow-500/50" />}
                                                    </li>
                                                );
                                            })}
                                        </ul></nav>
                                    </div>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 text-muted-foreground"><span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
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