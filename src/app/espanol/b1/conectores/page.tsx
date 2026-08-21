'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
    MessageSquare,
    Link as LinkIcon,
    Activity,
    ListChecks,
    Check,
    X,
    Info,
    Globe,
    ChevronDown
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
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_b1_conectores_v6_suspense_fix';
const mainProgressKey = 'progress_b1_es_conectores';

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const opinonVocab = [
    { en: "SOCIETY", es: "SOCIEDAD" }, { en: "EDUCATION", es: "EDUCACIÓN" }, { en: "WORK", es: "TRABAJO" },
    { en: "TECHNOLOGY", es: "TECNOLOGÍA" }, { en: "SOCIAL PROBLEMS", es: "PROBLEMAS SOCIALES" }, { en: "NEWS", es: "NOTICIAS" },
    { en: "ENVIRONMENT", es: "MEDIO AMBIENTE" }, { en: "ECONOMY", es: "ECONOMÍA" }, { en: "POLITICS", es: "POLÍTICA" },
    { en: "HEALTH", es: "SALUD" }, { en: "POVERTY", es: "POBREZA" }, { en: "UNEMPLOYMENT", es: "DESEMPLEO" },
    { en: "INNOVATION", es: "INNOVACIÓN" }, { en: "GLOBALIZATION", es: "GLOBALIZACIÓN" }, { en: "DEVELOPMENT", es: "DESARROLLO" },
    { en: "CRIME", es: "CRIMEN" }, { en: "JUSTICE", es: "JUSTICIA" }, { en: "FREEDOM", es: "LIBERTAD" },
    { en: "OPINION", es: "OPINIÓN" }, { en: "GOVERNMENT", es: "GOBIERNO" }, { en: "CITIZEN", es: "CIUDADANO" },
    { en: "CULTURE", es: "CULTURA" }
];

const connectorsData = [
    { name: "ADEMÁS", usage: "Añadir información.", example: "Estudio español; además, trabajo en una oficina." },
    { name: "SIN EMBARGO", usage: "Contraste u oposición.", example: "Tengo sueño; sin embargo, debo terminar la tarea." },
    { name: "AUNQUE", usage: "Concesión (aunque pase algo).", example: "Voy a salir aunque esté lloviendo." },
    { name: "POR ESO", usage: "Causa y efecto.", example: "No estudió; por eso reprobó el examen." },
    { name: "POR LO TANTO", usage: "Consecuencia formal.", example: "La empresa creció; por lo tanto, contratamos más personal." },
    { name: "EN CAMBIO", usage: "Contraste directo.", example: "A mí me gusta el té; en cambio, a él le gusta el café." },
    { name: "MIENTRAS", usage: "Acciones simultáneas.", example: "Ella cocina mientras yo limpio la mesa." },
    { name: "FINALMENTE", usage: "Orden o conclusión.", example: "Finalmente, servimos la cena." },
    { name: "POR OTRA PARTE", usage: "Añadir otro punto de vista.", example: "Es caro; por otra parte, es de excelente calidad." },
    { name: "ASÍ QUE", usage: "Consecuencia informal.", example: "Tenía hambre, así que comí un sándwich." },
    { name: "PERO", usage: "Oposición básica.", example: "Quiero ir, pero no tengo dinero." },
    { name: "PORQUE", usage: "Explicar la razón.", example: "Llegó tarde porque había mucho tráfico." },
];

