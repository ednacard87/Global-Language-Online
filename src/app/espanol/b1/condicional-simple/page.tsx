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
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    BookText,
    Pencil,
    Star,
    ArrowLeft,
    MessageSquare,
    ListChecks,
    Activity,
    Zap,
    Sparkles,
    Eye,
    HelpCircle
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
const progressStorageVersion = 'progress_es_b1_cond_simple_v2_full';
const mainProgressKey = 'progress_b1_es_condicional_simple';

interface Topic {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
}

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const hypotheticalVocab = [
    { en: "DREAM", es: "SUEÑO" }, { en: "OPPORTUNITY", es: "OPORTUNIDAD" }, { en: "PROBLEM", es: "PROBLEMA" },
    { en: "DECISION", es: "DECISIÓN" }, { en: "MONEY", es: "DINERO" }, { en: "JOB", es: "TRABAJO" },
    { en: "TRIP", es: "VIAJE" }, { en: "FUTURE", es: "FUTURO" }, { en: "GOAL", es: "META" },
    { en: "WORLD", es: "MUNDO" }, { en: "BILLIONAIRE", es: "MILLONARIO" }, { en: "LOTTERY", es: "LOTERÍA" },
    { en: "ISLAND", es: "ISLA" }, { en: "SUCCESS", es: "ÉXITO" }, { en: "HEALTH", es: "SALUD" },
    { en: "HAPPINESS", es: "FELICIDAD" }, { en: "CHANGE", es: "CAMBIO" }, { en: "CHOICE", es: "ELECCIÓN" },
    { en: "LUCK", es: "SUERTE" }, { en: "HOPE", es: "ESPERANZA" }, { en: "ADVENTURE", es: "AVENTURA" }
];

