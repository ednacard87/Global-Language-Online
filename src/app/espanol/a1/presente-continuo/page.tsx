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
    ChevronDown,
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
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_a1_pres_cont_v50_final_fix';
const mainProgressKey = 'progress_a1_es_presente_continuo';

// ==========================================
// --- SECCIONES DE VOCABULARIO ---
// ==========================================

const VOCAB_INFINITIVOS = [
    { en: "TO TALK", es: "HABLAR" }, { en: "TO EAT", es: "COMER" }, { en: "TO LIVE", es: "VIVIR" }, 
    { en: "TO WORK", es: "TRABAJAR" }, { en: "TO STUDY", es: "ESTUDIAR" }, { en: "TO RUN", es: "CORRER" }, 
    { en: "TO WRITE", es: "ESCRIBIR" }, { en: "TO SLEEP", es: "DORMIR" }, { en: "TO READ", es: "LEER" }, 
    { en: "TO DO/MAKE", es: "HACER" }, { en: "TO SAY/TELL", es: "DECIR" }, { en: "TO GO", es: "IR" }, 
    { en: "TO SEE", es: "VER" }, { en: "TO HEAR", es: "OIR" }, { en: "TO COME", es: "VENIR" }, 
    { en: "TO ASK FOR", es: "PEDIR" }, { en: "TO THINK", es: "PENSAR" }, { en: "TO PLAY", es: "JUGAR" }, 
    { en: "TO COOK", es: "COCINAR" }, { en: "TO SING", es: "CANTAR" }, { en: "TO DANCE", es: "BAILAR" }, 
    { en: "TO DRINK", es: "BEBER" }, { en: "TO LEARN", es: "APRENDER" }, { en: "TO OPEN", es: "ABRIR" }, 
    { en: "TO CLOSE", es: "CERRAR" }, { en: "TO BRING", es: "TRAER" }, { en: "TO FEEL", es: "SENTIR" }, 
    { en: "TO SERVE", es: "SERVIR" }, { en: "TO FOLLOW", es: "SEGUIR" }, { en: "TO BUILD", es: "CONSTRUIR" }, 
    { en: "TO DRIVE", es: "CONDUCIR" }, { en: "TO TRANSLATE", es: "TRADUCIR" }, { en: "TO LAUGH", es: "REIR" }, 
    { en: "TO SMILE", es: "SONREIR" }, { en: "TO TRAVEL", es: "VIAJAR" }, { en: "TO CLEAN", es: "LIMPIAR" }, 
    { en: "TO PAINT", es: "PINTAR" }, { en: "TO WALK", es: "CAMINAR" }, { en: "TO WAIT", es: "ESPERAR" }, 
    { en: "TO WATCH", es: "MIRAR" }
];

const VOCAB_GERUNDIOS = [
    { v: "HABLAR", gerund: "hablando" }, { v: "COMER", gerund: "comiendo" }, { v: "VIVIR", gerund: "viviendo" }, 
    { v: "LEER", gerund: "leyendo" }, { v: "DORMIR", gerund: "durmiendo" }, { v: "PEDIR", gerund: "pidiendo" }, 
    { v: "TRABAJAR", gerund: "trabajando" }, { v: "APRENDER", gerund: "aprendiendo" }, { v: "ESCRIBIR", gerund: "escribiendo" }, 
    { v: "OIR", gerund: "oyendo" }, { v: "REIR", gerund: "riendo" }, { v: "SEGUIR", gerund: "siguiendo" }, 
    { v: "TRAER", gerund: "trayendo" }, { v: "CONSTRUIR", gerund: "construyendo" }, { v: "JUGAR", gerund: "jugando" },
];

const VOCAB_AYUDA_GENERAL = [
    { en: "NOW", es: "AHORA" }, { en: "RIGHT NOW", es: "AHORA MISMO" }, { en: "TODAY", es: "HOY" },
    { en: "FAST", es: "RÁPIDO" }, { en: "WELL", es: "BIEN" }, { en: "HAPPY", es: "FELIZ" }
];

const VOCAB_AYUDA_LECTURA = [
    { en: "CITY", es: "CIUDAD" }, { en: "GUITAR", es: "GUITARRA" }, { en: "STREET", es: "CALLE" },
    { en: "FLOWERS", es: "FLORES" }, { en: "ALWAYS", es: "SIEMPRE" }
];

const VOCAB_AYUDA_TRADUCCION_TEXTO = [
    { en: "RIGHT NOW", es: "AHORA MISMO" }, { en: "SITTING", es: "SENTADO" },
    { en: "COFFEE", es: "CAFÉ" }, { en: "FRIEND", es: "AMIGO/A" },
    { en: "PLANS", es: "PLANES" }, { en: "OUTSIDE", es: "AFUERA" },
    { en: "MUSICIAN", es: "MÚSICO" }, { en: "BEAUTIFUL DAY", es: "DÍA HERMOSO" },
];

// --- PROMPTS ---

