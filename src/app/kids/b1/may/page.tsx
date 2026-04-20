'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Gamepad2, ChevronDown, Trophy, BookText } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


const lifeGoalsVocab = [
    { spanish: "Solicitar una beca.", english: "Apply for a scholarship" },
    { spanish: "Tomarse un año sabático.", english: "Take a gap year" },
    { spanish: "Estudiar en el extranjero.", english: "Study abroad" },
    { spanish: "Obtener un ascenso.", english: "Get a promotion" },
    { spanish: "Cambiar de carrera/profesión.", english: "Change career" },
    { spanish: "Formar una familia.", english: "Start a family" },
    { spanish: "Unirse a una organización benéfica.", english: "Join a charity" },
    { spanish: "Aprender un oficio (ej. carpintería, mecánica).", english: "Learn a trade" },
    { spanish: "Obtener un título universitario.", english: "Get a degree" },
    { spanish: "Mudarse al extranjero.", english: "Move abroad" },
    { spanish: "Jubilarse joven.", english: "Retire early" },
    { spanish: "Montar un negocio.", english: "Set up a business" },
];


const readingTextData = {
    title: "Life is Full of Choices",
    content: "Next year, I might take a gap year to travel. I may study abroad in Spain. It's a big decision! My friend, Sarah, will set up a business. She thinks she may get a promotion first. I will not start a family soon, but I might join a charity to help animals. We all have big dreams for the future.",
    questions: [
        { id: 'q1', question: "What might the narrator do next year?", answers: ["take a gap year", "take a gap year to travel"] },
        { id: 'q2', question: "Where may the narrator study?", answers: ["in spain", "spain"] },
        { id: 'q3', question: "What will Sarah do?", answers: ["set up a business"] },
        { id: 'q4', question: "What might the narrator join?", answers: ["a charity", "a charity to help animals"] }
    ]
};

const mayPositiveExercises = [
    { spanish: "Puede que yo consiga un trabajo mañana. (50% probabilidad).", answer: ["I may get a job tomorrow."] },
    { spanish: "ella tal vez se mude al extranjero. (30% probabilidad).", answer: ["She might move abroad."] },
    { spanish: "Nosotros podríamos viajar por el mundo el próximo año. (50% probabilidad).", answer: ["We may travel the world next year."] },
    { spanish: "Él tal vez aprenda unidioma nuevo. (30% probabilidad).", answer: ["He might learn a new language."] }
];
const mayNegativeExercises = [
    { spanish: "Puede que ellos no se gradúen este semestre. (50% probabilidad).", answer: ["They may not graduate this semester."] },
    { spanish: "Tal vez yo no solicite la beca. (30% probabilidad).", answer: ["I might not apply for the scholarship."] },
    { spanish: "Ella podría no cambiar de carrera. (50% probabilidad).", answer: ["She may not change career."] },
    { spanish: "Nosotros tal vez no ahorremos suficiente dinero. (30% probabilidad).", answer: ["We might not save enough money."] }
];
const mayInterrogativeExercises = [
    { spanish: "¿Podría yo formar una familia en el futuro? (Preguntando por una posibilidad remota).", answer: ["Might I start a family in the future?"] },
    { spanish: "¿Puede que él gane un premio? (Preguntando por una posibilidad).", answer: ["May he win an award?"] },
    { spanish: "¿Tal vez nosotros empecemos un negocio juntos? (Posibilidad remota).", answer: ["Might we start a business together?"] },
    { spanish: "¿Podría ella jubilarse joven? (Preguntando por una posibilidad).", answer: ["May she retire early?"] }
];

const mayPositiveVocab = {
    "conseguir": "to get",
    "empleo": "job",
    "mudarse": "to move",
    "extranjero": "abroad",
    "viajar": "to travel",
    "mundo": "world",
    "proximo año": "next year",
    "idioma": "language",
    "aprender": "to learn"
};

const mayNegativeVocab = {
    "graduarse": "to graduate",
    "este": "this",
    "solicitar": "to apply",
    "beca": "scholarship",
    "cambiar": "to change",
    "carrera": "career",
    "ahorrar": "to save",
    "suficiente": "enough",
    "dinero": "money"
};

const mayInterrogativeVocab = {
    "formar": "to start",
    "futuro": "future",
    "ganar": "to win",
    "premio": "award",
    "empezar": "to start",
    "negocio": "business",
    "juntos": "together",
    "jubilarse": "retire"
};

