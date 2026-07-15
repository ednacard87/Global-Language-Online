'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from 'react';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    ArrowLeft,
    Check,
    X,
    Gamepad2,
    Trophy,
    Pencil,
    Info,
    ListChecks,
    HelpCircle,
    Clock,
    BookText,
    Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a1_eng_u3_c15_v6000_syntax_fix';
const mainProgressKey = 'progress_a1_eng_unit_3_class_15';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const adverbsVocab = [
    { es: "GENERALMENTE", en: "GENERALLY" },
    { es: "FRECUENTEMENTE", en: "FREQUENTLY" },
    { es: "A VECES", en: "SOMETIMES" },
    { es: "RARAS VECES", en: "RARELY" },
    { es: "CADA HORA", en: "EVERY HOUR" },
    { es: "CADA DIA", en: "EVERY DAY" },
    { es: "CADA SEMANA", en: "EVERY WEEK" },
    { es: "TODOS LOS DIAS", en: "EVERY DAY" },
    { es: "CADA JUEVES", en: "EVERY THURSDAY" },
    { es: "CADA MAÑANA", en: "EVERY MORNING" },
    { es: "TODOS LOS AÑOS", en: "EVERY YEAR" },
    { es: "CADA AÑO", en: "EVERY YEAR" },
    { es: "UNA VEZ A LA SEMANA", en: "ONCE A WEEK" },
    { es: "2 VECES A LA SEMANA", en: "TWICE A WEEK" },
    { es: "3 VECES A LA SEMANA", en: "THREE TIMES A WEEK" },
    { es: "DE VEZ EN CUANDO", en: "FROM TIME TO TIME" },
    { es: "VARIAS VECES", en: "SEVERAL TIMES" },
    { es: "SIEMPRE", en: "ALWAYS" },
    { es: "CASI SIEMPRE", en: "ALMOST ALWAYS" },
    { es: "USUALMENTE", en: "USUALLY" },
    { es: "A MENUDO", en: "OFTEN" },
    { es: "CASI NUNCA", en: "HARDLY EVER" },
    { es: "NUNCA", en: "NEVER" },
];

const ex1RewritePrompts = [
    { base: "I AM LATE FOR SCHOOL", adverb: "OFTEN", correct: "I AM OFTEN LATE FOR SCHOOL" },
    { base: "THEY COME TO THIS SUPERMARKET", adverb: "USUALLY", correct: "THEY USUALLY COME TO THIS SUPERMARKET" },
    { base: "THE WEATHER IN SUMMER IS GOOD", adverb: "GENERALLY", correct: "THE WEATHER IN SUMMER IS GENERALLY GOOD" },
    { base: "I LEAVE MY HOUSE AT 9 O’CLOCK", adverb: "SOMETIMES", correct: "I SOMETIMES LEAVE MY HOUSE AT 9 O'CLOCK" },
    { base: "WE WATER OUR GARDEN WHEN IT’S DRY", adverb: "FREQUENTLY", correct: "WE FREQUENTLY WATER OUR GARDEN WHEN IT'S DRY" },
    { base: "IT WORKS (FUNCIONA)", adverb: "HARDLY EVER", correct: "IT HARDLY EVER WORKS" },
    { base: "I DRINK BAILEYS", adverb: "OFTEN", correct: "I OFTEN DRINK BAILEYS" },
    { base: "DOES SHE WORK ON SATURDAYS?", adverb: "USUALLY", correct: "DOES SHE USUALLY WORK ON SATURDAYS?" },
    { base: "THEY GO HIKING", adverb: "NEVER", correct: "THEY NEVER GO HIKING BECAUSE THEY DON'T LIKE NATURE" },
    { base: "SHE COOKS WHILE HER HUSBAND WASHES THE DISHES", adverb: "ALWAYS - USUALLY", correct: "SHE ALWAYS COOKS WHILE HER HUSBAND USUALLY WASHES THE DISHES" },
];

