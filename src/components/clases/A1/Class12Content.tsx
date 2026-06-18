'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Clock, 
    ArrowRight, 
    ArrowLeft, 
    Plus, 
    Minus, 
    HelpCircle, 
    Pencil, 
    Check, 
    X, 
    BookText,
    Info,
    Gamepad2,
    Trophy,
    Loader2
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/footer';

// --- CONSTANTS ---

const progressStorageVersion = 'progress_a1_eng_u3_c12_v400_final_fix';
const mainProgressKey = 'progress_a1_eng_unit_3_class_12';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const timeExpressionsData = [
    { spanish: 'ANOCHE', english: ['LAST NIGHT'] },
    { spanish: 'ESTA NOCHE', english: ['TONIGHT'] },
    { spanish: 'LA SEMANA PASADA', english: ['LAST WEEK'] },
    { spanish: 'EL AÑO PASADO', english: ['LAST YEAR'] },
    { spanish: 'EN LA MAÑANA', english: ['IN THE MORNING'] },
    { spanish: 'EN LA TARDE', english: ['IN THE AFTERNOON'] },
    { spanish: 'EN LA NOCHE', english: ['IN THE EVENING', 'AT NIGHT'] },
    { spanish: 'RECIENTEMENTE', english: ['RECENTLY'] },
    { spanish: 'ESTA SEMANA', english: ['THIS WEEK'] },
    { spanish: 'LA PROX. SEMANA', english: ['NEXT WEEK'] },
    { spanish: 'ESTA MAÑANA', english: ['THIS MORNING'] },
    { spanish: 'HACE UNA HORA', english: ['AN HOUR AGO'] },
    { spanish: 'HACE 5 MINUTOS', english: ['5 MINUTES AGO'] },
    { spanish: 'EN EL PASADO', english: ['IN THE PAST'] },
    { spanish: 'EN EL FUTURO', english: ['IN THE FUTURE'] },
    { spanish: 'AHORA- YA', english: ['NOW', 'ALREADY'] },
];

const ex1Prompts = [
    { spanish: "¿QUE ESTAN HACIENDO ELLOS?", answer: ["what are they doing?"] },
    { spanish: "ELLA NO ESTA DURMIENDO, ELLA ESTA COCINANDO", answer: ["she is not sleeping, she is cooking", "she isn't sleeping, she's cooking"] },
    { spanish: "NOSOTROS ESTAMOS ESTUDIANDO PROGRAMACION", answer: ["we are studying programming"] },
    { spanish: "¿A DONDE ESTA YENDO MARY?", answer: ["where is mary going?", "where's mary going?"] },
    { spanish: "¿ESTAS ESCUCHANDO MUSICA? - NO", answer: ["are you listening to music? - no, i am not", "are you listening to music? - no, i'm not"] },
    { spanish: "EL NO LLEGA A LAS 10, EL ESTA LLEGANDO A LAS 8", answer: ["he does not arrive at 10, he is arriving at 8", "he doesn't arrive at 10, he's arriving at 8"] },
    { spanish: "¿TU ABUELA ESTA LEYENDO UN LIBRO? – SI", answer: ["is your grandmother reading a book? - yes, she is", "is your grandma reading a book? - yes, she is"] },
];

const ex2Prompts = [
    { spanish: '1. ¿ELLA ESTA ESTUDIANDO? SI. (SHORT ANSWER)', english: ["is she studying? yes, she is"] },
    { spanish: '2. NOSOTROS NO ESTAMOS TRABAJANDO EN ESA EMPRESA', english: ["we are not working in that company", "we're not working in that company", "we aren't working in that company"] },
    { spanish: '3. ¿EL SE ESTA MURIENDO EN ESE HOSPITAL? NO, EL ESTA MEJOR DESPUES DE SU CIRUGIA.', english: ["is he dying in that hospital? no, he is better after his surgery", "is he dying in that hospital? no, he's better after his surgery"] },
    { spanish: '4. ¿ESTAS CORRIENDO TODOS LOS DIAS? SI.', english: ["are you running every day? yes, i am", "are you running every day? yes i am"] },
    { spanish: '5. ¿USTEDES ESTAN APRENDIENDO CON ESA PROFESORA? - SI', english: ["are you learning with that teacher? yes, we are", "are you learning with that teacher? yes we are"] },
    { spanish: '6. ELLA NO ESTÁ ENSEÑANDO (TEACH) ALEMAN', english: ["she is not teaching german", "she isn't teaching german", "she's not teaching german"] },
    { spanish: '7. ELLOS ESTAN COMENZANDO EL CURSO DE ITALIANO.', english: ["they are beginning the italian course", "they're beginning the italian course"] },
    { spanish: '8. ¿ELLOS ESTAN JUGANDO VIDEOJUEGOS? – NO.', english: ["are they playing video games? no, they are not", "are they playing video games? no, they aren't", "are they playing videogames? no, they are not"] },
    { spanish: '9. NOSOTROS ESTAMOS MANEJANDO (DRIVE) UN CAMION-', english: ["we are driving a truck", "we're driving a truck"] },
    { spanish: '10. ELLOS ESTAN GANANDO EL PARTIDO DE FUTBOL.', english: ["they are winning the soccer match", "they're winning the soccer match", "they are winning the football match", "they're winning the football match"] },
    { spanish: '11. ESTOY VIAJANDO PARA NUEVA YORK EN ESTE MOMENTO.', english: ["i am traveling to new york at this moment", "i'm traveling to new york at this moment", "i am travelling to new york at this moment"] },
    { spanish: '12. ¿QUE ESTAS HACIENDO? – YO ESTOY ESTUDIANDO INGLES.', english: ["what are you doing? i am studying english", "what are you doing? i'm studying english"] },
    { spanish: '13. ¿ESTA LLOVIENDO MUCHO? – SI, TODOS LOS DIAS.', english: ["is it raining a lot? yes, every day", "is it raining a lot? yes every day"] },
];