const imperativeVerbs = [
    { en: "SPEAK", es: "habla", forms: ["habla", "hable", "hablemos", "hablen"] },
    { en: "EAT", es: "come", forms: ["come", "coma", "comamos", "coman"] },
    { en: "RUN", es: "corre", forms: ["corre", "corra", "corramos", "corran"] },
    { en: "CLEAN", es: "limpia", forms: ["limpia", "limpie", "limpiemos", "limpien"] },
    { en: "STUDY", es: "estudia", forms: ["estudia", "estudie", "estudiemos", "estudien"] },
    { en: "WORK", es: "trabaja", forms: ["trabaja", "trabaje", "trabajemos", "trabajen"] },
    { en: "GO", es: "ve", forms: ["ve", "vaya", "vayamos", "vayan"] },
    { en: "DO", es: "haz", forms: ["haz", "haga", "hagamos", "hagan"] },
    { en: "SAY", es: "di", forms: ["di", "diga", "digamos", "digan"] },
    { en: "LISTEN", es: "escucha", forms: ["escucha", "escuche", "escuchemos", "escuchen"] },
    { en: "DRINK", es: "bebe", forms: ["bebe", "beba", "bebamos", "beban"] },
    { en: "READ", es: "lee", forms: ["lee", "lea", "leamos", "lean"] },
    { en: "WRITE", es: "escribe", forms: ["escribe", "escriba", "escribamos", "escriban"] },
    { en: "COME", es: "ven", forms: ["ven", "venga", "vengamos", "vengan"] },
    { en: "BRING", es: "trae", forms: ["trae", "traiga", "traigamos", "traigan"] },
    { en: "LOOK", es: "mira", forms: ["mira", "mire", "miremos", "miren"] },
    { en: "TAKE", es: "toma", forms: ["toma", "tome", "tomemos", "tomen"] },
    { en: "OPEN", es: "abre", forms: ["abre", "abra", "abramos", "abran"] },
    { en: "CLOSE", es: "cierra", forms: ["cierra", "cierre", "cerremos", "cierran"] },
    { en: "PLAY", es: "juega", forms: ["juega", "juegue", "juguemos", "jueguen"] },
];

const ex1Prompts = [
    { en: "I study a lot, besides I work.", answer: ["estudio mucho además trabajo", "yo estudio mucho, ademas trabajo"] },
    { en: "She is tired, however she continues.", answer: ["ella esta cansada sin embargo ella continua", "ella está cansada, sin embargo continúa"] },
    { en: "I will go even though it's raining.", answer: ["yo iré aunque esté lloviendo" , "yo ire aunque este lloviendo"] },
    { en: "He didn't study, therefore he failed.", answer: ["él no estudió por eso reprobó" , "el no estudio por eso reprobo"] },
    { en: "They are happy because they won.", answer: ["ellos están felices porque ganaron"] },
    { en: "I like tea; on the other hand, he likes coffee.", answer: ["me gusta el té en cambio a él le gusta el café", "me gusta el te, en cambio a el le gusta el cafe"] },
    { en: "She cooks while I read.", answer: ["ella cocina mientras yo leo"] },
    { en: "Finally, we are home.", answer: ["finalmente estamos en casa" , "finalmente nosotros estamos en casa"] },
];

const ex2TextParts = [
    "La tecnología es muy importancia en la sociedad actual. ",
    " (Además/Sin embargo), ofrece muchas herramientas para la educación. ",
    " (Aunque/Por eso), muchos estudiantes prefieren estudiar en línea. ",
    " (Mientras/Finalmente), los problemas sociales como la pobreza persisten. ",
    " (Sin embargo/Además), los gobiernos trabajan para mejorar la economía. ",
    " (Finalmente/Pero), todos queremos un futuro mejor."
];
const ex2CorrectAnswersData = ["ADEMÁS", "POR ESO", "SIN EMBARGO", "ADEMÁS", "FINALMENTE"];

const ex3Paragraphs = [
    { id: 1, text: "En primer lugar, la educación es la base del desarrollo de cualquier nación." },
    { id: 2, text: "Además, permite que los ciudadanos tengan mejores oportunidades de trabajo." },
    { id: 3, text: "Sin embargo, en muchos países el acceso a la tecnología es limitado." },
    { id: 4, text: "Por lo tanto, es necesario que los gobiernos inviertan más en infraestructura digital." },
    { id: 5, text: "Finalmente, una sociedad educada es una sociedad más justa y libre." },
];

const readingData = {
    title: "El Impacto de las Noticias en la Sociedad",
    content: "Hoy en día, las noticias viajan muy rápido gracias a la tecnología. Además, tenemos acceso a información de todo el mundo en tiempo real. Sin embargo, no siempre todas las noticias son verdaderas. Por eso, es importante que el ciudadano aprenda a analizar lo que lee. Mientras navegamos por internet, debemos ser críticos. Aunque la globalización nos conecta, también puede traer confusión. Finalmente, una sociedad informada toma mejores decisiones para su desarrollo.",
    questions: [
        { id: 'q1', q: "¿Por qué viajan rápido las noticias?", a: ["gracias a la tecnología", "tecnología"] },
        { id: 'q2', q: "¿Qué problema menciona sobre las noticias?", a: ["no siempre son verdaderas", "no son verdaderas"] },
        { id: 'q3', q: "¿Qué debe hacer el ciudadano?", a: ["aprender a analizar lo que lee", "analizar lo que lee"] },
        { id: 'q4', q: "¿Qué sucede mientras navegamos por internet?", a: ["debemos ser críticos", "ser críticos"] }
    ]
};

