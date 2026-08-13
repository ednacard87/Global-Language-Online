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
    ListChecks,
    Zap,
    ShoppingCart,
    Repeat
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
const progressStorageVersion = 'progress_es_a2_pron_1_v13_fixed_vocab';
const mainProgressKey = 'progress_a2_es_pronombres_1';

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const shoppingVocab = [
    { en: "TO GIVE (A GIFT)", es: "REGALAR" }, { en: "TO LEND", es: "PRESTAR" }, { en: "TO SELL", es: "VENDER" },
    { en: "TO BUY", es: "COMPRAR" }, { en: "TO SEND", es: "ENVIAR" }, { en: "TO WRAP", es: "ENVOLVER" },
    { en: "TO CHOOSE", es: "ELEGIR" }, { en: "TO PAY", es: "PAGAR" }, { en: "TO SHOW", es: "MOSTRAR" },
    { en: "TO BRING", es: "TRAER" }, { en: "TO ASK FOR", es: "PEDIR" }, { en: "TO RECEIVE", es: "RECIBIR" },
    { en: "TO LOOK FOR", es: "BUSCAR" }, { en: "TO FIND", es: "ENCONTRAR" }, { en: "TO SAVE (MONEY)", es: "AHORRAR" },
    { en: "TO SPEND", es: "GASTAR" }, { en: "TO COST", es: "COSTAR" }, { en: "TO RETURN (OBJECT)", es: "DEVOLVER" },
    { en: "TO OFFER", es: "OFRECER" }, { en: "TO PROMISE", es: "PROMETER" }, { en: "TO DELIVER", es: "ENTREGAR" },
    { en: "TO COMMISSION / ORDER", es: "ENCARGAR" }
];

const conjVerbs = [
    { v: "COMPRAR", imp: ["compraba", "comprabas", "compraba", "comprábamos", "compraban"], pre: ["compré", "compraste", "compró", "compramos", "compraron"] },
    { v: "VENDER", imp: ["vendía", "vendías", "vendía", "vendíamos", "vendían"], pre: ["vendí", "vendiste", "vendió", "vendimos", "vendieron"] },
    { v: "ENVIAR", imp: ["enviaba", "enviabas", "enviaba", "enviábamos", "enviaban"], pre: ["envié", "enviaste", "envió", "enviamos", "enviaron"] },
    { v: "DAR", imp: ["daba", "dabas", "daba", "dábamos", "daban"], pre: ["di", "diste", "dio", "dimos", "dieron"] },
    { v: "DECIR", imp: ["decía", "decías", "decía", "decíamos", "decían"], pre: ["dije", "dijiste", "dijo", "dijimos", "dijeron"] },
    { v: "TRAER", imp: ["traía", "traías", "traía", "traíamos", "traían"], pre: ["traje", "trajiste", "trajo", "trajimos", "trajeron"] },
    { v: "HACER", imp: ["hacía", "hacías", "hacía", "hacíamos", "hacían"], pre: ["hice", "hiciste", "hizo", "hicimos", "hicieron"] },
    { v: "RECIBIR", imp: ["recibía", "recibías", "recibía", "recibíamos", "recibían"], pre: ["recibí", "recibiste", "recibió", "recibimos", "recibieron"] },
    { v: "PEDIR", imp: ["pedía", "pedías", "pedía", "pedíamos", "pedían"], pre: ["pedí", "pediste", "pidió", "pedimos", "pidieron"] },
    { v: "PAGAR", imp: ["pagaba", "pagabas", "pagaba", "pagábamos", "pagaban"], pre: ["pagué", "pagaste", "pagó", "pagamos", "pagaron"] },
    { v: "BUSCAR", imp: ["bocaba", "buscabas", "buscaba", "buscábamos", "buscaban"], pre: ["busqué", "buscaste", "buscó", "buscamos", "buscaron"] },
    { v: "ENTREGAR", imp: ["entregaba", "entregabas", "entregaba", "entregábamos", "entregaban"], pre: ["entregué", "entregaste", "entregó", "entregamos", "entregaron"] },
    { v: "AHORRAR", imp: ["ahorraba", "ahorrabas", "ahorraba", "ahorrábamos", "ahorraban"], pre: ["ahorré", "ahorraste", "ahorro", "ahorramos", "ahorraron"] },
    { v: "GASTAR", imp: ["gastaba", "gastabas", "gastaba", "gastábamos", "gastaban"], pre: ["gasté", "gastaste", "gastó", "gastamos", "gastaron"] },
    { v: "MOSTRAR", imp: ["mostraba", "mostrabas", "mostraba", "mostrábamos", "mostraban"], pre: ["mostré", "mostraste", "mostró", "mostramos", "mostraron"] },
    { v: "ELEGIR", imp: ["elegía", "elegías", "elegía", "elegíamos", "elegían"], pre: ["elegí", "elegiste", "eligió", "elegimos", "elegieron"] },
    { v: "OFRECER", imp: ["ofrecía", "ofrecías", "ofrecía", "ofrecíamos", "ofrecían"], pre: ["ofrecí", "ofreciste", "ofreció", "ofrecimos", "ofreció"] },
    { v: "PROMETER", imp: ["prometía", "prometías", "prometía", "prometíamos", "prometían"], pre: ["prometí", "prometiste", "prometió", "prometimos", "prometieron"] },
    { v: "ENCARGAR", imp: ["encargaba", "encargabas", "encargaba", "encargábamos", "encargaban"], pre: ["encargué", "entregaste", "encargó", "encargamos", "encargaron"] },
    { v: "DEVOLVER", imp: ["devolvía", "devolvías", "devolvía", "devolvíamos", "devolvían"], pre: ["devolví", "devolviste", "devolvió", "devolvimos", "devolvieron"] },
];