const ex3Prompts = [
    { question: "ARE YOU CALLING YOUR MOTHER?", answers: { pos: ["yes, i am"], neg: ["no, i am not", "no, i'm not"] } },
    { question: "ARE YOU TIRED?", answers: { pos: ["yes, i am"], neg: ["no, i am not", "no, i'm not"] } },
    { question: "IS SHE SLEEPING?", answers: { pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] } },
    { question: "IS SHE JULIA?", answers: { pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] } },
    { question: "ARE THEY ARRIVING ON SUNDAY?", answers: { pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] } },
    { question: "ARE THEY STUDENTS?", answers: { pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] } },
    { question: "IS HE DRINKING RED WINE?", answers: { pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] } },
    { question: "ARE THEY FOOTBALL PLAYERS?", answers: { pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] } },
    { question: "ARE THEY EATING HAMBURGERS?", answers: { pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] } },
    { question: "IS HE DRIVING A TRUCK?", answers: { pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] } },
    { question: "IS MARIO SINGING IN THE BATHROOM?", answers: { pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] } },
    { question: "IS SHE LOOKING FOR A JOB?", answers: { pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] } },
];

const ex4Prompts = [
    { spanish: "yo voy al supermercado", answers: { simple: ["i go to the supermarket"], continuous: ["i am going to the supermarket", "i'm going to the supermarket"] } },
    { spanish: "ella escribe un libro", answers: { simple: ["she writes a book"], continuous: ["she is writing a book", "she's writing a book"] } },
    { spanish: "ella no trabaja el domingo", answers: { simple: ["she does not work on sunday", "she doesn't work on sunday"], continuous: ["she is not working on sunday", "she isn't working on sunday"] } },
    { spanish: "¿él canta en el baño?", answers: { simple: ["does he sing in the bathroom?"], continuous: ["is he singing in the bathroom?"] } },
    { spanish: "¿tu estudias ingles?", answers: { simple: ["do you study english?"], continuous: ["are you studying english?"] } },
];

const ex5Prompts = [
    { spanish: "YO VOY A ITALIA---------- YO ESTOY YENDO A ITALIA", answer: ["i go to italy - i am going to italy", "i go to italy i am going to italy"] },
    { spanish: "ELLA VA A LA UNIVERSIDAD -- ELLA ESTA YENDO AL COLEGIO", answer: ["she goes to the university - she is going to school", "she goes to the university she is going to school"] },
    { spanish: "NOSOTROS NO VAMOS A LA BIBLIOTECA--NOSOTROS NO ESTAMOS YENDO A LA EMPRESA", answer: ["we do not go to the library - we are not going to the company", "we don't go to the library we aren't going to the company"] },
    { spanish: "¿ELLOS CORREN EN LA CALLE? -- ¿ELLOS ESTAN CORRIENDO EN EL PARQUE?", answer: ["do they run in the street? - are they running in the park?"] },
    { spanish: "¿ELLA BEBE VINO? –¿ELLA ESTA BEBIENDO AGUA? – NO, ELLA ESTA BEBIENDO VODKA CON JUGO DE NARANJA", answer: ["does she drink wine? - is she drinking water? - no, she is drinking vodka with orange juice"] },
    { spanish: "¿TU CANTAS EN EL BAÑO? – ¿ELLA ESTA CANTANDO EN EL JARDIN?", answer: ["do you sing in the bathroom? - is she singing in the garden?"] },
    { spanish: "¿QUE HACES LOS VIERNES? - ¿QUE ESTAS HACIENDO LOS DOMINGOS?", answer: ["what do you do on fridays? - what are you doing on sundays?"] },
    { spanish: "ELLA NO CORRE- ELLA NO ESTA CORRIENDO – ELLA ESTÁ CAMINANDO", answer: ["she does not run - she is not running - she is walking", "she doesn't run she isn't running she's walking"] },
];

