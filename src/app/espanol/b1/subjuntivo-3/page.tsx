'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    BookText,
    Pencil,
    GraduationCap,
    Star,
    ArrowLeft,
    CheckCircle2,
    Zap,
    Target,
    ListChecks,
    MessageSquare,
    Info,
    Check,
    X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DashboardHeader } from '@/components/dashboard/header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_b1_subj_3_v11_fixed_refs';
const mainProgressKey = 'progress_b1_es_subjuntivo_3';

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const goalsVocab = [
    { en: "GOAL / TARGET", es: "OBJETIVO" },
    { en: "PROJECT", es: "PROYECTO" },
    { en: "GOAL / MILESTONE", es: "META" },
    { en: "SOLUTION", es: "SOLUCIÓN" },
    { en: "PURPOSE", es: "PROPÓSITO" },
    { en: "WORK / JOB", es: "TRABAJO" },
    { en: "STUDIES", es: "ESTUDIOS" },
    { en: "ENVIRONMENT", es: "MEDIO AMBIENTE" },
    { en: "TECHNOLOGY", es: "TECNOLOGÍA" },
    { en: "FUTURE", es: "FUTURO" },
    { en: "SOCIETY", es: "SOCIEDAD" },
    { en: "OPPORTUNITY", es: "OPORTUNIDAD" },
    { en: "DECISION", es: "DECISIÓN" },
    { en: "CHALLENGE", es: "DESAFÍO" },
    { en: "SUCCESS", es: "ÉXITO" },
    { en: "GROWTH", es: "CRECIMIENTO" },
    { en: "DEVELOPMENT", es: "DESARROLLO" },
    { en: "KNOWLEDGE", es: "CONOCIMIENTO" },
    { en: "RESOURCES", es: "RECURSOS" },
    { en: "ACHIEVEMENT", es: "LOGRO" },
    { en: "IMPROVEMENT", es: "MEJORA" }
];

const conjugationVerbs = [
    { v: "HABLAR", forms: ["hable", "hables", "hable", "hablemos", "hablen"] },
    { v: "COMER", forms: ["coma", "comas", "coma", "comamos", "coman"] },
    { v: "VIVIR", forms: ["viva", "vivas", "viva", "vivamos", "vivan"] },
    { v: "ESTUDIAR", forms: ["estudie", "estudies", "estudie", "estudiemos", "estudien"] },
    { v: "TRABAJAR", forms: ["trabaje", "trabajes", "trabaje", "trabajemos", "trabajen"] },
    { v: "TERMINAR", forms: ["termine", "termines", "termine", "terminemos", "terminen"] },
    { v: "LOGRAR", forms: ["logre", "logres", "logre", "logremos", "logren"] },
    { v: "MEJORAR", forms: ["mejore", "mejores", "mejore", "mejoremos", "mejoren"] },
    { v: "PENSAR", forms: ["piense", "pienses", "piense", "pensemos", "piensen"] },
    { v: "PODER", forms: ["pueda", "puedas", "pueda", "podamos", "puedan"] },
    { v: "HACER", forms: ["haga", "hagas", "haga", "hagamos", "hagan"] },
    { v: "DECIR", forms: ["diga", "digas", "diga", "digamos", "digan"] },
    { v: "VENIR", forms: ["venga", "vengas", "venga", "vengamos", "vengan"] },
    { v: "TENER", forms: ["tenga", "tengas", "tenga", "tengamos", "tengan"] },
    { v: "CONOCER", forms: ["conozca", "conozcas", "conozca", "conozcamos", "conozcan"] },
    { v: "IR", forms: ["vaya", "vayas", "vaya", "vayamos", "vayan"] },
    { v: "SABER", forms: ["sepa", "sepas", "sepa", "sepamos", "sepan"] },
    { v: "SER", forms: ["sea", "seas", "sea", "seamos", "sean"] },
    { v: "VER", forms: ["vea", "veas", "vea", "veamos", "vean"] },
    { v: "PEDIR", forms: ["pida", "pidas", "pida", "pidamos", "pidan"] },
];

