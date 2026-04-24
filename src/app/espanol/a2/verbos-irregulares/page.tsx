'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, PenSquare, Lock, GraduationCap, CheckCircle } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const progressStorageKey = 'progress_espanol_a2_verbos_irreg_v1';
const mainProgressKey = 'progress_a2_es_2';

export default function VerbosIrregularesPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<{ role?: string; lessonProgress?: any; progress?: any }>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo((): Topic[] => [
        { key: 'vocabulario', name: 'Vocabulario (Irregulares)', icon: BookOpen, status: 'active' },
        { key: 'gramatica', name: 'Gramatica', icon: GraduationCap, status: 'locked' },
        { key: 'ejercicios1', name: 'Ejercicios 1', icon: PenSquare, status: 'locked' },
        { key: 'ejercicios2', name: 'Ejercicios 2', icon: PenSquare, status: 'locked' },
        { key: 'lectura', name: 'Lectura', icon: BookOpen, status: 'locked' },
        { key: 'ejercicios3', name: 'Ejercicios 3', icon: PenSquare, status: 'locked' },
        { key: 'verbos_final', name: 'Verbos Final', icon: BookOpen, status: 'locked' },
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

    const progress = useMemo(() => {
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
                [`progress.${mainProgressKey}`]: progress
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progress, isAdmin, studentDocRef, isProfileLoading, isUserLoading, mainProgressKey]);

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
                } else if (newPath.every(item => item.status === 'completed')) {
                    toast({ title: "¡Felicidades!", description: "Has completado todos los temas de esta lección." });
                }
            }
            return newPath;
        });
        setTopicToComplete(null);
    }, [topicToComplete, toast]);

    const handleTopicSelect = (key: string) => {
        const topic = learningPath.find(t => t.key === key);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: 'Tema Bloqueado' });
            return;
        }
        setSelectedTopic(key);
        if (!key.startsWith('ejercicio')) {
          setTopicToComplete(key);
        }
    };

    const renderContent = () => {
        const topic = learningPath.find(t => t.key === selectedTopic);
        return (
            <Card>
                <CardHeader><CardTitle>{topic?.name}</CardTitle></CardHeader>
                <CardContent>
                    <p>Contenido para {topic?.name} estará disponible pronto.</p>
                     {selectedTopic.startsWith('ejercicio') && (
                      <Button className="mt-4" onClick={() => setTopicToComplete(selectedTopic)}>Completar Ejercicio</Button>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="flex w-full flex-col min-h-screen espanol-dashboard-bg">
            <DashboardHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <Link href="/a2" className="hover:underline text-sm text-muted-foreground">Volver a A2 Español</Link>
                        <h1 className="text-4xl font-bold dark:text-primary">Verbos Irregulares</h1>
                    </div>
                    <div className="grid gap-8 md:grid-cols-12">
                        <div className="md:col-span-4">
                            <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
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
                                                    {item.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-500"/> : <item.icon className="h-5 w-5" />}
                                                    <span>{item.name}</span>
                                                    {item.status === 'locked' && !isAdmin && <Lock className="h-4 w-4 text-yellow-500 ml-auto" />}
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                     <div className="mt-6 pt-6 border-t">
                                        <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                                            <span>Progreso</span><span className="font-bold text-foreground">{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-8">{renderContent()}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