const completarPrompts = [
    { s: "1. No tengo hambre, _______ comeré un poco.", a: "aunque" },
    { s: "2. Estudió mucho; _______, aprobó el examen.", a: "por eso" },
    { s: "3. Me gusta el verano; _______, prefiero el invierno.", a: "sin embargo" },
    { s: "4. Escucho música _______ trabajo.", a: "mientras" },
    { s: "5. _______, quiero agradecer a todos.", a: "finalmente" },
    { s: "6. Ella es inteligente; _______, es muy simpática.", a: "además" },
    { s: "7. Hay tráfico, _______ llegaré tarde.", a: "así que" },
    { s: "8. No fui a la fiesta _______ estaba enfermo.", a: "porque" },
    { s: "9. Juan es alto; _______, su hermano es bajo.", a: "en cambio" },
    { s: "10. Llueve; _______, iré al parque.", a: "aunque" },
    { s: "11. Ganó la lotería; _______, se compró un carro.", a: "por lo tanto" },
    { s: "12. Te llamaré _______ llegue a casa.", a: "tan pronto como" },
    { s: "13. No quiero pizza _______ prefiero pasta.", a: "sino que" },
    { s: "14. Es tarde, _______ debemos dormir.", a: "por eso" },
    { s: "15. Ella canta _______ él toca el piano.", a: "mientras" },
    { s: "16. _______ terminamos el proyecto.", a: "finalmente" },
    { s: "17. Es caro; _______, es muy bueno.", a: "sin embargo" },
    { s: "18. Me gusta el cine; _______, prefiero el teatro.", a: "en cambio" },
    { s: "19. No vino _______ no quería.", a: "porque" },
    { s: "20. Tengo tiempo, _______ te ayudaré.", a: "así que" },
    { s: "21. _______ esté cansado, iré al gimnasio.", a: "aunque" },
    { s: "22. Él es médico; _______, trabaja mucho.", a: "además" },
    { s: "23. No hay luz, _______ no hay internet.", a: "por lo tanto" },
    { s: "24. Compró pan _______ leche.", a: "además de" },
    { s: "25. Salió temprano _______ llegó tarde.", a: "pero" },
    { s: "26. Yo estudio _______ tú duermes.", a: "mientras" },
    { s: "27. Es mi amigo; _______, no confío en él.", a: "sin embargo" },
    { s: "28. Hice ejercicio; _______, me siento bien.", a: "por eso" },
    { s: "29. Comimos pizza _______ vimos una película.", a: "y luego" },
    { s: "30. _______, la clase terminó.", a: "finalmente" },
];

const connectorsBank = ["aunque", "por eso", "sin embargo", "mientras", "finalmente", "además", "así que", "porque", "en cambio", "por lo tanto", "tan pronto como", "sino que", "además de", "pero", "y luego"];

const translationTextEng = "Communication is essential in our society. Besides, it helps in education and work. However, social problems such as poverty and unemployment still exist. Therefore, governments must focus on innovation and development to improve the quality of life for every citizen.";

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex].answer;
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
                        <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente al español.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0 text-foreground">
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex].en}
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

// --- MAIN PAGE ---

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