const ex1Prompts = [
    { en: "I buy it (the gift).", es: ["lo compro", "yo lo compro"] },
    { en: "You wrap them (the gifts).", es: ["tu los envuelves", "tú los envuelves"] },
    { en: "She sells it (the house).", es: ["la vende", "ella la vende"] },
    { en: "We send it (the letter).", es: ["la enviamos", "nosotros la enviamos"] },
    { en: "They show them (the photos).", es: ["las muestran", "ellos las muestran"] },
    { en: "I pay it (the bill).", es: ["la pago", "yo la pago"] },
    { en: "You choose them (the shoes).", es: ["tu los eliges", "tú los eliges"] },
    { en: "He asks for it (the favor).", es: ["lo pide", "él lo pide"] },
    { en: "We find it (the key).", es: ["la encontramos", "nosotros la encontramos"] },
    { en: "They save it (the money).", es: ["lo ahorran", "ellos lo ahorran"] },
    { en: "I return it (the book).", es: ["lo devuelvo", "yo lo devuelvo"] },
    { en: "She delivers it (the pizza).", es: ["ella la entrega"] },
];

const ex2Prompts = [
    { en: "I give him a gift.", es: ["le doy un regalo", "yo le doy un regalo"] },
    { en: "You lend her your car.", es: ["tu le prestas tu carro", "tú le prestas tu carro"] },
    { en: "She sends us an email.", es: ["ella nos envia un correo", "ella nos envía un correo"] },
    { en: "We tell them the truth.", es: ["nosotros les decimos la verdad"] },
    { en: "They bring me a coffee.", es: ["ellos me traen un cafe", "ellos me traen un café"] },
    { en: "I offer you a deal.", es: ["te ofrezco un trato", "yo te ofrezco un trato"] },
    { en: "You show him the store.", es: ["tu le muestras la tienda", "tú le muestras la tienda"] },
    { en: "He delivers us the package.", es: ["el nos entrega el paquete", "él nos entrega el paquete"] },
    { en: "We promise her a prize.", es: ["le prometemos un premio", "nosotros le prometemos un premio"] },
    { en: "They ask me for money.", es: ["me piden dinero", "ellos me piden dinero"] },
    { en: "I wrap you the gift.", es: ["te envuelvo el regalo", "yo te envuelvo el regalo"] },
    { en: "She returns them the keys.", es: ["les devuelve las llaves", "ella les devuelve las llaves"] },
];

