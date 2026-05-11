'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle, ChevronDown, Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
  subItems?: { key: string; name: string; status: 'locked' | 'active' | 'completed' }[];
};

const ICONS = {
    locked: Lock,
    active: BookOpen,
    completed: CheckCircle,
};

const progressStorageKey = 'progress_a1_eng_review_1_v1';
const mainProgressKey = 'progress_a1_eng_review_1';

export default function Repaso1Page() {
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
    const [selectedTopic, setSelectedTopic] = useState<string>('ex1');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    const initialLearningPath = useMemo((): Topic[] => [
        {
            key: 'ejercicios',
            name: 'Ejercicios',
            icon: PenSquare,
            status: 'active',
            subItems: [
                { key: 'ex1', name: '1', status: 'active' },
                { key: 'ex2', name: '2', status: 'locked' },
                { key: 'ex3', name: '3', status: 'locked' },
            ],
        },
    ], []);

    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        const newPath = initialLearningPath.map(topic => ({
            ...topic,
            subItems: topic.subItems ? topic.subItems.map(sub => ({ ...sub })) : undefined,
        }));
        
        if (isAdmin) {
            newPath.forEach(item => {
                item.status = 'completed';
                if (item.subItems) item.subItems.forEach(sub => sub.status = 'completed');
            });
        } else if (studentProfile?.lessonProgress?.[progressStorageKey]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageKey];
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
        const firstActive = newPath.flatMap(p => p.subItems || []).find(sp => sp?.status === 'active');
        if (firstActive) setSelectedTopic(firstActive.key);
    }, [isAdmin, initialLearningPath, studentProfile, isProfileLoading, isUserLoading]);

    const progress = useMemo(() => {
        let total = 0;
        let completed = 0;
        learningPath.forEach(t => {
            if (t.subItems) {
                total += t.subItems.length;
                completed += t.subItems.filter(s => s.status === 'completed').length;
            } else {
                total++;
                if (t.status === 'completed') completed++;
            }
        });
        return total > 0 ? (completed / total) * 100 : 0;
    }, [learningPath]);

    useEffect(() => {
        if (isProfileLoading || isUserLoading) return;
        if (!isAdmin && studentDocRef && learningPath.length > 0) {
            const statusesToSave: Record<string, any> = {};
            learningPath.forEach(item => {
                statusesToSave[item.key] = item.status;
                if (item.subItems) {
                    if (!statusesToSave.subItems) statusesToSave.subItems = {};
                    statusesToSave.subItems[item.key] = {};
                    item.subItems.forEach(sub => { statusesToSave.subItems[item.key][sub.key] = sub.status; });
                }
            });
            updateDocumentNonBlocking(studentDocRef, { 
                [`lessonProgress.${progressStorageKey}`]: statusesToSave,
                [`progress.${mainProgressKey}`]: Math.round(progress)
            });
        }
        if (progress >= 100) {
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, isAdmin, progress, studentDocRef, isProfileLoading, isUserLoading]);

    useEffect(() => {
        if (!topicToComplete) return;
        setLearningPath(currentPath => {
            const newPath = currentPath.map(t => ({
                ...t,
                subItems: t.subItems ? t.subItems.map(s => ({ ...s })) : undefined,
            }));
            let nextTopic: string | null = null;
            let found = false;
            for (let i = 0; i < newPath.length && !found; i++) {
                const topic = newPath[i];
                if (topic.subItems) {
                    const subIndex = topic.subItems.findIndex(s => s.key === topicToComplete);
                    if (subIndex !== -1) {
                        newPath[i].subItems![subIndex].status = 'completed';
                        const nextSub = newPath[i].subItems![subIndex + 1];
                        if (nextSub && nextSub.status === 'locked') {
                            nextSub.status = 'active';
                            nextTopic = nextSub.key;
                        } else if (newPath[i].subItems!.every(s => s.status === 'completed')) {
                            newPath[i].status = 'completed';
                        }
                        found = true;
                    }
                }
            }
            if (nextTopic) setSelectedTopic(nextTopic);
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete]);

    const handleTopicSelect = (key: string) => {
        const item = learningPath.flatMap(p => p.subItems || []).find(s => s.key === key) || learningPath.find(p => p.key === key);
        if (!isAdmin && item?.status === 'locked') return;
        setSelectedTopic(key);
    };

    const handleTopicComplete = (key: string) => {
        setTopicToComplete(key);
    };

    const renderContent = () => {
        return (
            <Card className="min-h-[400px]">
                <CardHeader>
                    <CardTitle>Ejercicio {selectedTopic.replace('ex', '')}</CardTitle>
                    <CardDescription>Contenido del ejercicio próximamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Aquí aparecerá el contenido interactivo para el repaso.</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => handleTopicComplete(selectedTopic)}>Completar Ejercicio</Button>
                </CardFooter>
            </Card>
        );
    };

    if (isUserLoading || isProfileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="flex w-full flex-col min-h-screen ingles-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/ingles/a1" className="hover:underline text-sm text-muted-foreground">Volver al curso A1</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Repaso 1</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-9">{renderContent()}</div>
                        <div className="md:col-span-3">
                            <Card className="shadow-soft sticky top-24 border-2 border-brand-purple">
                                <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                                <CardContent>
                                    <nav>
                                        <ul className="space-y-1">
                                            {learningPath.map((item) => (
                                                <li key={item.key}>
                                                    <Collapsible defaultOpen={true}>
                                                        <CollapsibleTrigger className="w-full">
                                                            <div className="flex items-center gap-3 px-3 py-2 text-sm font-bold text-primary">
                                                                <item.icon className="h-5 w-5" />
                                                                <span>{item.name}</span>
                                                                <ChevronDown className="ml-auto h-4 w-4" />
                                                            </div>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <ul className="pl-6 pt-1 space-y-1">
                                                                {item.subItems?.map((sub) => {
                                                                    const Icon = ICONS[sub.status];
                                                                    const isLocked = sub.status === 'locked' && !isAdmin;
                                                                    return (
                                                                        <li key={sub.key} onClick={() => handleTopicSelect(sub.key)}
                                                                            className={cn('flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer', 
                                                                            isLocked ? 'opacity-50 cursor-not-allowed text-muted-foreground/50' : 'hover:bg-muted',
                                                                            selectedTopic === sub.key && 'bg-muted text-primary font-semibold')}>
                                                                            <div className="flex items-center gap-3">
                                                                                <Icon className={cn("h-4 w-4", sub.status === 'completed' && "text-green-500")} />
                                                                                <span>{sub.name}</span>
                                                                            </div>
                                                                            {isLocked && <Lock className="h-4 w-4 text-yellow-500" />}
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                            <span>Progreso</span><span className="font-bold text-foreground">{Math.round(progress)}%</span>
                                        </div>
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
