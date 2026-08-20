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
    ListChecks,
    Gift
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
const progressStorageVersion = 'progress_es_b1_doble_pron_v1_secure';
const mainProgressKey = 'progress_b1_es_doble_pronombre';

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

const vocabData = [
    { en: "WATCH", es: "reloj" }, { en: "PERFUME", es: "perfume" }, { en: "FLOWERS", es: "flores" },
    { en: "EMAIL", es: "correo" }, { en: "MESSAGE", es: "mensaje" }, { en: "PHOTOGRAPH", es: "fotografía" },
    { en: "REPORT", es: "informe" }, { en: "DOCUMENT", es: "documento" }, { en: "PRESENTATION", es: "presentación" },
    { en: "TO GIVE (A GIFT)", es: "regalar" }, { en: "TO SEND", es: "enviar" }, { en: "TO LEND", es: "prestar" },
    { en: "TO SHOW", es: "mostrar" }, { en: "TO OFFER", es: "ofrecer" }, { en: "TO EXPLAIN", es: "explicar" },
    { en: "TO BRING", es: "traer" }, { en: "TO BUY", es: "comprar" }, { en: "TO SELL", es: "vender" },
    { en: "TO WRITE", es: "escribir" }, { en: "TO DELIVER", es: "entregar" }
];

