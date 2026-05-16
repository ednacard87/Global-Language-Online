'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Gamepad2, Feather, Bot, Trophy, Loader2, ArrowRight } from 'lucide-react';
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ComparativeExercise } from '@/components/kids/exercises/comparative-exercise';
import { SuperlativeExercise } from '@/components/kids/exercises/superlative-exercise';
import { SyllableExercise, type SyllableExerciseData } from '@/components/kids/exercises/syllable-exercise';
import { MonosyllabicExercise } from '@/components/kids/exercises/monosyllabic-exercise';
import { BisyllabicExercise } from '@/components/kids/exercises/bisyllabic-exercise';
import { LongAdjectivesExercise } from '@/components/kids/exercises/long-adjectives-exercise';
import { IrregularAdjectivesExercise } from '@/components/kids/exercises/irregular-adjectives-exercise';
import { MixedComparativeSuperlativeExercise } from '@/components/kids/exercises/mixed-comparative-superlative-exercise';
import { useTranslation } from '@/context/language-context';
import { HolidayTextExercise } from '@/components/kids/exercises/holiday-text-exercise';
import { MixedExercise3 } from '@/components/kids/exercises/mixed-exercise-3';

// --- Claves de progreso únicas para la Clase 13 de Adultos ---
const progressStorageKey = 'progress_a1_eng_u3_c13_independent_v1';
const mainProgressKey = 'progress_a1_eng_unit_3_class_13';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };

// --- Data ---
const vocabularyData = [
    { spanish: 'BONITO/A', english: ['pretty', 'beautiful'] },
    { spanish: 'ANCHO', english: ['wide'] },
    { spanish: 'DESPIERTO', english: ['awake'] },
    { spanish: 'DIFERENTE', english: ['different'] },
    { spanish: 'LARGO', english: ['long'] },
    { spanish: 'SECO', english: ['dry'] },
    { spanish: 'ENOJADO', english: ['angry'] },
    { spanish: 'CANSADO', english: ['tired'] },
    { spanish: 'BRILLANTE', english: ['bright'] },
    { spanish: 'SUCIO', english: ['dirty'] },
    { spanish: 'LIMPIO', english: ['clean'] },
    { spanish: 'MOJADO', english: ['wet'] },
];

const monosyllabicData: SyllableExerciseData = [
    { spanish: 'PEQUEÑO', answers: { adjective: 'small', comparative: 'smaller', superlative: 'the smallest' } },
    { spanish: 'ALTO', answers: { adjective: 'tall', comparative: 'taller', superlative: 'the tallest' } },
    { spanish: 'JOVEN', answers: { adjective: 'young', comparative: 'younger', superlative: 'the youngest' } },
    { spanish: 'VIEJO', answers: { adjective: 'old', comparative: 'older', superlative: 'the oldest' } },
    { spanish: 'NUEVO', answers: { adjective: 'new', comparative: 'newer', superlative: 'the newest' } },
    { spanish: 'LARGO', answers: { adjective: 'long', comparative: 'longer', superlative: 'the longest' } },
    { spanish: 'CORTO, BAJO', answers: { adjective: 'short', comparative: 'shorter', superlative: 'the shortest' } },
    { spanish: 'GORDO', answers: { adjective: 'fat', comparative: 'fatter', superlative: 'the fattest' } },
    { spanish: 'GRANDE', answers: { adjective: 'big', comparative: 'bigger', superlative: 'the biggest' } },
    { spanish: 'CALIENTE', answers: { adjective: 'hot', comparative: 'hotter', superlative: 'the hottest' } },
    { spanish: 'ALTO', answers: { adjective: 'high', comparative: 'higher', superlative: 'the highest' } },
    { spanish: 'RAPIDO', answers: { adjective: 'fast', comparative: 'faster', superlative: 'the fastest' } },
    { spanish: 'SECO', answers: { adjective: 'dry', comparative: 'drier', superlative: 'the driest' } },
    { spanish: 'MOJADO', answers: { adjective: 'wet', comparative: 'wetter', superlative: 'the wettest' } },
    { spanish: 'TRISTE', answers: { adjective: 'sad', comparative: 'sadder', superlative: 'the saddest' } },
    { spanish: 'CALIDO', answers: { adjective: 'warm', comparative: 'warmer', superlative: 'the warmest' } },
];