const mayMixedExercises = [
    {
        spanish: "ella puede que consiga un empleo",
        answers: {
            affirmative: ["She may get a job."],
            negative: ["She may not get a job."],
            interrogative: ["May she get a job?"],
            shortAffirmative: ["Yes, she may."],
            shortNegative: ["No, she may not."]
        }
    },
    {
        spanish: "tal vez nosotros nos mudemos al extranjero",
        answers: {
            affirmative: ["We might move abroad."],
            negative: ["We might not move abroad."],
            interrogative: ["Might we move abroad?"],
            shortAffirmative: ["Yes, we might."],
            shortNegative: ["No, we might not."]
        }
    },
    {
        spanish: "yo puede que solicite una beca",
        answers: {
            affirmative: ["I may apply for a scholarship."],
            negative: ["I may not apply for a scholarship."],
            interrogative: ["May I apply for a scholarship?"],
            shortAffirmative: ["Yes, you may."],
            shortNegative: ["No, you may not."]
        }
    }
];

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
            toast({ title: "Correcto!", description: "¡Todas las respuestas son correctas!" });
            onComplete();
        } else {
            toast({
                variant: 'destructive',
                title: "Incorrecto",
                description: "Revisa las respuestas marcadas en rojo."
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
                <CardTitle>Reading Comprehension: "{readingTextData.title}"</CardTitle>
                <CardDescription>Lee el texto y responde las preguntas para probar tu comprensión.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg border">
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
                <Button onClick={handleCheckAnswers}>Verificar Respuestas</Button>
            </CardFooter>
        </Card>
    );
};

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
  subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed', icon?: React.ElementType }[];
};

const WordSearchGame = ({ onComplete }: { onComplete: () => void }) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    
    const words = useMemo(() => lifeGoalsVocab.map(v => v.english.replace(/ /g, '').toUpperCase()), []);
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


const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_kids_b1_may_v1';
const mainProgressKey = 'progress_kids_b1_may';

