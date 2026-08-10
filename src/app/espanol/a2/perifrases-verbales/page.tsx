'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, Fragment, useRef } from 'react';
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
    Activity,
    ListChecks,
    Split
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a2_perifrases_v26_final_fix';
const mainProgressKey = 'progress_a2_es_perifrases_verbales';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---
const planesVocab = [
    { en: "TO START", es: "comenzar" }, { en: "TO FINISH", es: "terminar" }, { en: "TO CONTINUE", es: "continuar" },
    { en: "TO RETURN", es: "volver" }, { en: "TO QUIT / LEAVE", es: "dejar" }, { en: "TO PLAN", es: "planear" },
    { en: "TO CHANGE", es: "cambiar" }, { en: "TO DECIDE", es: "decidir" }, { en: "TO ARRIVE", es: "llegar" },
    { en: "TO LEAVE", es: "salir" }, { en: "TO REPEAT", es: "repetir" }, { en: "TO KEEP", es: "mantener" },
    { en: "TO TRY", es: "intentar" }, { en: "TO STOP", es: "parar" }, { en: "TO BECOME", es: "convertirse" },
    { en: "TO MOVE (HOUSE)", es: "mudarse" }, { en: "TO IMPROVE", es: "mejorar" }, { en: "TO ACHIEVE", es: "lograr" },
    { en: "TO ORGANIZE", es: "organizar" }, { en: "TO PREPARE", es: "preparar" }
];

