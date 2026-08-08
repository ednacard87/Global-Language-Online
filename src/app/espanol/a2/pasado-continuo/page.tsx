'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, Fragment } from 'react';
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
    Check,
    X,
    Clock,
    Info,
    ListChecks
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_a2_es_pasado_continuo_v15_final_validated';
const mainProgressKey = 'progress_a2_es_pasado_continuo';

const ICONS_CONFIG_MAP = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const actividadesVocab = [
    { en: "TO COOK", es: "COCINAR" }, { en: "TO READ", es: "LEER" }, { en: "TO RUN", es: "CORRER" },
    { en: "TO STUDY", es: "ESTUDIAR" }, { en: "TO WORK", es: "TRABAJAR" }, { en: "TO EAT", es: "COMER" },
    { en: "TO SLEEP", es: "DORMIR" }, { en: "TO WALK", es: "CAMINAR" }, { en: "TO TALK", es: "HABLAR" },
    { en: "TO WRITE", es: "ESCRIBIR" }, { en: "TO DANCE", es: "BAILAR" }, { en: "TO SING", es: "CANTAR" },
    { en: "TO DRINK", es: "BEBER" }, { en: "TO LEARN", es: "APRENDER" }, { en: "TO WATCH TV", es: "VER TELEVISIÓN" },
    { en: "TO CLEAN", es: "LIMPIAR" }, { en: "TO DRIVE", es: "CONDUCIR" }, { en: "TO LISTEN", es: "ESCUCHAR" },
    { en: "TO PLAY", es: "JUGAR" }, { en: "TO BUY", es: "COMPRAR" }, { en: "TO SELL", es: "VENDER" },
    { en: "TO DO HOMEWORK", es: "HACER LA TAREA" }
];

const conjugationVerbs = [
    "HABLAR", "COMER", "VIVIR", "ESTUDIAR", "TRABAJAR", "CORRER", "ESCRIBIR", "DORMIR", "LEER", "HACER",
    "BAILAR", "CANTAR", "BEBER", "APRENDER", "VIAJAR", "LLEGAR", "SALIR", "LIMPIAR", "COMPRAR", "VENDER",
    "ESCUCHAR", "JUGAR", "CONDUCIR", "VER", "OIR", "TRAER", "PEDIR", "SERVIR", "CAMINAR", "NADAR"
];

const ex1Prompts = [
    { en: "I was talking on the phone.", es: ["estaba hablando por teléfono", "yo estaba hablando por teléfono"] },
    { en: "You were reading a book.", es: ["estabas leyendo un libro", "tú estabas leyendo un libro"] },
    { en: "He was running in the park.", es: ["estaba corriendo en el parque", "él estaba corriendo en el parque"] },
    { en: "We were studying Spanish.", es: ["estábamos estudiando español", "nosotros estábamos estudiando español"] },
    { en: "They were working late.", es: ["estaban trabajando tarde", "ellos estaban trabajando tarde"] },
    { en: "She was cooking dinner.", es: ["estaba cocinando la cena", "ella estaba cocinando la cena"] },
    { en: "I was sleeping at ten.", es: ["estaba durmiendo a las diez", "yo estaba durmiendo a las diez"] },
    { en: "You were walking the dog.", es: ["estabas caminando con el perro", "estabas paseando al perro"] },
    { en: "We were singing a song.", es: ["estábamos cantando una canción", "nosotros estábamos cantando una canción"] },
    { en: "They were dancing salsa.", es: ["estaban bailando salsa", "ellos estaban bailando salsa"] },
    { en: "It was raining a lot.", es: ["estaba lloviendo mucho"] },
    { en: "He was driving his car.", es: ["estaba conduciendo su carro", "estaba manejando su carro"] },
];

