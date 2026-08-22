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
    Info,
    HelpCircle,
    Activity,
    ListChecks,
    MessageSquare,
    Globe,
    ChevronDown
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
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_b1_subj_2_v10_scroll_fixed';
const mainProgressKey = 'progress_b1_es_subjuntivo_2';

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

const socialVocab = [
    { en: "OPINION", es: "OPINIÓN" }, { en: "TRUTH", es: "VERDAD" }, { en: "POSSIBILITY", es: "POSIBILIDAD" },
    { en: "DOUBT", es: "DUDA" }, { en: "CERTAINTY", es: "CERTEZA" }, { en: "PROBLEM", es: "PROBLEMA" },
    { en: "SOLUTION", es: "SOLUCIÓN" }, { en: "DECISION", es: "DECISIÓN" }, { en: "BEHAVIOR", es: "COMPORTAMIENTO" },
    { en: "SITUATION", es: "SITUACIÓN" }, { en: "SOCIETY", es: "SOCIEDAD" }, { en: "INFORMATION", es: "INFORMACIÓN" },
    { en: "REALITY", es: "REALIDAD" }, { en: "EVIDENCE", es: "EVIDENCIA" }, { en: "ARGUMENT", es: "ARGUMENTO" },
    { en: "AGREEMENT", es: "ACUERDO" }, { en: "DISAGREEMENT", es: "DESACUERDO" }, { en: "CHANGE", es: "CAMBIO" },
    { en: "DEVELOPMENT", es: "DESARROLLO" }, { en: "COMMUNITY", es: "COMUNIDAD" }, { en: "RESPONSIBILITY", es: "RESPONSABILIDAD" }
];

const conjugationVerbs = [
    { v: "SPEAK", es: "HABLAR", forms: ["hable", "hables", "hable", "hablemos", "hablen"] },
    { v: "EAT", es: "COMER", forms: ["coma", "comas", "coma", "comamos", "coman"] },
    { v: "LIVE", es: "VIVIR", forms: ["viva", "vivas", "viva", "vivamos", "vivan"] },
    { v: "HAVE", es: "TENER", forms: ["tenga", "tengas", "tenga", "tengamos", "tengan"] },
    { v: "BE (ESSENTIAL)", es: "SER", forms: ["sea", "seas", "sea", "seamos", "sean"] },
    { v: "GO", es: "IR", forms: ["vaya", "vayas", "vaya", "vayamos", "vayan"] },
    { v: "DO/MAKE", es: "HACER", forms: ["haga", "hagas", "haga", "hagamos", "hagan"] },
    { v: "BE (STATE)", es: "ESTAR", forms: ["esté", "estés", "esté", "estemos", "estén"] },
    { v: "COME", es: "VENIR", forms: ["venga", "vengas", "venga", "vengamos", "vengan"] },
    { v: "SAY", es: "DECIR", forms: ["diga", "digas", "diga", "digamos", "digan"] },
];

const ex1Prompts = [
    { en: "I don't think that he is right.", answer: ["no creo que él tenga razón" , "yo no creo que el tenga razon"] },
    { en: "I doubt that it is the solution.", answer: ["dudo que sea la solución" , "yo dudo que esta sea la solucion"] },
    { en: "She doesn't think the situation is easy.", answer: ["ella no piensa que la situacion sea facil"] },
    { en: "We don't believe that they are in agreement.", answer: ["nosotros no creemos que ellos esten de acuerdo"] },
    { en: "I don't think you know the truth.", answer: ["yo no creo que sepas la verdad"] },
    { en: "It's not certain that we can go.", answer: ["no es cierto que podamos ir"] },
    { en: "I doubt that he does his homework.", answer: ["yo dudo que el haga su tarea" , "yo dudo que haga su tarea"] },
    { en: "They don't think it's a good decision.", answer: ["ellos no piensan que sea una buena decision"] },
    { en: "I don't believe she comes today.", answer: ["yo no creo que ella venga hoy"] },
    { en: "It's not possible that they know it.", answer: ["no es posible que ellos lo sepan"] },
    { en: "I doubt that the behavior changes.", answer: ["yo dudo que el comportamiento cambie"] },
    { en: "She doesn't think that he says the truth.", answer: ["ella no piensa que el diga la verdad"] },
];

