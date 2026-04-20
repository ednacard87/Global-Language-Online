'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Gamepad2, ChevronDown, Trophy } from 'lucide-react';
import { useTranslation } from "@/context/language-context";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SingleFormExercise } from '@/components/kids/exercises/single-form';
import { PresentSimpleExercise } from '@/components/kids/exercises/present-simple';


type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
  subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed', icon?: React.ElementType }[];
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_kids_b1_will_v2';
const mainProgressKey = 'progress_kids_b1_will';

const vocabularyData = [
    { english: 'Global warming', spanish: 'Calentamiento global.' },
    { english: 'Renewable energy', spanish: 'Energía renovable.' },
    { english: 'Pollution', spanish: 'Contaminación.' },
    { english: 'Endangered species', spanish: 'Especies en peligro.' },
    { english: 'Waste', spanish: 'Desperdicios / Residuos.' },
    { english: 'To melt', spanish: 'Derretirse.' },
    { english: 'To improve', spanish: 'Mejorar.' },
    { english: 'Deforestation', spanish: 'Deforestación.' },
    { english: 'Fossil fuels', spanish: 'Combustibles fósiles.' },
    { english: 'Recycling', spanish: 'reciclaje' },
    { english: 'Carbon footprint', spanish: 'Huella de carbono.' },
    { english: 'Eco-system', spanish: 'Ecosistema.' },
];

const willPositiveExercises = [
    { spanish: 'ella comerá pollo', answer: ["she will eat chicken"] },
    { spanish: 'el vivirá en Londres', answer: ["he will live in london"] },
    { spanish: 'nosotros veremos la serie From', answer: ["we will watch the series from", "we will watch from series", "we will watch the show from", "we will watch from the series", "we will watch the serie from"] },
    { spanish: 'ellos estudiaran ingles por 2 años', answer: ["they will study english for 2 years"] },
];

const willNegativeExercises = [
    { spanish: 'ella no comerá pollo', answer: ["she will not eat chicken", "she won't eat chicken"] },
    { spanish: 'el no vivirá en Londres', answer: ["he will not live in london", "he won't live in london"] },
    { spanish: 'nosotros no veremos la serie From', answer: ["we will not watch the series from", "we won't watch the series from", "we will not watch from the series", "we won't watch from the series", "we will not watch the serie from", "we won't watch the serie from"] },
    { spanish: 'ellos no estudiaran ingles por 2 años', answer: ["they will not study english for 2 years", "they won't study english for 2 years"] },
];

const willInterrogativeExercises = [
    { spanish: '¿ella comerá pollo?', answer: ["will she eat chicken?"] },
    { spanish: '¿el vivirá en Londres?', answer: ["will he live in london?"] },
    { spanish: '¿nosotros veremos la serie From?', answer: ["will we watch the series from?", "will we watch from the series?", "will we watch the serie from?"] },
    { spanish: '¿ellos estudiaran ingles por 2 años?', answer: ["will they study english for 2 years?"] },
];

