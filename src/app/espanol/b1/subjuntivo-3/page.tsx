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
    Check,
    X,
    ListChecks,
    Target,
    MessageSquare,
    Clock,
    Sparkles,
    HelpCircle,
    CheckCircle2,
    Info
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
import { Textarea } from '@/components/ui/textarea';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { VerbVocabularyExercise } from '@/components/kids/exercises/verb-vocabulary';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_b1_subj_3_v26_final_fix';
const mainProgressKey = 'progress_b1_es_subjuntivo_3';

const ICONS_CONFIG = {
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
    { v: "STUDY", es: "ESTUDIAR", forms: ["estudie", "estudies", "estudie", "estudiemos", "estudien"] },
    { v: "WORK", es: "TRABAJAR", forms: ["trabaje", "trabajes", "trabaje", "trabajemos", "trabajen"] },
    { v: "ARRIVE", es: "LLEGAR", forms: ["llegue", "llegues", "llegue", "lleguemos", "lleguen"] },
    { v: "FINISH", es: "TERMINAR", forms: ["termine", "termines", "termine", "terminemos", "terminen"] },
    { v: "ACHIEVE", es: "LOGRAR", forms: ["logre", "logres", "logre", "logremos", "logren"] },
    { v: "IMPROVE", es: "MEJORAR", forms: ["mejore", "mejores", "mejore", "mejoremos", "mejoren"] },
    { v: "GO", es: "IR", forms: ["vaya", "vayas", "vaya", "vayamos", "vayan"] },
    { v: "HAVE", es: "TENER", forms: ["tenga", "tengas", "tenga", "tengamos", "tengan"] },
    { v: "SAY", es: "DECIR", forms: ["diga", "digas", "diga", "digamos", "digan"] },
    { v: "DO", es: "HACER", forms: ["haga", "hagas", "haga", "hagamos", "hagan"] },
    { v: "BE (Essence)", es: "SER", forms: ["sea", "seas", "sea", "seamos", "sean"] },
    { v: "BE (State)", es: "ESTAR", forms: ["esté", "estés", "esté", "estemos", "estén"] },
    { v: "KNOW (Facts)", es: "SABER", forms: ["sepa", "sepas", "sepa", "sepamos", "sepan"] },
    { v: "COME", es: "VENIR", forms: ["venga", "vengas", "venga", "vengamos", "vengan"] },
    { v: "SEE", es: "VER", forms: ["vea", "veas", "vea", "veamos", "vean"] },
    { v: "WANT", es: "QUERER", forms: ["quiera", "quieras", "quiera", "queramos", "quieran"] },
    { v: "CAN", es: "PODER", forms: ["pueda", "puedas", "pueda", "podamos", "puedan"] },
    { v: "LOOK FOR", es: "BUSCAR", forms: ["busque", "busques", "busque", "busquemos", "busquen"] },
    { v: "PRACTICE", es: "PRACTICAR", forms: ["practique", "practiques", "practique", "practiquemos", "practiquen"] },
    { v: "SEND", es: "ENVIAR", forms: ["envíe", "envíes", "envíe", "enviemos", "envíen"] },
];

const ex1Prompts = [
    { en: "I study so that you learn.", answer: ["estudio para que aprendas", "yo estudio para que aprendas"] },
    { en: "They work so that we can travel.", answer: ["trabajan para que podamos viajar", "ellos trabajan para que podamos viajar"] },
    { en: "She saves money so that her son studies.", answer: ["ahorra dinero para que su hijo estudie", "ella ahorra dinero para que su hijo estudie"] },
    { en: "We call so that they know.", answer: ["llamamos para que sepan", "nosotros llamamos para que ellos sepan"] },
    { en: "He explains so that you understand.", answer: ["él explica para que entiendas", "el explica para que comprendas"] },
    { en: "I help you so that you finish early.", answer: ["te ayudo para que termines temprano" , "yo te ayudo para que termines temprano"] },
    { en: "They speak loudly so that everyone hears.", answer: ["ellos hablan fuerte para que todos oigan"] },
    { en: "She cooks so that we eat healthy.", answer: ["ella cocina para que comamos saludable"] },
    { en: "We write so that you remember.", answer: ["nosotros escribimos para que recuerdes"] },
    { en: "You study so that you have a better future.", answer: ["tu estudias para que tengas un mejor futuro" , "tu estudias para que tu tengas un mejor futuro"] },
    { en: "She practices so that they win.", answer: ["ella practica para que ganen" , "ella practica para que ellosganen"] },
    { en: "I clean so that the house is beautiful.", answer: ["yo limpio para que la casa este hermosa"] }
];

