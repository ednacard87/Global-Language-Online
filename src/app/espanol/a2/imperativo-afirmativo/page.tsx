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
    Loader2, 
    ArrowRight,
    Gamepad2,
    Trophy,
    BookText,
    Pencil,
    Activity,
    Star,
    ArrowLeft,
    MessageSquare,
    ListChecks,
    Check,
    X,
    UtensilsCrossed
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
const progressStorageVersion = 'progress_es_a2_imp_af_v10_stable';
const mainProgressKey = 'progress_a2_es_imperativo_afirmativo';

const ICONS_CONFIG = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const instructionsVocab = [
    { en: "CUT", es: "CORTAR" }, { en: "MIX", es: "MEZCLAR" }, { en: "COOK", es: "COCINAR" },
    { en: "OPEN", es: "ABRIR" }, { en: "CLOSE", es: "CERRAR" }, { en: "CLEAN", es: "LIMPIAR" },
    { en: "BOIL", es: "HERVIR" }, { en: "FRY", es: "FREIR" }, { en: "BAKE", es: "HORNEAR" },
    { en: "PEEL", es: "PELAR" }, { en: "STIR", es: "REVOLVER" }, { en: "POUR", es: "VERTER" },
    { en: "ADD", es: "AÑADIR" }, { en: "WASH", es: "LAVAR" }, { en: "DRY", es: "SECAR" },
    { en: "PUT", es: "PONER" }, { en: "TAKE", es: "TOMAR" }, { en: "SERVE", es: "SERVIR" },
    { en: "WAIT", es: "ESPERAR" }, { en: "EAT", es: "COMER" }, { en: "DRINK", es: "BEBER" },
    { en: "ENJOY", es: "DISFRUTAR" }
];

const conjugationVerbs = [
    { v: "CORTAR", en: "CUT", forms: ["corta", "corte", "cortemos", "cortan"] },
    { v: "MEZCLAR", en: "MIX", forms: ["mezcla", "mezcle", "mezclemos", "mezclan"] },
    { v: "COCINAR", en: "COOK", forms: ["cocina", "cocine", "cocinemos", "cocinan"] },
    { v: "ABRIR", en: "OPEN", forms: ["abre", "abra", "abramos", "abran"] },
    { v: "CERRAR", en: "CLOSE", forms: ["cierra", "cierre", "cerremos", "cierran"] },
    { v: "LIMPIAR", en: "CLEAN", forms: ["limpia", "limpie", "limpiemos", "limpien"] },
    { v: "PONER", en: "PUT", forms: ["pon", "ponga", "pongamos", "pongan"] },
    { v: "TOMAR", en: "TAKE", forms: ["toma", "tome", "tomemos", "tomen"] },
    { v: "SERVIR", en: "SERVE", forms: ["sirve", "sirva", "sirvamos", "sirvan"] },
    { v: "LAVAR", en: "WASH", forms: ["lava", "lave", "lavemos", "lavan"] },
    { v: "AÑADIR", en: "ADD", forms: ["añade", "añada", "añadamos", "añadan"] },
    { v: "HERVIR", en: "BOIL", forms: ["hierve", "hierva", "hirvamos", "hiervan"] },
    { v: "PELAR", en: "PEEL", forms: ["pela", "pele", "pelemos", "pelen"] },
    { v: "REVOLVER", en: "STIR", forms: ["revuelve", "revuelva", "revolvamos", "revuelvan"] },
    { v: "BEBER", en: "DRINK", forms: ["bebe", "beba", "bebamos", "beban"] },
    { v: "COMER", en: "EAT", forms: ["come", "coma", "comamos", "coman"] },
    { v: "DECIR", en: "SAY", forms: ["di", "diga", "digamos", "digan"] },
    { v: "HACER", en: "DO", forms: ["haz", "haga", "hagamos", "hagan"] },
    { v: "IR", en: "GO", forms: ["ve", "vaya", "vayamos", "vayan"] },
    { v: "SALIR", en: "EXIT", forms: ["sal", "salga", "salgamos", "salgan"] },
    { v: "TENER", en: "HAVE", forms: ["ten", "tenga", "tengamos", "tengan"] },
    { v: "VENIR", en: "COME", forms: ["ven", "venga", "vengamos", "vengan"] },
    { v: "PEDIR", en: "ORDER", forms: ["pide", "pida", "pidamos", "pidan"] },
    { v: "TRAER", en: "BRING", forms: ["trae", "traiga", "traigamos", "traigan"] },
    { v: "DAR", en: "GIVE", forms: ["da", "dé", "demos", "den"] },
    { v: "JUGAR", en: "PLAY", forms: ["juega", "juegue", "juguemos", "jueguen"] },
    { v: "LEER", en: "READ", forms: ["lee", "lea", "leamos", "lean"] },
    { v: "ESCRIBIR", en: "WRITE", forms: ["escribe", "escriba", "escribamos", "escriban"] },
    { v: "DORMIR", en: "SLEEP", forms: ["duerme", "duerma", "durmamos", "duerman"] },
    { v: "CANTAR", en: "SING", forms: ["canta", "cante", "cantemos", "canten"] },
];