const ex1Prompts = [
    { en: "I am talking.", es: ["estoy hablando", "yo estoy hablando"] }, 
    { en: "You are studying.", es: ["estás estudiando", "tú estás estudiando"] }, 
    { en: "He is working.", es: ["está trabajando", "él está trabajando"] },
    { en: "We are walking.", es: ["estamos caminando", "nosotros estamos caminando"] },
    { en: "They are waiting.", es: ["están esperando", "ellos están esperando"] },
    { en: "We are singing.", es: ["estamos cantando", "nosotros estamos cantando"] }, 
    { en: "They are dancing.", es: ["están bailando", "ellos están bailando"] }, 
    { en: "She is cooking.", es: ["está cocinando", "ella está cocinando"] }, 
    { en: "I am painting.", es: ["estoy pintando", "yo estoy pintando"] }, 
    { en: "You are cleaning.", es: ["estás limpiando", "tú estás limpiando"] }, 
    { en: "We are walking in the park.", es: ["estamos caminando en el parque", "nosotros estamos caminando en el parque"] }, 
    { en: "They are traveling to Spain.", es: ["están viajando a españa", "ellos están viajando a españa"] },
    { en: "You (formal) are waiting for the bus.", es: ["usted está esperando el autobús", "está esperando el autobús"] },
    { en: "She is buying new shoes.", es: ["ella está comprando zapatos nuevos", "está comprando zapatos nuevos"] },
    { en: "We are listening to music.", es: ["nosotros estamos escuchando música", "estamos escuchando música"] },
    { en: "You all are preparing dinner.", es: ["ustedes están preparando la cena", "están preparando la cena"] },
    { en: "They are helping at home.", es: ["ellos están ayudando en casa", "están ayudando en casa"] },
    { en: "I am looking for my keys.", es: ["yo estoy buscando mis llaves", "estoy buscando mis llaves"] },
    { en: "You are paying the bill.", es: ["tú estás pagando la cuenta", "estás pagando la cuenta"] },
    { en: "He is using the computer.", es: ["él está usando la computadora", "está usando la computadora"] },
    { en: "We are visiting the museum.", es: ["nosotros estamos visitando el museo", "estamos visitando el museo"] },
    { en: "They (fem.) are swimming.", es: ["ellas están nadando", "están nadando"] }
];

const ex2Prompts = [
    { en: "I am eating an apple.", es: ["estoy comiendo una manzana", "yo estoy comiendo una manzana"] },
    { en: "You are learning Spanish.", es: ["estás aprendiendo español", "tú estás aprendiendo español"] },
    { en: "She is drinking water.", es: ["está bebiendo agua", "ella está bebiendo agua"] },
    { en: "We are building a house.", es: ["estamos construyendo una casa", "nosotros estamos construyendo una casa"] },
    { en: "They are bringing the food.", es: ["están trayendo la comida", "ellos están trayendo la comida"] },
    { en: "He is living in a big house.", es: ["está viviendo en una casa grande", "él está viviendo en una casa grande"] },
    { en: "We are drinking water.", es: ["estamos bebiendo agua", "nosotros estamos bebiendo agua"] },
    { en: "They are writing a book.", es: ["están escribiendo un libro", "ellos están escribiendo un libro"] },
    { en: "She is running fast.", es: ["está corriendo rápido", "ella está corriendo rápido"] },
    { en: "I am opening the window.", es: ["estoy abriendo la ventana", "yo estoy abriendo la ventana"] },
    { en: "You are understanding the class.", es: ["estás comprendiendo la clase", "tú estás comprendiendo la clase"] },
    { en: "We are selling the car.", es: ["estamos vendiendo el coche", "nosotros estamos vendiendo el coche"] },
    { en: "They are suffering a lot.", es: ["están sufriendo mucho", "ellos están sufriendo mucho"] },
    { en: "He is learning to drive.", es: ["él está aprendiendo a conducir", "está aprendiendo a conducir"] },
    { en: "We are choosing a movie.", es: ["nosotros estamos escogiendo una película", "estamos escogiendo una película"] },
    { en: "You are receiving good news.", es: ["tú estás recibiendo buenas noticias", "estás recibiendo buenas noticias"] },
    { en: "I am breaking the old routine.", es: ["yo estoy rompiendo la vieja rutina", "estoy rompiendo la vieja rutina"] },
    { en: "They are believing in the project.", es: ["ellos están creyendo en el proyecto", "están creyendo en el proyecto"] },
    { en: "She is hiding behind the door.", es: ["ella se está escondiendo detrás de la puerta", "se está escondiendo detrás de la puerta"] },
    { en: "We are covering the furniture.", es: ["nosotros estamos cubriendo los muebles", "estamos cubriendo los muebles"] },
    { en: "You all are discussing the topic.", es: ["ustedes están discutiendo el tema", "están discutiendo el tema"] },
    { en: "I am sharing my food.", es: ["yo estoy compartiendo mi comida", "estoy compartiendo mi comida"] },
    { en: "He is promising to change.", es: ["él está prometiendo cambiar", "está prometiendo cambiar"] }
];