const ex5RewritePrompts = [
    { base: "MRS. BROWN GOES TO CHURCH", adverb: "REGULARLY", correct: "MRS. BROWN GOES TO CHURCH REGULARLY" },
    { base: "MARY WASHES THE DISHES (LA LOZA)", adverb: "ONCE A DAY", correct: "MARY WASHES THE DISHES ONCE A DAY" },
    { base: "I GO SWIMMING ON SATURDAYS", adverb: "USUALLY", correct: "I USUALLY GO SWIMMING ON SATURDAYS" },
    { base: "SHE IS INTERRUPTING ME", adverb: "ALWAYS", correct: "SHE IS ALWAYS INTERRUPTING ME" },
    { base: "I EAT AT TWO O’CLOCK", adverb: "NORMALLY", correct: "I NORMALLY EAT AT TWO O'CLOCK" },
    { base: "THE DOCTOR COMES TO VISIT HER", adverb: "EVERY MORNING", correct: "THE DOCTOR COMES TO VISIT HER EVERY MORNING" },
    { base: "SHE RUNS", adverb: "THREE TIMES A WEEK", correct: "SHE RUNS THREE TIMES A WEEK" },
    { base: "YOU DRINK MILK", adverb: "RARELY", correct: "YOU RARELY DRINK MILK" },
    { base: "DO YOU SEE JOHN AT THE WEEKEND?", adverb: "NORMALLY", correct: "DO YOU NORMALLY SEE JOHN AT THE WEEKEND?" },
    { base: "I AM AT HOME IN THE MORNING", adverb: "NEVER", correct: "I AM NEVER AT HOME IN THE MORNING" },
];

const ex2TriplePrompts = [
    { spanish: "EL ESTA GENERALMENTE CANSADO PORQUE EL TRABAJA 13 HORAS DURANTE EL DIA", answers: { pos: ["he is generally tired because he works 13 hours during the day"], neg: ["he is not generally tired because he works 13 hours during the day"], int: ["is he generally tired because he works 13 hours during the day?"] } },
    { spanish: "ELLA SIEMPRE ESTA EN CASA LOS SABADOS EN LA MAÑANA PORQUE NO VA A LA OFICINA", answers: { pos: ["she is always at home on saturdays in the morning because she does not go to the office"], neg: ["she is not always at home on saturdays in the morning because she does not go to the office"], int: ["is she always at home on saturdays in the morning because she does not go to the office?"] } },
    { spanish: "EL ESTA OCUPADO FRECUENTEMENTE", answers: { pos: ["he is frequently busy", "he is often busy"], neg: ["he is not frequently busy", "he is not often busy"], int: ["is he frequently busy?", "is he often busy?"] } },
    { spanish: "ÉL SIEMPRE ESTÁ TRISTE PORQUE ÉL ES DEPRESIVO", answers: { pos: ["he is always sad because he is depressive"], neg: ["he is not always sad because he is depressive"], int: ["is he always sad because he is depressive?"] } },
    { spanish: "ELLA ESTA A VECES PREOCUPADA POR SU MADRE", answers: { pos: ["she is sometimes worried about her mother"], neg: ["she is not sometimes worried about her mother"], int: ["is she sometimes worried about her mother?"] } },
];