const ex2Prompts = [
    { en: "When you arrive, call me.", answer: ["cuando llegues llámame", "cuando tu llegues llamame"] },
    { en: "When she finishes, she will eat.", answer: ["cuando termine comerá", "cuando ella termine comera"] },
    { en: "When they have time, they will go.", answer: ["cuando tengan tiempo ellos iran"] },
    { en: "When we see the result, we will know.", answer: ["cuando veamos el resultado nosotros sabremos"] },
    { en: "When you speak with him, tell the truth.", answer: ["cuando hables con el di la verdad"] },
    { en: "When he comes back, we will talk.", answer: ["cuando vuelva nosotros hablaremos"] },
    { en: "When the project is ready, I will show it.", answer: ["cuando el proyecto este listo yo lo mostrare"] },
    { en: "When you buy the car, take me.", answer: ["cuando compres el carro llevame"] },
    { en: "When they sleep, be quiet.", answer: ["cuando ellos duerman haz silencio"] },
    { en: "When I can, I will help you.", answer: ["cuando pueda te ayudaré" , "cuando yo pueda te ayudare"] },
    { en: "When the sun shines, it will be hot.", answer: ["cuando el sol brille hara calor"] },
    { en: "When you read this, smile.", answer: ["cuando leas esto sonríe" , "cuando tu leas esto sonrie"] }
];

const ex3Prompts = [
    { en: "Although it rains, I will go.", answer: ["aunque llueva iré" , "aunque llueva yo ire"] },
    { en: "Even if he is tired, he will work.", answer: ["aunque esté cansado el trabajará" , "aunque este cansado el trabajara"] },
    { en: "Although she doesn't want to, she will study.", answer: ["aunque no quiera estudiará" , "aunque ella no quiera estudiara"] },
    { en: "Even if we don't have money, we will travel.", answer: ["aunque no tengamos dinero viajaremos" , "aunque nosotros no tengamos dinero viajaremos"] },
    { en: "Although they speak fast, I understand them.", answer: ["aunque hablen rápido los entiendo" , "aunque ellos hablen rapido yo los entiendo"] },
    { en: "Even if you say no, I will do it.", answer: ["aunque digas que no yo lo haré" , "aunque tu digas que no yo lo hare"] },
    { en: "Although the project is difficult, we will finish it.", answer: ["aunque el proyecto sea dificil nosotros lo terminaremos"] },
    { en: "Even if it is late, call me.", answer: ["aunque sea tarde, llámame" , "aunque sea tarde, llamame"] },
    { en: "Although he is young, he is very smart.", answer: ["aunque sea joven es muy inteligente" , "aunque el sea joven es muy inteligente"] },
    { en: "Even if you don't believe it, it's true.", answer: ["aunque no lo creas es verdad"] },
    { en: "Although they are far, they call every day.", answer: ["aunque estén lejos llaman todos los días" , "aunque ellos esten lejos llaman todos los dias"] },
    { en: "Even if she arrives now, she is late.", answer: ["aunque llegue ahora llega tarde" , "aunque ella llegue ahora ella llega tarde"] },
    { en: "Although I have no time, I will read.", answer: ["aunque no tenga tiempo leeré" , "aunque yo no tenga tiempo yo leere"] },
    { en: "Even if the technology changes, we will adapt.", answer: ["aunque la tecnología cambie nos adaptaremos" , "aunque la tecnología cambie, nosotros nos adaptaremos"] },
    { en: "Although there are problems, there is a solution.", answer: ["aunque haya problemas, hay una solución"] }
];

