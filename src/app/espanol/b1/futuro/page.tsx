'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Gamepad2, 
    BookText, 
    Trophy,
    ArrowLeft,
    ArrowRight,
    Star,
    Loader2,
    MessageSquare,
    Pencil,
    Zap,
    Check,
    X,
    Info,
    ListChecks,
    Rocket
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

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_b1_futuro_v106_fix_ghost_state';
const mainProgressKey = 'progress_b1_es_futuro';

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const plansVocab = [
    { en: "PROFESSION", es: "PROFESION" }, { en: "TECHNOLOGY", es: "TECNOLOGIA" }, { en: "FUTURE", es: "FUTURO" },
    { en: "PROJECT", es: "PROYECTO" }, { en: "CAREER", es: "CARRERA" }, { en: "CITY", es: "CIUDAD" },
    { en: "ENVIRONMENT", es: "MEDIO AMBIENTE" }, { en: "PLANET", es: "PLANETA" }, { en: "GOAL", es: "META" },
    { en: "OBJECTIVE", es: "OBJETIVO" }, { en: "PREDICTION", es: "PREDICCION" }, { en: "CHANGE", es: "CAMBIO" },
    { en: "EVOLUTION", es: "EVOLUCION" }, { en: "ROBOT", es: "ROBOT" }, { en: "ARTIFICIAL INTELLIGENCE", es: "INTELIGENCIA ARTIFICIAL" },
    { en: "JOB", es: "EMPLEO" }, { en: "SUCCESS", es: "ÉXITO" }, { en: "OPPORTUNITY", es: "OPORTUNIDAD" },
    { en: "LIFE", es: "VIDA" }, { en: "DREAM", es: "SUEÑO" },
];

const futureVerbs = [
    // Regulares
    { en: "SPEAK", es: "hablar", root: "hablar" }, { en: "EAT", es: "comer", root: "comer" },
    { en: "LIVE", es: "vivir", root: "vivir" }, { en: "STUDY", es: "estudiar", root: "estudiar" },
    { en: "WORK", es: "trabajar", root: "trabajar" }, { en: "TRAVEL", es: "viajar", root: "viajar" },
    { en: "BUY", es: "comprar", root: "comprar" }, { en: "SELL", es: "vender", root: "vender" },
    { en: "LEARN", es: "aprender", root: "aprender" }, { en: "OPEN", es: "abrir", root: "abrir" },
    { en: "RUN", es: "correr", root: "correr" }, { en: "WALK", es: "caminar", root: "caminar" },
    { en: "SING", es: "cantar", root: "cantar" }, { en: "DANCE", es: "bailar", root: "bailar" },
    { en: "LISTEN", es: "escuchar", root: "escuchar" }, { en: "READ", es: "leer", root: "leer" },
    { en: "WRITE", es: "escribir", root: "escribir" }, { en: "JUMP", es: "saltar", root: "saltar" },
    { en: "PLAY", es: "jugar", root: "jugar" }, { en: "COOK", es: "cocinar", root: "cocinar" },
    // Irregulares
    { en: "HAVE", es: "tener", root: "tendr" }, { en: "DO/MAKE", es: "hacer", root: "har" },
    { en: "CAN", es: "poder", root: "podr" }, { en: "SAY", es: "decir", root: "dir" },
    { en: "EXIT/GO OUT", es: "salir", root: "saldr" }, { en: "PUT", es: "poner", root: "pondr" },
    { en: "WANT", es: "querer", root: "querr" }, { en: "COME", es: "venir", root: "vendr" },
    { en: "KNOW", es: "saber", root: "sabr" }, { en: "VALUE", es: "valer", root: "valdr" }
];