const bisyllabicData: SyllableExerciseData = [
    { spanish: 'FACIL', answers: { adjective: 'easy', comparative: 'easier', superlative: 'the easiest' } },
    { spanish: 'FELIZ', answers: { adjective: 'happy', comparative: 'happier', superlative: 'the happiest' } },
    { spanish: 'LOCO', answers: { adjective: 'crazy', comparative: 'crazier', superlative: 'the craziest' } },
    { spanish: 'PESADO', answers: { adjective: 'heavy', comparative: 'heavier', superlative: 'the heaviest' } },
    { spanish: 'TIERNO', answers: { adjective: 'tender', comparative: 'tenderer', superlative: 'the tenderest' } },
    { spanish: 'ESTRECHO', answers: { adjective: 'narrow', comparative: 'narrower', superlative: 'the narrowest' } },
];

const longAdjectivesData: SyllableExerciseData = [
    { spanish: 'CARO', answers: { adjective: 'expensive', comparative: 'more expensive', superlative: 'the most expensive' } },
    { spanish: 'MODERNO', answers: { adjective: 'modern', comparative: 'more modern', superlative: 'the most modern' } },
    { spanish: 'HERMOSO', answers: { adjective: 'beautiful', comparative: 'more beautiful', superlative: 'the most beautiful' } },
    { spanish: 'ELEGANTE', answers: { adjective: 'elegant', comparative: 'more elegant', superlative: 'the most elegant' } },
    { spanish: 'INTERESANTE', answers: { adjective: 'interesting', comparative: 'more interesting', superlative: 'the most interesting' } },
    { spanish: 'PELIGROSO', answers: { adjective: 'dangerous', comparative: 'more dangerous', superlative: 'the most dangerous' } },
    { spanish: 'FAMOSO', answers: { adjective: 'famous', comparative: 'more famous', superlative: 'the most famous' } },
    { spanish: 'DIFICIL', answers: { adjective: 'difficult', comparative: 'more difficult', superlative: 'the most difficult' } },
    { spanish: 'INTELIGENTE', answers: { adjective: 'intelligent', comparative: 'more intelligent', superlative: 'the most intelligent' } },
    { spanish: 'HONESTO', answers: { adjective: 'honest', comparative: 'more honest', superlative: 'the most honest' } },
    { spanish: 'HUMILDE', answers: { adjective: 'humble', comparative: 'more humble', superlative: 'the most humble' } },
    { spanish: 'EDUCADO', answers: { adjective: 'polite', comparative: 'more polite', superlative: 'the most polite' } },
    { spanish: 'ABURRIDOR', answers: { adjective: 'boring', comparative: 'more boring', superlative: 'the most boring' } },
];

const irregularAdjectivesData: SyllableExerciseData = [
    { spanish: 'BUENO/BIEN', answers: { adjective: ['good', 'well'], comparative: 'better', superlative: 'the best' } },
    { spanish: 'MALO', answers: { adjective: 'bad', comparative: 'worse', superlative: 'the worst' } },
    { spanish: 'MUCHO', answers: { adjective: ['much', 'many'], comparative: 'more', superlative: 'the most' } },
    { spanish: 'POCO', answers: { adjective: 'little', comparative: 'less', superlative: 'the least' } },
    { spanish: 'LEJOS', answers: { adjective: 'far', comparative: ['farther', 'further'], superlative: ['the farthest', 'the furthest'] } },
];