const readingData = {
    title: "El Futuro del Proyecto",
    content: "Querido equipo, escribo este plan para que todos conozcamos nuestras metas. Es fundamental que trabajemos juntos para que el proyecto sea un éxito. Cuando terminemos la primera fase, celebraremos. Aunque el camino sea difícil, estoy seguro de que lograremos el objetivo. Antes de que acabe el año, presentaremos los resultados a la sociedad. Espero que todos utilicen la tecnología para que mejoremos nuestra eficiencia.",
    questions: [
        { id: 'q1', question: "¿Para qué escribe el narrador el plan?", a: ["para que todos conozcan las metas", "conocer las metas"] },
        { id: 'q2', question: "¿Cuándo celebrarán?", a: ["cuando terminen la primera fase", "después de la primera fase"] },
        { id: 'q3', question: "¿Qué pasará aunque el camino sea difícil?", a: ["lograrán el objetivo", "terminarán el proyecto"] },
        { id: 'q4', question: "¿Qué deben usar para mejorar la eficiencia?", a: ["la tecnología"] },
        { id: 'q5', question: "¿Cuándo presentarán los resultados?", a: ["antes de que acabe el año"] }
    ],
    vocabulary: {
        "metas": "goals",
        "éxito": "success",
        "fase": "phase",
        "objetivo": "target",
        "sociedad": "society",
        "eficiencia": "efficiency",
        "acabe": "ends"
    }
};

const ex4Options = [
    { text: "Yo estudio para que tú _______ (aprender).", options: ["APRENDAS", "APRENDES", "APRENDISTE"], answer: "APRENDAS" },
    { text: "Dile la verdad cuando la _______ (ver).", options: ["VEAS", "VEAN", "VISTE"], answer: "VEAS" },
    { text: "Aunque _______ (llover) mañana, iré a la oficina.", options: ["LLUEVE", "LLOVERA", "LLUEVA"], answer: "LLUEVA" },
    { text: "Avísame antes de que _______ (salir).", options: ["SALES", "SALGAS", "SALGASTE"], answer: "SALGAS" },
    { text: "Cuando _______ (terminar) el proyecto, descansaremos.", options: ["TERMINES", "TERMINAS", "TERMINARÁS"], answer: "TERMINES" },
    { text: "Ahorro dinero para que mis hijos _______ (estudiar).", options: ["ESTUDIEN", "ESTUDIAN", "ESTUDIARÁN"], answer: "ESTUDIEN" },
    { text: "Aunque él _______ (ser) rico, no es feliz.", options: ["ES", "SEA", "ERA"], answer: "SEA" },
    { text: "Tan pronto como _______ (tener) tiempo, te llamo.", options: ["TENGA", "TENGO", "TUVE"], answer: "TENGA" },
    { text: "Es importante que la sociedad _______ (cambiar).", options: ["CAMBIA", "CAMBIE", "CAMBIARÁ"], answer: "CAMBIE" },
    { text: "Te presto mi libro para que lo _______ (leer).", options: ["LEAS", "LEAN", "LEERÁS"], answer: "LEAS" },
    { text: "Cuando _______ (poder), te ayudaré.", options: ["PUEDO", "PUEDAS", "PUEDA"], answer: "PUEDA" },
    { text: "Aunque el futuro _______ (ser) incierto, soy positivo.", options: ["ES", "ERA", "SEA"], answer: "SEA" },
    { text: "Espero que nosotros _______ (encontrar) una solución.", options: ["ENCONTREMOS", "ENCONTRAMOS", "ENCONTRARÍAMOS"], answer: "ENCONTREMOS" },
    { text: "Te llamo para que _______ (venir) a la fiesta.", options: ["VIENES", "VENDRAS", "VENGAS"], answer: "VENGAS" },
    { text: "Antes de que el año _______ (acabar), viajaré.", options: ["ACABAN", "ACABE", "ACABARÁ"], answer: "ACABE" },
    { text: "Aunque la tecnología _______ (avanzar), necesitamos personas.", options: ["AVANZA", "AVANZO", "AVANCE"], answer: "AVANCE" },
    { text: "Trabajamos para que el mundo _______ (mejorar).", options: ["MEJORE", "MEJOREN", "MEJORARÍA"], answer: "MEJORE" },
    { text: "Cuando tú _______ (llegar), empezaremos.", options: ["LLEGAS", "LLEGUEN", "LLEGUES"], answer: "LLEGUES" },
    { text: "Es vital que nosotros _______ (tener) un propósito.", options: ["TENEMOS", "TENGAMOS", "TUVIMOS"], answer: "TENGAMOS" },
    { text: "Necesito que nosotros _______ (lograr) la meta.", options: ["LOGRAMOS", "LOGRAMOS", "LOGREMOS"], answer: "LOGREMOS" },
];

