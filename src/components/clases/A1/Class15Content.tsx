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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a1_eng_u3_c15_v1010_total_indep';
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
    { base: "THEY GO HIKING", adverb: "NEVER", correct: "THEY NEVER GO HIKING" },
    { base: "SHE COOKS WHILE HER HUSBAND WASHES THE DISHES", adverb: "ALWAYS - USUALLY", correct: "SHE ALWAYS COOKS WHILE HER HUSBAND USUALLY WASHES THE DISHES" },
];

const ex2TriplePrompts = [
    { spanish: "EL ESTA GENERALMENTE CANSADO PORQUE EL TRABAJA 13 HORAS DURANTE EL DIA", answers: { pos: ["he is generally tired because he works 13 hours during the day"], neg: ["he is not generally tired because he does not work 13 hours during the day" , "he isn't generally tired because he doesn't work 13 hours during the day"], int: ["is he generally tired?"] } },
    { spanish: "ELLA SIEMPRE ESTA EN CASA LOS SABADOS EN LA MAÑANA PORQUE NO VA A LA OFICINA", answers: { pos: ["she is always at home on saturdays in the morning because she does not go to the office" , "she's always at home on saturdays in the morning because she doesn't go to the office"], neg: ["she is not always at home on saturdays in the morning because she goes to the office" , "she isn't always at home on saturdays in the morning because she goes to the office"], int: ["is she always at home on saturdays in the morning?"] } },
    { spanish: "EL ESTA OCUPADO FRECUENTEMENTE", answers: { pos: ["he is frequently busy", "he's frequently busy"], neg: ["he is not frequently busy", "he isn't frequently busy"], int: ["is he frequently busy?"] } },
    { spanish: "ÉL SIEMPRE ESTÁ TRISTE PORQUE ÉL ES DEPRESIVO", answers: { pos: ["he is always sad because he is depressive" , "he's always sad because he's depressive"], neg: ["he is not always sad because he is not depressive" , "he isn't always sad because he isn't depressive" , "he isn't always sad because he is happy" ], int: ["is he always sad?"] } },
    { spanish: "ELLA ESTA A VECES PREOCUPADA POR SU MADRE", answers: { pos: ["she is sometimes worried about her mother" , "she's sometimes worried about her mother"], neg: ["she is not sometimes worried about her mother" , "she isn't sometimes worried about her mother"], int: ["is she sometimes worried about her mother?"] } },
];

const ex3TriplePrompts = [
    { spanish: "RARAS VECES BEBO VINO TINTO PORQUE PREFIERO LA CERVEZA (HARDLY EVER)", answers: { pos: ["i drink red wine because i don't prefer beer" , "i drink red wine because i don't like beer"], neg: ["i hardly ever drink red wine because i prefer beer" , "i hardly ever drink red wine because i like beer"], int: ["do i hardly ever drink red wine?" , "do you hardly ever drink red wine?"] } },
    { spanish: "¿SIEMPRE VAS A ESE SUPERMERCADO?", answers: { pos: ["i always go to that supermarket"], neg: ["i do not always go to that supermarket" , "i don't always go to that supermarket"], int: ["do you always go to that supermarket?"] } },
    { spanish: "YO NO VOY A MENUDO ESE PARQUE PORQUE ES MUY SUCIO", answers: { pos: ["i often go to that park because it is very clean" , "i often go to that park because it's very clean"], neg: ["i do not often go to that park because it is very dirty" , "i don't often go to that park because it's very dirty"], int: ["do i often go to that park?" , "do you often go to that park?"] } },
    { spanish: "EL VA GENERALMENTE A ESA IGLESIA", answers: { pos: ["he generally goes to that church"], neg: ["he does not generally go to that church" , "he doesn't generally go to that church"], int: ["does he generally go to that church?"] } },
    { spanish: "¿SIEMPRE VAS AL MISMO RESTAURANTE?", answers: { pos: ["i always go to the same restaurant"], neg: ["i do not always go to the same restaurant" , "i don't always go to the same restaurant"], int: ["do you always go to the same restaurant?", "do i always go to the same restaurant?"] } },
    { spanish: "¿ELLA SALE SIEMPRE LOS VIERNES? - SI", answers: { pos: ["she always goes out on fridays"], neg: ["she does not always go out on fridays" , "she doesn't always go out on fridays"], int: ["does she always go out on fridays? - yes, she does"] } },
    { spanish: "TU NO VAS FRECUENTEMENTE A VISITAR A TU ABUELA", answers: { pos: ["you frequently go to visit your grandmother", "you often go to visit your grandma"], neg: ["you do not frequently go to visit your grandmother" , "you don't frequently go to visit your grandma"], int: ["do you frequently go to visit your grandmother?" , "do you frequently go to visit your grandma?"] } },
    { spanish: "NOSOTROS JUGAMOS USUALMENTE JUEGOS DE MESA MIENTRAS ESCUCHAMOS MUSICA", answers: { pos: ["we usually play board games while we listen to music"], neg: ["we do not usually play board games while we listen to music", "we don't usually play board games while we listen to music"], int: ["do we usually play board games while we listen to music?" , "do we usually play board games?"] } },
    { spanish: "TU CASI NUNCA COMES VERDURAS PORQUE NO TE GUSTAN", answers: { pos: ["you almost always eat vegetables because you like them"], neg: ["you hardly ever eat vegetables because you do not like them" , "you hardly ever eat vegetables because you don't like them"], int: ["do you hardly ever eat vegetables?"] } },
    { spanish: "ELLA NUNCA BEBE AGUA PORQUE A ELLA NO LE GUSTA", answers: { pos: ["she always drinks water because she likes it"], neg: ["she never drinks water because she does not like it","she never drinks water because she doesn't like it"], int: ["does she never drink water?"] } },
];

