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
    Activity,
    ListChecks,
    Scale,
    Check,
    X,
    Star,
    ArrowLeft,
    MessageSquare,
    BookText as BookTextIcon
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
const progressStorageVersion = 'progress_es_a2_obligacion_v30_stable_conj_fix';
const mainProgressKey = 'progress_a2_es_obligacion';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---
const workVocab = [
    { en: "OFFICE", es: "OFICINA" }, { en: "TASK", es: "TAREA" }, { en: "MEETING", es: "REUNIÓN" },
    { en: "SCHEDULE", es: "HORARIO" }, { en: "RESPONSIBILITY", es: "RESPONSABILIDAD" }, { en: "COLLEAGUE", es: "COLEGA" },
    { en: "DEADLINE", es: "PLAZO" }, { en: "MANAGEMENT", es: "GERENCIA" }, { en: "PROJECT", es: "PROYECTO" },
    { en: "REPORT", es: "INFORME" }, { en: "SALARY", es: "SALARIO" }, { en: "PROMOTION", es: "ASCENSO" },
    { en: "HIRING", es: "CONTRATACIÓN" }, { en: "AGREEMENT", es: "ACUERDO" }, { en: "OVERTIME", es: "HORAS EXTRA" },
    { en: "VACATION", es: "VACACIONES" }, { en: "PERFORMANCE", es: "DESEMPEÑO" }, { en: "SKILLS", es: "HABILIDADES" },
    { en: "BOSS", es: "JEFE" }, { en: "EMPLOYEE", es: "EMPLEADO" },
];

const verbsToConjugate = [
    { en: "SPEAK", es: "HABLAR", type: "ar" }, { en: "EAT", es: "COMER", type: "er" }, { en: "LIVE", es: "VIVIR", type: "ir" },
    { en: "WORK", es: "TRABAJAR", type: "ar" }, { en: "STUDY", es: "ESTUDIAR", type: "ar" }, { en: "WALK", es: "CAMINAR", type: "ar" },
    { en: "RUN", es: "CORRER", type: "er" }, { en: "JUMP", es: "SALTAR", type: "ar" }, { en: "SING", es: "CANTAR", type: "ar" },
    { en: "DANCE", es: "BAILAR", type: "ar" }, { en: "LISTEN", es: "ESCUCHAR", type: "ar" }, { en: "READ", es: "LEER", type: "er" },
    { en: "WRITE", es: "ESCRIBIR", type: "ir" }, { en: "LEARN", es: "APRENDER", type: "er" }, { en: "TEACH", es: "ENSEÑAR", type: "ar" },
    { en: "OPEN", es: "ABRIR", type: "ir" }, { en: "CLOSE", es: "CERRAR", type: "ar" }, { en: "DRINK", es: "BEBER", type: "er" },
    { en: "UNDERSTAND", es: "COMPRENDER", type: "er" }, { en: "BUY", es: "COMPRAR", type: "ar" }, { en: "SELL", es: "VENDER", type: "er" },
    { en: "WAIT", es: "ESPERAR", type: "ar" }, { en: "LOOK", es: "MIRAR", type: "ar" }, { en: "CALL", es: "LLAMAR", type: "ar" },
    { en: "HELP", es: "AYUDAR", type: "ar" }, { en: "USE", es: "USAR", type: "ar" }, { en: "CLEAN", es: "LIMPIAR", type: "ar" },
    { en: "COOK", es: "COCINAR", type: "ar" }, { en: "TRAVEL", es: "VIAJAR", type: "ar" }, { en: "ARRIVE", es: "LLEGAR", type: "ar" }
];