const ex3TriplePrompts = [
    { spanish: "RARAS VECES BEBO VINO TINTO PORQUE PREFIERO LA CERVEZA (HARDLY EVER)", answers: { pos: ["i hardly ever drink red wine because i prefer beer"], neg: ["i do not hardly ever drink red wine because i prefer beer"], int: ["do i hardly ever drink red wine because i prefer beer?"] } },
    { spanish: "¿SIEMPRE VAS A ESE SUPERMERCADO?", answers: { pos: ["i always go to that supermarket"], neg: ["i do not always go to that supermarket"], int: ["do you always go to that supermarket?"] } },
    { spanish: "YO NO VOY A MENUDO ESE PARQUE PORQUE ES MUY SUCIO", answers: { pos: ["i often go to that park because it is very dirty"], neg: ["i do not often go to that park because it is very dirty"], int: ["do i often go to that park because it is very dirty?"] } },
    { spanish: "EL VA GENERALMENTE A ESA IGLESIA", answers: { pos: ["he generally goes to that church"], neg: ["he does not generally go to that church"], int: ["does he generally go to that church?"] } },
    { spanish: "¿SIEMPRE VAS AL MISMO RESTAURANTE?", answers: { pos: ["i always go to the same restaurant"], neg: ["i do not always go to the same restaurant"], int: ["do you always go to the same restaurant?"] } },
    { spanish: "¿ELLA SALE SIEMPRE LOS VIERNES? - SI", answers: { pos: ["she always goes out on fridays"], neg: ["she does not always go out on fridays"], int: ["does she always go out on fridays? - yes, she does"] } },
    { spanish: "TU NO VAS MUY FRECUENTEMENTE A VISITAR A TU ABUELA", answers: { pos: ["you frequently go to visit your grandmother", "you often go to visit your grandma"], neg: ["you do not very frequently go to visit your grandmother"], int: ["do you very frequently go to visit your grandmother?"] } },
    { spanish: "NOSOTROS JUGAMOS USUALMENTE JUEGOS DE MESA MIENTRAS ESCUCHAMOS MUSICA", answers: { pos: ["we usually play board games while we listen to music"], neg: ["we do not usually play board games while we listen to music"], int: ["do we usually play board games while we listen to music?"] } },
    { spanish: "TU CASI NUNCA COMES VERDURAS PORQUE NO TE GUSTAN", answers: { pos: ["you almost always eat vegetables because you like them"], neg: ["you hardly ever eat vegetables because you do not like them"], int: ["do you hardly ever eat vegetables because you don't like them?"] } },
    { spanish: "ELLA NUNCA BEBE AGUA PORQUE A ELLA NO LE GUSTA", answers: { pos: ["she never drinks water because she does not like it"], neg: ["she never drinks water because she does not like it"], int: ["does she never drink water because she does not like it?"] } },
];

const ex4TranslationPrompts = [
    { spanish: "YO VOY A LA UNIVERSIDAD TODOS LOS DIAS", answer: ["i go to the university every day"] },
    { spanish: "TÚ SIEMPRE JUEGAS SCRABBLE CON TUS AMIGOS LOS FINES DE SEMANA", answer: ["you always play scrabble with your friends on weekends", "you always play scrabble with your friends on the weekend"] },
    { spanish: "ELLA TOCA LA GUITARRA DOS VECES POR SEMANA", answer: ["she plays the guitar twice a week"] },
    { spanish: "NOSOTROS TRABAJAMOS EL SABADO", answer: ["we work on saturday"] },
    { spanish: "ELLA CASI SIEMPRE VISITA A SU ABUELA LOS DOMINGOS", answer: ["she almost always visits her grandmother on sundays", "she almost always visits her grandma on sundays"] },
    { spanish: "YO VOY A LA CASA DE MI ABUELA 3 VECES AL MES", answer: ["i go to my grandmother's house three times a month"] },
    { spanish: "RARAS VECES CAMINO EN EL CENTRO LOS FINES DE SEMANA", answer: ["i rarely walk downtown on weekends", "i hardly ever walk downtown on weekends"] },
    { spanish: "YO JUEGO AL TENNIS LOS SABADOS", answer: ["i play tennis on saturdays"] },
    { spanish: "YO NUNCA JUEGO VIDEO JUEGOS DURANTE LA SEMANA, YO SOLO JUEGO LOS FINES DE SEMANA PORQUE NO TENGO TIEMPO", answer: ["i never play video games during the week, i only play on weekends because i don't have time"] },
    { spanish: "VICTOR JUEGA VIDEO JUEGOS TODOS LOS DIAS, DESPUES DE HACER TAREAS EN LA NOCHE", answer: ["victor plays video games every day after doing homework at night"] },
    { spanish: "ÉL JUEGA BILLAR 2 VECES POR SEMANA", answer: ["he plays billiards twice a week"] },
    { spanish: "EL NO ESTA SIEMPRE EN LA OFICINA PORQUE EL TRABAJA EN CASA", answer: ["he is not always in the office because he works at home", "he isn't always in the office because he works at home"] },
    { spanish: "ELLOS JUEGAN FUTBOL LOS FINES DE SEMANA", answer: ["they play soccer on weekends"] },
    { spanish: "RARAS VECES BEBO CAFÉ", answer: ["i rarely drink coffee", "i hardly ever drink coffee"] },
    { spanish: "NOSOTRAS CASI NUNCA TOMAMOS COCA- COLA, SOLO LA BEBEMOS UNA VEZ AL MES", answer: ["we almost never drink coca-cola, we only drink it once a month"] },
    { spanish: "¿JUEGAS CARTAS A MENUDO? – SI, CON MIS AMIGOS LOS FINES DE SEMANA", answer: ["do you play cards often? - yes, with my friends on weekends"] },
    { spanish: "¿ELLA SIEMPRE TRABAJA HASTA LAS 5?", answer: ["does she always work until 5?", "does she always work until five?"] },
    { spanish: "¿QUE TAN SEGUIDO VAS AL GIMNASIO? - YO VOY AL GYM***", answer: ["how often do you go to the gym? - i go to the gym"] },
    { spanish: "ELLA ESTUDIA INGLES 3 VECES POR SEMANA", answer: ["she studies english three times a week"] },
    { spanish: "YO JUEGO VIDEOJUEGOS TODOS LOS DIAS UNA HORA", answer: ["i play video games every day for an hour", "i play video games every day one hour"] },
];