const ex6Prompts = [
    { spanish: "¿ELLA HABLA ALEMAN? – ¿ELLA ESTA HABLANDO INGLÉS?", answer: ["does she speak german? - is she speaking english?"] },
    { spanish: "¿ELLOS ESTAN CORRIENDO? –¿ELLOS CORREN EN LA CASA?", answer: ["are they running? - do they run at home?"] },
    { spanish: "¿QUE HACES? – ¿QUE ESTAS HACIENDO?", answer: ["what do you do? - what are you doing?"] },
    { spanish: "¿A DONDE ESTAS YENDO? - ¿A DONDE VAS?", answer: ["where are you going? - where do you go?"] },
    { spanish: "¿DONDE TRABAJAS? –¿DONDE ESTAS TRABAJANDO?", answer: ["where do you work? - where are you working?"] },
    { spanish: "¿ELLA ESTA DURMIENDO? - ¿ELLA DUERME EN LA TARDE?", answer: ["is she sleeping? - does she sleep in the afternoon?"] },
    { spanish: "¿ELLOS ESCRIBEN LIBROS? - ¿ELLOS ESTAN ESCRIBIENDO LIBROS ?", answer: ["do they write books? - are they writing books?"] },
    { spanish: "¿TRABAJAS? - ¿ESTÁS TRABAJANDO?", answer: ["do you work? - are you working?"] },
];

const ex7Prompts = [
    { text: "EVERY MONDAY SALLY _______ HER KIDS TO FOOTBALL PRACTICE.", options: ["DRIVES", "IS DRIVING"], answer: "DRIVES" },
    { text: "DO YOU EAT – ARE YOU EATING NOW?", options: ["DO YOU EAT", "ARE YOU EATING"], answer: "ARE YOU EATING" },
    { text: "I _______ THE KITCHEN EVERY DAY.", options: ["CLEAN", "AM CLEANING"], answer: "CLEAN" },
    { text: "THE MOVIE _______ AT 3 PM.", options: ["STARTS", "IS STARTING"], answer: "STARTS" },
    { text: "BOB _______ IN A RESTAURANT (EN GENERAL).", options: ["WORKS", "IS WORKING"], answer: "WORKS" },
    { text: "SHHHHHHHHHHH! BE QUIET! JOHN _______.", options: ["SLEEPS", "IS SLEEPING"], answer: "IS SLEEPING" },
    { text: "YOU _______ CHOCOLATE.", options: ["DON’T LIKE", "ARE NOT LIKING"], answer: "DON’T LIKE" },
    { text: "THE CHILDREN _______ OUT SIDE AT THE MOMENT.", options: ["PLAY", "ARE PLAYING"], answer: "ARE PLAYING" },
    { text: "SAM _______ A CAT.", options: ["HAS", "IS HAVING"], answer: "HAS" },
    { text: "THEY _______ NOW.", options: ["STUDY", "ARE STUDYING"], answer: "ARE STUDYING" },
    { text: "SMELLS GOOD! WHAT _______?", options: ["DO YOU MAKE", "ARE YOU MAKING"], answer: "ARE YOU MAKING" },
    { text: "THEY _______ RICE EVERY DAY.", options: ["DON’T EAT", "AREN’T EATING"], answer: "DON’T EAT" },
    { text: "SHE _______ AT THE MOMENT.", options: ["DOESN’T STUDY", "ISN’T STUDYING"], answer: "ISN’T STUDYING" },
    { text: "JANE _______ PIZZA.", options: ["LOVES", "IS LOVING"], answer: "LOVES" },
];

const ex8Prompts = [
    { question: "IS SHE GOING TO WORK?", answers: { pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] } },
    { question: "DO THEY STUDY GERMAN?", answers: { pos: ["yes, they do"], neg: ["no, they do not", "no, they don't"] } },
    { question: "DOES SHE TRAVEL TO MIAMI?", answers: { pos: ["yes, she does"], neg: ["no, she does not", "no, she doesn't"] } },
    { question: "ARE THEY LEARNING ENGLISH?", answers: { pos: ["yes, they are"], neg: ["no, they are not", "no, they aren't"] } },
    { question: "IS SHE WALKING FAST?", answers: { pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] } },
    { question: "DOES SHE SPEAK ITALIAN?", answers: { pos: ["yes, she does"], neg: ["no, she does not", "no, she doesn't"] } },
    { question: "ARE WE GOING TO NEW YORK?", answers: { pos: ["yes, we are"], neg: ["no, we are not", "no, we aren't"] } },
    { question: "DO YOU GO TO SCHOOL TODAY?", answers: { pos: ["yes, i do"], neg: ["no, i do not", "no, i don't"] } },
    { question: "IS HE CALLING HIS FAMILY?", answers: { pos: ["yes, he is"], neg: ["no, he is not", "no, he isn't"] } },
    { question: "IS SHE EATING SUSHI?", answers: { pos: ["yes, she is"], neg: ["no, she is not", "no, she isn't"] } },
];

