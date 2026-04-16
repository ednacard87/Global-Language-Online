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
  MessageSquare,
  RefreshCw,
  Flame,
  Trophy,
  CheckCircle,
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
import { useToast } from "@/hooks/use-toast";
import { TranslationExercise } from '@/components/dashboard/translation-exercise';
import { Progress } from "@/components/ui/progress";

// Data from intro/2
const greetingsData = [
    { spanish: 'Hola', english: 'Hello' },
    { spanish: 'Buenos días', english: 'Good morning' },
    { spanish: 'Buenas tardes', english: 'Good afternoon' },
    { spanish: 'Buenas noches (saludo)', english: 'Good evening' },
    { spanish: '¿Cómo estás?', english: 'How are you?' },
    { spanish: '¿Qué tal?', english: "What's up?" },
    { spanish: '¿Cómo vas?', english: 'How is it going?' },
];

const farewellsData = [
    { spanish: 'Adiós', english: 'Goodbye' },
    { spanish: 'Chao', english: 'Bye' },
    { spanish: 'Hasta luego', english: 'See you later' },
    { spanish: 'Hasta pronto', english: 'See you soon' },
    { spanish: 'Buenas noches (despedida)', english: 'Good night' },
    { spanish: 'Cuídate', english: 'Take care' },
    { spanish: 'Nos vemos mañana', english: 'See you tomorrow' },
    { spanish: 'Que tengas un buen día', english: 'Have a nice day' },
];

// Countries data from intro/2
const countriesExerciseData = [
    { pais: 'Estados Unidos', country: 'United States', nationality: 'American', language: 'English' },
    { pais: 'Canadá', country: 'Canada', nationality: 'Canadian', language: ['English', 'French'] },
    { pais: 'México', country: 'Mexico', nationality: 'Mexican', language: 'Spanish' },
    { pais: 'Brasil', country: 'Brazil', nationality: 'Brazilian', language: 'Portuguese' },
    { pais: 'Inglaterra', country: 'England', nationality: 'English', language: 'English' },
    { pais: 'Reino Unido', country: 'United Kingdom', nationality: 'British', language: 'English' },
    { pais: 'Francia', country: 'France', nationality: 'French', language: 'French' },
    { pais: 'Alemania', country: 'Germany', nationality: 'German', language: 'German' },
    { pais: 'Italia', country: 'Italy', nationality: 'Italian', language: 'Italian' },
    { pais: 'España', country: 'Spain', nationality: 'Spanish', language: 'Spanish' },
    { pais: 'Portugal', country: 'Portugal', nationality: 'Portuguese', language: 'Portuguese' },
    { pais: 'China', country: 'China', nationality: 'Chinese', language: 'Mandarin' },
    { pais: 'Japón', country: 'Japan', nationality: 'Japanese', language: 'Japanese' },
    { pais: 'Corea del Sur', country: 'South Korea', nationality: 'South Korean', language: 'Korean' },
    { pais: 'India', country: 'India', nationality: 'Indian', language: ['Hindi', 'English'] },
    { pais: 'Rusia', country: 'Russia', nationality: 'Russian', language: 'Russian' },
    { pais: 'Australia', country: 'Australia', nationality: 'Australian', language: 'English' },
    { pais: 'Colombia', country: 'Colombia', nationality: 'Colombian', language: 'Spanish' },
];

type CountryAnswers = { country: string; nationality: string; language: string; };
type UserAnswers = Record<number, Partial<CountryAnswers>>;
type ValidationStatus = 'correct' | 'incorrect' | 'unchecked';
type ValidationState = Record<number, Record<keyof Omit<CountryAnswers, 'pais'>, ValidationStatus>>;

const CountriesExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [validationStatus, setValidationStatus] = useState<ValidationState>({});

    const handleInputChange = (index: number, field: keyof Omit<CountryAnswers, 'pais'>, value: string) => {
        setUserAnswers(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                [field]: value
            }
        }));
        setValidationStatus(prev => {
            const newStatus = { ...prev };
            if (newStatus[index]) {
                delete newStatus[index][field];
            }
            return newStatus;
        });
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: ValidationState = {};

        countriesExerciseData.forEach((correctAnswer, index) => {
            const userAnswer = userAnswers[index] || {};
            newValidationStatus[index] = { country: 'unchecked', nationality: 'unchecked', language: 'unchecked' };

            const checkField = (field: keyof Omit<CountryAnswers, 'pais'>) => {
                const correctValue = correctAnswer[field];
                const userValue = (userAnswer[field] || '').trim().toLowerCase();

                let isCorrect = false;
                if (Array.isArray(correctValue)) {
                    isCorrect = correctValue.some(val => val.toLowerCase() === userValue) ||
                                correctValue.join(' / ').toLowerCase() === userValue;
                } else {
                    isCorrect = correctValue.toLowerCase() === userValue;
                }

                if (isCorrect) {
                    newValidationStatus[index][field] = 'correct';
                } else {
                    newValidationStatus[index][field] = 'incorrect';
                    allCorrect = false;
                }
            };

            checkField('country');
            checkField('nationality');
            checkField('language');
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: t('countries.allCorrect') });
            onComplete();
        } else {
            toast({ variant: 'destructive', title: t('countries.someIncorrect') });
        }
    };

    const getInputClass = (index: number, field: keyof Omit<CountryAnswers, 'pais'>) => {
        const status = validationStatus[index]?.[field];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t('intro2Page.countries')}</CardTitle>
                <CardDescription>{t('intro2Page.countriesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('intro2Page.tableCountry')}</TableHead>
                            <TableHead>{t('intro2Page.tableCountries')}</TableHead>
                            <TableHead>{t('intro2Page.tableNationalities')}</TableHead>
                            <TableHead>{t('intro2Page.tableLanguage')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {countriesExerciseData.map((data, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{data.pais}</TableCell>
                                <TableCell>
                                    <Input
                                        value={userAnswers[index]?.country || ''}
                                        onChange={(e) => handleInputChange(index, 'country', e.target.value)}
                                        className={cn(getInputClass(index, 'country'))}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={userAnswers[index]?.nationality || ''}
                                        onChange={(e) => handleInputChange(index, 'nationality', e.target.value)}
                                        className={cn(getInputClass(index, 'nationality'))}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        value={userAnswers[index]?.language || ''}
                                        onChange={(e) => handleInputChange(index, 'language', e.target.value)}
                                        className={cn(getInputClass(index, 'language'))}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>{t('countries.checkAnswers')}</Button>
            </CardFooter>
        </Card>
    );
};

// Memory Game Component
const MemoryGame = ({ title, data, onGameComplete }: { title: string, data: {english: string, spanish: string}[], onGameComplete: () => void }) => {
    const [cards, setCards] = useState<any[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedPairIds, setMatchedPairIds] = useState<number[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [streak, setStreak] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    const initializeGame = () => {
        const gameCards = data.flatMap((pair, index) => [
            { id: index * 2, pairId: index, text: pair.english },
            { id: index * 2 + 1, pairId: index, text: pair.spanish },
        ]);

        for (let i = gameCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
        }
        
        setCards(gameCards);
        setFlippedIndices([]);
        setMatchedPairIds([]);
        setIsChecking(false);
        setStreak(0);
        setIsCompleted(false);
    };

    useEffect(() => {
        initializeGame();
    }, [data]);

    useEffect(() => {
        if (flippedIndices.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];

            if (firstCard.pairId === secondCard.pairId) {
                setMatchedPairIds(prev => [...prev, firstCard.pairId]);
                setStreak(prev => prev + 1);
                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 500);
            } else {
                setStreak(0);
                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 800);
            }
        }
    }, [flippedIndices, cards]);

    const isLevelComplete = matchedPairIds.length > 0 && matchedPairIds.length === data.length;

    useEffect(() => {
        if (isLevelComplete && !isCompleted) {
            setIsCompleted(true);
            onGameComplete();
        }
    }, [isLevelComplete, isCompleted, onGameComplete]);

    const handleCardClick = (index: number) => {
        if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index) || matchedPairIds.includes(cards[index].pairId)) {
            return;
        }
        setFlippedIndices(prev => [...prev, index]);
    };
    
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <div className="flex justify-between items-center pt-2">
                    <Button size="icon" variant="ghost" onClick={initializeGame} className="ml-2">
                        <RefreshCw className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 text-orange-500 font-bold">
                        <Flame className="h-5 w-5" />
                        <span>{streak}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLevelComplete ? (
                    <div className="text-center p-8 flex flex-col items-center">
                         <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                         <h2 className="text-2xl font-bold">¡Juego Completado!</h2>
                         <p className="text-muted-foreground mt-2">¡Has completado el juego de memoria!</p>
                    </div>
                ) : (
                    <div className={cn("grid grid-cols-4 gap-1 md:gap-2")}>
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
                                        isMatched && "border-green-500 border-2",
                                        !isFlipped && !isMatched && "hover:scale-105"
                                    )}
                                >
                                    <CardContent className="p-1 flex items-center justify-center">
                                        {isFlipped || isMatched ? (
                                            <span className="text-xs md:text-sm font-bold text-center">{card.text}</span>
                                        ) : (
                                            <BrainCircuit className="h-4 w-4 md:h-5 w-5 text-primary/50" />
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


// Main page component
type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};
const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };
const progressStorageVersion = "kids_intro2_path_v2";

