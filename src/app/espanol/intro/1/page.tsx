'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, CheckCircle, Hand, GraduationCap, Type, Activity, MessageSquare, BrainCircuit, RefreshCw, Flame, Trophy, Mic, Globe, MapPin, ArrowLeft, ArrowRight, Star, Loader2, Pencil } from 'lucide-react';
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

// Helper function to normalize strings for comparison (removes accents)
const normalizeString = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const progressStorageVersion = 'progress_espanol_intro_1_v6_bilingual'; 
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
    { spanish: 'Encantado / Encantada de conocerte', english: 'Delighted / Pleased to meet you' },
];

const despedidasData = [
    { spanish: 'Adiós', english: 'Goodbye' },
    { spanish: 'Chao', english: 'Bye' },
    { spanish: 'Hasta luego', english: 'See you later' },
    { spanish: 'Hasta mañana', english: 'See you tomorrow' },
    { spanish: 'Hasta pronto', english: 'See you soon' },
    { spanish: 'Nos vemos...', english: 'See you...' },
    { spanish: 'Nos vemos pronto', english: 'See you soon' },
    { spanish: 'Nos vemos mañana', english: 'See you mañana' },
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
    { english: 'cat', spanish: 'gato' },
    { english: 'friend', spanish: 'amigo' },
    { english: 'boyfriend', spanish: 'novio' },
    { english: 'girlfriend', spanish: 'novia' },
    { english: 'university', spanish: 'universidad' },
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
    { english: 'busy', spanish: 'ocupado' },
    { english: 'tidy', spanish: 'ordenado' },
];

