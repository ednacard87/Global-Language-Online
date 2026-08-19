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
    Check,
    X,
    Heart,
    Activity,
    MessageSquare,
    ListChecks,
    Stethoscope,
    Info,
    RefreshCw
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
const progressStorageVersion = 'progress_es_b1_imp_2_v2_final_stable';
const mainProgressKey = 'progress_b1_es_imperativo_2';

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

const healthVocab = [
    { en: "EXERCISE", es: "EJERCICIO" }, { en: "DIET / NUTRITION", es: "ALIMENTACION" },
    { en: "REST", es: "DESCANSO" }, { en: "MEDICINE", es: "MEDICINA" },
    { en: "DOCTOR", es: "MEDICO" }, { en: "HABITS", es: "HABITOS" },
    { en: "STRESS", es: "ESTRES" }, { en: "HEALTH", es: "SALUD" },
    { en: "ADVICE / TIP", es: "CONSEJO" }, { en: "PATIENT", es: "PACIENTE" },
    { en: "PAIN", es: "DOLOR" }, { en: "SYMPTOM", es: "SINTOMA" },
    { en: "TREATMENT", es: "TRATAMIENTO" }, { en: "LIFESTYLE", es: "ESTILO DE VIDA" },
    { en: "FRUITS", es: "FRUTAS" }, { en: "VEGETABLES", es: "VERDURAS" },
    { en: "WATER", es: "AGUA" }, { en: "SMOKE", es: "FUMAR" },
    { en: "SUGAR", es: "AZUCAR" }, { en: "SALT", es: "SAL" },
    { en: "APPOINTMENT", es: "CITA" }, { en: "PRESCRIPTION", es: "RECETA" }
];

const conjugationVerbs = [
    { en: "EAT", es: "COMER", aff: "COME / COMA", neg: "NO COMAS / NO COMA" },
    { en: "DRINK", es: "BEBER", aff: "BEBE / BEBA", neg: "NO BEBAS / NO BEBA" },
    { en: "WALK", es: "CAMINAR", aff: "CAMINA / CAMINE", neg: "NO CAMINES / NO CAMINE" },
    { en: "SLEEP", es: "DORMIR", aff: "DUERME / DUERMA", neg: "NO DUERMAS / NO DUERMA" },
    { en: "DO", es: "HACER", aff: "HAZ / HAGA", neg: "NO HAGAS / NO HAGA" },
    { en: "GO", es: "IR", aff: "VE / VAYA", neg: "NO VAYAS / NO VAYA" },
    { en: "TAKE", es: "TOMAR", aff: "TOMA / TOME", neg: "NO TOMES / NO TOME" },
    { en: "SAY", es: "DECIR", aff: "DI / DIGA", neg: "NO DIGAS / NO DIGA" },
    { en: "COME", es: "VENIR", aff: "VEN / VENGA", neg: "NO VENGAS / NO VENGA" },
    { en: "PUT", es: "PONER", aff: "PON / PONGA", neg: "NO PONGAS / NO PONGA" },
    { en: "LEAVE", es: "SALIR", aff: "SAL / SALGA", neg: "NO SALGAS / NO SALGA" },
    { en: "HAVE", es: "TENER", aff: "TEN / TENGA", neg: "NO TENGAS / NO TENGA" },
    { en: "LISTEN", es: "ESCUCHAR", aff: "ESCUCHA / ESCUCHE", neg: "NO ESCUCHES / NO ESCUCHE" },
    { en: "READ", es: "LEER", aff: "LEE / LEA", neg: "NO LEAS / NO LEA" },
    { en: "WRITE", es: "ESCRIBIR", aff: "ESCRIBE / ESCRIBA", neg: "NO ESCRIBAS / NO ESCRIBA" },
    { en: "RUN", es: "CORRER", aff: "CORRE / CORRA", neg: "NO CORRAS / NO CORRA" },
    { en: "WASH", es: "LAVAR", aff: "LAVA / LAVE", neg: "NO LAVES / NO LAVE" },
    { en: "OPEN", es: "ABRIR", aff: "ABRE / ABRA", neg: "NO ABRAS / NO ABRA" },
    { en: "CLOSE", es: "CERRAR", aff: "CIERRA / CIERRE", neg: "NO CIERRES / NO CIERRE" },
    { en: "SIT", es: "SENTARSE", aff: "SIÉNTATE / SIÉNTESE", neg: "NO TE SIENTES / NO SE SIENTE" },
    { en: "GET UP", es: "LEVANTARSE", aff: "LEVÁNTATE / LEVÁNTESE", neg: "NO TE LEVANTES / NO SE LEVANTE" },
    { en: "BUY", es: "COMPRAR", aff: "COMPRA / COMPRE", neg: "NO COMPRES / NO COMPRE" },
    { en: "SELL", es: "VENDER", aff: "VENDE / VENDA", neg: "NO VENDAS / NO VENDA" },
    { en: "BRING", es: "TRAER", aff: "TRAE / TRAIGA", neg: "NO TRAIGAS / NO TRAIGA" },
    { en: "PLAY", es: "JUGAR", aff: "JUEGA / JUEGUE", neg: "NO JUEGUES / NO JUEGUE" },
    { en: "STUDY", es: "ESTUDIAR", aff: "ESTUDIA / ESTUDIE", neg: "NO ESTUDIES / NO ESTUDIE" },
    { en: "WORK", es: "TRABAJAR", aff: "TRABAJA / TRABAJE", neg: "NO TRABAJES / NO TRABAJE" },
    { en: "CALL", es: "LLAMAR", aff: "LLAMA / LLAME", neg: "NO LLAMES / NO LLAME" },
    { en: "GIVE", es: "DAR", aff: "DA / DÉ", neg: "NO DES / NO DÉ" },
    { en: "WATCH", es: "MIRAR", aff: "MIRA / MIRE", neg: "NO MIRES / NO MIRE" }
];