const conjugationList = [
    { v: "VIAJAR", en: "TRAVEL", type: "reg", forms: ["viajaría", "viajarías", "viajaría", "viajaríamos", "viajarían"] },
    { v: "COMPRAR", en: "BUY", type: "reg", forms: ["compraría", "comprarías", "compraría", "compraríamos", "comprarían"] },
    { v: "ESTUDIAR", en: "STUDY", type: "reg", forms: ["estudiaría", "estudiarías", "estudiaría", "estudiaríamos", "estudiarían"] },
    { v: "TENER", en: "HAVE", type: "irreg", forms: ["tendría", "tendrías", "tendría", "tendríamos", "tendrían"] },
    { v: "HACER", en: "DO", type: "irreg", forms: ["haría", "harías", "haría", "haríamos", "harían"] },
    { v: "PODER", en: "CAN", type: "irreg", forms: ["podría", "podrías", "podría", "podríamos", "podrían"] },
    { v: "QUERER", en: "WANT", type: "irreg", forms: ["querría", "querrías", "querría", "querríamos", "querrían"] },
    { v: "SABER", en: "KNOW", type: "irreg", forms: ["sabría", "sabrías", "sabría", "sabríamos", "sabrían"] },
    { v: "PONER", en: "PUT", type: "irreg", forms: ["pondría", "pondrías", "pondría", "pondríamos", "pondrían"] },
    { v: "SALIR", en: "EXIT", type: "irreg", forms: ["saldría", "saldrías", "saldría", "saldríamos", "saldrían"] },
    { v: "VENIR", en: "COME", type: "irreg", forms: ["vendría", "vendrías", "vendría", "vendríamos", "vendrían"] },
    { v: "DECIR", en: "SAY", type: "irreg", forms: ["diría", "dirías", "diría", "diríamos", "dirían"] },
    { v: "LEVANTARSE", en: "GET UP", type: "reflex", forms: ["me levantaría", "te levantarías", "se levantaría", "nos levantaríamos", "se levantarían"] },
    { v: "LAVARSE", en: "WASH", type: "reflex", forms: ["me lavaría", "te lavarías", "se lavaría", "nos lavaríamos", "se lavarían"] },
    { v: "IRSE", en: "LEAVE", type: "reflex", forms: ["me iría", "te irías", "se iría", "nos iríamos", "se irían"] },
    { v: "COMER", en: "EAT", type: "reg", forms: ["comería", "comerías", "comería", "comeríamos", "comerían"] },
    { v: "VIVIR", en: "LIVE", type: "reg", forms: ["viviría", "vivirías", "viviría", "viviríamos", "vivirían"] },
    { v: "VER", en: "SEE", type: "reg", forms: ["vería", "verías", "vería", "veríamos", "verían"] },
    { v: "LEER", en: "READ", type: "reg", forms: ["leería", "leerías", "leería", "leeríamos", "leerían"] },
    { v: "ESCRIBIR", en: "WRITE", type: "reg", forms: ["escribiría", "escribirías", "escribiría", "escribiríamos", "escribirían"] },
    { v: "DORMIR", en: "SLEEP", type: "reg", forms: ["dormiría", "dormirías", "dormiría", "dormiríamos", "dormirían"] },
    { v: "JUGAR", en: "PLAY", type: "reg", forms: ["jugaría", "jugarías", "jugaría", "jugaríamos", "jugarían"] },
    { v: "TRABAJAR", en: "WORK", type: "reg", forms: ["trabajaría", "trabajarías", "trabajaría", "trabajaríamos", "trabajarían"] },
    { v: "AYUDAR", en: "HELP", type: "reg", forms: ["ayudaría", "ayudarías", "ayudaría", "ayudaríamos", "ayudarían"] },
    { v: "LLAMAR", en: "CALL", type: "reg", forms: ["llamaría", "llamarías", "llamaría", "llamaríamos", "llamarían"] },
    { v: "PAGAR", en: "PAY", type: "reg", forms: ["pagaría", "pagarías", "pagaría", "pagaríamos", "pagarían"] },
    { v: "CORRER", en: "RUN", type: "reg", forms: ["correría", "correrías", "correría", "correríamos", "correrían"] },
    { v: "LIMPIAR", en: "CLEAN", type: "reg", forms: ["limpiaría", "limpiarías", "limpiaría", "limpiaríamos", "limpiarían"] },
    { v: "BAILAR", en: "DANCE", type: "reg", forms: ["bailaría", "bailarías", "bailaría", "bailaríamos", "bailarían"] },
    { v: "CANTAR", en: "SING", type: "reg", forms: ["cantaría", "cantarías", "cantaría", "cantaríamos", "cantarían"] },
];

const ex1Prompts = [
    { en: "I would travel to Spain.", answer: ["yo viajaria a españa", "viajaría a españa"] },
    { en: "She would buy a new car.", answer: ["ella comprara un carro nuevo", "compraría un carro nuevo"] },
    { en: "We would study English.", answer: ["nosotros estudiariamos ingles", "nosotros estudiaríamos inglés"] },
    { en: "They would have more money.", answer: ["ellos tendrian mas dinero", "ellos tendrían más dinero"] },
    { en: "You would do the homework.", answer: ["tu harias la tarea", "harías la tarea"] },
    { en: "He would be able to go.", answer: ["el podria ir", "él podría ir"] },
    { en: "I would want to see you.", answer: ["yo querria verte", "querría verte"] },
    { en: "She would put the keys here.", answer: ["ella pondria las llaves aqui", "ella pondría las llaves aquí"] },
    { en: "We would know the truth.", answer: ["nosotros sabriamos la verdad", "nosotros sabríamos la verdad"] },
    { en: "They would come to the party.", answer: ["ellos vendrian a la fiesta", "ellos vendrían a la fiesta"] },
    { en: "You would say something.", answer: ["tu dirias algo", "dirías algo"] },
    { en: "I would go out tonight.", answer: ["saldria esta noche", "yo saldría esta noche"] },
];

