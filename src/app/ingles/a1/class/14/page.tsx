'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
    Sparkles,
    Mic,
    Check,
    X,
    Trophy,
    ArrowLeft,
    BookText,
    Gamepad2
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

type TopicStatus = 'completed' | 'active' | 'locked';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: TopicStatus;
};

const progressStorageVersion = 'progress_a1_eng_u3_c14_v15_organized';
const mainProgressKey = 'progress_a1_eng_unit_3_class_14';

const vocabularyData = {
    verbs: [
        { spanish: 'DAR', english: 'TO GIVE' },
        { spanish: 'IR', english: 'TO GO' },
        { spanish: 'HABER-TENER', english: 'TO HAVE' },
        { spanish: 'OIR', english: 'TO HEAR' },
        { spanish: 'CONOCER', english: 'TO KNOW' },
        { spanish: 'IRSE', english: 'TO LEAVE' },
        { spanish: 'PERDER', english: 'TO LOSE' },
        { spanish: 'HACER', english: 'TO MAKE' },
        { spanish: 'ENCONTRAR', english: 'TO MEET' },
        { spanish: 'PONER', english: 'TO PUT' },
        { spanish: 'LEER', english: 'TO READ' },
        { spanish: 'MONTAR (HORSE-BIKE)', english: 'TO RIDE' },
        { spanish: 'CORRER', english: 'TO RUN' },
        { spanish: 'DECIR', english: 'TO SAY' },
        { spanish: 'VENDER', english: 'TO SELL' },
        { spanish: 'ENVIAR', english: 'TO SEND' },
        { spanish: 'CANTAR', english: 'TO SING' },
        { spanish: 'DORMIR', english: 'TO SLEEP' },
    ],
    materials: [
        { spanish: 'TEJIDO', english: 'FABRIC' },
        { spanish: 'LANA', english: 'WOOL' },
        { spanish: 'ALGODÓN', english: 'COTTON' },
        { spanish: 'SEDA', english: 'SILK' },
        { spanish: 'CUERO', english: 'LEATHER' },
        { spanish: 'PIEDRA', english: 'STONE' },
        { spanish: 'BRONCE', english: 'BRONZE' },
        { spanish: 'ACERO', english: 'STEEL' },
        { spanish: 'HIERRO', english: 'IRON' },
        { spanish: 'VIDRIO', english: 'GLASS' },
        { spanish: 'MADERA', english: 'WOOD' },
        { spanish: 'METAL', english: 'METAL' },
        { spanish: 'PLATA', english: 'SILVER' },
        { spanish: 'ORO', english: 'GOLD' },
        { spanish: 'PLASTICO', english: 'PLASTIC' },
    ]
};

const class14Exercise1Data = [
    { sentence: "IS COLOMBIA __________________ COUNTRY OF SOUTH AMERICA?", options: ["NICE", "NICER", "THE NICEST", "THE MOST NICE"], correct: "THE NICEST" },
    { sentence: "ARE THEY _______________ THAN THEM?", options: ["THE MOST FAMOUS", "MORE FAMOUS", "FAMOUSER", "FAMOUS"], correct: "MORE FAMOUS" },
    { sentence: "I’M ________________________ OF MY FAMILY", options: ["THE MOST TALL", "TALLER", "THE TALLEST", "THE MORE TALL"], correct: "THE TALLEST" },
    { sentence: "ARE THEY ______________ THAN US?", options: ["YOUNG", "MORE YOUNG", "YOUNGER", "THE YOUNGESTS"], correct: "YOUNGER" },
    { sentence: "THIS IS THE ____________________ VIDEO I’VE EVER SEEN!", options: ["FUNNIER", "THE MOST FUNNY", "THE FUNNIEST", "FUNNY"], correct: "THE FUNNIEST" },
    { sentence: "THIS BOX IS _________________________ THAN THE OTHER", options: ["THE LIGHTER", "LIGHTER", "THE LIGHTEST", "LIGHT"], correct: "LIGHTER" },
    { sentence: "JANE IS __________________________ THAN MARY", options: ["INTERESTINGER", "MORE INTERESTING", "INTERESTING", "THE INTERESTINGEST"], correct: "MORE INTERESTING" },
    { sentence: "HE IS ________________________ PILOT IN THE RACE", options: ["BAD", "THE WORST", "WORSE", "THE BADDEST"], correct: "THE WORST" },
    { sentence: "THAT MOVIE IS _______________________", options: ["BORINGER", "THE MOST BORING", "MORE BORING", "BORING"], correct: "THE MOST BORING" },
    { sentence: "THESE JEANS ARE ________________________ THAN THOSE ONES", options: ["DIRTIEST", "DIRTIER", "THE MOST DIRTY", "DIRTY"], correct: "DIRTIER" },
    { sentence: "THIS PLACE IS __________________________ OF THIS COUNTRY", options: ["MORE SAFE", "THE SAFEST", "THE MOST SAFE", "SAFER"], correct: "THE SAFEST" },
    { sentence: "TABUN IS _____________________ RESTAURANT IN MEDELLIN", options: ["THE BETTHER", "THE BEST", "BEST", "BETTER"], correct: "THE BEST" },
];

