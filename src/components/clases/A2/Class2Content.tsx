'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
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
    Info,
    Check,
    X,
    ArrowLeft,
    Clock,
    Scale,
    Split,
    Link as LinkIcon
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_eng_u1_c2_v10_full_content';
const mainProgressKey = 'progress_a2_eng_unit_1_class_2';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const basicVerbsVocab = [
    { en: "TO GIVE", es: "DAR" }, { en: "TO GO", es: "IR" }, { en: "TO HAVE", es: "HABER-TENER" },
    { en: "TO HEAR", es: "OIR" }, { en: "TO KNOW", es: "SABER-CONOCER" }, { en: "TO LEARN", es: "APRENDER" },
    { en: "TO LEAVE", es: "PARTIR-IRSE" }, { en: "TO LOSE", es: "PERDER" }, { en: "TO MAKE", es: "HACER" },
    { en: "TO MEET", es: "ENCONTRAR" }, { en: "TO PUT", es: "PONER" }, { en: "TO READ", es: "LEER" },
    { en: "TO RUN", es: "CORRER" }, { en: "TO SAY", es: "DECIR" }, { en: "TO SEE", es: "VER" },
    { en: "TO SELL", es: "VENDER" }, { en: "TO SEND", es: "ENVIAR" }, { en: "TO SLEEP", es: "DORMIR" },
    { en: "TO SPELL", es: "DELETREAR" }, { en: "TO SPEND", es: "GASTAR" }, { en: "TO SWIM", es: "NADAR" },
    { en: "TO TAKE", es: "TOMAR-AGARAR" },
];

const ex1Nouns = [
    { word: "COINS", cat: "countable" }, { word: "POLLUTION", cat: "uncountable" },
    { word: "CHAIR", cat: "countable" }, { word: "JUICE", cat: "uncountable" },
    { word: "COMPUTERS", cat: "countable" }, { word: "CAT", cat: "countable" },
    { word: "DOCUMENT", cat: "countable" }, { word: "PRIDE", cat: "uncountable" },
    { word: "TRAFFIC", cat: "uncountable" }, { word: "CARS", cat: "countable" },
    { word: "MILK", cat: "uncountable" }, { word: "SALT", cat: "uncountable" },
];

const ex2Prompts = [
    { spanish: "HAY MUCHAS MANZANAS EN ESE ARBOL", answer: ["there are many apples in that tree", "there are a lot of apples in that tree"] },
    { spanish: "YO VIVO CON EL HACE MUCHOS AÑOS", answer: ["i live with him many years ago", "i have lived with him for many years"] },
    { spanish: "ESA SEÑORA TIENE DEMASIADOS GATOS", answer: ["that lady has too many cats", "that woman has too many cats"] },
];

const ex3Prompts = [
    { spanish: "HAY MUCHO TRAFICO EN BOGOTA Y MEDELLIN PORQUE SON CIUDADES GRANDES", answer: ["there is much traffic in bogota and medellin because they are big cities", "there is a lot of traffic in bogota and medellin because they are big cities"] },
    { spanish: "HAY MUCHA CONTAMINACION EN ESE BARRIO PORQUE HAY MUCHAS EMPRESAS", answer: ["there is much pollution in that neighborhood because there are many companies", "there is a lot of pollution in that neighborhood because there are many companies"] },
    { spanish: "HAY DEMASIADA INFORMACION EN INTERNET, YO NO SE QUE ESTUDIAR", answer: ["there is too much information on the internet, i do not know what to study", "there's too much information on the internet, i don't know what to study"] },
];

const ex4Prompts = [
    { spanish: "ELLOS TIENEN MUCHOS AMIGOS EN HOLANDA", answer: ["they have many friends in the netherlands", "they have a lot of friends in the netherlands"] },
    { spanish: "EN ESTE PARQUE HAY ALGUNOS ARBOLES DE NARANJAS", answer: ["in this park there are some orange trees"] },
    { spanish: "EN ESA FINCA HAY MUCHAS FLORES DE VARIOS COLORES", answer: ["in that farm there are many flowers of various colors", "in that farm there are many flowers of different colors"] },
];

const someAnyPrompts = [
    { spanish: "TENEMOS MUCHOS AMIGOS EN ESTADOS UNIDOS", answer: ["we have many friends in the united states", "we have a lot of friends in the united states"] },
    { spanish: "NO HAY NINGUN TURISTA EN LA CIUDAD", answer: ["there are not any tourists in the city", "there aren't any tourists in the city", "there is no tourist in the city"] },
    { spanish: "¿CUANTOS GATOS TIENES?", answer: ["how many cats do you have?"] },
];

