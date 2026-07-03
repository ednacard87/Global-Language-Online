'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
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
    Scale,
    HelpCircle
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

const progressStorageVersion = 'progress_es_a1_comp_sup_v1_base';
const mainProgressKey = 'progress_a1_es_comparativos_y_superlativos';

interface Topic {
    key: string;
    name: string;
    icon: React.ElementType;
    status: 'locked' | 'active' | 'completed';
}

const VocabularyContent = ({ onComplete }: { onComplete: () => void }) => {
    const vocabularyList = useMemo(() => [
        { en: "Tall", es: "Alto/a" },
    { en: "Short", es: "Bajo/a" },
    { en: "Big", es: "Grande" },
    { en: "Small", es: "Pequeño/a" },
    { en: "Fast", es: "Rápido/a" },
    { en: "Slow", es: "Lento/a" },
    { en: "Expensive", es: "Caro/a" },
    { en: "Cheap", es: "Barato/a" },
    { en: "Interesting", es: "Interesante" },
    { en: "Boring", es: "Aburrido/a" },
    { en: "Good", es: "Bueno/a" },
    { en: "Bad", es: "Malo/a" },
    { en: "Better", es: "Mejor" },
    { en: "Worse", es: "Peor" },
    { en: "More", es: "Más" },
    { en: "Less", es: "Menos" },
    { en: "Than", es: "Que" },
    { en: "As... as", es: "Tan... como" },
        { en: "big", es: "grande" },
        { en: "small", es: "pequeno" },
        { en: "tall", es: "alto" },
        { en: "short", es: "bajo" },
        { en: "long", es: "largo" },
        { en: "young", es: "joven" },
        { en: "old", es: "viejo" },
        { en: "beautiful", es: "bonito" },
        { en: "ugly", es: "feo" },
        { en: "good", es: "bueno" },
        { en: "bad", es: "malo" },
        { en: "fast", es: "rapido" },
        { en: "slow", es: "lento" },
        { en: "expensive", es: "caro" },
        { en: "cheap", es: "barato" },
        { en: "easy", es: "facil" },
        { en: "difficult", es: "dificil" },
        { en: "strong", es: "fuerte" },
        { en: "weak", es: "debil" },
        { en: "happy", es: "feliz" },
        { en: "sad", es: "triste" },
        { en: "new", es: "nuevo" },
        { en: "clean", es: "limpio" },
        { en: "dirty", es: "sucio" },
        { en: "hot", es: "caliente" },
        { en: "cold", es: "frio" },
        { en: "interesting", es: "interesante" },
        { en: "boring", es: "aburrido" },
        { en: "rich", es: "rico" },
        { en: "poor", es: "pobre" },
        { en: "early", es: "temprano" },
        { en: "late", es: "tarde" },
        { en: "bright", es: "brillante" },
        { en: "dark", es: "oscuro" },
        { en: "heavy", es: "pesado" },
        { en: "light", es: "ligero" },
        { en: "wide", es: "ancho" },
        { en: "narrow", es: "estrecho" },
        { en: "smart", es: "inteligente" },
        { en: "stupid", es: "tonto" },
    ].sort(() => Math.random() - 0.5), []);

    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [results, setResults] = useState<Record<string, boolean | null>>({});

    const handleInputChange = (en: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [en]: value }));
        setResults(prev => ({ ...prev, [en]: null }));
    };

    const handleCheck = () => {
        const newResults: Record<string, boolean> = {};
        let allCorrect = true;
        vocabularyList.forEach(item => {
            const isCorrect = userAnswers[item.en]?.trim().toLowerCase() === item.es;
            newResults[item.en] = isCorrect;
            if (!isCorrect) {
                allCorrect = false;
            }
        });
        setResults(newResults);
        if (allCorrect) {
            onComplete();
        }
    };

    return (
        <div className="p-6 w-full max-w-3xl mx-auto">
            <p className="text-lg text-center mb-6">Traduce las siguientes palabras al español.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {vocabularyList.map((item) => (
                    <div key={item.en} className="grid grid-cols-2 gap-2 items-center">
                        <span className="p-2 bg-muted rounded-md text-sm font-semibold text-right">{item.en}</span>
                        <Input 
                            type="text" 
                            placeholder="Traduccion..." 
                            className={cn(
                                "text-sm",
                                results[item.en] === true && "border-green-500 border-2",
                                results[item.en] === false && "border-red-500 border-2"
                            )}
                            value={userAnswers[item.en] || ''}
                            onChange={(e) => handleInputChange(item.en, e.target.value)}
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-center mt-8">
                 <Button onClick={handleCheck} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase tracking-tighter">
                    Verificar <CheckCircle className="ml-2 h-6 w-6" />
                </Button>
            </div>
        </div>
    );
};

const GrammarContent = ({ onComplete }: { onComplete: () => void }) => {
    const grammarCards = useMemo(() => [
        {
            title: "Comparatives / Comparativos",
            content: "Español: Usamos los comparativos para comparar dos cosas, personas o lugares.\n\nEnglish: We use comparatives to compare two things, people, or places.",
            example: "Español: La formula general es: `mas` + `adjetivo` + `que`.\n\nEnglish: The general formula is: `more` + `adjective` + `than`."
        },
        {
            title: "Ejemplo de Comparativo",
            content: "Español: `Juan es mas alto que Maria.`\n\nEnglish: `Juan is taller than Maria.`",
            example: "Español: Aqui comparamos la altura de Juan con la de Maria.\n\nEnglish: Here we compare Juan's height with Maria's."
        },
        {
            title: "Superlatives / Superlativos",
            content: "Español: Usamos los superlativos para destacar una cualidad al maximo nivel dentro de un grupo.\n\nEnglish: We use superlatives to highlight a quality to the highest degree within a group.",
            example: "Español: La formula es: `el/la/los/las` + `mas` + `adjetivo` + `de` o `del`.\n\nEnglish: The formula is: `the` + `most` + `adjective` + `of` or `in`."
        },
        {
            title: "Ejemplo de Superlativo",
            content: "Español: `El Everest es la montana mas alta del mundo.`\n\nEnglish: `Mount Everest is the highest mountain in the world.`",
            example: "Español: Destacamos que ninguna otra montana en el grupo (el mundo) es mas alta.\n\nEnglish: We are highlighting that no other mountain in the group (the world) is higher."
        },
        {
            title: "Irregular Adjectives / Adjetivos Irregulares",
            content: "Español: Algunos adjetivos tienen formas comparativas y superlativas especiales. No usan `mas`.\n\nEnglish: Some adjectives have special comparative and superlative forms. They don't use `more`.",
            example: "Bueno -> Mejor -> El/La mejor (Good -> Better -> The best)\nMalo -> Peor -> El/La peor (Bad -> Worse -> The worst)"
        },
        {
            title: "Ejemplo con Irregulares",
            content: "Español: `Este chocolate es mejor que las verduras.` (Comparativo)\n\nEnglish: `This chocolate is better than vegetables.` (Comparative)",
            example: "Español: `Este es el peor dia de mi vida.` (Superlativo)\n\nEnglish: `This is the worst day of my life.` (Superlative)"
        }
    ], []);

    const [currentCard, setCurrentCard] = useState(0);

    const handleNext = () => {
        if (currentCard < grammarCards.length - 1) {
            setCurrentCard(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentCard > 0) {
            setCurrentCard(prev => prev - 1);
        }
    };

    const progress = ((currentCard + 1) / grammarCards.length) * 100;
    const card = grammarCards[currentCard];

    return (
        <div className="p-6 w-full max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-full mb-6">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-sm text-muted-foreground mt-2 text-center">{currentCard + 1} / {grammarCards.length}</p>
            </div>

            <Card className="w-full min-h-[300px] flex flex-col justify-center items-center text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 whitespace-pre-line">
                    <p className="text-lg">{card.content}</p>
                    {card.example && <p className="text-md bg-muted p-3 rounded-lg">{card.example}</p>}
                </CardContent>
            </Card>

            <div className="flex w-full justify-between mt-6">
                <Button variant="outline" onClick={handlePrev} disabled={currentCard === 0}> 
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                {currentCard === grammarCards.length - 1 ? (
                    <Button onClick={onComplete} className="font-bold">
                        Entendido <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleNext}>Siguiente <ArrowRight className="ml-2 h-4 w-4" /> </Button>
                )}
            </div>
        </div>
    );
};

const TranslationExercise = ({ title, exercises, onComplete, vocabulary }: { title: string, exercises: { sentence: string, correct: string[] }[], onComplete: () => void, vocabulary?: { en: string, es: string }[] }) => {
    const [currentExercise, setCurrentExercise] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [results, setResults] = useState<Record<number, boolean | null>>({});
    const { toast } = useToast();

    const currentPrompt = exercises[currentExercise];

    const handleCheck = () => {
        const userAnswer = userAnswers[currentExercise]?.trim().toLowerCase() || '';
        const isCorrect = currentPrompt.correct.some(c => c.toLowerCase() === userAnswer);
        setResults(prev => ({ ...prev, [currentExercise]: isCorrect }));
        if (isCorrect) {
            toast({ title: "¡Correcto!", className: "bg-green-500 text-white" });
        } else {
            toast({ title: "Respuesta incorrecta", description: "¡Intentalo de nuevo!", variant: "destructive" });
        }
    };

    const handleNext = () => {
        if (currentExercise < exercises.length - 1) {
            setCurrentExercise(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleInputChange = (value: string) => {
        setUserAnswers(prev => ({...prev, [currentExercise]: value}));
        if (results[currentExercise] !== null) {
            setResults(prev => ({...prev, [currentExercise]: null}));
        }
    }
    
    const progress = (Object.values(results).filter(r => r === true).length / exercises.length) * 100;
    const isCurrentCorrect = results[currentExercise] === true;

    return (
        <div className="p-6 w-full max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-full mb-4">
                <div className="flex justify-center items-center mb-2 relative">
                    <h3 className="text-2xl font-bold text-primary text-center">{title}</h3>
                    {vocabulary && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="absolute right-0"><HelpCircle className="mr-2 h-4 w-4" /> Vocabulario</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                   <h4 className="font-medium leading-none">Vocabulario Clave</h4>
                                    <div className="grid gap-2">
                                        {vocabulary.map(word => (
                                            <div key={word.en} className="grid grid-cols-2 items-center gap-2">
                                                <span className="font-semibold">{word.en}</span>
                                                <span className="text-muted-foreground">{word.es}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
                <Progress value={progress} className="w-full h-2" />
                <p className="text-sm text-muted-foreground mt-2 text-center">{Object.values(results).filter(r => r === true).length} / {exercises.length}</p>
            </div>

            <Card className="w-full min-h-[250px] flex flex-col justify-center items-center text-center shadow-lg p-6">
                <p className="font-semibold text-lg mb-4 text-center">{currentPrompt.sentence}</p>
                <Input 
                    value={userAnswers[currentExercise] || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Escribe tu traduccion..."
                    className={cn(
                        "text-center text-lg h-12",
                        results[currentExercise] === true && "border-green-500 border-2",
                        results[currentExercise] === false && "border-red-500 border-2"
                    )}
                    disabled={isCurrentCorrect}
                />
            </Card>

            <div className="flex w-full justify-between items-center mt-6">
                 <Button variant="outline" onClick={() => setCurrentExercise(p => p - 1)} disabled={currentExercise === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                
                {!isCurrentCorrect ? (
                    <Button onClick={handleCheck} size="lg">Verificar</Button>
                ) : (
                    currentExercise < exercises.length - 1 ? (
                         <Button onClick={handleNext} size="lg" className="bg-green-600 hover:bg-green-700">
                             Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                         </Button>
                    ) : (
                         <Button onClick={onComplete} size="lg" className="bg-green-600 hover:bg-green-700">
                             Finalizar <Trophy className="ml-2 h-4 w-4" />
                         </Button>
                    )
                )}
            </div>
        </div>
    );
};

const VocabularyGame = ({ onComplete }: { onComplete: () => void }) => {
    const words = useMemo(() => [
        { type: 'en', value: 'Better', id: 1 }, { type: 'es', value: 'Mejor', id: 1 },
        { type: 'en', value: 'Worse', id: 2 }, { type: 'es', value: 'Peor', id: 2 },
        { type: 'en', value: 'Faster', id: 3 }, { type: 'es', value: 'Mas rapido', id: 3 },
        { type: 'en', value: 'Slower', id: 4 }, { type: 'es', value: 'Mas lento', id: 4 },
        { type: 'en', value: 'Stronger', id: 5 }, { type: 'es', value: 'Mas fuerte', id: 5 },
        { type: 'en', value: 'The oldest', id: 6 }, { type: 'es', value: 'El mas viejo', id: 6 },
        { type: 'en', value: 'The cheapest', id: 7 }, { type: 'es', value: 'El mas barato', id: 7 },
        { type: 'en', value: 'The biggest', id: 8 }, { type: 'es', value: 'El mas grande', id: 8 },
        { type: 'en', value: 'The smallest', id: 9 }, { type: 'es', value: 'El mas pequeno', id: 9 },
        { type: 'en', value: 'The best', id: 10 }, { type: 'es', value: 'El mejor', id: 10 }
    ], []);

    const [shuffledWords, setShuffledWords] = useState<(typeof words[0] & { uniqueId: number })[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [matched, setMatched] = useState<number[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const duplicatedWords = [...words, ...words.map(w => ({ ...w, type: w.type + '_copy' }))];
        const allWords = duplicatedWords.sort(() => 0.5 - Math.random());
        setShuffledWords(allWords.map((w, i) => ({...w, uniqueId: i })));
    }, [words]);

    useEffect(() => {
        if (matched.length === words.length) {
            toast({ title: "¡Juego Completado!", description: "¡Excelente memoria!", className: "bg-blue-500 text-white" });
            onComplete();
        }
    }, [matched, words.length, onComplete, toast]);

    useEffect(() => {
        if (selected.length === 2) {
            const [firstIndex, secondIndex] = selected;
            const firstWord = shuffledWords[firstIndex];
            const secondWord = shuffledWords[secondIndex];

            if (firstWord.id === secondWord.id && firstWord.type !== secondWord.type) {
                setMatched(prev => [...prev, firstWord.id]);
                toast({ title: "¡Correcto!", className: "bg-green-500 text-white" });
            } else {
                 toast({ title: "Incorrecto", description: "Intentalo de nuevo.", variant: "destructive" });
            }
            setTimeout(() => setSelected([]), 1000);
        }
    }, [selected, shuffledWords, toast]);

    const handleSelect = (index: number) => {
        const word = shuffledWords[index];
        if (selected.length < 2 && !selected.includes(index) && !matched.includes(word.id)) {
            setSelected(prev => [...prev, index]);
        }
    };

    return (
        <div className="p-6 w-full max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-4 text-center">Juego de Memoria</h3>
            <div className="grid grid-cols-4 gap-4">
                {shuffledWords.map((word, index) => (
                    <div 
                        key={word.uniqueId}
                        onClick={() => handleSelect(index)}
                        className={cn("h-24 flex items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-300", {
                            "bg-muted hover:bg-primary/10": !selected.includes(index),
                            "bg-primary text-primary-foreground transform scale-105": selected.includes(index),
                            "bg-green-500 text-white opacity-50 cursor-not-allowed": matched.includes(word.id),
                        })}
                    >
                        <span className="text-center font-semibold">{word.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ReadingContent = ({ onComplete }: { onComplete: () => void }) => {
    const readingData = useMemo(() => ({
        title: "Una competencia en la ciudad",
        content: "En mi ciudad, hay dos restaurantes famosos: 'La Cuchara Rapida' y 'El Tenedor Elegante'. 'La Cuchara Rapida' es mas barato que 'El Tenedor Elegante', pero la comida en 'El Tenedor Elegante' es mejor. El parque de la ciudad es el lugar mas bonito de todos, y es mas grande que mi casa. La biblioteca es el edificio mas viejo de la ciudad. Mi amigo Juan es mas alto que yo, pero yo soy mas rapido. En la escuela, la clase de matematicas es la mas dificil, pero la clase de español es la mas facil para mi.",
        questions: [
            { q: "Cual restaurante es mas barato?", a: ["la cuchara rapida"] },
            { q: "Que lugar es el mas bonito de la ciudad?", a: ["el parque", "el parque de la ciudad"] },
            { q: "Que clase es la mas dificil para el narrador?", a: ["matematicas", "la clase de matematicas"] },
            { q: "Quien es mas alto, el narrador o Juan?", a: ["juan"] },
            { q: "Como es la comida en 'El Tenedor Elegante'?", a: ["mejor"] },
        ]
    }), []);

    const vocabulary = useMemo(() => [
        { en: "cheaper", es: "mas barato" },
        { en: "better", es: "mejor" },
        { en: "the most beautiful", es: "el mas bonito" },
        { en: "bigger", es: "mas grande" },
        { en: "the oldest", es: "el mas viejo" },
        { en: "taller", es: "mas alto" },
        { en: "faster", es: "mas rapido" },
        { en: "the most difficult", es: "la mas dificil" },
        { en: "the easiest", es: "la mas facil" },
    ], []);
    
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [results, setResults] = useState<Record<number, boolean | null>>({});
    const { toast } = useToast();

    const currentPrompt = readingData.questions[currentQuestion];

    const handleCheck = () => {
        const userAnswer = userAnswers[currentQuestion]?.trim().toLowerCase() || '';
        const isCorrect = currentPrompt.a.some(c => c.toLowerCase() === userAnswer);
        setResults(prev => ({ ...prev, [currentQuestion]: isCorrect }));
        if (isCorrect) {
            toast({ title: "¡Correcto!", className: "bg-green-500 text-white" });
        } else {
            toast({ title: "Respuesta incorrecta", description: "¡Intentalo de nuevo!", variant: "destructive" });
        }
    };

    const handleNext = () => {
        if (currentQuestion < readingData.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleInputChange = (value: string) => {
        setUserAnswers(prev => ({...prev, [currentQuestion]: value}));
        if (results[currentQuestion] !== null) {
            setResults(prev => ({...prev, [currentQuestion]: null}));
        }
    }
    
    const progress = (Object.values(results).filter(r => r === true).length / readingData.questions.length) * 100;
    const isCurrentCorrect = results[currentQuestion] === true;

    return (
        <div className="p-6 w-full max-w-3xl mx-auto flex flex-col items-center">
             <div className="w-full mb-4">
                <div className="flex justify-center items-center mb-2 relative">
                    <h3 className="text-2xl font-bold text-primary text-center">{readingData.title}</h3>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="absolute right-0"><HelpCircle className="mr-2 h-4 w-4" /> Vocabulario</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                               <h4 className="font-medium leading-none">Vocabulario Clave</h4>
                                <div className="grid gap-2">
                                    {vocabulary.map(word => (
                                        <div key={word.en} className="grid grid-cols-2 items-center gap-2">
                                            <span className="font-semibold">{word.en}</span>
                                            <span className="text-muted-foreground">{word.es}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <p className="mb-6 bg-muted p-4 rounded-lg text-left w-full">{readingData.content}</p>

            <div className="w-full mb-4">
                <Progress value={progress} className="w-full h-2" />
                <p className="text-sm text-muted-foreground mt-2 text-center">{Object.values(results).filter(r => r === true).length} / {readingData.questions.length}</p>
            </div>

            <Card className="w-full min-h-[200px] flex flex-col justify-center items-center text-center shadow-lg p-6">
                <p className="font-semibold text-lg mb-4 text-center">{currentPrompt.q}</p>
                <Input 
                    value={userAnswers[currentQuestion] || ''}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className={cn(
                        "text-center text-lg h-12",
                        results[currentQuestion] === true && "border-green-500 border-2",
                        results[currentQuestion] === false && "border-red-500 border-2"
                    )}
                    disabled={isCurrentCorrect}
                />
            </Card>

            <div className="flex w-full justify-between items-center mt-6">
                 <Button variant="outline" onClick={() => setCurrentQuestion(p => p - 1)} disabled={currentQuestion === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                
                {!isCurrentCorrect ? (
                    <Button onClick={handleCheck} size="lg">Verificar</Button>
                ) : (
                    currentQuestion < readingData.questions.length - 1 ? (
                         <Button onClick={handleNext} size="lg" className="bg-green-600 hover:bg-green-700">
                             Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                         </Button>
                    ) : (
                         <Button onClick={onComplete} size="lg" className="bg-green-600 hover:bg-green-700">
                             Finalizar <Trophy className="ml-2 h-4 w-4" />
                         </Button>
                    )
                )}
            </div>
        </div>
    );
};

const FinalExercise = ({ onComplete }: { onComplete: () => void }) => {
    const sentences = useMemo(() => [
        { parts: ["El Everest es la montana ", " (alta) del mundo."], answer: "mas alta" },
        { parts: ["Mi coche es ", " (rapido) que el tuyo."], answer: "mas rapido" },
        { parts: ["Esta es la ", " (buena) pelicula que he visto."], answer: "mejor" },
        { parts: ["Ella es ", " (joven) de la clase."], answer: "la mas joven" },
        { parts: ["Invierno es la estacion ", " (fria) del año."], answer: "la mas fria" },
        { parts: ["Este examen fue ", " (dificil) que el anterior."], answer: "mas dificil" },
        { parts: ["Es el hotel ", " (caro) de la ciudad."], answer: "el mas caro" },
        { parts: ["Tu casa es ", " (grande) que la mia."], answer: "mas grande" },
        { parts: ["Hoy es el dia ", " (feliz) de mi vida."], answer: "el mas feliz" },
        { parts: ["Este libro es ", " (interesante) que el de ayer."], answer: "mas interesante" },
        { parts: ["Mi hermano es ", " (alto) que mi padre."], answer: "mas alto" },
        { parts: ["El Amazonas es el rio ", " (largo) del mundo."], answer: "el mas largo" },
        { parts: ["El resultado del examen fue ", " (malo) de lo esperado."], answer: "peor" },
        { parts: ["La Antartida es el lugar ", " (frio) de la Tierra."], answer: "el mas frio" },
        { parts: ["Esta pregunta es ", " (facil) de todas."], answer: "la mas facil" },
    ], []);

    const vocabulary = useMemo(() => [
        { en: "alta", es: "mas alta" },
        { en: "rapido", es: "mas rapido" },
        { en: "buena", es: "mejor" },
        { en: "joven", es: "la mas joven" },
        { en: "fria", es: "la mas fria" },
        { en: "dificil", es: "mas dificil" },
        { en: "caro", es: "el mas caro" },
        { en: "grande", es: "mas grande" },
        { en: "feliz", es: "el mas feliz" },
        { en: "interesante", es: "mas interesante" },
        { en: "alto", es: "mas alto" },
        { en: "largo", es: "el mas largo" },
        { en: "malo", es: "peor" },
        { en: "frio", es: "el mas frio" },
        { en: "facil", es: "la mas facil" },
    ], []);

    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [results, setResults] = useState<Record<number, boolean | null>>({});

    const handleInputChange = (index: number, value: string) => {
        setUserAnswers(prev => ({ ...prev, [index]: value }));
        setResults(prev => ({ ...prev, [index]: null }));
    };

    const handleCheck = () => {
        const newResults: Record<number, boolean> = {};
        let allCorrect = true;
        sentences.forEach((item, index) => {
            const isCorrect = userAnswers[index]?.trim().toLowerCase() === item.answer;
            newResults[index] = isCorrect;
            if (!isCorrect) {
                allCorrect = false;
            }
        });
        setResults(newResults);
        if (allCorrect) {
            onComplete();
        }
    };

    return (
         <div className="p-6 w-full max-w-3xl mx-auto">
            <div className="flex justify-center items-center mb-6 relative">
                <h3 className="text-2xl font-bold text-primary text-center">Ejercicio Final: Completa las frases</h3>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="absolute right-0"><HelpCircle className="mr-2 h-4 w-4" /> Vocabulario</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                           <h4 className="font-medium leading-none">Vocabulario Clave</h4>
                            <div className="grid gap-2">
                                {vocabulary.map(word => (
                                    <div key={word.en} className="grid grid-cols-2 items-center gap-2">
                                        <span className="font-semibold">{word.en}</span>
                                        <span className="text-muted-foreground">{word.es}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-4 text-left">
                {sentences.map((sentence, index) => (
                    <div key={index} className="flex items-center gap-2 flex-wrap">
                        <span>{index + 1}.</span>
                        <span>{sentence.parts[0]}</span>
                        <Input 
                            className={cn(
                                "inline-block w-36",
                                results[index] === true && "border-green-500 border-2",
                                results[index] === false && "border-red-500 border-2"
                            )}
                            value={userAnswers[index] || ''}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                        />
                        <span>{sentence.parts[1]}</span>
                    </div>
                ))}
            </div>
             <div className="flex justify-center mt-8">
                <Button onClick={handleCheck} size="lg" className="px-20 font-black h-14 text-xl shadow-xl uppercase tracking-tighter">
                    Verificar <CheckCircle className="ml-2 h-6 w-6" />
                </Button>
            </div>
        </div>
    );
};

const TranslateTextContent = ({ onComplete }: { onComplete: () => void }) => {
    const textToTranslate = "My city is a very interesting place. The central park is the most beautiful area and it's bigger than my school. There's a new restaurant that is more expensive than the old one, but the food is better. The library is the oldest building. I think learning Spanish is easier than learning German. My dog is faster than my cat, but my cat is smarter.";
    const vocabulary = [
        { en: "Interesting", es: "Interesante" },
        { en: "Beautiful", es: "Bonito/Hermoso" },
        { en: "Bigger", es: "Mas grande" },
        { en: "Expensive", es: "Caro" },
        { en: "Better", es: "Mejor" },
        { en: "Oldest", es: "El mas viejo/antiguo" },
        { en: "Easier", es: "Mas facil" },
        { en: "Faster", es: "Mas rapido" },
        { en: "Smarter", es: "Mas inteligente" }
    ];

    return (
        <div className="p-6 w-full max-w-3xl mx-auto text-left">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-primary">Traducir Texto</h3>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline"><HelpCircle className="mr-2 h-4 w-4" /> Vocabulario</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                           <h4 className="font-medium leading-none">Vocabulario Clave</h4>
                            <div className="grid gap-2">
                                {vocabulary.map(word => (
                                    <div key={word.en} className="grid grid-cols-2 items-center gap-2">
                                        <span className="font-semibold">{word.en}</span>
                                        <span className="text-muted-foreground">{word.es}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <p className="bg-muted p-4 rounded-lg mb-4">{textToTranslate}</p>
            <Textarea placeholder="Escribe tu traduccion aqui..." rows={8} />
            <div className="flex justify-center mt-6">
                <Button onClick={onComplete} size="lg">Entregar Traduccion</Button>
            </div>
        </div>
    );
};

const FinalNegativeForm = ({ onComplete }: { onComplete: () => void }) => {
    const exercises = [
        { sentence: "My house is not bigger than yours.", correct: ["mi casa no es mas grande que la tuya"] },
        { sentence: "She is not the tallest in the class.", correct: ["ella no es la mas alta de la clase"] },
        { sentence: "This car is not faster than a train.", correct: ["este coche no es mas rapido que un tren"] },
        { sentence: "This is not the best movie.", correct: ["esta no es la mejor pelicula"] },
        { sentence: "He is not older than his brother.", correct: ["el no es mayor que su hermano"] },
        { sentence: "The book is not more interesting than the film.", correct: ["el libro no es mas interesante que la pelicula"] },
        { sentence: "It's not the worst day of my life.", correct: ["no es el peor dia de mi vida"] },
        { sentence: "My cat is not slower than a turtle.", correct: ["mi gato no es mas lento que una tortuga"] },
        { sentence: "This restaurant is not the cheapest.", correct: ["este restaurante no es el mas barato"] },
        { sentence: "The exam was not easier than I thought.", correct: ["el examen no fue mas facil de lo que pensaba"] },
    ];

    const vocabulary = [
        { en: "bigger", es: "mas grande" },
        { en: "the tallest", es: "la mas alta" },
        { en: "faster", es: "mas rapido" },
        { en: "the best", es: "la mejor" },
        { en: "older", es: "mayor" },
        { en: "more interesting", es: "mas interesante" },
        { en: "the worst", es: "el peor" },
        { en: "slower", es: "mas lento" },
        { en: "the cheapest", es: "el mas barato" },
        { en: "easier", es: "mas facil" },
    ];

    return (
        <TranslationExercise 
            title="Practica Final: Formas Negativas"
            exercises={exercises}
            onComplete={onComplete}
            vocabulary={vocabulary}
        />
    );
};


function ComparativosSuperlativosContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { user, isUserLoading: isAuthLoading } = useUser();
    const firestore = useFirestore();

    const suppressSave = useRef(false);
    const isInitialized = useRef(false);

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const [isUIVisible, setIsUIVisible] = useState(false);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    const studentDocRef = useMemoFirebase(() => (currentUID ? doc(firestore, 'students', currentUID) : null), [firestore, currentUID]);
    const authUserRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    
    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string, lessonProgress?: any, progress?: any, name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, authUserProfile]);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: '1. Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: '2. Gramatica', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: '3. Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: '4. Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: '5. Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex3', name: '6. Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'reading', name: '7. Lectura', icon: BookText, status: 'locked' },
        { key: 'final_ex', name: '8. Ejercicio Final', icon: Trophy, status: 'locked' },
        { key: 'translate_text', name: '9. Traducir Texto', icon: MessageSquare, status: 'locked' },
        { key: 'final', name: '10. Final', icon: CheckCircle, status: 'locked' },
    ], []);

    // FLOW 1: Carga y Sincronización de Datos desde Firestore.
    useEffect(() => {
        if (isProfileLoading || isAuthLoading || !studentProfile) return;

        if (!isInitialized.current) {
             suppressSave.current = true; // Previene el guardado durante la carga inicial.

            let path = initialLearningPath.map(topic => ({ ...topic }));
            let savedSelectedTopic = '';

            if (isAdmin && !targetStudentId) {
                path.forEach(item => { item.status = 'completed'; });
            } else if (studentProfile.lessonProgress?.[progressStorageVersion]) {
                const savedData = studentProfile.lessonProgress[progressStorageVersion];
                path.forEach(item => {
                    if (savedData[item.key]) item.status = savedData[item.key];
                });
                savedSelectedTopic = savedData.lastSelectedTopic || '';
            }

            let lastDone = true;
            for (let i = 0; i < path.length; i++) {
                if (lastDone && path[i].status === 'locked') path[i].status = 'active';
                lastDone = path[i].status === 'completed';
            }

            setLearningPath(path);
            setSelectedTopic(savedSelectedTopic || path.find(p => p.status === 'active')?.key || path[0].key);
            
            isInitialized.current = true;
            setIsUIVisible(true); // Muestra la UI
        }
    }, [studentProfile, isProfileLoading, isAuthLoading, isAdmin, initialLearningPath, targetStudentId]);

    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    // FLOW 2: Guardado de Progreso a Firestore.
    useEffect(() => {
        if (!isInitialized.current || isAdmin || targetStudentId) return;
        if (suppressSave.current) {
            suppressSave.current = false;
            return;
        }

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });
        
        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave, 
            [`progress.${mainProgressKey}`]: progressValue 
        });
        
        if (progressValue >= 100) {
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, selectedTopic, progressValue, studentDocRef, isAdmin, targetStudentId]);

    // FLOW 3: Desbloqueo de Siguiente Tópico.
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
            
            if (wasUnlocked) {
                 setTimeout(() => toast({ title: "¡Siguiente mision desbloqueada!" }), 0);
            }
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
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Completa la mision anterior para avanzar." }); 
            return; 
        }
        setSelectedTopic(topicKey);
    };

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    const renderContent = () => {
        if (!isUIVisible) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="animate-spin h-12 w-12 text-primary" />
                </div>
            );
        }
        
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        const onComplete = () => handleTopicComplete(selectedTopic);

        let content;
        switch (selectedTopic) {
            case 'vocabulary':
                content = <VocabularyContent onComplete={onComplete} />;
                break;
            case 'grammar':
                content = <GrammarContent onComplete={onComplete} />;
                break;
            case 'ex1':
                content = <TranslationExercise 
                    title="Ejercicio 1: Comparativos"
                    exercises={[
                        { sentence: "My car is faster than yours.", correct: ["mi coche es mas rapido que el tuyo", "mi carro es mas rapido que el tuyo"] },
                        { sentence: "She is taller than her brother.", correct: ["ella es mas alta que su hermano"] },
                        { sentence: "This book is more interesting than the last one.", correct: ["este libro es mas interesante que el ultimo"] },
                        { sentence: "The weather today is better than yesterday.", correct: ["el clima hoy es mejor que ayer"] },
                        { sentence: "An elephant is bigger than a mouse.", correct: ["un elefante es mas grande que un raton"] },
                        { sentence: "This house is more expensive than the apartment.", correct: ["esta casa es mas cara que el apartamento"] },
                        { sentence: "The new phone is worse than the old one.", correct: ["el nuevo telefono es peor que el viejo"] },
                        { sentence: "He is younger than his sister.", correct: ["el es mas joven que su hermana"] },
                        { sentence: "The park is more beautiful than the street.", correct: ["el parque es mas bonito que la calle"] },
                        { sentence: "The test was easier than I expected.", correct: ["el examen fue mas facil de lo que esperaba"] },
                    ]}
                    onComplete={onComplete}
                    vocabulary={[
                        { en: "faster", es: "mas rapido" },
                        { en: "taller", es: "mas alta" },
                        { en: "more interesting", es: "mas interesante" },
                        { en: "better", es: "mejor" },
                        { en: "bigger", es: "mas grande" },
                        { en: "more expensive", es: "mas caro" },
                        { en: "worse", es: "peor" },
                        { en: "younger", es: "mas joven" },
                        { en: "more beautiful", es: "mas bonito" },
                        { en: "easier", es: "mas facil" },
                    ]}
                />;
                break;
            case 'ex2':
                 content = <TranslationExercise 
                    title="Ejercicio 2: Superlativos"
                    exercises={[
                        { sentence: "This is the tallest building in the city.", correct: ["este es el edificio mas alto de la ciudad"] },
                        { sentence: "She is the smartest student in the class.", correct: ["ella es la estudiante mas inteligente de la clase"] },
                        { sentence: "It was the best day of my life.", correct: ["fue el mejor dia de mi vida"] },
                        { sentence: "This is the most expensive car in the world.", correct: ["este es el coche mas caro del mundo", "este es el carro mas caro del mundo"] },
                        { sentence: "He is the fastest runner on the team.", correct: ["el es el corredor mas rapido del equipo"] },
                        { sentence: "That was the worst movie I have ever seen.", correct: ["esa fue la peor pelicula que he visto"] },
                        { sentence: "The cheetah is the fastest animal.", correct: ["el guepardo es el animal mas rapido"] },
                        { sentence: "This is the easiest exercise in the book.", correct: ["este es el ejercicio mas facil del libro"] },
                        { sentence: "My grandmother is the oldest person in my family.", correct: ["mi abuela es la persona mas vieja de mi familia", "mi abuela es la persona mayor de mi familia"] },
                        { sentence: "This is the most beautiful place I've visited.", correct: ["este es el lugar mas bonito que he visitado"] },
                    ]}
                    onComplete={onComplete}
                    vocabulary={[
                        { en: "the tallest", es: "el mas alto" },
                        { en: "the smartest", es: "la mas inteligente" },
                        { en: "the best", es: "el mejor" },
                        { en: "the most expensive", es: "el mas caro" },
                        { en: "the fastest", es: "el mas rapido" },
                        { en: "the worst", es: "la peor" },
                        { en: "the easiest", es: "el mas facil" },
                        { en: "the oldest", es: "la mas vieja" },
                        { en: "the most beautiful", es: "el mas bonito" },
                    ]}
                />;
                break;
             case 'vocab_game':
                content = <VocabularyGame onComplete={onComplete} />;
                break;
            case 'ex3':
                 content = <TranslationExercise 
                    title="Ejercicio 3: Mixto"
                    exercises={[
                        { sentence: "The blue whale is the biggest animal.", correct: ["la ballena azul es el animal mas grande"] },
                        { sentence: "My brother is older than me.", correct: ["mi hermano es mayor que yo"] },
                        { sentence: "This is the most difficult question.", correct: ["esta es la pregunta mas dificil"] },
                        { sentence: "A plane is faster than a car.", correct: ["un avion es mas rapido que un coche", "un avion es mas rapido que un carro"] },
                        { sentence: "This is the worst idea.", correct: ["esta es la peor idea"] },
                        { sentence: "She is more patient than her friend.", correct: ["ella es mas paciente que su amiga"] },
                        { sentence: "This is the cheapest option.", correct: ["esta es la opcion mas barata"] },
                        { sentence: "My dog is friendlier than my cat.", correct: ["mi perro es mas amigable que mi gato"] },
                        { sentence: "The new version is better.", correct: ["la nueva version es mejor"] },
                        { sentence: "It's the most famous painting in the museum.", correct: ["es la pintura mas famosa del museo"] },
                        { sentence: "A lion is more dangerous than a sheep.", correct: ["un leon es mas peligroso que una oveja"] },
                        { sentence: "This is the smallest box.", correct: ["esta es la caja mas pequena"] },
                        { sentence: "My homework is harder than yours.", correct: ["mi tarea es mas dificil que la tuya"] },
                        { sentence: "He is the tallest boy in the school.", correct: ["el es el chico mas alto de la escuela"] },
                        { sentence: "The city is more crowded than the countryside.", correct: ["la ciudad esta mas poblada que el campo"] },
                        { sentence: "This is the most boring book I've read.", correct: ["este es el libro mas aburrido que he leido"] },
                        { sentence: "She is a better singer than him.", correct: ["ella es mejor cantante que el"] },
                        { sentence: "This is the coldest winter we've had.", correct: ["este es el invierno mas frio que hemos tenido"] },
                        { sentence: "The final exam was the hardest.", correct: ["el examen final fue el mas dificil"] },
                        { sentence: "The sun is bigger than the moon.", correct: ["el sol es mas grande que la luna"] },
                    ]}
                    onComplete={onComplete}
                    vocabulary={[
                        { en: "the biggest", es: "el mas grande" },
                        { en: "older", es: "mayor" },
                        { en: "the most difficult", es: "la mas dificil" },
                        { en: "faster", es: "mas rapido" },
                        { en: "the worst", es: "la peor" },
                        { en: "more patient", es: "mas paciente" },
                        { en: "the cheapest", es: "la mas barata" },
                        { en: "friendlier", es: "mas amigable" },
                        { en: "better", es: "mejor" },
                        { en: "more dangerous", es: "mas peligroso" },
                        { en: "harder", es: "mas dificil" },
                        { en: "the most boring", es: "el mas aburrido" },
                    ]}
                />;
                break;
            case 'reading':
                content = <ReadingContent onComplete={onComplete} />;
                break;
            case 'final_ex':
                content = <FinalExercise onComplete={onComplete} />;
                break;
            case 'translate_text':
                content = <TranslateTextContent onComplete={onComplete} />;
                break;
            case 'final':
                content = <FinalNegativeForm onComplete={onComplete} />;
                break;
            default:
                return null;
        }

        return (
            <Card className="shadow-soft border-2 border-brand-purple bg-card/95 backdrop-blur-sm text-foreground text-left overflow-hidden">
                <CardHeader className='bg-primary/5 border-b'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 bg-primary/20 rounded-lg text-primary'>
                            <topic.icon className='h-6 w-6' />
                        </div>
                        <div>
                            <CardTitle className="text-primary uppercase tracking-tighter">{topic.name}</CardTitle>
                            <CardDescription className='font-bold text-foreground'>Completa esta seccion para avanzar en tu mision.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="py-12 flex flex-col items-center justify-center min-h-[400px]">
                    {content}
                </CardContent>
            </Card>
        );
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
                                <p className="font-black uppercase tracking-tighter text-sm">Modo Supervision Activo: {studentProfile?.name || targetStudentId}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-yellow-600 text-yellow-700 hover:bg-yellow-500/10 transition-colors">
                                <Link href="/admin">Cerrar Supervision</Link>
                            </Button>
                        </div>
                    )}
                    
                    <div className="mb-8 text-left text-white">
                        <Link href="/espanol/a1" className="hover:underline text-sm font-bold text-white/80 flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver al Curso A1
                        </Link>
                        <h1 className="text-4xl font-black [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)] uppercase tracking-tight flex items-center gap-3">
                            <Scale className='h-10 w-10 text-primary' /> Comparativos y Superlativos 🇪🇸
                        </h1>
                    </div>

                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 md:order-1 order-2">
                            {renderContent()}
                        </div>

                        <div className="md:col-span-3 md:order-2 order-1 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4 border-b bg-muted/30">
                                    <CardTitle className="text-lg font-black text-primary uppercase tracking-tighter flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" /> Mision A1
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isSelected = selectedTopic === item.key;
                                                const Icon = item.icon;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn(
                                                            'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-foreground',
                                                            isLocked ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-muted',
                                                            isSelected && 'bg-muted text-primary font-black border-l-4 border-primary shadow-sm'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {item.status === 'completed' ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <Icon className={cn("h-5 w-5", isLocked ? "text-yellow-500/50" : "text-primary")} />
                                                            )}
                                                            <span className="truncate max-w-[150px]">{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-3 w-3 text-yellow-500/30" />}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-xs mb-2 font-black uppercase tracking-widest text-muted-foreground">
                                            <span>Progreso Clase</span>
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

export default function ComparativosSuperlativosPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        }>
            <ComparativosSuperlativosContent />
        </Suspense>
    );
}