const ex1Prompts = [
    { en: "I will talk to my boss.", answer: ["yo hablaré con mi jefe", "yo hablare con mi jefe"] },
    { en: "You will eat a pizza tonight.", answer: ["tu comerás una pizza esta noche", "tu comeras una pizza esta noche"] },
    { en: "She will live in London.", answer: ["ella vivirá en londres", "ella vivira en londres"] },
    { en: "We will study for the exam.", answer: ["estudiaremos para el examen", "nosotros estudiaremos para el examen"] },
    { en: "They will work on the project.", answer: ["ellos trabajarán en el proyecto", "ellos trabajaran en el proyecto"] },
    { en: "He will travel to Japan next year.", answer: ["el viajara a japon el proximo año", "él viajará a japón el año que viene"] },
    { en: "I will buy a new computer.", answer: ["yo compraré una computadora nueva", "yo comprare una computadora nueva"] },
    { en: "We will learn a new language.", answer: ["nosotros aprenderemos un idioma nuevo", "nosotrosaprenderemos un nuevo idioma"] },
    { en: "She will open the door.", answer: ["ella abrirá la puerta", "ella abrira la puerta"] },
    { en: "They will run in the park.", answer: ["ellos correrán en el parque", "ellos correran en el parque"] },
    { en: "You will write a book in the future.", answer: ["tu escribiras un libro en el futuro", "tú escribirás un libro en el futuro"] },
    { en: "He will cook a special dinner.", answer: ["el cocinara una cena especial", "él cocinará una cena especial"] },
];

const ex2Prompts = [
    { en: "I will have a better job.", answer: ["yo tendre un mejor empleo", "tendré un mejor trabajo"] },
    { en: "She will do her homework later.", answer: ["ella hara su tarea mas tarde", "ella hará su tarea luego"] },
    { en: "We will be able to travel soon.", answer: ["podremos viajar pronto", "nosotros podremos viajar pronto"] },
    { en: "They will say the truth.", answer: ["ellos diran la verdad", "ellos dirán la verdad"] },
    { en: "You will leave at 8 o'clock.", answer: ["tu saldras a las ocho en punto", "saldrás a las 8 en punto"] },
    { en: "He will put the keys on the table.", answer: ["el pondra las llaves sobre la mesa", "él pondrá las llaves sobre la mesa"] },
    { en: "I will want more coffee.", answer: ["yo querre mas cafe", "yo querré más café"] },
    { en: "They will come to the party.", answer: ["ellos vendran a la fiesta", "ellos vendrán a la fiesta"] },
    { en: "We will know the answer tomorrow.", answer: ["nosotros sabremos la respuesta mañana", "nosotros sabremos el resultado mañana"] },
    { en: "She will have a surprise for you.", answer: ["ella tendra una sorpresa para ti", "ella tendrá una sorpresa para ti"] },
    { en: "I will do my best.", answer: ["yo hare mi mejor esfuerzo", "yo haré mi mejor esfuerzo"] },
    { en: "You will be able to speak Spanish.", answer: ["tu podras hablar español", "tú podrás hablar español"] },
];

const ex3Prompts = [
    { en: "Tomorrow it will be sunny.", answer: ["mañana estará soleado" , "mañana estara soleado"] },
    { en: "I will have a big project in June.", answer: ["yo tendre un proyecto grande en junio", "yo tendré un gran proyecto en junio"] },
    { en: "She will study architecture at the university.", answer: ["ella estudiará arquitectura en la universidad" , "ella estudiara arquitectura en la universidad"] },
    { en: "We will do the evolution of the city.", answer: ["nosotros haremos la evolución de la ciudad" , "nosotros haremos la evolucion de la ciudad"] },
    { en: "They will come with more technology.", answer: ["ellos vendrán con más tecnología" , "ellos vendran con mas tecnologia"] },
    { en: "I will say my prediction.", answer: ["yo diré mi predicción", "yo dire mi prediccion"] },
    { en: "He will work in a robot factory.", answer: ["él trabajará en una fábrica de robots" , "el trabajara en una fabrica de robots"] },
    { en: "You will live your dream.", answer: ["tú vivirás tu sueño", "tu viviras tu sueño"] },
    { en: "We will have success in the career.", answer: ["nosotros tendremos éxito en la carrera" , "nosotros tendremos exito en la carrera"] },
    { en: "They will want a change in the environment.", answer: ["ellos querrán un cambio en el medio ambiente" , "ellos querran un cambio en el medio ambiente"] },
    { en: "She will sell her house next month.", answer: ["ella venderá su casa el próximo mes" , "ella vendera su casa el proximo mes"] },
    { en: "I will learn about artificial intelligence.", answer: ["yo aprenderé sobre inteligencia artificial", "yo aprendere sobre inteligencia artificial"] },
];

