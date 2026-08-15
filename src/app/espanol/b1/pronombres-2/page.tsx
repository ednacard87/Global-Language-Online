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
    Activity,
    Check,
    X,
    Info,
    Repeat,
    Smartphone,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { Textarea } from '@/components/ui/textarea';

// --- CONFIGURACIÓN DE INGENIERÍA ---
const progressStorageVersion = 'progress_es_b1_pron_2_v26_object_fix';
const mainProgressKey = 'progress_b1_es_pronombres_2';

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const techVocab = [
    { en: "CELLPHONE", es: "celular" }, { en: "COMPUTER", es: "computadora" }, { en: "FILE", es: "archivo" },
    { en: "MESSAGE", es: "mensaje" }, { en: "PHOTOGRAPH", es: "fotografía" }, { en: "EMAIL", es: "correo" },
    { en: "DOCUMENT", es: "documento" }, { en: "PASSWORD", es: "contraseña" }, { en: "APPLICATION", es: "aplicación" },
    { en: "KEYBOARD", es: "teclado" }, { en: "SCREEN", es: "pantalla" }, { en: "MOUSE", es: "ratón" },
    { en: "FOLDER", es: "carpeta" }, { en: "LINK", es: "enlace" }, { en: "NETWORK", es: "red" },
    { en: "HARDWARE", es: "hardware" }, { en: "SOFTWARE", es: "software" }, { en: "STORAGE", es: "almacenamiento" },
    { en: "BACKUP", es: "copia de seguridad" }, { en: "LAPTOP", es: "portátil" }
];

const imperfectoVerbs = [
    { en: "TALK", es: "hablar", conj: ["hablaba", "hablabas", "hablaba", "hablabamos", "hablaban"] },
    { en: "EAT", es: "comer", conj: ["comia", "comias", "comia", "comiamos", "comian"] },
    { en: "LIVE", es: "vivir", conj: ["vivia", "vivias", "vivia", "viviamos", "vivian"] },
    { en: "WRITE", es: "escribir", conj: ["escribia", "escribias", "escribia", "escribiamos", "escribian"] },
    { en: "READ", es: "leer", conj: ["leia", "leias", "leia", "leiamos", "leian"] },
    { en: "SEE", es: "ver", conj: ["veia", "veias", "veia", "veiamos", "veian"] },
    { en: "GO", es: "ir", conj: ["iba", "ibas", "iba", "ibamos", "iban"] },
    { en: "BE", es: "ser", conj: ["era", "eras", "era", "eramos", "eran"] },
    { en: "DO/MAKE", es: "hacer", conj: ["hacia", "hacias", "hacia", "haciamos", "hacian"] },
    { en: "WORK", es: "trabajar", conj: ["trabajaba", "trabajabas", "trabajaba", "trabajabamos", "trabajaban"] },
    { en: "STUDY", es: "estudiar", conj: ["estudiaba", "estudiabas", "estudiaba", "estudiabamos", "estudiaban"] },
    { en: "BUY", es: "comprar", conj: ["compraba", "comprabas", "compraba", "comprabamos", "compraban"] },
    { en: "CALL", es: "llamar", conj: ["llamaba", "llamabas", "llamaba", "llamabamos", "llamaban"] },
    { en: "SEND", es: "enviar", conj: ["enviaba", "enviabas", "enviaba", "enviabamos", "enviaban"] },
    { en: "THINK", es: "pensar", conj: ["pensaba", "pensabas", "pensaba", "pensabamos", "pensaban"] },
    { en: "PLAY", es: "jugar", conj: ["jugaba", "jugabas", "jugaba", "jugabamos", "jugaban"] },
    { en: "RUN", es: "corría", conj: ["corria", "corrias", "corria", "corriamos", "corrian"] },
    { en: "OPEN", es: "abrir", conj: ["abria", "abrias", "abria", "abriamos", "abrian"] },
    { en: "CLOSE", es: "cerrar", conj: ["cerraba", "cerrabas", "cerraba", "cerrabamos", "cerraban"] },
    { en: "UNDERSTAND", es: "comprender", conj: ["comprendia", "comprendias", "comprendia", "comprendiamos", "comprendian"] }
];

