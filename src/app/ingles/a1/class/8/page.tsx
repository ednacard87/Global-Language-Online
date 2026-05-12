'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Mic, Loader2, RefreshCw, Flame, Trophy, Gamepad2 } from 'lucide-react';
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

const progressStorageVersion = 'progress_a1_eng_unit_2_class_8_v2_fixed';
const mainProgressKey = 'progress_a1_eng_unit_2_class_8';

const vocabularyData = [
    { spanish: 'SIEMPRE', english: ['ALWAYS'] },
    { spanish: 'NUNCA', english: ['NEVER'] },
    { spanish: 'A VECES', english: ['SOMETIMES'] },
    { spanish: 'A MENUDO', english: ['OFTEN'] },
    { spanish: 'USUALMENTE', english: ['USUALLY'] },
    { spanish: 'TAL VEZ', english: ['MAYBE', 'PERHAPS'] },
    { spanish: 'DE NUEVO', english: ['AGAIN'] },
    { spanish: 'TAMBIÉN', english: ['ALSO', 'TOO'] },
    { spanish: 'TODAVÍA', english: ['STILL'] },
    { spanish: 'YA', english: ['ALREADY'] },
];

const DictationExercise = ({ title, description, onComplete }: { title: string, description: string, onComplete: () => void }) => {
    const [inputValue, setInputValue] = useState('');
    return (
        <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center gap-4">
                    <Mic className="h-12 w-12 text-primary animate-pulse" />
                    <p className="text-sm text-center text-muted-foreground">Escucha el audio de tu profesor y escribe la frase aquí.</p>
                </div>
                <Input 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    placeholder="Escribe lo que escuchas..." 
                    className="text-lg h-12"
                />
            </CardContent>
            <CardFooter>
                <Button onClick={onComplete} disabled={!inputValue.trim()}>Marcar como Completado</Button>
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
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);
    
    const progressValue = useMemo(() => {
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
                [`progress.${mainProgressKey}`]: Math.round(progressValue)
            });
        }
        if (progressValue >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progressValue, studentDocRef, isProfileLoading, isUserLoading]);

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

        const autoViewTopics = ['vocabulary'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);

        switch (selectedTopic) {
            case 'vocabulary':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Vocabulary (Basic Words)</CardTitle>
                            <CardDescription>Estudia estas palabras esenciales de frecuencia y conexión.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-lg">
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Español</div>
                                <div className="font-bold p-3 bg-muted rounded-lg text-left">Inglés</div>
                                {vocabularyData.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="p-3 bg-card border rounded-lg flex items-center">{item.spanish}</div>
                                        <div className="p-3 bg-card border rounded-lg flex items-center font-bold text-primary">{item.english[0]}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center pt-6 border-t">
                            <Button onClick={() => handleTopicComplete('vocabulary')}>Entendido y Avanzar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'dictation1':
                return <DictationExercise title="Dictation 1" description="Práctica de escucha activa 1" onComplete={() => handleTopicComplete('dictation1')} />;
            case 'dictation2':
                return <DictationExercise title="Dictation 2" description="Práctica de escucha activa 2" onComplete={() => handleTopicComplete('dictation2')} />;
            case 'ex1':
                return <SimpleTranslationExercise exerciseKey="c8_ex1" course="a1" title="Exercise 1" onComplete={() => handleTopicComplete('ex1')} />;
            case 'ex2':
                return <SimpleTranslationExercise exerciseKey="c8_ex2" course="a1" title="Exercise 2" onComplete={() => handleTopicComplete('ex2')} />;
            case 'ex3':
                return <SimpleTranslationExercise exerciseKey="c8_ex3" course="a1" title="Exercise 3" onComplete={() => handleTopicComplete('ex3')} />;
            case 'ex4':
                return <SimpleTranslationExercise exerciseKey="c8_ex4" course="a1" title="Exercise 4" onComplete={() => handleTopicComplete('ex4')} />;
            case 'ex5':
                return <SimpleTranslationExercise exerciseKey="c8_ex5" course="a1" title="Exercise 5" onComplete={() => handleTopicComplete('ex5')} />;
            case 'vocab_game':
                return <AdjectivesMemoryGame data={vocabularyData} onComplete={() => handleTopicComplete('vocab_game')} />;
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