const conjugationVerbs = [
    { en: "TO GO", es: "ir", forms: ["fui", "fuiste", "fue", "fuimos", "fueron"] },
    { en: "TO BE", es: "ser", forms: ["fui", "fuiste", "fue", "fuimos", "fueron"] },
    { en: "TO HAVE", es: "tener", forms: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvieron"] },
    { en: "TO DO / MAKE", es: "hacer", forms: ["hice", "hiciste", "hizo", "hicimos", "hicieron"] },
    { en: "TO SAY", es: "decir", forms: ["dije", "dijiste", "dijo", "dijimos", "dijeron"] },
    { en: "TO BE (STATE)", es: "estar", forms: ["estuve", "estuviste", "estuvo", "estuvimos", "estuvieron"] },
    { en: "TO CAN / BE ABLE", es: "poder", forms: ["pude", "pudiste", "pudo", "pudimos", "pudieron"] },
    { en: "TO PUT", es: "poner", forms: ["puse", "pusiste", "puso", "pusimos", "pusieron"] },
    { en: "TO KNOW", es: "saber", forms: ["supe", "supiste", "supo", "supimos", "supieron"] },
    { en: "TO WANT", es: "querer", forms: ["quise", "quisiste", "quiso", "quisimos", "quisieron"] },
    { en: "TO COME", es: "venir", forms: ["vine", "viniste", "vino", "vinimos", "vinieron"] },
    { en: "TO SEE", es: "ver", forms: ["vi", "viste", "vio", "vimos", "vieron"] },
    { en: "TO GIVE", es: "dar", forms: ["di", "diste", "dio", "dimos", "dieron"] },
    { en: "TO BRING", es: "traer", forms: ["traje", "trajiste", "trajo", "trajimos", "trajeron"] },
    { en: "TO TRANSLATE", es: "traducir", forms: ["traduje", "tradujiste", "tradujo", "tradujimos", "tradujeron"] },
];

const ex1Prompts = [
    { en: "I buy the flowers for her.", answer: ["se las compro", "yo se las compro"] },
    { en: "You send the message to me.", answer: ["me lo envías", "tú me lo envías"] },
    { en: "He shows the report to them.", answer: ["se lo muestra", "él se lo muestra"] },
    { en: "We lend the car to you.", answer: ["te lo prestamos", "nosotros te lo prestamos"] },
    { en: "They offer the deal to us.", answer: ["nos lo ofrecen", "ellos nos lo ofrecen"] },
    { en: "I explain the presentation to him.", answer: ["se la explico", "yo se la explico"] },
    { en: "She gives the keys to you.", answer: ["te las da", "ella te las da"] },
    { en: "We write the email to her.", answer: ["se lo escribimos", "nosotros se lo escribimos"] },
    { en: "You (pl.) deliver the package to me.", answer: ["me lo entregan", "ustedes me lo entregan"] },
    { en: "They show the photographs to us.", answer: ["nos las muestran", "ellos nos las muestran"] },
    { en: "I give the watch to my father.", answer: ["se lo doy", "yo se lo doy"] },
    { en: "She lends her dress to her sister.", answer: ["se lo presta", "ella se lo presta"] },
];

const ex2Options = [
    { text: "Yo (enviar) _______ el correo a Juan ayer.", options: ["LO ENVIÉ", "SE LO ENVIÉ", "ME LO ENVIÉ"], answer: "SE LO ENVIÉ" },
    { text: "Tú (dar) _______ las flores a María.", options: ["SE LAS DISTE", "TE LAS DIO", "LAS DISTE"], answer: "SE LAS DISTE" },
    { text: "Nosotros (explicar) _______ el problema a ellos.", options: ["SE LO EXPLICAMOS", "NOS LO EXPLICA", "LOS EXPLICAMOS"], answer: "SE LO EXPLICAMOS" },
    { text: "Ellos (traer) _______ el regalo para mí.", options: ["ME LO TRAJERON", "SE LO TRAJERON", "LO TRAJERON"], answer: "ME LO TRAJERON" },
    { text: "Ella (mostrar) _______ las fotos a nosotros.", options: ["NOS LAS MOSTRÓ", "SE LAS MOSTRÓ", "LAS MOSTRÓ"], answer: "NOS LAS MOSTRÓ" },
    { text: "Ustedes (prestar) _______ el libro a él.", options: ["SE LO PRESTARON", "LO PRESTARON", "TE LO PRESTARON"], answer: "SE LO PRESTARON" },
    { text: "Yo (decir) _______ la verdad a ti.", options: ["TE LA DIJE", "SE LA DIJE", "LA DIJE"], answer: "TE LA DIJE" },
    { text: "Él (comprar) _______ el reloj para ella.", options: ["SE LO COMPRÓ", "LO COMPRÓ", "ME LO COMPRÓ"], answer: "SE LO COMPRÓ" },
    { text: "Nosotros (vender) _______ la casa a ellos.", options: ["SE LA VENDIMOS", "LA VENDIMOS", "NOS LA VENDIERON"], answer: "SE LA VENDIMOS" },
    { text: "Tú (entregar) _______ el informe al jefe.", options: ["SE LO ENTREGASTE", "LO ENTREGASTE", "ME LO ENTREGASTE"], answer: "SE LO ENTREGASTE" },
    { text: "Ellas (traer) _______ los documentos a mí.", options: ["ME LOS TRAJERON", "SE LOS TRAJERON", "LOS TRAJERON"], answer: "ME LOS TRAJERON" },
    { text: "Yo (ofrecer) _______ un café a usted.", options: ["SE LO OFRECÍ", "LO OFRECÍ", "TE LO OFRECÍ"], answer: "SE LO OFRECÍ" },
];

const ex3Prompts = [
    { en: "I buy the gift. -> I buy it for him.", answer: ["se lo compro", "yo se lo compro"] },
    { en: "She calls the friends. -> She calls them for us.", answer: ["nos los llama", "ella nos los llama"] },
    { en: "We read the book. -> We read it to her.", answer: ["se lo leemos", "nosotros se lo leemos"] },
    { en: "They see the girl. -> They see her for me.", answer: ["me la ven", "ellos me la ven"] },
    { en: "I send the letter. -> I send it to you.", answer: ["te la envío", "yo te la envío"] },
    { en: "You open the windows. -> You open them for them.", answer: ["se las abres", "tú se las abres"] },
    { en: "He knows the secret. -> He knows it for us.", answer: ["nos lo sabe", "él nos lo sabe"] },
    { en: "We help the neighbors. -> We help them for you.", answer: ["te los ayudamos", "nosotros te los ayudamos"] },
    { en: "She eats the pizza. -> She eats it for me.", answer: ["me la come", "ella me la come"] },
    { en: "They clean the rooms. -> They clean them for us.", answer: ["nos los limpian", "ellos nos los limpian"] },
    { en: "I write to my father. -> I write it to him.", answer: ["se lo escribo", "yo se lo escribo"] },
    { en: "She gives water to the dog. -> She gives it to it.", answer: ["se la da", "ella se la da"] },
    { en: "We tell the truth to you. -> We tell it to you.", answer: ["te la decimos", "nosotros te la decimos"] },
    { en: "They bring food to us. -> They bring it to us.", answer: ["nos la traen", "ellos nos la traen"] },
    { en: "I show the photo to her. -> I show it to her.", answer: ["se la muestro", "yo se la muestro"] },
];

const readingData = {
    title: "El Informe de Ventas",
    content: "Hoy mi jefe me pidió el informe de ventas. Yo ya se lo terminé ayer, pero olvidé enviárselo por correo. Mi compañera Ana tiene la presentación del proyecto; ella nos la mostró en la reunión de la mañana. Yo le presté mi portátil a Luis porque el suyo no funciona; él me lo devolverá mañana. En la tarde, el mensajero trajo unos documentos para los clientes y yo se los entregué personalmente. Fue un día muy productivo.",
    questions: [
        { q: "¿Cuándo terminó el narrador el informe?", a: ["ayer"] },
        { q: "¿Qué olvidó hacer con el informe?", a: ["enviárselo por correo", "enviarlo"] },
        { q: "¿Quién mostró la presentación?", a: ["ana", "su compañera ana"] },
        { q: "¿A quién le prestó el portátil?", a: ["a luis"] },
        { q: "¿Qué hizo con los documentos de los clientes?", a: ["se los entregó personalmente", "los entregó"] }
    ]
};

const ex4Options = [
    { text: "El profesor _______ (explicar) la lección a nosotros.", options: ["NOS LA EXPLICÓ", "SE LA EXPLICÓ", "LA EXPLICÓ"], answer: "NOS LA EXPLICÓ" },
    { text: "Yo _______ (comprar) un regalo para mi novia.", options: ["SE LO COMPRÉ", "LO COMPRÉ", "ME LO COMPRÉ"], answer: "SE LO COMPRÉ" },
    { text: "Tú _______ (prestar) el dinero a ellos.", options: ["SE LO PRESTASTE", "LO PRESTASTE", "LES PRESTASTE"], answer: "SE LO PRESTASTE" },
    { text: "Nosotros _______ (enviar) el mensaje a ti.", options: ["TE LO ENVIAMOS", "SE LO ENVIAMOS", "LO ENVIAMOS"], answer: "TE LO ENVIAMOS" },
    { text: "Ellos _______ (mostrar) los resultados al equipo.", options: ["SE LOS MOSTRARON", "LOS MOSTRARON", "NOS LOS MOSTRARON"], answer: "SE LOS MOSTRARON" },
    { text: "Ella _______ (dar) la noticia a su madre.", options: ["SE LA DIO", "LA DIO", "LE DIO"], answer: "SE LA DIO" },
    { text: "Ustedes _______ (traer) el café para mí.", options: ["ME LO TRAJERON", "SE LO TRAJERON", "LO TRAJERON"], answer: "ME LO TRAJERON" },
    { text: "Yo _______ (escribir) la carta a mis abuelos.", options: ["SE LA ESCRIBÍ", "LA ESCRIBÍ", "LES ESCRIBÍ"], answer: "SE LA ESCRIBÍ" },
    { text: "Él _______ (entregar) las llaves a la recepcionista.", options: ["SE LAS ENTREGÓ", "LAS ENTREGÓ", "LE ENTREGÓ"], answer: "SE LAS ENTREGÓ" },
    { text: "Nosotros _______ (ofrecer) el descuento a los clientes.", options: ["SE LO OFRECIMOS", "LO OFRECIMOS", "LES OFRECIMOS"], answer: "SE LO OFRECIMOS" },
    { text: "Tú _______ (contar) el secreto a tu amigo.", options: ["SE LO CONTASTE", "LO CONTASTE", "TE LO CONTÓ"], answer: "SE LO CONTASTE" },
    { text: "Ella _______ (vender) el coche a su vecino.", options: ["SE LO VENDIO", "LO VENDIÓ", "LE VENDIÓ"], answer: "SE LO VENDIO" },
    { text: "Yo _______ (traer) las flores para ti.", options: ["TE LAS TRAJE", "SE LAS TRAJE", "LAS TRAJE"], answer: "TE LAS TRAJE" },
    { text: "Ellos _______ (explicar) el plan a nosotros.", options: ["NOS LO EXPLICARON", "SE LO EXPLICARON", "LO EXPLICARON"], answer: "NOS LO EXPLICARON" },
    { text: "Usted _______ (dar) el informe a su jefe.", options: ["SE LO DIO", "LO DIO", "LE DIO"], answer: "SE LO DIO" },
    { text: "Nosotros _______ (comprar) los helados para los niños.", options: ["SE LOS COMPRAMOS", "LOS COMPRAMOS", "NOS LOS COMPRARON"], answer: "SE LOS COMPRAMOS" },
    { text: "Tú _______ (mostrar) el tatuaje a tus padres.", options: ["SE LO MOSTRASTE", "LO MOSTRASTE", "TE LO MOSTRARON"], answer: "SE LO MOSTRASTE" },
    { text: "Ellas _______ (enviar) el regalo a mí.", options: ["ME LO ENVIARON", "SE LO ENVIARON", "LO ENVIARON"], answer: "ME LO ENVIARON" },
    { text: "Yo _______ (prestar) mi sombrilla a ella.", options: ["SE LA PRESTÉ", "LA PRESTÉ", "LE PRESTÉ"], answer: "SE LA PRESTÉ" },
    { text: "Él _______ (traer) el pedido a nosotros.", options: ["NOS LO TRAJO", "SE LO TRAJO", "LO TRAJO"], answer: "NOS LO TRAJO" },
];

const completarPrompts = [
    { s: "1. Yo (regalar - el reloj - a él) _______.", a: "se lo regalé" },
    { s: "2. Tú (enviar - el mensaje - a mí) _______.", a: "me lo enviaste" },
    { s: "3. Ella (prestar - el libro - a ti) _______.", a: "te lo prestó" },
    { s: "4. Nosotros (mostrar - las fotos - a ellos) _______.", a: "se las mostramos" },
    { s: "5. Ellos (ofrecer - el trato - a nosotros) _______.", a: "nos lo ofrecieron" },
    { s: "6. Yo (explicar - la lección - a ella) _______.", a: "se la expliqué" },
    { s: "7. Tú (entregar - el informe - a mí) _______.", a: "me lo entregaste" },
    { s: "8. Él (comprar - el anillo - para ti) _______.", a: "te lo compró" },
    { s: "9. Nosotros (vender - la casa - a ellos) _______.", a: "se la vendimos" },
    { s: "10. Ellos (traer - la cena - para nosotros) _______.", a: "nos la trajeron" },
    { s: "11. Yo (decir - el secreto - a ti) _______.", a: "te lo dije" },
    { s: "12. Tú (mostrar - el camino - a ella) _______.", a: "se lo mostraste" },
    { s: "13. Ella (dar - el beso - a su hijo) _______.", a: "se lo dio" },
    { s: "14. Nosotros (enviar - las cartas - a ellos) _______.", a: "se las enviamos" },
    { s: "15. Ellos (traer - los refrescos - para mí) _______.", a: "me los trajeron" },
    { s: "16. Yo (pedir - el favor - a ti) _______.", a: "te lo pedí" },
    { s: "17. Tú (devolver - el dinero - a él) _______.", a: "se lo devolviste" },
    { s: "18. Ella (envolver - el regalo - para nosotros) _______.", a: "nos lo envolvió" },
    { s: "19. Nosotros (contar - la historia - a ti) _______.", a: "te la contamos" },
    { s: "20. Ellos (mostrar - el plano - a ella) _______.", a: "se lo mostraron" },
    { s: "21. Yo (traer - el cargador - para ti) _______.", a: "te lo traje" },
    { s: "22. Tú (enviar - el archivo - a nosotros) _______.", a: "nos lo enviaste" },
    { s: "23. Ella (dar - las gracias - a ellos) _______.", a: "se las dio" },
    { s: "24. Nosotros (explicar - el motivo - a él) _______.", a: "se lo explicamos" },
    { s: "25. Ellos (comprar - los boletos - para ti) _______.", a: "te los compraron" },
    { s: "26. Yo (vender - la moto - a mi amigo) _______.", a: "se la vendí" },
    { s: "27. Tú (entregar - las flores - a ella) _______.", a: "se las entregaste" },
    { s: "28. Él (prestar - su chaqueta - a mí) _______.", a: "me la prestó" },
    { s: "29. Nosotros (mostrar - el hotel - a ellos) _______.", a: "se lo mostramos" },
    { s: "30. Ellos (traer - el postre - para nosotros) _______.", a: "nos lo trajeron" },
];

const translationTextEng = "I have a special gift for my sister. It is a beautiful necklace and I am going to give it to her tonight. I also have a letter for my parents. I already wrote it to them last week, but I didn't send it yet. My friend wants to see my new car, so I am showing it to him now. He likes technology and he thinks it is very fast.";

const finalNegativePrompts = [
    { en: "I don't give it to him.", es: ["no se lo doy", "yo no se lo doy"] },
    { en: "She doesn't send it to me.", es: ["no me lo envía", "ella no me lo envía"] },
    { en: "We don't tell it to them.", es: ["no se lo decimos", "nosotros no se lo decimos"] },
    { en: "They don't show it to us.", es: ["no nos lo muestran", "ellos no nos lo muestran"] },
    { en: "You don't lend it to her.", es: ["no se lo prestas", "tú no se lo prestas"] },
    { en: "He doesn't deliver it to you.", es: ["no te lo entrega", "él no te lo entrega"] },
    { en: "I don't offer it to them.", es: ["no se lo ofrezco", "yo no se lo ofrezco"] },
    { en: "She doesn't explain it to us.", es: ["no nos lo explica", "ella no nos lo explica"] },
    { en: "We don't bring it to you.", es: ["no te lo traemos", "nosotros no te lo traemos"] },
    { en: "They don't buy it for her.", es: ["no se lo compran", "ellos no se lo compran"] },
    { en: "I don't sell it to him.", es: ["no se lo vendo", "yo no se lo vendo"] },
    { en: "You don't write it to me.", es: ["no me lo escribes", "tú no me lo escribes"] },
    { en: "He doesn't show them to us.", es: ["no nos los muestra", "él no nos los muestra"] },
    { en: "She doesn't give them to you.", es: ["no te las da", "ella no te las da"] },
    { en: "We don't wrap it for them.", es: ["no se lo envolvemos", "nosotros no se lo envolvemos"] },
];

// --- HELPER COMPONENTS ---

const BallsExercise = ({ title, prompts, onComplete, vocabulary, isSupervisionMode, isAdmin }: any) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    useEffect(() => { setStatus({}); setUserAnswers({}); setCurrentIndex(0); }, [prompts]);

    const handleCheck = () => {
        if (isSupervisionMode) return;
        const currentAnswer = userAnswers[currentIndex] || '';
        const userVal = currentAnswer.trim().toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ');
        const corrects = prompts[currentIndex]?.answer || [];
        const isCorrect = corrects.some((a: string) => (a || '').toLowerCase().replace(/[.?,¿!¡]/g, '').replace(/\s+/g, ' ') === userVal);
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
                        <CardDescription className='font-bold text-foreground mt-1'>Traduce la frase al español usando el Doble Pronombre.</CardDescription>
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
                                    <div className="flex flex-col gap-2 text-sm">
                                        {Object.entries(vocabulary).map(([en, es]: any) => (
                                            <div key={en} className="flex flex-col border-b pb-1">
                                                <span className="text-muted-foreground capitalize text-[10px]">{en}:</span>
                                                <span className="font-bold text-primary">{String(es || '').toUpperCase()}</span>
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
                <div className="text-left text-foreground">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {prompts[currentIndex].options.map((opt: string) => (
                        <Button key={opt} onClick={() => handleSelect(opt)} variant="outline" className={cn("h-16 text-xl font-black uppercase transition-all", status[currentIndex] === 'correct' && opt === prompts[currentIndex].answer && "border-green-500 bg-green-50 text-green-700 scale-105")} disabled={isSupervisionMode}>{opt}</Button>
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

function DoblePronombreContentInternal() {
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
    const [vocabAns, setVocabAns] = useState<string[]>(Array(vocabData.length).fill(''));
    const [vocabVal, setVocabVal] = useState<any[]>(Array(vocabData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const [conjIdx, setConjIdx] = useState(0);
    const [conjAns, setConjAns] = useState<string[]>(Array(5).fill(''));
    const [conjVal, setConjVal] = useState<any[]>(Array(5).fill('unchecked'));

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
        { key: 'vocabulary', name: '1. Vocabulario', icon: Gift, status: 'active' },
        { key: 'grammar', name: '2. Gramática', icon: GraduationCap, status: 'locked' },
        { key: 'conjugation', name: '3. Conjugación', icon: Pencil, status: 'locked' },
        { key: 'exercise_1', name: '4. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'exercise_2', name: '5. Ejercicio 2', icon: ListChecks, status: 'locked' },
        { key: 'vocab_game', name: '6. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'exercise_3', name: '7. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '8. Lectura', icon: BookText, status: 'locked' },
        { key: 'exercise_4', name: '9. Ejercicio 4', icon: ListChecks, status: 'locked' },
        { key: 'complete', name: '10. Completar', icon: Trophy, status: 'locked' },
        { key: 'translate', name: '11. Traducir Texto', icon: MessageSquare, status: 'locked' },
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
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, targetStudentId, vocabAns, transText]);

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
        const nv = vocabData.map((item, idx) => {
            const isCorrect = item.es.toLowerCase() === (vocabAns[idx] || '').trim().toLowerCase();
            if (isCorrect) okCount++;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabVal(nv);
        if (okCount >= 10) { setCanAdvanceVocab(true); toast({ title: "¡Buen avance!" }); }
        else toast({ variant: 'destructive', title: "Necesitas 10 aciertos para avanzar." });
    };

    const handleCheckConj = () => {
        const v = conjugationVerbs[conjIdx];
        const corrects = v.forms;
        const nv = conjAns.map((a, i) => a.trim().toLowerCase() === corrects[i] ? 'correct' : 'incorrect');
        setConjVal(nv);
        if (nv.every(st => st === 'correct')) {
            toast({ title: "¡Perfecto!" });
            if (conjIdx < conjugationVerbs.length - 1) { setTimeout(() => { setConjIdx(p => p+1); setConjAns(Array(5).fill('')); setConjVal(Array(5).fill('unchecked')); }, 800); }
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
                        <CardHeader className='bg-primary/5 border-b'><CardTitle className="text-primary uppercase tracking-tighter">Vocabulario: Comunicación y Trabajo (20)</CardTitle><CardDescription className='font-bold text-foreground'>Escribe la traducción en español para cada palabra.</CardDescription></CardHeader>
                        <CardContent className="pt-6"><ScrollArea className="h-[450px] pr-4"><div className="grid grid-cols-2 gap-4">
                            <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Inglés</div><div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-xs">Español</div>
                            {vocabData.map((v, i) => (
                                <Fragment key={i}><div className="flex items-center font-bold py-1 text-sm text-foreground uppercase">{v.en}</div><Input value={vocabAns[i]} onChange={e => { const na = [...vocabAns]; na[i] = e.target.value; setVocabAns(na); const nv = [...vocabVal]; nv[i] = 'unchecked'; setVocabVal(nv); setCanAdvanceVocab(false); }} className={cn("h-10 uppercase", vocabVal[i] === 'correct' ? 'border-green-500' : vocabVal[i] === 'incorrect' ? 'border-red-500' : '')} autoComplete="off" readOnly={isAdmin && !!targetStudentId} /></Fragment>
                            ))}
                        </div></ScrollArea></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 bg-muted/20"><Button onClick={handleVocabCheck} variant="secondary">Verificar</Button><Button onClick={() => handleTopicCompleteInternal('vocabulary')} disabled={!canAdvanceVocab && !isAdmin} className='text-white font-bold'>Avanzar <ArrowRight className='ml-2'/></Button></CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <div className="space-y-6 text-left text-foreground">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-slate-100 dark:bg-slate-800/50 p-8 text-foreground overflow-hidden">
                            <CardHeader className='px-0 pb-6 border-b mb-6'><CardTitle className="text-3xl font-black text-primary uppercase">GRAMMÁTICA: DOBLE PRONOMBRE</CardTitle></CardHeader>
                            <CardContent className="space-y-8 px-0 font-bold">
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground">
                                    <h3 className="text-xl font-black text-primary uppercase mb-2">1. Combinando O.I. + O.D.</h3>
                                    <p>Cuando usamos dos pronombres juntos, el Objeto Indirecto (¿A quién?) siempre va PRIMERO que el Objeto Directo (¿Qué?).</p>
                                    <div className='bg-primary/10 p-4 rounded-xl border border-primary/20 font-mono text-xl text-center'>
                                        O.I. (me, te, nos, os, se) + O.D. (lo, la, los, las) + VERBO
                                    </div>
                                </div>
                                <div className="p-6 bg-white/60 dark:bg-background/20 rounded-[2rem] border shadow-sm space-y-4 text-foreground text-black">
                                    <h3 className="text-xl font-black text-brand-purple uppercase mb-2">2. El Cambio Crítico: LE/LES &rarr; SE</h3>
                                    <p>Si el pronombre indirecto es "le" o "les" y el directo es "lo, la, los, las", cambiamos el indirecto por <span className="text-primary font-black underline">SE</span> por eufonía (para que suene mejor).</p>
                                    <ul className="list-none space-y-2">
                                        <li className="flex items-center gap-2"><X className="text-red-500 h-5 w-5"/><span className="line-through text-black dark:text-white">Le lo doy</span></li>
                                        <li className="flex items-center gap-2"><Check className="text-green-500 h-5 w-5"/><span className="font-bold">Se lo doy</span> (A él/ella/usted)</li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-[2rem] border-2 border-dashed border-yellow-500/50 text-foreground text-black">
                                    <h3 className="text-xl font-black text-yellow-800 dark:text-yellow-200 uppercase mb-4 flex items-center gap-2"><Info /> Posiciones Comunes</h3>
                                    <p>1. Me lo compras (Antes del verbo conjugado).</p>
                                    <p>2. Quiero comprártelo (Después y pegado al infinitivo).</p>
                                    <p>3. Estoy comprándomelo (Después y pegado al gerundio - con tilde).</p>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => handleTopicCompleteInternal('grammar')} size="lg" className="px-24 font-black h-14 text-xl shadow-xl uppercase">Entendido</Button></CardFooter>
                        </Card>
                    </div>
                );
            case 'conjugation':
                const v = conjugationVerbs[conjIdx];
                const pronouns = ["YO", "TÚ", "ÉL", "NOSOTROS", "ELLOS"];
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader className='bg-primary/5 border-b'>
                            <div className="flex justify-between items-center text-foreground">
                                <CardTitle className='text-primary uppercase tracking-tighter'>Misión: Pasado Irregular ({conjIdx + 1}/15)</CardTitle>
                                <span className='font-bold text-muted-foreground uppercase'>{v.en}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="p-8 bg-gradient-to-br from-primary/5 to-brand-purple/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 text-center"><h3 className="text-5xl font-black text-primary uppercase tracking-tighter">{v.es}</h3></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mx-auto'>
                                {["YO", "TÚ", "ÉL/ELLA", "NOSOTROS", "ELLOS"].map((p, i) => (
                                    <div key={i} className='space-y-1'><Label className='text-[10px] font-black uppercase text-muted-foreground'>{p}</Label><Input value={conjAns[i]} onChange={e => { if (targetStudentId) return; const na = [...conjAns]; na[i] = e.target.value; setConjAns(na); const nv = [...conjVal]; nv[i] = 'unchecked'; setConjVal(nv); }} className={cn("h-10 text-lg uppercase text-foreground", conjVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : conjVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t p-8 bg-muted/5"><Button onClick={handleCheckConj} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase">Verificar Verbo</Button></CardFooter>
                    </Card>
                );
            case 'exercise_1': return <BallsExercise title="Ejercicio 1" prompts={ex1Prompts} onComplete={() => handleTopicCompleteInternal('exercise_1')} vocabulary={{"flowers": "flores", "report": "informe", "lend": "prestar", "deal": "trato", "wrap": "envolver"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'exercise_2': return <ChoiceExercise title="Ejercicio 2: Elección Gramatical" prompts={ex2Options} onComplete={() => handleTopicCompleteInternal('exercise_2')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'vocab_game': return <VocabularyMatchingGame data={vocabData.map(v => ({ spanish: v.es, english: [v.en] }))} onComplete={() => handleTopicCompleteInternal('vocab_game')} title="Double Pronoun Memory" />;
            case 'exercise_3': return <BallsExercise title="Ejercicio 3: Posiciones Mixtas" prompts={ex3Prompts} onComplete={() => handleTopicCompleteInternal('exercise_3')} vocabulary={{"wrap": "envolver", "discount": "descuento", "deliver": "entregar"}} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'reading':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary font-black uppercase'>{readingData.title}</CardTitle></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="p-6 bg-muted rounded-2xl border italic text-lg leading-relaxed shadow-inner text-foreground">{readingData.content}</div>
                            <Separator /><div className="space-y-4">{readingData.questions.map((q, i) => (
                                <div key={i} className="space-y-2"><Label className='font-bold'>{i+1}. {q.q}</Label>
                                <Input value={readAns[i] || ''} onChange={e => { if (targetStudentId) return; const na = [...readAns]; na[i] = e.target.value; setReadAns(na); const nv = [...readVal]; nv[i] = 'unchecked'; setReadVal(nv); }} className={cn('mt-1 text-lg h-12', readVal[i] === 'correct' ? 'border-green-500 bg-green-50/10' : readVal[i] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" readOnly={!!targetStudentId} /></div>
                            ))}</div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheckReading} size="lg" className="px-12 font-bold" disabled={!!targetStudentId}>Verificar Lectura</Button></CardFooter>
                    </Card>
                );
            case 'exercise_4': return <ChoiceExercise title="Ejercicio 4: Elige la opción correcta" prompts={ex4Options} onComplete={() => handleTopicCompleteInternal('exercise_4')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} />;
            case 'complete':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='text-primary uppercase tracking-tighter'>Completar: El Doble Pronombre (30)</CardTitle></CardHeader>
                        <CardContent className="p-0 text-foreground">
                            <ScrollArea className="h-[450px] p-6 text-foreground">
                                <div className="space-y-4">
                                    {completarPrompts.map((q, i) => (
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
                        <CardHeader><div className="flex justify-between items-start"><div><CardTitle className='text-primary uppercase'>Traducción de Texto: The Gift and the Report</CardTitle></div><Popover>
                                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0 text-foreground"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger>
                                    <PopoverContent className="w-64">
                                        <ScrollArea className="h-48 pr-4 text-foreground text-left">
                                            <div className="flex flex-col gap-2 text-xs">
                                                {Object.entries({ "necklace": "collar", "give it to her": "dárselo / se lo voy a dar", "already wrote it": "ya se la escribí", "didn't send it yet": "no se la he enviado todavía", "showing it to him": "mostrándoselo / se lo estoy mostrando", "fast": "rápido" }).map(([en, es], i) => (<div key={i} className="flex flex-col border-b pb-1 mb-1"><span className="text-muted-foreground font-semibold">{en}:</span><span className="font-bold text-primary">{es.toUpperCase()}</span></div>))}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover></div></CardHeader>
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
                            <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">Misión Final: Traducción Negativa</h2>
                            <p className="font-bold text-lg text-white">Traduce las frases negativas usando doble pronombre.</p>
                        </div>
                        <BallsExercise title="Final Challenge: Negatives" prompts={finalNegativePrompts} onComplete={() => handleTopicCompleteInternal('final')} isSupervisionMode={!!targetStudentId} isAdmin={isAdmin} vocabulary={{"wrap": "envolver", "offer": "ofrecer", "bring": "traer"}} />
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
                <p className="text-white font-bold tracking-widest animate-pulse uppercase">Sincronizando Misión B1...</p>
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
                           <Repeat className='h-10 w-10 text-primary' /> Doble Pronombre 🇪🇸 (B1)
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

export default function DoblePronombrePage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <DoblePronombreContentInternal />
        </Suspense>
    );
}