const ex1Prompts = [
    { en: "I study so that you learn.", answer: ["estudio para que aprendas", "yo estudio para que aprendas"] },
    { en: "They work so that we can travel.", answer: ["trabajan para que podamos viajar", "ellos trabajan para que podamos viajar"] },
    { en: "She saves money so that her son studies.", answer: ["ahorra dinero para que su hijo estudie", "ella ahorra dinero para que su hijo estudie"] },
    { en: "We call so that they know.", answer: ["llamamos para que sepan", "nosotros llamamos para que ellos sepan"] },
    { en: "He explains so that you understand.", answer: ["él explica para que entiendas", "explica para que comprendas"] },
    { en: "I help you so that you finish early.", answer: ["te ayudo para que termines temprano"] },
    { en: "They speak loudly so that everyone hears.", answer: ["hablan fuerte para que todos oigan"] },
    { en: "She cooks so that we eat healthy.", answer: ["cocina para que comamos saludable"] },
    { en: "We write so that you remember.", answer: ["escribimos para que recuerdes"] },
    { en: "You study so that you have a better future.", answer: ["estudias para que tengas un mejor futuro"] },
    { en: "They practice so that they win.", answer: ["practican para que ganen"] },
    { en: "I clean so that the house is beautiful.", answer: ["limpio para que la casa esté hermosa"] }
];

const ex1Vocab = { "aprender": "learn", "ahorrar": "save", "hijo": "son", "saber": "know", "explicar": "explain", "temprano": "early", "oír": "hear", "saludable": "healthy", "ganar": "win", "mejor": "better", "limpiar": "clean" };

const ex2Prompts = [
    { en: "When you arrive, call me.", answer: ["cuando llegues llámame", "cuando llegues llamame"] },
    { en: "When she finishes, she will eat.", answer: ["cuando termine comerá", "cuando ella termine comerá"] },
    { en: "When they have time, they will go.", answer: ["cuando tengan tiempo irán"] },
    { en: "When we see the result, we will know.", answer: ["cuando veamos el resultado sabremos"] },
    { en: "When you speak with him, tell the truth.", answer: ["cuando hables con él di la verdad"] },
    { en: "When he comes back, we will talk.", answer: ["cuando vuelva hablaremos"] },
    { en: "When the project is ready, I will show it.", answer: ["cuando el proyecto esté listo lo mostraré"] },
    { en: "When you buy the car, take me.", answer: ["cuando compres el carro llévame"] },
    { en: "When they sleep, be quiet.", answer: ["cuando duerman haz silencio"] },
    { en: "When I can, I will help you.", answer: ["cuando pueda te ayudaré"] },
    { en: "When the sun shines, it will be hot.", answer: ["cuando el sol brille hará calor"] },
    { en: "When you read this, smile.", answer: ["cuando leas esto sonríe"] }
];

const ex2Vocab = { "llegar": "arrive", "terminar": "finish", "comer": "eat", "tiempo": "time", "decir la verdad": "tell the truth", "vuelva": "come back", "listo": "ready", "carro": "car", "dormir": "sleep", "ayudar": "help", "brillar": "shine", "leer": "read", "sonreír": "smile" };

const ex3Prompts = [
    { en: "Although it rains, I will go.", answer: ["aunque llueva iré"] },
    { en: "Even if he is tired, he will work.", answer: ["aunque esté cansado trabajará"] },
    { en: "Although she doesn't want to, she will study.", answer: ["aunque no quiera estudiará"] },
    { en: "Even if we don't have money, we will travel.", answer: ["aunque no tengamos dinero viajaremos"] },
    { en: "Although they speak fast, I understand them.", answer: ["aunque hablen rápido los entiendo"] },
    { en: "Even if you say no, I will do it.", answer: ["aunque digas que no lo haré"] },
    { en: "Although the project is difficult, we will finish it.", answer: ["aunque el proyecto sea difícil lo terminaremos"] },
    { en: "Even if it is late, call me.", answer: ["aunque sea tarde llámame"] },
    { en: "Although he is young, he is very smart.", answer: ["aunque sea joven es muy inteligente"] },
    { en: "Even if you don't believe it, it's true.", answer: ["aunque no lo creas es verdad"] },
    { en: "Although they are far, they call every day.", answer: ["aunque estén lejos llaman todos los días"] },
    { en: "Even if she arrives now, she is late.", answer: ["aunque llegue ahora llega tarde"] },
    { en: "Although I have no time, I will read.", answer: ["aunque no tenga tiempo leeré"] },
    { en: "Even if the technology changes, we will adapt.", answer: ["aunque la tecnología cambie nos adaptaremos"] },
    { en: "Although there are problems, there is a solution.", answer: ["aunque haya problemas hay una solución"] }
];