const ex2Options = [
    { text: "Yo _______ (viajar) por el mundo.", options: ["VIAJARÍA", "VIAJARÉ", "VIAJÉ"], answer: "VIAJARÍA" },
    { text: "Ella _______ (comprar) una casa.", options: ["COMPRARA", "COMPRÓ", "COMPRARÍA"], answer: "COMPRARÍA" },
    { text: "Nosotros _______ (tener) tiempo.", options: ["TENEMOS", "TENDRÍAMOS", "TUVIMOS"], answer: "TENDRÍAMOS" },
    { text: "Tú _______ (hacer) el informe.", options: ["HARÍAS", "HACES", "HICISTE"], answer: "HARÍAS" },
    { text: "Ellos _______ (poder) ayudar.", options: ["PUDIERON", "PUEDEN", "PODRÍAN"], answer: "PODRÍAN" },
    { text: "Yo _______ (ir) a la playa.", options: ["IRÍA", "VOY", "FUI"], answer: "IRÍA" },
    { text: "Ella _______ (ser) feliz.", options: ["SERÍAN", "SERIAS", "SERÍA"], answer: "SERÍA" },
    { text: "Nosotros _______ (estar) allí.", options: ["ESTARÍAMOS", "ESTAMOS", "ESTUVIMOS"], answer: "ESTARÍAMOS" },
    { text: "Tú _______ (saber) qué hacer.", options: ["SABRÉ", "SABRÍAS", "SUPISTE"], answer: "SABRÍAS" },
    { text: "Ellos _______ (querer) un café.", options: ["QUERRÍAN", "QUIEREN", "QUISIERON"], answer: "QUERRÍAN" },
    { text: "Yo _______ (decir) la verdad.", options: ["DIRÍAS", "DIGO", "DIRÍA"], answer: "DIRÍA" },
    { text: "Ella _______ (venir) mañana.", options: ["VIENE", "VENDRÍA", "VINO"], answer: "VENDRÍA" },
    { text: "Nosotros _______ (poner) la mesa.", options: ["PONDRÍAMOS", "PONEMOS", "PUSIMOS"], answer: "PONDRÍAMOS" },
    { text: "Tú _______ (salir) temprano.", options: ["SALDRÍAMOS", "SALDRÍAS", "SALISTE"], answer: "SALDRÍAS" },
    { text: "Ellos _______ (comer) pizza.", options: ["COMERÍAN", "COMEN", "COMIERON"], answer: "COMERÍAN" },
];

const ex3Prompts = [
    { en: "If I were rich, I would help you.", answer: ["si yo fuera rico, te ayudaria"] },
    { en: "She would study if she had time.", answer: ["ella estudiaria si tuviera tiempo"] },
    { en: "We would live in a big house.", answer: ["nosotros viviriamos en una casa grande"] },
    { en: "They would work on Sundays.", answer: ["ellos trabajarian los domingos"] },
    { en: "You would learn fast.", answer: ["tu aprenderias rapido", "aprenderias rápido"] },
    { en: "I would be very happy.", answer: ["yo seria muy feliz", "seria muy feliz"] },
    { en: "She would travel with her friends.", answer: ["ella viajaria con sus amigos"] },
    { en: "We would eat in restaurants.", answer: ["nosotros comeriamos en restaurantes"] },
    { en: "They would see the movie.", answer: ["ellos verian la pelicula"] },
    { en: "You would read more books.", answer: ["tu leerias mas libros"] },
    { en: "I would write a letter.", answer: ["yo escribiria una carta"] },
    { en: "She would sleep more.", answer: ["ella dormiria mas"] },
    { en: "We would run in the park.", answer: ["nosotros correriamos en el parque"] },
    { en: "They would play soccer.", answer: ["ellos jugarian futbol"] },
    { en: "You would call your mom.", answer: ["tu llamarias a tu mama"] },
];

