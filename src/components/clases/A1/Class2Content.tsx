'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    GraduationCap, 
    CheckCircle, 
    BrainCircuit, 
    PenSquare, 
    Lock, 
    Loader2, 
    ArrowRight, 
    BookText,
    Trophy,
    Gamepad2,
    ChevronDown
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { VerbMemoryGame } from '@/components/kids/exercises/verb-memory-game';
import { ReadingComprehensionExercise } from '@/components/kids/exercises/reading-comprehension';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// --- DATA ---

const progressStorageKey = 'progress_a1_eng_u1_c2_v500_blindado';
const mainProgressKey = 'progress_a1_eng_unit_1_class_2';

const verbVocabulary = [
    { spanish: 'JUGAR', english: 'play' },
    { spanish: 'CAMINAR', english: 'walk' },
    { spanish: 'IR', english: 'go' },
    { spanish: 'TRABAJAR', english: 'work' },
    { spanish: 'DORMIR', english: 'sleep' },
    { spanish: 'COMER', english: 'eat' },
    { spanish: 'BEBER', english: 'drink' },
    { spanish: 'VER', english: 'see' },
    { spanish: 'MIRAR', english: 'look' },
    { spanish: 'SALIR', english: 'go out' },
    { spanish: 'CORRER', english: 'run' },
    { spanish: 'CANTAR', english: 'sing' },
    { spanish: 'HABLAR', english: 'speak' },
    { spanish: 'PENSAR', english: 'think' },
    { spanish: 'HABER/TENER', english: 'have' },
    { spanish: 'HACER', english: 'do' },
    { spanish: 'ESTUDIAR', english: 'study' },
    { spanish: 'ESCRIBIR', english: 'write' },
    { spanish: 'LEER', english: 'read' },
    { spanish: 'APRENDER', english: 'learn' },
    { spanish: 'ENSEÑAR', english: 'teach' },
];

const basicWords = [
    { spanish: 'AYER', english: 'yesterday' },
    { spanish: 'HOY', english: 'today' },
    { spanish: 'MAÑANA', english: 'tomorrow' },
    { spanish: 'AÑO', english: 'year' },
    { spanish: 'DÍA', english: 'day' },
    { spanish: 'SEMANA', english: 'week' },
    { spanish: 'MES', english: 'month' },
    { spanish: 'CON', english: 'with' },
    { spanish: 'DESAYUNO', english: 'breakfast' },
    { spanish: 'ALMUERZO', english: 'lunch' },
    { spanish: 'CENA', english: 'dinner' },
    { spanish: 'SIN', english: 'without' },
];

const posExercises = [
    { spanish: 'yo bebo agua', answer: ["I drink water"] },
    { spanish: 'nosotros jugamos futbol', answer: ["we play soccer", "we play football"] },
    { spanish: 'ellos escuchan música', answer: ["they listen to music"] },
    { spanish: 'yo hablo ingles', answer: ["I speak English"] },
    { spanish: 'tu abres la puerta', answer: ["you open the door"] },
];

const negExercises = [
    { spanish: 'yo no bebo agua', answer: ["I do not drink water", "I don't drink water"] },
    { spanish: 'nosotros no jugamos futbol', answer: ["we do not play soccer", "we don't play soccer", "we do not play football", "we don't play football"] },
    { spanish: 'ellos no escuchan música', answer: ["they do not listen to music", "they don't listen to music"] },
    { spanish: 'yo no hablo ingles', answer: ["I do not speak English", "I don't speak English"] },
    { spanish: 'tu no abres la puerta', answer: ["you do not open the door", "you don't open the door"] },
];

const intExercises = [
    { spanish: '¿yo bebo agua?', answer: ["do I drink water?"] },
    { spanish: '¿nosotros jugamos futbol?', answer: ["do we play soccer?", "do we play football?"] },
    { spanish: '¿ellos escuchan música?', answer: ["do they listen to music?"] },
    { spanish: '¿yo hablo ingles?', answer: ["do I speak English?"] },
    { spanish: '¿tu abres la puerta?', answer: ["do you open the door?"] },
];

