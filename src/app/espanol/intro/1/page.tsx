'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, CheckCircle, Hand, GraduationCap, Type, Activity, MessageSquare, BrainCircuit, RefreshCw, Flame, Trophy } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const progressStorageKey = 'progress_espanol_intro_1_v4';
const mainProgressKey = 'progress_espanol_intro_1';

const saludosData = [
    { spanish: 'Hola', english: 'Hello / Hi' },
    { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' },
    { spanish: 'Buenas noches', english: 'Good evening (greeting)' },
    { spanish: '¿Cómo estás?', english: 'How are you?' },
    { spanish: '¿Cómo te va?', english: "How's it going?" },
    { spanish: '¿Qué tal?', english: "What's up?" },
    { spanish: 'Mucho gusto', english: 'Nice to meet you' },
    { spanish: 'Encantado / Encantada', english: 'Delighted / Pleased to meet you' },
];

const despedidasData = [
    { spanish: 'Adiós', english: 'Goodbye' },
    { spanish: 'Chao', english: 'Bye' },
    { spanish: 'Hasta luego', english: 'See you later' },
    { spanish: 'Hasta mañana', english: 'See you tomorrow' },
    { spanish: 'Hasta pronto', english: 'See you soon' },
    { spanish: 'Nos vemos', english: 'See you' },
    { spanish: 'Cuídate', english: 'Take care' },
    { spanish: 'Buenas noches', english: 'Good night (farewell/sleep)' },
    { spanish: 'Que tengas un buen día', english: 'Have a nice day' },
];

const nounsPracticeData = [
    { english: 'mother', spanish: 'madre' },
    { english: 'father', spanish: 'padre' },
    { english: 'book', spanish: 'libro' },
    { english: 'table', spanish: 'mesa' },
    { english: 'chair', spanish: 'silla' },
    { english: 'computer', spanish: 'computador' },
    { english: 'cellphone', spanish: 'celular' },
    { english: 'bed', spanish: 'cama' },
    { english: 'dog', spanish: 'perro' },
    { english: 'house', spanish: 'casa' },
];

const adjectivesPracticeData = [
    { english: 'yellow', spanish: 'amarillo' },
    { english: 'blue', spanish: 'azul' },
    { english: 'red', spanish: 'rojo' },
    { english: 'white', spanish: 'blanco' },
    { english: 'black', spanish: 'negro' },
    { english: 'happy', spanish: 'feliz' },
    { english: 'sad', spanish: 'triste' },
    { english: 'bored', spanish: 'aburrido' },
    { english: 'worried', spanish: 'preocupado' },
    { english: 'tired', spanish: 'cansado' },
    { english: 'busy', spanish: 'ocupa' },
    { english: 'tidy', spanish: 'ordenado' },
];

const verbsPracticeData = [
    { english: 'To study', spanish: 'estudiar' },
    { english: 'To work', spanish: 'trabajar' },
    { english: 'To walk', spanish: 'caminar' },
    { english: 'To have dinner', spanish: 'cenar' },
    { english: 'To watch t.v', spanish: 'ver televisión' },
    { english: 'To drink', spanish: 'beber' },
    { english: 'To read', spanish: 'leer' },
    { english: 'To sleep', spanish: 'dormir' },
    { english: 'To eat', spanish: 'comer' },
    { english: 'To live', spanish: 'vivir' },
];

const memoryPairs = [
    { english: 'mother', spanish: 'madre' },
    { english: 'book', spanish: 'libro' },
    { english: 'house', spanish: 'casa' },
    { english: 'happy', spanish: 'feliz' },
    { english: 'tired', spanish: 'cansado' },
    { english: 'yellow', spanish: 'amarillo' },
    { english: 'to study', spanish: 'estudiar' },
    { english: 'to eat', spanish: 'comer' },
    { english: 'father', spanish: 'padre' },
    { english: 'dog', spanish: 'perro' },
    { english: 'red', spanish: 'rojo' },
    { english: 'sad', spanish: 'triste' },
    { english: 'blue', spanish: 'azul' },
    { english: 'to work', spanish: 'trabajar' },
    { english: 'to drink', spanish: 'beber' },
    { english: 'to sleep', spanish: 'dormir' },
];

const lecturaData = {
    title: 'Mi Vida Diaria',
    content: "Hola, mi nombre es Juan. Yo soy un estudiante y hoy estoy muy feliz. En mi casa grande hay una mesa roja y cuatro sillas blancas. Mi perro es pequeño y muy inteligente. Hoy yo quiero estudiar en la biblioteca. Mañana voy a trabajar en la oficina. Me gusta leer libros interesantes. ¡Adiós!",
    multipleChoice: [
        { id: 'mc1', question: '¿Cómo está Juan hoy?', options: ['Feliz', 'Triste', 'Cansado'], answer: 'Feliz' },
        { id: 'mc2', question: '¿De qué color es la mesa?', options: ['Blanca', 'Roja', 'Azul'], answer: 'Roja' },
        { id: 'mc3', question: '¿Cómo es el perro de Juan?', options: ['Grande', 'Pequeño', 'Negro'], answer: 'Pequeño' },
    ],
    openQuestions: [
        { id: 'oq1', question: '¿Dónde quiere estudiar Juan hoy?', answer: 'biblioteca' },
        { id: 'oq2', question: '¿Qué le gusta leer a Juan?', answer: 'libros' },
        { id: 'oq3', question: '¿A dónde va a trabajar Juan mañana?', answer: 'oficina' },
    ]
};

const VocabularyMatchingGame = ({ onComplete }: { onComplete: () => void }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [hasNotifiedComplete, setHasNotifiedComplete] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const initializeGame = useCallback(() => {
        const gameCards = memoryPairs.flatMap((pair, index) => [
            { id: index * 2, pairId: index, text: pair.english },
            { id: index * 2 + 1, pairId: index, text: pair.spanish },
        ]).sort(() => Math.random() - 0.5);
        
        setCards(gameCards);
        setSelectedIndices([]);
        setMatchedPairIds([]);
        setHasNotifiedComplete(false);
    }, []);

    useEffect(() => {
        if (isClient) {
            initializeGame();
        }
    }, [isClient, initializeGame]);

    const handleCardClick = (index: number) => {
        if (matchedPairIds.includes(cards[index].pairId)) return;

        if (selectedIndices.includes(index)) {
            setSelectedIndices(prev => prev.filter(i => i !== index));
            return;
        }

        if (selectedIndices.length === 1) {
            const firstIndex = selectedIndices[0];
            const secondIndex = index;

            if (cards[firstIndex].pairId === cards[secondIndex].pairId) {
                setMatchedPairIds(prev => [...prev, cards[firstIndex].pairId]);
                setSelectedIndices([]);
            } else {
                setSelectedIndices([index]);
            }
        } else {
            setSelectedIndices([index]);
        }
    };

    const isGameComplete = matchedPairIds.length === memoryPairs.length && memoryPairs.length > 0;

    useEffect(() => {
        if (isGameComplete && !hasNotifiedComplete) {
            onComplete();
            setHasNotifiedComplete(true);
        }
    }, [isGameComplete, onComplete, hasNotifiedComplete]);

    if (!isClient) return null;

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                    <CardTitle className="text-2xl">Emparejar Vocabulario</CardTitle>
                    <CardDescription>Haz clic en una palabra en inglés y su traducción al español.</CardDescription>
                </div>
                <Button size="icon" variant="ghost" onClick={initializeGame}><RefreshCw className="h-6 w-6" /></Button>
            </CardHeader>
            <CardContent>
                {isGameComplete ? (
                     <div className="text-center p-12 flex flex-col items-center">
                        <Trophy className="h-20 w-20 text-yellow-400 mb-6" />
                        <h2 className="text-3xl font-bold">¡Felicidades!</h2>
                        <p className="text-lg text-muted-foreground mt-3">Has dominado el vocabulario básico de Intro 1.</p>
                     </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {cards.map((card, index) => {
                            const isSelected = selectedIndices.includes(index);
                            const isMatched = matchedPairIds.includes(card.pairId);
                            return (
                                <div key={card.id} onClick={() => handleCardClick(index)}
                                    className={cn(
                                        "flex items-center justify-center min-h-[70px] px-3 py-2 text-center cursor-pointer transition-all border-2 rounded-xl text-base sm:text-lg font-bold select-none shadow-sm", 
                                        isMatched ? "bg-green-500/10 border-green-500 text-green-700 opacity-50" : 
                                        isSelected ? "bg-primary/20 border-primary text-primary" : "bg-card border-border hover:bg-muted hover:border-muted-foreground/30"
                                    )}>
                                    {card.text}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function EspanolIntro1Page() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    const [nounAnswers, setNounAnswers] = useState<string[]>(Array(nounsPracticeData.length).fill(''));
    const [nounValidation, setNounValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(nounsPracticeData.length).fill('unchecked'));

    const [adjAnswers, setAdjAnswers] = useState<string[]>(Array(adjectivesPracticeData.length).fill(''));
    const [adjValidation, setAdjValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(adjectivesPracticeData.length).fill('unchecked'));

    const [verbAnswers, setVerbAnswers] = useState<string[]>(Array(verbsPracticeData.length).fill(''));
    const [verbValidation, setVerbValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(verbsPracticeData.length).fill('unchecked'));

    const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
    const [readingValidation, setReadingValidation] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );

    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'saludos', name: 'Saludos (Greetings)', icon: Hand, status: 'active' },
        { key: 'despedidas', name: 'Despedidas (Farewells)', icon: MessageSquare, status: 'locked' },
        { key: 'sustantivos', name: 'Sustantivos (Nouns)', icon: Type, status: 'locked' },
        { key: 'adjetivos', name: 'Adjetivos (Adjectives)', icon: GraduationCap, status: 'locked' },
        { key: 'verbos', name: 'Verbos (Verbs)', icon: Activity, status: 'locked' },
        { key: 'vocabulario', name: 'Basic Vocabulary', icon: BookOpen, status: 'locked' },
        { key: 'lectura', name: 'Reading Comprehension', icon: BookOpen, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isUserLoading || isProfileLoading) return;

        const newPath = initialLearningPath.map(item => ({...item}));
        
        if (isAdmin) {
            newPath.forEach(item => item.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageKey];
            newPath.forEach(item => {
                if (savedStatuses[item.key]) {
                    item.status = savedStatuses[item.key];
                }
            });
        }
        
        setLearningPath(newPath);

        const firstActive = newPath.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || 'saludos');

    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        if (!isAdmin && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, string> = {};
            learningPath.forEach(item => {
                statusesToSave[item.key] = item.status;
            });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageKey}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: progressValue
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progressValue, isAdmin, studentDocRef, isProfileLoading, isUserLoading]);

    const handleTopicComplete = useCallback((key: string) => {
        setTopicToComplete(key);
    }, []);

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(currentPath => {
            const newPath = currentPath.map(item => ({...item}));
            const currentIndex = newPath.findIndex(item => item.key === topicToComplete);
            
            if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
                newPath[currentIndex].status = 'completed';

                const nextIndex = currentIndex + 1;
                if (nextIndex < newPath.length && newPath[nextIndex].status === 'locked') {
                    newPath[nextIndex].status = 'active';
                    setSelectedTopic(newPath[nextIndex].key);
                     toast({ title: "¡Tema desbloqueado!", description: `Ahora puedes continuar con ${newPath[nextIndex].name}` });
                } else if (newPath.every(item => item.status === 'completed')) {
                    toast({ title: "¡Felicitaciones!", description: "¡Has completado el 100% de la aventura Intro 1E!" });
                }
            }
            return newPath;
        });

        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const topic = learningPath.find(t => t.key === key);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: 'Tema Bloqueado' });
            return;
        }
        setSelectedTopic(key);
        const autoFinish = ['saludos', 'despedidas'];
        if (autoFinish.includes(key)) {
            handleTopicComplete(key);
        }
    };
    
    const handleNounInputChange = (index: number, value: string) => {
        const newAnswers = [...nounAnswers];
        newAnswers[index] = value;
        setNounAnswers(newAnswers);
        
        if (nounValidation[index] !== 'unchecked') {
            const newValidation = [...nounValidation];
            newValidation[index] = 'unchecked';
            setNounValidation(newValidation as any);
        }
    };

    const handleCheckNouns = () => {
        let allCorrect = true;
        const newValidation = nounsPracticeData.map((item, index) => {
            const userAnswer = nounAnswers[index].trim().toLowerCase();
            const isCorrect = userAnswer === item.spanish.toLowerCase() || (item.english === 'mother' && userAnswer === 'mamá');
            if (!isCorrect) allCorrect = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setNounValidation(newValidation as any);
        if (allCorrect) {
            toast({ title: '¡Muy bien!', description: 'Todas las traducciones son correctas.' });
            handleTopicComplete('sustantivos');
        } else {
             toast({ variant: 'destructive', title: 'Algunas respuestas son incorrectas.' });
        }
    };

    const handleAdjInputChange = (index: number, value: string) => {
        const newAnswers = [...adjAnswers];
        newAnswers[index] = value;
        setAdjAnswers(newAnswers);
        
        if (adjValidation[index] !== 'unchecked') {
            const newValidation = [...adjValidation];
            newValidation[index] = 'unchecked';
            setAdjValidation(newValidation as any);
        }
    };

    const handleCheckAdjectives = () => {
        let allCorrect = true;
        const newValidation = adjectivesPracticeData.map((item, index) => {
            const userAnswer = adjAnswers[index].trim().toLowerCase();
            const isCorrect = userAnswer === item.spanish.toLowerCase();
            if (!isCorrect) allCorrect = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setAdjValidation(newValidation as any);
        if (allCorrect) {
            toast({ title: '¡Buen trabajo!', description: 'Todos los adjetivos son correctos.' });
            handleTopicComplete('adjetivos');
        } else {
             toast({ variant: 'destructive', title: 'Algunas respuestas son incorrectas.' });
        }
    };

    const handleVerbInputChange = (index: number, value: string) => {
        const newAnswers = [...verbAnswers];
        newAnswers[index] = value;
        setVerbAnswers(newAnswers);
        
        if (verbValidation[index] !== 'unchecked') {
            const newValidation = [...verbValidation];
            newValidation[index] = 'unchecked';
            setVerbValidation(newValidation as any);
        }
    };

    const handleCheckVerbs = () => {
        let allCorrect = true;
        const newValidation = verbsPracticeData.map((item, index) => {
            const userAnswer = verbAnswers[index].trim().toLowerCase();
            let isCorrect = userAnswer === item.spanish.toLowerCase();
            if (item.english === 'To watch t.v' && (userAnswer === 'ver la televisión' || userAnswer === 'ver tv')) isCorrect = true;
            if (item.english === 'To drink' && userAnswer === 'tomar') isCorrect = true;
            
            if (!isCorrect) allCorrect = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVerbValidation(newValidation as any);
        if (allCorrect) {
            toast({ title: '¡Excelente!', description: 'Todos los verbos son correctos.' });
            handleTopicComplete('verbos');
        } else {
             toast({ variant: 'destructive', title: 'Algunas respuestas son incorrectas.' });
        }
    };

    const handleReadingAnswerChange = (id: string, value: string) => {
        setReadingAnswers(prev => ({...prev, [id]: value}));
        setReadingValidation(prev => ({...prev, [id]: 'unchecked'}));
    };
    
    const handleCheckReading = () => {
        const newValidation: Record<string, 'correct' | 'incorrect' | 'unchecked'> = {};
        let allCorrect = true;

        // Check Multiple Choice
        lecturaData.multipleChoice.forEach(q => {
            const isCorrect = readingAnswers[q.id] === q.answer;
            if(!isCorrect) allCorrect = false;
            newValidation[q.id] = isCorrect ? 'correct' : 'incorrect';
        });

        // Check Open Questions
        lecturaData.openQuestions.forEach(q => {
            const userAnswer = readingAnswers[q.id]?.trim().toLowerCase() || '';
            const isCorrect = userAnswer.includes(q.answer.toLowerCase());
            if(!isCorrect) allCorrect = false;
            newValidation[q.id] = isCorrect ? 'correct' : 'incorrect';
        });

        setReadingValidation(newValidation);
        if(allCorrect) {
            toast({ title: '¡Felicitaciones!', description: 'Has respondido todas las preguntas correctamente y completado la lección.' });
            handleTopicComplete('lectura');
        } else {
            toast({ variant: 'destructive', title: 'Algunas respuestas son incorrectas.', description: 'Revisa los campos en rojo.' });
        }
    };

    const renderContent = () => {
        switch(selectedTopic) {
            case 'saludos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Saludos (Greetings)</CardTitle>
                        <CardDescription>Frases esenciales para iniciar una conversación en español.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">Español</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">Inglés</div>
                            {saludosData.map(item => (
                                <React.Fragment key={item.spanish}>
                                    <div className="p-3 border rounded-lg font-medium text-center">{item.spanish}</div>
                                    <div className="p-3 border rounded-lg text-muted-foreground text-center">{item.english}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleTopicComplete('saludos')}>Continuar a Despedidas</Button>
                    </CardFooter>
                </Card>
            );
            case 'despedidas': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Despedidas (Farewells)</CardTitle>
                        <CardDescription>Frases esenciales para terminar una conversación en español.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">Español</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">Inglés</div>
                            {despedidasData.map(item => (
                                <React.Fragment key={item.spanish}>
                                    <div className="p-3 border rounded-lg font-medium text-center">{item.spanish}</div>
                                    <div className="p-3 border rounded-lg text-muted-foreground text-center">{item.english}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleTopicComplete('despedidas')}>Continuar</Button>
                    </CardFooter>
                </Card>
            );
            case 'sustantivos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Sustantivos (Nouns)</CardTitle>
                        <CardDescription>Entendiendo el género y número en español.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                            <p className="text-lg">Un sustantivo es una <strong>persona, animal o cosa</strong> (a noun is a person, animal and things).</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">1. Género</h3>
                            <p className="text-muted-foreground">A diferencia del inglés, cada sustantivo en español tiene un género: <strong>Masculino</strong> o <strong>Femenino</strong>.</p>
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-muted rounded-lg border-l-4 border-blue-500">
                                    <h4 className="font-bold">Masculino</h4>
                                    <p className="text-sm">Usualmente terminan en <strong>-o</strong></p>
                                    <p className="font-mono mt-1 italic">Ejemplo: El libr<strong>o</strong></p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg border-l-4 border-pink-500">
                                    <h4 className="font-bold">Femenino</h4>
                                    <p className="text-sm">Usualmente terminan en <strong>-a</strong></p>
                                    <p className="font-mono mt-1 italic">Ejemplo: La mes<strong>a</strong></p>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">2. Número</h3>
                            <p className="text-muted-foreground">Para hacer los sustantivos plurales, seguimos estas reglas simples:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>Si termina en vocal, añade <strong>-s</strong>: <span className="italic">Libro {"=>"} Libros</span></li>
                                <li>Si termina en consonante, añade <strong>-es</strong>: <span className="italic">Papel {"=>"} Papeles</span></li>
                            </ul>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">3. Práctica de Vocabulario</h3>
                            <p className="text-muted-foreground mb-4">Traduce estos sustantivos comunes al español.</p>
                            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                                <div className="font-bold bg-muted p-2 rounded text-center">Inglés</div>
                                <div className="font-bold bg-muted p-2 rounded text-center">Español</div>
                                {nounsPracticeData.map((item, index) => (
                                    <React.Fragment key={item.english}>
                                        <div className="p-2 border rounded flex items-center justify-center font-medium">{item.english}</div>
                                        <div className="relative">
                                            <Input 
                                                value={nounAnswers[index] || ''}
                                                onChange={(e) => handleNounInputChange(index, e.target.value)}
                                                className={cn(
                                                    "h-10",
                                                    nounValidation[index] === 'correct' && "border-green-500",
                                                    nounValidation[index] === 'incorrect' && "border-destructive"
                                                )}
                                                placeholder="..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-center">
                                <Button variant="secondary" onClick={handleCheckNouns}>Verificar Traducciones</Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleTopicComplete('sustantivos')}>Continuar</Button>
                    </CardFooter>
                </Card>
            );
            case 'adjetivos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Adjetivos (Adjectives)</CardTitle>
                        <CardDescription>Cómo describir cosas en español.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">1. Concordancia</h3>
                            <p className="text-muted-foreground">Los adjetivos deben coincidir con el sustantivo que describen en <strong>género</strong> y <strong>número</strong>.</p>
                            <div className="mt-4 p-4 bg-muted rounded-lg font-mono text-base">
                                <p>Libro roj<strong>o</strong></p>
                                <p>Mesa roj<strong>a</strong></p>
                                <p>Libros roj<strong>os</strong></p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">2. Posición</h3>
                            <p className="text-muted-foreground">En español, los adjetivos usualmente van <strong>después</strong> del sustantivo.</p>
                            <div className="mt-2 p-3 bg-muted rounded-lg border flex items-center justify-between">
                                <span className="text-sm font-semibold">Español: Sustantivo + Adjetivo</span>
                                <span className="text-xs text-muted-foreground italic">"Carro azul"</span>
                            </div>
                            <div className="mt-2 p-3 bg-muted rounded-lg border flex items-center justify-between">
                                <span className="text-sm font-semibold">Inglés: Adjetivo + Sustantivo</span>
                                <span className="text-xs text-muted-foreground italic">"Blue car"</span>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">3. Práctica de Vocabulario</h3>
                            <p className="text-muted-foreground mb-4">Traduce estos adjetivos comunes al español.</p>
                            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                                <div className="font-bold bg-muted p-2 rounded text-center">Inglés</div>
                                <div className="font-bold bg-muted p-2 rounded text-center">Español</div>
                                {adjectivesPracticeData.map((item, index) => (
                                    <React.Fragment key={item.english}>
                                        <div className="p-2 border rounded flex items-center justify-center font-medium capitalize">{item.english}</div>
                                        <div className="relative">
                                            <Input 
                                                value={adjAnswers[index] || ''}
                                                onChange={(e) => handleAdjInputChange(index, e.target.value)}
                                                className={cn(
                                                    "h-10",
                                                    adjValidation[index] === 'correct' && "border-green-500",
                                                    adjValidation[index] === 'incorrect' && "border-destructive"
                                                )}
                                                placeholder="..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-center">
                                <Button variant="secondary" onClick={handleCheckAdjectives}>Verificar Traducciones</Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleTopicComplete('adjetivos')}>Continuar</Button>
                    </CardFooter>
                </Card>
            );
            case 'verbos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Verbos (Verbs)</CardTitle>
                        <CardDescription>El motor de la oración.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">1. El Infinitivo</h3>
                            <p className="text-muted-foreground">Todos los verbos en español terminan en una de tres formas en su estado original:</p>
                            <div className="flex gap-4 mt-4">
                                <div className="flex-1 p-3 bg-primary/10 rounded text-center font-bold">-AR</div>
                                <div className="flex-1 p-3 bg-primary/10 rounded text-center font-bold">-ER</div>
                                <div className="flex-1 p-3 bg-primary/10 rounded text-center font-bold">-IR</div>
                            </div>
                            <p className="text-sm mt-2 text-center text-muted-foreground italic">Ejemplos: Habl<strong>ar</strong>, Com<strong>er</strong>, Viv<strong>ir</strong></p>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">2. El Misterio de "Ser" vs "Estar"</h3>
                            <p className="text-muted-foreground">En español tenemos dos formas para decir "to be":</p>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="p-3 bg-muted rounded border-l-4 border-primary">
                                    <strong>SER:</strong> Cosas permanentes (rasgos, identidad).
                                </div>
                                <div className="p-3 bg-muted rounded border-l-4 border-secondary">
                                    <strong>ESTAR:</strong> Cosas temporales (sentimientos, ubicación).
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">3. Práctica de Vocabulario</h3>
                            <p className="text-muted-foreground mb-4">Traduce estos verbos comunes al español.</p>
                            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                                <div className="font-bold bg-muted p-2 rounded text-center">Inglés</div>
                                <div className="font-bold bg-muted p-2 rounded text-center">Español</div>
                                {verbsPracticeData.map((item, index) => (
                                    <React.Fragment key={item.english}>
                                        <div className="p-2 border rounded flex items-center justify-center font-medium capitalize">{item.english}</div>
                                        <div className="relative">
                                            <Input 
                                                value={verbAnswers[index] || ''}
                                                onChange={(e) => handleVerbInputChange(index, e.target.value)}
                                                className={cn(
                                                    "h-10",
                                                    verbValidation[index] === 'correct' && "border-green-500",
                                                    verbValidation[index] === 'incorrect' && "border-destructive"
                                                )}
                                                placeholder="..."
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-center">
                                <Button variant="secondary" onClick={handleCheckVerbs}>Verificar Traducciones</Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleTopicComplete('verbos')}>Continuar</Button>
                    </CardFooter>
                </Card>
            );
            case 'vocabulario': return <VocabularyMatchingGame onComplete={() => handleTopicComplete('vocabulario')} />;
            case 'lectura': return (
                 <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{lecturaData.title}</CardTitle>
                        <CardDescription>Practica tu comprensión de lectura con este texto que resume lo aprendido.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted p-6 rounded-lg border italic text-lg leading-relaxed shadow-inner">
                            {lecturaData.content}
                        </div>

                        <Separator />

                        <div className="space-y-8">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-primary">Preguntas de Selección Múltiple</h3>
                                {lecturaData.multipleChoice.map((q) => (
                                    <div key={q.id} className="space-y-3 p-4 border rounded-lg bg-card">
                                        <Label className="text-lg font-semibold">{q.question}</Label>
                                        <RadioGroup 
                                            value={readingAnswers[q.id] || ''} 
                                            onValueChange={(val) => handleReadingAnswerChange(q.id, val)}
                                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                                        >
                                            {q.options.map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                                                    <Label htmlFor={`${q.id}-${option}`} className="font-medium">{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                        {readingValidation[q.id] === 'incorrect' && (
                                            <p className="text-xs text-destructive font-bold">Respuesta incorrecta. Inténtalo de nuevo.</p>
                                        )}
                                        {readingValidation[q.id] === 'correct' && (
                                            <p className="text-xs text-green-500 font-bold">¡Correcto!</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-primary">Preguntas de Escritura</h3>
                                {lecturaData.openQuestions.map((q) => (
                                    <div key={q.id} className="space-y-2 p-4 border rounded-lg bg-card">
                                        <Label htmlFor={q.id} className="text-lg font-semibold">{q.question}</Label>
                                        <Input 
                                            id={q.id} 
                                            value={readingAnswers[q.id] || ''}
                                            onChange={e => handleReadingAnswerChange(q.id, e.target.value)}
                                            className={cn(
                                                'mt-1 text-lg h-12', 
                                                readingValidation[q.id] === 'correct' && 'border-green-500 bg-green-500/5', 
                                                readingValidation[q.id] === 'incorrect' && 'border-destructive bg-destructive/5'
                                            )}
                                            placeholder="Escribe tu respuesta aquí..."
                                            autoComplete="off"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center pt-6 border-t">
                        <Button onClick={handleCheckReading} size="lg" className="w-full sm:w-auto px-12">
                            Verificar Respuestas
                        </Button>
                    </CardFooter>
                 </Card>
            );
            default: return <p>Selecciona un tema para empezar.</p>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/espanol/intro" className="hover:underline text-sm text-muted-foreground">Volver a Aventura Intro</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Intro 1 Español</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-4">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map(item => {
                                                const Icon = item.icon;
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            item.status === 'locked' && !isAdmin ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                                        )}
                                                    >
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <Icon className="h-5 w-5" />}
                                                        <span>{item.name}</span>
                                                        {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500 ml-auto" />}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </nav>
                                     <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                            <span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2" />
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
