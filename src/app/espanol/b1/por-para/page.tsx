'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
    Pencil,
    Star,
    ArrowLeft,
    Check,
    X,
    Info,
    Briefcase,
    Globe,
    MessageSquare,
    ListChecks,
    Zap
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
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
const progressStorageVersion = 'progress_es_b1_por_para_v10_final';
const mainProgressKey = 'progress_b1_es_por_para';

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const workVocab = [
    { en: "JOB / WORK", es: "TRABAJO" }, { en: "SALARY", es: "SALARIO" }, { en: "UNIVERSITY", es: "UNIVERSIDAD" },
    { en: "COURSE", es: "CURSO" }, { en: "TRIP", es: "VIAJE" }, { en: "DESTINATION", es: "DESTINO" },
    { en: "MOTIVE / REASON", es: "MOTIVO" }, { en: "OBJECTIVE / GOAL", es: "OBJETIVO" },
    { en: "SCHOLARSHIP", es: "BECA" }, { en: "CAREER", es: "CARRERA" }, { en: "PROMOTION", es: "ASCENSO" },
    { en: "OFFICE", es: "OFICINA" }, { en: "MEETING", es: "REUNIÓN" }, { en: "PROJECT", es: "PROYECTO" },
    { en: "SUCCESSFUL", es: "EXITOSO" }, { en: "EXPERIENCE", es: "EXPERIENCIA" }, { en: "LANGUAGE", es: "IDIOMA" },
    { en: "COMPANY", es: "EMPRESA" }, { en: "SKILLS", es: "HABILIDADES" }, { en: "INTERVIEW", es: "ENTREVISTA" },
    { en: "BOSS", es: "JEFE" }, { en: "COWORKER", es: "COMPAÑERO" }
];

const conjVerbs = [
    { v: "WORK (TRABAJAR)", imp: ["trabajaba", "trabajabas", "trabajaba", "trabajábamos", "trabajaban"], pre: ["trabajé", "trabajaste", "trabajó", "trabajamos", "trabajaron"] },
    { v: "STUDY (ESTUDIAR)", imp: ["estudiaba", "estudiabas", "estudiaba", "estudiábamos", "estudiaban"], pre: ["estudié", "estudiaste", "estudió", "estudiamos", "estudiaron"] },
    { v: "TRAVEL (VIAJAR)", imp: ["viajaba", "viajabas", "viajaba", "viajábamos", "viajaban"], pre: ["viajé", "viajaste", "viajó", "viajamos", "viajaron"] },
    { v: "APPLY (SOLICITAR)", imp: ["solicitaba", "solicitabas", "solicitaba", "solicitábamos", "solicitaban"], pre: ["solicité", "solicitaron", "solicitó", "solicitamos", "solicitaron"] },
    { v: "START (EMPEZAR)", imp: ["empezaba", "empezabas", "empezaba", "empezábamos", "empezaban"], pre: ["empecé", "empezaste", "empezó", "empezamos", "empezaron"] },
    { v: "FINISH (TERMINAR)", imp: ["terminaba", "terminabas", "terminaba", "terminábamos", "terminaban"], pre: ["terminé", "terminaste", "terminó", "terminamos", "terminaron"] },
    { v: "ARRIVE (LLEGAR)", imp: ["llegaba", "llegabas", "llegaba", "llegábamos", "llegaban"], pre: ["llegué", "llegaste", "llegó", "llegamos", "llegaron"] },
    { v: "LEARN (APRENDER)", imp: ["aprendía", "aprendías", "aprendía", "aprendíamos", "aprendían"], pre: ["aprendí", "aprendiste", "aprendió", "aprendimos", "aprendieron"] },
    { v: "ACHIEVE (LOGRAR)", imp: ["lograba", "lograbas", "lograba", "lográbamos", "lograban"], pre: ["logré", "lograste", "logró", "logramos", "lograron"] },
    { v: "CHANGE (CAMBIAR)", imp: ["cambiaba", "cambiabas", "cambiaba", "cambiábamos", "cambiaban"], pre: ["cambié", "cambiaste", "cambió", "cambiamos", "cambiaron"] },
];