const willMixedExercises = [
    {
        spanish: "yo aprenderé ingles pronto",
        answers: {
            affirmative: ["I will learn English soon", "I'll learn English soon"],
            negative: ["I will not learn English soon", "I won't learn English soon"],
            interrogative: ["will I learn English soon?"],
            shortAffirmative: ["yes, I will"],
            shortNegative: ["no, I will not", "no, I won't"]
        }
    },
    {
        spanish: "tu leerás el libro mañana",
        answers: {
            affirmative: ["you will read the book tomorrow", "you'll read the book tomorrow"],
            negative: ["you will not read the book tomorrow", "you won't read the book tomorrow"],
            interrogative: ["will you read the book tomorrow?"],
            shortAffirmative: ["yes, I will"],
            shortNegative: ["no, I will not", "no, I won't"]
        }
    },
    {
        spanish: "nosotros comeremos pizza esta noche",
        answers: {
            affirmative: ["we will eat pizza tonight", "we'll eat pizza tonight"],
            negative: ["we will not eat pizza tonight", "we won't eat pizza tonight"],
            interrogative: ["will we eat pizza tonight?"],
            shortAffirmative: ["yes, we will"],
            shortNegative: ["no, we will not", "no, we won't"]
        }
    },
    {
        spanish: "ellos jugaran video juegos",
        answers: {
            affirmative: ["they will play video games", "they'll play video games"],
            negative: ["they will not play video games", "they won't play video games"],
            interrogative: ["will they play video games?"],
            shortAffirmative: ["yes, they will"],
            shortNegative: ["no, they will not", "no, they won't"]
        }
    },
    {
        spanish: "él jugara futbol",
        answers: {
            affirmative: ["he will play football", "he'll play football", "he will play soccer", "he'll play soccer"],
            negative: ["he will not play football", "he won't play football", "he will not play soccer", "he won't play soccer"],
            interrogative: ["will he play football?", "will he play soccer?"],
            shortAffirmative: ["yes, he will"],
            shortNegative: ["no, he will not", "no, he won't"]
        }
    }
];

const FinalVocabularyExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<number, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleInputChange = (index: number, value: string) => {
        setUserAnswers(prev => ({ ...prev, [index]: value }));
        setValidationStatus(prev => ({ ...prev, [index]: 'unchecked' }));
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: Record<number, 'correct' | 'incorrect' | 'unchecked'> = {};
        vocabularyData.forEach((item, index) => {
            const userAnswer = userAnswers[index]?.trim().toLowerCase() || '';
            const correctAnswer = item.english.toLowerCase();
            if (userAnswer === correctAnswer) {
                newValidationStatus[index] = 'correct';
            } else {
                newValidationStatus[index] = 'incorrect';
                allCorrect = false;
            }
        });
        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Has completado el vocabulario." });
            onComplete();
        } else {
            toast({ variant: "destructive", title: "Sigue intentando", description: "Algunas respuestas son incorrectas." });
        }
    };
    
    const getInputClass = (status: 'correct' | 'incorrect' | 'unchecked') => {
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>Vocabulario Final</CardTitle>
                <CardDescription>Escribe la traducción correcta en inglés para cada término.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                    <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                    <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                    {vocabularyData.map((item, index) => (
                        <React.Fragment key={index}>
                            <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                            <div className="p-3 bg-card border rounded-lg flex items-center">
                                <Input
                                    value={userAnswers[index] || ''}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className={cn(getInputClass(validationStatus[index]))}
                                />
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>Verificar</Button>
            </CardFooter>
        </Card>
    );
};

const readingTextData = {
    title: "kidsB1Will.readingTitle",
    content: "Our planet is beautiful. We love our eco-system. But pollution from fossil fuels is a big problem. In the past, people didn't recycle much. Now, we know recycling is important. I think in the future, we will use more renewable energy. We will improve our habits to reduce our carbon footprint. My family and I will help stop deforestation by planting trees next weekend. What will you do to help?",
    questions: [
        { id: 'q1', question: "What is a big problem for our planet?", answers: ["pollution", "pollution from fossil fuels"] },
        { id: 'q2', question: "What did people not do much in the past?", answers: ["recycle"] },
        { id: 'q3', question: "What will we use more of in the future?", answers: ["renewable energy"] },
        { id: 'q4', question: "What will the family do next weekend?", answers: ["plant trees", "help stop deforestation", "help stop deforestation by planting trees"] },
        { id: 'q5', question: "What helps stop deforestation in the text?", answers: ["planting trees"] }
    ]
};

const ReadingExercise = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [validationStatus, setValidationStatus] = useState<Record<string, 'correct' | 'incorrect' | 'unchecked'>>({});

    const handleInputChange = (questionId: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: value }));
        setValidationStatus(prev => ({ ...prev, [questionId]: 'unchecked' }));
    };

    const handleCheckAnswers = () => {
        let allCorrect = true;
        const newValidationStatus: Record<string, 'correct' | 'incorrect' | 'unchecked'> = {};

        readingTextData.questions.forEach(q => {
            const userAnswer = userAnswers[q.id]?.trim().toLowerCase().replace(/[.?]/g, '') || '';
            const correctAnswers = q.answers.map(a => a.toLowerCase().replace(/[.?]/g, ''));
            
            if (correctAnswers.includes(userAnswer)) {
                newValidationStatus[q.id] = 'correct';
            } else {
                newValidationStatus[q.id] = 'incorrect';
                allCorrect = false;
            }
        });

        setValidationStatus(newValidationStatus);

        if (allCorrect) {
            toast({ title: t('kidsB1Will.readingCorrect'), description: t('kidsB1Will.readingAllCorrect') });
            onComplete();
        } else {
            toast({
                variant: 'destructive',
                title: t('kidsB1Will.readingIncorrect'),
                description: t('kidsB1Will.readingReview')
            });
        }
    };
    
    const getInputClass = (questionId: string) => {
        const status = validationStatus[questionId];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive';
        return '';
    };

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t('kidsB1Will.reading')}</CardTitle>
                <CardDescription>{t('kidsB1Will.readingDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg border">
                    <h4 className="font-bold mb-2">{t(readingTextData.title)}</h4>
                    <p className="text-base leading-relaxed">{readingTextData.content}</p>
                </div>
                <div className="space-y-4 pt-4 border-t">
                    {readingTextData.questions.map(q => (
                        <div key={q.id} className="grid gap-2">
                            <Label htmlFor={q.id}>{q.question}</Label>
                            <Input
                                id={q.id}
                                value={userAnswers[q.id] || ''}
                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                className={cn(getInputClass(q.id))}
                                autoComplete="off"
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCheckAnswers}>{t('kidsB1Will.readingCheckAnswers')}</Button>
            </CardFooter>
        </Card>
    );
};

const WordSearchGame = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    
    const words = useMemo(() => vocabularyData.map(v => v.english.replace(/ /g, '').toUpperCase()), []);
    const [grid, setGrid] = useState<string[][]>([]);
    const [foundWords, setFoundWords] = useState<{ word: string, cells: { row: number, col: number }[] }[]>([]);
    const [selection, setSelection] = useState<{row: number, col: number}[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);

    useEffect(() => {
        const gridSize = 18;
        const newGrid: (string | null)[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
        const directions = [
            { dr: 0, dc: 1 },  // Horizontal (right)
            { dr: 1, dc: 0 },  // Vertical (down)
            { dr: 1, dc: 1 },  // Diagonal (down-right)
            { dr: 0, dc: -1 }, // Horizontal (left)
            { dr: -1, dc: 0 }, // Vertical (up)
            { dr: 1, dc: -1 }, // Diagonal (down-left)
            { dr: -1, dc: 1 }, // Diagonal (up-right)
            { dr: -1, dc: -1 },// Diagonal (up-left)
        ];

        words.forEach(originalWord => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 1000) {
                attempts++;
                
                const wordToPlace = Math.random() > 0.5 ? originalWord.split('').reverse().join('') : originalWord;
                const dir = directions[Math.floor(Math.random() * directions.length)];
                
                const startRow = Math.floor(Math.random() * gridSize);
                const startCol = Math.floor(Math.random() * gridSize);

                let canPlace = true;
                
                for (let i = 0; i < wordToPlace.length; i++) {
                    const newRow = startRow + i * dir.dr;
                    const newCol = startCol + i * dir.dc;

                    if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
                        canPlace = false;
                        break;
                    }
                    
                    if (newGrid[newRow][newCol] && newGrid[newRow][newCol] !== wordToPlace[i]) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    for (let i = 0; i < wordToPlace.length; i++) {
                        const newRow = startRow + i * dir.dr;
                        const newCol = startCol + i * dir.dc;
                        newGrid[newRow][newCol] = wordToPlace[i];
                    }
                    placed = true;
                }
            }
            if (!placed) {
                console.warn(`Could not place word: ${originalWord}`);
            }
        });
        
        const finalGrid = newGrid.map(row => row.map(cell => cell || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]));
        setGrid(finalGrid);
        setFoundWords([]);
    }, [words]);

    const handleMouseUp = () => {
        if (!isSelecting || grid.length === 0) return;
        setIsSelecting(false);

        const selectedWord = selection.map(({ row, col }) => grid[row][col]).join('');
        const reversedSelectedWord = selectedWord.split('').reverse().join('');
        
        const wordFound = words.find(w => !foundWords.some(fw => fw.word === w) && (w === selectedWord || w === reversedSelectedWord));

        if (wordFound) {
            setFoundWords(prev => [...prev, { word: wordFound, cells: selection }]);
            toast({ title: "¡Palabra encontrada!", description: `Has encontrado "${wordFound}".` });
        }
        
        setSelection([]);
    };
    
    useEffect(() => {
        if (words && foundWords.length === words.length && words.length > 0) {
            onComplete();
        }
    }, [foundWords, words, onComplete]);


    return (
         <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{t('wordSearch.title')}</CardTitle>
                <CardDescription>{t('wordSearch.description')}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-8 items-start">
                <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="bg-muted p-2 rounded-lg md:col-span-2">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${grid.length > 0 ? grid.length : 1}, minmax(0, 1fr))` }}>
                        {grid.map((row, rowIndex) => (
                            row.map((cell, colIndex) => {
                                const isSelected = selection.some(s => s.row === rowIndex && s.col === colIndex);
                                const isFound = foundWords.some(fw => fw.cells.some(c => c.row === rowIndex && c.col === colIndex));
                                return (
                                <div key={`${rowIndex}-${colIndex}`}
                                    onMouseDown={() => { setIsSelecting(true); setSelection([{row: rowIndex, col: colIndex}]); }}
                                    onMouseEnter={() => { if(isSelecting) setSelection(s => [...s, {row: rowIndex, col: colIndex}])}}
                                    className={cn("flex items-center justify-center aspect-square select-none cursor-pointer rounded bg-background text-sm sm:text-base font-bold", 
                                        isFound ? "bg-primary text-primary-foreground" : (isSelected ? "bg-primary/50" : "")
                                    )}
                                >
                                    {cell}
                                </div>
                                )
                            })
                        ))}
                    </div>
                </div>
                 <div className="md:col-span-1">
                    <h3 className="font-semibold mb-2">{t('wordSearch.wordsToFind')}</h3>
                    <ul className="space-y-1 text-sm">
                        {words.map(word => (
                            <li key={word} className={cn("transition-all", foundWords.some(fw => fw.word === word) && "line-through text-muted-foreground opacity-70")}>
                                {word}
                            </li>
                        ))}
                    </ul>
                 </div>
            </CardContent>
             {foundWords.length === words.length && words.length > 0 && (
                <CardFooter className="justify-center">
                    <div className="text-center p-4">
                        <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                        <h3 className="text-xl font-bold">{t('wordSearch.allWordsFound')}</h3>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
};


export default function WillPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const studentDocRef = useMemoFirebase(
        () => (user ? doc(firestore, 'students', user.uid) : null),
        [firestore, user]
    );
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{role?: string, lessonProgress?: any, progress?: any}>(studentDocRef);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
    }, [user, studentProfile]);
    
    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: t('kidsB1Will.vocabulary'), icon: BookOpen, status: 'active' },
        { key: 'grammar', name: t('kidsB1Will.grammar'), icon: GraduationCap, status: 'locked' },
        {
            key: 'exercise',
            name: t('kidsB1Will.exercise'),
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'positive', name: t('kidsB1Will.positive'), icon: PenSquare, status: 'locked' },
                { key: 'negative', name: t('kidsB1Will.negative'), icon: PenSquare, status: 'locked' },
                { key: 'interrogative', name: t('kidsB1Will.interrogative'), icon: PenSquare, status: 'locked' },
            ],
        },
        { key: 'mixedExercises', name: t('kidsB1Will.mixedExercises'), icon: PenSquare, status: 'locked' },
        { key: 'game', name: t('kidsB1Will.game'), icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: t('kidsB1Will.reading'), icon: BookOpen, status: 'locked' },
        { key: 'finalVocabulary', name: t('kidsB1Will.finalVocabulary'), icon: BookOpen, status: 'locked' },
    ], [t]);
    
    useEffect(() => {
        if (isUserLoading || isProfileLoading) {
            return;
        }

        const newPath = initialLearningPath.map(topic => ({
            ...topic,
            subItems: topic.subItems ? topic.subItems.map(sub => ({ ...sub })) : undefined,
        }));

        if (isAdmin) {
            newPath.forEach(item => {
                item.status = 'completed';
                if (item.subItems) {
                    item.subItems.forEach(sub => sub.status = 'completed');
                }
            });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            newPath.forEach(item => {
                if (savedStatuses[item.key]) item.status = savedStatuses[item.key];
                if (item.subItems && savedStatuses.subItems?.[item.key]) {
                    item.subItems.forEach(subItem => {
                        if (savedStatuses.subItems[item.key][subItem.key]) {
                            subItem.status = savedStatuses.subItems[item.key][subItem.key];
                        }
                    });
                }
            });
        }

        setLearningPath(newPath);

        if (!initialLoadComplete) {
            const firstActive = newPath.find(p => p.status === 'active') || newPath.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
            if (firstActive) {
                if (firstActive.subItems) {
                    const firstActiveSub = firstActive.subItems.find(si => si.status === 'active');
                    setSelectedTopic(firstActiveSub?.key || firstActive.key);
                } else {
                    setSelectedTopic(firstActive.key);
                }
            } else {
                setSelectedTopic(newPath[0]?.key || '');
            }
            setInitialLoadComplete(true);
        }
    
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);

    
    const progress = useMemo(() => {
        if (!initialLoadComplete) return 0;
        let totalTopics = 0;
        let completedTopics = 0;
        learningPath.forEach(t => {
            if(t.subItems) {
                totalTopics += t.subItems.length;
                completedTopics += t.subItems.filter(st => st.status === 'completed').length;
            } else {
                totalTopics++;
                if (t.status === 'completed') completedTopics++;
            }
        });
        return totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
    }, [learningPath, initialLoadComplete]);

    useEffect(() => {
        if (!initialLoadComplete || isUserLoading || isProfileLoading || learningPath.length === 0) return;

        if (!isAdmin && studentDocRef) {
            const statusesToSave: Record<string, any> = {};
            learningPath.forEach(item => {
                statusesToSave[item.key] = item.status;
                if (item.subItems) {
                    if (!statusesToSave.subItems) statusesToSave.subItems = {};
                    statusesToSave.subItems[item.key] = {};
                    item.subItems.forEach(sub => { statusesToSave.subItems[item.key][sub.key] = sub.status; });
                }
            });
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: statusesToSave });
            updateDocumentNonBlocking(studentDocRef, { [`progress.${mainProgressKey}`]: Math.round(progress) });
        }
        if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progress, studentDocRef, isUserLoading, isProfileLoading, initialLoadComplete]);

    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            const newPath = currentPath.map(t => ({
                ...t,
                subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined,
            }));
          
            let nextSelectedTopic: string | null = null;
            let topicFound = false;
            let wasTopicUnlocked = false;

            for (let i = 0; i < newPath.length && !topicFound; i++) {
                const currentTopic = newPath[i];
          
                if (currentTopic.key === topicToComplete) {
                    if (currentTopic.status !== 'completed') { currentTopic.status = 'completed'; }
                    if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                        const next = newPath[i + 1];
                        next.status = 'active';
                        if (next.subItems?.[0]) { next.subItems[0].status = 'active'; nextSelectedTopic = next.subItems[0].key; } 
                        else { nextSelectedTopic = next.key; }
                        wasTopicUnlocked = true;
                    }
                    topicFound = true;
                } else if (currentTopic.subItems) {
                    const subIndex = currentTopic.subItems.findIndex(s => s.key === topicToComplete);
                    if (subIndex !== -1) {
                        if (currentTopic.subItems[subIndex].status !== 'completed') { currentTopic.subItems[subIndex].status = 'completed'; }
                        const nextSubIndex = subIndex + 1;
                        if (nextSubIndex < currentTopic.subItems.length && currentTopic.subItems[nextSubIndex].status === 'locked') {
                            currentTopic.subItems[nextSubIndex].status = 'active';
                            nextSelectedTopic = currentTopic.subItems[nextSubIndex].key;
                            wasTopicUnlocked = true;
                        } else if (currentTopic.subItems.every(s => s.status === 'completed')) {
                            if (currentTopic.status !== 'completed') { currentTopic.status = 'completed'; }
                            if (i + 1 < newPath.length && newPath[i + 1].status === 'locked') {
                                const next = newPath[i + 1];
                                next.status = 'active';
                                if (next.subItems?.[0]) { next.subItems[0].status = 'active'; nextSelectedTopic = next.subItems[0].key; } 
                                else { nextSelectedTopic = next.key; }
                                wasTopicUnlocked = true;
                            }
                        }
                        topicFound = true;
                    }
                }
            }
        
            if (nextSelectedTopic) { setSelectedTopic(nextSelectedTopic); }
            if(wasTopicUnlocked) { toast({ title: "¡Siguiente tema desbloqueado!" }); }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleContinueToGrammar = () => {
        handleTopicComplete('vocabulary');
        setSelectedTopic('grammar');
    };

    const handleTopicSelect = (topicKey: string) => {
        const mainTopic = learningPath.find(t => t.key === topicKey || t.subItems?.some(st => st.key === topicKey));
        const subTopic = mainTopic?.subItems?.find(st => st.key === topicKey);
        
        if (!isAdmin && ((subTopic && subTopic.status === 'locked') || (!subTopic && mainTopic?.status === 'locked'))) {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);

        const exerciseKeys = ['positive', 'negative', 'interrogative', 'mixedExercises', 'finalVocabulary', 'reading', 'game'];
        if (!exerciseKeys.includes(topicKey)) {
             handleTopicComplete(topicKey);
        }
    };
    
    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic) || learningPath.flatMap(t => t.subItems || []).find(st => st?.key === selectedTopic);

        switch(selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>{t('kidsB1Will.vocabulary')}</CardTitle>
                            <CardDescription>Vocabulario del Medio Ambiente</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">English</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                {vocabularyData.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.english}</div>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleContinueToGrammar}>
                                Continuar con Gramática
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                 return (
                    <div className="space-y-6">
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader>
                                <CardTitle>¿Cuándo usamos WILL?</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-lg">
                                <p>Usamos <span className="font-bold text-primary">WILL</span> para hablar sobre el futuro. Es como hacer una promesa o una predicción.</p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
                                    <li>Para decisiones que tomas en el momento. (Ej: "I will have the chicken.")</li>
                                    <li>Para predecir algo que crees que pasará. (Ej: "It will rain tomorrow.")</li>
                                    <li>Para hacer promesas u ofrecimientos. (Ej: "I will help you.")</li>
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader>
                                <CardTitle>Estructura de WILL</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + WILL + Verb + Complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + WILL + NOT + Verb + Complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> WILL + pronoun + Verb + Complement?</p>
                                <div className="border-t my-2" />
                                <p className="font-sans font-semibold pt-2">Respuestas Cortas</p>
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + WILL</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + WILL + NOT</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader>
                                <CardTitle>Contracción Negativa</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center font-mono text-xl p-6">
                                <p>WILL + NOT = <span className="font-bold text-red-500">WON'T</span></p>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'positive':
                return <SingleFormExercise key="positive" onComplete={() => handleTopicComplete('positive')} exerciseData={willPositiveExercises} title="Ejercicios: Forma Positiva" description="Traduce las frases a su forma afirmativa usando 'will'." formType="affirmative" />;
            case 'negative':
                return <SingleFormExercise key="negative" onComplete={() => handleTopicComplete('negative')} exerciseData={willNegativeExercises} title="Ejercicios: Forma Negativa" description="Traduce las frases a su forma negativa usando 'will not' o 'won't'." formType="negative" />;
            case 'interrogative':
                return <SingleFormExercise key="interrogative" onComplete={() => handleTopicComplete('interrogative')} exerciseData={willInterrogativeExercises} title="Ejercicios: Forma Interrogativa" description="Convierte las frases en preguntas usando 'will'." formType="interrogative" />;
            case 'mixedExercises':
                return <PresentSimpleExercise onComplete={() => handleTopicComplete('mixedExercises')} exerciseData={willMixedExercises} title="Ejercicios Mixtos (Will)" showShortAnswers={true} />;
            case 'reading':
                return <ReadingExercise onComplete={() => handleTopicComplete('reading')} />;
            case 'finalVocabulary':
                return <FinalVocabularyExercise onComplete={() => handleTopicComplete('finalVocabulary')} />;
            case 'game':
                return <WordSearchGame onComplete={() => handleTopicComplete('game')} />;
            default:
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                        <CardHeader>
                            <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
                            <CardDescription>Contenido para este tema estará disponible pronto.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-64">
                                <Trophy className="w-24 h-24 text-yellow-300" />
                            </div>
                        </CardContent>
                    </Card>
                );
        }
    };

    return (
        <div className="flex w-full flex-col min-h-screen will-lesson-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/kids/b1" className="hover:underline text-sm text-muted-foreground">Volver al curso B1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary">{t('kidsB1.will')}</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => (
                                                <li key={item.key}>
                                                    {!item.subItems ? (
                                                        <div onClick={() => handleTopicSelect(item.key)}
                                                            className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors', item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
                                                            <div className="flex items-center gap-3">
                                                                <item.icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                                <span>{item.name}</span>
                                                            </div>
                                                            {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500" />}
                                                        </div>
                                                    ) : (
                                                        <Collapsible defaultOpen={item.subItems.some(si => si.status !== 'locked')} disabled={item.status === 'locked' && !isAdmin}>
                                                            <CollapsibleTrigger className="w-full">
                                                                <div className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full', item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted', item.subItems.some(si => si.key === selectedTopic) && 'bg-muted text-primary font-semibold')}>
                                                                    <div className="flex items-center gap-3">
                                                                        <item.icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
                                                                        <span>{item.name}</span>
                                                                    </div>
                                                                    {item.status === 'locked' && !isAdmin ? <Lock className="h-4 w-4 text-yellow-500" /> : <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />}
                                                                </div>
                                                            </CollapsibleTrigger>
                                                            <CollapsibleContent>
                                                                <ul className="pl-8 pt-1 space-y-1">
                                                                    {item.subItems.map((subItem) => (
                                                                        <li key={subItem.key} onClick={() => handleTopicSelect(subItem.key)}
                                                                            className={cn('flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors', subItem.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted', selectedTopic === subItem.key && 'bg-muted text-primary font-semibold')}>
                                                                            <div className='flex items-center gap-3'>
                                                                                <subItem.icon className={cn("h-5 w-5", subItem.status === 'completed' ? 'text-green-500' : '')} />
                                                                                <span>{subItem.name}</span>
                                                                            </div>
                                                                            {subItem.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500" />}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </CollapsibleContent>
                                                        </Collapsible>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{Math.round(progress)}%</span></div>
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
