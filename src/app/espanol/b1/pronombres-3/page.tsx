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
    Info,
    ListChecks,
    Activity,
    Repeat,
    Smartphone,
    MessageSquare,
    Terminal
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
const progressStorageVersion = 'progress_es_b1_pron_3_v11_fixed_textarea';
const mainProgressKey = 'progress_b1_es_pronombres_3';

const ICONS_CONFIG: Record<string, React.ElementType> = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// --- DATA ---

const instructionsVocab = [
    { en: "RECIPE", es: "RECETA" }, { en: "EXERCISE", es: "EJERCICIO" }, { en: "HOMEWORK", es: "TAREA" },
    { en: "INSTRUCTIONS", es: "INSTRUCCIONES" }, { en: "PHONE", es: "TELÉFONO" }, { en: "COMPUTER", es: "COMPUTADORA" },
    { en: "MEDICINE", es: "MEDICAMENTO" }, { en: "SCREEN", es: "PANTALLA" }, { en: "KEYBOARD", es: "TECLADO" },
    { en: "MOUSE", es: "RATÓN" }, { en: "MESSAGE", es: "MENSAJE" }, { en: "EMAIL", es: "CORREO" },
    { en: "DOCUMENT", es: "DOCUMENTO" }, { en: "FILE", es: "ARCHIVO" }, { en: "BUTTON", es: "BOTÓN" },
    { en: "PRINTER", es: "IMPRESORA" }, { en: "CAMERA", es: "CÁMARA" }, { en: "BATTERY", es: "BATERÍA" },
    { en: "CHARGER", es: "CARGADOR" }, { en: "CONNECTION", es: "CONEXIÓN" }, { en: "APPLICATION", es: "APLICACIÓN" },
    { en: "PASSWORD", es: "CONTRASEÑA" }
];