const ex1Prompts = [
    { en: "I HAVE TO WORK TOMORROW.", answer: ["tengo que trabajar mañana", "yo tengo que trabajar mañana"] },
    { en: "YOU MUST STUDY MORE.", answer: ["debes estudiar más", "tú debes estudiar más", "tienes que estudiar más"] },
    { en: "ONE MUST CLEAN THE OFFICE.", answer: ["hay que limpiar la oficina"] },
    { en: "SHE HAS TO GO TO THE MEETING.", answer: ["ella tiene que ir a la reunión", "tiene que ir a la reunión"] },
    { en: "WE MUST BE RESPONSIBLE.", answer: ["debemos ser responsables", "nosotros debemos ser responsables"] },
    { en: "THEY HAVE TO DELIVER THE REPORT.", answer: ["ellos tienen que entregar el informe", "tienen que entregar el informe"] },
    { en: "YOU (FORMAL) HAVE TO SIGN THE CONTRACT.", answer: ["usted tiene que firmar el contrato"] },
    { en: "ONE MUST RESPECT THE SCHEDULE.", answer: ["hay que respetar el horario"] },
    { en: "HE MUST TALK TO HIS BOSS.", answer: ["él debe hablar con su jefe", "él tiene que hablar con su jefe"] },
    { en: "WE HAVE TO SAVE MONEY.", answer: ["tenemos que ahorrar dinero", "nosotros tenemos que ahorrar dinero"] },
];

const ex2Prompts = [
    { en: "I HAVE TO GET UP EARLY.", answer: ["tengo que levantarme temprano", "yo tengo que levantarme temprano"] },
    { en: "YOU MUST FINISH YOUR TASK TODAY.", answer: ["debes terminar tu tarea hoy", "tienes que terminar tu tarea hoy"] },
    { en: "ONE MUST RECYCLE PLASTIC.", answer: ["hay que reciclar el plástico"] },
    { en: "SHE HAS TO BUY FOOD.", answer: ["ella tiene que comprar comida", "tiene que comprar comida"] },
    { en: "THEY MUST ARRIVE ON TIME.", answer: ["ellos deben llegar a tiempo", "deben llegar a tiempo"] },
    { en: "WE HAVE TO HELP THE COLLEAGUES.", answer: ["tenemos que ayudar a los colegas", "nosotros tenemos que ayudar a los colegas"] },
    { en: "YOU ALL HAVE TO WORK OVERTIME.", answer: ["ustedes tienen que trabajar horas extra"] },
    { en: "ONE MUST BE PUNCTUAL.", answer: ["hay que ser puntual"] },
    { en: "HE HAS TO TRAVEL FOR THE PROJECT.", answer: ["él tiene que viajar por el proyecto"] },
    { en: "WE MUST IMPROVE OUR SKILLS.", answer: ["debemos mejorar nuestras habilidades", "tenemos que mejorar nuestras habilidades"] },
    { en: "SHE HAS TO APPLY FOR A PROMOTION.", answer: ["ella tiene que solicitar un ascenso"] },
    { en: "THEY HAVE TO ORGANIZE THE MANAGEMENT.", answer: ["ellos tienen que organizar la gerencia"] },
];

const ex3Prompts = [
    { en: "I HAD TO WORK LAST SATURDAY.", answer: ["tuve que trabajar el sábado pasado", "yo tuve que trabajar el sábado pasado"] },
    { en: "YOU SHOULD HAVE CALLED YOUR MOTHER.", answer: ["debiste llamar a tu madre", "tuviste que llamar a tu madre"] },
    { en: "IT WAS NECESSARY TO CANCEL THE MEETING.", answer: ["hubo que cancelar la reunión"] },
    { en: "SHE HAD TO MOVE OFFICES.", answer: ["ella tuvo que mudarse de oficina", "tuvo que mudarse de oficina"] },
    { en: "WE HAD TO WAIT A LONG TIME.", answer: ["tuvimos que esperar mucho tiempo", "nosotros tuvimos que esperar mucho tiempo"] },
    { en: "YOU SHOULD HAVE NOTIFIED BEFORE.", answer: ["debiste avisar antes", "usted debió avisar antes"] },
    { en: "THEY HAD TO LEARN ENGLISH.", answer: ["ellos tuvieron que aprender inglés", "tuvieron que aprender inglés"] },
    { en: "IT WAS NECESSARY TO FIX THE COMPUTER.", answer: ["hubo que arreglar el computador"] },
    { en: "I HAD TO PAY THE BILL.", answer: ["tuve que pagar la cuenta", "yo tuve que pagar la cuenta"] },
    { en: "SHE SHOULD HAVE BEEN MORE CAREFUL.", answer: ["ella debió ser más cuidadosa"] },
    { en: "WE HAD TO CLOSE THE BUSINESS.", answer: ["tuvimos que cerrar el negocio", "nosotros tuvimos que cerrar el negocio"] },
    { en: "THEY SHOULD HAVE SENT THE REPORT YESTERDAY.", answer: ["debieron enviar el reporte ayer", "ellos debieron enviar el reporte ayer"] },
];