const ex1Prompts = [
    { spanish: "ESTE REGALO ES _______ TI (DESTINATARIO)", answer: ["para"] },
    { spanish: "ESTUDIO _______ APRENDER (FINALIDAD)", answer: ["para"] },
    { spanish: "CAMINO _______ EL PARQUE (LUGAR DE PASO)", answer: ["por"] },
    { spanish: "ESTARÉ ALLÍ _______ TRES HORAS (DURACIÓN)", answer: ["por"] },
    { spanish: "LO HAGO _______ AMOR (CAUSA)", answer: ["por"] },
    { spanish: "EL DOCUMENTO ES _______ MAÑANA (FECHA LÍMITE)", answer: ["para"] },
    { spanish: "TE CAMBIO MI PAN _______ TU CAFÉ (INTERCAMBIO)", answer: ["por"] },
    { spanish: "HABLAMOS _______ TELÉFONO (MEDIO)", answer: ["por"] },
    { spanish: "_______ MÍ, ESTO ES DIFÍCIL (OPINIÓN)", answer: ["para"] },
    { spanish: "VOY _______ LA OFICINA (DIRECCIÓN)", answer: ["para"] },
    { spanish: "ESTOS ZAPATOS SON _______ TI (DESTINATARIO)", answer: ["para"] },
    { spanish: "ESTE LIBRO ES _______ MI HERMANO (DESTINATARIO)", answer: ["para"] },
    { spanish: "VAMOS _______ EL PARQUE (LUGAR)", answer: ["por"] },
    { spanish: "TRABAJAS _______ LA EMPRESA (ORGANIZACIÓN)", answer: ["para"] },
    { spanish: "ESTOY _______ LA UNIVERSIDAD (LUGAR)", answer: ["por"] },
    { spanish: "VAMOS _______ EL RESTAURANTE (DIRECCIÓN)", answer: ["para"] },
    { spanish: "ESTOY _______ LA OFICINA (LUGAR DE PASO)", answer: ["por"] },
    { spanish: "VAMOS _______ EL MUSEO (DIRECCIÓN)", answer: ["para"] },
];

const ex2Prompts = [
    { en: "I study English to get a promotion.", answer: ["estudio inglés para obtener un ascenso", "yo estudio ingles para un ascenso"] },
    { en: "She works for a big company.", answer: ["ella trabaja para una empresa grande", "yo trabaja para una gran empresa"] },
    { en: "We travel for two weeks.", answer: ["viajamos por dos semanas", "nosotros viajamos por dos semanas"] },
    { en: "This project is for the boss.", answer: ["este proyecto es para el jefe"] },
    { en: "They speak by phone about the job.", answer: ["hablan por teléfono sobre el trabajo", "ellos hablan por telefono sobre el trabajo"] },
    { en: "I apply for a scholarship for my studies.", answer: ["solicito una beca para mis estudios", "yo aplico para una beca para mis estudios"] },
    { en: "For me, the destination is interesting.", answer: ["para mí, el destino es interesante", "para mi el destino es interesante"] },
    { en: "He achieves his goals for his family.", answer: ["él logra sus metas por su familia", "el logra sus objetivos por su familia"] },
    { en: "We finish the task by tomorrow.", answer: ["nosotros terminamos la tarea para mañana", "nosotros finalizamos la tarea para mañana"] },
    { en: "She changes her career for a better salary.", answer: ["ella cambia su carrera por un mejor salario", "ella cambia su profesion por un mejor sueldo"] },
];