const ex1Prompts = [
    { en: "Eat more fruit.", es: ["come mas fruta", "coma mas fruta"] },
    { en: "Drink two liters of water.", es: ["bebe dos litros de agua", "beba dos litros de agua"] },
    { en: "Exercise every morning.", es: ["haz ejercicio cada mañana", "haga ejercicio cada mañana"] },
    { en: "Take your medicine now.", es: ["toma tu medicina ahora", "tome su medicina ahora"] },
    { en: "Call the doctor on Monday.", es: ["llama al medico el lunes", "llame al medico el lunes"] },
    { en: "Rest for eight hours.", es: ["descansa ocho horas", "descanse ocho horas"] },
    { en: "Read the prescription carefully.", es: ["lee la receta cuidadosamente", "lea la receta con cuidado"] },
    { en: "Wash your hands often.", es: ["lava tus manos a menudo", "lávese las manos a menudo"] },
    { en: "Open the window, please.", es: ["abre la ventana por favor", "abra la ventana por favor"] },
    { en: "Tell me the symptoms.", es: ["dime los sintomas", "digame los sintomas"] }
];

const ex2Prompts = [
    { en: "Don't eat too much sugar.", es: ["no comas mucha azucar", "no coma mucha azucar"] },
    { en: "Don't drink soda.", es: ["no bebas gaseosa", "no beba gaseosa"] },
    { en: "Don't smoke in the house.", es: ["no fumes en la casa", "no fume en la casa"] },
    { en: "Don't forget the appointment.", es: ["no olvides la cita", "no olvide la cita"] },
    { en: "Don't sit all day.", es: ["no te sientes todo el dia", "no se siente todo el dia"] },
    { en: "Don't work until midnight.", es: ["no trabajes hasta media noche", "no trabaje hasta media noche"] },
    { en: "Don't buy expensive medicine.", es: ["no compres medicina cara", "no compre medicina cara"] },
    { en: "Don't touch your face.", es: ["no toques tu cara", "no toque su cara"] },
    { en: "Don't arrive late.", es: ["no llegues tarde", "no llegue tarde"] },
    { en: "Don't worry about stress.", es: ["no te preocupes por el estres", "no se preocupe por el estres"] }
];

const ex3Prompts = [
    { en: "Open it.", es: ["abrelo", "abralo"] },
    { en: "Don't open it.", es: ["no lo abras", "no lo abra"] },
    { en: "Take them.", es: ["tomalos", "tomalas", "tomelos", "tomelas"] },
    { en: "Don't take them.", es: ["no los tomes", "no las tomes", "no los tome", "no las tome"] },
    { en: "Buy the fruits.", es: ["compra las frutas", "compre las frutas"] },
    { en: "Don't buy the sugar.", es: ["no compres el azucar", "no compre el azucar"] },
    { en: "Listen to the advice.", es: ["escucha el consejo", "escuche el consejo"] },
    { en: "Don't leave early.", es: ["no salgas temprano", "no salga temprano"] },
    { en: "Call her tomorrow.", es: ["llamala mañana"] },
    { en: "Don't call him tonight.", es: ["no lo llames esta noche", "no le llames esta noche"] },
    { en: "Wash it well.", es: ["lavalo bien", "lavelo bien"] },
    { en: "Don't wash it now.", es: ["no lo laves ahora", "no lo lave ahora"] },
    { en: "Eat it.", es: ["cómelo", "comala", "comalo", "comela"] },
    { en: "Don't eat it.", es: ["no lo comas", "no lo coma"] },
    { en: "Close the door.", es: ["cierra la puerta", "cierre la puerta"] }
];