const conjugationVerbs = [
    { v: "COMENZAR", type: "ar", forms: ["comencé", "comenzaste", "comenzó", "comenzamos", "comenzaron"] },
    { v: "TERMINAR", type: "ar", forms: ["terminé", "terminaste", "terminó", "terminamos", "terminaron"] },
    { v: "CONTINUAR", type: "ar", forms: ["continué", "continuaste", "continuó", "continuamos", "continuaron"] },
    { v: "VOLVER", type: "er", forms: ["volví", "volviste", "volvió", "volvimos", "volvieron"] },
    { v: "DEJAR", type: "ar", forms: ["dejé", "dejaste", "dejó", "dejamos", "dejaron"] },
    { v: "PLANEAR", type: "ar", forms: ["planeé", "planeaste", "planeó", "planeamos", "planearon"] },
    { v: "CAMBIAR", type: "ar", forms: ["cambié", "cambiaste", "cambió", "cambiamos", "cambiaron"] },
    { v: "DECIDIR", type: "ir", forms: ["decidí", "decidiste", "decidió", "decidimos", "decidieron"] },
    { v: "LLEGAR", type: "ar", forms: ["llegué", "llegaste", "llegó", "llegamos", "llegaron"] },
    { v: "SALIR", type: "ir", forms: ["salí", "saliste", "salió", "salimos", "salieron"] },
    { v: "REPETIR", type: "ir", forms: ["repetí", "repetiste", "repitió", "repetimos", "repitieron"] },
    { v: "MANTENER", type: "er", forms: ["mantuve", "mantuviste", "mantuvo", "mantenemos", "mantuvieron"] },
    { v: "INTENTAR", type: "ar", forms: ["intenté", "intentaste", "intentó", "intentamos", "intentaron"] },
    { v: "PARAR", type: "ar", forms: ["paré", "paraste", "paró", "paramos", "pararon"] },
    { v: "MEJORAR", type: "ar", forms: ["mejoré", "mejoraste", "mejoró", "mejoramos", "mejoraron"] },
    { v: "LOGRAR", type: "ar", forms: ["logré", "lograste", "logró", "logramos", "lograron"] },
    { v: "ORGANIZAR", type: "ar", forms: ["organicé", "organizaste", "organizó", "organizamos", "organizaron"] },
    { v: "PREPARAR", type: "ar", forms: ["preparé", "preparaste", "preparó", "preparamos", "prepararon"] },
    { v: "IR", type: "ir", forms: ["fui", "fuiste", "fue", "fuimos", "fueron"] },
    { v: "TENER", type: "er", forms: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvieron"] },
    { v: "HACER", type: "er", forms: ["hice", "hiciste", "hizo", "hicimos", "hicieron"] },
    { v: "DECIR", type: "ir", forms: ["dije", "dijiste", "dijo", "dijimos", "dijeron"] },
    { v: "VER", type: "er", forms: ["vi", "viste", "vio", "vimos", "vieron"] },
    { v: "DORMIR", type: "ir", forms: ["dormí", "dormiste", "durmió", "dormimos", "durmieron"] },
    { v: "QUERER", type: "er", forms: ["quise", "quisiste", "quiso", "quisimos", "quisieron"] },
    { v: "SABER", type: "er", forms: ["supe", "supiste", "supo", "supimos", "supieron"] },
    { v: "VENIR", type: "ir", forms: ["vine", "viniste", "vino", "vinimos", "vinieron"] },
    { v: "TOMAR", type: "ar", forms: ["tomé", "tomaste", "tomó", "tomamos", "tomaron"] },
    { v: "TRABAJAR", type: "ar", forms: ["trabajé", "trabajaste", "trabajó", "trabajamos", "trabajaron"] },
    { v: "ESTUDIAR", type: "ar", forms: ["estudié", "estudiaste", "estudió", "estudiamos", "estudiaron"] },
];

const ex1Prompts = [
    { en: "I am going to study tomorrow.", es: ["voy a estudiar mañana", "yo voy a estudiar mañana"] },
    { en: "She has just arrived.", es: ["acaba de llegar", "ella acaba de llegar"] },
    { en: "We keep working together.", es: ["seguimos trabajando juntos", "nosotros seguimos trabajando juntos"] },
    { en: "They return to play soccer.", es: ["vuelven a jugar fútbol", "ellos vuelven a jugar fútbol"] },
    { en: "You have to finish the project.", es: ["tienes que terminar el proyecto", "tú tienes que terminar el proyecto"] },
    { en: "He is going to call his boss.", es: ["él va a llamar a su jefe", "va a llamar a su jefe"] },
    { en: "I have just eaten a pizza.", es: ["acabo de comer una pizza", "yo acabo de comer una pizza"] },
    { en: "We have to leave now.", es: ["tenemos que salir ahora", "nosotros tenemos que salir ahora"] },
    { en: "She keeps reading that book.", es: ["ella sigue leyendo ese libro", "sigue leyendo ese libro"] },
    { en: "They return to study English.", es: ["vuelven a estudiar inglés", "ellos vuelven a estudiar inglés"] },
    { en: "I am going to travel next month.", es: ["voy a viajar el próximo mes", "yo voy a viajar el próximo mes"] },
    { en: "He has to arrive early.", es: ["él tiene que llegar temprano", "tiene que llegar temprano"] }
];

const ex2Prompts = [
    { en: "I have just started a new job.", es: ["acabo de empezar un nuevo trabajo", "acabo de comenzar un nuevo empleo"] },
    { en: "She keeps following the rules.", es: ["ella sigue siguiendo las reglas", "sigue cumpliendo las reglas"] },
    { en: "We return to live in Medellin.", es: ["volvemos a vivir en medellín", "volvemos a vivir en medellin"] },
    { en: "They are going to change the plan.", es: ["van a cambiar el plan", "ellos van a cambiar el plan"] },
    { en: "You have to help your family.", es: ["tienes que ayudar a tu familia"] },
    { en: "He has just finished his homework.", es: ["acaba de terminar su tarea", "él acaba de terminar su tarea"] },
    { en: "I keep trying to improve.", es: ["sigo intentando mejorar"] },
    { en: "She returns to cook for us.", es: ["ella vuelve a cocinar para nosotros", "vuelve a cocinar para nosotros"] },
    { en: "We are going to decide today.", es: ["vamos a decidir hoy", "nosotros vamos a decidir hoy"] },
    { en: "They have just arrived at the office.", es: ["acaban de llegar a la oficina"] },
    { en: "I have to achieve my goals.", es: ["tengo que lograr mis metas"] },
    { en: "You keep repeating the mistake.", es: ["sigues repitiendo el error"] }
];

const ex3Prompts = [
    { en: "I am going to become a doctor.", es: ["voy a convertirme en doctor"] },
    { en: "She has to stop crying.", es: ["ella tiene que parar de llorar", "tiene que dejar de llorar"] },
    { en: "We have just moved to a new house.", es: ["acabamos de mudarnos a una casa nueva"] },
    { en: "They return to try the exam.", es: ["vuelven a intentar el examen"] },
    { en: "I keep planning the trip.", es: ["sigo planeando el viaje"] },
    { en: "You are going to achieve success.", es: ["vas a lograr el éxito", "vas a tener éxito"] },
    { en: "He has just finished the report.", es: ["acaba de terminar el informe"] },
    { en: "She returns to visit her parents.", es: ["vuelve a visitar a sus padres"] },
    { en: "We have to continue the mission.", es: ["tenemos que continuar la misión"] },
    { en: "They keep helping at the hospital.", es: ["siguen ayudando en el hospital"] },
    { en: "I am going to organize the files.", es: ["voy a organizar los archivos"] },
    { en: "She has just prepared the dinner.", es: ["acaba de preparar la cena"] },
    { en: "We return to play tennis.", es: ["volvemos a jugar tenis"] },
    { en: "You have to keep your word.", es: ["tienes que mantener tu palabra"] },
    { en: "He is going to change his routine.", es: ["va a cambiar su rutina"] }
];

const readingData = {
    title: "Mis Planes para el Año",
    content: "Este año voy a empezar muchas cosas nuevas. Acabo de terminar mi carrera universitaria y ahora tengo que buscar un empleo. Sigo estudiando inglés todos los días porque quiero viajar al extranjero. Vuelvo a intentar la certificación internacional en diciembre. Debo organizar mi tiempo mejor si quiero lograr mis metas. Mi familia me apoya mucho.",
    questions: [
        { q: "¿Qué va a empezar el narrador?", a: ["cosas nuevas", "muchas cosas nuevas"] },
        { q: "¿Qué acaba de terminar?", a: ["su carrera universitaria", "su carrera"] },
        { q: "¿Qué tiene que buscar ahora?", a: ["un empleo", "empleo", "trabajo"] },
        { q: "¿Qué sigue haciendo cada día?", a: ["estudiando inglés", "estudiar ingles"] },
        { q: "¿Qué vuelve a intentar en diciembre?", a: ["la certificación internacional", "certificación"] }
    ]
};

const ex4Options = [
    { text: "Yo _______ a estudiar para el examen.", options: ["VOY", "VAMOS", "VA"], answer: "VOY" },
    { text: "Tú _______ que trabajar el sábado.", options: ["TIENE", "TIENES", "TENEMOS"], answer: "TIENES" },
    { text: "Nosotros _______ de llegar de viaje.", options: ["ACABO", "ACABAMOS", "ACABAN"], answer: "ACABAMOS" },
    { text: "Ellos _______ leyendo el mismo libro.", options: ["SIGO", "SIGUE", "SIGUEN"], answer: "SIGUEN" },
    { text: "Ella _______ a llamar por teléfono.", options: ["VUELVE", "VUELVO", "VUELVEN"], answer: "VUELVE" },
    { text: "Ustedes _______ a mudarse pronto.", options: ["VAN", "VAMOS", "VA"], answer: "VAN" },
    { text: "Él _______ que decidir ahora.", options: ["TIENEN", "TIENE", "TIENES"], answer: "TIENE" },
    { text: "Yo _______ de ver a mi madre.", options: ["ACABO", "ACABA", "ACABAMOS"], answer: "ACABO" },
    { text: "Nosotros _______ practicando tenis.", options: ["SEGUIMOS", "SIGUEN", "SIGUE"], answer: "SEGUIMOS" },
    { text: "Tú _______ a cometer el mismo error.", options: ["VUELVO", "VUELVES", "VUELVE"], answer: "VUELVES" },
    { text: "Ella _______ a ser una gran doctora.", options: ["VA", "VAN", "VOY"], answer: "VA" },
    { text: "Yo _______ que lograr mis sueños.", options: ["TENGO", "TIENE", "TENEMOS"], answer: "TENGO" },
    { text: "Ellos _______ de ganar el partido.", options: ["ACABAN", "ACABA", "ACABAMOS"], answer: "ACABAN" },
    { text: "Él _______ durmiendo en el sofá.", options: ["SIGUEN", "SIGUE", "SIGO"], answer: "SIGUE" },
    { text: "Nosotros _______ a intentar el reto.", options: ["VOLVEMOS", "VUELVEN", "VUELVO"], answer: "VOLVEMOS" },
    { text: "Usted _______ a viajar a Europa.", options: ["VAN", "VA", "VOY"], answer: "VA" },
    { text: "Ellas _______ que limpiar la casa.", options: ["TIENE", "TIENEN", "TIENES"], answer: "TIENEN" },
    { text: "Yo _______ de recibir la carta.", options: ["ACABO", "ACABA", "ACABAN"], answer: "ACABO" },
    { text: "Tú _______ estudiando para el quiz.", options: ["SIGUES", "SIGUEN", "SIGO"], answer: "SIGUES" },
    { text: "Él _______ a empezar de nuevo.", options: ["VUELVO", "VUELVE", "VUELVEN"], answer: "VUELVE" },
];

const completarPrompts = [
    { s: "1. Yo (ir) _______ a visitar a mis tíos.", a: "voy" },
    { s: "2. Tú (tener) _______ que estudiar más.", a: "tienes" },
    { s: "3. Ella (acaba) _______ de salir de clase.", a: "acaba" },
    { s: "4. Nosotros (seguir) _______ trabajando aquí.", a: "seguimos" },
    { s: "5. Ellos (volver) _______ a jugar fútbol.", a: "vuelven" },
    { s: "6. Él (ir) _______ a comprar una casa.", a: "va" },
    { s: "7. Yo (tener) _______ que terminar esto.", a: "tengo" },
    { s: "8. Tú (acaba) _______ de llamar.", a: "acabas" },
    { s: "9. Nosotros (ir) _______ a comer fuera.", a: "vamos" },
    { s: "10. Ellas (seguir) _______ viviendo allí.", a: "siguen" },
    { s: "11. Yo (volver) _______ a intentarlo.", a: "vuelvo" },
    { s: "12. Él (acaba) _______ de recibir un regalo.", a: "acaba" },
    { s: "13. Ustedes (tener) _______ que llegar puntual.", a: "tienen" },
    { s: "14. Nosotros (acaba) _______ de ver el mar.", a: "acabamos" },
    { s: "15. Ella (seguir) _______ esperando.", a: "sigue" },
    { s: "16. Yo (ir) _______ a ser feliz.", a: "voy" },
    { s: "17. Tú (volver) _______ a preguntar.", a: "vuelves" },
    { s: "18. Ellos (acaba) _______ de ganar.", a: "acaban" },
    { s: "19. Nosotros (tener) _______ que ahorrar.", a: "tenemos" },
    { s: "20. Él (ir) _______ a mudarse.", a: "va" },
    { s: "21. Yo (acaba) _______ de encontrar las llaves.", a: "acabo" },
    { s: "22. Tú (seguir) _______ siendo amable.", a: "sigues" },
    { s: "23. Ella (tener) _______ que cuidar al gato.", a: "tiene" },
    { s: "24. Nosotros (volver) _______ a caminar.", a: "volvemos" },
    { s: "25. Ellos (ir) _______ a aprender.", a: "van" },
    { s: "26. Yo (seguir) _______ cocinando.", a: "sigo" },
    { s: "27. Tú (ir) _______ a lograrlo.", a: "vas" },
    { s: "28. Él (volver) _______ a trabajar.", a: "vuelve" },
    { s: "29. Ellas (acaba) _______ de terminar.", a: "acaban" },
    { s: "30. Nosotros (ir) _______ a celebrar.", a: "vamos" },
];

const negativePrompts = [
    { en: "I am not going to study tonight.", es: ["no voy a estudiar esta noche", "yo no voy a estudiar esta noche"] },
    { en: "She does not have to work today.", es: ["ella no tiene que trabajar hoy", "no tiene que trabajar hoy"] },
    { en: "We have not just arrived.", es: ["no acabamos de llegar", "nosotros no acabamos de llegar"] },
    { en: "They do not keep living there.", es: ["ellos no siguen viviendo allí", "no siguen viviendo allá"] },
    { en: "I do not do that again.", es: ["no vuelvo a hacer eso", "yo no vuelvo a hacer eso"] },
    { en: "We are not going to travel this year.", es: ["no vamos a viajar este año", "nosotros no vamos a viajar este año"] },
    { en: "You do not have to buy anything.", es: ["no tienes que comprar nada", "tú no tienes que comprar nada"] },
    { en: "He has not just seen her.", es: ["él no acaba de verla", "no acaba de verla"] },
    { en: "We do not keep working together.", es: ["no seguimos trabajando juntos", "nosotros no seguimos trabajando juntos"] },
    { en: "She does not call again.", es: ["ella no vuelve a llamar", "no vuelve a llamar"] },
    { en: "They are not going to arrive on time.", es: ["no van a llegar a tiempo", "ellos no van a llegar a tiempo"] },
    { en: "I do not have to worry.", es: ["no tengo que preocuparme", "yo no tengo que preocuparme"] },
    { en: "She does not keep studying German.", es: ["ella no sigue estudiando alemán", "no sigue estudiando alemán"] },
    { en: "We do not return to that restaurant.", es: ["no volvemos a ese restaurante", "nosotros no volvemos a ese restaurante"] },
    { en: "He is not going to change his mind.", es: ["no va a cambiar de opinión", "él no va a cambiar de opinión"] },
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
        const corrects = prompts[currentIndex].es;
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
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase al español correctamente.</CardDescription>
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
                                <ScrollArea className="h-48 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (
                                            <Fragment key={en}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-semibold text-right">{es}</span></Fragment>
                                        ))}
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

