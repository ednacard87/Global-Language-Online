'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Mic, Loader2, RefreshCw, Flame, Trophy, Gamepad2, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';
import { AdjectivesMemoryGame } from '@/components/kids/exercises/adjectives-memory-game';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SentenceCompletionExercise, type CompletionPrompt } from '@/components/kids/exercises/sentence-completion-exercise';

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

const progressStorageVersion = 'progress_a1_eng_unit_2_class_8_v6_the_exercise';
const mainProgressKey = 'progress_a1_eng_unit_2_class_8';

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

const DictationExercise = ({ 
    title, 
    description, 
    onComplete, 
    studentDocRef, 
    initialData, 
    savePath 
}: { 
    title: string, 
    description: string, 
    onComplete: () => void,
    studentDocRef: any,
    initialData: string[],
    savePath: string
}) => {
    const [lines, setLines] = useState<string[]>(Array(12).fill(''));

    useEffect(() => {
        if (initialData && Array.isArray(initialData)) {
            const newLines = [...Array(12).fill('')];
            initialData.forEach((val, i) => {
                if (i < 12) newLines[i] = val || '';
            });
            setLines(newLines);
        }
    }, [initialData]);

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
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-3 group">
                        <span className="font-bold text-primary w-8 text-right shrink-0">{idx + 1}.</span>
                        <Input 
                            value={line} 
                            onChange={(e) => handleLineChange(idx, e.target.value)} 
                            placeholder={`Escribe aquí el renglón ${idx + 1}...`}
                            className="flex-1 bg-muted/30 focus:bg-background transition-colors h-11 border-primary/20"
                            autoComplete="off"
                        />
                    </div>
                ))}
            </CardContent>
            <CardFooter className="pt-6 border-t mt-4">
                <Button onClick={onComplete} className="w-full sm:w-auto min-w-[200px]">Marcar como Completado</Button>
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

    // State for vocabulary exercise
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(vocabularyData.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(vocabularyData.length).fill('unchecked'));
    const [canAdvanceVocab, setCanAdvanceVocab] = useState(false);

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
        { key: 'writing1', name: 'Writing 1', icon: PenSquare, status: 'locked' },
        { key: 'writing2', name: 'Writing 2', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        const newPath = initialLearningPath.map(topic => ({
            ...topic,
            status: isAdmin ? 'completed' : topic.status,
            subItems: topic.subItems ? topic.subItems.map(sub => ({ ...sub })) : undefined,
        }));
        
        let savedSelectedTopic = '';

        if (studentProfile?.lessonProgress?.[progressStorageVersion] && !isAdmin) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            newPath.forEach(item => {
                if (savedStatuses[item.key]) item.status = savedStatuses[item.key];
            });
            savedSelectedTopic = savedStatuses.lastSelectedTopic || '';
        }
        
        setLearningPath(newPath);

        if (!initialLoadComplete) {
            const firstActive = newPath.find(p => p.status === 'active');
            setSelectedTopic(savedSelectedTopic || firstActive?.key || newPath[0]?.key || '');
            setInitialLoadComplete(true);
        }
        
        setVocabAnswers(Array(vocabularyData.length).fill(''));
        setVocabValidation(Array(vocabularyData.length).fill('unchecked'));
        setCanAdvanceVocab(false);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading, initialLoadComplete]);
    
    const progressValue = useMemo(() => {
        if (learningPath.length === 0) return 0;
        const completedTopics = learningPath.filter(t => t.status === 'completed').length;
        return Math.round((completedTopics / learningPath.length) * 100);
    }, [learningPath]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading || !initialLoadComplete) return;
        if (!isAdmin && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, any> = {
                lastSelectedTopic: selectedTopic
            };
            learningPath.forEach(item => {
                statusesToSave[item.key] = item.status;
            });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageVersion}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: Math.round(progressValue)
            });
        }
        if (progressValue >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, isProfileLoading, isUserLoading, initialLoadComplete, selectedTopic]);

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
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const newAnswers = [...vocabAnswers];
        newAnswers[index] = value;
        setVocabAnswers(newAnswers);

        const newValidation = [...vocabValidation];
        if (newValidation[index] !== 'unchecked') {
            newValidation[index] = 'unchecked';
            setVocabValidation(newValidation as ('correct' | 'incorrect' | 'unchecked')[]);
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
                            <CardTitle>Vocabulary (Basic Words)</CardTitle>
                            <CardDescription>Escribe la traducción correcta en inglés para cada palabra.</CardDescription>
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
                                                placeholder="..."
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
            case 'dictation1':
                return (
                    <DictationExercise 
                        title="Dictation 1" 
                        description="Ejercicio de dictado: Escribe las frases dictadas por tu profesor." 
                        onComplete={() => handleTopicComplete('dictation1')} 
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation1 || []}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation1`}
                    />
                );
            case 'dictation2':
                return (
                    <DictationExercise 
                        title="Dictation 2" 
                        description="Ejercicio de dictado: Escribe las frases dictadas por tu profesor." 
                        onComplete={() => handleTopicComplete('dictation2')} 
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.dictation2 || []}
                        savePath={`lessonProgress.${progressStorageVersion}.dictation2`}
                    />
                );
            case 'ex1':
                const ex1Vocab = {
                    "por el contrario": "on the contrary",
                    "por otro lado": "on the other hand",
                    "estadio": "stadium",
                    "vegetariano": "vegetarian",
                    "parientes": "relatives",
                    "compañeros de trabajo": "coworkers"
                };
                return <SimpleTranslationExercise 
                    exerciseKey="c8_ex1" 
                    course="a1" 
                    title="Exercise 1" 
                    vocabulary={ex1Vocab}
                    onComplete={() => handleTopicComplete('ex1')} 
                />;
            case 'ex2':
                const ex2Vocab = {
                    "Adjetivos": "my, your, his, her, its, our, their",
                    "Pronombres": "mine, yours, his, hers, its, ours, theirs"
                };
                return <SimpleTranslationExercise 
                    exerciseKey="c8_ex2" 
                    course="a1" 
                    title="Exercise 2" 
                    vocabulary={ex2Vocab}
                    onComplete={() => handleTopicComplete('ex2')} 
                />;
            case 'ex3':
                return <SimpleTranslationExercise exerciseKey="c8_ex3" course="a1" title="Exercise 3" onComplete={() => handleTopicComplete('ex3')} />;
            case 'ex4':
                return <SimpleTranslationExercise exerciseKey="c8_ex4" course="a1" title="Exercise 4" onComplete={() => handleTopicComplete('ex4')} />;
            case 'ex5':
                return (
                    <SentenceCompletionExercise
                        title="Exercise 5"
                        description="Completa con la palabra 'THE' donde sea necesario. Si no se requiere nada, deja el espacio en blanco o escribe una 'x'."
                        data={exercise5Data}
                        onComplete={() => handleTopicComplete('ex5')}
                    />
                );
            case 'vocab_game':
                return <AdjectivesMemoryGame data={vocabularyData.map(v => ({ spanish: v.spanish, english: v.english }))} onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'writing1':
                return (
                    <CreativeWritingExercise 
                        title="Writing 1" 
                        description="Escribe un pequeño párrafo sobre tus rutinas diarias usando el vocabulario de frecuencia (Always, Often, Sometimes, Never)."
                        prompts={[{ id: 'writing1', question: 'Describe your daily routine (6-8 sentences):', placeholder: 'I always wake up at...' }]}
                        onComplete={() => handleTopicComplete('writing1')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingData1 || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.writingData1`}
                    />
                );
            case 'writing2':
                return (
                    <CreativeWritingExercise 
                        title="Writing 2" 
                        description="Imagina que estás planeando un viaje. Escribe sobre lo que tal vez (maybe/perhaps) harás."
                        prompts={[{ id: 'writing2', question: 'Describe your future plans or dreams:', placeholder: 'Maybe I will travel to...' }]}
                        onComplete={() => handleTopicComplete('writing2')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writingData2 || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.writingData2`}
                    />
                );
            default:
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                        <CardHeader><CardTitle>{topic?.name || 'Cargando...'}</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground">Contenido para este tema estará disponible pronto.</p></CardContent>
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
                                                const Icon = item.status === 'completed' ? CheckCircle : (item.status === 'active' ? item.icon : Lock);
                                                const isLocked = item.status === 'locked' && !isAdmin;
                                                const isActive = item.status === 'active';
                                                
                                                return (
                                                    <li key={item.key}>
                                                        {!item.subItems ? (
                                                            <div onClick={() => handleTopicSelect(item.key)}
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
                                                            </div>
                                                        ) : (
                                                            <Collapsible defaultOpen={item.subItems.some(si => si.status !== 'locked')} disabled={item.status === 'locked' && !isAdmin}>
                                                                <CollapsibleTrigger className="w-full">
                                                                    <div className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full', item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted', item.subItems.some(si => si.key === selectedTopic) && 'bg-muted text-primary font-semibold')}>
                                                                        <div className="flex items-center gap-3">
                                                                            <Icon className={cn("h-5 w-5", item.status === 'completed' ? 'text-green-500' : '')} />
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
                                                );
                                            })}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2"><span>Progreso</span><span className="font-bold text-foreground">{Math.round(progressValue)}%</span></div>
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
