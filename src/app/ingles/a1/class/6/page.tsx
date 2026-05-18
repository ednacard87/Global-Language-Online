'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Gamepad2, BookText, Loader2, ChevronDown, Check, X } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { LargeTextTranslation } from '@/components/dashboard/large-text-translation';
import { AdjectivesMemoryGame } from '@/components/kids/exercises/adjectives-memory-game';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_unit_2_class_6_v12_final';
const mainProgressKey = 'progress_a1_eng_unit_2_class_6';

const vocabularyData = [
    { spanish: 'SERIO', english: ['serious'] },
    { spanish: 'ALEGRE', english: ['cheerful'] },
    { spanish: 'OCUPADO', english: ['busy'] },
    { spanish: 'RARO, EXTRAÑO', english: ['strange'] },
    { spanish: 'CURIOSO', english: ['curious'] },
    { spanish: 'AMIGABLE', english: ['friendly'] },
    { spanish: 'DULCE', english: ['sweet'] },
    { spanish: 'INTELIGENTE', english: ['intelligent'] },
    { spanish: 'LIBRE', english: ['free'] },
    { spanish: 'EGOÍSTA', english: ['selfish'] },
    { spanish: 'ENVIDIOSO', english: ['envious'] },
    { spanish: 'FELIZ', english: ['happy'] },
    { spanish: 'AMABLE', english: ['kind'] },
    { spanish: 'RAPIDO', english: ['fast'] },
    { spanish: 'ABURRIDOR', english: ['boring'] },
    { spanish: 'GENEROSO', english: ['generous'] },
    { spanish: 'MINUSCULO', english: ['tiny'] },
    { spanish: 'HERMOSO', english: ['beautiful'] },
    { spanish: 'LENTO', english: ['slow'] },
    { spanish: 'ENORME', english: ['huge'] },
    { spanish: 'ORDENADO', english: ['tidy'] },
    { spanish: 'TERCO', english: ['stubborn'] },
    { spanish: 'NERVIOSO', english: ['nervous'] },
    { spanish: 'DESORDENADO', english: ['messy', 'untidy'] },
    { spanish: 'TRABAJADOR', english: ['hardworking'] },
    { spanish: 'PESIMISTA', english: ['pessimistic'] },
    { spanish: 'OPTIMISTA', english: ['optimistic'] },
    { spanish: 'FLEXIBLE', english: ['flexible'] },
];

const possessivesTable = [
    { adj: 'MY', adjEs: 'MI-MIS', pro: 'MINE', proEs: 'MIO (MIOS-MIA- MIAS)' },
    { adj: 'YOUR', adjEs: 'TU-TUS', pro: 'YOURS', proEs: 'TUYO (OS-A-AS)' },
    { adj: 'HIS', adjEs: 'SU-SUS DE EL', pro: 'HIS', proEs: '(SUYO/A/OS/AS DE EL)' },
    { adj: 'HER', adjEs: 'SU-SUS DE ELLA', pro: 'HERS', proEs: '(SUYO/A/OS/AS DE ELLA)' },
    { adj: 'ITS', adjEs: 'SU-SUS DE ESO', pro: 'ITS', proEs: '(SUYO/A/OS/AS DE ESO)' },
    { adj: 'OUR', adjEs: 'NUESTRO/A/OS/AS', pro: 'OURS', proEs: '( NUESTRO/A/OS/AS)' },
    { adj: 'THEIR', adjEs: 'SU- SUS DE ELLOS', pro: 'THEIRS', proEs: '( SUYO/A/OS/AS DE ELLOS)' },
];