const readingData = {
    title: "Consejos de un Médico",
    content: "Paciente, por favor escuche mis consejos. Si usted quiere mejorar su salud, cambie sus hábitos hoy mismo. Primero, no coma comida chatarra ni beba mucha gaseosa. Haga ejercicio tres veces por semana y camine en el parque. Duerma ocho horas cada noche para evitar el estrés. Tome su medicina cada mañana después del desayuno. No fume y beba mucha agua. ¡Cuídese mucho!",
    questions: [
        { q: "¿Qué debe cambiar el paciente?", a: ["sus hábitos", "hábitos"] },
        { q: "¿Qué no debe comer?", a: ["comida chatarra"] },
        { q: "¿Cuántas veces debe hacer ejercicio?", a: ["tres veces por semana", "3 veces"] },
        { q: "¿Cuándo debe tomar la medicina?", a: ["cada mañana", "después del desayuno"] },
        { q: "¿Qué debe beber mucho?", a: ["agua"] }
    ]
};

const ex4Options = [
    { text: "(Tú) _______ (comer) más verduras.", options: ["COMI", "COME", "COMA"], answer: "COME" },
    { text: "(Usted) _______ (beber) menos café.", options: ["BEBE", "BEBER", "BEBA"], answer: "BEBA" },
    { text: "No _______ (fumar) aquí, por favor.", options: ["FUMESS", "FUMA", "FUMES"], answer: "FUMES" },
    { text: "(Tú) _______ (hacer) la tarea.", options: ["HAGA", "HAZ", "HACES"], answer: "HAZ" },
    { text: "No _______ (llegar) tarde mañana.", options: ["LLEGUE", "LLEGA", "LLEGUES"], answer: "LLEGUES" },
    { text: "(Usted) _______ (decir) la verdad.", options: ["DIGA", "DI", "DICE"], answer: "DIGA" },
    { text: "(Tú) _______ (traer) el libro.", options: ["TRAEGA", "TRAE", "TRAES"], answer: "TRAE" },
    { text: "No _______ (abrir) la puerta ahora.", options: ["ABRAS", "ABRE", "ABRASE"], answer: "ABRAS" },
    { text: "(Tú) _______ (poner) la mesa.", options: ["PONTE", "PON", "PONES"], answer: "PON" },
    { text: "(Usted) _______ (venir) a la cita.", options: ["VENGA", "VEN", "VIENE"], answer: "VENGA" },
    { text: "No _______ (correr) en el pasillo.", options: ["CORRI", "CORRAS", "CORRA"], answer: "CORRAS" },
    { text: "(Tú) _______ (lavar) las manos.", options: ["LAVATE", "LAVA", "LAVES"], answer: "LAVA" },
    { text: "No _______ (perder) las llaves.", options: ["PIERDA", "PIERDE", "PIERDAS"], answer: "PIERDAS" },
    { text: "(Usted) _______ (estudiar) para el test.", options: ["ESTUDIES", "ESTUDIE", "ESTUDIAS"], answer: "ESTUDIE" },
    { text: "(Tú) _______ (mirar) el video.", options: ["MIRES", "MIRE", "MIRA"], answer: "MIRA" },
    { text: "No _______ (salir) sin chaqueta.", options: ["SALFAS", "SALGAS", "SALGA"], answer: "SALGAS" },
    { text: "(Usted) _______ (cerrar) la ventana.", options: ["CIERRE", "CIERRA", "CIERRES"], answer: "CIERRE" },
    { text: "(Tú) _______ (beber) el jugo.", options: ["BEBETE", "BEBE", "BEBES"], answer: "BEBE" },
    { text: "No _______ (hacer) ruido.", options: ["HAGA", "HAZ", "HAGAS"], answer: "HAGAS" },
    { text: "(Tú) _______ (escuchar) el audio.", options: ["ESCUCHA", "ESCUCHE", "ESCUCHES"], answer: "ESCUCHA" },
];

