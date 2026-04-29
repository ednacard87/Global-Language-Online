'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  PenSquare,
  Lock,
  GraduationCap,
  Lightbulb,
  Hand,
  MessageSquare,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { getEnglishIntro2PathData, EnglishIntro2PathItem } from '@/lib/course-data';

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };
const progressStorageVersion = "english_intro2_path_v1";

interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}

export default function EnglishIntro2Page() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [learningPath, setLearningPath] = useState<EnglishIntro2PathItem[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

    const studentDocRef = useMemoFirebase(() => (user ? doc(firestore, 'students', user.uid) : null), [firestore, user]);
    const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);

    const isAdmin = useMemo(() => (user && (studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com')), [user, studentProfile]);
    
    const initialLearningPath = useMemo(() => getEnglishIntro2PathData(t), [t]);

    useEffect(() => {
        if (isUserLoading || isProfileLoading) return;
        
        let path = initialLearningPath.map(item => ({...item}));

        if (isAdmin) {
            path.forEach(topic => { topic.status = 'completed' });
        } else if (studentProfile?.lessonProgress?.[progressStorageVersion]) {
            const savedStatuses = studentProfile.lessonProgress[progressStorageVersion];
            path.forEach(item => {
                if (savedStatuses[item.key]) {
                    item.status = savedStatuses[item.key];
                }
            });
        }
        
        setLearningPath(path);
        const firstActive = path.find(p => p.status === 'active');
        setSelectedTopic(firstActive?.key || path[0].key);

    }, [isAdmin, initialLearningPath, studentProfile, isUserLoading, isProfileLoading, t]);

    const progress = useMemo(() => {
        const completedTopics = learningPath.filter(t => t.status === 'completed').length;
        return learningPath.length > 0 ? Math.round((completedTopics / learningPath.length) * 100) : 0;
    }, [learningPath]);

    useEffect(() => {
        if (learningPath.length > 0 && !isAdmin && studentDocRef) {
            const statuses = learningPath.reduce((acc, item) => ({ ...acc, [item.key]: item.status }), {});
            updateDocumentNonBlocking(studentDocRef, {
                [`lessonProgress.${progressStorageVersion}`]: statuses,
                'progress.intro2Progress': progress
            });
            window.dispatchEvent(new CustomEvent('progressUpdated'));
        }
    }, [learningPath, progress, isAdmin, studentDocRef]);

    useEffect(() => {
        if (!topicToComplete) return;

        let unlockedTopic: EnglishIntro2PathItem | null = null;
        let pathWasUpdated = false;

        const newPath = [...learningPath];
        const currentIndex = newPath.findIndex((t) => t.key === topicToComplete);

        if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
            newPath[currentIndex].status = 'completed';
            pathWasUpdated = true;

            if (currentIndex + 1 < newPath.length && newPath[currentIndex + 1].status === 'locked') {
                newPath[currentIndex + 1].status = 'active';
                unlockedTopic = newPath[currentIndex + 1];
            }
        }
        
        if (pathWasUpdated) {
            setLearningPath(newPath);
            if (unlockedTopic) {
                setSelectedTopic(unlockedTopic.key);
                toast({
                    title: '¡Siguiente tema desbloqueado!',
                    description: `Ahora puedes continuar con ${unlockedTopic.name}`,
                });
            }
        }
        
        setTopicToComplete(null);
    }, [topicToComplete, toast, learningPath]);

    const handleTopicSelect = (topicKey: string) => {
        const topic = learningPath.find((t) => t.key === topicKey);
        if (topic?.status === 'locked' && !isAdmin) {
            toast({ variant: 'destructive', title: 'Contenido Bloqueado' });
            return;
        }
        setSelectedTopic(topicKey);

        const exerciseKeys = ['mixed1', 'mixed2', 'time-exercise', 'countries'];
        if (!exerciseKeys.includes(topicKey)) {
            setTopicToComplete(topicKey);
        }
    };
    
    const renderContent = () => {
        const topic = learningPath.find((t) => t.key === selectedTopic);
        return (
            <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
              <CardHeader>
                <CardTitle>{topic?.name || 'Cargando...'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Contenido para {topic?.name} vendrá aquí.</p>
                 {topic && (topic.key.includes('exercise') || topic.key.includes('mixed')) && (
                    <Button className="mt-4" onClick={() => setTopicToComplete(topic.key)}>Completar Ejercicio (Placeholder)</Button>
                )}
              </CardContent>
            </Card>
        );
    };

    return (
        <div className="flex w-full flex-col ingles-dashboard-bg min-h-screen">
          <DashboardHeader />
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <Link href={`/intro`} className="hover:underline text-sm text-muted-foreground">
                    {t('englishIntro.title')}
                </Link>
                <h1 className="text-4xl font-bold dark:text-primary">{t('englishIntro.intro2')}</h1>
              </div>
               <div className="grid gap-8 md:grid-cols-12">
                <div className="md:col-span-9">{renderContent()}</div>
                <div className="md:col-span-3">
                  <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                    <CardHeader><CardTitle>Ruta de Aprendizaje</CardTitle></CardHeader>
                    <CardContent>
                      <nav>
                        <ul className="space-y-1">
                          {learningPath.map((item, index) => {
                              const StatusIcon = ICONS[item.status];
                              return (
                                <li
                                  key={item.key}
                                  onClick={() => handleTopicSelect(item.key)}
                                  className={cn(
                                    'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                    item.status === 'locked' && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                    selectedTopic === item.key && 'bg-muted text-primary font-semibold'
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <StatusIcon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                  </div>
                                </li>
                              )
                          })}
                        </ul>
                      </nav>
                      <div className="mt-6 pt-6 border-t">
                          <div className="flex justify-between items-center text-sm font-medium text-muted-foreground mb-2">
                              <span>Progreso</span>
                              <span className="font-bold text-foreground">{progress}%</span>
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