const ex1Prompts = [
    { en: "Open the door.", es: ["abre la puerta", "abra la puerta"] },
    { en: "Eat your vegetables.", es: ["come tus verduras", "coma sus verduras"] },
    { en: "Speak slowly, please.", es: ["habla despacio por favor", "hable despacio por favor"] },
    { en: "Close the window.", es: ["cierra la ventana", "cierre la ventana"] },
    { en: "Clean your room.", es: ["limpia tu habitación", "limpia tu cuarto"] },
    { en: "Listen to me.", es: ["escúchame", "escúcheme"] },
    { en: "Wait for me here.", es: ["espérame aquí", "espéreme aquí"] },
    { en: "Do your homework.", es: ["haz tu tarea", "haga su tarea"] },
    { en: "Come with us.", es: ["ven con nosotros", "venga con nosotros"] },
    { en: "Tell the truth.", es: ["di la verdad", "diga la verdad"] },
];

const ex2Prompts = [
    { en: "Wash the dishes.", es: ["lava los platos", "lave los platos"] },
    { en: "Mix the ingredients.", es: ["mezcla los ingredientes", "mezcle los ingredientes"] },
    { en: "Put the sugar in the coffee.", es: ["pon el azúcar en el café", "ponga el azúcar en el café"] },
    { en: "Take this medicine.", es: ["toma esta medicina", "tome esta medicina"] },
    { en: "Cut the bread.", es: ["corta el pan", "corte el pan"] },
    { en: "Serve the dinner.", es: ["sirve la cena", "sirva la cena"] },
    { en: "Boil the water.", es: ["hierve el agua", "hierva el agua"] },
    { en: "Wait ten minutes.", es: ["espera diez minutos", "espere diez minutos"] },
    { en: "Drink your juice.", es: ["bebe tu jugo", "beba su jugo"] },
    { en: "Add some salt.", es: ["añade un poco de sal", "agregue un poco de sal"] },
    { en: "Fry the eggs.", es: ["fríe los huevos", "fría los huevos"] },
    { en: "Bake the cake.", es: ["hornea el pastel", "hornee el pastel"] },
];