const ex1Prompts = [
    { en: "I see it (the cellphone).", answer: ["lo veo", "yo lo veo"] },
    { en: "She buys it (the computer).", answer: ["la compra", "ella la compra" , "ella lo compra"] },
    { en: "We open them (the files).", answer: ["los abrimos", "nosotros los abrimos"] },
    { en: "They want it (the password).", answer: ["la quieren", "ellos la quieren"] },
    { en: "I don't find it (the link).", answer: ["no lo encuentro", "yo no lo encuentro"] },
    { en: "You read them (the emails).", answer: ["los lees", "tu los lees"] },
    { en: "He sends it (the document).", answer: ["lo envia", "el lo envia"] },
    { en: "We use them (the applications).", answer: ["las usamos", "nosotros las usamos"] },
    { en: "I have it (the laptop).", answer: ["la tengo", "yo la tengo"] },
    { en: "She looks for them (the photographs).", answer: ["las busca", "ella las busca"] },
    { en: "They delete it (the message).", answer: ["lo borran", "ellos lo borran"] },
    { en: "Do you need it? (the software)", answer: ["lo necesitas?", "¿tu lo necesitas?"] },
];

const ex2Prompts = [
    { en: "I write to him.", answer: ["le escribo", "yo le escribo"] },
    { en: "She tells me a secret.", answer: ["me dice un secreto", "ella me dice un secreto"] },
    { en: "We give them a present.", answer: ["les damos un regalo", "nosotros les damos un regalo"] },
    { en: "They ask us for help.", answer: ["nos piden ayuda", "ellos nos piden ayuda"] },
    { en: "I buy you a coffee.", answer: ["te compro un café", "yo te compro un café"] },
    { en: "He shows her the office.", answer: ["le muestra la oficina", "el le muestra la oficina"] },
    { en: "She sends him an email.", answer: ["le envía un correo", "ella le envía un correo"] },
    { en: "They speak to us.", answer: ["nos hablan", "ellos nos hablan"] },
    { en: "I promise you the truth.", answer: ["te prometo la verdad", "yo te prometo la verdad"] },
    { en: "We offer them a deal.", answer: ["les ofrecemos un trato", "nosotros les ofrecemos un trato"] },
    { en: "He brings me the book.", answer: ["me trae el libro", "el me trae el libro"] },
    { en: "Do you like it? (to you)", answer: ["te gusta?", "¿tu te gusta?"] },
];

const ex3Prompts = [
    { en: "I buy the gift. -> I buy it.", answer: ["lo compro", "yo lo compro"] },
    { en: "She calls the friends. -> She calls them.", answer: ["los llama", "ella los llama"] },
    { en: "We read the book. -> We read it.", answer: ["lo leemos", "nosotros lo leemos"] },
    { en: "They see the girl. -> They see her.", answer: ["la ven", "ellos la ven"] },
    { en: "I send the letter. -> I send it.", answer: ["la envío", "yo la envio"] },
    { en: "You open the windows. -> You open them.", answer: ["las abres", "tu las abres"] },
    { en: "He knows the secret. -> He knows it.", answer: ["lo sabe", "el lo sabe"] },
    { en: "We help the neighbors. -> We help them.", answer: ["los ayudamos", "nosotros los ayudamos"] },
    { en: "She eats the pizza. -> She eats it.", answer: ["la come", "ella la come"] },
    { en: "They clean the rooms. -> They clean them.", answer: ["los limpian", "ellos los limpian"] },
    { en: "I write to my father. -> I write to him.", answer: ["le escribo", "yo le escribo"] },
    { en: "She gives water to the dog. -> She gives it water.", answer: ["le da agua", "ella le da agua"] },
    { en: "We tell the truth to you. -> We tell it to you.", answer: ["te la decimos", "te decimos la verdad"] },
    { en: "They bring food to us. -> They bring us food.", answer: ["nos traen comida", "ellos nos traen comida"] },
    { en: "I show the photo to her. -> I show it to her.", answer: ["yo se la muestro", "yo le muestro la foto"] },
];