const ex3Prompts = [
    { en: "I go to the university for my brother.", answer: ["yo voy a la universidad por mi hermano"] },
    { en: "The book is for you.", answer: ["el libro es para ti"] },
    { en: "We walk through the city.", answer: ["nosotros caminamos por la ciudad"] },
    { en: "It is for learning.", answer: ["esto es para aprender"] },
    { en: "I pay ten dollars for the coffee.", answer: ["yo pago diez dólares por el café"] },
    { en: "She arrives for the meeting.", answer: ["ella llega para la reunión"] },
    { en: "They work for the same objective.", answer: ["ellos trabajan para el mismo objetivo"] },
    { en: "I am here for a month.", answer: ["yo estoy aquí por un mes"] },
    { en: "The gift is for my parents.", answer: ["el regalo es para mis padres"] },
    { en: "We send the file by email.", answer: ["nosotros enviamos el archivo por correo"] },
    { en: "Is it for me?", answer: ["¿es para mí?", "es para mi?"] },
    { en: "I run for my health.", answer: ["yo corro por mi salud"] },
    { en: "They study for the exam.", answer: ["ellos estudian para el examen"] },
    { en: "She is in London for work.", answer: ["ella está en londres por trabajo"] },
    { en: "I do it for you.", answer: ["yo lo hago por ti"] },
];

const readingData = {
    title: "Mi Carrera Profesional",
    content: "Trabajo en una empresa de tecnología desde hace cinco años. Para mí, el objetivo principal es aprender cosas nuevas cada día. Mañana viajo a México por motivos de trabajo; estaré allá por una semana. He solicitado una beca para estudiar una maestría, porque quiero mejorar mis habilidades para obtener un ascenso. El éxito es importante para mi familia y para mí.",
    questions: [
        { q: "¿Para quién es importante el objetivo principal?", a: ["para mí", "el narrador"] },
        { q: "¿Por qué viaja a México?", a: ["por motivos de trabajo", "trabajo"] },
        { q: "¿Por cuánto tiempo estará allá?", a: ["por una semana", "una semana"] },
        { q: "¿Para qué solicitó una beca?", a: ["para estudiar una maestría", "estudiar"] },
        { q: "¿Para qué quiere mejorar sus habilidades?", a: ["para obtener un ascenso", "ascenso"] }
    ]
};

const ex4Options = [
    { text: "Yo _______ (trabajar) ayer mucho.", options: ["TRABAJÉ", "TRABAJABA", "TRABAJO"], answer: "TRABAJÉ" },
    { text: "Ella _______ (estudiar) cuando era niña.", options: ["ESTUDIÓ", "ESTUDIABA", "ESTUDIA"], answer: "ESTUDIABA" },
    { text: "Nosotros _______ (viajar) a España el año pasado.", options: ["VIAJAMOS", "VIAJÁBAMOS", "VIAJAMOS (PRE)"], answer: "VIAJAMOS" },
    { text: "Tú _______ (llegar) tarde hoy.", options: ["LLEGASTE", "LLEGABAS", "LLEGAS"], answer: "LLEGASTE" },
    { text: "Ellos _______ (aprender) mucho en el curso.", options: ["APRENDIERON", "APRENDÍAN", "APRENDEN"], answer: "APRENDIERON" },
    { text: "Él _______ (lograr) su meta ayer.", options: ["LOGRÓ", "LOGRABA", "LOGRA"], answer: "LOGRÓ" },
    { text: "Yo _______ (cambiar) de opinión hace un momento.", options: ["CAMBIÉ", "CAMBIABA", "CAMBIO"], answer: "CAMBIÉ" },
    { text: "Ustedes _______ (terminar) el proyecto a tiempo.", options: ["TERMINARON", "TERMINABAN", "TERMINAN"], answer: "TERMINARON" },
    { text: "Ella _______ (solicitar) la beca el viernes.", options: ["SOLICITÓ", "SOLICITABA", "SOLICITA"], answer: "SOLICITÓ" },
    { text: "Nosotros _______ (empezar) la reunión a las 9.", options: ["EMPEZAMOS", "EMPEZÁBAMOS", "EMPEZAMOS (PRE)"], answer: "EMPEZAMOS" },
    { text: "Yo _______ (ir) a la playa cada verano.", options: ["FUI", "IBA", "VOY"], answer: "IBA" },
    { text: "Tú _______ (hacer) la tarea anoche.", options: ["HICISTE", "HACÍAS", "HACES"], answer: "HICISTE" },
    { text: "Él _______ (tenia) un perro cuando era joven.", options: ["TUVO", "TENÍA", "TIENE"], answer: "TENÍA" },
    { text: "Nosotros _______ (ver) una película ayer.", options: ["VIMOS", "VEÍAMOS", "VEMOS"], answer: "VIMOS" },
    { text: "Ellos _______ (decir) la verdad en la entrevista.", options: ["DIJERON", "DECÍAN", "DICEN"], answer: "DIJERON" },
    { text: "Yo _______ (saber) la noticia ayer.", options: ["SUPE", "SABÍA", "SÉ"], answer: "SUPE" },
    { text: "Ella _______ (venir) a mi casa el domingo.", options: ["VINO", "VENÍA", "VIENE"], answer: "VINO" },
    { text: "Tú _______ (ser) muy bajo de niño.", options: ["FUISTE", "ERAS", "ERES"], answer: "ERAS" },
    { text: "Nosotros _______ (estar) en la oficina a las 8.", options: ["ESTUVIMOS", "ESTÁBAMOS", "ESTAMOS"], answer: "ESTUVIMOS" },
    { text: "Ellos _______ (dar) un regalo a su jefe.", options: ["DIERON", "DABAN", "DAN"], answer: "DIERON" },
];