const ex3Prompts = [
    { en: "Go to the market.", es: ["ve al mercado", "vaya al mercado"] },
    { en: "Help your sister.", es: ["ayuda a tu hermana", "ayude a su hermana"] },
    { en: "Read this book.", es: ["lee este libro", "lea este libro"] },
    { en: "Study for the exam.", es: ["estudia para el examen", "estudie para el examen"] },
    { en: "Call your mother.", es: ["llama a tu madre", "llama a tu mamá"] },
    { en: "Write a letter.", es: ["escribe una carta", "escriba una carta"] },
    { en: "Bring the keys.", es: ["trae las llaves", "traiga las llaves"] },
    { en: "Give me the book.", es: ["dame el libro", "deme el libro"] },
    { en: "Play with your toys.", es: ["juega con tus juguetes", "juegue con sus juguetes"] },
    { en: "Run to the corner.", es: ["corre a la esquina", "corra a la esquina"] },
    { en: "Sleep eight hours.", es: ["duerme ocho horas", "duerma ocho horas"] },
    { en: "Sing a song.", es: ["canta una canción", "cante una canción"] },
    { en: "Open the gift.", es: ["abre el regalo", "abra el regalo"] },
    { en: "Enjoy the party.", es: ["disfruta la fiesta", "disfrute la fiesta"] },
    { en: "Finish the job.", es: ["termina el trabajo", "termine el trabajo"] },
];

const readingData = {
    title: "Receta: Ensalada de Frutas Mágica",
    content: "Primero, lava todas las frutas con abundante agua. Luego, pela las manzanas y los plátanos. Corta la fruta en trozos pequeños. Pon todo en un recipiente grande. Añade un poco de miel y mezcla bien con una cuchara. Sirve en platos pequeños y disfruta con tu familia.",
    questions: [
        { id: "q1", question: "¿Qué debes hacer primero?", a: ["lavar las frutas", "lavar todas las frutas"] },
        { id: "q2", question: "¿Qué frutas debes pelar?", a: ["manzanas y plátanos"] },
        { id: "q3", question: "¿Cómo debes cortar la fruta?", a: ["en trozos pequeños"] },
        { id: "q4", question: "¿Qué debes añadir a la ensalada?", a: ["un poco de miel", "miel"] },
        { id: "q5", question: "¿Con quién debes disfrutar la ensalada?", a: ["con tu familia", "familia"] }
    ]
};

const ex4Options = [
    { text: "(Tú) _______ (comer) toda la comida.", options: ["COME", "COMA", "COMES"], answer: "COME" },
    { text: "(Usted) _______ (limpiar) la mesa.", options: ["LIMPIE", "LIMPIA", "LIMPIAS"], answer: "LIMPIE" },
    { text: "(Nosotros) _______ (mezclar) los ingredientes.", options: ["MEZCLEMOS", "MEZCLAMOS", "MEZCLAN"], answer: "MEZCLEMOS" },
    { text: "(Ustedes) _______ (abrir) sus libros.", options: ["ABRAN", "ABREN", "ABRIMOS"], answer: "ABRAN" },
    { text: "(Tú) _______ (hacer) la tarea ahora.", options: ["HAZ", "HAGA", "HACES"], answer: "HAZ" },
    { text: "(Usted) _______ (escribir) la carta.", options: ["ESCRIBA", "ESCRIBE", "ESCRIBES"], answer: "ESCRIBA" },
    { text: "(Tú)_______ (cortar) la papá", options: ["CORTE", "CORTAN", "CORTA"], answer: "CORTA" },
    { text: "(Usted)_______ (cerrar) la ventana", options: ["cierra", "cierres", "cierre"], answer: "cierre" },
    { text: "(Nosotros)______ (leer) la receta", options: ["lean", "leamos", "leen"], answer: "leamos" },
    { text: "(Tú)_______(beber) el remedio", options: ["beba", "bebes", "beben"], answer: "beba" },
    { text: "(usted)_______ (bailar) la macarena", options: ["bailas", "bailes", "baile"], answer: "baile" },
    { text: "(ustedes)______ (mezclar) los ingredientes", options: ["mezclan", "mezclan", "mezclan"], answer: "mezclan" },
    { text: "(nosotros)_______(llamar) el chef", options: ["llama", "llamamos", "llaman"], answer: "llamamos" },
    { text: "(tú)_______(cortar) la cebolla", options: ["corta", "cortas", "corta"], answer: "corta" },
    { text: "(usted)_______(limpiar) la sala", options: ["limpie", "limpia", "limpian"], answer: "limpie" },
    { text: "(nosotros)_______(beber) el agua", options: ["bebamos", "bebamoss", "beben"], answer: "bebamos" },
    { text: "(ustedes)_______(escribir) la carta", options: ["escriban", "escriben", "escribimos"], answer: "escriban" },
    { text: "(tú)_______(leer) el libro", options: ["lee", "lees", "leen"], answer: "lee" },
    { text: "(usted)_______(preparar) la comida", options: ["prepare", "prepara", "preparan"], answer: "prepare" },
    { text: "(nosotros)_______(cocinar) el arroz", options: ["cocinemos", "cocinamos", "cocinan"], answer: "cocinemos" },
    { text: "(ustedes)_______(cerrar) la ventana", options: ["cierran", "cierras", "cierra"], answer: "cierran" },
    { text: "(Tú)_____ (vivir) feliz", options: ["vive", "vives", "viven"], answer: "vive" },
    { text: "(Usted)_____ (comer) la manzana", options: ["coma", "comes", "comen"], answer: "coma" },
    { text: "(Nosotros)_____ (correr) en el parque", options: ["corramos", "corremos", "corren"], answer: "corramos" },
    { text: "(Ustedes)_____ (bailar) la salsa", options: ["bailean", "bailan", "bailas"], answer: "bailan" },
];