const readingData = {
    title: 'La Oficina Digital',
    content: "En mi oficina usamos mucha tecnología. Yo tengo una computadora nueva y la uso para trabajar. Mi jefe me envía correos todos los días y yo le respondo rápidamente. A veces, mis compañeros me piden archivos y yo se los comparto por la red. Tenemos una base de datos grande. Los técnicos la cuidan mucho porque tiene información importante. Cuando terminamos un proyecto, lo celebramos juntos.",
    questions: [
        { q: "¿Para qué usa el narrador la computadora?", a: ["para trabajar", "trabajar"] },
        { q: "¿Quién le envía correos al narrador?", a: ["su jefe", "el jefe"] },
        { q: "¿Qué hace el narrador con los archivos?", a: ["los comparte", "se los comparte", "los comparte por la red"] },
        { q: "¿Quiénes cuidan la base de datos?", a: ["los técnicos", "técnicos"] },
        { q: "¿Qué celebran juntos?", a: ["un proyecto", "el fin de un proyecto"] }
    ]
};

const ex4Options = [
    { text: "Yo siempre _______ (ver) en el cine.", options: ["LO VEO", "LE VEO", "LA VEO"], answer: "LO VEO" },
    { text: "Ella _______ (escribir) una carta ayer.", options: ["LE ESCRIBIO", "LO ESCRIBIO", "LA ESCRIBIO"], answer: "LE ESCRIBIO" },
    { text: "Nosotros _______ (comprar) el libro.", options: ["LO COMPRAMOS", "LE COMPRAMOS", "LA COMPRAMOS"], answer: "LO COMPRAMOS" },
    { text: "Tú _______ (dar) un regalo a Juan.", options: ["LE DISTE", "LO DISTE", "LA DISTE"], answer: "LE DISTE" },
    { text: "Ellos _______ (buscar) a nosotros.", options: ["NOS BUSCAN", "LOS BUSCAN", "LES BUSCAN"], answer: "NOS BUSCAN" },
    { text: "Yo _______ (traer) el café a ti.", options: ["TE LO TRAJE", "TE TRAJE", "LO TRAJE"], answer: "TE TRAJE" },
    { text: "El perro _______ (ver) a ella.", options: ["LA VIO", "LO VIO", "LE VIO"], answer: "LA VIO" },
    { text: "Ella _______ (vender) su casa.", options: ["LA VENDIÓ", "LO VENDIÓ", "LE VENDIÓ"], answer: "LA VENDIÓ" },
    { text: "Nosotros _______ (pedir) la cuenta.", options: ["LA PEDIMOS", "LE PEDIMOS", "LO PEDIMOS"], answer: "LA PEDIMOS" },
    { text: "Ellos _______ (mostrar) las fotos.", options: ["LAS MOSTRARON", "LOS MOSTRARON", "LES MOSTRARON"], answer: "LOS MOSTRARON" },
    { text: "Tú _______ (prestar) dinero a mí.", options: ["ME PRESTASTE", "LO PRESTASTE", "LE PRESTASTE"], answer: "ME PRESTASTE" },
    { text: "Yo _______ (encontrar) mi llave.", options: ["LA ENCONTRÉ", "LO ENCONTRÉ", "LE ENCONTRÉ"], answer: "LA ENCONTRÉ" },
    { text: "Él _______ (conocer) a tus padres.", options: ["LOS CONOCIÓ", "LAS CONOCIÓ", "LES CONOCIÓ"], answer: "LOS CONOCIÓ" },
    { text: "Nosotros _______ (elegir) este hotel.", options: ["LO ELEGIMOS", "LA ELEGIMOS", "LE ELEGIMOS"], answer: "LO ELEGIMOS" },
    { text: "Ustedes _______ (prometer) el viaje.", options: ["LO PROMETIERON", "LA PROMETIERON", "LE PROMETIERON"], answer: "LO PROMETIERON" },
    { text: "Yo _______ (enviar) el paquete.", options: ["LO ENVIÉ", "LE ENVIÉ", "LA ENVIÉ"], answer: "LO ENVIÉ" },
    { text: "Ella _______ (ahorrar) el dinero.", options: ["LO AHORRÓ", "LA AHORRÓ", "LE AHORRÓ"], answer: "LO AHORRÓ" },
    { text: "Tú _______ (pagar) la cuenta.", options: ["LO PAGASTE", "LA PAGASTE", "LE PAGASTE"], answer: "LA PAGASTE" },
    { text: "Nosotros _______ (ofrecer) ayuda.", options: ["LA OFRECIMOS", "LE OFRECIMOS", "LO OFRECIMOS"], answer: "LA OFRECIMOS" },
    { text: "Ellos _______ (mirar) la televisión.", options: ["LA MIRARON", "LO MIRARON", "LE MIRARON"], answer: "LA MIRARON" },
];