export default function MayPage() {
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
        { key: 'vocabulary', name: 'Vocabulario (Life Goals)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        {
            key: 'exercise1',
            name: 'Ejercicio 1',
            icon: PenSquare,
            status: 'locked',
            subItems: [
                { key: 'positive-ex', name: 'Positiva', icon: PenSquare, status: 'locked' },
                { key: 'negative-ex', name: 'Negativa', icon: PenSquare, status: 'locked' },
                { key: 'interrogative-ex', name: 'Interrogativa', icon: PenSquare, status: 'locked' },
            ]
        },
        { key: 'mixedExercises', name: 'Ejercicios Mixtos', icon: PenSquare, status: 'locked' },
        { key: 'game', name: 'Sopa de Letras (Life Goals)', icon: Gamepad2, status: 'locked' },
        { key: 'reading', name: 'Lectura', icon: BookText, status: 'locked' },
    ], []);
    
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
                if(item.subItems) {
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
            const firstActive = newPath.find(p => p.status === 'active') || newPath.find(p => p.subItems?.some(s => s.status === 'active'));
            if (firstActive) {
                if (firstActive.subItems) {
                    const firstActiveSub = firstActive.subItems.find(s => s.status === 'active');
                    setSelectedTopic(firstActiveSub?.key || firstActive.key);
                } else {
                    setSelectedTopic(firstActive.key);
                }
            } else {
                setSelectedTopic(newPath[0]?.key || '');
            }
            setInitialLoadComplete(true);
        }
    
    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading, initialLoadComplete]);

    
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

        const exerciseKeys = ['positive-ex', 'negative-ex', 'interrogative-ex', 'mixedExercises', 'game', 'reading'];
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
                            <CardTitle>Life Goals and Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                {lifeGoalsVocab.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.english}</div>
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
                                <CardTitle>Diferencia entre MAY y MIGHT</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-lg">
                                <p>Ambos se usan para hablar de posibilidades en el futuro, pero hay un matiz de probabilidad:</p>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-primary">MAY (50% de probabilidad)</h4>
                                    <p className="text-muted-foreground text-base">Se usa cuando algo es muy posible.</p>
                                    <ul className="list-disc list-inside text-base text-muted-foreground pl-4">
                                        <li>Significa: Puede que / Podría.</li>
                                        <li>Indica que la acción está más cerca de ser real.</li>
                                        <li>Es más formal y educado.</li>
                                        <li>Se usa para pedir permiso formal (Ej: "May I come in?").</li>
                                    </ul>
                                    <p className="mt-2 p-3 bg-muted rounded-lg font-mono text-base">"I have good grades, so I may get a degree next year." (Es probable).</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-bold text-primary">MIGHT (30% de probabilidad)</h4>
                                    <p className="text-muted-foreground text-base">Se usa para posibilidades más remotas o distantes.</p>
                                     <ul className="list-disc list-inside text-base text-muted-foreground pl-4">
                                        <li>Significa: Podría / Tal vez (pero con menos probabilidad).</li>
                                        <li>Indica que la acción es más un "sueño" o algo difícil.</li>
                                        <li>Es un poco más informal/común en conversación.</li>
                                        <li>Casi nunca se usa para pedir permiso.</li>
                                    </ul>
                                    <p className="mt-2 p-3 bg-muted rounded-lg font-mono text-base">"I don't have much money, but I might move abroad someday." (Es un sueño lejano).</p>
                                </div>
                                <div className="border-t pt-4">
                                    <h4 className="font-bold">En resumen:</h4>
                                    <p className="text-muted-foreground mt-1 text-base">Si crees que hay un buen chance, usa <span className="font-semibold text-primary">May</span>. Si es algo que ves difícil o muy incierto, usa <span className="font-semibold text-primary">Might</span>.</p>
                                </div>
                            </CardContent>
                        </Card>
            
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                            <CardHeader>
                                <CardTitle>Estructura Gramatical</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 font-mono text-base">
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+)</span> pronoun + may/might + verb + complement</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-)</span> pronoun + may/might + not + verb + complement</p>
                                <p><span className="font-bold text-lg text-blue-500 mr-2">(?)</span> May/Might + pronoun + verb + complement?</p>
                                <div className="border-t my-2" />
                                <p className="font-sans font-semibold pt-2">Respuestas Cortas</p>
                                <p><span className="font-bold text-lg text-green-500 mr-2">(+A)</span> Yes, pronoun + may/might.</p>
                                <p><span className="font-bold text-lg text-red-500 mr-2">(-A)</span> No, pronoun + may/might not.</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="shadow-soft rounded-lg border-2 border-destructive bg-white dark:bg-card">
                            <CardHeader>
                                <CardTitle className="text-destructive dark:text-destructive">Nota Importante</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center font-mono text-xl p-6 bg-brand-lilac dark:bg-muted rounded-b-lg">
                                <p>No se suelen usar contracciones (como <code className="p-1 rounded bg-background">mightn't</code>) en el inglés moderno; es mejor decir <code className="p-1 rounded bg-background">might not</code>.</p>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'positive-ex':
                return <SingleFormExercise onComplete={() => handleTopicComplete('positive-ex')} exerciseData={mayPositiveExercises} title="Ejercicios: Forma Positiva" description="Traduce las frases a su forma afirmativa." formType="affirmative" vocabulary={mayPositiveVocab} />;
            case 'negative-ex':
                return <SingleFormExercise onComplete={() => handleTopicComplete('negative-ex')} exerciseData={mayNegativeExercises} title="Ejercicios: Forma Negativa" description="Traduce las frases a su forma negativa." formType="negative" vocabulary={mayNegativeVocab} />;
            case 'interrogative-ex':
                return <SingleFormExercise onComplete={() => handleTopicComplete('interrogative-ex')} exerciseData={mayInterrogativeExercises} title="Ejercicios: Forma Interrogativa" description="Convierte las frases en preguntas." formType="interrogative" vocabulary={mayInterrogativeVocab} />;
            case 'mixedExercises':
                return <PresentSimpleExercise onComplete={() => handleTopicComplete('mixedExercises')} exerciseData={mayMixedExercises} title="Ejercicios Mixtos" showShortAnswers={true} />;
            case 'game':
                 return <WordSearchGame onComplete={() => handleTopicComplete('game')} />;
            case 'reading':
                return <ReadingExercise onComplete={() => handleTopicComplete('reading')} />;
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
                        <h1 className="text-4xl font-bold text-white dark:text-primary">May and Might</h1>
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