const readingData = {
    title: "El Mundo en el Año 2050",
    content: "En el futuro, el mundo cambiará mucho. La tecnología será parte de todo. Los robots harán la mayoría de los trabajos y nosotros tendremos más tiempo libre. Los científicos dirán que el medio ambiente estará mejor porque usaremos energía limpia. Las ciudades serán más grandes y los carros volarán. Las personas vivirán muchos años y nosotros podremos viajar a otros planetas. Yo tendré un empleo interesante en el espacio.",
    questions: [
        { q: "¿Qué harán los robots en el futuro?", a: ["la mayoría de los trabajos", "los trabajos"] },
        { q: "¿Cómo estará el medio ambiente?", a: ["estará mejor"] },
        { q: "¿Qué harán los carros en el futuro?", a: ["volarán"] },
        { q: "¿Dónde tendrá el narrador un empleo?", a: ["en el espacio"] }
    ],
    vocabulary: { "científicos": "scientists", "energía limpia": "clean energy", "volarán": "will fly", "planetas": "planets", "espacio": "space" }
};

const choiceExercisesData = [
    { text: "Mañana yo _______ (hablar) con mi profesor.", options: ["HABLARÉ", "HABLARÁ", "HABLARE"], answer: "HABLARÉ" },
    { text: "Ellos _______ (tener) una casa nueva pronto.", options: ["TENDRÁN", "TENERÁN", "TIENEN"], answer: "TENDRÁN" },
    { text: "Nosotros _______ (hacer) el proyecto juntos.", options: ["HAREMOS", "HACEREMOS", "HACEMOS"], answer: "HAREMOS" },
    { text: "Tú _______ (poder) hablar español muy bien.", options: ["PODRÁS", "PODERÁS", "PUEDES"], answer: "PODRÁS" },
    { text: "Ella _______ (salir) de viaje el lunes.", options: ["SALDRÁ", "SALIRÁ", "SALE"], answer: "SALDRÁ" },
    { text: "Nosotros _______ (ir) al parque mañana.", options: ["IREMOS", "IRÉMOS", "VAMOS"], answer: "IREMOS" },
    { text: "Ustedes _______ (salir) de vacaciones en octubre.", options: ["SALDRÁN", "SALIRÁN", "SALEN"], answer: "SALDRÁN" },
    { text: "", options: ["", "SALIRÁ", "SALE"], answer: "SALDRÁ" },
];

const completionPrompts = [
    { s: "1. Yo (comer) _______ en un restaurante caro.", a: "comeré" },
    { s: "2. Tú (vivir) _______ en una ciudad inteligente.", a: "vivirás" },
    { s: "3. Ella (aprender) _______ a programar.", a: "aprenderá" },
    { s: "4. Nosotros (viajar) _______ a Marte.", a: "viajaremos" },
    { s: "5. Ellos (vender) _______ sus productos por internet.", a: "venderán" },
    { s: "6. Él (decir) _______ la verdad siempre.", a: "dirá" },
    { s: "7. Yo (hacer) _______ una predicción.", a: "haré" },
    { s: "8. Tú (tener) _______ un gran futuro.", a: "tendrás" },
    { s: "9. Nosotros (poner) _______ orden en la oficina.", a: "pondremos" },
    { s: "10. Ellas (querer) _______ más oportunidades.", a: "querrán" },
    { s: "11. Yo (saber) _______ la respuesta mañana.", a: "sabré" },
    { s: "12. Él (venir) _______ a la reunión.", a: "vendrá" },
    { s: "13. Ustedes (abrir) _______ una nueva empresa.", a: "abrirán" },
    { s: "14. Nosotros (limpiar) _______ el planeta.", a: "limpiaremos" },
    { s: "15. Ella (estudiar) _______ medicina.", a: "estudiará" },
    { s: "16. Yo (caminar) _______ por la luna.", a: "caminaré" },
    { s: "17. Tú (trabajar) _______ con inteligencia artificial.", a: "trabajarás" },
    { s: "18. Ellos (comprar) _______ un carro eléctrico.", a: "comprarán" },
    { s: "19. Nosotros (ver) _______ los cambios pronto.", a: "veremos" },
    { s: "20. Él (correr) _______ en la maratón.", a: "correrá" },
    { s: "21. Yo (escribir) _______ mi biografía.", a: "escribiré" },
    { s: "22. Tú (cantar) _______ en el concierto.", a: "cantarás" },
    { s: "23. Ella (bailar) _______ en el teatro.", a: "bailará" },
    { s: "24. Nosotros (escuchar) _______ tus ideas.", a: "escucharemos" },
    { s: "25. Ellos (ganar) _______ el premio.", a: "ganarán" },
    { s: "26. Yo (ayudar) _______ al medio ambiente.", a: "ayudaré" },
    { s: "27. Tú (soñar) _______ con el éxito.", a: "soñarás" },
    { s: "28. Él (cambiar) _______ su vida.", a: "cambiará" },
    { s: "29. Ellas (lograr) _______ sus objetivos.", a: "lograrán" },
    { s: "30. Nosotros (ser) _______ muy felices.", a: "seremos" },
];