const ex3Vocab = { "llover": "rain", "cansado": "tired", "trabajar": "work", "querer": "want", "estudiar": "study", "viajar": "travel", "rápido": "fast", "entender": "understand", "difícil": "difficult", "tarde": "late", "lejos": "far", "clima": "weather", "cambiar": "change", "problema": "problem" };

const readingData = {
    title: "Nuestros Planes para el Futuro",
    content: "Querido equipo, escribo este correo para que todos conozcamos nuestras metas. Es fundamental que trabajemos juntos para que el proyecto sea un éxito. Cuando terminemos la primera fase, celebraremos en un restaurante. Aunque el camino sea difícil, estoy seguro de que lograremos el objetivo. Antes de que acabe el año, presentaremos los resultados a la sociedad. Espero que todos estén motivados y utilicen la tecnología para que mejoremos nuestra eficiencia. ¡A trabajar!",
    questions: [
        { q: "¿Para qué escribe el narrador el correo?", a: ["para que todos conozcan las metas", "conocer las metas"] },
        { q: "¿Cuándo celebrarán?", a: ["cuando terminen la primera fase", "después de la primera fase"] },
        { q: "¿Qué pasará aunque el camino sea difícil?", a: ["lograrán el objetivo", "terminarán el proyecto"] },
        { q: "¿Qué deben usar para mejorar la eficiencia?", a: ["la tecnología"] },
        { q: "¿Cuándo presentarán los resultados?", a: ["antes de que acabe el año"] }
    ],
    vocabulary: {
        "metas": "goals", "éxito": "success", "fase": "phase", "camino": "path / way", "lograremos": "we will achieve", "sociedad": "society", "tecnología": "technology", "eficiencia": "efficiency"
    }
};

const ex4Options = [
    { text: "Yo estudio para que tú _______ (aprender).", options: ["APRENDAS", "APRENDES", "APRENDISTE"], answer: "APRENDAS" },
    { text: "Dile la verdad cuando la _______ (ver).", options: ["VES", "VEAS", "VISTE"], answer: "VEAS" },
    { text: "Aunque _______ (llover) mañana, iré a la oficina.", options: ["LLUEVE", "LLUEVA", "LLOVERÁ"], answer: "LLUEVA" },
    { text: "Necesito que nosotros _______ (lograr) la meta.", options: ["LOGRAMOS", "LOGREMOS", "LOGRÁBAMOS"], answer: "LOGREMOS" },
    { text: "Avísame antes de que _______ (salir).", options: ["SALES", "SALGAS", "SALGASTE"], answer: "SALGAS" },
    { text: "Cuando _______ (terminar) el proyecto, descansaremos.", options: ["TERMINAS", "TERMINES", "TERMINARÁS"], answer: "TERMINES" },
    { text: "Ahorro dinero para que mis hijos _______ (estudiar).", options: ["ESTUDIAN", "ESTUDIEN", "ESTUDIARÁN"], answer: "ESTUDIEN" },
    { text: "Aunque él _______ (ser) rico, no es feliz.", options: ["ES", "SEA", "ERA"], answer: "SEA" },
    { text: "Tan pronto como _______ (tener) tiempo, te llamo.", options: ["TENGO", "TENGA", "TUVE"], answer: "TENGA" },
    { text: "Es importante que la sociedad _______ (cambiar).", options: ["CAMBIA", "CAMBIE", "CAMBIARÁ"], answer: "CAMBIE" },
    { text: "Te presto mi libro para que lo _______ (leer).", options: ["LEES", "LEAS", "LEERÁS"], answer: "LEAS" },
    { text: "Cuando _______ (poder), te ayudaré.", options: ["PUEDO", "PUEDA", "PODRÍA"], answer: "PUEDA" },
    { text: "Aunque el futuro _______ (ser) incierto, soy positivo.", options: ["ES", "SEA", "ERA"], answer: "SEA" },
    { text: "Espero que nosotros _______ (encontrar) una solución.", options: ["ENCONTRAMOS", "ENCONTREMOS", "ENCONTRARÍAMOS"], answer: "ENCONTREMOS" },
    { text: "Te llamo para que _______ (venir) a la fiesta.", options: ["VIENES", "VENGAS", "VENDRÁS"], answer: "VENGAS" },
    { text: "Antes de que el año _______ (acabar), viajaré.", options: ["ACABA", "ACABE", "ACABARÁ"], answer: "ACABE" },
    { text: "Aunque la tecnología _______ (avanzar), necesitamos personas.", options: ["AVANZA", "AVANCE", "AVANZÓ"], answer: "AVANCE" },
    { text: "Trabajamos para que el mundo _______ (mejorar).", options: ["MEJORA", "MEJORE", "MEJORARÍA"], answer: "MEJORE" },
    { text: "Cuando tú _______ (llegar), empezaremos.", options: ["LLEGAS", "LLEGUES", "LLEGÓ"], answer: "LLEGUES" },
    { text: "Es vital que nosotros _______ (tener) un propósito.", options: ["TENEMOS", "TENGAMOS", "TUVIMOS"], answer: "TENGAMOS" }
];