const completionPrompts = [
    { s: "1. Yo (vender) _______ mi carro hace un momento.", a: "yo lo vendi" },
    { s: "2. Tú (enviar) _______ un regalo a ella el sábado.", a: "tu le enviaste" },
    { s: "3. Ella (buscar) _______ sus llaves por 5 minutos.", a: "ella las busco" },
    { s: "4. Nosotros (comprar) _______ las entradas.", a: "nosotros las compramos" },
    { s: "5. Ellos (traer) _______ el café para mí.", a: "ellos me trajeron" },
    { s: "6. Él (mostrar) _______ las fotos a nosotros.", a: "el nos mostro" },
    { s: "7. Yo (pedir) _______ un favor a ti ayer.", a: "yo te pedi" },
    { s: "8. Tú (devolver) _______ el libro antier.", a: "tu lo devolviste" },
    { s: "9. Ella (invitar) _______ a mis amigos hace un mes.", a: "ella los invito" },
    { s: "10. Nosotros (ayudar) _______ a los niños.", a: "nosotros los ayudamos" },
    { s: "11. Yo (conocer) _______ a tu hermana el año pasado.", a: "yo la conoci" },
    { s: "12. Ellos (pagar) _______ la deuda anoche.", a: "ellos la pagaron" },
    { s: "13. Tú (encontrar) _______ tu perro en la otra casa.", a: "tu lo encontraste" },
    { s: "14. Ella (envolver) _______ el regalo para la fiesta.", a: "ella lo envolvio" },
    { s: "15. Nosotros (traer) _______ la comida para ellos.", a: "nosotros la trajimos" },
    { s: "16. Él (dar) _______ un consejo a mí hace una semana.", a: "el me dio" },
    { s: "17. Yo (ver) _______ a ustedes hace 2 dias.", a: "yo los vi" },
    { s: "18. Tú (escuchar) _______ la canción antes del estreno.", a: "tu la escuchaste" },
    { s: "19. Ella (escribir) _______ una carta a mí hace 2 años.", a: "ella me escribio" },
    { s: "20. Nosotros (limpiar) _______ la casa ayer.", a: "nosotros la limpiamos" },
    { s: "21. Ellos (vender) _______ su casa la semana pasada.", a: "ellos la vendieron" },
    { s: "22. Yo (comprar) _______ flores esta mañana.", a: "yo las compre" },
    { s: "23. Tú (enviar) _______ el mensaje temprano.", a: "tu lo enviaste" },
    { s: "24. Ella (buscar) _______ a su novio en la universidad.", a: "ella lo busco" },
    { s: "25. Nosotros (ahorrar) _______ el dinero.", a: "nosotros lo ahorramos" },
    { s: "26. Él (gastar) _______ sus ahorros en ropa.", a: "el los gasto" },
    { s: "27. Yo (pedir) _______ permiso hace un mes.", a: "yo lo pedi" },
    { s: "28. Tú (devolver) _______ la maleta en el aeropuerto.", a: "tu la devolviste" },
    { s: "29. Ellos (encontrar) _______ el camino un perrito.", a: "ellos lo encontraron" },
    { s: "30. Ella (mostrar) _______ su vestido antes de su matrimonio.", a: "ella lo mostro" },
];

const translationTextEng = "I have a new computer and I use it every day. My boss sends me files and I save them in a folder. I also write to him when I have questions. My friend needs a password and I provide it to her. We work on the document and then we deliver it to the client. I love my job because technology makes it easier.";