const ex9Prompts = [
    { spanish: "¿ ESTUDIAS? -  ESTAS ESTUDIANDO?", answers: { trans: ["do you study? - are you studying?"], pos: ["yes, i do - yes, i am"], neg: ["no, i don't - no, i'm not" , "no, i do not - no, i am not"] } },
    { spanish: "¿ELLA ESTÁ COCINANDO? - ELLOS COCINAN?", answers: { trans: ["is she cooking? - do they cook?"], pos: ["yes, she is - yes, they do"], neg: ["no, she isn't - no, they don't" , "no, she is not - no, they do not"] } },
    { spanish: "¿ELLOS BEBEN CERVEZA? - ELLOS ESTAN BEBIENDO AGUA?", answers: { trans: ["do they drink? - are they drinking water?"], pos: ["yes, they do - yes, they are"], neg: ["no, they don't - no, they aren't" , "no, they do not - no, they are not"] } },
    { spanish: "¿ELLOS JUEGAN EN EL PARQUE? - ELLOS ESTÁN JUGANDO EN LA UNIVERSIDAD?", answers: { trans: ["do they play in the park? - are they playing at the university?"], pos: ["yes, they do - yes, they are"], neg: ["no, they don't - no, they aren't" , "no, they do not - no, they are not"] } },
    { spanish: "¿ELLA ESTA VIVIENDO EN BARCELONA? - ELLA VIVE EN MEDELLIN?", answers: { trans: ["is she living in barcelona? - does she live in medellin?"], pos: ["yes, she is - yes, she does"], neg: ["no, she isn't - no, she doesn't" , "no, she is not - no, she does not"] } },
    { spanish: "¿EL LLEGA A LAS 5 P.M? - ELLA ESTÁ LLEGANDO TEMPRANO?", answers: { trans: ["does he arrive at 5 p.m? - is she arriving early?"], pos: ["yes, he does - yes, she is"], neg: ["no, he doesn't - no, she isn't" , "no, he does not - no, she is not"] } },
    { spanish: "¿ESTAS ESTUDIANDO INGLES? - ESTUDIAS INGLES TODOS LOS DIAS?", answers: { trans: ["are you studying english? - do you study english every day?"], pos: ["yes, i am - yes, i do"], neg: ["no, i'm not - no, i don't" , "no, i am not - no, i do not"] } },
    { spanish: "¿ESTAS LAVANDO TU CARRO? - LAVAS SU CARRO LOS DOMINGOS? - (DE ÉL)", answers: { trans: ["are you washing your car? - do you wash his car on sundays?"], pos: ["yes, i am", "yes, i do"], neg: ["no, i'm not", "no, i don't" , "no, i am not", "no, i do not"] } },
    { spanish: "¿ELLA ESTA TRABAJANDO? - TRABAJAS EL DOMINGO?", answers: { trans: ["is she working? - do you work on sunday?"], pos: ["yes, she is - yes, i do"], neg: ["no, she isn't - no, i don't" , "no, she is not - no, i do not"] } },
    { spanish: "¿ESTÁS JUGANDO CON ELLOS? - JUEGAS CON NOSOTROS?", answers: { trans: ["are you playing with them? - do you play with us?"], pos: ["yes, i am - yes, i do"], neg: ["no, i'm not", "no, i don't" , "no, i am not", "no, i do not"] } },
];

const finalExPrompts = [
    { text: "TOM _______ FOOTBALL IN A SCHOOL TEAM.", options: ["PLAYS", "IS PLAYING"], answer: "PLAYS" },
    { text: "I’M BUSY NOW. I _______ SOME SHOPPING.", options: ["GO", "AM GOING"], answer: "AM GOING" },
    { text: "WHAT TIME _______ YOUR FAVORITE TV PROGRAM TONIGHT?", options: ["IS", "IS BEING"], answer: "IS" },
    { text: "_______ NEWSPAPERS?", options: ["ARE YOU USUALLY READING", "DO YOU USUALLY READ"], answer: "DO YOU USUALLY READ" },
    { text: "YOU _______ SO NICE.", options: ["LOOK", "ARE LOOKING"], answer: "LOOK" },
    { text: "MARTIN _______ NY MONTHLY FOR WORK.", options: ["VISITS", "IS VISITING"], answer: "VISITS" },
    { text: "I _______ WAITING FOR HIM.", options: ["SIT", "AM SITTING"], answer: "AM SITTING" },
    { text: "THE WEATHER _______ BETTER FOR THE WEEKEND.", options: ["DOESN’T GET", "ISN’T GETTING"], answer: "ISN’T GETTING" },
    { text: "HURRY UP! EVERY BODY _______ FOR YOU!", options: ["IS WAITING", "WAIT"], answer: "IS WAITING" },
    { text: "I _______ TO THE CINEMA UNLESS I FINISH MY HOMEWORK.", options: ["DON’T GO", "AM NOT GOING"], answer: "DON’T GO" },
    { text: "I USUALLY _______ TO ROCK MUSIC.", options: ["LISTEN", "AM LISTENING"], answer: "LISTEN" },
    { text: "WHAT IS SHE DOING? SHE _______ TO MUSIC.", options: ["LISTENS", "IS LISTENING"], answer: "IS LISTENING" },
    { text: "MY PROFESSOR ALWAYS _______ SLOWLY.", options: ["IS SPEAKING", "SPEAKS"], answer: "SPEAKS" },
    { text: "WHAT ARE YOU DOING TONIGHT? WE _______ TO WATCH A MOVIE.", options: ["ARE GOING", "GO"], answer: "ARE GOING" },
    { text: "HE NORMALLY _______ FAST.", options: ["DRIVES", "IS DRIVING"], answer: "DRIVES" },
    { text: "I’M SORRY, ANGELA CAN’T _______ TO THE PHONE- SHE _______ A SHOWER.", options: ["COME", "TAKES / IS TAKING"], answer: "IS TAKING" },
    { text: "I _______ HOME RIGHT NOW.", options: ["GO", "AM GOING"], answer: "AM GOING" },
    { text: "THOSE GIRLS _______ OUT EVERY FRIDAY.", options: ["GO", "ARE GOING"], answer: "GO" },
    { text: "GENERALLY, I _______ CLASSICAL MUSIC.", options: ["AM LIKING", "LIKE"], answer: "LIKE" },
    { text: "MARTHA _______ IN AFRICA.", options: ["DOESN’T LIVE", "ISN’T LIVING"], answer: "DOESN’T LIVE" },
    { text: "DAD USUALLY _______ FOR DINNER.", options: ["IS COOKING", "COOKS"], answer: "COOKS" },
    { text: "MARIA _______ FOR A TV STATION.", options: ["WORKS", "IS WORKING"], answer: "WORKS" },
    { text: "AT THE MOMENT SHE _______ IN THE SAHARA DESERT.", options: ["TRAVELS", "IS TRAVELLING"], answer: "IS TRAVELLING" },
    { text: "MY SISTER _______ TO SCHOOL EVERY DAY.", options: ["WALKS", "IS WALKING"], answer: "WALKS" },
    { text: "DAN _______ WILD ANIMALS.", options: ["IS LOVING", "LOVES"], answer: "LOVES" },
    { text: "WE _______ LUNCH NOW.", options: ["HAVE", "ARE HAVING"], answer: "ARE HAVING" },
];