const completarPrompts = [
    { s: "1. Lo hago para que tú _______ (estar) feliz.", a: "estés" },
    { s: "2. Cuando ella _______ (terminar), comeremos.", a: "termine" },
    { s: "3. Aunque nosotros _______ (perder), aprenderemos.", a: "perdamos" },
    { s: "4. Espero que el futuro _______ (traer) paz.", a: "traiga" },
    { s: "5. Te lo digo para que lo _______ (saber).", a: "sepas" },
    { s: "6. Antes de que tú _______ (ir), firma aquí.", a: "vayas" },
    { s: "7. Cuando ellos _______ (llegar), avísame.", a: "lleguen" },
    { s: "8. Aunque él _______ (decir) la verdad, no le creen.", a: "diga" },
    { s: "9. Necesito que ustedes _______ (hacer) el reporte.", a: "hagan" },
    { s: "10. Es posible que el proyecto _______ (funcionar).", a: "funcione" },
    { s: "11. Tan pronto como nosotros _______ (tener) éxito, celebraremos.", a: "tengamos" },
    { s: "12. Aunque la tecnología _______ (cambiar), nos adaptaremos.", a: "cambie" },
    { s: "13. Trabajo duro para que mis hijos _______ (vivir) bien.", a: "vivan" },
    { s: "14. Cuando tú _______ (ver) el resultado, te alegrarás.", a: "veas" },
    { s: "15. Es necesario que la sociedad _______ (mejorar).", a: "mejore" },
    { s: "16. Espero que tú _______ (poder) venir.", a: "puedas" },
    { s: "17. Te llamo para que me _______ (ayudar).", a: "ayudes" },
    { s: "18. Antes de que nosotros _______ (salir), cerraremos la puerta.", a: "salgamos" },
    { s: "19. Cuando el sol _______ (brillar), iremos al parque.", a: "brille" },
    { s: "20. Aunque _______ (hacer) frío, correré.", a: "haga" },
    { s: "21. Es bueno que tú _______ (tener) una meta.", a: "tengas" },
    { s: "22. Busco a alguien que _______ (conocer) la ciudad.", a: "conozca" },
    { s: "23. No creo que la solución _______ (ser) fácil.", a: "sea" },
    { s: "24. Es mejor que nosotros _______ (estudiar) juntos.", a: "estudiemos" },
    { s: "25. Te doy este libro para que lo _______ (leer).", a: "leas" },
    { s: "26. Tan pronto como el año _______ (terminar), me mudaré.", a: "termine" },
    { s: "27. Es probable que ellos _______ (venir) mañana.", a: "vengan" },
    { s: "28. Dudo que él _______ (saber) la respuesta.", a: "sepa" },
    { s: "29. Es fantástico que ustedes _______ (participar).", a: "participen" },
    { s: "30. Quiero que el futuro _______ (ser) brillante.", a: "sea" }
];