const finalExBlanks = [
    { s: "1. Este libro es _______ ti.", a: "para" },
    { s: "2. Camino _______ el centro.", a: "por" },
    { s: "3. Estudio _______ ser doctor.", a: "para" },
    { s: "4. Estaré allí _______ dos días.", a: "por" },
    { s: "5. Gracias _______ la ayuda.", a: "por" },
    { s: "6. Salgo _______ Madrid ahora.", a: "para" },
    { s: "7. Lo envío _______ correo.", a: "por" },
    { s: "8. _______ mí, es muy tarde.", a: "para" },
    { s: "9. Se pelearon _______ un juguete.", a: "por" },
    { s: "10. La tarea es _______ el lunes.", a: "para" },
    { s: "11. Viajamos _______ avión.", a: "por" },
    { s: "12. Compré esto _______ mi madre.", a: "para" },
    { s: "13. Caminan _______ la playa.", a: "por" },
    { s: "14. Trabajo _______ ganar dinero.", a: "para" },
    { s: "15. Ella está feliz _______ la noticia.", a: "por" },
    { s: "16. El tren va _______ Sevilla.", a: "para" },
    { s: "17. Hablamos _______ la tarde.", a: "por" },
    { s: "18. Este vaso es _______ el agua.", a: "para" },
    { s: "19. Te lo cambio _______ tu reloj.", a: "por" },
    { s: "20. Salen _______ el parque.", a: "por" },
    { s: "21. Es un regalo _______ el jefe.", a: "para" },
    { s: "22. Lo busco _______ todas partes.", a: "por" },
    { s: "23. Necesito el informe _______ hoy.", a: "para" },
    { s: "24. Brindamos _______ tu éxito.", a: "por" },
    { s: "25. Es una beca _______ estudiar.", a: "para" },
    { s: "26. Entra _______ la ventana.", a: "por" },
    { s: "27. No tengo tiempo _______ eso.", a: "para" },
    { s: "28. Te llamó _______ teléfono.", a: "por" },
    { s: "29. _______ mi opinión, está mal.", a: "para" },
    { s: "30. Trabajamos _______ la misma meta.", a: "para" },
];

// --- HELPERS ---