const ex3Prompts = [
    { en: "I am going to buy it.", es: ["voy a comprarlo", "lo voy a comprar"] },
    { en: "She wants to see me.", es: ["ella quiere verme", "ella me quiere ver"] },
    { en: "We need to wrap them.", es: ["nosotros necesitamos envolverlos", "los necesitamos envolver"] },
    { en: "They have to pay us.", es: ["ellos tienen que pagarnos", "ellos nos tienen que pagar"] },
    { en: "I am showing him the map.", es: ["yo estoy mostrandole el mapa", "yo le estoy mostrando el mapa"] },
    { en: "You are sending her a message.", es: ["tu estas enviandole un mensaje", "tú estás enviándole un mensaje"] },
    { en: "He can find it.", es: ["el puede encontrarlo", "el lo puede encontrar"] },
    { en: "We should help them.", es: ["nosotros debemos ayudarlos", "nosotros los debemos ayudar"] },
    { en: "They are choosing it.", es: ["ellos estan eligiendolo", "ellos lo estan eligiendo"] },
    { en: "I want to offer you a discount.", es: ["yo quiero ofrecerte un descuento", "yo te quiero ofrecer un descuento"] },
    { en: "She is bringing me the bill.", es: ["ella esta trayendome la cuenta", "ella me esta trayendo la cuenta"] },
    { en: "We are selling it now.", es: ["nosotros estamos vendiendolo ahora", "nosotroslo estamos vendiendo ahora"] },
    { en: "They can hear us.", es: ["ellos pueden oirnos", "ellos nos pueden oír"] },
    { en: "I am looking for them.", es: ["yo estoy buscandolos", "yo los estoy buscando"] },
    { en: "You must deliver it.", es: ["tu debes entregarlo", "tu lo debes entregar"] },
];

const readingData = {
    title: "El Regalo de Cumpleaños",
    content: "Ayer fue el cumpleaños de mi madre. Mi hermano y yo decidimos comprarle un regalo especial. Fuimos al centro comercial y lo encontramos rápidamente: un collar de plata hermoso. Yo lo pagué con mi tarjeta y la vendedora lo envolvió con un papel de seda muy elegante. Cuando llegamos a casa, se lo entregamos a mi madre en la cena. Ella lo abrió con mucha emoción y nos dio un abrazo muy fuerte. ¡Le encantó!",
    questions: [
        { q: "¿A quién le compraron un regalo?", a: ["a su madre", "a mi madre", "a la madre"] },
        { q: "¿Qué compraron?", a: ["un collar de plata", "un collar"] },
        { q: "¿Quién pagó el regalo?", a: ["yo", "el narrador"] },
        { q: "¿Cuándo se lo entregaron?", a: ["en la cena"] },
        { q: "¿Cómo reaccionó la madre?", a: ["lo abrió con mucha emoción", "le encantó", "les dio un abrazo"] }
    ]
};