const finalCorrectionPrompts = [
    { en: "Yo le veo (a ella)", answer: ["yo la veo", "la veo"] },
    { en: "Ella lo dio un beso (a él)", answer: ["ella le dio un beso", "le dio un beso"] },
    { en: "Nosotros los escribimos (a ellos)", answer: ["nosotros les escribimos", "les escribimos"] },
    { en: "Tú la dijiste la verdad (a María)", answer: ["tu le dijiste la verdad", "le dijiste la verdad"] },
    { en: "Ellos nos lo trajeron (el café)", answer: ["ellos nos trajeron el cafe", "ellos nos trajeron el café"] },
    { en: "Yo lo quiero comprar (la casa)", answer: ["yo quiero comprarla", "la quiero comprar"] },
    { en: "ÉL LA ESTA MIRANDO (A EL)", answer: ["el lo esta mirando", "lo esta mirando"] },
    { en: "Ustedes les compraron (el carro)", answer: ["ustedes lo compraron", "lo compraron"] },
    { en: "Ella le envió el archivo (a nosotros)", answer: ["ella nos envio el archivo", "nos envió el archivo"] },
    { en: "Yo los conozco (a él)", answer: ["yo lo conozco", "lo conozco"] },
    { en: "Nosotros le amamos (a ella)", answer: ["nosotros la amamos", "la amamos"] },
    { en: "Tú lo prestaste el libro (a mí)", answer: ["tu me prestaste el libro", "me prestaste el libro"] },
    { en: "Ellos las mostraron las fotos (a nosotros)", answer: ["ellos nos mostraron las fotos", "nos mostraron las fotos"] },
    { en: "Ella las encontró (su maleta)", answer: ["ella la encontro"] },
    { en: "Yo les prometo el premio (a ti)", answer: ["yo te prometo el premio", "te prometo el premio"] },
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => {
        setCurrentIndex(0);
        setUserAnswers({});
        setStatus({});
    }, [prompts]);

    useEffect(() => {
        if (!isSupervisionMode && !userAnswers[currentIndex]) {
            // Optional: reset answer for current step if needed, 
            // but we want to keep typed answers during navigation
        }
    }, [currentIndex, isSupervisionMode]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const currentAnswer = userAnswers[currentIndex] || '';
        const userVal = currentAnswer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex]?.answer || [];
        
        const isCorrect = (corrects || []).some((a: string) => 
            a && a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal
        );
        
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
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase al español usando pronombres O.D/O.I.</CardDescription>
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
                    placeholder="Escribe la corrección/traducción..." 
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