const verbsPracticeData = [
    { english: 'To study', spanish: 'estudiar' },
    { english: 'To work', spanish: 'trabajar' },
    { english: 'To walk', spanish: 'caminar' },
    { english: 'To have dinner', spanish: 'cenar' },
    { english: 'To watch TV', spanish: 'ver televisión' },
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
    { english: 'cat', spanish: 'gato' },
    { english: 'friend', spanish: 'amigo' },
    { english: 'boyfriend', spanish: 'novio' },
    { english: 'girlfriend', spanish: 'novia' },
    { english: 'university', spanish: 'universidad' },
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
                        <Trophy className="h-20 w-20 text-yellow-400 mb-6 animate-bounce" />
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

function Intro1SpanishContent() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [nounAnswers, setNounAnswers] = useState<string[]>(Array(nounsPracticeData.length).fill(''));
    const [nounValidation, setNounValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(nounsPracticeData.length).fill('unchecked'));

    const [adjAnswers, setAdjAnswers] = useState<string[]>(Array(adjectivesPracticeData.length).fill(''));
    const [adjValidation, setAdjValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(adjectivesPracticeData.length).fill('unchecked'));

    const [verbAnswers, setVerbAnswers] = useState<string[]>(Array(verbsPracticeData.length).fill(''));
    const [verbValidation, setVerbValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(verbsPracticeData.length).fill('unchecked'));

    const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
    const [readingValidation, setReadingValidation] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});

    const targetStudentId = searchParams.get('studentId');
    const currentUID = targetStudentId || user?.uid;

    const studentDocRef = useMemoFirebase(
        () => (currentUID ? doc(firestore, 'students', currentUID) : null),
        [firestore, currentUID]
    );

    const authUserRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );

    const { data: authUserProfile } = useDoc<{ role?: string }>(authUserRef);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any; name?: string }>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return authUserProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, authUserProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'fonetica', name: 'Fonética Español', icon: Mic, status: 'active' },
        { key: 'latinoamerica', name: 'Latinoamérica', icon: Globe, status: 'locked' },
        { key: 'colombia', name: 'Colombia', icon: MapPin, status: 'locked' },
        { key: 'saludos', name: 'Saludos (Greetings)', icon: Hand, status: 'locked' },
        { key: 'despedidas', name: 'Despedidas (Farewells)', icon: MessageSquare, status: 'locked' },
        { key: 'sustantivos', name: 'Sustantivos (Nouns)', icon: Type, status: 'locked' },
        { key: 'adjetivos', name: 'Adjetivos (Adjectives)', icon: GraduationCap, status: 'locked' },
        { key: 'verbos', name: 'Verbos (Verbs)', icon: Activity, status: 'locked' },
        { key: 'vocabulario', name: 'Basic Vocabulary', icon: BookOpen, status: 'locked' },
        { key: 'lectura', name: 'Reading Comprehension', icon: BookOpen, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !studentProfile || initialLoadComplete) return;

        let path = initialLearningPath.map(topic => ({...topic}));
        let savedST = '';

        if (isAdmin && !targetStudentId) {
            path.forEach(item => item.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
            });
            savedST = savedData.lastSelectedTopic || '';
        }
        
        let lastDone = true;
        for (let i = 0; i < path.length; i++) {
            if (lastDone && path[i].status === 'locked') path[i].status = 'active';
            lastDone = path[i].status === 'completed';
        }

        setLearningPath(path);
        setSelectedTopic(savedST || path.find(p => p.status === 'active')?.key || path[0].key);
        setInitialLoadComplete(true);
        setTimeout(() => setIsInitialLoading(false), 200);

    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete, targetStudentId]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (!initialLoadComplete || isInitialLoading || isAdmin || !studentDocRef || learningPath.length === 0 || targetStudentId) return;

        const s: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { s[item.key] = item.status; });

        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageVersion}`]: s,
            [`progress.${mainProgressKey}`]: progressValue
        });
        if (progressValue >= 100) window.dispatchEvent(new CustomEvent('progressUpdated'));
    }, [learningPath, isAdmin, progressValue, studentDocRef, initialLoadComplete, selectedTopic, isInitialLoading, targetStudentId]);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    useEffect(() => {
        if (!topicToComplete) return;

        setLearningPath(currentPath => {
            const newPath = currentPath.map(item => ({...item}));
            const currentIndex = newPath.findIndex((t) => t.key === topicToComplete);
            
            if (currentIndex !== -1) {
                newPath[currentIndex].status = 'completed';

                if (currentIndex + 1 < newPath.length) {
                    if (newPath[currentIndex + 1].status === 'locked') {
                        newPath[currentIndex + 1].status = 'active';
                        setTimeout(() => toast({ title: "¡Tema desbloqueado!", description: `Siguiente misión: ${newPath[currentIndex + 1].name}` }), 0);
                    }
                    // Auto-advance
                    const nextKey = newPath[currentIndex + 1].key;
                    setTimeout(() => setSelectedTopic(nextKey), 0);
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
            const userAnswer = normalizeString(nounAnswers[index]);
            const correctAnswer = normalizeString(item.spanish);
            const isCorrect = userAnswer === correctAnswer || (item.english === 'mother' && userAnswer === 'mama');
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
            const userAnswer = normalizeString(adjAnswers[index]);
            const correctAnswer = normalizeString(item.spanish);
            const isCorrect = userAnswer === correctAnswer;
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
            const userAnswer = normalizeString(verbAnswers[index]);
            const correctAnswer = normalizeString(item.spanish);
            let isCorrect = userAnswer === correctAnswer;

            if (item.english === 'To watch TV' && (userAnswer === 'ver la television' || userAnswer === 'ver tv' || userAnswer === 'ver tele')) isCorrect = true;
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

        lecturaData.multipleChoice.forEach(q => {
            const isCorrect = readingAnswers[q.id] === q.answer;
            if(!isCorrect) allCorrect = false;
            newValidation[q.id] = isCorrect ? 'correct' : 'incorrect';
        });

        lecturaData.openQuestions.forEach(q => {
            const userAnswer = normalizeString(readingAnswers[q.id] || '');
            const correctAnswer = normalizeString(q.answer);
            const isCorrect = userAnswer.includes(correctAnswer);
            if(!isCorrect) allCorrect = false;
            newValidation[q.id] = isCorrect ? 'correct' : 'incorrect';
        });

        setReadingValidation(newValidation);
        if(allCorrect) {
            toast({ title: '¡Felicitaciones!', description: 'Has respondido todas las preguntas correctamente.' });
            handleTopicComplete('lectura');
        } else {
            toast({ variant: 'destructive', title: 'Algunas respuestas son incorrectas.' });
        }
    };

    const renderContent = () => {
        if (isInitialLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

        switch(selectedTopic) {
            case 'fonetica':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Fonética del Español / Spanish Phonetics</CardTitle>
                            <CardDescription>Aprende la pronunciación básica / Learn basic pronunciation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                                <h3 className="text-xl font-bold text-primary mb-2">Las 5 Vocales / The 5 Vowels</h3>
                                <div className="grid grid-cols-5 gap-2 text-center">
                                    {['A', 'E', 'I', 'O', 'U'].map(v => (
                                        <div key={v} className="p-4 bg-muted rounded-lg text-3xl font-black text-primary">{v}</div>
                                    ))}
                                </div>
                                <div className="mt-4 space-y-2 text-left">
                                    <p className="text-muted-foreground font-bold">A diferencia del inglés, las vocales en español tienen <strong>UN SOLO SONIDO</strong> cada una. Siempre suenan igual, no importa la palabra.</p>
                                    <p className="text-sm italic text-muted-foreground border-t pt-2">Unlike English, vowels in Spanish have <strong>ONLY ONE SOUND</strong> each. They always sound the same, regardless of the word.</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid md:grid-cols-2 gap-6 text-left">
                                <div className="space-y-4 font-medium text-foreground">
                                    <h3 className="text-xl font-bold text-primary">Tips de Pronunciación</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong>Transparencia:</strong> Casi todas las palabras se pronuncian exactamente como se escriben.</li>
                                        <li><strong>La H:</strong> Es muda. Nunca suena. (Ej: <em>Hola</em> se pronuncia /ola/).</li>
                                        <li><strong>La LL y Y:</strong> En la mayoría de Latinoamérica, suenan parecido a la "Y" en inglés (<em>Yellow</em>).</li>
                                        <li><strong>La R:</strong> Es más fuerte y vibrante que en inglés, especialmente al inicio de palabra.</li>
                                    </ul>
                                </div>
                                <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-dashed">
                                    <h3 className="text-xl font-bold text-primary">Pronunciation Tips</h3>
                                    <ul className="list-disc pl-5 space-y-2 text-sm italic text-muted-foreground">
                                        <li><strong>Transparency:</strong> Almost all words are pronounced exactly as they are written.</li>
                                        <li><strong>The H:</strong> It is silent. It never makes a sound. (e.g., <em>Hola</em> is pronounced /ola/).</li>
                                        <li><strong>LL and Y:</strong> In most of Latin America, they sound similar to the English "Y" (<em>Yellow</em>).</li>
                                        <li><strong>The R:</strong> It is stronger and more vibrant than in English, especially at the beginning of a word.</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('fonetica')} className="font-bold">Avanzar / Advance</Button>
                        </CardFooter>
                    </Card>
                );
            case 'latinoamerica':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Latinoamérica / Latin America</CardTitle>
                            <CardDescription>Un mundo de cultura y color / A world of culture and color.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-white">
                                <Image src="https://img.magnific.com/vector-gratis/mapa-america-latina-nombres-paises_1199-386.jpg?semt=ais_hybrid&w=740&q=80" alt="Latam Map" fill className="object-contain" data-ai-hint="latam map" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 text-lg leading-relaxed text-left">
                                <div className="space-y-4 font-medium text-foreground">
                                    <p>Latinoamérica es una región vasta que abarca desde México hasta la Patagonia. Con más de 600 millones de personas, es el hogar de una increíble biodiversidad y una rica herencia cultural que mezcla raíces indígenas, europeas y africanas.</p>
                                    <p>Aprender español te abre las puertas a 20 países con historias, paisajes y tradiciones únicas.</p>
                                </div>
                                <div className="space-y-4 text-base italic text-muted-foreground bg-muted/20 p-4 rounded-xl border border-dashed">
                                    <p>Latin America is a vast region spanning from Mexico to Patagonia. With over 600 million people, it is home to incredible biodiversity and a rich cultural heritage that blends indigenous, European, and African roots.</p>
                                    <p>Learning Spanish opens the doors to 20 countries with unique stories, landscapes, and traditions.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('latinoamerica')} className="font-bold">Siguiente: Colombia / Next: Colombia</Button>
                        </CardFooter>
                    </Card>
                );
            case 'colombia':
                return (
                    <Card className="shadow-soft border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Colombia: El Corazón del Español / The Heart of Spanish</CardTitle>
                            <CardDescription>Conoce el país de la amabilidad / Get to know the land of friendliness.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-xl border bg-white">
                                <Image src="https://i.pinimg.com/474x/e2/23/72/e22372e5ec66b63e0548f9d566ccc9e3.jpg" alt="Colombia Map" fill className="object-contain" data-ai-hint="colombia map" />
                            </div>
                            <Accordion type="single" collapsible className="w-full text-left">
                                <AccordionItem value="acentos">
                                    <AccordionTrigger className="text-xl font-bold">Acentos / Accents</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <div className="space-y-2">
                                            <p className="font-semibold text-foreground">Colombia es famosa por tener uno de los españoles más claros del mundo, pero tiene mucha variedad regional:</p>
                                            <ul className="list-disc pl-5 text-muted-foreground font-medium">
                                                <li><strong>Paisa:</strong> De Medellín, muy rítmico y amable.</li>
                                                <li><strong>Rolo:</strong> De Bogotá, neutro y formal.</li>
                                                <li><strong>Costeño:</strong> De la costa caribe, rápido y alegre.</li>
                                                <li><strong>Patuso:</strong> Del sur de Colombia Pasto - similar a ecuatoriano.</li>
                                            </ul>
                                        </div>
                                        <div className="p-3 bg-muted rounded-lg border italic text-sm text-muted-foreground">
                                            Colombia is famous for having one of the clearest Spanish accents in the world, but it has a lot of regional variety:
                                            <ul className="list-disc pl-5 mt-1">
                                                <li><strong>Paisa:</strong> From Medellín, very rhythmic and friendly.</li>
                                                <li><strong>Rolo:</strong> From Bogotá, neutral and formal.</li>
                                                <li><strong>Costeño:</strong> From the Caribbean coast, fast and cheerful.</li>
                                            </ul>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="comida">
                                    <AccordionTrigger className="text-xl font-bold">Comida / Food</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <div className="space-y-2">
                                            <p className="font-semibold text-foreground">No te puedes ir sin probar:</p>
                                            <ul className="list-disc pl-5 text-muted-foreground font-medium">
                                                <li><strong>Bandeja Paisa:</strong> El plato más emblemático y abundante.</li>
                                                <li><strong>Arepas:</strong> Pan de maíz circular que acompaña casi todo.</li>
                                                <li><strong>Ajiaco:</strong> Una sopa de pollo y papas tradicional de Bogotá.</li>
                                            </ul>
                                        </div>
                                        <div className="p-3 bg-muted rounded-lg border italic text-sm text-muted-foreground">
                                            You can't leave without trying:
                                            <ul className="list-disc pl-5 mt-1">
                                                <li><strong>Bandeja Paisa:</strong> The most emblematic and abundant dish.</li>
                                                <li><strong>Arepas:</strong> Circular corn bread that accompanies almost everything.</li>
                                                <li><strong>Ajiaco:</strong> A traditional chicken and potato soup from Bogotá.</li>
                                            </ul>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="cultura">
                                    <AccordionTrigger className="text-xl font-bold">Cultura / Culture</AccordionTrigger>
                                    <AccordionContent className="space-y-4 pt-2">
                                        <p className="font-semibold text-foreground">Es la tierra del Realismo Mágico de Gabriel García Márquez. La música es omnipresente: desde la Cumbia y el Vallenato tradicional hasta el Pop y Reggaetón internacional de figuras como Shakira, Juanes o J Balvin.</p>
                                        <div className="p-3 bg-muted rounded-lg border italic text-sm text-muted-foreground">It is the land of Magical Realism by Gabriel García Márquez. Music is omnipresent: from traditional Cumbia and Vallenato to international Pop and Reggaeton from figures like Shakira, Juanes, or J Balvin.</div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('colombia')} className="font-bold">Comenzar con los saludos / Start with Greetings</Button>
                        </CardFooter>
                    </Card>
                );
            case 'saludos': return (
                <Card>
                    <CardHeader><CardTitle>Saludos (Greetings)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center text-foreground">Español</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center text-foreground">Inglés</div>
                            {saludosData.map(item => (
                                <Fragment key={item.spanish}>
                                    <div className="p-3 border rounded-lg font-medium text-center text-foreground">{item.spanish}</div>
                                    <div className="p-3 border rounded-lg text-muted-foreground text-center">{item.english}</div>
                                </Fragment>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleTopicComplete('saludos')} className="font-bold">Continuar a Despedidas</Button>
                    </CardFooter>
                </Card>
            );
            case 'despedidas': return (
                <Card>
                    <CardHeader><CardTitle>Despedidas (Farewells)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center text-foreground">Español</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center text-foreground">Inglés</div>
                            {despedidasData.map(item => (
                                <Fragment key={item.spanish}>
                                    <div className="p-3 border rounded-lg font-medium text-center text-foreground">{item.spanish}</div>
                                    <div className="p-3 border rounded-lg text-muted-foreground text-center">{item.english}</div>
                                </Fragment>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => handleTopicComplete('despedidas')} className="font-bold">Continuar</Button>
                    </CardFooter>
                </Card>
            );
            case 'sustantivos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Sustantivos (Nouns)</CardTitle>
                        <CardDescription>Entendiendo el género y número en español. <br /><span className="italic text-xs">Understanding gender and number in Spanish.</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-left">
                        <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                            <p className="text-lg font-bold text-foreground">Un sustantivo es una <strong>persona, animal y cosa</strong>.</p>
                            <p className="text-sm italic text-muted-foreground">A noun is a <strong>person, animal and thing</strong>.</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">1. Género (Gender)</h3>
                            <p className="text-muted-foreground font-bold">A diferencia del inglés, cada sustantivo en español tiene un género: <strong>Masculino</strong> o <strong>Femenino</strong>.</p>
                            <p className="text-sm italic text-muted-foreground mb-4">Unlike English, every noun in Spanish has a gender: <strong>Masculine</strong> or <strong>Feminine</strong>.</p>
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 bg-muted rounded-lg border-l-4 border-blue-500">
                                    <h4 className="font-bold text-foreground">Masculino (Masculine)</h4>
                                    <p className="text-sm font-medium">Usualmente terminan en <strong>-o</strong></p>
                                    <p className="text-xs italic text-muted-foreground">Usually end in <strong>-o</strong></p>
                                    <p className="font-mono mt-2 italic">Ejemplo: El libr<strong>o</strong></p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg border-l-4 border-pink-500">
                                    <h4 className="font-bold text-foreground">Femenino (Feminine)</h4>
                                    <p className="text-sm font-medium">Usualmente terminan en <strong>-a</strong></p>
                                    <p className="text-xs italic text-muted-foreground">Usually end in <strong>-a</strong></p>
                                    <p className="font-mono mt-2 italic">Ejemplo: La mes<strong>a</strong></p>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">2. Número (Number)</h3>
                            <p className="text-muted-foreground font-bold">Para hacer los sustantivos plurales, seguimos estas reglas simples:</p>
                            <p className="text-sm italic text-muted-foreground mb-2">To make nouns plural, we follow these simple rules:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2 font-medium">
                                <li>Si termina en vocal, añade <strong>-s</strong>: <span className="italic">Libro {"=>"} Libros</span><br /><span className="text-xs italic text-muted-foreground">If it ends in a vowel, add <strong>-s</strong>.</span></li>
                                <li>Si termina en consonante, añade <strong>-es</strong>: <span className="italic">Papel {"=>"} Papeles</span><br /><span className="text-xs italic text-muted-foreground">If it ends in a consonant, add <strong>-es</strong>.</span></li>
                            </ul>
                        </div>
                        <Separator />
                        <div className="max-w-md mx-auto">
                            <h3 className="text-xl font-bold text-primary mb-4">Practice</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="font-bold bg-muted p-2 rounded text-center">Inglés</div>
                                <div className="font-bold bg-muted p-2 rounded text-center">Español</div>
                                {nounsPracticeData.map((item, index) => (
                                    <Fragment key={item.english}>
                                        <div className="p-2 border rounded flex items-center justify-center font-medium capitalize text-foreground">{item.english}</div>
                                        <Input value={nounAnswers[index] || ''} onChange={(e) => handleNounInputChange(index, e.target.value)} className={cn("h-10", nounValidation[index] === 'correct' && "border-green-500", nounValidation[index] === 'incorrect' && "border-destructive")} placeholder="..." autoComplete="off" />
                                    </Fragment>
                                ))}
                            </div>
                            <Button variant="secondary" onClick={handleCheckNouns} className="mt-4 w-full font-bold">Verificar / Check</Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleTopicComplete('sustantivos')} className="font-bold">Continuar</Button>
                    </CardFooter>
                </Card>
            );
            case 'adjetivos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Adjetivos (Adjectives)</CardTitle>
                        <CardDescription>Cómo describir cosas en español. <br /><span className="italic text-xs">How to describe things in Spanish.</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-left">
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">1. Concordancia (Agreement)</h3>
                            <p className="text-muted-foreground font-bold">Los adjetivos deben coincidir con el sustantivo que describen en <strong>género</strong> y <strong>número</strong>.</p>
                            <p className="text-sm italic text-muted-foreground">Adjectives must match the noun they describe in <strong>gender</strong> and <strong>number</strong>.</p>
                            <div className="mt-4 p-4 bg-muted rounded-lg font-mono text-base text-foreground">
                                <p>Libro roj<strong>o</strong></p>
                                <p>Mesa roj<strong>a</strong></p>
                                <p>Libros roj<strong>os</strong></p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">2. Posición (Position)</h3>
                            <p className="text-muted-foreground font-bold">En español, los adjetivos usualmente van <strong>después</strong> del sustantivo.</p>
                            <p className="text-sm italic text-muted-foreground">In Spanish, adjectives usually come <strong>after</strong> the noun.</p>
                            <div className="mt-4 space-y-2">
                                <div className="p-3 bg-muted rounded-lg border flex items-center justify-between text-foreground">
                                    <span className="text-sm font-semibold">Español: Sustantivo + Adjetivo</span>
                                    <span className="text-xs text-muted-foreground italic">"Carro azul"</span>
                                </div>
                                <div className="p-3 bg-muted rounded-lg border flex items-center justify-between text-foreground">
                                    <span className="text-sm font-semibold">Inglés: Adjetivo + Sustantivo</span>
                                    <span className="text-xs text-muted-foreground italic">"Blue car"</span>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="max-w-md mx-auto">
                            <h3 className="text-xl font-bold text-primary mb-4">Practice</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="font-bold bg-muted p-2 rounded text-center">Inglés</div>
                                <div className="font-bold bg-muted p-2 rounded text-center">Español</div>
                                {adjectivesPracticeData.map((item, index) => (
                                    <Fragment key={item.english}>
                                        <div className="p-2 border rounded flex items-center justify-center font-medium capitalize text-foreground">{item.english}</div>
                                        <Input value={adjAnswers[index] || ''} onChange={(e) => handleAdjInputChange(index, e.target.value)} className={cn("h-10", adjValidation[index] === 'correct' && "border-green-500", adjValidation[index] === 'incorrect' && "border-destructive")} placeholder="..." autoComplete="off" />
                                    </Fragment>
                                ))}
                            </div>
                            <Button variant="secondary" onClick={handleCheckAdjectives} className="mt-4 w-full font-bold">Verificar / Check</Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleTopicComplete('adjetivos')} className="font-bold">Continuar</Button>
                    </CardFooter>
                </Card>
            );
            case 'verbos': return (
                <Card>
                    <CardHeader>
                        <CardTitle>Verbos (Verbs)</CardTitle>
                        <CardDescription>El motor de la oración. <br /><span className="italic text-xs">The engine of the sentence.</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-left">
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">1. El Infinitivo (The Infinitive)</h3>
                            <p className="text-muted-foreground font-bold">Todos los verbos en español terminan en una de tres formas en su estado original:</p>
                            <p className="text-sm italic text-muted-foreground mb-4">All verbs in Spanish end in one of three ways in their original state:</p>
                            <div className="flex gap-4 mt-4">
                                <div className="flex-1 p-3 bg-primary/10 rounded text-center font-bold text-primary">-AR</div>
                                <div className="flex-1 p-3 bg-primary/10 rounded text-center font-bold text-primary">-ER</div>
                                <div className="flex-1 p-3 bg-primary/10 rounded text-center font-bold text-primary">-IR</div>
                            </div>
                            <p className="text-sm mt-2 text-center text-muted-foreground italic">Ejemplos: Habl<strong>ar</strong>, Com<strong>er</strong>, Viv<strong>ir</strong></p>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">2. El Misterio de "Ser" vs "Estar" (Ser vs. Estar)</h3>
                            <p className="text-muted-foreground font-bold">En español tenemos dos formas para decir "to be":</p>
                            <p className="text-sm italic text-muted-foreground mb-2">In Spanish we have two ways to say "to be":</p>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="p-3 bg-muted rounded border-l-4 border-primary text-foreground">
                                    <strong className="text-primary uppercase">SER:</strong> Cosas permanentes (rasgos, identidad).
                                    <br /><span className="text-xs italic text-muted-foreground">Permanent things (traits, identity).</span>
                                </div>
                                <div className="p-3 bg-muted rounded border-l-4 border-secondary text-foreground">
                                    <strong className="text-secondary-foreground uppercase">ESTAR:</strong> Cosas temporales (sentimientos, ubicación).
                                    <br /><span className="text-xs italic text-muted-foreground">Temporary things (feelings, location).</span>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="max-w-md mx-auto">
                            <h3 className="text-xl font-bold text-primary mb-4">Practice</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="font-bold bg-muted p-2 rounded text-center">Inglés</div>
                                <div className="font-bold bg-muted p-2 rounded text-center">Español</div>
                                {verbsPracticeData.map((item, index) => (
                                    <Fragment key={item.english}>
                                        <div className="p-2 border rounded flex items-center justify-center font-medium capitalize text-foreground">{item.english}</div>
                                        <Input value={verbAnswers[index] || ''} onChange={(e) => handleVerbInputChange(index, e.target.value)} className={cn("h-10", verbValidation[index] === 'correct' && "border-green-500", verbValidation[index] === 'incorrect' && "border-destructive")} placeholder="..." autoComplete="off" />
                                    </Fragment>
                                ))}
                            </div>
                            <Button variant="secondary" onClick={handleCheckVerbs} className="mt-4 w-full font-bold">Verificar / Check</Button>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleTopicComplete('verbos')} className="font-bold">Continuar</Button>
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
                        <div className="bg-muted p-6 rounded-lg border italic text-lg leading-relaxed shadow-inner text-left text-foreground">
                            {lecturaData.content}
                        </div>
                        <Separator />
                        <div className="space-y-8 text-left">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-primary">Preguntas de Selección Múltiple</h3>
                                {lecturaData.multipleChoice.map((q) => (
                                    <div key={q.id} className="space-y-3 p-4 border rounded-lg bg-card">
                                        <Label className="text-lg font-semibold text-foreground">{q.question}</Label>
                                        <RadioGroup value={readingAnswers[q.id] || ''} onValueChange={(val) => handleReadingAnswerChange(q.id, val)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {q.options.map((option) => (
                                                <div key={option} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                                                    <Label htmlFor={`${q.id}-${option}`} className="font-medium text-foreground">{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                        {readingValidation[q.id] === 'incorrect' && <p className="text-xs text-destructive font-bold">Respuesta incorrecta. Inténtalo de nuevo.</p>}
                                        {readingValidation[q.id] === 'correct' && <p className="text-xs text-green-500 font-bold">¡Correcto!</p>}
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="space-y-6 text-left">
                                <h3 className="text-xl font-bold text-primary">Preguntas de Escritura</h3>
                                {lecturaData.openQuestions.map((q) => (
                                    <div key={q.id} className="space-y-2 p-4 border rounded-lg bg-card">
                                        <Label htmlFor={q.id} className="text-lg font-semibold text-foreground">{q.question}</Label>
                                        <Input id={q.id} value={readingAnswers[q.id] || ''} onChange={e => handleReadingAnswerChange(q.id, e.target.value)} className={cn('mt-1 text-lg h-12', readingValidation[q.id] === 'correct' && 'border-green-500 bg-green-50/5', readingValidation[q.id] === 'incorrect' && 'border-destructive bg-destructive/5')} placeholder="Escribe tu respuesta aquí..." autoComplete="off" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center pt-6 border-t">
                        <Button onClick={handleCheckReading} size="lg" className="w-full sm:w-auto px-12 font-bold">Verificar Respuestas</Button>
                    </CardFooter>
                 </Card>
            );
            default: return <p className='text-foreground'>Selecciona un tema para empezar.</p>;
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left">
                        <Link href="/espanol/intro" className="hover:underline text-sm text-muted-foreground flex items-center gap-2 mb-2">
                            <ArrowLeft className="h-4 w-4" /> Volver a Aventura Intro
                        </Link>
                        <h1 className="text-4xl font-bold dark:text-primary uppercase tracking-tighter">Intro 1 Español (1S)</h1>
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
                                                        className={cn('flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer text-left text-foreground',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            isSelected && 'bg-muted text-primary font-semibold'
                                                        )}
                                                    >
                                                        {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <Icon className="h-5 w-5" />}
                                                        <span>{item.name}</span>
                                                        {isLocked && <Lock className="h-4 w-4 text-yellow-500 ml-auto" />}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </nav>
                                     <div className="mt-6 pt-6 border-t text-left">
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

export default function Intro1SpanishPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
            <Intro1SpanishContent />
        </Suspense>
    );
}