const ex4Options = [
    { text: "Yo _______ (comprar) el carro ayer.", options: ["LO COMPRÉ", "LA COMPRÉ", "LE COMPRÉ"], answer: "LO COMPRÉ" },
    { text: "A Juan _______ gusta la música clásica.", options: ["LO", "LA", "LE"], answer: "LE" },
    { text: "Nosotros _______ (enviar) las cartas.", options: ["LAS ENVIAMOS", "LOS ENVIAMOS", "LES ENVIAMOS"], answer: "LAS ENVIAMOS" },
    { text: "Ella _______ (dar) un beso a su hijo.", options: ["LO DIO", "LE DIO", "LA DIO"], answer: "LE DIO" },
    { text: "Ustedes _______ (buscar) las llaves.", options: ["LAS BUSCARON", "LOS BUSCARON", "LES BUSCARON"], answer: "LAS BUSCARON" },
    { text: "Yo _______ (traer) el café a ti.", options: ["LO TRAJE", "TE LO TRAJE", "TE TRAJE"], answer: "TE TRAJE" },
    { text: "El perro _______ (ver) a nosotros.", options: ["LO VIO", "NOS VIO", "LA VIO"], answer: "NOS VIO" },
    { text: "Ella _______ (vender) su casa.", options: ["LA VENDIÓ", "LO VENDIÓ", "LE VENDIÓ"], answer: "LA VENDIÓ" },
    { text: "Nosotros _______ (pedir) la cuenta al mesero.", options: ["LA PEDIMOS", "LE PEDIMOS", "LO PEDIMOS"], answer: "LE PEDIMOS" },
    { text: "Ellos _______ (mostrar) los cuadros.", options: ["LAS MOSTRARON", "LOS MOSTRARON", "LES MOSTRARON"], answer: "LOS MOSTRARON" },
    { text: "Tú _______ (prestar) dinero a ella.", options: ["LA PRESTASTE", "LE PRESTASTE", "LO PRESTASTE"], answer: "LE PRESTASTE" },
    { text: "Yo _______ (encontrar) mi cartera.", options: ["LA ENCONTRÉ", "LO ENCONTRÉ", "LE ENCONTRÉ"], answer: "LA ENCONTRÉ" },
    { text: "ÉL _______ (conocer) a mis padres.", options: ["LOS CONOCIÓ", "LAS CONOCIÓ", "LES CONOCIÓ"], answer: "LOS CONOCIÓ" },
    { text: "Nosotros _______ (elegir) este hotel.", options: ["LO ELEGIMOS", "LA ELEGIMOS", "LE ELEGIMOS"], answer: "LO ELEGIMOS" },
    { text: "Ustedes _______ (prometer) el viaje.", options: ["LO PROMETIERON", "LA PROMETIERON", "LE PROMETIERON"], answer: "LO PROMETIERON" },
    { text: "Yo _______ (enviar) el paquete a ellos.", options: ["LO ENVIÉ", "LES ENVIÉ", "LA ENVIÉ"], answer: "LES ENVIÉ" },
    { text: "Ella _______ (ahorrar) el dinero.", options: ["LA AHORRÓ", "LO AHORRÓ", "LE AHORRÓ"], answer: "LA AHORRÓ" },
    { text: "Tú _______ (pagar) la cuenta.", options: ["LO PAGASTE", "LA PAGASTE", "LE PAGASTE"], answer: "LA PAGASTE" },
    { text: "Nosotros _______ (ofrecer) ayuda.", options: ["LA OFRECIMOS", "LE OFRECIMOS", "LO OFRECIMOS"], answer: "LA OFRECIMOS" },
    { text: "Ellos _______ (mirar) la televisión.", options: ["LA MIRARON", "LO MIRARON", "LE MIRARON"], answer: "LA MIRARON" },
];