const translationTextData = {
    title: "Working for a Better World",
    content: "I am writing this plan so that our society becomes better. It is important that we use technology so that the environment improves. My goal is that children have a better future. When we work together, we can find solutions for every problem. Although it is difficult to change, I hope that people realize the importance of this project. I want you to help me before it is too late. Our purpose is success for everyone.",
    vocabulary: {
        "society": "sociedad", "becomes": "se convierta", "better": "mejor", "technology": "tecnología", 
        "environment": "medio ambiente", "improves": "mejore", "goal": "meta / objetivo", "future": "futuro", 
        "together": "juntos", "solutions": "soluciones", "although": "aunque", "realize": "se den cuenta de",
        "importance": "importancia", "project": "proyecto", "too late": "demasiado tarde", "purpose": "propósito", "success": "éxito"
    }
};

const finalExercises = [
    { en: "I study so that my parents are proud.", answer: ["estudio para que mis padres estén orgullosos", "yo estudio para que mis padres estén orgullosos"] },
    { en: "When the war ends, there will be peace.", answer: ["cuando la guerra termine habrá paz"] },
    { en: "Although she is sick, she wants to work.", answer: ["aunque esté enferma quiere trabajar"] },
    { en: "I hope you find a solution to your problem.", answer: ["espero que encuentres una solución a tu problema"] },
    { en: "It is necessary that we protect the forest.", answer: ["es necesario que protejamos el bosque"] },
    { en: "Call me before you go to the meeting.", answer: ["llámame antes de que vayas a la reunión"] },
    { en: "I want you to be happy with your decision.", answer: ["quiero que estés feliz con tu decisión"] },
    { en: "Although I am tired, I will finish the project.", answer: ["aunque esté cansado terminaré el proyecto"] },
    { en: "He helps her so that she achieves her goals.", answer: ["la ayuda para que ella logre sus metas", "él la ayuda para que ella logre sus metas"] },
    { en: "When the technology improves, life will be easier.", answer: ["cuando la tecnología mejore la vida será más fácil"] },
    { en: "It is better that we save resources for the future.", answer: ["es mejor que ahorremos recursos para el futuro"] },
    { en: "I recommend that you talk to your boss.", answer: ["te recomiendo que hables con tu jefe"] },
    { en: "Even if it is difficult, you must try it.", answer: ["aunque sea difícil debes intentarlo"] },
    { en: "They work hard so that their children have studies.", answer: ["trabajan duro para que sus hijos tengan estudios"] },
    { en: "I don't think that society is ready for this change.", answer: ["no creo que la sociedad esté lista para este cambio"] }
];

const finalVocab = { "orgullosos": "proud", "guerra": "war", "paz": "peace", "enferma": "sick", "solución": "solution", "necesario": "necessary", "bosque": "forest", "decisión": "decision", "metas": "goals", "recomiendo": "recommend" };

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
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
                        <CardDescription className="font-bold text-foreground mt-1">Traduce la frase al español usando el subjuntivo.</CardDescription>
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
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left text-foreground">
                                    <div className="grid grid-cols-1 gap-2 text-xs">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (
                                            <div key={en} className="flex justify-between border-b pb-1">
                                                <span className="text-muted-foreground uppercase">{en}:</span>
                                                <span className="font-bold text-primary text-right">{es.toUpperCase()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex]?.en}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Escribe en español..." autoComplete="off" />
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

// --- MAIN COMPONENT ---