const lastExerciseQuestions = [
    { 
        spanish: "¿TÚ TIO ESTA DURMIENDO?", 
        answers: { 
            question: ["is your uncle sleeping?"], 
            pos: ["yes, he is"], 
            neg: ["no, he is not", "no, he isn't"] 
        } 
    },
    { 
        spanish: "¿ESTÁS MANEJANDO UN CARRO O UNA MOTO?", 
        answers: { 
            question: ["are you driving a car or a motorcycle?", "are you driving a car or a motorbike?"], 
            pos: ["yes, i am"], 
            neg: ["no, i am not", "no, i'm not"] 
        } 
    },
    { 
        spanish: "¿NOSOTROS ESTAMOS ESTUDIANDO INGLES UNA VEZ A LA SEMANA?", 
        answers: { 
            question: ["are we studying english once a week?"], 
            pos: ["yes, we are"], 
            neg: ["no, we are not", "no, we aren't"] 
        } 
    },
    { 
        spanish: "¿ÉL ESTA DIBUJANDO?", 
        answers: { 
            question: ["is he drawing?"], 
            pos: ["yes, he is"], 
            neg: ["no, i am not", "no, i'm not"] 
        } 
    },
    { 
        spanish: "¿ELLOS ESTAN CANTANDO EN LA FIESTA?", 
        answers: { 
            question: ["are they singing at the party?", "are they singing in the party?"], 
            pos: ["yes, they are"], 
            neg: ["no, they are not", "no, they aren't"] 
        } 
    },
    { 
        spanish: "¿ESTÁS LLAMANDO A TU MAMÁ TODOS LOS DIAS?", 
        answers: { 
            question: ["are you calling your mother every day?", "are you calling your mom every day?"], 
            pos: ["yes, i am"], 
            neg: ["no, i am not", "no, i'm not"] 
        } 
    },
    { 
        spanish: "¿ELLA ESTÁ LEYENDO UN LIBRO?", 
        answers: { 
            question: ["is she reading a book?"], 
            pos: ["yes, she is"], 
            neg: ["no, she is not", "no, she isn't"] 
        } 
    },
    { 
        spanish: "¿ELLOS ESTÁN VIAJANDO?", 
        answers: { 
            question: ["are they traveling?", "are they travelling?"], 
            pos: ["yes, they are"], 
            neg: ["no, they are not", "no, they aren't"] 
        } 
    },
    { 
        spanish: "¿ÉL ESTÁ VIENDO TELEVISION?", 
        answers: { 
            question: ["is he watching television?", "is he watching tv?"], 
            pos: ["yes, he is"], 
            neg: ["no, i am not", "no, i'm not"] 
        } 
    },
    { 
        spanish: "¿MARK ESTA YENDO A LONDRES O ROMA?", 
        answers: { 
            question: ["is mark going to london or rome?"], 
            pos: ["yes, he is"], 
            neg: ["no, he is not", "no, he isn't"] 
        } 
    },
];

