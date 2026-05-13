'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Info, 
    Gamepad2, 
    MessageSquare, 
    Pencil, 
    Loader2, 
    ChevronDown, 
    CloudSun,
    Home
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SimpleTranslationExercise } from '@/components/dashboard/simple-translation-exercise';
import { LargeTextTranslation } from '@/components/dashboard/large-text-translation';
import { VocabularyMatchingGame } from '@/components/dashboard/vocabulary-matching-game';
import { CreativeWritingExercise } from '@/components/dashboard/creative-writing-exercise';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageVersion = 'progress_a1_eng_u2_c9_v1';
const mainProgressKey = 'progress_a1_eng_unit_2_class_9';

const weatherHouseVocab = [
    { spanish: 'Soleado', english: ['Sunny'] },
    { spanish: 'Lluvioso', english: ['Rainy'] },
    { spanish: 'Nublado', english: ['Cloudy'] },
    { spanish: 'Ventoso', english: ['Windy'] },
    { spanish: 'Frío', english: ['Cold'] },
    { spanish: 'Caliente', english: ['Hot'] },
    { spanish: 'Sala', english: ['Living room'] },
    { spanish: 'Cocina', english: ['Kitchen'] },
    { spanish: 'Habitación', english: ['Bedroom'] },
    { spanish: 'Baño', english: ['Bathroom'] },
    { spanish: 'Jardín', english: ['Garden'] },
    { spanish: 'Garaje', english: ['Garage'] },
];