const completarPrompts = [
    { s: "1. (Tú - cocinar) _______ el arroz.", a: "cocina" },
    { s: "2. (Usted - mezclar) _______ la ensalada.", a: "mezcle" },
    { s: "3. (Tú - cortar) _______ la cebolla.", a: "corta" },
    { s: "4. (Ustedes - limpiar) _______ la cocina.", a: "limpien" },
    { s: "5. (Nosotros - lavar) _______ los platos.", a: "lavemos" },
    { s: "6. (Tú - cortar) ________ las fresas", a: "corta" },
    { s: "7. (Usted - preparar) _______ la comida", a: "prepare" },
    { s: "8. (Nosotros - beber) _______ el agua", a: "bebamos" },
    { s: "9. (Ustedes - escribir) _______ la carta", a: "escriban" },
    { s: "10. (Tú - leer) _______ el libro", a: "lee" },
    { s: "11. (Usted - limpiar) _______ la sala", a: "limpie" },
    { s: "12. (Nosotros - cantar) _______ la canción", a: "cantemos" },
    { s: "13. (Tú - escribir) _______ el articulo", a: "escribes" },
    { s: "14. (Ustedes - beber) _______ el vino", a: "beban" },
    { s: "15. (Nosotros - jugar) _______ al fútbol", a: "juegamos" },
    { s: "16. (Tú - limpiar) _______ la habitación", a: "limpia" },
    { s: "17. (Usted - cocinar) _______ la cena", a: "cocine" },
    { s: "18. (Nosotros - escribir) _______ la carta", a: "escribamos" },
    { s: "19. (Ustedes - beber) _______ el café", a: "beban" },
    { s: "20. (Tú - leer) _______ el periódico", a: "lee" },
    { s: "21. (Usted - escribir) _______ el libro", a: "escriba" },
    { s: "22. (Nosotros - cantar) _______ la canción", a: "cantemos" },
    { s: "23. (Tú - limpiar) _______ la cocina", a: "limpia" },
    { s: "24. (Usted - cocinar) _______ las papas", a: "cocine" },
    { s: "25. (Nosotros - escribir) _______ el informe", a: "escribamos" },
    { s: "26. (Tú - leer) _______ las instrucciones", a: "lee" },
    { s: "27. (Usted - limpiar) _______ la sala", a: "limpie" },
    { s: "28. (Nosotros - beber) _______ el agua", a: "bebamos" },
    { s: "29. (Ustedes - escribir) _______ el libro", a: "escriban" },
    { s: "30. (Tú - leer) _______ todos los dias", a: "lee" },
];

