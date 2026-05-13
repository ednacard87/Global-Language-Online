'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Mic, Loader2, RefreshCw, Flame, Trophy, Gamepad2, ChevronDown, Pencil, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';

type TopicStatus = 'completed' | 'active' | 'locked';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: TopicStatus;
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

// Claves únicas para esta lección
const progressStorageVersion = 'progress_a1_eng_u2_c8_v3';
const mainProgressKey = 'progress_a1_eng_unit_1_class_8'; // Mantiene compatibilidad con el Maze

const vocabularyData = [
    { spanish: 'ESTE/A', english: ['THIS'] },
    { spanish: 'ESTOS/AS', english: ['THESE'] },
    { spanish: 'ESE/A', english: ['THAT'] },
    { spanish: 'ESOS/AS', english: ['THOSE'] },
    { spanish: 'PERO', english: ['BUT'] },
    { spanish: 'MIENTRAS', english: ['WHILE'] },
    { spanish: 'ENTONCES', english: ['SO'] },
    { spanish: 'LUEGO', english: ['THEN'] },
    { spanish: 'ALREDEDOR', english: ['AROUND'] },
    { spanish: 'MEDIA NOCHE', english: ['MIDNIGHT'] },
    { spanish: 'MEDIO DIA', english: ['MIDDAY', 'NOON'] },
    { spanish: 'DESDE', english: ['FROM'] },
    { spanish: 'TAMBIÉN', english: ['ALSO', 'TOO'] },
    { spanish: 'ACERCA DE', english: ['ABOUT'] },
    { spanish: 'CADA', english: ['EVERY', 'EACH'] },
    { spanish: 'CASI', english: ['ALMOST'] },
];

const exercise5Data: CompletionPrompt[] = [
    { parts: ["WHERE IS ", " WALLET?"], answers: ["THE"] },
    { parts: ["THEY LOVE ", " LANGUAGES"], answers: [""] },
    { parts: ["THIS IS ", " SARA'S PRESENT."], answers: [""] },
    { parts: ["THIS IS ", " JOHN'S HOUSE."], answers: [""] },
    { parts: ["THESE ARE ", " KEYS HE GAVE ME."], answers: ["THE"] },
    { parts: ["", " STRAWBERRIES ARE DELICIOUS."], answers: [""] },
    { parts: ["HE LIKES ", " SUN GLASSES."], answers: [""] },
    { parts: ["WHERE ARE ", " SHOES?"], answers: ["THE"] },
    { parts: ["I DO NOT LIKE ", " SUNNY DAYS."], answers: [""] },
    { parts: ["HE ISN'T ", " ANTHONY'S HOUSE."], answers: [""] },
    { parts: ["", " DOOR OF MY HOUSE."], answers: ["THE"] },
    { parts: ["SHE WORKS WITH ", " ENGINEER."], answers: [""] },
];

// Componente para Dictados con guardado automático
const LinesWritingExercise = ({ 
    title, 
    description, 
    lineCount = 12,
    onComplete, 
    studentDocRef, 
    initialData, 
    savePath 
}: { 
    title: string, 
    description: string, 
    lineCount?: number,
    onComplete: () => void,
    studentDocRef: any,
    initialData: string[],
    savePath: string
}) => {
    const [lines, setLines] = useState<string[]>(Array(lineCount).fill(''));

    useEffect(() => {
        if (initialData && Array.isArray(initialData)) {
            const newLines = [...Array(lineCount).fill('')];
            initialData.forEach((val, i) => {
                if (i < lineCount) newLines[i] = val || '';
            });
            setLines(newLines);
        }
    }, [initialData, lineCount]);

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

    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="text-lg font-semibold text-primary">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-3 group">
                        <span className="font-bold text-primary w-8 text-right shrink-0">{idx + 1}.</span>
                        <Input 
                            value={line} 
                            onChange={(e) => handleLineChange(idx, e.target.value)} 
                            placeholder={`Escribe la frase ${idx + 1}...`}
                            className="flex-1 bg-muted/30 focus:bg-background transition-colors h-11 border-primary/20"
                            autoComplete="off"
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter className="pt-6 border-t mt-4">
                <Button onClick={onComplete} className="w-full sm:w-auto min-w-[200px]">Completar Tarea</Button>
            </CardFooter>
        </Card>
    );
};