const BallsExerciseInternal = ({ title, prompts, onComplete, vocabulary, type = 'translate', isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setUserAnswers({}); setStatus({}); }, [prompts]);
    useEffect(() => { if (!isSupervisionMode) { /* Keep typed text */ } }, [currentIndex, isSupervisionMode]);

    const currentPrompt = prompts[currentIndex];
    if (!currentPrompt) return null;

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const currentAnswer = userAnswers[currentIndex] || '';
        const userVal = currentAnswer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = currentPrompt.answer || [];
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className='text-primary uppercase font-black'>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>
                            {type === 'translate' ? 'Traduce la frase correctamente.' : 'Completa la frase correctamente.'}
                        </CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary scale-110" : "border-muted", status[i] === 'correct' ? "!bg-green-600 !text-white !border-green-600" : status[i] === 'incorrect' ? "!bg-red-600 !text-white !border-red-600" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0 text-foreground">
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulario
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (
                                            <Fragment key={es}>
                                                <span className="text-muted-foreground capitalize">{es}:</span>
                                                <span className="font-semibold text-right text-primary">{(en as string).toUpperCase()}</span>
                                            </Fragment>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {currentPrompt.spanish || currentPrompt.en}
                </div>
                <Input value={userAnswers[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; setUserAnswers({...userAnswers, [currentIndex]: e.target.value}); setStatus({...status, [currentIndex]: 'unchecked'}); }} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? '!border-green-500 !bg-green-50/10' : status[currentIndex] === 'incorrect' ? '!border-red-500 !bg-red-50/10' : '')} placeholder="Escribe aquí..." autoComplete="off" readOnly={isSupervisionMode} />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct' && !isAdmin} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ChoiceExercise = ({ prompts, onComplete, title, description, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleSelect = (option: string) => {
        if (isSupervisionMode) return;
        const isCorrect = option.toUpperCase() === prompts[currentIndex].answer.toUpperCase();
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Correcto!" });
        else toast({ variant: 'destructive', title: "Incorrecto" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="text-left">
                    <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>{description || "Elige la opción correcta."}</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-black text-center leading-relaxed text-foreground">
                    {prompts[currentIndex].text.split('_______').map((part: string, i: number) => (
                        <Fragment key={i}>
                            {part}
                            {i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", status[currentIndex] === 'correct' ? "text-primary border-primary" : "text-muted-foreground")}>{status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}</span>}
                        </Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", status[currentIndex] === 'correct' && opt === prompts[currentIndex].answer && "border-green-500 bg-green-50 text-green-700 scale-105")} disabled={isSupervisionMode}>{opt}</Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct' && !isAdmin} className="px-12 font-black h-12 shadow-xl">Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

function PorParaContentInternal() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    const hasInitialized = useRef(false);
    const lastSerializedRef = useRef<string>('');

    // Form states
    const [vocabAns, setVocabAns] = useState<string[]>(Array(workVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(workVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(10).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(10).fill('unchecked'));

    const [readAns, setReadAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readVal, setReadVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

    const [finalAns, setFinalAns] = useState<string[]>(Array(finalExBlanks.length).fill(''));
    const [finalVal, setFinalVal] = useState<any[]>(Array(finalExBlanks.length).fill('unchecked'));

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: Briefcase, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2', icon: MessageSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
        { key: 'final_ex', name: '10. Ejercicio Final', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;

        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        
        if (isAdmin && !targetStudentId) {
            path.forEach(t => t.status = 'completed');
        } else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) {
                if (lastDone && path[i].status === 'locked') path[i].status = 'active';
                lastDone = path[i].status === 'completed';
            }
        }

        setLearningPath(path);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        if (d.vocabAns) setVocabAns(d.vocabAns);
        if (d.finalAns) setFinalAns(d.finalAns);

        setInitialLoadComplete(true);
        hasInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        
        const currentSerialized = JSON.stringify({ 
            lastSelectedTopic: selectedTopic, 
            p: learningPath.map(t => t.status),
            v: vocabAns,
            f: finalAns
        });

        if (currentSerialized === lastSerializedRef.current) return;

        const saveTimer = setTimeout(() => {
            const s: any = { 
                lastSelectedTopic: selectedTopic,
                vocabAns,
                finalAns
            };
            learningPath.forEach(item => { s[item.key] = item.status; });
            
            lastSerializedRef.current = currentSerialized;
            
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
            if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
        }, 2000);

        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAns, finalAns]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            const np = curr.map(t => ({ ...t }));
            const idx = np.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && np[idx].status !== 'completed') {
                np[idx].status = 'completed';
                if (idx + 1 < np.length && np[idx + 1].status === 'locked') {
                    np[idx + 1].status = 'active';
                    setSelectedTopic(np[idx + 1].key);
                    setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const t = learningPath.find(it => it.key === key);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(key);
        if (key === 'grammar') handleTopicCompleteInternal(key);
    };

    const handleTopicCompleteInternal = (key: string) => setTopicToComplete(key);

    const handleVocabCheck = () => {
        let allOk = true;
        const nv = workVocab.map((v, i) => {
            const res = v.es.toUpperCase() === (vocabAns[i] || '').trim().toUpperCase();
            if (!res) allOk = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (allOk) { setCanAdvanceVocab(true); toast({ title: "¡Vocabulario Completo!" }); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckConj = () => {
        const v = conjVerbs[conjIdx];
        const corrects = [...v.imp, ...v.pre];
        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjVerbs.length - 1) { setTimeout(() => { setConjIdx(p => p+1); setConjAns(Array(10).fill('')); setConjVal(Array(10).fill('unchecked')); }, 800); }
            else handleTopicCompleteInternal('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const handleCheckReading = () => {
        let ok = true; const nv = readingData.questions.map((q, i) => {
            const res = q.a.some(a => (readAns[i] || '').trim().toLowerCase().includes(a.toLowerCase()));
            if (!res) ok = false; return res ? 'correct' : 'incorrect';
        });
        setReadVal(nv); if (ok) handleTopicCompleteInternal('reading');
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckFinal = () => {
        let ok = true; const nv = finalExBlanks.map((q, i) => {
            const res = q.a.toLowerCase() === (finalAns[i] || '').trim().toLowerCase();
            if (!res) ok = false; return res ? 'correct' : 'incorrect';
        });
        setFinalVal(nv); if (ok) handleTopicCompleteInternal('final_ex');
        else toast({ variant: 'destructive', title: "Hay errores en la lista" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Trabajo, Estudios y Viajes (20)</CardTitle><CardDescription className='font-bold text-foreground'>Escribe la palabra en español.</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {workVocab.map((v, i) => (
                                <Fragment key={i}><div className="flex items-center font-bold py-1 text-sm">{v.en}</div><Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nvv = [...vocabVal]; nvv[i] = 'unchecked'; setVocabVal(nvv); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase text-foreground", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2 h-4 w-4'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMÁTICA: POR VS PARA</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                    <h3 className="text-2xl font-black text-primary uppercase border-b pb-2">PARA</h3>
                                    <ul className="space-y-2 text-lg">
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-primary rounded-full"/> Finalidad (Propósito)</li>
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-primary rounded-full"/> Destinatario</li>
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-primary rounded-full"/> Fecha límite</li>
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-primary rounded-full"/> Opinión</li>
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-primary rounded-full"/> Dirección</li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                    <h3 className="text-2xl font-black text-brand-purple uppercase border-b pb-2">POR</h3>
                                    <ul className="space-y-2 text-lg">
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-brand-purple rounded-full"/> Causa (Motivo)</li>
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-brand-purple rounded-full"/> Duración</li>
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-brand-purple rounded-full"/> Intercambio</li>
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-brand-purple rounded-full"/> Medio</li>
                                        <li className="flex items-center gap-2"><div className="h-2 w-2 bg-brand-purple rounded-full"/> Lugar de paso</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Doble Pasado ({conjIdx+1}/10)</CardTitle><CardDescription>Conjuga el verbo en Imperfecto y Pasado Simple.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="p-6 bg-muted rounded-2xl border-2 border-dashed text-center"><h3 className="text-4xl font-black text-primary uppercase">{v.v}</h3></div>
                            <div className='grid md:grid-cols-2 gap-8'>
                                <div className='space-y-4'>
                                    <h4 className='font-black text-primary uppercase text-sm border-b pb-1'>Imperfecto (aba/ía)</h4>
                                    {["YO", "TÚ", "ÉL", "NOSOTROS", "ELLOS"].map((p, i) => (
                                        <div key={i} className='space-y-1'><Label className='text-[10px] font-black'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("uppercase text-foreground", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                    ))}
                                </div>
                                <div className='space-y-4'>
                                    <h4 className='font-black text-brand-purple uppercase text-sm border-b pb-1'>Pasado Simple (é/í)</h4>
                                    {["YO", "TÚ", "ÉL", "NOSOTROS", "ELLOS"].map((p, i) => (
                                        <div key={i+5} className='space-y-1'><Label className='text-[10px] font-black'>{p}</Label><Input value={conjAns[i+5] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i+5] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i+5] = 'unchecked'; setConjVal(nv); }} className={cn("uppercase text-foreground", conjVal[i+5] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i+5] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExerciseInternal title="Ejercicio 1: Completar con POR/PARA" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} type="complete" vocabulary={{ "regalo": "present/gift", "aprender": "to learn", "paso": "passing through", "amor": "love", "mañana": "tomorrow", "dirección": "direction" }} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <BallsExerciseInternal title="Ejercicio 2: Conversación" prompts={ex2Prompts} onComplete={() => handleTopicCompleteInternal('exercise_2')} vocabulary={{ "ascenso": "promotion", "empresa": "company", "beca": "scholarship", "metas": "goals", "familia": "family" }} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={workVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Memory Game" />;
            case 'exercise_3': return <BallsExerciseInternal title="Ejercicio 3: Traducción General (15)" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('exercise_3')} vocabulary={{ "universidad": "university", "hermano": "brother", "ciudad": "city", "dólares": "dollars", "reunión": "meeting", "correo": "email", "salud": "health", "examen": "exam" }} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border border-border/50 text-foreground">
                                        <Label className="font-bold">{q.q}</Label>
                                        <Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...readAns]; na[i] = e.target.value; setReadAns(na); const nv = [...readVal]; nv[i] = 'unchecked'; setReadVal(nv); }} className={cn("h-10 text-foreground", readVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4': return <ChoiceExercise title="Ejercicio 4: Opción Múltiple" prompts={ex4Options} onComplete={() => handleTopicCompleteInternal('exercise_4')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'final_ex':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Ejercicio Final: Completar (30)</CardTitle></CardHeader>
                        <CardContent className="p-0 text-foreground">
                            <ScrollArea className="h-[500px] p-6 text-foreground">
                                <div className="space-y-4">
                                    {finalExBlanks.map((q, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                            <p className="font-bold text-lg text-foreground">{q.s}</p>
                                            <Input value={finalAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...finalAns]; na[i] = e.target.value; setFinalAns(na); const nv = [...finalVal]; nv[i] = 'unchecked'; setFinalVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase text-foreground", finalVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : finalVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckFinal} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/b1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso B1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Zap className='h-10 w-10 text-primary' /> Por vs Para 🇪🇸 (B1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2 text-foreground"><Trophy className="h-5 w-5 text-primary" /> Misión B1</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG[item.status] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">{(item.status === 'completed') ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-foreground">{item.name}</span></div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Clase</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PorParaPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <PorParaContentInternal />
        </Suspense>
    );
}