const readingData = {
    title: "El Ganador de la Lotería",
    content: "Si yo ganara la lotería mañana, mi vida cambiaría totalmente. Primero, compraría una casa enorme frente al mar. Viajaría por todo el mundo con mi familia y conocería culturas diferentes. También ayudaría a las personas que tienen problemas económicos. No trabajaría más en la oficina, sino que dedicaría mi tiempo a mis sueños. Sería una aventura increíble.",
    questions: [
        { q: "¿Qué compraría primero el narrador?", a: ["una casa enorme frente al mar", "una casa"] },
        { q: "¿Con quién viajaría por el mundo?", a: ["con su familia", "su familia"] },
        { q: "¿Trabajaría en la oficina?", a: ["no", "no trabajaría más"] },
        { q: "¿A qué dedicaría su tiempo?", a: ["a sus sueños", "sus sueños"] },
    ]
};

const ex4Options = [
    { text: "Si tuviera dinero, _______ (comprar) un avión.", options: ["COMPRARÍA", "COMPRÉ", "COMPRA"], answer: "COMPRARÍA" },
    { text: "Nosotros _______ (estar) felices de verte.", options: ["ESTAREMOS", "ESTAMOS", "ESTARÍAMOS"], answer: "ESTARÍAMOS" },
    { text: "Ella _______ (hacer) la cena si tuviera tiempo.", options: ["HACE", "HIZO", "HARÍA"], answer: "HARÍA" },
    { text: "Tú _______ (poder) ir si estudiaras.", options: ["PUEDES", "PODRÍAS", "PUDISTE"], answer: "PODRÍAS" },
    { text: "Ellos _______ (venir) a la fiesta.", options: ["VENDRÍAN", "VINIERON", "VIENEN"], answer: "VENDRÍAN" },
    { text: "Yo _______ (saber) la respuesta si leyera.", options: ["SUPE", "SÉ", "SABRÍA"], answer: "SABRÍA" },
    { text: "Nosotros _______ (viajar) a Italia.", options: ["VIAJAREMOS", "VIAJAMOS", "VIAJARÍAMOS"], answer: "VIAJARÍAMOS" },
    { text: "Él _______ (tener) un perro grande.", options: ["TUVO", "TIENE", "TENDRÍA"], answer: "TENDRÍA" },
    { text: "Tú _______ (salir) conmigo hoy.", options: ["SALDRÍAS", "SALES", "SALISTE"], answer: "SALDRÍAS" },
    { text: "Ella _______ (poner) música.", options: ["PUSO", "PONE", "PONDRÍA"], answer: "PONDRÍA" },
    { text: "Ellos _______ (decir) que sí.", options: ["DICEN", "DIRÍAN", "DIJERON"], answer: "DIRÍAN" },
    { text: "Yo _______ (querer) un helado.", options: ["QUERRÍA", "QUIERO", "QUISIERA"], answer: "QUERRÍA" },
    { text: "Nosotros _______ (vivir) en el campo.", options: ["VIVIRÍAMOS", "VIVIMOS", "VIVIREMOS"], answer: "VIVIRÍAMOS" },
    { text: "Tú _______ (aprender) más rápido.", options: ["APRENDISTE", "APRENDES", "APRENDERÍAS"], answer: "APRENDERÍAS" },
    { text: "Ella _______ (ver) el atardecer.", options: ["VIO", "VE", "VERÍA"], answer: "VERÍA" },
    { text: "Ellos _______ (dormir) en el sofá.", options: ["DORMIAN", "DUERMEN", "DORMIRÍAN"], answer: "DORMIRÍAN" },
    { text: "Yo _______ (limpiar) mi cuarto.", options: ["LIMPIO", "LIMPIARÍA", "LIMPIÉ"], answer: "LIMPIARÍA" },
    { text: "Nosotros _______ (hacer) ejercicio.", options: ["HICIMOS", "HACEMOS", "HARÍAMOS"], answer: "HARÍAMOS" },
    { text: "Tú _______ (beber) jugo.", options: ["BEBES", "BEBERÍAS", "BEBISTE"], answer: "BEBERÍAS" },
    { text: "Ella _______ (cantar) una canción.", options: ["CANTARÍA", "CANTA", "CANTÓ"], answer: "CANTARÍA" },
];