const ex1Vocab = { "haciendo": "doing", "durmiendo": "sleeping", "cocinando": "cooking", "estudiando": "studying", "programación": "programming", "yendo": "going", "escuchando": "listening", "llega": "arrives", "llegando": "arriving", "leyendo": "reading", "libro": "book" };
const ex2Vocab = { "estudiar": "study", "empresa": "company", "morir": "die", "mejor": "better", "cirugía": "surgery", "correr": "run", "aprender": "learn", "enseñar": "teach", "alemán": "German", "comenzar": "begin / start", "jugar": "play", "manejar": "drive", "camión": "truck", "ganar": "win", "partido": "match", "fútbol": "soccer / football", "viajar": "travel", "haciendo": "doing", "lloviendo": "raining" };
const ex4Vocab = { "supermercado": "supermarket", "escribe": "writes", "libro": "book", "trabaja": "works", "domingo": "sunday", "canta": "sings", "baño": "bathroom", "estudias": "study" };
const ex5Vocab = { "ir": "go", "colegio": "school", "empresa": "company", "correr": "run", "parque": "park", "beber": "drink", "vino": "wine", "agua": "water", "jugo de naranja": "orange juice", "baño": "bathroom", "jardín": "garden", "hacer": "do", "viernes": "fridays", "domingos": "sundays", "caminando": "walking" };
const ex6Vocab = { "hablar": "speak / talk", "alemán": "German", "hablando": "talking / speaking", "inglés": "English", "corriendo": "running", "casa": "home", "haciendo": "doing", "yendo": "going", "vas": "go", "trabajando": "working", "duerme": "sleeps", "durmiendo": "sleeping", "escribiendo": "writing", "libros": "books" };
const ex9Vocab = { "estudiar": "study", "cocinar": "to cook", "beber": "drink" , "jugar": "play",  "parque" : "park" , "vivir": "live", "llegar": "arrive", "temprano" : "early" , "lavar": "wash", "todos los días": "every day", "domingos": "sundays"};

// --- HELPERS ---

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
    lineCount = 6,
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
                    <div className="w-full">
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