function Subjuntivo3ContentInternal() {
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

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    // Contenido de los ejercicios
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(goalsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(goalsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<number, string>>({});
    const [readVal, setReadVal] = useState<Record<number, any>>({});
    const [optIdx, setOptIdx] = useState(0);
    const [optSolved, setOptSolved] = useState<Record<number, boolean>>({});
    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));
    const [transText, setTransText] = useState('');

    const initialPathData = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1 (Para que)', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2 (Cuando)', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3 (Aunque)', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
        { key: 'complete', name: '10. Completar', icon: Trophy, status: 'locked' },
        { key: 'translate', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final', icon: Trophy, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;

        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < path.length; i++) { if (last && path[i].status === 'locked') path[i].status = 'active'; last = path[i].status === 'completed'; }
        }
        setLearningPath(path);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
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
        const currentSerialized = JSON.stringify({ lastSelectedTopic: selectedTopic, p: learningPath.map(t => t.status) });
        if (currentSerialized === lastSerializedRef.current) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic };
            learningPath.forEach(item => { s[item.key] = item.status; });
            lastSerializedRef.current = currentSerialized;
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 2000);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let wasUnlocked = false; 
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active'; 
                    wasUnlocked = true; 
                    nextToSelect = newPath[idx + 1].key;
                }
            }
            if (wasUnlocked) setTimeout(() => toast({ title: "¡Misión desbloqueada!" }), 0);
            if (nextToSelect) { const finalNext = nextToSelect; setTimeout(() => setSelectedTopic(finalNext), 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar'].includes(topicKey)) handleTopicCompleteInternal(topicKey);
    };

    const handleTopicCompleteInternal = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleVocabCheck = () => {
        let ok = true;
        const nv = goalsVocab.map((v, i) => {
            const res = v.es.toUpperCase() === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) ok = false; return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (ok) { setCanAdvanceVocab(true); toast({ title: "¡Perfecto!" }); }
        else toast({ variant: 'destructive', title: "Revisa las palabras" });
    };

    const handleCheckConj = () => {
        const v = conjugationVerbs[conjIdx];
        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === v.forms[i] ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjugationVerbs.length - 1) { setTimeout(() => { setConjIdx(p => p+1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }, 800); }
            else handleTopicCompleteInternal('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const handleCheckReading = () => {
        let allOk = true;
        const nv: any = {};
        readingData.questions.forEach((q, i) => {
            const userAns = (readAns[i] || '').trim().toLowerCase();
            const res = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[i] = res ? 'correct' : 'incorrect';
            if (!res) allOk = false;
        });
        setReadVal(nv);
        if (allOk) {
            toast({ title: "¡Lectura superada!" });
            handleTopicCompleteInternal('reading');
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas" });
        }
    };

    const handleCheckCompletar = () => {
        let allOk = true;
        const nv = completarPrompts.map((q, i) => {
            const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase();
            if (!res) allOk = false;
            return res ? 'correct' : 'incorrect';
        });
        setCompVal(nv);
        if (allOk) {
            toast({ title: "¡Dominio Total!" });
            handleTopicCompleteInternal('complete');
        } else {
            toast({ variant: 'destructive', title: "Hay errores en la lista" });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Vocabulario: Objetivos y Proyectos</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                                    {goalsVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} className={cn("uppercase transition-all", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Finalidad y Condición</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase">1. PARA QUE + SUBJUNTIVO</h3>
                                <p>Se usa para expresar la finalidad con sujetos diferentes.</p>
                                <div className="p-4 bg-muted rounded-xl border-l-4 border-primary">
                                    <p>Estudio español <strong>para</strong> aprender. (Yo - Yo)</p>
                                    <p className='text-primary'>Estudio español <strong>para que</strong> mis clientes me entiendan. (Yo - Clientes)</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase">2. ANTES DE QUE / CUANDO</h3>
                                <p>Usamos subjuntivo para acciones futuras.</p>
                                <p className='font-mono text-foreground'>Llámame <strong>antes de que</strong> salgas.</p>
                                <p className='font-mono text-foreground'><strong>Cuando</strong> termines, llámame. (Futuro)</p>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase">3. AUNQUE (Hecho vs Posibilidad)</h3>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                    <div className='p-3 border rounded bg-background shadow-sm'>
                                        <p className='text-xs text-muted-foreground uppercase'>Hecho (Indicativo):</p>
                                        <p className='text-black'>Aunque <strong>está</strong> cansado, trabaja.</p>
                                    </div>
                                    <div className='p-3 border rounded bg-background shadow-sm'>
                                        <p className='text-xs text-muted-foreground uppercase'>Posibilidad (Subjuntivo):</p>
                                        <p className='text-primary'>Aunque <strong>esté</strong> cansado, trabajará.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjugationVerbs[conjIdx];
                const pronouns = ["YO", "TÚ", "ÉL", "NOSOTROS", "ELLOS"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación Subjuntiva ({conjIdx+1}/20)</CardTitle></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.v}</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl'>
                                {pronouns.map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase transition-all", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise key="ex1" title="Exercise 1: Para que" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={ex1Vocab} />;
            case 'exercise_2': return <BallsExercise key="ex2" title="Exercise 2: Cuando" prompts={ex2Prompts} onComplete={() => handleTopicCompleteInternal('exercise_2')} vocabulary={ex2Vocab} />;
            case 'vocab_game': return <VocabularyMatchingGame data={goalsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Goals & Projects Memory" />;
            case 'exercise_3': return <BallsExercise key="ex3" title="Exercise 3: Aunque" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('exercise_3')} vocabulary={ex3Vocab} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center">
                                <CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-foreground text-left">
                                            <div className="grid grid-cols-1 gap-2 text-xs">
                                                {Object.entries(readingData.vocabulary).map(([es, en]) => (
                                                    <div key={es} className="flex justify-between border-b pb-1 font-bold">
                                                        <span className="uppercase text-muted-foreground">{es}:</span>
                                                        <span className="text-primary text-right">{en.toUpperCase()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold'>{i+1}. {q.q}</Label><Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [i]: e.target.value}); setReadVal({...readVal, [i]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12', readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
                        <CardHeader><CardTitle className='text-primary uppercase font-black text-left'>Ejercicio 4: Opción Múltiple</CardTitle><div className="flex gap-2 pt-4 flex-wrap">{ex4Options.map((_, i) => (<div key={i} onClick={() => setOptIdx(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all text-foreground", optIdx === i ? "border-primary ring-2 ring-primary" : "border-muted", optSolved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>))}</div></CardHeader>
                        <CardContent className="space-y-8 py-10">
                            <div className="text-3xl font-black text-center leading-relaxed">
                                {ex4Options[optIdx].text.split('_______').map((part: string, i: number) => (<Fragment key={i}>{part}{i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", optSolved[optIdx] ? "text-primary border-primary" : "text-muted-foreground")}>{optSolved[optIdx] ? ex4Options[optIdx].answer : '...'}</span>}</Fragment>))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                {ex4Options[optIdx].options.map((opt: string) => (
                                    <Button key={opt} onClick={() => { if (targetStudentId) return; if (opt.toUpperCase() === ex4Options[optIdx].answer.toUpperCase()) { setOptSolved({...optSolved, [optIdx]: true}); toast({ title: "¡Correcto!" }); } else toast({ variant: 'destructive', title: "Incorrecto" }); }} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", optSolved[optIdx] && opt.toUpperCase() === ex4Options[optIdx].answer.toUpperCase() && "border-green-500 bg-green-50 text-green-700 shadow-lg scale-105")}>{opt}</Button>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button variant="outline" onClick={() => setOptIdx(p => Math.max(0, p - 1))} disabled={optIdx === 0}>Anterior</Button><Button onClick={() => { if (optIdx < ex4Options.length - 1) setOptIdx(p => p + 1); else handleTopicCompleteInternal('exercise_4'); }} disabled={!optSolved[optIdx]} className="px-12 font-black h-12 shadow-xl">Siguiente</Button></CardFooter>
                    </Card>
                );
            case 'complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: Subjuntivo y Propósitos</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={compAns[i]} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase text-foreground", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckCompletar} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-64 pr-4 text-foreground text-left space-y-1">
                                            <div className="grid grid-cols-1 gap-2 text-xs">
                                                {Object.entries(translationTextData.vocabulary).map(([en, es], i) => (
                                                    <div key={i} className="flex justify-between border-b pb-1 font-bold">
                                                        <span className="text-muted-foreground uppercase">{en}:</span>
                                                        <span className="text-primary text-right">{es.toUpperCase()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"{translationTextData.content}"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (targetStudentId) return; setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[250px] text-lg" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicCompleteInternal('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Misión Final <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise key="final" title="Reto Final: Subjuntivo Mix" prompts={finalExercises} onComplete={() => handleTopicCompleteInternal('final')} vocabulary={finalVocab} />;
            default: return null;
        }
    };

    if (isUserLoading || isProfileLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión B1...</p>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* OJO ADMIN: Banner de Supervisión */}
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar</Link>
                            </Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/b1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso B1
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <Target className='h-10 w-10 text-primary' /> Subjuntivo 3 🇪🇸 (B1)
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Contenido Principal */}
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>

                        {/* Barra Lateral de Navegación */}
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" /> Misión B1
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 text-foreground">
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const Icon = ICONS_CONFIG[item.status] || BookOpen;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn(
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 text-foreground">
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
                </div>
            </main>
        </div>
    );
}

export default function Subjuntivo3Page() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <Subjuntivo3ContentInternal />
        </Suspense>
    );
}