const completarPrompts = [
    { s: "1. Yo (viajar) _______ a España.", a: "viajaria" },
    { s: "2. Tú (comprar) _______ el pan.", a: "comprarias" },
    { s: "3. Él (estudiar) _______ más.", a: "estudiaria" },
    { s: "4. Nosotros (tener) _______ una finca.", a: "tendriamos" },
    { s: "5. Ellos (hacer) _______ la comida.", a: "harian" },
    { s: "6. Ella (poder) _______ ir al cine.", a: "podria" },
    { s: "7. Yo (querer) _______ verte.", a: "querria" },
    { s: "8. Tú (saber) _______ la verdad.", a: "sabrias" },
    { s: "9. Nosotros (poner) _______ la mesa.", a: "pondriamos" },
    { s: "10. Ellos (salir) _______ temprano.", a: "saldrian" },
    { s: "11. Yo (venir) _______ a verte.", a: "vendria" },
    { s: "12. Ella (decir) _______ que sí.", a: "diria" },
    { s: "13. Nosotros (comer) _______ pizza.", a: "comeriamos" },
    { s: "14. Tú (beber) _______ agua.", a: "beberias" },
    { s: "15. Ellos (vivir) _______ aquí.", a: "vivirian" },
    { s: "16. Yo (ver) _______ la película.", a: "veria" },
    { s: "17. Tú (leer) _______ el libro.", a: "leerias" },
    { s: "18. Ella (escribir) _______ una carta.", a: "escribiria" },
    { s: "19. Nosotros (dormir) _______ mucho.", a: "dormiriamos" },
    { s: "20. Ellos (jugar) _______ tenis.", a: "jugarian" },
    { s: "21. Yo (ayudar) _______ a mi mamá.", a: "ayudaria" },
    { s: "22. Tú (limpiar) _______ la casa.", a: "limpiarias" },
    { s: "23. Ella (bailar) _______ conmigo.", a: "bailaria" },
    { s: "24. Nosotros (cantar) _______ bien.", a: "cantariamos" },
    { s: "25. Ellos (trabajar) _______ duro.", a: "trabajarian" },
    { s: "26. Yo (pensar) _______ en ti.", a: "pensaria" },
    { s: "27. Tú (pagar) _______ la cuenta.", a: "pagarias" },
    { s: "28. Él (correr) _______ rápido.", a: "correria" },
    { s: "29. Nosotros (aprender) _______ mucho.", a: "aprenderiamos" },
    { s: "30. Ellos (enseñar) _______ español.", a: "enseñarian" },
];

const translateTextData = {
    title: "A New Life Journey",
    paragraph: "If I could change my life, I would move to a small island. I would not work in a stressful office. I would travel around the world in a sailboat and I would meet new people. My family would visit me every summer. We would be extremely happy and healthy. It would be a dream come true.",
    vocabulary: {
        "island": "isla", "move": "mudarse", "office": "oficina", "sailboat": "velero", "meet": "conocer", "summer": "verano", "dream": "sueño", "true": "realidad"
    }
};

const finalNegativePrompts = [
    { en: "I would not work there.", answer: ["no trabajaría allí", "yo no trabajaria alli"] },
    { en: "She would not buy that.", answer: ["ella no compraria eso", "no compraría eso"] },
    { en: "We would not travel tomorrow.", answer: ["no viajaríamos mañana", "nosotros no viajariamos mañana"] },
    { en: "They would not have problems.", answer: ["ellos no tendrian problemas", "no tendrían problemas"] },
    { en: "You would not do it.", answer: ["tu no lo harias", "no lo harías"] },
    { en: "He would not be able to come.", answer: ["el no podria venir", "no podría venir"] },
    { en: "I would not say that.", answer: ["no diría eso", "yo no diria eso"] },
    { en: "She would not go out tonight.", answer: ["ella no saldria esta noche", "no saldría esta noche"] },
    { en: "We would not eat meat.", answer: ["no comeríamos carne", "nosotros no comeriamos carne"] },
    { en: "They would not live here.", answer: ["no vivirían aquí", "ellos no vivirian aqui"] },
    { en: "You would not believe it.", answer: ["no lo creerías", "tu no lo creerias"] },
    { en: "I would not want a coffee.", answer: ["no querría un café", "yo no querria un cafe"] },
    { en: "She would not put it here.", answer: ["ella no lo pondria aqui", "no lo pondría aquí"] },
    { en: "We would not see him.", answer: ["no lo veríamos", "nosotros no lo veriamos"] },
    { en: "They would not call us.", answer: ["no nos llamarían", "ellos no nos llamarian"] },
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isCorrect = prompts[currentIndex].answer.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full">
                        <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary scale-110" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right text-primary">{(en || '').toUpperCase()}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].en}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground transition-all", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu traducción..." autoComplete="off" readOnly={isSupervisionMode} />
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