const completionPrompts = [
    { s: "1. (Tú) No (comer) _______ dulces.", a: "comas" },
    { s: "2. (Usted) (hacer) _______ ejercicio.", a: "haga" },
    { s: "3. (Tú) (ir) _______ al médico.", a: "ve" },
    { s: "4. (Usted) No (fumar) _______.", a: "fume" },
    { s: "5. (Tú) (beber) _______ mucha agua.", a: "bebe" },
    { s: "6. (Usted) (descansar) _______ más.", a: "descanse" },
    { s: "7. (Tú) No (beber) _______ alcohol.", a: "bebas" },
    { s: "8. (Usted) No (trabajar) _______ tanto.", a: "trabaje" },
    { s: "9. (Tú) (cambiar) _______ tus hábitos.", a: "cambia" },
    { s: "10. (Usted) (tomar) _______ la presión.", a: "tome" },
    { s: "11. (Tú) (limpiar) _______ tu casa.", a: "limpia" },
    { s: "12. (Usted) No (preocuparse) _______.", a: "se preocupe" },
    { s: "13. (Tú) (ayudar) _______ a los demás.", a: "ayuda" },
    { s: "14. (Ustedes) (abrir) _______ los libros.", a: "abran" },
    { s: "15. (Tú) No (salir) _______ tarde.", a: "salgas" },
    { s: "16. (Usted) (traer) _______ los exámenes.", a: "traiga" },
    { s: "17. (Tú) (decir) _______ siempre la verdad.", a: "di" },
    { s: "18. (Nosotros) (estudiar) _______ mucho.", a: "estudiemos" },
    { s: "19. (Tú) No (poner) _______ la música alta.", a: "pongas" },
    { s: "20. (Usted) (sentarse) _______ por favor.", a: "siéntese" },
    { s: "21. (Tú) (cerrar) _______ la puerta.", a: "cierra" },
    { s: "22. (Usted) (venir) _______ pronto.", a: "venga" },
    { s: "23. (Tú) (mirar) _______ el mapa.", a: "mira" },
    { s: "24. (Ustedes) (comer) _______ sano.", a: "coman" },
    { s: "25. (Tú) (lavar) _______ los platos.", a: "lava" },
    { s: "26. (Usted) No (gritar) _______.", a: "grite" },
    { s: "27. (Tú) No (perder) _______ el tiempo.", a: "pierdas" },
    { s: "28. (Ustedes) (hacer) _______ silencio.", a: "hagan" },
    { s: "29. (Tú) (correr) _______ en el parque.", a: "corre" },
    { s: "30. (Usted) (dar) _______ un ejemplo.", a: "dé" },
];