const LinesWritingExercise = ({ 
    title, 
    description, 
    lineCount = 16,
    onComplete, 
    studentDocRef, 
    initialData,
    initialGrades,
    savePath,
    savePathGrades,
    isAdmin = false,
    hasTitleLine = true
}: { 
    title: string, 
    description: string, 
    lineCount?: number,
    onComplete: () => void,
    studentDocRef: any,
    initialData: string[],
    initialGrades: Record<number, 'correct' | 'incorrect' | null>,
    savePath: string,
    savePathGrades: string,
    isAdmin?: boolean,
    hasTitleLine?: boolean
}) => {
    const totalLines = hasTitleLine ? lineCount + 1 : lineCount;
    const [lines, setLines] = useState<string[]>(Array(totalLines).fill(''));
    const [grades, setGrades] = useState<Record<number, 'correct' | 'incorrect' | null>>(initialGrades || {});
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current && initialData && Array.isArray(initialData)) {
            const newLines = [...Array(totalLines).fill('')];
            initialData.forEach((val, i) => {
                if (i < totalLines) newLines[i] = val || '';
            });
            setLines(newLines);
            if (initialData.length > 0) {
                initializedRef.current = true;
            }
        }
    }, [initialData, totalLines]);

    useEffect(() => {
        if (initialGrades) {
            setGrades(initialGrades);
        }
    }, [initialGrades]);

    const handleLineChange = (index: number, value: string) => {
        const newLines = [...lines];
        newLines[index] = value;
        setLines(newLines);
        
        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [savePath]: newLines
            });
        }
    };

    const handleToggleGrade = (index: number, type: 'correct' | 'incorrect') => {
        if (!isAdmin) return;

        const newGrades = { ...grades };
        if (newGrades[index] === type) {
            newGrades[index] = null;
        } else {
            newGrades[index] = type;
        }
        setGrades(newGrades);

        if (studentDocRef) {
            updateDocumentNonBlocking(studentDocRef, {
                [savePathGrades]: newGrades
            });
        }
    };

    const renderRenglon = (line: string, idx: number, isTitle: boolean = false) => {
        const status = grades[idx];
        const borderClass = status === 'correct' ? 'border-green-500 ring-1 ring-green-500' : status === 'incorrect' ? 'border-red-500 ring-1 ring-red-500' : '';

        return (
            <div key={idx} className="flex items-center gap-3">
                <span className={cn("font-bold w-8 text-right shrink-0", isTitle ? "text-brand-purple w-20" : "text-primary")}>
                    {isTitle ? "TITULO:" : `${idx}.`}
                </span>
                <Input 
                    value={line} 
                    onChange={(e) => handleLineChange(idx, e.target.value)} 
                    placeholder={isTitle ? "Escribe el título aquí..." : "..."}
                    className={cn(
                        "flex-1 bg-muted/30 focus:bg-background transition-all h-11 border-primary/20",
                        isTitle && "bg-primary/5 h-12 font-bold",
                        borderClass
                    )}
                    autoComplete="off"
                />
                
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={() => handleToggleGrade(idx, 'correct')}
                        className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            status === 'correct' 
                                ? "bg-green-500 border-green-600 text-white" 
                                : "bg-gray-200 border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-transparent",
                            !isAdmin && "cursor-default pointer-events-none"
                        )}
                    >
                        <Check className="h-3 w-3" />
                    </button>
                    <button
                        onClick={() => handleToggleGrade(idx, 'incorrect')}
                        className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                            status === 'incorrect' 
                                ? "bg-red-500 border-red-600 text-white" 
                                : "bg-gray-200 border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-transparent",
                            !isAdmin && "cursor-default pointer-events-none"
                        )}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {hasTitleLine && renderRenglon(lines[0], 0, true)}
                    {lines.slice(hasTitleLine ? 1 : 0).map((line, idx) => {
                        const actualIndex = hasTitleLine ? idx + 1 : idx;
                        return renderRenglon(line, actualIndex);
                    })}
                </div>
            </CardContent>
            <CardFooter className="pt-6 border-t mt-4">
                <Button onClick={onComplete} size="lg" className="w-full sm:w-auto min-w-[200px]">Avanzar</Button>
            </CardFooter>
        </Card>
    );
};