const ex5Prompts = [
    { spanish: "¿CUANTA LECHE HAY EN LA NEVERA? - HAY TRES LITROS", answer: ["how much milk is there in the fridge? - there are three liters"] },
    { spanish: "¿CUANTO VINO HAY EN LA CAJA? - HAY DOS BOTELLAS", answer: ["how much wine is there in the box? - there are two bottles"] },
    { spanish: "¿CUANTOS ANIMALES HAY EN LA FINCA? – HAY 6 PERROS", answer: ["how many animals are there on the farm? - there are 6 dogs"] },
];

const ex6Prompts = [
    { spanish: "NOSOTROS NO TENEMOS MUCHO TIEMPO PARA ESCUCHAR TUS PROBLEMAS, NECESITAMOS UNA SOLUCION", answer: ["we do not have much time to listen to your problems, we need a solution", "we don't have much time to listen to your problems, we need a solution"] },
    { spanish: "ELLA TIENE ALGUNAS MANZANAS EN LA CAJA", answer: ["she has some apples in the box"] },
    { spanish: "¿HAY MUCHOS CINES EN ESA CIUDAD?", answer: ["are there many cinemas in that city?", "are there a lot of cinemas in that city?"] },
];

const finalExPrompts = [
    { spanish: "¿HAY POCA CONTAMINACION EN TU CIUDAD?", answer: ["is there little pollution in your city?"] },
    { spanish: "¿HAY MUCHO RUIDO EN TU BARRIO?", answer: ["is there much noise in your neighborhood?", "is there a lot of noise in your neighborhood?"] },
    { spanish: "¿CUANTOS HERMANOS TIENE ELLA?", answer: ["how many brothers does she have?"] },
];

const readingContent = {
    title: "Our Life in the City",
    text: `I live in a very big city. There is a lot of traffic every morning, so I always leave my house early. 

In my neighborhood, there are many tall buildings and some small parks. Most of the people here work in offices. 

We have some problems with pollution because there are many cars, but the government is trying to use more renewable energy. 

How many parks are there? Not many, but there is enough space for children to play. I love my city, but sometimes there is too much noise!`,
    questions: [
        { id: 'q1', question: "Why does the narrator leave the house early?", answers: ["there is a lot of traffic", "lot of traffic", "traffic"] },
        { id: 'q2', question: "Are there many parks in the neighborhood?", answers: ["no, not many", "some small parks", "no"] },
        { id: 'q3', question: "Why is there pollution in the city?", answers: ["there are many cars", "many cars", "because there are many cars"] }
    ]
};

// --- HELPERS ---

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

// --- MAIN CLASS COMPONENT ---