const ex2Prompts = [
    { en: "Were you eating pizza?", es: ["¿estabas comiendo pizza?", "¿estabas comiendo una pizza?"] },
    { en: "I was not working yesterday.", es: ["no estaba trabajando ayer", "yo no estaba trabajando ayer"] },
    { en: "Was she learning to swim?", es: ["¿estaba aprendiendo a nadar?"] },
    { en: "They were not buying anything.", es: ["no estaban comprando nada", "ellos no estaban comprando nada"] },
    { en: "Were we traveling to Spain?", es: ["¿estábamos viajando a España?"] },
    { en: "He was not selling his house.", es: ["no estaba vendiendo su casa", "él no estaba vendiendo su casa"] },
    { en: "I was cleaning my room.", es: ["estaba limpiando mi habitación", "estaba limpiando mi cuarto"] },
    { en: "You were not listening to me.", es: ["no estabas escuchándome", "no me estabas escuchando"] },
    { en: "Was he making lunch?", es: ["¿estaba haciendo el almuerzo?"] },
    { en: "Were they playing cards?", es: ["¿estaban jugando cartas?", "¿estaban jugando a las cartas?"] },
    { en: "She was opening the window.", es: ["estaba abriendo la ventana"] },
    { en: "I was not feeling well.", es: ["no me estaba sintiendo bien", "no estaba sintiéndome bien"] },
];

const ex3Prompts = [
    { en: "What were you doing at 5 PM?", es: ["¿qué estabas haciendo a las cinco?", "¿qué estabas haciendo a las 5 pm?"] },
    { en: "I was watching a movie.", es: ["estaba viendo una película", "yo estaba viendo una película"] },
    { en: "Who was calling you?", es: ["¿quién estaba llamándote?", "¿quién te estaba llamando?"] },
    { en: "We were having breakfast.", es: ["estábamos desayunando", "estábamos tomando el desayuno"] },
    { en: "They were following the signs.", es: ["estaban siguiendo las señales"] },
    { en: "She was bringing the food.", es: ["estaba trayendo la comida"] },
    { en: "I was telling the truth.", es: ["estaba diciendo la verdad"] },
    { en: "You were laughing at the joke.", es: ["estabas riéndote del chiste", "te estabas riendo del chiste"] },
    { en: "Was it snowing in London?", es: ["¿estaba nevando en Londres?"] },
    { en: "They were not helping us.", es: ["no estaban ayudándonos", "no nos estaban ayudando"] },
    { en: "He was repeating the word.", es: ["estaba repitiendo la palabra"] },
    { en: "Were you waiting for me?", es: ["¿estabas esperándome?", "¿me estabas esperando?"] },
];

const readingData = {
    title: "Un Sábado en la Tarde",
    content: "Ayer a las cuatro de la tarde, mi familia estaba muy ocupada. Mi mamá estaba cocinando un pastel delicioso en la cocina. Mi papá estaba trabajando en el jardín; él estaba cortando el césped. Mis hermanos estaban jugando fútbol en el parque cerca de la casa. Yo estaba estudiando para mi examen de español en mi habitación, pero no estaba concentrado porque estaba escuchando música. ¡Todos estábamos haciendo algo diferente!",
    questions: [
        { q: "¿A qué hora estaba ocupada la familia?", a: ["a las cuatro", "a las 4", "a las cuatro de la tarde"] },
        { q: "¿Qué estaba haciendo la mamá?", a: ["cocinando un pastel", "cocinando"] },
        { q: "¿Dónde estaba trabajando el papá?", a: ["en el jardín", "jardín"] },
        { q: "¿Qué estaban haciendo los hermanos?", a: ["jugando fútbol", "jugando futbol"] },
        { q: "¿Por qué no estaba concentrado el narrador?", a: ["porque estaba escuchando música", "estaba escuchando música"] }
    ],
    vocab: {
        "pastel": "cake",
        "delicioso": "delicious",
        "jardín": "garden",
        "césped": "grass / lawn",
        "examen": "exam / test",
        "habitación": "room / bedroom",
        "concentrado": "focused",
        "diferente": "different"
    }
};