const ex4TranslationPrompts = [
    { spanish: "YO VOY A LA UNIVERSIDAD TODOS LOS DIAS", answer: ["i go to the university every day"] },
    { spanish: "TÚ SIEMPRE JUEGAS SCRABBLE CON TUS AMIGOS LOS FINES DE SEMANA", answer: ["you always play scrabble with your friends on weekends"] },
    { spanish: "ELLA TOCA LA GUITARRA DOS VECES POR SEMANA", answer: ["she plays the guitar twice a week"] },
    { spanish: "NOSOTROS TRABAJAMOS EL SABADO", answer: ["we work on saturday"] },
    { spanish: "ELLA CASI SIEMPRE VISITA A SU ABUELA LOS DOMINGOS", answer: ["she almost always visits her grandmother on sundays"] },
    { spanish: "YO VOY A LA CASA DE MI ABUELA 3 VECES AL MES", answer: ["i go to my grandmother's house three times a month"] },
    { spanish: "RARAS VECES CAMINO EN EL CENTRO LOS FINES DE SEMANA", answer: ["i rarely walk downtown on weekends"] },
    { spanish: "YO JUEGO AL TENNIS LOS SABADOS", answer: ["i play tennis on saturdays"] },
    { spanish: "YO NUNCA JUEGO VIDEO JUEGOS DURANTE LA SEMANA", answer: ["i never play video games during the week"] },
    { spanish: "VICTOR JUEGA VIDEO JUEGOS TODOS LOS DIAS", answer: ["victor plays video games every day"] },
    { spanish: "ÉL JUEGA BILLAR 2 VECES POR SEMANA", answer: ["he plays billiards twice a week"] },
    { spanish: "EL NO ESTA SIEMPRE EN LA OFICINA", answer: ["he is not always in the office"] },
    { spanish: "ELLOS JUEGAN FUTBOL LOS FINES DE SEMANA", answer: ["they play soccer on weekends"] },
    { spanish: "RARAS VECES BEBO CAFÉ", answer: ["i rarely drink coffee"] },
    { spanish: "NOSOTRAS CASI NUNCA TOMAMOS COCA- COLA", answer: ["we almost never drink coca-cola"] },
    { spanish: "¿JUEGAS CARTAS A MENUDO?", answer: ["do you play cards often?"] },
    { spanish: "¿ELLA SIEMPRE TRABAJA HASTA LAS 5?", answer: ["does she always work until 5?"] },
    { spanish: "¿QUE TAN SEGUIDO VAS AL GIMNASIO?", answer: ["how often do you go to the gym?"] },
    { spanish: "ELLA ESTUDIA INGLES 3 VECES POR SEMANA", answer: ["she studies english three times a week"] },
    { spanish: "YO JUEGO VIDEOJUEGOS TODOS LOS DIAS UNA HORA", answer: ["i play video games every day for an hour"] },
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

const howOftenPrompts = [
    { spanish: "¿QUE TAN SEGUIDO ESTUDIAS INGLES?: - YO ESTUDIO INGLES 3 VECES POR SEMANA", answer: ["how often do you study english? - i study english three times a week"] },
    { spanish: "¿QUE TAN SEGUIDO COCINA ELLA? – ELLA COCINA SIEMPRE LOS SABADOS Y DOMINGOS", answer: ["how often does she cook? - she always cooks on saturdays and sundays"] },
    { spanish: "¿QUE TAN SEGUIDO ELLA TOCA LA GUITARRA? – ELLA TOCA LA GUITARRA TODOS LOS DIAS", answer: ["how often does she play the guitar? - she plays the guitar every day"] },
    { spanish: "¿QUE TAN SEGUIDO TOMAS CERVEZA? – YO TOMO CERVEZA UNA VEZ AL MES", answer: ["how often do you drink beer? - i drink beer once a month"] },
    { spanish: "¿QUE TAN SEGUIDO COMES SUSHI? – YO COMO SUSHI 2 VECES AL MES", answer: ["how often do you eat sushi? - i eat sushi twice a month"] },
    { spanish: "¿QUE TAN SEGUIDO VAS A LA IGLESIA? - YO VOY A LA IGLESIA LOS DOMINGOS", answer: ["how often do you go to church? - i go to church on sundays"] },
    { spanish: "¿QUE TAN SEGUIDO LLUEVE EN ESA CIUDAD? – EN ESTA CIUDAD LLUEVE TODOS LOS DIAS", answer: ["how often does it rain in that city? - in this city it rains every day"] },
    { spanish: "¿QUE TAN SEGUIDO ELLOS VIENEN A MEDELLIN? – ELLOS VIENEN A MEDELLIN UNA VEZ AL AÑO", answer: ["how often do they come to medellin? - they come to medellin once a year"] },
    { spanish: "¿QUE TAN SEGUIDO TE MAQUILLAS? – YO ME MAQUILLO LOS SABADOS", answer: ["how often do you make up? - i make up on saturdays"] },
    { spanish: "¿QUE TAN SEGUIDO LIMPIAS TU CASA? – YO LIMPIO MI CASA 3 VECES POR SEMANA", answer: ["how often do you clean your house? - i clean my house three times a week"] },
];

const orderPrompts1 = [
    { base: "SOMETIMES / I / COFFEE / DRINK", correct: "I SOMETIMES DRINK COFFEE" }, 
    { base: "NEVER / SHE / LATE / IS", correct: "SHE IS NEVER LATE" },
    { base: "USUALLY / MY FATHER / TO WORK / BY BUS / GOES", correct: "MY FATHER USUALLY GOES TO WORK BY BUS" },
    { base: "ALWAYS / THE BOYS / ON SATURDAY AFTERNOON / PLAY FOOTBALL", correct: "THE BOYS ALWAYS PLAY FOOTBALL ON SATURDAY AFTERNOON" },
    { base: "NEVER- DRINKS / COFFEE / SHE / IN THE EVENINGS", correct: "SHE NEVER DRINKS COFFEE IN THE EVENINGS" },
    { base: "READ BOOKS / I / SLOWLY / ALWAYS", correct: "I ALWAYS READ BOOKS SLOWLY" },
    { base: "DOESN’T / IT / RAIN / IN THE SUMMER / OFTEN", correct: "IT DOESN’T RAIN IN THE SUMMER OFTEN" },
    { base: "SHE / OFTEN / WRITE / DOESN’T / TO ME", correct: "SHE DOESN’T OFTEN WRITE TO ME" },
    { base: "USUALLY / ARRIVES / THE BUS / LATE", correct: "THE BUS USUALLY ARRIVES LATE" },
    { base: "OFTEN / GO TO BED / I / 11 / BEFORE", correct: "I OFTEN GO TO BED BEFORE 11" }
];

const orderPrompts2 = [
    { base: "USUALLY / WE / EARLY / ARRIVE", correct: "WE USUALLY ARRIVE EARLY" }, 
    { base: "OFTEN / SHE / PLAYS / TENNIS", correct: "SHE OFTEN PLAYS TENNIS" },
    { base: "DICTIONARY / OFTEN / USE / THE / THE / STUDENTS", correct: "THE STUDENTS OFTEN USE THE DICTIONARY" },
    { base: "ME / PAUL / HELPS / SOMETIMES / MY / WITH / HOMEWORK", correct: "PAUL SOMETIMES HELPS ME WITH HOMEWORK" },
    { base: "VISITS / JONATHAN / USUALLY / DENTIST / THE", correct: "JONATHAN USUALLY VISITS THE DENTIST" },
    { base: "TRIES / POLICE / KEEP / THE / ORDER / ALWAYS / TO", correct: "THE POLICE ALWAYS TRY TO KEEP THE ORDER" },
    { base: "SEE / USUALLY / JENNIFER / OUT / GOES / A / TO / CONCERT", correct: "JENNIFER USUALLY SEES A CONCERT" },
    { base: "ANGRY / OUR / TEACHER / ENGLISH / USUALLY / IS", correct: "OUR TEACHER IS USUALLY ANGRY" },
    { base: "CAR / I / DRINK / NEVER / IF / DRIVE / I / ALCOHOL / A", correct: "IF I DRIVE I NEVER DRINK ALCOHOL" },
    { base: "T.V / EVER / HARDLY / I / IN / WATCH / EVENINGS / THE", correct: "I HARDLY EVER WATCH T.V IN THE EVENINGS" },
    { base: "US / SOMETIMES / VISIT / THEY", correct: "THEY SOMETIMES VISIT US" },
    { base: "I / GO / HARDLY / EVER / THE GYM / TO", correct: "I HARDLY EVER GO TO THE GYM" },
    { base: "SHE / DOES / HELP / YOU / ALWAYS?", correct: "SHE DOESN’T ALWAYS HELP YOU" },
    { base: "TO / MY / ON / GO / SUNDAYS / PARENTS / THE / CHURCH / FREQUENTLY", correct: "MY PARENTS FREQUENTLY GO TO CHURCH ON SUNDAYS" }
];

const orderPrompts3 = [
    { base: "WELL / SPEAKS / SHE / ENGLISH", correct: "SHE SPEAKS ENGLISH WELL" }, 
    { base: "SLOWLY / WALKS / THE CAT / VERY", correct: "THE CAT WALKS VERY SLOWLY" },
    { base: "SHE / LATE / IS / ALWAYS", correct: "SHE IS ALWAYS LATE" },
    { base: "HE / GO / OFTEN / TO / DOESN’T / THE CINEMA", correct: "HE DOESN’T OFTEN GO TO THE CINEMA" },
    { base: "USUALLY / GET UP / DO / EARLY / AT THE WEEKEND / YOU?", correct: "DO YOU USUALLY GET UP EARLY AT THE WEEKEND?" },
    { base: "WATCH TV / THEY / OFTEN / AT THE WEEKEND / DON’T", correct: "THEY DON’T OFTEN WATCH TV AT THE WEEKEND" },
    { base: "I / EARLY / ALWAYS / TO SLEEP / GO", correct: "I ALWAYS GO TO BED EARLY" },
    { base: "LATE / IS / VICTOR / OFTEN", correct: "VICTOR IS OFTEN LATE" },
    { base: "NEVER / YOU / TO HER / LISTEN", correct: "YOU NEVER LISTEN TO HER" },
    { base: "OFTEN / MY MOTHER / I / VISIT / DON’T", correct: "I DON’T OFTEN VISIT MY MOTHER" },
    { base: "DRINK / HARDLY EVER / I / BEER", correct: "I HARDLY EVER DRINK BEER" },
    { base: "TO / ALWAYS / BARCELONA / TWICE A MONTH / GO / I", correct: "I ALWAYS GO TO BARCELONA TWICE A MONTH" },
    { base: "DRIVES / ALWAYS / TO WORK / HE / IN THE MORNING", correct: "HE ALWAYS DRIVES TO WORK IN THE MORNING" },
    { base: "TO WORK / SOMETIMES / GO / I / AT THREE", correct: "I SOMETIMES GO TO WORK AT THREE" },
    { base: "SICK / OFTEN / I / NOT / AM", correct: "I AM NOT OFTEN SICK" },
    { base: "I / EAT / NEVER / MEAT", correct: "I NEVER EAT MEAT" }
];

const ex6Prompts = [
    { spanish: "ELLA SIEMPRE ME AYUDA CON MI TAREA", answer: ["she always helps me with my homework"] },
    { spanish: "NOSOTROS CASI NUNCA SALIMOS LOS LUNES", answer: ["we hardly ever go out on mondays"] },
    { spanish: "¿TU PADRE TRABAJA GENERALMENTE EN LA MAÑANA?", answer: ["does your father generally work in the morning?"] },
    { spanish: "ELLOS A VECES BEBEN CERVEZA DESPUES DEL TRABAJO", answer: ["they sometimes drink beer after work"] },
    { spanish: "MI MADRE NUNCA COCINA PIZZA", answer: ["my mother never cooks pizza"] },
    { spanish: "ELLOS USUALMENTE JUEGAN CARTAS EN LA NOCHE", answer: ["they usually play cards at night"] },
    { spanish: "ELLA SIEMPRE COMPRA HELADO", answer: ["she always buys ice cream"] },
    { spanish: "EL TRABAJA LOS SABADOS?", answer: ["does he work on saturdays?"] },
    { spanish: "ESTAS EN LA OFICINA GENERALMENTE?", answer: ["are you in the office generally?"] },
    { spanish: "YO CASI NUNCA LA VEO", answer: ["i hardly ever see her"] },
    { spanish: "ELLOS RARA VECES LLEGAN TARDE", answer: ["they rarely arrive late"] },
    { spanish: "NOSOTROS A VECES SALIMOS DE VACACIONES", answer: ["we sometimes go on vacation"] },
    { spanish: "ELLA SIEMPRE LLEGA TEMPRANO", answer: ["she always arrives early"] },
];

const ex1Vocab = { "tarde": "late", "llegar": "arrive", "escuela": "school", "supermercado": "supermarket", "clima": "weather", "verano": "summer", "regar": "water", "jardín": "garden", "seco": "dry", "funciona": "works", "beber": "drink", "excursión": "hiking", "platos": "dishes", "esposo": "husband" };
const genericVocab = { "siempre": "always", "nunca": "never", "a veces": "sometimes", "a menudo": "often", "usualmente": "usually", "cansado": "tired", "trabaja": "works", "oficina": "office", "triste": "sad", "preocupada": "worried", "hospital": "hospital", "cirugía": "surgery" };
const ex4Vocab = { "universidad": "university", "guitarra": "guitar", "abuela": "grandmother", "mes": "month", "centro": "downtown", "fin de semana": "weekend", "billar": "billiards", "cartas": "cards" };
const ex5Vocab = { "iglesia": "church", "regularmente": "regularly", "nadar": "swimming", "interrumpir": "interrupting", "normalmente": "normally", "cada mañana": "every morning" };
const howOftenVocab = { "qué tan seguido": "how often", "una vez": "once", "dos veces": "twice", "veces": "times", "mes": "month", "año": "year", "maquillarse": "make up", "iglesia": "church" };
const ex6Vocab = { "ayuda": "helps", "tarea": "homework", "salimos": "go out", "beben": "drink", "después del trabajo": "after work", "cocina": "cooks", "juegan": "play", "cartas": "cards", "noche": "night", "compra": "buys", "helado": "ice cream", "oficina": "office", "casi nunca": "hardly ever", "rara veces": "rarely", "vacaciones": "vacation", "siempre": "always", "temprano": "early" };

// --- HELPER COMPONENTS ---

const RewriteAdverbExercise = ({ prompts, onComplete, title, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return (
        <Card className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="animate-spin" />
        </Card>
    );

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
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
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
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}</div>
                                </ScrollArea>
                            </PopoverContent>
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
            <CardHeader>
                <div className="flex flex-row items-center justify-between">
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
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground">{es}:</span><span className="font-bold text-right">{en}</span></Fragment>))}</div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
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

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

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
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
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
    lineCount = 4,
    isSupervisionMode = false,
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
        if (isSupervisionMode) return;
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
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <Pencil className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                    {lines.map((line, idx) => {
                        const status = grades[idx];
                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <span className="font-bold w-8 text-right text-muted-foreground">
                                    {idx + 1}.
                                </span>
                                <Input 
                                    value={line} 
                                    onChange={e => handleLineChange(idx, e.target.value)} 
                                    className={cn(
                                        "flex-1 text-lg h-10 transition-all",
                                        status === 'correct' ? 'border-green-500 bg-green-50/5' : 
                                        status === 'incorrect' ? 'border-red-500 bg-red-50/5' : ''
                                    )} 
                                    autoComplete="off" 
                                    readOnly={isSupervisionMode}
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

// --- MAIN CLASS COMPONENT ---

export default function Class15Content({ overrideStudentId }: { overrideStudentId?: string | null }) {
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
        
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.vocabValidation) setVocabValidation(d.vocabValidation);
        
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
        const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, vocabValidation };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, overrideStudentId, vocabAnswers, vocabValidation]);

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
            const res = v.en.toUpperCase() === (vocabAnswers[i] || '').trim().toUpperCase();
            if (res) ok = true; return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
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
                        <CardContent><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-2 text-foreground">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs text-left">Español</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">Inglés</div>
                            {adverbsVocab.map((v, i) => (<Fragment key={i}><div className="p-2 border rounded bg-white/5 font-bold text-sm uppercase">{v.es}</div><Input value={vocabAnswers[i] || ''} onChange={e => { if (overrideStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); setCanAdvanceVocab(false); }} className={cn("uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!overrideStudentId}/></Fragment>))}
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
                                    <h4 className="font-black text-primary uppercase mb-2 text-sm">Uso:</h4>
                                    <p className="text-lg leading-relaxed">Se usan para definir la frecuencia con la que se hace una determinada actividad: normalmente se usan con el presente simple (que se usa para habitos y costumbres). <br/>Hay adverbios positivos y negativos.</p>
                                </div>
                                <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border border-primary/20">
                                    <h4 className="text-xl font-black text-primary uppercase mb-4">1- VERBO TO BE</h4>
                                    <div className="font-mono bg-muted p-4 rounded-xl border space-y-2 text-base">
                                        <p>(+) = pronoun + to be + freq- adv + complement.</p>
                                        <p>(-) = pronoun + to be + not + freq- adv + complement.</p>
                                        <p>(?) = to be + pronoun + freq- adv + complement?</p>
                                    </div>
                                    <p className="p-3 bg-destructive/10 border-l-4 border-destructive text-sm font-bold uppercase mt-4">NOTA: EL PRONOMBRE Y EL VERBO TO BE NUNCA SE SEPARAN.</p>
                                    <div className="mt-4 space-y-2">
                                        <h5 className="font-bold border-b pb-1 text-primary">TRANSLATE:</h5>
                                        <p className="text-sm italic">1. ELLA SIEMPRE ESTA FELIZ</p>
                                        <p className="text-sm italic">2. TU NO ESTÁS FRECUENTEMENTE CON ELLA</p>
                                        <p className="text-sm italic">3. ¿ÉL SIEMPRE ESTÁ ABURRIDO?</p>
                                        <p className="text-sm italic">4. ¿ESTÁS GENERALMENTE PREOCUPADO POR ESA SITUACIÓN?</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/50 dark:bg-background/20 rounded-xl border border-primary/20">
                                    <h4 className="text-xl font-black text-primary uppercase mb-4">2- OTROS VERBOS (PRESENT SIMPLE)</h4>
                                    <div className="font-mono bg-muted p-4 rounded-xl border space-y-2 text-base">
                                        <p>(+) = pronoun + freq- adv + verb + complement.</p>
                                        <p>(-) = pronoun + do/does + not + freq- adv + verb + complement.</p>
                                        <p>(?) = do/does + pronoun + freq- adv + verb + complement?</p>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <h5 className="font-bold border-b pb-1 text-primary">EJEMPLOS:</h5>
                                        <p className="text-sm italic">1. Siempre vas a dormir tarde</p>
                                        <p className="text-sm italic">2. Generalmente vas a dormir tarde?</p>
                                        <p className="text-sm italic">3. Él a veces va al gimnasio en la mañana.</p>
                                        <p className="text-sm italic">4. Ella casi siempre lava los platos.</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6">
                                <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-16 font-bold h-12 text-white">Entendido</Button>
                            </CardFooter>
                        </Card>
                    </div>
                );
            case 'exercise1': return <RewriteAdverbExercise key="ex1" title="Exercise 1: Position" prompts={ex1RewritePrompts} onComplete={() => handleTopicComplete('exercise1')} vocabulary={ex1Vocab} />;
            case 'exercise2': return <TripleTranslationExercise key="ex2" title="Exercise 2: To Be" prompts={ex2TriplePrompts} onComplete={() => handleTopicComplete('exercise2')} vocabulary={genericVocab} />;
            case 'exercise3': return <TripleTranslationExercise key="ex3" title="Exercise 3: Mixed" prompts={ex3TriplePrompts} onComplete={() => handleTopicComplete('exercise3')} vocabulary={genericVocab} />;
            case 'vocab_game': return <VocabularyMatchingGame data={adverbsVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory Game" />;
            case 'exercise4': return <BallsExercise key="ex4" title="Exercise 4: Habits & Routine" prompts={ex4TranslationPrompts} onComplete={() => handleTopicComplete('exercise4')} vocabulary={ex4Vocab} />;
            case 'exercise5': return <RewriteAdverbExercise key="ex5" title="Exercise 5: Correct Position" prompts={ex5RewritePrompts} onComplete={() => handleTopicComplete('exercise5')} vocabulary={ex5Vocab} />;
            case 'order1': return <RewriteAdverbExercise key="order1" title="Correct Order 1" prompts={orderPrompts1.map(p => ({ base: p.base, correct: p.correct, adverb: '' }))} onComplete={() => handleTopicComplete('order1')} />;
            case 'how_often': return <BallsExercise key="how_often" title="HOW OFTEN CHALLENGE" prompts={howOftenPrompts} onComplete={() => handleTopicComplete('how_often')} vocabulary={howOftenVocab} />;
            case 'create1': 
                return <ManualGradingExercise 
                    key="create1"
                    title="CREATE 1" 
                    description="Inventa 4 frases usando la estructura 'How often' y sus respuestas." 
                    onComplete={() => handleTopicComplete('create1')} 
                    studentDocRef={studentDocRef} 
                    isAdmin={isAdmin} 
                    initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1} 
                    initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Grades} 
                    savePath={`lessonProgress.${progressStorageVersion}.create1`} 
                    savePathGrades={`lessonProgress.${progressStorageVersion}.create1Grades`} 
                    lineCount={4}
                    isSupervisionMode={!!overrideStudentId}
                />;
            case 'order2': return <RewriteAdverbExercise key="order2" title="Correct Order 2" prompts={orderPrompts2.map(p => ({ base: p.base, correct: p.correct, adverb: '' }))} onComplete={() => handleTopicComplete('order2')} />;
            case 'exercise6': return <BallsExercise key="ex6" title="Exercise 6" prompts={ex6Prompts} onComplete={() => handleTopicComplete('exercise6')} vocabulary={ex6Vocab} />;
            case 'order3': return <RewriteAdverbExercise key="order3" title="Correct Order 3" prompts={orderPrompts3.map(p => ({ base: p.base, correct: p.correct, adverb: '' }))} onComplete={() => handleTopicComplete('order3')} />;
            default: return null;
        }
    };

    return (
        <div className="grid gap-8 md:grid-cols-12 text-foreground animate-in fade-in duration-500">
            <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
            <div className="md:col-span-3 md:order-2 order-1 text-left">
                <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-4 border-b bg-muted/30">
                        <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" /> Misión 15
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