const ex4ChoiceData = [
    { text: "Yo _______ que estudiar para el examen.", options: ["TENGO", "DEBO", "HAY"], answer: "TENGO" },
    { text: "Tú _______ ser más puntual.", options: ["TIENES", "DEBES", "HAY"], answer: "DEBES" },
    { text: "En la oficina, _______ que usar uniforme.", options: ["TIENE", "DEBE", "HAY"], answer: "HAY" },
    { text: "Ella _______ que viajar mañana.", options: ["TIENE", "DEBE", "HAY"], answer: "TIENE" },
    { text: "Nosotros _______ trabajar hoy.", options: ["TENEMOS", "DEBEMOS", "HAY"], answer: "DEBEMOS" },
    { text: "_______ que reciclar el papel.", options: ["TIENEN", "DEBEN", "HAY"], answer: "HAY" },
    { text: "Ellos _______ que hablar con el jefe.", options: ["TIENEN", "DEBEN", "HAY"], answer: "TIENEN" },
    { text: "Usted _______ terminar el informe.", options: ["TIENE", "DEBE", "HAY"], answer: "DEBE" },
    { text: "Para ser exitoso, _______ que esforzarse.", options: ["TIENE", "DEBE", "HAY"], answer: "HAY" },
    { text: "Yo _______ comer más saludable.", options: ["TENGO", "DEBO", "HAY"], answer: "DEBO" },
    { text: "En este país _______ que pagar impuestos.", options: ["TIENE", "DEBE", "HAY"], answer: "HAY" },
    { text: "Nosotros _______ limpiar la casa ahora.", options: ["TENEMOS", "DEBEMOS", "HAY"], answer: "TENEMOS" },
    { text: "Tú no _______ gritar en la biblioteca.", options: ["TIENES", "DEBES", "HAY"], answer: "DEBES" },
    { text: "Para entrar al cine _______ que comprar boletos.", options: ["TIENE", "DEBE", "HAY"], answer: "HAY" },
    { text: "Ella _______ que cuidar a su hermano.", options: ["TIENE", "DEBE", "HAY"], answer: "TIENE" },
    { text: "Ustedes _______ ahorrar para el viaje.", options: ["TIENEN", "DEBEN", "HAY"], answer: "DEBEN" },
    { text: "En la playa _______ que usar protector solar.", options: ["TIENE", "DEBE", "HAY"], answer: "HAY" },
    { text: "Yo _______ que llamar a mi abuela.", options: ["TENGO", "DEBO", "HAY"], answer: "TENGO" },
    { text: "Ellos _______ ser más organizados.", options: ["TIENEN", "DEBEN", "HAY"], answer: "DEBEN" },
    { text: "Para cocinar, _______ que encender la estufa.", options: ["TIENE", "DEBE", "HAY"], answer: "HAY" },
];