const ex4ChoicePrompts = [
    { s: "Yo _______ (hablar) con mi madre.", o: ["estaba hablando", "hablaba"], a: "estaba hablando" },
    { s: "Tú _______ (correr) muy rápido.", o: ["estabas corriendo", "corrías"], a: "estabas corriendo" },
    { s: "Nosotros _______ (comer) pizza.", o: ["estábamos comiendo", "comíamos"], a: "estábamos comiendo" },
    { s: "Ellos _______ (estudiar) ayer.", o: ["estaban estudiando", "estudiaban"], a: "estaban estudiando" },
    { s: "Ella _______ (dormir) a las 8.", o: ["estaba durmiendo", "dormía"], a: "estaba durmiendo" },
    { s: "Él _______ (trabajar) en la oficina.", o: ["estaba trabajando", "trabajaba"], a: "estaba trabajando" },
    { s: "¿Tú _______ (leer) ese libro?", o: ["estabas leyendo", "leías"], a: "estabas leyendo" },
    { s: "Nosotros _______ (cantar) juntos.", o: ["estábamos cantando", "cantábamos"], a: "estábamos cantando" },
    { s: "Ellos _______ (viajar) a Madrid.", o: ["estaban viajando", "viajaban"], a: "estaban viajando" },
    { s: "Yo _______ (limpiar) la casa.", o: ["estaba limpiando", "limpiaba"], a: "estaba limpiando" },
    { s: "El perro _______ (correr) afuera.", o: ["estaba corriendo", "corría"], a: "estaba corriendo" },
    { s: "¿Ustedes _______ (escuchar) la radio?", o: ["estaban escuchando", "escuchaban"], a: "estaban escuchando" },
    { s: "Él _______ (beber) agua.", o: ["estaba bebiendo", "bebía"], a: "estaba bebiendo" },
    { s: "Ella _______ (escribir) una carta.", o: ["estaba escribiendo", "escribía"], a: "estaba escribiendo" },
    { s: "Nosotros _______ (bailar) salsa.", o: ["estábamos bailando", "bailábamos"], a: "estábamos bailando" },
    { s: "Yo _______ (conducir) mi carro.", o: ["estaba conduciendo", "conducía"], a: "estaba conduciendo" },
    { s: "Tú _______ (hacer) la tarea.", o: ["estabas haciendo", "hacías"], a: "estabas haciendo" },
    { s: "Ellos _______ (jugar) tenis.", o: ["estaban jugando", "jugaban"], a: "estaban jugando" },
    { s: "Ella _______ (ver) televisión.", o: ["estaba viendo", "veía"], a: "estaba viendo" },
    { s: "Nosotros _______ (vivir) en Londres.", o: ["estábamos viviendo", "vivíamos"], a: "estábamos viviendo" },
];