// --- Internal Helper Components ---
const WordSearchGame = ({ onComplete }: { onComplete: () => void }) => {
    const { toast } = useToast();
    
    const words = useMemo(() => [
        "TALL", "SHORT", "BIG", "SMALL", "YOUNG", "OLD", "NEW", "LONG",
        "HAPPY", "EASY", "NARROW", "BEAUTIFUL", "MODERN", "EXPENSIVE",
        "FAMOUS", "GOOD", "BAD", "FAR"
    ].sort((a, b) => b.length - a.length), []);

    const [grid, setGrid] = useState<string[][]>([]);
    const [foundWords, setFoundWords] = useState<{ word: string, cells: { row: number, col: number }[] }[]>([]);
    const [selection, setSelection] = useState<{row: number, col: number}[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [gameIsFinished, setGameIsFinished] = useState(false);

    useEffect(() => {
        const gridSize = 16;
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
                    if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize || (newGrid[newRow][newCol] && newGrid[newRow][newCol] !== wordToPlace[i])) {
                        canPlace = false; break;
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
        });
        
        const finalGrid = newGrid.map(row => row.map(cell => cell || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]));
        setGrid(finalGrid);
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
        if (words.length > 0 && foundWords.length === words.length && !gameIsFinished) {
            setGameIsFinished(true);
            toast({ title: "¡Felicidades!", description: "Has encontrado todas las palabras." });
        }
    }, [foundWords, words, gameIsFinished, toast]);

    return (
         <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Sopa de Letras (Adjetivos)</CardTitle>
                <CardDescription>Encuentra los adjetivos básicos.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-8 items-start">
                <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="bg-muted p-2 rounded-lg md:col-span-2 overflow-auto">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))` }}>
                        {grid.map((row, rowIndex) => (
                            row.map((cell, colIndex) => {
                                const isSelected = selection.some(s => s.row === rowIndex && s.col === colIndex);
                                const isFound = foundWords.some(fw => fw.cells.some(c => c.row === rowIndex && colIndex === colIndex));
                                return (
                                <div key={`${rowIndex}-${colIndex}`}
                                    onMouseDown={() => { setIsSelecting(true); setSelection([{row: rowIndex, col: colIndex}]); }}
                                    onMouseEnter={() => { if(isSelecting) setSelection(s => [...s, {row: rowIndex, col: colIndex}])}}
                                    className={cn("flex items-center justify-center aspect-square select-none cursor-pointer rounded bg-background text-[10px] sm:text-xs font-bold border", 
                                        isFound ? "bg-green-500 text-white border-green-600" : (isSelected ? "bg-primary/50" : "border-transparent")
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
                    <h3 className="font-semibold mb-2">Palabras a Encontrar</h3>
                    <ul className="space-y-1 text-sm columns-2 md:columns-1">
                        {words.map(word => (
                            <li key={word} className={cn("transition-all", foundWords.some(fw => fw.word === word) && "line-through text-muted-foreground opacity-70")}>
                                {word}
                            </li>
                        ))}
                    </ul>
                 </div>
            </CardContent>
            <CardFooter className="justify-end">
                <Button onClick={onComplete} disabled={!gameIsFinished && !isAdmin}>
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

// --- Main Page Component ---
export default function EngA1Class13Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    // Form states
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [validationStatus, setValidationStatus] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvance, setCanAdvance] = useState(false);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulario', name: 'Vocabulario (Adjetivos)', icon: BookOpen, status: 'active' },
        { key: 'comparativos', name: 'Comparativos', icon: GraduationCap, status: 'locked' },
        { key: 'ejercicio-comparativo', name: 'Ejercicio Comparativo', icon: PenSquare, status: 'locked' },
        { key: 'superlativos', name: 'Superlativos', icon: GraduationCap, status: 'locked' },
        { key: 'ejercicio-superlativo', name: 'Ejercicio Superlativo', icon: PenSquare, status: 'locked' },
        { key: 'grammar-mixto', name: 'Grammar mixto', icon: GraduationCap, status: 'locked' },
        { key: 'monosilabos', name: 'Monosilabos', icon: Feather, status: 'locked' },
        { key: 'ejercicio-monosilabos', name: 'Ejercicio Monosilabos', icon: PenSquare, status: 'locked' },
        { key: 'bisilabos', name: 'Bisilabos', icon: Feather, status: 'locked' },
        { key: 'ejercicio-bisilabos', name: 'Ejercicio Bisilabos', icon: PenSquare, status: 'locked' },
        { key: 'largos', name: 'Largos', icon: Feather, status: 'locked' },
        { key: 'ejercicio-largos', name: 'Ejercicio Largos', icon: PenSquare, status: 'locked' },
        { key: 'irregulares', name: 'Irregulares', icon: Bot, status: 'locked' },
        { key: 'ejercicio-irregulares', name: 'Ejercicio Irregulares', icon: PenSquare, status: 'locked' },
        { key: 'mixtos', name: 'Mixtos', icon: PenSquare, status: 'locked' },
        { key: 'sopa_letras', name: 'Sopa de Letras (Adjetivos)', icon: Gamepad2, status: 'locked' },
        { key: 'mixtos2', name: 'Mixtos 2', icon: PenSquare, status: 'locked' },
        { key: 'mixtos3', name: 'Mixtos 3', icon: PenSquare, status: 'locked' },
    ], []);

    useEffect(() => {
        if (isUserLoading || isProfileLoading) return;
        const newPath = initialLearningPath.map(item => ({...item}));
        
        if (isAdmin) {
            newPath.forEach(item => item.status = 'completed');
        } else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageKey];
            newPath.forEach(item => { if (savedStatuses[item.key]) item.status = savedStatuses[item.key]; });
        }
        
        setLearningPath(newPath);
        const firstActive = newPath.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || 'vocabulario');
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
            learningPath.forEach(item => { statusesToSave[item.key] = item.status; });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageKey}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: progressValue
            });
        }
         if (progressValue >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progressValue, isAdmin, studentDocRef, isProfileLoading, isUserLoading]);

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
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const topic = learningPath.find(t => t.key === key);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: 'Contenido Bloqueado' });
            return;
        }
        setSelectedTopic(key);
        const autoCompTopics = ['comparativos', 'superlativos', 'grammar-mixto', 'monosilabos', 'bisilabos', 'largos', 'irregulares'];
        if (autoCompTopics.includes(key)) {
          setTopicToComplete(key);
        }
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const newAnswers = [...vocabAnswers];
        newAnswers[index] = value;
        setVocabAnswers(newAnswers);
        const newValidation = [...validationStatus];
        newValidation[index] = 'unchecked';
        setValidationStatus(newValidation);
        setCanAdvance(false);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newValidation = vocabularyData.map((item, index) => {
            const userAnswer = vocabAnswers[index]?.trim().toLowerCase();
            const isCorrect = item.english.some(e => e.toLowerCase() === userAnswer);
            if (isCorrect) atLeastOneCorrect = true;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setValidationStatus(newValidation as any);
        if (atLeastOneCorrect) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvance(true);
        } else {
            toast({ variant: "destructive", title: "Sigue intentando", description: "Necesitas al menos una correcta para continuar." });
        }
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        
        switch (selectedTopic) {
            case 'vocabulario':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Vocabulario (Adjetivos)</CardTitle>
                            <CardDescription>Traduce los adjetivos al inglés. Al menos una correcta para avanzar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">Español</div>
                                <div className="font-black text-primary border-b pb-2 uppercase tracking-widest text-sm text-left">Inglés</div>
                                {vocabularyData.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="p-3 bg-muted/30 border rounded-lg flex items-center font-medium">{item.spanish}</div>
                                        <div className="p-3 bg-muted/30 border rounded-lg flex items-center">
                                            <Input
                                                value={vocabAnswers[index] || ''}
                                                onChange={e => handleVocabInputChange(index, e.target.value)}
                                                className={cn("h-11 font-mono uppercase", 
                                                    validationStatus[index] === 'correct' ? 'border-green-500 bg-green-50 focus-visible:ring-green-500' : 
                                                    validationStatus[index] === 'incorrect' ? 'border-destructive focus-visible:ring-destructive' : ''
                                                )}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-6">
                            <Button onClick={handleCheckVocab} variant="secondary">Verificar</Button>
                            <Button onClick={() => setTopicToComplete('vocabulario')} disabled={!canAdvance && !isAdmin}>Avanzar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        </CardFooter>
                    </Card>
                );

            case 'comparativos':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader><CardTitle>COMPARATIVOS (ADJETIVO + ER)</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-lg">
                            <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                                <h3 className="font-bold text-primary">USO:</h3>
                                <p className="mt-1">Se usa para comparar diferencias entre dos sustantivos.</p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-xl font-bold">ESTRUCTURA:</h3>
                                <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-base border-2 border-dashed">
                                    SUSTANTIVO + VERBO + ADJETIVO COMPARATIVO + THAN + SUSTANTIVO
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => setTopicToComplete('comparativos')}>Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ejercicio-comparativo': return <ComparativeExercise onComplete={() => setTopicToComplete('ejercicio-comparativo')} />;
            case 'superlativos':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader><CardTitle>SUPERLATIVOS (ADJECTIVE + EST)</CardTitle></CardHeader>
                        <CardContent className="space-y-6 text-lg">
                            <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                                <h3 className="font-bold text-primary">USO:</h3>
                                <p className="mt-1">Describe un sustantivo en el extremo superior o inferior (el más / el menos).</p>
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-xl font-bold">ESTRUCTURA:</h3>
                                <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-base border-2 border-dashed">
                                    SUSTANTIVO + VERBO + THE + ADJETIVO SUPERLATIVO + SUSTANTIVO/COMPLEMENTO
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t"><Button onClick={() => setTopicToComplete('superlativos')}>Entendido</Button></CardFooter>
                    </Card>
                );
            case 'ejercicio-superlativo': return <SuperlativeExercise onComplete={() => setTopicToComplete('ejercicio-superlativo')} />;
            case 'grammar-mixto':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                        <CardHeader><CardTitle>REGLAS DE ORTOGRAFÍA</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <ol className="list-decimal list-inside space-y-4 text-base">
                                <li className="p-3 bg-muted/50 rounded-lg"><strong>Terminados en -E:</strong> Añaden -R / -ST. (Nice - Nicer - Nicest)</li>
                                <li className="p-3 bg-muted/50 rounded-lg"><strong>Consonante + Y:</strong> Cambian Y por I. (Easy - Easier - Easiest)</li>
                                <li className="p-3 bg-muted/50 rounded-lg"><strong>Consonante simple (CVC):</strong> Doblan la consonante. (Big - Bigger - Biggest)</li>
                            </ol>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6"><Button onClick={() => setTopicToComplete('grammar-mixto')}>Continuar</Button></CardFooter>
                    </Card>
                );
            case 'monosilabos':
                return <SyllableExercise data={monosyllabicData} title="Monosilabos" description="Completa con las formas correctas." onComplete={() => setTopicToComplete('monosilabos')} columnHeaders={{adjective: 'ADJETIVO', comparative: 'COMPARATIVO (+ER)', superlative: 'SUPERLATIVO (+EST)'}} />;
            case 'ejercicio-monosilabos': return <MonosyllabicExercise onComplete={() => setTopicToComplete('ejercicio-monosilabos')} />;
            case 'bisilabos':
                return <SyllableExercise data={bisyllabicData} title="Bisílabos" description="Completa la tabla." onComplete={() => setTopicToComplete('bisilabos')} columnHeaders={{ adjective: "ADJETIVO", comparative: "COMPARATIVO", superlative: "SUPERLATIVO" }} />;
            case 'ejercicio-bisilabos': return <BisyllabicExercise onComplete={() => setTopicToComplete('ejercicio-bisilabos')} />;
            case 'largos':
                return <SyllableExercise data={longAdjectivesData} title="Adjetivos Largos" description="Usa 'more' y 'the most'." onComplete={() => setTopicToComplete('largos')} columnHeaders={{ adjective: 'ADJETIVO', comparative: 'MORE + ADJ', superlative: 'THE MOST + ADJ' }} />;
            case 'ejercicio-largos': return <LongAdjectivesExercise onComplete={() => setTopicToComplete('ejercicio-largos')} />;
            case 'irregulares':
                return <SyllableExercise data={irregularAdjectivesData} title="Adjetivos Irregulares" description="Formas que cambian completamente." onComplete={() => setTopicToComplete('irregulares')} columnHeaders={{ adjective: 'ADJETIVO', comparative: 'COMPARATIVO', superlative: 'SUPERLATIVO' }} />;
            case 'ejercicio-irregulares': return <IrregularAdjectivesExercise onComplete={() => setTopicToComplete('ejercicio-irregulares')} />;
            case 'mixtos': return <MixedComparativeSuperlativeExercise onComplete={() => setTopicToComplete('mixtos')} />;
            case 'sopa_letras': return <WordSearchGame onComplete={() => setTopicToComplete('sopa_letras')} />;
            case 'mixtos2': return <HolidayTextExercise onComplete={() => setTopicToComplete('mixtos2')} />;
            case 'mixtos3': return <MixedExercise3 onComplete={() => setTopicToComplete('mixtos3')} />;
            default:
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                        <CardHeader><CardTitle>{topic?.name || 'Cargando...'}</CardTitle></CardHeader>
                        <CardContent className="flex items-center justify-center h-48"><Loader2 className="h-10 w-10 animate-spin text-primary" /></CardContent>
                    </Card>
                );
        }
    };

    if (isUserLoading || isProfileLoading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-white/80">Volver al curso A1</Link>
                        <h1 className="text-4xl font-black text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 13: Comparativos y Superlativos</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9 text-left">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
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
                                                    <div className="flex items-center gap-3">
                                                        <item.icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : (item.status === 'locked' ? 'text-yellow-500' : 'text-primary'))} />
                                                        <span>{item.name}</span>
                                                    </div>
                                                    {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500 ml-auto" />}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                     <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                            <span>Progreso de Clase</span><span className="font-bold text-foreground">{progressValue}%</span>
                                        </div>
                                        <Progress value={progressValue} className="h-2" />
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