const translationTextEng = "In the future, technology will change our lives. We will have smart homes and robots will do the housework. I will work in a digital city and I will have many opportunities. The environment will be cleaner and we will use renewable energy. I will travel to other countries and I will learn new cultures. Success will be easy if we study hard.";

const finalNegativePrompts = [
    { en: "I will not talk to him.", answer: ["yo no hablaré con él", "yo no hablare con él"] },
    { en: "She will not eat meat.", answer: ["ella no comerá carne", "ella no comera carne"] },
    { en: "We will not live here.", answer: ["no viviremos aquí", "nosotros no viviremos aqui"] },
    { en: "They will not have time.", answer: ["ellos no tendrán tiempo", "ellos no tendran tiempo"] },
    { en: "I will not do that.", answer: ["yo no lo haré", "yo no hare eso"] },
    { en: "You will not say anything.", answer: ["tu no diras nada", "tú no dirás nada"] },
    { en: "He will not come tomorrow.", answer: ["el no vendra mañana", "él no vendrá mañana"] },
    { en: "She will not want this.", answer: ["ella no querra esto", "ella no querrá esto"] },
    { en: "We will not be able to go.", answer: ["no podremos ir", "nosotros no podremos ir"] },
    { en: "They will not leave early.", answer: ["ellos no saldran temprano", "ellos no saldrán temprano"] },
    { en: "I will not put the keys there.", answer: ["yo no pondre las llaves allí", "yo no pondré las llaves ahí"] },
    { en: "You will not buy that car.", answer: ["tu no compraras ese carro", "tú no comprarás ese coche"] },
    { en: "He will not study tonight.", answer: ["el no estudiara esta noche", "él no estudiará esta noche"] },
    { en: "She will not know the truth.", answer: ["ella no sabra la verdad", "ella no sabrá la verdad"] },
    { en: "We will not forget the mission.", answer: ["nosotros no olvidaremos la mision", "nosotros no olvidaremos la misión"] },
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setUserAnswers({}); setStatus({}); }, [prompts]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const currentAnswer = userAnswers[currentIndex] || '';
        const userVal = currentAnswer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex]?.answer || [];
        const isCorrect = (corrects || []).some((a: string) => a && a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        
        if (isCorrect) {
            toast({ title: "¡Buen trabajo!" });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando" });
        }
    };

    if (!prompts || prompts.length === 0 || !prompts[currentIndex]) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
            </div>
        );
    }

    const currentStatus = status[currentIndex] || 'unchecked';

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase al español usando el tiempo futuro.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div 
                                    key={i} 
                                    onClick={() => setCurrentIndex(i)} 
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", 
                                        currentIndex === i ? "border-primary ring-2 ring-primary scale-110" : "border-muted", 
                                        status[i] === 'correct' ? "!bg-green-600 !text-white !border-green-600 !shadow-[0_0_10px_rgba(22,163,74,0.5)]" : 
                                        status[i] === 'incorrect' ? "!bg-red-600 !text-white !border-red-600 !shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "bg-card text-foreground"
                                    )}
                                >
                                    {i + 1}
                                </div>
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
                                <ScrollArea className="h-48 pr-4 text-left text-foreground">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (
                                            <Fragment key={en}>
                                                <span className="text-muted-foreground capitalize">{en}:</span>
                                                <span className="font-semibold text-right text-primary">{(es || '').toUpperCase()}</span>
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
                    {prompts[currentIndex]?.en}
                </div>
                <Input 
                    value={userAnswers[currentIndex] || ''} 
                    onChange={e => {
                        if (isSupervisionMode) return;
                        setUserAnswers({...userAnswers, [currentIndex]: e.target.value});
                        setStatus({...status, [currentIndex]: 'unchecked'});
                    }} 
                    onKeyDown={e => e.key === 'Enter' && handleCheck()} 
                    className={cn(
                        "h-12 text-lg text-foreground border-2 transition-all", 
                        currentStatus === 'correct' ? '!border-green-600 !bg-green-500/10 !ring-green-500/20 shadow-[0_0_15px_rgba(22,163,74,0.3)]' : 
                        currentStatus === 'incorrect' ? '!border-red-600 !bg-red-500/10 !ring-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : ''
                    )} 
                    placeholder="Escribe la traducción en futuro..." 
                    autoComplete="off" 
                    readOnly={isSupervisionMode} 
                />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button>
                <div className="flex gap-2">
                    {!isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    <Button onClick={() => currentIndex < prompts.length - 1 ? setCurrentIndex(i => i + 1) : onComplete()} disabled={currentStatus !== 'correct' && !isAdmin} className="text-white font-bold">{currentIndex === prompts.length - 1 ? 'Finalizar' : 'Siguiente'}</Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ChoiceExercise = ({ prompts, onComplete, title, isSupervisionMode }: any) => {
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-foreground">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", status[currentIndex] === 'correct' && opt === prompts[currentIndex].answer && "border-green-500 bg-green-50 text-green-700 scale-105")} disabled={isSupervisionMode}>{opt}</Button>
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

// --- MAIN PAGE ---

function FuturoContentInternal() {
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
    const [vocabAns, setVocabAns] = useState<string[]>(Array(plansVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(plansVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAnswers, setConjAnswers] = useState<string[]>(Array(5).fill(''));
    const [conjValidation, setConjValidation] = useState<any[]>(Array(5).fill('unchecked'));

    const [compAns, setCompAns] = useState<string[]>(Array(completionPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completionPrompts.length).fill('unchecked'));

    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

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
        { key: 'exercise_1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
        { key: 'complete', name: '10. Completar', icon: Trophy, status: 'locked' },
        { key: 'translate', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;

        let path = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        let savedST = '';

        if (isAdmin && !targetStudentId) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (savedData[item.key]) item.status = savedData[item.key]; });
            savedST = savedData.lastSelectedTopic || '';
            if (savedData.vocabAns) setVocabAns(savedData.vocabAns);
            if (savedData.transText) setTransText(savedData.transText);
            if (savedData.readAns) setReadAns(savedData.readAns);
        }

        if (!isAdmin || targetStudentId) {
            let lastDone = true;
            for (let i = 0; i < path.length; i++) {
                if (lastDone && path[i].status === 'locked') path[i].status = 'active';
                lastDone = path[i].status === 'completed';
            }
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
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
            t: transText,
            r: readAns
        });

        if (currentSerialized === lastSerializedRef.current) return;

        const saveTimer = setTimeout(() => {
            const s: any = { 
                lastSelectedTopic: selectedTopic,
                vocabAns,
                transText,
                readAns
            };
            learningPath.forEach(item => { s[item.key] = item.status; });
            
            lastSerializedRef.current = currentSerialized;
            
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
        }, 2000);

        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAns, transText, readAns]);

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
            if (nextToSelect) { 
                const finalNext = nextToSelect; 
                setTimeout(() => setSelectedTopic(finalNext), 0); 
            }
            return newPath;
        });
        
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { 
            toast({ variant: "destructive", title: "Contenido Bloqueado" }); 
            return; 
        }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicCompleteInternal('grammar');
    };

    const handleTopicCompleteInternal = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = plansVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase().split(' / ')[0] === (vocabAns[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (okCount === plansVocab.length) {
            setCanAdvanceVocab(true);
            toast({ title: "¡Excelente!", description: "Has dominado el vocabulario." });
        } else if (okCount >= 10) {
            setCanAdvanceVocab(true);
            toast({ title: "Buen progreso", description: "Puedes avanzar o intentar completarlas todas." });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: `Llevas ${okCount} de 20.` });
        }
    };

    const handleCheckConj = () => {
        const v = futureVerbs[conjIdx];
        const corrects = ["é", "ás", "á", "emos", "án"].map(end => v.root + end);
        const nv = conjAnswers.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjValidation(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < futureVerbs.length - 1) {
                setTimeout(() => {
                    setConjIdx(p => p + 1);
                    setConjAnswers(Array(5).fill(''));
                    setConjValidation(Array(5).fill('unchecked'));
                }, 800);
            } else {
                handleTopicCompleteInternal('conjugation');
            }
        } else {
            toast({ variant: 'destructive', title: "Revisa la conjugación" });
        }
    };

    const handleCheckReading = () => {
        let ok = true;
        const nv: any = {};
        readingData.questions.forEach((q, i) => {
            const userAns = (readAns[i] || '').trim().toLowerCase();
            const res = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[i] = res ? 'correct' : 'incorrect';
            if (!res) ok = false;
        });
        setReadVal(nv);
        if (ok) {
            toast({ title: "¡Lectura superada!" });
            handleTopicCompleteInternal('reading');
        } else {
            toast({ variant: 'destructive', title: "Revisa tus respuestas" });
        }
    };

    const handleCheckComplete = () => {
        let ok = true;
        const nv = completionPrompts.map((q, i) => {
            const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase();
            if (!res) ok = false;
            return res ? 'correct' : 'incorrect';
        });
        setCompVal(nv);
        if (ok) {
            toast({ title: "¡Dominio total!" });
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
                        <CardHeader className='bg-primary/5 border-b text-foreground'>
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Planes y Predicciones (20)</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Traduce las palabras al español.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-[450px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div>
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                                    {plansVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="flex items-center font-bold py-1 text-sm text-foreground">{v.en}</div>
                                            <Input 
                                                value={vocabAns[i] || ''} 
                                                onChange={e => { 
                                                    if (targetStudentId) return;
                                                    const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); 
                                                    const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv);
                                                }} 
                                                className={cn("h-10 uppercase transition-all text-foreground", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
                                                autoComplete="off" 
                                                readOnly={!!targetStudentId}
                                            />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20">
                            <Button onClick={handleVocabCheck} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button>
                        </CardFooter>
                    </Card>
                );

            case 'grammar':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-foreground overflow-hidden">
                            <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMÁTICA: EL FUTURO EN ESPAÑOL</CardTitle></CardHeader>
                            <CardContent className="space-y-8 px-0 font-bold">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                    <h3 className="text-xl font-black text-primary uppercase">1. Verbos Regulares</h3>
                                    <p>Se utiliza el infinitivo completo del verbo y se le agregan las siguientes terminaciones:</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-primary">
                                        <div className='p-2 border rounded bg-primary/10 text-center'>-é (Yo)</div>
                                        <div className='p-2 border rounded bg-primary/10 text-center'>-ás (Tú)</div>
                                        <div className='p-2 border rounded bg-primary/10 text-center'>-á (Él/Ella)</div>
                                        <div className='p-2 border rounded bg-primary/10 text-center'>-emos (Nosotros)</div>
                                        <div className='p-2 border rounded bg-primary/10 text-center'>-án (Ellos/Uds)</div>
                                    </div>
                                    <div className="pt-2 text-muted-foreground italic">
                                        Ej: Hablaré, Comeré, Viviré.
                                    </div>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                    <h3 className="text-xl font-black text-brand-purple uppercase">2. Verbos Irregulares</h3>
                                    <p>Cambian su raíz, pero usan las MISMAS terminaciones:</p>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-mono">
                                        <p>Tener &rarr; <span className="text-primary font-black">tendr-</span></p>
                                        <p>Hacer &rarr; <span className="text-primary font-black">har-</span></p>
                                        <p>Poder &rarr; <span className="text-primary font-black">podr-</span></p>
                                        <p>Decir &rarr; <span className="text-primary font-black">dir-</span></p>
                                        <p>Salir &rarr; <span className="text-primary font-black">saldr-</span></p>
                                        <p>Poner &rarr; <span className="text-primary font-black">pondr-</span></p>
                                        <p>Querer &rarr; <span className="text-primary font-black">querr-</span></p>
                                        <p>Venir &rarr; <span className="text-primary font-black">vendr-</span></p>
                                    </div>
                                </div>
                                <div className="p-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-[2rem] border-2 border-dashed border-yellow-500/50 text-foreground">
                                    <h3 className="text-xl font-black text-yellow-800 dark:text-yellow-200 uppercase mb-4 flex items-center gap-2"><Info /> Uso del Futuro</h3>
                                    <p className="mb-2">1. Planes futuros: "Viajaré a Europa el próximo año".</p>
                                    <p className="mb-2">2. Predicciones: "La tecnología cambiará el mundo".</p>
                                    <p className="mb-2">3. Promesas: "Te diré la verdad".</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );

            case 'conjugation':
                const v = futureVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center text-foreground">
                                <CardTitle className='text-primary uppercase tracking-tighter'>Misión: Futuro ({conjIdx + 1}/30)</CardTitle>
                                <span className='font-bold text-muted-foreground uppercase'>{v.en}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.es}</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mx-auto'>
                                {["YO", "TÚ", "ÉL/ELLA", "NOSOTROS", "ELLOS"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAnswers[i]} onChange={e => { if (targetStudentId) return; const na = [...conjAnswers]; na[i] = e.target.value; setConjAnswers(na); const nv = [...conjValidation]; nv[i] = 'unchecked'; setConjValidation(nv); }} className={cn("h-10 text-lg uppercase text-foreground", conjValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );

            case 'exercise_1': return <BallsExercise title="Ejercicio 1: Verbos Regulares" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={{"jefe": "boss", "próximo año": "next year", "idioma": "language", "computadora": "computer"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <BallsExercise title="Ejercicio 2: Verbos Irregulares" prompts={ex2Prompts} onComplete={() => handleTopicCompleteInternal('exercise_2')} vocabulary={{"pronto": "soon", "verdad": "truth", "esfuerzo": "best", "sorpresa": "surprise"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={plansVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Planes y Predicciones Memory" />;
            case 'exercise_3': return <BallsExercise title="Ejercicio 3: Mixto" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('exercise_3')} vocabulary={{"soleado": "sunny", "éxito": "success", "medio ambiente": "environment", "próximo mes": "next month"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingData.questions.map((q, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border border-border/50">
                                        <Label className="font-bold">{q.q}</Label>
                                        <Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = {...readAns}; na[i] = e.target.value; setReadAns(na); const nv = {...readVal}; nv[i] = 'unchecked'; setReadVal(nv); }} className={cn("h-10 text-foreground", readVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/10"><Button onClick={handleCheckReading} size="lg" className="px-16 font-black h-12 shadow-md">Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4': return <ChoiceExercise title="Ejercicio 4: Elige la opción" prompts={choiceExercisesData} onComplete={() => handleTopicCompleteInternal('exercise_4')} isSupervisionMode={!!targetStudentId} />;
            case 'complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: El Futuro</CardTitle></CardHeader>
                        <CardContent className="p-0 text-foreground">
                            <ScrollArea className="h-[450px] p-6 text-foreground">
                                <div className="space-y-4">
                                    {completionPrompts.map((q, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                            <p className="font-bold text-lg text-foreground">{q.s}</p>
                                            <Input value={compAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase text-foreground", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckComplete} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div><CardTitle className='text-primary uppercase'>Traducción de Texto: The Future</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0 text-foreground"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-foreground">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {Object.entries({ "smart": "inteligente", "housework": "tareas del hogar", "opportunities": "oportunidades", "renewable": "renovable", "cultures": "culturas", "easier": "más fácil" }).map(([en, es], i) => (<Fragment key={i}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-bold text-right text-primary">{(es || '').toUpperCase()}</span></Fragment>))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-black dark:text-white">"{translationTextEng}"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicCompleteInternal('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final':
                return (
                    <div className="space-y-6">
                        <div className="text-left mb-4 text-white">
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Misión Final: Frases Negativas</h2>
                            <p className="font-bold text-lg text-white">Traduce las frases al español usando la negación en futuro.</p>
                        </div>
                        <BallsExercise title="Final Challenge: Negation" prompts={finalNegativePrompts} onComplete={() => handleTopicCompleteInternal('final')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} vocabulary={{"tonight": "esta noche", "truth": "verdad", "mission": "misión", "forget": "olvidar"}} />
                    </div>
                );
            default:
                return null;
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-white font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión...</p>
            </div>
        );
    }

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
                           <Rocket className='h-10 w-10 text-primary' /> El Futuro 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        {/* Contenido Principal */}
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>

                        {/* Barra Lateral de Navegación */}
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2 text-foreground">
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
                                                        <div className="flex items-center gap-3 text-black dark:text-white">
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

export default function FuturoPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <FuturoContentInternal />
        </Suspense>
    );
}