const completarPrompts = [
    { s: "1. Yo (trabajar) _______ en mi proyecto.", a: "estaba trabajando" },
    { s: "2. Tú (estudiar) _______ para el examen.", a: "estabas estudiando" },
    { s: "3. Él (correr) _______ por la playa.", a: "estaba corriendo" },
    { s: "4. Nosotros (beber) _______ café.", a: "estábamos bebiendo" },
    { s: "5. Ellos (jugar) _______ al tenis.", a: "estaban jugando" },
    { s: "6. Ella (cocinar) _______ la cena.", a: "estaba cocinando" },
    { s: "7. Yo (leer) _______ una novela.", a: "estaba leyendo" },
    { s: "8. Tú (dormir) _______ profundamente.", a: "estabas durmiendo" },
    { s: "9. Él (escribir) _______ un mensaje.", a: "estaba escribiendo" },
    { s: "10. Nosotros (viajar) _______ por Italia.", a: "estábamos viajando" },
    { s: "11. Yo (hablar) _______ con mi jefe.", a: "estaba hablando" },
    { s: "12. Tú (cantar) _______ en el coro.", a: "estabas cantando" },
    { s: "13. Ella (bailar) _______ en la fiesta.", a: "estaba bailando" },
    { s: "14. Nosotros (nadar) _______ en la piscina.", a: "estábamos nadando" },
    { s: "15. Ellos (beber) _______ jugo de naranja.", a: "estaban bebiendo" },
    { s: "16. Él (ver) _______ un documental.", a: "estaba viendo" },
    { s: "17. Yo (limpiar) _______ la cocina.", a: "estaba limpiando" },
    { s: "18. Tú (esperar) _______ el autobús.", a: "estabas esperando" },
    { s: "19. Ella (repetir) _______ la palabra.", a: "estaba repitiendo" },
    { s: "20. Nosotros (servir) _______ la comida.", a: "estábamos sirviendo" },
    { s: "21. Ellos (pedir) _______ el menú.", a: "estaban pidiendo" },
    { s: "22. Yo (conducir) _______ hacia el norte.", a: "estaba conduciendo" },
    { s: "23. Tú (traer) _______ las bebidas.", a: "estabas trayendo" },
    { s: "24. Él (hacer) _______ un pastel.", a: "estaba haciendo" },
    { s: "25. Nosotros (caminar) _______ por el bosque.", a: "estábamos caminando" },
    { s: "26. Ellos (dormir) _______ en el sofá.", a: "estaban durmiendo" },
    { s: "27. Ella (reír) _______ del chiste.", a: "estaba riendo" },
    { s: "28. Yo (oír) _______ un ruido.", a: "estaba oyendo" },
    { s: "29. Tú (vender) _______ tu carro.", a: "estabas vendiendo" },
    { s: "30. Nosotros (aprender) _______ verbos nuevos.", a: "estábamos aprendiendo" },
];

const translationTextData = {
    english: "Yesterday afternoon, everything was very quiet in the neighborhood. I was reading a book on the balcony. My neighbors were talking in the garden. Some children were playing with a ball in the street. A man was walking his dog and the sun was shining. It was a perfect moment and I was feeling very peaceful.",
    vocab: { "neighborhood": "vecindario / barrio", "balcony": "balcón", "neighbors": "vecinos", "shining": "brillando", "peaceful": "tranquilo / en paz", "quiet": "tranquilo", "yesterday": "ayer", "ball": "pelota / balón" }
};

const negativePrompts = [
    { en: "I was not studying last night.", es: ["no estaba estudiando anoche", "yo no estaba estudiando anoche"] },
    { en: "You were not working on Sunday.", es: ["no estabas trabajando el domingo", "tú no estabas trabajando el domingo"] },
    { en: "He was not sleeping at 9 AM.", es: ["no estaba durmiendo a las nueve", "él no estaba durmiendo a las 9 am"] },
    { en: "We were not eating meat.", es: ["no estábamos comiendo carne", "nosotros no estábamos comiendo carne"] },
    { en: "They were not playing in the house.", es: ["no estaban jugando en la casa", "ellos no estaban jugando en la casa"] },
    { en: "She was not talking to me.", es: ["no estaba hablándome", "ella no me estaba hablando"] },
    { en: "I was not buying a car.", es: ["no estaba comprando un carro", "yo no estaba comprando un carro"] },
    { en: "You were not listening to the teacher.", es: ["no estabas escuchando al profesor", "no estabas escuchando a la profesora"] },
    { en: "He was not driving fast.", es: ["no estaba conduciendo rápido", "él no estaba manejando rápido"] },
    { en: "They were not singing in the shower.", es: ["no estaban cantando en la ducha"] },
    { en: "We were not living in London then.", es: ["no estábamos viviendo en Londres entonces"] },
    { en: "She was not writing a letter.", es: ["no estaba escribiendo una carta"] },
    { en: "I was not making noise.", es: ["no estaba haciendo ruido"] },
    { en: "You were not seeing the problem.", es: ["no estabas viendo el problema"] },
    { en: "It was not raining at that moment.", es: ["no estaba lloviendo en ese momento"] },
];

