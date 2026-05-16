
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
    Pencil,
    Clock,
    Check,
    Info,
    Globe,
    ArrowLeft,
    Trophy,
    Activity,
    Calendar,
    MousePointer2,
    BookText,
    Sparkles
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { ShortAnswerPresentSimpleExercise, type ShortAnswerPresentSimplePrompt } from '@/components/kids/exercises/short-answer-present-simple';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
};

const progressStorageVersion = 'progress_a1_eng_u3_c12_v22_last_ex_fixed';
const mainProgressKey = 'progress_a1_eng_unit_3_class_12';

const timeExpressionsData = [
    { spanish: 'ANOCHE', english: ['LAST NIGHT'] },
    { spanish: 'ESTA NOCHE', english: ['TONIGHT'] },
    { spanish: 'LA SEMANA PASADA', english: ['LAST WEEK'] },
    { spanish: 'EL AÑO PASADO', english: ['LAST YEAR'] },
    { spanish: 'EN LA MAÑANA', english: ['IN THE MORNING'] },
    { spanish: 'EN LA TARDE', english: ['IN THE AFTERNOON'] },
    { spanish: 'EN LA NOCHE', english: ['AT NIGHT'] },
    { spanish: 'RECIENTEMENTE', english: ['RECENTLY', 'LATELY'] },
    { spanish: 'ESTA SEMANA', english: ['THIS WEEK'] },
    { spanish: 'LA PROX. SEMANA', english: ['NEXT WEEK'] },
    { spanish: 'ESTA MAÑANA', english: ['THIS MORNING'] },
    { spanish: 'HACE UNA HORA', english: ['AN HOUR AGO'] },
    { spanish: 'HACE 5 MINUTOS', english: ['FIVE MINUTES AGO'] },
    { spanish: 'EN EL PASADO', english: ['IN THE PAST'] },
    { spanish: 'EN EL FUTURO', english: ['IN THE FUTURE'] },
    { spanish: 'AHORA- YA', english: ['NOW'] },
];

const class12Exercise3Data: ShortAnswerPresentSimplePrompt[] = [
    { question: "ARE YOU CALLING YOUR MOTHER?", answers: { shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] } },
    { question: "ARE YOU TIRED?", answers: { shortAffirmative: ["yes, i am"], shortNegative: ["no, i am not", "no, i'm not"] } },
    { question: "IS SHE SLEEPING?", answers: { shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] } },
    { question: "IS SHE JULIA?", answers: { shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] } },
    { question: "ARE THEY ARRIVING ON SUNDAY?", answers: { shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] } },
    { question: "ARE THEY STUDENTS?", answers: { shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] } },
    { question: "IS HE DRINKING RED WINE?", answers: { shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] } },
    { question: "ARE THEY FOOTBALL PLAYERS?", answers: { shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] } },
    { question: "ARE THEY EATING HAMBURGERS?", answers: { shortAffirmative: ["yes, they are"], shortNegative: ["no, they are not", "no, they aren't"] } },
    { question: "IS HE DRIVING A TRUCK?", answers: { shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] } },
    { question: "IS MARIO SINGING IN THE BATHROOM?", answers: { shortAffirmative: ["yes, he is"], shortNegative: ["no, he is not", "no, he isn't"] } },
    { question: "IS SHE LOOKING FOR A JOB?", answers: { shortAffirmative: ["yes, she is"], shortNegative: ["no, she is not", "no, she isn't"] } },
];