export default function EngA1Class8Page() {
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

    // Estado para el vocabulario interactivo
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyData.length).fill('unchecked'));

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Words)', icon: BookOpen, status: 'active' },
        { key: 'dictation1', name: 'Dictation 1', icon: Mic, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'dictation2', name: 'Dictation 2', icon: Mic, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'writing1', name: 'Writing 1', icon: Pencil, status: 'locked' },
        { key: 'writing2', name: 'Writing 2', icon: Pencil, status: 'locked' },
    ], []);
    
    // Cargar progreso desde Firestore
    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        
        const path = initialLearningPath.map(topic => ({ ...topic }));
        let savedSelectedTopic = '';

        if (isAdmin) {
            path.forEach(item => { item.status = 'completed'; });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedData = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedData[item.key]) item.status = savedData[item.key];
            });
            savedSelectedTopic = savedData.lastSelectedTopic || '';
        }
        
        setLearningPath(path);
        if (!initialLoadComplete) {
            const firstActive = path.find(p => p.status === 'active');
            setSelectedTopic(savedSelectedTopic || firstActive?.key || 'vocabulary');
            setInitialLoadComplete(true);
        }
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedCount = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedCount / learningPath.length) * 100);
    }, [learningPath]);

    // Guardar progreso en Firestore
    useEffect(() => {
        if (!initialLoadComplete || isUserLoading || isProfileLoading || learningPath.length === 0 || isAdmin || !studentDocRef) return;

        const statusesToSave: Record<string, any> = { lastSelectedTopic: selectedTopic };
        learningPath.forEach(item => { statusesToSave[item.key] = item.status; });

        updateDocumentNonBlocking(studentDocRef, { 
            [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
            [`progress.${mainProgressKey}`]: progressValue
        });
        
        if (progressValue >= 100) {
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progressValue, selectedTopic, isAdmin, studentDocRef, isUserLoading, isProfileLoading, initialLoadComplete]);

    const handleTopicComplete = useCallback((completedKey: string) => {
        setTopicToComplete(completedKey);
    }, []);

    // Lógica de desbloqueo secuencial
    useEffect(() => {
        if (!topicToComplete) return;
    
        setLearningPath(currentPath => {
            const newPath = currentPath.map(item => ({ ...item }));
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
    };

    // Lógica del vocabulario inicial
    const handleVocabInputChange = (index: number, value: string) => {
        const newAnswers = [...vocabAnswers];
        newAnswers[index] = value;
        setVocabAnswers(newAnswers);
        const newValidation = [...vocabValidation];
        newValidation[index] = 'unchecked';
        setVocabValidation(newValidation);
    };

    const handleCheckVocab = () => {
        let allCorrect = true;
        const newValidation = vocabularyData.map((item, index) => {
            const userAnswer = vocabAnswers[index]?.trim().toLowerCase();
            const isCorrect = item.english.some(e => e.toLowerCase() === userAnswer);
            if (!isCorrect) allCorrect = false;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(newValidation);

        if (allCorrect) {
            toast({ title: "¡Excelente!", description: "Has aprendido el vocabulario base." });
            handleTopicComplete('vocabulary');
        } else {
            toast({ variant: "destructive", title: "Revisa tus respuestas", description: "Completa todas las traducciones para continuar." });
        }
    };

    const getVocabInputClass = (index: number) => {
        const status = vocabValidation[index];
        if (status === 'correct') return 'border-green-500 bg-green-50 dark:bg-green-900/10';
        if (status === 'incorrect') return 'border-destructive bg-destructive/5';
        return '';
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Basic Words)</CardTitle>
                            <CardDescription>Traduce estas palabras esenciales al inglés para comenzar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg">Español</div>
                                <div className="font-bold p-3 bg-muted rounded-lg">Inglés</div>
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
                        <CardFooter>
                            <Button onClick={handleCheckVocab}>Verificar y Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'dictation1':
                return (
                    <LinesWritingExercise 
                        title="Dictation 1" 
                        description="Escribe las 12 frases dictadas por tu profesor." 
                        onComplete={() => handleTopicComplete('dictation1')} 
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1 || []}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation1`}
                    />
                );
            case 'dictation2':
                return (
                    <LinesWritingExercise 
                        title="Dictation 2" 
                        description="Escribe las otras 12 frases dictadas por tu profesor." 
                        onComplete={() => handleTopicComplete('dictation2')} 
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2 || []}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation2`}
                    />
                );
            case 'ex1':
                return <SimpleTranslationExercise exerciseKey="c8_ex1" course="a1" title="Exercise 1" onComplete={() => handleTopicComplete('ex1')} vocabulary={{ "por el contrario": "on the contrary", "por otro lado": "on the other hand" }} />;
            case 'ex2':
                return <SimpleTranslationExercise exerciseKey="c8_ex2" course="a1" title="Exercise 2" onComplete={() => handleTopicComplete('ex2')} vocabulary={{ "Adjetivos": "my, your, his, her, its, our, their", "Pronombres": "mine, yours, his, hers, its, ours, theirs" }} />;
            case 'ex3':
                return <SimpleTranslationExercise exerciseKey="c8_ex3" course="a1" title="Exercise 3" onComplete={() => handleTopicComplete('ex3')} />;
            case 'ex4':
                return <SimpleTranslationExercise exerciseKey="c8_ex4" course="a1" title="Exercise 4" onComplete={() => handleTopicComplete('ex4')} />;
            case 'ex5':
                return <SentenceCompletionExercise title="Exercise 5" description="Completa con 'THE' donde sea necesario." data={exercise5Data} onComplete={() => handleTopicComplete('ex5')} />;
            case 'vocab_game':
                return <VocabularyMatchingGame data={vocabularyData} onComplete={() => handleTopicComplete('vocab_game')} title="Juego de Asociación" />;
            case 'writing1':
                return (
                    <CreativeWritingExercise 
                        title="Writing 1" 
                        description="WRITE SOMETHING ABOUT YOUR SCHOOL/ UNIVERSITY/ WORK."
                        prompts={[{ id: 'writing1', question: '', placeholder: 'Escribe tu texto aquí...' }]}
                        onComplete={() => handleTopicComplete('writing1')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingData1 || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.writingData1`}
                    />
                );
            case 'writing2':
                 return (
                    <LinesWritingExercise 
                        title="Writing 2" 
                        description="ESCRIBE 3 FRASES CON ADJETIVOS POSESIVOS Y 3 CON PRONOMBRES POSESIVOS:" 
                        onComplete={() => handleTopicComplete('writing2')} 
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingData2 || []}
                        savePath={`lessonProgress.${progressStorageVersion}.writingData2`}
                        lineCount={6}
                    />
                );
            default:
                return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" /></div>;
        }
    };

    if (isUserLoading || isProfileLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-muted-foreground">Volver al curso A1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 8</h1>
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
                                                const Icon = item.status === 'completed' ? CheckCircle : item.icon;
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
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{progressValue}%</span></div>
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