const completarPrompts = [
    { s: "1. Lo hago para que tú _______ (estar) feliz.", a: "estés" },
    { s: "2. Cuando ella _______ (terminar), comeremos.", a: "termine" },
    { s: "3. Aunque nosotros _______ (perder), aprenderemos.", a: "perdamos" },
    { s: "4. Espero que el futuro _______ (traer) paz.", a: "traiga" },
    { s: "5. Te lo digo para que lo _______ (saber).", a: "sepas" },
    { s: "6. Es posible que el proyecto _______ (ser) un éxito.", a: "sea" },
    { s: "7. No creo que ellos _______ (venir) hoy.", a: "vengan" },
    { s: "8. Cuando _______ (tener) dinero, compraré un coche.", a: "tenga" },
    { s: "9. Es necesario que tú _______ (estudiar) más.", a: "estudies" },
    { s: "10. Aunque _______ (hacer) frío, saldremos.", a: "haga" },
    { s: "11. Te ayudo para que _______ (lograr) tu meta.", a: "logres" },
    { s: "12. Dile hola cuando lo _______ (ver).", a: "veas" },
    { s: "13. Es bueno que nosotros _______ (comer) sano.", a: "comamos" },
    { s: "14. Dudo que ella _______ (saber) la verdad.", a: "sepa" },
    { s: "15. Antes de que _______ (salir), cierra la puerta.", a: "salgas" },
    { s: "16. Queremos que la sociedad _______ (crecer).", a: "crezca" },
    { s: "17. Es probable que _______ (llover) esta tarde.", a: "llueva" },
    { s: "18. Aunque _______ (ser) difícil, lo intentaré.", a: "sea" },
    { s: "19. Cuando _______ (llegar) a casa, llámame.", a: "llegues" },
    { s: "20. Es importante que todos _______ (participar).", a: "participen" },
    { s: "21. No pienso que él _______ (querer) mentir.", a: "quiera" },
    { s: "22. Para que _______ (aprender), debes practicar.", a: "aprendas" },
    { s: "23. Es una lástima que no _______ (poder) venir.", a: "puedas" },
    { s: "24. Aunque no _______ (tener) tiempo, iré.", a: "tenga" },
    { s: "25. Cuando _______ (acabar) la clase, descansaré.", a: "acabe" },
    { s: "26. Es vital que nosotros _______ (mejorar).", a: "mejoremos" },
    { s: "27. No creo que eso _______ (funcionar).", a: "funcione" },
    { s: "28. Te doy esto para que lo _______ (guardar).", a: "guardes" },
    { s: "29. Es posible que ellos _______ (estar) cansados.", a: "estén" },
    { s: "30. Antes de que _______ (amanecer), saldremos.", a: "amanezca" },
];

const translationTextData = {
    content: "Working for a better world is important. I want to participate in projects so that our society grows. When I finish my studies, I will help people. Although it is a challenge, it is possible that we find solutions for the environment if we use technology correctly. My goal is that we all have more opportunities in the future.",
    vocabulary: {
        "society": "sociedad",
        "grows": "crezca",
        "studies": "estudios",
        "challenge": "desafío",
        "environment": "medio ambiente",
        "correctly": "correctamente",
        "goal": "meta / objetivo",
        "opportunities": "oportunidades",
        "participate": "participar"
    }
};