const ex6Prompts = [
    { spanish: "ELLA SIEMPRE ME AYUDA CON MI TAREA", answer: ["she always helps me with my homework"] },
    { spanish: "NOSOTROS CASI NUNCA SALIMOS LOS LUNES", answer: ["we hardly ever go out on mondays", "we almost never go out on mondays"] },
    { spanish: "¿TU PADRE TRABAJA GENERALMENTE EN LA MAÑANA?", answer: ["does your father generally work in the morning?"] },
    { spanish: "ELLOS A VECES BEBEN CERVEZA DESPUES DEL TRABAJO", answer: ["they sometimes drink beer after work"] },
    { spanish: "MI MADRE NUNCA COCINA PIZZA", answer: ["my mother never cooks pizza"] },
];

const orderPrompts1 = [{ base: "SOMETIMES / I / COFFEE / DRINK", correct: "I SOMETIMES DRINK COFFEE" }, { base: "NEVER / SHE / LATE / IS", correct: "SHE IS NEVER LATE" }];
const orderPrompts2 = [{ base: "USUALLY / WE / EARLY / ARRIVE", correct: "WE USUALLY ARRIVE EARLY" }, { base: "OFTEN / SHE / PLAYS / TENNIS", correct: "SHE OFTEN PLAYS TENNIS" }];
const orderPrompts3 = [{ base: "WELL / SPEAKS / SHE / ENGLISH", correct: "SHE SPEAKS ENGLISH WELL" }, { base: "SLOWLY / WALKS / THE CAT / VERY", correct: "THE CAT WALKS VERY SLOWLY" }];

// --- HELPERS ---