const pastSimpleVerbs = [
    { en: "GIVE", es: "dar", forms: ["di", "diste", "dio", "dimos", "dieron"] },
    { en: "GO", es: "ir", forms: ["fui", "fuiste", "fue", "fuimos", "fueron"] },
    { en: "HAVE", es: "tener", forms: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvieron"] },
    { en: "HEAR", es: "oír", forms: ["oí", "oíste", "oyó", "oímos", "oyeron"] },
    { en: "KNOW", es: "saber", forms: ["supe", "supiste", "supo", "supimos", "supieron"] },
    { en: "LEARN", es: "aprender", forms: ["aprendí", "aprendiste", "aprendió", "aprendimos", "aprendieron"] },
    { en: "LEAVE", es: "salir", forms: ["salí", "saliste", "salió", "salimos", "salieron"] },
    { en: "LOSE", es: "perder", forms: ["perdí", "perdiste", "perdió", "perdimos", "perdieron"] },
    { en: "MAKE", es: "hacer", forms: ["hice", "hiciste", "hizo", "hicimos", "hicieron"] },
    { en: "MEET", es: "conocer", forms: ["conocí", "conociste", "conoció", "conocimos", "conocieron"] },
    { en: "PUT", es: "poner", forms: ["puse", "pusiste", "puso", "pusimos", "pusieron"] },
    { en: "READ", es: "leer", forms: ["leí", "leíste", "leyó", "leímos", "leyeron"] },
    { en: "RUN", es: "correr", forms: ["corrí", "corriste", "corrió", "corrimos", "corrieron"] },
    { en: "SAY", es: "decir", forms: ["dije", "dijiste", "dijo", "dijimos", "dijeron"] },
    { en: "SEE", es: "ver", forms: ["vi", "viste", "vio", "vimos", "vieron"] },
    { en: "SELL", es: "vender", forms: ["vendí", "vendiste", "vendió", "vendimos", "vendieron"] },
    { en: "SEND", es: "enviar", forms: ["envié", "enviaste", "envió", "enviamos", "enviaron"] },
    { en: "SLEEP", es: "dormir", forms: ["dormí", "dormiste", "durmió", "dormimos", "durmieron"] },
    { en: "SPEND", es: "gastar", forms: ["gasté", "gastaste", "gastó", "gastamos", "gastaron"] },
    { en: "SWIM", es: "nadar", forms: ["nadé", "nadaste", "nadó", "nadamos", "nadaron"] },
    { en: "TAKE", es: "tomar", forms: ["tomé", "tomaste", "tomó", "tomamos", "tomaron"] },
    { en: "TELL", es: "contar", forms: ["conté", "contaste", "contó", "contamos", "contaron"] },
    { en: "THINK", es: "pensar", forms: ["pensé", "pensaste", "pensó", "pensamos", "pensaron"] },
    { en: "UNDERSTAND", es: "entender", forms: ["entendí", "entendiste", "entendió", "entendimos", "entendieron"] },
    { en: "WAKE UP", es: "despertarse", forms: ["desperté", "despertaste", "despertó", "despertamos", "despertaron"] },
    { en: "WEAR", es: "usar", forms: ["usé", "usaste", "usó", "usamos", "usaron"] },
    { en: "WIN", es: "ganar", forms: ["gané", "ganaste", "ganó", "ganamos", "ganaron"] },
    { en: "WRITE", es: "escribir", forms: ["escribí", "escribiste", "escribió", "escribimos", "escribieron"] },
    { en: "COME", es: "venir", forms: ["vine", "viniste", "vino", "vinimos", "vinieron"] },
    { en: "WASH", es: "lavar", forms: ["lavé", "lavaste", "lavó", "lavamos", "lavaron"] },
];

const ex1Prompts = [
    { en: "I want to buy it (the phone).", answer: ["quiero comprarlo", "lo quiero comprar"] },
    { en: "She is reading it (the recipe).", answer: ["está leyéndola", "la está leyendo"] },
    { en: "We need to finish them (the homework).", answer: ["necesitamos terminarlas", "las necesitamos terminar"] },
    { en: "They are opening it (the file).", answer: ["están abriéndolo", "lo están abriendo"] },
    { en: "You must close it (the application).", answer: ["debes cerrarla", "la debes cerrar"] },
    { en: "I can see them (the instructions).", answer: ["puedo verlas", "las puedo ver"] },
    { en: "He is deleting it (the email).", answer: ["está borrándolo", "lo está borrando"] },
    { en: "We want to use it (the printer).", answer: ["queremos usarla", "la queremos usar"] },
    { en: "She can find it (the password).", answer: ["puede encontrarla", "la puede encontrar"] },
    { en: "Do you have it? (the document)", answer: ["¿lo tienes?", "lo tienes?"] },
];

const ex2Prompts = [
    { en: "I give him the medicine.", answer: ["le doy el medicamento"] },
    { en: "She tells me the instructions.", answer: ["me dice las instrucciones"] },
    { en: "We send them the file.", answer: ["les enviamos el archivo"] },
    { en: "They show us the new screen.", answer: ["nos muestran la pantalla nueva"] },
    { en: "I bring you the charger.", answer: ["te traigo el cargador"] },
    { en: "He asks me for a favor.", answer: ["me pide un favor"] },
    { en: "You offer her a deal.", answer: ["le ofreces un trato"] },
    { en: "We promise you the truth.", answer: ["te prometemos la verdad"] },
    { en: "They deliver me the package.", answer: ["me entregan el paquete"] },
    { en: "She lends him the computer.", answer: ["le presta la computadora"] },
];

const ex3Prompts = [
    { en: "I am showing him the document.", answer: ["estoy mostrándole el documento", "le estoy mostrando el documento"] },
    { en: "She wants to send it to us.", answer: ["quiere enviárnoslo", "nos lo quiere enviar"] },
    { en: "We are helping them with the connection.", answer: ["estamos ayudándolos con la conexión", "los estamos ayudando con la conexión"] },
    { en: "They need to find it (the battery) soon.", answer: ["necesitan encontrarla pronto", "la necesitan encontrar pronto"] },
    { en: "Can you give it to me? (the mouse)", answer: ["¿puedes dármelo?", "me lo puedes dar?"] },
    { en: "I am writing them an email.", answer: ["estoy escribiéndoles un correo", "les estoy escribiendo un correo"] },
    { en: "She is teaching us the lesson.", answer: ["está enseñándonos la lección", "nos está enseñando la lección"] },
    { en: "We want to see him now.", answer: ["queremos verlo ahora", "lo queremos ver ahora"] },
    { en: "They are choosing them (the colors).", answer: ["están eligiéndolos", "los están eligiendo"] },
    { en: "I must return it to you (the book).", answer: ["debo devolvértelo", "te lo debo devolver"] },
    { en: "He is explaining it to her.", answer: ["está explicándoselo", "se lo está explicando"] },
    { en: "We can hear you.", answer: ["podemos oírte", "te podemos oír"] },
    { en: "They are looking for me.", answer: ["están buscándome", "me están buscando"] },
    { en: "I want to buy them for her.", answer: ["quiero comprárselos", "se los quiero comprar"] },
    { en: "She is bringing us the bill.", answer: ["está trayéndonos la cuenta", "nos está trayendo la cuenta"] },
];

const readingData = {
    title: "Un día en la oficina digital",
    content: "Hoy es un día muy ocupado. Mi jefe me dio un documento importante y me pidió terminarlo antes del mediodía. Yo lo estoy leyendo ahora mismo. Mis compañeros me envían muchos correos; yo les respondo rápidamente. Tenemos un problema con la impresora, pero el técnico está arreglándola. Mi amiga Laura quiere el cargador de su portátil; yo se lo presté hace una hora. Espero terminar todo pronto para irme a casa.",
    questions: [
        { id: 'q1', question: "¿Qué le dio el jefe al narrador?", a: ["un documento importante", "un documento"] },
        { id: 'q2', question: "¿Qué está haciendo el narrador con el documento?", a: ["leyéndolo", "lo está leyendo"] },
        { id: 'q3', question: "¿Qué está haciendo el técnico con la impresora?", a: ["arreglándola", "la está arreglando"] },
        { id: 'q4', question: "¿A quién le prestó el cargador?", a: ["a su amiga laura", "a laura"] },
        { id: 'q5', question: "¿Para qué quiere terminar pronto el narrador?", a: ["para irse a casa", "para ir a casa"] }
    ]
};

const ex4Options = [
    { text: "Quiero _______ (comprar - el celular) hoy.", options: ["COMPRARLOS", "COMPRARLO", "COMPRARLE"], answer: "COMPRARLO" },
    { text: "Ella está _______ (escritir - la carta) ahora.", options: ["ESCRIBIÉNDOLO", "ESCRIBIÉNDOLA", "ESCRIBIÉNDOLE"], answer: "ESCRIBIÉNDOLA" },
    { text: "Necesitamos _______ (enviar - los archivos).", options: ["ENVIARLOS", "ENVIARLAS", "ENVIARLES"], answer: "ENVIARLOS" },
    { text: "Él está _______ (buscar - a ti).", options: ["BUSCÁNDOLA", "BUSCÁNDOTE", "BUSCÁNDOME"], answer: "BUSCÁNDOTE" },
    { text: "Debes _______ (cerrar - la aplicación).", options: ["CERRARLE", "CERRARLO", "CERRARLA"], answer: "CERRARLA" },
    { text: "Estamos _______ (ayudar - a ellos).", options: ["AYUDÁNDOLES", "AYUDÁNDOLOS", "AYUDÁNDOLAS"], answer: "AYUDÁNDOLOS" },
    { text: "Puedo _______ (ver - a ustedes) mañana.", options: ["VERLES", "VERLOS", "VERLAS"], answer: "VERLOS" },
    { text: "Ellos quieren _______ (conocer - a mí).", options: ["CONOCERMO", "CONOCERTE", "CONOCERME"], answer: "CONOCERME" },
    { text: "Ustedes están _______ (mirar - el video).", options: ["MIRÁNDELO", "MIRÁNDOLO", "MIRÁNDOLE"], answer: "MIRÁNDOLO" },
    { text: "Ella puede _______ (hacer - la tarea) rápido.", options: ["HACERLE", "HACERLO", "HACERLA"], answer: "HACERLA" },
    { text: "Estoy _______ (llamar - a mi tía).", options: ["LLAMÁNDOLO", "LLAMÁNDOLA", "LLAMÁNDOLE"], answer: "LLAMÁNDOLA" },
    { text: "Queremos _______ (invitar - a Juan).", options: ["INVITARLAS", "INVITARLE", "INVITARLO"], answer: "INVITARLO" },
    { text: "Ellos están _______ (limpiar - las ventanas).", options: ["LIMPIÁNDOLAS", "LIMPIÁNDOLOS", "LIMPIÁNDOLES"], answer: "LIMPIÁNDOLAS" },
    { text: "Tú puedes _______ (ayudar - a nosotros).", options: ["AYUDARLOS", "AYUDARNOS", "AYUDARLES"], answer: "AYUDARNOS" },
    { text: "Él está _______ (vender - su carro).", options: ["VENDIÉNDOLOS", "VENDIÉNDOLO", "VENDIÉNDOLE"], answer: "VENDIÉNDOLO" },
    { text: "Necesito _______ (encontrar - mis llaves).", options: ["ENCONTRARLES", "ENCONTRARLOS", "ENCONTRARLAS"], answer: "ENCONTRARLAS" },
    { text: "Ella quiere _______ (decir - a nosotros) la verdad.", options: ["DECIRNOS", "DECIRLES", "DECIRME"], answer: "DECIRNOS" },
    { text: "Ustedes están _______ (perder - el tiempo).", options: ["PERDIÉNDOLA", "PERDIÉNDOLO", "PERDIÉNDOLE"], answer: "PERDIÉNDOLO" },
    { text: "Puedo _______ (oír - a ti) bien.", options: ["OÍRTE", "OÍRLE", "OÍRME"], answer: "OÍRTE" },
    { text: "Estamos _______ (organizar - la fiesta).", options: ["ORGANIZÁNDOLE", "ORGANIZÁNDOLA", "ORGANIZÁNDOLE"], answer: "ORGANIZÁNDOLA" },
];

const completionPrompts = [
    { s: "1. Estoy (leer) _______ el libro.", a: "leyéndolo" },
    { s: "2. Quiero (ver) _______ a ella.", a: "verla" },
    { s: "3. Él está (buscar) _______ a nosotros.", a: "buscándonos" },
    { s: "4. Necesitamos (terminar) _______ las tareas.", a: "terminarlas" },
    { s: "5. ¿Puedes (ayudar) _______ a mí?", a: "ayudarme" },
    { s: "6. Ella está (cocinar) _______ la cena.", a: "cocinándola" },
    { s: "7. Queremos (conocer) _______ a ellos.", a: "conocerlos" },
    { s: "8. Debes (cerrar) _______ la puerta.", a: "cerrarla" },
    { s: "9. Estoy (llamar) _______ a ti.", a: "llamándote" },
    { s: "10. Ellos están (abrir) _______ los regalos.", a: "abriéndolos" },
    { s: "11. ¿Quieres (comprar) _______ el carro?", a: "comprarlo" },
    { s: "12. Ella puede (ver) _______ a nosotros.", a: "vernos" },
    { s: "13. Estamos (estudiar) _______ la lección.", a: "estudiándola" },
    { s: "14. Él quiere (invitar) _______ a ti.", a: "invitarte" },
    { s: "15. Necesito (encontrar) _______ mis gafas.", a: "encontrarlas" },
    { s: "16. Están (vender) _______ su casa.", a: "vendiéndola" },
    { s: "17. ¿Puedes (traer) _______ el cargador?", a: "traerlo" },
    { s: "18. Ella está (limpiar) _______ la habitación.", a: "limpiándola" },
    { s: "19. Queremos (visitar) _______ a ellos.", a: "visitarlos" },
    { s: "20. Debes (decir) _______ la verdad a mí.", a: "decirme" },
    { s: "21. Estoy (usar) _______ la computadora.", a: "usándola" },
    { s: "22. Él está (mirar) _______ la pantalla.", a: "mirándola" },
    { s: "23. Necesitamos (enviar) _______ el correo.", a: "enviarlo" },
    { s: "24. ¿Quieres (comer) _______ la pizza?", a: "comerla" },
    { s: "25. Ella está (beber) _______ el jugo.", a: "bebiéndolo" },
    { s: "26. Estamos (aprender) _______ el idioma.", a: "aprendiéndolo" },
    { s: "27. Ellos quieren (seguir) _______ las instrucciones.", a: "seguirlas" },
    { s: "28. ¿Puedes (abrir) _______ el archivo?", a: "abrirlo" },
    { s: "29. Estoy (preparar) _______ el examen.", a: "preparándolo" },
    { s: "30. Él quiere (dar) _______ un regalo a ella.", a: "darle" },
];

const translationTextEng = "I have a project for my university. I am working on it right now. My teacher gave me the instructions and I am following them. My friend needs help with his homework, so I am helping him. Later, we are going to finish it together. I love studying because technology makes it interesting for us.";

const finalCorrectionPrompts = [
    { en: "Quiero lo comprar", answer: ["quiero comprarlo", "lo quiero comprar"] },
    { en: "Estoy la escribiendo", answer: ["estoy escribiéndola", "la estoy escribiendo"] },
    { en: "Cómpralo lo", answer: ["cómpralo"] },
    { en: "No lo lo compres", answer: ["no lo compres"] },
    { en: "Dile lo a ella", answer: ["díselo", "dile la verdad"] },
    { en: "Estamos los buscando", answer: ["estamos buscándolos", "los estamos buscando"] },
    { en: "Necesito la encontrar", answer: ["necesito encontrarla", "la necesito encontrar"] },
    { en: "Ella está me llamando", answer: ["ella está llamándome", "ella me está llamando"] },
    { en: "Queremos los ver", answer: ["queremos verlos", "los queremos ver"] },
    { en: "Búscalo lo ahora", answer: ["búscalo ahora"] },
    { en: "No la la abras", answer: ["no la abras"] },
    { en: "Ellos están nos ayudando", answer: ["ellos están ayudándonos", "ellos nos están ayudando"] },
    { en: "Debes lo terminar", answer: ["debes terminarlo", "lo debes terminar"] },
    { en: "Tráemelo lo por favor", answer: ["tráemelo por favor"] },
    { en: "Él está lo borrando", answer: ["él está borrándolo", "él lo está borrando"] },
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setStatus({}); setUserAnswers({}); setCurrentIndex(0); }, [prompts]);
    useEffect(() => { /* keep state */ }, [currentIndex]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const currentAnswer = userAnswers[currentIndex] || '';
        const userVal = currentAnswer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex]?.answer || [];
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
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase al español usando pronombres.</CardDescription>
                        <div className="flex gap-2 justify-start flex-wrap pt-4">
                            {prompts.map((_: any, i: number) => (
                                <div key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all", currentIndex === i ? "border-primary ring-2 ring-primary scale-110" : "border-muted", status[i] === 'correct' ? "!bg-green-600 !text-white !border-green-600" : status[i] === 'incorrect' ? "!bg-red-600 !text-white !border-red-600" : "bg-card text-foreground")}>{i + 1}</div>
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
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (
                                            <div key={en} className="flex justify-between border-b pb-1">
                                                <span className="text-muted-foreground capitalize">{en}:</span>
                                                <span className="font-semibold text-right text-primary">{(es || '').toUpperCase()}</span>
                                            </div>
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
                        currentStatus === 'correct' ? '!border-green-600 !bg-green-500/10' : 
                        currentStatus === 'incorrect' ? '!border-red-600 !bg-red-500/10' : ''
                    )} 
                    placeholder="Escribe en español..." 
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

function Pronombres3ContentInternal() {
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
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(instructionsVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<any[]>(Array(instructionsVocab.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));

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
        { key: 'vocabulary', name: '1. Vocabulario', icon: ListChecks, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1 (O.D)', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2 (O.I)', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3 (Mix)', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4 (Elegir)', icon: ListChecks, status: 'locked' },
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
            if (savedData.vocabAnswers) setVocabAnswers(savedData.vocabAnswers);
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
            v: vocabAnswers,
            t: transText,
            r: readAns
        });

        if (currentSerialized === lastSerializedRef.current) return;

        const saveTimer = setTimeout(() => {
            const s: any = { 
                lastSelectedTopic: selectedTopic,
                vocabAnswers,
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
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAnswers, transText, readAns]);

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
        const nv = instructionsVocab.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAnswers[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(nv);
        if (okCount >= 10) {
            setCanAdvanceVocab(true);
            toast({ title: "¡Buen avance!", description: "Has dominado lo suficiente para avanzar." });
        } else {
            toast({ variant: 'destructive', title: "Sigue intentando", description: `Llevas ${okCount} de 22.` });
        }
    };

    const handleCheckConj = () => {
        const v = pastSimpleVerbs[conjIdx];
        const corrects = v.forms;
        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < pastSimpleVerbs.length - 1) {
                setTimeout(() => {
                    setConjIdx(p => p + 1);
                    setConjAns(Array(5).fill(''));
                    setConjVal(Array(5).fill('unchecked'));
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
        readingData.questions.forEach((q) => {
            const userAns = (readAns[q.id] || '').trim().toLowerCase();
            const res = q.a.some(a => userAns.includes(a.toLowerCase()));
            nv[q.id] = res ? 'correct' : 'incorrect';
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
                            <CardTitle className="text-primary uppercase tracking-tighter">Vocabulary: Instructions & Activities (22)</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Traduce las palabras al español.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ScrollArea className="h-[450px] pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div>
                                    <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                                    {instructionsVocab.map((v, i) => (
                                        <Fragment key={i}>
                                            <div className="flex items-center font-bold py-1 text-sm text-foreground uppercase">{v.en}</div>
                                            <Input 
                                                value={vocabAnswers[i] || ''} 
                                                onChange={e => { 
                                                    if (targetStudentId) return;
                                                    const na = [...vocabAnswers]; na[i] = e.target.value; setVocabAnswers(na); 
                                                    const nv = [...vocabValidation]; nv[i] = 'unchecked'; setVocabValidation(nv);
                                                }} 
                                                className={cn("h-10 uppercase transition-all text-foreground", vocabValidation[i] === 'correct' ? 'border-green-500 bg-green-50/10' : vocabValidation[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} 
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
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-foreground overflow-hidden">
                            <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMÁTICA: POSICIÓN DE PRONOMBRES O.D / O.I</CardTitle></CardHeader>
                            <CardContent className="space-y-8 px-0 font-bold">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                    <h3 className="text-xl font-black text-primary uppercase">1. Con Infinitivos</h3>
                                    <p>El pronombre puede ir después y pegado al verbo.</p>
                                    <div className='bg-primary/10 p-4 rounded-xl border border-primary/20 font-mono text-xl'>Quiero comprar<span className='text-primary font-black underline'>lo</span>.</div>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                    <h3 className="text-xl font-black text-brand-purple uppercase">2. Con Gerundios</h3>
                                    <p>Se agrega al final y lleva tilde en la vocal acentuada.</p>
                                    <div className='bg-brand-purple/10 p-4 rounded-xl border border-brand-purple/20 font-mono text-xl'>Estoy haciéndo<span className='text-brand-purple font-black underline'>lo</span>.</div>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                    <h3 className="text-xl font-black text-green-600 uppercase">3. Con Imperativos Afirmativos</h3>
                                    <p>Siempre va después y pegado.</p>
                                    <div className='bg-green-500/10 p-4 rounded-xl border border-green-500/20 font-mono text-xl'>Cómpra<span className='text-green-600 font-black underline'>lo</span>.</div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );

            case 'conjugation':
                const v = pastSimpleVerbs[conjIdx];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center text-foreground">
                                <CardTitle className='text-primary uppercase tracking-tighter'>Misión: Pasado Simple ({conjIdx + 1}/30)</CardTitle>
                                <span className='font-bold text-muted-foreground uppercase'>{v.en}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.en}</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mx-auto'>
                                {["YO", "TÚ", "ÉL/ELLA", "NOSOTROS", "ELLOS"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i]} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase text-foreground", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );

            case 'exercise_1': return <BallsExercise title="Ejercicio 1: Pronombre O.D" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={{"recipe": "receta", "file": "archivo", "printer": "impresora", "password": "contraseña"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <BallsExercise title="Ejercicio 2: Pronombre O.I" prompts={ex2Prompts} onComplete={() => handleTopicCompleteInternal('exercise_2')} vocabulary={{"medicine": "medicamento", "charger": "cargador", "deal": "trato", "package": "paquete"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={instructionsVocab.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Instructional Items Memory" />;
            case 'exercise_3': return <BallsExercise title="Ejercicio 3: Mixto" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('exercise_3')} vocabulary={{"connection": "conexión", "soon": "pronto", "bill": "cuenta", "explain": "explicar"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tight'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6 text-foreground">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator />
                            <div className="space-y-4">
                                {readingData.questions.map((q) => (
                                    <div key={q.id} className="space-y-2 p-3 bg-muted/20 rounded-xl border border-border/50">
                                        <Label className="font-bold">{q.question}</Label>
                                        <Input value={readAns[q.id] || ''} onChange={e => { if (targetStudentId) return; const na = {...readAns}; na[q.id] = e.target.value; setReadAns(na); const nv = {...readVal}; nv[q.id] = 'unchecked'; setReadVal(nv); }} className={cn("h-10 text-foreground", readVal[q.id] === 'correct' ? 'border-green-500 bg-green-50/5' : readVal[q.id] === 'incorrect' ? 'border-red-500 bg-red-50/5' : '')} autoComplete="off" readOnly={!!targetStudentId} />
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
                        <CardHeader><CardTitle className='text-foreground dark:text-primary uppercase tracking-tighter'>Completar: Frases con Pronombres (30)</CardTitle></CardHeader>
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
                                <div><CardTitle className='text-primary uppercase'>Traducción de Texto: The Digital Project</CardTitle><CardDescription className='font-bold text-foreground'>Traduce el párrafo al español.</CardDescription></div>
                                <Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0 text-foreground"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-foreground text-left">
                                            <div className="flex flex-col gap-2 text-xs">
                                                {Object.entries({ "working on it": "trabajando en ello", "gave": "dio", "following": "siguiendo", "provide": "proveer / dar", "together": "juntos", "easier": "más fácil" }).map(([en, es], i) => (<div key={i} className="flex justify-between border-b pb-1"><span className="text-muted-foreground">{en}:</span><span className="font-bold text-primary">{es}</span></div>))}
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
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Misión Final: Corregir Errores</h2>
                            <p className="font-bold text-lg text-white">Corrige las frases gramaticalmente incorrectas.</p>
                        </div>
                        <BallsExercise title="Final Challenge: Correction" prompts={finalCorrectionPrompts} onComplete={() => handleTopicCompleteInternal('final')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />
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
                <p className="text-white font-bold tracking-widest animate-pulse uppercase text-foreground">Sincronizando Misión B1...</p>
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
                           <Repeat className='h-10 w-10 text-primary' /> Pronombres 3 🇪🇸
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
                                <CardContent className="p-4 text-foreground">
                                    <nav>
                                        <ul className="space-y-1 text-foreground">
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
                                                            <span className="truncate max-w-[150px] text-[10px] uppercase font-bold text-black dark:text-white">{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t text-foreground">
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

export default function Pronombres3Page() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <Pronombres3ContentInternal />
        </Suspense>
    );
}