const initialLearningPathData: Omit<Topic, 'status'>[] = [
    { key: 'greetings', name: 'Saludos', icon: Hand },
    { key: 'greetings-memory', name: 'Memory (Saludos)', icon: BrainCircuit },
    { key: 'tobe2', name: 'To be 2', icon: GraduationCap },
    { key: 'tobe2-exercise', name: 'Ejercicios To be 2', icon: PenSquare },
    { key: 'farewells', name: 'Despedidas', icon: MessageSquare },
    { key: 'farewells-memory', name: 'Memory (Despedidas)', icon: BrainCircuit },
    { key: 'tobe3', name: 'To be 3', icon: GraduationCap },
    { key: 'tobe3-exercise', name: 'Ejercicios To be 3', icon: PenSquare },
    { key: 'countries', name: 'Paises y Nacionalidades', icon: BookOpen },
];

export default function KidsIntro2Page() {
  const { t } = useTranslation();
  const [selectedTopic, setSelectedTopic] = useState<string>('greetings');

  const { user } = useUser();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const firestore = useFirestore();
  const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [user, firestore]
  );
  const { data: studentProfile } = useDoc<{role?: 'admin' | 'student', lessonProgress?: any}>(studentDocRef);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);


  const [learningPath, setLearningPath] = useState<Topic[]>(
    initialLearningPathData.map((item, index) => ({
      ...item,
      status: index === 0 ? 'active' : 'locked',
    }))
  );
  
  const [previousPath, setPreviousPath] = useState<Topic[] | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let path = initialLearningPathData.map((item, index) => ({
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
    setLearningPath(path);
    const firstActive = path.find(p => p.status === 'active');
    setSelectedTopic(firstActive?.key || path[0].key);
  }, [isAdmin, isClient, studentProfile]);

  const progress = useMemo(() => {
    const completedTopics = learningPath.filter(t => t.status === 'completed').length;
    return Math.round((completedTopics / learningPath.length) * 100);
  }, [learningPath]);

  useEffect(() => {
    if (!isClient) return;
    if (!isAdmin && studentDocRef && learningPath.length > 0) {
        const statuses = learningPath.reduce((acc, item) => {
            acc[item.key] = item.status;
            return acc;
        }, {} as Record<string, Topic['status']>);
        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statuses
        });
    }

    if (studentDocRef) {
        updateDocumentNonBlocking(studentDocRef, {
            'progress.kidsIntro2Progress': progress
        });
    }

    window.dispatchEvent(new CustomEvent('progressUpdated'));
  }, [learningPath, progress, isAdmin, isClient, studentDocRef]);

  useEffect(() => {
    if (previousPath) {
      const newlyUnlocked = learningPath.find((newItem, index) => {
        const oldItem = previousPath[index];
        return oldItem && oldItem.status === 'locked' && newItem.status === 'active';
      });
  
      if (newlyUnlocked) {
        toast({
          title: '¡Siguiente tema desbloqueado!',
          description: `Ahora puedes continuar con ${newlyUnlocked.name}`,
        });
      }
    }
    setPreviousPath(learningPath);
  }, [learningPath, previousPath, toast]);

  useEffect(() => {
    if (!topicToComplete) return;

    setLearningPath(currentPath => {
      const newPath = currentPath.map(item => ({ ...item }));
      const currentIndex = newPath.findIndex((t) => t.key === topicToComplete);
      
      if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
          newPath[currentIndex].status = 'completed';

          if (currentIndex + 1 < newPath.length && newPath[currentIndex + 1].status === 'locked') {
              newPath[currentIndex + 1].status = 'active';
          }
      }
      return newPath;
    });

    setTopicToComplete(null);
  }, [topicToComplete]);

  const handleTopicSelect = (topicKey: string) => {
    const topic = learningPath.find((t) => t.key === topicKey);
    if (topic?.status === 'locked' && !isAdmin) {
      return;
    }
    setSelectedTopic(topicKey);

    if(['greetings', 'farewells', 'tobe2', 'tobe3'].includes(topicKey)) {
        setTopicToComplete(topicKey);
    }
  };

  const renderContent = () => {
    const topic = learningPath.find((t) => t.key === selectedTopic);
    switch (selectedTopic) {
        case 'greetings':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('intro2Page.greetings')}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                            {greetingsData.map((item, index) => (
                                <React.Fragment key={index}>
                                    <div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div>
                                    <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            );
        case 'greetings-memory':
            return <MemoryGame title="Memory (Saludos)" data={greetingsData} onGameComplete={() => setTopicToComplete('greetings-memory')} />;
        
        case 'tobe2':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader>
                        <CardTitle>{t('intro1Page.verbtobe2')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + To be + possessive + noun + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + To be + Not + possessive + noun + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> To be + pronoun + possessive + noun + complement ?</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                            <p className="text-lg italic text-muted-foreground mb-2">"{t('intro1Page.exampleSentence')}"</p>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> They are my friends</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> They are not my friends</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> are they my friends?</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        case 'tobe2-exercise':
            return <TranslationExercise exerciseKey="exercises2" onComplete={() => setTopicToComplete('tobe2-exercise')} />;

        case 'farewells':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('intro2Page.farewells')}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.spanish')}</div>
                            <div className="font-bold p-3 bg-muted rounded-lg text-center">{t('common.english')}</div>
                            {farewellsData.map((item, index) => (
                                <React.Fragment key={index}>
                                    <div className="p-3 bg-card border rounded-lg text-center">{item.spanish}</div>
                                    <div className="p-3 bg-card border rounded-lg font-medium text-center">{item.english}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            );
        case 'farewells-memory':
            return <MemoryGame title="Memory (Despedidas)" data={farewellsData} onGameComplete={() => setTopicToComplete('farewells-memory')} />;
        case 'tobe3':
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                    <CardHeader><CardTitle>{t('intro1Page.verbtobe3')}</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">{t('intro1Page.verbtobeStructureTitle')}</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> possessive + noun + to be + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> possessive + noun + to be + Not + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> To be + possessive + noun + complement ?</p>
                            </div>
                        </div>
                         <div>
                            <h3 className="text-xl font-semibold mb-2">{t('intro1Page.exampleTitle')}</h3>
                            <div className="space-y-2 p-4 bg-muted rounded-lg font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> My mother is a nurse</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> My mother is not a nurse</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> is my mother a nurse?</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        case 'tobe3-exercise':
            return <TranslationExercise exerciseKey="exercises3" onComplete={() => setTopicToComplete('tobe3-exercise')} />;
        case 'countries':
            return <CountriesExercise onComplete={() => setTopicToComplete('countries')} />;
        default:
            return (
                <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                    <CardHeader><CardTitle>{topic?.name}</CardTitle></CardHeader>
                    <CardContent><p>Contenido para {topic?.name} vendrá aquí.</p></CardContent>
                </Card>
            );
    }
  };

  return (
    <div className="flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/intro" className="hover:underline text-sm text-muted-foreground">
              {t('kidsPage.backToKidsCourse')}
            </Link>
            <h1 className="text-4xl font-bold dark:text-primary">{t('kidsPage.intro2AdventureTitle')}</h1>
          </div>
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-3">
              <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                <CardHeader>
                  <CardTitle>Aventura</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav>
                    <ul className="space-y-1">
                      {learningPath.map((item) => {
                        const isLocked = item.status === 'locked';
                        const isSelected = selectedTopic === item.key;
                        const StatusIcon = ICONS[item.status];
                        return (
                            <li
                              key={item.key}
                              onClick={() => handleTopicSelect(item.key)}
                              className={cn(
                                'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                isLocked && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                isSelected && (!isLocked || isAdmin) && 'bg-muted text-primary font-semibold'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <StatusIcon className="h-5 w-5" />
                                <span>{item.name}</span>
                              </div>
                            </li>
                        );
                      })}
                    </ul>
                  </nav>
                  <div className="mt-6 pt-6 border-t">
                      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                          <span>Progreso de la Aventura</span>
                          <span className="font-bold text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-9">{renderContent()}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