const ex3Prompts = [
    { en: "I am reading a book.", es: ["estoy leyendo un libro", "yo estoy leyendo un libro"] },
    { en: "You are sleeping.", es: ["estás durmiendo", "tú estás durmiendo"] },
    { en: "He is hearing the music.", es: ["está oyendo la música", "él está oyendo la música"] },
    { en: "We are saying the truth.", es: ["estamos diciendo la verdad", "nosotros estamos diciendo la verdad"] },
    { en: "They are coming to the party.", es: ["están viniendo a la fiesta", "ellos están viniendo a la fiesta"] },
    { en: "He is asking for help.", es: ["está pidiendo ayuda", "él está pidiendo ayuda"] },
    { en: "We are saying the truth.", es: ["estamos diciendo la verdad", "nosotros estamos diciendo la verdad"] },
    { en: "They are following me.", es: ["me están siguiendo", "están siguiéndome"] },
    { en: "She is serving the dinner.", es: ["está sirviendo la cena", "ella está sirviendo la cena"] },
    { en: "I am feeling sick.", es: ["me estoy sintiendo mal", "estoy sintiéndome mal"] },
    { en: "You are laughing.", es: ["te estás riendo", "estás riéndote"] },
    { en: "They are building a house.", es: ["están construyendo una casa", "ellos están construyendo una casa"] },
    { en: "He is bringing the drinks.", es: ["está trayendo las bebidas", "él está trayendo las bebidas"] },
    { en: "I am going to the market.", es: ["yo estoy yendo al mercado", "estoy yendo al mercado"] },
    { en: "You are hearing that noise.", es: ["tú estás oyendo ese ruido", "estás oyendo ese ruido"] },
    { en: "He is falling from the tree.", es: ["él se está cayendo del arbol", "se está cayendo del arbol"] },
    { en: "We are bringing the food.", es: ["nosotros estamos trayendo la comida", "estamos trayendo la comida"] },
    { en: "They are laughing at the joke.", es: ["ellos se están riendo del chiste", "se están riendo del chiste"] },
    { en: "She is smiling at me.", es: ["ella me está sonriendo", "me está sonriendo"] },
    { en: "I am following your instructions.", es: ["yo estoy siguiendo tus instrucciones", "estoy siguiendo tus instrucciones"] },
    { en: "You are serving the food.", es: ["tú estás sirviendo la comida", "estás sirviendo la comida"] },
    { en: "He is repeating the sentence.", es: ["él está repitiendo la frase", "está repitiendo la frase"] },
    { en: "We are getting dressed for the party.", es: ["nosotros nos estamos vistiendo para la fiesta", "nos estamos vistiendo para la fiesta"] }
];

const negativePrompts = [
    { en: "I am not working.", es: ["no estoy trabajando", "yo no estoy trabajando"] },
    { en: "You are not eating.", es: ["no estás comiendo", "tú no estás comiendo"] },
    { en: "He is not studying.", es: ["no está estudiando", "él no está estudiando"] },
    { en: "We are not talking.", es: ["no estamos hablando", "nosotros no estamos hablando"] },
    { en: "They are not running.", es: ["no están corriendo", "ellos no están corriendo"] },
    { en: "He is not sleeping.", es: ["no está durmiendo", "él no está durmiendo"] },
    { en: "We are not studying.", es: ["no estamos estudiando", "nosotros no estamos estudiando"] },
    { en: "They are not playing.", es: ["no están jugando", "ellos no están jugando"] },
    { en: "She is not cooking.", es: ["no está cocinando", "ella no está cocinando"] },
    { en: "I am not reading.", es: ["no estoy leyendo", "yo no estoy leyendo"] },
    { en: "You are not running.", es: ["no estás corriendo", "tú no estás corriendo"] },
    { en: "He is not writing.", es: ["no está escribiendo", "él no está escribiendo"] },
    { en: "We are not singing.", es: ["no estamos cantando", "nosotros no estamos cantando"] },
    { en: "They are not dancing.", es: ["no están bailando", "ellos no están bailando"] },
    { en: "I am not drinking coffee.", es: ["no estoy bebiendo café", "yo no estoy bebiendo café"] },
    { en: "You are not living here.", es: ["no estás viviendo aquí", "tú no estás viviendo aquí"] },
    { en: "She is not opening the door.", es: ["no está abriendo la puerta", "ella no está abriendo la puerta"] },
    { en: "We are not following the news.", es: ["no estamos siguiendo las noticias", "nosotros no estamos siguiendo las noticias"] },
    { en: "They are not laughing.", es: ["no se están riendo", "no están riéndose"] },
    { en: "I am not feeling well.", es: ["no me estoy sintiendo bien", "no estoy sintiéndome bien"] },
    { en: "He is not bringing anything.", es: ["no está trayendo nada", "él no está trayendo nada"] },
    { en: "You are not asking correctly.", es: ["no estás pidiendo correctamente", "tú no estás pidiendo correctamente"] },
    { en: "They are not building the house.", es: ["no están construyendo la casa", "ellos no están construyendo la casa"] }
];