const completarPrompts = [
    { s: "1. Yo (vender) _______ mi carro ayer.", a: "lo vendi" },
    { s: "2. Tú (enviar) _______ un regalo a ella.", a: "le enviaste" },
    { s: "3. Ella (buscar) _______ sus llaves.", a: "las busco" },
    { s: "4. Nosotros (comprar) _______ las entradas.", a: "las compramos" },
    { s: "5. Ellos (traer) _______ el café para mí esta mañana.", a: "me trajeron" },
    { s: "6. Él (mostrar) _______ las fotos a nosotros antier.", a: "nos mostro" },
    { s: "7. Yo (pedir) _______ un favor a ti el viernes.", a: "te pedi" },
    { s: "8. Tú (devolver) _______ el libro a la biblioteca esta mañana.", a: "lo devolviste" },
    { s: "9. Ella (invitar) _______ a mis amigos a la fiesta.", a: "los invito" },
    { s: "10. Nosotros (ayudar) _______ a los ancianos.", a: "los ayudamos" },
    { s: "11. Yo (conocer) _______ a tu hermana el finde pasado.", a: "la conoci" },
    { s: "12. Ellos (pagar) _______ la deuda anoche.", a: "la pagaron" },
    { s: "13. Tú (encontrar) _______ tu perro ayer.", a: "lo encontraste" },
    { s: "14. Ella (envolver) _______ el regalo antier.", a: "lo envolvio" },
    { s: "15. Nosotros (traer) _______ la comida para ellos el domingo.", a: "les trajimos" },
    { s: "16. Él (dar) _______ un consejo a su amigo el mes pasado.", a: "le dio" },
    { s: "17. Yo (ver) _______ a ustedes en el cine el sabado en la noche.", a: "los vi" },
    { s: "18. Tú (escuchar) _______ la canción en el carro.", a: "la escuchaste" },
    { s: "19. Ella (escribir) _______ una carta a mí hace 2 meses.", a: "me escribio" },
    { s: "20. Nosotros (limpiar) _______ la cocina.", a: "la limpiamos" },
    { s: "21. Ellos (vender) _______ su apartamento hace 5 meses.", a: "lo vendieron" },
    { s: "22. Yo (comprar) _______ flores para ella.", a: "le compre" },
    { s: "23. Tú (enviar) _______ el mensaje.", a: "lo enviaste" },
    { s: "24. Ella (buscar) _______ a su novio en la fiesta del sabado.", a: "lo buscó" },
    { s: "25. Nosotros (ahorrar) _______ el sueldo.", a: "lo ahorramos" },
    { s: "26. Él (gastar) _______ sus ahorros en zapatos.", a: "los gasto" },
    { s: "27. Yo (pedir) _______ permiso a mis padres anoche.", a: "les pedí" },
    { s: "28. Tú (devolver) _______ la maleta en el aeropuerto.", a: "la devolviste" },
    { s: "29. Ellos (encontrar) _______ el camino tarde.", a: "lo encontraron" },
    { s: "30. Ella (mostrar) _______ su vestido a su amiga ayer.", a: "lo mostro" },
];