const exercise1Prompts = [
    { spanish: "TU JUEGAS TENIS EL LUNES", answers: { affirmative: ["you play tennis on monday"], negative: ["you do not play tennis on monday", "you don't play tennis on monday"], interrogative: ["do you play tennis on monday?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "NOSOTROS CAMINAMOS EN EL PARQUE", answers: { affirmative: ["we walk in the park"], negative: ["we do not walk in the park", "we don't walk in the park"], interrogative: ["do we walk in the park?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, we do not", "no, we don't"] } },
    { spanish: "ELLOS VAN A LA UNIVERSIDAD EL SABADO", answers: { affirmative: ["they go to the university on saturday"], negative: ["they do not go to the university on saturday", "they don't go to the university on saturday"], interrogative: ["do they go to the university on saturday?"], shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
    { spanish: "TÚ DUERMES EN LA TARDE", answers: { affirmative: ["you sleep in the afternoon"], negative: ["you do not sleep in the afternoon", "you don't sleep in the afternoon"], interrogative: ["do you sleep in the afternoon?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "NOSOTROS COMEMOS CARNE Y ENSALADA", answers: { affirmative: ["we eat meat and salad"], negative: ["we do not eat meat and salad", "we don't eat meat and salad"], interrogative: ["do we eat meat and salad?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, we do not", "no, we don't"] } },
    { spanish: "ELLOS BEBEN CERVEZA", answers: { affirmative: ["they drink beer"], negative: ["they do not drink beer", "they don't drink beer"], interrogative: ["do they drink beer?"], shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
    { spanish: "ELLOS VAN A LA IGLESIA EL MIERCOLES", answers: { affirmative: ["they go to church on wednesday"], negative: ["they do not go to church on wednesday", "they don't go to church on wednesday"], interrogative: ["do they go to church on wednesday?"], shortAffirmative: ["yes, they do"], shortNegative: ["no, they do not", "no, they don't"] } },
    { spanish: "NOSOTROS JUGAMOS FUTBOL LOS SABADOS", answers: { affirmative: ["we play soccer on saturdays", "we play football on saturdays"], negative: ["we do not play soccer on saturdays", "we don't play soccer on saturdays"], interrogative: ["do we play soccer on saturdays?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, we do not", "no, we don't"] } },
    { spanish: "YO VEO PELÍCULAS LOS VIERNES EN LA NOCHE", answers: { affirmative: ["i watch movies on friday nights", "i watch movies on fridays at night"], negative: ["i do not watch movies on friday nights", "i don't watch movies on friday nights"], interrogative: ["do i watch movies on friday nights?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "NOSOTROS TRABAJAMOS LOS DOMINGOS", answers: { affirmative: ["we work on sundays"], negative: ["we do not work on sundays", "we don't work on sundays"], interrogative: ["do we work on sundays?"], shortAffirmative: ["yes, we do"], shortNegative: ["no, we do not", "no, we don't"] } },
];

const exercise2Prompts = [
    { spanish: "TU HACES LA TAREA", answers: { affirmative: ["you do the homework"], negative: ["you do not do the homework", "you don't do the homework"], interrogative: ["do you do the homework?"], shortAffirmative: ["yes, i do"], shortNegative: ["no, i do not", "no, i don't"] } },
    { spanish: "ELLA HACE EJERCICIO", answers: { affirmative: ["she does exercise"], negative: ["she does not do exercise", "she doesn't do exercise"], interrogative: ["does she do exercise?"], shortAffirmative: ["yes, she does"], shortNegative: ["no, she does not", "no, she doesn't"] } },
];

const posVocab = { "beber": "drink", "jugar": "play", "escuchar": "listen", "música": "music", "hablar": "speak", "abrir": "open", "puerta": "door" };
const negVocab = { "beber": "drink", "jugar": "play", "escuchar": "listen", "música": "music", "hablar": "speak", "abrir": "open", "puerta": "door" };
const intVocab = { "beber": "drink", "jugar": "play", "escuchar": "listen", "música": "music", "hablar": "speak", "abrir": "open", "puerta": "door" };
const ex1Vocab = {
    "jugar": "play", "tenis": "tennis", "lunes": "monday", "caminar": "walk", "parque": "park", 
    "ir": "go", "universidad": "university", "sabado": "saturday", "dormir": "sleep", "tarde": "afternoon",
    "comer": "eat", "carne": "meat", "ensalada": "salad", "beber": "drink", "cerveza": "beer",
    "iglesia": "church", "miercoles": "wednesday", "futbol": "soccer/football", "ver": "watch/see",
    "peliculas": "movies", "viernes": "friday", "noche": "night", "trabajar": "work", "domingo": "sunday"
};

// --- SUB-COMPONENTS ---

const VocabularyGame = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);

    const gameData = useMemo(() => verbVocabulary.map(v => {
        const full = v.english.toLowerCase();
        const gapIdx = Math.floor(Math.random() * full.length);
        const gapped = full.substring(0, gapIdx) + '_' + full.substring(gapIdx + 1);
        return { spanish: v.spanish, english: full, gapped, missing: full[gapIdx] };
    }), []);

    const current = gameData[currentIndex];

    const handleCheck = () => {
        if (userAnswer.trim().toLowerCase() === current.missing) {
            if (currentIndex === gameData.length - 1) {
                setIsCompleted(true);
            } else {
                toast({ title: "¡Correcto!" });
                setCurrentIndex(prev => prev + 1);
                setUserAnswer('');
            }
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Inténtalo de nuevo." });
        }
    };

    if (isCompleted) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple text-center p-12 bg-card/95">
                <Trophy className="h-20 w-20 mx-auto text-yellow-400 mb-6 animate-bounce" />
                <h2 className="text-3xl font-black text-primary uppercase">Congratulations!</h2>
                <p className="text-muted-foreground mt-2 mb-8">Has completado el reto de vocabulario.</p>
                <Button onClick={onComplete} size="lg" className='px-12 text-white font-bold'>Terminar</Button>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader><CardTitle>Vocabulary (Game)</CardTitle><CardDescription>Completa la palabra con la letra que falta.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center"><p className="text-sm text-muted-foreground">Palabra {currentIndex + 1} de {gameData.length}</p><p className="text-2xl font-bold text-primary mt-2">{current.spanish}</p></div>
                <div className="flex justify-center items-center gap-2 text-4xl font-mono tracking-widest bg-muted p-8 rounded-2xl border">
                    {current.gapped.split('_')[0]}
                    <Input value={userAnswer} onChange={e => setUserAnswer(e.target.value.slice(-1))} className="w-12 h-14 text-center text-3xl font-bold border-primary border-2 uppercase" autoComplete="off" />
                    {current.gapped.split('_')[1]}
                </div>
            </CardContent>
            <CardFooter className="justify-center"><Button onClick={handleCheck} size="lg">Verificar</Button></CardFooter>
        </Card>
    );
};

const SingleFormExercise = ({ title, data, onComplete, vocab }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<'correct' | 'incorrect' | 'unchecked'>('unchecked');

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,]/g, '');
        const isCorrect = data[currentIndex].answer.some((a: string) => a.toLowerCase().replace(/[.?,]/g, '') === userVal);
        setStatus(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) toast({ title: "¡Muy bien!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleNext = () => {
        if (currentIndex < data.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setAnswer(''); setStatus('unchecked');
        } else {
            onComplete();
        }
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>{title}</CardTitle><CardDescription>Traduce la frase.</CardDescription></div>
                {vocab && (
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-brand-blue border-2'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                        <PopoverContent className="w-64">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(vocab).map(([es, en]: any) => (
                                    <React.Fragment key={es}><span className="text-muted-foreground">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl">{data[currentIndex].spanish}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} className={cn("h-12 text-lg", status === 'correct' ? 'border-green-500 bg-green-50/5' : status === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Tu traducción..." autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between">
                <Button onClick={handleCheck}>Verificar</Button>
                <Button onClick={handleNext} disabled={status !== 'correct'}>Siguiente <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
        </Card>
    );
};

const MultiFormExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({ affirmative: '', negative: '', interrogative: '', shortAffirmative: '', shortNegative: '' });
    const [validation, setValidation] = useState<any>({ affirmative: 'unchecked', negative: 'unchecked', interrogative: 'unchecked', shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
    const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

    const currentPrompt = prompts[currentIndex];

    useEffect(() => {
        setAnswers({ affirmative: '', negative: '', interrogative: '', shortAffirmative: '', shortNegative: '' });
        setValidation({ affirmative: 'unchecked', negative: 'unchecked', interrogative: 'unchecked', shortAffirmative: 'unchecked', shortNegative: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const fields: (keyof typeof answers)[] = ['affirmative', 'negative', 'interrogative', 'shortAffirmative', 'shortNegative'];
        const newVal = { ...validation };
        let allOk = true;

        fields.forEach(field => {
            const userVal = answers[field].trim().toLowerCase().replace(/[.?,]/g, '');
            const corrects = currentPrompt.answers[field].map((a: string) => a.toLowerCase().replace(/[.?,]/g, ''));
            if (field === 'interrogative' && !answers[field].trim().endsWith('?')) { allOk = false; newVal[field] = 'incorrect'; }
            else if (corrects.includes(userVal)) newVal[field] = 'correct';
            else { allOk = false; newVal[field] = 'incorrect'; }
        });

        setValidation(newVal);
        if (allOk) { toast({ title: "¡Correcto!" }); setCompletedMap(prev => ({ ...prev, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Incorrecto", description: "Revisa los campos marcados en rojo." });
    };

    const handleNext = () => {
        if (currentIndex < prompts.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>{title}</CardTitle><CardDescription>Traduce la frase en todas sus formas.</CardDescription></div>
                {vocabulary && (
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-brand-blue border-2'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                        <PopoverContent className="w-64">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(vocabulary).map(([es, en]: any) => (
                                    <React.Fragment key={es}><span className="text-muted-foreground">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2 justify-center mb-4 flex-wrap">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completedMap[i] ? "bg-green-500 text-white border-green-500" : (validation.affirmative === 'incorrect' && currentIndex === i ? "bg-red-500 text-white border-red-500" : "bg-card"))}>
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl">{currentPrompt.spanish}</div>
                <div className="space-y-3 font-mono text-base">
                    {[
                        { k: 'affirmative', l: '(+)', c: 'text-green-500' },
                        { k: 'negative', l: '(-)', c: 'text-red-500' },
                        { k: 'interrogative', l: '(?)', c: 'text-blue-500' },
                        { k: 'shortAffirmative', l: '(+A)', c: 'text-green-600' },
                        { k: 'shortNegative', l: '(-A)', c: 'text-red-600' }
                    ].map(f => (
                        <div key={f.k} className="flex items-center gap-3">
                            <Label className={cn("w-10 font-bold", f.c)}>{f.l}</Label>
                            <Input value={(answers as any)[f.k]} onChange={e => setAnswers(prev => ({...prev, [f.k]: e.target.value}))} className={cn(validation[f.k] === 'correct' ? 'border-green-500 bg-green-50/5' : validation[f.k] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} variant="outline">Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck}>Verificar</Button>
                    <Button onClick={handleNext} disabled={!completedMap[currentIndex]}>Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class2Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [verbsAnswers, setVerbsAnswers] = useState<string[]>(Array(verbVocabulary.length).fill(''));
    const [wordsAnswers, setWordsAnswers] = useState<string[]>(Array(basicWords.length).fill(''));
    const [verbsValidation, setVerbsValidation] = useState<any[]>(Array(verbVocabulary.length).fill('unchecked'));
    const [wordsValidation, setWordsValidation] = useState<any[]>(Array(basicWords.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Verbs)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar: Present Simple', icon: GraduationCap, status: 'locked' },
        {
            key: 'exercises',
            name: 'Exercises',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'ex-pos', name: 'Positive', icon: PenSquare, status: 'locked' },
                { key: 'ex-neg', name: 'Negative', icon: PenSquare, status: 'locked' },
                { key: 'ex-int', name: 'Interrogative', icon: PenSquare, status: 'locked' },
            ]
        },
        { key: 'memory-verbs', name: 'Memory: Verbs', icon: BrainCircuit, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: 'Reading', icon: BookOpen, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile) return;
        let path = initialLearningPath.map(t => ({...t, subItems: t.subItems ? t.subItems.map(s => ({...s})) : undefined}));
        let savedST = '';
        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; if (item.subItems) item.subItems.forEach(s => s.status = 'completed'); });
        } else if(studentProfile?.lessonProgress?.[progressStorageKey]) {
            const d = studentProfile.lessonProgress[progressStorageKey];
            path.forEach(item => {
                if (d[item.key]) item.status = d[item.key];
                if (item.subItems && d.subItems?.[item.key]) {
                    item.subItems.forEach(s => { if (d.subItems[item.key][s.key]) s.status = d.subItems[item.key][s.key]; });
                }
            });
            savedST = d.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') {
                path[i].status = 'active';
                if (path[i].subItems) path[i].subItems[0].status = 'active';
            }
            lastDone = path[i].status === 'completed';
            if (path[i].subItems) {
                let allDone = true; let lastSubDone = true;
                for(let j=0; j < path[i].subItems.length; j++) {
                    if (lastSubDone && path[i].subItems[j].status === 'locked') path[i].subItems[j].status = 'active';
                    lastSubDone = path[i].subItems[j].status === 'completed';
                    if (!lastSubDone) allDone = false;
                }
                lastDone = allDone;
            }
        }
        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active')?.key || 'vocabulary');
        setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        let total = 0; let done = 0;
        learningPath.forEach(t => {
            if(t.subItems) { total += t.subItems.length; done += t.subItems.filter(st => st.status === 'completed').length; }
            else { total++; if (t.status === 'completed') done++; }
        });
        return total > 0 ? Math.round((done / total) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0) return;
        const data: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => {
            data[item.key] = item.status;
            if (item.subItems) {
                if (!data.subItems) data.subItems = {};
                data.subItems[item.key] = {};
                item.subItems.forEach(sub => { data.subItems[item.key][sub.key] = sub.status; });
            }
        });
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageKey}`]: data, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading, studentProfile]);

    const handleTopicCompleteInternal = useCallback((key: string) => setTopicToComplete(key), []);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let win = false; let nextToSel: string | null = null;
            const newP = currentPath.map(t => ({ ...t, subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined }));
            let found = false;
            for (let i = 0; i < newP.length && !found; i++) {
                const curT = newP[i];
                if (curT.key === topicToComplete) {
                    if (curT.status !== 'completed') curT.status = 'completed';
                    if (i + 1 < newP.length && newP[i + 1].status === 'locked') {
                        const n = newP[i + 1]; n.status = 'active'; win = true; nextToSel = n.subItems?.[0]?.key || n.key;
                        if (n.subItems?.[0]) n.subItems[0].status = 'active';
                    }
                    found = true;
                } else if (curT.subItems) {
                    const subIdx = curT.subItems.findIndex((sub: any) => sub.key === topicToComplete);
                    if (subIdx !== -1) {
                        if (curT.subItems[subIdx].status !== 'completed') curT.subItems[subIdx].status = 'completed';
                        const nextSubIdx = subIdx + 1;
                        if (nextSubIdx < newP[i].subItems!.length && newP[i].subItems![nextSubIdx].status === 'locked') {
                            newP[i].subItems![nextSubIdx].status = 'active'; nextToSel = newP[i].subItems![nextSubIdx].key; win = true;
                        } else if (newP[i].subItems!.every((sub: any) => sub.status === 'completed')) {
                            if (curT.status !== 'completed') curT.status = 'completed';
                            if (i + 1 < newP.length && newP[i + 1].status === 'locked') {
                                const n = newP[i + 1]; n.status = 'active'; win = true; nextToSel = n.subItems?.[0]?.key || n.key;
                                if (n.subItems?.[0]) n.subItems[0].status = 'active';
                            }
                        }
                        found = true;
                    }
                }
            }
            if (win) setTimeout(() => toast({ title: "¡Siguiente tema desbloqueado!" }), 0);
            if (nextToSel) { const n = nextToSel; setTimeout(() => setSelectedTopic(n), 0); }
            return newP;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const mainT = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subT = mainT?.subItems?.find(st => st.key === topicKey);
        if (!isAdmin && ((subT && subT.status === 'locked') || (!subT && mainT?.status === 'locked'))) { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar'].includes(topicKey)) handleTopicCompleteInternal(topicKey);
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const na = [...verbsAnswers]; na[index] = value; setVerbsAnswers(na);
        const nv = [...verbsValidation]; nv[index] = 'unchecked'; setVerbsValidation(nv as any);
        setCanAdvanceVocab(false);
    };

    const handleVocabCheck = () => {
        let ok = false;
        const nvV = verbVocabulary.map((v, i) => {
            const u = (verbsAnswers[i] || '').trim().toLowerCase();
            const res = u === v.english.toLowerCase() || u === `to ${v.english.toLowerCase()}`;
            if (res) ok = true; return res ? 'correct' : 'incorrect';
        });
        const nvW = basicWords.map((v, i) => {
            const res = (wordsAnswers[i] || '').trim().toLowerCase() === v.english.toLowerCase();
            if (res) ok = true; return res ? 'correct' : 'incorrect';
        });
        setVerbsValidation(nvV); setWordsValidation(nvW);
        if (ok) { toast({ title: "¡Bien hecho!" }); setCanAdvanceVocab(true); }
        else toast({ variant: 'destructive', title: 'Sigue intentando' });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left">
                        <CardHeader><CardTitle className='text-black dark:text-primary'>Vocabulary 2</CardTitle><CardDescription>Traduce los términos al inglés. Para los verbos, puedes incluir "To" al inicio.</CardDescription></CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-primary uppercase">1. Basic Verbs</h3>
                                <div className="grid grid-cols-2 gap-2 text-base">
                                    <div className="font-bold p-2 bg-muted rounded text-foreground">Español</div><div className="font-bold p-2 bg-muted rounded text-foreground">Inglés</div>
                                    {verbVocabulary.map((v, i) => (<React.Fragment key={i}><div className="p-2 border rounded bg-white/5 font-medium">{v.spanish}</div><Input value={verbsAnswers[i] || ''} onChange={e => handleVocabInputChange(i, e.target.value)} className={cn("h-12", verbsValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5' : verbsValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" /></React.Fragment>))}
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-primary uppercase">2. Basic Words</h3>
                                <div className="grid grid-cols-2 gap-2 text-base">
                                    {basicWords.map((v, i) => (<React.Fragment key={i}><div className="p-2 border rounded bg-white/5 font-medium">{v.spanish}</div><Input value={wordsAnswers[i] || ''} onChange={e => { const na = [...wordsAnswers]; na[i] = e.target.value; setWordsAnswers(na); setCanAdvanceVocab(false); }} className={cn(wordsValidation[i] === 'correct' ? 'border-green-500 bg-green-50/5' : wordsValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} /></React.Fragment>))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left p-6">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase tracking-tight">“DO - DOES”</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-black dark:text-white font-bold text-lg">
                            <div className="p-6 bg-slate-100 rounded-2xl border text-black font-bold">
                                <p className="text-primary mb-2 uppercase">1 - Usos Generales</p>
                                <p>“DO-DOES” puede ser un VERBO (Hacer) o un AUXILIAR.</p>
                                <p className="font-mono text-xl mt-4">I DO - YOU DO - WE DO - THEY DO<br/>HE / SHE / IT DOES</p>
                            </div>
                            <div className="p-6 bg-slate-100 rounded-2xl border text-black font-bold">
                                <p className="text-primary uppercase mb-2">2 - Estructura con Auxiliares:</p>
                                <ul className="space-y-2 font-mono text-base">
                                    <li><span className="text-green-600">(+)</span> = pronoun + verb + comp.</li>
                                    <li><span className="text-red-600">(-)</span> = pronoun + do/does + not + verb + comp.</li>
                                    <li><span className="text-blue-600">(?)</span> = do/does + pronoun + verb + comp?</li>
                                </ul>
                            </div>
                            <div className="p-6 bg-destructive/10 rounded-2xl border-2 border-dashed border-destructive/30 text-center">
                                <p className="text-destructive font-black uppercase">Contracciones Negativas:</p>
                                <p className="text-2xl mt-2 text-black">DO NOT = DON’T<br/>DOES NOT = DOESN’T</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className='text-white px-12'>Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex-pos': return <SingleFormExercise title="Positive Form" data={posExercises} onComplete={() => handleTopicCompleteInternal('ex-pos')} vocab={posVocab} />;
            case 'ex-neg': return <SingleFormExercise title="Negative Form" data={negExercises} onComplete={() => handleTopicCompleteInternal('ex-neg')} vocab={negVocab} />;
            case 'ex-int': return <SingleFormExercise title="Interrogative Form" data={intExercises} onComplete={() => handleTopicCompleteInternal('ex-int')} vocab={intVocab} />;
            case 'memory-verbs': return <VerbMemoryGame onComplete={() => handleTopicCompleteInternal('memory-verbs')} />;
            case 'ex1': return <MultiFormExercise title="Exercise 1" prompts={exercise1Prompts} onComplete={() => handleTopicCompleteInternal('ex1')} vocabulary={ex1Vocab} />;
            case 'ex2': return <MultiFormExercise title="Exercise 2" prompts={exercise2Prompts} onComplete={() => handleTopicCompleteInternal('ex2')} />;
            case 'reading': return <ReadingComprehensionExercise onComplete={() => handleTopicCompleteInternal('reading')} />;
            case 'vocab_game': return <VocabularyGame onComplete={() => handleTopicCompleteInternal('vocab_game')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader><CardTitle>Ruta Clase 2</CardTitle></CardHeader>
                    <CardContent>
                        <nav><ul className="space-y-1">
                            {learningPath.map(item => (
                                <li key={item.key}>
                                    {!item.subItems ? (
                                        <div onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                            <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <item.icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                        </div>
                                    ) : (
                                        <Collapsible defaultOpen={selectedTopic.startsWith('ex-') || item.subItems.some(si => si.status !== 'locked')}>
                                            <CollapsibleTrigger className="w-full">
                                                <div className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full cursor-pointer text-foreground', (item.status === 'locked' && !isAdmin) ? 'text-muted-foreground/50' : 'hover:bg-muted', (selectedTopic.startsWith('ex-')) && 'bg-muted text-primary font-bold')}>
                                                    <div className="flex items-center gap-3"><item.icon className="h-5 w-5" /><span>{item.name}</span></div>
                                                    <ChevronDown className="h-4 w-4" />
                                                </div>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent><ul className="pl-8 pt-1 space-y-1">{item.subItems.map(sub => {
                                                const subL = sub.status === 'locked' && !isAdmin;
                                                return (
                                                    <li key={sub.key} onClick={() => handleTopicSelect(sub.key)} className={cn('flex items-center gap-3 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-foreground', subL ? 'text-muted-foreground/50' : 'hover:bg-muted', selectedTopic === sub.key && 'bg-muted text-primary font-bold')}>
                                                        <sub.icon className={cn("h-4 w-4", sub.status === 'completed' && 'text-green-500')} /><span>{sub.name}</span>
                                                    </li>
                                                )
                                            })}</ul></CollapsibleContent>
                                        </Collapsible>
                                    )}
                                </li>
                            ))}
                        </ul></nav>
                        <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