const ChoiceExercise = ({ prompts, onComplete, title, description }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleSelect = (option: string) => {
        const isCorrect = option.toUpperCase() === prompts[currentIndex].answer.toUpperCase();
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleNext = () => {
        if (currentIndex < prompts.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>{description || "Elige la opcion gramaticamente correcta."}</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-bold text-center leading-relaxed">
                    {prompts[currentIndex].text.split('_______').map((part: string, i: number) => (
                        <React.Fragment key={i}>
                            {part}
                            {i < prompts[currentIndex].text.split('_______').length - 1 && (
                                <span className="text-primary border-b-2 border-dashed border-primary px-4 mx-2">
                                    {status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button 
                            key={opt} 
                            onClick={() => handleSelect(opt)} 
                            variant="outline" 
                            className={cn(
                                "h-16 text-lg font-black uppercase",
                                status[currentIndex] === 'correct' && opt === prompts[currentIndex].answer && "border-green-500 bg-green-50 text-green-700 shadow-md scale-105",
                                status[currentIndex] === 'incorrect' && opt !== prompts[currentIndex].answer && "border-red-500 bg-red-50 text-red-700"
                            )}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={handleNext} disabled={status[currentIndex] !== 'correct'} className="px-12 font-bold">{currentIndex === prompts.length - 1 ? 'Terminar' : 'Siguiente'}</Button>
            </CardFooter>
        </Card>
    );
};

const DualInputShortAnswerExercise = ({ prompts, onComplete, title }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ pos: '', neg: '' });
    const [val, setVal] = useState<any>({ pos: 'unchecked', neg: 'unchecked' });
    const [completed, setCompleted] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setAns({ pos: '', neg: '' });
        setVal({ pos: 'unchecked', neg: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const newVal = { ...val };
        let ok = true;
        ['pos', 'neg'].forEach(f => {
            const user = ans[f as keyof typeof ans].trim().toLowerCase().replace(/[.?,]/g, '');
            const cors = prompts[currentIndex].answers[f].map((a: string) => a.toLowerCase().replace(/[.?,]/g, ''));
            if (cors.includes(user)) newVal[f] = 'correct'; else { ok = false; newVal[f] = 'incorrect'; }
        });
        setVal(newVal);
        if (ok) { toast({ title: "¡Perfecto!" }); setCompleted(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>Responde de forma corta (positiva y negativa).</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completed[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl uppercase">{prompts[currentIndex].question}</div>
                <div className="space-y-4 max-w-md mx-auto font-mono">
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-green-500 text-center">(+A)</Label><Input value={ans.pos} onChange={e => setAns(p => ({...p, pos: e.target.value}))} className={cn(val.pos === 'correct' ? 'border-green-500' : val.pos === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-red-500 text-center">(-A)</Label><Input value={ans.neg} onChange={e => setAns(p => ({...p, neg: e.target.value}))} className={cn(val.neg === 'correct' ? 'border-green-500' : val.neg === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!completed[currentIndex]} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const SimpleVsContinuousExercise = ({ prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({ simple: '', continuous: '' });
    const [validation, setValidation] = useState<any>({ simple: 'unchecked', continuous: 'unchecked' });
    const [completedMap, setCompletedMap] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setAnswers({ simple: '', continuous: '' });
        setValidation({ simple: 'unchecked', continuous: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const newVal = { ...validation };
        let allOk = true;
        ['simple', 'continuous'].forEach(f => {
            const user = answers[f as keyof typeof answers].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = prompts[currentIndex].answers[f].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (corrects.includes(user)) newVal[f] = 'correct'; else { allOk = false; newVal[f] = 'incorrect'; }
        });
        setValidation(newVal);
        if (allOk) { toast({ title: "¡Excelente!" }); setCompletedMap(prev => ({ ...prev, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus frases" });
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Exercise 4: Simple vs Continuous</CardTitle></div>
                {vocabulary && (
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-brand-blue border-2'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                        <PopoverContent className="w-64"><div className="grid grid-cols-2 gap-2 text-sm text-left">{Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground">{es}:</span><span className="font-bold text-right">{en}</span></React.Fragment>))}</div></PopoverContent>
                    </Popover>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-2 justify-center mb-4 flex-wrap">
                    {prompts.map((_: any, i: number) => (
                        <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completedMap[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>{i + 1}</div>
                    ))}
                </div>
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl uppercase">{prompts[currentIndex].spanish}</div>
                <div className="space-y-4 text-foreground">
                    <div className="space-y-2"><Label className="text-sm font-bold text-primary">Present Simple:</Label><Input value={answers.simple} onChange={e => setAnswers(p => ({...p, simple: e.target.value}))} className={cn(validation.simple === 'correct' ? 'border-green-500' : validation.simple === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="space-y-2"><Label className="text-sm font-bold text-brand-purple">Present Continuous:</Label><Input value={answers.continuous} onChange={e => setAnswers(p => ({...p, continuous: e.target.value}))} className={cn(validation.continuous === 'correct' ? 'border-green-500' : validation.continuous === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!completedMap[currentIndex]} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const TripleLineTranslationExerciseInternal = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ans, setAns] = useState({ trans: '', pos: '', neg: '' });
    const [val, setVal] = useState<any>({ trans: 'unchecked', pos: 'unchecked', neg: 'unchecked' });
    const [completed, setCompleted] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setAns({ trans: '', pos: '', neg: '' });
        setVal({ trans: 'unchecked', pos: 'unchecked', neg: 'unchecked' });
    }, [currentIndex]);

    const handleCheck = () => {
        const newVal = { ...val };
        let ok = true;
        ['trans', 'pos', 'neg'].forEach(f => {
            const user = ans[f as keyof typeof ans].trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const cors = prompts[currentIndex].answers[f].map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            if (f === 'trans' && !ans.trans.trim().endsWith('?')) { ok = false; newVal.trans = 'incorrect'; }
            else if (cors.includes(user)) newVal[f] = 'correct'; else { ok = false; newVal[f] = 'incorrect'; }
        });
        setVal(newVal);
        if (ok) { toast({ title: "¡Perfecto!" }); setCompleted(p => ({ ...p, [currentIndex]: true })); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="w-full">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>Traduce la pregunta y responde de forma corta</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", completed[i] ? "bg-green-500 text-white border-green-500" : "bg-card text-foreground")}>
                                {i + 1}
                            </div>
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
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-4 rounded-lg border text-center font-bold text-xl uppercase">{prompts[currentIndex].spanish}</div>
                <div className="space-y-4 font-mono text-base max-w-lg mx-auto">
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-blue-500 text-center">(?)</Label><Input value={ans.trans} onChange={e => setAns(p => ({...p, trans: e.target.value}))} className={cn("flex-1", val.trans === 'correct' ? 'border-green-500' : val.trans === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-green-500 text-center">(+A)</Label><Input value={ans.pos} onChange={e => setAns(p => ({...p, pos: e.target.value}))} className={cn("flex-1", val.pos === 'correct' ? 'border-green-500' : val.pos === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                    <div className="flex items-center gap-4"><Label className="w-12 font-bold text-red-500 text-center">(-A)</Label><Input value={ans.neg} onChange={e => setAns(p => ({...p, neg: e.target.value}))} className={cn("flex-1", val.neg === 'correct' ? 'border-green-500' : val.neg === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} variant="secondary">Verificar</Button>
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={!completed[currentIndex]} className="font-bold">Siguiente</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

export default function Class12Content() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(timeExpressionsData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(timeExpressionsData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Time Expressions)', icon: Clock, status: 'active' },
        { key: 'grammar', name: 'Grammar 1 (Present Continuous)', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar_rules', name: 'Grammar 2 (Rules)', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar 3', icon: GraduationCap, status: 'locked' },
        { key: 'ex7', name: 'Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: 'Exercise 8', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex9', name: 'Exercise 9', icon: PenSquare, status: 'locked' },
        { key: 'final_ex', name: 'Final Exercise', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(t => ({ ...t }));
        let savedST = '';
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const data = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(t => { if (data[t.key]) t.status = data[t.key]; });
            savedST = data.lastSelectedTopic || '';
        }
        let lastDone = true;
        for(let i=0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
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
        const s = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => (s as any)[t.key] = t.status);
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
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active';
                    win = true;
                    next = np[i + 1].key;
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
        if (['grammar', 'grammar_rules', 'grammar3'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const nv = timeExpressionsData.map((v, i) => {
            const c = v.english.some(e => e.toUpperCase() === vocabAnswers[i].trim().toUpperCase());
            if (c) atLeastOneCorrect = true;
            return c ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (atLeastOneCorrect) { toast({ title: "¡Bien hecho!" }); setCanAdvanceVocab(true); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-left text-foreground">
                        <CardHeader><CardTitle>Time Expressions</CardTitle></CardHeader>
                        <CardContent><div className="grid grid-cols-2 gap-2">{timeExpressionsData.map((v, i) => (<React.Fragment key={i}><div className="p-2 border rounded bg-muted/10">{v.spanish}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); setCanAdvanceVocab(false); }} className={cn(vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" /></React.Fragment>))}</div></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">PRESENT CONTINUOUS</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-foreground font-bold text-lg">
                            <div className="p-6 bg-white/20 rounded-2xl border border-black/10">
                                <p className="text-primary mb-4 uppercase tracking-tighter">¿Qué es?</p>
                                <p className="mb-4 text-slate-800 dark:text-slate-100">Se usa para hablar de acciones que están ocurriendo en este preciso momento. </p>
                                <p>  <span className="text-green-500 underline">obligatorio = </span> utilizar el verbo <span className="font-black">To be</span> (am, is, are).</p>
                                <br/>
                                <div className="bg-muted/50 p-4 rounded-xl border font-mono text-base">
                                    <p className="text-primary font-black uppercase text-sm mb-2">Estructura Básica:</p>
                                    <p>(+) Pronoun + To be + Verb-ING</p>
                                    <p>(-) Pronoun + To be + NOT + Verb-ING</p>
                                    <p>(?) To be + Pronoun + Verb-ING ?</p>
                                    <p>(+A) Yes, Pronoun + To be</p>
                                    <p>(-A) No, Pronoun + To be + NOT</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise key="ex1" title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={ex1Vocab} />;
            case 'grammar_rules':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">REGLAS DE ORTOGRAFÍA "ING"</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-foreground">
                            <Accordion type="multiple" className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger className="font-bold">1. Verbos terminados en "E"</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Remover la "e" y agregar <span className="font-bold">ING</span>.</p>
                                        <p className="font-mono bg-muted p-2 rounded">Take &rarr; Taking</p>
                                        <div className="text-green-500 font-bold text-sm">Excepciones: See &rarr; Seeing / Make &rarr; Making</div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger className="font-bold">2. Verbos Monosilábicos (Cortos)</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Si termina en CVC (Consonante-Vocal-Consonante), se dobla la última letra.</p>
                                        <p className="font-mono bg-muted p-2 rounded">Stop &rarr; Stopping / Sit &rarr; Sitting / Win &rarr; Winning</p>
                                        <div className="text-green-500 font-bold text-sm">Excepción X - W - Z: Fix &rarr; Fixing / Draw &rarr; Drawing</div>
                                        <div className="text-blue-500 font-bold text-sm">Nota: Si tiene 2 vocales NO dobla: Read &rarr; Reading / Open &rarr; Opening</div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">
                                    <AccordionTrigger className="font-bold">3. Verbos Bisílabos</AccordionTrigger>
                                    <AccordionContent className="space-y-2">
                                        <p>Acento en la 2da sílaba: Dobla consonante (Begin &rarr; Beginning / Prefer &rarr; Preferring).</p>
                                        <p>Acento en la 1ra sílaba: NO dobla (Visit &rarr; Visiting).</p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-4">
                                    <AccordionTrigger className="font-bold">4. Verbos terminados en "Y"</AccordionTrigger>
                                    <AccordionContent>No hay cambios: Play &rarr; Playing / Study &rarr; Studying.</AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-5">
                                    <AccordionTrigger className="font-bold">5. Verbos terminados en "IE"</AccordionTrigger>
                                    <AccordionContent>Cambiamos por Y + ING: Die &rarr; Dying.</AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-6">
                                    <AccordionTrigger className="font-bold">6. British vs American</AccordionTrigger>
                                    <AccordionContent>British: Travelling / American: Traveling.</AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar_rules')} size="lg" className="px-12 font-bold">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ex2': return <SimpleTranslationExercise exerciseKey="c12_ex2" onComplete={() => handleTopicComplete('ex2')} course="a1" vocabulary={ex2Vocab} highlightVocabulary={true} />;
            case 'create1': 
                return <ManualGradingExercise 
                    title="INVENTA 2 FRASES AFIRMATIVAS - 2 NEGATIVAS Y 2 INTERROGATIVAS" 
                    description="Crea tus propias frases usando Presente Continuo." 
                    onComplete={() => handleTopicComplete('create1')} 
                    studentDocRef={studentDocRef} 
                    isAdmin={isAdmin} 
                    initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1} 
                    initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Grades} 
                    savePath={`lessonProgress.${progressStorageVersion}.create1`} 
                    savePathGrades={`lessonProgress.${progressStorageVersion}.create1Grades`} 
                />;
            case 'ex3': return <DualInputShortAnswerExercise prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} title="Exercise 3" />;
            case 'ex4': return <SimpleVsContinuousExercise prompts={ex4Prompts} onComplete={() => handleTopicComplete('ex4')} vocabulary={ex4Vocab} />;
            case 'ex5': return <BallsExercise key="ex5" title="Exercise 5" prompts={ex5Prompts} onComplete={() => handleTopicComplete('ex5')} vocabulary={ex5Vocab} />;
            case 'ex6': return <BallsExercise key="ex6" title="Exercise 6" prompts={ex6Prompts} onComplete={() => handleTopicComplete('ex6')} vocabulary={ex6Vocab} />;
            case 'grammar3':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left text-foreground">
                        <CardHeader><CardTitle className="text-2xl font-black text-primary uppercase">GRAMMAR 3: USOS Y DIFERENCIAS</CardTitle></CardHeader>
                        <CardContent className='pt-4 space-y-6 font-bold'>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3 p-4 bg-white/50 dark:bg-background/20 rounded-2xl border">
                                    <h4 className="font-black text-primary uppercase border-b pb-1">Present Simple</h4>
                                    <ul className="text-sm space-y-1 list-disc pl-4">
                                        <li>Hábitos y rutinas</li>
                                        <li>Hechos permanentes</li>
                                        <li>Horarios programados</li>
                                        <li>Verdades Generales</li>
                                        <li>Situaciones permanentes</li>
                                    </ul>
                                </div>
                                <div className="space-y-3 p-4 bg-white/50 dark:bg-background/20 rounded-2xl border">
                                    <h4 className="font-black text-brand-purple uppercase border-b pb-1">Present Continuous</h4>
                                    <ul className="text-sm space-y-1 list-disc pl-4">
                                        <li>Acciones en progreso ahora</li>
                                        <li>Situaciones temporales</li>
                                        <li>Planes futuros cercanos</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('grammar3')} size="lg" className="px-12 font-bold">Continuar</Button></CardFooter>
                    </Card>
                );
            case 'ex7': return <ChoiceExercise prompts={ex7Prompts} onComplete={() => handleTopicComplete('ex7')} title="Exercise 7" />;
            case 'ex8': return <DualInputShortAnswerExercise prompts={ex8Prompts} onComplete={() => handleTopicComplete('ex8')} title="Exercise 8" />;
            case 'vocab_game': return <VocabularyMatchingGame data={timeExpressionsData.map(v => ({ spanish: v.spanish, english: v.english }))} onComplete={() => handleTopicComplete('vocab_game')} title="Vocab Review" />;
            case 'ex9': return <TripleLineTranslationExerciseInternal prompts={ex9Prompts} onComplete={() => handleTopicComplete('ex9')} title="Exercise 9" vocabulary={ex9Vocab} />;
            case 'final_ex': return <ChoiceExercise prompts={finalExPrompts} onComplete={() => handleTopicComplete('final_ex')} title="Final Exercise" />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left text-white">
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm font-bold text-primary flex items-center gap-2">
                            <ArrowLeft className='h-4 w-4'/> Volver a la Unidad 2
                        </Link>
                        <h1 className="text-4xl font-bold [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 12 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle className='text-primary uppercase font-black'>Ruta</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-bold')}>
                                                    <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className="h-5 w-5" />}<span>{item.name}</span></div>
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2"><span>Progreso</span><span className="font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-1.5" /></div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}