const finalCorrectionPrompts = [
    { incorrect: "No comes mucha sal", correctAnswers: ["no comas mucha sal"] },
    { incorrect: "Toma lo medicina ahora", correctAnswers: ["tómala ahora", "toma la medicina ahora"] },
    { incorrect: "No lo beba el refresco", correctAnswers: ["no lo bebas", "no lo beba", "no bebas el refresco"] },
    { incorrect: "Hace ejercicio cada día", correctAnswers: ["haz ejercicio cada dia", "haga ejercicio cada dia"] },
    { incorrect: "No vayas a la oficina tarde", correctAnswers: ["no vayas tarde", "no vaya tarde"] },
    { incorrect: "Tú di la verdad", correctAnswers: ["di la verdad"] },
    { incorrect: "No fuma en el hospital", correctAnswers: ["no fumes", "no fume"] },
    { incorrect: "Venga aquí tú", correctAnswers: ["ven aqui", "venga aqui"] },
    { incorrect: "No pones los pies en la mesa", correctAnswers: ["no pongas los pies en la mesa"] },
    { incorrect: "Bebe lo agua", correctAnswers: ["bébelo", "bebe el agua"] },
    { incorrect: "No sal de la casa", correctAnswers: ["no salgas de la casa"] },
    { incorrect: "Escucha a el médico", correctAnswers: ["escuchalo", "escucha al medico"] },
    { incorrect: "No haces ruido", correctAnswers: ["no hagas ruido"] },
    { incorrect: "Haga tu tarea", correctAnswers: ["haz tu tarea", "haga su tarea"] },
    { incorrect: "No te preocupas", correctAnswers: ["no te preocupes", "no se preocupe"] },
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setCurrentIndex(0); setUserAnswers({}); setStatus({});
    }, [prompts]);

    useEffect(() => {
        // preserve typed answer
    }, [currentIndex]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const currentAnswer = userAnswers[currentIndex] || '';
        const userVal = currentAnswer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex]?.es || prompts[currentIndex]?.correctAnswers || [];
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const currentStatus = status[currentIndex] || 'unchecked';

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary scale-110" : "border-muted", status[i] === 'correct' ? "!bg-green-600 !text-white !border-green-600 !shadow-[0_0_10px_rgba(22,163,74,0.5)]" : status[i] === 'incorrect' ? "!bg-red-600 !text-white !border-red-600 !shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "bg-card text-foreground")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (<Fragment key={en}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-semibold text-right text-primary">{(es || '').toUpperCase()}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">
                    {prompts[currentIndex]?.en || prompts[currentIndex]?.incorrect}
                </div>
                <Input value={userAnswers[currentIndex] || ''} onChange={e => { if (isSupervisionMode) return; setUserAnswers({...userAnswers, [currentIndex]: e.target.value}); setStatus({...status, [currentIndex]: 'unchecked'}); }} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground border-2 transition-all", currentStatus === 'correct' ? '!border-green-600 !bg-green-500/10' : currentStatus === 'incorrect' ? '!border-red-600 !bg-red-500/10' : '')} placeholder="Tu respuesta..." autoComplete="off" readOnly={isSupervisionMode} />
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

// --- MAIN PAGE ---

function Imperativo2ContentInternal() {
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

    // States for content
    const [vocabAns, setVocabAns] = useState<string[]>(Array(healthVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(healthVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(4).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(4).fill('unchecked'));

    const [optIdx, setOptIdx] = useState(0);
    const [optSolved, setOptSolved] = useState<Record<number, boolean>>({});

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
        { key: 'complete', name: '10. Completar', icon: Pencil, status: 'locked' },
        { key: 'translate', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final', icon: Trophy, status: 'locked' },
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
            p: learningPath.map(t => t.status) 
        });

        if (currentSerialized === lastSerializedRef.current) return;

        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic };
            learningPath.forEach(item => { s[item.key] = item.status; });
            lastSerializedRef.current = currentSerialized;
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
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
        if (topicKey === 'grammar') handleTopicCompleteInternal(topicKey);
    };

    const handleTopicCompleteInternal = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = healthVocab.map((v, i) => {
            const res = v.es.toUpperCase() === (vocabAns[i] || '').trim().toUpperCase();
            if (!res) allOk = false; return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (allOk) { setCanAdvanceVocab(true); toast({ title: "¡Vocabulario superado!" }); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckConj = () => {
        const v = conjugationVerbs[conjIdx];
        const corrects = [v.aff.split('/')[0].trim(), v.aff.split('/')[1].trim(), v.neg.split('/')[0].trim(), v.neg.split('/')[1].trim()];
        const nv = conjAns.map((a, i) => corrects[i].toLowerCase() === a.trim().toLowerCase() ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Excelente!" });
            if (conjIdx < conjugationVerbs.length - 1) {
                setTimeout(() => {
                    setConjIdx(p => p + 1);
                    setConjAns(Array(4).fill(''));
                    setConjVal(Array(4).fill('unchecked'));
                }, 800);
            } else handleTopicCompleteInternal('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Vocabulary: Salud y Consejos (22)</CardTitle></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {healthVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-2 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("uppercase font-mono", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2 h-4 w-4'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR: EL IMPERATIVO</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. Formas Básicas</h3>
                                <div className='grid md:grid-cols-2 gap-4'>
                                    <div className='p-4 bg-green-500/5 rounded-xl border border-green-500/20'>
                                        <p className='text-green-600 mb-1'>AFIRMATIVO (+)</p>   
                                        <p className='text-2xl font-black'> (Tú )      = Come verduras.</p>
                                        <p className='text-2xl font-black'> (usted )   = Coma verduras.</p>
                                        <p className='text-2xl font-black'> (ustedes ) = Coman verduras.</p>
                                    </div>
                                    <div className='p-4 bg-red-500/5 rounded-xl border border-red-500/20'>
                                        <p className='text-red-600 mb-1'>NEGATIVO (-)</p>
                                        <p className='text-2xl font-black'> (Tú )      = No comas azúcar.</p>
                                        <p className='text-2xl font-black'> (usted )   = No coma azúcar.</p>
                                        <p className='text-2xl font-black'> (ustedes ) = No coman azúcar.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-brand-purple uppercase mb-4">2. Uso de Pronombres (Objetos)</h3>
                                <div className='space-y-4 font-mono'>
                                    <div className='p-4 border rounded-xl bg-card'>
                                        <p className='text-primary'>Afirmativo: Verbo + Pronombre (pegado)</p>
                                        <p className='text-2xl font-black mt-2'>¡Tómalo!</p>
                                    </div>
                                    <div className='p-4 border rounded-xl bg-card'>
                                        <p className='text-brand-purple'>Negativo: NO + Pronombre + Verbo (separado)</p>
                                        <p className='text-2xl font-black mt-2'>¡No lo tomes!</p>
                                    </div>
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
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Conjugación: Imperativo ({conjIdx+1}/30)</CardTitle><CardDescription>Escribe las formas de 'Tú' y 'Usted' en afirmativo y negativo.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.es}</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl text-foreground'>
                                {["TÚ (+)", "USTED (+)", "TÚ (-)", "USTED (-)"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase transition-all", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Exercise 1: Affirmative" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={{"fruit": "fruta", "carefully": "cuidadosamente", "symptoms": "síntomas"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <BallsExercise title="Exercise 2: Negative" prompts={ex2Prompts} onComplete={() => handleTopicCompleteInternal('exercise_2')} vocabulary={{"midnight": "media noche", "appointment": "cita", "sugar": "azúcar"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={healthVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Health Memory" />;
            case 'exercise_3': return <BallsExercise title="Exercise 3: Mixed Challenge" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('exercise_3')} vocabulary={{"early": "temprano", "tonight": "esta noche", "neighbor": "vecino"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'reading':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className="font-bold text-foreground">{q.q}</Label><Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [i]: e.target.value}); setReadVal({...readVal, [i]: 'unchecked'}); }} className={cn("h-10", readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => {
                            let ok = true; const nv: any = {};
                            readingData.questions.forEach((q, i) => { const res = q.a.some(a => (readAns[i] || '').trim().toLowerCase().includes(a.toLowerCase())); nv[i] = res ? 'correct' : 'incorrect'; if (!res) ok = false; });
                            setReadVal(nv); if (ok) { toast({ title: "¡Lectura superada!" }); handleTopicCompleteInternal('reading'); } else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
                        }} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
                        <CardHeader><CardTitle className='dark:text-primary'>Ejercicio 4: Opción Múltiple</CardTitle><div className="flex gap-2 pt-4 flex-wrap">{ex4Options.map((_, i) => (<div key={i} onClick={() => setOptIdx(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", optIdx === i ? "border-primary ring-2 ring-primary" : "border-muted", optSolved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>))}</div></CardHeader>
                        <CardContent className="space-y-8 py-10">
                            <div className="text-3xl font-black text-center text-foreground leading-relaxed">
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
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: Imperativo (30 frases)</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completionPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={compAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase text-foreground", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => {
                            let all = true; const nv = completionPrompts.map((q, i) => { const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase(); if (!res) all = false; return res ? 'correct' : 'incorrect'; });
                            setCompVal(nv); if (all) { toast({ title: "¡Dominio Total!" }); handleTopicCompleteInternal('complete'); } else toast({ variant: 'destructive', title: "Hay errores en la lista" });
                        }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: Health Advice</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-foreground"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({"healthy": "saludable", "rest": "descansar", "medicine": "medicina", "avoid": "evitar", "habits": "hábitos", "lifestyle": "estilo de vida"}).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"If you want a healthy life, follow these instructions. First, eat more vegetables and don't drink soda. Exercise for thirty minutes every day and rest enough. Take your medicine and visit the doctor twice a year. Change your bad habits and avoid stress. This is the best way to improve your lifestyle."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[250px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicCompleteInternal('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final':
                return (
                    <div className="space-y-6">
                        <div className="text-left mb-4 text-white">
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Misión Final: Corregir Errores</h2>
                            <p className="font-bold text-lg text-white">Corrige las frases gramaticalmente incorrectas del imperativo.</p>
                        </div>
                        <BallsExercise title="Final Challenge: Correction" prompts={finalCorrectionPrompts} onComplete={() => handleTopicCompleteInternal('final')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />
                    </div>
                );
            default: return null;
        }
    };

    if (isInitialLoading) return <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión B1...</p></div>;

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
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <Stethoscope className='h-10 w-10 text-primary' /> Imperativo 2 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>

                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30 text-foreground">
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

export default function Imperativo2Page() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <Imperativo2ContentInternal />
        </Suspense>
    );
}