const readingData = {
    title: "Mi Ciudad Activa",
    content: "En mi ciudad, la gente siempre está haciendo algo. Ahora mismo, yo estoy sentado en un café. Un músico está tocando la guitarra en la calle. Muchas personas están caminando y hablando. Unos niños están corriendo en el parque. Una mujer está vendiendo flores. Los carros están avanzando lentamente. Me gusta mi ciudad porque siempre está cambiando y moviéndose.",
    questions: [
        { id: "q1", q: "¿Dónde estoy sentado?", a: ["en un café"] },
        { id: "q2", q: "¿Qué está haciendo el músico?", a: ["tocando la guitarra"] },
        { id: "q3", q: "¿Qué están haciendo los niños?", a: ["corriendo en el parque"] },
        { id: "q4", q: "¿Qué está vendiendo la mujer?", a: ["flores"] },
        { id: "q5", q: "¿Por qué me gusta mi ciudad?", a: ["porque siempre está cambiando y moviéndose"] }
    ]
};

const completarPrompts = [
    { s: "1. Yo _______ (hablar) por teléfono.", a: "estoy hablando" }, 
    { s: "2. Tú _______ (comer) una pizza.", a: "estás comiendo" }, 
    { s: "3. Él _______ (vivir) en Londres.", a: "está viviendo" }, 
    { s: "4. Nosotros _______ (estudiar) mucho.", a: "estamos estudiando" }, 
    { s: "5. Ellos _______ (correr) en el parque.", a: "están corriendo" }, 
    { s: "6. Ella _______ (cantar) muy bien.", a: "está cantando" }, 
    { s: "7. Yo _______ (leer) el periódico.", a: "estoy leyendo" }, 
    { s: "8. Tú _______ (dormir) profundamente.", a: "estás durmiendo" }, 
    { s: "9. Él _______ (escribir) un correo.", a: "está escribiendo" }, 
    { s: "10. Nosotros _______ (aprender) español.", a: "estamos aprendiendo" },
    { s: "11. Ellos _______ (jugar) al fútbol.", a: "están jugando" }, 
    { s: "12. Ella _______ (hacer) la cena.", a: "está haciendo" }, 
    { s: "13. Yo _______ (ver) la televisión.", a: "estoy viendo" }, 
    { s: "14. Tú _______ (pedir) un favor.", a: "estás pidiendo" }, 
    { s: "15. Nosotros _______ (viajar) a México.", a: "estamos viajando" },
];

// --- COMPONENTES AUXILIARES ---