const ex2Prompts = [
    { en: "I think she is happy.", answer: ["no creo que ella esté feliz" , "yo no creo que ella este feliz"] },
    { en: "They believe it is true.", answer: ["ellos no creen que sea verdad" , "no creen que sea verdad"] },
    { en: "We think he knows the answer.", answer: ["nosotros no pensamos que el sepa la respuesta"] },
    { en: "She believes they are coming.", answer: ["ella no cree que ellos vengan"] },
    { en: "I think you are right.", answer: ["no creo que tengas razón" , "yo no creo que tengas razon"] },
    { en: "He thinks the situation is good.", answer: ["el no piensa que la situación sea buena"] },
    { en: "We believe they have the information.", answer: ["no creemos que ellos tengan la informacion"] },
    { en: "They think she does a good job.", answer: ["ellos no piensan que ella haga un buen trabajo"] },
    { en: "I think it is possible.", answer: ["no creo que sea posible"] },
    { en: "She believes he speaks Spanish.", answer: ["ella no cree que el hable español"] },
];

const ex3Options = [
    { text: "No creo que Juan _______ (tener) tiempo.", options: ["TIENE", "TENGA", "TENDRÁ"], answer: "TENGA" },
    { text: "Dudo que ellos _______ (saber) la dirección.", options: ["SABEN", "SABRÁN", "SEPAN"], answer: "SEPAN" },
    { text: "No pienso que ella _______ (ir) a la fiesta.", options: ["VA", "VAYA", "FUE"], answer: "VAYA" },
    { text: "Es posible que nosotros _______ (comer) fuera.", options: ["COMAMOS", "COMEREMOS", "COMERÁN"], answer: "COMAMOS" },
    { text: "No es cierto que él _______ (ser) mi primo.", options: ["SEA", "SEEN", "ERA"], answer: "SEA" },
    { text: "Dudo que la situación _______ (cambiar) pronto.", options: ["CAMBIE", "CAMBIEN", "CAMBIARÁ"], answer: "CAMBIE" },
    { text: "No creo que tú _______ (poder) hacerlo solo.", options: ["PUEDES", "PUEDAS", "PODRÁS"], answer: "PUEDAS" },
    { text: "Pienso que nosotros _______ (estar) bien aquí.", options: ["ESTAREMOS", "ESTEMOS", "ESTAMOS"], answer: "ESTAMOS" },
    { text: "Es probable que ellos _______ (llegar) tarde.", options: ["LLEGAN", "LLEGUEN", "LLEGARÁN"], answer: "LLEGUEN" },
    { text: "Dudo que tú _______ (querer) venir conmigo.", options: ["QUIERES", "QUERRÁS", "QUIERAS"], answer: "QUIERAS" },
];

const readingData = {
    title: "Vida en Sociedad",
    content: "En nuestra sociedad actual, es fundamental que cada persona tenga conciencia de sus acciones. No creo que un solo individuo pueda cambiar el mundo de la noche a la mañana, pero dudo que la inacción sea la mejor solución. Es necesario que nosotros colaboremos en nuestra comunidad para lograr un desarrollo sostenible. Espero que los jóvenes se involucren más en las decisiones políticas y sociales, ya que es importante que tomemos la responsabilidad de nuestro propio futuro.",
    questions: [
        { q: "¿Cree el autor que una persona sola puede cambiar el mundo rápidamente?", a: ["no", "no lo cree"] },
        { q: "¿Qué es necesario que hagamos según el texto?", a: ["colaborar en comunidad", "colaboremos en nuestra comunidad"] },
        { q: "¿Qué espera el autor de los jóvenes?", a: ["que se involucren más", "involucrarse"] },
        { q: "¿Por qué es importante que tomemos decisiones responsables?", a: ["para asegurar el futuro", "responsabilidad de nuestro futuro"] }
    ]
};

const ex4Prompts = [
    { en: "It is important that you study.", answer: ["es importante que estudies"] },
    { en: "It is necessary that he arrives on time.", answer: ["es necesario que el llegue a tiempo"] },
    { en: "It is good that we are here.", answer: ["es bueno que estemos aqui"] },
    { en: "It is bad that they don't help.", answer: ["es malo que ellos no ayuden"] },
    { en: "It is possible that it rains tomorrow.", answer: ["es posible que llueva mañana"] },
    { en: "It is probable that she comes later.", answer: ["es probable que ella venga mas tarde"] },
    { en: "It is necessary that you tell the truth.", answer: ["es necesario que digas la verdad"] },
    { en: "It is good that he does exercise.", answer: ["es bueno que el haga ejercicio"] },
    { en: "It is important that they know the situation.", answer: ["es importante que ellos sepan la situacion"] },
    { en: "It is possible that we travel soon.", answer: ["es posible que viajemos pronto"] },
];