export default function Class2Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const hasInitialized = useRef(false);

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(basicVerbsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(basicVerbsVocab.length).fill('unchecked'));
    const [ex1Answers, setEx1Answers] = useState<Record<number, string>>({});
    const [ex1Validation, setEx1Validation] = useState<Record<number, any>>({});
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

    const initialPathData = useMemo(() => [
        { key: 'vocabulary_basic', name: '1. Vocabulary (Verbos Basicos)', icon: BookOpen },
        { key: 'grammar_1', name: '2. Grammar 1', icon: GraduationCap },
        { key: 'exercise_1', name: '3. Exercise 1', icon: PenSquare },
        { key: 'grammar_2_quantifiers', name: '4. Grammar 2 (Quantifiers)', icon: GraduationCap },
        { key: 'exercise_2', name: '5. Exercise 2', icon: PenSquare },
        { key: 'exercise_3', name: '6. Exercise 3', icon: PenSquare },
        { key: 'grammar_3_base', name: '7. Grammar 3', icon: GraduationCap },
        { key: 'exercise_4', name: '8. Exercise 4', icon: PenSquare },
        { key: 'vocabulary_game', name: '9. Vocabulary (Game)', icon: Gamepad2 },
        { key: 'grammar_3_some_any', name: '10. Grammar 3 (Some & Any)', icon: GraduationCap },
        { key: 'ex_some_any', name: '11. Exercise with some & any', icon: PenSquare },
        { key: 'grammar_4', name: '12. Grammar 4', icon: GraduationCap },
        { key: 'exercise_5', name: '13. Exercise 5', icon: PenSquare },
        { key: 'exercise_6', name: '14. Exercise 6', icon: PenSquare },
        { key: 'reading', name: '15. Reading', icon: BookText },
        { key: 'final_exercise', name: '16. Final Exercise', icon: Trophy },
    ], []);

    useEffect(() => {
        if (!isUserLoading && !isProfileLoading) setIsInitialLoading(false);
    }, [isUserLoading, isProfileLoading]);

    useEffect(() => {
        if (isInitialLoading || hasInitialized.current) return;
        let path = initialPathData.map((topic, index) => ({ 
            ...topic, 
            status: index === 0 ? 'active' : 'locked' as 'completed' | 'active' | 'locked'
        }));
        const d = studentProfile?.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !overrideStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < path.length; i++) { if (last && path[i].status === 'locked') path[i].status = 'active'; last = path[i].status === 'completed'; }
        }
        setLearningPath(path); setSelectedTopic(d.lastSelectedTopic || path.find(it => it.status === 'active')?.key || path[0].key);
        hasInitialized.current = true;
    }, [isInitialLoading, studentProfile, isAdmin, initialPathData, overrideStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || overrideStudentId || !hasInitialized.current) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, overrideStudentId]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setLearningPath(curr => {
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === completedKey);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active'; setSelectedTopic(np[idx + 1].key);
                    setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
                }
            }
            return np;
        });
    }, [toast]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
        const auto = ['grammar_1', 'grammar_2_quantifiers', 'grammar_3_base', 'grammar_3_some_any', 'grammar_4'];
        if (auto.includes(key)) handleTopicComplete(key);
    };

    const handleCheckVocab = () => {
        let ok = true;
        const nv = basicVerbsVocab.map((v, i) => {
            const res = v.en === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) ok = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (ok) { toast({ title: "¡Vocabulario Completo!" }); handleTopicComplete('vocabulary_basic'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckReading = () => {
        let allOk = true;
        const nv: any = {};
        readingContent.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const res = q.answers.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = res ? 'correct' : 'incorrect';
            if (!res) allOk = false;
        });
        setReadVal(nv);
        if (allOk) { toast({ title: "¡Lectura Superada!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        switch (selectedTopic) {
            case 'vocabulary_basic':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulary: Basic Verbs</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div>
                                    {basicVerbsVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.es}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} className={cn("h-12 uppercase font-mono", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isAdmin && !!overrideStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary_basic')} disabled={!vocabValidation.every(v => v === 'correct') && !isAdmin} className='text-white font-bold'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar_1':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-card/40 backdrop-blur-md p-6">
                            <CardHeader><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR: COUNTABLE vs UNCOUNTABLE</CardTitle></CardHeader>
                            <CardContent className="space-y-8 font-bold">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-primary/20 shadow-lg">
                                        <h3 className="text-2xl font-black text-primary uppercase mb-4 flex items-center gap-2"><Scale className='h-6 w-6'/> Countable Nouns</h3>
                                        <p className="mb-4">Son cosas que podemos contar usando números. Tienen forma singular y plural.</p>
                                        <ul className="space-y-2 text-sm italic list-disc pl-5">
                                            <li>One apple, two apples</li>
                                            <li>A chair, three chairs</li>
                                            <li>One cat, ten cats</li>
                                        </ul>
                                    </div>
                                    <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-brand-purple/20 shadow-lg">
                                        <h3 className="text-2xl font-black text-brand-purple uppercase mb-4 flex items-center gap-2"><Clock className='h-6 w-6'/> Uncountable Nouns</h3>
                                        <p className="mb-4">Son cosas que no podemos contar con números. Generalmente son líquidos, polvos o conceptos abstractos.</p>
                                        <ul className="space-y-2 text-sm italic list-disc pl-5">
                                            <li>Water, milk, juice (Líquidos)</li>
                                            <li>Salt, sugar, sand (Polvos)</li>
                                            <li>Traffic, pollution, information (Abstractos)</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar_1')} size="lg" className="px-16 font-black h-14 text-xl uppercase shadow-xl">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'exercise_1':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Exercise 1: Classification</CardTitle><CardDescription>Clasifica cada palabra como Contable o Incontable.</CardDescription></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ex1Nouns.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                                        <span className="font-bold text-lg">{item.word}</span>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant={ex1Answers[i] === 'countable' ? 'default' : 'outline'} onClick={() => { setEx1Answers({...ex1Answers, [i]: 'countable'}); setEx1Validation({...ex1Validation, [i]: null}); }} className={cn(ex1Validation[i] === 'correct' && item.cat === 'countable' && "bg-green-500")}>C</Button>
                                            <Button size="sm" variant={ex1Answers[i] === 'uncountable' ? 'default' : 'outline'} onClick={() => { setEx1Answers({...ex1Answers, [i]: 'uncountable'}); setEx1Validation({...ex1Validation, [i]: null}); }} className={cn(ex1Validation[i] === 'correct' && item.cat === 'uncountable' && "bg-green-500")}>U</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => {
                            let ok = true; const nv: any = {};
                            ex1Nouns.forEach((item, i) => { const res = ex1Answers[i] === item.cat; nv[i] = res ? 'correct' : 'incorrect'; if (!res) ok = false; });
                            setEx1Validation(nv); if (ok) handleTopicComplete('exercise_1');
                        }} size="lg" className="px-12 font-bold">Verificar Clasificación</Button></CardFooter>
                    </Card>
                );
            case 'grammar_2_quantifiers':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR 2: QUANTIFIERS</CardTitle></CardHeader>
                        <CardContent className="space-y-8 font-bold">
                            <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border">
                                <h4 className="text-primary font-black uppercase text-sm mb-2">With Countables:</h4>
                                <ul className="space-y-1">
                                    <li>MANY (Muchos/as)</li>
                                    <li>TOO MANY (Demasiados/as)</li>
                                    <li>A FEW (Pocos/as)</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border">
                                <h4 className="text-brand-purple font-black uppercase text-sm mb-2">With Uncountables:</h4>
                                <ul className="space-y-1">
                                    <li>MUCH (Mucho/a)</li>
                                    <li>TOO MUCH (Demasiado/a)</li>
                                    <li>A LITTLE (Poco/a)</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar_2_quantifiers')} size="lg" className="px-12 font-bold">Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'exercise_2': return <BallsExercise title="Exercise 2: Countable Quantifiers" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={{"manzanas": "apples", "arbol": "tree", "muchos años": "many years", "demasiados": "too many"}} />;
            case 'exercise_3': return <BallsExercise title="Exercise 3: Uncountable Quantifiers" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={{"tráfico": "traffic", "contaminación": "pollution", "empresas": "companies", "demasiada": "too much", "información": "information"}} />;
            case 'grammar_3_base':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-xl font-bold text-primary uppercase">GRAMMAR 3: QUANTIFIERS FOR BOTH</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm font-bold">
                            {[
                                "ALL OF THE TREES – WATER: todos los árboles, toda el agua.",
                                "SOME CANDIES: algunos caramelos",
                                "ANY: ninguno - algunos-as",
                                "NO- NONE: NINGUNO-A, NADA DE.",
                                "MOST OF THE TREES-WATER: la mayoría de los árboles/ de agua",
                                "ENOUGH TRAFFIC- BOOKS: suficiente tráfico, suficientes libros",
                                "A LOT OF -LOTS OF CATS- POLLUTION: muchos gatos, mucha contaminacion",
                                "PLENTY OF CARS- TRAFFIC: bastante / tantos arboles- trafico",
                                "A LACK OF ANIMALS- WATER: una falta de animales-agua"
                            ].map((rule, idx) => (
                                <div key={idx} className="p-3 bg-muted/30 rounded-lg border flex items-center gap-3">
                                    <div className="h-2 w-2 bg-primary rounded-full shrink-0" />
                                    <p>{rule}</p>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-4"><Button onClick={() => handleTopicComplete('grammar_3_base')} size="lg">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4': return <BallsExercise title="Exercise 4: General Translation" prompts={ex4Prompts} onComplete={() => handleTopicComplete('exercise_4')} vocabulary={{"Holanda": "The Netherlands", "algunos": "some", "varios": "various"}} />;
            case 'vocabulary_game':
                return <VocabularyMatchingGame data={basicVerbsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocabulary_game')} title="Basic Verbs Memory" />;
            case 'grammar_3_some_any':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR 3: SOME & ANY</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold">
                            <div className="space-y-4">
                                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                    <h4 className="text-green-600 font-black mb-2 uppercase">SOME</h4>
                                    <p>(+) Frases Afirmativas: Algunos / Unos / Algo de.</p>
                                    <p>(?) Interrogativas: Cuando se PIDE o se OFRECE algo.</p>
                                    <div className="mt-2 text-xs italic text-muted-foreground">Ej: Would you like some coffee? / Can I have some water?</div>
                                </div>
                                <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <h4 className="text-red-600 font-black mb-2 uppercase">ANY</h4>
                                    <p>(-): En las Negativas: Ninguno / Nada de.</p>
                                    <p>(?): En las Interrogativas: ¿Algo de? / ¿Algunos?.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_3_some_any')} size="lg" className="px-12 font-bold h-12 uppercase">Continuar</Button></CardFooter>
                    </Card>
                );
            case 'ex_some_any': return <BallsExercise title="Exercise: Some & Any" prompts={someAnyPrompts} onComplete={() => handleTopicComplete('ex_some_any')} vocabulary={{"turista": "tourist", "ningún": "any (neg)", "cuántos": "how many"}} />;
            case 'grammar_4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR 4: HOW MUCH & HOW MANY</CardTitle></CardHeader>
                        <CardContent className="space-y-6 font-bold">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-card rounded-2xl border">
                                    <h4 className="text-primary font-black uppercase mb-1">HOW MANY?</h4>
                                    <p className="text-xs mb-2">Sustantivos Contables (Plural)</p>
                                    <p className="text-base">¿Cuántos / Cuántas?</p>
                                </div>
                                <div className="p-4 bg-card rounded-2xl border">
                                    <h4 className="text-brand-purple font-black uppercase mb-1">HOW MUCH?</h4>
                                    <p className="text-xs mb-2">Sustantivos No Contables</p>
                                    <p className="text-base">¿Cuánto / Cuánta?</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-card rounded-2xl border">
                                    <h4 className="text-primary font-black uppercase mb-1">THERE ARE</h4>
                                    <p className="text-xs mb-2">Contables (Plural)</p>
                                    <p className="text-base">HAY</p>
                                </div>
                                <div className="p-4 bg-card rounded-2xl border">
                                    <h4 className="text-brand-purple font-black uppercase mb-1">THERE IS</h4>
                                    <p className="text-xs mb-2">No Contables / Singular</p>
                                    <p className="text-base">HAY</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_4')} size="lg" className="px-12 font-bold h-12">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'exercise_5': return <BallsExercise title="Exercise 5: Quantities" prompts={ex5Prompts} onComplete={() => handleTopicComplete('exercise_5')} vocabulary={{"leche": "milk", "litros": "liters", "vino": "wine", "botellas": "bottles", "finca": "farm"}} />;
            case 'exercise_6': return <BallsExercise title="Exercise 6: Mix" prompts={ex6Prompts} onComplete={() => handleTopicComplete('exercise_6')} vocabulary={{"mucho tiempo": "much time", "escuchar": "listen to", "problemas": "problems", "solución": "solution", "algunas": "some", "cines": "cinemas"}} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className="uppercase tracking-tighter">Reading: {readingContent.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner whitespace-pre-wrap">{readingContent.text}</div>
                            <Separator /><div className="space-y-4">{readingContent.questions.map(q => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold'>{q.question}</Label>
                                <Input value={readAns[q.id] || ''} onChange={e => setReadAns({...readAns, [q.id]: e.target.value})} className={cn(readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={isAdmin && !!overrideStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={isAdmin && !!overrideStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'final_exercise': return <BallsExercise title="Final Exercise" prompts={finalExPrompts} onComplete={() => handleTopicComplete('final_exercise')} vocabulary={{"poca": "little", "ruido": "noise", "barrio": "neighborhood", "hermanos": "brothers"}} />;
            default: return null;
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-white font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión A2...</p>
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            {/* Contenido Principal */}
            <div className="md:col-span-9 md:order-1 order-2">
                {renderContent()}
            </div>

            {/* Sidebar de Navegación Lateral */}
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Misión 2A
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <nav>
                            <ul className="space-y-1">
                                {learningPath.map((item) => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_CONFIG[item.status] || BookOpen;
                                    return (
                                        <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                            className={cn(
                                                'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {item.status === 'completed' ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />
                                                )}
                                                <span className="truncate max-w-[150px] text-[10px] uppercase font-bold">{item.name}</span>
                                            </div>
                                            {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                        <div className="mt-6 pt-6 border-t">
                            <div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground">
                                <span>Avance Clase</span>
                                <span className="text-primary">{progressValue}%</span>
                            </div>
                            <Progress value={progressValue} className="h-2 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
