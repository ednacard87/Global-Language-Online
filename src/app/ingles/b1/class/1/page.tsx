'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
    BookOpen, 
    PenSquare, 
    Lock, 
    GraduationCap, 
    CheckCircle, 
    Loader2, 
    ArrowRight,
    Sparkles,
    BookText,
    Gamepad2,
    Pencil,
    MessageSquare,
    Info,
    ListChecks
} from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'locked';
};

const progressStorageVersion = 'progress_b1_eng_u1_c1_v2_full_path';
const mainProgressKey = 'progress_b1_eng_unit_1_class_1';

export default function EngB1Class1Page() {
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
        { key: 'vocabulary_phrasal', name: 'Vocabulary (Phrasal Verbs)', icon: BookOpen, status: 'active' },
        { key: 'ex_phrasal', name: 'Exercise Phrasal Verbs', icon: PenSquare, status: 'locked' },
        { key: 'grammar_some', name: 'Grammar (Some)', icon: GraduationCap, status: 'locked' },
        { key: 'ex_some', name: 'Exercise With Some', icon: PenSquare, status: 'locked' },
        { key: 'grammar_any', name: 'Grammar (Any)', icon: GraduationCap, status: 'locked' },
        { key: 'ex_any', name: 'Exercise With Any', icon: PenSquare, status: 'locked' },
        { key: 'grammar_2', name: 'Grammar 2', icon: GraduationCap, status: 'locked' },
        { key: 'ex_mix', name: 'Exercise Mix', icon: PenSquare, status: 'locked' },
        { key: 'complete_1', name: 'Complete 1', icon: ListChecks, status: 'locked' },
        { key: 'grammar_indefinite', name: 'Grammar 3 (Pronombres indefinidos)', icon: GraduationCap, status: 'locked' },
        { key: 'rules', name: 'RULES', icon: Info, status: 'locked' },
        { key: 'complete_2', name: 'Complete 2', icon: ListChecks, status: 'locked' },
        { key: 'complete_3', name: 'Complete 3', icon: ListChecks, status: 'locked' },
        { key: 'complete_4', name: 'Complete 4', icon: ListChecks, status: 'locked' },
        { key: 'ex_mix_2', name: 'Exercise Mix 2', icon: PenSquare, status: 'locked' },
        { key: 'ex_mix_3', name: 'Exercise Mix 3', icon: PenSquare, status: 'locked' },
        { key: 'create_1', name: 'Create 1', icon: Pencil, status: 'locked' },
        { key: 'ex_mix_4', name: 'Exercise Mix 4', icon: PenSquare, status: 'locked' },
    ], []);
    
    useEffect(() => {
        if (isProfileLoading || isUserLoading || !initialLearningPath.length) return;

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
            setSelectedTopic(savedSelectedTopic || firstActive?.key || 'vocabulary_phrasal');
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
            [`progress.${mainProgressKey}`]: Math.round(progressValue)
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

        const autoViewTopics = ['grammar_some', 'grammar_any', 'grammar_2', 'grammar_indefinite', 'rules'];
        if (autoViewTopics.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        if (!topic) return null;

        const isGrammar = topic.key.startsWith('grammar') || topic.key === 'rules';

        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <topic.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>{topic.name}</CardTitle>
                            <CardDescription>
                                {isGrammar ? 'Estudia la lección de gramática.' : 'Completa la actividad para avanzar.'}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="min-h-[300px] flex flex-col justify-center items-center text-center space-y-4">
                    <p className="text-lg text-muted-foreground">
                        {isGrammar ? 'El contenido gramatical de esta sección estará disponible pronto.' : 'Aquí aparecerá el ejercicio interactivo.'}
                    </p>
                    <div className="p-8 bg-muted/30 rounded-full">
                        <topic.icon className="h-24 w-24 text-primary/20" />
                    </div>
                </CardContent>
                <CardFooter className="justify-center border-t pt-6">
                    <Button onClick={() => handleTopicComplete(topic.key)} size="lg" className="px-12 font-bold">
                        {isGrammar ? 'He terminado de leer' : 'Completar actividad'}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </CardFooter>
            </Card>
        );
    };

    if (isUserLoading || isProfileLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
    }

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 text-left">
                        <Link href="/ingles/b1" className="hover:underline text-sm text-white/80">Volver al curso B1</Link>
                        <h1 className="text-4xl font-bold text-white dark:text-primary [text-shadow:1px_1px_2px_rgba(0,0,0,0.5)]">Class 1 (B1)</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3 text-left">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple bg-card/95 backdrop-blur-sm">
                                <CardHeader className="pb-4"><CardTitle className="text-lg">Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
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
                                                                <span className="truncate max-w-[150px]">{item.name}</span>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </nav>
                                    </div>
                                    <div className="p-6 border-t">
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