const negativePrompts = [
    { en: "Don't open the door.", es: ["no abras la puerta", "no abra la puerta"] },
    { en: "Don't eat that.", es: ["no comas eso", "no coma eso"] },
    { en: "Don't speak now.", es: ["no hables ahora", "no hable ahora"] },
    { en: "Don't close the window.", es: ["no cierres la ventana", "no cierre la ventana"] },
    { en: "Don't wait for me.", es: ["no me espere", "no me esperes"] },
    { en: "Don't forget to call me.", es: ["no me llames", "no me llames"] },
    { en: "Don't be late.", es: ["no llegues tarde", "no llegue tarde"] },
    { en: "Don't touch that.", es: ["no toques eso", "no toque eso"] },
    { en: "Don't drive too fast.", es: ["no conduzcas muy rápido", "no conduzca muy rápido"] },
    { en: "Don't shout.", es: ["no grites", "no grite"] },
    { en: "Don't smoke here.", es: ["no fumes aquí", "no fume aquí"] },
    { en: "Don't leave the lights on.", es: ["no dejes las luces encendidas", "no deje las luces encendidas"] },
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
        const isCorrect = prompts[currentIndex].es.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        setStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: "¡Buen trabajo!" });
        else toast({ variant: 'destructive', title: "Sigue intentando" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <div className="flex justify-between items-start">
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
                                    <div className="grid grid-cols-2 gap-2 text-sm text-left">
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
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Tu traducción..." autoComplete="off" />
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

function ImperativoAfirmativoContent() {
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

    // States for content
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(instructionsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(instructionsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAnswers, setConjAnswers] = useState<string[]>(Array(4).fill(''));
    const [conjValidation, setConjValidation] = useState<any[]>(Array(4).fill('unchecked'));
    const [optIdx, setOptIdx] = useState(0);
    const [optSolved, setOptSolved] = useState<Record<number, boolean>>({});
    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));
    const [readAns, setReadAns] = useState<Record<string, string>>({});
    const [readVal, setReadVal] = useState<Record<string, any>>({});
    const [translationText, setTranslationText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'ex4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
        { key: 'completar', name: '10. Completar', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '12. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(topic => ({ ...topic }));
        const d = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin && !targetStudentId) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < path.length; i++) { if (last && path[i].status === 'locked') path[i].status = 'active'; last = path[i].status === 'completed'; }
        }
        setLearningPath(path);
        setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true); setIsInitialLoading(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((comp / learningPath.length) * 100);
    }, [learningPath]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;
        const s: any = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(t => s[t.key] = t.status);
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(current => {
            let next: string | null = null; const np = [...current];
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

    const handleCheckVocab = () => {
        let allOk = true;
        const nv = instructionsVocab.map((v, i) => {
            const res = v.es.toUpperCase() === (vocabAnswers[i] || '').trim().toUpperCase();
            if (!res) allOk = false; return res ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (allOk) { setCanAdvanceVocab(true); toast({ title: "¡Vocabulario completado!" }); }
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" /></div>;
        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle>Vocabulary: Kitchen & Instructions</CardTitle></CardHeader>
                        <CardContent><ScrollArea className="h-[500px] pr-4 text-foreground"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase text-xs">Español</div>
                            {instructionsVocab.map((v, i) => (
                                <Fragment key={i}>
                                    <div className="p-2 border rounded bg-white/5 font-bold flex items-center text-sm">{v.en}</div>
                                    <Input value={vocabAnswers[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); setCanAdvanceVocab(false); }} className={cn("uppercase", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                                </Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-between border-t pt-6"><Button onClick={handleCheckVocab} variant="secondary">Verificar</Button><Button onClick={() => handleTopicComplete('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar</Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR: IMPERATIVO AFIRMATIVO</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm">
                                <h3 className="text-xl font-black text-primary uppercase mb-4">¿Para qué sirve?</h3>
                                <p className="text-lg">El modo imperativo se usa para dar órdenes, consejos, instrucciones o hacer peticiones directas.</p>
                                <p className="text-lg">The imperative mood is used to give orders, advice, or instructions, or to make direct requests.</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-primary/20 shadow-lg text-foreground">
                                    <h4 className="text-xl font-black text-primary uppercase mb-4">1. Para 'TÚ' (Informal)</h4>
                                    <p className="mb-2">Es igual a la 3ª persona del presente indicativo.</p>
                                    <p className="font-mono bg-muted p-2 rounded">Cantar &rarr; ¡Canta! / Comer &rarr; ¡Come!</p>
                                </div>
                                <div className="p-6 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-brand-purple/20 shadow-lg text-foreground">
                                    <h4 className="text-xl font-black text-brand-purple uppercase mb-4">2. Para 'USTED' (Formal)</h4>
                                    <p className="mb-2">Se usa la forma del subjuntivo.</p>
                                    <p className="font-mono bg-muted p-2 rounded">Cantar &rarr; ¡Cante! / Comer &rarr; ¡Coma!</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicComplete('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjugationVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Conjugación Imperativa ({conjIdx+1}/30)</CardTitle><CardDescription>Escribe el imperativo afirmativo para cada pronombre.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8 flex flex-col items-center">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.v} ({v.en})</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl text-foreground'>
                                {["TÚ", "USTED", "NOSOTROS", "USTEDES"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAnswers[i]} onChange={e => { if (targetStudentId) return; const na = [...conjAnswers]; na[i] = e.target.value; setConjAnswers(na); const nv = [...conjValidation]; nv[i] = 'unchecked'; setConjValidation(nv); }} className={cn("h-10 text-lg uppercase transition-all", conjValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={() => {
                            const nv = conjAnswers.map((a, i) => a.trim().toLowerCase() === v.forms[i] ? 'correct' : 'incorrect');
                            setConjValidation(nv);
                            if (nv.every(st => st === 'correct')) { toast({ title: "¡Perfecto!" }); if (conjIdx < conjugationVerbs.length - 1) { setTimeout(() => { setConjIdx(p => p+1); setConjAnswers(Array(4).fill('')); setConjValidation(Array(4).fill('unchecked')); }, 800); } else handleTopicComplete('conjugation'); }
                            else toast({ variant: 'destructive', title: "Revisa la conjugación" });
                        }} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise key="ex1" title="Exercise 1" prompts={ex1Prompts} onComplete={() => handleTopicComplete('ex1')} vocabulary={{"despacio": "slowly", "tarea": "homework", "verdad": "truth"}} />;
            case 'ex2': return <BallsExercise key="ex2" title="Exercise 2" prompts={ex2Prompts} onComplete={() => handleTopicComplete('ex2')} vocabulary={{"ingredientes": "ingredients", "medicina": "medicine", "hervir": "boil"}} />;
            case 'vocab_game': return <VocabularyMatchingGame data={instructionsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicComplete('vocab_game')} title="Kitchen Vocabulary Memory" />;
            case 'ex3': return <BallsExercise key="ex3" title="Exercise 3" prompts={ex3Prompts} onComplete={() => handleTopicComplete('ex3')} vocabulary={{"mercado": "market", "juguetes": "toys", "esquina": "corner"}} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold text-foreground'>{i+1}. {q.question}</Label><Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; setReadAns({...readAns, [q.id]: e.target.value}); setReadVal({...readVal, [q.id]: 'unchecked'}); }} className={cn('mt-1 text-lg h-12', readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => {
                            let ok = true; const nv: any = {};
                            readingData.questions.forEach((q, i) => { const res = q.a.some(a => (readAns[q.id] || '').trim().toLowerCase().includes(a.toLowerCase())); nv[q.id] = res ? 'correct' : 'incorrect'; if (!res) ok = false; });
                            setReadVal(nv); if (ok) { toast({ title: "¡Lectura superada!" }); handleTopicComplete('reading'); } else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
                        }} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'ex4':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
                        <CardHeader><CardTitle>Ejercicio 4: Opción Múltiple</CardTitle><div className="flex gap-2 pt-4 flex-wrap">{ex4Options.map((_, i) => (<div key={i} onClick={() => setOptIdx(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", optIdx === i ? "border-primary ring-2 ring-primary" : "border-muted", optSolved[i] ? "bg-green-500 text-white border-green-500" : "bg-card")}>{i + 1}</div>))}</div></CardHeader>
                        <CardContent className="space-y-8 py-10">
                            <div className="text-3xl font-black text-center leading-relaxed text-foreground">
                                {ex4Options[optIdx].text.split('_______').map((part, i) => (<Fragment key={i}>{part}{i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", optSolved[optIdx] ? "text-primary border-primary" : "text-muted-foreground")}>{optSolved[optIdx] ? ex4Options[optIdx].answer : '...'}</span>}</Fragment>))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                {ex4Options[optIdx].options.map(opt => (
                                    <Button key={opt} onClick={() => { if (opt.toUpperCase() === ex4Options[optIdx].answer.toUpperCase()) { setOptSolved({...optSolved, [optIdx]: true}); toast({ title: "¡Correcto!" }); } else toast({ variant: 'destructive', title: "Incorrecto" }); }} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", optSolved[optIdx] && opt.toUpperCase() === ex4Options[optIdx].answer.toUpperCase() && "border-green-500 bg-green-50 text-green-700 shadow-lg scale-105")}>{opt}</Button>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-between border-t pt-6">
                            <Button variant="outline" onClick={() => setOptIdx(p => Math.max(0, p - 1))} disabled={optIdx === 0}>Anterior</Button>
                            <Button onClick={() => { if (optIdx < ex4Options.length - 1) setOptIdx(p => p + 1); else handleTopicComplete('ex4'); }} disabled={!optSolved[optIdx]} className="px-12 font-black h-12 shadow-xl">Siguiente</Button>
                        </CardFooter>
                    </Card>
                );
            case 'completar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: Imperativo Afirmativo</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg text-foreground">{q.s}</p>
                                    <Input value={compAns[i]} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase text-foreground", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={!!targetStudentId} />
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
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: The Recipe</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-foreground"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({"delicious": "sabroso", "chopped": "picado", "bowl": "tazón", "wait": "esperar", "oven": "horno"}).map(([en, es], i) => (<div key={i} className="flex justify-between text-xs border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"To make this delicious cake, follow these steps. First, open the box and mix the ingredients. Add three eggs and stir well. Then, put the mix in the oven and wait thirty minutes. Finally, take the cake out, serve it and enjoy with your friends."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={translationText} onChange={(e) => { if (targetStudentId) return; setTranslationText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[250px] text-lg text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicComplete('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Misión Final <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise key="final" title="Reto Final: Traducción Negativa" prompts={negativePrompts} onComplete={() => handleTopicComplete('final')} vocabulary={{"lie": "mentira", "alone": "solo", "glass": "vaso"}} />;
            default: return null;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg text-foreground">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {targetStudentId && isAdmin && (
                        <div className="mb-6 bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400"><Star className="h-6 w-6 fill-current animate-pulse" /><p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión Activo: {studentProfile?.name || targetStudentId}</p></div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar Supervisión</Link>
                            </Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A2</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><UtensilsCrossed className='h-10 w-10 text-primary' /> Imperativo Afirmativo 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión Imperativa</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const isSelected = selectedTopic === item.key;
                                            const Icon = ICONS_CONFIG[item.status as keyof typeof ICONS_CONFIG] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] uppercase font-bold text-[10px]">{item.name}</span>
                                                    </div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Avance</span><span className="text-primary font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function ImperativoAfirmativoPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <ImperativoAfirmativoContent />
        </Suspense>
    );
}