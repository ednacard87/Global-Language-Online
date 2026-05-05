'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  ArrowRight,
  X,
  MessageSquare,
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
import { getKidsIntro2PathData, type KidsIntro2PathItem } from '@/lib/course-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- Data ---

const progressStorageVersion = "kids_intro2_path_v13_stable";

const greetingsData = [
    { spanish: 'Hola', english: 'Hello' },
    { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' },
    { spanish: 'Buenas noches (al llegar)', english: 'Good evening' },
    { spanish: '¿Cómo estás?', english: 'How are you?' },
    { spanish: '¿Qué tal?', english: "What's up?" },
];

const farewellsData = [
    { spanish: 'Adiós', english: 'Goodbye' },
    { spanish: 'Chao', english: 'Bye' },
    { spanish: 'Hasta luego', english: 'See you later' },
    { spanish: 'Hasta pronto', english: 'See you soon' },
    { spanish: 'Buenas noches (al irse)', english: 'Good night' },
    { spanish: 'Cuídate', english: 'Take care' },
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
];

const countriesExerciseData = [
    { spanish: 'Colombia', country: 'Colombia', nationality: 'Colombian', language: 'Spanish' },
    { spanish: 'Estados Unidos', country: 'United States', nationality: 'American', language: 'English' },
    { spanish: 'Canada', country: 'Canada', nationality: 'Canadian', language: 'English' },
    { spanish: 'Mexico', country: 'Mexico', nationality: 'Mexican', language: 'Spanish' },
    { spanish: 'Francia', country: 'France', nationality: 'French', language: 'French' },
    { spanish: 'Italia', country: 'Italy', nationality: 'Italian', language: 'Italian' },
    { spanish: 'España', country: 'Spain', nationality: 'Spanish', language: 'Spanish' },
    { spanish: 'Rusia', country: 'Russia', nationality: 'Russian', language: 'Russian' },
    { spanish: 'China', country: 'China', nationality: 'Chinese', language: 'Chinese' },
    { spanish: 'Japon', country: 'Japan', nationality: 'Japanese', language: 'Japanese' },
];

const mixedExercise1Data = [
    { spanish: "Este (This) es un buen libro", answer: ["this is a good book"] },
    { spanish: "Esa (That) es mi casa", answer: ["that is my house"] },
    { spanish: "Estos (These) son tus zapatos", answer: ["these are your shoes"] },
    { spanish: "Esos (Those) son nuestros amigos", answer: ["those are our friends"] },
];

const mixedExercise2Data = [
    { spanish: "¿Cómo estás hoy?", answer: ["how are you today?"] },
    { spanish: "Hasta mañana, profesor", answer: ["see you tomorrow, teacher"] },
    { spanish: "Mi amigo es de Canada", answer: ["my friend is from canada"] },
    { spanish: "Son las diez y cuarto", answer: ["it's a quarter past ten", "it is a quarter past ten"] },
];

// --- Auxiliary Components ---

const TipContent = ({ onComplete }: { onComplete: () => void }) => (
    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
        <CardHeader>
            <CardTitle>Tip Importante</CardTitle>
            <CardDescription>Conceptos clave de gramática.</CardDescription>
        </CardHeader>
        <CardContent>
             <Accordion type="multiple" className="w-full space-y-4" defaultValue={['sustantivo', 'adjetivo', 'verbo', 'pronombres']}>
                <AccordionItem value="sustantivo">
                    <AccordionTrigger className="text-xl font-bold">SUSTANTIVO (NOUN)</AccordionTrigger>
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
                    <AccordionTrigger className="text-xl font-bold">ADJETIVO (ADJECTIVE)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                         <p className="font-semibold">DESCRIBE EL SUSTANTIVO (COLOR, CUALIDAD, CARACTERISTICA.) –(los adjetivos siempre van en singular es decir en su forma original)</p>
                         <Card className="bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500">
                             <CardHeader>
                                 <CardTitle className="text-yellow-800 dark:text-yellow-300 text-lg">NOTAS IMPORTANTES</CardTitle>
                             </CardHeader>
                             <CardContent className="text-sm space-y-3">
                                 <p><strong className="text-foreground">En español:</strong> sustantivo + adjetivo.<br/><span className="font-mono text-muted-foreground">Ejemplo: El carro blanco, el lapicero azul, el computador gris</span></p>
                                 <p><strong className="text-foreground">En INGLÉS:</strong> adjetivo + sustantivo.<br/><span className="font-mono text-muted-foreground">Examples: El carro blanco : the white car, El lapicero rojo : The red pen, el computador gris : the grey computer</span></p>
                             </CardContent>
                         </Card>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="verbo">
                    <AccordionTrigger className="text-xl font-bold">VERBO (VERB)</AccordionTrigger>
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
                    <AccordionTrigger className="text-xl font-bold">PRONOMBRES (PRONOUNS)</AccordionTrigger>
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
                          <div className="flex items-start gap-2 p-2 bg-destructive/10 border-l-4 border-destructive text-foreground rounded-r-md">
                            <X className="h-5 w-5 mt-0.5 flex-shrink-0"/>
                            <div>
                                <h4 className="font-bold">¡NUNCA!</h4>
                                <p className="text-sm">Nunca se pueden utilizar un pronombre con un sustantivo o un pronombre con un nombre propio al mismo tiempo.</p>
                                <p className="font-mono text-xs mt-1">Incorrecto: Thomas he is at home (Thomas él está en la casa)<br/>Incorrecto: he my father is at home (él mi padre está en la casa)</p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
        <CardFooter>
            <Button onClick={onComplete} className="w-full sm:w-auto">Avanzar</Button>
        </CardFooter>
    </Card>
);

const GreetingsFarewellsContent = ({ title, data, onComplete }: { title: string; data: { spanish: string, english: string }[], onComplete: () => void }) => (
    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Español</TableHead><TableHead>Inglés</TableHead></TableRow></TableHeader>
                <TableBody>
                    {data.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.spanish}</TableCell>
                            <TableCell>{item.english}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter>
            <Button onClick={onComplete} className="w-full sm:w-auto">Avanzar</Button>
        </CardFooter>
    </Card>
);

const MemoryGame = ({ data, onComplete }: { data: { spanish: string; english: string; }[], onComplete: () => void }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [hasNotifiedComplete, setHasNotifiedComplete] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

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
        setHasNotifiedComplete(false);
    }, [data]);

    useEffect(() => {
        if (isClient) {
            initializeGame();
        }
    }, [isClient, initializeGame]);
    
    useEffect(() => {
        if (flippedIndices.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flippedIndices;
            const isMatch = cards[firstIndex].pairId === cards[secondIndex].pairId;

            if (isMatch) {
                setMatchedPairIds(prev => [...prev, cards[firstIndex].pairId]);
                setStreak(prev => prev + 1);
                setFlippedIndices([]);
                setIsChecking(false);
            } else {
                setStreak(0);
                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 800);
            }
        }
    }, [flippedIndices, cards]);

    const isGameComplete = matchedPairIds.length === data.length && data.length > 0;

    useEffect(() => {
        if (isGameComplete && !hasNotifiedComplete) {
            onComplete();
            setHasNotifiedComplete(true);
        }
    }, [isGameComplete, onComplete, hasNotifiedComplete]);

    const handleCardClick = (index: number) => {
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) {
            return;
        }
        setFlippedIndices(prev => [...prev, index]);
    };

    if (!isClient) return null;

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Memory (Greetings & Farewells)</CardTitle>
                    <CardDescription>Empareja el saludo en español con su traducción.</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-orange-500 font-bold">
                        <Flame className="h-5 w-5" />
                        <span>{streak}</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={initializeGame}><RefreshCw className="h-5 w-5" /></Button>
                </div>
            </CardHeader>
            <CardContent>
                {isGameComplete ? (
                     <div className="text-center p-8 flex flex-col items-center">
                        <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                        <h2 className="text-2xl font-bold">Felicitaciones - completaste este ejercicio</h2>
                     </div>
                ) : (
                    <div className="grid grid-cols-4 gap-2">
                        {cards.map((card, index) => {
                            const isFlipped = flippedIndices.includes(index);
                            const isMatched = matchedPairIds.includes(card.pairId);
                            return (
                                <Card 
                                    key={card.id}
                                    onClick={() => handleCardClick(index)}
                                    className={cn(
                                        "flex items-center justify-center aspect-square cursor-pointer transition-all",
                                        isFlipped || isMatched ? "bg-card border-primary" : "bg-secondary hover:bg-secondary/80",
                                        isMatched && "border-green-500 border-2"
                                    )}
                                >
                                    <CardContent className="p-1 flex items-center justify-center">
                                        {isFlipped || isMatched ? (
                                            <span className="text-[10px] sm:text-xs font-bold text-center">{card.text}</span>
                                        ) : (
                                            <BrainCircuit className="h-5 w-5 text-primary/50" />
                                        )}
                                    </CardContent>
                                </Card>
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
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>La Hora - How to tell the time</CardTitle>
                <CardDescription>Aprende a decir la hora de forma completa y sencilla.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex justify-center">
                    {timeImage && <Image src={timeImage.imageUrl} alt={timeImage.description} width={450} height={450} className="rounded-lg shadow-md border" data-ai-hint={timeImage.imageHint} />}
                </div>

                <Separator />

                <div className="space-y-4 text-left">
                    <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Clock className="h-6 w-6" />
                        ¿Cómo funciona?
                    </h3>
                    <p className="text-lg">Para decir la hora en inglés, siempre empezamos con la frase <strong>"It is"</strong> o la contracción <strong>"It's"</strong>.</p>
                    <div className="p-4 bg-muted rounded-lg font-mono text-lg border-l-4 border-primary">
                        <p>Ejemplo: 8:00 {"=>"} It is eight o'clock.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-left">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-blue-200">
                        <h4 className="text-xl font-bold text-blue-600 mb-2">Usamos "PAST"</h4>
                        <p className="text-sm mb-4">Para los minutos del <strong>1 al 30</strong>. Significa "pasadas las...".</p>
                        <div className="space-y-2 font-mono text-sm">
                            <p>2:10 {"=>"} Ten <strong>past</strong> two</p>
                            <p>5:20 {"=>"} Twenty <strong>past</strong> five</p>
                        </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border-2 border-orange-200">
                        <h4 className="text-xl font-bold text-orange-600 mb-2">Usamos "TO"</h4>
                        <p className="text-sm mb-4">Para los minutos del <strong>31 al 59</strong>. Significa "para las...".</p>
                        <div className="space-y-2 font-mono text-sm">
                            <p>2:50 {"=>"} Ten <strong>to</strong> three (diez para las tres)</p>
                            <p>8:40 {"=>"} Twenty <strong>to</strong> nine (veinte para las nueve)</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xl font-bold">Palabras Especiales:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-secondary rounded-xl text-center">
                            <p className="font-bold text-primary">o'clock</p>
                            <p className="text-xs text-muted-foreground">En punto (:00)</p>
                        </div>
                        <div className="p-3 bg-secondary rounded-xl text-center">
                            <p className="font-bold text-primary">quarter past</p>
                            <p className="text-xs text-muted-foreground">Y cuarto (:15)</p>
                        </div>
                        <div className="p-3 bg-secondary rounded-xl text-center">
                            <p className="font-bold text-primary">half past</p>
                            <p className="text-xs text-muted-foreground">Y media (:30)</p>
                        </div>
                        <div className="p-3 bg-secondary rounded-xl text-center">
                            <p className="font-bold text-primary">quarter to</p>
                            <p className="text-xs text-muted-foreground">Menos cuarto (:45)</p>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={onComplete} className="w-full sm:w-auto">Avanzar</Button>
            </CardFooter>
        </Card>
    );
};

const TimeExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(timeExerciseData.length).fill(''));
    const [validationStates, setValidationStates] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(timeExerciseData.length).fill('unchecked'));
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const currentPrompt = timeExerciseData[currentIndex];

    const handleAnswerChange = (value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentIndex] = value;
        setUserAnswers(newAnswers);

        if (validationStates[currentIndex] !== 'unchecked') {
            const newValidationStates = [...validationStates];
            newValidationStates[currentIndex] = 'unchecked';
            setValidationStates(newValidationStates);
        }
    };
    
    const handleCheck = () => {
        const userAnswer = userAnswers[currentIndex].trim().toLowerCase().replace(/[.?,]/g, '');
        const isCorrect = currentPrompt.answers.some(ans => ans.toLowerCase().replace(/[.?]/g, '') === userAnswer);

        const newValidationStates = [...validationStates];
        newValidationStates[currentIndex] = isCorrect ? 'correct' : 'incorrect';
        setValidationStates(newValidationStates);

        if (isCorrect) {
            toast({ title: '¡Correcto!', description: 'Puedes pasar al siguiente.' });
        } else {
            toast({ variant: 'destructive', title: 'Incorrecto', description: 'Inténtalo de nuevo.' });
        }
    };
    
    const handleNext = () => {
        if (currentIndex < timeExerciseData.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const allCorrect = validationStates.every(s => s === 'correct');
            if (allCorrect) {
                setShowCompletionMessage(true);
                onComplete();
            } else {
                toast({ variant: 'destructive', title: 'Revisa tus respuestas', description: 'Debes completar todos los ejercicios correctamente.' });
            }
        }
    };

    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[400px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                    <p className="text-muted-foreground mt-2">Has dominado los ejercicios de la hora.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicios: ¿Qué hora es?</CardTitle>
                <CardDescription>Escribe la hora en inglés.</CardDescription>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {timeExerciseData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStates[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStates[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                            aria-label={`Ir al ejercicio ${index + 1}`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center py-8 bg-muted rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-2">Escribe en inglés:</p>
                    <p className="text-5xl font-mono font-bold tracking-tighter">{currentPrompt.time}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="answer">Tu traducción:</Label>
                    <Input
                        id="answer"
                        value={userAnswers[currentIndex]}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Ej: It's two o'clock"
                        className={cn(
                            "text-lg h-12",
                            validationStates[currentIndex] === 'correct' && "border-green-500 focus-visible:ring-green-500",
                            validationStates[currentIndex] === 'incorrect' && "border-destructive focus-visible:ring-destructive"
                        )}
                        autoComplete="off"
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck}>Verificar</Button>
                    <Button onClick={handleNext} disabled={validationStates[currentIndex] !== 'correct'}>
                        {currentIndex === timeExerciseData.length - 1 ? 'Finalizar' : 'Siguiente'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const CountriesExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    
    type CountryAnswers = { country: string; nationality: string; language: string; };
    type UserAnswers = Record<number, CountryAnswers>;
    type ValidationState = Record<number, Record<keyof CountryAnswers, 'correct' | 'incorrect' | 'unchecked'>>;

    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [validationStatus, setValidationStatus] = useState<ValidationState>({});

    const handleInputChange = (index: number, field: keyof CountryAnswers, value: string) => {
        setUserAnswers(prev => ({ ...prev, [index]: { ...prev[index], [field]: value } }));
        setValidationStatus(prev => {
            const newStatus = { ...prev };
            if (!newStatus[index]) {
                newStatus[index] = { country: 'unchecked', nationality: 'unchecked', language: 'unchecked' };
            }
            newStatus[index][field] = 'unchecked';
            return newStatus;
        });
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: ValidationState = {};
        
        countriesExerciseData.forEach((correctData, index) => {
            const userAnswer = userAnswers[index] || { country: '', nationality: '', language: '' };
            
            const isCountryCorrect = userAnswer.country?.trim().toLowerCase() === correctData.country.toLowerCase();
            const isNationalityCorrect = userAnswer.nationality?.trim().toLowerCase() === correctData.nationality.toLowerCase();
            const isLanguageCorrect = userAnswer.language?.trim().toLowerCase() === correctData.language.toLowerCase();
            
            newValidationStatus[index] = {
                country: isCountryCorrect ? 'correct' : 'incorrect',
                nationality: isNationalityCorrect ? 'correct' : 'incorrect',
                language: isLanguageCorrect ? 'correct' : 'incorrect'
            };

            if (!isCountryCorrect || !isNationalityCorrect || !isLanguageCorrect) {
                allCorrect = false;
            }
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Todas tus respuestas son correctas." });
            onComplete();
        } else {
            toast({ 
                variant: 'destructive', 
                title: "Algunas respuestas son incorrectas", 
                description: "Revisa los campos en rojo e inténtalo de nuevo." 
            });
        }
    };
    
    const getInputClass = (status?: string) => {
        if (status === 'correct') return 'border-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive bg-destructive/5';
        return '';
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Países y Nacionalidades</CardTitle>
                <CardDescription>Completa la tabla traduciendo al inglés.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-bold">Países (Español)</TableHead>
                            <TableHead className="font-bold">Country (Inglés)</TableHead>
                            <TableHead className="font-bold">Nationality</TableHead>
                            <TableHead className="font-bold">Language</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {countriesExerciseData.map((data, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{data.spanish}</TableCell>
                                <TableCell>
                                    <Input 
                                        value={userAnswers[index]?.country || ''} 
                                        onChange={(e) => handleInputChange(index, 'country', e.target.value)} 
                                        className={cn("h-8 text-xs", getInputClass(validationStatus[index]?.country))} 
                                        autoComplete="off"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={userAnswers[index]?.nationality || ''} 
                                        onChange={(e) => handleInputChange(index, 'nationality', e.target.value)} 
                                        className={cn("h-8 text-xs", getInputClass(validationStatus[index]?.nationality))} 
                                        autoComplete="off"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input 
                                        value={userAnswers[index]?.language || ''} 
                                        onChange={(e) => handleInputChange(index, 'language', e.target.value)} 
                                        className={cn("h-8 text-xs", getInputClass(validationStatus[index]?.language))} 
                                        autoComplete="off"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="justify-end">
                <Button onClick={handleCheckAnswers}>Verificar</Button>
            </CardFooter>
        </Card>
    );
};

const SimpleExercise = ({ title, exerciseData, onComplete }: { title: string; exerciseData: { spanish: string, answer: string[] }[], onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [validation, setValidation] = useState<'correct' | 'incorrect' | 'unchecked'>('unchecked');
    const [completedCount, setCompletedCount] = useState(0);

    const currentPrompt = exerciseData[currentIndex];

    const handleCheck = () => {
        const isCorrect = currentPrompt.answer.includes(userAnswer.trim().toLowerCase());
        setValidation(isCorrect ? 'correct' : 'incorrect');
        if (isCorrect) {
            toast({ title: '¡Correcto!' });
            if(validation !== 'correct') {
                setCompletedCount(c => c + 1);
            }
        } else {
            toast({ variant: 'destructive', title: 'Incorrecto' });
        }
    };
    
    const handleNext = () => {
        if(currentIndex < exerciseData.length - 1) {
            setCurrentIndex(i => i + 1);
            setUserAnswer('');
            setValidation('unchecked');
        } else {
            onComplete();
        }
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <Progress value={(completedCount / exerciseData.length) * 100} className="mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">Traduce: "{currentPrompt.spanish}"</p>
                <Input value={userAnswer} onChange={e => setUserAnswer(e.target.value)} className={cn(validation === 'correct' && 'border-green-500', validation === 'incorrect' && 'border-destructive')} />
            </CardContent>
            <CardFooter className="justify-between">
                <Button onClick={handleCheck}>Verificar</Button>
                <Button onClick={handleNext} disabled={validation !== 'correct'}>Siguiente</Button>
            </CardFooter>
        </Card>
    );
};

// --- Main Page Component ---

export default function KidsIntro2Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<KidsIntro2PathItem[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo(() => getKidsIntro2PathData(), []);
    const memoryGameData = useMemo(() => [...greetingsData.slice(0, 5), ...farewellsData.slice(0, 5)], []);

    useEffect(() => {
        if (!isClient || isUserLoading || isProfileLoading || initialLoadComplete) return;
        
        let path = initialLearningPath.map((item, index) => ({
            ...item,
            status: index === 0 ? 'active' : 'locked',
        }));

        if (isAdmin) {
            path.forEach(topic => { topic.status = 'completed' });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedStatuses[item.key]) {
                    item.status = savedStatuses[item.key];
                }
            });
        }
        
        setLearningPath(path as KidsIntro2PathItem[]);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || path[0].key);
        setInitialLoadComplete(true);

    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading, isClient, initialLoadComplete]);

    const progress = useMemo(() => {
        const completedTopics = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((completedTopics / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (!isClient || isProfileLoading || !learningPath.length || isAdmin || !studentDocRef) return;

        const statuses = learningPath.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statuses,
            'progress.kidsIntro2Progress': progress
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progress, isAdmin, isClient, studentDocRef, isProfileLoading]);

    const handleTopicComplete = useCallback((key: string) => {
        setTopicToComplete(key);
    }, []);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(prevPath => {
            const newPath = [...prevPath];
            const currentIndex = newPath.findIndex((t) => t.key === topicToComplete);

            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';

                if (currentIndex + 1 < newPath.length && newPath[currentIndex + 1].status === 'locked') {
                    newPath[currentIndex + 1].status = 'active';
                    
                    // Solo saltamos automáticamente si no es el juego de memoria
                    if (topicToComplete !== 'memory') {
                        setSelectedTopic(newPath[currentIndex + 1].key);
                    }
                    
                    toast({
                        title: "¡Tema desbloqueado!",
                        description: `Ahora puedes continuar con el siguiente tema.`,
                    });
                }
            }
            return newPath;
        });
        
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find((t) => t.key === topicKey);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: 'Contenido Bloqueado' });
            return;
        }
        setSelectedTopic(topicKey);
    };

    const renderContent = () => {
        switch (selectedTopic) {
          case 'tip': return <TipContent onComplete={() => handleTopicComplete('tip')} />;
          case 'mixed1': return <SimpleExercise title="Ejercicios Mixtos 1" exerciseData={mixedExercise1Data} onComplete={() => handleTopicComplete('mixed1')} />;
          case 'greetings': return <GreetingsFarewellsContent title="Saludos" data={greetingsData} onComplete={() => handleTopicComplete('greetings')} />;
          case 'farewells': return <GreetingsFarewellsContent title="Despedidas" data={farewellsData} onComplete={() => handleTopicComplete('farewells')} />;
          case 'memory': return <MemoryGame data={memoryGameData} onComplete={() => handleTopicComplete('memory')} />;
          case 'mixed2': return <SimpleExercise title="Ejercicios Mixtos 2" exerciseData={mixedExercise2Data} onComplete={() => handleTopicComplete('mixed2')} />;
          case 'time': return <TimeContent onComplete={() => handleTopicComplete('time')} />;
          case 'time-exercise': return <TimeExercise onComplete={() => handleTopicComplete('time-exercise')} />;
          case 'countries': return <CountriesExercise onComplete={() => handleTopicComplete('countries')} />;
          default:
            return (
                <Card className="h-full">
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    </div>
                </Card>
            );
        }
    };

    if (!isClient) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

    return (
        <div className="flex w-full flex-col min-h-screen kids-page-container">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 text-left">
                <Link href={`/kids/intro`} className="hover:underline text-sm text-white/80">
                    Volver a Intro Niños
                </Link>
                <h1 className="text-4xl font-bold text-white dark:text-primary">Aventura Intro 2</h1>
              </div>
               <div className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-9">{renderContent()}</div>
                <div className="md:col-span-3 text-left">
                  <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                    <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                    <CardContent>
                      <nav>
                        <ul className="space-y-1">
                          {learningPath.map((item) => {
                               const StatusIcon = ICONS[item.status as keyof typeof ICONS];
                               return (
                                <li
                                  key={item.key}
                                  onClick={() => handleTopicSelect(item.key)}
                                  className={cn(
                                    'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                    item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                    selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <StatusIcon className={cn("h-5 w-5", item.status === 'completed' && "text-green-500", item.status === 'locked' && "text-yellow-500")} />
                                    <span>{item.name}</span>
                                  </div>
                                </li>
                              );
                          })}
                        </ul>
                      </nav>
                      <div className="mt-6 pt-6 border-t">
                          <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                              <span>Progreso</span>
                              <span className="font-bold text-foreground">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
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