const finalNegativePrompts = [
    { en: "I don't buy it.", es: ["no lo compro", "yo no lo compro"] },
    { en: "She doesn't send it.", es: ["no la envía", "ella no la envía"] },
    { en: "We don't tell them.", es: ["no les decimos", "nosotros no les decimos"] },
    { en: "They don't hear us.", es: ["no nos oyen", "ellos no nos oyen"] },
    { en: "You don't sell them.", es: ["no los vendes", "tú no los vendes"] },
    { en: "He doesn't bring it.", es: ["no lo trae", "él no lo trae"] },
    { en: "I don't need you.", es: ["no te necesito", "yo no te necesito"] },
    { en: "She doesn't find them.", es: ["no los encuentra", "ella no los encuentra"] },
    { en: "We don't wrap it.", es: ["no lo envolvemos", "nosotros no lo envolvemos"] },
    { en: "They don't pay me.", es: ["no me pagan", "ellos no me pagan"] },
    { en: "I don't choose her.", es: ["no la elijo", "yo no la elijo"] },
    { en: "You don't help me.", es: ["no me ayudas", "tú no me ayudas"] },
    { en: "He doesn't offer it.", es: ["no lo ofrece", "él no lo ofrece"] },
    { en: "She doesn't know us.", es: ["no nos conoce", "ella no nos conoce"] },
    { en: "We don't save it.", es: ["no lo ahorramos", "nosotros no lo ahorramos"] },
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isAdmin, isSupervisionMode }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    // CRITICAL FIX: Reset answer when changing question index
    useEffect(() => {
        setAnswer('');
    }, [currentIndex]);

    useEffect(() => {
        setCurrentIndex(0);
        setAnswer('');
        setStatus({});
    }, [prompts]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const userVal = answer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex].es;
        const isCorrect = corrects.some((a: string) => a.toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
        
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

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground">
            <CardHeader>
                <div className="flex justify-between items-start text-left">
                    <div className="w-full">
                        <CardTitle className="uppercase font-black text-primary">{title}</CardTitle>
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase al español usando pronombres O.D/O.I.</CardDescription>
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
                                    <BookText className="mr-2 h-4 w-4" /> Vocabulario
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-48 pr-4 text-left text-foreground">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {Array.isArray(vocabulary) ? (
                                            vocabulary.map((v: any, i: number) => (
                                                <Fragment key={i}>
                                                    <span className="text-muted-foreground capitalize">{v.en}:</span>
                                                    <span className="font-semibold text-right text-primary">{(v.es || '').toUpperCase()}</span>
                                                </Fragment>
                                            ))
                                        ) : (
                                            Object.entries(vocabulary).map(([en, es]: any) => (
                                                <Fragment key={en}>
                                                    <span className="text-muted-foreground capitalize">{en}:</span>
                                                    <span className="font-semibold text-right text-primary">{(es || '').toUpperCase()}</span>
                                                </Fragment>
                                            ))
                                        )}
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
                <Input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheck()} className={cn("h-12 text-lg text-foreground", status[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/5' : status[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} placeholder="Escribe en español..." autoComplete="off" readOnly={isSupervisionMode} />
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
                <div className="text-2xl font-black text-center leading-relaxed">
                    {prompts[currentIndex].text.split('_______').map((part: string, i: number) => (
                        <Fragment key={i}>
                            {part}
                            {i < 1 && <span className={cn("border-b-4 border-dashed px-4 mx-2", status[currentIndex] === 'correct' ? "text-primary border-primary" : "text-muted-foreground")}>{status[currentIndex] === 'correct' ? prompts[currentIndex].answer : '...'}</span>}
                        </Fragment>
                    ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
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

function Pronombres1ContentInternal() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(shoppingVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(shoppingVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);
    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(10).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(10).fill('unchecked'));
    const [readAns, setReadAns] = useState<string[]>(Array(readingData.questions.length).fill(''));
    const [readVal, setReadVal] = useState<any[]>(Array(readingData.questions.length).fill('unchecked'));
    const [compAns, setCompAns] = useState<string[]>(Array(completarPrompts.length).fill(''));
    const [compVal, setCompVal] = useState<any[]>(Array(completarPrompts.length).fill('unchecked'));
    const [transText, setTransText] = useState('');

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialPathData = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: ShoppingCart, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'ex1', name: '4. Ejercicio 1 - O.D', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '5. Ejercicio 2 - O.I', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'ex4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
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
        if (d.vocabAnswers) setVocabAnswers(d.vocabAnswers);
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
            const s: any = { lastSelectedTopic: selectedTopic, vocabAnswers, transText };
            learningPath.forEach(item => { s[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: s, [`progress.${mainProgressKey}`]: progressValue });
        }, 1500);
        return () => clearTimeout(saveTimer);
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAnswers, transText]);

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

    const handleTopicCompleteInternal = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleVocabCheck = () => {
        let okCount = 0;
        const nv = shoppingVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv as any);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." });
    };

    const handleCheckConj = () => {
        const v = conjVerbs[conjIdx];
        const corrects = [...v.imp, ...v.pre];
        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjVerbs.length - 1) { setTimeout(() => { setConjIdx(p => p+1); setConjAns(Array(10).fill('')); setConjVal(Array(10).fill('unchecked')); }, 800); }
            else handleTopicCompleteInternal('conjugation');
        } else toast({ variant: 'destructive', title: "Revisa la conjugación" });
    };

    const handleCheckReading = () => {
        let ok = true; const nv = readingData.questions.map((q, i) => {
            const res = q.a.some(a => (readAns[i] || '').trim().toLowerCase().includes(a.toLowerCase()));
            if (!res) ok = false; return res ? 'correct' : 'incorrect';
        });
        setReadVal(nv); if (ok) handleTopicCompleteInternal('reading');
        else toast({ variant: 'destructive', title: "Revisa tus respuestas" });
    };

    const handleCheckCompletar = () => {
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
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Regalos y Compras (20)</CardTitle><CardDescription className='font-bold text-foreground'>Escribe el infinitivo en español para cada verbo.</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">English</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {shoppingVocab.map((v, i) => (
                                <Fragment key={i}><div className="flex items-center font-bold py-1 text-sm">{v.en}</div><Input value={vocabAnswers[i]} onChange={e => { const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabValidation[i] === 'correct' ? 'border-green-500' : vocabValidation[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" readOnly={isAdmin && !!targetStudentId} /></Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-left text-foreground overflow-hidden">
                        <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMAR: PRONOMBRES O.D / O.I</CardTitle></CardHeader>
                        <CardContent className="space-y-8 px-0 font-bold">
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-black dark:text-white">
                                <h3 className="text-xl font-black text-primary uppercase mb-2">1. Objeto Directo (O.D)</h3>
                                <p>Sustituyen al objeto que recibe directamente la acción (¿Qué?).</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-primary">
                                    <div className='p-2 border rounded bg-primary/10 text-center'>LO (Sing. Masc)</div>
                                    <div className='p-2 border rounded bg-primary/10 text-center'>LA (Sing. Fem)</div>
                                    <div className='p-2 border rounded bg-primary/10 text-center'>LOS (Plur. Masc)</div>
                                    <div className='p-2 border rounded bg-primary/10 text-center'>LAS (Plur. Fem)</div>
                                </div>
                            </div>
                            <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-black dark:text-white">
                                <h3 className="text-xl font-black text-brand-purple uppercase mb-2">2. Objeto Indirecto (O.I)</h3>
                                <p>Indican a quién o para quién se realiza la acción (¿A quién?).</p>
                                <div className="grid grid-cols-2 gap-2 text-primary">
                                    <div className='p-2 border rounded bg-brand-purple/10 text-center'>LE (A él/ella/usted)</div>
                                    <div className='p-2 border rounded bg-brand-purple/10 text-center'>LES (A ellos/ustedes)</div>
                                </div>
                            </div>
                            <div className="p-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-[2rem] border-2 border-dashed border-yellow-500/50 text-foreground text-black dark:text-white">
                                <h3 className="text-xl font-black text-yellow-800 dark:text-yellow-200 uppercase mb-2 flex items-center gap-2"><Info /> Posición del Pronombre</h3>
                                <p>1. Antes del verbo conjugado: "Yo <strong>lo</strong> compro".</p>
                                <p>2. Después y pegado al infinitivo o gerundio: "Quiero comprar<strong>lo</strong>" / "Estoy comprándo<strong>lo</strong>".</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                    </Card>
                );
            case 'conjugation':
                const v = conjVerbs[conjIdx];
                const pronouns = ["YO", "TÚ", "ÉL", "NOSOTROS", "ELLOS"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className='text-primary uppercase tracking-tighter'>Misión: Doble Pasado ({conjIdx+1}/20)</CardTitle><CardDescription>Conjuga el verbo en Imperfecto y Pasado Simple.</CardDescription></CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="p-6 bg-muted rounded-2xl border-2 border-dashed text-center"><h3 className="text-4xl font-black text-primary uppercase">{v.v}</h3></div>
                            <div className='grid md:grid-cols-2 gap-8'>
                                <div className='space-y-4'>
                                    <h4 className='font-black text-primary uppercase text-sm border-b pb-1'>Imperfecto (aba/ía)</h4>
                                    {pronouns.map((p, i) => (
                                        <div key={i} className='space-y-1'><Label className='text-[10px] font-black'>{p}</Label><Input value={conjAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("uppercase", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                    ))}
                                </div>
                                <div className='space-y-4'>
                                    <h4 className='font-black text-brand-purple uppercase text-sm border-b pb-1'>Pasado Simple (é/í)</h4>
                                    {pronouns.map((p, i) => (
                                        <div key={i+5} className='space-y-1'><Label className='text-[10px] font-black'>{p}</Label><Input value={conjAns[i+5] || ''} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i+5] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i+5] = 'unchecked'; setConjVal(nv); }} className={cn("uppercase", conjVal[i+5] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i+5] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'ex1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('ex1')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={[{en: "gift", es: "regalo"}, {en: "wrap", es: "envolver"}, {en: "bill", es: "cuenta"}, {en: "deliver", es: "entregar"}]} />;
            case 'ex2': return <BallsExercise title="Ejercicio 2" prompts={ex2Prompts} onComplete={() => handleTopicCompleteInternal('ex2')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={[{en: "lend", es: "prestar"}, {en: "truth", es: "verdad"}, {en: "deal", es: "trato"}, {en: "prize", es: "premio"}]} />;
            case 'vocab_game': return <VocabularyMatchingGame data={shoppingVocab.slice(0, 10).map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Shopping & Gifts Memory" />;
            case 'ex3': return <BallsExercise title="Ejercicio 3" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('ex3')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={[{en: "wrap", es: "envolver"}, {en: "discount", es: "descuento"}, {en: "deliver", es: "entregar"}]} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold'>{i+1}. {q.q}</Label>
                                <Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...readAns]; na[i] = e.target.value; setReadAns(na); const nv = [...readVal]; nv[i] = 'unchecked'; setReadVal(nv); }} className={cn('mt-1 text-lg h-12', readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'ex4': return <ChoiceExercise key="ex4" title="Ejercicio 4: Opción Múltiple" prompts={ex4Options} onComplete={() => handleTopicCompleteInternal('ex4')} isSupervisionMode={!!targetStudentId} />;
            case 'complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: Pronombres en Acción</CardTitle></CardHeader>
                        <CardContent className="p-0"><ScrollArea className="h-[500px] p-6"><div className="space-y-4">
                            {completarPrompts.map((q, i) => (
                                <div key={i} className="flex flex-col gap-2 p-4 bg-muted/10 rounded-2xl border shadow-sm">
                                    <p className="font-bold text-lg">{q.s}</p>
                                    <Input value={compAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...compAns]; na[i] = e.target.value; setCompAns(na); const nv = [...compVal]; nv[i] = 'unchecked'; setCompVal(nv); }} className={cn("h-10 max-w-sm text-lg font-mono uppercase", compVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : compVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} placeholder="..." autoComplete="off" readOnly={!!targetStudentId} />
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="justify-center border-t p-6 bg-muted/20"><Button onClick={handleCheckCompletar} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Verificar Todo</Button></CardFooter>
                    </Card>
                );
            case 'translate_text':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left">
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: Shopping Day</CardTitle></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4 text-foreground"><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries({"jewelry": "joyería", "bought": "compró", "earrings": "aretas", "it": "lo/la", "them": "los/las", "for me": "para mí"}).map(([en, es], i) => (<Fragment key={i}><span className="text-muted-foreground capitalize">{en}:</span><span className="font-bold text-right text-primary">{es.toUpperCase()}</span></Fragment>))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-6 bg-muted/50 rounded-2xl border italic text-lg leading-relaxed shadow-sm text-black dark:text-white">"Yesterday, I went to the store because I wanted to buy a gift for my sister. I found a beautiful dress and I bought it. I also saw some earrings and I chose them for me. I paid the bill and the clerk wrapped the gifts for us. I delivered her gift last night and she loved it."</div>
                            <Separator /><div className="space-y-2"><Label className='font-black text-primary uppercase text-sm'>Tu Traducción:</Label><Textarea value={transText} onChange={(e) => { if (!targetStudentId) setTransText(e.target.value); }} placeholder="Escribe el texto en español aquí..." className="min-h-[250px] text-lg leading-relaxed" readOnly={!!targetStudentId} /></div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6 bg-muted/20"><Button onClick={() => handleTopicCompleteInternal('translate_text')} size="lg" className="px-24 font-black h-16 text-2xl shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-tighter">Continuar <ArrowRight className='ml-3 h-8 w-8' /></Button></CardFooter>
                    </Card>
                );
            case 'final': return <BallsExercise title="Reto Final: Traducción Negativa" prompts={finalNegativePrompts} onComplete={() => handleTopicCompleteInternal('final')} isAdmin={isAdmin} isSupervisionMode={!!targetStudentId} vocabulary={[{en: "save", es: "ahorrar"}, {en: "wrap", es: "envolver"}]} />;
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
                        <Link href="/espanol/a2" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso A2
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                           <Repeat className='h-10 w-10 text-primary' /> Pronombres 1 O.D/O.I 🇪🇸
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

export default function Pronombres1Page() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <Pronombres1ContentInternal />
        </Suspense>
    );
}

