
'use client';

import React, { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
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
  BookText,
  Star,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- CONSTANTS & DATA ---

const ICONS = {
  locked: Lock,
  active: BookOpen,
  completed: CheckCircle,
};

const progressStorageVersion = "es_intro2_v50_expanded_fixed";
const mainProgressKey = "progress_espanol_intro_2";

const intro2EPath = [
    { key: 'memory_game', name: 'Juego Saludos', icon: BrainCircuit },
    { key: 'numeros', name: 'Números (Teoría)', icon: BookOpen },
    { key: 'ejercicio_numeros', name: 'Ejercicios Números', icon: PenSquare },
    { key: 'time', name: 'La Hora (Teoría)', icon: Clock },
    { key: 'time_exercises', name: 'Ejercicios Hora', icon: PenSquare },
    { key: 'countries', name: 'Países y Nacionalidades', icon: Globe },
    { key: 'reading', name: 'Lectura', icon: BookText },
    { key: 'ser_y_estar', name: 'Ser y Estar', icon: GraduationCap },
    { key: 'mixed_exercises', name: 'Ejercicios Mixtos', icon: Trophy },
];

const greetingsAndFarewellsData = [
    { spanish: 'Hola', english: 'Hello' },
    { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' },
    { spanish: 'Buenas noches', english: 'Good night' },
    { spanish: 'Adiós', english: 'Goodbye' },
    { spanish: 'Hasta luego', english: 'See you later' },
];

const numerosData = [
    { num: '1', word: 'Uno' }, { num: '2', word: 'Dos' }, { num: '3', word: 'Tres' },
    { num: '4', word: 'Cuatro' }, { num: '5', word: 'Cinco' }, { num: '6', word: 'Seis' },
    { num: '7', word: 'Siete' }, { num: '8', word: 'Ocho' }, { num: '9', word: 'Nueve' },
    { num: '10', word: 'Diez' },
    { num: '11', word: 'Once' }, { num: '12', word: 'Doce' }, { num: '13', word: 'Trece' },
    { num: '14', word: 'Catorce' }, { num: '15', word: 'Quince' }, { num: '16', word: 'Dieciséis' },
    { num: '17', word: 'Diecisiete' }, { num: '18', word: 'Dieciocho' }, { num: '19', word: 'Diecinueve' },
    { num: '20', word: 'Veinte' }, { num: '30', word: 'Treinta' },
    { num: '40', word: 'Cuarenta' }, { num: '50', word: 'Cincuenta' }, { num: '60', word: 'Sesenta' },
    { num: '70', word: 'Setenta' }, { num: '80', word: 'Ochenta' }, { num: '90', word: 'Noventa' },
    { num: '100', word: 'Cien' },
    { num: '200', word: 'Doscientos' }, { num: '300', word: 'Trescientos' }, { num: '400', word: 'Cuatrocientos' },
    { num: '500', word: 'Quinientos' }, { num: '700', word: 'Setecientos' }, { num: '900', word: 'Novecientos' },
    { num: '1000', word: 'Mil' }, { num: "1'000.000", word: 'Un Millón' }
];

const numbersExercisesData = [
    { num: '1', word: 'Uno' }, { num: '12', word: 'Doce' }, { num: '15', word: 'Quince' }, { num: '20', word: 'Veinte' }, { num: '50', word: 'Cincuenta' },
    { num: '100', word: 'Cien' }, { num: '500', word: 'Quinientos' }, { num: '900', word: 'Novecientos' }, { num: '1000', word: 'Mil' }, { num: "1'000.000", word: 'Un millón' },
    { num: '5', word: 'Cinco' }, { num: '8', word: 'Ocho' }, { num: '11', word: 'Once' }, { num: '13', word: 'Trece' }, { num: '14', word: 'Catorce' },
    { num: '16', word: 'Dieciséis' }, { num: '17', word: 'Diecisiete' }, { num: '18', word: 'Dieciocho' }, { num: '19', word: 'Diecinueve' }, { num: '25', word: 'Veinticinco' },
    { num: '30', word: 'Treinta' }, { num: '40', word: 'Cuarenta' }, { num: '60', word: 'Sesenta' }, { num: '70', word: 'Setenta' }, { num: '80', word: 'Ochenta' },
];

const timeExercisesData = [
    { time: '2:00', word: 'Son las dos en punto' },
    { time: '2:30', word: 'Son las dos y media' },
    { time: '5:15', word: 'Son las cinco y cuarto' },
    { time: '10:45', word: 'falta un cuarto para las once' },
    { time: '8:00', word: 'Son las ocho en punto' },
    { time: '12:00', word: 'Es mediodia','son las doce en punto'},
    { time: '6:45', word: 'falta un cuarto para las siete' },
    { time: '3:15', word: 'Son las tres y cuarto' },
    { time: '1:30', word: 'Es la una y media' },
    { time: '9:00', word: 'Son las nueve en punto' },
    { time: '10:30', word: 'Son las diez y media' },
    { time: '12:15', word: 'Son las doce y cuarto' },
    { time: '4:00', word: 'Son las cuatro en punto' },
    { time: '6:20', word: 'Son las seis y veinte' },
    { time: '9:50', word: 'falta diez para las diez' },
    { time: '11:30', word: 'Son las once y media' },
    { time: '1:00', word: 'Es la una en punto' },
    { time: '7:40', word: 'faltan veinte para las ocho' },
    { time: '8:15', word: 'Son las ocho y cuarto' },
    { time: '12:00 AM', word: 'Es medianoche' },
];

const countriesExerciseData = [
    { english: 'United States', spanish: 'Estados Unidos', nationality: 'Estadounidense', language: 'Inglés' },
    { english: 'Canada', spanish: 'Canadá', nationality: 'Canadiense', language: 'Inglés' },
    { english: 'Mexico', spanish: 'México', nationality: 'Mexicano', language: 'Español' },
    { english: 'Colombia', spanish: 'Colombia', nationality: 'Colombiano', language: 'Español' },
    { english: 'Brazil', spanish: 'Brasil', nationality: 'Brasileño', language: 'Portugués' },
    { english: 'England', spanish: 'Inglaterra', nationality: 'Inglés', language: 'Inglés' },
    { english: 'Spain', spanish: 'España', nationality: 'Español', language: 'Español' },
    { english: 'France', spanish: 'Francia', nationality: 'Francés', language: 'Francés' },
    { english: 'Germany', spanish: 'Alemania', nationality: 'Alemán', language: 'Alemán' },
    { english: 'Italy', spanish: 'Italia', nationality: 'Italiano', language: 'Italiano' },
    { english: 'Japan', spanish: 'Japón', nationality: 'Japonés', language: 'Japonés' },
    { english: 'China', spanish: 'China', nationality: 'Chino', language: 'Chino' },
];

const readingData = {
    title: 'Mi Rutina Diaria',
    content: "Hola, me llamo Carlos. Cada mañana, me levanto a las siete. Bebo café y leo las noticias. Trabajo en una oficina. Por la tarde, me gusta caminar en el parque. Por la noche, ceno con mi familia y vemos la televisión. A las diez de la noche, me voy a dormir. ¡Buenas noches!",
    questions: [
        { id: 'q1', question: '¿A qué hora se levanta Carlos?', answer: 'a las siete' },
        { id: 'q2', question: '¿Qué bebe por la mañana?', answer: 'café' },
        { id: 'q3', question: '¿Qué hace por la tarde?', answer: 'caminar en el parque' },
    ],
    vocabulary: {
        "rutina": "routine",
        "me llamo": "my name is",
        "cada mañana": "every morning",
        "me levanto": "I get up",
        "noticias": "news",
        "oficina": "office",
        "tarde": "afternoon",
        "caminar": "walk",
        "noche": "night / evening",
        "ceno": "I have dinner",
        "vemos": "we watch",
        "dormir": "to sleep"
    }
};

const mixedExercisesData = [
    { english: 'Hello, how are you?', spanish: ['hola, ¿cómo estás?', 'hola, como estas', 'hola ¿cómo estás?', 'hola, como estas?'] },
    { english: 'She is my mother', spanish: ['ella es mi madre', 'ella es mi mamá', 'ella es mi mama'] },
    { english: 'The book is blue', spanish: ['el libro es azul'] },
    { english: 'Today is Wednesday', spanish: ['hoy es miércoles', 'hoy es miercoles'] },
    { english: 'I am American', spanish: ['yo soy estadounidense', 'soy estadounidense', 'yo soy americano', 'soy americano'] },
    { english: 'It is half past ten', spanish: ['son las diez y media', 'es la diez y media'] },
    { english: 'He is fifteen years old', spanish: ['él tiene quince años', 'el tiene quince años', 'él tiene 15 años', 'el tiene 15 años'] },
    { english: 'Nice to meet you', spanish: ['mucho gusto', 'encantado', 'encantada', 'un placer'] },
    { english: 'We are in Mexico', spanish: ['nosotros estamos en méxico', 'nosotros estamos en mexico', 'estamos en méxico', 'estamos en mexico'] },
    { english: 'Goodbye, take care', spanish: ['adiós, cuídate', 'adios, cuidate', 'chao, cuídate', 'chao, cuidate'] },
    { english: 'Good morning, how is it going?', spanish: ['buenos dias, como estas?', 'buenos dias, ¿como estas?'] },
    { english: 'I am from Germany', spanish: ['yo soy de alemania', 'soy de alemania'] },
    { english: 'It is nine o\'clock', spanish: ['son las nueve en punto'] },
    { english: 'They are tired', spanish: ['ellos están cansados', 'ellos estan cansados'] },
    { english: 'This is my house', spanish: ['esta es mi casa', 'esta es mi casa'] },
    { english: 'We are happy in Colombia', spanish: ['nosotros estamos felices en colombia', 'estamos felices en colombia'] },
    { english: 'Are you from Italy?', spanish: ['¿eres de italia?', 'tu eres de italia?'] },
    { english: 'She is twenty years old', spanish: ['ella tiene veinte años', 'ella tiene 20 años'] },
    { english: 'It is noon', spanish: ['es mediodía', 'es mediodia'] },
    { english: 'Nice to meet you, goodbye', spanish: ['mucho gusto, adiós', 'mucho gusto, adios'] },
];

// --- SUB-COMPONENTS ---

const MemoryGame = ({ data, onComplete }: { data: { spanish: string; english: string; }[], onComplete: () => void }) => {
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
            const isMatch = cards[firstIndex].pairId === cards[secondIndex].pairId;
            if (isMatch) {
                setMatchedPairIds(prev => [...prev, cards[firstIndex].pairId]);
                setStreak(prev => prev + 1);
                setFlippedIndices([]);
                setIsChecking(false);
            } else {
                setStreak(0);
                setTimeout(() => { setFlippedIndices([]); setIsChecking(false); }, 800);
            }
        }
    }, [flippedIndices, cards]);

    const isGameComplete = matchedPairIds.length === data.length && data.length > 0;
    useEffect(() => { if (isGameComplete) onComplete(); }, [isGameComplete, onComplete]);

    const handleCardClick = (index: number) => {
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) return;
        setFlippedIndices(prev => [...prev, index]);
    };

    if (!isClient) return null;

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground">
            <CardHeader>
                <CardTitle>Juego de Memoria: Saludos y Despedidas</CardTitle>
                <div className="flex justify-between items-center pt-2">
                    <Button size="icon" variant="ghost" onClick={initializeGame}><RefreshCw className="h-5 w-5" /></Button>
                    <div className="flex items-center gap-2 text-orange-500 font-bold"><Flame className="h-5 w-5" /><span>{streak}</span></div>
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
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader>
                <CardTitle>La Hora en Español</CardTitle>
                <CardDescription>Aprende a decir la hora de forma sencilla.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-4 text-left">
                    <h3 className="text-2xl font-bold text-primary flex items-center gap-2"><Clock className="h-6 w-6" /> ¿Cómo funciona?</h3>
                    <p className="text-lg">Para decir la hora en español, usamos el verbo <strong>ser</strong>. Usamos "Es la" para la una y "Son las" para las demás horas.</p>
                    <div className="p-4 bg-muted rounded-lg font-mono text-lg border-l-4 border-primary">
                        <p>Ejemplo 1:00 {"=>"} Es la una en punto.</p>
                        <p>Ejemplo 2:00 {"=>"} Son las dos en punto.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-left">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-blue-200">
                        <h4 className="text-xl font-bold text-blue-600 mb-2">Minutos del 1 al 30</h4>
                        <p className="text-sm mb-4 text-muted-foreground font-medium">Usamos la conjunción <strong>"y"</strong> seguida de los minutos.</p>
                        <div className="space-y-2 font-mono text-sm">
                            <p>2:10 {"=>"} Son las dos <strong>y</strong> diez</p>
                            <p>5:20 {"=>"} Son las cinco <strong>y</strong> veinte</p>
                        </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border-2 border-orange-200">
                        <h4 className="text-xl font-bold text-orange-600 mb-2">Minutos del 31 al 59</h4>
                        <p className="text-sm mb-4 text-muted-foreground font-medium">Usamos <strong>"menos"</strong> restando los minutos a la hora siguiente.</p>
                        <div className="space-y-2 font-mono text-sm">
                            <p>2:50 {"=>"} faltan diez <strong>para las</strong> tres</p>
                            <p>8:40 {"=>"} faltan veinte <strong>para las</strong> nueve</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 text-left">
                    <h4 className="text-xl font-bold uppercase">Expresiones Comunes:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-secondary rounded-xl text-center">
                            <p className="font-bold text-primary">En punto</p>
                            <p className="text-xs text-muted-foreground">Hora exacta (:00)</p>
                        </div>
                        <div className="p-3 bg-secondary rounded-xl text-center">
                            <p className="font-bold text-primary">Y cuarto</p>
                            <p className="text-xs text-muted-foreground">15 minutos (:15)</p>
                        </div>
                        <div className="p-3 bg-secondary rounded-xl text-center">
                            <p className="font-bold text-primary">Y media</p>
                            <p className="text-xs text-muted-foreground">30 minutos (:30)</p>
                        </div>
                        <div className="p-3 bg-secondary rounded-xl text-center">
                            <p className="font-bold text-primary">Menos cuarto</p>
                            <p className="text-xs text-muted-foreground">Faltan 15 (:45)</p>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter><Button onClick={onComplete} className="w-full sm:w-auto h-12 px-12 font-bold">Avanzar <ArrowRight className="ml-2 h-4 w-4" /></Button></CardFooter>
        </Card>
    );
};

const NumbersExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const currentPrompt = numbersExercisesData[currentIndex];

    const handleCheck = () => {
        const userAnswer = (userAnswers[currentIndex] || '').trim().toLowerCase().replace(/[.]/g, '');
        const isCorrect = currentPrompt.word.toLowerCase().replace(/[.]/g, '') === userAnswer;
        setValidationStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: '¡Correcto!' }); else toast({ variant: 'destructive', title: 'Incorrecto' });
    };
    
    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader><CardTitle>Ejercicio Números</CardTitle><div className="flex items-center justify-start flex-wrap gap-2 pt-4">{numbersExercisesData.map((_, i) => (<button key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStatus[i] === 'correct' ? "bg-green-500 text-white" : validationStatus[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-card")}>{i + 1}</button>))}</div></CardHeader>
            <CardContent className="space-y-6"><div className="text-center py-8 bg-muted rounded-lg border font-black text-5xl text-primary tracking-tighter">{currentPrompt.num}</div><Input value={userAnswers[currentIndex] || ''} onChange={e => { setUserAnswers({...userAnswers, [currentIndex]: e.target.value}); setValidationStatus({...validationStatus, [currentIndex]: 'unchecked'}); }} onKeyDown={e => e.key === 'Enter' && handleCheck()} placeholder="Escribe el número en letras..." className={cn("text-lg h-12 uppercase", validationStatus[currentIndex] === 'correct' ? 'border-green-500' : validationStatus[currentIndex] === 'incorrect' ? 'border-destructive' : '')} autoComplete="off" /></CardContent>
            <CardFooter className="justify-between"><Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button><div className="flex gap-2"><Button onClick={handleCheck}>Verificar</Button><Button onClick={() => currentIndex < numbersExercisesData.length - 1 ? setCurrentIndex(p => p + 1) : onComplete()} disabled={validationStatus[currentIndex] !== 'correct'}>Siguiente</Button></div></CardFooter>
        </Card>
    );
};

const TimeExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});
    const currentPrompt = timeExercisesData[currentIndex];

    const handleCheck = () => {
        const userAnswer = (userAnswers[currentIndex] || '').trim().toLowerCase().replace(/[.?,]/g, '');
        const isCorrect = userAnswer === currentPrompt.word.toLowerCase().replace(/[.?,]/g, '');
        setValidationStatus(prev => ({ ...prev, [currentIndex]: isCorrect ? 'correct' : 'incorrect' }));
        if (isCorrect) toast({ title: '¡Correcto!' }); else toast({ variant: 'destructive', title: 'Incorrecto' });
    };
    
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader><CardTitle>Ejercicios Hora</CardTitle><div className="flex flex-wrap gap-2 pt-4">{timeExercisesData.map((_, i) => (<button key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 font-bold transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validationStatus[i] === 'correct' ? "bg-green-500 text-white" : validationStatus[i] === 'incorrect' ? "bg-red-500 text-white" : "bg-card")}>{i + 1}</button>))}</div></CardHeader>
            <CardContent className="space-y-6"><div className="text-center py-8 bg-muted rounded-lg border font-black text-5xl text-primary tracking-tighter">{currentPrompt.time}</div><Input value={userAnswers[currentIndex] || ''} onChange={e => { setUserAnswers({...userAnswers, [currentIndex]: e.target.value}); setValidationStatus({...validationStatus, [currentIndex]: 'unchecked'}); }} onKeyDown={e => e.key === 'Enter' && handleCheck()} placeholder="Escribe la hora..." className={cn("h-12 text-lg uppercase", validationStatus[currentIndex] === 'correct' ? 'border-green-500' : validationStatus[currentIndex] === 'incorrect' ? 'border-destructive' : '')} autoComplete="off" /></CardContent>
            <CardFooter className="justify-between"><Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button><div className="flex gap-2"><Button onClick={handleCheck}>Verificar</Button><Button onClick={() => currentIndex < timeExercisesData.length - 1 ? setCurrentIndex(p => p + 1) : onComplete()} disabled={validationStatus[currentIndex] !== 'correct'}>Siguiente</Button></div></CardFooter>
        </Card>
    );
};

const CountriesExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
    const [validation, setValidation] = useState<Record<number, any>>({});

    const handleCheck = () => {
        let allOk = true; const nv: any = {};
        countriesExerciseData.forEach((data, i) => {
            const user = userAnswers[i] || { spanish: '', nationality: '', language: '' };
            const sOk = user.spanish?.trim().toLowerCase() === data.spanish.toLowerCase();
            const nOk = user.nationality?.trim().toLowerCase() === data.nationality.toLowerCase();
            const lOk = user.language?.trim().toLowerCase() === data.language.toLowerCase();
            nv[i] = { spanish: sOk ? 'correct' : 'incorrect', nationality: nOk ? 'correct' : 'incorrect', language: lOk ? 'correct' : 'incorrect' };
            if (!sOk || !nOk || !lOk) allOk = false;
        });
        setValidation(nv);
        if (allOk) { toast({ title: "¡Excelente!" }); onComplete(); }
        else toast({ variant: 'destructive', title: "Revisa los campos en rojo" });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader><CardTitle>Países y Nacionalidades</CardTitle><CardDescription>Completa la tabla traduciendo los términos al español.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto"><Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead className="font-bold">Country (Inglés)</TableHead><TableHead className="font-bold">País (Español)</TableHead><TableHead className="font-bold">Nacionalidad</TableHead><TableHead className="font-bold">Idioma (Language)</TableHead></TableRow></TableHeader>
                <TableBody>{countriesExerciseData.map((data, i) => (<TableRow key={i}>
                    <TableCell className="font-bold text-sm">{data.english}</TableCell>
                    <TableCell><Input value={userAnswers[i]?.spanish || ''} onChange={e => setUserAnswers({...userAnswers, [i]: {...(userAnswers[i] || {}), spanish: e.target.value}})} className={cn("h-8 text-xs uppercase", validation[i]?.spanish === 'correct' ? 'border-green-500 bg-green-50/10' : validation[i]?.spanish === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></TableCell>
                    <TableCell><Input value={userAnswers[i]?.nationality || ''} onChange={e => setUserAnswers({...userAnswers, [i]: {...(userAnswers[i] || {}), nationality: e.target.value}})} className={cn("h-8 text-xs uppercase", validation[i]?.nationality === 'correct' ? 'border-green-500 bg-green-50/10' : validation[i]?.nationality === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></TableCell>
                    <TableCell><Input value={userAnswers[i]?.language || ''} onChange={e => setUserAnswers({...userAnswers, [i]: {...(userAnswers[i] || {}), language: e.target.value}})} className={cn("h-8 text-xs uppercase", validation[i]?.language === 'correct' ? 'border-green-500 bg-green-50/10' : validation[i]?.language === 'incorrect' ? 'border-red-500 bg-red-50/10' : '')} autoComplete="off" /></TableCell>
                </TableRow>))}</TableBody>
            </Table></CardContent>
            <CardFooter className="justify-center border-t pt-6"><Button onClick={handleCheck} size="lg" className="px-16 font-bold h-12 uppercase tracking-tighter">Verificar Misión</Button></CardFooter>
        </Card>
    );
};

const ReadingExercise = ({ onComplete }: { onComplete: () => void }) => {
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [validation, setValidation] = useState<Record<string, any>>({});
    const { toast } = useToast();

    const handleCheck = () => {
        const nv: any = {}; let allOk = true;
        readingData.questions.forEach(q => {
            const ok = (userAnswers[q.id] || '').trim().toLowerCase().includes(q.answer.toLowerCase());
            nv[q.id] = ok ? 'correct' : 'incorrect'; if (!ok) allOk = false;
        });
        setValidation(nv); if (allOk) onComplete(); else toast({ variant: 'destructive', title: 'Revisa tus respuestas' });
    };
    
    return (
        <Card className="bg-card text-foreground border-2 border-brand-purple">
            <CardHeader><div className="flex justify-between items-start"><CardTitle className="text-foreground font-black text-2xl uppercase text-left">Lectura: {readingData.title}</CardTitle><Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="border-2 border-brand-blue animate-border-pulse shrink-0"><BookText className="mr-2 h-4 w-4" /> Vocabulario</Button></PopoverTrigger><PopoverContent className="w-64"><ScrollArea className="h-48 pr-4"><div className="space-y-2 text-sm text-left text-foreground"><h4 className="font-bold border-b pb-1 text-primary uppercase">Ayuda de Misión</h4>{Object.entries(readingData.vocabulary).map(([es, en]) => (
                <div key={es} className="flex justify-between border-b border-muted pb-1"><span className="font-bold uppercase text-[10px]">{es}:</span><span className="text-muted-foreground italic text-[10px]">{en}</span></div>
            ))}</div></ScrollArea></PopoverContent></Popover></div></CardHeader>
            <CardContent className="space-y-6"><p className="text-lg leading-relaxed bg-muted/30 p-6 rounded-2xl border italic text-left text-foreground shadow-inner">{readingData.content}</p><div className="space-y-4 border-t pt-4 text-left">{readingData.questions.map(q => (<div key={q.id} className='space-y-1'><Label className="text-sm font-black uppercase text-primary">{q.question}</Label><Input value={userAnswers[q.id] || ''} onChange={e => setUserAnswers({...userAnswers, [q.id]: e.target.value})} className={cn('h-10 uppercase', validation[q.id] === 'correct' ? 'border-green-500 bg-green-50/10' : validation[q.id] === 'incorrect' ? 'border-destructive bg-red-50/10' : '')} autoComplete="off" /></div>))}</div></CardContent>
            <CardFooter><Button onClick={handleCheck} className='w-full font-bold h-12 uppercase'>Verificar Lectura</Button></CardFooter>
        </Card>
    );
};

const MixedExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validation, setValidation] = useState<Record<number, any>>({});
    const currentPrompt = mixedExercisesData[currentIndex];

    const handleCheck = () => {
        const userVal = (userAnswers[currentIndex] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '');
        const isOk = currentPrompt.spanish.some(correct => correct.toLowerCase().replace(/[.?,¿!¡]/g, '') === userVal);
        setValidation({...validation, [currentIndex]: isOk ? 'correct' : 'incorrect'});
        if (isOk) toast({ title: '¡Excelente!' }); else toast({ variant: 'destructive', title: 'Inténtalo de nuevo' });
    };

    return (
        <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
            <CardHeader><CardTitle>Retos Mixtos</CardTitle><div className="flex flex-wrap gap-2 pt-4">{mixedExercisesData.map((_, i) => (<button key={i} onClick={() => setCurrentIndex(i)} className={cn("h-8 w-8 rounded-full border-2 font-bold transition-all", currentIndex === i ? "border-primary ring-2 ring-primary" : "border-muted", validation[i] === 'correct' ? "bg-green-500 text-white border-green-500" : validation[i] === 'incorrect' ? "bg-red-500 text-white border-red-500" : "bg-card")}>{i + 1}</button>))}</div></CardHeader>
            <CardContent className="space-y-6"><div className="text-center py-8 bg-muted rounded-lg border font-bold text-2xl uppercase tracking-tighter">"{currentPrompt.english}"</div><Input value={userAnswers[currentIndex] || ''} onChange={e => { setUserAnswers({...userAnswers, [currentIndex]: e.target.value}); setValidation({...validation, [currentIndex]: 'unchecked'}); }} onKeyDown={e => e.key === 'Enter' && handleCheck()} placeholder="Tu traducción..." className={cn("h-12 text-lg uppercase", validation[currentIndex] === 'correct' ? 'border-green-500' : validation[currentIndex] === 'incorrect' ? 'border-destructive' : '')} autoComplete="off" /></CardContent>
            <CardFooter className="justify-between"><Button variant="outline" onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}>Anterior</Button><div className="flex gap-2"><Button onClick={handleCheck}>Verificar</Button><Button onClick={() => currentIndex < mixedExercisesData.length - 1 ? setCurrentIndex(p => p + 1) : onComplete()} disabled={validation[currentIndex] !== 'correct'}>Siguiente</Button></div></CardFooter>
        </Card>
    );
};