function PerifrasesVerbalesContent() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    
    // Contenido Específico
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(planesVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(planesVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));

    const [optIdx, setOptIdx] = useState(0);
    const [optSolved, setOptSolved] = useState<Record<number, boolean>>({});

    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));

    const [readAns, setReadAns] = useState<Record<number, string>>({});
    const [readVal, setReadVal] = useState<Record<number, any>>({});
    const [transText, setTransText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{role?: string}>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any, name?: string}>(studentDocRef);
    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'exercise_3', name: '6. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'vocabulary_game', name: '7. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
        { key: 'completar', name: '10. Completar', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let p = initialPathData.map((topic, i) => ({ ...topic, status: i === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) p.forEach(t => t.status = 'completed');
        else {
            p.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < p.length; i++) { if (last && p[i].status === 'locked') p[i].status = 'active'; last = p[i].status === 'completed'; }
        }
        setLearningPath(p); setSelectedTopic(d.lastSelectedTopic || p.find(it => it.status === 'active')?.key || p[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.compAns) setCompAns(d.compAns);
        if (d.transText) setTransText(d.transText);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialPathData, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, compAns, transText };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAnswers, compAns, transText]);

    const handleTopicComplete = (completedKey: string) => setTopicToComplete(completedKey);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(curr => {
            let next: string | null = null; const np = [...curr];
            const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') { np[i + 1].status = 'active'; next = np[i + 1].key; }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión completada!" }); setSelectedTopic(n); }, 0); }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const t = learningPath.find(it => it.key === topicKey);
        if (!isAdmin && t?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete(topicKey);
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-foreground dark:text-primary'>Vocabulary: Planes y Cambios (20)</CardTitle></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {planesVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-3 border rounded bg-white/5 font-bold text-sm uppercase text-black dark:text-white">{v.en}</div>
                                    <Input value={vocabAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("uppercase text-black dark:text-white", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} readOnly={!!targetStudentId} autoComplete="off" />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button onClick={() => {
                                let all = true; const nv = planesVocab.map((v, i) => { const ok = v.es.toUpperCase() === (vocabAnswers[i] || '').trim().toUpperCase(); if (!ok) all = false; return ok ? 'correct' : 'incorrect'; });
                                setVocabVal(nv); if (all) { setCanAdvanceVocab(true); toast({ title: "¡Perfecto!" }); } else toast({ variant: 'destructive', title: "Sigue intentando" });
                            }} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Perífrasis Verbales</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 text-black dark:text-white font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">Estructura Básica</h3>
                                <p className='text-lg'>Las perífrasis son combinaciones de dos o más verbos que funcionan como una sola idea verbal.</p>
                                <div className='bg-primary/10 p-4 rounded-xl border-2 border-primary text-center font-mono text-xl'>Verbo auxiliar + elemento de enlace + Verbo principal</div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-black dark:text-white">
                                {[
                                    { t: "Voy a estudiar", d: "Plan o futuro próximo" },
                                    { t: "Tengo que trabajar", d: "Obligación" },
                                    { t: "Estoy estudiando", d: "Acción en progreso" },
                                    { t: "Acabo de llegar", d: "Pasado reciente" },
                                    { t: "Sigo estudiando", d: "Continuidad" },
                                    { t: "Vuelvo a estudiar", d: "Repetición" }
                                ].map((it, idx) => (
                                    <div key={idx} className='p-4 bg-card rounded-xl border border-border/50 shadow-sm'><p className='text-primary text-sm font-black mb-1'>{it.t}</p><p className='text-muted-foreground italic'>{it.d}</p></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjugationVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Pasado Simple ({conjIdx+1}/30)</CardTitle><CardDescription className="text-black dark:text-white">Escribe la conjugación en pasado simple.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.v}</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl text-black dark:text-white'>
                                {["YO", "TÚ", "ÉL/ELLA", "NOSOTROS", "ELLOS"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i]} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase text-black dark:text-white transition-all", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={() => {
                            const nv = conjAns.map((a, i) => a.trim().toLowerCase() === v.forms[i] ? 'correct' : 'incorrect');
                            setConjVal(nv);
                            if (nv.every(st => st === 'correct')) { toast({ title: "¡Perfecto!" }); if (conjIdx < conjugationVerbs.length - 1) { setTimeout(() => { setConjIdx(p => p+1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }, 800); } else handleTopicComplete('conjugation'); }
                            else toast({ variant: 'destructive', title: "Revisa la conjugación" });
                        }} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('exercise_1')} vocabulary={{ "tomorrow": "mañana", "arrived": "llegado", "together": "juntos", "soccer": "fútbol", "project": "proyecto" }} />;
            case 'exercise_2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('exercise_2')} vocabulary={{ "started": "empezado", "rules": "reglas", "change": "cambiar", "family": "familia", "homework": "tarea" }} />;
            case 'exercise_3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('exercise_3')} vocabulary={{ "become": "convertirse", "stop": "parar", "moved": "mudado", "achieve": "lograr", "mission": "misión" }} />;
            case 'vocabulary_game': return <VocabularyMatchingGame data={planesVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocabulary_game')} title="Memory: Planes y Cambios" />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Lectura: {readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed text-black dark:text-white shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4 text-black dark:text-white">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold'>{i+1}. {q.q}</Label><Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [i]: e.target.value}); setReadVal({...readVal, [i]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12', readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => {
                            let allOk = true; const nv: any = {};
                            readingData.questions.forEach((q, i) => { const ok = q.a.some(a => (readAns[i] || '').trim().toLowerCase().includes(a.toLowerCase())); nv[i] = ok ? 'correct' : 'incorrect'; if (!ok) allOk = false; });
                            setReadVal(nv); if (allOk) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); } else toast({ variant: 'destructive', title: "Revisa las respuestas" });
                        }} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
                        <CardHeader><CardTitle className='text-foreground dark:text-primary'>Ejercicio 4: Opción Múltiple</CardTitle><div className="flex gap-2 pt-4 flex-wrap">{ex4Options.map((_, i) => (<div key={i} onClick={() => setOptIdx(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", optIdx === i ? "border-primary ring-2 ring-primary" : "border-muted", optSolved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>))}</div></CardHeader>
                        <CardContent className="space-y-8 py-10">
                            <div className="text-3xl font-black text-center text-black dark:text-white leading-relaxed">
                                {ex4Options[optIdx].text.split('_______').map((part: string, i: number) => (<Fragment key={i}>{part}{i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", optSolved[optIdx] ? "text-primary border-primary" : "text-muted-foreground")}>{optSolved[optIdx] ? ex4Options[optIdx].answer : '...'}</span>}</Fragment>))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                {ex4Options[optIdx].options.map((opt: string) => (
                                    <Button key={opt} onClick={() => { if (opt.toUpperCase() === ex4Options[optIdx].answer.toUpperCase()) { setOptSolved({...optSolved, [optIdx]: true}); toast({ title: "¡Correcto!" }); } else toast({ variant: 'destructive', title: "Incorrecto" }); }} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", optSolved[optIdx] && opt.toUpperCase() === ex4Options[optIdx].answer.toUpperCase() && "border-green-500 bg-green-50 text-green-700 shadow-lg scale-105")}>{opt}</Button>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button variant="outline" onClick={() => setOptIdx(p => Math.max(0, p - 1))} disabled={optIdx === 0}>Anterior</Button><Button onClick={() => { if (optIdx < ex4Options.length - 1) setOptIdx(p => p + 1); else handleTopicComplete('exercise_4'); }} disabled={!optSolved[optIdx]} className="px-12 font-black h-12 shadow-xl">Siguiente</Button></CardFooter>
                    </Card>
                );
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-foreground dark:text-primary uppercase tracking-tighter'>Completar: Perífrasis Verbales</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg text-black dark:text-white">{q.s}</p>
                                    <Input value={compAns[i]} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase text-black dark:text-white", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => {
                            let all = true; const nv = completarPrompts.map((q, i) => { const res = q.a.toLowerCase() === (compAns[i] || '').trim().toLowerCase(); if (!res) all = false; return res ? 'correct' : 'incorrect'; });
                            setCompVal(nv); if (all) { toast({ title: "¡Dominio Total!" }); handleTopicComplete('completar'); } else toast({ variant: 'destructive', title: "Hay errores en la lista" });
                        }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle><CardDescription className='font-bold text-black dark:text-white'>Traduce el párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-black dark:text-white"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({"busy": "ocupado", "report": "informe", "arrived": "llegado", "checking": "revisando", "achieve": "lograr", "goals": "metas"}).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed text-black dark:text-white shadow-sm">"Carlos is a very busy person. Today, he is going to start a new project at work. He has to finish an important report before Friday. He has just arrived at the office and he keeps checking his email. Tomorrow, he returns to work early because he wants to achieve his goals soon."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (targetStudentId) return; setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg text-black dark:text-white" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Reto Final: Traducción Negativa" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{"tonight": "esta noche", "German": "alemán", "restaurant": "restaurante"}} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md"><div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p></div><Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar Supervisión</Link></Button></div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Activity className='h-10 w-10 text-primary' /> Perífrases Verbales 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30 text-left"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión Perífrasis</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span></div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Total</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PerifrasesVerbalesPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <PerifrasesVerbalesContent />
        </Suspense>
    );
}