const RewriteAdverbExercise = ({ prompts, onComplete, title, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return <div className="p-8 text-center animate-pulse text-muted-foreground">Cargando misión...</div>;

    const handleCheck = () => {
        const userVal = answer.trim().toUpperCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const correctVal = currentPrompt.correct.toUpperCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isOk = userVal === correctVal;
        setStatus(p => ({ ...p, [currentIndex]: isOk ? 'correct' : 'incorrect' }));
        if (isOk) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Revisa la posición del adverbio" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full text-left">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}</div></ScrollArea></PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-6 bg-muted rounded-xl border-2 border-dashed font-bold text-lg text-center uppercase tracking-tight text-foreground">
                    {currentPrompt.base} {currentPrompt.adverb && <span className="text-primary ml-2">({currentPrompt.adverb})</span>}
                </div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} placeholder="Reescribe la frase correctamente..." className={cn("h-12 text-lg uppercase", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const TripleTranslationExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ pos: '', neg: '', int: '' });
    const [val, setVal] = useState<any>({ pos: 'unchecked', neg: 'unchecked', int: 'unchecked' });
    const [solved, setSolved] = useState<Record<number, boolean>>({});

    useEffect(() => { setAns({ pos: '', neg: '', int: '' }); setVal({ pos: 'unchecked', neg: 'unchecked', int: 'unchecked' }); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleCheck = () => {
        const newVal = { ...val }; let allOk = true;
        ['pos', 'neg', 'int'].forEach(f => {
            const user = ans[f as keyof typeof ans].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = currentPrompt.answers[f].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (f === 'int' && !ans.int.trim().endsWith('?')) { allOk = false; newVal.int = 'incorrect'; }
            else if (corrects.includes(user)) newVal[f] = 'correct'; else { allOk = false; newVal[f] = 'incorrect'; }
        });
        setVal(newVal);
        if (allOk) { toast({ title: "¡Misión cumplida!" }); setSolved(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus frases" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="w-full text-left">
                    <CardTitle>{title}</CardTitle>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", solved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
                {vocabulary && (
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                        <PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground">{es}:</span><span className="font-bold text-right">{en}</span></Fragment>))}</div></ScrollArea></PopoverContent>
                    </Popover>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-lg uppercase">{currentPrompt.spanish}</div>
                <div className="space-y-4 font-mono text-base max-w-lg mx-auto">
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-green-500 text-center">(+)</Label><Input value={ans.pos} onChange={e => setAns(p => ({...p, pos: e.target.value}))} className={cn("flex-1", val.pos === 'correct' ? 'border-green-500' : val.pos === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-red-500 text-center">(-)</Label><Input value={ans.neg} onChange={e => setAns(p => ({...p, neg: e.target.value}))} className={cn("flex-1", val.neg === 'correct' ? 'border-green-500' : val.neg === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-blue-500 text-center">(?)</Label><Input value={ans.int} onChange={e => setAns(p => ({...p, int: e.target.value}))} className={cn("flex-1", val.int === 'correct' ? 'border-green-500' : val.int === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
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

// --- MAIN CLASS COMPONENT ---

export default function Class15Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const currentUID = overrideStudentId || user?.uid;
    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(adverbsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(adverbsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const handleTopicComplete = useCallback((completedKey: string) => { setTopicToComplete(completedKey); }, []);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulary (Adverbs)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Grammar (Adverbs)', icon: GraduationCap, status: 'locked' },
        { key: 'exercise1', name: '3. Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise2', name: '4. Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise3', name: '5. Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise4', name: '7. Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'exercise5', name: '8. Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'order1', name: '9. Correct Order 1', icon: ListChecks, status: 'locked' },
        { key: 'how_often', name: '10. How Often', icon: HelpCircle, status: 'locked' },
        { key: 'create1', name: '11. Create 1', icon: Pencil, status: 'locked' },
        { key: 'order2', name: '12. Correct Order 2', icon: ListChecks, status: 'locked' },
        { key: 'exercise6', name: '13. Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'order3', name: '14. Correct Order 3', icon: ListChecks, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let p = initialLearningPath.map(t => ({ ...t }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        p.forEach(t => { if (d[t.key]) (t as any).status = d[t.key]; });
        if (isAdmin && !overrideStudentId) p.forEach(t => (t as any).status = 'completed');
        let last = true;
        for(let i=0; i < p.length; i++) { if (last && (p[i] as any).status === 'locked') (p[i] as any).status = 'active'; last = (p[i] as any).status === 'completed'; }
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
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, overrideStudentId]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = curr.map(t => ({ ...t }));
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active';
                    next = np[i + 1].key;
                }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Siguiente misión desbloqueada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let ok = false;
        const nv = adverbsVocab.map((v, i) => {
            const res = v.en.toUpperCase() === vocabAnswers[i].trim().toUpperCase();
            if (res) ok = true; return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (ok) { setCanAdvanceVocab(true); toast({ title: "¡Buen trabajo!" }); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>ADVERBS OF FREQUENCY</CardTitle><CardDescription>Estudia y memoriza estas expresiones de tiempo.</CardDescription></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-2">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div>
                            {adverbsVocab.map((v, i) => (<Fragment key={i}><div className="p-2 border rounded bg-white/5 font-bold text-sm uppercase">{v.es}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} className={cn("uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></Fragment>))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t pt-6 mt-4"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold ml-2'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6">
                            <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR: ADVERBS</CardTitle></CardHeader>
                            <CardContent className="space-y-8 text-foreground font-bold">
                                <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border border-primary/20">
                                    <h4 className="font-black text-primary uppercase mb-2"> Adverbios de Frecuencia</h4>
                                    <p className="font-bold">Van ANTES del verbo principal, pero DESPUÉS del verbo "To Be".</p>
                                    <div className="mt-3 p-3 bg-muted rounded-lg font-mono text-sm space-y-1">
                                        <p>I <span className="text-primary font-black">ALWAYS</span> study (Antes de study)</p>
                                        <p>I am <span className="text-primary font-black">ALWAYS</span> happy (Después de am)</p>
                                    </div> <br/>
                                    <div className="p-6 bg-white/30 dark:bg-background/20 rounded-2xl border border-primary/20 space-y-4">
                                        <h4 className="text-primary font-black uppercase text-sm mb-2">USO:</h4>
                                        <p className="text-lg">Se usan para definir la frecuencia con la que se hace una determinada actividad: normalmente se usan con el <span className="text-primary underline">presente simple</span> (que se usa para hábitos y costumbres).</p>
                                        <p className="italic text-muted-foreground">Hay adverbios positivos y negativos.</p>
                                    </div> <br/>
                                    
                                    <div className="p-6 bg-white/30 dark:bg-background/20 rounded-2xl border border-primary/20 space-y-4">
                                        <h4 className="text-xl font-black text-primary uppercase">1- VERBO TO BE</h4>
                                        <div className="font-mono bg-muted p-4 rounded-xl border space-y-2 text-sm">
                                            <p>(+) = pronoun + to be + freq- adv + complement.</p>
                                            <p>(-) = pronoun + to be + not + freq- adv + complement.</p>
                                            <p>(?) = to be + pronoun + freq- adv + complement?</p>
                                        </div> <br/>
                                        <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-sm font-bold uppercase tracking-tight">NOTA: EL PRONOMBRE Y EL VERBO TO BE NUNCA SE SEPARAN.</div>
                                        <div className="space-y-2 mt-4">
                                            <p className="text-xs uppercase text-primary font-black">Translate:</p>
                                            <ul className="grid gap-2 text-sm">
                                                <li className="flex justify-between p-2 border rounded bg-background/50"><span>1. ELLA SIEMPRE ESTA FELIZ</span> <span className="text-primary font-mono font-bold italic">...</span></li>
                                                <li className="flex justify-between p-2 border rounded bg-background/50"><span>2. TU NO ESTÁS FRECUENTEMENTE CON ELLA</span> <span className="text-primary font-mono font-bold italic">...</span></li>
                                                <li className="flex justify-between p-2 border rounded bg-background/50"><span>3. ¿ÉL SIEMPRE ESTÁ ABURRIDO?</span> <span className="text-primary font-mono font-bold italic">...</span></li>
                                                <li className="flex justify-between p-2 border rounded bg-background/50"><span>4. ¿ESTÁS GENERALMENTE PREOCUPADO POR ESA SITUACIÓN?</span> <span className="text-primary font-mono font-bold italic">...</span></li>
                                            </ul>
                                        </div>
                                    </div> <br/>

                                    <div className="p-6 bg-white/30 dark:bg-background/20 rounded-2xl border border-primary/20 space-y-4">
                                        <h4 className="text-xl font-black text-primary uppercase">2- CON OTROS VERBOS</h4>
                                        <div className="font-mono bg-muted p-4 rounded-xl border space-y-2 text-sm">
                                            <p>(+) = pronoun + freq- adv + verb + complement.</p>
                                            <p>(-) = pronoun + do/does + not + freq- adv + verb + complement.</p>
                                            <p>(?) = do/does + pronoun + freq- adv + verb + complement?</p>
                                        </div><br/>
                                        <div className="space-y-2 mt-4">
                                            <p className="text-xs uppercase text-primary font-black">EJEMPLOS:</p>
                                            <ul className="grid gap-2 text-sm">
                                                <li className="p-2 border rounded bg-background/50">1. Siempre vas a dormir tarde</li>
                                                <li className="p-2 border rounded bg-background/50">2. Generalmente vas a dormir tarde?</li>
                                                <li className="p-2 border rounded bg-background/50">3. Él a veces va al gimnasio en la mañana.</li>
                                                <li className="p-2 border rounded bg-background/50">4. Ella casi siempre lava los platos.</li>
                                            </ul>
                                        </div>

                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold h-12 text-white">Entendido</Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'exercise1': return <RewriteAdverbExercise title="Exercise 1: Position" prompts={ex1RewritePrompts} onComplete={() => handleTopicComplete('exercise1')} vocabulary={{"mesa": "table", "guitarra": "guitar", "compañeros": "coworkers", "tarea": "homework", "hablas": "speak / talk"}} />;
            case 'exercise2': return <TripleTranslationExercise title="Exercise 2: To Be" prompts={ex2TriplePrompts} onComplete={() => handleTopicComplete('exercise2')} vocabulary={{"empresa": "company", "morir": "die", "cirugía": "surgery", "preocupada": "worried"}} />;
            case 'exercise3': return <TripleTranslationExercise title="Exercise 3: Mixed" prompts={ex3TriplePrompts} onComplete={() => handleTopicComplete('exercise3')} vocabulary={{"vino tinto": "red wine", "iglesia": "church", "sucio": "dirty", "verduras": "vegetables"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={adverbsVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game" />;
            case 'exercise4': return <SimpleTranslationExercise exerciseKey="c15_ex4_expanded" course="a1" prompts={ex4TranslationPrompts} onComplete={() => handleTopicComplete('exercise4')} vocabulary={{"finca": "farm", "dos veces": "twice", "tres veces": "three times", "casi siempre": "almost always"}} highlightVocabulary={true} />;
            case 'exercise5': return <RewriteAdverbExercise title="Exercise 5: Correct Position" prompts={ex5RewritePrompts} onComplete={() => handleTopicComplete('exercise5')} vocabulary={{"iglesia": "church", "loza": "dishes", "interrumpir": "interrupt", "mañana": "morning"}} />;
            case 'order1': return <RewriteAdverbExercise title="Correct Order 1" prompts={orderPrompts1.map(p => ({ base: p.base, correct: p.correct, adverb: '' }))} onComplete={() => handleTopicComplete('order1')} />;
            case 'how_often': 
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>How Often Challenge</CardTitle><CardDescription>Responde a las preguntas usando adverbios de frecuencia.</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-muted rounded-xl border-l-4 border-primary">
                                <p className="font-bold">HOW OFTEN...? = ¿Qué tan seguido...?</p>
                                <p className="text-sm italic">Example: How often do you go to the gym? - I go every day.</p>
                            </div>
                            <Separator />
                            <div className="text-center py-10">
                                <HelpCircle className="h-20 w-20 text-primary/20 mx-auto mb-4" />
                                <h3 className="text-xl font-black uppercase">Práctica Oral con el Profesor</h3>
                                <p className="text-muted-foreground mt-2">Responde estas preguntas en voz alta durante tu clase.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('how_often')} size="lg" className="px-12 font-bold">He practicado</Button></CardFooter>
                    </Card>
                );
            case 'create1': 
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
                        <CardHeader><CardTitle>Create 1: Tu Rutina</CardTitle><CardDescription>Escribe 4 frases sobre tus hábitos usando adverbios de frecuencia.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="space-y-2">
                                        <Label className="font-bold text-xs text-primary uppercase">Frase {i}</Label>
                                        <Input placeholder="I always..." className="h-12 border-primary/20" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('create1')} size="lg" className="px-16 font-bold h-12">Finalizar Escritura</Button></CardFooter>
                    </Card>
                );
            case 'order2': return <RewriteAdverbExercise title="Correct Order 2" prompts={orderPrompts2.map(p => ({ base: p.base, correct: p.correct, adverb: '' }))} onComplete={() => handleTopicComplete('order2')} />;
            case 'exercise6': return <SimpleTranslationExercise exerciseKey="c15_ex6" course="a1" prompts={ex6Prompts} onComplete={() => handleTopicComplete('exercise6')} />;
            case 'order3': return <RewriteAdverbExercise title="Correct Order 3" prompts={orderPrompts3.map(p => ({ base: p.base, correct: p.correct, adverb: '' }))} onComplete={() => handleTopicComplete('order3')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left text-foreground">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Misión 15
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[60vh] overflow-y-auto px-6 py-6 text-foreground">
                            <nav><ul className="space-y-1">
                                {learningPath.map(item => {
                                    const isLocked = item.status === 'locked' && !isAdmin;
                                    const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                    return (
                                        <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                            <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", item.status === 'locked' ? "text-yellow-500" : "text-primary")} />}<span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span></div>
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
