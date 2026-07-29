'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  PenSquare,
  Lock,
  GraduationCap,
  BrainCircuit,
  Hand,
  Clock,
  Globe,
  Trophy,
  CheckCircle,
  RefreshCw,
  Flame,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
  MessageSquare,
  Lightbulb,
  BookText,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getEnglishIntro2PathData, type EnglishIntro2PathItem } from '@/lib/course-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- CONSTANTS & DATA ---

const ICONS = {
  locked: Lock,
  active: BookOpen,
  completed: CheckCircle,
};

const progressStorageVersion = "eng_intro2_v40_stable_fixed";
const mainProgressKey = "intro2Progress";

const greetingsData = [
    { spanish: 'Hola', english: 'Hello' },
    { spanish: 'Hola (informal)', english: 'Hi' },
    { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' },
    { spanish: 'Buenas noches (al llegar)', english: 'Good evening' },
    { spanish: '¿Cómo estás?', english: 'How are you?' },
    { spanish: '¿Cómo te va?', english: "How's it going?" },
    { spanish: 'Mucho gusto', english: 'Nice to meet you' },
    { spanish: 'Es un placer conocerte', english: 'Pleased to meet you' },
    { spanish: '¿Qué tal?', english: "What's up?" },
];

const farewellsData = [
    { spanish: 'Adiós', english: 'Goodbye' },
    { spanish: 'Chao', english: 'Bye / Bye-bye' },
    { spanish: 'Hasta luego', english: 'See you later' },
    { spanish: 'Hasta pronto', english: 'See you soon' },
    { spanish: 'Buenas noches (al irse/dormir)', english: 'Good night' },
    { spanish: 'Cuídate', english: 'Take care' },
    { spanish: 'Que tengas un buen día', english: 'Have a nice day' },
    { spanish: 'Nos vemos mañana', english: 'See you tomorrow' },
    { spanish: 'Hablamos luego', english: 'Talk to you later' },
    { spanish: 'Te veo después', english: 'Catch you later' },
];

const timeExerciseData = [
  { time: '2:00', answers: ["it's two o'clock", "it is two o'clock"] },
  { time: '2:30', answers: ["it's half past two", "it is half past two"] },
  { time: '5:15', answers: ["it's a quarter past five", "it is a quarter past five"] },
  { time: '9:45', answers: ["it's a quarter to ten", "it is a quarter to ten"] },
  { time: '11:00', answers: ["it's eleven o'clock", "it is eleven o'clock"] },
  { time: '3:05', answers: ["it's five past three", "it is five past three"] },
  { time: '7:50', answers: ["it's ten to eight", "it is ten to eight"] },
  { time: '8:20', answers: ["it's twenty past eight", "it is twenty past eight"] },
  { time: '4:35', answers: ["it's twenty-five to five", "it is twenty five to five"] },
  { time: '1:55', answers: ["it's five to two", "it is five to two"] },
  { time: '10:30', answers: ["it's half past ten", "it is half past ten"] },
  { time: '12:15', answers: ["it's a quarter past twelve", "it is a quarter past twelve"] },
  { time: '3:45', answers: ["it's a quarter to four", "it is a quarter to four"] },
  { time: '6:20', answers: ["it's twenty past six", "it is twenty past six"] },
  { time: '9:50', answers: ["it's ten to ten", "it is ten to ten"] },
  { time: '11:30', answers: ["it's half past eleven", "it is half past eleven"] },
  { time: '1:00', answers: ["it's one o'clock", "it is one o'clock"] },
  { time: '4:00', answers: ["it's four o'clock", "it is four o'clock"] },
  { time: '7:00', answers: ["it's seven o'clock", "it is seven o'clock"] },
  { time: '10:20', answers: ["it's twenty past ten", "it is twenty past ten"] },
];

const countriesExerciseData = [
    { spanish: 'Canadá', country: 'Canada', nationality: 'Canadian', language: 'English' },
    { spanish: 'Estados Unidos', country: 'The United States', nationality: 'American', language: 'English' },
    { spanish: 'México', country: 'Mexico', nationality: 'Mexican', language: 'Spanish' },
    { spanish: 'Colombia', country: 'Colombia', nationality: 'Colombian', language: 'Spanish' },
    { spanish: 'Brasil', country: 'Brazil', nationality: 'Brazilian', language: 'Portuguese' },
    { spanish: 'Inglaterra', country: 'England', nationality: 'English', language: 'English' },
    { spanish: 'España', country: 'Spain', nationality: 'Spanish', language: 'Spanish' },
    { spanish: 'Portugal', country: 'Portugal', nationality: 'Portuguese', language: 'Portuguese' },
    { spanish: 'Francia', country: 'France', nationality: 'French', language: 'French' },
    { spanish: 'Italia', country: 'Italy', nationality: 'Italian', language: 'Italian' },
    { spanish: 'Holanda', country: 'Netherlands', nationality: 'Dutch', language: 'Dutch' },
    { spanish: 'Alemania', country: 'Germany', nationality: 'German', language: 'German' },
    { spanish: 'Rusia', country: 'Russia', nationality: 'Russian', language: 'Russian' },
    { spanish: 'China', country: 'China', nationality: 'Chinese', language: 'Chinese' },
    { spanish: 'Venezuela', country: 'Venezuela', nationality: 'Venezuelan', language: 'Spanish' },
    { spanish: 'Japon', country: 'Japan', nationality: 'Japanese', language: 'Japanese' },
];

const mixedExercise1Data = [
    { spanish: 'ELLOS NO SON TUS PADRES', answer: ['they are not your parents', "they aren't your parents"] },
    { spanish: 'ELLA NO ES ALTA (TALL)', answer: ['she is not tall', "she isn't tall"] },
    { spanish: 'ÉL ES JHON', answer: ['he is john', "he's john", 'he is jhon', "he's jhon"] },
    { spanish: 'NOSOTROS NO ESTAMOS OCUPADOS (BUSY)', answer: ['we are not busy', "we aren't busy"] },
    { spanish: '¿ESTÁS LIBRE? (FREE)', answer: ['are you free?'] },
    { spanish: 'ELLOS NO ESTÁN EN CASA (AT HOME)', answer: ['they are not at home', "they aren't at home"] },
    { spanish: '¿ELLA ES TU PRIMA? (COUSIN)', answer: ['is she your cousin?'] },
    { spanish: '¿ELLOS ESTÁN CASADOS? (MARRIED)', answer: ['are they married?'] },
    { spanish: 'ELLOS ESTÁN EN EL TRABAJO (AT WORK)', english: ['they are at work', "they're at work"] },
    { spanish: 'NOSOTROS NO SOMOS ESTUDIANTES: (STUDENTS)', english: ['we are not students', "we aren't students"] },
    { spanish: '¿ELLOS SON TUS PRIMOS? (COUSINS)', english: ['are they your cousins?'] },
    { spanish: '¿TU MAMA ES ENFERMERA? (NURSE)', english: ['is your mother a nurse?', 'is your mom a nurse?'] },
];

const mixedExercise2Data = [
    { spanish: '¿ellos son tus profesores?', answer: ['are they your teachers?'] },
    { spanish: '¿él está en su carro? (de él)', answer: ['is he in his car?'] },
    { spanish: '¿eres su amiga? (de ella)', answer: ['are you her friend?'] },
    { spanish: 'esta (this) no es su universidad (de ellos)', answer: ['this is not their university', "this isn't their university"] },
    { spanish: '¿estás con su tio? (de él) (uncle)', answer: ['are you with his uncle?'] },
    { spanish: '¿ella es tu novia? (girlfriend)', answer: ['is she your girlfriend?'] },
    { spanish: 'nosotros somos tus amigos', answer: ['we are your friends', "we're your friends"] },
    { spanish: 'mi madre es vendedora (seller)', answer: ['my mother is a seller', 'my mom is a seller'] },
    { spanish: 'los hombres están en el restaurante', english: ['the men are in the restaurant', "the men're in the restaurant"] },
    { spanish: 'mi hermana es profesora de alemán', english: ['my sister is a German teacher', "my sister's a German teacher"] },
    { spanish: 'su novio no está en el trabajo (su: de ella)', english: ['her boyfriend is not at work', "her boyfriend isn't at work"] },
    { spanish: 'nuestros padres son amables (kind)', english: ['our parents are kind', 'our parents are nice'] },
    { spanish: 'tu hijo es un hombre de negocios (businessman)', english: ['your son is a businessman', "your son's a businessman"] },
];

const mixed1Vocab = { "padres": "parents", "alto": "tall", "ocupado": "busy", "libre": "free", "en casa": "at home", "prima": "cousin", "casados": "married" };
const mixed2Vocab = { "profesores": "teachers", "carro": "car", "amiga": "friend", "universidad": "university", "tio": "uncle", "novia": "girlfriend", "amigo" : "friend" , "vendedora": "seller" , "hombres" : "men" , "restaurante": "restaurant", "alemán": "German", "novio": "boyfriend", "trabajo": "work", "amables": "kind", "hijo": "son", "hombre de negocios": "businessman" };

// --- SUB-COMPONENTS ---

const TipContent = ({ onComplete }: { onComplete: () => void }) => (
    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
        <CardHeader>
            <CardTitle>Tip Importante</CardTitle>
            <CardDescription>Conceptos clave de gramática para tu aventura.</CardDescription>
        </CardHeader>
        <CardContent>
             <Accordion type="multiple" className="w-full space-y-4" defaultValue={['sustantivo', 'adjetivo', 'verbo', 'pronombres']}>
                <AccordionItem value="sustantivo">
                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Sustantivo (Noun)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="font-semibold">PERSONA, ANIMAL O COSA (singular- plural)</p>
                        <div>
                            <h4 className="font-medium text-primary">REGULAR: noun+ s</h4>
                            <p className="font-mono text-sm bg-muted p-2 rounded-md mt-1">computer: computers // house: houses // car: cars</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-primary">IRREGULAR: noun+es</h4>
                            <ul className="list-disc pl-5 mt-1 space-y-2 text-sm">
                                <li>For nouns ending {`=>`} s, z, sh, ch, x (bus) = “ES”<br/><span className="font-mono bg-muted px-2 py-1 rounded">Ex: address: Addresses // beach: beaches // bus: buses</span></li>
                                <li>For nouns ending {`=>`} “Y” cancelamos la “Y” agregamos “ies”<br/><span className="font-mono bg-muted px-2 py-1 rounded">Ex: country: countries // university: universities</span></li>
                                <li>Completamente irregular:<br/><span className="font-mono bg-muted px-2 py-1 rounded">Man: men // woman: women // child: children // person: people</span></li>
                            </ul>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="adjetivo">
                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Adjetivo (Adjective)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                         <p className="font-semibold text-foreground">DESCRIBE EL SUSTANTIVO (COLOR, CUALIDAD, CARACTERISTICA.) –(los adjetivos siempre van en singular es decir en su forma original)</p>
                         <Card className="bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500">
                             <CardHeader>
                                 <CardTitle className="text-yellow-800 dark:text-yellow-300 text-lg">NOTAS IMPORTANTES</CardTitle>
                             </CardHeader>
                             <CardContent className="text-sm space-y-3 text-black dark:text-white">
                                 <p><strong>En español:</strong> sustantivo + adjetivo.<br/><span className="font-mono text-muted-foreground">Ejemplo: El carro blanco, el lapicero azul, el computador gris</span></p>
                                 <p><strong>En INGLÉS:</strong> adjetivo + sustantivo.<br/><span className="font-mono text-muted-foreground">Examples: El carro blanco : the white car, El lapicero rojo : The red pen, el computador gris : the grey computer</span></p>
                             </CardContent>
                         </Card>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="verbo">
                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Verbo (Verb)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <p className="font-semibold">VERB: ACCIÓN.</p>
                        <div>
                            <h4 className="font-medium text-primary">VERBOS INFINITIVO = "TO"</h4>
                            <p className="text-sm text-muted-foreground">Un verbo en infinitivo es un verbo que no está conjugado.</p>
                            <p className="font-mono text-sm bg-muted p-2 rounded-md mt-1">
                                {'ESPAÑOL => ENGLISH'}<br/>
                                {'AR = Hablar = TO speak'}<br/>
                                {'ER = Comer = TO eat'}<br/>
                                {'IR = Vivir = TO Live'}
                            </p>
                        </div>
                         <div>
                            <h4 className="font-medium text-primary">CONJUGACIÓN</h4>
                            <p className="text-sm text-muted-foreground">Cuando estamos utilizando la conjugación el verbo pierde la palabra = "To"</p>
                            <p className="font-mono bg-muted p-2 rounded-md mt-1 text-sm">
                              pronombre + verbo (yo hablo) {'=>'} i + speak<br/>
                              i to speak = yo hablar
                            </p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pronombres">
                    <AccordionTrigger className="text-xl font-bold uppercase text-primary">Pronombres (Pronouns)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                         <p className="font-semibold">Muchas frases no tienen pronombres, entonces las frases pueden TENER:</p>
                         <ul className="list-disc pl-5 text-sm space-y-1">
                             <li><strong>Nombre propio:</strong> Viviana, Edna, Ana, Cristal</li>
                             <li><strong>Sustantivo:</strong> (persona, animal, cosa) {`=>`} carro, casa, finca</li>
                             <li><strong>Demostrativos:</strong> This – these – that – those</li>
                         </ul>
                         <p className="font-mono bg-muted p-2 rounded-md mt-1 text-sm">
                            {'he is at home => pronoun'}<br/>
                            {'Thomas is at home => Nombre propio'}<br/>
                            {'my father is at home => Sustantivo'}<br/>
                            esta es mi casa  = this is my house {'=>'} Demostrativo
                        </p>
                          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-md">
                            <X className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-500"/>
                            <div className="text-sm">
                                <h4 className="font-bold text-red-600">¡NUNCA!</h4>
                                <p>Nunca se pueden utilizar un pronombre con un sustantivo o un pronombre con un nombre propio al mismo tiempo.</p>
                                <p className="font-mono text-xs mt-1 text-muted-foreground">Incorrecto: Thomas he is at home (Thomas él está en la casa)<br/>Incorrecto: he my father is at home (él mi padre está en la casa)</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
        <CardFooter>
            <Button onClick={onComplete} className="w-full sm:w-auto font-bold h-12 px-12">Avanzar <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </CardFooter>
    </Card>
);

const GreetingsFarewellsContent = ({ title, data, onComplete }: { title: string; data: { spanish: string, english: string }[], onComplete: () => void }) => (
    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="font-bold">Español</TableHead><TableHead className="font-bold">Inglés</TableHead></TableRow></TableHeader>
                <TableBody>
                    {data.map((item, index) => (
                        <TableRow key={index} className="hover:bg-muted/30">
                            <TableCell className="font-medium">{item.spanish}</TableCell>
                            <TableCell className="font-bold text-primary">{item.english}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter>
            <Button onClick={onComplete} className="w-full sm:w-auto h-12 px-12 font-bold">Avanzar <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </CardFooter>
    </Card>
);

const MemoryGame = ({ data, onComplete }: { data: { spanish: string; english: string; }[], onComplete: () => void }) => {
    const { toast } = useToast();
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => { setIsClient(true); }, []);

    const initializeGame = useCallback(() => {
        const gameCards = data.flatMap((pair, index) => [
            { id: index * 2, pairId: index, text: pair.english },
            { id: index * 2 + 1, pairId: index, text: pair.spanish },
        ]).sort(() => Math.random() - 0.5);
        
        setCards(gameCards);
        setFlippedIndices([]);
        setMatchedPairIds([]);
        setIsChecking(false);
        setStreak(0);
    }, [data]);

    useEffect(() => { if (isClient) initializeGame(); }, [isClient, initializeGame]);
    
    useEffect(() => {
        if (flippedIndices.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flippedIndices;
            if (cards[firstIndex].pairId === cards[secondIndex].pairId) {
                setMatchedPairIds(prev => [...prev, cards[firstIndex].pairId]);
                setStreak(prev => prev + 1);
                setFlippedIndices([]);
                setIsChecking(false);
                toast({ title: "¡Pareja encontrada!" });
            } else {
                setStreak(0);
                setTimeout(() => { setFlippedIndices([]); setIsChecking(false); }, 800);
            }
        }
    }, [flippedIndices, cards, toast]);

    const isGameComplete = matchedPairIds.length === data.length && data.length > 0;
    useEffect(() => { if (isGameComplete) onComplete(); }, [isGameComplete, onComplete]);

    const handleCardClick = (index: number) => {
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) return;
        setFlippedIndices(prev => [...prev, index]);
    };

    if (!isClient) return null;

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Memory (Greetings & Farewells)</CardTitle>
                    <CardDescription>Empareja el saludo en español con su traducción.</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-orange-500 font-bold"><Flame className="h-5 w-5" /><span>{streak}</span></div>
                    <Button size="icon" variant="ghost" onClick={initializeGame}><RefreshCw className="h-5 w-5" /></Button>
                </div>
            </CardHeader>
            <CardContent>
                {isGameComplete ? (
                     <div className="text-center p-8 flex flex-col items-center"><Trophy className="h-16 w-16 text-yellow-400 mb-4" /><h2 className="text-2xl font-bold">¡Juego Completado!</h2></div>
                ) : (
                    <div className="grid grid-cols-4 gap-2">
                        {cards.map((card, index) => {
                            const isFlipped = flippedIndices.includes(index);
                            const isMatched = matchedPairIds.includes(card.pairId);
                            return (
                                <div key={card.id} onClick={() => handleCardClick(index)}
                                    className={cn("flex items-center justify-center aspect-square cursor-pointer transition-all border-2 rounded-xl text-center p-1", isFlipped || isMatched ? "bg-card border-primary" : "bg-secondary hover:bg-muted", isMatched && "border-green-500")}>
                                    {isFlipped || isMatched ? <span className="text-[10px] sm:text-xs font-bold leading-tight uppercase">{card.text}</span> : <BrainCircuit className="h-5 w-5 text-primary/50" />}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const TimeContent = ({ onComplete }: { onComplete: () => void }) => {
    const timeImage = PlaceHolderImages.find(p => p.id === 'telling-time');
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <CardTitle>La Hora - How to tell the time</CardTitle>
                <CardDescription>Aprende a decir la hora de forma completa y sencilla.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex justify-center">{timeImage && <Image src={timeImage.imageUrl} alt={timeImage.description} width={450} height={450} className="rounded-lg shadow-md border" data-ai-hint={timeImage.imageHint} />}</div>
                <Separator /><div className="space-y-4 text-left"><h3 className="text-2xl font-bold text-primary flex items-center gap-2"><Clock className="h-6 w-6" /> ¿Cómo funciona?</h3><p className="text-lg">Para decir la hora en inglés, siempre empezamos con la frase <strong>"It is"</strong> o la contracción <strong>"It's"</strong>.</p><div className="p-4 bg-muted rounded-lg font-mono text-lg border-l-4 border-primary"><p>Ejemplo: 8:00 {"=>"} It is eight o'clock.</p></div></div>
                <div className="grid md:grid-cols-2 gap-6 text-left"><div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-blue-200"><h4 className="text-xl font-bold text-blue-600 mb-2">Usamos "PAST"</h4><p className="text-sm mb-4 text-muted-foreground font-medium">Para los minutos del <strong>1 al 30</strong>. Significa "pasadas las...".</p><div className="space-y-2 font-mono text-sm"><p>2:10 {"=>"} Ten <strong>past</strong> two</p><p>5:20 {"=>"} Twenty <strong>past</strong> five</p></div></div><div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border-2 border-orange-200"><h4 className="text-xl font-bold text-orange-600 mb-2">Usamos "TO"</h4><p className="text-sm mb-4 text-muted-foreground font-medium">Para los minutos del <strong>31 al 59</strong>. Significa "para las...".</p><div className="space-y-2 font-mono text-sm"><p>2:50 {"=>"} Ten <strong>to</strong> three</p><p>8:40 {"=>"} Twenty <strong>to</strong> nine</p></div></div></div>
                <div className="space-y-4 text-left"><h4 className="text-xl font-bold uppercase">Palabras Especiales:</h4><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="p-3 bg-secondary rounded-xl text-center"><p className="font-bold text-primary">o'clock</p><p className="text-xs text-muted-foreground">En punto (:00)</p></div><div className="p-3 bg-secondary rounded-xl text-center"><p className="font-bold text-primary">quarter past</p><p className="text-xs text-muted-foreground">Y cuarto (:15)</p></div><div className="p-3 bg-secondary rounded-xl text-center"><p className="font-bold text-primary">half past</p><p className="text-xs text-muted-foreground">Y media (:30)</p></div><div className="p-3 bg-secondary rounded-xl text-center"><p className="font-bold text-primary">quarter to</p><p className="text-xs text-muted-foreground">Menos cuarto (:45)</p></div></div></div>
            </CardContent>
            <CardFooter><Button onClick={onComplete} className="w-full sm:w-auto h-12 px-12 font-bold">Avanzar <ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter>
        </Card>
    );
};

const TimeExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const currentPrompt = timeExerciseData[currentIndex];

    const handleCheck = () => {
        const userVal = (userAnswers[currentIndex] || '').trim().toLowerCase().replace(/[.?,]/g, '');
        const isOk = currentPrompt.answers.some(ans => ans.toLowerCase().replace(/[.?,]/g, '') === userVal);
        setValidationStatus(prev => ({ ...prev, [currentIndex]: isOk ? 'correct' : 'incorrect' }));
        if (isOk) toast({ title: '¡Correcto!' }); else toast({ variant: 'destructive', title: 'Incorrecto' });
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader><CardTitle>Ejercicios Hora</CardTitle><div className="flex flex-wrap gap-2 pt-4">{timeExerciseData.map((_, i) => (<button key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 font-bold transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStatus[i] === 'correct' ? "bg-green-500 text-white border-green-500" : validationStatus[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</button>))}</div></CardHeader>
            <CardContent className="space-y-6"><div className="text-center py-8 bg-muted rounded-lg border"><p className="text-sm text-muted-foreground mb-1 font-bold">Escribe la traducción de:</p><p className="text-5xl font-bold font-mono tracking-tighter text-primary">{currentPrompt.time}</p></div><Input value={userAnswers[currentIndex] || ''} onChange={e => { setUserAnswers({...userAnswers, [currentIndex]: e.target.value}); setValidationStatus({...validationStatus, [currentIndex]: 'unchecked'}); }} onKeyDown={e => e.key === 'Enter' && handleCheck()} placeholder="It's..." className="h-12 text-lg uppercase" autoComplete="off" /></CardContent>
            <CardFooter className="justify-between"><Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button><div className="flex gap-2"><Button onClick={handleCheck} variant="secondary">Verificar</Button><Button onClick={() => currentIndex < timeExerciseData.length - 1 ? setCurrentIndex(p => p + 1) : onComplete()} disabled={validationStatus[currentIndex] !== 'correct'} className="font-bold">Siguiente</Button></div></CardFooter>
        </Card>
    );
};

const SimpleExercise = ({ title, exerciseData, onComplete, vocabulary }: { title: string; exerciseData: { spanish: string, answer: string[] }[], onComplete: () => void, vocabulary?: Record<string, string> }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(exerciseData.length).fill(''));
    const [validationStates, setValidationStates] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(exerciseData.length).fill('unchecked'));

    const handleCheck = () => {
        const userVal = (userAnswers[currentIndex] || '').trim().toLowerCase().replace(/[.?,]/g, '').replace(/\s+/g, ' ');
        const currentPrompt = exerciseData[currentIndex];
        const isOk = currentPrompt.answer.some(ans => ans.toLowerCase().replace(/[.?,]/g, '').replace(/\s+/g, ' ') === userVal);
        const newStates = [...validationStates]; newStates[currentIndex] = isOk ? 'correct' : 'incorrect'; setValidationStates(newStates);
        if (isOk) toast({ title: '¡Correcto!' }); else toast({ variant: 'destructive', title: 'Incorrecto' });
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="w-full">
                        <CardTitle>{title}</CardTitle>
                        <div className="flex flex-wrap gap-2 pt-4">{exerciseData.map((_, i) => (<button key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 font-bold transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStates[i] === 'correct' ? "bg-green-500 text-white border-green-500" : validationStates[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</button>))}</div>
                    </div>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild><Button variant="outline" size="sm" className='border-brand-blue border-2 animate-border-pulse shrink-0'><BookText className="mr-2 h-4 w-4" /> Vocabulary</Button></PopoverTrigger>
                            <PopoverContent className="w-64">
                                <ScrollArea className="h-40 pr-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground text-left">
                                        {Object.entries(vocabulary).map(([es, en]: any) => (<React.Fragment key={es}><span className="text-muted-foreground capitalize">{es}:</span><span className="font-semibold text-right">{en}</span></React.Fragment>))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4"><div className="p-6 bg-muted rounded-2xl border-2 border-dashed font-bold text-xl uppercase tracking-tighter text-foreground text-center">"{exerciseData[currentIndex].spanish}"</div><Input value={userAnswers[currentIndex]} onChange={e => { const na = [...userAnswers]; na[currentIndex] = e.target.value; setUserAnswers(na); const nv = [...validationStates]; nv[currentIndex] = 'unchecked'; setValidationStates(nv); }} onKeyDown={e => e.key === 'Enter' && handleCheck()} placeholder="Tu traducción en inglés..." className={cn("h-12 text-lg uppercase", validationStates[currentIndex] === 'correct' ? 'border-green-500 bg-green-50/10' : validationStates[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></CardContent>
            <CardFooter className="justify-between border-t pt-6"><Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button><div className="flex gap-2"><Button onClick={handleCheck} variant="secondary">Verificar</Button><Button onClick={() => currentIndex < exerciseData.length - 1 ? setCurrentIndex(p => p + 1) : onComplete()} disabled={validationStates[currentIndex] !== 'correct'} className="font-bold">Siguiente</Button></div></CardFooter>
        </Card>
    );
};

const CountriesExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
    const [validation, setValidation] = useState<Record<number, any>>({});
    const [finished, setFinished] = useState(false);

    const handleCheck = () => {
        let allOk = true; const nv: any = {};
        countriesExerciseData.forEach((data, i) => {
            const user = userAnswers[i] || { country: '', nationality: '', language: '' };
            const cOk = user.country?.trim().toLowerCase() === data.country.toLowerCase();
            const nOk = user.nationality?.trim().toLowerCase() === data.nationality.toLowerCase();
            const lOk = user.language?.trim().toLowerCase() === data.language.toLowerCase();
            nv[i] = { country: cOk ? 'correct' : 'incorrect', nationality: nOk ? 'correct' : 'incorrect', language: lOk ? 'correct' : 'incorrect' };
            if (!cOk || !nOk || !lOk) allOk = false;
        });
        setValidation(nv);
        if (allOk) { toast({ title: "¡Excelente!", description: "Misión cumplida." }); setFinished(true); onComplete(); }
        else toast({ variant: 'destructive', title: "Revisa los campos en rojo" });
    };

    if (finished) return (<Card className="p-12 text-center flex flex-col items-center animate-in fade-in zoom-in duration-500 border-2 border-green-500 bg-card/95"><Trophy className="h-24 w-24 text-yellow-400 mb-6 animate-bounce" /><h2 className="text-4xl font-black uppercase text-primary tracking-tighter">Congratulations!</h2><p className="text-2xl mt-4 font-bold text-foreground">¡Has terminado Intro 2!</p><p className='text-muted-foreground mt-2 text-lg'>Desbloqueaste el Quiz 2 en tu laberinto.</p></Card>);

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader><CardTitle>Países y Nacionalidades</CardTitle><CardDescription>Completa la tabla traduciendo los términos al inglés.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto"><Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="font-bold">Países (Español)</TableHead><TableHead className="font-bold">Country (Inglés)</TableHead><TableHead className="font-bold">Nationality</TableHead><TableHead className="font-bold">Language</TableHead></TableRow></TableHeader>
                <TableBody>{countriesExerciseData.map((data, i) => (<TableRow key={i}>
                    <TableCell className="font-bold text-sm">{data.spanish}</TableCell>
                    <TableCell><Input value={userAnswers[i]?.country || ''} onChange={e => setUserAnswers({...userAnswers, [i]: {...(userAnswers[i] || {}), country: e.target.value}})} className={cn("h-8 text-xs uppercase", validation[i]?.country === 'correct' ? 'border-green-500 bg-green-50/10' : validation[i]?.country === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></TableCell>
                    <TableCell><Input value={userAnswers[i]?.nationality || ''} onChange={e => setUserAnswers({...userAnswers, [i]: {...(userAnswers[i] || {}), nationality: e.target.value}})} className={cn("h-8 text-xs uppercase", validation[i]?.nationality === 'correct' ? 'border-green-500 bg-green-50/10' : validation[i]?.nationality === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></TableCell>
                    <TableCell><Input value={userAnswers[i]?.language || ''} onChange={e => setUserAnswers({...userAnswers, [i]: {...(userAnswers[i] || {}), language: e.target.value}})} className={cn("h-8 text-xs uppercase", validation[i]?.language === 'correct' ? 'border-green-500 bg-green-50/10' : validation[i]?.language === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></TableCell>
                </TableRow>))}</TableBody>
            </Table></CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheck} size="lg" className="px-16 font-bold h-12 uppercase tracking-tighter">Verificar Misión</Button></CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

export default function EnglishIntro2Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<EnglishIntro2PathItem[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    useEffect(() => { setIsClient(true); }, []);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    const initialLearningPath = useMemo(() => getEnglishIntro2PathData(t), [t]);

    const handleTopicComplete = useCallback((key: string) => { setTopicToComplete(key); }, []);

    useEffect(() => {
        if (!isClient || isUserLoading || isProfileLoading || initialLoadComplete || !initialLearningPath.length) return;
        let path = initialLearningPath.map((item, i) => ({ ...item, status: (i === 0 ? 'active' : 'locked') as any }));
        const d = studentProfile?.lessonProgress?.[progressStorageVersion] || {};
        if (isAdmin) path.forEach(t => t.status = 'completed');
        else {
            path.forEach(t => { if (d[t.key]) t.status = d[t.key]; });
            let last = true;
            for (let i = 0; i < path.length; i++) { if (last && path[i].status === 'locked') path[i].status = 'active'; last = path[i].status === 'completed'; }
        }
        setLearningPath(path); setSelectedTopic(d.lastSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading, isClient, initialLoadComplete, t]);

    const progressValue = useMemo(() => {
        const comp = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((comp / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!isClient || isProfileLoading || !learningPath.length || isAdmin || !studentDocRef) return;
        const statuses: any = learningPath.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
        statuses.lastSelectedTopic = selectedTopic;
        updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: statuses, [`progress.${mainProgressKey}`]: progressValue });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, isAdmin, isClient, studentDocRef, isProfileLoading, selectedTopic]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(prev => {
            const np = [...prev]; const i = np.findIndex(t => t.key === topicToComplete);
            if (i !== -1 && np[i].status !== 'completed') {
                np[i].status = 'completed';
                if (i + 1 < np.length && np[i + 1].status === 'locked') {
                    np[i + 1].status = 'active'; setSelectedTopic(np[i + 1].key);
                    toast({ title: "¡Tema desbloqueado!" });
                }
            }
            return np;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        if (!isAdmin && topic?.status === 'locked') { toast({ variant: 'destructive', title: 'Contenido Bloqueado' }); return; }
        setSelectedTopic(topicKey);
    };

    const renderContent = () => {
        switch (selectedTopic) {
          case 'tip': return <TipContent onComplete={() => handleTopicComplete('tip')} />;
          case 'mixed1': return <SimpleExercise title="Ejercicios Mixtos 1" exerciseData={mixedExercise1Data} onComplete={() => handleTopicComplete('mixed1')} vocabulary={mixed1Vocab} />;
          case 'greetings': return <GreetingsFarewellsContent title="Saludos" data={greetingsData} onComplete={() => handleTopicComplete('greetings')} />;
          case 'farewells': return <GreetingsFarewellsContent title="Despedidas" data={farewellsData} onComplete={() => handleTopicComplete('farewells')} />;
          case 'memory': return <MemoryGame data={[...greetingsData.slice(0, 5), ...farewellsData.slice(0, 5)]} onComplete={() => handleTopicComplete('memory')} />;
          case 'mixed2': return <SimpleExercise title="Ejercicios Mixtos 2" exerciseData={mixedExercise2Data} onComplete={() => handleTopicComplete('mixed2')} vocabulary={mixed2Vocab} />;
          case 'time': return <TimeContent onComplete={() => handleTopicComplete('time')} />;
          case 'time-exercise': return <TimeExercise onComplete={() => handleTopicComplete('time-exercise')} />;
          case 'countries': return <CountriesExercise onComplete={() => handleTopicComplete('countries')} />;
          default: return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" /></div>;
        }
    };

    if (!isClient) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg text-foreground">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8"><div className="max-w-7xl mx-auto"><div className="mb-8 text-left text-white"><Link href={`/intro`} className="hover:underline text-sm font-bold flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver al Laberinto</Link><h1 className="text-4xl font-bold uppercase tracking-tighter [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">English Intro 2</h1></div><div className="grid gap-8 md:grid-cols-12"><div className="md:col-span-9 md:order-1 order-2">{renderContent()}</div><div className="md:col-span-3 md:order-2 order-1 text-left"><Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b bg-muted/30"><CardTitle className="text-lg font-black text-primary uppercase flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Misión 2E</CardTitle></CardHeader>
            <CardContent className="p-4"><nav><ul className="space-y-1">{learningPath.map(item => { const StatusIcon = ICONS[item.status] || BookOpen; return (<li key={item.key} onClick={() => handleTopicSelect(item.key)} className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', item.status === 'locked' && !isAdmin ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm')}><div className="flex items-center gap-3"><StatusIcon className={cn("h-5 w-5", item.status === 'completed' && "text-green-500", item.status === 'locked' && "text-yellow-500")} /> <span className="truncate max-w-[150px] text-xs font-bold uppercase">{item.name}</span></div>{item.status === 'locked' && !isAdmin && <Lock className="h-3 w-3 text-yellow-500/30" />}</li>); })}</ul></nav><div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Progreso</span><span className="text-primary font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div></CardContent></Card></div></div></div></main>
        </div>
    );
}