export default function EngA1Class6Page() {
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

    // State for vocabulary exercise
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Adjectives)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'note', name: 'Nota', icon: Info, status: 'locked' },
        { key: 'ex4', name: 'Ejercicio 4', icon: PenSquare, status: 'locked' },
        { key: 'text', name: 'Dictation 1', icon: BookOpen, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Ejercicio 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Ejercicio 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Ejercicio 7', icon: PenSquare, status: 'locked' },
        { key: 'ex8', name: 'Ejercicio 8', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        const newPath = initialLearningPath.map(topic => ({
            ...topic,
            status: isAdmin ? 'completed' : topic.status,
        }));
        
        if (studentProfile?.lessonProgress?.[progressStorageVersion] && !isAdmin) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            newPath.forEach(item => {
                if (savedStatuses[item.key]) item.status = savedStatuses[item.key];
            });
        }
        
        setLearningPath(newPath);

        const firstActive = newPath.find(p => p.status === 'active');
        if (firstActive) {
            setSelectedTopic(firstActive.key);
        } else if (newPath.length > 0) {
            setSelectedTopic(newPath[0].key);
        }
        
        setVocabAnswers(Array(vocabularyData.length).fill(''));
        setVocabValidation(Array(vocabularyData.length).fill('unchecked'));
        setCanAdvanceVocab(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);
    
    const progress = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedTopics = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedTopics / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        if (!isAdmin && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, any> = {};
            learningPath.forEach(item => {
                statusesToSave[item.key] = item.status;
            });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: Math.round(progress)
            });
        }
        if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progress, studentDocRef, isProfileLoading, isUserLoading]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

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
                    toast({ title: "¡Siguiente tema desbloqueado!" });
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado", description: "Debes completar los temas anteriores." });
            return;
        }
        setSelectedTopic(topicKey);

        const autoViewTopics = ['grammar', 'note'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const newAnswers = [...vocabAnswers];
        newAnswers[index] = value;
        setVocabAnswers(newAnswers);

        const newValidation = [...vocabValidation];
        if (newValidation[index] !== 'unchecked') {
            newValidation[index] = 'unchecked';
            setVocabValidation(newValidation);
        }
        setCanAdvanceVocab(false);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newValidation = vocabularyData.map((item, index) => {
            const userAnswer = vocabAnswers[index]?.trim().toLowerCase();
            const isCorrect = item.english.some(e => e.toLowerCase() === userAnswer);
            if (isCorrect) {
                atLeastOneCorrect = true;
            }
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(newValidation as ('correct' | 'incorrect' | 'unchecked')[]);

        if (atLeastOneCorrect) {
            toast({ title: "¡Bien hecho!", description: "Has acertado al menos una. ¡Ya puedes avanzar!" });
            setCanAdvanceVocab(true);
        } else {
            toast({ 
                variant: "destructive", 
                title: "Sigue intentando", 
                description: "Revisa tus respuestas. ¡Necesitas al menos una correcta para continuar!" 
            });
            setCanAdvanceVocab(false);
        }
    };

    const getVocabInputClass = (index: number) => {
        const status = vocabValidation[index];
        if (status === 'correct') return 'border-green-500 focus-visible:ring-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive focus-visible:ring-destructive bg-destructive/5';
        return '';
    };
    
    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Basic Adjectives)</CardTitle>
                            <CardDescription>Traduce los adjetivos del español al inglés.</CardDescription>
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
                                                value={vocabAnswers[index] || ''}
                                                onChange={e => handleVocabInputChange(index, e.target.value)}
                                                className={cn(getVocabInputClass(index))}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-6">
                            <Button onClick={handleCheckVocab}>Verificar Vocabulario</Button>
                            <Button 
                                onClick={() => handleTopicComplete('vocabulary')} 
                                disabled={!canAdvanceVocab && !isAdmin}
                                className={cn(!canAdvanceVocab && !isAdmin && "opacity-50")}
                            >
                                Avanzar
                            </Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Gramática: Adjetivos y Pronombres Posesivos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="overflow-x-auto">
                                <Table className="border text-base">
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead className="font-bold text-foreground">ADJETIVOS POSESIVOS</TableHead>
                                            <TableHead className="font-bold text-foreground">ESPAÑOL</TableHead>
                                            <TableHead className="font-bold text-foreground">PRONOMBRES POSESIVOS</TableHead>
                                            <TableHead className="font-bold text-foreground">ESPAÑOL</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {possessivesTable.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-semibold text-primary">{row.adj}</TableCell>
                                                <TableCell>{row.adjEs}</TableCell>
                                                <TableCell className="font-semibold text-brand-purple">{row.pro}</TableCell>
                                                <TableCell>{row.proEs}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('grammar')}>Entendido y Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'note':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Nota Importante</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <div className="bg-primary/5 p-6 rounded-xl border-l-4 border-primary">
                                    <h3 className="text-xl font-bold mb-2">ADJETIVOS POSESIVOS</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Se utilizan para indicar quién tiene la propiedad sobre una(s) cosa(s). 
                                        <strong> La cantidad de objetos no se refleja en la forma del adjetivo posesivo</strong> (siempre es la misma palabra).
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <Card className="bg-muted/50 border-dashed border-2">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg">Posición en la frase</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="font-mono text-sm uppercase">Before Noun : Antes del sustantivo</p>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-muted/50 border-dashed border-2">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg">Ejemplos</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <p className="text-sm"><strong>IT’S MY CAR</strong><br/><span className="text-muted-foreground">(ESTE ES MI CARRO)</span></p>
                                            <p className="text-sm"><strong>THESE ARE MY CARS</strong><br/><span className="text-muted-foreground">(ESTOS SON MIS CARROS)</span></p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <div className="bg-brand-purple/5 p-6 rounded-xl border-l-4 border-brand-purple">
                                <h3 className="text-xl font-bold mb-2">PRONOMBRES POSESIVOS</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Siempre en una frase están: <strong>DESPUÉS del sustantivo</strong>.
                                </p>
                                <div className="mt-4 p-4 bg-muted rounded-lg font-mono text-base border">
                                    <p className="text-foreground">Ejemplo: esa casa es mia</p>
                                    <p className="text-primary font-bold">that house is <span className="underline">mine</span></p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center border-t pt-6">
                            <Button onClick={() => handleTopicComplete('note')}>Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1':
                return (
                    <SimpleTranslationExercise
                        exerciseKey="c6_ex1"
                        onComplete={() => handleTopicComplete('ex1')}
                        course="a1"
                        title="Ejercicio 1"
                    />
                );
            case 'ex2':
                return (
                    <SimpleTranslationExercise
                        exerciseKey="c6_ex2"
                        onComplete={() => handleTopicComplete('ex2')}
                        course="a1"
                        title="Ejercicio 2"
                    />
                );
            case 'ex3':
                return (
                    <SimpleTranslationExercise
                        exerciseKey="c6_ex3"
                        onComplete={() => handleTopicComplete('ex3')}
                        course="a1"
                        title="Ejercicio 3"
                    />
                );
            case 'ex4':
                return (
                    <SimpleTranslationExercise
                        exerciseKey="c6_ex4"
                        onComplete={() => handleTopicComplete('ex4')}
                        course="a1"
                        title="Ejercicio 4"
                    />
                );
            case 'ex5':
                return (
                    <SimpleTranslationExercise
                        exerciseKey="c6_ex5"
                        onComplete={() => handleTopicComplete('ex5')}
                        course="a1"
                        title="Ejercicio 5"
                    />
                );
            case 'text':
                return (
                    <LinesWritingExercise 
                        key="dictation1-c6"
                        title="DICTATION 1" 
                        description="Escucha atentamente a tu profesor y escribe las frases en los renglones correspondientes." 
                        onComplete={() => handleTopicComplete('text')} 
                        studentDocRef={studentDocRef}
                        lineCount={16}
                        hasTitleLine={true}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1 || []}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1Grades || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation1`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.dictation1Grades`}
                        isAdmin={isAdmin}
                    />
                );
            case 'vocab_game':
                return (
                    <AdjectivesMemoryGame 
                        data={vocabularyData} 
                        onComplete={() => handleTopicComplete('vocab_game')} 
                    />
                );
            case 'ex6':
                return (
                    <SimpleTranslationExercise
                        exerciseKey="c6_ex6"
                        onComplete={() => handleTopicComplete('ex6')}
                        course="a1"
                        title="Ejercicio 6"
                    />
                );
            case 'ex7':
                return (
                    <SimpleTranslationExercise
                        exerciseKey="c6_ex7"
                        onComplete={() => handleTopicComplete('ex7')}
                        course="a1"
                        title="Ejercicio 7"
                    />
                );
            case 'ex8':
                return (
                    <LinesWritingExercise 
                        key="ex8-creative"
                        title="Ejercicio 8" 
                        description="INVENTA TRES FRASES CON ADJETIVOS POSESIVOS Y TRES FRASES CON PRONOMBRES POSESIVOS:" 
                        onComplete={() => handleTopicComplete('ex8')} 
                        studentDocRef={studentDocRef}
                        lineCount={6}
                        hasTitleLine={false}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingEx8 || []}
                        initialGrades={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingEx8Grades || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.writingEx8`}
                        savePathGrades={`lessonProgress.${progressStorageVersion}.writingEx8Grades`}
                        isAdmin={isAdmin}
                    />
                );
            default:
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                        <CardHeader>
                            <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Contenido para este tema estará disponible pronto.</p>
                        </CardContent>
                    </Card>
                );
        }
    };

    if (isUserLoading || isProfileLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-white/80">Volver al curso A1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 6</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => {
                                                const Icon = item.status === 'completed' ? CheckCircle : (item.status === 'active' ? item.icon : Lock);
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isActive = item.status === 'active';
                                                
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold',
                                                            isActive && !isAdmin && "animate-pulse-glow"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : (item.status === 'locked' ? 'text-yellow-500' : ''))} />
                                                            <span>{item.name}</span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
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