export default function EngA1Class9Page() {
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

    // Vocab States
    const [vocabAnswers, setVocabAnswers] = useState<string[]>(Array(weatherHouseVocab.length).fill(''));
    const [vocabValidation, setVocabValidation] = useState<('correct' | 'incorrect' | 'unchecked')[]>(Array(weatherHouseVocab.length).fill('unchecked'));

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Weather and house)', icon: Home, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Exercise 1', icon: PenSquare, status: 'locked' },
        { key: 'grammar2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex2', name: 'Exercise 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Exercise 3', icon: PenSquare, status: 'locked' },
        { key: 'dialogue1', name: 'Dialogue 1', icon: MessageSquare, status: 'locked' },
        { key: 'ex4', name: 'Exercise 4', icon: PenSquare, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulary (Game)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Exercise 5', icon: PenSquare, status: 'locked' },
        { key: 'writing1', name: 'Writing 1', icon: Pencil, status: 'locked' },
        { key: 'dialogue2', name: 'Dialogue 2', icon: MessageSquare, status: 'locked' },
    ], []);
    
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

        const autoViewTopics = ['grammar', 'grammar2'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const handleVocabInputChange = (index: number, value: string) => {
        const newAnswers = [...vocabAnswers];
        newAnswers[index] = value;
        setVocabAnswers(newAnswers);
        const newValidation = [...vocabValidation];
        newValidation[index] = 'unchecked';
        setVocabValidation(newValidation);
    };

    const handleCheckVocab = () => {
        let atLeastOneCorrect = false;
        const newValidation = weatherHouseVocab.map((item, index) => {
            const userAnswer = vocabAnswers[index]?.trim().toLowerCase();
            const isCorrect = item.english.some(e => e.toLowerCase() === userAnswer);
            if (isCorrect) atLeastOneCorrect = true;
            return isCorrect ? 'correct' : 'incorrect';
        });
        setVocabValidation(newValidation as ('correct' | 'incorrect' | 'unchecked')[]);

        if (atLeastOneCorrect) {
            toast({ title: "¡Buen trabajo!", description: "Has comenzado con éxito." });
            handleTopicComplete('vocabulary');
        } else {
            toast({ variant: "destructive", title: "Sigue intentando", description: "Completa al menos una traducción para continuar." });
        }
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Weather and house)</CardTitle>
                            <CardDescription>Escribe la traducción al inglés para cada palabra.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg">Español</div>
                                <div className="font-bold p-3 bg-muted rounded-lg">Inglés</div>
                                {weatherHouseVocab.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">
                                            <Input
                                                value={vocabAnswers[index] || ''}
                                                onChange={e => handleVocabInputChange(index, e.target.value)}
                                                className={cn(
                                                    vocabValidation[index] === 'correct' && "border-green-500 bg-green-50 dark:bg-green-900/10",
                                                    vocabValidation[index] === 'incorrect' && "border-destructive bg-destructive/5"
                                                )}
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
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Grammar: Weather and Present Continuous</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-lg">
                            <div className="bg-primary/5 p-6 rounded-xl border-l-4 border-primary">
                                <h3 className="text-xl font-bold mb-2">Asking about the weather</h3>
                                <p className="text-muted-foreground">¿Cómo está el clima?</p>
                                <div className="mt-4 p-4 bg-muted rounded-lg font-mono text-base border">
                                    <p className="text-primary font-bold">How is the weather today?</p>
                                    <p className="text-foreground mt-2">It is sunny and hot.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button onClick={() => handleTopicComplete('grammar')}>Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar2':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Grammar 2: Location and Prepositions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-lg">
                            <div className="bg-brand-purple/5 p-6 rounded-xl border-l-4 border-brand-purple">
                                <h3 className="text-xl font-bold mb-2">Where is it?</h3>
                                <p className="text-muted-foreground">Ubicar objetos en la casa.</p>
                                <div className="mt-4 p-4 bg-muted rounded-lg font-mono text-base border">
                                    <p className="text-brand-purple font-bold">Where are you?</p>
                                    <p className="text-foreground mt-2">I am in the kitchen.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center">
                            <Button onClick={() => handleTopicComplete('grammar2')}>Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'ex1':
                return <SimpleTranslationExercise exerciseKey="c9_ex1" course="a1" title="Exercise 1" onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2':
                return <SimpleTranslationExercise exerciseKey="c9_ex2" course="a1" title="Exercise 2" onComplete={() => handleTopicComplete('ex2')} />;
            case 'ex3':
                return <SimpleTranslationExercise exerciseKey="c9_ex3" course="a1" title="Exercise 3" onComplete={() => handleTopicComplete('ex3')} />;
            case 'ex4':
                return <SimpleTranslationExercise exerciseKey="c9_ex4" course="a1" title="Exercise 4" onComplete={() => handleTopicComplete('ex4')} />;
            case 'ex5':
                return <SimpleTranslationExercise exerciseKey="c9_ex5" course="a1" title="Exercise 5" onComplete={() => handleTopicComplete('ex5')} />;
            case 'dialogue1':
                return (
                    <LargeTextTranslation 
                        title="Dialogue 1" 
                        phrases={[
                            { spanish: "Hola, ¿cómo estás?", answers: ["hello, how are you?", "hi, how are you?"] },
                            { spanish: "¿Cómo está el clima afuera?", answers: ["how is the weather outside?"] },
                            { spanish: "Está muy soleado y hace calor.", answers: ["it is very sunny and hot", "it's very sunny and hot"] }
                        ]} 
                        onComplete={() => handleTopicComplete('dialogue1')} 
                    />
                );
            case 'dialogue2':
                return (
                    <LargeTextTranslation 
                        title="Dialogue 2" 
                        phrases={[
                            { spanish: "¿Dónde está tu gato?", answers: ["where is your cat?", "where's your cat?"] },
                            { spanish: "Él está en el jardín.", answers: ["he is in the garden", "he's in the garden"] },
                            { spanish: "Es un jardín muy grande.", answers: ["it is a very big garden", "it's a very big garden"] }
                        ]} 
                        onComplete={() => handleTopicComplete('dialogue2')} 
                    />
                );
            case 'vocab_game':
                return <VocabularyMatchingGame data={weatherHouseVocab} title="Matching Game: Weather & House" onComplete={() => handleTopicComplete('vocab_game')} />;
            case 'writing1':
                return (
                    <CreativeWritingExercise 
                        title="Writing 1" 
                        description="Describe your house and today's weather."
                        prompts={[{ id: 'writing-c9', question: 'My House and the Weather', placeholder: 'In my house, there is a living room...' }]}
                        onComplete={() => handleTopicComplete('writing1')}
                        studentDocRef={studentDocRef}
                        initialData={studentProfile?.lessonProgress?.[progressStorageVersion]?.writing1 || {}}
                        savePath={`lessonProgress.${progressStorageVersion}.writing1`}
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
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Clase 9</h1>
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