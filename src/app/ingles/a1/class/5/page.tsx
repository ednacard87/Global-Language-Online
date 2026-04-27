'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, CheckCircle, Info } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const progressStorageVersion = 'progress_a1_eng_unit_1_class_5_v1';
const mainProgressKey = 'progress_a1_eng_unit_1_class_5';

export default function EngA1Class5Page() {
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
        { key: 'vocabulary', name: 'Vocabulario', icon: BookOpen, status: 'active' },
        { key: 'nota-importante', name: 'Nota Importante', icon: Info, status: 'locked' },
        { key: 'ejercicio-1', name: 'Ejercicio 1', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-2', name: 'Ejercicio 2', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-3', name: 'Ejercicio 3', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-vocabulario', name: 'Ejercicio Vocabulario', icon: PenSquare, status: 'locked' },
        { key: 'ejercicio-4', name: 'Ejercicio 4', icon: PenSquare, status: 'locked' },
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

        const exerciseKeys = ['ejercicio-1', 'ejercicio-2', 'ejercicio-3', 'ejercicio-vocabulario', 'ejercicio-4'];
        if (!exerciseKeys.includes(topicKey)) {
            handleTopicComplete(topicKey);
        }
    };
    
    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
              <CardHeader>
                <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
                <CardDescription>Contenido para este tema estará disponible pronto.</CardDescription>
              </CardHeader>
              <CardContent>
                {topic && topic.key.startsWith('ejercicio') && (
                    <Button onClick={() => handleTopicComplete(topic.key)}>
                        Completar Ejercicio (placeholder)
                    </Button>
                )}
              </CardContent>
            </Card>
        );
    };

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/ingles/a1/unit/1" className="hover:underline text-sm text-muted-foreground">Volver a la unidad 1</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Clase 5</h1>
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
                                                return (
                                                    <li key={item.key} onClick={() => handleTopicSelect(item.key)}
                                                        className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors', item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted', selectedTopic === item.key && 'bg-muted text-primary font-semibold')}>
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