'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  PenSquare,
  Lock,
  GraduationCap,
  BrainCircuit,
  Hand,
  MessageSquare,
  RefreshCw,
  Flame,
  Trophy,
  CheckCircle,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/language-context';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

type Topic = {
  key: string;
  name: string;
  icon: React.ElementType;
  status: 'locked' | 'active' | 'completed';
};

const ICONS = { locked: Lock, active: BookOpen, completed: CheckCircle };
const progressStorageVersion = "kids_intro3_path_v2";

const initialLearningPathData: Omit<Topic, 'status'>[] = [
    { key: 'past-simple', name: 'Pasado Simple', icon: GraduationCap },
    { key: 'past-simple-memory', name: 'Memory (Pasado Simple)', icon: BrainCircuit },
    { key: 'past-simple-exercise', name: 'Ejercicio Pasado Simple', icon: PenSquare },
    { key: 'irregular-verbs', name: 'Verbos Irregulares', icon: BookOpen },
    { key: 'verbs-memory', name: 'Memory (Verbos)', icon: BrainCircuit },
    { key: 'verbs-exercise', name: 'Ejercicio Verbos Irregulares', icon: PenSquare },
    { key: 'future-simple', name: 'Futuro Simple', icon: Languages },
    { key: 'future-memory', name: 'Memory (Futuro)', icon: BrainCircuit },
    { key: 'future-exercise', name: 'Ejercicio Futuro Simple', icon: PenSquare },
];

interface Student {
    role?: 'admin' | 'student';
    lessonProgress?: any;
    progress?: Record<string, number>;
}

export default function KidsIntro3Page() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedTopic, setSelectedTopic] = useState<string>('past-simple');
  const [isClient, setIsClient] = useState(false);
  const [topicToComplete, setTopicToComplete] = useState<string | null>(null);

  const { user } = useUser();
  const firestore = useFirestore();

  const studentDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'students', user.uid) : null),
    [firestore, user]
  );
  const { data: studentProfile, isLoading: isProfileLoading } = useDoc<Student>(studentDocRef);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    return studentProfile?.role === 'admin' || user.email === 'ednacard87@gmail.com';
  }, [user, studentProfile]);


  const [learningPath, setLearningPath] = useState<Topic[]>(
    initialLearningPathData.map((item, index) => ({
      ...item,
      status: index === 0 ? 'active' : 'locked',
    }))
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || isProfileLoading) return;

    let path = initialLearningPathData.map((item, index) => ({
      ...item,
      status: index === 0 ? 'active' : 'locked',
    }));

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
  }, [isAdmin, isClient, studentProfile, isProfileLoading]);

  const progress = useMemo(() => {
    const completedTopics = learningPath.filter(t => t.status === 'completed').length;
    return Math.round((completedTopics / learningPath.length) * 100);
  }, [learningPath]);

  useEffect(() => {
    if (!isClient || isProfileLoading) return;
    
    if (!isAdmin && studentDocRef && learningPath.length > 0) {
        const statuses = learningPath.reduce((acc, item) => {
            acc[item.key] = item.status;
            return acc;
        }, {} as Record<string, Topic['status']>);
        updateDocumentNonBlocking(studentDocRef, {
            [`lessonProgress.${progressStorageVersion}`]: statuses
        });
    }

    if (studentDocRef) {
        updateDocumentNonBlocking(studentDocRef, {
            'progress.kidsIntro3Progress': progress
        });
    }

    window.dispatchEvent(new CustomEvent('progressUpdated'));
  }, [learningPath, progress, isAdmin, isClient, studentDocRef, isProfileLoading]);
  
  useEffect(() => {
    if (!topicToComplete) return;
    setLearningPath((prevPath) => {
        const newPath = [...prevPath];
        const currentIndex = newPath.findIndex((t) => t.key === topicToComplete);
        
        if (currentIndex !== -1 && newPath[currentIndex].status !== 'completed') {
            newPath[currentIndex].status = 'completed';

            if (currentIndex + 1 < newPath.length && newPath[currentIndex + 1].status === 'locked') {
                newPath[currentIndex + 1].status = 'active';
                toast({
                    title: '¡Siguiente tema desbloqueado!',
                    description: `Ahora puedes continuar con ${newPath[currentIndex + 1].name}`,
                });
            }
        }
        return newPath;
    });
    setTopicToComplete(null);
  }, [topicToComplete, toast]);

  const handleTopicSelect = (topicKey: string) => {
    const topic = learningPath.find((t) => t.key === topicKey);
    if (topic?.status === 'locked' && !isAdmin) {
      return;
    }
    setSelectedTopic(topicKey);

    // This is a placeholder for actual exercise components.
    // For now, we'll just auto-complete it on select to demonstrate progress.
    setTopicToComplete(topicKey);
  };

  const renderContent = () => {
    const topic = learningPath.find((t) => t.key === selectedTopic);
    return (
      <Card className="shadow-soft rounded-lg border-2 border-brand-purple min-h-[500px]">
        <CardHeader>
          <CardTitle>{topic?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Contenido para {topic?.name} vendrá aquí.</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex w-full flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/intro" className="hover:underline text-sm text-muted-foreground">
              {t('kidsPage.backToKidsCourse')}
            </Link>
            <h1 className="text-4xl font-bold dark:text-primary">{t('kidsPage.intro3AdventureTitle')}</h1>
          </div>
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-3">
              <Card className="shadow-soft rounded-lg sticky top-24 border-2 border-brand-purple">
                <CardHeader>
                  <CardTitle>Aventura</CardTitle>
                </CardHeader>
                <CardContent>
                  <nav>
                    <ul className="space-y-1">
                      {learningPath.map((item) => {
                          const isLocked = item.status === 'locked';
                          const isSelected = selectedTopic === item.key;
                          const StatusIcon = ICONS[item.status];
                          return (
                            <li
                              key={item.key}
                              onClick={() => handleTopicSelect(item.key)}
                              className={cn(
                                'flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                isLocked && !isAdmin ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer hover:bg-muted',
                                isSelected && (!isLocked || isAdmin) && 'bg-muted text-primary font-semibold'
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
                          <span>Progreso de la Aventura</span>
                          <span className="font-bold text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-4" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-9">{renderContent()}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