const finalExercises = [
    { en: "I study so that my parents are proud.", answer: ["estudio para que mis padres estén orgullosos", "yo estudio para que mis padres esten orgullosos"] },
    { en: "When the war ends, there will be peace.", answer: ["cuando la guerra termine habra paz"] },
    { en: "Although she is sick, she wants to work.", answer: ["aunque ella este enferma ella quiere trabajar" , "aunque ella este enferma quiere trabajar"] },
    { en: "I hope you find a solution to your problem.", answer: ["espero que encuentres una solución a tu problema" , "yo espero que encuentres una solucion a tu problema"] },
    { en: "It is necessary that we protect the forest.", answer: ["es necesario que nosotros protejamos el bosque"] },
    { en: "Call me before you go to the meeting.", answer: ["llámame antes de que vayas a la reunión" , "llamame antes de que tu vayas a la reunion"] },
    { en: "I want you to be happy with your decision.", answer: ["quiero que estés feliz con tu decisión" , "yo quiero que estes feliz con tu decision"] },
    { en: "Although I am tired, I will finish the project.", answer: ["aunque esté cansado terminaré el proyecto" , "aunque yo este cansado, yo terminare el proyecto"] },
    { en: "He helps her so that she achieves her goals.", answer: ["el la ayuda para que ella logre sus metas", "él la ayuda para que ella logre sus metas"] },
    { en: "When the technology improves, life will be easier.", answer: ["cuando la tecnologia mejore, la vida sera más facil" , "cuando la tecnología mejore, la vida será más fácil"] },
    { en: "It is better that we save resources for the future.", answer: ["es mejor que ahorremos recursos para el futuro" , "es mejor que nosotros ahorremos recursos para el futuro"] },
    { en: "I recommend that you talk to your boss.", answer: ["te recomiendo que hables con tu jefe" , "yo te recomiendo que hables con tu jefe"] },
    { en: "Even if it is difficult, you must try it.", answer: ["aunque sea difícil debes intentarlo", "aunque sea dificil tu debes intentarlo"] },
    { en: "They work hard so that their children have studies.", answer: ["trabajan duro para que sus hijos tengan estudios" , "ellos trabajan duro para que sus hijos tengan estudios"] },
    { en: "I don't think that society is ready for this change.", answer: ["no creo que la sociedad esté lista para este cambio" , "yo no creo que la sociedad este lista para este cambio"] }
];

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
                                <ScrollArea className="h-64 pr-4 text-left text-foreground">
                                    <div className="grid grid-cols-1 gap-2 text-xs">
                                        <h4 className="font-bold border-b pb-1 text-primary uppercase">Ayuda de Misión</h4>
                                        {Object.entries(vocabulary).map(([en, es]: any) => (
                                            <div key={en} className="flex justify-between border-b border-muted pb-1">
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

const ChoiceExercise = ({ prompts, onComplete, title, description, isSupervisionMode }: any) => {
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
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all text-foreground", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-2xl font-black text-center leading-relaxed">
                    {prompts[currentIndex].text.split('_______').map((part: string, i: number) => (
                        <Fragment key={i}>
                            {part}
                            {i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", status[currentIndex] === 'correct' ? "text-primary border-primary" : "text-muted-foreground")}>{status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}</span>}
                        </Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", status[currentIndex] === 'correct' && opt.toUpperCase() === prompts[currentIndex].answer.toUpperCase() && "border-green-500 bg-green-50 text-green-700 shadow-lg scale-105")} disabled={isSupervisionMode}>{opt}</Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={status[currentIndex] !== 'correct'} className="px-12 font-black h-12 shadow-xl">Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CONTENT INTERNAL ---

function Subjuntivo3ContentInternal({ overrideStudentId }: { overrideStudentId?: string | null }) {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = overrideStudentId || searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    const hasInitialized = useRef(false);
    const lastSerializedRef = useRef<string>('');

    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(goalsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(goalsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [optIdx, setOptIdx] = useState(0);
    const [optSolved, setOptSolved] = useState<Record<number, boolean>>({});
    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));
    const [transText, setTransText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

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
            let lastDone = true;
            for (let i = 0; i < path.length; i++) { if (lastDone && path[i].status === 'locked') path[i].status = 'active'; lastDone = path[i].status === 'completed'; }
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
        if (['grammar'].includes(topicKey)) handleTopicComplete(topicKey);
    };

    const handleTopicComplete = (completedKey: string) => {
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
            else handleTopicComplete('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingData.questions.forEach((q, i) => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const res = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = res ? 'correct' : 'incorrect'; if (!res) allOk = false;
        });
        setReadVal(nv); if (allOk) handleTopicComplete('reading');
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckCompletar = () => {
        let allOk = true; const nv = completarPrompts.map((q, i) => {
            const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase();
            if (!res) allOk = false; return res ? 'correct' : 'incorrect';
        });
        setCompVal(nv); if (allOk) handleTopicComplete('complete');
        else toast({ variant: 'destructive', title: "Hay errores en la lista" });
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
                                            <Input 
                                                value={vocabAnswers[i] || ''} 
                                                onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); }} 
                                                className={cn("uppercase transition-all text-foreground", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                                autoComplete="off" 
                                                readOnly={!!targetStudentId} 
                                            />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left text-foreground animate-in fade-in duration-700">
                        <div className="mb-4">
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Gramática: Finalidad y Condición</h2>
                            <p className="text-black font-bold text-lg">Aprende a combinar el subjuntivo con estructuras de futuro y propósito.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-card/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[2.5rem] border-2 border-primary/20 shadow-xl space-y-4 font-bold transition-all hover:scale-[1.02] hover:border-primary/40 group text-foreground">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-xl text-primary"><Target className="h-6 w-6"/></div>
                                    <h3 className="text-2xl font-black text-primary uppercase tracking-tight group-hover:text-brand-purple transition-colors">1. Finalidad (Para que)</h3>
                                </div>
                                <p className="text-base leading-relaxed text-foreground/90">Usamos el subjuntivo con <span className="text-primary underline">PARA QUE</span> cuando los sujetos de las dos frases son diferentes.</p>
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                                    <p className="text-xs uppercase text-muted-foreground">Comparación:</p>
                                    <p>Estudio español <span className="text-primary font-black">PARA</span> aprender. <span className="text-[10px] text-muted-foreground">(Yo - Yo)</span></p>
                                    <p>Estudio español <span className="text-primary font-black">PARA QUE</span> me <span className="text-brand-purple font-black">entiendan</span>. <span className="text-[10px] text-muted-foreground">(Yo - Clientes)</span></p>
                                </div>
                            </div>

                            <div className="p-8 bg-card/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[2.5rem] border-2 border-brand-purple/20 shadow-xl space-y-4 font-bold transition-all hover:scale-[1.02] hover:border-brand-purple/40 group text-foreground">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-purple/20 rounded-xl text-brand-purple"><Clock className="h-6 w-6"/></div>
                                    <h3 className="text-2xl font-black text-brand-purple uppercase tracking-tight group-hover:text-primary transition-colors">2. Tiempo (Antes de / Cuando)</h3>
                                </div>
                                <p className="text-base leading-relaxed text-foreground/90">Usamos subjuntivo cuando la acción se refiere al <span className="text-brand-purple underline">FUTURO</span>.</p>
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/50 rounded-xl border font-mono text-sm">
                                        <p>Llámame <span className="text-brand-purple font-bold">ANTES DE QUE</span> salgas.</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-xl border font-mono text-sm">
                                        <p><span className="text-brand-purple font-bold">CUANDO</span> termines, llámame. <span className="text-[10px] text-muted-foreground">(Futuro)</span></p>
                                        <p>Cuando terminé, me fui. <span className="text-[10px] text-muted-foreground">(Pasado/Hecho)</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-primary/30 shadow-xl space-y-6 font-bold text-foreground">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-xl text-primary"><Sparkles className="h-6 w-6"/></div>
                                    <h3 className="text-2xl font-black text-brand-purple uppercase tracking-tight group-hover:text-primary transition-colors">3. Concesión (Aunque)</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500"/><h4 className="text-lg font-black uppercase text-green-600">Indicativo (Hecho Real)</h4></div>
                                        <p className="text-sm text-muted-foreground">Usamos indicativo cuando la información es cierta o conocida.</p>
                                        <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-green-500/20 text-xl text-center">Aunque <span className="text-green-600">está</span> cansado, trabaja.</div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-blue-500"/><h4 className="text-lg font-black uppercase text-blue-600">Subjuntivo (Hipótesis)</h4></div>
                                        <p className="text-sm text-muted-foreground">Usamos subjuntivo cuando es una posibilidad o algo futuro.</p>
                                        <div className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-blue-500/20 text-xl text-center">Aunque <span className="text-lightblue-600">esté</span> cansado, trabajará.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-10">
                            <Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-32 font-black h-16 text-2xl shadow-2xl uppercase tracking-widest rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transform transition-all hover:scale-105 active:scale-95">
                                ¡Misión Comprendida! <ArrowRight className="ml-3 h-8 w-8" />
                            </Button>
                        </div>
                    </div>
                );
            case 'conjugation':
                const v = conjugationVerbs[conjIdx];
                const pronouns = ["YO", "TÚ", "ÉL", "NOSOTROS", "ELLOS"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación Subjuntiva ({conjIdx+1}/20)</CardTitle></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.es} ({v.v})</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl'>
                                {pronouns.map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase transition-all text-foreground", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise key="ex1" title="Exercise 1: Para que" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={{"aprender": "learn", "viajar": "travel", "ahorrar": "save", "hijo": "son", "entender": "understand", "eficiencia": "efficiency"}} />;
            case 'exercise_2': return <BallsExercise key="ex2" title="Exercise 2: Cuando" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={{"llegar": "arrive", "terminar": "finish", "comer": "eat", "tiempo": "time", "volver": "come back"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={goalsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Goals & Projects Memory" />;
            case 'exercise_3': return <BallsExercise key="ex3" title="Exercise 3: Aunque" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={{"llover": "rain", "cansado": "tired", "trabajar": "work", "querer": "want", "viajar": "travel", "desafío": "challenge"}} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center">
                                <CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-64 pr-4 text-foreground text-left">
                                            <div className="grid grid-cols-1 gap-2 text-xs">
                                                <h4 className="font-bold border-b pb-1 text-primary uppercase">Ayuda de Misión</h4>
                                                {Object.entries(readingData.vocabulary).map(([es, en]) => (
                                                    <div key={es} className="flex justify-between border-b border-muted pb-1 font-bold">
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
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                <h4 className="font-black text-primary uppercase text-sm">Comprehension Questions:</h4>
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2"><Label className='font-bold'>{i+1}. {q.question}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12 text-foreground', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
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
                        <CardFooter className="justify-between border-t pt-6"><Button variant="outline" onClick={() => setOptIdx(p => Math.max(0, p - 1))} disabled={optIdx === 0}>Anterior</Button><Button onClick={() => { if (optIdx < ex4Options.length - 1) setOptIdx(p => p + 1); else handleTopicComplete('exercise_4'); }} disabled={!optSolved[optIdx]} className="px-12 font-black h-12 shadow-xl">Siguiente</Button></CardFooter>
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
                                    <Input value={compAns[i]} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase text-foreground", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
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
                                        <ScrollArea className="h-80 pr-4 text-foreground text-left">
                                            <div className="grid grid-cols-1 gap-2 text-xs">
                                                <h4 className="font-bold border-b pb-1 text-primary uppercase">Ayuda de Misión</h4>
                                                {Object.entries(translationTextData.vocabulary).map(([en, es], i) => (
                                                    <div key={i} className="flex justify-between border-b border-muted pb-1 font-bold">
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
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (targetStudentId) return; setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[250px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise key="final" title="Reto Final: Subjuntivo Mix" prompts={finalExercises} onComplete={() => handleTopicComplete('final')} vocabulary={{"orgullosos": "proud", "guerra": "war", "paz": "peace", "enferma": "sick", "solución": "solution", "necesario": "necessary", "bosque": "forest", "decisión": "decision"}} />;
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
                                                const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn(
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                            isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {item.status === 'completed' ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />
                                                            )}
                                                            <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-current">{item.name}</span>
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