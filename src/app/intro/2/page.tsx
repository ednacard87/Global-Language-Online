'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  PenSquare,
  Lock,
  GraduationCap,
  BrainCircuit,
  Hand,
  MessageSquare,
  RefreshCw,
  Flame,
  Trophy,
  CheckCircle,
  Lightbulb,
  Clock,
  X,
  Loader2,
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    { spanish: 'Me levanto a las siete', english: 'I get up at seven' },
    { spanish: 'Él es de Estados Unidos', english: 'He is from the United States' },
    { spanish: 'Buenas tardes, ¿cómo estás?', english: 'Good afternoon, how are you?' },
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

    const isGameComplete = matchedPairIds.length === data.length;

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
                    <TableHeader><TableRow><TableHead>Country</TableHead><TableHead>País</TableHead></TableRow></TableHeader>
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
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, ValidationStatus>>({});
    
    const handleInputChange = (index: number, value: string) => setUserAnswers(prev => ({ ...prev, [index]: value }));

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: Record<number, ValidationStatus> = {};
        mixedExercisesData.forEach((item, index) => {
            const isCorrect = (userAnswers[index] || '').trim().toLowerCase() === item.spanish.toLowerCase();
            if(!isCorrect) allCorrect = false;
            newValidationStatus[index] = isCorrect ? 'correct' : 'incorrect';
        });
        setValidationStatus(newValidationStatus);
        if (allCorrect) {
            toast({ title: '¡Excelente!', description: 'Todas las traducciones son correctas.' });
            onComplete();
        } else {
            toast({ variant: 'destructive', title: 'Revisa tus respuestas.' });
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Ejercicios Mixtos</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Inglés</TableHead><TableHead>Español</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {mixedExercisesData.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.english}</TableCell>
                                <TableCell><Input value={userAnswers[index] || ''} onChange={e => handleInputChange(index, e.target.value)} className={cn(validationStatus[index] === 'correct' && 'border-green-500', validationStatus[index] === 'incorrect' && 'border-destructive')} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter><Button onClick={handleCheckAnswers}>Verificar Ejercicios</Button></CardFooter>
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

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

export default function EspanolIntro2Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('memory_game');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);
    const [initialLearningPath, setInitialLearningPath] = useState<Topic[]>([]);
    const [previousPath, setPreviousPath] = useState<Topic[] | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setInitialLearningPath([
            { key: 'tip', name: 'Tip Importante', icon: Lightbulb, status: 'active' },
            { key: 'memory_game', name: 'Juego de Memoria', icon: BrainCircuit, status: 'locked' },
            { key: 'time', name: 'La Hora', icon: Clock, status: 'locked' },
            { key: 'countries', name: 'Países y Nacionalidades', icon: Globe, status: 'locked' },
            { key: 'reading', name: 'Lectura y Comprensión', icon: BookOpen, status: 'locked' },
            { key: 'mixed_exercises', name: 'Ejercicios Mixtos', icon: PenSquare, status: 'locked' },
        ]);
    }, [t]);


    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    useEffect(() => {
        if (!isClient || isUserLoading || isProfileLoading || initialLearningPath.length === 0) return;
        let newPath = initialLearningPath.map(item => ({...item}));
        
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
        if (!isClient || isUserLoading || isProfileLoading || isAdmin) return;
    
        const newPathString = JSON.stringify(learningPath.map(p => ({ key: p.key, status: p.status })));
        const prevPathString = JSON.stringify(previousPath?.map(p => ({ key: p.key, status: p.status })));
    
        if (newPathString !== prevPathString && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, string> = {};
            learningPath.forEach(item => { statusesToSave[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageKey}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: progress
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
        setPreviousPath(learningPath);
    }, [learningPath, progress, isAdmin, studentDocRef, isProfileLoading, isUserLoading, previousPath, isClient]);


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
        if (['time', 'tip'].includes(key)) {
            handleTopicComplete(key);
        }
    };

    const renderContent = () => {
        switch(selectedTopic) {
            case 'tip':
                return (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>SUSTANTIVO: NOUN</CardTitle><CardDescription>PERSONA, ANIMAL O COSA (singular- plural)</CardDescription></CardHeader>
                            <CardContent>
                                <Accordion type="multiple" defaultValue={['regular', 'irregular']} className="w-full">
                                    <AccordionItem value="regular">
                                        <AccordionTrigger>REGULAR: noun + s</AccordionTrigger>
                                        <AccordionContent><code className="block bg-muted p-2 rounded-md font-mono">computer: computers // house: houses // car: cars</code></AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="irregular">
                                        <AccordionTrigger>IRREGULAR</AccordionTrigger>
                                        <AccordionContent className="space-y-2">
                                            <p>Para sustantivos que terminan en: <strong>s, z, sh, ch, x</strong> (e.g., bus), se agrega “ES”.</p>
                                            <code className="block bg-muted p-2 rounded-md font-mono">address: Addresses // beach: beaches // bus: buses</code>
                                            <Separator />
                                            <p>Para sustantivos que terminan en <strong>“Y”</strong>, se cambia la “Y” por “ies”.</p>
                                            <code className="block bg-muted p-2 rounded-md font-mono">country: countries // university: universities</code>
                                            <Separator />
                                            <p>Completamente irregular:</p>
                                            <code className="block bg-muted p-2 rounded-md font-mono">Man: men // woman: women // child: children // person: people</code>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>
            
                        <Card>
                            <CardHeader><CardTitle>ADJETIVO: ADJECTIVE</CardTitle><CardDescription>DESCRIBE EL SUSTANTIVO (COLOR, CUALIDAD, CARACTERISTICA.) – (los adjetivos siempre van en singular es decir en su forma original)</CardDescription></CardHeader>
                            <CardContent>
                                <Card className="bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500">
                                    <CardHeader><CardTitle className="text-yellow-800 dark:text-yellow-300">NOTICAS IMPORTANTES</CardTitle></CardHeader>
                                    <CardContent>
                                        <p>En español primero se habla del sustantivo y luego del adjetivo:</p>
                                        <code className="block bg-background p-2 rounded-md font-mono my-2 text-sm">El carro blanco<br/>el lapicero azul<br/>el computador gris</code>
                                        <p>Pero en INGLES primero se habla del adjetivo y luego del sustantivo:</p>
                                        <code className="block bg-background p-2 rounded-md font-mono mt-2 text-sm">the white car<br/>The red pen<br/>the grey computer</code>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
            
                        <Card>
                            <CardHeader><CardTitle>VERBO: VERB</CardTitle><CardDescription>ACCIÓN. VERBOS INFINITIVO = " TO "</CardDescription></CardHeader>
                            <CardContent>
                                <p>Un verbo en infinitivo es un verbo que no está conjugado.</p>
                                <div className="grid grid-cols-2 gap-4 my-4">
                                    <code className="block bg-muted p-2 rounded-md font-mono text-center">ESPAÑOL<br/>AR = Hablar<br/>ER = Comer<br/>IR = Vivir</code>
                                    <code className="block bg-muted p-2 rounded-md font-mono text-center">ENGLISH<br/>= TO speak<br/>= TO eat<br/>= TO Live</code>
                                </div>
                                <h4 className="font-semibold pt-4 border-t">CONJUGACION</h4>
                                <p>Cuando estamos utilizando la conjugación el verbo pierde la palabra "To".</p>
                                <code className="block bg-muted p-2 rounded-md font-mono">pronombre + verbo<br/>i speak (yo hablo)<br/><span className="text-destructive">i to speak (incorrecto - "yo hablar")</span></code>
                            </CardContent>
                        </Card>
            
                        <Card>
                            <CardHeader><CardTitle>PRONOUNS</CardTitle></CardHeader>
                            <CardContent>
                                <p>Muchas frases no tienen pronombres, entonces las frases pueden TENER:</p>
                                <ul className="list-disc list-inside pl-4 my-2">
                                    <li>Nombre propio: Viviana, Edna, Ana, Cristal</li>
                                    <li>Sustantivo (persona, animal, cosa): carro, casa, finca</li>
                                    <li>Demostrativos: This – these – that – those</li>
                                </ul>
                                <code className="block bg-muted p-2 rounded-md font-mono">he is at home {'=>'} pronoun<br/>Thomas is at home {'=>'} Nombre propio<br/>my father is at home {'=>'} Sustantivo<br/>this is my house {'=>'} Demostrativo</code>
                                 <Card className="bg-destructive/10 border-destructive mt-4">
                                    <CardHeader><CardTitle className="text-destructive">NOTA:</CardTitle></CardHeader>
                                    <CardContent>
                                        <p>Nunca se pueden utilizar un pronombre con un sustantivo o un pronombre con un nombre propio al mismo tiempo.</p>
                                        <code className="block bg-background p-2 rounded-md font-mono mt-2 text-sm flex items-center gap-2"><X className="text-destructive h-4 w-4"/> Thomas he is at home (Thomas él está en la casa)</code>
                                        <code className="block bg-background p-2 rounded-md font-mono mt-2 text-sm flex items-center gap-2"><X className="text-destructive h-4 w-4"/> he my father is at home (él mi padre está en la casa)</code>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'memory_game': return <MemoryGame data={greetingsAndFarewellsData} onComplete={() => handleTopicComplete('memory_game')} />;
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
            case 'countries': return <CountriesExercise onComplete={() => handleTopicComplete('countries')} />;
            case 'reading': return <ReadingExercise onComplete={() => handleTopicComplete('reading')} />;
            case 'mixed_exercises': return <MixedExercise onComplete={() => handleTopicComplete('mixed_exercises')} />;
            default:
                 const topic = learningPath.find(t => t.key === selectedTopic);
                 return <p>Selecciona un tema para empezar. Contenido para {topic?.name} no está implementado.</p>;
        }
    };

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
                                            {learningPath.map(item => {
                                                const Icon = item.icon;
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isSelected = selectedTopic === item.key;

                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted',
                                                            isSelected && 'bg-muted text-primary font-semibold'
                                                        )}
                                                    >
                                                         <div className='flex items-center gap-3'>
                                                            {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <Icon className="h-5 w-5" />}
                                                            <span>{item.name}</span>
                                                        </div>
                                                        {isLocked && <Lock className="h-4 w-4 text-yellow-500 ml-auto" />}
                                                    </li>
                                                )
                                            })}
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
                        <div className="md:col-span-8">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
    