const completadoFrasesData = [
    { text: "1. Yo (tener que) _______ trabajar.", answer: "tengo" },
    { text: "2. Tú (deber) _______ estudiar.", answer: "debes" },
    { text: "3. (Hay que) _______ limpiar.", answer: "hay" },
    { text: "4. Ella (tener que) _______ ir.", answer: "tiene" },
    { text: "5. Nosotros (deber) _______ comer.", answer: "debemos" },
    { text: "6. Ellos (tener que) _______ ver.", answer: "tienen" },
    { text: "7. (Hay que) _______ hablar.", answer: "hay" },
    { text: "8. Yo (deber) _______ salir.", answer: "debo" },
    { text: "9. Tú (tener que) _______ leer.", answer: "tienes" },
    { text: "10. Ella (deber) _______ viajar.", answer: "debe" },
    { text: "11. (Hay que) _______ estudiar.", answer: "hay" },
    { text: "12. Nosotros (tener que) _______ comprar.", answer: "tenemos" },
    { text: "13. Usted (deber) _______ escuchar.", answer: "debe" },
    { text: "14. (Hay que) _______ descansar.", answer: "hay" },
    { text: "15. Ellos (deber) _______ ayudar.", answer: "deben" },
    { text: "16. Yo (tener que) _______ correr.", answer: "tengo" },
    { text: "17. Tú (deber) _______ llamar.", answer: "debes" },
    { text: "18. Ella (tener que) _______ cocinar.", answer: "tiene" },
    { text: "19. Nosotros (deber) _______ saltar.", answer: "debemos" },
    { text: "20. (Hay que) _______ esperar.", answer: "hay" },
    { text: "21. Ellos (tener que) _______ traer.", answer: "tienen" },
    { text: "22. Yo (deber) _______ beber.", answer: "debo" },
    { text: "23. Tú (tener que) _______ venir.", answer: "tienes" },
    { text: "24. (Hay que) _______ cantar.", answer: "hay" },
    { text: "25. Ella (deber) _______ bailar.", answer: "debe" },
    { text: "26. Nosotros (tener que) _______ leer.", answer: "tenemos" },
    { text: "27. Ustedes (deber) _______ aprender.", answer: "deben" },
    { text: "28. (Hay que) _______ abrir.", answer: "hay" },
    { text: "29. Yo (tener que) _______ cerrar.", answer: "tengo" },
    { text: "30. Ellos (deber) _______ ver.", answer: "deben" },
];

const readingData = {
    title: "Un Día de Responsabilidades",
    content: "En la oficina, todos tenemos muchas responsabilidades. Mi jefe dice que siempre hay que llegar a tiempo para la reunión de la mañana. Yo tengo que escribir tres informes hoy y mis colegas deben terminar el proyecto antes del viernes. A veces tenemos que trabajar horas extra, pero es necesario para obtener un ascenso. No debemos olvidar que la organización es la clave del éxito.",
    questions: [
        { id: 'q1', q: "¿Qué dice el jefe sobre la reunión?", a: ["hay que llegar a tiempo", "llegar a tiempo"] },
        { id: 'q2', q: "¿Cuántos informes tiene que escribir el narrador?", a: ["tres", "3"] },
        { id: 'q3', q: "¿Qué deben terminar los colegas?", a: ["el proyecto"] },
        { id: 'q4', q: "¿Para qué es necesario trabajar horas extra?", a: ["para obtener un ascenso", "un ascenso"] },
        { id: 'q5', q: "¿Cuál es la clave del éxito según el texto?", a: ["la organización"] }
    ],
    vocab: { "jefe": "boss", "reunión": "meeting", "informes": "reports", "colegas": "colleagues", "antes": "before", "éxito": "success" }
};