const lastExerciseVocab = {
    "tio": "uncle",
    "manejando": "driving",
    "moto": "motorcycle / motorbike",
    "estudiando": "studying",
    "una vez a la semana": "once a week",
    "dibujando": "drawing",
    "cantando": "singing",
    "llamando": "calling",
    "leyendo": "reading",
    "viajando": "traveling / travelling",
    "viendo": "watching",
    "yendo": "going"
};

const VocabGame = ({ onComplete }: { onComplete: () => void }) => {
    const data = [
        { spanish: 'DAR', english: 'GIVE', gapped: 'GI_E' },
        { spanish: 'SABER', english: 'KNOW', gapped: 'KNO_' },
        { spanish: 'HACER', english: 'MAKE', gapped: 'MA_E' },
        { spanish: 'LEER', english: 'READ', gapped: 'RE_D' },
        { spanish: 'ALGODÓN', english: 'COTTON', gapped: 'COT_ON' },
        { spanish: 'ORO', english: 'GOLD', gapped: 'GOL_' },
        { spanish: 'PLATA', english: 'SILVER', gapped: 'SIL_ER' },
        { spanish: 'LANA', english: 'WOOL', gapped: 'WO_L' },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [isFinished, setIsFinished] = useState(false);
    const { toast } = useToast();

    const current = data[currentIndex];
    const gapIndex = current.gapped.indexOf('_');
    const missingLetter = current.english[gapIndex];

    const handleCheck = () => {
        if (answer.trim().toLowerCase() === missingLetter.toLowerCase()) {
            if (currentIndex < data.length - 1) {
                toast({ title: "¡Correcto!" });
                setCurrentIndex(prev => prev + 1);
                setAnswer('');
            } else {
                setIsFinished(true);
            }
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Prueba con otra letra." });
        }
    };

    if (isFinished) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
                <Trophy className="h-16 w-16 text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-4xl font-black text-primary uppercase tracking-tighter">Congratulations</h2>
                <p className="text-muted-foreground mt-2 mb-8 font-medium text-lg">Has completado el juego de vocabulario.</p>
                <Button onClick={onComplete} size="lg" className="px-16 font-bold h-14 text-xl shadow-lg">avanzar</Button>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Vocabulary (Game)</CardTitle>
                <CardDescription>Completa la palabra con la letra que falta.</CardDescription>
                <div className="pt-2 text-sm font-medium text-muted-foreground">
                    Palabra {currentIndex + 1} de {data.length}
                </div>
                <Progress value={((currentIndex + 1) / data.length) * 100} className="h-1 mt-2" />
            </CardHeader>
            <CardContent className="space-y-8 py-12">
                <div className="text-center space-y-6">
                    <div className="bg-primary/10 w-fit mx-auto px-6 py-2 rounded-full border border-primary/20">
                        <p className="text-lg text-primary font-black uppercase tracking-widest">{current.spanish}</p>
                    </div>
                    <div className="flex justify-center items-center gap-2 font-mono text-4xl font-black text-foreground tracking-tighter">
                        {current.gapped.split('_').map((part, i, arr) => (
                            <React.Fragment key={i}>
                                <span>{part}</span>
                                {i < arr.length - 1 && (
                                    <div className="relative group">
                                        <Input 
                                            value={answer}
                                            onChange={e => setAnswer(e.target.value.toUpperCase())}
                                            maxLength={1}
                                            className="w-12 h-14 text-center text-3xl border-b-4 border-t-0 border-x-0 rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent text-primary caret-transparent"
                                            autoFocus
                                            autoComplete="off"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="justify-center border-t pt-6">
                <Button onClick={handleCheck} size="lg" className="px-12 font-bold h-12 text-lg">Verificar</Button>
            </CardFooter>
        </Card>
    );
};

const LinesWritingExercise = ({ 
    title, 
    description, 
    lineCount = 12,
    onComplete, 
    studentDocRef, 
    initialData,
    initialGrades,
    savePath,
    savePathGrades,
    isAdmin = false,
    hasTitleLine = false
}: { 
    title: string, 
    description: string, 
    lineCount?: number,
    onComplete: () => void,
    studentDocRef: any,
    initialData: string[],
    initialGrades: Record<number, 'correct' | 'incorrect' | null>,
    savePath: string,
    savePathGrades: string,
    isAdmin?: boolean,
    hasTitleLine?: boolean
}) => {
    const totalLines = hasTitleLine ? lineCount + 1 : lineCount;
    const [lines, setLines] = useState<string[]>(Array(totalLines).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current && initialData && Array.isArray(initialData)) {
            const newLines = [...Array(totalLines).fill('')];
            initialData.forEach((val, i) => {
                if (i < totalLines) newLines[i] = val || '';
            });
            setLines(newLines);
            if (initialData.length > 0) {
                initializedRef.current = true;
            }
        }
    }, [initialData, totalLines]);

    useEffect(() => {
        if (initialGrades) {
            setGrades(initialGrades);
        }
    }, [initialGrades]);

    const handleLineChange = (index: number, value: string) => {
        const newLines = [...lines];
        newLines[index] = value;
        setLines(newLines);
        
        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [savePath]: newLines
            });
        }
    };

    const handleToggleGrade = (index: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;

        const newGrades = { ...grades };
        if (newGrades[index] === type) {
            newGrades[index] = null;
        } else {
            newGrades[index] = type;
        }
        setGrades(newGrades);

        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [savePathGrades]: newGrades
            });
        }
    };

    const renderRenglon = (line: string, idx: number, isTitle: boolean = false) => {
        const status = grades[idx];
        const borderClass = status === 'correct' ? 'border-green-500 ring-1 ring-green-500' : status === 'incorrect' ? 'border-red-500 ring-1 ring-red-500' : '';

        return (
            <div key={idx} className="flex items-center gap-3">
                <span className={cn("font-bold w-8 text-right shrink-0", isTitle ? "text-brand-purple w-20" : "text-primary")}>
                    {isTitle ? "TITULO:" : `${idx}.`}
                </span>
                <Input 
                    value={line} 
                    onChange={(e) => handleLineChange(idx, e.target.value)} 
                    placeholder={isTitle ? "Escribe el título aquí..." : "..."}
                    className={cn(
                        "flex-1 bg-muted/30 focus:bg-background transition-all h-11 border-primary/20",
                        isTitle && "bg-primary/5 h-12 font-bold",
                        borderClass
                    )}
                    autoComplete="off"
                />
                
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => handleToggleGrade(idx, 'correct')}
                        className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            status === 'correct' 
                                ? "bg-green-500 border-green-600 text-white" 
                                : "bg-gray-200 border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-transparent",
                            !isAdmin && "cursor-default pointer-events-none"
                        )}
                    >
                        <Check className="h-3 w-3" />
                    </button>
                    <button
                        onClick={() => handleToggleGrade(idx, 'incorrect')}
                        className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            status === 'incorrect' 
                                ? "bg-red-500 border-red-600 text-white" 
                                : "bg-gray-200 border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-transparent",
                            !isAdmin && "cursor-default pointer-events-none"
                        )}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {hasTitleLine && renderRenglon(lines[0], 0, true)}
                    {lines.slice(hasTitleLine ? 1 : 0).map((line, idx) => {
                        const actualIndex = hasTitleLine ? idx + 1 : idx;
                        return renderRenglon(line, actualIndex);
                    })}
                </div>
            </CardContent>
            <CardFooter className="pt-6 border-t mt-4">
                <Button onClick={onComplete} size="lg" className="w-full sm:w-auto min-w-[200px]">Completar Tarea</Button>
            </CardFooter>
        </Card>
    );
};