const completarPrompts = [
    { s: "1. No creo que tú _______ (venir) a mi casa.", a: "vengas" },
    { s: "2. Dudo que ellos _______ (tener) tiempo hoy.", a: "tengan" },
    { s: "3. No pienso que usted _______ (saber) la verdad.", a: "sepa" },
    { s: "4. Es posible que nosotros _______ (hacer) el proyecto.", a: "hagamos" },
    { s: "5. No es cierto que ella _______ (ir) a la fiesta.", a: "vaya" },
    { s: "6. Dudo que tú _______ (estar) enfermo.", a: "estés" },
    { s: "7. No creo que él _______ (beber) mucho café.", a: "beba" },
    { s: "8. Es probable que ellos _______ (llegar) tarde.", a: "lleguen" },
    { s: "9. No pienso que nosotros _______ (poder) ir al cine.", a: "podamos" },
    { s: "10. No es posible que tú _______ (ser) tan alto.", a: "seas" },
    { s: "11. Dudo que ellos _______ (estudiar) para el examen.", a: "estudien" },
    { s: "12. No creo que él _______ (traer) el libro.", a: "traiga" },
    { s: "13. No es cierto que nosotros _______ (decir) mentiras.", a: "digamos" },
    { s: "14. Es posible que ellos _______ (querer) venir.", a: "quieran" },
    { s: "15. Dudo que la situación _______ (cambiar) pronto.", a: "cambie" },
    { s: "16. No creo que usted _______ (comer) carne.", a: "coma" },
    { s: "17. No pienso que yo _______ (salir) temprano.", a: "salga" },
    { s: "18. Es probable que ellos _______ (conocer) a mi familia.", a: "conozcan" },
    { s: "19. No es cierto que nosotros _______ (encontrar) el camino.", a: "encontremos" },
    { s: "20. Dudo que tú _______ (escribir) la carta.", a: "escribas" },
    { s: "21. No creo que ella _______ (limpiar) su cuarto.", a: "limpie" },
    { s: "22. Es posible que ustedes _______ (abrir) la ventana.", a: "abran" },
    { s: "23. No pienso que tú _______ (pensar) en mí.", a: "pienses" },
    { s: "24. Dudo que nosotros _______ (perder) el tiempo.", a: "perdamos" },
    { s: "25. No es cierto que él _______ (querer) hablar.", a: "quiera" },
    { s: "26. Es probable que tú _______ (dar) un regalo.", a: "des" },
    { s: "27. No creo que la solución _______ (aparecer) pronto.", a: "aparezca" },
    { s: "28. No pienso que nosotros _______ (mantener) el orden.", a: "mantengamos" },
    { s: "29. Es posible que ellos _______ (vivir) en paz.", a: "vivan" },
    { s: "30. Dudo que tú _______ (escuchar) con atención.", a: "escuches" },
];

const finalPrompts = [
    { en: "I don't think you are tired.", answer: ["no creo que estés cansado" , "yo no creo que estes cansado"] },
    { en: "I doubt they have problems.", answer: ["dudo que tengan problemas" , "yo dudo que tengan problemas"] },
    { en: "It is not true that he is here.", answer: ["no es cierto que el este aqui"] },
    { en: "I don't believe we know the answer.", answer: ["no creo que sepamos la respuesta" , "yo no creo que sepamos la respuesta"] },
    { en: "I doubt she tells the truth.", answer: ["dudo que ella diga la verdad" , "yo dudo que ella diga la verdad"] },
    { en: "It is not possible that you are a doctor.", answer: ["no es posible que seas doctor" , "no es posible que tu seas doctor"] },
    { en: "I don't think it is a good idea.", answer: ["no creo que sea una buena idea" , "yo no creo que sea una buena idea"] },
    { en: "I doubt they find the solution.", answer: ["dudo que encuentren la solución" , "yo dudo que encuentren la solucion"] },
    { en: "It is not certain that it rains tonight.", answer: ["no es cierto que llueva esta noche" ] },
    { en: "I don't believe he comes to the party.", answer: ["no creo que el venga a la fiesta" , "yo no creo que el venga a la fiesta"] },
    { en: "I doubt the behavior changes now.", answer: ["dudo que el comportamiento cambie ahora" , "yo dudo que el comportamiento cambie ahora"] },
    { en: "It is not possible that we go together.", answer: ["no es posible que vayamos juntos" , "no es posible que nosotros vayamos juntos"] },
    { en: "I don't think they understand the situation.", answer: ["no creo que entiendan la situación" , "yo no creo que ellos entiendan la situación"] },
    { en: "I doubt you want to see her.", answer: ["dudo que quieras verla" , "yo dudo que quieras verla"] },
    { en: "It is not true that the society is perfect.", answer: ["no es cierto que la sociedad sea perfecta" ] },
];