function ConectoresContentInternal() {
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

    // Form states
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(opinonVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(opinonVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(4).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(4).fill('unchecked'));

    const [ex2Answers, setEx2Answers] = useState<string[]>(Array(ex2CorrectAnswersData.length).fill(''));
    const [ex2Val, setEx2Val] = useState<any[]>(Array(ex2CorrectAnswersData.length).fill('unchecked'));

    const [orderingItems, setOrderingItems] = useState([...ex3Paragraphs]);

    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));

    const [transText, setTransText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2', icon: Pencil, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3', icon: ListChecks, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'complete', name: '9. Completar', icon: ListChecks, status: 'locked' },
        { key: 'translate', name: '10. Traducir Texto', icon: MessageSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;

        let path = initialLearningPath.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
        }

        setLearningPath(path);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.transText) setTransText(d.transText);
        setInitialLoadComplete(true); hasInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, transText };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
            if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
        }, 2000);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAnswers, transText]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(current => {
            const np = current.map(t => ({ ...t }));
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active';
                    setSelectedTopic(np[i + 1].key);
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

    const handleTopicCompleteInternal = (completedKey: string) => setTopicToComplete(completedKey);

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = opinonVocab.map((v, i) => {
            const res = v.es.toUpperCase() === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) allOk = false; return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (allOk) { setCanAdvanceVocab(true); toast({ title: "¡Perfecto!" }); }
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleCheckConj = () => {
        const v = imperativeVerbs[conjIdx];
        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === v.forms[i] ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < imperativeVerbs.length - 1) { setTimeout(() => { setConjIdx(p => p + 1); setConjAns(Array(4).fill('')); setConjVal(Array(4).fill('unchecked')); }, 800); }
            else handleTopicCompleteInternal('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...orderingItems];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newItems.length) return;
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        setOrderingItems(newItems);
    };

    const handleCheckReading = () => {
        let ok = true; const nv: any = {};
        readingData.questions.forEach(q => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const res = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = res ? 'correct' : 'incorrect'; if (!res) ok = false;
        });
        setReadVal(nv); if (ok) handleTopicCompleteInternal('reading');
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle className="uppercase font-black text-primary">Vocabulario: Opinión y Actualidad (22)</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el significado en español para cada término.</CardDescription></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4 text-foreground text-left">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                                    {opinonVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("uppercase text-foreground", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2 h-4 w-4' /></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMÁTICA: CONECTORES</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <p className="text-lg leading-relaxed text-foreground">Los conectores son palabras que unen ideas. Son esenciales para la fluidez y coherencia en español.</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-foreground">
                                {connectorsData.map((c, i) => (
                                    <div key={i} className='p-4 bg-card rounded-xl border border-border shadow-sm text-foreground'>
                                        <h4 className='text-primary font-black uppercase text-sm mb-1'>{c.name}</h4>
                                        <p className='text-xs text-muted-foreground mb-2'>{c.usage}</p>
                                        <p className='text-xs italic'>"{c.example}"</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 uppercase tracking-widest shadow-xl">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const verb = imperativeVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Imperativo ({conjIdx + 1}/20)</CardTitle><CardDescription className='text-foreground'>Conjuga el verbo en su forma imperativa afirmativa.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center text-foreground"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{verb.en}</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl text-foreground'>
                                {["TÚ", "USTED", "NOSOTROS", "USTEDES"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i]} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase transition-all", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={{ "besides": "además", "however": "sin embargo", "failed": "reprobó", "won": "ganaron" }} />;
            case 'exercise_2':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase font-black'>Ejercicio 2: Texto con Espacios</CardTitle><div className='flex flex-wrap gap-2 pt-2'>{ex2CorrectAnswersData.map((w, i) => <span key={`${w}-${i}`} className='px-2 py-1 bg-primary/10 text-primary font-black rounded border text-xs'>{w}</span>)}</div></CardHeader>
                        <CardContent className="space-y-4 pt-4 text-lg leading-relaxed font-medium">
                            <p className='whitespace-pre-wrap text-foreground'>
                                {ex2TextParts.map((part, i) => (
                                    <Fragment key={i}>
                                        {part}
                                        {i < ex2CorrectAnswersData.length && (
                                            <Input value={ex2Answers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...ex2Answers]; na[i] = e.target.value; setEx2Answers(na); const nv = [...ex2Val]; nv[i] = 'unchecked'; setEx2Val(nv); }} className={cn("inline-block w-32 h-8 text-center uppercase font-bold text-foreground transition-all", ex2Val[i] === 'correct' ? "border-green-500 bg-green-50/10" : ex2Val[i] === 'incorrect' ? "border-red-500 bg-red-50/10" : "border-primary/40")} autoComplete="off" readOnly={!!targetStudentId} />
                                        )}
                                    </Fragment>
                                ))}
                            </p>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => {
                            let ok = true; const nv = ex2Answers.map((a, i) => { const res = a.trim().toUpperCase() === ex2CorrectAnswersData[i]; if (!res) ok = false; return res ? 'correct' : 'incorrect'; });
                            setEx2Val(nv); if (ok) handleTopicCompleteInternal('exercise_2'); else toast({ variant: 'destructive', title: "Revisa el texto" });
                        }} size="lg" className="px-12 font-bold">Verificar Texto</Button></CardFooter>
                    </Card>
                );
            case 'vocab_game': return <VocabularyMatchingGame data={opinonVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Memory Game: Conectores" />;
            case 'exercise_3':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase font-black'>Ejercicio 3: Ordenar Párrafo</CardTitle><CardDescription className='text-foreground'>Reorganiza las partes para formar un texto coherente sobre educación.</CardDescription></CardHeader>
                        <CardContent className="space-y-3">
                            {orderingItems.map((item, index) => (
                                <div key={item.id} className="p-4 border rounded-xl bg-muted/20 flex items-center justify-between gap-4">
                                    <span className="flex-1 font-medium text-foreground">{item.text}</span>
                                    <div className="flex flex-col gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => moveItem(index, 'up')} disabled={index === 0} className='h-8 w-8'><ChevronDown className='rotate-180 h-4 w-4' /></Button>
                                        <Button size="icon" variant="ghost" onClick={() => moveItem(index, 'down')} disabled={index === orderingItems.length - 1} className='h-8 w-8'><ChevronDown className='h-4 w-4' /></Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => {
                            const isOk = orderingItems.every((item, i) => item.id === ex3Paragraphs[i].id);
                            if (isOk) { toast({ title: "¡Orden Perfecto!" }); handleTopicCompleteInternal('exercise_3'); }
                            else toast({ variant: 'destructive', title: "El orden no es correcto" });
                        }} size="lg" className="px-12 font-bold">Verificar Orden</Button></CardFooter>
                    </Card>
                );
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase font-black'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4 text-foreground">{readingData.questions.map((q, i) => (
                                <div key={q.id} className="space-y-2"><Label className='font-bold text-foreground'>{i + 1}. {q.q}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({ ...readAns, [q.id]: e.target.value }); setReadVal({ ...readVal, [q.id]: 'unchecked' }); }} className={cn('mt-1 text-lg h-12', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <CardTitle className='text-foreground dark:text-primary uppercase tracking-tighter font-black'>Completar: Conectores (30)</CardTitle>
                            <CardDescription className='text-foreground'>Utiliza los conectores del banco para completar las frases.</CardDescription>
                            <div className='flex flex-wrap gap-1.5 mt-4 p-4 bg-primary/5 rounded-xl border border-dashed border-primary/30'>
                                {connectorsBank.map((c, i) => <span key={i} className='px-2 py-1 bg-white/50 border rounded-md text-[10px] font-black text-primary uppercase'>{c}</span>)}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg text-foreground">{q.s}</p>
                                    <Input value={compAns[i]} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase text-foreground", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => {
                            let all = true; const nv = completarPrompts.map((q, i) => { const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase(); if (!res) all = false; return res ? 'correct' : 'incorrect'; });
                            setCompVal(nv); if (all) { toast({ title: "¡Dominio Total!" }); handleTopicCompleteInternal('complete'); } else toast({ variant: 'destructive', title: "Hay errores en la lista" });
                        }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase font-black'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div><Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-foreground">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {Object.entries({ "besides": "además", "however": "sin embargo", "unemployment": "desempleo", "innovation": "innovación", "challenge": "desafío", "achieve": "lograr" }).map(([en, es], i) => (
                                            <div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"{translationTextEng}"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[250px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicCompleteInternal('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Finalizar Clase <CheckCircle className='ml-3 h-8 w-8' /></Button></CardFooter>
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
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar Supervisión</Link>
                            </Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/b1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso B1
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <LinkIcon className='h-10 w-10 text-primary' /> Conectores 🇪🇸 (B1)
                        </h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" /> Misión B1
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const Icon = ICONS_CONFIG[item.status] || BookOpen;
                                                const isActive = item.status === 'active';
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn(
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                            isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm',
                                                            isActive && !isAdmin && "animate-pulse-glow"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {item.status === 'completed' ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />
                                                            )}
                                                            <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-foreground">{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground text-foreground">
                                            <span>Avance Clase</span>
                                            <span className="text-primary">{progressValue}%</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2 rounded-full" />
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

export default function ConectoresPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <ConectoresContentInternal />
        </Suspense>
    );
}