const finalExPrompts = [
    { en: "I DO NOT HAVE TO WORK TOMORROW.", answer: ["no tengo que trabajar mañana", "yo no tengo que trabajar mañana"] },
    { en: "YOU MUST NOT ARRIVE LATE.", answer: ["no debes llegar tarde", "tú no debes llegar tarde", "no tienes que llegar tarde"] },
    { en: "ONE MUST NOT THROW TRASH.", answer: ["no hay que tirar basura"] },
    { en: "SHE DOES NOT HAVE TO COOK TODAY.", answer: ["ella no tiene que cocinar hoy", "no tiene que cocinar hoy"] },
    { en: "WE MUST NOT WASTE TIME.", answer: ["no debemos perder el tiempo", "nosotros no debemos perder el tiempo"] },
    { en: "YOU DO NOT HAVE TO PAY NOW.", answer: ["no tienes que pagar ahora", "usted no tiene que pagar ahora"] },
    { en: "HE MUST NOT SHOUT IN THE CLASS.", answer: ["él no debe gritar en la clase", "no debe gritar en la clase"] },
    { en: "WE DO NOT HAVE TO LEAVE YET.", answer: ["no tenemos que irnos todavía", "no tenemos que partir todavía"] },
    { en: "ONE MUST NOT SMOKE HERE.", answer: ["no hay que fumar aquí", "no se debe fumar aquí"] },
    { en: "THEY DO NOT HAVE TO CALL ME.", answer: ["ellos no tienen que llamarme", "no tienen que llamarme"] },
    { en: "I MUST NOT FORGET THE KEYS.", answer: ["no debo olvidar las llaves"] },
    { en: "YOU MUST NOT OPEN THE DOOR.", answer: ["no debes abrir la puerta", "usted no debe abrir la puerta"] },
    { en: "SHE DOES NOT HAVE TO STUDY TONIGHT.", answer: ["ella no tiene que estudiar esta noche", "no tiene que estudiar esta noche"] },
    { en: "ONE MUST NOT RUN IN THE HALL.", answer: ["no hay que correr en el pasillo"] },
    { en: "WE DO NOT HAVE TO BRING FOOD.", answer: ["no tenemos que traer comida", "no hay que traer comida"] },
    { en: "THEY MUST NOT ARRIVE AFTER MIDNIGHT.", answer: ["ellos no deben llegar después de la medianoche"] },
    { en: "I DO NOT HAVE TO BUY THE CAR.", answer: ["no tengo que comprar el carro", "yo no tengo que comprar el carro"] },
    { en: "YOU MUST NOT DRINK COLD WATER.", answer: ["no debes beber agua fría", "no debes tomar agua fría"] },
    { en: "SHE DOES NOT HAVE TO HELP HIM.", answer: ["ella no tiene que ayudarlo", "no tiene que ayudarlo"] },
    { en: "ONE MUST NOT PARK HERE.", answer: ["no hay que parquear aquí", "no se debe parquear aquí"] },
    { en: "WE MUST NOT BE LATE.", answer: ["no debemos llegar tarde"] },
    { en: "THEY DO NOT HAVE TO WAIT FOR ME.", answer: ["ellos no tienen que esperarme", "no tienen que esperarme"] },
    { en: "I MUST NOT FAIL THE EXAM.", answer: ["no debo reprobar el examen"] },
    { en: "YOU DO NOT HAVE TO FINISH NOW.", answer: ["no tienes que terminar ahora", "no tiene que terminar ahora"] },
    { en: "ONE MUST NOT USE THE CELLPHONE.", answer: ["no hay que usar el celular", "no se debe usar el celular"] },
];

const generalVocabHelp = { "trabajo": "work", "tarea": "task", "reunión": "meeting", "horario": "schedule", "jefe": "boss", "contrato": "contract", "informe": "report", "ahorrar": "save", "mañana": "tomorrow", "tarde": "late" };

// --- HELPERS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, type = 'translate' }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setCurrentIndex(0); setAnswer(''); setStatus({}); }, [prompts]);
    useEffect(() => { setAnswer(''); }, [currentIndex]);

    const handleCheck = () => {
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const isOk = prompts[currentIndex].answer.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(p => ({ ...p, [currentIndex]: isOk ? 'correct' : 'incorrect' }));
        if (isOk) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className="text-foreground">{title}</CardTitle>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", status[i] === 'correct' ? "bg-green-500 text-white border-green-500" : status[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</div>
                            ))}
                        </div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].en}</div>
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu traducción al español..." autoComplete="off" />
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

// --- MAIN CLASS COMPONENT ---

function ObligacionContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    const hasInitialized = useRef(false);

    // Form states
    const [vocabAns, setVocabAns] = useState<string[]>(Array(workVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(workVocab.length).fill('unchecked'));
    const [canAdvVocab, setCanAdvVocab] = useState(false);
    
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));

    const [choiceIdx, setChoiceIdx] = useState(0);
    const [choiceSolved, setChoiceSolved] = useState<Record<number, boolean>>({});

    const [compAns, setCompAns] = useState<string[]>(Array(30).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(30).fill('unchecked'));

    const [transText, setTransText] = useState('');
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil },
        { key: 'exercise_1', name: '4. Ejercicio 1', icon: PenSquare },
        { key: 'exercise_2', name: '5. Ejercicio 2', icon: PenSquare },
        { key: 'vocabulary_game', name: '6. Vocabulario (Juego)', icon: Gamepad2 },
        { key: 'exercise_3', name: '7. Ejercicio 3', icon: PenSquare },
        { key: 'reading', name: '8. Lectura', icon: BookText },
        { key: 'exercise_4', name: '9. Ejercicio 4', icon: ListChecks },
        { key: 'completar', name: '10. Completar', icon: Trophy },
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare },
        { key: 'final', name: '12. Final', icon: CheckCircle },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || hasInitialized.current) return;

        let path = initialPathData.map((topic, index) => ({ 
            ...topic, 
            status: index === 0 ? 'active' : 'locked' as any
        }));
        let savedST = '';

        if (isAdmin && !targetStudentId) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const data = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (data[item.key]) item.status = data[item.key]; });
            savedST = data.lastSelectedTopic || '';
            if (data.vocabAns) setVocabAns(data.vocabAns);
            if (data.compAns) setCompAns(data.compAns);
            if (data.transText) setTransText(data.transText);
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
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        
        const saveTimer = setTimeout(() => {
            const s: any = { lastSelectedTopic: selectedTopic, vocabAns, compAns, transText };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: s, 
                [`progress.${mainProgressKey}`]: progressValue 
            });
        }, 2000);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAns, compAns, transText]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let nextToSelect: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active'; 
                    nextToSelect = newPath[idx + 1].key;
                }
            }
            if (nextToSelect) { const n = nextToSelect; setTimeout(() => { toast({ title: "¡Misión desbloqueada!" }); setSelectedTopic(n); }, 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicCompleteInternal(topicKey);
    };

    const handleTopicCompleteInternal = (completedKey: string) => { setTopicToComplete(completedKey); };

    const handleCheckVocab = () => {
        let all = true;
        const nv = workVocab.map((v, i) => {
            const ok = v.es === vocabAns[i].trim().toUpperCase();
            if (!ok) all = false; return ok ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (all) { setCanAdvVocab(true); toast({ title: "¡Vocabulario Completo!" }); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckConj = () => {
        const verbData = verbsToConjugate[conjIdx];
        const v = verbData.es.toLowerCase();
        let base = v.slice(0, -2);
        
        let corrects: string[] = [];
        if (verbData.type === 'ar') {
            corrects = [base + 'é', base + 'aste', base + 'ó', base + 'amos', base + 'aron'];
        } else if (verbData.type === 'er' || verbData.type === 'ir') {
            // Manejo de 'leer' -> 'leyó', 'leyeron'
            if (v === 'leer') {
                corrects = ['leí', 'leíste', 'leyó', 'leímos', 'leyeron'];
            } else if (v === 'escribir') {
                corrects = ['escribí', 'escribiste', 'escribió', 'escribimos', 'escribieron'];
            } else {
                corrects = [base + 'í', base + 'iste', base + 'ió', base + 'imos', base + 'ieron'];
            }
        }

        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjVal(nv);

        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Correcto!" });
            if (conjIdx < verbsToConjugate.length - 1) { 
                setTimeout(() => {
                    setConjIdx(p => p + 1); 
                    setConjAns(Array(5).fill('')); 
                    setConjVal(Array(5).fill('unchecked')); 
                }, 1000);
            }
            else handleTopicCompleteInternal('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const renderContent = () => {
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-foreground'>VOCABULARIO: TRABAJO Y RESPONSABILIDADES</CardTitle></CardHeader>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-[450px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                                    {workVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm text-foreground">{v.en}</div>
                                            <Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvVocab(false); }} className={cn("h-12 uppercase font-mono transition-all text-foreground", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-between border-t p-6 bg-muted/10">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-left font-bold text-foreground">
                        <CardHeader><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMÁTICA: LA OBLIGACIÓN</CardTitle></CardHeader>
                        <CardContent className="space-y-8">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">1. TENER QUE + INFINITIVO</h3>
                                <p className="mb-4">Es la forma más común. Expresa una obligación externa o una necesidad personal.</p>
                                <div className="p-4 bg-primary/10 rounded-xl border font-mono text-center text-lg text-foreground">Yo tengo que trabajar / Ella tiene que estudiar</div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-brand-purple uppercase mb-4">2. DEBER + INFINITIVO</h3>
                                <p className="mb-4">Indica una obligación moral, un consejo fuerte o una norma interna.</p>
                                <div className="p-4 bg-brand-purple/10 rounded-xl border font-mono text-center text-lg text-foreground">Tú debes ser puntual / Nosotros debemos ayudar</div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-blue-500 uppercase mb-4">3. HAY QUE + INFINITIVO</h3>
                                <p className="mb-4">Es una forma impersonal. Significa que "es necesario" hacerlo de forma general.</p>
                                <div className="p-4 bg-blue-500/10 rounded-xl border font-mono text-center text-lg text-foreground">Hay que reciclar / Hay que llegar temprano</div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Comprendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const pronouns = ["Yo", "Tú", "Él/Ella", "Nosotros", "Ellos"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-foreground'>Misión: Conjugación en Pasado ({conjIdx + 1}/30)</CardTitle></CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Verbo en Inglés</span>
                                <h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{verbsToConjugate[conjIdx].en}</h3>
                                <span className="text-sm italic text-muted-foreground">({verbsToConjugate[conjIdx].es})</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                {pronouns.map((p, i) => (
                                    <div key={i} className="space-y-1">
                                        <Label className="text-xs font-black uppercase text-muted-foreground">{p}</Label>
                                        <Input 
                                            value={conjAns[i] || ''} 
                                            onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} 
                                            className={cn(
                                                "h-10 text-lg font-bold border-2 transition-all text-foreground", 
                                                conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : 
                                                conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : ''
                                            )} 
                                            autoComplete="off" 
                                            readOnly={!!targetStudentId} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl">Verificar <ArrowRight className="ml-2 h-6 w-6" /></Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Ejercicio 1: Obligación Presente" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={generalVocabHelp} />;
            case 'exercise_2': return <BallsExercise title="Ejercicio 2: Uso Diario" prompts={ex2Prompts} onComplete={() => handleTopicCompleteInternal('exercise_2')} vocabulary={generalVocabHelp} />;
            case 'exercise_3': return <BallsExercise title="Ejercicio 3: Obligación Pasada" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('exercise_3')} vocabulary={generalVocabHelp} />;
            case 'vocabulary_game': return <VocabularyMatchingGame data={workVocab.slice(0, 12).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocabulary_game')} title="Misión: Trabajo y Responsabilidades" />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-foreground">{readingData.title}</CardTitle>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-2 border-brand-blue animate-border-pulse'><BookTextIcon className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-foreground text-left">
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                {Object.entries(readingData.vocab).map(([es, en]) => (
                                                    <Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingData.questions.map((q) => (
                                    <div key={q.id} className="space-y-2">
                                        <Label className='font-bold text-primary'>{q.q}</Label>
                                        <Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn(readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/5' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => { let ok = true; const nv: any = {}; readingData.questions.forEach(q => { const res = q.a.some(a => (readAns[q.id] || '').trim().toLowerCase().includes(a.toLowerCase())); if (!res) ok = false; nv[q.id] = res ? 'correct' : 'incorrect'; }); setReadVal(nv); if (ok) handleTopicCompleteInternal('reading'); else toast({ variant: 'destructive', title: "Revisa tus respuestas" }); }} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4':
                const curEx4 = ex4ChoiceData[choiceIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <CardTitle className="text-foreground uppercase">Ejercicio 4: Elegir Conjugación</CardTitle>
                            <div className="flex gap-1.5 justify-start flex-wrap pt-4">
                                {ex4ChoiceData.map((_, i) => (<div key={i} className={cn("h-2 flex-1 rounded-full", i < choiceIdx ? "bg-green-500" : i === choiceIdx ? "bg-primary animate-pulse" : "bg-muted")} />))}
                            </div>
                        </CardHeader>
                        <CardContent className="py-12 flex flex-col items-center justify-center min-h-[300px] text-center space-y-8">
                            <div className="text-3xl font-black text-foreground leading-relaxed">
                                {curEx4.text.split('_______').map((part, i) => (
                                    <Fragment key={i}>{part}{i < 1 && <span className="text-primary border-b-4 border-dashed border-primary px-6 mx-2">{choiceSolved[choiceIdx] ? curEx4.answer : '...'}</span>}</Fragment>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
                                {curEx4.options.map(opt => (
                                    <Button key={opt} onClick={() => { if (opt === curEx4.answer) { toast({ title: "¡Correcto!" }); setChoiceSolved(prev => ({...prev, [choiceIdx]: true})); if (choiceIdx < ex4ChoiceData.length - 1) setTimeout(() => setChoiceIdx(p => p + 1), 600); else handleTopicCompleteInternal('exercise_4'); } else toast({ variant: 'destructive', title: "Esa no es la opción correcta" }); }} variant="outline" className={cn("h-16 text-xl font-black uppercase hover:bg-primary/10 hover:border-primary transition-all active:scale-95 text-foreground", choiceSolved[choiceIdx] && opt === curEx4.answer && "border-green-500 bg-green-50 text-green-700")}>{opt}</Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-foreground uppercase">Misión: Completar con Obligación</CardTitle><CardDescription className="text-foreground font-bold">Escribe la forma correcta del verbo indicado.</CardDescription></CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[450px] p-6">
                                <div className="space-y-4 text-foreground">
                                    {completadoFrasesData.map((q, i) => (
                                        <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                            <p className="font-bold text-lg text-foreground">{q.text}</p>
                                            <Input value={compAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-[150px] font-bold text-primary transition-all", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20">
                            <Button onClick={() => { let all = true; const nv = completadoFrasesData.map((q, i) => { const ok = q.answer === compAns[i].trim().toLowerCase(); if (!ok) all = false; return ok ? 'correct' : 'incorrect'; }); setCompVal(nv); if (all) handleTopicCompleteInternal('completar'); else toast({ variant: 'destructive', title: "Revisa los campos marcados" }); }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl text-white" disabled={!!targetStudentId}>Verificar Lista</Button>
                        </CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div><CardTitle className="text-foreground uppercase text-black">Traducir Texto: My Daily Responsibilities</CardTitle></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-2 border-brand-blue animate-border-pulse'><BookTextIcon className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-foreground text-left"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({ "hiring": "contratación", "deadline": "plazo / fecha límite", "agreement": "acuerdo / contrato", "salary": "salario", "dismissal": "despido" }).map(([en, es]) => (<Fragment key={en}><span className="text-muted-foreground">{en}:</span><span className="font-bold text-right">{es}</span></Fragment>))}</div></ScrollArea></PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-foreground shadow-sm">"At my job, I have to manage many projects. I must meet all the deadlines and follow the hiring agreements. Every employee has to respect the schedule, and sometimes we have to work overtime. One must be organized to avoid dismissal and get a good salary promotion."</div>
                            <Separator /><textarea value={transText} onChange={e => { if (targetStudentId) return; setTransText(e.target.value); }} className="w-full min-h-[200px] p-4 rounded-xl border bg-background text-lg leading-relaxed text-foreground" placeholder="Tu traducción al español..." readOnly={!!targetStudentId}/>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/10"><Button onClick={() => handleTopicCompleteInternal('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-widest" disabled={!!targetStudentId}>Continuar <ArrowRight className="ml-3 h-8 w-8" /></Button></CardFooter>
                    </Card>
                );
            case 'final':
                return <BallsExercise title="Reto Final: Traducción Negativa" prompts={finalExPrompts} onComplete={() => handleTopicCompleteInternal('final')} vocabulary={generalVocabHelp} />;
            default: return null;
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión Obligación...</p>
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
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso A2
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <Scale className='h-10 w-10 text-primary' /> Obligación 🇪🇸
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
                                        <Trophy className="h-5 w-5 text-primary" /> Misión A2
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 text-foreground">
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
                                                            <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-foreground">{item.name}</span>
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

export default function ObligacionPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <ObligacionContent />
        </Suspense>
    );
}