const genericVocabHelp = {
    "razón": "right",
    "duda": "doubt",
    "decisión": "decision",
    "posible": "possible",
    "verdad": "truth",
    "respuesta": "answer",
    "vengan": "coming",
    "feliz": "happy",
    "importante": "important",
    "necesario": "necessary",
    "bueno": "good",
    "malo": "bad",
    "probable": "probable"
};

const readingVocab = {
    "conciencia": "awareness",
    "fundamentales": "fundamental",
    "individuo": "individual",
    "inacción": "inaction",
    "colaboremos": "collaborate",
    "comunidad": "community",
    "sostenible": "sustainable",
    "involucren": "involve",
    "responsabilidad": "responsibility",
    "futuro": "future"
};

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
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase correctamente.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</div>
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
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].en || prompts[currentIndex].spanish}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu traducción..." autoComplete="off" />
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
                    <CardTitle className="uppercase text-primary font-black">{title}</CardTitle>
                    <CardDescription className='font-bold text-foreground mt-1'>{description || "Elige la opción correcta."}</CardDescription>
                    <div className="flex gap-2 justify-start flex-wrap pt-4">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 py-10">
                <div className="text-3xl font-black text-center leading-relaxed text-foreground">
                    {prompts[currentIndex].text.split('_______').map((part: string, i: number) => (
                        <Fragment key={i}>
                            {part}
                            {i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", status[currentIndex] === 'correct' ? "text-primary border-primary" : "text-muted-foreground")}>{status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}</span>}
                        </Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", status[currentIndex] === 'correct' && opt.toUpperCase() === prompts[currentIndex].answer.toUpperCase() && "border-green-500 bg-green-50 text-green-700 shadow-lg scale-105")}>{opt}</Button>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <Button onClick={handleNext} disabled={status[currentIndex] !== 'correct'} className="px-12 font-black h-12 shadow-xl">Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

// --- MAIN CLASS COMPONENT ---

function Subjuntivo2ContentInternal() {
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

    // Form states
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(socialVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(socialVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));

    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));

    const [readAns, setReadAns] = useState<Record<number, string>>({});
    const [readVal, setReadVal] = useState<Record<number, any>>({});
    const [transText, setTransText] = useState('');

    const initialPathData = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3', icon: ListChecks, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4', icon: PenSquare, status: 'locked' },
        { key: 'complete', name: '10. Completar', icon: Pencil, status: 'locked' },
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
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic };
            learningPath.forEach(t => s[t.key] = t.status);
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 2000);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { np[i + 1].status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión desbloqueada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (['grammar'].includes(topicKey)) handleTopicCompleteInternal(topicKey);
    };

    const handleTopicCompleteInternal = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = socialVocab.map((v, i) => {
            const res = v.es === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) allOk = false; return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (allOk) { setCanAdvanceVocab(true); toast({ title: "¡Perfecto!" }); }
        else toast({ variant: 'destructive', title: "Revisa las palabras" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario: Opiniones y Sociedad</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                                    {socialVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-2 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                            <Input value={vocabAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); setCanAdvanceVocab(false); }} className={cn("uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Indicativo vs Subjuntivo</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase">Opinión Afirmativa (Indicativo)</h3>
                                <p className='text-lg'>Cuando expresas una creencia con certeza, usas el presente normal.</p>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-primary font-mono'>
                                    <div className='p-4 bg-muted rounded-xl border-l-4 border-green-500'>Creo que <strong>es</strong> importante.</div>
                                    <div className='p-4 bg-muted rounded-xl border-l-4 border-green-500'>Pienso que <strong>tiene</strong> razón.</div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-brand-purple uppercase">Duda y Negación (Subjuntivo)</h3>
                                <p className='text-lg'>Cuando niegas o dudas de una opinión, el verbo cambia a su forma subjuntiva.</p>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-brand-purple font-mono'>
                                    <div className='p-4 bg-muted rounded-xl border-l-4 border-red-500'>No creo que <strong>sea</strong> importante.</div>
                                    <div className='p-4 bg-muted rounded-xl border-l-4 border-red-500'>Dudo que <strong>tenga</strong> razón.</div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjugationVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación Subjuntiva ({conjIdx+1}/30)</CardTitle><CardDescription>Conjuga el verbo en presente de subjuntivo.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.es} ({v.v})</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl'>
                                {["YO", "TÚ", "ÉL/ELLA", "NOSOTROS", "ELLOS"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase transition-all", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={() => {
                            const nv = conjAns.map((a, i) => a.trim().toLowerCase() === v.forms[i] ? 'correct' : 'incorrect');
                            setConjVal(nv);
                            if (nv.every(st => st === 'correct')) { toast({ title: "¡Perfecto!" }); if (conjIdx < conjugationVerbs.length - 1) { setTimeout(() => { setConjIdx(p => p+1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }, 800); } else handleTopicCompleteInternal('conjugation'); }
                            else toast({ variant: 'destructive', title: "Revisa la conjugación" });
                        }} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Ejercicio 1: Traducción de Duda" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={genericVocabHelp} />;
            case 'exercise_2': return <BallsExercise title="Ejercicio 2: Transformación (Afirmación &rarr; Negación)" prompts={ex2Prompts} onComplete={() => handleTopicCompleteInternal('exercise_2')} vocabulary={genericVocabHelp} />;
            case 'vocab_game': return <VocabularyMatchingGame data={socialVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Opinions & Society Memory" />;
            case 'exercise_3': return <ChoiceExercise title="Ejercicio 3: Elige la forma correcta" prompts={ex3Options} onComplete={() => handleTopicCompleteInternal('exercise_3')} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-start">
                                <CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                                            <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4">
                                            <div className="grid grid-cols-1 gap-2 text-sm text-foreground text-left">
                                                <h4 className="font-bold border-b pb-1 text-primary uppercase">Ayuda de Misión</h4>
                                                {Object.entries(readingVocab).map(([es, en]) => (
                                                    <div key={es} className="flex justify-between border-b border-muted pb-1">
                                                        <span className="font-bold uppercase text-[10px]">{es}:</span>
                                                        <span className="text-muted-foreground italic text-[10px]">{en}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold'>{i+1}. {q.q}</Label><Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [i]: e.target.value}); setReadVal({...readVal, [i]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12', readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => {
                            let ok = true; const nv: any = {};
                            readingData.questions.forEach((q, i) => { const res = q.a.some(a => (readAns[i] || '').trim().toLowerCase().includes(a.toLowerCase())); nv[i] = res ? 'correct' : 'incorrect'; if (!res) ok = false; });
                            setReadVal(nv); if (ok) { toast({ title: "¡Lectura superada!" }); handleTopicCompleteInternal('reading'); } else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
                        }} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4': return <BallsExercise title="Ejercicio 4: Estructuras Impersonales" prompts={ex4Prompts} onComplete={() => handleTopicCompleteInternal('exercise_4')} vocabulary={genericVocabHelp} />;
            case 'complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: El Subjuntivo en Acción</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={compAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
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
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: Advice for a Friend</CardTitle></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-foreground"><div className="grid grid-cols-1 gap-2 text-sm">{Object.entries({"advice": "consejo", "worry": "preocuparse", "healthy": "saludable", "improvement": "mejora", "decision": "decisión", "hope": "esperar/ojalá", "important": "importante", "change": "cambiar"}).map(([en, es], i) => (<div key={i} className="flex justify-between border-b pb-1"><span className="text-muted-foreground capitalize">{en}:</span><span className="font-bold text-primary text-right">{es.toUpperCase()}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm">"I am worried about my friend Mark. It is necessary that he changes his routine if he wants a better life. I recommend that he exercises every day and I hope that he eats more fruits. It is important that he listens to my advice because I want him to be healthy. I am happy that he is deciding to improve his situation now."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (targetStudentId) return; setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicCompleteInternal('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Reto Final: Traducción Mixta" prompts={finalPrompts} onComplete={() => handleTopicCompleteInternal('final')} vocabulary={genericVocabHelp} />;
            default: return null;
        }
    };

    if (isUserLoading || isProfileLoading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
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
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><GraduationCap className='h-10 w-10 text-primary' /> Subjuntivo 2 🇪🇸</h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
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
                                        <div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground">
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

export default function Subjuntivo2Page() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <Subjuntivo2ContentInternal />
        </Suspense>
    );
}