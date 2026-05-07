
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
  Hash,
  ArrowRight,
  ArrowLeft,
  X,
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

// Data
const greetingsAndFarewellsData = [
    { spanish: 'Hola', english: 'Hello' },
    { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' },
    { spanish: 'Buenas noches', english: 'Good night' },
    { spanish: 'Adiós', english: 'Goodbye' },
    { spanish: 'Hasta luego', english: 'See you later' },
];

const countriesExerciseData = [
    { pais: 'Estados Unidos', country: 'United States', nationality: 'American' },
    { pais: 'Canadá', country: 'Canada', nationality: 'Canadian' },
    { pais: 'México', country: 'Mexico', nationality: 'Mexican' },
    { pais: 'Brasil', country: 'Brazil', nationality: 'Brazilian' },
    { pais: 'Inglaterra', country: 'England', nationality: 'English' },
    { pais: 'Francia', country: 'France', nationality: 'French' },
];

const readingData = {
    title: 'Mi Rutina Diaria',
    content: "Hola, me llamo Carlos. Cada mañana, me levanto a las siete. Bebo café y leo las noticias. Trabajo en una oficina. Por la tarde, me gusta caminar en el parque. Por la noche, ceno con mi familia y vemos la televisión. A las diez de la noche, me voy a dormir. ¡Buenas noches!",
    questions: [
        { id: 'q1', question: '¿A qué hora se levanta Carlos?', answer: 'a las siete' },
        { id: 'q2', question: '¿Qué bebe por la mañana?', answer: 'café' },
        { id: 'q3', question: '¿Qué hace por la tarde?', answer: 'caminar en el parque' },
    ]
};

const mixedExercisesData = [
    { english: 'Hello, how are you?', spanish: ['hola, ¿cómo estás?', 'hola, como estas', 'hola ¿cómo estás?', 'hola como estas'] },
    { english: 'She is my mother', spanish: ['ella es mi madre', 'ella es mi mamá', 'ella es mi mama'] },
    { english: 'The book is blue', spanish: ['el libro es azul'] },
    { english: 'Today is Wednesday', spanish: ['hoy es miércoles', 'hoy es miercoles'] },
    { english: 'I am American', spanish: ['yo soy estadounidense', 'soy estadounidense', 'yo soy americano', 'soy americano'] },
    { english: 'It is half past ten', spanish: ['son las diez y media', 'es la diez y media'] },
    { english: 'He is fifteen years old', spanish: ['él tiene quince años', 'el tiene quince años', 'él tiene 15 años', 'el tiene 15 años'] },
    { english: 'Nice to meet you', spanish: ['mucho gusto', 'encantado', 'encantada', 'un placer'] },
    { english: 'We are in Mexico', spanish: ['nosotros estamos en méxico', 'nosotros estamos en mexico', 'estamos en méxico', 'estamos en mexico'] },
    { english: 'Goodbye, take care', spanish: ['adiós, cuídate', 'adios, cuidate', 'chao, cuídate', 'chao, cuidate'] },
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
    { num: '1', word: 'Uno' },
    { num: '12', word: 'Doce' },
    { num: '15', word: 'Quince' },
    { num: '20', word: 'Veinte' },
    { num: '50', word: 'Cincuenta' },
    { num: '100', word: 'Cien' },
    { num: '500', word: 'Quinientos' },
    { num: '900', word: 'Novecientos' },
    { num: '1000', word: 'Mil' },
    { num: "1'000.000", word: 'Un millón' },
];

const timeExercisesData = [
    { time: '2:00', word: 'Son las dos en punto' },
    { time: '2:30', word: 'Son las dos y media' },
    { time: '5:15', word: 'Son las cinco y cuarto' },
    { time: '10:45', word: 'Son las once menos cuarto' },
    { time: '8:00', word: 'Son las ocho en punto' },
    { time: '12:00', word: 'Es mediodía' },
    { time: '6:45', word: 'Son las siete menos cuarto' },
    { time: '3:15', word: 'Son las tres y cuarto' },
    { time: '1:30', word: 'Es la una y media' },
    { time: '9:00', word: 'Son las nueve en punto' },
];

// Components inside the page file

const MemoryGame = ({ data, onComplete }: { data: { spanish: string; english: string; }[], onComplete: () => void }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const initializeGame = React.useCallback(() => {
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
        if (isGameComplete) {
            onComplete();
        }
    }, [isGameComplete, onComplete]);

    const handleCardClick = (index: number) => {
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) {
            return;
        }
        setFlippedIndices(prev => [...prev, index]);
    };

    if (!isClient) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Juego de Memoria: Saludos y Despedidas</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
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
                                <Card key={card.id} onClick={() => handleCardClick(index)}
                                    className={cn("flex items-center justify-center aspect-square cursor-pointer", isFlipped || isMatched ? "bg-card border-primary" : "bg-secondary", isMatched && "border-green-500")}>
                                    <CardContent className="p-1 text-center">
                                        {isFlipped || isMatched ? <span className="text-sm font-bold">{card.text}</span> : <BrainCircuit className="h-5 w-5 text-primary/50" />}
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

type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';

const CountriesExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    type CountryAnswers = { pais: string; };
    type UserAnswers = Record<number, Partial<CountryAnswers>>;
    type ValidationState = Record<number, { pais: ValidationStatus }>;

    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [validationStatus, setValidationStatus] = useState<ValidationState>({});

    const handleInputChange = (index: number, field: 'pais', value: string) => {
        setUserAnswers(prev => ({ ...prev, [index]: { ...prev[index], [field]: value } }));
        setValidationStatus(prev => {
            const newStatus = { ...prev };
            if (newStatus[index]) {
                newStatus[index][field] = 'unchecked';
            }
            return newStatus;
        });
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: ValidationState = {};
        countriesExerciseData.forEach((correctAnswer, index) => {
            const userAnswer = userAnswers[index] || {};
            const isCountryCorrect = (userAnswer.pais || '').trim().toLowerCase() === correctAnswer.pais.toLowerCase();
            
            newValidationStatus[index] = {
                pais: isCountryCorrect ? 'correct' : 'incorrect',
            };
            if (!isCountryCorrect) allCorrect = false;
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Todas tus respuestas son correctas." });
            onComplete();
        } else {
            toast({ variant: 'destructive', title: "Algunas respuestas son incorrectas" });
        }
    };
    
    const getInputClass = (status?: ValidationStatus) => {
        if (status === 'correct') return 'border-green-500';
        if (status === 'incorrect') return 'border-destructive';
        return '';
    };

    return (
        <Card>
            <CardHeader><CardTitle>Países</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead>País</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {countriesExerciseData.map((data, index) => (
                            <TableRow key={index}>
                                <TableCell>{data.country}</TableCell>
                                <TableCell><Input value={userAnswers[index]?.pais || ''} onChange={(e) => handleInputChange(index, 'pais', e.target.value)} className={cn(getInputClass(validationStatus[index]?.pais))} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter><Button onClick={handleCheckAnswers}>Verificar</Button></CardFooter>
        </Card>
    );
};

const NumbersExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, ValidationStatus>>({});
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const currentPrompt = numbersExercisesData[currentIndex];
    const totalPrompts = numbersExercisesData.length;

    const handleInputChange = (value: string) => {
        setUserAnswers(prev => ({ ...prev, [currentIndex]: value }));
        setValidationStatus(prev => ({ ...prev, [currentIndex]: 'unchecked' }));
    };

    const handleCheck = () => {
        const userAnswer = (userAnswers[currentIndex] || '').trim().toLowerCase().replace(/[.]/g, '');
        const correctAnswer = currentPrompt.word.toLowerCase().replace(/[.]/g, '');
        
        const isCorrect = userAnswer === correctAnswer;
        const newStatus = isCorrect ? 'correct' : 'incorrect';
        
        setValidationStatus(prev => ({ ...prev, [currentIndex]: newStatus }));

        if (isCorrect) {
            toast({ title: '¡Correcto!', description: 'Puedes pasar al siguiente.' });
        } else {
            toast({ variant: 'destructive', title: 'Incorrecto', description: 'Inténtalo de nuevo.' });
        }
    };
    
    const handleNext = () => {
        if (currentIndex < totalPrompts - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const allCorrect = Object.values(validationStatus).filter(s => s === 'correct').length === totalPrompts;
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
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicio Números</CardTitle>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {numbersExercisesData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStatus[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStatus[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center py-8 bg-muted rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Escribe la traducción de:</p>
                    <p className="text-4xl font-bold">{currentPrompt.num}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="answer">Números en español:</Label>
                    <Input 
                        id="answer"
                        value={userAnswers[currentIndex] || ''} 
                        onChange={e => handleInputChange(e.target.value)}
                        className={cn(
                            "text-lg h-12",
                            validationStatus[currentIndex] === 'correct' && 'border-green-500 focus-visible:ring-green-500',
                            validationStatus[currentIndex] === 'incorrect' && 'border-destructive focus-visible:ring-destructive'
                        )}
                        placeholder="Escribe aquí..."
                        autoComplete="off"
                    />
                </div>
            </CardContent>
            <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck}>Verificar</Button>
                    <Button onClick={handleNext} disabled={validationStatus[currentIndex] !== 'correct'}>
                        {currentIndex === totalPrompts - 1 ? 'Finalizar' : 'Siguiente'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const TimeExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, ValidationStatus>>({});
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const currentPrompt = timeExercisesData[currentIndex];
    const totalPrompts = timeExercisesData.length;

    const handleInputChange = (value: string) => {
        setUserAnswers(prev => ({ ...prev, [currentIndex]: value }));
        setValidationStatus(prev => ({ ...prev, [currentIndex]: 'unchecked' }));
    };

    const handleCheck = () => {
        const userAnswer = (userAnswers[currentIndex] || '').trim().toLowerCase().replace(/[.]/g, '');
        const correctAnswer = currentPrompt.word.toLowerCase().replace(/[.]/g, '');
        
        const isCorrect = userAnswer === correctAnswer;
        const newStatus = isCorrect ? 'correct' : 'incorrect';
        
        setValidationStatus(prev => ({ ...prev, [currentIndex]: newStatus }));

        if (isCorrect) {
            toast({ title: '¡Correcto!', description: 'Puedes pasar al siguiente.' });
        } else {
            toast({ variant: 'destructive', title: 'Incorrecto', description: 'Inténtalo de nuevo.' });
        }
    };
    
    const handleNext = () => {
        if (currentIndex < totalPrompts - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const allCorrect = Object.values(validationStatus).filter(s => s === 'correct').length === totalPrompts;
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
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Ejercicio Completado!</h2>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicios Hora</CardTitle>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {timeExercisesData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStatus[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStatus[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center py-8 bg-muted rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Escribe la traducción de:</p>
                    <p className="text-4xl font-bold">{currentPrompt.time}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="answer">Hora en Español:</Label>
                    <Input 
                        id="answer"
                        value={userAnswers[currentIndex] || ''} 
                        onChange={e => handleInputChange(e.target.value)}
                        className={cn(
                            "text-lg h-12",
                            validationStatus[currentIndex] === 'correct' && 'border-green-500 focus-visible:ring-green-500',
                            validationStatus[currentIndex] === 'incorrect' && 'border-destructive focus-visible:ring-destructive'
                        )}
                        placeholder="Escribe aquí..."
                        autoComplete="off"
                    />
                </div>
            </CardContent>
            <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck}>Verificar</Button>
                    <Button onClick={handleNext} disabled={validationStatus[currentIndex] !== 'correct'}>
                        {currentIndex === totalPrompts - 1 ? 'Finalizar' : 'Siguiente'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const ReadingExercise = ({ onComplete }: { onComplete: () => void }) => {
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({});
    const { toast } = useToast();

    const handleInputChange = (id: string, value: string) => setUserAnswers(prev => ({ ...prev, [id]: value }));

    const handleCheckReading = () => {
        const newValidation: Record<string, ValidationStatus> = {};
        let allCorrect = true;
        readingData.questions.forEach(q => {
            const isCorrect = (userAnswers[q.id] || '').trim().toLowerCase() === q.answer.toLowerCase();
            if (!isCorrect) allCorrect = false;
            newValidation[q.id] = isCorrect ? 'correct' : 'incorrect';
        });
        setValidationStatus(newValidation);
        if (allCorrect) {
            toast({ title: '¡Muy bien!', description: 'Has respondido todo correctamente.' });
            onComplete();
        } else {
            toast({ variant: 'destructive', title: 'Algunas respuestas son incorrectas.' });
        }
    };
    
    return (
        <Card>
            <CardHeader><CardTitle>Lectura: {readingData.title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <p className="text-lg leading-relaxed bg-muted p-4 rounded-md">{readingData.content}</p>
                <div className="space-y-4 border-t pt-4">
                {readingData.questions.map(q => (
                    <div key={q.id}>
                        <Label htmlFor={q.id} className="text-base">{q.question}</Label>
                        <Input id={q.id} value={userAnswers[q.id] || ''} onChange={e => handleInputChange(q.id, e.target.value)}
                            className={cn('mt-1', validationStatus[q.id] === 'correct' && 'border-green-500', validationStatus[q.id] === 'incorrect' && 'border-destructive')} />
                    </div>
                ))}
                </div>
            </CardContent>
            <CardFooter><Button onClick={handleCheckReading}>Verificar Lectura</Button></CardFooter>
        </Card>
    );
};

const MixedExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, ValidationStatus>>({});
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);

    const currentPrompt = mixedExercisesData[currentIndex];
    const totalPrompts = mixedExercisesData.length;
    
    const handleInputChange = (value: string) => {
        setUserAnswers(prev => ({ ...prev, [currentIndex]: value }));
        setValidationStatus(prev => ({ ...prev, [currentIndex]: 'unchecked' }));
    };

    const handleCheck = () => {
        const userAnswer = (userAnswers[currentIndex] || '').trim().toLowerCase().replace(/[.?,¿!¡]/g, '');
        const isCorrect = currentPrompt.spanish.some(correct => correct.toLowerCase().replace(/[.?,¿!¡]/g, '') === userAnswer);
        
        const newStatus = isCorrect ? 'correct' : 'incorrect';
        setValidationStatus(prev => ({ ...prev, [currentIndex]: newStatus }));

        if (isCorrect) {
            toast({ title: '¡Excelente!', description: 'La traducción es correcta.' });
        } else {
            toast({ variant: 'destructive', title: 'Inténtalo de nuevo', description: 'La traducción no coincide con las respuestas esperadas.' });
        }
    };

    const handleNext = () => {
        if (currentIndex < totalPrompts - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const allCorrect = Object.values(validationStatus).filter(s => s === 'correct').length === totalPrompts;
            if (allCorrect) {
                setShowCompletionMessage(true);
                onComplete();
            } else {
                toast({ variant: 'destructive', title: 'Revisa tus respuestas', description: 'Debes completar todos los retos correctamente.' });
            }
        }
    };

    if (showCompletionMessage) {
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold">¡Reto Mixto Superado!</h2>
                    <p className="text-muted-foreground mt-2">Has dominado los temas de Intro 1E y 2E.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Ejercicios Mixtos (1E & 2E)</CardTitle>
                <div className="flex items-center justify-start flex-wrap gap-2 pt-4">
                    {mixedExercisesData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                currentIndex === index ? "border-primary ring-2 ring-primary" : "border-muted-foreground/50",
                                validationStatus[index] === 'correct' && 'bg-green-500/20 border-green-500 text-green-700',
                                validationStatus[index] === 'incorrect' && 'bg-red-500/20 border-destructive text-destructive',
                            )}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center py-8 bg-muted rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Traduce esta frase al español:</p>
                    <p className="text-2xl font-bold">"{currentPrompt.english}"</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="answer">Tu traducción al español:</Label>
                    <Input 
                        id="answer"
                        value={userAnswers[currentIndex] || ''} 
                        onChange={e => handleInputChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCheck()}
                        className={cn(
                            "text-lg h-12",
                            validationStatus[currentIndex] === 'correct' && 'border-green-500 focus-visible:ring-green-500',
                            validationStatus[currentIndex] === 'incorrect' && 'border-destructive focus-visible:ring-destructive'
                        )}
                        placeholder="Escribe tu traducción..."
                        autoComplete="off"
                    />
                </div>
            </CardContent>
            <CardFooter className="justify-between">
                <Button variant="outline" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleCheck}>Verificar</Button>
                    <Button onClick={handleNext} disabled={validationStatus[currentIndex] !== 'correct'}>
                        {currentIndex === totalPrompts - 1 ? 'Finalizar' : 'Siguiente'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const progressStorageKey = 'progress_espanol_intro_2_v1';
const mainProgressKey = 'progress_espanol_intro_2';

export default function EspanolIntro2Page() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('memory_game');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'memory_game', name: 'Juego de Memoria', icon: BrainCircuit, status: 'active' },
        { key: 'numeros', name: 'Números', icon: Hash, status: 'locked' },
        { key: 'ejercicio_numeros', name: 'Ejercicio Numeros', icon: PenSquare, status: 'locked' },
        { key: 'time', name: 'La Hora', icon: Clock, status: 'locked' },
        { key: 'time_exercises', name: 'Ejercicios Hora', icon: PenSquare, status: 'locked' },
        { key: 'countries', name: 'Países y Nacionalidades', icon: Globe, status: 'locked' },
        { key: 'reading', name: 'Lectura y Comprensión', icon: BookOpen, status: 'locked' },
        { key: 'mixed_exercises', name: 'Ejercicios Mixtos', icon: PenSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (!isClient || isUserLoading || isProfileLoading) return;
        const newPath = initialLearningPath.map(item => ({...item}));
        
        if (isAdmin) {
            newPath.forEach(item => item.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageKey];
            newPath.forEach(item => { if (savedStatuses[item.key]) item.status = savedStatuses[item.key]; });
        }
        
        setLearningPath(newPath);
        const firstActive = newPath.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || 'memory_game');
    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading, isClient]);

    const progress = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        if (!isAdmin && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, string> = {};
            learningPath.forEach(item => { statusesToSave[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageKey}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: progress
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progress, isAdmin, studentDocRef, isProfileLoading, isUserLoading]);

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
                     toast({ title: "¡Tema desbloqueado!", description: `Ahora puedes continuar con ${newPath[nextIndex].name}` });
                } else if (newPath.every(item => item.status === 'completed')) {
                    toast({ title: "¡Felicidades!", description: "Has completado todos los temas de esta lección." });
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
            toast({ variant: 'destructive', title: 'Tema Bloqueado' });
            return;
        }
        setSelectedTopic(key);
        if (['time', 'numeros'].includes(key)) {
            handleTopicComplete(key);
        }
    };

    const renderContent = () => {
        switch(selectedTopic) {
            case 'memory_game': return <MemoryGame data={greetingsAndFarewellsData} onComplete={() => handleTopicComplete('memory_game')} />;
            case 'numeros':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Números</CardTitle>
                            <CardDescription>Repasa los números básicos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {numerosData.map((item) => (
                                    <div key={item.num} className="p-4 bg-muted rounded-xl text-center border-2 border-transparent hover:border-primary transition-colors">
                                        <p className="text-3xl font-bold text-primary">{item.num}</p>
                                        <p className="text-sm font-medium text-muted-foreground uppercase">{item.word}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('numeros')}>He terminado de repasar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ejercicio_numeros':
                return <NumbersExercise onComplete={() => handleTopicComplete('ejercicio_numeros')} />;
            case 'time': return (
                <Card>
                    <CardHeader><CardTitle>La Hora</CardTitle></CardHeader>
                    <CardContent>
                        <h3 className="text-xl font-semibold mb-4">¿Qué hora es? - What time is it?</h3>
                        <div className="space-y-4 text-lg">
                            <p><span className="font-bold">2:00</span> - Son las dos en punto. (It's two o'clock.)</p>
                            <p><span className="font-bold">2:05</span> - Son las dos y cinco. (It's five past two.)</p>
                            <p><span className="font-bold">2:15</span> - Son las dos y cuarto. (It's a quarter past two.)</p>
                            <p><span className="font-bold">2:30</span> - Son las dos y media. (It's half past two.)</p>
                            <p><span className="font-bold">2:45</span> - Son las tres menos cuarto. (It's a quarter to three.)</p>
                            <p><span className="font-bold">2:50</span> - Son las tres menos diez. (It's ten to three.)</p>
                        </div>
                        <Separator className="my-6" />
                        <h3 className="text-xl font-semibold mb-4">Otras formas</h3>
                        <div className="space-y-4 text-lg">
                            <p><span className="font-bold">AM</span> - de la mañana (e.g., 8:00 AM - las ocho de la mañana)</p>
                            <p><span className="font-bold">PM</span> - de la tarde / de la noche (e.g., 3:00 PM - las tres de la tarde; 9:00 PM - las nueve de la noche)</p>
                            <p><span className="font-bold">Mediodía</span> - Noon (12:00 PM)</p>
                            <p><span className="font-bold">Medianoche</span> - Midnight (12:00 AM)</p>
                        </div>
                    </CardContent>
                </Card>
            );
            case 'time_exercises':
                return <TimeExercise onComplete={() => handleTopicComplete('time_exercises')} />;
            case 'countries': return <CountriesExercise onComplete={() => handleTopicComplete('countries')} />;
            case 'reading': return <ReadingExercise onComplete={() => handleTopicComplete('reading')} />;
            case 'mixed_exercises': return <MixedExercise onComplete={() => handleTopicComplete('mixed_exercises')} />;
            default: return <p>Selecciona un tema para empezar.</p>;
        }
    };

    if (!isClient) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/espanol/intro" className="hover:underline text-sm text-muted-foreground">Volver a Aventura Intro</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Intro 2 Español</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-4">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map(item => (
                                                <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                    className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                        item.status === 'locked' && !isAdmin ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                        selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                                    )}>
                                                    {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <item.icon className="h-5 w-5" />}
                                                    <span>{item.name}</span>
                                                    {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500 ml-auto" />}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                     <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                            <span>Progreso</span><span className="font-bold text-foreground">{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-8">
                           {renderContent()}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