// --- MAIN PAGE ---

export default function EspanolIntro2Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<any[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('memory_game');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => { setIsClient(true); }, []);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    useEffect(() => {
        if (!isClient || isUserLoading || isProfileLoading || initialLoadComplete) return;
        
        let path = intro2EPath.map((item, index) => ({
            ...item,
            status: index === 0 ? 'active' : 'locked' as any,
        }));
        
        if (isAdmin) {
            path.forEach(item => item.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => { if (savedStatuses[item.key]) item.status = savedStatuses[item.key]; });
            let lastDone = true;
            for(let i=0; i < path.length; i++) {
                if (lastDone && path[i].status === 'locked') path[i].status = 'active';
                lastDone = path[i].status === 'completed';
            }
        }
        
        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || 'memory_game');
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 200);
    }, [isAdmin, studentProfile, isUserLoading, isProfileLoading, initialLoadComplete, isClient]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef) return;
        const statusesToSave: Record<string, string> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });
        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: progressValue
        });
        window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, progressValue, isAdmin, studentDocRef, isInitialLoading, initialLoadComplete, selectedTopic]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            const newPath = [...currentPath];
            const currentIndex = newPath.findIndex(item => item.key === topicToComplete);
            
            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';
                const nextIndex = currentIndex + 1;
                if (nextIndex < newPath.length && newPath[nextIndex].status === 'locked') {
                    newPath[nextIndex].status = 'active';
                    setSelectedTopic(newPath[nextIndex].key);
                     toast({ title: "¡Misión Desbloqueada!", description: `Has avanzado a ${newPath[nextIndex].name}` });
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicComplete = (key: string) => {
        setTopicToComplete(key);
    };

    const handleTopicSelect = (key: string) => {
        const topic = learningPath.find(t => t.key === key);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: '¡Bloqueado!', description: 'Completa el paso anterior.' });
            return;
        }
        setSelectedTopic(key);
        if (['time', 'numeros', 'ser_y_estar'].includes(key)) {
            handleTopicComplete(key);
        }
    };

    const renderContent = () => {
        switch(selectedTopic) {
            case 'memory_game': return <MemoryGame data={greetingsAndFarewellsData} onComplete={() => handleTopicComplete('memory_game')} />;
            case 'numeros':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader><CardTitle className='font-black uppercase text-primary'>Los Números en Español</CardTitle><CardDescription className='font-bold text-foreground'>Estudia la pronunciación y escritura básica.</CardDescription></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {numerosData.map((item) => (
                                    <div key={item.num} className="p-4 bg-muted rounded-2xl text-center border-2 border-transparent hover:border-primary transition-all shadow-sm">
                                        <p className="text-4xl font-black text-primary tracking-tighter">{item.num}</p>
                                        <p className="text-xs font-black text-muted-foreground uppercase">{item.word}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className='justify-center border-t pt-6'><Button onClick={() => handleTopicComplete('numeros')} size="lg" className='px-12'>¡Misión Repasada!</Button></CardFooter>
                    </Card>
                );
            case 'ejercicio_numeros': return <NumbersExercise onComplete={() => handleTopicComplete('ejercicio_numeros')} />;
            case 'time': return <TimeContent onComplete={() => handleTopicComplete('time')} />;
            case 'time_exercises': return <TimeExercise onComplete={() => handleTopicComplete('time_exercises')} />;
            case 'countries': return <CountriesExercise onComplete={() => handleTopicComplete('countries')} />;
            case 'reading': return <ReadingExercise onComplete={() => handleTopicComplete('reading')} />;
            case 'ser_y_estar':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple bg-card/95 text-foreground text-left">
                        <CardHeader>
                            <CardTitle className="text-3xl font-black text-primary uppercase">SER Y ESTAR</CardTitle>
                            <CardDescription className="text-lg font-bold text-foreground">Dos formas esenciales de decir "To Be" en español.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-6 text-foreground">
                                <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-primary/20 shadow-sm">
                                    <h3 className="text-2xl font-black text-primary uppercase mb-4 border-b pb-2">VERBO SER</h3>
                                    <p className="text-xs text-muted-foreground mb-4 italic font-bold">Identidad, origen y rasgos permanentes.</p>
                                    <Table>
                                        <TableBody>
                                            <TableRow><TableCell className="font-bold">Yo</TableCell><TableCell className="font-black text-primary">SOY</TableCell></TableRow>
                                            <TableRow><TableCell className="font-bold">Tú</TableCell><TableCell className="font-black text-primary">ERES</TableCell></TableRow>
                                            <TableRow><TableCell className="font-bold">Él / Ella / Usted</TableCell><TableCell className="font-black text-primary">ES</TableCell></TableRow>
                                            <TableRow><TableCell className="font-bold">Nosotros/as</TableCell><TableCell className="font-black text-primary">SOMOS</TableCell></TableRow>
                                            <TableRow><TableCell className="font-bold">Ellos / Ellas / Ustedes</TableCell><TableCell className="font-black text-primary">SON</TableCell></TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="p-6 bg-brand-purple/5 rounded-[2rem] border-2 border-brand-purple/20 shadow-sm">
                                    <h3 className="text-2xl font-black text-brand-purple uppercase mb-4 border-b pb-2">VERBO ESTAR</h3>
                                    <p className="text-xs text-muted-foreground mb-4 italic font-bold">Ubicación, estados temporales y sentimientos.</p>
                                    <Table>
                                        <TableBody>
                                            <TableRow><TableCell className="font-bold">Yo</TableCell><TableCell className="font-black text-brand-purple">ESTOY</TableCell></TableRow>
                                            <TableRow><TableCell className="font-bold">Tú</TableCell><TableCell className="font-black text-brand-purple">ESTÁS</TableCell></TableRow>
                                            <TableRow><TableCell className="font-bold">Él / Ella / Usted</TableCell><TableCell className="font-black text-brand-purple">ESTÁ</TableCell></TableRow>
                                            <TableRow><TableCell className="font-bold">Nosotros/as</TableCell><TableCell className="font-black text-brand-purple">ESTAMOS</TableCell></TableRow>
                                            <TableRow><TableCell className="font-bold">Ellos / Ellas / Ustedes</TableCell><TableCell className="font-black text-brand-purple">ESTÁN</TableCell></TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            <Separator />
                            <div className="p-6 bg-muted/50 rounded-2xl border-l-8 border-primary text-left">
                                <h4 className="text-xl font-black text-foreground uppercase mb-2">LA DIFERENCIA EN UNA FRASE:</h4>
                                <div className="space-y-4 font-bold text-lg text-foreground">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-primary rounded-full shrink-0" />
                                        <span>Yo <span className="text-primary underline">soy</span> de Colombia y <span className="text-brand-purple underline">estoy</span> en Medellín.</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic font-black ml-4">
                                        (Soy de Colombia [Rasgo permanente] y estoy en Medellín [Ubicación temporal]).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => handleTopicComplete('ser_y_estar')} size="lg" className="px-16 font-bold h-12 uppercase">¡Entendido!</Button></CardFooter>
                    </Card>
                );
            case 'mixed_exercises': return <MixedExercise onComplete={() => handleTopicComplete('mixed_exercises')} />;
            default: return null;
        }
    };

    if (isUserLoading || isProfileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left">
                        <Link href="/espanol/intro" className="hover:underline text-sm text-white/80 flex items-center gap-2 mb-2"><ArrowLeft className="h-4 w-4" /> Volver a Aventura Intro</Link>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter [text-shadow:2px_2px_4px_black]">Intro 2 Español (2E)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Sidebar MOVIDA A LA IZQUIERDA (md:order-1 order-1) */}
                        <div className="md:col-span-3 md:order-1 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader><CardTitle className="text-lg font-black text-primary uppercase">Misión 2E</CardTitle></CardHeader>
                                <CardContent>
                                    <nav><ul className="space-y-1">
                                        {learningPath.map(item => {
                                            const StatusIcon = ICONS[item.status as keyof typeof ICONS] || BookOpen;
                                            return (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                    className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                        item.status === 'locked' && !isAdmin ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                        selectedTopic === item.key && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                                    )}>
                                                    <div className="flex items-center gap-3">
                                                        <StatusIcon className={cn("h-5 w-5", item.status === 'completed' && "text-green-500", item.status === 'locked' && "text-yellow-500")} />
                                                        <span className="truncate max-w-[150px] text-xs font-bold uppercase">{item.name}</span>
                                                    </div>
                                                    {item.status === 'locked' && !isAdmin && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                </li>
                                            );
                                        })}
                                    </ul></nav>
                                    <div className="mt-6 pt-6 border-t"><div className="flex justify-between items-center text-xs mb-2 font-black uppercase text-muted-foreground"><span>Progreso</span><span className="text-primary font-bold">{progressValue}%</span></div><Progress value={progressValue} className="h-2 rounded-full" /></div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contenido principal (md:order-2 order-2) */}
                        <div className="md:col-span-9 md:order-2 order-2">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