const class12Exercise4Data = [
    { 
        spanish: "ELLA ESCRIBE - ELLA ESTA ESCRIBIENDO", 
        answers: { 
            ans1: ["she writes"], 
            ans2: ["she is writing", "she's writing"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "ELLA NO TRABAJA - ELLA NO ESTA TRABAJANDO", 
        answers: { 
            ans1: ["she does not work", "she doesn't work"], 
            ans2: ["she is not working", "she isn't working"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿EL CANTA? - ¿EL ESTA CANTANDO?", 
        answers: { 
            ans1: ["does he sing?"], 
            ans2: ["is he singing?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿TÚ ESTUDIAS? - ¿ESTÁS ESTUDIANDO?", 
        answers: { 
            ans1: ["do you study?"], 
            ans2: ["are you studying?", "are you studying?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿ELLA HABLA ALEMAN? – ¿ELLA ESTA HABLANDO INGLÉS?", 
        answers: { 
            ans1: ["does she speak german?"], 
            ans2: ["is she speaking english?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿ELLOS ESTAN CORRIENDO? –¿ELLOS CORREN EN LA CASA?", 
        answers: { 
            ans1: ["do they run in the house?"], 
            ans2: ["are they running?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿QUE HACES? – ¿QUE ESTAS HACIENDO?", 
        answers: { 
            ans1: ["what do you do?"], 
            ans2: ["what are you doing?", "what're you doing?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿A DONDE ESTAS YENDO? - ¿A DONDE VAS?", 
        answers: { 
            ans1: ["where do you go?"], 
            ans2: ["where are you going?", "where're you going?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿DONDE TRABAJAS? –¿DONDE ESTAS TRABAJANDO?", 
        answers: { 
            ans1: ["where do you work?"], 
            ans2: ["where are you working?", "where're you working?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿ELLA ESTA DURMIENDO? - ¿ELLA DUERME EN LA TARDE?", 
        answers: { 
            ans1: ["does she sleep in the afternoon?"], 
            ans2: ["is she sleeping?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿ELLOS ESCRIBEN LIBROS? - ¿ELLOS ESTAN ESCRIBIENDO LIBROS ?:", 
        answers: { 
            ans1: ["do they write books?"], 
            ans2: ["are they writing books?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿TRABAJAS? - ¿ESTÁS TRABAJANDO?", 
        answers: { 
            ans1: ["do you work?"], 
            ans2: ["are you working?", "are you working?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
];

const class12Exercise9Data = [
    { 
        spanish: "¿QUE ESTUDIAS? - ¿QUE ESTAS ESTUDIANDO?", 
        answers: { 
            ans1: ["what do you study?"], 
            ans2: ["what are you studying?", "what're you studying?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿QUE ESTA HACIENDO ELLA? - ¿QUE HACEN ELLOS?", 
        answers: { 
            ans1: ["what do they do?"], 
            ans2: ["what is she doing?", "what's she doing?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿QUE BEBEN ELLOS? – ¿QUE ESTÁN BEBIENDO ELLOS?", 
        answers: { 
            ans1: ["what do they drink?"], 
            ans2: ["what are they drinking?", "what're they drinking?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿ELLOS JUEGAN EN EL PARQUE? - ¿ELLOS ESTÁN JUGANDO EN LA UNIVERSIDAD?", 
        answers: { 
            ans1: ["do they play in the park?"], 
            ans2: ["are they playing in the university?", "are they playing at the university?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿ELLA ESTA VIVIENDO EN BARCELONA? - ¿ELLA VIVE EN MEDELLIN?", 
        answers: { 
            ans1: ["does she live in medellin?"], 
            ans2: ["is she living in barcelona?", "she is living in barcelona?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿CUÁNDO LLEGA EL? - ¿CUANDO ESTÁ LLEGANDO ELLA?", 
        answers: { 
            ans1: ["when does he arrive?"], 
            ans2: ["when is she arriving?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿DONDE ESTAS VIVIENDO? - ¿DONDE VIVES?", 
        answers: { 
            ans1: ["where do you live?"], 
            ans2: ["where are you living?", "where're you living?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿ESTAS LAVANDO TU CARRO? - ¿LAVAS SU CARRO LOS DOMINGOS? (DE ÉL)", 
        answers: { 
            ans1: ["do you wash his car on sundays?"], 
            ans2: ["are you washing your car?", "are you washing your car?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿QUE ESTA ESTUDIANDO ELLA? - ¿QUE ESTUDIAS?", 
        answers: { 
            ans1: ["what do you study?"], 
            ans2: ["what is she studying?", "what's she studying?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
    { 
        spanish: "¿ESTÁS JUGANDO CON ELLOS? - ¿JUEGAS CON NOSOTROS?", 
        answers: { 
            ans1: ["do you play with us?"], 
            ans2: ["are you playing with them?", "are you playing with them?"] 
        },
        labels: { ans1: "Present Simple", ans2: "Present Continuous" }
    },
];

const ex9Vocab = {
    "lavando": "washing",
    "llegando": "arriving",
    "viviendo": "living",
    "estudiando": "studying",
    "bebiendo": "drinking",
    "jugando": "playing",
    "con nosotros": "with us",
    "con ellos": "with them"
};

const class12Exercise7Data = [
    { parts: ["EVERY MONDAY SALLY ", " HER KIDS TO FOOTBALL PRACTICE."], options: ["DRIVES", "IS DRIVING"], correct: "DRIVES" },
    { parts: ["", " NOW?"], options: ["DO YOU EAT", "ARE YOU EATING"], correct: "ARE YOU EATING" },
    { parts: ["I ", " THE KITCHEN EVERY DAY."], options: ["CLEAN", "AM CLEANING"], correct: "CLEAN" },
    { parts: ["THE MOVIE ", " AT 3 PM."], options: ["STARTS", "IS STARTING"], correct: "STARTS" },
    { parts: ["BOB ", " IN A RESTAURANT (EN GENERAL)"], options: ["WORKS", "IS WORKING"], correct: "WORKS" },
    { parts: ["SHHHHHHHHHHH! BE QUIET! JOHN ", ""], options: ["SLEEPS", "IS SLEEPING"], correct: "IS SLEEPING" },
    { parts: ["YOU ", " CHOCOLATE"], options: ["DON’T LIKE", "ARE NOT LIKING"], correct: "DON’T LIKE" },
    { parts: ["THE CHILDREN ", " OUT SIDE AT THE MOMENT."], options: ["PLAY", "ARE PLAYING"], correct: "ARE PLAYING" },
    { parts: ["SAM ", " A CAT"], options: ["HAS", "IS HAVING"], correct: "HAS" },
    { parts: ["THEY ", " NOW."], options: ["STUDY", "ARE STUDYING"], correct: "ARE STUDYING" },
    { parts: ["SMELLS GOOD! WHAT ", "?"], options: ["DO YOU MAKE", "ARE YOU MAKING"], correct: "ARE YOU MAKING" },
    { parts: ["THEY ", " RICE EVERY DAY."], options: ["DON’T EAT", "AREN’T EATING"], correct: "DON’T EAT" },
    { parts: ["SHE ", " AT THE MOMENT."], options: ["DOESN’T STUDY", "ISN’T STUDYING"], correct: "ISN’T STUDYING" },
    { parts: ["JANE ", " PIZZA."], options: ["LOVES", "IS LOVING"], correct: "LOVES" },
];

const lastExerciseData = [
    { sentence: "TOM ________ FOOTBALL IN A SCHOOL TEAM.", options: ["PLAYS", "IS PLAYING"], correct: "PLAYS" },
    { sentence: "I’M BUSY NOW. I ________ SOME SHOPPING.", options: ["GO", "AM GOING"], correct: "AM GOING" },
    { sentence: "WHAT TIME ________ YOUR FAVORITE TV PROGRAM TONIGHT?", options: ["IS", "IS BEING"], correct: "IS" },
    { sentence: "________ NEWSPAPERS?", options: ["ARE YOU USUALLY READING", "DO YOU USUALLY READ"], correct: "DO YOU USUALLY READ" },
    { sentence: "YOU ________ SO NICE.", options: ["LOOK", "ARE LOOKING"], correct: "LOOK" },
    { sentence: "MARTIN ________ NY MONTHLY FOR WORK.", options: ["VISITS", "IS VISITING"], correct: "VISITS" },
    { sentence: "I ________ WAITING FOR HIM.", options: ["SIT", "AM SITTING"], correct: "AM SITTING" },
    { sentence: "THE WEATHER ________ BETTER FOR THE WEEKEND.", options: ["DOESN’T GET", "ISN’T GETTING"], correct: "ISN’T GETTING" },
    { sentence: "HURRY UP! EVERY BODY ________ FOR YOU!", options: ["IS WAITING", "WAIT"], correct: "IS WAITING" },
    { sentence: "I ________ TO THE CINEMA UNLESS I FINISH MY HOMEWORK.", options: ["DON’T GO", "AM NOT GOING"], correct: "DON’T GO" },
    { sentence: "I USUALLY ________ TO ROCK MUSIC.", options: ["LISTEN", "AM LISTENING"], correct: "LISTEN" },
    { sentence: "WHAT IS SHE DOING? SHE ________ TO MUSIC.", options: ["LISTENS", "IS LISTENING"], correct: "IS LISTENING" },
    { sentence: "MY PROFESSOR ALWAYS ________ SLOWLY.", options: ["IS SPEAKING", "SPEAKS"], correct: "SPEAKS" },
    { sentence: "WHAT ARE YOU DOING TONIGHT? WE ________ TO WATCH A MOVIE.", options: ["ARE GOING", "GO"], correct: "ARE GOING" },
    { sentence: "HE NORMALLY ________ FAST.", options: ["DRIVES", "IS DRIVING"], correct: "DRIVES" },
    { sentence: "I’M SORRY, ANGELA CAN’T COME TO THE PHONE- SHE ________ A SHOWER.", options: ["TAKES", "IS TAKING"], correct: "IS TAKING" },
    { sentence: "I ________ HOME RIGHT NOW.", options: ["GO", "AM GOING"], correct: "AM GOING" },
    { sentence: "THOSE GIRLS ________ OUT EVERY FRIDAY.", options: ["GO", "ARE GOING"], correct: "GO" },
    { sentence: "GENERALLY, I ________ CLASSICAL MUSIC.", options: ["AM LIKING", "LIKE"], correct: "LIKE" },
    { sentence: "MARTHA ________ IN AFRICA.", options: ["DOESN’T LIVE", "ISN’T LIVING"], correct: "DOESN’T LIVE" },
    { sentence: "DAD USUALLY ________ FOR DINNER.", options: ["IS COOKING", "COOKS"], correct: "COOKS" },
    { sentence: "MARIA ________ FOR A TV STATION.", options: ["WORKS", "IS WORKING"], correct: "WORKS" },
    { sentence: "AT THE MOMENT SHE ________ IN THE SAHARA DESERT.", options: ["TRAVELS", "IS TRAVELLING"], correct: "IS TRAVELLING" },
    { sentence: "MY SISTER ________ TO SCHOOL EVERY DAY.", options: ["WALKS", "IS WALKING"], correct: "WALKS" },
    { sentence: "DAN ________ WILD ANIMALS.", options: ["IS LOVING", "LOVES"], correct: "LOVES" },
    { sentence: "WE ________ LUNCH NOW.", options: ["HAVE", "ARE HAVING"], correct: "ARE HAVING" },
];

const ChoiceExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [validation, setValidation] = useState<'correct' | 'incorrect' | 'unchecked'>('unchecked');
    const [showCompletion, setShowCompletion] = useState(false);

    const currentPrompt = class12Exercise7Data[currentIndex];

    const handleSelect = (option: string) => {
        if (validation === 'correct') return;
        setSelectedOption(option);
        setValidation('unchecked');
    };

    const handleCheck = () => {
        if (!selectedOption) return;
        const isCorrect = selectedOption === currentPrompt.correct;
        setValidation(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            toast({ title: "¡Correcto!", description: "Muy bien." });
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Inténtalo de nuevo." });
        }
    };

    const handleNext = () => {
        if (currentIndex < class12Exercise7Data.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setValidation('unchecked');
        } else {
            setShowCompletion(true);
            onComplete();
        }
    };

    if (showCompletion) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <p className="text-muted-foreground mt-2">Has dominado la diferencia de usos entre los presentes.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Exercise 6: Choice</CardTitle>
                <CardDescription>Elige la opción más adecuada (Present Simple vs Present Continuous).</CardDescription>
                <div className="pt-2 text-sm font-medium text-muted-foreground">
                    Pregunta {currentIndex + 1} de {class12Exercise7Data.length}
                </div>
                <Progress value={((currentIndex + 1) / class12Exercise7Data.length) * 100} className="mt-2 h-1" />
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                <div className="p-6 bg-muted rounded-xl border-2 border-dashed flex flex-wrap items-center justify-center gap-x-2 gap-y-4 text-2xl font-bold text-center">
                    {currentPrompt.parts[0]}
                    <div className="flex gap-2">
                        {currentPrompt.options.map(opt => (
                            <Button
                                key={opt}
                                variant={selectedOption === opt ? "default" : "outline"}
                                onClick={() => handleSelect(opt)}
                                className={cn(
                                    "text-lg h-auto py-1 px-4 border-2 font-black",
                                    selectedOption === opt && validation === 'correct' && "bg-green-600 border-green-600 hover:bg-green-600",
                                    selectedOption === opt && validation === 'incorrect' && "bg-destructive border-destructive hover:bg-destructive"
                                )}
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>
                    {currentPrompt.parts[1]}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} disabled={!selectedOption || validation === 'correct'}>Verificar</Button>
                    <Button onClick={handleNext} disabled={validation !== 'correct'}>
                        {currentIndex === class12Exercise7Data.length - 1 ? 'Finalizar' : 'Siguiente'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const LastExerciseComp = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selections, setSelections] = useState<string[]>(Array(lastExerciseData.length).fill(''));
    const [validation, setValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(lastExerciseData.length).fill('unchecked'));
    const [showResults, setShowResults] = useState(false);
    const [completed, setCompleted] = useState(false);

    const isAllSelected = selections.every(s => s !== '');

    const handleSelect = (option: string) => {
        if (completed) return;
        const newS = [...selections];
        newS[currentIndex] = option;
        setSelections(newS);
        
        // Auto-advance if not at the end
        if (currentIndex < lastExerciseData.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        }
    };

    const handleCheck = () => {
        const newV = lastExerciseData.map((item, idx) => 
            item.correct === selections[idx] ? 'correct' : 'incorrect'
        );
        setValidation(newV as any);
        setShowResults(true);

        const allCorrect = newV.every(v => v === 'correct');
        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Has completado la lección con éxito." });
            setCompleted(true);
            onComplete();
        } else {
            toast({ 
                variant: 'destructive', 
                title: "Algunas respuestas son incorrectas", 
                description: "Revisa las bolitas rojas y corrige tus selecciones." 
            });
        }
    };

    const currentPrompt = lastExerciseData[currentIndex];

    if (completed) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[400px] flex flex-col justify-center items-center text-center">
                <CardContent className="p-12 space-y-4">
                    <Trophy className="h-20 w-20 text-yellow-400 mx-auto animate-bounce" />
                    <h2 className="text-3xl font-black bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text uppercase tracking-tighter">¡Clase 12 Completada!</h2>
                    <p className="text-muted-foreground text-lg">Has dominado perfectamente el contraste entre Presente Simple y Continuo.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Last Exercise: Final Challenge</CardTitle>
                <CardDescription>Elige la opción más adecuada para cada frase. Al final, presiona verificar.</CardDescription>
                <div className="flex flex-wrap gap-2 pt-4">
                    {lastExerciseData.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                                currentIndex === idx ? "ring-2 ring-primary ring-offset-1" : "",
                                showResults 
                                    ? (validation[idx] === 'correct' ? "bg-green-500 border-green-500 text-white" : "bg-red-500 border-red-500 text-white")
                                    : (selections[idx] !== '' ? "bg-primary/20 border-primary text-primary" : "bg-muted border-border")
                            )}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6 min-h-[250px] flex flex-col justify-center">
                <div className="text-center space-y-6">
                    <div className="p-8 bg-muted rounded-2xl border-2 border-dashed text-2xl font-bold leading-relaxed">
                        {currentPrompt.sentence.split('________').map((part, i, arr) => (
                            <React.Fragment key={i}>
                                {part}
                                {i < arr.length - 1 && (
                                    <span className="text-primary underline px-2">
                                        {selections[currentIndex] || "________"}
                                    </span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    
                    <div className="flex justify-center gap-4">
                        {currentPrompt.options.map(opt => (
                            <Button
                                key={opt}
                                variant={selections[currentIndex] === opt ? "default" : "outline"}
                                size="lg"
                                onClick={() => handleSelect(opt)}
                                className={cn(
                                    "text-xl h-16 px-8 border-2 font-black tracking-tight",
                                    selections[currentIndex] === opt && "scale-105 shadow-lg shadow-primary/20"
                                )}
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck} disabled={!isAllSelected} className={cn(isAllSelected && "animate-pulse-glow")}>
                        Verificar Todo
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentIndex(p => Math.min(lastExerciseData.length - 1, p + 1))} disabled={currentIndex === lastExerciseData.length - 1}>
                        Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const DualTranslationExercise = ({ 
    onComplete, 
    data, 
    title,
    vocabulary 
}: { 
    onComplete: () => void, 
    data: any[], 
    title: string,
    vocabulary?: Record<string, string>
}) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({ ans1: '', ans2: '' });
    const [validation, setValidation] = useState({ ans1: 'unchecked', ans2: 'unchecked' });
    const [showCompletion, setShowCompletion] = useState(false);

    const currentPrompt = data[currentIndex];

    useEffect(() => {
        setAnswers({ ans1: '', ans2: '' });
        setValidation({ ans1: 'unchecked', ans2: 'unchecked' });
    }, [currentIndex, data]);

    const handleCheck = () => {
        const check1 = currentPrompt.answers.ans1.map((a: string) => a.toLowerCase().replace(/[.?,]/g, ''))
            .includes(answers.ans1.trim().toLowerCase().replace(/[.?,]/g, ''));
        
        const check2 = currentPrompt.answers.ans2.map((a: string) => a.toLowerCase().replace(/[.?,]/g, ''))
            .includes(answers.ans2.trim().toLowerCase().replace(/[.?,]/g, ''));

        setValidation({
            ans1: check1 ? 'correct' : 'incorrect',
            ans2: check2 ? 'correct' : 'incorrect'
        });

        if (check1 && check2) {
            toast({ title: "¡Excelente!", description: "Ambas traducciones son correctas." });
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Una o ambas traducciones no coinciden." });
        }
    };

    const handleNext = () => {
        if (currentIndex < data.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowCompletion(true);
            onComplete();
        }
    };

    if (showCompletion) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <p className="text-muted-foreground mt-2">Has dominado el contraste entre tiempos verbales.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>Traduce cada parte de la frase según el tiempo verbal indicado.</CardDescription>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                    <BookText className="mr-2 h-4 w-4" />
                                    Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="space-y-2">
                                    <h4 className="font-bold border-b pb-1">Vocabulario útil</h4>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        {Object.entries(vocabulary).map(([es, en]) => (
                                            <React.Fragment key={es}>
                                                <span className="text-muted-foreground capitalize">{es}:</span>
                                                <span className="font-semibold text-right">{en}</span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 pt-4">
                    {data.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all",
                                currentIndex === idx ? "bg-primary border-primary text-white" : "bg-muted border-border"
                            )}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-xl border-2 border-dashed">
                    <p className="text-center text-xl font-bold">"{currentPrompt.spanish}"</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-primary">{currentPrompt.labels?.ans1 || 'Translation 1'}</Label>
                        <Input 
                            value={answers.ans1} 
                            onChange={e => { setAnswers(prev => ({ ...prev, ans1: e.target.value })); setValidation(v => ({ ...v, ans1: 'unchecked' })); }}
                            className={cn(validation.ans1 === 'correct' ? 'border-green-500 bg-green-50' : validation.ans1 === 'incorrect' ? 'border-destructive bg-destructive/5' : '')}
                            placeholder="Escribe aquí..."
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold text-primary">{currentPrompt.labels?.ans2 || 'Translation 2'}</Label>
                        <Input 
                            value={answers.ans2} 
                            onChange={e => { setAnswers(prev => ({ ...prev, ans2: e.target.value })); setValidation(v => ({ ...v, ans2: 'unchecked' })); }}
                            className={cn(validation.ans2 === 'correct' ? 'border-green-500 bg-green-50' : validation.ans2 === 'incorrect' ? 'border-destructive bg-destructive/5' : '')}
                            placeholder="Escribe aquí..."
                            autoComplete="off"
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck}>Verificar</Button>
                    <Button onClick={handleNext} disabled={validation.ans1 !== 'correct' || validation.ans2 !== 'correct'}>
                        {currentIndex === data.length - 1 ? 'Finalizar' : 'Siguiente'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default function EngA1Class12Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);
    
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Vocab State
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(timeExpressionsData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(timeExpressionsData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Time Expressions)', icon: Clock, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'create1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'grammar3', name: 'Grammar 3', icon: BookText, status: 'locked' },
        { key: 'ex6', name: 'Exercise 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Exercise 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: 'Exercise 8', icon: PenSquare, status: 'locked' },
        { key: 'last_ex', name: 'Last Exercise', icon: Sparkles, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !initialLearningPath.length) return;

        const path = initialLearningPath.map(topic => ({ ...topic }));
        let savedSelectedTopic = '';

        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }
        
        setLearningPath(path);
        if (!initialLoadComplete) {
            const firstActive = path.find(p => p.status === 'active');
            setSelectedTopic(savedSelectedTopic || firstActive?.key || 'vocabulary');
            setInitialLoadComplete(true);
        }
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isUserLoading || isProfileLoading || learningPath.length === 0 || isAdmin || !studentDocRef) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: Math.round(progressValue)
        });
        
        if (progressValue >= 100) {
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isUserLoading, isProfileLoading, initialLoadComplete]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            const newPath = currentPath.map(item => ({ ...item }));
            const currentIndex = newPath.findIndex(item => item.key === topicToComplete);
            
            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';
                const nextIndex = currentIndex + 1;
                if (nextIndex < newPath.length && newPath[nextIndex].status === 'locked') {
                    newPath[nextIndex].status = 'active';
                    setSelectedTopic(newPath[nextIndex].key);
                    toast({ title: "¡Siguiente tema desbloqueado!" });
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Debes completar los temas anteriores." });
            return;
        }
        setSelectedTopic(topicKey);

        const autoViewTopics = ['grammar', 'grammar2', 'grammar3'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const newAnswers = [...vocabAnswers];
        newAnswers[index] = value;
        setVocabAnswers(newAnswers);
        const newVal = [...vocabValidation];
        newVal[index] = 'unchecked';
        setVocabValidation(newVal as any);
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newVal = timeExpressionsData.map((item, index) => {
            const userAnswer = vocabAnswers[index]?.trim().toUpperCase();
            const isCorrect = item.english.some(ans => ans.toUpperCase() === userAnswer);
            if (isCorrect) atLeastOneCorrect = true;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(newVal as any);
        if (atLeastOneCorrect) {
            toast({ title: "¡Buen trabajo!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: "Necesitas al menos una correcta para avanzar." });
        }
    };

    const getVocabInputClass = (index: number) => {
        const status = vocabValidation[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Time Expressions)</CardTitle>
                            <CardDescription>Traduce las expresiones de tiempo al inglés. Al menos una correcta para avanzar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">Spanish</div>
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">English</div>
                                {timeExpressionsData.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className="flex items-center text-base font-medium py-1 text-left">
                                            {item.spanish}
                                        </div>
                                        <div className="flex items-center">
                                            <Input 
                                                value={vocabAnswers[idx] || ''}
                                                onChange={(e) => handleVocabInputChange(idx, e.target.value)}
                                                className={cn("h-10 uppercase font-mono text-sm", getVocabInputClass(idx))}
                                                placeholder="..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button 
                                onClick={() => handleTopicComplete('vocabulary')} 
                                disabled={!canAdvanceVocab && !isAdmin}
                                className={cn(canAdvanceVocab && "bg-green-600 hover:bg-green-700 shadow-lg")}
                            >
                                Avanzar <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader className="bg-primary/10 border-b">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl">PRESENT CONTINUOUS</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="bg-muted/50 p-6 rounded-2xl border-2 border-dashed">
                                <h3 className="text-xl font-bold text-primary mb-3">¿Qué es?</h3>
                                <p className="text-lg leading-relaxed">
                                    Se utiliza para describir acciones que están ocurriendo <strong>en este preciso momento</strong>. El verbo principal termina en <strong>-ING</strong>, que equivale a las terminaciones <strong>"-ando"</strong> o <strong>"-endo"</strong> en español.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    FORMAS Y ESTRUCTURA:
                                </h3>
                                
                                <div className="grid gap-4">
                                    <div className="p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">+</div>
                                            <h4 className="font-bold text-lg">AFIRMATIVA</h4>
                                        </div>
                                        <p className="font-mono text-base bg-muted p-2 rounded">
                                            Pronoun + <span className="text-primary font-bold">To Be</span> + Verb <span className="underline text-brand-purple font-bold">ING</span> + Complement
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2 italic">Example: I am working now. (Yo estoy trabajando ahora).</p>
                                    </div>

                                    <div className="p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">-</div>
                                            <h4 className="font-bold text-lg">NEGATIVA</h4>
                                        </div>
                                        <p className="font-mono text-base bg-muted p-2 rounded">
                                            Pronoun + <span className="text-primary font-bold">To Be</span> + <span className="text-red-500 font-bold">NOT</span> + Verb <span className="underline text-brand-purple font-bold">ING</span> + Complement
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2 italic">Example: She is not sleeping. (Ella no está durmiendo).</p>
                                    </div>

                                    <div className="p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">?</div>
                                            <h4 className="font-bold text-lg">INTERROGATIVA</h4>
                                        </div>
                                        <p className="font-mono text-base bg-muted p-2 rounded">
                                            <span className="text-primary font-bold">To Be</span> + Pronoun + Verb <span className="underline text-brand-purple font-bold">ING</span> + Complement?
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2 italic">Example: Are they playing soccer? (¿Están ellos jugando futbol?).</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    SHORT ANSWERS (Respuestas Cortas):
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4 font-mono">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-xl">
                                        <p className="font-bold text-green-700 dark:text-green-400 mb-1">(+A) POSITIVA</p>
                                        <p className="text-lg">Yes, Pronoun + To be</p>
                                        <p className="text-xs text-muted-foreground mt-1">Ex: Yes, I am. / Yes, he is.</p>
                                    </div>
                                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-xl">
                                        <p className="font-bold text-red-700 dark:text-red-400 mb-1">(-A) NEGATIVA</p>
                                        <p className="text-lg">No, Pronoun + To be + Not</p>
                                        <p className="text-xs text-muted-foreground mt-1">Ex: No, I am not. / No, they aren't.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-12 font-bold">
                                Entendido <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1':
                const vocabEx1 = {
                    "programación": "programming",
                    "escuchando": "listening",
                    "abuela": "grandmother / grandma",
                    "llegando": "arriving"
                };
                return <SimpleTranslationExercise exerciseKey="c12_ex1" course="a1" onComplete={() => handleTopicComplete('ex1')} title="Exercise 1" vocabulary={vocabEx1} />;
            case 'grammar2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader className="bg-primary/10 border-b">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl uppercase tracking-tighter">Reglas de Ortografía para la forma "-ING"</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Accordion type="multiple" defaultValue={['rule-1', 'rule-2']} className="w-full space-y-4">
                                <AccordionItem value="rule-1" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">1. Verbos terminados en "E"</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <p className="text-muted-foreground">Normalmente la <strong>"e"</strong> se quita delante de la terminación <strong>-ing</strong>.</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-muted rounded-lg font-mono">
                                                <p>To take {"=>"} <span className="text-primary font-bold">Taking</span></p>
                                                <p>To make {"=>"} <span className="text-primary font-bold">Making</span></p>
                                            </div>
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg">
                                                <h5 className="font-bold text-yellow-700 dark:text-yellow-400 text-xs uppercase mb-1">Exception:</h5>
                                                <p className="font-mono text-sm">To see {"=>"} <span className="font-bold">Seeing</span></p>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-2" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">2. Verbos Monosilábicos (CVC)</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <p className="text-muted-foreground">Cuando el verbo es corto y termina en una <strong>sola vocal</strong> seguida por una <strong>consonante</strong>, la consonante final se duplica.</p>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-muted rounded-lg font-mono space-y-1">
                                                <p>To stop {"=>"} <span className="text-primary font-bold">Stopping</span></p>
                                                <p>To sit {"=>"} <span className="text-primary font-bold">Sitting</span></p>
                                                <p>To win {"=>"} <span className="text-primary font-bold">Winning</span></p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                                                    <h5 className="font-bold text-red-700 dark:text-red-400 text-xs uppercase mb-1">Exception (X, W, Z):</h5>
                                                    <p className="font-mono text-sm">To fix {"=>"} <span className="font-bold">Fixing</span></p>
                                                    <p className="font-mono text-sm">To draw {"=>"} <span className="font-bold">Drawing</span></p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                                            <h5 className="font-bold text-blue-700 dark:text-blue-400 text-xs uppercase mb-1">Nota:</h5>
                                            <p className="text-sm">Si hay <strong>más de una vocal</strong>, NO duplicamos la consonante.</p>
                                            <p className="font-mono text-sm mt-1">To read {"=>"} Reading // To open {"=>"} Opening</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-3" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">3. Verbos Bisilábicos</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                                                <h5 className="font-bold text-sm mb-1">Acento en la 2ª sílaba:</h5>
                                                <p className="text-xs text-muted-foreground mb-2">La consonante final se dobla.</p>
                                                <div className="font-mono text-sm">
                                                    <p>To begin {"=>"} <span className="font-bold">Beginning</span></p>
                                                    <p>To prefer {"=>"} <span className="font-bold">Preferring</span></p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-muted rounded-lg border-l-4 border-muted-foreground">
                                                <h5 className="font-bold text-sm mb-1">Acento en la 1ª sílaba:</h5>
                                                <p className="text-xs text-muted-foreground mb-2">No existen modificaciones.</p>
                                                <div className="font-mono text-sm">
                                                    <p>To visit {"=>"} <span className="font-bold">Visiting</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-4" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">4. Verbos terminados en "Y"</AccordionTrigger>
                                    <AccordionContent className="space-y-2 pt-2">
                                        <p className="text-muted-foreground">No existen modificaciones cuando el verbo acaba en vocal o consonante + <strong>Y</strong>.</p>
                                        <div className="p-3 bg-muted rounded-lg font-mono">
                                            <p>To play {"=>"} <span className="text-primary font-bold">Playing</span></p>
                                            <p>To study {"=>"} <span className="text-primary font-bold">Studying</span></p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-5" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">5. Verbos terminados en "-IE"</AccordionTrigger>
                                    <AccordionContent className="space-y-2 pt-2">
                                        <p className="text-muted-foreground">Cambiamos este grupo de vocales por una <strong>"Y"</strong> delante de la terminación <strong>-ing</strong>.</p>
                                        <div className="p-3 bg-muted rounded-lg font-mono text-center text-xl">
                                            <p>To die {"=>"} <span className="text-primary font-bold italic">Dying</span></p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="rule-6" className="border-2 rounded-xl px-4">
                                    <AccordionTrigger className="text-lg font-bold">6. Inglés Británico vs Americano</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <p className="text-muted-foreground italic text-sm">Ejemplo con el verbo "Travel":</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-muted rounded-xl text-center border">
                                                <h5 className="font-bold text-primary flex items-center justify-center gap-2">
                                                    <Globe className="h-4 w-4" /> UK
                                                </h5>
                                                <p className="font-mono text-lg font-black">Travelling</p>
                                                <p className="text-[10px] text-muted-foreground">(Dobla la "L")</p>
                                            </div>
                                            <div className="p-4 bg-muted rounded-xl text-center border">
                                                <h5 className="font-bold text-primary flex items-center justify-center gap-2">
                                                    <Globe className="h-4 w-4" /> USA
                                                </h5>
                                                <p className="font-mono text-lg font-black">Traveling</p>
                                                <p className="text-[10px] text-muted-foreground">(Una sola "L")</p>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t">
                            <Button onClick={() => handleTopicComplete('grammar2')} size="lg" className="px-12">He terminado de estudiar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex2':
                const vocabEx2 = {
                    "mejor": "better",
                    "cirugía": "surgery",
                    "enseñando": "teaching",
                    "comenzando": "beginning",
                    "camión": "truck",
                    "ganando": "winning"
                };
                return <SimpleTranslationExercise exerciseKey="c12_ex2" course="a1" onComplete={() => handleTopicComplete('ex2')} title="Exercise 2" vocabulary={vocabEx2} />;
            case 'create1':
                return (
                    <CreativeWritingExercise
                        title="Create 1"
                        description="ESCRIBE 2 FRASES AFIRMATIVAS, 2 NEGATIVAS, 2 INTERROGATIVAS CON EL PRESENTE CONTINUO."
                        prompts={[
                            { id: 'af1', question: '1. AF.' },
                            { id: 'af2', question: '2. AF.' },
                            { id: 'neg1', question: '1. NEG.' },
                            { id: 'neg2', question: '2. NEG.' },
                            { id: 'int1', question: '1. INT.' },
                            { id: 'int2', question: '2. INT.' },
                        ]}
                        onComplete={() => handleTopicComplete('create1')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.create1Data || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.create1Data`}
                        isSingleLine={true}
                    />
                );
            case 'ex3':
                return (
                    <ShortAnswerPresentSimpleExercise
                        title="Exercise 3: Short Answers"
                        description="Escribe las dos respuestas cortas para cada pregunta (+A) y (-A)."
                        exerciseData={class12Exercise3Data}
                        onComplete={() => handleTopicComplete('ex3')}
                    />
                );
            case 'ex4':
                return <DualTranslationExercise onComplete={() => handleTopicComplete('ex4')} data={class12Exercise4Data} title="Exercise 4: Simple vs Continuous" />;
            case 'ex5':
                const vocabEx5 = {
                    "colegio": "school",
                    "biblioteca": "library",
                    "empresa": "company",
                    "calle": "street",
                    "parque": "park",
                    "vino": "wine",
                    "vodka": "vodka",
                    "jugo de naranja": "orange juice",
                    "jardín": "garden",
                    "caminando": "walking"
                };
                return <SimpleTranslationExercise exerciseKey="c12_ex5" course="a1" onComplete={() => handleTopicComplete('ex5')} title="Exercise 5" vocabulary={vocabEx5} />;
            case 'grammar3':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader className="bg-primary/10 border-b">
                            <div className="flex items-center gap-3">
                                <BookText className="h-6 w-6 text-primary" />
                                <CardTitle className="text-2xl uppercase tracking-tighter">USOS DEL PRESENTE SIMPLE Y DEL PRESENTE CONTINUO</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            {/* Present Simple Uses */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-brand-purple uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="h-5 w-5" /> USOS DEL PRESENTE SIMPLE:
                                </h3>
                                
                                <Accordion type="multiple" defaultValue={['ps-1', 'ps-2', 'ps-3', 'ps-4', 'ps-5', 'ps-6']} className="w-full space-y-2">
                                    <AccordionItem value="ps-1" className="border rounded-lg px-4">
                                        <AccordionTrigger className="font-bold">Routine (Rutina)</AccordionTrigger>
                                        <AccordionContent className="font-mono text-sm space-y-1">
                                            <p>I always open the door.</p>
                                            <p>She plays in the park on Sundays.</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                    
                                    <AccordionItem value="ps-2" className="border rounded-lg px-4">
                                        <AccordionTrigger className="font-bold">Give instruction (Dar instrucciones)</AccordionTrigger>
                                        <AccordionContent className="font-mono text-sm space-y-1">
                                            <p>Open the window, please.</p>
                                            <p>Come here! – Sit down! – Don’t smoke here.</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                    
                                    <AccordionItem value="ps-3" className="border rounded-lg px-4">
                                        <AccordionTrigger className="font-bold">Transportation & Events (Horarios)</AccordionTrigger>
                                        <AccordionContent className="font-mono text-sm space-y-1">
                                            <p>The train leaves at 8:00pm.</p>
                                            <p>Her plain won’t arrive today due to bad weather.</p>
                                            <p>The party is tonight – The movie starts at 6 pm.</p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="ps-4" className="border rounded-lg px-4">
                                        <AccordionTrigger className="font-bold">Scientific facts (Hechos científicos)</AccordionTrigger>
                                        <AccordionContent className="font-mono text-sm space-y-1">
                                            <p>The sun warms the atmosphere.</p>
                                            <p>Water boils at 100 degrees (el agua hierve a 100 grados).</p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="ps-5" className="border rounded-lg px-4">
                                        <AccordionTrigger className="font-bold">General truth (Verdades generales)</AccordionTrigger>
                                        <AccordionContent className="font-mono text-sm space-y-1">
                                            <p>He likes football.</p>
                                            <p>We go to bed at 10 pm.</p>
                                            <p>He doesn’t eat vegetables because he doesn’t like it.</p>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="ps-6" className="border rounded-lg px-4">
                                        <AccordionTrigger className="font-bold">Permanent situation (Situación permanente)</AccordionTrigger>
                                        <AccordionContent className="font-mono text-sm space-y-1">
                                            <p>She has a car.</p>
                                            <p>They work in Europe.</p>
                                            <p>I have 2 children.</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>

                            <Separator />

                            {/* Present Continuous Uses */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                    <MousePointer2 className="h-5 w-5" /> USOS DEL PRESENTE CONTINUO:
                                </h3>
                                
                                <Accordion type="multiple" defaultValue={['pc-1', 'pc-2', 'pc-3']} className="w-full space-y-2">
                                    <AccordionItem value="pc-1" className="border rounded-lg px-4">
                                        <AccordionTrigger className="font-bold text-left">Something happening right now (Ahora mismo)</AccordionTrigger>
                                        <AccordionContent className="space-y-3">
                                            <p className="text-xs text-muted-foreground italic">Specific action at the moment of speaking:</p>
                                            <div className="font-mono text-sm space-y-1">
                                                <p>I’m studying English now (Estoy estudiando ahora).</p>
                                                <p>He’s eating vegetables with meat (Él está comiendo).</p>
                                                <p>Is it raining? (¿Está lloviendo?).</p>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="pc-2" className="border rounded-lg px-4">
                                        <AccordionTrigger className="font-bold text-left">Currently happening (Temporalmente actualmente)</AccordionTrigger>
                                        <AccordionContent className="space-y-3">
                                            <p className="text-xs text-muted-foreground italic">Something that is happening currently but it isn’t necessarily at the moment we speak. Uses expressions: currently, recently, these days.</p>
                                            <div className="font-mono text-sm space-y-1">
                                                <p>They are learning Italian these days.</p>
                                                <p>She’s currently looking for a job.</p>
                                                <p>Are you lately working on that project?</p>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="pc-3" className="border rounded-lg px-4">
                                        <AccordionTrigger className="font-bold text-left">Decided future plans (Planes futuros decididos)</AccordionTrigger>
                                        <AccordionContent className="space-y-3">
                                            <p className="text-xs text-muted-foreground italic">Se usa para hablar de algo que está decidido que se hará en el futuro.</p>
                                            <div className="font-mono text-sm space-y-1">
                                                <p>I’m going to the party tonight.</p>
                                                <p>He’s not coming to class ‘cause he’s sick.</p>
                                                <p>Are you working in that company next week?</p>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar3')} size="lg" className="px-12">
                                He terminado de estudiar los usos
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex6':
                return <ChoiceExercise onComplete={() => handleTopicComplete('ex6')} />;
            case 'ex7':
                return (
                    <ShortAnswerPresentSimpleExercise
                        title="Exercise 7: Short Answers"
                        description="Escribe las dos respuestas cortas para cada pregunta de Present Simple y Present Continuous (+A) y (-A)."
                        exerciseData={class12Exercise8Data}
                        onComplete={() => handleTopicComplete('ex7')}
                    />
                );
            case 'ex8':
                return <DualTranslationExercise onComplete={() => handleTopicComplete('ex8')} data={class12Exercise9Data} title="Exercise 8: Simple vs Continuous" vocabulary={ex9Vocab} />;
            case 'last_ex':
                return <LastExerciseComp onComplete={() => handleTopicComplete('last_ex')} />;
            default:
                return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
        }
    };

    if (isUserLoading || isProfileLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-white/80">Volver al curso A1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Class 12 (A1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const Icon = item.status === 'completed' ? CheckCircle : item.icon;
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isActive = item.status === 'active';
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold',
                                                            isActive && !isAdmin && "animate-pulse-glow"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : (item.status === 'locked' ? 'text-yellow-500' : ''))} />
                                                            <span>{item.name}</span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span></div>
                                        <Progress value={progressValue} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