function Pronombres2ContentInternal() {
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
    const [vocabAns, setVocabAns] = useState<string[]>(Array(techVocab.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(techVocab.length).fill('unchecked'));
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
        { key: 'vocabulary', name: '1. Vocabulario', icon: Smartphone, status: 'active' },
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
        const nv = techVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAns[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (okCount === techVocab.length) {
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
        const v = imperfectoVerbs[conjIdx];
        const corrects = v.conj;
        const nv = conjAnswers.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjValidation(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < imperfectoVerbs.length - 1) {
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
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b text-foreground'>
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Tecnología y Objetos (20)</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Traduce las palabras al español.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-[450px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div>
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                                    {techVocab.map((v, i) => (
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
                            <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMÁTICA: PRONOMBRES O.D / O.I</CardTitle></CardHeader>
                            <CardContent className="space-y-8 px-0 font-bold">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                    <h3 className="text-xl font-black text-primary uppercase">1. Objeto Directo (Lo, La, Los, Las)</h3>
                                    <p>Sustituyen a la cosa o persona que recibe la acción directamente (¿Qué?).</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Yo veo el celular &rarr; <span className="text-primary font-black">Lo</span> veo.</li>
                                        <li>Yo veo a Juan &rarr; <span className="text-primary font-black">Lo</span> veo.</li>
                                        <li>Yo compro las flores &rarr; <span className="text-primary font-black">Las</span> compro.</li>
                                        <li>Yo compro la computadora &rarr; <span className="text-primary font-black">La</span> compro.</li>
                                    </ul>
                                    <p className="font-black text-primary bg-background p-2 rounded inline-block mt-2">VERBOS O.D = Ver - conocer - visitar - ayudar - escuchar -  invitar - llamar - amar</p>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                    <h3 className="text-xl font-black text-brand-purple uppercase">2. Objeto Indirecto (Le, Les)</h3>
                                    <p>Indican a quién va dirigida la acción (¿A quién?).</p>
                                    <ul className="list-disc pl-6 space-y-1">
                                        <li>Yo Escribo a mi jefe &rarr; <span className="text-brand-purple font-black">Le</span> escribo.</li>
                                        <li>Yo Envío mensajes a ellos &rarr; <span className="text-brand-purple font-black">Les</span> envío mensajes.</li>
                                        <li>Yo compro un carro a mi hermana &rarr; <span className="text-brand-purple font-black">Le</span> compro un carro.</li>
                                    </ul>
                                    <p className="font-black text-primary bg-background p-2 rounded inline-block mt-2">VERBOS O.I = Escribir - enviar - dar - decir - preguntar - contar - explicar - prometer - gustar - responder - comprar</p>
                                </div>
                                <div className="p-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-[2rem] border-2 border-dashed border-yellow-500/50 text-foreground">
                                    <h3 className="text-xl font-black text-yellow-800 dark:text-yellow-200 uppercase mb-4 flex items-center gap-2"><Info /> Posición del Pronombre</h3>
                                    <p className="mb-2">1. Antes del verbo conjugado: "Lo conozco".</p>
                                    <p className="mb-2">2. Después y pegado al infinitivo/gerundio: "Quiero comprar<span className="underline">lo</span>" / "Estoy utilizándo<span className="underline">lo</span>".</p>
                                    <p className="font-black text-primary bg-background p-2 rounded inline-block mt-2">Doble pronombre: "Se lo envié" (Le + Lo = Se lo)</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );

            case 'conjugation':
                const v = imperfectoVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center text-foreground">
                                <CardTitle className='text-primary uppercase tracking-tighter'>Misión: Imperfecto ({conjIdx + 1}/20)</CardTitle>
                                <span className='font-bold text-muted-foreground'>{v.en}</span>
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

            case 'exercise_1': return <BallsExercise title="Ejercicio 1: Pronombre O.D" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={{"files": "archivos", "password": "contraseña", "link": "enlace", "software": "software", "photographs": "fotografías"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <BallsExercise title="Ejercicio 2: Pronombre O.I" prompts={ex2Prompts} onComplete={() => handleTopicCompleteInternal('exercise_2')} vocabulary={{"secret": "secreto", "deal": "trato", "promise": "prometer", "bring": "traer"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={techVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Tecnología Memory" />;
            case 'exercise_3': return <BallsExercise title="Ejercicio 3: Sustitución" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('exercise_3')} vocabulary={{"gift": "regalo", "window": "ventana", "neighbors": "vecinos"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
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
            case 'exercise_4': return <ChoiceExercise title="Ejercicio 4: Elige la opción" prompts={ex4Options} onComplete={() => handleTopicCompleteInternal('exercise_4')} isSupervisionMode={!!targetStudentId} />;
            case 'complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: Frases con Pronombres (30)</CardTitle></CardHeader>
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
                                <div><CardTitle className='text-primary uppercase'>Traducción de Texto: The Digital Office</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0 text-foreground"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-foreground">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {Object.entries({ "boss": "jefe", "files": "archivos", "save": "guardar", "folder": "carpeta", "provide": "proveer", "client": "cliente", "easier": "más fácil" }).map(([en, es], i) => (<Fragment key={i}><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></Fragment>))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-foreground">"{translationTextEng}"</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[200px] text-lg leading-relaxed text-foreground" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicCompleteInternal('translate')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final':
                return (
                    <div className="space-y-6">
                        <div className="text-left mb-4 text-white">
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Misión Final: Corregir Errores</h2>
                            <p className="font-bold text-lg text-white">Corrige las frases gramaticalmente incorrectas.</p>
                        </div>
                        <BallsExercise title="Final Challenge: Correction" prompts={finalCorrectionPrompts} onComplete={() => handleTopicCompleteInternal('final')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />
                    </div>
                );
            default:
                return <div className="text-center p-8 text-white">Selecciona una misión para comenzar.</div>;
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
                           <Repeat className='h-10 w-10 text-primary' /> Pronombres 2 🇪🇸
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

export default function Pronombres2Page() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <Pronombres2ContentInternal />
        </Suspense>
    );
}