const VocabularyButton = ({ items }: { items: { en: string; es: string }[] }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(v => !v)} className="font-bold border-brand-purple/50 bg-background/50 backdrop-blur-sm dark:text-white shrink-0">
                <BookOpen className="mr-2 h-4 w-4" /> Vocabulario
                <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", open && "rotate-180")} />
            </Button>
            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border bg-card/95 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
                    <ScrollArea className="h-64 pr-4">
                        <div className="grid grid-cols-1 gap-2">
                            {items.map((item, i) => (
                                <div key={`${item.en}-${i}`} className="flex justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm border border-border/50 text-foreground">
                                    <span className="font-bold text-left dark:text-white uppercase">{item.en}</span>
                                    <span className="text-primary font-medium text-right uppercase">{item.es}</span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};

const BlockValidationExercise = ({ title, prompts, vocabulary, onComplete, isAdmin, isSupervisionMode }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleCheck = () => {
        const newStatus: any = {};
        let allOk = true;
        prompts.forEach((p: any, i: number) => {
            const user = (answers[i] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
            const corrects = p.es.map((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' '));
            const isOk = corrects.includes(user);
            newStatus[i] = isOk ? 'correct' : 'incorrect';
            if (!isOk) allOk = false;
        });
        setValidationStatus(newStatus);
        if (allOk) toast({ title: "¡Excelente!", description: "Todo está correcto." });
        else toast({ variant: 'destructive', title: "Hay errores", description: "Revisa las marcas." });
    };

    const isAllCorrect = Object.values(validationStatus).length === prompts.length && Object.values(validationStatus).every(v => v === 'correct');

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex-1 text-left">
                    <CardTitle className="text-primary uppercase tracking-tighter dark:text-primary">{title}</CardTitle>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                        {prompts.map((_: any, i: number) => (
                            <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStatus[i] === 'correct' ? "bg-green-500 text-white border-green-500" : validationStatus[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</div>
                        ))}
                    </div>
                </div>
                <VocabularyButton items={vocabulary} />
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 pt-6 text-center">
                <div className="bg-muted p-6 rounded-2xl border-2 border-dashed text-center font-bold text-2xl uppercase tracking-tighter text-foreground dark:text-white min-h-[8rem] flex items-center justify-center w-full shadow-inner">
                    {prompts[currentIndex]?.en}
                </div>
                <Input 
                    value={answers[currentIndex] || ''} 
                    onChange={e => {
                        setAnswers({ ...answers, [currentIndex]: e.target.value });
                        setValidationStatus({ ...validationStatus, [currentIndex]: 'unchecked' });
                    }} 
                    className={cn(
                        "h-12 text-lg text-foreground dark:text-white text-center max-w-md border-2 shadow-sm",
                        validationStatus[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : 
                        validationStatus[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : 'border-input'
                    )} 
                    placeholder="Escribe en español..." 
                    autoComplete="off"
                    readOnly={isSupervisionMode}
                />
            </CardContent>
            <CardFooter className="justify-between border-t pt-6 bg-muted/10">
                <Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="dark:text-white">Anterior</Button>
                <div className="flex gap-2">
                    {currentIndex === prompts.length - 1 && !isAllCorrect && !isSupervisionMode && <Button onClick={handleCheck} variant="secondary">Verificar</Button>}
                    {currentIndex < prompts.length - 1 ? (
                        <Button onClick={() => setCurrentIndex(i => i + 1)} className="dark:text-white">Siguiente</Button>
                    ) : (
                        <Button onClick={onComplete} disabled={!isAllCorrect && !isAdmin} className="font-bold text-white bg-primary hover:bg-primary/90">Continuar</Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

function PresenteContinuoContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const hasInitialized = useRef(false);

    // States for content
    const [vocabAns, setVocabAns] = useState<string[]>(Array(VOCAB_INFINITIVOS.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(VOCAB_INFINITIVOS.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    
    const [gerundIdx, setGerundIdx] = useState(0);
    const [gerundAnswer, setGerundAnswer] = useState('');
    const [gerundValidation, setGerundValidation] = useState('unchecked');

    const [finalExAns, setFinalExAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [finalExVal, setFinalExVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));

    const [readingAns, setReadingAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readingVal, setReadingVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));

    const [translationText, setTranslationText] = useState('');
    const [missionCompleted, setMissionCompleted] = useState(false);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'gerund_formation', name: '3. Formación de Gerundio', icon: Pencil, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'completar', name: '9. Completar', icon: Trophy, status: 'locked' },
        { key: 'negativos', name: '10. Negativos', icon: CheckCircle, status: 'locked' },
        { key: 'translate_text', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;
        let path = initialLearningPath.map(topic => ({ ...topic }));
        const savedData = studentProfile.lessonProgress?.[progressStorageVersion] || {};
        path.forEach(item => { if (savedData[item.key]) (item as any).status = savedData[item.key]; });
        if (isAdmin && !targetStudentId) path.forEach(t => (t as any).status = 'completed');
        
        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') (path[i] as any).status = 'active';
            lastDone = path[i].status === 'completed';
        }
        setLearningPath(path as Topic[]);
        setSelectedTopic(savedData.lastSelectedTopic || path.find(p => (p as any).status === 'active')?.key || path[0].key);
        if (savedData.missionCompleted) setMissionCompleted(true);
        if (savedData.vocabAns) setVocabAns(savedData.vocabAns);
        if (savedData.translationText) setTranslationText(savedData.translationText);

        setInitialLoadComplete(true);
        hasInitialized.current = true;
        setTimeout(() => setIsInitialLoading(false), 200);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);

    const progressValue = useMemo(() => {
        if (missionCompleted) return 100;
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / (learningPath.length || 1)) * 100);
    }, [learningPath, missionCompleted]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId || !hasInitialized.current) return;
        
        const saveTimer = setTimeout(() => {
            const s: Record<string, any> = { 
                lastSelectedTopic: selectedTopic, 
                missionCompleted,
                vocabAns,
                translationText
            };
            learningPath.forEach(item => { s[item.key] = item.status; });
            
            const currentSaved = studentProfile?.lessonProgress?.[progressStorageVersion];
            if (JSON.stringify(s) !== JSON.stringify(currentSaved)) {
                updateDocumentNonBlocking(studentDocRef, { 
                    [`lessonProgress.${progressStorageVersion}`]: s, 
                    [`progress.${mainProgressKey}`]: progressValue 
                });
            }
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, isAdmin, progressValue, studentDocRef, selectedTopic, isInitialLoading, targetStudentId, missionCompleted, vocabAns, translationText, initialLoadComplete, studentProfile]);

    const handleTopicCompleteInternal = (completedKey: string) => setTopicToComplete(completedKey);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            let next: string | null = null;
            const newPath = currentPath.map(t => ({ ...t }));
            const idx = newPath.findIndex(t => t.key === topicToComplete);
            if (idx !== -1 && newPath[idx].status !== 'completed') {
                newPath[idx].status = 'completed';
                if (idx + 1 < newPath.length && newPath[idx + 1].status === 'locked') {
                    (newPath[idx + 1] as any).status = 'active'; next = newPath[idx + 1].key;
                }
            }
            if (next) { const n = next; setTimeout(() => { toast({ title: "¡Siguiente misión desbloqueada!" }); setSelectedTopic(n); }, 0); }
            return newPath as Topic[];
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: "destructive", title: "Contenido Bloqueado" }); return; }
        setSelectedTopic(topicKey);
        if (topicKey === 'grammar' && learningPath.find(t => t.key === 'grammar')?.status !== 'completed') handleTopicCompleteInternal(topicKey);
    };

    const handleFinalMission = () => {
        setMissionCompleted(true);
        handleTopicCompleteInternal('translate_text');
        toast({ title: "¡Felicitaciones!", description: "Has terminado la clase.", className: "bg-green-600 text-white" });
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

        if (missionCompleted) {
            return (
                <Card className="shadow-soft border-2 border-green-500 bg-green-500/10 p-12 text-center flex flex-col items-center animate-in zoom-in duration-500 min-h-[500px] justify-center text-foreground">
                    <Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" />
                    <h2 className="text-5xl font-black uppercase text-green-600 tracking-tighter dark:text-white">¡EXCELENTE!</h2>
                    <p className="text-3xl mt-6 font-bold dark:text-white">Felicitaciones - Tu completaste esta clase</p>
                    <p className="text-muted-foreground mt-4 text-xl italic font-medium">Progreso guardado al 100%.</p>
                    <Button asChild className="mt-12 px-16 h-14 text-lg font-black uppercase shadow-xl" variant="default">
                        <Link href="/espanol/a1">Regresar a la ruta A1</Link>
                    </Button>
                </Card>
            );
        }

        switch (selectedTopic) {
            case 'vocabulary': return (
                <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                    <CardHeader className='bg-primary/5 border-b flex flex-row items-center justify-between'>
                        <div className="flex-1 text-left">
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Verbos</CardTitle>
                            <CardDescription className='font-bold dark:text-white'>Escribe el infinitivo en español.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 text-left"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">{VOCAB_INFINITIVOS.map((v, i) => (<Fragment key={i}><div className="flex items-center font-bold py-1 text-sm dark:text-white uppercase">{v.en}</div><Input value={vocabAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase dark:text-white", vocabVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : vocabVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" readOnly={!!targetStudentId} /></Fragment>))}</div></ScrollArea></CardContent>
                    <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={() => { let okCount = 0; const nv = VOCAB_INFINITIVOS.map((item, idx) => { const isCorrect = item.es.toLowerCase() === (vocabAns[idx] || '').trim().toLowerCase(); if (isCorrect) okCount++; return isCorrect ? 'correct' : 'incorrect'; }); setVocabVal(nv); if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); } else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." }); }} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter>
                </Card>
            );
            case 'grammar': return (
                <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-6 text-foreground text-left overflow-hidden">
                    <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">Gramática: Presente Continuo</CardTitle></CardHeader>
                    <CardContent className="space-y-8 px-0 text-left text-foreground dark:text-white"><div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm"><h3 className="text-xl font-black text-primary uppercase mb-4">La Fórmula: ESTAR + Gerundio</h3><p className="mb-4 text-muted-foreground font-bold dark:text-white/80">ESTAR conjugado + el gerundio.</p><p className='font-bold text-center text-2xl p-4 bg-primary/10 rounded-lg text-primary tracking-wider'>Yo <span className="text-blue-500">estoy</span> <span className="text-red-500">hablando</span></p></div><div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm"><h3 className="text-xl font-black text-primary uppercase mb-4">Gerundios Regulares</h3><ul className="list-disc pl-5 space-y-2 text-lg"><li>-AR (Hablar) &rarr; <span className="font-bold">hablando</span></li><li>-ER (Comer) &rarr; <span className="font-bold">comiendo</span></li><li>-IR (Vivir) &rarr; <span className="font-bold">viviendo</span></li></ul></div></CardContent>
                    <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Comprendido</Button></CardFooter>
                </Card>
            );
            case 'gerund_formation': const curGerundVerb = VOCAB_GERUNDIOS[gerundIdx]; return (
                <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                    <CardHeader className='bg-primary/5 border-b flex flex-row items-center justify-between'>
                        <div className="flex-1 text-left dark:text-white">
                            <CardTitle className='text-primary uppercase tracking-tighter'>Misión: Formar el Gerundio</CardTitle>
                            <CardDescription className='dark:text-white/80'>Escribe el gerundio del verbo ({gerundIdx + 1}/{VOCAB_GERUNDIOS.length})</CardDescription>
                        </div>
                        <VocabularyButton items={VOCAB_INFINITIVOS.slice(0, 10)} />
                    </CardHeader>
                    <CardContent className="space-y-8 pt-8 flex flex-col items-center"><div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20"><h3 className="text-5xl md:text-6xl font-black text-primary uppercase tracking-tighter">{curGerundVerb.v}</h3></div><Input value={gerundAnswer} onChange={e => { if (targetStudentId) return; setGerundAnswer(e.target.value); setGerundValidation('unchecked'); }} onKeyDown={e => e.key === 'Enter' && (gerundAnswer.trim().toLowerCase() === curGerundVerb.gerund ? (toast({ title: "¡Correcto!" }), gerundIdx < VOCAB_GERUNDIOS.length - 1 ? setTimeout(() => { setGerundIdx(prev => prev + 1); setGerundAnswer(''); setGerundValidation('unchecked'); }, 800) : handleTopicCompleteInternal('gerund_formation')) : (setGerundValidation('incorrect'), toast({ variant: 'destructive', title: "Incorrecto" })))} className={cn("h-14 text-2xl font-bold text-center max-w-sm border-2 dark:text-white", gerundValidation === 'correct' ? 'border-green-500 bg-green-50/5' : gerundValidation === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Escribe el gerundio..." autoComplete="off" readOnly={!!targetStudentId} /></CardContent>
                    <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={() => gerundAnswer.trim().toLowerCase() === curGerundVerb.gerund ? (toast({ title: "¡Correcto!" }), gerundIdx < VOCAB_GERUNDIOS.length - 1 ? setTimeout(() => { setGerundIdx(prev => prev + 1); setGerundAnswer(''); setGerundValidation('unchecked'); }, 800) : handleTopicCompleteInternal('gerund_formation')) : (setGerundValidation('incorrect'), toast({ variant: 'destructive', title: "Incorrecto" }))} size="lg" className="px-20 font-black h-14 text-xl shadow-xl" disabled={!!targetStudentId}>Verificar <ArrowRight className="ml-2 h-5 w-5" /></Button></CardFooter>
                </Card>
            );
            case 'ex1': return <BlockValidationExercise key="ex1" title="Ejercicio 1: Verbos -AR" prompts={ex1Prompts} vocabulary={[...VOCAB_INFINITIVOS.slice(0, 5), ...VOCAB_AYUDA_GENERAL]} onComplete={() => handleTopicCompleteInternal('ex1')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'ex2': return <BlockValidationExercise key="ex2" title="Ejercicio 2: Verbos -ER/-IR" prompts={ex2Prompts} vocabulary={[...VOCAB_INFINITIVOS.slice(5, 10), ...VOCAB_AYUDA_GENERAL]} onComplete={() => handleTopicCompleteInternal('ex2')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'vocab_game': return <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground"><CardHeader className="flex flex-row items-center justify-between"><div className="flex-1 text-left"><CardTitle className="dark:text-primary uppercase tracking-tight">Juego de Memoria</CardTitle><CardDescription className='dark:text-white/80 font-bold'>Encuentra las parejas de verbos</CardDescription></div></CardHeader><CardContent><VocabularyMatchingGame data={VOCAB_INFINITIVOS.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Encuentra las parejas de verbos" /></CardContent></Card>;
            case 'ex3': return <BlockValidationExercise key="ex3" title="Ejercicio 3: Gerundios Irregulares" prompts={ex3Prompts} vocabulary={[...VOCAB_INFINITIVOS.slice(10, 15), ...VOCAB_AYUDA_GENERAL]} onComplete={() => handleTopicCompleteInternal('ex3')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'reading': return (
                <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                    <CardHeader className='bg-primary/5 border-b flex flex-row items-center justify-between'>
                        <div className="flex-1 text-left dark:text-white">
                            <CardTitle className='text-primary uppercase tracking-tight'>Lectura: {readingData.title}</CardTitle>
                            <CardDescription className='dark:text-white/80 font-bold'>Lee el texto y responde las preguntas</CardDescription>
                        </div>
                        <VocabularyButton items={VOCAB_AYUDA_LECTURA} />
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 text-foreground dark:text-white text-left">
                        <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                        <Separator />
                        <div className="space-y-4">
                            {readingData.questions.map((q, i) => (<div key={i} className="space-y-2 p-3 bg-muted/20 rounded-xl border text-left">
                                <Label className="font-bold dark:text-white uppercase text-xs tracking-widest">{q.q}</Label>
                                <Input value={readingAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...readingAns]; na[i] = e.target.value; setReadingAns(na); const nv = [...readingVal]; nv[i] = 'unchecked'; setReadingVal(nv as any); }} className={cn("h-10 dark:text-white", readingVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : readingVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" readOnly={!!targetStudentId} />
                            </div>))}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between border-t p-6 bg-muted/10">
                        <Button onClick={() => { let allOk = true; const nv = readingData.questions.map((q, i) => { const isOk = q.a.some(ans => (readingAns[i] || '').trim().toLowerCase().includes(ans.toLowerCase())); if (!isOk) allOk = false; return isOk ? 'correct' : 'incorrect'; }); setReadingVal(nv as any); if (allOk) toast({ title: "¡Excelente!" }); else toast({ variant: 'destructive', title: "Revisa las respuestas" }); }} variant="secondary" disabled={!!targetStudentId}>Verificar</Button>
                        <Button onClick={() => handleTopicCompleteInternal('reading')} disabled={!readingVal.every(v => v === 'correct') && !isAdmin} className='text-white font-bold'>Continuar <ArrowRight className='ml-2 h-4 w-4'/></Button>
                    </CardFooter>
                </Card>
            );
            case 'completar': return (
                <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left overflow-hidden">
                    <CardHeader className='bg-primary/5 border-b flex flex-row items-center justify-between'>
                        <div className="flex-1 text-left dark:text-white">
                            <CardTitle className='text-primary uppercase tracking-tight'>Misión: Completar Frases</CardTitle>
                            <CardDescription className='dark:text-white/80 font-bold'>Conjuga el verbo entre paréntesis</CardDescription>
                        </div>
                        <VocabularyButton items={VOCAB_INFINITIVOS.slice(0, 10)} />
                    </CardHeader>
                    <CardContent className="p-0 text-left"><ScrollArea className="h-[450px] p-6 text-foreground dark:text-white"><div className="space-y-4">{completarPrompts.map((q, i) => (
                        <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm"><p className="font-bold text-lg">{q.s}</p><Input value={finalExAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...finalExAns]; na[i] = e.target.value; setFinalExAns(na); const nv = [...finalExVal]; nv[i] = 'unchecked'; setFinalExVal(nv as any); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase", finalExVal[i] === 'correct' ? 'border-green-500 bg-green-50/5' : finalExVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Respuesta..." autoComplete="off" readOnly={!!targetStudentId} /></div>
                    ))}</div></ScrollArea></CardContent>
                    <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={() => { let okCount = 0; const nv = completarPrompts.map((q, i) => { const isOk = q.a.toLowerCase() === (finalExAns[i] || '').trim().toLowerCase(); if (isOk) okCount++; return isOk ? 'correct' : 'incorrect'; }); setFinalExVal(nv as any); if (okCount === completarPrompts.length) { toast({ title: "¡Perfecto!" }); handleTopicCompleteInternal('completar'); } else toast({ variant: 'destructive', title: "Hay errores en la lista." }); }} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase" disabled={!!targetStudentId}>Verificar Todo</Button></CardFooter>
                </Card>
            );
            case 'negativos': return <BlockValidationExercise key="negativos" title="Misión: Negativos" prompts={negativePrompts} vocabulary={[...VOCAB_INFINITIVOS.slice(0, 5), ...VOCAB_AYUDA_GENERAL]} onComplete={() => handleTopicCompleteInternal('negativos')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} />;
            case 'translate_text': return (
                <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-primary/5">
                        <div className="flex-1 text-left dark:text-white">
                            <CardTitle className='text-primary uppercase tracking-tighter'>Traducción de Texto Final</CardTitle>
                            <CardDescription className='font-bold dark:text-white/80'>Traduce el párrafo al español.</CardDescription>
                        </div>
                        <VocabularyButton items={VOCAB_AYUDA_TRADUCCION_TEXTO} />
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 text-foreground dark:text-white text-left">
                        <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm">"Right now, I am sitting in a café. I am drinking a coffee and my friend is reading a book. We are talking about our plans. Outside, many people are walking. A musician is playing the guitar. It is a beautiful day and we are feeling very happy."</div>
                        <Separator />
                        <div className="space-y-2 text-left">
                            <Label className='font-black text-primary uppercase text-sm tracking-widest'>Tu Traducción:</Label>
                            <Textarea value={translationText} onChange={(e) => { if (!targetStudentId) setTranslationText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed shadow-inner dark:text-white" readOnly={!!targetStudentId} />
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center border-t pt-6 bg-muted/20">
                        <Button onClick={handleFinalMission} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter" disabled={!!targetStudentId}>
                            MISION FINAL <ArrowRight className='ml-3 h-8 w-8' />
                        </Button>
                    </CardFooter>
                </Card>
            );
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
                            <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
                                <Star className="h-6 w-6 fill-current animate-pulse" />
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervisión: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10"><Link href="/admin">Cerrar</Link></Button>
                        </div>
                    )}
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Curso A1</Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3"><Activity className='h-10 w-10 text-primary' /> Presente Continuo 🇪🇸</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div>
                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30 text-left"><CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Ruta de Misión</CardTitle></CardHeader>
                                <CardContent className="p-4 text-left">
                                    <nav><ul className="space-y-1">
                                        {learningPath.map((item) => {
                                            const isLocked = item.status === 'locked' && !isAdmin;
                                            const Icon = item.icon;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}>
                                                    <div className="flex items-center gap-3">
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />}
                                                        <span className="truncate max-w-[150px] uppercase font-bold text-[10px] dark:text-white">{item.name}</span>
                                                    </div>
                                                    {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground"><span>Progreso Total</span><span className="text-primary">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PresenteContinuoPage() {
    return (<Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}><PresenteContinuoContent /></Suspense>);
}