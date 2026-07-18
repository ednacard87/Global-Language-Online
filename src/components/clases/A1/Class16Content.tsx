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
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a1_eng_u3_c16_v16_full_content';
const mainProgressKey = 'progress_a1_eng_unit_3_class_16';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const prepositionsVocab = [
    { es: "SOBRE", en: "ON" },
    { es: "ADENTRO DE", en: "INSIDE" },
    { es: "EN", en: "IN" },
    { es: "AFUERA", en: "OUTSIDE" },
    { es: "ENCIMA DE", en: "ABOVE" },
    { es: "DEBAJO DE", en: "UNDER" },
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

const ex2PromptsData = [
    { spanish: "¿QUE TAN FRIA ESTA LA PISCINA? – ESTA MUY FRIA", answer: ["how cold is the pool? - it is very cold", "how cold is the pool? - it's very cold"] },
    { spanish: "¿QUE TAN SEGUIDO JUEGAS FUTBOL? – YO JUEGO FUTBOL LOS FINES DE SEMANA.", answer: ["how often do you play soccer? - i play soccer on weekends", "how often do you play football? - i play football on weekends"] },
    { spanish: "¿QUE TAN INTELIGENTE ES TU HERMANO? – EL ES MUY INTELIGENTE", answer: ["how intelligent is your brother? - he is very intelligent", "how smart is your brother? - he's very smart"] },
    { spanish: "¿QUE TAN RAPIDO ES TU CARRO? – MI CARRO ES MUY VIEJO Y LENTO", answer: ["how fast is your car? - my car is very old and slow", "how fast is your car? - my car's very old and slow"] },
    { spanish: "¿QUE TAN PESADA ESTA LA CAJA? – LA CAJA NO ESTÁ PESADA", answer: ["how heavy is the box? - the box is not heavy", "how heavy is the box? - the box isn't heavy"] },
    { spanish: "¿CUANTOS AÑOS TIENE ELLA? – ELLA TIENE 39 AÑOS.", answer: ["how old is she? - she is 39 years old", "how old is she? - she is thirty-nine years old"] },
    { spanish: "¿CUANTOS AÑOS TIENEN TUS GEMELOS? – MIS GEMELOS TIENEN 8 AÑOS", answer: ["how old are your twins? - my twins are 8 years old", "how old are your twins? - my twins are eight years old"] },
];

const ex3CompletionData: CompletionPrompt[] = [
    { parts: ["MY ENGLISH CLASS STARTS ", " 3 O’CLOCK, ", " TUESDAY ", " THE AFTERNOON."], answers: ["AT", "ON", "IN"] },
    { parts: ["I NEVER WORK ", " THE WEEKEND."], answers: ["ON"] },
    { parts: ["JON’S BIRTHDAY IS ", " NOVEMBER 18TH."], answers: ["ON"] },
    { parts: ["IT HARDLY EVER SNOWS IN BARCELONA ", " THE WINTER."], answers: ["IN"] },
    { parts: ["THE EXAM IS ", " FRIDAY MORNING ", " 8 O’CLOCK."], answers: ["ON", "AT"] },
    { parts: ["THE FILM FINISHES ", " SATURDAY ", " MIDNIGHT."], answers: ["ON", "AT"] },
    { parts: ["STUDENTS ARE ON HOLIDAY : ", "CHRISTMAS AND" , "HOLY WEEK"], answers: ["AT" ,"AT"] },
    { parts: ["I WAS BORN", "1987"], answers: ["IN"] },
    { parts: ["TEENAGERS OFTEN WATCH TV ", "NIGHT THAT’S WHY THEY ARE TIRED AND SLEEPY " , "THE MORNING."], answers: ["AT" , "IN"] },
    { parts: ["JOHN ALMOST ALWAYS WALK ", " FRIDAY MORNING."], answers: ["ON"] },
    { parts: ["I ALWAYS GO  ", "MAY TO DOMINICAN REPUBLIC ."], answers: ["IN"] },
    { parts: ["HE HAS GUITAR LESSONS", " MONDAYS AFTERNOON."], answers: ["ON"] },
    { parts: ["YOUR CITY IS VERY COLD ", " WINTER."], answers: ["IN"] },
    { parts: ["IN COLOMBIA, PEOPLE NORMALLY HAVE LUNCH  ", " NOON."], answers: ["AT"] },
    { parts: ["SHE USUALLY VISITS HER PARENTS", "THE WEEKEND."], answers: ["ON"] },
    { parts: ["THEY FREQUENTLY GO TO THE BAR", " SATURDAY NIGHT."], answers: ["ON"] },
    { parts: ["WE SEE OUR FAMILY", " CHRISTMAS DAY."], answers: ["AT"] },
    { parts: ["MY BIRTHDAY IS", " CHRISTMAS" , "DECEMBER  2ND."], answers: [ "AT","ON"] },
    { parts: ["HE ALWAYS GOES JOGGING ", " SUNDAY MORNING. (JOGGING: TROTAR)."], answers: ["ON"] },
    { parts: ["I LOVE READING", " AFTERNOON AFTER I HAVE LUNCH.."], answers: ["IN"] },
    { parts: ["MY COUNTRY IS VERY HOT", "THE SUMMER."], answers: ["IN"] },
    { parts: ["HIS BIRTHDAY IS ", " DECEMBER 31."], answers: ["ON"] },
];

const ex4PromptsData = [
    { spanish: "¿QUE TAN CANSADO ESTÁS?", answer: ["how tired are you?"] },
    { spanish: "¿QUE TAN SEGUIDO VAS A LA UNIVERSIDAD?", answer: ["how often do you go to the university?"] },
    { spanish: "¿QUE TAN INTELIGENTE ES MATT?", answer: ["how intelligent is matt?", "how smart is matt?"] },
    { spanish: "¿QUE TAN VELOZ ES TU CARRO?", answer: ["how fast is your car?"] },
    { spanish: "¿QUE TAN ALTO ES EL HERMANO DE TIM?", answer: ["how tall is tim's brother?"] },
    { spanish: "¿QUE TAN SEGUIDO JUEGAS FUTBOL? ", answer: ["how often do you play soccer?"] },
    { spanish: "¿QUE TAN GRANDE ES LA CASA DE THOMAS?", answer: ["how big is thomas's house?"] },
    { spanish: "¿QUE TAN GORDO ES EL GATO DE MARY? ", answer: ["how fat is mary's cat?"] },
    { spanish: "¿QUE TAN SEGUIDO VIENES A MEDELLIN? ", answer: ["how often do you come to medellin?"] },
    { spanish: "¿QUE TAN SEGUIDO VAS A CARTAGENA? ", answer: ["how often do you go to cartagena?"] },
    { spanish: "¿QUE TAN SEGUIDO TRABAJAS LOS SABADOS? ", answer: ["how often do you work on saturdays?"] },
    { spanish: "¿QUE TAN ENFERMA ESTA TU PRIMA? ", answer: ["how sick is your cousin?"] },
];

const ex5PromptsData = [
    { spanish: "SU PAPÁ TIENE UNA REUNION EL VIERNES AL MEDIO DIA (DE ÉL)", answer: ["his dad has a meeting on friday at noon", "his father has a meeting on friday at noon"] },
    { spanish: "ELLOS NO TRABAJAN LOS SABADOS EN LA TARDE", answer: ["they do not work on saturdays in the afternoon", "they don't work on saturdays in the afternoon"] },
    { spanish: "LA CLASE DE ITALIANO ES LOS JUEVES EN LA MAÑANA", answer: ["the italian class is on thursdays in the morning"] },
    { spanish: "TU PAIS ES MUY FRIO EN INVIERNO", answer: ["your country is very cold in winter"] },
    { spanish: "EN EL PASADO, YO ESTUDIÉ FRANCES", answer: ["in the past, i studied french"] },
    { spanish: "YO ALMUERZO CON MIS PADRES EN LA CASA AL MEDIO DIA ", answer: ["i have lunch with my parents at home at noon"] },
    { spanish: "ELLA TIENE REUNIONES EL PROXIMO MES EN LA MAÑANA", answer: ["she has meetings next month in the morning"] },
    { spanish: "NOSOTROS TENEMOS UNA FIESTA EL SABADO EN LA NOCHE ", answer: ["we have a party on saturday at night"] },
    { spanish: "MI MADRE USUALMENTE ME VISITA EN JUNIO Y EN NAVIDAD ", answer: ["my mother usually visits me in June and at Christmas"] },
    { spanish: "SU HIJA SIEMPRE COME DULCES EN LA NOCHE (DE ELLA) ", answer: ["her daughter always eats candy at night"] },
];

const ex6PromptsData = [
    { spanish: "¿QUE TAN ALTOS SON ELLOS?", answer: ["how tall are they?"] },
    { spanish: "¿QUE TAN BIEN JUEGAS TENIS?", answer: ["how well do you play tennis?"] },
    { spanish: "¿QUE TAN CALIENTE ES CALIFORNIA?", answer: ["how hot is california?"] },
    { spanish: "¿QUE TAN SEGUIDO JUEGAS BALONCESTO?", answer: ["how often do you play basketball?"] },
    { spanish: "¿QUE TAN GORDA ES TU AMIGA?", answer: ["how fat is your friend?"] },
    { spanish: "¿QUE TAN SEGUIDO ESTUDIAS INGLES? ", answer: ["how often do you study english?"] },
    { spanish: "¿QUE TAN CALIENTE ESTA EL CAFE? ", answer: ["how hot is the coffee?"] },
    { spanish: "¿QUE TAN NUBLADO ESTA EL DIA? ", answer: ["how cloudy is the day?"] },
    { spanish: "¿QUE TAN CALIDO ES EL CLIMA EN ESA CIUDAD? ", answer: ["how warm is the climate in that city?"] },
    { spanish: "¿QUE TAN FRIO ES MANIZALES? ", answer: ["how cold is manizales?"] },
];

const ex7CompletionData: CompletionPrompt[] = [
    { parts: ["HE LIVES ", " THE FIRST FLOOR OF THAT BUILDING"], answers: ["ON"] },
    { parts: ["MOUNT EVEREST IS THE HIGHEST MOUNTAIN ", " THE WORLD."], answers: ["IN"] },
    { parts: ["MY FATHER WAS WORKING ", " HOME."], answers: ["AT"] },
    { parts: ["PETER SENT ME SOME PILLS ", " THE DRUGSTORE."], answers: ["FROM"] },
    { parts: ["THEY BUILT A NEW FACTORY ", " ENGLAND"], answers: ["IN"] },
    { parts: ["WE STOP", "THE TRAFFIC LIGHT."], answers: ["AT"] },
    { parts: ["WE WANT TO LIVE AND WORK", "A FARM."], answers: ["ON"] },
    { parts: ["WHAT DID YOU LEARN", "UNIVERSITY TODAY?"], answers: ["AT"] },
];

const ex8PromptsData = [
    { spanish: "¿CUANTOS AÑOS TIENE TU PRIMO?", answer: ["how old is your cousin?"] },
    { spanish: "¿QUE TAN CANSADA ESTA VICTORIA?", answer: ["how tired is victoria?"] },
    { spanish: "¿QUE TAN LEJOS ESTÁ NUEVA ZELANDA?", answer: ["how far is new zealand?"] },
    { spanish: "¿QUE TAN PESADA (HEAVY) ESTA ESA MESA?", answer: ["how heavy is that table?"] },
    { spanish: "¿CUAN ALTO ES TU TIO?", answer: ["how tall is your uncle?"] },
    { spanish: "¿QUE TAN ABURRIDA ESTA JULIA EN SU TRABAJO? ", answer: ["how bored is julia in her job?"] },
    { spanish: "¿CUAN INTELIGENTE ES TU HIJO? ", answer: ["how intelligent is your son?"] },
    { spanish: "¿QUE TAN SEGUIDO LLAMAS A TU TIA? ", answer: ["how often do you call your aunt?"] },
    { spanish: "¿QUE TAN SEGUIDO TRABAJA ELLA? ", answer: ["how often does she work?"] },
    { spanish: "¿QUE TAN SEGUIDO TRABAJAN ELLOS?", answer: ["how often do they work?"] },
];

const ex9PromptsData = [
    { spanish: "¿QUE TAN FACIL ES EL FRANCES? – EL FRANCES ES MAS DIFICIL QUE EL INGLÉS", answer: ["how easy is french? - french is more difficult than english"] },
    { spanish: "¿QUE TAN ABURRIDO (BORED) ESTÁ TU AMIGO? - ÉL ESTÁ MUY ABURRIDO PORQUE ÉL NO TIENE EMPLEO", answer: ["how bored is your friend? - he is very bored because he does not have a job", "how bored is your friend? - he's very bored because he doesn't have a job"] },
    { spanish: "¿QUE TAN ALTA ES ESA MONTAÑA? – ESA MONTAÑA ES LA MAS ALTA DE ESE PAIS", answer: ["how high is that mountain? - that mountain is the highest in that country"] },
    { spanish: "¿QUE TAN CALIENTE ES CARTAGENA? – CARTAGENA ES MAS CALIENTE QUE BOGOTA", answer: ["how hot is cartagena? - cartagena is hotter than bogota"] },
    { spanish: "¿QUE TAN CARO ES ESE EDIFICIO (BUILDING)? – ESE EDIFICIO ES MUY CARO PORQUE ESTA EN DUBAI", answer: ["how expensive is that building? - that building is very expensive because it is in dubai" , "how expensive is that building? - that building is very expensive because it's in dubai"] },
    { spanish: "¿CUANTOS AÑOS TIENE TU HERMANO? EL TIENE 40 AÑOS", answer: ["how old is your brother? - he is 40 years old" , "how old is your brother? - he's 40 years old"] },
    { spanish: "¿QUE TAN LEJOS ESTÁ PORTUGAL? – PORTUGAL ESTÁ CERCA DE ESPAÑA", answer: ["how far is portugal? - portugal is close to spain"] },
    { spanish: "¿QUE TAN SEGUIDO (OFTEN) VAS ALLA? – YO VOY A ITALIA 2 VECES AL AÑO", answer: ["how often do you go there? - i go to italy 2 times a year" , "how often do you go there? - i go to italy twice a year"] },
    { spanish: "¿QUE TAN SEGUIDO COMES VERDURAS? YO COMO VERDURAS 3 VECES POR SEMANA ", answer: ["how often do you eat vegetables? - i eat vegetables 3 times a week" , "how often do you eat vegetables? - i eat vegetables three times a week"] },
    { spanish: "¿QUE TAN SEGUIDO ELLA COME CHOCOLATE?- ELLA NUNCA COME CHOCOLATE PORQUE ELLA ESTA ENFERMA ", answer: ["how often does she eat chocolate? - she never eats chocolate because she is sick"] },
];

const lastExPromptsData = [
    { spanish: "ÉL TIENE UNA REUNION A LAS 6:30 P.M", answer: ["he has a meeting at 6:30 p.m."] },
    { spanish: "ME ENCANTA LA NAVIDAD PORQUE YO PUEDO ESTAR CON MI FAMILIA", answer: ["i love christmas because i can be with my family"] },
    { spanish: "MUCHAS PERSONAS VAN A LA IGLESIA EN SEMANA SANTA, ELLOS REZAN DURANTE UNA SEMANA, VEN PELICULAS CRISTIANAS Y COMEN PESCADO", answer: ["many people go to church on holy week, they pray for a week, watch christian movies and eat fish"] },
    { spanish: "LA MAYORIA DE ESTUDIANTES TIENEN SUS VACACIONES EN SEMANA SANTA Y EN DICIEMBRE", answer: ["most students have their vacations in holy week and in december", "most students have their vacations on holy week and in december"] },
    { spanish: "NOSOTROS TENEMOS UNA CITA MEDICA A LA 1 P.M, PORQUE EN LA MAÑANA ESTAMOS TRABAJANDO DESDE LA CASA ", answer: ["we have a medical appointment at 1 p.m., because we are working from home in the morning" , "we have a medical appointment at 1 p.m., because we're working from home in the morning"] },
    { spanish: "YO DUERMO LOS DOMINGOS EN LA MAÑANA, TENGO MI DESAYUNO ALMUERZO AL MEDIO DIA Y VEO PELICULA DURANTE EL DIA ", answer: ["i sleep on sundays in the morning, i have my brunch at noon and i watch movies during the day"] },
    { spanish: "ELLOS JUEGAN FUTBOL CASI SIEMPRE LOS FINES DE SEMANA, PORQUE DURANTE LA SEMANA ELLOS TRABAJAN TODO EL DIA. ", answer: ["they play soccer almost always on weekends, because during the week they work all day."] },
    { spanish: "ÉL ESTUDIA ESPAÑOL LOS LUNES, MARTES Y JUEVES", answer: ["he studies spanish on mondays, tuesdays and thursdays"] },
    { spanish: "MI TIA SIEMPRE NOS VISITA EN  DICIEMBRE, A ELLA LE GUSTA COMPRAR LA CENA DE NAVIDAD Y COMPARTIR CON TODA LA FAMILIA EL 31 DE DICIEMBRE, USUALMENTE ELLA HACE SANCOCHO EL PRIMERO DE ENERO ", answer: ["my aunt always visits us in december, she likes to buy the christmas dinner and share with the whole family on december 31st, usually she makes sancocho on january 1st"] },
    { spanish: "EN EL PASADO LAS PERSONAS NO TENIAN CELULAR PORQUE ESTOS ERAN MUY CAROS, EN EL PRESENTE ES MUY RARO VER UNA PERSONA SIN CELULAR ", answer: ["in the past people did not have cellphones because they were very expensive, in the present it is very weird to see a person without a cellphone" , "in the past people didn't have cellphones because they were very expensive, in the present it's very weird to see a person without a cellphone"] },
    { spanish: "EL ESTA ESTUDIANDO MEDICINA PORQUE EL QUIERE SER EN EL FUTURO CIRUJANO ", answer: ["he is studying medicine because he wants to be a surgeon in the future" , "he's studying medicine because he wants to be a surgeon in the future"] },
    { spanish: "ELLA SIEMPRE PREPARA EL DESAYUNO LOS SABADOS Y DOMINGOS  EN LA MAÑANA, PORQUE ELLA NO DESAYUNA DE LUNES A VIERNES, ELLA SIEMPRE BEBE AGUA TODO EL DIA, PORQUE ELLA ESTA HACIENDO DIETA PERO TAMBIEN ELLA HACE EJERCICIO 3 VECES POR SEMANA, ELLA TIENE UN PROPOSITO EL CUAL ES BAJAR DE PESO ", answer: ["she always prepares breakfast on saturdays and sundays in the morning, because she doesn't have breakfast from monday to friday, she always drinks water all day, because she is on a diet but also she does exercise 3 times a week, she has a goal which is to lose weight" , "she always prepares breakfast on saturdays and sundays in the morning, because she doesn't have breakfast from monday to friday, she always drinks water all day, because she's on a diet but also she does exercise 3 times a week, she has a goal which is to lose weight"] },
    { spanish: "LOS GEMELOS DE MARY NACIERON EL 1 DE DICIEMBRE ", answer: ["mary's twins were born on december 1st"] },
    { spanish: "EL ASADO ES EL 24 DE OCTUBRE A LAS 8 P.M, NO OLVIDES TRAER LOS CHORIZOS Y UN SIX PACK DE CERVEZA ", answer: ["the barbecue is on october 24th at 8 p.m., don't forget to bring the sausages and a six-pack of beer"] },
    { spanish: "YO TRABAJO LOS FINES DE SEMANA ESPECIALMENTE EL SABADO EN LA MAÑANA, PERO NO TRABAJO LOS DOMINGOS ", answer: ["i work on weekends especially on saturdays in the morning, but i don't work on sundays"] },
    { spanish: "ME GUSTA EL INVIERNO, PORQUE YO PUEDO USAR CHAQUETA Y BEBER UN CHOCOLATE CALIENTE ", answer: ["i like winter because i can wear a jacket and drink hot chocolate"] },
    { spanish: "A ELLA LE GUSTA EL VERANO, PORQUE ELLA PUEDE USAR PANTALONES CORTOS E IR A LA PLAYA ", answer: ["she likes summer because she can wear short pants and go to the beach"] },
];

const writingPrompts = [
    "SUSAN = ¿QUE HACE ELLA?",
    "Respuesta (Translation)",
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

const BallsExercise = ({ title, prompts, onComplete, vocabulary, type = 'translate' }: any) => {
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
            case 'ex2': return <BallsExercise key="ex2" title="Exercise 2: How Adjective" prompts={ex2PromptsData} onComplete={() => handleTopicComplete('ex2')} vocabulary={{"piscina": "pool", "gemelos": "twins", "pesada": "heavy"}} />;
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
                                    content: `PREPOSICIONES DE TIEMPO: la relación que hay entre dos palabras. 

Se utilizan para indicar cuándo sucedió algo. 

Las tres preposiciones más comunes (AT, ON, IN), 

pueden ser utilizadas como preposiciones de tiempo Y preposiciones de lugar.`            
                                },
                                {
                                    title: "Ficha 2: ''AT''",
                                    content: `AT + HORA DEL DIA: meetings, classes, appointments (Ex: At 6:30). 

AT + FESTIVIDADES: At Christmas, At Easter, At Holidays. 

EXPRESIONES: At dawn, At noon, At night, At midnight, At the moment.`
                                },
                                {
                                    title: "Ficha 3: ''ON''",
                                    content: `ON + DAYS: On Monday, On Wednesday, On the weekend (American). 

ON + DAYS + PARTS: On Friday morning, On Sunday evening. 

ON + DATES: On Christmas Day, On New Year's Day, On Mother's Day, On vacation.`
                                },
                                {
                                    title: "Ficha 4: ''IN''",
                                    content: `IN + PARTS OF DAY: In the morning, In the afternoon. 

IN + MONTHS/YEARS: In January, In 1966, In the 1960s. 

IN + SEASONS: In summer, In winter. 

IN + LONG PERIODS: In the 19th century, In the past, In the future.`
                                }
                            ].map((ficha, idx) => (
                                <div key={idx} className="p-8 bg-card/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[2.5rem] border-2 border-primary/20 shadow-xl space-y-4 font-bold transition-all hover:scale-[1.02] hover:border-primary/40 group">
                                    <h3 className="text-2xl font-black text-primary uppercase tracking-tight group-hover:text-brand-purple transition-colors">{ficha.title}</h3>
                                    <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">{ficha.content}</p>
                                </div>
                            ))}
                        </div>
                        
                        <CardFooter className="justify-center pt-10"><Button onClick={() => handleTopicComplete('grammar_at_on_in')} size="lg" className="px-24 font-black h-16 text-2xl shadow-2xl uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">¡Entendido!</Button></CardFooter>
                    </div>
                );
            case 'ex3': return <SentenceCompletionExercise key="ex3" title="Exercise 3: Time Prepositions" description="Completa con AT, ON o IN." data={ex3CompletionData} onComplete={() => handleTopicComplete('ex3')} />;
            case 'ex4': return <BallsExercise key="ex4" title="Exercise 4: How tired?" prompts={ex4PromptsData} onComplete={() => handleTopicComplete('ex4')} vocabulary={{"cansado": "tired", "velocidad": "speed", "alto": "tall"}} />;
            case 'vocab_game': 
                return <VocabularyMatchingGame data={prepositionsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory: Prepositions of Place" />;
            case 'ex5': return <BallsExercise key="ex5" title="Exercise 5: Future & Routine" prompts={ex5PromptsData} onComplete={() => handleTopicComplete('ex5')} vocabulary={{"reunión": "meeting", "invierno": "winter", "pasado": "past"}} />;
            case 'ex6': return <BallsExercise key="ex6" title="Exercise 6: How well?" prompts={ex6PromptsData} onComplete={() => handleTopicComplete('ex6')} vocabulary={{"tenis": "tennis", "caliente": "hot", "gorda": "fat"}} />;
            case 'ex7': return <SentenceCompletionExercise key="ex7" title="Exercise 7: Place Prepositions" description="Completa con la preposición de lugar correcta." data={ex7CompletionData} onComplete={() => handleTopicComplete('ex7')} />;
            case 'ex8': return <BallsExercise key="ex8" title="Exercise 8: How far?" prompts={ex8PromptsData} onComplete={() => handleTopicComplete('ex8')} vocabulary={{"primo": "cousin", "lejos": "far", "mesa": "table"}} />;
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
            case 'ex9': return <BallsExercise key="ex9" title="Exercise 9: Comparisons" prompts={ex9PromptsData} onComplete={() => handleTopicComplete('ex9')} vocabulary={{"fácil": "easy", "aburrido": "bored/boring", "montaña": "mountain"}} />;
            case 'writing': 
                return <ManualGradingExercise key="writing" title="QUIERO SABER SOBRE SU VIDA (DE ELLA)" description="Susan y Noah hablan sobre la vida de ella. Traduce y completa." prompts={writingPrompts} onComplete={() => handleTopicComplete('writing')} studentDocRef={studentDocRef} isAdmin={isAdmin} storageKeyLines="writingLines" storageKeyGrades="writingGrades" initialLines={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingLines} initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingGrades} lineCount={13} />;
            case 'last_ex': return <BallsExercise key="last_ex" title="LAST EXERCISE: MIX" prompts={lastExPromptsData} onComplete={() => handleTopicComplete('last_ex')} vocabulary={{"reunión": "meeting", "semana santa": "holy week", "vacaciones": "vacations"}} />;
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