const ChoiceExercise = ({ prompts, onComplete, title, isSupervisionMode, isAdmin }: any) => {
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
                <div className="text-3xl font-black text-center leading-relaxed">
                    {prompts[currentIndex].text.split('_______').map((part: string, i: number) => (
                        <Fragment key={i}>
                            {part}
                            {i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", status[currentIndex] === 'correct' ? "text-primary border-primary" : "text-muted-foreground")}>{status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}</span>}
                        </Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", status[currentIndex] === 'correct' && opt === prompts[currentIndex].answer && "border-green-500 bg-green-50 text-green-700 shadow-md scale-105")} disabled={isSupervisionMode}>{opt}</Button>
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

// --- MAIN PAGE ---

function CondicionalSimpleContentInternal() {
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
    const [vocabAns, setVocabAns] = useState<string[]>(Array(hypotheticalVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(hypotheticalVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<number, string>>({});
    const [readVal, setReadVal] = useState<Record<number, any>>({});
    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));
    const [transText, setTransText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

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
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final', icon: CheckCircle, status: 'locked' },
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
        setLearningPath(path); setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        if (d.vocabAns) setVocabAns(d.vocabAns);
        if (d.transText) setTransText(d.transText);
        setInitialLoadComplete(true); hasInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAns, transText };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 2000);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, vocabAns, transText, initialLoadComplete]);

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

    const handleTopicCompleteInternal = (completedKey: string) => { setTopicToComplete(completedKey); };

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = hypotheticalVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAns[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (okCount === hypotheticalVocab.length) { setCanAdvanceVocab(true); toast({ title: "¡Perfecto!" }); }
        else toast({ variant: 'destructive', title: `Llevas ${okCount} de ${hypotheticalVocab.length}.` });
    };

    const handleCheckConj = () => {
        const v = conjugationList[conjIdx];
        const corrects = v.forms;
        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Excelente!" });
            if (conjIdx < conjugationList.length - 1) { setTimeout(() => { setConjIdx(p => p + 1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }, 800); }
            else handleTopicCompleteInternal('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const handleCheckReading = () => {
        let ok = true; const nv: any = {};
        readingData.questions.forEach((q, i) => {
            const userAns = (readAns[i] || '').trim().toLowerCase();
            const isOk = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[i] = isOk ? 'correct' : 'incorrect'; if (!isOk) ok = false;
        });
        setReadVal(nv); if (ok) handleTopicCompleteInternal('reading');
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckComplete = () => {
        let ok = true; const nv = completarPrompts.map((q, i) => {
            const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase();
            if (!res) ok = false; return res ? 'correct' : 'incorrect';
        });
        setCompVal(nv); if (ok) handleTopicCompleteInternal('complete');
        else toast({ variant: 'destructive', title: "Revisa las frases" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Sueños y Situaciones (21)</CardTitle><CardDescription className='font-bold text-foreground'>Traduce las palabras al español.</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {hypotheticalVocab.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 text-sm">{v.en}</div><Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></Fragment>))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMÁTICA: CONDICIONAL SIMPLE</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">¿Para qué sirve?</h3>
                                <p className='text-lg'>Se usa para expresar deseos, situaciones hipotéticas o cortesía. Equivale al "would" en inglés.</p>
                                <div className='bg-primary/10 p-4 rounded-xl border-2 border-primary text-center font-mono text-xl uppercase'>INFINITIVO + TERMINACIÓN</div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className='p-4 bg-card rounded-xl border border-border/50 shadow-sm'><p className='text-primary text-sm font-black mb-1'>Yo / El / Ella / Usted</p><p className='text-2xl font-black'>-ÍA</p><p className='text-xs text-muted-foreground italic'>(Viajaría, Comería)</p></div>
                                <div className='p-4 bg-card rounded-xl border border-border/50 shadow-sm'><p className='text-primary text-sm font-black mb-1'>Tú</p><p className='text-2xl font-black'>-ÍAS</p><p className='text-xs text-muted-foreground italic'>(Viajarías, Comerías)</p></div>
                                <div className='p-4 bg-card rounded-xl border border-border/50 shadow-sm'><p className='text-primary text-sm font-black mb-1'>Nosotros</p><p className='text-2xl font-black'>-ÍAMOS</p><p className='text-xs text-muted-foreground italic'>(Viajaríamos, Comeríamos)</p></div>
                                <div className='p-4 bg-card rounded-xl border border-border/50 shadow-sm'><p className='text-primary text-sm font-black mb-1'>Ellos / Ustedes</p><p className='text-2xl font-black'>-ÍAN</p><p className='text-xs text-muted-foreground italic'>(Viajarían, Comerían)</p></div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">¡Entendido!</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjugationList[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center text-foreground uppercase">
                                <CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación ({conjIdx + 1}/30)</CardTitle>
                                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black", v.type === 'reg' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{v.type === 'reg' ? 'REGULAR' : 'IRREGULAR'}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.v} ({v.en})</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl text-foreground'>
                                {["YO", "TÚ", "ÉL/ELLA", "NOSOTROS", "ELLOS"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase transition-all", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Ejercicio 1: Traducción Simple" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={{"carro nuevo": "new car", "la verdad": "the truth", "tarea": "homework"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <ChoiceExercise title="Ejercicio 2: Selección de Conjugación" prompts={ex2Options} onComplete={() => handleTopicCompleteInternal('exercise_2')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={hypotheticalVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Memory Game: Situaciones" />;
            case 'exercise_3': return <BallsExercise title="Ejercicio 3: Frases Condicionales" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('exercise_3')} vocabulary={{"rico": "rich", "lejos": "far away", "casarse": "get married"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold text-foreground'>{i + 1}. {q.q}</Label><Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; setReadAns({ ...readAns, [i]: e.target.value }); setReadVal({ ...readVal, [i]: 'unchecked' }); }} className={cn('mt-1 text-lg h-12', readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4': return <ChoiceExercise title="Ejercicio 4: Reto Condicional" prompts={ex4Options} onComplete={() => handleTopicCompleteInternal('exercise_4')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: Frases Condicionales</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={compAns[i]} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckComplete} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: {translateTextData.title}</CardTitle></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-foreground"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries(translateTextData.vocabulary).map(([en, es], i) => (<Fragment key={i}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-bold text-right text-primary">{es.toUpperCase()}</span></Fragment>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-black dark:text-white">"{translateTextData.paragraph}"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicCompleteInternal('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Final: Condicional Negativo" prompts={finalNegativePrompts} onComplete={() => handleTopicCompleteInternal('final')} vocabulary={{ "allí": "there", "esta noche": "tonight", "carne": "meat", "creer": "believe" }} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
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
                           <Sparkles className='h-10 w-10 text-primary' /> Condicional Simple 🇪🇸
                        </h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" /> Misión Condicional
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
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
                                    </ul></nav>
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

export default function CondicionalSimplePage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <CondicionalSimpleContentInternal />
        </Suspense>
    );
}