const OptionsChoiceExercise = ({ data, onComplete, title }: { data: any[], onComplete: () => void, title: string }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selections, setSelections] = useState<string[]>(Array(data.length).fill(''));
    const [validation, setValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(data.length).fill('unchecked'));
    const [isFinished, setIsFinished] = useState(false);

    const currentPrompt = data[currentIndex];

    const handleSelect = (option: string) => {
        if (validation[currentIndex] === 'correct') return;
        
        const newS = [...selections];
        newS[currentIndex] = option;
        setSelections(newS);

        const isCorrect = option === currentPrompt.correct;
        const newV = [...validation];
        newV[currentIndex] = isCorrect ? 'correct' : 'incorrect';
        setValidation(newV);

        if (isCorrect) {
            toast({ title: "¡Correcto!" });
            if (currentIndex < data.length - 1) {
                setTimeout(() => setCurrentIndex(prev => prev + 1), 600);
            }
        } else {
            toast({ variant: 'destructive', title: "Incorrecto", description: "Inténtalo de nuevo." });
        }
    };

    const allCorrect = validation.every(v => v === 'correct');

    if (isFinished) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple p-8 text-center">
                <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
                <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                <p className="text-muted-foreground mt-2 mb-6">Has dominado los comparativos y superlativos de este nivel.</p>
                <Button onClick={onComplete} size="lg">Continuar</Button>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Elige la opción correcta para completar la frase.</CardDescription>
                <div className="flex flex-wrap gap-2 pt-4">
                    {data.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === idx ? "border-primary ring-2 ring-primary" : "border-muted-foreground/30",
                                validation[idx] === 'correct' && "bg-green-500 border-green-500 text-white",
                                validation[idx] === 'incorrect' && "bg-red-500 border-red-500 text-white"
                            )}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6 min-h-[300px] flex flex-col justify-center">
                <div className="text-center space-y-8">
                    <div className="p-8 bg-muted rounded-2xl border-2 border-dashed text-2xl font-bold leading-relaxed">
                        {currentPrompt.sentence.split('__________________').map((part, i, arr) => (
                            <React.Fragment key={i}>
                                {part}
                                {i < arr.length - 1 && (
                                    <span className={cn(
                                        "px-2 underline min-w-[100px] inline-block",
                                        validation[currentIndex] === 'correct' ? "text-green-600" : (validation[currentIndex] === 'incorrect' ? "text-red-500" : "text-primary")
                                    )}>
                                        {selections[currentIndex] || "__________________"}
                                    </span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                        {currentPrompt.options.map(opt => (
                            <Button
                                key={opt}
                                variant={selections[currentIndex] === opt ? "default" : "outline"}
                                onClick={() => handleSelect(opt)}
                                className={cn(
                                    "h-14 text-lg font-bold border-2",
                                    selections[currentIndex] === opt && validation[currentIndex] === 'correct' && "bg-green-600 border-green-600 hover:bg-green-700",
                                    selections[currentIndex] === opt && validation[currentIndex] === 'incorrect' && "bg-red-600 border-red-600 hover:bg-red-700"
                                )}
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <Button onClick={() => setIsFinished(true)} disabled={!allCorrect} className={cn(allCorrect && "animate-pulse-glow")}>
                    Finalizar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

const LastExerciseQA = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, { question: string; pos: string; neg: string }>>(
        lastExerciseQuestions.reduce((acc, _, idx) => ({ ...acc, [idx]: { question: '', pos: '', neg: '' } }), {})
    );
    const [validation, setValidation] = useState<Record<number, { question: boolean; pos: boolean; neg: boolean } | null>>({});
    const [showResults, setShowResults] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const currentPrompt = lastExerciseQuestions[currentIndex];
    
    const handleInputChange = (field: 'question' | 'pos' | 'neg', value: string) => {
        if (showResults) return;
        setUserAnswers(prev => ({
            ...prev,
            [currentIndex]: { ...prev[currentIndex], [field]: value }
        }));
    };

    const handleCheckAll = () => {
        const newValidation: Record<number, { question: boolean; pos: boolean; neg: boolean }> = {};
        let allCorrect = true;

        lastExerciseQuestions.forEach((item, idx) => {
            const user = userAnswers[idx];
            const check = (userVal: string, correctList: string[]) => 
                correctList.map(c => c.toLowerCase().replace(/[.?,¿!¡]/g, '').trim())
                    .includes(userVal.toLowerCase().replace(/[.?,¿!¡]/g, '').trim());

            const questionCorrect = check(user.question, item.answers.question);
            const posCorrect = check(user.pos, item.answers.pos);
            const negCorrect = check(user.neg, item.answers.neg);

            newValidation[idx] = { question: questionCorrect, pos: posCorrect, neg: negCorrect };
            if (!questionCorrect || !posCorrect || !negCorrect) allCorrect = false;
        });

        setValidation(newValidation);
        setShowResults(true);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Has dominado las respuestas cortas del presente continuo." });
            setIsFinished(true);
            onComplete();
        } else {
            toast({ 
                variant: 'destructive', 
                title: "Algunas respuestas son incorrectas", 
                description: "Revisa las bolitas y los campos marcados para corregir." 
            });
        }
    };

    const isAllCompleted = Object.values(userAnswers).every(ua => 
        ua.question.trim().length > 0 && ua.pos.trim().length > 0 && ua.neg.trim().length > 0
    );

    if (isFinished) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <Trophy className="h-20 w-20 text-yellow-400 mb-6 animate-bounce" />
                <h2 className="text-3xl font-black bg-gradient-to-r from-brand-purple to-brand-teal text-transparent bg-clip-text uppercase tracking-tighter">¡Clase 14 Completada!</h2>
                <p className="text-muted-foreground mt-2 mb-8">¡Felicidades! Has terminado todos los retos de la Clase 14.</p>
                <Button size="lg" className="px-12 font-bold" variant="outline" onClick={() => setIsFinished(false)}>Revisar Respuestas</Button>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle>Last Exercise: Short Answers</CardTitle>
                        <CardDescription>Traduce la pregunta y escribe las respuestas cortas (+A y -A) en Presente Continuo.</CardDescription>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse">
                                <BookText className="mr-2 h-4 w-4" />
                                Vocabulary
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                            <div className="space-y-2">
                                <h4 className="font-bold border-b pb-1 text-primary">Vocabulario de apoyo</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    {Object.entries(lastExerciseVocab).map(([es, en]) => (
                                        <React.Fragment key={es}>
                                            <span className="text-muted-foreground capitalize">{es}:</span>
                                            <span className="font-semibold text-right">{en}</span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex flex-wrap gap-2 pt-4">
                    {lastExerciseQuestions.map((_, idx) => {
                        const val = validation[idx];
                        const isSelected = currentIndex === idx;
                        const hasStarted = userAnswers[idx].question.trim().length > 0;
                        
                        let bgColor = "bg-muted border-border";
                        if (showResults) {
                            const isCorrect = val?.question && val?.pos && val?.neg;
                            bgColor = isCorrect ? "bg-green-500 border-green-600 text-white" : "bg-red-500 border-red-600 text-white";
                        } else if (hasStarted) {
                            bgColor = "bg-primary/20 border-primary text-primary";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                    isSelected && !showResults ? "ring-2 ring-primary ring-offset-1" : "",
                                    bgColor
                                )}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center">
                    <p className="text-sm text-muted-foreground mb-1">Traduce esta pregunta:</p>
                    <p className="text-2xl font-bold">"{currentPrompt.spanish}"</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className={cn(
                            "font-bold flex items-center gap-2",
                            showResults && validation[currentIndex]?.question ? "text-green-600" : showResults ? "text-red-500" : "text-primary"
                        )}>
                            (?) TRANSLATE THE QUESTION:
                            {showResults && (validation[currentIndex]?.question ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />)}
                        </Label>
                        <Input 
                            value={userAnswers[currentIndex].question}
                            onChange={e => handleInputChange('question', e.target.value)}
                            className={cn(
                                "h-12 text-lg",
                                showResults && validation[currentIndex]?.question ? "border-green-500 bg-green-50" : showResults ? "border-red-500 bg-red-50" : ""
                            )}
                            placeholder="Is..."
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className={cn(
                                "font-bold flex items-center gap-2",
                                showResults && validation[currentIndex]?.pos ? "text-green-600" : showResults ? "text-red-500" : "text-primary"
                            )}>
                                (+A) YES,
                                {showResults && (validation[currentIndex]?.pos ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />)}
                            </Label>
                            <Input 
                                value={userAnswers[currentIndex].pos}
                                onChange={e => handleInputChange('pos', e.target.value)}
                                className={cn(
                                    "h-12 text-lg",
                                    showResults && validation[currentIndex]?.pos ? "border-green-500 bg-green-50" : showResults ? "border-red-500 bg-red-50" : ""
                                )}
                                placeholder="Yes, he is"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className={cn(
                                "font-bold flex items-center gap-2",
                                showResults && validation[currentIndex]?.neg ? "text-green-600" : showResults ? "text-red-500" : "text-primary"
                            )}>
                                (-A) NO,
                                {showResults && (validation[currentIndex]?.neg ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />)}
                            </Label>
                            <Input 
                                value={userAnswers[currentIndex].neg}
                                onChange={e => handleInputChange('neg', e.target.value)}
                                className={cn(
                                    "h-12 text-lg",
                                    showResults && validation[currentIndex]?.neg ? "border-green-500 bg-green-50" : showResults ? "border-red-500 bg-red-50" : ""
                                )}
                                placeholder="No, he isn't"
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    {currentIndex === lastExerciseQuestions.length - 1 || showResults ? (
                        <Button onClick={handleCheckAll} disabled={!isAllCompleted} className={cn(isAllCompleted && !showResults && "animate-pulse-glow")}>
                            Verificar Todo
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setCurrentIndex(p => p + 1)}>
                            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

export default function EngA1Class14Page() {
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

    const [vocabAnswers, setVocabAnswers] = useState<{[key: string]: string[]}>({});
    const [vocabValidation, setVocabValidation] = useState<{[key: string]: ('correct' | 'incorrect' | 'unchecked')[]}>({});
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary', icon: BookOpen, status: 'active' },
        { key: 'dictation1', name: 'Dictation 1', icon: Mic, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'general_ex', name: 'General Exercise', icon: GraduationCap, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'dictation2', name: 'Dictation 2', icon: Mic, status: 'locked' },
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

        const initAnswers: any = {};
        const initVal: any = {};
        Object.keys(vocabularyData).forEach(cat => {
            initAnswers[cat] = Array((vocabularyData as any)[cat].length).fill('');
            initVal[cat] = Array((vocabularyData as any)[cat].length).fill('unchecked');
        });
        setVocabAnswers(initAnswers);
        setVocabValidation(initVal);

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
    };

    const handleVocabChange = (cat: string, idx: number, val: string) => {
        const newAns = { ...vocabAnswers };
        newAns[cat][idx] = val;
        setVocabAnswers(newAns);

        const newVal = { ...vocabValidation };
        newVal[cat][idx] = 'unchecked';
        setVocabValidation(newVal);
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let oneCorrect = false;
        const newVal: any = {};
        
        Object.keys(vocabularyData).forEach(cat => {
            newVal[cat] = (vocabularyData as any)[cat].map((item: any, idx: number) => {
                const userVal = (vocabAnswers[cat][idx] || '').trim().toUpperCase();
                const correctVal = item.english.toUpperCase();
                const isCorrect = userVal === correctVal;
                if (isCorrect) oneCorrect = true;
                return isCorrect ? 'correct' : 'incorrect';
            });
        });

        setVocabValidation(newVal);
        if (oneCorrect) {
            toast({ title: "¡Buen trabajo!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas", description: "Necesitas al menos una correcta para avanzar." });
        }
    };

    const getVocabClass = (cat: string, idx: number) => {
        const status = vocabValidation[cat]?.[idx];
        if (status === 'correct') return 'border-green-500 bg-green-50 dark:bg-green-900/10 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Verbs and Materials)</CardTitle>
                            <CardDescription>Traduce las palabras al inglés. Para los verbos, incluye la palabra <strong>"TO"</strong> antes (ej: TO GIVE).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['verbs', 'materials']} className="w-full">
                                <AccordionItem value="verbs">
                                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Lexico: Verbos Básicos</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Spanish</div>
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">English (Infinitive)</div>
                                            {vocabularyData.verbs.map((item, idx) => (
                                                <React.Fragment key={`v-${idx}`}>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center font-medium">{item.spanish}</div>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">
                                                        <Input
                                                            value={vocabAnswers.verbs?.[idx] || ''}
                                                            onChange={e => handleVocabChange('verbs', idx, e.target.value)}
                                                            className={cn("h-11 font-mono uppercase", getVocabClass('verbs', idx))}
                                                            placeholder="TO..."
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="materials">
                                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Lexico: Materiales y Tejidos</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">Spanish</div>
                                            <div className="font-bold p-3 bg-muted rounded-lg text-left">English</div>
                                            {vocabularyData.materials.map((item, idx) => (
                                                <React.Fragment key={`m-${idx}`}>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center font-medium">{item.spanish}</div>
                                                    <div className="p-3 bg-card border rounded-lg flex items-center">
                                                        <Input
                                                            value={vocabAnswers.materials?.[idx] || ''}
                                                            onChange={e => handleVocabChange('materials', idx, e.target.value)}
                                                            className={cn("h-11 font-mono uppercase", getVocabClass('materials', idx))}
                                                            placeholder="..."
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary" size="lg">Verificar</Button>
                            <Button 
                                onClick={() => handleTopicComplete('vocabulary')} 
                                disabled={!canAdvanceVocab && !isAdmin}
                                size="lg"
                                className={cn(canAdvanceVocab && "bg-green-600 hover:bg-green-700 shadow-lg")}
                            >
                                Avanzar <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'dictation1':
                return (
                    <LinesWritingExercise 
                        key="dictation1"
                        title="DICTATION 1 = COMPARATIVES AND SUPERLATIVE ADJECTIVES" 
                        description="Escucha atentamente a tu profesor y escribe las frases en los renglones correspondientes." 
                        onComplete={() => handleTopicComplete('dictation1')} 
                        studentDocRef={studentDocRef}
                        lineCount={30}
                        hasTitleLine={true}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1 || []}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Grades || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation1`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.dictation1Grades`}
                        isAdmin={isAdmin}
                    />
                );
            case 'ex1':
                return (
                    <OptionsChoiceExercise 
                        data={class14Exercise1Data} 
                        onComplete={() => handleTopicComplete('ex1')} 
                        title="EXERCISE: COMPARATIVOS Y SUPERLATIVOS" 
                    />
                );
            case 'general_ex':
                return (
                    <SimpleTranslationExercise 
                        exerciseKey="c14_general" 
                        onComplete={() => handleTopicComplete('general_ex')} 
                        course="a1" 
                        title="General Exercise"
                        vocabulary={{
                            "árbol": "tree",
                            "más alto": "highest",
                            "camión": "truck",
                            "enseñar": "teach"
                        }}
                    />
                );
            case 'vocab_game':
                return <VocabGame onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'dictation2':
                return (
                    <LinesWritingExercise 
                        key="dictation2"
                        title="DICTATION 2" 
                        description="Escucha atentamente a tu profesor y escribe las frases en los renglones correspondientes." 
                        onComplete={() => handleTopicComplete('dictation2')} 
                        studentDocRef={studentDocRef}
                        lineCount={30}
                        hasTitleLine={true}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2 || []}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2Grades || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation2`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.dictation2Grades`}
                        isAdmin={isAdmin}
                    />
                );
            case 'last_ex':
                return <LastExerciseQA onComplete={() => handleTopicComplete('last_ex')} />;
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
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Class 14 (A1)</h1>
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