const generalVocabHelp = { "estaba": "was", "estabas": "were", "comiendo": "eating", "trabajando": "working", "ayer": "yesterday", "nadar": "swim", "comprando": "buying", "viajando": "traveling", "viviendo": "living", "limpiando": "cleaning", "escuchándome": "listening to me", "jugando": "playing", "abriendo": "opening", "sintiéndome": "feeling", "anoche": "last night", "domingo": "Sunday" };

// --- HELPERS ---

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
                                <Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0">
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulary
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <div className="space-y-2 text-foreground text-left">
                                    <h4 className="font-bold border-b pb-1 text-primary">Vocabulario Útil</h4>
                                    <ScrollArea className="h-48 pr-4">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            {Object.entries(vocabulary).map(([es, en]: any) => (
                                                <Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-xl uppercase tracking-tighter text-foreground">{prompts[currentIndex].en}</div>
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

// --- MAIN CONTENT COMPONENT ---

function PasadoContinuoContent() {
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
    
    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(actividadesVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(actividadesVocab.length).fill('unchecked'));
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAnswers, setConjAnswers] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));
    const [choiceVal, setChoiceVal] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const [compAnswers, setCompAnswers] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<number, string>>({});
    const [readVal, setReadVal] = useState<Record<number, any>>({});
    const [translationTextAns, setTranslationTextAns] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo(() => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'ex4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
        { key: 'completar', name: '10. COMPLETAR', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map((topic, index) => ({ ...topic, status: index === 0 ? 'active' : 'locked' as any }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        
        if (isAdmin && !targetStudentId) {
            path.forEach(item => { item.status = 'completed'; });
        } else {
            path.forEach(item => { if (d[item.key]) item.status = d[item.key]; });
            let lastDone = true;
            for (let i = 0; i < path.length; i++) {
                if (lastDone && path[i].status === 'locked') path[i].status = 'active';
                lastDone = path[i].status === 'completed';
            }
        }
        
        setLearningPath(path);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
        if (d.compAnswers) setCompAnswers(d.compAnswers);
        if (d.translationTextAns) setTranslationTextAns(d.translationTextAns);
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 800);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / (learningPath.length || 1)) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        
        const saveTimer = setTimeout(() => {
            const s: Record<string, any> = { lastSelectedTopic: selectedTopic, vocabAnswers, compAnswers, translationTextAns };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 2000);
        
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, targetStudentId, initialLoadComplete, vocabAnswers, compAnswers, translationTextAns]);

    const handleTopicComplete = useCallback((completedKey: string) => { setTopicToComplete(completedKey); }, []);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let next: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    newPath[idx + 1].status = 'active'; 
                    next = newPath[idx + 1].key;
                }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Misión desbloqueada!" }); setSelectedTopic(n); }, 0); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar') handleTopicComplete(topicKey);
    };

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = actividadesVocab.map((v, i) => {
            const res = v.es.toUpperCase() === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) allOk = false;
            return res ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (allOk) toast({ title: "¡Perfecto!", description: "Has dominado todo el vocabulario." });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    const handleCheckGaps = () => {
        const curVerb = conjugationVerbs[conjIdx];
        const base = curVerb.slice(0, -2).toLowerCase();
        const suffix = curVerb.endsWith('AR') ? 'ando' : 'iendo';
        const correct = ["estaba", "estabas", "estaba", "estábamos", "estaban"].map(aux => `${aux} ${base}${suffix}`);
        
        const nv = conjAnswers.map((a, i) => a.trim().toLowerCase() === correct[i].toLowerCase() ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(v => v === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < 29) {
                setTimeout(() => { setConjIdx(prev => prev + 1); setConjAnswers(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }, 1000);
            } else handleTopicComplete('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const handleCheckReading = () => {
        let allOk = true; const nv: any = {};
        readingData.questions.forEach((q, i) => {
            const ans = (readAns[i] || '').trim().toLowerCase();
            const res = q.a.some(a => ans.includes(a.toLowerCase()));
            nv[i] = res ? 'correct' : 'incorrect'; if (!res) allOk = false;
        });
        setReadVal(nv); if (allOk) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); }
        else toast({ variant: 'destructive', title: "Revisa las respuestas de lectura" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;

        switch (selectedTopic) {
            case 'vocabulary':
                const vocabAllOk = vocabVal.length > 0 && vocabVal.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulario: Actividades Cotidianas (22)</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                                    {actividadesVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="p-3 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                            <Input 
                                                value={vocabAnswers[i] || ''} 
                                                onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); }} 
                                                className={cn(
                                                    "h-12 uppercase font-mono transition-all", 
                                                    vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : 
                                                    vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : ''
                                                )} 
                                                autoComplete="off" 
                                                readOnly={!!targetStudentId} 
                                            />
                                        </Fragment>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-4">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => handleTopicComplete('vocabulary')} disabled={!vocabAllOk && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMÁTICA: PASADO CONTINUO</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">¿Qué es?</h3>
                                <p className="text-lg">Describe acciones que estaban sucediendo en un momento específico del pasado.</p>
                                <p className="mt-4 p-4 bg-primary/10 rounded-xl border-2 border-primary text-center text-2xl uppercase">ESTABA / ESTABAS + GERUNDIO</p>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h4 className="text-xl font-black text-brand-purple uppercase mb-4">La Fórmula: ESTAR (PASADO) + VERBO (-ANDO / -IENDO)</h4>
                                <ul className="space-y-3 text-lg">
                                    <li>Yo <span className='text-primary uppercase'>estaba</span> hablando</li>
                                    <li>Tú <span className='text-primary uppercase'>estabas</span> comiendo</li>
                                    <li>Él/Ella/Ud <span className='text-primary uppercase'>estaba</span> viviendo</li>
                                    <li>Nosotros <span className='text-primary uppercase'>estábamos</span> corriendo</li>
                                    <li>Ellos/Ellas/Uds <span className='text-primary uppercase'>estaban</span> durmiendo</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">¡Entendido!</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const curVerb = conjugationVerbs[conjIdx];
                const pronouns = ["Yo", "Tú", "Él/Ella/Ud", "Nosotros", "Ellos/Uds"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='uppercase tracking-tighter'>Misión: Conjugación ({conjIdx + 1}/30)</CardTitle><CardDescription>Conjuga el verbo en Pasado Continuo.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="flex flex-col items-center p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Infinitivo</span>
                                <h3 className="text-5xl md:text-6xl font-black text-primary uppercase tracking-tighter">{curVerb}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                {pronouns.map((p, i) => (
                                    <div key={i} className="space-y-1">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{p}</Label>
                                        <Input value={conjAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAnswers]; na[i] = e.target.value; setConjAnswers(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 border-2 uppercase font-mono", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-6"><Button onClick={handleCheckGaps} size="lg" className="px-16 font-bold h-12 uppercase shadow-lg">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={generalVocabHelp} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={generalVocabHelp} />;
            case 'vocab_game': return <VocabularyMatchingGame data={actividadesVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Memory: Actividades" />;
            case 'ex3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={generalVocabHelp} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div><CardTitle className="uppercase tracking-tight">{readingData.title}</CardTitle></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <div className="space-y-2 text-foreground text-left">
                                            <h4 className="font-bold border-b pb-1 text-primary">Ayuda de Misión</h4>
                                            <ScrollArea className="h-48 pr-4">
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                    {Object.entries(readingData.vocab).map(([es, en]: any) => (
                                                        <Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></Fragment>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold'>{q.q}</Label>
                                <Input value={readAns[i] || ''} onChange={e => { if(targetStudentId) return; setReadAns({...readAns, [i]: e.target.value}); setReadVal({...readVal, [i]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12 text-foreground', readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-destructive bg-destructive/5' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'ex4':
                const curChoiceIdx = Object.values(choiceVal).filter(v => v === 'correct').length;
                const curChoice = ex4ChoicePrompts[curChoiceIdx] || ex4ChoicePrompts[ex4ChoicePrompts.length - 1];
                const choiceFinished = curChoiceIdx === ex4ChoicePrompts.length;
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='uppercase'>Ejercicio 4 (Opciones)</CardTitle><div className="flex gap-1.5 pt-4">{ex4ChoicePrompts.map((_, i) => (<div key={i} className={cn("h-3 flex-1 rounded-full", i < curChoiceIdx ? "bg-green-500" : choiceVal[i] === 'incorrect' ? "bg-red-500" : "bg-muted")} />))}</div></CardHeader>
                        <CardContent className="py-10 space-y-8">
                            <div className="text-2xl font-bold text-center leading-relaxed">"{curChoice.s}"</div>
                            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                {curChoice.o.map(opt => (
                                    <Button key={opt} onClick={() => {
                                        if (choiceFinished || targetStudentId) return;
                                        const res = opt === curChoice.a;
                                        setChoiceVal(prev => ({ ...prev, [curChoiceIdx]: res ? 'correct' : 'incorrect' }));
                                        if (res) {
                                            toast({ title: "¡Correcto!" });
                                            if (curChoiceIdx + 1 === ex4ChoicePrompts.length) handleTopicComplete('ex4');
                                        } else toast({ variant: 'destructive', title: "Incorrecto" });
                                    }} variant="outline" className="h-16 text-lg font-black uppercase" disabled={choiceFinished || !!targetStudentId}>{opt}</Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'completar':
                const compAllOk = compVal.length > 0 && compVal.every(v => v === 'correct');
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase font-black'>COMPLETAR FRASES (30)</CardTitle></CardHeader>
                        <CardContent><ScrollArea className="h-[550px] pr-4"><div className="space-y-4">
                            {completarPrompts.map((p, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/20 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{p.s}</p>
                                    <Input value={compAnswers[i] || ''} onChange={e => { if(targetStudentId) return; const na = [...compAnswers]; na[i] = e.target.value; setCompAnswers(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm uppercase font-mono text-foreground", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={() => {
                            let ok = true; const nv = completarPrompts.map((p, i) => { const res = p.a.toLowerCase() === compAnswers[i].trim().toLowerCase(); if(!res) ok = false; return res ? 'correct' : 'incorrect'; });
                            setCompVal(nv); if(ok) toast({ title: "¡Misión Cumplida!" });
                        }} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('completar')} disabled={!compAllOk && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className='text-primary uppercase'>Traducción de Texto</CardTitle>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-brand-blue border-2 animate-border-pulse shrink-0'><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-left">
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                {Object.entries(translationTextData.vocab).map(([en, es]: any) => (<Fragment key={en}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-semibold text-right">{es}</span></Fragment>))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm">"{translationTextData.english}"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><textarea value={translationTextAns} onChange={e => !targetStudentId && setTranslationTextAns(e.target.value)} placeholder="Escribe el texto en español aquí..." className="w-full min-h-[200px] p-4 rounded-xl border bg-background text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final':
                const finalAllOk = status[negativePrompts.length - 1] === 'correct'; // En BallsExercise se maneja por índice
                return <BallsExercise title="Final: Frases Negativas (15)" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} vocabulary={generalVocabHelp} />;
            default: return null;
        }
    };

    if (isInitialLoading) return <div className="flex flex-col items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-muted-foreground font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión A2...</p></div>;

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {isAdmin && targetStudentId && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md text-foreground">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Clock className='h-10 w-10 text-primary' /> Pasado Continuo 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12 text-foreground">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión A2</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = ICONS_CONFIG_MAP[item.status as keyof typeof ICONS_CONFIG_MAP] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">{item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}<span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-foreground">{item.name}</span></div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance Clase</span><span className="text-primary font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div></CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PasadoContinuoPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PasadoContinuoContent /></Suspense>);
}
