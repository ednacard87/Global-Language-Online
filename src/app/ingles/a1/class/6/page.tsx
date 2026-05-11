'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, Info, Gamepad2, BookText, Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';

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

const progressStorageVersion = 'progress_a1_eng_unit_2_class_6_v1';
const mainProgressKey = 'progress_a1_eng_unit_2_class_6';

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

    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulary', name: 'Vocabulary (Basic Adjectives)', icon: BookOpen, status: 'active' },
        { key: 'grammar', name: 'Grammar', icon: GraduationCap, status: 'locked' },
        { key: 'ex1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ex2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ex3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'note', name: 'Nota', icon: Info, status: 'locked' },
        { key: 'ex4', name: 'Ejercicio 4', icon: PenSquare, status: 'locked' },
        { key: 'text', name: 'Texto', icon: BookText, status: 'locked' },
        { key: 'vocab_game', name: 'Vocabulario (Juego)', icon: Gamepad2, status: 'locked' },
        { key: 'ex5', name: 'Ejercicio 5', icon: PenSquare, status: 'locked' },
        { key: 'ex6', name: 'Ejercicio 6', icon: PenSquare, status: 'locked' },
        { key: 'ex7', name: 'Ejercicio 7', icon: PenSquare, status: 'locked' },
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
            updateDocumentNonBlocking(studentDocRef, { [`lessonProgress.${progressStorageVersion}`]: statusesToSave });
            updateDocumentNonBlocking(studentDocRef, { [`progress.${mainProgressKey}`]: Math.round(progress) });
        }
        if (progress >= 100) {
          window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progress, studentDocRef, isProfileLoading, isUserLoading]);

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

    const handleTopicComplete = (completedKey: string) => {
        setTopicToComplete(completedKey);
    };

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find(t => t.key === topicKey);
        
        if (!isAdmin && topic?.status === 'locked') {
            toast({ variant: "destructive", title: "Contenido Bloqueado" });
            return;
        }
        setSelectedTopic(topicKey);

        // For info-only topics, auto-complete on click
        const infoTopics = ['vocabulary', 'grammar', 'note', 'text'];
        if (infoTopics.includes(topicKey)) {
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
                            <CardTitle>Vocabulary (Basic Adjectives)</CardTitle>
                            <CardDescription>Estudia los adjetivos básicos en inglés.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" defaultValue={['adj1']} className="w-full">
                                <AccordionItem value="adj1">
                                    <AccordionTrigger>Adjetivos de Apariencia</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 gap-4 text-lg">
                                            <div className="p-3 bg-muted rounded-lg font-bold">Tall</div><div className="p-3 border rounded-lg">Alto</div>
                                            <div className="p-3 bg-muted rounded-lg font-bold">Short</div><div className="p-3 border rounded-lg">Bajo / Corto</div>
                                            <div className="p-3 bg-muted rounded-lg font-bold">Big</div><div className="p-3 border rounded-lg">Grande</div>
                                            <div className="p-3 bg-muted rounded-lg font-bold">Small</div><div className="p-3 border rounded-lg">Pequeño</div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('vocabulary')}>Entendido</Button>
                        </CardFooter>
                    </Card>
                );
            case 'grammar':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Grammar</CardTitle>
                            <CardDescription>Reglas gramaticales de la clase.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">El contenido gramatical se mostrará aquí.</p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleTopicComplete('grammar')}>Continuar</Button>
                        </CardFooter>
                    </Card>
                );
            case 'note':
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple">
                        <CardHeader>
                            <CardTitle>Nota</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">Información importante a recordar.</p>
                        </CardContent>
                    </Card>
                );
            default:
                if (selectedTopic.startsWith('ex')) {
                    return (
                        <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[400px]">
                            <CardHeader>
                                <CardTitle>{topic?.name}</CardTitle>
                                <CardDescription>Completa el ejercicio para avanzar.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center">
                                <PenSquare className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
                                <p className="text-muted-foreground">Contenido del ejercicio interactivo próximamente.</p>
                            </CardContent>
                            <CardFooter className="justify-center">
                                <Button onClick={() => handleTopicComplete(selectedTopic)}>Simular Completado</Button>
                            </CardFooter>
                        </Card>
                    );
                }
                return (
                    <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
                        <CardHeader>
                            <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Contenido para este tema estará disponible pronto.</p>
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
                        <Link href="/ingles/a1/unit/2" className="hover:underline text-sm text-muted-foreground">Volver a la unidad 2</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Clase 6</h1>
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
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                                                            isLocked ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted',
                                                            selectedTopic === item.key && 'bg-muted text-primary font-semibold'
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
